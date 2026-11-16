/* Photos are shrunk in the browser before they go up, so a 12 MB camera file never has to cross the wire or sit in storage. */
const LIMIT = 1_250_000;

export type Uploaded = { src: string; width: number; height: number };

async function shrink(file: File, maxWidth: number): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  // keep each file under the cap (the database holds about 2 MB per row): lower the quality first, then the size
  let scale = Math.min(1, maxWidth / bitmap.width);
  for (let attempt = 0; attempt < 6; attempt++, scale *= 0.85) {
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
    for (const quality of [0.86, 0.78, 0.7]) {
      const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, 'image/jpeg', quality));
      if (blob && blob.size <= LIMIT) {
        bitmap.close();
        return { blob, width, height };
      }
    }
  }
  bitmap.close();
  throw new Error('could not shrink that photo enough');
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
