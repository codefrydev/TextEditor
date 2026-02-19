import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import type { AIProvider } from "@/stores/aiSettingsStore";

export interface GenerateReplyParams {
  provider: AIProvider;
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  model?: string;
}

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export async function generateReply(params: GenerateReplyParams): Promise<string> {
  const {
    provider,
    apiKey,
    systemPrompt,
    userMessage,
    model = provider === "openai" ? DEFAULT_OPENAI_MODEL : DEFAULT_GEMINI_MODEL,
  } = params;

  const key = apiKey?.trim();
  if (!key) {
    throw new Error("API key is required.");
  }

  if (provider === "openai") {
    const client = new OpenAI({ apiKey: key });
    const response = await client.chat.completions.create({
      model,
      messages: [
        ...(systemPrompt.trim()
          ? [{ role: "system" as const, content: systemPrompt }]
          : []),
        { role: "user" as const, content: userMessage },
      ],
    });
    const content = response.choices[0]?.message?.content;
    if (content == null) {
      throw new Error("Empty or invalid response from OpenAI.");
    }
    return content;
  }

  if (provider === "gemini") {
    const doGeminiCall = async (): Promise<string> => {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model,
        contents: userMessage,
        config: systemPrompt.trim()
          ? { systemInstruction: systemPrompt }
          : undefined,
      });
      const text = response.text;
      if (text == null) {
        throw new Error("Empty or invalid response from Gemini.");
      }
      return text;
    };

    const isQuotaError = (err: unknown): boolean => {
      const msg = err instanceof Error ? err.message : String(err);
      return (
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("quota") ||
        msg.includes("rate limit")
      );
    };

    const getRetrySeconds = (err: unknown): number => {
      const msg = err instanceof Error ? err.message : String(err);
      const retryMatch =
        msg.match(/retry in (\d+(?:\.\d+)?)s/i) || msg.match(/retryDelay.*?(\d+)/i);
      return retryMatch ? Math.min(Math.ceil(parseFloat(retryMatch[1])), 60) : 20;
    };

    try {
      return await doGeminiCall();
    } catch (err) {
      if (!isQuotaError(err)) throw err;
      const retrySec = getRetrySeconds(err);
      await new Promise((r) => setTimeout(r, retrySec * 1000));
      try {
        return await doGeminiCall();
      } catch (retryErr) {
        if (isQuotaError(retryErr)) {
          const sec = getRetrySeconds(retryErr);
          throw new Error(
            `Gemini rate limit exceeded. Please try again in about ${sec} seconds, or check your quota and billing at https://ai.google.dev/gemini-api/docs/rate-limits`
          );
        }
        throw retryErr;
      }
    }
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
