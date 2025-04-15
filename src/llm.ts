import { LMStudioClient } from '@lmstudio/sdk';
import { Ollama } from 'ollama';
import { OpenAI } from 'openai';
import { AppConfig, ChatMessage } from './types';
import { ConfigLoader } from './params-manager';
import fs from 'fs';
import path from 'path';

export class LLMClient {
  private readonly config: AppConfig;
  private currentSystemPrompt: string = '';
  private defaultSystemPrompt: string = '';

  constructor(config: AppConfig) {
    this.config = config;
  }

  private loadDefaultSystemPrompt(systemPromptPath: string): void {
    if (systemPromptPath) {
      try {
        const fullPath = path.resolve(systemPromptPath);
        this.defaultSystemPrompt = fs.readFileSync(fullPath, 'utf-8');
      } catch (error) {
        console.error('Failed to load default system prompt:', error);
        this.defaultSystemPrompt = '';
      }
    }
  }

  // 新增方法：动态加载不同的system prompt
  public loadSystemPrompt(promptPath: string): void {
    try {
      const fullPath = path.resolve(promptPath);
      this.currentSystemPrompt = fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      console.error(`Failed to load system prompt from ${promptPath}:`, error);
      this.currentSystemPrompt = this.defaultSystemPrompt; // 回退到默认prompt
    }
  }

  // 新增方法：直接设置system prompt内容
  public setSystemPrompt(content: string): void {
    this.currentSystemPrompt = content;
  }

  // 新增方法：重置为默认system prompt
  public resetToDefaultPrompt(): void {
    this.currentSystemPrompt = this.defaultSystemPrompt;
  }

  async query(prompt: string): Promise<string> {
    try {
      switch (this.config.llm.provider) {
        case 'ollama':
          return this.queryOllama(prompt);
        case 'lmstudio':
          return this.queryLMStudio(prompt);
        case 'openrouter':
          return this.queryOpenRouter(prompt);
        default:
          throw new Error(`Unsupported provider: ${this.config.llm.provider}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error:', error.message);
      } else {
        console.error('Unknown error:', error);
      }
      throw error;
    }
  }

  private async queryOpenRouter(prompt: string): Promise<string> {
    // 1. 初始化客户端（配置从类属性获取）
    const openai = new OpenAI({
      baseURL: this.config.llm.baseUrl || 'https://openrouter.ai/api/v1',
      apiKey: this.config.llm.apiKey, // 从配置读取API密钥
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000', // 可选：网站URL
        'X-Title': 'CaseReview', // 可选：网站名称
      },
    });

    // 2. 构造消息数组（支持系统提示）
    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (this.currentSystemPrompt) {
      messages.push({ role: 'system', content: this.currentSystemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      // 3. 调用OpenRouter API
      const completion = await openai.chat.completions.create({
        model: this.config.llm.model, // 例如 'openai/gpt-4o'
        messages,
        temperature: this.config.llm.temperature, // 随机性控制
        max_tokens: this.config.llm.maxTokens, // 响应长度限制
        // 其他可选参数...
      });

      // 4. 返回消息内容
      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenRouter请求失败:', error);
      throw new Error(
        `OpenRouter API错误: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async queryOllama(prompt: string): Promise<string> {
    const ollama = new Ollama({ host: this.config.llm.baseUrl });
    const messages: ChatMessage[] = [];

    if (this.currentSystemPrompt) {
      messages.push({ role: 'system', content: this.currentSystemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await ollama.chat({
      model: this.config.llm.model,
      messages,
      options: {
        temperature: this.config.llm.temperature,
        num_predict: this.config.llm.maxTokens,
      },
    });
    return response.message?.content || '';
  }

  private async queryLMStudio(prompt: string): Promise<string> {
    const client = new LMStudioClient();
    const messages: ChatMessage[] = [];

    // 1. 系统提示词支持
    if (this.currentSystemPrompt) {
      messages.push({ role: 'system', content: this.currentSystemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      // 2. 加载模型并传入参数
      const model = await client.llm.model(this.config.llm.model);
      const result = await model.respond(messages, {
        temperature: this.config.llm.temperature, // 随机性控制
        maxTokens: this.config.llm.maxTokens, // 最大生成token数
        // 其他可选参数见下方说明
      });

      return result.content || '';
    } catch (error) {
      console.error('LM Studio调用失败:', error);
      throw error;
    }
  }
}

if (require.main === module) {
  (async () => {
    try {
      const config = ConfigLoader.load('./config/params.json');
      const llm = new LLMClient(config);

      // 使用默认system prompt
      let response = await llm.query('用通俗语言解释量子纠缠');
      console.log('默认prompt解释结果:', response);

      // 动态加载不同的system prompt
      //llm.loadSystemPrompt('./prompts/teacher_prompt.txt');
      //response = await llm.query('用通俗语言解释量子纠缠');
      //console.log('教师风格解释结果:', response);

      // 直接设置system prompt内容
      //llm.setSystemPrompt('你是一个幽默的科普作家，请用轻松有趣的方式回答问题');
      //response = await llm.query('用通俗语言解释量子纠缠');
      //console.log('幽默风格解释结果:', response);

      // 重置为默认system prompt
      llm.resetToDefaultPrompt();
      response = await llm.query('用通俗语言解释量子纠缠');
      console.log('重置后解释结果:', response);
    } catch (error) {
      console.error('出错啦:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  })();
}
