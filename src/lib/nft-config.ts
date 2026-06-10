// Re‑exports from site-config.ts — kept for backward‑compat with existing imports.
// New code should import directly from '@/lib/site-config'.
export {
  PALETTE as palette,
  STATUS_NAMES,
  STATUS_LEVELS,
  getNextStatus,
  computeCountdown,
  pad,
} from "@/lib/site-config";

export interface NFT {
  id: string;
  name: string;
  image: string;
  traits: Record<string, string>;
  phase?: string;
  mintedAt?: string;
  collection: string;
}

export interface UserNFTData {
  wallet: string;
  solWallet?: string;
  status: string;
  referrals: number;
  mxp: number;
  nfts: NFT[];
}
