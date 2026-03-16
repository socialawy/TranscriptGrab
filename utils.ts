import { TranscriptResult } from './types';

/**
 * Extracts the YouTube Video ID from various URL formats.
 * Supports: standard watch, short URLs, embed, and shorts.
 */
export const extractVideoId = (url: string): string | null => {
  if (!url) return null;
  // Regex to handle various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Copies the provided text to the system clipboard.
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (!navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }
  await navigator.clipboard.writeText(text);
};

/**
 * Triggers a browser download of the text content as a file.
 */
export const downloadAsText = (text: string, filename: string): void => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Formats the transcript result into a single string for export or copy.
 */
export const formatTranscriptForExport = (result: TranscriptResult, includeTimestamps: boolean): string => {
  return result.lines.map(line => {
    return includeTimestamps ? `[${line.timestamp}] ${line.text}` : line.text;
  }).join('\n');
};

/**
 * Detects if the text contains RTL characters (Arabic, Hebrew, etc.).
 * Uses a broad range of unicode characters for RTL scripts.
 */
export const isRTL = (text: string): boolean => {
  // Regex range covers Arabic, Hebrew, Syriac, Thaana, N'Ko, etc.
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
};
