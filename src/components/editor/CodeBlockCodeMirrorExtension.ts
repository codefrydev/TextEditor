import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeBlockCodeMirror } from "./CodeBlockCodeMirror";

export interface CodeBlockCodeMirrorOptions {
  languageClassPrefix: string | null;
  defaultLanguage: string | null;
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    codeBlock: {
      setCodeBlock: (attributes?: { language?: string; code?: string }) => ReturnType;
      toggleCodeBlock: (attributes?: { language?: string; code?: string }) => ReturnType;
    };
  }
}

const backtickInputRegex = /^```([a-z]+)?[\s\n]$/;
const tildeInputRegex = /^~~~([a-z]+)?[\s\n]$/;

function createCodeBlockInputRule(regex: RegExp) {
  return new InputRule({
    find: regex,
    handler: ({ state, range, match }) => {
      const tr = state.tr;
      tr.delete(range.from, range.to);
      const node = state.schema.nodes.codeBlock.create({
        code: "",
        language: match[1] || null,
      });
      tr.replaceWith(range.from, range.from, node);
      tr.setSelection(TextSelection.near(tr.doc.resolve(range.from + node.nodeSize)));
    },
    undoable: true,
  });
}

export const CodeBlockCodeMirrorExtension = Node.create<CodeBlockCodeMirrorOptions>({
  name: "codeBlock",

  addOptions() {
    return {
      languageClassPrefix: "language-",
      defaultLanguage: null,
      HTMLAttributes: {},
    };
  },

  content: "",

  marks: "",

  group: "block",

  code: true,

  defining: true,

  addAttributes() {
    return {
      code: {
        default: "",
        parseHTML: (element) => {
          const code = element.querySelector("code");
          return code ? code.textContent ?? "" : "";
        },
        rendered: false,
      },
      language: {
        default: this.options.defaultLanguage,
        parseHTML: (element) => {
          const prefix = this.options.languageClassPrefix;
          if (!prefix) return null;
          const code = element.querySelector("code");
          const classList = [...(code?.classList || [])];
          const lang = classList
            .filter((c) => c.startsWith(prefix))
            .map((c) => c.slice(prefix.length))[0];
          return lang || null;
        },
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "pre",
        preserveWhitespace: "full",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const prefix = this.options.languageClassPrefix ?? "language-";
    return [
      "pre",
      mergeAttributes(this.options.HTMLAttributes as Record<string, string>, HTMLAttributes as Record<string, string>),
      [
        "code",
        {
          class: node.attrs.language ? `${prefix}${node.attrs.language}` : null,
        },
        node.attrs.code ?? "",
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockCodeMirror);
  },

  addInputRules() {
    return [
      createCodeBlockInputRule(backtickInputRegex),
      createCodeBlockInputRule(tildeInputRegex),
    ];
  },

  addCommands() {
    return {
      setCodeBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              code: attrs?.code ?? "",
              language: attrs?.language ?? this.options.defaultLanguage,
            },
          });
        },
      toggleCodeBlock:
        (attrs) =>
        ({ commands, state, dispatch }) => {
          const type = state.schema.nodes[this.name];
          const { selection } = state;
          const inCodeBlock =
            (selection instanceof NodeSelection && selection.node.type === type) ||
            selection.$from.parent.type === type;
          if (inCodeBlock && dispatch) {
            const from = selection.from;
            const to = selection.to;
            const node = selection instanceof NodeSelection ? selection.node : selection.$from.parent;
            const code = node.attrs.code ?? "";
            const tr = state.tr.replaceWith(
              from,
              to,
              state.schema.nodes.paragraph.create(null, code ? state.schema.text(code) : undefined)
            );
            tr.setSelection(TextSelection.near(tr.doc.resolve(from)));
            dispatch(tr);
            return true;
          }
          return commands.insertContent({
            type: this.name,
            attrs: {
              code: attrs?.code ?? "",
              language: attrs?.language ?? this.options.defaultLanguage,
            },
          });
        },
    };
  },
});
