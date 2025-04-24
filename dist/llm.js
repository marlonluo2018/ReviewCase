"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClient = void 0;
const sdk_1 = require("@lmstudio/sdk");
const ollama_1 = require("ollama");
const openai_1 = require("openai");
const params_manager_1 = require("./params-manager");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class LLMClient {
    constructor(config) {
        this.currentSystemPrompt = '';
        this.defaultSystemPrompt = '';
        this.config = config;
    }
    loadDefaultSystemPrompt(systemPromptPath) {
        if (systemPromptPath) {
            try {
                const fullPath = path_1.default.resolve(systemPromptPath);
                this.defaultSystemPrompt = fs_1.default.readFileSync(fullPath, 'utf-8');
            }
            catch (error) {
                console.error('Failed to load default system prompt:', error);
                this.defaultSystemPrompt = '';
            }
        }
    }
    // 新增方法：动态加载不同的system prompt
    loadSystemPrompt(promptPath) {
        try {
            const fullPath = path_1.default.resolve(promptPath);
            this.currentSystemPrompt = fs_1.default.readFileSync(fullPath, 'utf-8');
        }
        catch (error) {
            console.error(`Failed to load system prompt from ${promptPath}:`, error);
            this.currentSystemPrompt = this.defaultSystemPrompt; // 回退到默认prompt
        }
    }
    // 新增方法：直接设置system prompt内容
    setSystemPrompt(content) {
        this.currentSystemPrompt = content;
    }
    // 新增方法：重置为默认system prompt
    resetToDefaultPrompt() {
        this.currentSystemPrompt = this.defaultSystemPrompt;
    }
    async query(prompt) {
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
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error:', error.message);
            }
            else {
                console.error('Unknown error:', error);
            }
            throw error;
        }
    }
    async queryOpenRouter(prompt) {
        var _a, _b;
        // 1. 初始化客户端（配置从类属性获取）
        const openai = new openai_1.OpenAI({
            baseURL: this.config.llm.baseUrl || 'https://openrouter.ai/api/v1',
            apiKey: this.config.llm.apiKey, // 从配置读取API密钥
            defaultHeaders: {
                'HTTP-Referer': 'http://localhost:3000', // 可选：网站URL
                'X-Title': 'CaseReview', // 可选：网站名称
            },
        });
        // 2. 构造消息数组（支持系统提示）
        const messages = [];
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
            return ((_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '';
        }
        catch (error) {
            console.error('OpenRouter请求失败:', error);
            throw new Error(`OpenRouter API错误: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async queryOllama(prompt) {
        var _a;
        const ollama = new ollama_1.Ollama({ host: this.config.llm.baseUrl });
        const messages = [];
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
        return ((_a = response.message) === null || _a === void 0 ? void 0 : _a.content) || '';
    }
    async queryLMStudio(prompt) {
        const client = new sdk_1.LMStudioClient();
        const messages = [];
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
        }
        catch (error) {
            console.error('LM Studio调用失败:', error);
            throw error;
        }
    }
}
exports.LLMClient = LLMClient;
if (require.main === module) {
    (async () => {
        try {
            const config = params_manager_1.ConfigLoader.load('./config/params.json');
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
        }
        catch (error) {
            console.error('出错啦:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    })();
}
