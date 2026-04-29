const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const API_KEY = process.env.EXPO_PUBLIC_GROQ_KEY;

export async function summarizeText(text: string): Promise<string> {
  if (!API_KEY) throw new Error("GROQ_KEY_MISSING");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `You are a document assistant. Summarize the following scanned text in 5 to 10 clear bullet points. Be concise. Start each point with •\n\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.log("Groq error:", JSON.stringify(errorData));
    throw new Error(`GROQ_ERROR: ${response.status}`);
  }

  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content;

  if (!summary) throw new Error("NO_SUMMARY_RETURNED");

  return summary;
}
