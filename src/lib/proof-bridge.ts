/**
 * Hands the mobile-proof web page's deep-link result to whichever
 * vinyl-stickers screen instance is currently mounted, without navigating
 * away from it (which would reset the in-progress configurator state).
 */
export type ProofBridgeResult =
  | {
      status: 'approved' | 'changes-requested';
      proofUrl?: string;
      cutlineUrl?: string;
      shape: string;
      borderThickness: string;
      roundedCorners: string;
      removedBackground: boolean;
      lowResolution: boolean;
      changeNote?: string;
    }
  | { status: 'cancelled' };

let listener: ((result: ProofBridgeResult) => void) | null = null;

export function setProofBridgeListener(fn: ((result: ProofBridgeResult) => void) | null) {
  listener = fn;
}

export function emitProofBridgeResult(result: ProofBridgeResult) {
  listener?.(result);
}
