"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const soap_parser_1 = require("./soap-parser");
const params_manager_1 = require("./params-manager");
const llm_1 = require("./llm");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function extractHtmlContent(input) {
    const startTag = "<html>";
    const endTag = "</html>";
    const startIndex = input.indexOf(startTag);
    if (startIndex === -1)
        return null; // 没有 <html>，直接返回 null
    const endIndex = input.indexOf(endTag, startIndex);
    if (endIndex === -1)
        return null; // 没有 </html>，返回 null
    return input.substring(startIndex, endIndex + endTag.length);
}
async function main() {
    try {
        // 确保 output 文件夹存在
        const outputDir = "./output";
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const results = await (0, soap_parser_1.parseSOAPFiles)();
        const config = params_manager_1.ConfigLoader.load("./config/params.json");
        const llm = new llm_1.LLMClient(config);
        for (const { filename, sections } of results) {
            console.log(`处理文件: ${filename}`);
            //const response = await llm.query(combinedSOAP);
            llm.loadSystemPrompt("./system_prompts/subjective.txt");
            console.log("开始评价主观", new Date().toLocaleString());
            console.log("主观评价\n", sections.Subjective);
            const sub_response = await llm.query(sections.Subjective);
            console.log("完成评价主观", new Date().toLocaleString());
            console.log("主观评价\n", sub_response);
            llm.loadSystemPrompt("./system_prompts/objective.txt");
            console.log("开始评价客观", new Date().toLocaleString());
            console.log("客观评价\n", sections.Objective);
            const obj_response = await llm.query(sections.Objective);
            console.log("完成评价客观", new Date().toLocaleString());
            console.log("客观评价\n", obj_response);
            llm.loadSystemPrompt("./system_prompts/assessment.txt");
            console.log("开始评价评价", new Date().toLocaleString());
            console.log("评价评价\n", sections.Assessment);
            const ass_response = await llm.query(sections.Assessment);
            console.log("完成评价评价", new Date().toLocaleString());
            console.log("评价评价\n", ass_response);
            llm.loadSystemPrompt("./system_prompts/plan.txt");
            console.log("开始评价处置", new Date().toLocaleString());
            console.log("处置评价\n", sections.Plan);
            const plan_response = await llm.query(sections.Plan);
            console.log("完成评价处置", new Date().toLocaleString());
            console.log("计划评价\n", plan_response);
            const seperater = "\n---------------------------------------------------------------------------------\n";
            const combinedSOAP = [
                seperater,
                "【主观 (Subjective)】",
                sub_response,
                seperater,
                "【客观 (Objective)】",
                obj_response,
                seperater,
                "【评估 (Assessment)】",
                ass_response,
                seperater,
                "【计划 (Plan)】",
                plan_response,
                seperater,
            ].join("\n\n");
            console.log("合并评价.\n", combinedSOAP);
            llm.loadSystemPrompt("./system_prompts/summary.txt");
            console.log("开始总评", new Date().toLocaleString());
            const response = await llm.query(combinedSOAP);
            console.log("完成总评", new Date().toLocaleString());
            console.log("总评价", response);
            // 直接使用原文件名 + .txt 作为输出路径
            const outputFilename = path_1.default.join(outputDir, `${filename}.html`);
            // 覆盖写入文件（如果已存在则替换）
            const htmlstring = extractHtmlContent(response);
            fs_1.default.writeFileSync(`${outputFilename}.txt`, response, "utf-8");
            if (!htmlstring) {
                console.warn(`No HTML content found in response for ${filename}`);
                continue;
            }
            fs_1.default.writeFileSync(outputFilename, htmlstring, "utf-8");
            console.log(`结果已保存到: ${outputFilename}`);
        }
        return results;
    }
    catch (error) {
        console.error("处理SOAP文件失败:", error);
        process.exit(1);
    }
}
// 启动程序
main().catch(console.error);
