import { TranscriptLine, TranscriptResult } from './types';

/**
 * Clean up text by removing HTML tags and extra whitespace.
 */
const cleanText = (text: string): string => {
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML tags like <font> or <b>
    .replace(/\{\\an\d\}/g, '') // Remove positioning tags
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
};

/**
 * Normalizes timestamps to MM:SS or HH:MM:SS format.
 * Input example: "00:00:05,123" or "00:01:30.500"
 */
const normalizeTimestamp = (rawTimestamp: string): string => {
  // Remove milliseconds/frames (everything after last . or ,)
  const clean = rawTimestamp.replace(/[.,]\d+$/, '').trim();
  
  const parts = clean.split(':');
  
  // If we have HH:MM:SS
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const seconds = parts[2];
    
    if (hours > 0) {
      // Return H:MM:SS (remove leading zero on hour if preferred, but HH is fine too)
      return `${hours}:${minutes}:${seconds}`;
    }
    // Return MM:SS
    return `${minutes}:${seconds}`;
  }
  
  // If we have MM:SS (possible in some VTT)
  if (parts.length === 2) {
    return clean;
  }
  
  return clean;
};

/**
 * Parses SRT (SubRip Subtitle) content.
 */
export const parseSRT = (content: string): TranscriptLine[] => {
  if (!content) return [];
  
  // Normalize newlines and remove BOM
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split('\n\n');
  
  const results: TranscriptLine[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    // Find the timestamp line (contains "-->")
    const timeLineIndex = lines.findIndex(line => line.includes('-->'));
    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    
    // Extract text (lines after timestamp)
    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines.map(cleanText).join(' ').trim();
    
    if (!text) continue;

    // Extract start timestamp
    // SRT format: 00:00:00,000 --> 00:00:00,000
    const rawStart = timeLine.split('-->')[0].trim();
    const timestamp = normalizeTimestamp(rawStart);

    results.push({ timestamp, text });
  }

  return results;
};

/**
 * Parses WebVTT content.
 */
export const parseVTT = (content: string): TranscriptLine[] => {
  if (!content) return [];

  // Normalize newlines and remove BOM
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split('\n\n');
  
  const results: TranscriptLine[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    // Skip header or empty blocks
    if (lines.length === 0) continue;
    if (lines[0].startsWith('WEBVTT')) continue;
    if (lines[0].startsWith('NOTE')) continue;

    // Find timestamp line
    const timeLineIndex = lines.findIndex(line => line.includes('-->'));
    if (timeLineIndex === -1) continue;
    
    const timeLine = lines[timeLineIndex];
    
    // Extract text
    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines.map(cleanText).join(' ').trim();
    
    if (!text) continue;

    // Extract start timestamp
    const rawStart = timeLine.split('-->')[0].trim();
    const timestamp = normalizeTimestamp(rawStart);

    results.push({ timestamp, text });
  }

  return results;
};

/**
 * Reads and parses a subtitle file (SRT or VTT).
 */
export const parseSubtitleFile = (file: File): Promise<TranscriptResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        reject(new Error('Failed to read file as text'));
        return;
      }

      // Simple detection logic
      const isVTT = file.name.toLowerCase().endsWith('.vtt') || content.trim().startsWith('WEBVTT');
      const lines = isVTT ? parseVTT(content) : parseSRT(content);

      resolve({
        lines,
        source: 'manual-upload',
        language: 'auto', // Needs external detection if desired
        raw: content,
      });
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
};
