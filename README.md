# SOAP 文件处理工具

## 项目描述

这是一个用于处理SOAP (Subjective, Objective, Assessment, Plan) 文件的TypeScript工具。它能够解析SOAP文件，使用LLM (大型语言模型) 对各个部分进行评估，并生成HTML格式的评估报告。

## 功能特性

- 解析SOAP文件并将其分为四个部分：主观(Subjective)、客观(Objective)、评估(Assessment)和计划(Plan)
- 使用LLM对每个部分进行独立评估
- 生成综合评估报告
- 输出HTML格式的评估结果
- 自动创建输出目录并保存结果文件

## 安装与使用

### 前置条件

- Node.js (建议使用最新LTS版本)
- npm或yarn

### 安装步骤

1. 克隆项目仓库
2. 安装依赖：
   ```bash
   npm install
   ```

# 配置文件 (tsconfig.json)

````json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "sourceMap": true
  },
  "include": ["src/​**​/*.ts"],
  "exclude": ["node_modules"]
}

# 项目结构
my-project/
├── src/
│   ├── soap-parser.ts       # SOAP文件解析器
│   ├── params-manager.ts    # 配置加载器
│   ├── llm.ts               # LLM客户端
│   └── index.ts             # 主程序入口
├── config/
│   └── params.json          # LLM配置参数
├── system_prompts/          # 系统提示文件
│   ├── subjective.txt
│   ├── objective.txt
│   ├── assessment.txt
│   └── plan.txt
├── output/                  # 输出目录（自动创建）
├── package.json
└── tsconfig.json

# 输出说明
处理完成后会在`./output/`目录生成：
- `.html`文件：包含HTML格式的评估结果
- `.txt`文件：包含原始评估文本

输出文件命名规则：
`[输入文件名].html` 和 `[输入文件名].html.txt`

# 依赖项
## 核心依赖
- `typescript`: ^4.9.5
- `@types/node`: ^18.11.18

## 开发依赖
- `eslint`: ^8.56.0
- `prettier`: ^3.2.5

安装命令：
```bash
npm install --save typescript @types/node
npm install --save-dev eslint prettier
````
