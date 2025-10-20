# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 MAIN DEVELOPMENT RULE: YAGNI (You Ain't Gonna Need It)

**NO OVER-ENGINEERING!** This application was created in Google AI Studio and must remain simple.

Principles:
- **Simple solution is always better than complex**
- **Don't add features "for the future"**
- **Use existing Gemini API directly** - no need for local models, proxy servers, or alternative solutions
- **Minimum abstractions** - code should be immediately understandable
- **If it works - don't touch it**
- **New dependencies only when absolutely necessary**

## ⚠️ MANDATORY CHANGE IMPLEMENTATION PROCESS

**NEVER add code immediately!** Always follow this process:

1. **DISCUSSION**: First discuss the idea with the user
   - Explain how it will work
   - What changes will be required
   - What risks and limitations exist

2. **DOCUMENTATION CHECK**: Verify official Gemini API documentation
   - Ensure the feature is supported
   - Find correct syntax and examples
   - Check compatibility with Live API and current model

3. **IMPLEMENTATION**: Only after user approval and documentation verification
   - Use exact syntax from documentation
   - Test after each change
   - If something breaks - rollback changes

## Project Overview

AI Sales Echo is an AI Business Consultant web application built with React and TypeScript that provides real-time voice interactions using Google's Gemini Live API. The app demonstrates live audio streaming with bidirectional communication between the user and an AI assistant configured with company knowledge.

## Development Commands

**Web Application:**
- **Install dependencies**: `npm install`
- **Start development server**: `npm run dev` (runs on port 3000)
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`

## Environment Setup

Create `.env.local` in project root with:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here
```

All frontend environment variables are injected at build time via Vite's `define` config in [vite.config.ts](vite.config.ts:14).

## Architecture

### Core System Components

**GenAILiveClient** (`lib/genai-live-client.ts`):
- WebSocket-based client for Google's Gemini Live API
- Manages connection lifecycle (connect/disconnect/send/receive)
- Emits typed events: `open`, `close`, `audio`, `content`, `toolcall`, `turncomplete`, `interrupted`, `inputTranscription`, `outputTranscription`
- Uses EventEmitter pattern with composition (not inheritance)

**useLiveApi Hook** (`hooks/media/use-live-api.ts`):
- React hook that manages LiveAPI client lifecycle
- Handles bidirectional audio streaming setup
- Implements tool calling system with **one active function**:
  - `getCompanyInfo`: Retrieves company information from knowledge base files in `public/knowledge-base/`
- Logs all function calls and responses to the conversation store
- Function execution timeout: 10 seconds

**LiveAPIContext** (`contexts/LiveAPIContext.tsx`):
- React Context Provider that exposes LiveAPI functionality throughout the component tree
- Must wrap application root for live API features to work

### Audio System

**AudioRecorder** (`lib/audio-recorder.ts`):
- Captures microphone input using Web Audio API
- Converts audio to base64-encoded PCM16 format at 16kHz sample rate
- Uses AudioWorklet for real-time audio processing
- Emits `data` events with base64 audio chunks and `volume` events for VU meter

**AudioStreamer** (`lib/audio-streamer.ts`):
- Plays incoming PCM16 audio from the AI
- Manages audio queue and scheduling to prevent gaps/stuttering
- Supports worklet-based audio processing (e.g., VU meters)
- Sample rate: 24kHz, buffer size: 7680 samples

**Audio Worklets** (`lib/worklets/`):
- `audio-processing.ts`: Processes microphone input, converts float32 to int16
- `vol-meter.ts`: Calculates volume levels for visualization

**Audio Data Flow**:
```
Microphone → AudioRecorder (PCM16 @ 16kHz)
          → GenAILiveClient.sendRealtimeInput()
          → Gemini Live API (WebSocket)
          → GenAILiveClient 'audio' event
          → AudioStreamer (PCM16 @ 24kHz)
          → Speakers
```

### State Management

Uses Zustand stores in `lib/state.ts`:

**useSettings**:
- Model selection (default: `gemini-2.5-flash-native-audio-preview-09-2025`)
- Voice configuration (32 available voices, default: `Zephyr`)
- System prompt (template-based)
- Temperature control (0-2 range) - **Note: currently not exposed in UI**

**useTools**:
- Tool/function definitions
- Templates: `customer-support` (active), `personal-assistant` (empty), `navigation-system` (empty)
- Toggle, add, remove, update tool functions

**useUI**:
- Sidebar visibility state

