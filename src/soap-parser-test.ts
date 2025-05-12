interface SOAPNote {
  Subjective: string;
  Objective: string;
  Assessment: string;
  Plan: string;
}

export function parseSOAPText(text: string): Record<keyof SOAPNote, string[]> {
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

// Test with sample text
const testText = `
SOAP病史

姓名：测试患者　性别：男　年龄：30岁　日期：2025-05-05
主观资料S
患者主诉头痛3天
客观资料O
体温36.5℃，血压120/80
评价A
考虑紧张性头痛
处置计划P
建议休息，服用止痛药
`;

const parsed = parseSOAPText(testText);
console.log("Test results:", parsed);
