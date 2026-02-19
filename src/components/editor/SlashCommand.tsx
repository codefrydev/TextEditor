import { ReactRenderer } from "@tiptap/react";
import { Editor, Range } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Minus,
  Pilcrow,
  Table,
  Image,
  Link,
  Highlighter,
} from "lucide-react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Extension } from "@tiptap/core";

// TipTap chain() returns ChainedCommands; extensions add methods not in the base type.
type ChainWithExtensions = ReturnType<Editor["chain"]> & Record<string, (...args: unknown[]) => unknown>;

// ─── Slash command items ────────────────────────────────────────────────────

interface CommandItem {
  title: string;
  description: string;
  icon: React.ElementType;
  group: string;
  command: (props: { editor: Editor; range: Range }) => void;
}

const COMMANDS: CommandItem[] = [
  // Text
  {
    title: "Paragraph",
    description: "Plain text paragraph",
    icon: Pilcrow,
    group: "Text",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      (editor.chain().focus() as ChainWithExtensions).setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    group: "Text",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      (editor.chain().focus() as ChainWithExtensions).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    group: "Text",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      (editor.chain().focus() as ChainWithExtensions).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    group: "Text",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      (editor.chain().focus() as ChainWithExtensions).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Quote",
    description: "Highlighted blockquote",
    icon: Quote,
    group: "Text",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      (editor.chain().focus() as ChainWithExtensions).toggleBlockquote().run();
    },
  },
  {
    title: "Highlight",
    description: "Highlight text for emphasis",
    icon: Highlighter,
    group: "Text",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const from = editor.state.selection.from;
      const placeholder = "highlighted text";
      (editor.chain().focus() as ChainWithExtensions)
        .insertContent(placeholder)
        .setTextSelection({ from, to: from + placeholder.length })
        .toggleHighlight()
        .run();
    },
  },
  // Lists
  {
    title: "Bullet List",
    description: "Unordered list of items",
    icon: List,
    group: "Lists",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      (editor.chain().focus() as ChainWithExtensions).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Ordered numbered list",
    icon: ListOrdered,
    group: "Lists",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      (editor.chain().focus() as ChainWithExtensions).toggleOrderedList().run();
    },
  },
  {
    title: "Task List",
    description: "Checkbox to-do list",
    icon: ListChecks,
    group: "Lists",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      (editor.chain().focus() as ChainWithExtensions).toggleTaskList().run();
    },
  },
  // Media & Embeds
  {
    title: "Table",
    description: "Insert a 3×3 table",
    icon: Table,
    group: "Media",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      (editor.chain().focus() as ChainWithExtensions)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: "Image",
    description: "Embed image from URL or file",
    icon: Image,
    group: "Media",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const url = window.prompt("Enter image URL:");
      if (url) (editor.chain().focus() as ChainWithExtensions).setImage({ src: url }).run();
    },
  },
  {
    title: "Link",
    description: "Insert a hyperlink",
    icon: Link,
    group: "Media",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const url = window.prompt("Enter URL:");
      if (url) {
        const href = url.startsWith("http") ? url : `https://${url}`;
        (editor.chain().focus() as ChainWithExtensions).setLink({ href }).run();
      }
    },
  },
  // Code
  {
    title: "Code Block",
    description: "Monospaced code block",
    icon: Code2,
    group: "Code",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      (editor.chain().focus() as ChainWithExtensions).toggleCodeBlock().run();
    },
  },
  // Layout
  {
    title: "Divider",
    description: "Horizontal rule separator",
    icon: Minus,
    group: "Layout",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      (editor.chain().focus() as ChainWithExtensions).setHorizontalRule().run();
    },
  },
];

// ─── Slash menu UI ──────────────────────────────────────────────────────────

interface SlashMenuListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export const SlashMenuList = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  SlashMenuListProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) props.command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  useEffect(() => setSelectedIndex(0), [props.items]);

  // Group items
  const groups = props.items.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  // flat index mapping for keyboard nav
  const flatItems = props.items;

  if (!flatItems.length) {
    return (
      <div className="slash-menu">
        <div className="slash-menu-item" style={{ opacity: 0.5 }}>
          <span className="label">No results</span>
        </div>
      </div>
    );
  }

  return (
    <div className="slash-menu">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <div className="slash-menu-group-label">{group}</div>
          {items.map((item) => {
            const idx = flatItems.indexOf(item);
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                className={`slash-menu-item w-full text-left${idx === selectedIndex ? " is-selected" : ""}`}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => selectItem(idx)}
              >
                <span className="icon">
                  <Icon size={14} />
                </span>
                <span>
                  <div className="label">{item.title}</div>
                  <div className="desc">{item.description}</div>
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});

SlashMenuList.displayName = "SlashMenuList";

// ─── Slash Command Extension ────────────────────────────────────────────────

export type SlashCommandOptions = {
  getImageSrc?: () => Promise<string | null>;
};

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      getImageSrc: undefined,
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: CommandItem;
        }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    const ext = this;
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          let list = COMMANDS.filter(
            (item) =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              item.description.toLowerCase().includes(query.toLowerCase()) ||
              item.group.toLowerCase().includes(query.toLowerCase())
          );
          const getImageSrc = ext.options.getImageSrc;
          if (getImageSrc) {
            list = list.map((item) => {
              if (item.title === "Image") {
                return {
                  ...item,
                  command: async ({ editor, range }: { editor: Editor; range: Range }) => {
                    editor.chain().focus().deleteRange(range).run();
                    const src = await getImageSrc();
                    if (src) (editor.chain().focus() as ChainWithExtensions).setImage({ src }).run();
                  },
                };
              }
              return item;
            });
          }
          return list;
        },
        render: () => {
          let component: ReactRenderer<
            { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
            SlashMenuListProps
          >;
          let popup: TippyInstance[];

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenuList, {
                props,
                editor: props.editor,
              });

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                animation: "shift-away",
                theme: "none",
              });
            },
            onUpdate: (props) => {
              component.updateProps(props);
              popup[0]?.setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              });
            },
            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                popup[0]?.hide();
                return true;
              }
              return component.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              popup[0]?.destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
