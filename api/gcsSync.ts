import fs from 'fs';
import path from 'path';
import { Storage } from '@google-cloud/storage';

const bucketName = process.env.GCS_BUCKET_NAME || 'vnhk-db';
const DB_DIR = path.join(process.cwd(), 'db');

let storageInstance: Storage | null = null;
let gcsSyncEnabled = true;

function getStorage() {
  if (!storageInstance) {
    storageInstance = new Storage();
  }
  return storageInstance;
}

/**
 * Tải toàn bộ dữ liệu từ GCS Bucket về thư mục /db cục bộ khi ứng dụng khởi động.
 */
export async function downloadDbFromGCS(): Promise<void> {
  if (!gcsSyncEnabled) return;
  console.log(`[GCS Sync] Starting startup download check from bucket: ${bucketName}`);
  try {
    const storage = getStorage();
    const bucket = storage.bucket(bucketName);

    const [exists] = await bucket.exists();
    if (!exists) {
      console.warn(`[GCS Sync] Bucket "${bucketName}" does not exist. Skipping initial download.`);
      return;
    }

    const [files] = await bucket.getFiles();
    console.log(`[GCS Sync] Found ${files.length} files in GCS bucket.`);

    for (const file of files) {
      if (file.name.endsWith('/')) continue;

      const localFilePath = path.join(DB_DIR, file.name);
      const localFileDir = path.dirname(localFilePath);

      if (!fs.existsSync(localFileDir)) {
        fs.mkdirSync(localFileDir, { recursive: true });
      }

      console.log(`[GCS Sync] Downloading ${file.name} -> ${localFilePath}`);
      await file.download({ destination: localFilePath });
    }
    console.log('[GCS Sync] Initial GCS download sync complete.');
  } catch (err: any) {
    gcsSyncEnabled = false;
    console.warn(`[GCS Sync] GCS download unavailable (${err.message || err}). Using local file storage.`);
  }
}

// Hàng đợi lưu các file cần upload hoặc xóa
const pendingUploads = new Set<string>();
const pendingDeletions = new Set<string>();
let syncTimeout: NodeJS.Timeout | null = null;
let isSyncing = false;

export function queueUpload(relativePath: string): void {
  if (!gcsSyncEnabled) return;
  pendingDeletions.delete(relativePath);
  pendingUploads.add(relativePath);
  scheduleSync();
}

export function queueDelete(relativePath: string): void {
  if (!gcsSyncEnabled) return;
  pendingUploads.delete(relativePath);
  pendingDeletions.add(relativePath);
  scheduleSync();
}

function scheduleSync() {
  if (!gcsSyncEnabled) return;
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    runSyncInBackground();
  }, 2000); // Đợi 2s để gom các thay đổi (batching)
}

async function runSyncInBackground() {
  if (!gcsSyncEnabled) {
    pendingUploads.clear();
    pendingDeletions.clear();
    return;
  }

  if (isSyncing) {
    // Nếu đang đồng bộ, lên lịch chạy lại sau khi hoàn thành
    scheduleSync();
    return;
  }

  if (pendingUploads.size === 0 && pendingDeletions.size === 0) {
    return;
  }

  isSyncing = true;
  const uploads = Array.from(pendingUploads);
  const deletions = Array.from(pendingDeletions);

  // Xóa hàng đợi ngay lập tức để nhận các thay đổi mới trong khi đang upload
  pendingUploads.clear();
  pendingDeletions.clear();

  console.log(`[GCS Sync] Running background sync: ${uploads.length} uploads, ${deletions.length} deletions.`);

  try {
    const storage = getStorage();
    const bucket = storage.bucket(bucketName);

    const [exists] = await bucket.exists();
    if (!exists) {
      console.warn(`[GCS Sync] Bucket "${bucketName}" does not exist. Disabling GCS sync.`);
      gcsSyncEnabled = false;
      isSyncing = false;
      return;
    }

    // Xử lý các file cần upload
    for (const relPath of uploads) {
      const localPath = path.join(DB_DIR, relPath);
      if (fs.existsSync(localPath)) {
        console.log(`[GCS Sync] Uploading ${relPath} to bucket`);
        await bucket.upload(localPath, {
          destination: relPath,
          resumable: false // File JSON nhỏ nên tắt chế độ resumable để tăng tốc độ upload
        });
      }
    }

    // Xử lý các file cần xóa
    for (const relPath of deletions) {
      console.log(`[GCS Sync] Deleting ${relPath} from bucket`);
      try {
        await bucket.file(relPath).delete();
      } catch (err: any) {
        if (err.code !== 404) {
          console.error(`[GCS Sync] Error deleting ${relPath}:`, err);
        }
      }
    }

    console.log('[GCS Sync] Background sync complete.');
  } catch (err: any) {
    gcsSyncEnabled = false;
    pendingUploads.clear();
    pendingDeletions.clear();
    console.warn(`[GCS Sync] GCS sync encountered error (${err.message || err}). Disabling GCS background sync, continuing with local storage.`);
  } finally {
    isSyncing = false;
  }
}
