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
    if (records.length === 0) {
        showToast('暂无数据可导出', 'error');
        return;
    }

    const {
        includeFullText = false,
        includeImageNote = false,
        includeFilename = false
    } = options;

    try {
        // Build header row
        const wsData = [['姓名', '性别', '年龄', '诊断', '分期', '状态', '识别时间']];
        if (includeFilename) wsData[0].push('原始文件名');
        if (includeImageNote) wsData[0].push('图片');
        if (includeFullText) wsData[0].push('完整OCR文本');

        // Build data rows
        records.forEach(r => {
            const statusText = r.status === 'pending' ? '待审核' : r.status === 'reviewed' ? '已审核' : '需复核';
            const row = [r.name, r.gender, r.age, r.diagnosis, r.stage, statusText, new Date(r.createdAt).toLocaleString('zh-CN')];

            if (includeFilename) row.push(r.fileName || '');
            if (includeImageNote) row.push(r.imageData ? '是' : '否');
            if (includeFullText) row.push(r.originalText || '');

            wsData.push(row);
        });

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths = [
            { wch: 15 }, // 姓名
            { wch: 8 },  // 性别
            { wch: 8 },  // 年龄
            { wch: 40 }, // 诊断
            { wch: 10 }, // 分期
            { wch: 10 }, // 状态
            { wch: 20 }  // 识别时间
        ];
        if (includeFilename) colWidths.push({ wch: 30 });
        if (includeImageNote) colWidths.push({ wch: 8 });
        if (includeFullText) colWidths.push({ wch: 60 });
        ws['!cols'] = colWidths;

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '识别结果');

        // Download file
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const safeFilename = sanitizeFilename(filenamePrefix);
        XLSX.writeFile(wb, `${safeFilename}_${timestamp}.xlsx`);

        // Show success message
        const optionsText = [
            includeFullText ? '完整文本' : null,
            includeImageNote ? '图片信息' : null,
            includeFilename ? '文件名' : null
        ].filter(Boolean).join('、');

        showToast(`成功导出 ${records.length} 条记录${optionsText ? ' (含' + optionsText + ')' : ''}`);
    } catch (error) {
        console.error('Excel导出失败，尝试CSV:', error);
        exportToCSV(records, options);
    }
}
