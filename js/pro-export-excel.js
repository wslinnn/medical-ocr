/**
 * 医疗病例 OCR 识别系统 Pro - Excel导出模块
 * Medical OCR Pro - Excel Export Module
 */

// ============================================================================
// FILENAME SANITIZATION
// ============================================================================
function sanitizeFilename(filename) {
    // Remove or replace characters that are invalid in Windows filenames
    // Invalid: < > : " / \ | ? *
    return filename
        .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid chars with underscore
        .replace(/\s+/g, '_')            // Replace spaces with underscores
        .replace(/_+/g, '_')             // Replace multiple underscores with single
        .replace(/^_|_$/g, '');          // Remove leading/trailing underscores
}

function exportRecordsToExcel(records, filenamePrefix, options = {}) {
    console.log('Starting Excel export with', records.length, 'records');

    if (records.length === 0) {
        showToast('暂无数据可导出', 'error');
        return;
    }

    const {
        includeFilename = false,
        includeTime = false
    } = options;

    // Build header row
    const wsData = [['姓名', '穿刺病理', 'TNM分期', '手术时间', '术后病理', 'HER2状态', 'ER状态', 'ki67']];
    if (includeFilename) wsData[0].push('原始文件名');
    if (includeTime) wsData[0].push('解析时间');

    // Build data rows
    records.forEach(r => {
        const row = [
            r.name || '未检出',
            r.biopsyPathology || '未检出',
            r.tnmStage || '待查',
            r.surgeryTime || '未检出',
            r.postopPathology || '未检出',
            r.her2Status || '待查',
            r.erStatus || '待查',
            r.ki67 || '待查'
        ];

        if (includeFilename) row.push(r.fileName || '');

        // Format parsing time
        if (includeTime) {
            let timeStr = '-';
            if (r.createdAt) {
                try {
                    const date = new Date(r.createdAt);
                    timeStr = date.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                } catch (e) {
                    timeStr = r.createdAt;
                }
            }
            row.push(timeStr);
        }

        wsData.push(row);
    });

    console.log('wsData built, creating worksheet');

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = [
        { wch: 15 }, // 姓名
        { wch: 40 }, // 穿刺病理
        { wch: 12 }, // TNM分期
        { wch: 18 }, // 手术时间
        { wch: 40 }, // 术后病理
        { wch: 10 }, // HER2状态
        { wch: 10 }, // ER状态
        { wch: 10 }  // ki67
    ];
    if (includeFilename) colWidths.push({ wch: 30 });
    if (includeTime) colWidths.push({ wch: 20 });
    ws['!cols'] = colWidths;

    console.log('Creating workbook');

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '识别结果');

    console.log('Writing file');

    // Download file
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const safeFilename = sanitizeFilename(filenamePrefix);
    XLSX.writeFile(wb, `${safeFilename}_${timestamp}.xlsx`);

    // Show success message
    const optionsText = [
        includeFilename ? '文件名' : null,
        includeTime ? '解析时间' : null
    ].filter(Boolean).join('、');

    showToast(`成功导出 ${records.length} 条记录${optionsText ? ' (含' + optionsText + ')' : ''}`);
}
