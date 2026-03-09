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

    async getCount() {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.getCount();
    }

    async getStatusCounts() {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.getStatusCounts();
    }

    async getTodayCount() {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.getTodayCount();
    }

    async getPaginated(options) {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.getPaginated(options);
    }

    // 对比审核专用分页查询（包含imageData）
    async getPaginatedWithImage(options) {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.getPaginatedWithImage(options);
    }

    // 获取所有记录的ID列表（用于去重）
    async getAllIds() {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.getAllIds();
    }

    // 查找重复记录（姓名+文件名相同）
    async findDuplicates() {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.findDuplicates();
    }

    // 根据ID获取单条记录
    async getById(id) {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.getById(id);
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

    async update(id, updates) {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.update(id, updates);
    }

    async updateStatus(id, status) {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.updateStatus(id, status);
    }

    // 批量更新状态
    async updateStatusMany(ids, status) {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.updateStatusMany(ids, status);
    }

    async delete(id) {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.delete(id);
    }

    async deleteMany(ids) {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.deleteMany(ids);
    }

    async clear() {
        if (!window.sqliteDB) {
            throw new Error('SQLite 不可用，请使用 Electron 环境运行');
        }
        return await window.sqliteDB.clear();
    }
}

const db = new MedicalDB();
