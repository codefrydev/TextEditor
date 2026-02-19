import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAISettingsStore, type AIProvider } from "@/stores/aiSettingsStore";

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
];

export function AISettingsDialog() {
  const {
    apiKey,
    provider,
    model,
    openAISettings,
    setApiKey,
    setProvider,
    setModel,
    setOpenAISettings,
    clearApiKey,
  } = useAISettingsStore();

  const [apiKeyDraft, setApiKeyDraft] = useState(apiKey);
  const [providerDraft, setProviderDraft] = useState<AIProvider>(provider);
  const [modelDraft, setModelDraft] = useState(model);

  useEffect(() => {
    if (openAISettings) {
      setApiKeyDraft(apiKey);
      setProviderDraft(provider);
      setModelDraft(model);
    }
  }, [openAISettings, apiKey, provider, model]);

  const handleSave = () => {
    setApiKey(apiKeyDraft.trim());
    setProvider(providerDraft);
    setModel(
      modelDraft.trim() ||
        (providerDraft === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini")
    );
    setOpenAISettings(false);
  };

  const handleClear = () => {
    clearApiKey();
    setApiKeyDraft("");
    setOpenAISettings(false);
  };

  return (
    <Dialog open={openAISettings} onOpenChange={setOpenAISettings}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>
          <DialogDescription>
            Add your API key and choose a provider to use real AI in the sidebar. Your key is stored
            locally and never sent anywhere except to the selected provider.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ai-api-key">API Key</Label>
            <Input
              id="ai-api-key"
              type="password"
              placeholder="Paste your API key"
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
              className="font-mono text-sm"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ai-provider">Provider</Label>
            <Select
              value={providerDraft}
              onValueChange={(v) => setProviderDraft(v as AIProvider)}
            >
              <SelectTrigger id="ai-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ai-model">Model (optional)</Label>
            <Input
              id="ai-model"
              placeholder={providerDraft === "openai" ? "e.g. gpt-4o-mini" : "e.g. gemini-2.5-flash"}
              value={modelDraft}
              onChange={(e) => setModelDraft(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter className="flex-row gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleClear}>
            Clear key
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
