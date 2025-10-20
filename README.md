# 🚀 AI Sales Echo

**Next-Gen Voice AI Consultant for Sales Automation and Lead Qualification**

AI Sales Echo is a web application powered by Google Gemini Live API that provides real-time voice interactions with clients, qualifies leads, and automatically sends requests to Telegram.

## ✨ Features

- 🎤 **Real-time Voice Communication** - powered by Google Gemini 2.5 Flash Audio
- 🎯 **Automatic Lead Qualification** - quality assessment (hot/warm/cold)
- 💬 **Telegram Integration** - instant lead delivery to manager with full conversation transcript
- 🌐 **Google Search Grounding** - real-time web search for accurate, up-to-date information
- 🔗 **URL Context Analysis** - analyze competitor websites on-demand during conversations
- 🧠 **Thinking Mode** - deep reasoning for complex queries with configurable budget
- 🌡️ **Temperature Control** - adjustable creativity vs accuracy (0-2 range)
- 🎙️ **Voice Activity Detection (VAD)** - natural conversation flow with automatic turn-taking
- 📄 **Telegraph Transcript Publishing** - permanent conversation history shared with manager
- 🌍 **24/7 Availability** - no breaks, no holidays
- 🎨 **AI Visualization** - interactive 3D sphere responding to voice
- 📊 **Contact Collection** - name, company, phone, interests, preferred time

## 🛠 Technologies

- **Frontend:** React 19, TypeScript, Vite
- **AI:** Google Gemini Live API (Multimodal Audio, Native Audio Models)
- **AI Tools:** Google Search Grounding, URL Context, Function Calling
- **State Management:** Zustand
- **Backend:** Telegram Bot API, Telegraph API (transcript publishing)
- **Audio:** Web Audio API, AudioWorklet (16kHz input, 24kHz output)

## 📋 Requirements

- Node.js (v18+)
- Google Gemini API Key
- Telegram Bot Token (optional)
- Telegraph Access Token (optional, for transcript publishing)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create `.env.local` file in the root:

```bash
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_MANAGER_CHAT_ID=your_telegram_chat_id
```

Create `bot/.env` file for the Telegram bot:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_MANAGER_CHAT_ID=your_telegram_chat_id

