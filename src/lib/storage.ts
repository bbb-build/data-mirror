// IndexedDB永続ストレージ — 解析結果をブラウザに保存
import { ParsedUserData } from "./types";

const DB_NAME = "data-mirror";
const DB_VERSION = 1;
const STORE_NAME = "results";

export interface StoredResult {
  id: string; // ISO timestamp
  data: ParsedUserData;
  analyzedAt: number; // Date.now()
  sourcesSummary: string; // "YouTube, Chrome, ..." 表示用
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// 最新の解析結果を保存
export async function saveResult(data: ParsedUserData): Promise<StoredResult> {
  const db = await openDB();
  const entry: StoredResult = {
    id: new Date().toISOString(),
    data,
    analyzedAt: Date.now(),
    sourcesSummary: data.sources.join(", "),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve(entry);
    tx.onerror = () => reject(tx.error);
  });
}

// 最新の結果を1件取得
export async function getLatestResult(): Promise<StoredResult | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor(null, "prev"); // 降順で最新を取得
    req.onsuccess = () => {
      const cursor = req.result;
      resolve(cursor ? (cursor.value as StoredResult) : null);
    };
    req.onerror = () => reject(req.error);
  });
}

// 全結果を取得（新しい順）
export async function getAllResults(): Promise<StoredResult[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const results = req.result as StoredResult[];
      results.sort((a, b) => b.analyzedAt - a.analyzedAt);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

// 全データ削除
export async function clearResults(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
