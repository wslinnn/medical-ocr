/**
 * 批量插入测试数据脚本
 * 用法: node insert-test-data.js [数量]
 * 默认插入10万条
 */

const path = require('path');
const fs = require('fs');

// 初始化 SQLite
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'data', 'medical.db');

async function main() {
    const count = parseInt(process.argv[2]) || 100000;
    console.log(`准备插入 ${count} 条测试数据...`);

    // 确保 data 目录存在
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // 读取示例图片（只给部分记录添加图片，避免数据库过大）
    let sampleImageData = null;
    const sampleImagePaths = [
        path.join(__dirname, 'assets', 'sample.jpg')
    ];

    for (const imgPath of sampleImagePaths) {
        if (fs.existsSync(imgPath)) {
            sampleImageData = fs.readFileSync(imgPath);
            console.log(`使用示例图片: ${imgPath} (${(sampleImageData.length / 1024).toFixed(1)} KB)`);
            break;
        }
    }

    // 只有部分记录存储图片，避免数据库过大（约347MB for 1000 records with images）
    const recordsWithImage = sampleImageData ? Math.min(1000, count) : 0;
    console.log(`将给前 ${recordsWithImage} 条记录添加图片，其余记录不存储图片`);

    const SQL = await initSqlJs();

    let db;
    let isNewDb = false;

    // 加载或创建数据库
    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
        console.log('加载现有数据库');
    } else {
        db = new SQL.Database();
        isNewDb = true;
        console.log('创建新数据库');
    }

    // 创建表（如果不存在）
    if (isNewDb) {
        db.run(`
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fileName TEXT,
                name TEXT,
                biopsyPathology TEXT,
                tnmStage TEXT,
                surgeryTime TEXT,
                postopPathology TEXT,
                her2Status TEXT,
                erStatus TEXT,
                ki67 TEXT,
                originalText TEXT,
                imageData BLOB,
                status TEXT DEFAULT 'pending',
                createdAt TEXT,
                updatedAt TEXT
            )
        `);
        console.log('创建表结构');
    }

    // 批量插入
    const batchSize = 1000;
    const batches = Math.ceil(count / batchSize);

    console.log(`开始插入 ${count} 条数据（每批 ${batchSize} 条）...`);
    const startTime = Date.now();

    // 使用预处理语句批量插入
    const stmt = db.prepare(
        `INSERT INTO records (fileName, name, biopsyPathology, tnmStage, surgeryTime, postopPathology, her2Status, erStatus, ki67, originalText, imageData, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (let batch = 0; batch < batches; batch++) {
        const currentBatchSize = Math.min(batchSize, count - batch * batchSize);

        for (let i = 0; i < currentBatchSize; i++) {
            const idx = batch * batchSize + i + 1;
            const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString();

            stmt.run([
                `测试文件_${idx}.jpg`,
                `患者${idx}`,
                `穿刺病理${idx % 10}`,
                `T${idx % 4}N${idx % 3}M${idx % 2}`,
                new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                `术后病理${idx % 15}`,
                ['阳性', '阴性', '++', '+++'][idx % 4],
                ['阳性', '阴性'][idx % 2],
                `${(Math.random() * 80 + 10).toFixed(1)}%`,
                `原始文本${idx}`,
                idx <= recordsWithImage ? sampleImageData : null,  // 只有前1000条有图片
                ['pending', 'reviewed', 'flagged'][idx % 3],
                createdAt,
                createdAt
            ]);
        }

        const progress = ((batch + 1) / batches * 100).toFixed(1);
        console.log(`进度: ${progress}% (${(batch + 1) * batchSize} / ${count})`);
    }

    stmt.free();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // 保存数据库
    const data = db.export();
    fs.writeFileSync(DB_PATH, data);

    // 验证插入结果
    const result = db.exec('SELECT COUNT(*) as cnt FROM records');
    const actualCount = result[0].values[0][0];

    console.log(`\n完成!`);
    console.log(`- 插入耗时: ${duration} 秒`);
    console.log(`- 实际记录数: ${actualCount}`);
    console.log(`- 平均速度: ${(count / duration).toFixed(0)} 条/秒`);

    db.close();
}

main().catch(console.error);
