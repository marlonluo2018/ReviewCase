import { AppConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class ConfigLoader {
  static load(configPath: string): AppConfig {
    const absolutePath = path.resolve(process.cwd(), configPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Config file not found at ${absolutePath}`);
    }

    const rawConfig = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
    return this.validateConfig({
      ...rawConfig,
    });
  }

  private static validateConfig(config: any): AppConfig {
    // 必需参数检查
    if (!config.llm?.provider) {
      throw new Error('Missing required config: llm.provider');
    }
    if (!config.llm?.model) {
      throw new Error('Missing required config: llm.model');
    }

    // OpenRouter特殊检查
    if (config.llm.provider === 'openrouter' && !config.llm.apiKey) {
      throw new Error('OpenRouter requires apiKey in config');
    }

    return config as AppConfig;
  }
}

if (require.main === module) {
  const config = ConfigLoader.load('./config/params.json');
  console.log('LLM Config:', JSON.stringify(config));
}
