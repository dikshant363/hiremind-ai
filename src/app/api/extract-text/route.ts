/**
 * POST /api/extract-text
 * Extracts plain text from uploaded PDF or DOCX files.
 * Uses pdf-parse for PDF and mammoth for DOCX.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`extract-text:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many file upload requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit. Please upload a smaller file or paste text directly." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = "";

    if (ext === "pdf") {
      text = await extractTextFromPdf(buffer);
    } else if (ext === "docx" || ext === "doc") {
      // Dynamic import for mammoth
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || "";
    } else if (ext === "txt" || ext === "md") {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: .${ext}. Use .pdf, .docx, or .txt` },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "No text content found in the file." }, { status: 400 });
    }

    // Limit text size to prevent abuse (100K chars)
    const trimmed = text.trim().slice(0, 100_000);

    return NextResponse.json({ text: trimmed, chars: trimmed.length });
  } catch (err) {
    console.error("[extract-text] Error:", err);
    return NextResponse.json(
      { error: "Failed to extract text from the file. Please try pasting your resume text instead." },
      { status: 500 }
    );
  }
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfModule = await import("pdf-parse");
    // Handle pdf-parse v2 PDFParse class export
    if (typeof (pdfModule as any).PDFParse === "function") {
      const PDFParse = (pdfModule as any).PDFParse;
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      if (textResult?.text && textResult.text.trim().length > 0) {
        return textResult.text;
      }
    }
    // Handle pdf-parse v1 function export
    const pdfParse = (pdfModule as any).default || pdfModule;
    if (typeof pdfParse === "function") {
      const data = await pdfParse(buffer);
      if (data?.text && data.text.trim().length > 0) {
        return data.text;
      }
    }
  } catch (err) {
    console.warn("[extract-text] PDFParse structured extraction notice:", (err as Error).message);
  }

  // Fallback text extraction for PDFs with plain text streams
  try {
    const raw = buffer.toString("binary");
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match: RegExpExecArray | null;
    const chunks: string[] = [];
    while ((match = streamRegex.exec(raw)) !== null) {
      const streamContent = match[1];
      const textMatches = streamContent.match(/\(([^)]+)\)\s*Tj/g) || streamContent.match(/\[([^\]]+)\]\s*TJ/g);
      if (textMatches) {
        for (const tm of textMatches) {
          const cleaned = tm.replace(/^[([\\s]+|[)\\]\s*T[jJ]$/g, "").replace(/\\([()\\])/g, "$1");
          if (cleaned.trim().length > 0) chunks.push(cleaned);
        }
      }
    }
    if (chunks.length > 0) {
      return chunks.join(" ");
    }
  } catch {
    // Ignore fallback errors
  }

  return "";
}
