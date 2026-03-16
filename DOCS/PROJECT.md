# TranscriptGrab — Project Document v1.0
# Last Updated: February 13, 2026

---

## Status: ✅ v1 Complete and Working

---

## What It Is
Web app for extracting video transcripts from YouTube.
Built for non-technical Arabic-speaking users on Android.
Hosted on Google AI Studio, zero setup required.

---

## Tech Stack
- React + TypeScript
- @google/genai SDK (free tier, auto API key)
- Google AI Studio hosting
- No backend, no external dependencies

---

## File Structure
| File | Purpose | Status |
|------|---------|--------|
| PLAN.md | This document | ✅ |
| types.ts | Shared interfaces | ✅ |
| utils.ts | URL parsing, clipboard, download, RTL detection | ✅ |
| parser.ts | .srt/.vtt file parsing | ✅ |
| channels.ts | Transcript fetching (3 channels + router) | ✅ |
| App.tsx | Main UI component | ✅ |
| test.ts | Unit tests (?test=true) | ✅ |
| style.css | Styling (mobile-first, RTL) | ✅ |
| index.html | Entry point | ✅ |

---

## Channel Architecture

### Priority Waterfall
```text
Manual File → Ch3 (timedtext) → Ch1 (Gemini Video) → Ch2 (Gemini Search)
```
### Channel Details
Ch	Name	Method	Cost	Reliability
4	Manual Upload	.srt/.vtt file parse	Zero	User-dependent
3	Timedtext	CORS proxy + YouTube XML	Zero	Fragile
1	Gemini Video	fileData.fileUri + transcribe prompt	High	Strong
2	Gemini Search	googleSearch grounding + prompt	Medium	Good fallback

### Language Handling
- Arabic (default), English, Original Language (auto)
- Prompt includes "Do NOT translate. Transcribe exactly what is spoken."
- Auto mode: "Transcribe in the original spoken language"

## v1 Features
 Single YouTube URL input
 Language selector (AR / EN / Auto)
 Timestamps toggle
 RTL-aware transcript display
 Copy to clipboard
 Download as .txt
 Manual .srt/.vtt upload
 Channel status indicator
 Loading status per channel attempt
 Help modal (Arabic + English)
 Unit tests (?test=true)
 Mobile-first responsive design
 Dark/light theme support
 
### Known Limitations
- Private/unlisted videos: not supported
- Very long videos (3+ hrs): may hit Gemini quota
- Timedtext channel: depends on CORS proxy uptime
- Gemini transcription: not guaranteed to match official captions exactly
- No offline support yet

## Future Roadmap (designed for, not built)

### Phase 2 — Enhanced Output
 Translation toggle (AR ↔ EN)
 Summarization mode ("key points")
 Export formats: .srt, .vtt, .pdf
 Keyword search within transcript

### Phase 3 — Scale
 Batch URLs (paste multiple)
 Non-YouTube platforms (Twitter/X, TikTok, Vimeo)
 YouTube Data API v3 integration (official, OAuth)

### Phase 4 — Offline / PWA
 PWA install (Android home screen)
 Whisper WASM (in-browser offline transcription)
 Web Speech API (live transcription while video plays)
### Phase 5 — Power Features
 Speaker diarization (who said what)
 Transcript editing in-app
 Share transcript as link
 Browser extension version

## Build Log
Date	Task	Method	Notes
2026-02-13	Planning + research	Claude + Grok + GPT	Channel strategy, feasibility
2026-02-13	Block 1: types + utils	AI Studio (Gemini 3 Pro)	Clean first pass
2026-02-13	Block 2: parser	AI Studio (reset)	SRT/VTT parsing
2026-02-13	Block 3: channels	AI Studio (reset)	Core logic, waterfall router
2026-02-13	Block 4: UI	AI Studio (agent raced ahead)	Worked despite skipping order
2026-02-13	Fix: language selector	AI Studio (same session)	Added AR/EN/Auto dropdown
2026-02-13	Block 5+6: tests + help	AI Studio (same session)	Both delivered in one pass

## How to Maintain
- Adding a new channel
- Create async function in channels.ts following existing pattern
- Return TranscriptResult with unique source name
- Add to waterfall in getTranscript() router
- UI auto-displays source — no App.tsx change needed
- Adding a new language
- Add option to language dropdown in App.tsx
- Pass lang code to getTranscript — channels handle it

### Debugging
Open browser console
Each channel attempt logs: "Attempting {name}..."
Failures log: "{name} failed: {reason}"
Add ?test=true to URL for unit tests

## Archive Note
Previous DEVLOG.md drafts from build session are superseded by this document.
All task checklists (Tasks 1-6) are complete and archived in build history.

## Credits
Planning & architecture: Claude (Anthropic) via Outlier Playground
Research: Grok (X/Twitter), GPT (OpenAI)
Build & hosting: Google AI Studio (Gemini 3 Pro Preview)
Design: Collaborative human-AI workflow