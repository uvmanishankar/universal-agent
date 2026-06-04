# Universal AI Desktop Agent v2.0

A screen-aware AI assistant that runs on your desktop, captures your screen, extracts text via OCR, and sends it to an LLM for instant explanations, summaries, code reviews, and more.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🖥️ Screen Capture | Full-screen capture with one hotkey |
| 🔤 OCR | Tesseract.js — no cloud needed for text extraction |
| 🤖 AI Modes | Explain · Summarize · Teach · Code Review · Practice |
| ⌨️ Global Hotkeys | Ctrl+Shift+A/H/C/R |
| 🗃️ History | SQLite session memory |
| 📦 Tray Mode | Lives in system tray |
| 🔒 Privacy | Manual activation only — no continuous capture |
| 🏗️ Cross-platform | Windows · macOS · Linux |

---

## 🚀 Quick Start (Local)

### Prerequisites
- [Node.js 20+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- An [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Clone & Install

```bash
git clone https://github.com/uvmanishankar/universal-ai-agent.git
cd universal-ai-agent
npm install
```

### 2. Configure API Key

```bash
# Copy the example env file
cp .env.example .env
```

Open `.env` and replace `your_openai_api_key_here` with your real key:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini        # or gpt-4o for higher quality
```

### 3. Run

```bash
npm start
```

The app opens in the top-right corner of your screen.

---

## ⌨️ Hotkeys

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+A` | Capture screen + Analyze |
| `Ctrl+Shift+H` | Hide / Show window |
| `Ctrl+Shift+C` | Capture only (no AI) |
| `Ctrl+Shift+R` | Refresh window context |

---

## 🤖 AI Modes

| Mode | What it does |
|---|---|
| **Explain** | Breaks down what's on screen in plain language |
| **Summarize** | Gives a concise summary of visible content |
| **Teach Me** | Explains concepts step-by-step as a teacher |
| **Code Review** | Reviews visible code for bugs/improvements |
| **Practice** | Generates a coding exercise from the context |

You can also type any custom prompt in the input box.

---

## 📦 Build (Distributable)

```bash
# Windows installer
npm run build:win

# macOS DMG
npm run build:mac

# Linux AppImage
npm run build:linux

# All platforms
npm run build
```

Output in the `dist/` folder.

---

## 🗂️ Project Structure

```
universal-ai-agent/
├── src/
│   ├── main/
│   │   ├── main.js          # Electron entry, IPC, shortcuts, tray
│   │   └── preload.js       # Secure context bridge
│   ├── capture/
│   │   └── capture.js       # Screenshot + preprocessing (Sharp)
│   ├── context/
│   │   └── windowDetector.js # Active window detection (Win/Mac/Linux)
│   ├── ocr/
│   │   └── ocr.js           # Tesseract.js OCR pipeline
│   ├── agent/
│   │   └── llm.js           # OpenAI API integration
│   └── memory/
│       └── db.js            # SQLite session history
├── assets/
│   └── index.html           # UI (vanilla JS + CSS)
├── .env.example             # Environment variable template
├── package.json
└── README.md
```

---

## 🔑 API Keys Required

| Service | Purpose | Where to get |
|---|---|---|
| **OpenAI** | LLM responses (required) | [platform.openai.com](https://platform.openai.com/api-keys) |

**Cost estimate:** Using `gpt-4o-mini`, roughly 0.01–0.05 USD per analysis depending on screen content length.

---

## 🖥️ Platform Notes

### Windows
- Active window detection uses PowerShell (built-in, no extra install)
- Tested on Windows 10/11

### macOS
- Requires Screen Recording permission: System Preferences → Privacy & Security → Screen Recording → Enable for Universal AI Agent
- Active window detection uses AppleScript (built-in)

### Linux
- Requires `xdotool`: `sudo apt install xdotool`
- Or `wmctrl`: `sudo apt install wmctrl`

---

## 🛣️ Roadmap (V3)

- [ ] Voice input (Whisper API)
- [ ] Local model support (Ollama)
- [ ] Semantic search over history (vector memory)
- [ ] Multi-monitor support
- [ ] Agent plugins system
- [ ] GPU acceleration

---

## 🔒 Privacy

- Screen is captured **only when you press the hotkey** — no background monitoring
- OCR and context are sent to OpenAI's API only when you explicitly trigger analysis
- All history stored locally in SQLite
- Use "Clear History" from the tray menu to wipe all stored data
