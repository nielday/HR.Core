import fs from 'fs';
import path from 'path';
import { Storage } from '@google-cloud/storage';

const bucketName = process.env.GCS_BUCKET_NAME || 'vnhk-db';
const DB_DIR = path.join(process.cwd(), 'db');

let storageInstance: Storage | null = null;
// Đặt GCS_DISABLED=1 khi đã gắn ổ đĩa cố định vào db/ — lúc đó không cần GCS, và tắt hẳn
// thì khỏi phải nhìn cảnh báo mỗi lần ghi.
let gcsSyncEnabled = process.env.GCS_DISABLED !== '1';

// ⚠️ NGUY HIỂM NHẤT TRONG FILE NÀY.
// GCS hỏng bất kỳ lý do gì là code cũ đặt gcsSyncEnabled = false rồi CHẠY TIẾP như không
// có chuyện gì: app vẫn lưu được, người dùng vẫn xếp đội bình thường, chỉ có một dòng log
// lặng lẽ. Trên PaaS (Railway/Render...) ổ đĩa container là TẠM, nên lần deploy sau là
// MẤT SẠCH mà không ai kịp biết.
//
// Không sửa được bằng cách bỏ tính năng chạy-không-cần-GCS (chạy máy nhà vẫn cần). Nên
// thay bằng: kêu to, kêu lặp lại, và nói rõ hậu quả.
//
// MUỐN KHỎI LO HẲN: gắn ổ đĩa cố định (Railway Volume) vào thư mục db/ rồi đặt
// GCS_DISABLED=1. Lúc đó dữ liệu nằm trên đĩa thật, không phụ thuộc Google.
let daCanhBao = false;
let soLanGhiHut = 0;

function tatDongBo(lyDo: string) {
  gcsSyncEnabled = false;
  if (daCanhBao) return;
  daCanhBao = true;
  console.error('='.repeat(70));
  console.error('[GCS Sync] ĐÃ TẮT ĐỒNG BỘ. Lý do: ' + lyDo);
  console.error('[GCS Sync] Dữ liệu từ giờ CHỈ nằm trên đĩa của container.');
  console.error('[GCS Sync] Nếu đang chạy trên PaaS: LẦN DEPLOY SAU LÀ MẤT HẾT.');
  console.error('[GCS Sync] Khắc phục: gắn ổ đĩa cố định vào db/, hoặc sửa lại GCS.');
  console.error('='.repeat(70));
}

// Nhắc lại mỗi 20 lần ghi. Cảnh báo một lần lúc khởi động rất dễ trôi mất giữa rừng log,
// rồi ba ngày sau deploy phát là ngã ngửa. Đây là thứ đáng lải nhải.
function ghiHut() {
  if (process.env.GCS_DISABLED === '1') return;   // cố ý tắt thì thôi, không cằn nhằn
  soLanGhiHut += 1;
  if (soLanGhiHut % 20 === 1) {
    console.warn(`[GCS Sync] ⚠️ Đã ghi ${soLanGhiHut} lần mà KHÔNG đồng bộ lên GCS. `
      + 'Dữ liệu chỉ nằm trên đĩa container, deploy lại là mất.');
  }
}

/** Có đang đồng bộ được không. Dùng cho endpoint kiểm tra sức khoẻ. */
export const dongBoDangChay = () => gcsSyncEnabled;

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
    tatDongBo(`không tải được dữ liệu từ GCS: ${err.message || err}`);
  }
}

// Hàng đợi lưu các file cần upload hoặc xóa
const pendingUploads = new Set<string>();
const pendingDeletions = new Set<string>();
let syncTimeout: NodeJS.Timeout | null = null;
let isSyncing = false;

export function queueUpload(relativePath: string): void {
  if (!gcsSyncEnabled) { ghiHut(); return; }
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
      tatDongBo(`bucket "${bucketName}" không tồn tại`);
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
    tatDongBo(`lỗi khi đồng bộ: ${err.message || err}`);
    pendingUploads.clear();
    pendingDeletions.clear();
  } finally {
    isSyncing = false;
  }
}
