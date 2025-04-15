# SOAP 病历评分系统

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 项目描述

这是一个用于规培医师书写SOAP (Subjective, Objective, Assessment, Plan) 病历的评分系统。系统能够：

1. 解析SOAP病历文件
2. 根据预设评分标准对各个部分进行自动评分
3. 提供实时反馈和个性化指导
4. 生成HTML格式的评估报告和统计分析

## 评分系统框架

系统围绕SOAP四个部分进行设计：

- 主观资料(S)：25分
- 客观检查(O)：15分
- 评价(A)：25分
- 处置计划(P)：35分

## 评分标准

### 主观资料(S)：25分

- 格式：按主要健康问题，逐一描述（5分）
- 主要书写内容：
  - 主诉（2分）
  - 主要症状描述、病情演变（5分）
  - 诊治经过及结果（3分）
  - 相关病史（3分）
  - 家族史（2分）
  - 生活方式、心理及社会因素（5分）

### 客观检查(O)：15分

- 体检的结果（8分）
- 实验室检查及辅助检查等（5分）
- 相关心理测验等其他评估（2分）

### 评价(A)：25分

- 主要诊断（8分）
- 存在的危险因素与健康问题（10分）
- 并发症或其他临床情况（4分）
- 患者的依从性（2分）
- 家庭可利用的资源（1分）

### 处置计划(P)：35分

- 进一步诊查计划（6分）
- 治疗计划：
  - 药物治疗及相关问题（10分）
  - 非药物治疗（行为干预、健康教育等）（15分）
- 随诊要求（4分）

## 系统功能

1. **自动评分**：

   - 根据预设评分标准自动评估SOAP病历
   - 提供各部分得分和总分
   - 生成详细的评分报告

2. **实时反馈**：

   - 在医师书写过程中提供即时反馈
   - 指出病历中的问题和不足
   - 建议改进方向

3. **个性化指导**：

   - 根据医师的书写水平提供针对性建议
   - 推荐学习资源和改进方案
   - 跟踪医师的进步情况

4. **数据分析**：
   - 统计评分结果
   - 生成趋势分析图表
   - 提供科室和个人报告

## 安装与使用

### 前置条件

- Node.js (建议使用最新LTS版本)
- npm或yarn

### 安装步骤

1. 克隆项目仓库：

```bash
git clone https://github.com/marlonluo2018/ReviewCase.git
cd ReviewCase
```

2. 安装所有依赖：

```bash
npm install --save typescript @types/node --save-dev eslint prettier
```

### 使用方法

1. 准备SOAP文件

```bash
cp example.soap input/case1.soap
```

2. 运行程序

```bash
npm start -- input/case1.soap
```

## 配置文件 (tsconfig.json)

```json
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
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 项目结构

```
my-project/
├── src/
│   ├── soap-parser.ts       # SOAP文件解析器
│   ├── params-manager.ts    # 配置加载器
│   ├── llm.ts              # LLM客户端
│   └── index.ts            # 主程序入口
├── config/
│   └── params.json         # LLM配置参数
├── system_prompts/         # 系统提示文件
│   ├── subjective.txt
│   ├── objective.txt
│   ├── assessment.txt
│   └── plan.txt
├── output/                 # 输出目录（自动创建）
├── package.json
└── tsconfig.json
```

## 输出说明

处理完成后会在`./output/`目录生成：

- `.html`文件：包含HTML格式的评估结果
- `.txt`文件：包含原始评估文本

输出文件命名规则：

- `[输入文件名].html`
- `[输入文件名].html.txt`

## 依赖项

### 核心依赖

- `typescript`: ^4.9.5
- `@types/node`: ^18.11.18

### 开发依赖

- `eslint`: ^8.56.0
- `prettier`: ^3.2.5

## 贡献指南

欢迎提交 Pull Requests 和 Issues。请确保：

1. 遵循现有的代码风格
2. 添加适当的测试
3. 更新相关文档

## 许可证

本项目基于 MIT 许可证开源。详见 [LICENSE](LICENSE) 文件。
