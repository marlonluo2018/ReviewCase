"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_CONFIG = {
    llm: {
        provider: 'ollama',
        model: 'modelscope.cn/Qwen/Qwen2.5-1.5B-Instruct-GGUF:qwen2.5-1.5b-instruct-q4_k_m.gguf',
        temperature: 0.7,
    },
};
class ConfigLoader {
    static load(configPath) {
        const absolutePath = path.resolve(process.cwd(), configPath);
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Config file not found at ${absolutePath}`);
        }
        const rawConfig = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
        return this.validateConfig({
            ...DEFAULT_CONFIG,
            ...rawConfig,
        });
    }
    static validateConfig(config) {
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
        return config;
    }
}
exports.ConfigLoader = ConfigLoader;
if (require.main === module) {
    const config = ConfigLoader.load('./config/params.json');
    console.log('LLM Config:', JSON.stringify(config));
}
