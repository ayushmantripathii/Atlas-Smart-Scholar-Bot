"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Zap,
  User,
  Trash2,
  FileUp,
} from "lucide-react";
import { UploadSelector } from "@/components/upload-selector";
import type { ChatMessage } from "@/types/study";

export default function ChatPage() {
  const [context, setContext] = useState("");
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [contextSet, setContextSet] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSetContext = () => {
    setContextSet(true);
  };

  const handleSend = async () => {
    if (!question.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: question.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: context.trim() || undefined,
          fileUrl: selectedFileUrl || undefined,
          question: userMsg.content,
          history: messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setContextSet(false);
    setContext("");
    setSelectedFileUrl(null);
    setSelectedFileName(null);
    setError(null);
  };

  const hasContext = !!context.trim() || !!selectedFileUrl;

  return (
    <div className="space-y-6 max-w-4xl h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold">AI Chat</h2>
        <p className="text-muted-foreground mt-1">
          Ask questions and learn interactively with Atlas.
        </p>
      </div>

      {/* Context setup */}
      {!contextSet && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Study Context (Optional)</CardTitle>
                <CardDescription>
                  Select an uploaded PDF, paste study material, or skip for general Q&A
                </CardDescription>
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
              disabled={false}
            />

            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={selectedFileUrl ? "File selected — you can also add extra context here..." : "Paste study material here for context-aware answers (optional)..."}
              rows={6}
              className="w-full rounded-lg border border-border/50 bg-background/50 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 focus:border-neon-cyan/50 resize-y"
            />
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" className="border-border/50" onClick={() => setContextSet(true)}>
                Skip — General Chat
              </Button>
              <Button onClick={handleSetContext} disabled={!hasContext} className="bg-neon-glow text-white hover:opacity-90 gap-2">
                <MessageSquare className="h-4 w-4" /> Start Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat area */}
      {contextSet && (
        <Card className="border-border/50 bg-card/50 flex-1 flex flex-col min-h-[500px]">
          {/* Header */}
          <CardHeader className="pb-3 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm">Atlas AI</CardTitle>
                  <CardDescription className="text-xs">
                    {selectedFileName
                      ? `Chatting with: ${selectedFileName}`
                      : context.trim()
                        ? "Context-aware mode"
                        : "General assistant"}
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" onClick={resetChat}>
                <Trash2 className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[450px]">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Ask anything about your study material.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-neon-cyan/10 border border-neon-cyan/20 text-foreground"
                    : "bg-muted/30 border border-border/30 text-foreground/90"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shrink-0">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-muted/30 border border-border/30 rounded-xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /><p>{error}</p>
            </div>
          )}

          {/* Input bar */}
          <div className="p-4 border-t border-border/30">
            <div className="flex items-center gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
                disabled={loading}
                className="flex-1 bg-background/50 border-border/50 focus:border-neon-cyan/50 focus:ring-neon-cyan/20"
              />
              <Button
                onClick={handleSend}
                disabled={loading || !question.trim()}
                size="icon"
                className="bg-neon-glow text-white hover:opacity-90 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
