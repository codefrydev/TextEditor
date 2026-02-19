import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { css } from "@codemirror/lang-css";
import { xml } from "@codemirror/lang-xml";
import { python } from "@codemirror/lang-python";
import { csharp } from "@replit/codemirror-lang-csharp";
import type { LanguageSupport } from "@codemirror/language";
import type { ReactNodeViewProps } from "@tiptap/react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const LANG_MAP: Record<string, LanguageSupport> = {
  javascript: javascript(),
  js: javascript(),
  typescript: javascript({ typescript: true }),
  ts: javascript({ typescript: true }),
  html: html(),
  json: json(),
  css: css(),
  xml: xml(),
  python: python(),
  py: python(),
  csharp: csharp(),
  cs: csharp(),
  "c#": csharp(),
};

/** Display names for the language dropdown (one per language, not per alias) */
const LANG_OPTIONS = [
  { value: "", label: "Plain" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "csharp", label: "C#" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
] as const;

/** Normalize language to a value we have in LANG_MAP (e.g. py -> python, cs -> csharp) */
function normalizeLang(lang: string | null): string | null {
  if (!lang) return null;
  const key = lang.toLowerCase();
  if (LANG_MAP[key]) return key;
  const aliasMap: Record<string, string> = {
    py: "python",
    cs: "csharp",
    "c#": "csharp",
    js: "javascript",
    ts: "typescript",
  };
  return aliasMap[key] ?? null;
}

function getLanguageSupport(lang: string | null) {
  const normalized = normalizeLang(lang);
  if (!normalized) return [];
  const ext = LANG_MAP[normalized];
  return ext ? [ext] : [];
}

export function CodeBlockCodeMirror({ node, editor, updateAttributes }: ReactNodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const code = node.attrs.code ?? "";
    const language = node.attrs.language ?? null;

    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        keymap.of([indentWithTab]),
        ...getLanguageSupport(language),
        EditorView.updateListener.of((vu) => {
          if (!vu.docChanged || !vu.state.doc) return;
          const newCode = vu.state.doc.toString();
          if (isInternalUpdate.current) return;
          updateAttributes({ code: newCode });
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: container,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [node.attrs.language]); // Recreate when language changes so syntax highlighting updates

  // Sync when node.attrs.code or language changes from outside (e.g. undo)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    const nodeCode = node.attrs.code ?? "";
    if (currentDoc !== nodeCode) {
      isInternalUpdate.current = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: nodeCode },
      });
      isInternalUpdate.current = false;
    }
  }, [node.attrs.code]);

  const [copied, setCopied] = useState(false);
  const code = node.attrs.code ?? "";
  const language = node.attrs.language ?? "";

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const displayLang = language || "plain";
  const normalizedLang = normalizeLang(language) || "";

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateAttributes({ language: value || null });
  };

  return (
    <NodeViewWrapper className="code-block-codemirror-wrapper">
      {/* Notion-style header: language selector + copy */}
      <div className="code-block-header">
        <select
          value={normalizedLang}
          onChange={handleLanguageChange}
          className="code-block-lang-select"
          title="Syntax language"
          aria-label="Code block language"
        >
          {LANG_OPTIONS.map((opt) => (
            <option key={opt.value || "plain"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleCopy}
          className="code-block-copy-btn"
          title="Copy code"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span className="code-block-copy-label">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <div ref={containerRef} className="code-block-codemirror" />
    </NodeViewWrapper>
  );
}
