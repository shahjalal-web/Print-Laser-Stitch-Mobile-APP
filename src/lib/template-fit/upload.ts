import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { api } from '@/lib/api';

export type PickedDesign = {
  uri: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
};

/** Lets the customer pick a photo/design from their library. PDFs/SVGs
 * aren't supported here (unlike the website's UploadBox) — mobile customers
 * are overwhelmingly uploading photos straight from their camera roll, and
 * adding a PDF-render pipeline (pdf.js is web-only; RN needs a native PDF
 * renderer) isn't worth the risk for this first version. */
export async function pickDesignImage(): Promise<PickedDesign | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    exif: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const name = asset.fileName ?? asset.uri.split('/').pop() ?? `design-${Date.now()}.jpg`;
  const mimeType = asset.mimeType ?? guessMimeType(name);
  return { uri: asset.uri, name, mimeType, width: asset.width, height: asset.height };
}

function guessMimeType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

type StagedTarget = {
  url: string;
  resourceUrl: string;
  parameters: Array<{ name: string; value: string }>;
};

/** Three-step direct upload to Shopify Files, reusing the same
 * /api/shopify-upload/{stage,register} routes the website's UploadBox uses.
 * RN's fetch supports multipart FormData with a { uri, name, type } file
 * descriptor natively, same shape as the raw POST the browser does. */
export async function uploadDesignImage(file: PickedDesign): Promise<string> {
  const fileSizeBytes = new File(file.uri).size ?? 0;

  const staged = await api.post<StagedTarget>('/api/shopify-upload/stage', {
    filename: file.name,
    mimeType: file.mimeType,
    fileSize: fileSizeBytes,
  });

  const fd = new FormData();
  for (const param of staged.parameters) fd.append(param.name, param.value);
  fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);

  const uploadResp = await fetch(staged.url, { method: 'POST', body: fd });
  if (!uploadResp.ok) {
    throw new Error(`Upload to staging failed (${uploadResp.status})`);
  }

  const registered = await api.post<{ fileId: string; url: string }>('/api/shopify-upload/register', {
    resourceUrl: staged.resourceUrl,
    filename: file.name,
    mimeType: file.mimeType,
  });
  return registered.url;
}
