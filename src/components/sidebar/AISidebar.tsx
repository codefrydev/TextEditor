import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useAISettingsStore } from "@/stores/aiSettingsStore";
import { generateReply } from "@/lib/ai";
import { toast } from "@/components/ui/use-toast";
import {
  Sparkles,
  Send,
  RefreshCw,
  Wand2,
} from "lucide-react";

type AIAction = "rewrite" | "summarize" | "expand" | "fix" | "custom";

const AI_ACTIONS = [
  { id: "rewrite" as AIAction, label: "Rewrite", icon: "✨", desc: "Rephrase with clarity" },
  { id: "summarize" as AIAction, label: "Summarize", icon: "📝", desc: "Create a concise summary" },
  { id: "expand" as AIAction, label: "Expand", icon: "🔭", desc: "Add more depth and detail" },
  { id: "fix" as AIAction, label: "Fix Grammar", icon: "🔧", desc: "Correct errors and improve flow" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AISidebar() {
  const { activeDocumentId, documents } = useEditorStore();
  const activeDoc = activeDocumentId ? documents[activeDocumentId] : null;
  const { apiKey, provider, model, hasValidConfig } = useAISettingsStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const getDocText = () => {
    if (!activeDoc) return "";
    return activeDoc.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  };

  const sendMessage = async (userMessage: string, action?: AIAction) => {
    if (!userMessage.trim() && !action) return;
    if (isLoading) return; // prevent double submission (e.g. double-click or Enter + click)
    setIsLoading(true);

    const docText = getDocText();
    const systemContext = docText
      ? `The user is working on a document titled "${activeDoc?.title}". Here is the current content:\n\n${docText.slice(0, 2000)}`
      : "The user is working in a text editor.";

    const actionPrefix: Record<AIAction, string> = {
      rewrite: "Please rewrite the following document content to be clearer and more professional:\n\n",
      summarize: "Please provide a concise summary of the document content:\n\n",
      expand: "Please expand the document content with more depth, examples, and detail:\n\n",
      fix: "Please fix grammar, spelling, and improve the flow of the document:\n\n",
      custom: "",
    };

    const fullUserMsg = action
      ? actionPrefix[action] + docText.slice(0, 1500)
      : userMessage;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: action ? `${AI_ACTIONS.find(a => a.id === action)?.label} document` : userMessage },
    ];
    setMessages(newMessages);
    setInput("");

    try {
      if (hasValidConfig()) {
        const assistantMsg = await generateReply({
          provider,
          apiKey: apiKey.trim(),
          systemPrompt: systemContext,
          userMessage: fullUserMsg,
          model: model || undefined,
        });
        setMessages([...newMessages, { role: "assistant", content: assistantMsg }]);
      } else {
        await new Promise((r) => setTimeout(r, 1200));
        const mockResponses: Record<AIAction | "custom", string> = {
          rewrite: "Here's a rewritten version of your content with improved clarity and professional tone. The structure has been maintained while the language is more precise and engaging.",
          summarize: `**Summary of "${activeDoc?.title}"**\n\nThis document covers the main concepts with clear explanations. Key points include the core ideas presented in the opening sections, followed by practical implementation details.`,
          expand: "I've expanded your content with additional context, examples, and supporting details to make it more comprehensive and informative for your readers.",
          fix: "I've reviewed your document and corrected grammatical errors, improved sentence structure, and enhanced the overall flow for better readability.",
          custom: `I understand your request: "${userMessage}". Based on the context of your document, here's my response with relevant suggestions and improvements.`,
        };
        const assistantMsg = mockResponses[action ?? "custom"];
        setMessages([...newMessages, { role: "assistant", content: assistantMsg }]);
        toast({
          title: "Using demo mode",
          description: "Add an API key in Settings (Ctrl+P → AI Settings) to use real AI.",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setMessages([...newMessages, { role: "assistant", content: `Error: ${message}` }]);
      toast({
        title: "AI request failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedAction(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <Sparkles size={11} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-foreground">AI Assistant</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Ask anything or use quick actions below
        </p>
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-b border-sidebar-border grid grid-cols-2 gap-1.5">
        {AI_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => sendMessage("", action.id)}
            disabled={isLoading || !activeDoc}
            className={`flex flex-col items-start gap-0.5 px-2 py-1.5 rounded-md text-xs transition-all border
              ${!activeDoc ? "opacity-40 cursor-not-allowed border-border" : "border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer"}
            `}
          >
            <span className="text-base leading-none">{action.icon}</span>
            <span className="font-medium text-foreground">{action.label}</span>
            <span className="text-muted-foreground text-[10px]">{action.desc}</span>
          </button>
        ))}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-xs space-y-2">
            <Wand2 size={20} className="mx-auto opacity-40" />
            <p>Use quick actions or type a message below to get started</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs leading-relaxed ${
              msg.role === "user"
                ? "bg-primary/10 text-foreground rounded-lg px-3 py-2 border border-primary/20"
                : "text-foreground/90"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="flex items-center gap-1 mb-1.5 text-primary">
                <Sparkles size={10} />
                <span className="text-[10px] font-semibold uppercase tracking-wider">AI</span>
              </div>
            )}
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw size={11} className="animate-spin" />
            <span>Generating…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-sidebar-border">
        <div className="flex gap-1.5 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask AI anything…"
            rows={2}
            className="flex-1 bg-muted border border-border rounded-lg px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/50 transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
