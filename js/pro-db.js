/**
 * 医疗病例 OCR 识别系统 Pro - IndexedDB 存储模块
 */

const DB_NAME = 'MedicalOCRProDB';
const DB_VERSION = 1;
const STORE_NAME = 'records';

class MedicalDB {
    constructor() {
        this.db = null;
        this._initPromise = null;
    }

    async init() {
        // Return existing init promise if already initializing
        if (this._initPromise) {
            return this._initPromise;
        }

        this._initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                this._initPromise = null;
                reject(request.error);
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    // 使用 id 作为主键
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    // 创建索引以便查询
                    store.createIndex('status', 'status', { unique: false });
                    store.createIndex('name', 'name', { unique: false });
                }
            };
        });

        return this._initPromise;
    }

    async getAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async save(record) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            // 移除不需要存储的大型非结构化数据（如 base64 图片数据如果不需要持久化存储）
            // 如果 imageData 需要持久化，则保留。用户提到"非结构化数据不需要存"，
            // 这里我们假设 imageData 仍然需要，但我们可以根据需要调整。
            
            const request = store.put(record);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async saveAll(records) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            records.forEach(record => {
                store.put(record);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async delete(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

const db = new MedicalDB();
