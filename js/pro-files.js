/**
 * 医疗病例 OCR 识别系统 Pro - 文件操作模块
 * Medical OCR Pro - File Operations Module
 */

// ============================================================================
// FILE SELECTION
// ============================================================================
async function selectFolder() {
    if (window.electron && window.electron.dialog) {
        const result = await window.electron.dialog.showOpenDialog({
            title: '选择文件夹',
            properties: ['openDirectory']
        });
        if (!result.canceled && result.filePaths.length > 0) {
            const fs = window.fs;
            const path = window.path;
            const files = getAllFiles(result.filePaths[0], fs, path);
            await addFilesToQueue(files);
        }
    } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            addFilesToQueue(files);
        };
        input.click();
    }
}

async function selectFiles() {
    if (window.electron && window.electron.dialog) {
        const result = await window.electron.dialog.showOpenDialog({
            title: '选择文件',
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
                { name: 'PDF文件', extensions: ['pdf'] }
            ]
        });
        if (!result.canceled && result.filePaths.length > 0) {
            const fs = window.fs;
            const path = window.path;
            const files = result.filePaths.map(p => ({
                path: p,
                name: path.basename(p),
                size: fs.statSync(p).size,
                type: getFileType(p, path)
            }));
            await addFilesToQueue(files);
        }
    } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*,.pdf';
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            addFilesToQueue(files);
        };
        input.click();
    }
}

// ============================================================================
// FOLDER TRAVERSAL
// ============================================================================
function getAllFiles(folderPath, fs, path) {
    const files = [];
    const supported = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'pdf'];

    function traverse(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    traverse(fullPath);
                } else {
                    const ext = entry.name.split('.').pop().toLowerCase();
                    if (supported.includes(ext)) {
                        files.push({
                            path: fullPath,
                            name: entry.name,
                            size: fs.statSync(fullPath).size,
                            type: ext === 'pdf' ? 'application/pdf' : 'image/' + ext
                        });
                    }
                }
            }
        } catch (e) {}
    }
    traverse(folderPath);
    return files;
}

function getFileType(filePath, path) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf'
    };
    return types[ext] || 'application/octet-stream';
}

// ============================================================================
// FILE READING
// ============================================================================
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
