import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Atlas — Smart Scholar Bot",
  description:
    "Turning curiosity into clarity. AI-powered study assistant for summaries, quizzes, flashcards, study plans, and exam analysis.",
  keywords: [
    "AI study assistant",
    "smart scholar",
    "quiz generator",
    "flashcards",
    "study planner",
    "exam analysis",
    "PDF summarizer",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-background`}
      >
        {children}
      </body>
    </html>
  );
}
