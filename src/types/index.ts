export interface Scan {
  id: string
  imageUri: string
  imageUrl: string
  extractedText: string
  editedText: string
  language: string
  summary: string | null
  translation: string | null
  createdAt: string
  pageCount: number
  tags: string[]
  folderId: string | null
  synced: boolean
}

export type OCRStatus = 'idle' | 'processing' | 'success' | 'error'

export interface OCRResult {
  text: string
  language: string
}

export interface OCRState {
  status: OCRStatus
  text: string
  language: string
  error: string | null
}

export interface PageScan {
  pageNumber: number
  text: string
  imageUri: string
}

export interface MultiPageSession {
  active: boolean
  pages: PageScan[]
  mode: 'idle' | 'collecting' | 'complete'
}

export type ExportFormat = 'txt' | 'pdf' | 'email' | 'share'

export interface ScanStore {
  scans: Scan[]
  activeScan: Scan | null
  isProcessing: boolean
  error: string | null
  multiPageSession: MultiPageSession
  setScans: (scans: Scan[]) => void
  addScan: (scan: Scan) => void
  deleteScan: (id: string) => void
  setActiveScan: (scan: Scan | null) => void
  setProcessing: (value: boolean) => void
  setError: (message: string | null) => void
  updateScanText: (id: string, newText: string) => void
  clearAllScans: () => void
  startMultiPage: () => void
  addPageToSession: (page: PageScan) => void
  stitchDocument: () => void
  cancelMultiPage: () => void
}