/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';

export interface KnowledgeBaseStore {
  currentCompany: string;
  knowledgeCache: Map<string, string>;
  setCurrentCompany: (company: string) => void;
  getKnowledge: (company: string) => Promise<string>;
}

export const useKnowledgeBase = create<KnowledgeBaseStore>((set, get) => ({
  currentCompany: 'keabank',
  knowledgeCache: new Map(),

  setCurrentCompany: (company: string) => {
    set({ currentCompany: company });
  },

  getKnowledge: async (company: string): Promise<string> => {
    const { knowledgeCache } = get();

    // Check cache first
    if (knowledgeCache.has(company)) {
      return knowledgeCache.get(company)!;
    }

    // Load from file
    try {
      const response = await fetch(`/knowledge-base/${company}.md`);
      if (!response.ok) {
        throw new Error(`Knowledge base file not found: ${company}.md`);
      }
      const content = await response.text();

      // Update cache
      const newCache = new Map(knowledgeCache);
      newCache.set(company, content);
      set({ knowledgeCache: newCache });

      return content;
    } catch (error) {
      console.error(`Failed to load knowledge base for ${company}:`, error);
      return `Error: Knowledge base for "${company}" not found.`;
    }
  },
}));
