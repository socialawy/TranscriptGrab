# TranscriptGrab — Master Plan

## Purpose
Simple web app for extracting video transcripts (Arabic-first).
Non-technical user, Android mobile, no setup required.

## Tech
- React + TypeScript
- Google AI Studio hosting (auto API key via process.env.API_KEY)
- Mobile-first, RTL-aware UI
- No backend, no external dependencies beyond @google/genai (Future updates will have options)

## Architecture
```text
[URL Input] → [Channel Router] → [Display + Actions]

```


### Channels (priority order)
| Ch | Name              | Method                          | Quota Cost |
|----|-------------------|---------------------------------|------------|
| 1  | Gemini Video      | fileData fileUri + prompt        | High       |
| 2  | Gemini Search     | googleSearch tool + prompt       | Medium     |
| 3  | timedtext scrape  | CORS proxy + XML parse           | Zero       |
| 4  | Manual Upload     | User drops .srt/.vtt file        | Zero       |

### Channel Router Logic
```text 
if (manualFile) → Ch4
else try Ch3 → if fail try Ch1 → if fail try Ch2 → show error
```
Note: Ch3 first to save Gemini quota on simple cases.

### Features (v1)
- Single YouTube URL input
- Language preference (Arabic default, auto-detect option)
- Timestamps toggle (on/off)
- Transcript display (RTL-aware)
- Copy to clipboard
- Download as .txt
- Manual .srt/.vtt upload fallback
- Channel status indicator (which channel succeeded)

### Future (designed for, not built)
- Translation toggle (AR↔EN)
- Summarization mode
- Export .srt/.vtt/.pdf
- Batch URLs
- Keyword search in transcript
- PWA install
- Whisper WASM offline
- Non-YouTube platforms

### File Structure
```text
index.html
style.css
App.tsx — main UI + state
channels.ts — Ch1-Ch4 logic, router
parser.ts — subtitle file parsing (.srt/.vtt)
utils.ts — clipboard, download, URL validation
types.ts — shared types
```


# Task 1 — Types and Utilities (Completed)

## types.ts
- [x] `TranscriptLine`
- [x] `TranscriptResult`
- [x] `ChannelName`
- [x] `AppState`

## utils.ts
- [x] `extractVideoId`
- [x] `copyToClipboard`
- [x] `downloadAsText`
- [x] `formatTranscriptForExport`
- [x] `isRTL`

---

# Task 2: Create parser.ts (Completed)

Parse .srt and .vtt files into TranscriptLine[].

## Functions
- [x] `parseSRT(content: string): TranscriptLine[]`
- [x] `parseVTT(content: string): TranscriptLine[]`
- [x] `parseSubtitleFile(file: File): Promise<TranscriptResult>`
  - [x] Detect format from extension
  - [x] Read via FileReader
  - [x] Return TranscriptResult with source: 'manual-upload'

## Edge cases
- [x] Handle Arabic text with RTL markers
- [x] Strip HTML tags from subtitle entries (YouTube .srt sometimes has <font> tags)
- [x] Handle missing timestamps gracefully
- [x] BOM character at file start

---

# Task 3: Create channels.ts (Completed)

Import GoogleGenAI from "@google/genai". Use process.env.API_KEY.

## Channel 1: Gemini Video
```ts
async function fetchViaGeminiVideo(videoId: string, lang: string): Promise<TranscriptResult>
```

- Use Gemini model with fileData pointing to YouTube URL
- Prompt: "Transcribe this video's audio to text in {lang}. Return each line with its timestamp in [MM:SS] format. Return ONLY the transcript, no commentary."
- Parse response into TranscriptLine[]

## Channel 2: Gemini Search
```ts
async function fetchViaGeminiSearch(videoId: string, lang: string): Promise<TranscriptResult>
```
- Use googleSearch tool
- Prompt: "Find the full transcript or captions for this YouTube video: https://youtube.com/watch?v={videoId}. Return in {lang} with timestamps if available. Return ONLY the transcript text."
- Parse response into TranscriptLine[]

## Channel 3: Timedtext Scrape
```ts
async function fetchViaTimedtext(videoId: string, lang: string): Promise<TranscriptResult>
```
- Fetch via CORS proxy: https://corsproxy.io/?https://www.youtube.com/api/timedtext?v={videoId}&lang={lang}
- Parse XML response into TranscriptLine[]
- If lang fails, try without lang param (auto-detect)

