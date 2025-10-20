/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { customerSupportTools } from './tools/customer-support';
import { personalAssistantTools } from './tools/personal-assistant';
import { navigationSystemTools } from './tools/navigation-system';

export type Template = 'customer-support' | 'personal-assistant' | 'navigation-system';

const toolsets: Record<Template, FunctionCall[]> = {
  'customer-support': customerSupportTools,
  'personal-assistant': personalAssistantTools,
  'navigation-system': navigationSystemTools,
};

const systemPrompts: Record<Template, string> = {
  'customer-support': `You are Alex, a professional and friendly financial consultant from Keabank. Speak naturally and warmly.

About Keabank:
- Slogan: "Money without borders"
- Fintech company providing cross-border transactions with fiat and crypto
- Services: E-wallets, personal/corporate bank accounts, crypto wallets, currency exchange
- Crypto payment solutions: Accept payments in USDT, USDC, Bitcoin, Ethereum with instant fiat conversion
- Key benefits: 100% remote management, 80% lower fees, no chargebacks, 24/7 multilingual support
- Licensed: EU crypto license, Canadian MSB license, Spanish VASP registration
- Website: keabank.com

GREETING (first interaction):
- Greet warmly and introduce yourself ONCE: "Hello! I'm Alex from Keabank. How may I address you?"
- Once you know their name, DO NOT greet again - just use their name naturally
- When customer introduces themselves, acknowledge and continue WITHOUT repeating greetings
- Example: User says "Sergey" → You say "Great to meet you, Sergey! Let me tell you about..." (NOT "Hello, Sergey!")

When customers ask:
1. Company info (services, licenses, fees, industries) → Use getCompanyInfo function
2. Specific questions about accounts, integration, API → Answer from knowledge or use getCompanyInfo
3. General fintech/crypto questions → Answer directly from your knowledge

IMPORTANT:
- Emphasize Keabank's key advantages: low fees (0.3-0.5%), fast onboarding, 24/7 support
- For crypto payments: mention support for USDT, USDC, Bitcoin, Ethereum with instant fiat conversion via SEPA/SWIFT
- For industries: Fintech, iGaming, Gaming, Crypto/Blockchain, E-commerce, Luxury goods, Tourism, Freelance
- For compliance: mention EU/Canadian licenses, KYC/AML procedures
- Refer to keabank.com for detailed information and registration

PRONUNCIATION RULES FOR CRYPTOCURRENCIES:
- USDT, USDC - pronounce as letters: "U-S-D-T", "U-S-D-C" (stablecoins)
- BTC - say "Bitcoin" (NOT "B-T-C")
- ETH - say "Ethereum" (NOT "E-T-H")
- When listing all cryptos together, say: "USDT, USDC, Bitcoin, Ethereum" or "USDT, USDC, Bitcoin и Ethereum" (in Russian)

Example scenarios:
- "What payment methods do you support?" → getCompanyInfo
- "What are your fees?" → getCompanyInfo (0.3-0.5% transaction fees)
- "Do you support crypto payments?" → Yes, USDT, USDC, Bitcoin, Ethereum with instant conversion
- "Which countries can I work with?" → getCompanyInfo (mention prohibited jurisdictions)

Languages: Match the customer's language (English/Romanian/Russian/Ukrainian).

Be helpful and guide customers to the best financial solution for their business.`,
  'personal-assistant': 'You are a helpful and friendly personal assistant. Be proactive and efficient.',
  'navigation-system': 'You are a helpful and friendly navigation assistant. Provide clear and accurate directions.',
};
import { DEFAULT_LIVE_API_MODEL, DEFAULT_VOICE } from './constants';
import {
  FunctionResponse,
  FunctionResponseScheduling,
  LiveServerToolCall,
} from '@google/genai';

/**
 * Settings
 */
export const useSettings = create<{
  systemPrompt: string;
  model: string;
  voice: string;
  setSystemPrompt: (prompt: string) => void;
  setModel: (model: string) => void;
  setVoice: (voice: string) => void;
}>(set => ({
  systemPrompt: systemPrompts['customer-support'],
  model: DEFAULT_LIVE_API_MODEL,
  voice: DEFAULT_VOICE,
  setSystemPrompt: prompt => set({ systemPrompt: prompt }),
  setModel: model => set({ model }),
  setVoice: voice => set({ voice }),
}));