**useLogStore**:
- Conversation history with roles: `user`, `agent`, `system`
- Stores transcriptions, tool calls, and grounding metadata
- ConversationTurn interface: `{ timestamp, role, text, isFinal, toolUseRequest?, toolUseResponse?, groundingChunks? }`

**useAudioStore**:
- Input volume level for visualization

### Tool/Function Calling System

**Current Implementation** (`lib/tools/customer-support.ts`):
- **Only ONE active tool**: `getCompanyInfo`
  - Description: Retrieves information from knowledge base
  - Parameters: `question` (string, required)
  - Enabled by default

**Tool Execution Flow** (`hooks/media/use-live-api.ts:102-174`):
1. Client receives `toolcall` event from Gemini API
2. `onToolCall` handler processes `LiveServerToolCall`
3. For each function call:
   - Log trigger message to conversation store
   - Execute function with 10s timeout
   - Handle errors and log them
   - Build function response
4. Send response back via `client.sendToolResponse()`

**Adding New Tools**:
1. Define declaration in `lib/tools/customer-support.ts` (or other template)
2. Add implementation case in `hooks/media/use-live-api.ts:123-128`
3. Set `isEnabled: true` to activate

### Knowledge Base System

**Knowledge Base Store** (`lib/knowledge-base.ts`):
- Zustand store with file caching
- `currentCompany`: string (default: `'keabank'`)
- `knowledgeCache`: Map<string, string>
- `getKnowledge(company)`: Async fetch from `/knowledge-base/${company}.md`

**Available Knowledge Files** (`public/knowledge-base/`):
- `keabank.md` - Fintech company (cross-border transactions, crypto payments)
- `bbw.md` - AI consulting company
- `hisky.md` - Third company

**Usage**:
- AI calls `getCompanyInfo` function
- Hook fetches current company from `useKnowledgeBase.getState().currentCompany`
- Returns markdown content as string
- Content is cached in memory

### Component Structure

**Main Layout** (`App.tsx`):
```
<LiveAPIProvider>
  <ErrorScreen />
  <Sidebar />
  <main className="split-layout">
    <div className="chat-column">
      <StreamingConsole />
    </div>
    <div className="visualizer-column">
      <AudioVisualizer />
      <ControlTray />
    </div>
  </main>
</LiveAPIProvider>
```

**Key Components**:
- `StreamingConsole` (`components/demo/streaming-console/StreamingConsole.tsx`):
  - Main conversation UI
  - Shows WelcomeScreen when no turns
  - Displays transcriptions with timestamps
  - Renders grounding chunks (web sources) as clickable links
  - Auto-scrolls to bottom on new messages
  - Filters out system messages from display

- `WelcomeScreen` (`components/demo/welcome-screen/WelcomeScreen.tsx`):
  - Initial state before conversation starts

- `AudioVisualizer` (`components/visualizer/AudioVisualizer.tsx`):
  - 3D sphere visualization responding to audio volume

- `ControlTray` (`components/console/control-tray/ControlTray.tsx`):
  - Connect/disconnect button
  - Microphone mute/unmute
  - Connection status indicators

- `Sidebar` (`components/Sidebar.tsx`):
  - Template selection (customer-support/personal-assistant/navigation-system)
  - Model selection dropdown
  - Voice selection dropdown
  - Tool management (enable/disable/edit)
  - System prompt editing

- `ErrorScreen` (`components/demo/ErrorScreen.tsx`):
  - Displays connection/API errors as overlay

- `Header` (`components/Header.tsx`):
  - App branding and title

## Key Technical Details

- **React 19** with Vite 6 as build tool
- **TypeScript 5.8** with strict mode enabled
- Path alias `@` resolves to project root
- API keys injected at build time via Vite's `define` config
- Audio worklets dynamically created as data URIs (see `lib/audioworklet-registry.ts`)
- All audio processing happens client-side in the browser
- No server-side components (pure frontend app)

## Configuration and Live API Setup

**Live API Config** (`components/demo/streaming-console/StreamingConsole.tsx:61-101`):
```typescript
{
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: voice  // From useSettings
      }
    }
  },
  inputAudioTranscription: {},   // Enable input transcription
  outputAudioTranscription: {},  // Enable output transcription
  systemInstruction: {
    parts: [{ text: systemPrompt }]
  },
  tools: [...enabledTools]  // Only enabled tools from useTools
}
```

**Available Models** (`lib/constants.ts`):
- `gemini-2.5-flash-native-audio-preview-09-2025` (default, recommended)
- Can be changed via Sidebar dropdown

