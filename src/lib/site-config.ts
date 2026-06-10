// Layer 2 — Admin‑editable public config (fetched once, no polling).
// All defaults live here. Backend reads reward values from this config.

export const SITE = {
  projectName: "Ethereum Apes",
  shortName: "EAPE",
  pointsName: "MAGIC POINT",
  xpLabel: "EXP",
  balanceLabel: "MAGIC POINT",
  tokenSymbol: "$EAPE",
  hashtag: "#EAPE $EAPE",
  twitterUrl: "https://x.com/EthereumApes",
  telegramUrl: "https://t.me/ethereumapes",
  openseaCollection: "https://opensea.io/collection/ethereum-apes-nft/overview",

  lsKeys: {
    user: "eape_user",
    cache: "eape_cache",
    homepageCache: "eape_homepage_cache",
    deviceId: "eape_device_id",
  },

  dbName: "eape.db",

  images: {
    favicon: "/shared/favicon.svg",
    mintLogo: "/shared/mint-logo.svg",
    logo: "/logo.PNG",
    homeBanner: "/home/1.png",
    iconTop1: "/shared/icon-top-1.svg",
    iconTop2: "/shared/icon-top-2.svg",
    iconTop3: "/shared/icon-top-3.svg",
    thumb1: "/shared/thumb-1.svg",
    thumb2: "/shared/thumb-2.svg",
    thumb3: "/shared/thumb-3.svg",
    thumb4: "/shared/thumb-4.svg",
    thumb5: "/shared/thumb-5.svg",
  },
} as const;

// ---------------------------------------------------------------------------
// Status / levels (shared between homepage and NFT gallery)
// ---------------------------------------------------------------------------
export const STATUS_NAMES = {
  top: "BOSS",
  default: "BOT",
  vip: "VIP",
  shark: "SHARK",
  whale: "WHALE",
  boss: "BOSS",
} as const;

export const STATUS_LEVELS = {
  vip: 3,
  shark: 7,
  whale: 21,
  boss: 50,
} as const;

export const STATUS_DISPLAY: Record<string, { emoji: string; name: string }> = {
  boss:   { emoji: "👑", name: "BOSS" },
  whale:  { emoji: "🐋", name: "WHALE" },
  shark:  { emoji: "🦈", name: "SHARK" },
  vip:    { emoji: "⭐", name: "VIP" },
  default:{ emoji: "🤖", name: "BOT" },
};

// ---------------------------------------------------------------------------
// Verification status enums
// ---------------------------------------------------------------------------
export const REVIEW_STATUS = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  DISQUALIFIED: "DISQUALIFIED",
  NEEDS_IMPROVEMENT: "NEEDS_IMPROVEMENT",
} as const;

// ---------------------------------------------------------------------------
// MXP rewards — backend reads these from config; frontend fallback only
// ---------------------------------------------------------------------------
export const MXP_REWARDS = {
  usernameBonus: 30,
  inviteeBonus: 100,
  perReferral: 50,
} as const;

// ---------------------------------------------------------------------------
// Step definitions for the registration flow
// ---------------------------------------------------------------------------
export const REGISTRATION_STEPS = [
  { id: 1, title: "IDENTIFY" },
  { id: 2, title: "VERIFY" },
  { id: 3, title: "ENGAGE 1" },
  { id: 4, title: "ENGAGE 2" },
  { id: 5, title: "ENGAGE 3" },
  { id: 6, title: "ENGAGE 4" },
  { id: 7, title: "SUBMIT WALLET" },
] as const;

// Step routing keys (internal — not admin‑editable)
export const STEP_KEYS = ["identify", "verify", "engage1", "engage2", "engage3", "engage4", "wallet"] as const;

// ---------------------------------------------------------------------------
// Task definitions — Layer 2 defaults (admin can override via /api/config/public)
// ---------------------------------------------------------------------------
export const TASK_NAMES: Record<string, string> = {
  task1: "FOLLOW PROJECT",
  task2: "FOLLOW EAPE",
  task3: "LIKE, RT & COMMENT",
  task4: "LIKE, RT & COMMENT",
  task5: "ENGAGE 3",
  telegram: "JOIN TELEGRAM",
};

export const TASK_URLS: Record<string, string> = {
  task1: "https://x.com/Nightrarelabs/status/1",
  task2: "https://x.com/Nightrarelabs/status/2",
  task3: "https://x.com/Nightrarelabs/status/1",
  task4: "https://x.com/Nightrarelabs/status/2",
  task5: "https://x.com/EthereumApes",
  telegram: "https://t.me/ethereumapes",
};

