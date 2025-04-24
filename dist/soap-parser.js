"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSOAPFiles = parseSOAPFiles;
// src/soap-parser.ts
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mammoth_1 = __importDefault(require("mammoth"));
function getDocsDir() {
    return path_1.default.join(__dirname, "../docs");
}
function isWordFile(filePath) {
    // 检查文件扩展名
    if (!/\.(doc|docx)$/i.test(path_1.default.basename(filePath))) {
        return false;
    }
    // 检查文件头（magic number）
    const docMagicNumber = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);
    const docxMagicNumber = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    const buffer = fs_1.default.readFileSync(filePath, { encoding: null });
    return (buffer.slice(0, 4).toString() === docMagicNumber.toString() ||
        buffer.slice(0, 4).toString() === docxMagicNumber.toString());
}
function parseSOAPText(text) {
    // 定义所有可能的段落开始标记（支持多种格式）
    const sectionPatterns = [
        {
            regex: /(主观资料S|S——|S\s*[:：])\s*(.*?)(?=(客观资料O|O——|O\s*[:：]|评价A|A——|A\s*[:：]|处置计划P|P——|P\s*[:：]|$))/s,
            section: "Subjective",
        },
        {
            regex: /(客观资料O|O——|O\s*[:：])\s*(.*?)(?=(评价A|A——|A\s*[:：]|处置计划P|P——|P\s*[:：]|$))/s,
            section: "Objective",
        },
        {
            regex: /(评价A|A——|A\s*[:：])\s*(.*?)(?=(处置计划P|P——|P\s*[:：]|$))/s,
            section: "Assessment",
        },
        {
            regex: /(处置计划P|P——|P\s*[:：])\s*(.*)/s,
            section: "Plan",
        },
    ];
    const result = {
        Subjective: [],
        Objective: [],
        Assessment: [],
        Plan: [],
    };
    // 处理文档开头可能没有标记的内容
    const firstSectionMatch = text.match(/^(.*?)(?=(主观资料S|S——|S\s*[:：]|客观资料O|O——|O\s*[:：]|评价A|A——|A\s*[:：]|处置计划P|P——|P\s*[:：]|$))/s);
    if (firstSectionMatch && firstSectionMatch[1].trim()) {
        result.Subjective.push(firstSectionMatch[1].trim());
    }
    // 使用正则表达式提取各段落内容
    for (const { regex, section } of sectionPatterns) {
        const match = text.match(regex);
        if (match && match[2]) {
            result[section].push(match[2].trim());
        }
    }
    return result;
}
function extractDiagnosis(text) {
    // 尝试提取明确的诊断信息
    const diagnosisPatterns = [
        /诊断[：:]\s*(.*?)(?=\n|$)/,
        /中医诊断[：:]\s*(.*?)(?=\n|$)/,
        /西医诊断[：:]\s*(.*?)(?=\n|$)/,
    ];
    let diagnosis = "未明确诊断";
    for (const pattern of diagnosisPatterns) {
        const match = text.match(pattern);
        if (match) {
            diagnosis = match[1].trim();
            break;
        }
    }
    // 尝试提取其他可能的诊断信息
    if (diagnosis === "未明确诊断") {
        const keywords = ["考虑", "印象", "初步意见"];
        for (const keyword of keywords) {
            const match = text.match(new RegExp(`${keyword}[：:](.*?)(?=\\n|$)`));
            if (match) {
                diagnosis = match[1].trim();
                break;
            }
        }
    }
    return diagnosis;
}
async function parseSOAPFiles() {
    const docsDir = getDocsDir();
    const files = fs_1.default.readdirSync(docsDir).filter((f) => /\.(doc|docx)$/i.test(f));
    if (files.length === 0) {
        throw new Error("未在'docs'目录中找到任何有效的.docx文件。请确保该目录包含至少一个有效的.docx文件。");
    }
    const results = [];
    for (const file of files) {
        const filePath = path_1.default.join(docsDir, file);
        // 验证文件是否为有效的Word文件
        if (!isWordFile(filePath)) {
            console.warn(`跳过非Word文件: ${file}`);
            continue;
        }
        const { value: text } = await mammoth_1.default.extractRawText({ path: filePath });
        const sections = parseSOAPText(text);
        results.push({
            filename: file,
            sections: {
                Subjective: sections.Subjective.join("\n"),
                Objective: sections.Objective.join("\n"),
                Assessment: sections.Assessment.join("\n"),
                Plan: sections.Plan.join("\n"),
            },
            diagnosis: extractDiagnosis(sections.Assessment.join("\n")),
        });
    }
    return results;
}
// 测试用
if (require.main === module) {
    parseSOAPFiles()
        .then((results) => console.log(JSON.stringify(results, null, 2)))
        .catch((err) => console.error("解析失败:", err));
}
