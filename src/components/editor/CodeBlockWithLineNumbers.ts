import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

/**
 * Extends CodeBlockLowlight with a NodeView that shows line numbers
 * in a column to the left of the code.
 */
export const CodeBlockWithLineNumbers = CodeBlockLowlight.extend({
  addNodeView() {
    return ({ node }) => {
      const wrapper = document.createElement("div");
      wrapper.className = "code-block-with-line-numbers";

      const lineNumbers = document.createElement("div");
      lineNumbers.className = "code-block-line-numbers";
      lineNumbers.setAttribute("aria-hidden", "true");

      const pre = document.createElement("pre");
      const code = document.createElement("code");
      pre.appendChild(code);

      wrapper.appendChild(lineNumbers);
      wrapper.appendChild(pre);

      const updateLineNumbers = (text: string) => {
        const lines = text ? text.split("\n") : [""];
        lineNumbers.textContent = Array.from(
          { length: lines.length },
          (_, i) => i + 1
        ).join("\n");
      };

      updateLineNumbers(node.textContent);

      return {
        dom: wrapper,
        contentDOM: code,
        update(updatedNode) {
          if (updatedNode.type !== node.type) return false;
          updateLineNumbers(updatedNode.textContent);
          return true;
        },
      };
    };
  },
});