export const DEFAULT_TASKS = [
  { id: "t1", labelKey: "task1", urlKey: "task1", step: "engage1", mxp: 10, proofType: "link" },
  { id: "t2", labelKey: "task2", urlKey: "task2", step: "engage2", mxp: 10, proofType: "link" },
  { id: "t3", labelKey: "task3", urlKey: "task3", step: "engage3", mxp: 10, proofType: "link" },
  { id: "t4", labelKey: "task4", urlKey: "task4", step: "engage4", mxp: 10, proofType: "link" },
  { id: "t5", labelKey: "task5", urlKey: "task5", step: "engage4", mxp: 10, proofType: "link" },
  { id: "telegram", labelKey: "telegram", urlKey: "telegram", step: "eng4", mxp: 10, proofType: "username" },
] as const;

// Internal mapping — maps campaign config task IDs to local task keys
export const TASK_ID_TO_KEY: Record<string, string> = {
  t1: "task1",
  t2: "task2",
  t3: "task3",
  t4: "task4",
  t5: "task5",
  t_qt3: "task5",
  telegram: "telegram",
};

// Per‑task MXP defaults (fallback when config doesn't specify)
export const TASK_MXP_FALLBACK: Record<string, number> = {
  task1: 10,
  task2: 10,
  task3: 10,
  task4: 10,
  task5: 10,
  telegram: 10,
};

// ---------------------------------------------------------------------------
// Button labels
// ---------------------------------------------------------------------------
export const BUTTON_LABELS = {
  home_join: "JOIN",
  home_check: "CHECK ROLE",
  home_getWhitelisted: "GET WHITELISTED",
  home_alreadyWhitelisted: "ALREADY WHITELISTED",
  home_getWhitelistedFinal: "GET WHITELISTED",
  home_done: "DONE",
  home_continue: "CONTINUE",
  home_next: "NEXT",
  home_nextTask: "NEXT TASK",
  home_finalStep: "SUBMIT WALLET",
  home_copyLink: "COPY LINK",
  home_checkNow: "CHECK NOW",
  home_viewStatus: "VIEW STATUS",
  mintNow: "MINT NOW",
  mintOnOpensea: "MINT ON OPENSEA",
} as const;

// ---------------------------------------------------------------------------
// QT (Quote Tweet) templates
// ---------------------------------------------------------------------------
export const QT_OPTIONS = [
  "The journey just started 🚀",
  "Strong community, strong future 💪",
  "Building something legendary 🔥",
  "Ape together strong 🦍",
  "Early believers will be rewarded 🏆",
  "This is just the beginning ⏳",
  "Diamond hands only 💎",
  "The future is bright ✨",
  "Don't sleep on this one 😴",
  "LFG! 🚀",
  "Bullish on the team 📈",
  "Community is everything 🤝",
  "Patience pays off 🕰️",
  "WAGMI 🙌",
  "Real ones know 🧠",
  "Vision is unmatched 👁️",
  "The blueprint is clear 📋",
  "Legends are made in the bear 🐻",
  "Trust the process 🔄",
  "History in the making 📖",
] as const;

export const QT_LABEL = "📋 COPY ONE OF THE QT FROM BELOW";
export const QT_COPY_BUTTON = "COPY";
export const QT_COPIED_BUTTON = "COPIED!";
export const QT_DONE_BUTTON = "✓ DONE";
export const QT_POST_BUTTON = "QT THIS POST";
export const QT_PLACEHOLDER = "Paste your QT link here (e.g. https://x.com/you/status/...)";
export const QT_HINT = "QT the post using one of the phrases above, then paste your QT link here";

// ---------------------------------------------------------------------------
// Campaign defaults
// ---------------------------------------------------------------------------
export const CAMPAIGN_DEFAULTS = {
  enabled: false,
  buttonLabel: "JOIN DAILY CAMPAIGN",
  pageTitle: "DAILY CAMPAIGN",
  version: 1,
} as const;

