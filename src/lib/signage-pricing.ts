/** Ported from the website's signage-pricing.ts — "Decal Signage Calculator"
 * service-plan-based calculator. Customer enters a single rectangle
 * (Width × Length) with quantity, then picks one of three service tiers.
 * Each tier defines its own $/sqft and that's the entire price. No
 * materials, no tax. */

export type ServicePlanKey = 'print-only' | 'design-print' | 'full-install';

export type ServicePlan = {
  key: ServicePlanKey;
  label: string;
  pricePerSqFt: number;
  description: string;
};

export const SERVICE_PLANS: ServicePlan[] = [
  { key: 'print-only', label: 'Print Only', pricePerSqFt: 10.0, description: 'We print it. You handle the rest.' },
  { key: 'design-print', label: 'Design & Print', pricePerSqFt: 12.0, description: 'We design your artwork and print it.' },
  {
    key: 'full-install',
    label: 'Full Install',
    pricePerSqFt: 18.0,
    description: 'Design + print + professional on-site installation.',
  },
];

export type MeasurementUnit = 'ft' | 'in';

export type SignagePriceInput = {
  /** Width in the chosen unit. */
  width: number;
  /** Length in the chosen unit. */
  length: number;
  unit: MeasurementUnit;
  quantity: number;
  servicePlan: ServicePlanKey;
  /** Percentage 0–100. */
  discountPercent: number;
};

export type SignagePriceResult = {
  /** Area of a single panel in sqft. */
  unitAreaSqFt: number;
  /** Total area = unit area × quantity. */
  totalAreaSqFt: number;
  pricePerSqFt: number;
  subtotal: number;
  discountAmount: number;
  total: number;
};

export function calcSignageQuotePrice(input: SignagePriceInput): SignagePriceResult {
  const plan = SERVICE_PLANS.find((p) => p.key === input.servicePlan) ?? SERVICE_PLANS[0];

  const w = Math.max(0, Number(input.width) || 0);
  const l = Math.max(0, Number(input.length) || 0);
  const qty = Math.max(1, Math.floor(Number(input.quantity) || 1));

  const unitAreaSqFt = input.unit === 'ft' ? w * l : (w * l) / 144;
  const totalAreaSqFt = unitAreaSqFt * qty;

  const subtotal = round2(plan.pricePerSqFt * totalAreaSqFt);
  const discountPct = Math.max(0, Math.min(100, Number(input.discountPercent) || 0));
  const discountAmount = round2((subtotal * discountPct) / 100);
  const total = round2(subtotal - discountAmount);

  return {
    unitAreaSqFt: Math.round(unitAreaSqFt * 100) / 100,
    totalAreaSqFt: Math.round(totalAreaSqFt * 100) / 100,
    pricePerSqFt: plan.pricePerSqFt,
    subtotal,
    discountAmount,
    total,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
