/**
 * POST /api/interview/answer
 * Body: { sessionId: string, questionId: string, answer: string, useDemoAnswer?: boolean }
 *
 * THE WOW MOMENT:
 *   1. Evaluate the candidate's answer (AI-assisted, schema-validated)
 *   2. Update competency state deterministically
 *   3. Identify weakness / detected deeper gap
 *   4. Pick the next competency + question (may be AI-generated, with fallback)
 *
 * The next question MUST change based on the previous answer.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyEvaluation, QUESTION_BANK } from "@/lib/engine";
import { evaluateAnswer, generateQuestion } from "@/lib/ai";
import { loadSession, persistSession } from "@/lib/session";
import { DEMO_ANSWERS } from "@/lib/demo";
import type { AnswerEvaluation, InterviewQuestion, InterviewState } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 45;

function sanitize(s: string, max = 10_000): string {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = String(body.sessionId ?? "");
    const questionId = String(body.questionId ?? "");
    let answer = sanitize(String(body.answer ?? ""));
    const useDemoAnswer = Boolean(body.useDemoAnswer);

    if (!sessionId) return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });

    const payload = await loadSession(sessionId);
    if (!payload) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    if (!payload.interview) return NextResponse.json({ error: "Interview not started." }, { status: 400 });

    const state: InterviewState = payload.interview;
    const currentQ = state.questions.find((q) => q.id === questionId);
    if (!currentQ) return NextResponse.json({ error: "Question not found." }, { status: 404 });

    // Demo answer shortcut (for deterministic demo path):
    if (useDemoAnswer && answer.length === 0) {
      // For System Design Q1, use the limited scalability answer to trigger the WOW moment
      if (currentQ.competency === "System Design") {
        answer = DEMO_ANSWERS.systemDesignLimited;
      } else if (currentQ.competency === "Scalability") {
        answer = DEMO_ANSWERS.scalabilityStrong;
      } else {
        answer = "I've used this in a project but I'm still building depth. I'd describe the main components and tradeoffs at a high level.";
      }
    }

    if (!answer || answer.length < 10) {
      return NextResponse.json({ error: "Please write a fuller answer (at least a sentence or two)." }, { status: 400 });
    }

    // 1. Build deterministic fallback evaluation first (always available)
    const fallbackEval: AnswerEvaluation = deterministicFallbackEvaluation(currentQ, answer);

    // 2. Ask AI to evaluate (with validation)
    const { evaluation, usedFallback: evalFallback } = await evaluateAnswer(currentQ, answer, fallbackEval);

    // 3. Record answer + evaluation, update competency state, decide next competency deterministically
    const stateWithAnswer: InterviewState = {
      ...state,
      answers: [...state.answers, { questionId, text: answer }],
    };
    const nextState = applyEvaluation(stateWithAnswer, evaluation);

    // 4. If a next question was scheduled AND the engine created one from the bank,
    //    optionally ask the AI to generate a fresher question for that competency.
    //    (Always keep the deterministic fallback as backup.)
    if (nextState.status === "asking" && nextState.questions.length > state.questions.length) {
      const lastAdded = nextState.questions[nextState.questions.length - 1];
      const previousContext = state.questions
        .map((q, i) => ({
          question: q.text,
          answer: state.answers[i]?.text ?? "",
          evaluation: state.evaluations[i]
            ? `overall=${Math.round(state.evaluations[i].overall * 100)}%, gap=${state.evaluations[i].detectedGap ?? "none"}`
            : "",
        }));
      const bank = QUESTION_BANK[lastAdded.competency] ?? [];
      const fb: InterviewQuestion = bank[0]
        ? { id: lastAdded.id, ...bank[0], reason: lastAdded.reason }
        : lastAdded;
      const { questions: aiQuestions, usedFallback: qFallback } = await generateQuestion(
        lastAdded.competency,
        lastAdded.category,
        lastAdded.reason,
        previousContext,
        fb,
        3 // Generate 3 diverse questions for deeper interviews
      );
      // Use the first AI question now, store extras in the pool
      const aiQ = aiQuestions[0];
      // Replace the last (deterministic) question with the AI-polished one
      nextState.questions[nextState.questions.length - 1] = aiQ;
      // Add extra questions to the pool (they won't be asked yet but available for future rounds)
      for (let i = 1; i < aiQuestions.length; i++) {
        if (!nextState.questions.find(q => q.id === aiQuestions[i].id)) {
          nextState.questions.push(aiQuestions[i]);
        }
      }
      nextState.history.push({
        step: "question_source",
        detail: qFallback ? "Question sourced from deterministic bank (AI unavailable)." : "Question generated by AI.",
        at: new Date().toISOString(),
      });
    }

    nextState.history.push({
      step: evalFallback ? "evaluation_source" : "evaluation_ai",
      detail: evalFallback
        ? "Used deterministic fallback evaluation (AI unavailable or malformed)."
        : "AI evaluation validated and applied.",
      at: new Date().toISOString(),
    });

    await persistSession(sessionId, { interviewJson: JSON.stringify(nextState) });

    return NextResponse.json({
      evaluation,
      interview: nextState,
      meta: { evalFallback },
    });
  } catch (err) {
    console.error("[HIREMIND] /api/interview/answer error:", err);
    return NextResponse.json({ error: "We couldn't evaluate that answer. Please try again." }, { status: 500 });
  }
}

function deterministicFallbackEvaluation(question: InterviewQuestion, answer: string): AnswerEvaluation {
  // Simple deterministic heuristic — used when AI is unavailable/malformed.
  const words = answer.trim().split(/\s+/).length;
  const len = Math.min(1, words / 120);
  const hasStructure = /first|second|then|finally|because|so|therefore|for example/i.test(answer) ? 0.2 : 0;
  const hasDepth = /tradeoff|scalab|cach|queue|shard|replica|latency|throughput|concurrency|fault|redundan/i.test(answer) ? 0.3 : 0;

  const technicalAccuracy = Math.max(0.2, Math.min(0.8, 0.4 + hasDepth));
  const relevance = Math.max(0.3, Math.min(0.9, 0.5 + len * 0.3));
  const depth = Math.max(0.15, Math.min(0.7, 0.3 + hasDepth));
  const communication = Math.max(0.4, Math.min(0.95, 0.5 + len * 0.3 + hasStructure));
  const overall = Math.round((0.4 * technicalAccuracy + 0.25 * depth + 0.2 * relevance + 0.15 * communication) * 100) / 100;

  // Heuristic detectedGap: if answer doesn't mention scalability/caching when on System Design, suggest it
  let detectedGap: string | null = null;
  if (question.competency === "System Design") {
    if (!/scalab|cach|load balanc|shard|replica|queue/i.test(answer)) {
      detectedGap = "Scalability";
    }
  } else if (question.competency === "Databases") {
    if (!/index|shard|replica|normaliz|transaction/i.test(answer)) detectedGap = "Scalability";
  } else if (question.competency === "Machine Learning") {
    if (!/metric|baseline|overfit|cross|valid|feature/i.test(answer)) detectedGap = "Feature Engineering";
  }

  return {
    questionId: question.id,
    competency: question.competency,
    technicalAccuracy: Math.round(technicalAccuracy * 100) / 100,
    relevance: Math.round(relevance * 100) / 100,
    depth: Math.round(depth * 100) / 100,
    communication: Math.round(communication * 100) / 100,
    overall,
    strengths: ["Attempted to address the core question."],
    weaknesses: detectedGap ? [`Limited depth around ${detectedGap}.`] : ["Could elaborate further with concrete tradeoffs."],
    detectedCompetency: question.competency,
    detectedGap,
    nextFocus: detectedGap ? `Your next question will focus on ${detectedGap}.` : null,
  };
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "hiremind-interview-answer" });
}

export { db };