**Available Voices** (`lib/constants.ts:29`):
32 voices: Zephyr (default), Puck, Charon, Luna, Nova, Kore, Fenrir, Leda, Orus, Aoede, Callirrhoe, Autonoe, Enceladus, Iapetus, Umbriel, Algieba, Despina, Erinome, Algenib, Rasalgethi, Laomedeia, Achernar, Alnilam, Schedar, Gacrux, Pulcherrima, Achird, Zubenelgenubi, Vindemiatrix, Sadachbia, Sadaltager, Sulafat

## System Prompts

**Customer Support Template** (`lib/state.ts:19-61`):
- Persona: "Alex" from Keabank
- Role: Professional financial consultant
- Greeting: Introduce once, collect customer name
- Language: Match customer (English/Romanian/Russian/Ukrainian)
- Knowledge retrieval: Use `getCompanyInfo` for company-specific questions
- Pronunciation rules: USDT/USDC as letters, BTC as "Bitcoin", ETH as "Ethereum"

**Other Templates**:
- `personal-assistant`: Generic helpful assistant prompt
- `navigation-system`: Generic navigation assistant prompt

## Common Customization Tasks

### Modifying Company Knowledge
1. Edit markdown files in `public/knowledge-base/` (e.g., `keabank.md`, `bbw.md`, `hisky.md`)
2. Knowledge is loaded automatically via `useKnowledgeBase.getState().getKnowledge(company)`
3. No code changes needed - AI will use updated content via `getCompanyInfo`
4. To switch active company: modify `currentCompany` in `lib/knowledge-base.ts:16`

### Changing System Prompt
Edit `lib/state.ts` in the `systemPrompts` object (line 18-64) for the relevant template.

### Adding a New Tool/Function
1. **Define declaration** in `lib/tools/customer-support.ts`:
   ```typescript
   {
     name: 'myFunction',
     description: 'What this function does',
     parameters: {
       type: 'OBJECT',
       properties: {
         arg1: { type: 'STRING', description: '...' }
       },
       required: ['arg1']
     },
     isEnabled: true
   }
   ```

2. **Implement handler** in `hooks/media/use-live-api.ts:122-129`:
   ```typescript
   if (fc.name === 'myFunction') {
     const result = await myImplementation(fc.args);
     return result;
   }
   ```

3. **Test**: Function calls are logged to conversation store and console

### Changing Voice or Model
- Use Sidebar UI to select from dropdowns
- Changes are persisted in `useSettings` Zustand store
- Model change requires page refresh (new client instance)

## Known Implementation Status

**Currently Implemented**:
- ✅ Real-time bidirectional audio streaming
- ✅ Input/output transcription
- ✅ Single tool: `getCompanyInfo`
- ✅ Knowledge base system (3 companies)
- ✅ Audio visualization
- ✅ Conversation history with grounding metadata
- ✅ System prompt customization
- ✅ Voice and model selection

**Not Implemented** (mentioned in old docs):
- ❌ Telegram bot integration (`bot/` directory doesn't exist)
- ❌ `sendToTelegram` function
- ❌ Telegraph transcript publishing
- ❌ TelegramLinkButton component
- ❌ Google Search Grounding configuration UI
- ❌ Temperature control UI (defined in store but not exposed)
- ❌ Thinking Mode configuration

**Template Status**:
- `customer-support`: Active, 1 tool
- `personal-assistant`: Empty array of tools
- `navigation-system`: Empty array of tools

## Important API Limitations

- Voice Activity Detection (VAD) is built into native audio models
- Grounding metadata (search sources) is supported and displayed
- Tool response scheduling can be configured per-tool (`FunctionResponseScheduling.INTERRUPT` or `NONE`)
- Function execution has 10s timeout to prevent hanging

## Event Handling Flow

**Client Events** (`lib/genai-live-client.ts`):
- `open` → Set connected state
- `close` → Set disconnected state
- `audio` → Play audio via AudioStreamer
- `content` → Extract text/grounding, update conversation
- `toolcall` → Execute function, send response
- `interrupted` → Stop audio playback
- `inputTranscription` → Update user turn in conversation
- `outputTranscription` → Update agent turn in conversation
- `turncomplete` → Mark last turn as final

**Conversation State Updates** (`components/demo/streaming-console/StreamingConsole.tsx:103-180`):
- Input transcription: Append to last user turn or create new
- Output transcription: Append to last agent turn or create new
- Content: Extract grounding chunks, merge with text
- Turn complete: Set `isFinal: true` on last turn
- System messages hidden from UI but logged to store
