import { useState } from 'react'
import { summarizeText } from '../services/summarize.service'

interface AIState {
  summary: string | null
  isLoading: boolean
  error: string | null
}

export function useAI() {
  const [state, setState] = useState<AIState>({
    summary: null,
    isLoading: false,
    error: null,
  })

  async function summarize(text: string): Promise<void> {
    if (!text.trim()) {
      setState((prev) => ({ ...prev, error: 'No text to summarize' }))
      return
    }

    try {
      setState({ summary: null, isLoading: true, error: null })
      const result = await summarizeText(text)
      setState({ summary: result, isLoading: false, error: null })
    } catch (err: any) {
      setState({
        summary: null,
        isLoading: false,
        error: err.message ?? 'AI_FAILED',
      })
    }
  }

  function clearSummary() {
    setState({ summary: null, isLoading: false, error: null })
  }

  return { ...state, summarize, clearSummary }
}