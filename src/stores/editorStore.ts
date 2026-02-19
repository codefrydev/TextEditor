import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Document {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  isFolder: boolean;
  children?: string[];
  createdAt: number;
  updatedAt: number;
  wordCount?: number;
}

interface EditorState {
  // Documents
  documents: Record<string, Document>;
  activeDocumentId: string | null;

  // UI State
  isZenMode: boolean;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  rightSidebarTab: "ai" | "outline";

  // Editor meta
  wordCount: number;
  charCount: number;
  readingTime: number;
  contentHealthScore: number;

  // Actions
  createDocument: (parentId?: string | null, isFolder?: boolean) => string;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  setActiveDocument: (id: string) => void;
  toggleZenMode: () => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setRightSidebarTab: (tab: "ai" | "outline") => void;
  updateEditorStats: (content: string) => void;
  renameDocument: (id: string, title: string) => void;
}

const DEFAULT_CONTENT = `<h1>Welcome to Text Editor</h1><p>A text editor built for thinkers and writers. Start typing to begin your document, or use <strong>/</strong> to open the command menu.</p><h2>Features</h2><ul><li>Type <strong>/</strong> anywhere to insert headings, lists, code blocks, and more</li><li>Select text to see the <strong>formatting bubble</strong> menu</li><li>Use <strong>Ctrl+K</strong> to toggle Zen Mode for distraction-free writing</li><li>Use the <strong>AI sidebar</strong> to rewrite, summarize, or improve your content</li></ul><h2>Tips</h2><blockquote>Great writing is not written, it's rewritten. Use the AI tools on the right to iterate fast.</blockquote><p>Your documents auto-save to local storage every few seconds. Create folders and files using the sidebar on the left.</p>`;

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function calcReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 238);
}

function calcContentHealth(text: string): number {
  if (!text.trim()) return 0;
  const words = text.trim().split(/\s+/).length;
  const sentences = (text.match(/[.!?]+/g) || []).length || 1;
  const avgWordsPerSentence = words / sentences;
  const hasHeaders = /<h[1-3]/.test(text);
  const hasList = /<ul|<ol/.test(text);
  const hasCode = /<code|<pre/.test(text);

  let score = 40;
  if (words >= 100) score += 20;
  if (words >= 300) score += 10;
  if (avgWordsPerSentence < 25) score += 10;
  if (hasHeaders) score += 10;
  if (hasList) score += 5;
  if (hasCode) score += 5;
  return Math.min(score, 100);
}

const initialDocId = generateId();

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      documents: {
        [initialDocId]: {
          id: initialDocId,
          title: "Welcome to Text Editor",
          content: DEFAULT_CONTENT,
          parentId: null,
          isFolder: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          wordCount: 120,
        },
      },
      activeDocumentId: initialDocId,
      isZenMode: false,
      isLeftSidebarOpen: true,
      isRightSidebarOpen: false,
      rightSidebarTab: "ai",
      wordCount: 0,
      charCount: 0,
      readingTime: 1,
      contentHealthScore: 75,

      createDocument: (parentId = null, isFolder = false) => {
        const id = generateId();
        const doc: Document = {
          id,
          title: isFolder ? "New Folder" : "Untitled",
          content: isFolder ? "" : "<p></p>",
          parentId,
          isFolder,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          documents: { ...state.documents, [id]: doc },
          activeDocumentId: isFolder ? state.activeDocumentId : id,
        }));
        return id;
      },

      updateDocument: (id, updates) => {
        set((state) => ({
          documents: {
            ...state.documents,
            [id]: {
              ...state.documents[id],
              ...updates,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      deleteDocument: (id) => {
        set((state) => {
          const docs = { ...state.documents };
          // recursively delete children
          const deleteRecursive = (docId: string) => {
            Object.values(docs).forEach((d) => {
              if (d.parentId === docId) deleteRecursive(d.id);
            });
            delete docs[docId];
          };
          deleteRecursive(id);
          const remainingIds = Object.keys(docs);
          return {
            documents: docs,
            activeDocumentId:
              state.activeDocumentId === id
                ? remainingIds[0] || null
                : state.activeDocumentId,
          };
        });
      },

      setActiveDocument: (id) => set({ activeDocumentId: id }),

      toggleZenMode: () => set((s) => ({ isZenMode: !s.isZenMode })),

      toggleLeftSidebar: () =>
        set((s) => ({ isLeftSidebarOpen: !s.isLeftSidebarOpen })),

      toggleRightSidebar: () =>
        set((s) => ({ isRightSidebarOpen: !s.isRightSidebarOpen })),

      setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),

      renameDocument: (id, title) => {
        set((state) => ({
          documents: {
            ...state.documents,
            [id]: { ...state.documents[id], title, updatedAt: Date.now() },
          },
        }));
      },

      updateEditorStats: (content) => {
        const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        const words = text ? text.split(/\s+/).length : 0;
        const chars = text.length;
        set({
          wordCount: words,
          charCount: chars,
          readingTime: calcReadingTime(words),
          contentHealthScore: calcContentHealth(content),
        });
      },
    }),
    {
      name: "text-editor-storage",
      partialize: (state) => ({ documents: state.documents }),
    }
  )
);