### Channel Router
```ts
async function getTranscript(videoId: string, lang: string, manualFile?: File): Promise<TranscriptResult>
```
- Follow priority: manual → Ch3 → Ch1 → Ch2
- Catch errors per channel, try next
- Attach source name to result
- Throw final error only if ALL channels fail
- Export router + individual channels (for testing).

## Fix 1 — mimeType on fileUri (may break at runtime)

**Quick Fix** — channels.ts, fetchViaGeminiVideo

In the fileData object, remove mimeType. Change:
  { fileData: { fileUri: `https://www.youtube.com/watch?v=${videoId}`, mimeType: 'video/mp4' } }
To:
  { fileData: { fileUri: `https://www.youtube.com/watch?v=${videoId}` } }

Gemini infers the type from YouTube URLs. Specifying mp4 may cause rejection.
Do NOT change anything else.

## Fix 2 — Model names (verify availability)

**Quick Fix** — channels.ts, model names

The file uses:
- 'gemini-flash-latest' for Ch1
- 'gemini-3-flash-preview' for Ch2

These may or may not resolve in the environment. 
Test by running a Grab on any YouTube URL.
If either fails with "model not found":
- Try: 'gemini-2.5-flash' for both
- Or check AI Studio model dropdown for exact names

## Updated channels.ts:
Fix 1: Removed mimeType: 'video/mp4' from the fileData object in fetchViaGeminiVideo. This allows Gemini to infer the correct MIME type directly from the YouTube URL, preventing potential API rejection.
Verified model names against the guidelines (retained gemini-flash-latest and gemini-3-flash-preview).
Updated App.tsx:
Connected the getTranscript function from channels.ts to the form submission.
Added file upload handling for the manual .srt/.vtt channel.
Implemented the transcript display view, including:
RTL (Right-to-Left) text support.
Timestamp toggling.
Copy to clipboard and Download functionality.
Source indicator (e.g., "via gemini-video").

--

## Smoke Test Checklist

### Test 1: Basic YouTube URL
- Paste: https://www.youtube.com/watch?v=dQw4w9WgXcQ
- Language: English
- Hit Grab
- Expected: transcript appears, source indicator shows which channel worked
- Check: timestamps toggle works?

### Test 2: Arabic video
- Paste any Arabic YouTube video URL you know
- Language: Arabic (default)
- Hit Grab
- Expected: RTL text displays correctly, readable

### Test 3: Manual upload
- Find any .srt file online (or create a 3-line test one)
- Upload via file input
- Expected: parsed and displayed, source shows "manual-upload"

### Test 4: Copy + Download
- After any successful grab
- Tap Copy → paste somewhere → verify text
- Tap Download → check .txt file opens correctly

### Test 5: Error handling
- Paste: https://www.youtube.com/watch?v=INVALID123
- Expected: graceful error message, not a crash

--

All 3 channels confirmed working:

Test	Channel	Result
Arabic children's story	GEMINI-VIDEO	✅ Perfect Arabic transcript
Linkin Park (English song)	GEMINI-VIDEO	⚠️ Translated to Arabic instead of transcribing
Manual .srt upload	MANUAL-UPLOAD	✅ Perfect
Mobile view	—	✅ Clean, responsive
Waterfall logs	Ch3→Ch1	✅ Timedtext failed, Gemini caught it

--

# Task 4 — UI Refinement (App.tsx only)

Do NOT rewrite the app. Only add/fix these items:

## 1. Language Selector
- Add a dropdown between the URL input and Grab button
- Options: "Arabic" (default), "English", "Original Language" 
- "Original Language" should pass "auto" to getTranscript
- Pass selected language to getTranscript(videoId, lang)

## 2. Improve Gemini prompt behavior
- In channels.ts, for fetchViaGeminiVideo:
  - If lang is "auto": prompt says "Transcribe in the original spoken language"
  - If lang is "ar" or "en": prompt says "Transcribe in {lang}"
  - Add: "Do NOT translate. Transcribe exactly what is spoken."

## 3. Status message
- While loading, show "Trying timedtext..." → "Trying Gemini..." 
  (use a callback or state update from the router)

## Do NOT change: parser.ts, utils.ts, types.ts, file structure

~~~
> Block 3 — Channel Implementations

# Task: Create channels.ts

Import GoogleGenAI from "@google/genai". Use process.env.API_KEY.

## Channel 1: Gemini Video
```ts
async function fetchViaGeminiVideo(videoId: string, lang: string): Promise<TranscriptResult>
```