export const CAMPAIGN_REWARD_MSG = {
  new: "+{points} MXP earned! (New campaign)",
  repeated: "+{points} MXP earned!",
  alreadyCompleted: "Task already completed!",
  campaignUpdated: "Campaign updated! Starting fresh.",
  error: "Error completing task. Please try again.",
  noTasks: "No campaign tasks available yet.",
  checkBack: "Check back later!",
  pageDisabled: "PAGE UNAVAILABLE",
  pageDisabledMsg: "This page is currently disabled.",
  goHomepage: "GO TO HOMEPAGE",
  linkAccount: "LINK YOUR ACCOUNT TO TRACK POINTS",
  linkAccountDesc: "Enter your @username to track your campaign progress",
  loggedInAs: "Logged in as:",
  totalMxp: "YOUR TOTAL: {points} MXP",
  breakdown: "MXP BREAKDOWN",
  breakdownUsername: "Username",
  breakdownInvitedBy: "Invited By",
  breakdownTasks: "Campaign Tasks",
  breakdownReferrals: "Your Referrals",
  submit: "SUBMIT",
  completed: "COMPLETED",
  mxpSuffix: "...MXP",
} as const;

// ---------------------------------------------------------------------------
// Sale phases (checknfts page)
// ---------------------------------------------------------------------------
export const SALE_PHASES = [
  { label: "Presale 1", start: "Feb 22, 2026", duration: "7 Days", mintLimit: "2 per wallet", price: "0.06 SOL", icon: "/shared/thumb-1.svg" },
  { label: "Presale 2", start: "Mar 1, 2026", duration: "9 Days", mintLimit: "2 per wallet", price: "0.12 SOL", icon: "/shared/thumb-2.svg" },
  { label: "Presale 3", start: "Mar 10, 2026", duration: "5 Days", mintLimit: "2 per wallet", price: "0.15 SOL", icon: "/shared/thumb-3.svg" },
  { label: "Presale 4", start: "Mar 15, 2026", duration: "4 Days", mintLimit: "2 per wallet", price: "0.18 SOL", icon: "/shared/thumb-4.svg" },
  { label: "Public Sale", start: "Mar 20, 2026", duration: "10 Days", mintLimit: "5 per wallet", price: "0.22 SOL", icon: "/shared/thumb-5.svg" },
] as const;

export const SALE_PHASE_DETAIL_LABELS = {
  startDate: "Start Date",
  duration: "Duration",
  price: "Price",
  mintLimit: "Mint Limit: {limit}",
} as const;

// ---------------------------------------------------------------------------
// NFT gallery stats / dummy data
// ---------------------------------------------------------------------------
export const DUMMY_NFTS = [
  { id: "nft1", name: "Ethereum Ape #001", image: "/shared/thumb-1.svg", traits: { background: "Red", fur: "Gold", eyes: "Laser" }, phase: "Presale 1" },
  { id: "nft2", name: "Ethereum Ape #042", image: "/shared/thumb-2.svg", traits: { background: "Blue", fur: "Silver", eyes: "Fire" }, phase: "Presale 2" },
  { id: "nft3", name: "Ethereum Ape #117", image: "/shared/thumb-3.svg", traits: { background: "Green", fur: "Bronze", eyes: "Glow" }, phase: "Presale 3" },
  { id: "nft4", name: "Ethereum Ape #256", image: "/shared/thumb-4.svg", traits: { background: "Purple", fur: "Diamond", eyes: "Robot" }, phase: "Presale 4" },
  { id: "nft5", name: "Ethereum Ape #404", image: "/shared/thumb-5.svg", traits: { background: "Black", fur: "Platinum", eyes: "Cyber" }, phase: "Public Sale" },
] as const;

export const NFT_MARKET_STATS = {
  collectionName: "EAPE Apes",
  floorPrice: "0.06 SOL",
  volume: "1,250 SOL",
} as const;

// ---------------------------------------------------------------------------
// Color palette (shared)
// ---------------------------------------------------------------------------
export const PALETTE = {
  page: "#EED5C1",
  shell: "#F6E6DA",
  card: "#FAFAFA",
  soft: "#F8EEE7",
  border: "#1E1E1E",
  text: "#1E1E1E",
  muted: "#705B4E",
  accent: "#9E1B1E",
  accentSoft: "#F28C28",
  success: "#3b8b52",
  // stats‑card variant
  statsBg: "#EBD6C5",
  statsPanel: "#F2DDCB",
  statsBorder: "#2A1E16",
  statsOrange: "#F4A23A",
  statsRed: "#8E1C1C",
  statsLightGrey: "#F3F3F3",
  statsDivider: "#C9C9C9",
  statsHighlightRed: "#D33A2C",
  statsWhite: "#FFFFFF",
} as const;

