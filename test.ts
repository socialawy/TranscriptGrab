import { extractVideoId, isRTL, formatTranscriptForExport } from './utils';
import { parseSRT, parseVTT } from './parser';
import { TranscriptResult } from './types';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export const runAllTests = (): TestResult[] => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, message?: string) => {
    results.push({ name, passed: condition, message: condition ? 'OK' : message });
    console.log(`[Test] ${name}: ${condition ? 'PASS' : 'FAIL'} ${message ? `(${message})` : ''}`);
  };

  // --- utils.ts tests ---
  assert('extractVideoId: standard watch', extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ') === 'dQw4w9WgXcQ');
  assert('extractVideoId: short url', extractVideoId('https://youtu.be/dQw4w9WgXcQ') === 'dQw4w9WgXcQ');
  assert('extractVideoId: embed url', extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ') === 'dQw4w9WgXcQ');
  assert('extractVideoId: mobile url', extractVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ') === 'dQw4w9WgXcQ');
  assert('extractVideoId: invalid string', extractVideoId('not a url') === null);
  assert('extractVideoId: empty string', extractVideoId('') === null);

  assert('isRTL: Arabic', isRTL('مرحبا') === true);
  assert('isRTL: English', isRTL('hello') === false);

  const mockResult: TranscriptResult = {
    lines: [{ timestamp: '00:01', text: 'Hello' }, { timestamp: '00:02', text: 'World' }],
    source: 'test',
    language: 'en',
    raw: ''
  };
  const exportWithTime = formatTranscriptForExport(mockResult, true);
  const exportNoTime = formatTranscriptForExport(mockResult, false);
  
  assert('formatTranscript: includes timestamps', exportWithTime.includes('[00:01] Hello'));
  assert('formatTranscript: excludes timestamps', exportNoTime === 'Hello\nWorld');

  // --- parser.ts tests ---
  const srtContent = `1
00:00:01,000 --> 00:00:02,000
Line 1

2
00:00:02,500 --> 00:00:04,000
Line 2

3
00:00:05,000 --> 00:00:06,000
Line 3`;

  const srtParsed = parseSRT(srtContent);
  assert('parseSRT: correct length', srtParsed.length === 3);
  assert('parseSRT: correct timestamp', srtParsed[0]?.timestamp === '00:01');
  assert('parseSRT: correct text', srtParsed[2]?.text === 'Line 3');

  const vttContent = `WEBVTT

00:00:01.000 --> 00:00:02.000
Line 1`;
  const vttParsed = parseVTT(vttContent);
  assert('parseVTT: simple parse', vttParsed.length === 1 && vttParsed[0].text === 'Line 1');

  assert('parseSRT: empty string', parseSRT('').length === 0);
  assert('parseSRT: malformed input', parseSRT('junk data').length === 0);

  return results;
};
