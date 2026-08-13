"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, File, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onTextExtracted: (text: string) => void;
  className?: string;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: "reading" | "done" | "error";
  error?: string;
}

export function FileUpload({ onTextExtracted, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [file, setFile] = React.useState<UploadedFile | null>(null);

  const extractText = async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    setFile({ name: f.name, size: f.size, type: f.type, status: "reading" });

    try {
      let text = "";

      if (ext === "txt" || ext === "md" || f.type === "text/plain") {
        text = await f.text();
      } else if (ext === "pdf") {
        // PDF text extraction via API
        const formData = new FormData();
        formData.append("file", f);
        const res = await fetch("/api/extract-text", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to extract text from PDF.");
        }
        const data = await res.json();
        text = data.text;
      } else if (ext === "docx" || ext === "doc") {
        // DOCX text extraction via API
        const formData = new FormData();
        formData.append("file", f);
        const res = await fetch("/api/extract-text", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to extract text from DOCX.");
        }
        const data = await res.json();
        text = data.text;
      } else {
        throw new Error(`Unsupported file type: .${ext}. Please use .txt, .pdf, or .docx`);
      }

      if (!text.trim()) {
        throw new Error("No text content found in the file.");
      }

      setFile({ name: f.name, size: f.size, type: f.type, status: "done" });
      onTextExtracted(text);
    } catch (err) {
      setFile({ name: f.name, size: f.size, type: f.type, status: "error", error: (err as Error).message });
    }
  };

  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) extractText(f);
    },
    [extractText, onTextExtracted]
  );

  const onDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onFileInput = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) extractText(f);
    },
    [extractText, onTextExtracted]
  );

  const clearFile = () => setFile(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("relative", className)}>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-200",
          isDragging
            ? "border-accent-blue bg-accent-blue/5 scale-[1.01]"
            : "border-border/60 hover:border-border bg-transparent",
          file?.status === "error" && "border-critical/40"
        )}
      >
        <input
          type="file"
          accept=".txt,.pdf,.docx,.doc,.md"
          onChange={onFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={file?.status === "reading"}
        />

        <div className="px-4 py-5 flex items-center gap-3">
          <span className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
            isDragging ? "bg-accent-blue/15 text-accent-blue-foreground" : "bg-secondary text-secondary-foreground"
          )}>
            {isDragging ? (
              <Upload className="h-4 w-4 animate-bounce" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </span>

          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2"
                >
                  {file.status === "reading" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : file.status === "error" ? (
                    <AlertCircle className="h-3.5 w-3.5 text-critical-foreground" />
                  ) : (
                    <File className="h-3.5 w-3.5 text-success-foreground" />
                  )}
                  <span className="text-[13px] font-medium truncate">{file.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{formatSize(file.size)}</span>
                  {file.status === "reading" && (
                    <span className="text-[11px] text-muted-foreground ml-1">Reading…</span>
                  )}
                  {file.status === "done" && (
                    <span className="text-[11px] text-success-foreground ml-1">Extracted</span>
                  )}
                  {file.status !== "reading" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="ml-auto shrink-0 h-5 w-5 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-[13px] font-medium">
                    {isDragging ? "Drop your resume here" : "Upload a resume file"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    PDF, DOCX, or TXT — {isDragging ? "release to upload" : "or drag & drop"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {file?.status === "error" && file.error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-1.5 text-[11px] text-critical-foreground pl-1"
        >
          {file.error}
        </motion.p>
      )}
    </div>
  );
}
