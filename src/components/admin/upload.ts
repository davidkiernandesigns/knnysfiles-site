/* Photos are shrunk in the browser before they go up, so a 12 MB camera file never has to cross the wire or sit in storage. */
export type Uploaded = { src: string; width: number; height: number };

async function shrink(file: File, maxWidth: number): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, 'image/jpeg', 0.86));
  if (!blob) throw new Error('could not read that image');
  return { blob, width, height };
}

export async function uploadImage(file: File, maxWidth: number): Promise<Uploaded> {
  const { blob, width, height } = await shrink(file, maxWidth);
  const body = new FormData();
  body.set('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
  const response = await fetch('/api/admin/upload', { method: 'POST', body });
  const data = (await response.json().catch(() => ({}))) as { src?: string; error?: string };
  if (!response.ok || !data.src) throw new Error(data.error ?? 'upload failed');
  return { src: data.src, width, height };
}
