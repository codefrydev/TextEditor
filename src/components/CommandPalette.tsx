import { useEffect, useState, useCallback } from "react";
import { useEditorStore } from "@/stores/editorStore";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useTheme } from "next-themes";
import {
  FileText,
  FolderPlus,
  Plus,
  Maximize2,
  Minimize2,
  PanelLeft,
  PanelRight,
  Sparkles,
  Trash2,
  Search,
  Sun,
  Moon,
  Monitor,
  Settings,
} from "lucide-react";
import { useAISettingsStore } from "@/stores/aiSettingsStore";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const {
    documents,
    setActiveDocument,
    createDocument,
    deleteDocument,
    activeDocumentId,
    isZenMode,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    toggleZenMode,
    toggleLeftSidebar,
    toggleRightSidebar,
    setRightSidebarTab,
  } = useEditorStore();
  const setOpenAISettings = useAISettingsStore((s) => s.setOpenAISettings);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    setTimeout(fn, 50);
  }, []);

  const docList = Object.values(documents).filter((d) => !d.isFolder);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search docs, run commands…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Documents */}
        <CommandGroup heading="Documents">
          {docList.map((doc) => (
            <CommandItem
              key={doc.id}
              onSelect={() => run(() => setActiveDocument(doc.id))}
              className={doc.id === activeDocumentId ? "text-primary" : ""}
            >
              <FileText size={14} className="mr-2 shrink-0" />
              <span className="flex-1 truncate">{doc.title}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {(doc.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length || 0)} w
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => createDocument(null, false, "txt"))}>
            <Plus size={14} className="mr-2" />
            New plain text (.txt)
          </CommandItem>
          <CommandItem onSelect={() => run(() => createDocument(null, false, "md"))}>
            <Plus size={14} className="mr-2" />
            New Markdown (.md)
          </CommandItem>
          <CommandItem onSelect={() => run(() => createDocument(null, false))}>
            <Plus size={14} className="mr-2" />
            New document
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+N</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => createDocument(null, true))}>
            <FolderPlus size={14} className="mr-2" />
            New Folder
          </CommandItem>
          {activeDocumentId && (
            <CommandItem
              onSelect={() => run(() => deleteDocument(activeDocumentId))}
              className="text-destructive"
            >
              <Trash2 size={14} className="mr-2" />
              Delete Current Document
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* View */}
        <CommandGroup heading="View">
          <CommandItem onSelect={() => run(toggleZenMode)}>
            {isZenMode ? <Minimize2 size={14} className="mr-2" /> : <Maximize2 size={14} className="mr-2" />}
            {isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+K</span>
          </CommandItem>
          <CommandItem onSelect={() => run(toggleLeftSidebar)}>
            <PanelLeft size={14} className="mr-2" />
            {isLeftSidebarOpen ? "Hide" : "Show"} File Tree
          </CommandItem>
          <CommandItem onSelect={() => run(() => { setRightSidebarTab("ai"); if (!isRightSidebarOpen) toggleRightSidebar(); })}>
            <Sparkles size={14} className="mr-2" />
            Open AI Sidebar
          </CommandItem>
          <CommandItem onSelect={() => run(toggleRightSidebar)}>
            <PanelRight size={14} className="mr-2" />
            {isRightSidebarOpen ? "Hide" : "Show"} Right Panel
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandSeparator />

        {/* Settings */}
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => run(() => setOpenAISettings(true))}>
            <Settings size={14} className="mr-2" />
            AI Settings (API key &amp; provider)
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Appearance */}
        <CommandGroup heading="Appearance">
          <CommandItem onSelect={() => run(() => setTheme("light"))} className={theme === "light" ? "text-primary" : ""}>
            <Sun size={14} className="mr-2" />
            Light
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("dark"))} className={theme === "dark" ? "text-primary" : ""}>
            <Moon size={14} className="mr-2" />
            Dark
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("system"))} className={theme === "system" ? "text-primary" : ""}>
            <Monitor size={14} className="mr-2" />
            System
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