// ---------------------------------------------------------------------------
// UI string constants (non‑editable layout labels — not worth moving to DB)
// ---------------------------------------------------------------------------
export const UI_STRINGS = {
  loading: "Loading homepage...",
  processing: "PROCESSING...",
  checking: "CHECKING...",
  verifying: "VERIFYING...",
  back: "← Back to Home",
  backShort: "BACK",
  close: "CLOSE",
  or: "or",
  connect: "Connect",
  connected: "✓ Connected",
  connectWallet: "CONNECT WALLET",
  switch: "⇄ Switch",
  preview: "PREVIEW",
  live: "LIVE — CONNECT WALLET",
  liveDesc: "Connect your blockchain wallet to access Mint & Buy features.",
  previewDesc: "Your registered wallets are treated as connected...",
  noWallets: "No wallets found. Complete whitelist first.",
  useRegistered: "✓ USE MY REGISTERED WALLETS",
  enterTitle: "ENTER eTHEREUM APES",
  enterSubtitle: "or get whitelisted to join {projectName}.",
  checkNfts: "Check NFTs",
  leaderboard: "🏆 LEADERBOARD",
  getInvolved: "GET INVOLVED",
  getWhitelistedCta: "🚀 GET WHITELISTED",
  joinTitle: "Choose how you want to get started",
  joinTasks: "Complete tasks and get on the whitelist",
  joinCheck: "Check your existing whitelist status",
  tryAgain: "← Try Again",
  usernameLabel: "X/TWITTER USERNAME",
  usernamePlaceholder: "@username",
  usernameRequired: "Must start with @",
  usernameTaken: "Username already registered",
  usernameNotFound: "Username not found",
  usernameNotWhitelisted: "is not on the whitelist yet.",
  inviterLabel: "WHO INVITED YOU (OPTIONAL)",
  inviterPlaceholder: "Who invited you? (Optional)",
  inviterInvalid: "Invalid inviter username",
  inviterNotFound: "Inviter not found in database",
  inviterNone: "No inviter (found this myself)",
  engagePlaceholder1: "Paste Comment Link 1",
  engagePlaceholder2: "Paste Comment Link 2",
  engage4Placeholder: "PASTE YOUR @USERNAME",
  walletLabel: "Enter EVM wallet address",
  walletPlaceholder: "0x...",
  walletValidation: "Wallet must be a valid 0x address (0x + 40 hex)",
  solWalletLabel: "Enter Sol wallet address (Phantom)",
  solWalletPlaceholder: "Sol wallet address (optional)",
  solWalletValidation: "Sol wallet must be a valid address (32-44 characters)",
  successTitle: "SUCCESS",
  successSubtext: "YOU ARE ON THE LIST",
  successUsername: "YOUR USERNAME:",
  successMxp: "MXP",
  successBreakdown: "MXP Breakdown",
  breakdownUsername: "Username Bonus:",
  breakdownInvitee: "Invitee Bonus:",
  breakdownTasks: "Task MXP:",
  breakdownReferrals: "Referral MXP:",
  breakdownTotal: "TOTAL:",
  verifyPending: "Verification Pending",
  verifyPendingMsg: "Your task MXP will be added after approval.",
  verified: "Verified!",
  verifiedMsg: "Your account has been approved.",
  needsImprovement: "Needs Improvement",
  disqualified: "Disqualified",
  contactSupport: "Please contact support for more info.",
  yourStatus: "YOUR STATUS:",
  yourInviteLink: "YOUR INVITE LINK",
  yourStats: "YOUR STATS",
  inviteLinkTitle: "Your Invite Link",
  vipProgress: "VIP Progress",
  maxStatus: "Maximum status achieved!",
  statsReferFriends: "Refer friends to unlock higher status!",
  usernameResult: "Username:",
  statusResult: "Status:",
  referralsResult: "Referrals:",
  nextLevel: "Next Level:",
  totalMxp: "TOTAL MXP:",
  taskMxpBlocked: "⚠️ Task MXP blocked: Account flagged as fake/invalid. Complete verification to unlock.",
  taskMxpPending: "MXP will update after approval.",
  verifiedApproved: "✅ Account Verified! Your tasks have been approved.",
  needsImprovementMsg: "Your submission needs improvement...",
  disqualifiedMsg: "Your account has been disqualified...",
  proofLinks: "Your Submitted Proof Links:",
  proofLinkEngage1: "🔗 Engage 1 Proof",
  proofLinkEngage2: "🔗 Engage 2 Proof",
  userNotFound: "User not found",
  getWhitelistedFallbackBtn: "GET WHITELISTED",
  inviteLink: "Your Invite Link",
  leaderboardTitle: "🏆 LEADERBOARD",
  leaderboardReferrers: "Top Referrers",
  leaderboardHolders: "Top Holders",
  leaderboardLoading: "Loading...",
  leaderboardEmpty: "No data available",
  connectMetaMask: "🦊 Connect MetaMask (EVM)",
  connectPhantom: "👻 Connect Phantom (Solana)",
  collection: "Collection",
  totalNfts: "Total NFTs",
  floorPrice: "Floor Price",
  volume: "Volume",
  yourNfts: "Your NFTs",
  noNftsYet: "No NFTs Yet",
  noNftsMsg: "Minting is coming soon. Stay tuned!",
  notConnected: "Not connected",
  notSet: "Not set",
  totalSupply: "Total Supply",
  available: "Available",
  minted: "Minted",
  status: "Status",
  price: "Price",
  inviteBtn: "INVITE",
  mintLimitLabel: "Mint Limit: {limit}",
  startDate: "Start Date",
  duration: "Duration",
  copyLink: "COPY LINK",
  backToHome: "← Back to Home",
  referralCardTitle: "Your Invite Link",
  switchWallet: "⇄ Switch",
  checkNow: "CHECK NOW",
  viewStatus: "VIEW STATUS",
  submitWallet: "SUBMIT WALLET",
  join: "JOIN",
  done: "DONE",
  continue_: "CONTINUE",
  next: "NEXT",
  nextTask: "NEXT TASK",
  finalStep: "SUBMIT WALLET",
  getWhitelisted: "GET WHITELISTED",
  alreadyWhitelisted: "ALREADY WHITELISTED",
  checkRole: "CHECK ROLE",
  save: "SAVING...",
  saveCampaign: "SAVE CAMPAIGN",
  cancel: "CANCEL",
  addTask: "+ ADD TASK",
  bumpVersion: "+ BUMP",
  bumpVersionHint: "Bump version to reset user progress",
  noTasksAdmin: "No tasks yet. Add your first task!",
  configButtonLabel: "Button Label",
  configPageTitle: "Page Title",
  configEnabled: "Enabled",
  configVersion: "Version",
  configTasks: "Tasks",
  configTaskLabel: "Label",
  configTaskPoints: "Points (MXP)",
  configTaskInputType: "Input Type",
  configTaskUrl: "URL (optional)",
  configTaskRequired: "Required",
  configTaskNumbered: "Task {n}",
  resultMoreReferrals: "more referrals to reach",
  countdown: "00D 00H 00M 00S",
  confirm: "CONFIRM",
  goToLink: "GO TO LINK →",
  visitLinkAgain: "↗ VISIT LINK AGAIN",
  pasteLinkHere: "Paste your link here...",
  enterEmail: "Enter your email...",
  enterRequired: "Enter required text...",
  submitted: "Submitted: ",
  linkMyAccount: "LINK MY ACCOUNT",
  linkAccountModal: "LINK ACCOUNT",
  linkAccountModalDesc: "Enter your @username to track your campaign points",
  coinBalance: "SOL Balance",
  goToLinkArrow: "↗ GO TO LINK →",
} as const;

