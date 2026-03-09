/**
 * 批量插入测试重复数据
 * 使用方法: node scripts/insert-test-duplicates.js
 */

const fs = require('fs');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'data', 'records.db');

if (!fs.existsSync(dbPath)) {
    console.error('数据库文件不存在:', dbPath);
    console.error('请先运行应用程序创建数据库');
    process.exit(1);
}

// 加载 sql.js
const initSqlJs = require('sql.js');

async function main() {
    const SQL = await initSqlJs();

    // 读取数据库文件
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    console.log('数据库连接成功');

    // 测试数据：相同的姓名和文件名，不同的时间
    const testData = [
        { name: '张三', fileName: '病例1.pdf', createdAt: '2024-01-01T10:00:00.000Z' },
        { name: '张三', fileName: '病例1.pdf', createdAt: '2024-01-02T10:00:00.000Z' },
        { name: '张三', fileName: '病例1.pdf', createdAt: '2024-01-03T10:00:00.000Z' },
        { name: '李四', fileName: '检查报告.jpg', createdAt: '2024-02-01T08:00:00.000Z' },
        { name: '李四', fileName: '检查报告.jpg', createdAt: '2024-02-05T08:00:00.000Z' },
        { name: '王五', fileName: '诊断书.png', createdAt: '2024-03-01T12:00:00.000Z' },
        { name: '王五', fileName: '诊断书.png', createdAt: '2024-03-10T12:00:00.000Z' },
        { name: '王五', fileName: '诊断书.png', createdAt: '2024-03-15T12:00:00.000Z' },
    ];

    // 插入测试数据
    console.log('开始插入测试数据...');

    for (const data of testData) {
        db.run(`
            INSERT INTO records
            (fileName, name, biopsyPathology, tnmStage, surgeryTime, postopPathology, her2Status, erStatus, ki67, originalText, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            data.fileName,
            data.name,
            '未检出',
            '未检出',
            '未检出',
            '未检出',
            '未检出',
            '未检出',
            '未检出',
            '测试数据',
            'pending',
            data.createdAt,
            data.createdAt
        ]);
        console.log(`插入: ${data.name} - ${data.fileName} (${data.createdAt})`);
    }

    // 保存数据库
    const data = db.export();
    const bufferOut = Buffer.from(data);
    fs.writeFileSync(dbPath, bufferOut);

    console.log('\n测试数据插入完成！');
    console.log(`共插入 ${testData.length} 条记录`);

    // 验证插入
    const result = db.exec('SELECT name, fileName, createdAt FROM records ORDER BY createdAt');
    console.log('\n当前数据库记录:');
    if (result.length > 0) {
        result[0].values.forEach(row => {
            console.log(`  ${row[0]} - ${row[1]} (${row[2]})`);
        });
    }

    db.close();
}

main().catch(err => {
    console.error('错误:', err);
    process.exit(1);
});
