// src/soap-parser.ts
import path from "path";
import fs from "fs";
import mammoth from "mammoth";

interface SOAPNote {
  Subjective: string;
  Objective: string;
  Assessment: string;
  Plan: string;
}

interface ParsedSOAPFile {
  filename: string;
  sections: SOAPNote;
  diagnosis: string;
}

function getDocsDir(): string {
  return path.join(__dirname, "../docs");
}

async function convertToDocx(filePath: string): Promise<string> {
  const newPath = filePath.replace(/\.(doc|DOC)$/i, ".docx");

  try {
    const libreoffice: {
      convert: (
        data: Buffer,
        outputFormat: string,
        callback: (err: Error | null, result: Buffer | null) => void
      ) => void;
    } = require("libreoffice-convert");
    const data = await fs.promises.readFile(filePath);
    const convertedData: Buffer = await new Promise<Buffer>(
      (resolve, reject) => {
        libreoffice.convert(
          data,
          ".docx",
          (err: Error | null, result: Buffer | null) => {
            if (err) reject(err);
            else if (!result)
              reject(new Error("Conversion returned null result"));
            else resolve(result);
          }
        );
      }
    );

    await fs.promises.writeFile(newPath, convertedData);
    return newPath;
  } catch (error) {
    console.error(`使用libreoffice转换.doc文件到.docx失败: ${filePath}`, error);

    // 回退方案：直接复制文件并修改扩展名
    try {
      const data = await fs.promises.readFile(filePath);
      await fs.promises.writeFile(newPath, data);
      console.log(`使用回退方案处理文件: ${filePath}`);
      return newPath;
    } catch (fallbackError) {
      console.error(`回退方案处理文件失败: ${filePath}`, fallbackError);
      throw new Error(`无法转换或复制文件: ${filePath}`);
    }
  }
}

async function isWordFile(filePath: string): Promise<boolean> {
  try {
    // 检查文件扩展名
    if (!/\.(doc|docx)$/i.test(path.basename(filePath))) {
      return false;
    }

    // 检查文件头（magic number）
    const docMagicNumber = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);
    const docxMagicNumber = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return false;
    }

    // 检查文件大小是否合理
    const stats = fs.statSync(filePath);
    if (stats.size < 4) {
      return false;
    }

    const buffer = fs.readFileSync(filePath, { encoding: null });

    // 更严格的格式验证
    const isDoc = buffer.slice(0, 4).toString() === docMagicNumber.toString();
    const isDocx = buffer.slice(0, 4).toString() === docxMagicNumber.toString();

    // 检查文件是否损坏（针对.docx文件）
    if (isDocx) {
      try {
        // 尝试解析ZIP结构（.docx实际上是ZIP文件）
        const JSZip = require("jszip");
        const zip = new JSZip();
        await zip.loadAsync(buffer);

        // 额外验证.docx文件的核心结构
        const hasContentTypes = zip.file(/\[Content_Types\].xml/i).length > 0;
        const hasWordFolder = zip.folder("word") !== null;

        if (!hasContentTypes || !hasWordFolder) {
          console.error(`检测到结构不完整的.docx文件: ${filePath}`);
          return false;
        }
      } catch (error) {
        const zipError = error as Error;
        console.error(`检测到损坏的.docx文件: ${filePath}`, {
          error: zipError.message,
          fileSize: buffer.length,
          magicNumber: buffer.slice(0, 4).toString("hex"),
        });
        return false;
      }
    }

    if (!isDocx && isDoc) {
      // 如果是.doc格式但非.docx，尝试转换
      const convertedPath = await convertToDocx(filePath);
      if (fs.existsSync(convertedPath)) {
        return true;
      }
    }

    return isDoc || isDocx;
  } catch (error) {
    console.error(`验证Word文件格式时出错: ${filePath}`, error);
    return false;
  }
}

function parseSOAPText(text: string): Record<keyof SOAPNote, string[]> {
  console.log("Original text:", text); // Debug log

  // Define section headers in order of appearance
  const SECTION_HEADERS = [
    { pattern: /主观资料S\s*[\r\n]+/, name: "Subjective" },
    { pattern: /客观资料O\s*[\r\n]+/, name: "Objective" },
    { pattern: /评价A\s*[\r\n]+/, name: "Assessment" },
    { pattern: /处置计划P\s*[\r\n]+/, name: "Plan" },
  ];

  const result = {
    Subjective: [] as string[],
    Objective: [] as string[],
    Assessment: [] as string[],
    Plan: [] as string[],
  };

  // Process document header before first section
  const firstHeaderIndex = text.search(SECTION_HEADERS[0].pattern);
  if (firstHeaderIndex > 0) {
    const headerContent = text.substring(0, firstHeaderIndex).trim();
    console.log("Document header:", headerContent);
    result.Subjective.push(headerContent);
  }

  // Split text into sections
  let remainingText = text;
  for (let i = 0; i < SECTION_HEADERS.length; i++) {
    const currentHeader = SECTION_HEADERS[i];
    const nextHeader =
      i < SECTION_HEADERS.length - 1 ? SECTION_HEADERS[i + 1] : null;

    const headerMatch = remainingText.match(currentHeader.pattern);
    if (!headerMatch) continue;

    const contentStart = headerMatch.index! + headerMatch[0].length;
    let contentEnd = remainingText.length;

    if (nextHeader) {
      const nextHeaderMatch = remainingText
        .substring(contentStart)
        .match(nextHeader.pattern);
      if (nextHeaderMatch) {
        contentEnd = contentStart + nextHeaderMatch.index!;
      }
    }

    const content = remainingText.substring(contentStart, contentEnd).trim();
    if (content) {
      console.log(`Found ${currentHeader.name} content:`, content);
      const sectionName = currentHeader.name as keyof typeof result;
      (result[sectionName] as string[]).push(content);
    }

    remainingText = remainingText.substring(contentEnd);
  }

  console.log("Final parsed sections:", result);
  return result;
}

function extractDiagnosis(text: string): string {
  // More robust diagnosis extraction
  const diagnosisPatterns = [
    /诊断[：:][\s]*[\r\n]+([\s\S]*?)(?=[\r\n]+(西医诊断|中医诊断|处置计划P|$))/,
    /西医诊断[：:][\s]*[\r\n]+([\s\S]*?)(?=[\r\n]+(中医诊断|处置计划P|$))/,
    /中医诊断[：:][\s]*[\r\n]+([\s\S]*?)(?=[\r\n]+(处置计划P|$))/,
  ];

  for (const pattern of diagnosisPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/\s+/g, " ");
    }
  }

  return "未明确诊断";
}

export async function parseSOAPFiles(): Promise<ParsedSOAPFile[]> {
  const docsDir = getDocsDir();
  const files = fs.readdirSync(docsDir).filter((f) => /\.(doc|docx)$/i.test(f));

  if (files.length === 0) {
    throw new Error(
      "未在'docs'目录中找到任何有效的.docx文件。请确保该目录包含至少一个有效的.docx文件。"
    );
  }

  const results: ParsedSOAPFile[] = [];

  for (const file of files) {
    const filePath = path.join(docsDir, file);

    // 验证文件是否为有效的Word文件
    if (!(await isWordFile(filePath))) {
      console.warn(`跳过非Word文件: ${file}`);
      continue;
    }

    const { value: text } = await mammoth.extractRawText({ path: filePath });
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
