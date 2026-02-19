import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { CodeBlockCodeMirrorExtension } from "./CodeBlockCodeMirrorExtension";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Typography from "@tiptap/extension-typography";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useCallback, useRef, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { SlashCommand } from "./SlashCommand";
import { EditorToolbar } from "./EditorToolbar";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  X,
} from "lucide-react";
import type { Editor } from "@tiptap/core";
import { toast } from "sonner";

const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      reject(new Error("Image must be under 2MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function getImageFile(files: FileList | undefined): File | null {
  if (!files?.length) return null;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (IMAGE_MIME_TYPES.includes(file.type)) return file;
  }
  return null;
}

type ChainWithExtensions = ReturnType<Editor["chain"]> & Record<string, (...args: unknown[]) => unknown>;

export function TiptapEditor() {
  const { activeDocumentId, documents, updateDocument, updateEditorStats } =
    useEditorStore();

  const activeDoc = activeDocumentId ? documents[activeDocumentId] : null;
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const imageResolveRef = useRef<((src: string | null) => void) | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const imageDialogSourceRef = useRef<"toolbar" | "slash">("slash");

  const debouncedSave = useCallback(
    (content: string) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        if (activeDocumentId) {
          updateDocument(activeDocumentId, { content });
        }
      }, 600);
    },
    [activeDocumentId, updateDocument]
  );

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          codeBlock: false,
        }),
        CodeBlockCodeMirrorExtension.configure({
          defaultLanguage: null,
        }),
        Placeholder.configure({
          placeholder: "Type / for commands",
        }),
        CharacterCount,
        Highlight.configure({ multicolor: false }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Typography,
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: "tiptap-link" },
        }),
        Image.configure({ allowBase64: true }),
        Underline,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        SlashCommand.configure({
          getImageSrc: () =>
            new Promise((resolve) => {
              imageDialogSourceRef.current = "slash";
              setImageUrl("");
              setImageFile(null);
              setImageDialogOpen(true);
              imageResolveRef.current = resolve;
            }),
        }),
      ],
      content: activeDoc?.content ?? "<p></p>",
      editorProps: {
        attributes: {
          class: "tiptap-editor",
          spellcheck: "true",
        },
        handlePaste: (view, event) => {
          const items = event.clipboardData?.items;
          if (!items) return false;
          const file = Array.from(items).find((item) => item.kind === "file" && IMAGE_MIME_TYPES.includes(item.type));
          if (!file) return false;
          const f = file.getAsFile();
          if (!f) return false;
          event.preventDefault();
          fileToDataUrl(f)
            .then((src) => {
              const ed = editorRef.current;
              if (ed) (ed.chain().focus() as ChainWithExtensions).setImage({ src }).run();
            })
            .catch(() => toast.error("Image must be under 2MB or could not be read"));
          return true;
        },
        handleDrop: (view, event) => {
          const file = getImageFile(event.dataTransfer?.files);
          if (!file) return false;
          event.preventDefault();
          const coords = { left: event.clientX, top: event.clientY };
          const pos = view.posAtCoords(coords);
          if (pos == null) return false;
          fileToDataUrl(file)
            .then((src) => {
              const ed = editorRef.current;
              if (ed) (ed.chain().focus() as ChainWithExtensions).insertContentAt(pos.pos, { type: "image", attrs: { src } }).run();
            })
            .catch(() => toast.error("Image must be under 2MB or could not be read"));
          return true;
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        debouncedSave(html);
        updateEditorStats(html);
      },
    },
    [activeDocumentId]
  );

  useEffect(() => {
    editorRef.current = editor ?? null;
  }, [editor]);

  // Sync content when switching documents
  useEffect(() => {
    if (!editor || !activeDoc) return;
    const current = editor.getHTML();
    if (current !== activeDoc.content) {
      editor.commands.setContent(activeDoc.content ?? "<p></p>");
      updateEditorStats(activeDoc.content ?? "");
    }
  }, [activeDocumentId]); // eslint-disable-line

  const applyLink = () => {
    if (!editor) return;
    if (!linkUrl.trim()) {
      (editor.chain().focus() as ChainWithExtensions).unsetLink().run();
    } else {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      (editor.chain().focus() as ChainWithExtensions).setLink({ href: url }).run();
    }
    setLinkDialogOpen(false);
    setLinkUrl("");
  };

  const applyImageInsert = () => {
    const apply = (src: string) => {
      if (imageDialogSourceRef.current === "toolbar" && editor) {
        (editor.chain().focus() as ChainWithExtensions).setImage({ src }).run();
      } else {
        imageResolveRef.current?.(src);
        imageResolveRef.current = null;
      }
      imageDialogSourceRef.current = "slash";
      setImageDialogOpen(false);
      setImageUrl("");
      setImageFile(null);
    };
    if (imageFile) {
      fileToDataUrl(imageFile)
        .then(apply)
        .catch(() => toast.error("Image must be under 2MB or could not be read"));
      return;
    }
    if (imageUrl.trim()) {
      const src = imageUrl.startsWith("http") ? imageUrl.trim() : `https://${imageUrl.trim()}`;
      apply(src);
      return;
    }
    toast.error("Enter an image URL or choose a file");
  };

  const closeImageDialog = () => {
    if (imageDialogSourceRef.current === "slash") imageResolveRef.current?.(null);
    imageResolveRef.current = null;
    imageDialogSourceRef.current = "slash";
    setImageDialogOpen(false);
    setImageUrl("");
    setImageFile(null);
  };

  const openImageDialogFromToolbar = () => {
    imageDialogSourceRef.current = "toolbar";
    setImageUrl("");
    setImageFile(null);
    setImageDialogOpen(true);
  };

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-editor-bg relative">
      {editor && (
        <EditorToolbar
          editor={editor}
          onLinkClick={() => {
            setLinkUrl(editor.getAttributes("link").href ?? "");
            setLinkDialogOpen(true);
          }}
          onImageClick={openImageDialogFromToolbar}
        />
      )}
      <div className="flex-1 overflow-y-auto">
      {editor && (
        <BubbleMenu editor={editor} className="bubble-menu">
          <button
            className={`bubble-btn${editor.isActive("bold") ? " is-active" : ""}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold size={13} />
          </button>
          <button
            className={`bubble-btn${editor.isActive("italic") ? " is-active" : ""}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic size={13} />
          </button>
          <button
            className={`bubble-btn${editor.isActive("strike") ? " is-active" : ""}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough size={13} />
          </button>
          <button
            className={`bubble-btn${editor.isActive("code") ? " is-active" : ""}`}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Inline Code"
          >
            <Code size={13} />
          </button>
          <button
            className={`bubble-btn${editor.isActive("highlight") ? " is-active" : ""}`}
            onClick={() => (editor.chain().focus() as ChainWithExtensions).toggleHighlight().run()}
            title="Highlight"
          >
            <Highlighter size={13} />
          </button>
          <button
            className={`bubble-btn${editor.isActive("link") ? " is-active" : ""}`}
            onClick={() => {
              const prev = editor.getAttributes("link").href ?? "";
              setLinkUrl(prev);
              setLinkDialogOpen(true);
            }}
            title="Link"
          >
            <LinkIcon size={13} />
          </button>
          <div className="bubble-divider" />
          <button
            className={`bubble-btn${editor.isActive("heading", { level: 1 }) ? " is-active" : ""}`}
            onClick={() => (editor.chain().focus() as ChainWithExtensions).toggleHeading({ level: 1 }).run()}
            title="H1"
          >
            <Heading1 size={13} />
          </button>
          <button
            className={`bubble-btn${editor.isActive("heading", { level: 2 }) ? " is-active" : ""}`}
            onClick={() => (editor.chain().focus() as ChainWithExtensions).toggleHeading({ level: 2 }).run()}
            title="H2"
          >
            <Heading2 size={13} />
          </button>
          <button
            className={`bubble-btn${editor.isActive("heading", { level: 3 }) ? " is-active" : ""}`}
            onClick={() => (editor.chain().focus() as ChainWithExtensions).toggleHeading({ level: 3 }).run()}
            title="H3"
          >
            <Heading3 size={13} />
          </button>
        </BubbleMenu>
      )}

      {/* Link dialog */}
      {linkDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setLinkDialogOpen(false)}>
          <div className="bg-popover border border-border rounded-xl shadow-2xl p-4 w-80" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Insert Link</span>
              <button onClick={() => setLinkDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <input
              autoFocus
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyLink()}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 mb-3"
            />
            <div className="flex gap-2">
              <button onClick={applyLink} className="flex-1 bg-primary text-primary-foreground text-xs font-medium rounded-lg py-2 hover:bg-primary/90 transition-colors">
                Apply
              </button>
              {editor?.isActive("link") && (
                <button
                  onClick={() => { (editor.chain().focus() as ChainWithExtensions).unsetLink().run(); setLinkDialogOpen(false); }}
                  className="px-3 text-xs text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image insert dialog */}
      {imageDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeImageDialog}>
          <div className="bg-popover border border-border rounded-xl shadow-2xl p-4 w-80" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Insert Image</span>
              <button onClick={closeImageDialog} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <input
              ref={imageFileInputRef}
              type="file"
              accept={IMAGE_MIME_TYPES.join(",")}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && IMAGE_MIME_TYPES.includes(f.type)) setImageFile(f);
                e.target.value = "";
              }}
            />
            <input
              type="url"
              placeholder="https://example.com/image.png"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyImageInsert())}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 mb-2"
            />
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => imageFileInputRef.current?.click()}
                className="text-xs border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors"
              >
                {imageFile ? imageFile.name : "Choose file"}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={applyImageInsert} className="flex-1 bg-primary text-primary-foreground text-xs font-medium rounded-lg py-2 hover:bg-primary/90 transition-colors">
                Insert
              </button>
              <button onClick={closeImageDialog} className="px-3 text-xs border border-border rounded-lg hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
      </div>
    </div>
  );
}
