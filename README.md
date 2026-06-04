# Universal AI Desktop Agent v2.0

A screen-aware AI assistant that runs on your desktop, reads browser tabs via DOM extraction, and sends content to Groq LLM for instant explanations, solutions, code reviews, and more.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🌐 Browser DOM Reading | Extracts content from active browser tabs (perfect for LeetCode, docs, etc.) |
| 🖥️ Screen Fallback | Screenshot capture for non-web content |
| 🤖 AI Modes | Explain · Summarize · Teach · Code Review · Practice |
| ⌨️ Global Hotkeys | Ctrl+Shift+A (analyze) · Ctrl+Shift+C (capture) · Ctrl+Shift+H (toggle) · Ctrl+Shift+R (refresh) |
| 🗃️ History | SQLite session memory |
| 📦 Tray Mode | Invisible overlay — perfect for Teams meetings |
| 🔒 Privacy | Manual activation only — no continuous capture |
| 🏗️ Cross-platform | Windows · macOS · Linux |

---

## 🚀 Quick Start (Local)

### Prerequisites
- [Node.js 20+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- A [Groq API key](https://console.groq.com/keys)
- Chrome, Edge, or Brave browser (for tab reading)

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

Open `.env` and replace `your_groq_api_key_here` with your real key:
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.1-70b-versatile
```

### 3. Run

```bash
npm start
```

The app opens in the top-right corner of your screen.

### 4. Enable Browser Tab Reading (Optional but Recommended)

For reading browser tabs (LeetCode, docs, etc.), your browser needs to have remote debugging enabled:

**Chrome / Edge / Brave:**
```bash
# Windows
chrome.exe --remote-debugging-port=9222

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

Or, launch your browser normally and the app will try to read the active tab when you click "Analyze".

> 💡 **Tip:** When in a Teams/Zoom meeting, activate the invisible assistant overlay and open LeetCode or any website. Press `Ctrl+Shift+A` to get solutions without showing your screen to others!

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
│   ├── browser/
│   │   └── domExtractor.js  # Browser DOM extraction (Playwright)
│   ├── agent/
│   │   └── llm.js           # Groq API integration (OpenAI-compatible)
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
| **Groq** | LLM responses (required) | [console.groq.com/keys](https://console.groq.com/keys) |

**Cost estimate:** Groq offers free tier with generous rate limits. Using `llama-3.1-70b-versatile`, minimal cost for most personal use.

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

- Browser content and screenshots are read **only when you press the hotkey** — no background monitoring
- Content extraction happens locally (Playwright reads your browser's DOM)
- Browser content and context are sent to Groq's API only when you explicitly trigger analysis
- All history stored locally in SQLite
- Use "Clear History" from the tray menu to wipe all stored data
- Invisible overlay window won't be captured by screen sharing (e.g., Teams meetings)
