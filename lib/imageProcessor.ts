import * as ImageManipulator from 'expo-image-manipulator';
import { Paths, Directory, File } from 'expo-file-system';

async function ensureThumbDir(): Promise<Directory> {
  const dir = new Directory(Paths.document, 'thumbs');
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

export async function fileToBase64(uri: string): Promise<string> {
  const file = new File(uri);
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function fileToDataUrl(uri: string, mime = 'image/jpeg'): Promise<string> {
  const b64 = await fileToBase64(uri);
  return `data:${mime};base64,${b64}`;
}

export async function saveDataUrl(dataUrl: string, name = 'pixel'): Promise<string> {
  const dir = await ensureThumbDir();
  const destFile = dir.createFile(`${name}_${Date.now()}.png`, 'image/png');
  const base64 = dataUrl.split(',')[1];
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const ws = destFile.writableStream();
  const writer = ws.getWriter();
  await writer.write(bytes);
  await writer.close();
  return destFile.uri;
}

export async function processToThumbnail(uri: string): Promise<string> {
  const dir = await ensureThumbDir();

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      { resize: { width: 200, height: 200 } },
    ],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  const destFile = dir.createFile(`thumb_${Date.now()}.jpg`, 'image/jpeg');
  const sourceFile = new File(result.uri);
  await sourceFile.copy(destFile, { overwrite: true });
  return destFile.uri;
}

export async function saveOriginalImage(uri: string): Promise<string> {
  const dir = await ensureThumbDir();

  const destFile = dir.createFile(`orig_${Date.now()}.jpg`, 'image/jpeg');
  const sourceFile = new File(uri);
  await sourceFile.copy(destFile, { overwrite: true });
  return destFile.uri;
}