- Use Gemini model with fileData pointing to YouTube URL
- Prompt: "Transcribe this video's audio to text in {lang}. Return each line with its timestamp in [MM:SS] format. Return ONLY the transcript, no commentary."
- Parse response into TranscriptLine[]

## Channel 2: Gemini Search
```ts
async function fetchViaGeminiSearch(videoId: string, lang: string): Promise<TranscriptResult>
```
- Use googleSearch tool
- Prompt: "Find the full transcript or captions for this YouTube video: https://youtube.com/watch?v={videoId}. Return in {lang} with timestamps if available. Return ONLY the transcript text."
- Parse response into TranscriptLine[]

## Channel 3: Timedtext Scrape
```ts
async function fetchViaTimedtext(videoId: string, lang: string): Promise<TranscriptResult>
```
- Fetch via CORS proxy: https://corsproxy.io/?https://www.youtube.com/api/timedtext?v={videoId}&lang={lang}
- Parse XML response into TranscriptLine[]
- If lang fails, try without lang param (auto-detect)

### Channel Router
```ts
async function getTranscript(videoId: string, lang: string, manualFile?: File): Promise<TranscriptResult>
```
- Follow priority: manual → Ch3 → Ch1 → Ch2
- Catch errors per channel, try next
- Attach source name to result
- Throw final error only if ALL channels fail
- Export router + individual channels (for testing).


## Smoke Test Checklist

### Test 1: Basic YouTube URL
- Paste: https://www.youtube.com/watch?v=dQw4w9WgXcQ
- Language: English
- Hit Grab
- Expected: transcript appears, source indicator shows which channel worked
- Check: timestamps toggle works?

### Test 2: Arabic video
- Paste any Arabic YouTube video URL you know
- Language: Arabic (default)
- Hit Grab
- Expected: RTL text displays correctly, readable

### Test 3: Manual upload
- Find any .srt file online (or create a 3-line test one)
- Upload via file input
- Expected: parsed and displayed, source shows "manual-upload"

### Test 4: Copy + Download
- After any successful grab
- Tap Copy → paste somewhere → verify text
- Tap Download → check .txt file opens correctly

### Test 5: Error handling
- Paste: https://www.youtube.com/watch?v=INVALID123
- Expected: graceful error message, not a crash
---

**Block 4 — UI**

# Task: Create App.tsx and style.css

## App.tsx — React component, single screen

### Layout (top to bottom)
1. **Header** — app name + one-line description (Arabic + English)
2. **Input section**
   - URL text input (placeholder: "paste YouTube link here")
   - Language selector: Arabic (default), English, Auto-detect
   - Timestamps toggle switch
   - "Get Transcript" button
   - OR divider
   - File upload dropzone (.srt/.vtt) — small, secondary
3. **Status bar** — shows: loading spinner / channel used / error message
4. **Transcript display area**
   - Auto RTL/LTR based on content
   - Each line: optional timestamp + text
   - Scrollable container
5. **Action bar** (sticky bottom on mobile)
   - Copy button
   - Download .txt button

### Behavior
- On submit: call getTranscript from channels.ts
- Show which channel succeeded in status bar
- Disable input during loading
- Error: show friendly message with retry button
- Empty state: brief instructions in Arabic

## style.css
- Mobile-first, max-width 600px centered
- RTL support: dir="auto" on transcript container
- System font stack, clean spacing
- Dark/light: respect prefers-color-scheme
- Action bar: sticky bottom, blurred background
- Loading: simple pulse animation on status bar
- No external CSS frameworks

> Block 5 — Tests

# Task: Add inline test suite

Create a test section at the bottom of App.tsx or a separate test.ts.
Use simple console.assert style (no framework needed in AI Studio).

## Unit Tests

### utils.ts
- extractVideoId: test all formats
  - "https://www.youtube.com/watch?v=dQw4w9WgXcQ" → "dQw4w9WgXcQ"
  - "https://youtu.be/dQw4w9WgXcQ" → "dQw4w9WgXcQ"
  - "https://youtube.com/embed/dQw4w9WgXcQ" → "dQw4w9WgXcQ"
  - "https://m.youtube.com/watch?v=dQw4w9WgXcQ" → "dQw4w9WgXcQ"
  - "not a url" → null
  - "" → null
- isRTL: "مرحبا" → true, "hello" → false, "hello مرحبا" → true
- formatTranscriptForExport: with/without timestamps

