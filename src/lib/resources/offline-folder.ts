type FolderPermissionDescriptor = { mode?: "read" | "readwrite" };

let folderHandle: FileSystemDirectoryHandle | null = null;

export function hasFolderAccessSupport() {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export function getOfflineFolderHandle() {
  return folderHandle;
}

export async function readOfflineFolderFile(fileKey: string) {
  const handle = getOfflineFolderHandle();
  if (!handle) return null;
  try {
    const fileHandle = await handle.getFileHandle(fileKey);
    return await fileHandle.getFile();
  } catch {
    return null;
  }
}

export async function writeOfflineFolderFile(fileKey: string, blob: Blob) {
  const handle = getOfflineFolderHandle();
  if (!handle) return false;
  try {
    const fileHandle = await handle.getFileHandle(fileKey, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

export async function removeOfflineFolderFile(fileKey: string) {
  const handle = getOfflineFolderHandle();
  if (!handle) return false;
  try {
    await handle.removeEntry(fileKey);
    return true;
  } catch {
    return false;
  }
}

export async function requestOfflineFolderAccess() {
  if (!hasFolderAccessSupport()) return null;
  try {
    const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> })
      .showDirectoryPicker;
    if (!picker) return null;
    const handle = await picker();
    const permission =
      "requestPermission" in handle
        ? await (
            handle as FileSystemDirectoryHandle & {
              requestPermission?: (
                descriptor?: FolderPermissionDescriptor,
              ) => Promise<PermissionState>;
            }
          ).requestPermission?.({ mode: "readwrite" })
        : null;
    if (permission && permission !== "granted") {
      return null;
    }
    folderHandle = handle;
    return handle;
  } catch {
    return null;
  }
}
