import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { GradientMesh } from "@/components/hiremind/gradient-mesh";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HireMind AI — Don't just screen the resume. Measure the readiness.",
  description:
    "HireMind AI turns your resume and a target job into evidence-based job readiness — semantic match, skill gaps, an adaptive AI interview, and a personalized improvement roadmap.",
  keywords: [
    "HireMind AI",
    "AI interview",
    "mock interview",
    "resume parser",
    "skill gap",
    "job readiness",
    "adaptive interview",
  ],
  authors: [{ name: "HireMind AI" }],
  openGraph: {
    title: "HireMind AI — Measure your job readiness",
    description:
      "Upload your resume, pick a target role, and let HireMind find your biggest gap — then test it in an adaptive AI interview.",
    siteName: "HireMind AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HireMind AI",
    description: "Don't just screen the resume. Measure the readiness.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {/* Animated gradient mesh background — rendered once at the app root
              so it appears on ALL views, behind all content. Fixed inset-0,
              z-0, pointer-events-none so it never interferes with clicks or
              creates horizontal scroll. The children wrapper below uses
              `relative z-10` to guarantee all foreground content paints
              above the mesh. */}
          <GradientMesh />
          <div className="relative z-10 flex flex-col flex-1">
            {children}
          </div>
          <Toaster />
          <SonnerToaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