### parser.ts
- parseSRT: standard 3-entry SRT string → 3 TranscriptLine objects
- parseVTT: with WEBVTT header → correct parse
- Handle empty string → empty array
- Handle malformed input → no crash, partial result

### channels.ts (smoke only)
- extractVideoId returns valid ID before channel call
- Channel router returns result with source field populated
- Manual file channel works with mock .srt content

## How to run
- Add a "Run Tests" button (hidden behind a ?test=true URL param)
- Results logged to console + displayed in a modal

> Block 6 — README / User Docs

# Task: Create a README displayed as an info/help modal in the app

## Content (bilingual: Arabic primary, English secondary)

### What is this?
Tool to extract text transcripts from YouTube videos.

### How to use
1. Paste any YouTube link
2. Choose language (Arabic is default)  
3. Tap "Get Transcript"
4. Copy or download the result

### Alternative: Upload subtitles
- If you have an .srt or .vtt file, drop it in the upload area
- App will format and display it

### Supported
- YouTube public videos
- Arabic, English, auto-detect
- Auto-generated and manual captions

### Not supported (yet)
- Private/unlisted videos
- Non-YouTube platforms
- Videos with no audio/captions at all

### Troubleshooting
- "No transcript found" → video may not have captions. Try "Auto-detect" language.
- Slow? → first channel may have timed out, app tries alternatives automatically.
- Wrong language? → switch language selector and retry.

### Privacy
- No data stored. Everything runs in your browser + Google's Gemini API.
- No tracking, no accounts, no cookies.
~~~

# Context
Read PLAN.md. All files are complete and working.
Do NOT modify: channels.ts, parser.ts, utils.ts, types.ts

# Task 5+6 — Tests and Help Modal

## Part A: Test Runner (test.ts)

Create test.ts. Only runs when URL has ?test=true param.

### Tests for utils.ts
- extractVideoId: 
  - standard watch URL → correct ID
  - youtu.be short → correct ID
  - embed URL → correct ID
  - mobile URL → correct ID
  - invalid string → null
  - empty string → null
- isRTL: "مرحبا" → true, "hello" → false
- formatTranscriptForExport: verify timestamps included/excluded

### Tests for parser.ts
- parseSRT: 3-entry SRT string → 3 lines with correct timestamps
- parseVTT: with WEBVTT header → correct parse
- empty string → empty array
- malformed input → no crash

### Test UI
- Add "Run Tests" button only visible when ?test=true
- Results: green ✅ / red ❌ per test, displayed in a simple list
- Also log all results to console

## Part B: Help Modal (in App.tsx)

Add a small "?" icon button in the header.
On tap, show a modal/overlay with:

### Content (Arabic + English)

**ما هذا التطبيق؟ / What is this?**
أداة لاستخراج النصوص من فيديوهات يوتيوب
Tool to extract text transcripts from YouTube videos.

**كيف تستخدمه؟ / How to use**
1. الصق رابط يوتيوب / Paste YouTube link
2. اختر اللغة / Choose language
3. اضغط "Grab" / Tap Grab
4. انسخ أو حمّل النتيجة / Copy or download

**بديل: رفع ملف ترجمة / Alternative: Upload subtitles**
يمكنك رفع ملف .srt أو .vtt مباشرة

**الخصوصية / Privacy**
لا نخزن أي بيانات. كل شيء يعمل في متصفحك.
No data stored. Runs in your browser + Gemini API.

### Modal behavior
- Close on X button, outside click, or Escape key
- Simple overlay, no animation needed
- Mobile friendly (full width on small screens)

--

## Final Smoke Tests

### Help Modal
- [ ] "?" button visible in header
- [ ] Tap → modal opens with Arabic + English text
- [ ] Close via X button
- [ ] Close via outside click
- [ ] Close via Escape key
- [ ] Readable on mobile

### Test Runner
- [ ] Open app with ?test=true in URL
- [ ] "Run Tests" button appears
- [ ] Tap → tests execute
- [ ] Green/red results displayed
- [ ] Console shows all results
- [ ] Remove ?test=true → button hidden

### Regression (nothing broken)
- [ ] YouTube URL + Arabic still works
- [ ] YouTube URL + English still works
- [ ] YouTube URL + Original Language works
- [ ] Manual .srt upload still works
- [ ] Copy button works
- [ ] Download button works
- [ ] Hide Time toggle works
- [ ] Mobile responsive

--


