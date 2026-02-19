import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  Highlighter,
  Link as LinkIcon,
  ImagePlus,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
  Printer,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  RemoveFormatting,
  Quote,
  Pilcrow,
} from "lucide-react";

type ChainWithExtensions = ReturnType<Editor["chain"]> & Record<string, (...args: unknown[]) => unknown>;

const STYLE_OPTIONS = [
  { value: "paragraph", label: "Normal text", icon: Pilcrow },
  { value: "heading1", label: "Heading 1", icon: Heading1 },
  { value: "heading2", label: "Heading 2", icon: Heading2 },
  { value: "heading3", label: "Heading 3", icon: Heading3 },
  { value: "blockquote", label: "Quote", icon: Quote },
] as const;

interface EditorToolbarProps {
  editor: Editor;
  onLinkClick: () => void;
  onImageClick: () => void;
}

export function EditorToolbar({ editor, onLinkClick, onImageClick }: EditorToolbarProps) {
  const chain = () => editor.chain().focus() as ChainWithExtensions;

  const currentStyle = editor.isActive("heading", { level: 1 })
    ? "heading1"
    : editor.isActive("heading", { level: 2 })
      ? "heading2"
      : editor.isActive("heading", { level: 3 })
        ? "heading3"
        : editor.isActive("blockquote")
          ? "blockquote"
          : "paragraph";

  const setStyle = (value: (typeof STYLE_OPTIONS)[number]["value"]) => {
    if (value === "paragraph") chain().setParagraph().run();
    else if (value === "heading1") chain().setHeading({ level: 1 }).run();
    else if (value === "heading2") chain().setHeading({ level: 2 }).run();
    else if (value === "heading3") chain().setHeading({ level: 3 }).run();
    else if (value === "blockquote") chain().toggleBlockquote().run();
  };

  return (
    <div className="editor-toolbar flex flex-wrap items-center gap-0.5 border-b border-border/80 bg-secondary/20 px-3 py-2 shrink-0">
      {/* Undo / Redo / Print */}
      <div className="flex items-center gap-0.5 mr-1 pr-1 border-r border-border">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="toolbar-btn p-1.5 rounded hover:bg-accent disabled:opacity-40"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="toolbar-btn p-1.5 rounded hover:bg-accent disabled:opacity-40"
          title="Redo"
        >
          <Redo2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="toolbar-btn p-1.5 rounded hover:bg-accent"
          title="Print"
        >
          <Printer size={16} />
        </button>
      </div>

      {/* Text style dropdown */}
      <div className="flex items-center mr-1 pr-1 border-r border-border">
        <select
          value={currentStyle}
          onChange={(e) => setStyle(e.target.value as (typeof STYLE_OPTIONS)[number]["value"])}
          className="text-xs bg-transparent border-0 rounded px-2 py-1.5 cursor-pointer focus:ring-2 focus:ring-primary/30 focus:outline-none min-w-[100px]"
          title="Text style"
        >
          {STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Inline formatting */}
      <div className="flex items-center gap-0.5 mr-1 pr-1 border-r border-border">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-btn p-1.5 rounded hover:bg-accent ${editor.isActive("bold") ? "bg-primary/15 text-primary" : ""}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-btn p-1.5 rounded hover:bg-accent ${editor.isActive("italic") ? "bg-primary/15 text-primary" : ""}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`toolbar-btn p-1.5 rounded hover:bg-accent ${editor.isActive("underline") ? "bg-primary/15 text-primary" : ""}`}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => chain().toggleHighlight().run()}
          className={`toolbar-btn p-1.5 rounded hover:bg-accent ${editor.isActive("highlight") ? "bg-primary/15 text-primary" : ""}`}
          title="Highlight"
        >
          <Highlighter size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`toolbar-btn p-1.5 rounded hover:bg-accent ${editor.isActive("strike") ? "bg-primary/15 text-primary" : ""}`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
      </div>

      {/* Insert */}
      <div className="flex items-center gap-0.5 mr-1 pr-1 border-r border-border">
        <button
          type="button"
          onClick={onLinkClick}
          className={`toolbar-btn p-1.5 rounded hover:bg-accent ${editor.isActive("link") ? "bg-primary/15 text-primary" : ""}`}
          title="Insert link"
        >
          <LinkIcon size={16} />
        </button>
        <button
          type="button"
          onClick={onImageClick}
          className="toolbar-btn p-1.5 rounded hover:bg-accent"
          title="Insert image"
        >
          <ImagePlus size={16} />
        </button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-0.5 mr-1 pr-1 border-r border-border">
        <button
          type="button"
          onClick={() => chain().setTextAlign("left").run()}
          className={`toolbar-btn p-1.5 rounded hover:bg-accent ${editor.isActive({ textAlign: "left" }) ? "bg-primary/15 text-primary" : ""}`}
          title="Align left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => chain().setTextAlign("center").run()}
          className={`toolbar-btn p-1.5 rounded hover:bg-accent ${editor.isActive({ textAlign: "center" }) ? "bg-primary/15 text-primary" : ""}`}
          title="Align center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => chain().setTextAlign("right").run()}
          className={`toolbar-btn p-1.5 rounded hover:bg-accent ${editor.isActive({ textAlign: "right" }) ? "bg-primary/15 text-primary" : ""}`}
          title="Align right"
        >
          <AlignRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => chain().setTextAlign("justify").run()}
          className={`toolbar-btn p-1.5 rounded hover:bg-accent ${editor.isActive({ textAlign: "justify" }) ? "bg-primary/15 text-primary" : ""}`}
          title="Justify"
        >
          <AlignJustify size={16} />
        </button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-0.5 mr-1 pr-1 border-r border-border">
        <button
          type="button"
          onClick={() => chain().toggleBulletList().run()}
          className={`toolbar-btn p-1.5 rounded hover:bg-accent ${editor.isActive("bulletList") ? "bg-primary/15 text-primary" : ""}`}
          title="Bullet list"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => chain().toggleOrderedList().run()}
          className={`toolbar-btn p-1.5 rounded hover:bg-accent ${editor.isActive("orderedList") ? "bg-primary/15 text-primary" : ""}`}
          title="Numbered list"
        >
          <ListOrdered size={16} />
        </button>
      </div>

      {/* Clear formatting */}
      <button
        type="button"
        onClick={() => chain().clearNodes().unsetAllMarks().run()}
        className="toolbar-btn p-1.5 rounded hover:bg-accent"
        title="Clear formatting"
      >
        <RemoveFormatting size={16} />
      </button>
    </div>
  );
}
