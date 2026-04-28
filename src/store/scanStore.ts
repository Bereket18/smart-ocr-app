import { MultiPageSession, Scan, ScanStore } from "@/types";
import { create } from "zustand";

const initialMultiPageSession: MultiPageSession = {
  active: false,
  pages: [],
  mode: "idle",
};

const useScanStore = create<ScanStore>((set, get) => ({
  scans: [],
  activeScan: null,
  isProcessing: false,
  error: null,
  multiPageSession: initialMultiPageSession,

  setScans: (newScans) => set({ scans: newScans }),

  addScan: (scan) =>
    set((state) => {
      const exists = state.scans.find((s) => s.id === scan.id);
      if (exists) {
        return {
          scans: state.scans.map((s) => (s.id === scan.id ? scan : s)),
        };
      }
      return { scans: [scan, ...state.scans] };
    }),

  deleteScan: (id) =>
    set((state) => ({ scans: state.scans.filter((s) => s.id !== id) })),

  setActiveScan: (scan) => set({ activeScan: scan }),

  setProcessing: (value) => set({ isProcessing: value }),

  setError: (message) => set({ error: message }),

  updateScanText: (id, newText) =>
    set((state) => ({
      scans: state.scans.map((s) =>
        s.id === id ? { ...s, editedText: newText } : s,
      ),
    })),

  clearAllScans: () => set({ scans: [] }),

  startMultiPage: () =>
    set({ multiPageSession: { active: true, pages: [], mode: "collecting" } }),

  addPageToSession: (page) =>
    set((state) => ({
      multiPageSession: {
        ...state.multiPageSession,
        pages: [
          ...state.multiPageSession.pages,
          {
            ...page,
            pageNumber: state.multiPageSession.pages.length + 1,
          },
        ],
      },
    })),

  stitchDocument: () => {
    const { pages } = get().multiPageSession;
    const stitchedText = pages
      .map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`)
      .join("\n\n");

    const mergedScan: Scan = {
      id: Date.now().toString(),
      imageUri: pages[0]?.imageUri ?? "",
      imageUrl: "",
      extractedText: stitchedText,
      editedText: stitchedText,
      language: "und",
      summary: null,
      translation: null,
      createdAt: new Date().toISOString(),
      pageCount: pages.length,
      tags: [],
      folderId: null,
      synced: false,
    };

    set((state) => ({
      scans: [mergedScan, ...state.scans],
      multiPageSession: { active: false, pages: [], mode: "complete" },
    }));
  },

  cancelMultiPage: () => set({ multiPageSession: initialMultiPageSession }),
}));

export { useScanStore };

