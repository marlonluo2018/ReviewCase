export type LLMProvider = 'ollama' | 'lmstudio' | 'openrouter';

export interface LLMConfig {
  provider: 'ollama' | 'lmstudio' | 'openrouter' | string;
  model: string;
  baseUrl?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AppConfig {
  llm: LLMConfig;
}