/**
 * UI
 */
export const useUI = create<{
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}>(set => ({
  isSidebarOpen: false, // Hidden by default for users
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

/**
 * Tools
 */
export interface FunctionCall {
  name: string;
  description?: string;
  parameters?: any;
  isEnabled: boolean;
  scheduling?: FunctionResponseScheduling;
}



export const useTools = create<{
  tools: FunctionCall[];
  template: Template;
  setTemplate: (template: Template) => void;
  toggleTool: (toolName: string) => void;
  addTool: () => void;
  removeTool: (toolName: string) => void;
  updateTool: (oldName: string, updatedTool: FunctionCall) => void;
}>(set => ({
  tools: customerSupportTools,
  template: 'customer-support',
  setTemplate: (template: Template) => {
    set({ tools: toolsets[template], template });
    useSettings.getState().setSystemPrompt(systemPrompts[template]);
  },
  toggleTool: (toolName: string) =>
    set(state => ({
      tools: state.tools.map(tool =>
        tool.name === toolName ? { ...tool, isEnabled: !tool.isEnabled } : tool,
      ),
    })),
  addTool: () =>
    set(state => {
      let newToolName = 'new_function';
      let counter = 1;
      while (state.tools.some(tool => tool.name === newToolName)) {
        newToolName = `new_function_${counter++}`;
      }
      return {
        tools: [
          ...state.tools,
          {
            name: newToolName,
            isEnabled: true,
            description: '',
            parameters: {
              type: 'OBJECT',
              properties: {},
            },
            scheduling: FunctionResponseScheduling.INTERRUPT,
          },
        ],
      };
    }),
  removeTool: (toolName: string) =>
    set(state => ({
      tools: state.tools.filter(tool => tool.name !== toolName),
    })),
  updateTool: (oldName: string, updatedTool: FunctionCall) =>
    set(state => {
      // Check for name collisions if the name was changed
      if (
        oldName !== updatedTool.name &&
        state.tools.some(tool => tool.name === updatedTool.name)
      ) {
        console.warn(`Tool with name "${updatedTool.name}" already exists.`);
        // Prevent the update by returning the current state
        return state;
      }
      return {
        tools: state.tools.map(tool =>
          tool.name === oldName ? updatedTool : tool,
        ),
      };
    }),
}));

/**
 * Audio
 */
export const useAudioStore = create<{
  inputVolume: number;
  setInputVolume: (volume: number) => void;
}>(set => ({
  inputVolume: 0,
  setInputVolume: volume => set({ inputVolume: volume }),
}));

/**
 * Logs
 */
export interface LiveClientToolResponse {
  functionResponses?: FunctionResponse[];
}
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface ConversationTurn {
  timestamp: Date;
  role: 'user' | 'agent' | 'system';
  text: string;
  isFinal: boolean;
  toolUseRequest?: LiveServerToolCall;
  toolUseResponse?: LiveClientToolResponse;
  groundingChunks?: GroundingChunk[];
}

export const useLogStore = create<{
  turns: ConversationTurn[];
  addTurn: (turn: Omit<ConversationTurn, 'timestamp'>) => void;
  updateLastTurn: (update: Partial<ConversationTurn>) => void;
  clearTurns: () => void;
}>((set, get) => ({
  turns: [],
  addTurn: (turn: Omit<ConversationTurn, 'timestamp'>) =>
    set(state => ({
      turns: [...state.turns, { ...turn, timestamp: new Date() }],
    })),
  updateLastTurn: (update: Partial<Omit<ConversationTurn, 'timestamp'>>) => {
    set(state => {
      if (state.turns.length === 0) {
        return state;
      }
      const newTurns = [...state.turns];
      const lastTurn = { ...newTurns[newTurns.length - 1], ...update };
      newTurns[newTurns.length - 1] = lastTurn;
      return { turns: newTurns };
    });
  },
  clearTurns: () => set({ turns: [] }),
}));
