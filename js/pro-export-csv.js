/**
 * 医疗病例 OCR 识别系统 Pro - CSV导出模块
 * Medical OCR Pro - CSV Export Module
 */

// ============================================================================
// FILENAME SANITIZATION
// ============================================================================
function sanitizeCSVFilename(filename) {
    // Remove or replace characters that are invalid in Windows filenames
    // Invalid: < > : " / \ | ? *
    return filename
        .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid chars with underscore
        .replace(/\s+/g, '_')            // Replace spaces with underscores
        .replace(/_+/g, '_')             // Replace multiple underscores with single
        .replace(/^_|_$/g, '');          // Remove leading/trailing underscores
}

function exportToCSV(records, options = {}) {
    const {
        includeFullText = false,
        includeImageNote = false,
        includeFilename = false
    } = options;

    try {
        // BOM for UTF-8
        let csvContent = '\uFEFF';

        // Build header row
        let header = '姓名,性别,年龄,诊断,分期,状态,识别时间';
        if (includeFilename) header += ',原始文件名';
        if (includeImageNote) header += ',图片';
        if (includeFullText) header += ',完整OCR文本';
        csvContent += header + '\n';

        // Build data rows
        records.forEach(r => {
            const statusText = r.status === 'pending' ? '待审核' : r.status === 'reviewed' ? '已审核' : '需复核';
            const timeStr = new Date(r.createdAt).toLocaleString('zh-CN');
            const escape = (str) => '"' + (str || '').toString().replace(/"/g, '""') + '"';

            let row = `${escape(r.name)},${escape(r.gender)},${escape(r.age)},${escape(r.diagnosis)},${escape(r.stage)},${escape(statusText)},${escape(timeStr)}`;
            if (includeFilename) row += `,${escape(r.fileName || '')}`;
            if (includeImageNote) row += `,${escape(r.imageData ? '是' : '否')}`;
            if (includeFullText) row += `,${escape(r.originalText || '')}`;

            csvContent += row + '\n';
        });

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const safeFilename = sanitizeCSVFilename('医疗病例识别');
        link.href = URL.createObjectURL(blob);
        link.download = `${safeFilename}_${timestamp}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        // Show success message
        const optionsText = [
            includeFullText ? '完整文本' : null,
            includeImageNote ? '图片信息' : null,
            includeFilename ? '文件名' : null
        ].filter(Boolean).join('、');

        showToast(`成功导出 ${records.length} 条记录 (CSV${optionsText ? ', 含' + optionsText : ''})`);
    } catch (error) {
        console.error('CSV导出失败:', error);
        showToast('导出失败: ' + error.message, 'error');
    }
}
