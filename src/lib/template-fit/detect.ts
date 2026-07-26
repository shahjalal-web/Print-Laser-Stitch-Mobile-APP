import { findDimensionOption, selectedSizeInches, type SizeUnit } from '@/lib/parse-size';

export type TemplateFitOverrides = {
  sizeUnit?: SizeUnit;
  showBleedTrim?: boolean;
  fixedSizeInches?: { width: number; height: number };
  uploadMode?: 'single' | 'front-back';
  uploadLabel?: string;
};

type ProductOption = { name: string; values: string[] };

// Mirrors GenericProductConfigurator.tsx on the website — must stay in sync,
// since the same product should end up in the same effective upload mode on
// both platforms. See that file for the reasoning behind each rule.
const DOUBLE_SIDED_KEYWORDS = [
  'business card',
  'flyer',
  'door hanger',
  'brochure',
  'postcard',
  'rack card',
  'hang tag',
  'table tent',
  'greeting card',
  'invitation',
  'leaflet',
  'pamphlet',
];

function findSidesOption(options: ProductOption[]): ProductOption | undefined {
  return options.find((o) => /^(print\s*sides|sides|layout)$/i.test(o.name.trim()));
}

function valueIndicatesBothSides(value: string | undefined): boolean {
  if (!value) return false;
  return /both|double|front\s*(?:and|&|\+)\s*back|2[\s-]*sided|two[\s-]*sided/i.test(value);
}

function isDoubleSidedCapable(title: string, handle: string): boolean {
  const haystack = `${title} ${handle}`.toLowerCase().replace(/[-_]+/g, ' ');
  return DOUBLE_SIDED_KEYWORDS.some((kw) => haystack.includes(kw));
}

export type TemplateFitDetection = {
  templateFitEnabled: boolean;
  sizeInches: { width: number; height: number } | null;
  effectiveUploadMode: 'single' | 'front-back' | 'none';
  /** True when the built-in Front Only / Front & Back selector should show
   * (no Shopify "Print Sides" option, but a double-sided-capable product,
   * and no forced uploadMode override). */
  showSideSelector: boolean;
  bleedIn: number;
  sizeUnit: SizeUnit;
  uploadLabel: string;
};

export function detectTemplateFit(
  product: { title: string; handle: string; options: ProductOption[] },
  selectedOptions: Record<string, string>,
  overrides: TemplateFitOverrides,
  printSide: 'front' | 'both',
  baseBleedIn: number,
): TemplateFitDetection {
  const sizeUnit = overrides.sizeUnit ?? 'in';
  const sidesOpt = overrides.uploadMode ? undefined : findSidesOption(product.options);
  const showSideSelector =
    !overrides.uploadMode && !sidesOpt && isDoubleSidedCapable(product.title, product.handle);

  let effectiveUploadMode: 'single' | 'front-back' | 'none';
  if (overrides.uploadMode) {
    effectiveUploadMode = overrides.uploadMode;
  } else if (sidesOpt) {
    effectiveUploadMode = valueIndicatesBothSides(selectedOptions[sidesOpt.name]) ? 'front-back' : 'single';
  } else if (showSideSelector) {
    effectiveUploadMode = printSide === 'both' ? 'front-back' : 'single';
  } else {
    effectiveUploadMode = 'single';
  }

  const templateFitEnabled = findDimensionOption(product.options) !== undefined || !!overrides.fixedSizeInches;
  const sizeInches = templateFitEnabled
    ? (selectedSizeInches(selectedOptions, sizeUnit) ?? overrides.fixedSizeInches ?? null)
    : null;

  return {
    templateFitEnabled,
    sizeInches,
    effectiveUploadMode,
    showSideSelector,
    bleedIn: overrides.showBleedTrim === false ? 0 : baseBleedIn,
    sizeUnit,
    uploadLabel: overrides.uploadLabel ?? 'Design',
  };
}
