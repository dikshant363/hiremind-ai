/**
 * POST /api/extract-text
 * Extracts plain text from uploaded PDF or DOCX files.
 * Uses pdf-parse for PDF and mammoth for DOCX.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = "";

    if (ext === "pdf") {
      // Dynamic import for pdf-parse
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      text = data.text || "";
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
