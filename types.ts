export interface TranscriptLine {
  timestamp: string;
  text: string;
}

export type ChannelName = 'gemini-video' | 'gemini-search' | 'timedtext' | 'manual-upload';

export interface TranscriptResult {
  lines: TranscriptLine[];
  source: string;
  language: string;
  raw: string;
}

export interface AppState {
  loading: boolean;
  error: string | null;
  result: TranscriptResult | null;
  activeChannel: ChannelName | null;
  showTimestamps: boolean;
}
