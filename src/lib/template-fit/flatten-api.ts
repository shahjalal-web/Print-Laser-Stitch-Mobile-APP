import { api } from '@/lib/api';

export type Rotation = 0 | 90 | 180 | 270;

export type FlattenRequest = {
  imageUrl: string;
  filename: string;
  bleedWIn: number;
  bleedHIn: number;
  widthIn: number;
  offsetXIn: number;
  offsetYIn: number;
  rotation?: Rotation;
  flipX?: boolean;
  flipY?: boolean;
};

/** Calls the server-side rasterizer (/api/template-fit/flatten) — the mobile
 * equivalent of the website's client-side flattenToCanvas() +
 * uploadFlattenedDesign(), combined into one round trip since React Native
 * has no DOM <canvas> to do this locally. */
export async function flattenAndUpload(req: FlattenRequest): Promise<string> {
  const { url } = await api.post<{ url: string }>('/api/template-fit/flatten', req);
  return url;
}
