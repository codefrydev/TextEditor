import { useState, useRef, useEffect } from "react";
import { useEditorStore, Document } from "@/stores/editorStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  FolderPlus,
  Trash2,
  Pencil,
  Search,
  X,
  FileText,
} from "lucide-react";

interface DocItemProps {
  doc: Document;
  depth: number;
  searchQuery: string;
}

function DocItem({ doc, depth, searchQuery }: DocItemProps) {
  const {
    documents,
    activeDocumentId,
    setActiveDocument,
    deleteDocument,
    renameDocument,
    createDocument,
  } = useEditorStore();

  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(doc.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const children = Object.values(documents).filter(
    (d) => d.parentId === doc.id
  );
  const isActive = activeDocumentId === doc.id;

  const wordCount = doc.isFolder
    ? null
    : doc.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  // If searching, hide items that don't match (and aren't folders with matching children)
  if (searchQuery) {
    const matches = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const childrenMatch = children.some((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (!matches && !childrenMatch) return null;
  }

  const handleRename = () => {
    const trimmed = editTitle.trim() || "Untitled";
    renameDocument(doc.id, trimmed);
    setIsEditing(false);
  };

  const handleClick = () => {
    if (!doc.isFolder) setActiveDocument(doc.id);
    else setIsOpen((o) => !o);
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-sm transition-colors
          ${isActive && !doc.isFolder ? "bg-primary/15 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {doc.isFolder ? (
          <>
            {isOpen ? (
              <ChevronDown size={13} className="shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight size={13} className="shrink-0 text-muted-foreground" />
            )}
            {isOpen ? (
              <FolderOpen size={13} className="shrink-0 text-warning" />
            ) : (
              <Folder size={13} className="shrink-0 text-warning" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            <File size={13} className="shrink-0 text-muted-foreground" />
          </>
        )}

        {isEditing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setEditTitle(doc.title);
                setIsEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-accent text-foreground rounded px-1 text-xs outline-none"
          />
        ) : (
          <span className="flex-1 truncate text-xs font-medium">{doc.title}</span>
        )}

        {/* Word count badge */}
        {!doc.isFolder && !isEditing && wordCount !== null && wordCount > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums opacity-60 group-hover:opacity-0 transition-opacity">
            {wordCount}w
          </span>
        )}

        <div
          className="hidden group-hover:flex items-center gap-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={() => setIsEditing(true)}
            title="Rename"
          >
            <Pencil size={10} />
          </button>
          {doc.isFolder && (
            <NewFileDropdown parentId={doc.id} triggerClassName="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" iconSize={10} />
          )}
          <button
            className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
            onClick={() => deleteDocument(doc.id)}
            title="Delete"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {doc.isFolder && isOpen && children.length > 0 && (
        <div>
          {children.map((child) => (
            <DocItem key={child.id} doc={child} depth={depth + 1} searchQuery={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── New file type dropdown ────────────────────────────────────────────────────

const FILE_TYPE_OPTIONS = [
  { label: "Plain text (.txt)", extension: "txt" },
  { label: "Markdown (.md)", extension: "md" },
  { label: "Document", extension: undefined },
] as const;

function NewFileDropdown({
  parentId = null,
  triggerClassName,
  iconSize = 14,
}: {
  parentId: string | null;
  triggerClassName?: string;
  iconSize?: number;
}) {
  const createDocument = useEditorStore((s) => s.createDocument);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={triggerClassName} title="New file">
          <Plus size={iconSize} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {FILE_TYPE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.label}
            onSelect={() => createDocument(parentId, false, opt.extension)}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Templates ───────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    name: "Blog Post",
    icon: "✍️",
    content: `<h1>Blog Post Title</h1><p>Write your introduction here — hook the reader in the first sentence.</p><h2>Section 1</h2><p>Your first main point goes here.</p><h2>Section 2</h2><p>Your second main point.</p><h2>Conclusion</h2><p>Wrap up your thoughts and include a call to action.</p>`,
  },
  {
    name: "Meeting Notes",
    icon: "📋",
    content: `<h1>Meeting Notes</h1><p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p><p><strong>Attendees:</strong> </p><h2>Agenda</h2><ul><li>Item 1</li><li>Item 2</li></ul><h2>Action Items</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false">Follow up on …</li></ul>`,
  },
  {
    name: "Technical Doc",
    icon: "⚙️",
    content: `<h1>Technical Documentation</h1><h2>Overview</h2><p>Brief description of what this covers.</p><h2>Requirements</h2><ul><li>Requirement 1</li><li>Requirement 2</li></ul><h2>Implementation</h2><pre><code class="language-javascript">// Code example here\nprint("hello");</code></pre><h2>Notes</h2><blockquote>Important caveats or warnings go here.</blockquote>`,
  },
];

export function DocumentSidebar() {
  const { documents, createDocument, updateDocument } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const rootDocs = Object.values(documents).filter((d) => d.parentId === null);

  const handleUseTemplate = (template: typeof TEMPLATES[number]) => {
    const id = createDocument(null, false);
    setTimeout(() => {
      updateDocument(id, { title: template.name, content: template.content });
    }, 20);
    setShowTemplates(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Documents
        </span>
        <div className="flex items-center gap-1">
          <NewFileDropdown parentId={null} triggerClassName="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors" iconSize={14} />
          <button
            onClick={() => createDocument(null, true)}
            className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
            title="New folder"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 pt-2 pb-1 shrink-0">
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-sidebar-accent border border-sidebar-border rounded-md pl-7 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Templates toggle */}
      <div className="px-2 pb-1 shrink-0">
        <button
          onClick={() => setShowTemplates((v) => !v)}
          className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        >
          <FileText size={11} />
          Templates
          <ChevronDown size={10} className={`ml-auto transition-transform ${showTemplates ? "rotate-180" : ""}`} />
        </button>

        {showTemplates && (
          <div className="mt-1 space-y-0.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => handleUseTemplate(t)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-sidebar-accent transition-colors text-left"
              >
                <span>{t.icon}</span>
                <span className="text-foreground font-medium">{t.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-sidebar-border mx-2 mb-1 shrink-0" />

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {rootDocs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            <File size={20} className="mx-auto mb-2 opacity-40" />
            No documents yet
          </div>
        ) : (
          rootDocs.map((doc) => (
            <DocItem key={doc.id} doc={doc} depth={0} searchQuery={searchQuery} />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="px-3 py-2 border-t border-sidebar-border shrink-0">
        <p className="text-[10px] text-muted-foreground">
          {Object.values(documents).filter((d) => !d.isFolder).length} documents ·{" "}
          {Object.values(documents).filter((d) => d.isFolder).length} folders
        </p>
      </div>
    </div>
  );
}
