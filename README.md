# 📄 TranscriptGrab — YouTube Transcript Professional

**TranscriptGrab** is a high-performance, mobile-first web application designed to extract, display, and export YouTube video transcripts. It features deep support for Arabic and a robust multi-channel fallback system to ensure maximum reliability even when official captions are missing.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![GitHub Pages](https://img.shields.io/badge/Live-Demo-brightgreen.svg)](https://socialawy.github.io/TranscriptGrab/)

---

### **✨ Features / المميزات**

| Feature | الوصف | Description |
|---------|-------|-------------|
| **YouTube Extraction** | استخراج النصوص من روابط يوتيوب | High-fidelity extraction from any YouTube URL |
| **Multi-Language** | دعم العربية، الإنجليزية، والكشف التلقائي | Arabic, English, and Auto-detection support |
| **Manual Upload** | رفع ملفات الترجمة (.srt / .vtt) يدوياً | Support for .srt and .vtt file parsing |
| **Timestamps** | إظهار/إخفاء الطوابع الزمنية | Toggle granular timestamps |
| **Export Options** | نسخ النص أو تحميله كملف .txt | One-click copy and .txt export |
| **RTL Support** | واجهة تدعم الكتابة من اليمين لليسار | Full Native RTL layout for Arabic users |
| **Privacy First** | لا يتم تخزين أي بيانات | No data storage, runs entirely in-browser |

---

### **🚀 How to Use / كيفية الاستخدام**

1.  **Paste URL**: Copy a YouTube link and paste it into the primary input.
2.  **Select Language**: Choose Arabic (default), English, or Original.
3.  **Grab**: Click the button to initiate the multi-channel capture.
4.  **Export**: Use the results area to copy to clipboard or download.

---

### **🛠️ Architecture & Strategy**

TranscriptGrab uses a sophisticated **Waterfall Strategy** to fetch transcripts:
1.  **Manual Upload**: Checks for user-provided subtitle files.
2.  **Timedtext**: Attempts to scrape official YouTube captions (Zero cost).
3.  **Gemini Video (Multimodal)**: Utilizes `gemini-flash-latest` to transcribe directly from video frames/audio.
4.  **Gemini Search**: Uses Google Search grounding as a final reliable fallback.

---

### **💻 Development**

```bash
# Clone the repository
git clone https://github.com/socialawy/TranscriptGrab.git

# Install dependencies
npm install

# Run the development server
npm run dev
```

*Note: Requires a `GEMINI_API_KEY` in your environment or `.env.local` file.*

---

### **📄 License**

MIT License. Free to use and modify.
مفتوح المصدر. حر للاستخدام والتعديل.

---
Developed by [socialawy](https://github.com/socialawy)
Planning & architecture by Claude, built with Google AI Studio.