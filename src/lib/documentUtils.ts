import type { Document } from "@/stores/editorStore";

/**
 * Returns the file extension from the document title (lowercased), or null if no dot.
 * e.g. "my.file.txt" -> "txt"
 */
export function getDocumentExtension(doc: Document): string | null {
  const title = doc.title?.trim() ?? "";
  if (!title.includes(".")) return null;
  const ext = title.split(".").pop()?.toLowerCase();
  return ext && /^[a-z0-9]+$/i.test(ext) ? ext : null;
}

/**
 * Strip HTML tags and normalize block elements to newlines for plain text.
 */
export function htmlToPlainText(html: string): string {
  if (!html?.trim()) return "";
  const withNewlines = html
    .replace(/<\/?(?:p|div|h[1-6]|li|tr|blockquote|br)\b[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const text = withNewlines.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
  const decoded = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
  return decoded
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+$/gm, "")
    .trim();
}

const htmlEscape: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape HTML and wrap lines in <p>; single \n become <br> within paragraphs.
 */
export function plainTextToHtml(text: string): string {
  if (!text) return "<p></p>";
  const escaped = text.replace(/[&<>"']/g, (ch) => htmlEscape[ch] ?? ch);
  const paragraphs = escaped.split(/\n\n+/);
  return paragraphs
    .map((p) => {
      const withBreaks = p.replace(/\n/g, "<br>");
      return `<p>${withBreaks || "<br>"}</p>`;
    })
    .join("");
}
