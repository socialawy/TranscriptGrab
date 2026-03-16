import { GoogleGenAI } from "@google/genai";
import { TranscriptResult, TranscriptLine } from "./types";
import { parseSubtitleFile } from "./parser";

// Helper to format seconds to MM:SS
const formatSeconds = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Helper to parse Gemini response text into lines
const parseGeminiTranscript = (text: string): TranscriptLine[] => {
  const lines: TranscriptLine[] = [];
  // Regex matches [MM:SS] or MM:SS (optionally bolded) at start of line
  const regex = /^(?:[*_]*\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?[*_]*)\s+(.+)$/;
  
  const rawLines = text.split('\n');
  for (const rawLine of rawLines) {
    const cleanLine = rawLine.trim();
    if (!cleanLine) continue;

    const match = cleanLine.match(regex);
    if (match) {
      lines.push({
        timestamp: match[1],
        text: match[2].trim()
      });
    } else if (lines.length > 0) {
      // Append continuation text to previous line
      lines[lines.length - 1].text += " " + cleanLine;
    }
  }
  return lines;
};

// Channel 3: Timedtext (Scraping)
export async function fetchViaTimedtext(videoId: string, lang: string): Promise<TranscriptResult> {
  // Try with specific language first
  let url = `https://corsproxy.io/?https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`;
  
  let response = await fetch(url);
  // corsproxy.io usually returns 200 even if target errors, but checking ok is good practice
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  let text = await response.text();
  
  // If empty or not found (often returns empty XML or specific error), try without lang (auto)
  if (!text || text.trim() === '' || !text.includes('<text')) {
     url = `https://corsproxy.io/?https://www.youtube.com/api/timedtext?v=${videoId}`; 
     response = await fetch(url);
     if (!response.ok) throw new Error(`HTTP error ${response.status}`);
     text = await response.text();
  }

  if (!text || !text.includes('<text')) {
    throw new Error("No captions found via timedtext");
  }

  // Parse XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");
  const textNodes = xmlDoc.getElementsByTagName("text");
  
  const lines: TranscriptLine[] = [];
  
  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];
    const start = parseFloat(node.getAttribute("start") || "0");
    const content = node.textContent || "";
    
    // Convert HTML entities manually if needed, but textContent handles most.
    const cleanContent = content
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .trim();

    if (cleanContent) {
      lines.push({
        timestamp: formatSeconds(start),
        text: cleanContent
      });
    }
  }

  return {
    lines,
    source: 'timedtext',
    language: lang,
    raw: text
  };
}

// Channel 1: Gemini Video
export async function fetchViaGeminiVideo(videoId: string, lang: string): Promise<TranscriptResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Using gemini-flash-latest as requested
  const model = 'gemini-flash-latest'; 
  
  const langInstruction = lang === 'auto' ? "the original spoken language" : lang;
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          // Fix 1: Removed mimeType to let Gemini infer it from the URL
          { fileData: { fileUri: `https://www.youtube.com/watch?v=${videoId}` } },
          { text: `Transcribe this video's audio to text in ${langInstruction}. Return each line with its timestamp in [MM:SS] format. Do NOT translate. Transcribe exactly what is spoken. Return ONLY the transcript, no commentary.` }
        ]
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from Gemini Video");

    const lines = parseGeminiTranscript(resultText);
    
    return {
      lines,
      source: 'gemini-video',
      language: lang,
      raw: resultText
    };
  } catch (e: any) {
    throw new Error(`Gemini Video failed: ${e.message}`);
  }
}

// Channel 2: Gemini Search
export async function fetchViaGeminiSearch(videoId: string, lang: string): Promise<TranscriptResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use gemini-3-flash-preview for search grounding
  const model = 'gemini-3-flash-preview';
  
  const langInstruction = lang === 'auto' ? "the original spoken language" : lang;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Find the full transcript or captions for this YouTube video: https://youtube.com/watch?v=${videoId}. Return in ${langInstruction} with timestamps if available. Return ONLY the transcript text formatted as "[MM:SS] text".`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from Gemini Search");
    
    const lines = parseGeminiTranscript(resultText);
    
    return {
      lines,
      source: 'gemini-search',
      language: lang,
      raw: resultText
    };
  } catch (e: any) {
    throw new Error(`Gemini Search failed: ${e.message}`);
  }
}

// Main Router
export default async function getTranscript(
  videoId: string, 
  lang: string = 'ar', 
  manualFile?: File, 
  onStatusUpdate?: (status: string) => void
): Promise<TranscriptResult> {
  // 1. Manual Upload
  if (manualFile) {
    if (onStatusUpdate) onStatusUpdate("Parsing file...");
    try {
      return await parseSubtitleFile(manualFile);
    } catch (e) {
      console.error("Manual file parsing failed", e);
      throw new Error("Failed to parse uploaded file");
    }
  }

  const errors: string[] = [];

  // 2. Timedtext (Zero cost)
  try {
    console.log("Attempting Timedtext...");
    if (onStatusUpdate) onStatusUpdate("Trying timedtext...");
    return await fetchViaTimedtext(videoId, lang);
  } catch (e: any) {
    console.warn("Timedtext failed:", e.message);
    errors.push(`Timedtext: ${e.message}`);
  }

  // 3. Gemini Video (High quality)
  try {
    console.log("Attempting Gemini Video...");
    if (onStatusUpdate) onStatusUpdate("Trying Gemini Video...");
    return await fetchViaGeminiVideo(videoId, lang);
  } catch (e: any) {
    console.warn("Gemini Video failed:", e.message);
    errors.push(`Gemini Video: ${e.message}`);
  }

  // 4. Gemini Search (Fallback)
  try {
    console.log("Attempting Gemini Search...");
    if (onStatusUpdate) onStatusUpdate("Trying Gemini Search...");
    return await fetchViaGeminiSearch(videoId, lang);
  } catch (e: any) {
    console.warn("Gemini Search failed:", e.message);
    errors.push(`Gemini Search: ${e.message}`);
  }

  throw new Error(`All channels failed. Details: ${errors.join('; ')}`);
}