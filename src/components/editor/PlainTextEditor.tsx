import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { getDocumentExtension, htmlToPlainText } from "@/lib/documentUtils";

export function PlainTextEditor() {
  const { activeDocumentId, documents, updateDocument, updateEditorStats } =
    useEditorStore();
  const activeDoc = activeDocumentId ? documents[activeDocumentId] : null;
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localValue, setLocalValue] = useState("");

  const debouncedSave = useCallback(
    (plainText: string) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        if (activeDocumentId) {
          updateDocument(activeDocumentId, { content: plainText });
          updateEditorStats(plainText);
        }
      }, 600);
    },
    [activeDocumentId, updateDocument, updateEditorStats]
  );

  const isPlain = activeDoc && getDocumentExtension(activeDoc) === "txt";

  // Sync from store when switching document or when store content changes externally
  useEffect(() => {
    if (!activeDoc || !isPlain) return;
    let content = activeDoc.content;
    if (content && (content.includes("</") || /^\s*</.test(content))) {
      content = htmlToPlainText(content);
      updateDocument(activeDoc.id, { content });
    }
    setLocalValue(content ?? "");
  }, [activeDocumentId, activeDoc?.id, activeDoc?.content, isPlain, updateDocument]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setLocalValue(value);
      debouncedSave(value);
    },
    [debouncedSave]
  );

  if (!activeDoc) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground bg-editor-bg">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="text-5xl opacity-80">📝</div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground/90">No document selected</p>
            <p className="text-xs text-muted-foreground/90">Choose a document from the sidebar or create a new one</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isPlain) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-editor-bg">
      <div className="flex-1 overflow-y-auto min-h-0">
        <textarea
          className="w-full h-full min-h-full p-4 resize-none bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-mono text-sm leading-relaxed"
          placeholder="Plain text only — no formatting."
          value={localValue}
          onChange={handleChange}
          spellCheck
        />
      </div>
    </div>
  );
}
