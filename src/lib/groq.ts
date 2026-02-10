const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqCompletionOptions {
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export async function groqCompletion({
  messages,
  temperature = 0.7,
  max_tokens = 4096,
  stream = false,
}: GroqCompletionOptions): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature,
      max_tokens,
      stream,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Groq API error: ${response.status} — ${errorData?.error?.message ?? "Unknown error"}`
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ---- Pre-built prompts for each feature ----

export function buildSummaryPrompt(content: string): GroqMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert academic summarizer. Provide a clear, structured summary of the given study material. Include:
1. A concise overview (2-3 sentences)
2. Key points (bulleted list)
3. Main topics covered
4. Important terms and definitions

Format your response as valid JSON with this structure:
{
  "summary": "...",
  "key_points": ["...", "..."],
  "topics": ["...", "..."]
}`,
    },
    {
      role: "user",
      content: `Summarize the following study material:\n\n${content}`,
    },
  ];
}

export function buildQuizPrompt(content: string, count: number = 5): GroqMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert quiz generator. Generate ${count} multiple choice questions from the given study material. Each question should have 4 options with one correct answer and a brief explanation.

Format your response as valid JSON:
{
  "questions": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "A) ...",
      "explanation": "..."
    }
  ]
}`,
    },
    {
      role: "user",
      content: `Generate quiz questions from:\n\n${content}`,
    },
  ];
}

export function buildFlashcardPrompt(content: string, count: number = 10): GroqMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert flashcard creator. Generate ${count} flashcards from the given study material. Each flashcard should have a clear question on the front and a concise answer on the back.

Format your response as valid JSON:
{
  "flashcards": [
    {
      "question": "...",
      "answer": "..."
    }
  ]
}`,
    },
    {
      role: "user",
      content: `Create flashcards from:\n\n${content}`,
    },
  ];
}

export function buildStudyPlanPrompt(content: string): GroqMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert study planner. Create a structured study plan based on the given material. Consider topic difficulty and importance.

Format your response as valid JSON:
{
  "title": "Study Plan for [Subject]",
  "topics": [
    {
      "topic": "...",
      "priority": "high|medium|low",
      "estimated_minutes": 30,
      "resources": ["..."]
    }
  ],
  "estimated_hours": 10
}`,
    },
    {
      role: "user",
      content: `Create a study plan for:\n\n${content}`,
    },
  ];
}

export function buildTopicExtractionPrompt(content: string): GroqMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert academic analyst. Extract and rank the main topics from the given study material or past exam papers. Identify frequently tested topics and their importance.

Format your response as valid JSON:
{
  "detected_topics": [
    {
      "topic": "...",
      "frequency": 5,
      "importance": "high|medium|low"
    }
  ],
  "frequency_map": {
    "topic_name": 5
  }
}`,
    },
    {
      role: "user",
      content: `Extract and rank topics from:\n\n${content}`,
    },
  ];
}

export function buildChatPrompt(
  content: string,
  question: string,
  history: GroqMessage[] = []
): GroqMessage[] {
  return [
    {
      role: "system",
      content: `You are an intelligent AI study assistant called Atlas. You help students understand study material by answering their questions clearly and thoroughly. Base your answers on the provided study material. If the question is outside the scope of the material, say so politely.

Study Material Context:
${content}`,
    },
    ...history,
    {
      role: "user",
      content: question,
    },
  ];
}

export function buildRevisionPrompt(content: string): GroqMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert revision assistant. Create a condensed revision guide from the given study material. Focus on the most important concepts, formulas, and key facts that are essential for exam preparation.

Format your response as valid JSON:
{
  "revision_title": "Quick Revision: [Subject]",
  "sections": [
    {
      "heading": "...",
      "key_facts": ["...", "..."],
      "tips": "..."
    }
  ]
}`,
    },
    {
      role: "user",
      content: `Create a revision guide from:\n\n${content}`,
    },
  ];
}
