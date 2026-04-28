import { useState } from 'react'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import * as Print from 'expo-print'

export function useExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function exportAsTXT(text: string, filename?: string): Promise<void> {
    try {
      setIsExporting(true)
      setError(null)

      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        setError('Sharing is not available on this device')
        return
      }

      const name = filename ?? `scan_${Date.now()}`
      const path = FileSystem.documentDirectory + `${name}.txt`

      await FileSystem.writeAsStringAsync(path, text, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      await Sharing.shareAsync(path, {
        mimeType: 'text/plain',
        dialogTitle: 'Export as TXT',
      })

    } catch (err: any) {
      setError(err.message ?? 'EXPORT_FAILED')
    } finally {
      setIsExporting(false)
    }
  }

  async function exportAsPDF(text: string, filename?: string): Promise<void> {
    try {
      setIsExporting(true)
      setError(null)

      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        setError('Sharing is not available on this device')
        return
      }

      const html = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.6;
                padding: 40px;
                color: #1a1a1a;
              }
              h1 {
                font-size: 20px;
                color: #0891B2;
                border-bottom: 2px solid #0891B2;
                padding-bottom: 8px;
                margin-bottom: 24px;
              }
              p {
                white-space: pre-wrap;
                word-wrap: break-word;
              }
            </style>
          </head>
          <body>
            <h1>Smart OCR — Scan Export</h1>
            <p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </body>
        </html>
      `

      const { uri } = await Print.printToFileAsync({ html })

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export as PDF',
      })

    } catch (err: any) {
      setError(err.message ?? 'PDF_EXPORT_FAILED')
    } finally {
      setIsExporting(false)
    }
  }

  async function shareText(text: string): Promise<void> {
    try {
      setIsExporting(true)
      setError(null)

      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        setError('Sharing is not available on this device')
        return
      }

      const path = FileSystem.documentDirectory + `share_${Date.now()}.txt`

      await FileSystem.writeAsStringAsync(path, text, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      await Sharing.shareAsync(path, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Text',
      })

    } catch (err: any) {
      setError(err.message ?? 'SHARE_FAILED')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportAsTXT,
    exportAsPDF,
    shareText,
    isExporting,
    error,
  }
}