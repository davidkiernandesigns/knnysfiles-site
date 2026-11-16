/* Just the parts of the Cloudflare D1 and R2 APIs this site uses, so no extra types package is needed. */
export type D1Result<T = Record<string, unknown>> = { results: T[]; success: boolean };
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: { changes?: number; last_row_id?: number } }>;
}
export interface D1 {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
}
export interface R2Object {
  body: ReadableStream;
  httpEtag: string;
  size: number;
  httpMetadata?: { contentType?: string };
}
export interface R2 {
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | Blob, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  delete(keys: string | string[]): Promise<void>;
}
export interface ImagesBinding {
  input(stream: ReadableStream): {
    transform(options: { width: number }): {
      output(options: { format: 'image/jpeg' | 'image/webp'; quality?: number }): Promise<{ response(): Response }>;
    };
  };
}
export type Env = {
  DB: D1 | null;
  MEDIA: R2 | null;
  IMAGES: ImagesBinding | null;
  adminPassword: string;
  webhook: string;
};
