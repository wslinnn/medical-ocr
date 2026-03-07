/**
 * 医疗病例 OCR 识别系统 Pro - Markdown 解析模块
 * Medical OCR Pro - Markdown Parser Module
 */

// ============================================================================
// MARKDOWN PARSING
// ============================================================================
function parseMarkdown(text) {
    const normalized = text.replace(/\s+/g, '').replace(/:/g, '：');
    const data = { name: '未检出', gender: '--', age: '--', diagnosis: '见报告详情', stage: '待查' };

    // Extract name
    const nameMatch = normalized.match(/(?:姓名|患者)[\s：]{0,2}([\u4e00-\u9fa5]{2,4})/);
    if (nameMatch) data.name = nameMatch[1];

    // Extract gender
    const genderMatch = normalized.match(/(?:性别)[\s：]{0,2}([男女])/);
    if (genderMatch) data.gender = genderMatch[1];
    else if (normalized.includes('女')) data.gender = '女';
    else if (normalized.includes('男')) data.gender = '男';

    // Extract age
    const ageMatch = normalized.match(/(?:年龄)[\s：]{0,2}(\d{2,3})/);
    if (ageMatch) data.age = ageMatch[1];

    // Extract diagnosis from regions and findings
    const regions = ['左乳', '右乳', '双乳', '甲状腺', '乳腺'];
    const findings = ['结节', '占位', '钙化', '肿物', '囊肿'];
    const detections = [];

    regions.forEach(r => {
        findings.forEach(f => {
            if (normalized.includes(r) && normalized.includes(f)) {
                detections.push(`${r}${f}`);
            }
        });
    });

    if (detections.length > 0) {
        data.diagnosis = Array.from(new Set(detections)).join('、');
    } else {
        const diagMatch = normalized.match(/(?:诊断|印象|结论)[\s：]{1,3}([^。；\n]{5,30})/);
        if (diagMatch) data.diagnosis = diagMatch[1];
    }

    // Extract stage
    const stageMatch = normalized.match(/([IVX1234]{1,4})\s*[期级]/i);
    if (stageMatch) data.stage = stageMatch[1] + '期';

    return data;
}
