/**
 * 医疗病例 AI 识别系统 Pro - SQLite 存储模块
 * Medical AI Pro - SQLite Storage Module
 * 数据存储到 exe 同目录的 data 文件夹
 */

class MedicalDB {
    constructor() {
        this._initPromise = null;
    }

    async init() {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return Promise.resolve();
    }

    async getAll() {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.getAll();
    }

    async save(record) {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.save(record);
    }

    async saveAll(records) {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.saveAll(records);
    }

    async delete(id) {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.delete(id);
    }

    async clear() {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.clear();
    }
}

const db = new MedicalDB();
