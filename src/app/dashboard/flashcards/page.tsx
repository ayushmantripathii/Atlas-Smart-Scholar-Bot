"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
  Eye,
} from "lucide-react";
import { UploadSelector } from "@/components/upload-selector";
import type { FlashcardData } from "@/types/study";

export default function FlashcardsPage() {
  const [content, setContent] = useState("");
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const hasInput = !!selectedFileUrl || !!content.trim();

  const handleGenerate = async () => {
    if (!hasInput) { setError("Please enter study material or select an uploaded PDF."); return; }
    setLoading(true);
    setError(null);
    setCards([]);
    setCurrentIndex(0);
    setFlipped(false);

    try {
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(selectedFileUrl ? { fileUrl: selectedFileUrl } : { content: content.trim() }),
          count,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setCards(data.flashcards ?? []);
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1));
  };

  const goPrev = () => {
    setFlipped(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Flashcards</h2>
        <p className="text-muted-foreground mt-1">
          Generate smart flashcards for rapid memorization and review.
        </p>
      </div>

      {/* Input */}
      {cards.length === 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Study Material</CardTitle>
                <CardDescription>Paste content to generate flashcards</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadSelector
              selectedFileUrl={selectedFileUrl}
              onSelect={(url, name) => {
                setSelectedFileUrl(url);
                setSelectedFileName(name);
              }}
              disabled={loading}
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={selectedFileUrl ? "File selected — textarea disabled" : "Paste your study material here..."}
              rows={8}
              disabled={loading || !!selectedFileUrl}
              className="w-full rounded-lg border border-border/50 bg-background/50 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 focus:border-neon-cyan/50 resize-y disabled:opacity-50"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Cards:</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="rounded-md border border-border/50 bg-background/50 px-2 py-1 text-sm"
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleGenerate} disabled={loading || !hasInput} className="bg-neon-glow text-white hover:opacity-90 gap-2">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate Flashcards</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" /><p>{error}</p>
        </div>
      )}

      {/* Flashcard Viewer */}
      {cards.length > 0 && currentCard && (
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Card <span className="text-foreground font-medium">{currentIndex + 1}</span> of {cards.length}
            </p>
            <Button variant="outline" size="sm" className="gap-2 border-border/50" onClick={() => { setCards([]); setCurrentIndex(0); setFlipped(false); }}>
              <RotateCcw className="h-4 w-4" /> New Set
            </Button>
          </div>

          {/* Card */}
          <button
            onClick={() => setFlipped(!flipped)}
            className="w-full min-h-[280px] perspective-1000"
          >
            <Card className={`border-border/50 transition-all duration-300 min-h-[280px] flex flex-col items-center justify-center p-8 cursor-pointer ${
              flipped
                ? "bg-gradient-to-br from-neon-purple/10 to-neon-pink/10 border-neon-purple/30"
                : "bg-card/50 hover:border-neon-cyan/30"
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs uppercase tracking-wider font-semibold ${flipped ? "text-neon-purple" : "text-neon-cyan"}`}>
                  {flipped ? "Answer" : "Question"}
                </span>
                {!flipped && <Eye className="h-3 w-3 text-muted-foreground" />}
              </div>
              <p className="text-center text-lg leading-relaxed max-w-xl">
                {flipped ? currentCard.answer : currentCard.question}
              </p>
              {!flipped && (
                <p className="text-xs text-muted-foreground mt-6">Click to reveal answer</p>
              )}
            </Card>
          </button>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={goPrev} disabled={currentIndex === 0} className="border-border/50">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              {cards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentIndex(i); setFlipped(false); }}
                  className={`h-2 rounded-full transition-all ${
                    i === currentIndex ? "w-6 bg-neon-cyan" : "w-2 bg-border hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={goNext} disabled={currentIndex === cards.length - 1} className="border-border/50">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
