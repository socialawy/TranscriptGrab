# Agent Info: TranscriptGrab

## Project Overview
A high-performance YouTube transcript extraction tool built with React and TypeScript. Uses a "Waterfall Strategy" for maximum reliability.

## Important Accounts
- **GitHub Owner**: `socialawy-dev`
- **Primary Contact**: `ahmed.itc@gmail.com`

## Tech Stack
- **Framework**: React 19 & Vite
- **Language**: TypeScript
- **AI**: Gemini API (`@google/genai`) for multi-modal transcription.

## Core Logic
- `App.tsx`: Main UI and state.
- `channels.ts`: Implements the fetching strategy (Timedtext -> Gemini Video -> Gemini Search).

## Guidelines for Jules
1. **Waterfall Strategy**: New fetching methods should be integrated into the fallback logic in `channels.ts`.
2. **RTL Support**: All UI components must support Arabic (RTL).
3. **API Key**: Gemini API key is managed via `VITE_GEMINI_API_KEY`.
4. **Base Path**: The app is hosted on GitHub Pages at `/TranscriptGrab/`.

## Current Goals
- Export to more formats (PDF, DOCX).
- Direct integration with Notion/Evernote.
- Real-time video-to-text preview.
