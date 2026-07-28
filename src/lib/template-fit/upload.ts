import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { api } from '@/lib/api';

export type PickedDesign = {
  uri: string;
  name: string;
  mimeType: string;
  width?: number;
  height?: number;
};

/** Matches the website's ACCEPT_PREVIEWABLE_DESIGN_FILES (UploadBox.tsx) —
 * PNG/JPG/SVG/PDF. AI files are excluded there too (not reliably
 * renderable), so this stays in sync intentionally. */
const DOCUMENT_PICKER_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];

/** Takes a new photo with the camera. */
export async function takeDesignPhoto(): Promise<PickedDesign | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchCameraAsync({ quality: 1, exif: false });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const name = asset.fileName ?? asset.uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  const mimeType = asset.mimeType ?? guessMimeType(name);
  return { uri: asset.uri, name, mimeType, width: asset.width, height: asset.height };
}

/** Lets the customer pick any supported design file — photos, PDFs or SVGs
 * — from their device (Photos, Files/Downloads, cloud drives, etc.). Uses
 * the system document picker rather than a photos-only picker so PDF/SVG
 * uploads work the same as on the website, not just images. */
export async function pickDesignFile(): Promise<PickedDesign | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: DOCUMENT_PICKER_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const name = asset.name ?? asset.uri.split('/').pop() ?? `design-${Date.now()}`;
  const mimeType = asset.mimeType ?? guessMimeType(name);
  return { uri: asset.uri, name, mimeType };
}

function guessMimeType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'pdf') return 'application/pdf';
  return 'image/jpeg';
}

/** True for the two vector/document formats that can't be previewed with a
 * plain <Image> in the Fit Studio board — same rule as the website's
 * isPreviewableDesignFile()/PDF gate, just inverted since we don't have a
 * client-side PDF renderer to fall back to (see pdf-to-image.ts on web). */
export function isPreviewIncompatible(mimeType: string): boolean {
  return mimeType === 'application/pdf' || mimeType === 'image/svg+xml';
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
