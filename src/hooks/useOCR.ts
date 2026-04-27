import { OCRState } from '../types/index'
import { recognizeText } from '../services/ocr.service'
import { useCallback, useState } from "react";

const initialState: OCRState = {
  status: "idle",
  text: "",
  language: "",
  error: null,
};

export function useOCR() {
  const [state, setState] = useState<OCRState>(initialState);

  const processImage = useCallback(async (uri: string): Promise<void> => {
    setState({ status: "processing", text: "", language: "", error: null });

    try {
      const result = await recognizeText(uri);
      setState({
        status: "success",
        text: result.text,
        language: result.language,
        error: null,
      });
    } catch (err: any) {
      console.log("OCR ERROR:", err.message);
      setState({
        status: "error",
        text: "",
        language: "",
        error:
          err.message === "NO_INTERNET_CONNECTION"
            ? "NO_INTERNET_CONNECTION"
            : (err.message ?? "OCR_FAILED"),
      });
    }
  }, []);

  function reset() {
    setState(initialState);
  }

  return { ...state, processImage, reset };
}
