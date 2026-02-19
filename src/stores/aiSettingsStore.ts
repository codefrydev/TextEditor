import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AIProvider = "openai" | "gemini";

interface AISettingsState {
  apiKey: string;
  provider: AIProvider;
  model: string;
  openAISettings: boolean;
  setApiKey: (key: string) => void;
  setProvider: (provider: AIProvider) => void;
  setModel: (model: string) => void;
  setOpenAISettings: (open: boolean) => void;
  clearApiKey: () => void;
  hasValidConfig: () => boolean;
}

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export const useAISettingsStore = create<AISettingsState>()(
  persist(
    (set, get) => ({
      apiKey: "",
      provider: "openai",
      model: DEFAULT_OPENAI_MODEL,
      openAISettings: false,

      setApiKey: (apiKey) => set({ apiKey }),
      setProvider: (provider) =>
        set({
          provider,
          model:
            provider === "gemini" ? DEFAULT_GEMINI_MODEL : DEFAULT_OPENAI_MODEL,
        }),
      setModel: (model) => set({ model }),
      setOpenAISettings: (openAISettings) => set({ openAISettings }),
      clearApiKey: () => set({ apiKey: "" }),
      hasValidConfig: () => {
        const { apiKey } = get();
        return Boolean(apiKey?.trim());
      },
    }),
    {
      name: "text-editor-ai-settings",
      partialize: (state) => ({
        apiKey: state.apiKey,
        provider: state.provider,
        model: state.model,
      }),
    }
  )
);
