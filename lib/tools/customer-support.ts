/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { FunctionCall } from '../state';
import { FunctionResponseScheduling } from '@google/genai';

export const customerSupportTools: FunctionCall[] = [
  {
    name: 'getCompanyInfo',
    description: `Get detailed information about Keabank from the knowledge base.

Use this function when the customer asks:
- About payment services and cross-border transactions
- About cryptocurrency support (USDT, USDC, Bitcoin, Ethereum)
- About account opening (personal/corporate, e-wallets)
- About fees and pricing (0.3-0.5% transaction fees)
- About licenses (EU crypto license, Canadian MSB, Spanish VASP)
- About supported industries (Fintech, iGaming, E-commerce, etc.)
- About KYC/AML compliance procedures
- About prohibited jurisdictions or activities
- About integration and API requirements

The knowledge base contains current information about Keabank services, fees, and policies.
ALWAYS call this function BEFORE answering questions about the company to ensure accuracy.`,
    parameters: {
      type: 'OBJECT',
      properties: {
        question: {
          type: 'STRING',
          description: "Specific customer question about Keabank. Be as specific as possible to get relevant information. Examples: 'What cryptocurrencies does Keabank support?', 'What are the transaction fees?', 'Which industries does Keabank work with?'",
        },
      },
      required: ['question'],
    },
    isEnabled: true,
  },
];