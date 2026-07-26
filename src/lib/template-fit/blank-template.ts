import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

/** Downloads the server-rendered blank-template PDF (/api/template-fit/
 * blank-template) and opens the native share sheet so the customer can save
 * it or send it to whatever app they'll design in — RN has no
 * Blob/anchor-download mechanism like the website's downloadBlankTemplate(). */
export async function downloadAndShareBlankTemplate(opts: {
  widthIn: number;
  heightIn: number;
  sizeLabel: string;
  productTitle: string;
  bleedIn: number;
}): Promise<void> {
  const params = new URLSearchParams({
    widthIn: String(opts.widthIn),
    heightIn: String(opts.heightIn),
    sizeLabel: opts.sizeLabel,
    productTitle: opts.productTitle,
    bleedIn: String(opts.bleedIn),
  });
  const url = `${API_BASE_URL}/api/template-fit/blank-template?${params.toString()}`;

  const destinationDir = new Directory(Paths.cache);
  const slug = opts.sizeLabel.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
  const destination = new File(destinationDir, `template-${slug}.pdf`);
  if (destination.exists) destination.delete();

  const file = await File.downloadFileAsync(url, destination);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
