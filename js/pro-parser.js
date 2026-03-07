/**
 * 医疗病例 OCR 识别系统 Pro - Markdown 解析模块
 * Medical OCR Pro - Markdown Parser Module
 */

// ============================================================================
// MARKDOWN PARSING
// ============================================================================
function parseMarkdown(text) {
    const normalized = text.replace(/\s+/g, '').replace(/:/g, '：');
    const data = { 
        name: '未检出', 
        biopsyPathology: '未检出', 
        tnmStage: '待查', 
        surgeryTime: '未检出', 
        postopPathology: '未检出',
        her2Status: '待查',
        erStatus: '待查',
        ki67: '待查'
    };

    // 提取姓名
    const nameMatch = normalized.match(/(?:姓名|患者)[\s：]{0,2}([\u4e00-\u9fa5]{2,4})/);
    if (nameMatch) data.name = nameMatch[1];

    // 提取 TNM 分期
    const stageMatch = normalized.match(/(?:TNM|分期)[\s：]{0,3}([T0-4a-d]{1,3}[N0-3]{1,3}[M0-1]{1,2})/i);
    if (stageMatch) data.tnmStage = stageMatch[1];
    else {
        const simpleStage = normalized.match(/([IVX1234]{1,4})\s*[期级]/i);
        if (simpleStage) data.tnmStage = simpleStage[1] + '期';
    }

    // 提取手术时间
    const dateMatch = normalized.match(/(?:手术|日期)[\s：]{0,3}(\d{4}[年\/-]\d{1,2}[月\/-]\d{1,2}日?)/);
    if (dateMatch) data.surgeryTime = dateMatch[1];

    // 提取 HER2 状态
    const her2Match = normalized.match(/HER2[\s：]{0,2}([\+\-0-3]{1,4})/i);
    if (her2Match) data.her2Status = her2Match[1];

    // 提取 ER 状态
    const erMatch = normalized.match(/ER[\s：]{0,2}([\+\-阴阳]{1,4})/i);
    if (erMatch) data.erStatus = erMatch[1];

    // 提取 ki67
    const ki67Match = normalized.match(/ki[-]?67[\s：]{0,2}([\d\.%]{1,6})/i);
    if (ki67Match) data.ki67 = ki67Match[1];

    // 提取病理（穿刺/术后）
    // 这是一个简化逻辑，实际应用中可能需要根据文档上下文判断
    const pathologyMatch = normalized.match(/(?:病理|诊断)[\s：]{1,3}([^。；\n]{5,100})/);
    if (pathologyMatch) {
        if (normalized.includes('穿刺')) {
            data.biopsyPathology = pathologyMatch[1];
        } else if (normalized.includes('术后') || normalized.includes('标本')) {
            data.postopPathology = pathologyMatch[1];
        } else {
            data.postopPathology = pathologyMatch[1];
        }
    }

    return data;
}
