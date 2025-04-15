// src/soap-parser.ts
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');

interface SOAPNote {
  Subjective: string;
  Objective: string;
  Assessment: string;
  Plan: string;
}

type SOAPSection = keyof SOAPNote; // "Subjective" | "Objective" | "Assessment" | "Plan"

// 确保__dirname在CommonJS中可用
const getDirname = () =>
  path.dirname(require.main?.filename || process.mainModule?.filename || __dirname);

function parseSOAPFromWord(text: string): Record<SOAPSection, string[]> {
  const soap: Record<string, string[]> = {
    Subjective: [],
    Objective: [],
    Assessment: [],
    Plan: [],
  };

  let currentSection: SOAPSection | null = null;

  const lines = text.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // 检查是否是新的 SOAP 段落标记
    const firstChar = trimmedLine[0].toUpperCase();
    if (['S', 'O', 'A', 'P'].includes(firstChar)) {
      const isSectionMarker = trimmedLine.length === 1 || /^[SOAP][\s:：，。]/.test(trimmedLine);

      if (isSectionMarker) {
        currentSection = {
          S: 'Subjective',
          O: 'Objective',
          A: 'Assessment',
          P: 'Plan',
        }[firstChar] as SOAPSection;

        const content = trimmedLine.slice(1).trim();
        if (content) {
          soap[currentSection].push(content);
        }
        continue;
      }
    }

    // 如果不是新段落标记，则添加到当前段落
    if (currentSection) {
      soap[currentSection].push(trimmedLine);
    }
  }

  return soap;
}

function extractSection(text: string, title: string): string | null {
  // 创建不区分大小写的正则表达式
  const regex = new RegExp(`${title}[：:]\s*([\\s\\S]*?)(?=\\n\\n|${title}|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

// 辅助函数：智能查找诊断信息
function findDiagnosis(text: string): string {
  const diagnosisKeywords = ['诊断', '考虑', '印象', '初步意见'];
  for (const keyword of diagnosisKeywords) {
    const section = extractSection(text, keyword);
    if (section) return section;
  }
  return '未明确诊断';
}

async function main() {
  try {
    const docsDir = path.join(getDirname(), '../docs');
    const files = fs.readdirSync(docsDir);
    const docxFiles = files.filter((f: string) => /\.docx?$/i.test(f)); // 获取所有.docx文件

    if (docxFiles.length === 0) throw new Error('docs目录下未找到.docx文件');

    // 遍历并解析每个文件
    for (const docxFile of docxFiles) {
      const filePath = path.join(docsDir, docxFile);
      const { value: text } = await mammoth.extractRawText({ path: filePath });
      const result = parseSOAPFromWord(text);
      console.log(`文件 ${docxFile} 的解析结果:`, result);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('发生错误:', error.message);
    } else {
      console.error('未知错误:', error);
    }
  }
}

export async function parseSOAPFiles(): Promise<
  Array<{
    filename: string;
    sections: SOAPNote;
  }>
> {
  try {
    const docsDir = path.join(getDirname(), '../docs');
    const files = fs.readdirSync(docsDir);
    const docxFiles = files.filter((f: string) => /\.docx?$/i.test(f));

    if (docxFiles.length === 0) {
      throw new Error('docs目录下未找到.docx文件');
    }

    const results: Array<{ filename: string; sections: SOAPNote }> = [];
    for (const docxFile of docxFiles) {
      const filePath = path.join(docsDir, docxFile);
      const { value: text } = await mammoth.extractRawText({ path: filePath });
      const sections = parseSOAPFromWord(text);

      results.push({
        filename: docxFile,
        sections: {
          Subjective: sections.Subjective.join('\n'),
          Objective: sections.Objective.join('\n'),
          Assessment: sections.Assessment.join('\n'),
          Plan: sections.Plan.join('\n'),
        },
      });
    }

    return results;
  } catch (error) {
    if (error instanceof Error) {
      console.error('发生错误:', error.message);
    } else {
      console.error('未知错误:', error);
    }
    throw error;
  }
}

// 保留原main函数作为模块自测试用
async function localTest() {
  const results = await parseSOAPFiles();
  console.log('测试结果:', JSON.stringify(results, null, 2));
}

if (require.main === module) {
  localTest();
}