# Telegraph API (for transcript publishing)
TELEGRAPH_ACCESS_TOKEN=your_telegraph_token_here
```

### 3. Start Web Application

```bash
npm run dev
```

Application will be available at: http://localhost:3000

### 4. Start Telegram Bot (optional)

```bash
cd bot
npm install
npm start
```

## 📁 Project Structure

```
ai-sales-echo/
├── components/          # React components
│   ├── console/        # Controls (connect/mic buttons)
│   ├── demo/           # Main components (StreamingConsole, PopUp)
│   ├── visualizer/     # 3D audio visualization
│   └── Header.tsx, Sidebar.tsx
├── hooks/              # React hooks
│   └── media/
│       └── use-live-api.ts  # Core Live API logic
├── lib/
│   ├── genai-live-client.ts  # WebSocket client for Gemini
│   ├── audio-recorder.ts     # Microphone capture (16kHz PCM16)
│   ├── audio-streamer.ts     # Audio playback (24kHz)
│   ├── state.ts             # Zustand store (settings, tools, logs)
│   ├── constants.ts         # Model definitions
│   ├── tools/               # Function calling templates
│   │   └── customer-support.ts
│   └── telegram-helper.ts   # Telegram & Telegraph integration
├── bot/                # Telegram bot
│   ├── index.js        # Main bot file with bidirectional messaging
│   ├── .env            # Bot environment variables (private)
│   └── package.json
├── public/
│   └── knowledge-base/ # Company knowledge base
├── .env.local          # Frontend environment variables
└── CLAUDE.md           # Development guidelines for Claude Code
```

## 🎯 How It Works

### Client Interaction Flow

1. **Client opens application** → sees welcome popup
2. **Clicks "Start Conversation"** → voice AI connects
3. **Conversation with AI consultant** → discusses interests, can ask to analyze competitor websites
4. **AI collects data:**
   - Client name
   - Company (optional)
   - Phone (optional)
   - Interests
   - Preferred contact time
   - Lead quality (hot/warm/cold)
5. **AI calls `sendToTelegram` function** → sends lead to manager
6. **Client receives button** → "Send to Manager via Telegram"
7. **On click:**
   - Full conversation transcript published to Telegraph
   - Lead sent to manager via HTTP API with Telegraph link
   - Deep link generated for Telegram bot
   - Client redirected to Telegram
   - Bot captures Telegram username
   - Manager receives complete lead info with contact

### AI Capabilities

**Google Search Grounding:**
```typescript
tools: [
  { googleSearch: {} }, // Real-time web search for current information
]
```

**URL Context Analysis:**
```typescript
tools: [
  { urlContext: {} }, // Analyze competitor websites on-demand
]
```

**Function Calling:**
```typescript
{
  name: 'sendToTelegram',
  description: 'Send qualified lead to manager',
  parameters: {
    customerName: { type: 'STRING' },
    company: { type: 'STRING' },
    phone: { type: 'STRING' },
    interest: { type: 'STRING' },
    preferredTime: { type: 'STRING' },
    leadQuality: { type: 'STRING', enum: ['hot', 'warm', 'cold'] }
  },
  required: ['customerName', 'interest']
}
```

**Thinking Mode:**
```typescript
generationConfig: {
  thinkingConfig: {
    thinkingBudget: -1, // Dynamic thinking for complex queries
  },
}
```

## 🎨 UI/UX Features

- **Split-layout:** Chat on left, visualization on right
- **Responsive design:** Works on desktop and mobile
- **3D visualization:** Reacts to voice volume
- **Minimalist popup:** Focus on call-to-action
- **Branded design:** Gradients, Space Mono font
- **Settings sidebar:** Model selection, temperature control, tool configuration

## 🔧 Configuration

### Model Selection

Choose from available models in [lib/constants.ts](lib/constants.ts):
- `gemini-2.5-flash-native-audio-preview-09-2025` - Latest, fastest (recommended)
- `gemini-2.0-flash-live-001` - Previous generation, stable

### Temperature Control

Adjust via sidebar (0-2 range):
- **0-0.5:** 🎯 Focused (reliable function calls)
- **0.5-1.0:** ⚖️ Balanced
- **1.0-1.5:** 🎨 Creative
- **1.5-2.0:** 🚀 Very Creative

### System Prompt

Edit [lib/state.ts](lib/state.ts), `systemPrompts` section:

```typescript
const systemPrompts: Record<Template, string> = {
  'customer-support': `You are a professional consultant...`,
};
```

### Company Knowledge Base

Edit [public/knowledge-base/keabank.md](public/knowledge-base/keabank.md)

### Function Declarations

Configure in [lib/tools/customer-support.ts](lib/tools/customer-support.ts)

## 📝 Scripts

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run preview  # Preview production build

# Telegram bot
cd bot
npm start        # Start bot
npm run stop     # Stop all instances
npm run restart  # Restart bot
npm run status   # Check status
```

## 🐛 Troubleshooting

### Telegram Bot Not Responding

Check [bot/TROUBLESHOOTING.md](bot/TROUBLESHOOTING.md)

### 409 Conflict Error

Stop all bot instances:

```bash
cd bot
npm run stop
rm bot.pid
npm start
```

### Session Ends Immediately After Connecting

- Check `thinkingConfig` syntax in [StreamingConsole.tsx](components/demo/streaming-console/StreamingConsole.tsx)
- Ensure using nested object: `thinkingConfig: { thinkingBudget: -1 }`
- Verify model supports native audio (check [constants.ts](lib/constants.ts))

### Grounding/Search Not Working

- Confirm tools array includes: `{ googleSearch: {} }` and `{ urlContext: {} }`
- Check official docs: https://ai.google.dev/gemini-api/docs/google-search

## 🆕 Recent Updates

- ✅ **Google Search Grounding** - Real-time web search integration
- ✅ **URL Context Tool** - Competitor website analysis
- ✅ **Thinking Mode** - Deep reasoning with dynamic budget
- ✅ **Temperature Control** - Adjustable creativity (0-2 range)
- ✅ **Telegraph Integration** - Permanent transcript publishing
- ✅ **English Translation** - All system messages in English
- ✅ **Model Selection** - Two verified working models

## 📄 License

Apache-2.0

## 👨‍💻 Author

Built with Google AI Studio and Gemini Live API

---

**🔥 Production-ready!**
