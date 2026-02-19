import { useEffect, useCallback } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { DocumentSidebar } from "@/components/sidebar/DocumentSidebar";
import { AISidebar } from "@/components/sidebar/AISidebar";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { StatusBar } from "@/components/editor/StatusBar";
import { CommandPalette } from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  PanelLeft,
  PanelRight,
  Sparkles,
  FileText,
  Maximize2,
  Minimize2,
  Zap,
  Search,
  Plus,
} from "lucide-react";

export function EditorLayout() {
  const {
    isZenMode,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    rightSidebarTab,
    activeDocumentId,
    documents,
    toggleZenMode,
    toggleLeftSidebar,
    toggleRightSidebar,
    setRightSidebarTab,
    createDocument,
  } = useEditorStore();

  const activeDoc = activeDocumentId ? documents[activeDocumentId] : null;

  // Ctrl+K for Zen Mode, Ctrl+N for new doc
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        toggleZenMode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        createDocument(null, false);
      }
    },
    [toggleZenMode, createDocument]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className={`flex flex-col h-screen bg-background overflow-hidden${isZenMode ? " zen-mode" : ""}`}
    >
      {/* ── Top bar ── */}
      <header
        className={`h-11 border-b border-border bg-secondary/30 flex items-center px-3 gap-2 shrink-0 transition-all duration-300${isZenMode ? " opacity-0 pointer-events-none h-0 overflow-hidden" : ""}`}
      >
        {/* Left controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleLeftSidebar}
            className={`p-1.5 rounded-md transition-colors ${isLeftSidebarOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
            title="Toggle file tree"
          >
            <PanelLeft size={15} />
          </button>
        </div>

        {/* Logo / Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-sm">
              <Zap size={11} className="text-white" />
            </div>
            <span className="text-sm font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Text Editor
            </span>
          </div>
          {activeDoc && (
            <>
              <span className="text-border text-xs">/</span>
              <span className="text-xs text-muted-foreground truncate max-w-48">
                {activeDoc.title}
              </span>
            </>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Command palette shortcut hint */}
          <button
            onClick={() => {
              // dispatch fake Ctrl+P to open palette
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "p", ctrlKey: true, bubbles: true }));
            }}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border/50"
            title="Command Palette (Ctrl+P)"
          >
            <Search size={11} />
            <span>Ctrl+P</span>
          </button>

          <button
            onClick={() => createDocument(null, false)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="New document (Ctrl+N)"
          >
            <Plus size={15} />
          </button>

          <button
            onClick={() => {
              setRightSidebarTab("ai");
              if (!isRightSidebarOpen) toggleRightSidebar();
              else if (rightSidebarTab === "ai") toggleRightSidebar();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${isRightSidebarOpen && rightSidebarTab === "ai" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
          >
            <Sparkles size={12} />
            AI
          </button>

          <button
            onClick={toggleZenMode}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Zen Mode (Ctrl+K)"
          >
            {isZenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <ThemeToggle />

          <button
            onClick={toggleRightSidebar}
            className={`p-1.5 rounded-md transition-colors ${isRightSidebarOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
            title="Toggle right sidebar"
          >
            <PanelRight size={15} />
          </button>
        </div>
      </header>

      {/* ── Main area ── */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <aside
          className={`sidebar-panel w-60 shrink-0 border-r border-border bg-sidebar flex flex-col overflow-hidden${isLeftSidebarOpen ? "" : " !w-0 !transform-none opacity-0"}`}
          style={{ transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s" }}
        >
          <DocumentSidebar />
        </aside>

        {/* Editor */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TiptapEditor />
        </main>

        {/* Right Sidebar */}
        <aside
          className={`right-sidebar-panel shrink-0 border-l border-border bg-sidebar flex flex-col overflow-hidden${isRightSidebarOpen ? " w-72" : " w-0 opacity-0"}`}
          style={{ transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s" }}
        >
          {/* Tabs */}
          <div className="flex border-b border-sidebar-border shrink-0">
            <button
              onClick={() => setRightSidebarTab("ai")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${rightSidebarTab === "ai" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Sparkles size={12} />
              AI
            </button>
            <button
              onClick={() => setRightSidebarTab("outline")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${rightSidebarTab === "outline" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <FileText size={12} />
              Info
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {rightSidebarTab === "ai" ? (
              <AISidebar />
            ) : (
              <DocInfo />
            )}
          </div>
        </aside>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}

function DocInfo() {
  const { activeDocumentId, documents } = useEditorStore();
  const doc = activeDocumentId ? documents[activeDocumentId] : null;

  if (!doc) {
    return (
      <div className="p-4 text-muted-foreground text-xs text-center pt-8">
        No document selected
      </div>
    );
  }

  const text = doc.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const sentences = (text.match(/[.!?]+/g) || []).length;
  const paragraphs = (doc.content.match(/<p[^>]*>/g) || []).length;
  const headings = (doc.content.match(/<h[1-3][^>]*>/g) || []).length;
  const tables = (doc.content.match(/<table[^>]*>/g) || []).length;

  return (
    <div className="p-3 space-y-4 overflow-y-auto h-full">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Document Stats
        </h3>
        <div className="space-y-2">
          {[
            { label: "Words", value: words.toLocaleString() },
            { label: "Sentences", value: sentences },
            { label: "Paragraphs", value: paragraphs },
            { label: "Headings", value: headings },
            { label: "Tables", value: tables },
            { label: "Created", value: new Date(doc.createdAt).toLocaleDateString() },
            { label: "Modified", value: new Date(doc.updatedAt).toLocaleDateString() },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="text-foreground font-medium tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Keyboard Shortcuts
        </h3>
        <div className="space-y-1.5">
          {[
            { key: "Ctrl+K", desc: "Zen Mode" },
            { key: "Ctrl+P", desc: "Command palette" },
            { key: "Ctrl+N", desc: "New document" },
            { key: "/", desc: "Slash commands" },
            { key: "Ctrl+B", desc: "Bold" },
            { key: "Ctrl+I", desc: "Italic" },
            { key: "Ctrl+Z", desc: "Undo" },
          ].map((s) => (
            <div key={s.key} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{s.desc}</span>
              <kbd className="bg-muted border border-border text-foreground px-1.5 py-0.5 rounded text-[10px] font-mono">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
