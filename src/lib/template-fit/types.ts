import type { SizeUnit } from '@/lib/parse-size';

export type TemplateFitSide = 'front' | 'back';

export type TemplateFitVariant = {
  id: string;
  price: string;
  selectedOptions: Record<string, string>;
};

/** Handed off from the product screen to the Fit Studio screen via router
 * params (JSON-stringified) — the RN equivalent of the website's sessionStorage
 * handoff (see the web's src/lib/template-fit/session.ts), since there's no
 * browser storage/full-navigation boundary between the two screens here. */
export type TemplateFitPayload = {
  productHandle: string;
  productTitle: string;
  widthIn: number;
  heightIn: number;
  uploadLabel: string;
  effectiveUploadMode: 'single' | 'front-back';
  sides: Partial<Record<TemplateFitSide, { fileUrl: string; fileName: string | null }>>;
  bleedIn: number;
  sizeUnit: SizeUnit;
  variants: TemplateFitVariant[];
  cartItem: {
    title: string;
    thumbnail: string;
    unitPrice: number;
    qty: number;
    variantId: string;
    productTitle: string;
    selectedOptions: Record<string, string>;
    extraProperties: Record<string, string>;
    editHref: string;
  };
};