// ---------------------------------------------------------------------------
// Helper: get status helpers  (kept here so they source from one place)
// ---------------------------------------------------------------------------
export function getStatusFromReferrals(referrals: number): string {
  if (referrals >= STATUS_LEVELS.boss) return STATUS_NAMES.boss;
  if (referrals >= STATUS_LEVELS.whale) return STATUS_NAMES.whale;
  if (referrals >= STATUS_LEVELS.shark) return STATUS_NAMES.shark;
  if (referrals >= STATUS_LEVELS.vip) return STATUS_NAMES.vip;
  return STATUS_NAMES.default;
}

export function getNextStatus(currentReferrals: number): { name: string; needed: number } | null {
  if (currentReferrals < STATUS_LEVELS.vip) return { name: STATUS_NAMES.vip, needed: STATUS_LEVELS.vip - currentReferrals };
  if (currentReferrals < STATUS_LEVELS.shark) return { name: STATUS_NAMES.shark, needed: STATUS_LEVELS.shark - currentReferrals };
  if (currentReferrals < STATUS_LEVELS.whale) return { name: STATUS_NAMES.whale, needed: STATUS_LEVELS.whale - currentReferrals };
  if (currentReferrals < STATUS_LEVELS.boss) return { name: STATUS_NAMES.boss, needed: STATUS_LEVELS.boss - currentReferrals };
  return null;
}

export function pad(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function computeCountdown(target: string): string {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return "00D 00H 00M 00S";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${pad(d)}D ${pad(h)}H ${pad(m)}M ${pad(s)}S`;
}
