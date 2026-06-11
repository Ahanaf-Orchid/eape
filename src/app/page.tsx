"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, publicApi, userApi } from "@/lib/api";
import { SITE, UI_STRINGS } from "@/lib/site-config";
import Step from "@/components/Step";
import Task from "@/components/Task";
import Image from "next/image";

const DEFAULT_TASK_NAMES = {
  task1: "FOLLOW PROJECT",
  task2: `FOLLOW ${SITE.shortName}`,
  task3: "LIKE, RT & COMMENT",
  task4: "LIKE, RT & COMMENT",
  task5: "ENGAGE 3",
  telegram: "JOIN TELEGRAM",
};

const DEFAULT_TASKS = [
  { id: "t1", url: SITE.twitterUrl, label: "FOLLOW PROJECT", step: 2, mxp: 10 },
  { id: "t2", url: SITE.twitterUrl, label: `FOLLOW ${SITE.shortName}`, step: 2, mxp: 10 },
  { id: "t3", url: "https://x.com/Nightrarelabs/status/1", label: "LIKE, RT & COMMENT", step: 3, mxp: 10 },
  { id: "t4", url: "https://x.com/Nightrarelabs/status/2", label: "LIKE, RT & COMMENT", step: 4, mxp: 10 },
  { id: "t5", url: "https://x.com/Nightrarelabs/status/1", label: "QT THIS POST", step: 5, mxp: 10 },
  { id: "telegram", url: SITE.telegramUrl, label: DEFAULT_TASK_NAMES.telegram || "JOIN TELEGRAM", step: 6, mxp: 10 },
];

const DEFAULT_TASK_URLS = {
  task1: SITE.twitterUrl,
  task2: SITE.twitterUrl,
  task3: "https://x.com/Nightrarelabs/status/1",
  task4: "https://x.com/Nightrarelabs/status/2",
  task5: "https://x.com/Nightrarelabs/status/1",
  telegram: SITE.telegramUrl,
};

const DEFAULT_BUTTON_LABELS = {
  home_join: `JOIN ${SITE.shortName}`,
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
};

const DEFAULT_STATUS_NAMES = {
  top: "BOSS",
  default: "BOT",
  vip: "VIP",
  shark: "SHARK",
  whale: "WHALE",
  boss: "BOSS",
};

const DEFAULT_STATUS_LEVELS = {
  vip: 3,
  shark: 7,
  whale: 21,
  boss: 50,
};

const DEFAULT_STEPS = [
  { id: 1, title: "IDENTIFY" },
  { id: 2, title: "VERIFY" },
  { id: 3, title: "ENGAGE 1" },
  { id: 4, title: "ENGAGE 2" },
  { id: 5, title: "ENGAGE 3" },
  { id: 6, title: "ENGAGE 4" },
  { id: 7, title: "SUBMIT WALLET" },
];

const QT_HASHTAG = SITE.hashtag;
const QT_OPTIONS = [
  `The journey just started 🚀 ${QT_HASHTAG}`,
  `Strong community, strong future 💪 ${QT_HASHTAG}`,
  `Early believers will remember this moment 👀 ${QT_HASHTAG}`,
  `Good vibes and big dreams ✨ ${QT_HASHTAG}`,
  `Something special is building here 🔥 ${QT_HASHTAG}`,
  `Community power is unstoppable 🫶 ${QT_HASHTAG}`,
  `Watch this space closely 👀 ${QT_HASHTAG}`,
  `The momentum is growing fast 🚀 ${QT_HASHTAG}`,
  `Together we go further 💙 ${QT_HASHTAG}`,
  `Believe in the vision 🌟 ${QT_HASHTAG}`,
  `The energy is different here ⚡ ${QT_HASHTAG}`,
  `Keep building, keep believing 🛠️ ${QT_HASHTAG}`,
  `The future looks bright 🌅 ${QT_HASHTAG}`,
  `Strong hands only 💎 ${QT_HASHTAG}`,
  `We are just getting started 🚀 ${QT_HASHTAG}`,
  `Stay positive and keep pushing 💪 ${QT_HASHTAG}`,
  `One community, one vision 🌍 ${QT_HASHTAG}`,
  `Big things take time ⏳ ${QT_HASHTAG}`,
  `Support the movement 🔥 ${QT_HASHTAG}`,
  `Let's make history together 🚀 ${QT_HASHTAG}`,
];

interface CachedUser {
  referrals: number;
  status: string;
  wallet: string;
  comment1?: string;
  comment2?: string;
  comment3?: string;
  mxp?: number;
  mxpFromUsername?: number;
  mxpFromInvitee?: number;
  mxpFromReferrals?: number;
  mxpFromTasks?: number;
  reviewStatus?: string;
  fakeMxpBlocked?: boolean;
}

export default function Home() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState("home");
  const [subStep, setSubStep] = useState("");
  const [twitter, setTwitter] = useState("");
  const [invitee, setInvitee] = useState("");
  const [noInvitee, setNoInvitee] = useState(false);
  const [commentLink1, setCommentLink1] = useState("");
  const [commentLink2, setCommentLink2] = useState("");
  const [commentLink3, setCommentLink3] = useState("");
  const [link1Error, setLink1Error] = useState("");
  const [link2Error, setLink2Error] = useState("");
  const [link3Error, setLink3Error] = useState("");
  const [telegram, setTelegram] = useState("");
  const [wallet, setWallet] = useState("");
  const [solWallet, setSolWallet] = useState("");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState("COPY LINK");
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [taskNames, setTaskNames] = useState(DEFAULT_TASK_NAMES);
  const [taskUrls, setTaskUrls] = useState(DEFAULT_TASK_URLS);
  const [taskMxpValues, setTaskMxpValues] = useState({
    task1: 10,
    task2: 10,
    task3: 10,
    task4: 10,
    task5: 10,
    telegram: 10,
  });
  const [buttonLabels, setButtonLabels] = useState(DEFAULT_BUTTON_LABELS);
  const [statusNames, setStatusNames] = useState(DEFAULT_STATUS_NAMES);
  const [statusLevels, setStatusLevels] = useState(DEFAULT_STATUS_LEVELS);
  const [submitError, setSubmitError] = useState("");
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [campaign, setCampaign] = useState({ enabled: true, buttonLabel: "JOIN DAILY CAMPAIGN" });

  const [homeImages, setHomeImages] = useState({ bannerSrc: "/home/1.png" });
  const [images, setImages] = useState({
    brandImages: ["/logo.PNG"] as string[],
    homeImages: ["/home/1.png"] as string[],
    homeDurations: [5] as number[],
    balanceIcons: ["/shared/icon-top-1.svg", "/shared/icon-top-2.svg", "/shared/icon-top-3.svg"] as string[],
  });
  const [bannerIndex, setBannerIndex] = useState(0);
  const [walletConnect, setWalletConnect] = useState({ solana: false, evm: true });
  const [walletButtonVisible, setWalletButtonVisible] = useState(true);
  const [showBalanceSection, setShowBalanceSection] = useState(true);
  const [balanceLabelMichy, setBalanceLabelMichy] = useState<string>(SITE.pointsName);
  const [balanceLabelSol, setBalanceLabelSol] = useState<string>("SOL Balance");
  const [balanceLabelXp, setBalanceLabelXp] = useState<string>(SITE.xpLabel);
  const [startupOverlayVisible, setStartupOverlayVisible] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);
  const [refreshCooldown, setRefreshCooldown] = useState(false);
  const REFRESH_INTERVAL = 30_000;

  const handleRefresh = async () => {
    if (refreshCooldown) return;
    if (Date.now() - lastRefresh < REFRESH_INTERVAL) {
      setRefreshCooldown(true);
      setTimeout(() => setRefreshCooldown(false), REFRESH_INTERVAL - (Date.now() - lastRefresh));
      return;
    }
    setLastRefresh(Date.now());
    setRefreshing(true);
    if (loggedInUsername) {
      await loadUserMxp(loggedInUsername);
      await loadUserFullData(loggedInUsername);
    }
    setRefreshing(false);
  };

  const connectMetaMask = async () => {
    const eth = (window as any).ethereum;
    if (eth) {
      try {
        const accounts = await eth.request({ method: 'eth_requestAccounts' });
        setConnectedEthWallet(accounts[0]);
        setWalletConnected(true);
        setWalletModalOpen(false);
      } catch (e) {
        // User rejected or error
      }
    } else {
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  const connectPhantom = async () => {
    const sol = (window as any).solana;
    if (sol?.isPhantom) {
      try {
        const resp = await sol.connect();
        setConnectedSolWallet(resp.publicKey.toString());
        setWalletConnected(true);
        setWalletModalOpen(false);
      } catch (e) {
        // User rejected or error
      }
    } else {
      window.open('https://phantom.app/', '_blank');
    }
  };

  const [connectedEthWallet, setConnectedEthWallet] = useState("");
  const [connectedSolWallet, setConnectedSolWallet] = useState("");

  const [mxpRewards, setMxpRewards] = useState({
    usernameBonus: 30,
    inviteeBonus: 100,
    perReferral: 50,
  });

  const [stepsDef, setStepsDef] = useState(DEFAULT_STEPS);

  const [loggedInUsername, setLoggedInUsername] = useState("");
  const [userMxp, setUserMxp] = useState(0);
  const [userStatus, setUserStatus] = useState("");
  const [userReferrals, setUserReferrals] = useState(0);
  const [userReviewStatus, setUserReviewStatus] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Username entry flow state
  const [entryUsername, setEntryUsername] = useState("");
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryNotFound, setEntryNotFound] = useState(false);
  const [entryError, setEntryError] = useState("");

  const getStatusFromReferrals = (referrals: number): string => {
    if (referrals >= (statusLevels.boss || 50)) return statusNames.boss || "BOSS";
    if (referrals >= (statusLevels.whale || 21)) return statusNames.whale || "WHALE";
    if (referrals >= (statusLevels.shark || 7)) return statusNames.shark || "SHARK";
    if (referrals >= (statusLevels.vip || 3)) return statusNames.vip || "VIP";
    return statusNames.default || "BOT";
  };

  const getNextStatus = (currentReferrals: number): { name: string; needed: number } | null => {
    if (currentReferrals < (statusLevels.vip || 3)) return { name: statusNames.vip || "VIP", needed: (statusLevels.vip || 3) - currentReferrals };
    if (currentReferrals < (statusLevels.shark || 7)) return { name: statusNames.shark || "SHARK", needed: (statusLevels.shark || 7) - currentReferrals };
    if (currentReferrals < (statusLevels.whale || 21)) return { name: statusNames.whale || "WHALE", needed: (statusLevels.whale || 21) - currentReferrals };
    if (currentReferrals < (statusLevels.boss || 50)) return { name: statusNames.boss || "BOSS", needed: (statusLevels.boss || 50) - currentReferrals };
    return null;
  };

  const normalizeReviewStatus = (status?: string, vStatus?: string): string => {
    const s = (status || vStatus || "").toUpperCase().trim();
    if (s === "APPROVED" || s === "VERIFIED" || s === "verified") return "VERIFIED";
    if (s === "REJECTED" || s === "DISQUALIFIED" || s === "disqualified") return "DISQUALIFIED";
    if (s === "NEEDS_IMPROVEMENT") return "NEEDS_IMPROVEMENT";
    return "PENDING";
  };

  const getReviewStatus = (user: any): string => {
    if (!user) return "PENDING";
    return normalizeReviewStatus(
      (user.reviewStatus as string) || "",
      (user.verificationStatus as string) || ""
    );
  };

  const normalizeTaskUrls = (urls: Record<string, string>): Record<string, string> => {
    const normalized: Record<string, string> = {};
    const conversionMap: Record<string, string> = {
      task1_url: 'task1',
      task2_url: 'task2',
      task3_url: 'task3',
      task4_url: 'task4',
      task5_url: 'task5',
      telegram_url: 'telegram',
    };
    for (const [key, value] of Object.entries(urls)) {
      if (conversionMap[key]) {
        normalized[conversionMap[key]] = value;
      } else if (key.startsWith('task') || key === 'telegram') {
        normalized[key] = value;
      }
    }
    return normalized;
  };

  useEffect(() => {
    const savedUsername = localStorage.getItem(SITE.lsKeys.user);
    if (savedUsername) {
      setLoggedInUsername(savedUsername);
      loadUserMxp(savedUsername);
    }
  }, []);

  useEffect(() => {
    setCopyButtonText(buttonLabels.home_copyLink);
  }, [buttonLabels]);

  useEffect(() => {
    if (images.homeImages.length <= 1) return;
    const dur = (images.homeDurations?.[bannerIndex] ?? 5) * 1000;
    const timer = setTimeout(() => {
      setBannerIndex((prev) => (prev + 1) % images.homeImages.length);
    }, dur);
    return () => clearTimeout(timer);
  }, [bannerIndex, images.homeImages, images.homeDurations]);

  const [successData, setSuccessData] = useState<{
    refLink: string;
    username: string;
    referrals: number;
    status: string;
    mxp: number;
    mxpFromUsername?: number;
    mxpFromInvitee?: number;
    mxpFromReferrals?: number;
    mxpFromTasks?: number;
    reviewStatus?: string;
  } | null>(null);

  useEffect(() => {
    if (currentStep === "success" && successData?.username) {
      loadUserMxp(successData.username);
      loadUserFullData(successData.username);
      localStorage.setItem(SITE.lsKeys.user, successData.username);
      setLoggedInUsername(successData.username);
    }
  }, [currentStep, successData?.username]);

  const loadUserFullData = async (username: string) => {
    try {
      const lookup = await userApi.lookup(username);
      if (lookup?.found) {
        setSuccessData((prev) => prev ? {
          ...prev,
          mxp: lookup.mxp || prev.mxp || 0,
          mxpFromUsername: lookup.mxpFromUsername || 0,
          mxpFromInvitee: lookup.mxpFromInvitee || 0,
          mxpFromReferrals: lookup.mxpFromReferrals || 0,
          mxpFromTasks: lookup.mxpFromTasks || 0,
          reviewStatus: normalizeReviewStatus(lookup.reviewStatus, lookup.verificationStatus),
          referrals: lookup.referrals || prev?.referrals || 0,
          status: lookup.status || prev?.status || statusNames.default,
        } : null);
      }
    } catch (error) {
      console.error("Load user full data error:", error);
    }
  };

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [checkUsername, setCheckUsername] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<CachedUser | null>(null);
  const [checkError, setCheckError] = useState("");

  const [alreadyModalOpen, setAlreadyModalOpen] = useState(false);
  const [alreadyUsername, setAlreadyUsername] = useState("");
  const [alreadyLoading, setAlreadyLoading] = useState(false);
  const [alreadyError, setAlreadyError] = useState("");
  const [alreadyFound, setAlreadyFound] = useState<boolean | null>(null);

  const [showStatusLevels, setShowStatusLevels] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'referrers' | 'holders'>('referrers');
  const [leaderboardData, setLeaderboardData] = useState<{rank: number; username: string; value: number}[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [qtDropdownOpen, setQtDropdownOpen] = useState(false);
  const [copiedQtIndex, setCopiedQtIndex] = useState<number | null>(null);

  const [errors, setErrors] = useState({
    username: false,
    usernameExists: false,
    invitee: false,
    inviteeNotFound: false,
    wallet: false,
    walletExists: false,
  });

  const [cachedUsers, setCachedUsers] = useState<Map<string, CachedUser>>(new Map());
  const [referralParam, setReferralParam] = useState("");

  const loadRuntimeCache = () => {
    try {
      const cached = localStorage.getItem(SITE.lsKeys.homepageCache);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.walletConnect) {
          setWalletConnect(data.walletConnect);
        }
        if (data.ctaVisibility) {
          if (data.ctaVisibility.campaign !== undefined) setCampaign(prev => ({ ...prev, enabled: !!data.ctaVisibility.campaign }));
        } else if (data.campaignEnabled !== undefined) {
          setCampaign(prev => ({ ...prev, enabled: !!data.campaignEnabled }));
        }
      }
    } catch (e) {
      console.error("Runtime cache load error:", e);
    }
  };

  const saveRuntimeCache = (data: object) => {
    try {
      localStorage.setItem(SITE.lsKeys.homepageCache, JSON.stringify({ ...data, savedAt: Date.now() }));
    } catch (e) {
      console.error("Runtime cache save error:", e);
    }
  };

  const loadPublicRuntime = async () => {
    try {
      const result = await publicApi.getConfig();
      const data = result.homepage as Record<string, unknown> | null;
      const imagesData = result.images as Record<string, unknown> | null;
      if (data) {

        if (data.walletConnect) {
          setWalletConnect(data.walletConnect as { solana: boolean; evm: boolean });
        }
        if (data.walletButtonVisible !== undefined) {
          setWalletButtonVisible(!!data.walletButtonVisible);
        }

        const ctaVisibility = data.ctaVisibility as Record<string, unknown> | undefined;
        if (ctaVisibility) {
          if (ctaVisibility.campaign !== undefined) setCampaign(prev => ({ ...prev, enabled: !!ctaVisibility.campaign }));
        }

        if (data.taskNames) {
          setTaskNames(prev => ({ ...prev, ...(data.taskNames as Record<string, string>) }));
        }
        if (data.taskUrls) {
          const normalizedUrls = normalizeTaskUrls(data.taskUrls as Record<string, string>);
          setTaskUrls(prev => ({ ...prev, ...normalizedUrls }));
        }
        if (data.taskMxp) {
          setTaskMxpValues(prev => ({ ...prev, ...(data.taskMxp as Record<string, number>) }));
        }
        if (data.statusNames) {
          setStatusNames(prev => ({ ...prev, ...(data.statusNames as Record<string, string>) }));
        }
        if (data.statusLevels) {
          setStatusLevels(prev => ({ ...prev, ...(data.statusLevels as Record<string, number>) }));
        }
        if (data.mxpRewards) {
          setMxpRewards(prev => ({ ...prev, ...(data.mxpRewards as Record<string, number>) }));
        }

        if (data.showBalanceSection !== undefined) {
          setShowBalanceSection(!!data.showBalanceSection);
        }
        if (data.balanceLabelMichy) {
          setBalanceLabelMichy(data.balanceLabelMichy as string);
        }
        if (data.balanceLabelSol) {
          setBalanceLabelSol(data.balanceLabelSol as string);
        }
        if (data.balanceLabelXp) {
          setBalanceLabelXp(data.balanceLabelXp as string);
        }

        if (data.homeButtons) {
          const btns = data.homeButtons as Record<string, { label: string; redirectType?: string; redirectPath?: string; visible?: string }>;
          const labels: Record<string, string> = {};
          for (const [key, btn] of Object.entries(btns)) {
            if (btn?.visible !== "hidden") labels[key] = btn.label;
          }
          if (Object.keys(labels).length > 0) setButtonLabels(prev => ({ ...prev, ...labels }));
        }

        saveRuntimeCache({
          walletConnect: data.walletConnect,
          ctaVisibility: ctaVisibility,
        });
      }

      // Images load independently of homepage config
      if (imagesData) {
          const imgs = {
            brandImages: (imagesData.brandImages as string[]) || images.brandImages,
            homeImages: (imagesData.homeImages as string[]) || images.homeImages,
            homeDurations: (imagesData.homeDurations as number[]) || images.homeDurations,
            balanceIcons: (imagesData.balanceIcons as string[]) || images.balanceIcons,
          };
        setImages(imgs);
        if (imgs.homeImages[0]) setHomeImages({ bannerSrc: imgs.homeImages[0] });
        localStorage.setItem(SITE.lsKeys.cache + "_imgs", JSON.stringify(imgs));
      }

      if (data) {
        setTimeout(() => setStartupOverlayVisible(false), 300);
      } else {
        setTimeout(() => setStartupOverlayVisible(false), 300);
      }
    } catch (e) {
      console.error("Load public runtime error:", e);
      setTimeout(() => setStartupOverlayVisible(false), 500);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(SITE.lsKeys.user);
    if (stored) {
      setTimeout(() => setStartupOverlayVisible(false), 400);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setStartupOverlayVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsClient(true);
    handleReferralParam();
    loadRuntimeCache();
    loadPublicRuntime();
  }, []);

  const loadUserMxp = async (username: string) => {
    try {
      const lookup = await userApi.lookup(username);
      if (lookup?.found) {
        setUserMxp(lookup.mxp || 0);
        setUserStatus(lookup.status || statusNames.default);
        setUserReferrals(lookup.referrals || 0);
        setUserReviewStatus(normalizeReviewStatus(lookup.reviewStatus));
      }
    } catch (error) {
      console.error("Load user MXP error:", error);
    }
  };

  const extractStatusId = (url: string): string | null => {
    const match = url.match(/\/status\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const isValidEvmAddress = (addr: string): boolean => {
    const a = addr.trim();
    return /^0x[a-fA-F0-9]{40}$/.test(a);
  };

  const isValidSolAddress = (addr: string): boolean => {
    const a = addr.trim();
    if (!a) return false;
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
  };

  const parseXStatusLink = (raw: string, expectedUsername: string): { ok: boolean; statusId?: string } => {
    const input = raw.trim();
    if (!input) return { ok: false };

    const withProto = /^https?:\/\//i.test(input) ? input : `https://${input.replace(/^\/+/, "")}`;

    try {
      const u = new URL(withProto);
      const host = u.hostname.toLowerCase();
      if (!(host === "x.com" || host === "www.x.com" || host === "twitter.com" || host === "www.twitter.com")) {
        return { ok: false };
      }

      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 3 && parts[1] === "status") {
        const userInUrl = parts[0].toLowerCase();
        const expected = expectedUsername.toLowerCase();
        if (userInUrl !== expected) return { ok: false };

        const statusId = parts[2];
        if (!/^[0-9]{10,}$/.test(statusId)) return { ok: false };
        return { ok: true, statusId };
      }

      const statusId = extractStatusId(u.toString());
      if (statusId && input.toLowerCase().includes(`/${expectedUsername.toLowerCase()}/status/`)) {
        return { ok: true, statusId };
      }

      return { ok: false };
    } catch {
      return { ok: false };
    }
  };

  const handleReferralParam = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get("ref");
    if (refParam) {
      const normalizedRef = refParam.startsWith("@") ? refParam : "@" + refParam;
      setReferralParam(normalizedRef);
      setInvitee(normalizedRef);
    }
  };

  const loadCache = async () => {
    try {
      const users = await api.get("users");

      const newCache = new Map<string, CachedUser>();

      if (users !== null) {
        for (const key in users) {
          const user = users[key];
          newCache.set(user.username?.toLowerCase(), {
            referrals: user.referrals || 0,
            status: user.status || statusNames.default,
            wallet: user.wallet || "",
            comment1: user.comment_1 || "",
            comment2: user.comment_2 || "",
            comment3: user.comment_3 || "",
            mxp: user.mxp || 0,
            mxpFromUsername: user.mxpFromUsername || 0,
            mxpFromInvitee: user.mxpFromInvitee || 0,
            mxpFromReferrals: user.mxpFromReferrals || 0,
            mxpFromTasks: user.mxpFromTasks || 0,
            reviewStatus: normalizeReviewStatus(user.reviewStatus),
            fakeMxpBlocked: normalizeReviewStatus(user.reviewStatus) === "NEEDS_IMPROVEMENT" || normalizeReviewStatus(user.reviewStatus) === "DISQUALIFIED",
          });
        }
      }

      setCachedUsers(newCache);
      localStorage.setItem(SITE.lsKeys.cache, JSON.stringify(Array.from(newCache.entries())));
    } catch (error) {
      console.error("Cache error:", error);
      try {
        const saved = localStorage.getItem(SITE.lsKeys.cache);
        if (saved) {
          const parsed = JSON.parse(saved) as [string, CachedUser][];
          const loadedCache = new Map<string, CachedUser>(parsed);
          setCachedUsers(loadedCache);
        }
      } catch (e) {
        console.error("LocalStorage error:", e);
      }
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const displayName = (name: string) => {
    const n = name.replace(/^@/, "");
    return n.charAt(0).toUpperCase() + n.slice(1);
  };

  const getDeviceId = () => {
    if (typeof window === 'undefined') return '';
    let deviceId = localStorage.getItem(SITE.lsKeys.deviceId);
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(SITE.lsKeys.deviceId, deviceId);
    }
    return deviceId;
  };

  const checkUserStatus = async (username: string, forceRefresh = false) => {
    const normalized = username.toLowerCase();

    if (!forceRefresh && cachedUsers.has(normalized)) {
      try {
        const lookup = await userApi.lookup(username);
        if (lookup?.found) {
          const normalizedFresh = normalizeReviewStatus(lookup.reviewStatus, lookup.verificationStatus);
          if (normalizedFresh !== cachedUsers.get(normalized)?.reviewStatus) {
            const data: CachedUser = {
              ...cachedUsers.get(normalized)!,
              reviewStatus: normalizedFresh,
              fakeMxpBlocked: normalizedFresh === "NEEDS_IMPROVEMENT" || normalizedFresh === "DISQUALIFIED",
              mxp: lookup.mxp || 0,
            };
            setCachedUsers((prev) => new Map(prev.set(normalized, data)));
            return data;
          }
        }
      } catch (e) {}
      return cachedUsers.get(normalized)!;
    }

    try {
      const lookup = await userApi.lookup(username);

      if (lookup?.found) {
        const data: CachedUser = {
          referrals: lookup.referrals || 0,
          status: lookup.status || statusNames.default,
          wallet: lookup.wallet || "",
          comment1: lookup.comment_1 || "",
          comment2: lookup.comment_2 || "",
          comment3: lookup.comment_3 || "",
          mxp: lookup.mxp || 0,
          mxpFromUsername: lookup.mxpFromUsername || 0,
          mxpFromInvitee: lookup.mxpFromInvitee || 0,
          mxpFromReferrals: lookup.mxpFromReferrals || 0,
          mxpFromTasks: lookup.mxpFromTasks || 0,
          reviewStatus: normalizeReviewStatus(lookup.reviewStatus, lookup.verificationStatus),
          fakeMxpBlocked: normalizeReviewStatus(lookup.reviewStatus) === "NEEDS_IMPROVEMENT" || normalizeReviewStatus(lookup.reviewStatus) === "DISQUALIFIED",
        };

        setCachedUsers((prev) => new Map(prev.set(normalized, data)));
        return data;
      }
      return null;
    } catch (error) {
      console.error("Check error:", error);
      return null;
    }
  };

  const validateUsername = (username: string) => {
    return username.startsWith("@") && username.length > 1;
  };

  const goToStep = (step: string) => {
    setCurrentStep(step);
    setErrors({
      username: false,
      usernameExists: false,
      invitee: false,
      inviteeNotFound: false,
      wallet: false,
      walletExists: false,
    });
    
    if (step === "home" && loggedInUsername) {
      loadUserMxp(loggedInUsername);
    }
  };

  const handleCheckStatus = async () => {
    const username = checkUsername.trim();

    if (!validateUsername(username)) {
      setCheckError("Enter a valid username starting with @");
      return;
    }

    setCheckError("");
    setStatusLoading(true);

    const userData = await checkUserStatus(username);

    setStatusLoading(false);

    if (!userData) {
      setCheckError("User not found");
      setStatusResult(null);
      return;
    }

    setStatusResult(userData);
  };

  const handleSaveUsername = async () => {
    const username = twitter.trim();
    const noInv = noInvitee;

    if (!validateUsername(username)) {
      setErrors((prev) => ({ ...prev, username: true }));
      return;
    }

    const userData = await checkUserStatus(username);
    if (userData) {
      setErrors((prev) => ({ ...prev, usernameExists: true }));
      return;
    }

    let inviteeUser = "";
    if (!noInv) {
      inviteeUser = invitee.trim();

      if (!inviteeUser && referralParam) {
        inviteeUser = referralParam;
      }

      if (inviteeUser) {
        if (!inviteeUser.startsWith('@')) {
          inviteeUser = '@' + inviteeUser;
        }

        if (!validateUsername(inviteeUser)) {
          setErrors((prev) => ({ ...prev, invitee: true }));
          return;
        }

        if (inviteeUser.toLowerCase() === username.toLowerCase()) {
          setErrors((prev) => ({ ...prev, invitee: true }));
          return;
        }

        const inviteeData = await checkUserStatus(inviteeUser);
        if (!inviteeData) {
          setErrors((prev) => ({ ...prev, inviteeNotFound: true }));
          return;
        }
      }
    }

    setSubStep(inviteeUser);
    goToStep("verify");
  };

  const TASK_ID_TO_CONFIG_KEY: Record<string, string> = {
    t1: 'task1', t2: 'task2', t3: 'task3', t4: 'task4', t5: 'task5', t_qt3: 'task5', telegram: 'telegram'
  };

  const getTasksForStep = (step: number) => {
    return tasks.filter((task) => task.step === step).map(task => {
      const configKey = TASK_ID_TO_CONFIG_KEY[task.id] || task.id;
      return {
        ...task,
        label: taskNames[configKey as keyof typeof taskNames] || task.label,
        url: taskUrls[configKey as keyof typeof taskUrls] || task.url,
        mxp: taskMxpValues[configKey as keyof typeof taskMxpValues] || task.mxp,
      };
    });
  };

  const getTaskMxpValue = (taskId: string): number => {
    const configKey = TASK_ID_TO_CONFIG_KEY[taskId] || taskId;
    const taskMxp = taskMxpValues[configKey as keyof typeof taskMxpValues];
    if (taskMxp !== undefined) return taskMxp;
    const defaultTask = tasks.find(t => t.id === taskId);
    return defaultTask?.mxp || 0;
  };

  const handleTaskComplete = (taskId: string) => {
    if (!completedTasks.includes(taskId)) {
      setCompletedTasks([...completedTasks, taskId]);
    }
  };

  const canProceedFromStep = (step: number): boolean => {
    const stepTasks = getTasksForStep(step);
    const completedInStep = stepTasks.filter((t) => completedTasks.includes(t.id)).length;
    const twitterUsername = twitter.replace("@", "");

    switch (step) {
      case 1:
        return twitter.length > 3;
      case 2:
        return completedInStep === 2;
      case 3:
        const link1Valid = parseXStatusLink(commentLink1, twitterUsername).ok;
        return link1Valid && completedTasks.includes("t3");
      case 4:
        const link2Valid = parseXStatusLink(commentLink2, twitterUsername).ok;
        return link2Valid && completedTasks.includes("t4");
      case 5:
        const link3Valid = parseXStatusLink(commentLink3, twitterUsername).ok;
        return link3Valid && completedTasks.includes("t_qt3");
      case 6:
        const telegramValid = telegram.trim().length > 0;
        return telegramValid && completedTasks.includes("telegram");
      case 7:
        const hasEvm = isValidEvmAddress(wallet);
        const hasSol = solWallet.length > 0 ? isValidSolAddress(solWallet) : true;
        return hasEvm && hasSol;
      default:
        return false;
    }
  };

  const validateAndProceed = (step: number) => {
    const twitterUsername = twitter.replace("@", "");

    if (step === 3) {
      const link1Valid = parseXStatusLink(commentLink1, twitterUsername).ok;
      if (!link1Valid) {
        setLink1Error("Invalid link! Paste your own X/Twitter status link (your quote tweet/comment), e.g. https://x.com/username/status/123...");
        return;
      }
      setLink1Error("");
    }

    if (step === 4) {
      const link2Valid = parseXStatusLink(commentLink2, twitterUsername).ok;
      if (!link2Valid) {
        setLink2Error("Invalid link! Paste your own X/Twitter status link (your quote tweet/comment), e.g. https://x.com/username/status/123...");
        return;
      }
      setLink2Error("");
    }

    if (canProceedFromStep(step)) {
      const flow = ["identify", "verify", "engage1", "engage2", "engage3", "engage4", "wallet"];
      const idx = flow.indexOf(currentStep);
      if (idx >= 0 && idx < flow.length - 1) {
        goToStep(flow[idx + 1] as any);
      }
    }
  };

  const handleNextStep = () => {
    const twitterUsername = twitter.replace("@", "");

    if (currentStep === "engage3") {
      const link3Valid = parseXStatusLink(commentLink3, twitterUsername).ok;
      if (!link3Valid) {
        setLink3Error(`Invalid link! Paste your own X/Twitter status link with ${SITE.hashtag}`);
        return;
      }
      setLink3Error("");
      goToStep("engage4");
      return;
    }

    if (currentStep === "engage4") {
      const telegramInput = telegram.trim();
      if (!telegramInput) {
        setLink3Error("Please enter your Telegram username");
        return;
      }
      const telegramUsername = telegramInput.startsWith('@') ? telegramInput.slice(1) : telegramInput;
      if (!/^[a-zA-Z0-9_]{5,32}$/.test(telegramUsername)) {
        setLink3Error("Invalid Telegram username. Must be 5-32 characters (letters, numbers, underscore)");
        return;
      }

      setLink3Error("");
      goToStep("wallet");
      return;
    }
  };

  const handleSubmit = async () => {
    if (!isValidEvmAddress(wallet)) {
      setSubmitError("Invalid wallet. Please enter a valid 0x EVM address (0x + 40 hex characters). ");
      return;
    }

    const id1 = extractStatusId(commentLink1 || "");
    const id2 = extractStatusId(commentLink2 || "");
    if (id1 && id2 && id1 === id2) {
      setSubmitError("You submitted the same link twice. Please make sure you completed all tasks correctly.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await userApi.register({
        username: twitter,
        wallet: wallet || undefined,
        solWallet: solWallet || undefined,
        invitee: subStep || undefined,
        telegram: telegram || undefined,
        comment_1: commentLink1 || undefined,
        comment_2: commentLink2 || undefined,
        comment_3: commentLink3 || undefined,
        deviceId: getDeviceId(),
        completedTasks,
        campaignProofs: {
          t3: commentLink1 || "",
          t4: commentLink2 || "",
          t_qt3: commentLink3 || "",
          telegram: telegram || "",
        },
      });

      if (result.success) {
        setCachedUsers((prev) =>
          new Map(
            prev.set(twitter.toLowerCase(), {
              referrals: 0,
              status: statusNames.default,
              wallet: wallet,
              mxp: (result.user.mxp as number) || 0,
              comment1: commentLink1,
              comment2: commentLink2,
            })
          )
        );

        const refLink = `${window.location.origin}?ref=${encodeURIComponent(twitter)}`;
        setSuccessData({
          refLink,
          username: twitter,
          referrals: 0,
          status: statusNames.default,
          mxp: (result.user.mxp as number) || 0,
          mxpFromUsername: (result.user.mxpFromUsername as number) || 0,
          mxpFromInvitee: (result.user.mxpFromInvitee as number) || 0,
          mxpFromReferrals: 0,
          mxpFromTasks: (result.user.mxpFromTasks as number) || 0,
          reviewStatus: "PENDING",
        });

        setIsSubmitting(false);
        goToStep("success");
        return;
      }

      const stepMap: Record<number, string> = { 1: "identify", 2: "verify", 3: "engage1", 4: "engage2", 5: "engage3", 6: "engage4", 7: "wallet" };
      const errorStep = result.step ? stepMap[result.step] ?? null : null;

      if (result.field === "username") {
        setErrors((prev) => ({ ...prev, username: true }));
      } else if (result.field === "wallet") {
        setErrors((prev) => ({ ...prev, wallet: true }));
      } else if (result.field === "invitee") {
        setErrors((prev) => ({ ...prev, invitee: true }));
      }

      setSubmitError((result.message as string) || "Registration failed. Please try again.");

      if (errorStep) {
        goToStep(errorStep);
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      setSubmitError("Registration failed. Please try again.");
    }

    setIsSubmitting(false);
  };

  const handleEntrySubmit = async () => {
    const raw = entryUsername.trim();
    if (!raw) {
      setEntryError("Please enter your username");
      return;
    }
    const username = raw.startsWith("@") ? raw : "@" + raw;
    setEntryError("");
    setEntryNotFound(false);
    setEntryLoading(true);

    // Check cache first, then API
    const normalized = username.toLowerCase();
    let userData = cachedUsers.has(normalized) ? cachedUsers.get(normalized)! : await checkUserStatus(username);

    setEntryLoading(false);

    if (userData) {
      // Found — log them in
      const refLink = `${window.location.origin}?ref=${encodeURIComponent(username)}`;
      setSuccessData({
        refLink,
        username,
        referrals: userData.referrals || 0,
        status: userData.status || statusNames.default,
        mxp: userData.mxp || 0,
        mxpFromUsername: userData.mxpFromUsername || 0,
        mxpFromInvitee: userData.mxpFromInvitee || 0,
        mxpFromReferrals: userData.mxpFromReferrals || 0,
        mxpFromTasks: userData.mxpFromTasks || 0,
        reviewStatus: normalizeReviewStatus(userData.reviewStatus),
      });
      localStorage.setItem(SITE.lsKeys.user, username);
      setLoggedInUsername(username);
      loadUserMxp(username);
    } else {
      setEntryNotFound(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SITE.lsKeys.user);
    setLoggedInUsername("");
    setUserMxp(0);
    setUserStatus("");
    setUserReferrals(0);
    setUserReviewStatus("");
    setSuccessData(null);
    setEntryUsername("");
    setEntryNotFound(false);
    setEntryError("");
    setCheckUsername("");
    setCheckError("");
    setStatusResult(null);
    setStatusModalOpen(false);
    setCurrentStep("home");
  };

  const handleGetWhitelistedFromEntry = () => {
    // Pre-fill username if they typed one, then go directly to identify step
    const raw = entryUsername.trim();
    if (raw) {
      const username = raw.startsWith("@") ? raw : "@" + raw;
      setTwitter(username);
    }
    setEntryNotFound(false);
    setEntryError("");
    goToStep("identify");
  };

  const openAlreadyModal = () => {
    setAlreadyModalOpen(true);
    setAlreadyUsername("");
    setAlreadyError("");
    setAlreadyFound(null);
  };

  const loadLeaderboardData = async (tab: 'referrers' | 'holders') => {
    setLeaderboardLoading(true);
    try {
      const users = await api.get("users");
      if (users !== null) {
        const userArray: {id: string; username?: string; referrals?: number; mxp?: number}[] = [];
        
        Object.entries(users).forEach(([key, value]: [string, any]) => {
          if (value.username) {
            userArray.push({
              id: key,
              username: value.username,
              referrals: value.referrals || 0,
              mxp: value.mxp || 0,
            });
          }
        });

        const sorted = userArray.sort((a, b) => {
          if (tab === 'referrers') {
            return (b.referrals || 0) - (a.referrals || 0);
          } else {
            return (b.mxp || 0) - (a.mxp || 0);
          }
        });

        const top15 = sorted.slice(0, 15).map((user, index) => ({
          rank: index + 1,
          username: user.username || '',
          value: tab === 'referrers' ? (user.referrals || 0) : (user.mxp || 0),
        }));

        setLeaderboardData(top15);
        setLeaderboardTab(tab);
      }
    } catch (error) {
      console.error('Load leaderboard error:', error);
    }
    setLeaderboardLoading(false);
  };

  const handleAlreadyCheck = async () => {
    const username = alreadyUsername.trim();

    if (!validateUsername(username)) {
      setAlreadyError("Enter a valid username starting with @");
      return;
    }

    setAlreadyError("");
    setAlreadyLoading(true);

    const userData = await checkUserStatus(username);

    setAlreadyLoading(false);

    if (userData) {
      setAlreadyFound(true);
      const refLink = `${window.location.origin}?ref=${encodeURIComponent(username)}`;
      setSuccessData({
        refLink,
        username: username,
        referrals: userData.referrals || 0,
        status: userData.status || statusNames.default,
        mxp: userData.mxp || 0,
        mxpFromUsername: userData.mxpFromUsername || 0,
        mxpFromInvitee: userData.mxpFromInvitee || 0,
        mxpFromReferrals: userData.mxpFromReferrals || 0,
        mxpFromTasks: userData.mxpFromTasks || 0,
        reviewStatus: normalizeReviewStatus(userData.reviewStatus),
      });
    } else {
      setAlreadyFound(false);
    }
  };

  const handleGetWhitelistedFromModal = () => {
    setAlreadyModalOpen(false);
    if (alreadyUsername.trim()) {
      setTwitter(alreadyUsername.trim());
    }
    goToStep("identify");
  };

  const copyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopyButtonText("COPIED!");
      setTimeout(() => {
        setCopyButtonText(buttonLabels.home_copyLink);
      }, 2000);
    });
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="container">
      {startupOverlayVisible && (
        <div className="startup-overlay">
          <div className="startup-overlay-content">
            <img src={images.brandImages[0] || "/logo.PNG"} alt={SITE.projectName} className="startup-logo" />
            <h2 className="startup-title">{SITE.projectName}</h2>
            <div className="startup-spinner"></div>
            <p className="startup-message">Loading homepage...</p>
          </div>
        </div>
      )}

      <div className={`loading ${!isSubmitting ? 'hidden' : ''}`}>
        <div className="loading-content">
          <div className="spinner"></div>
          <h3>PROCESSING...</h3>
        </div>
      </div>

      {currentStep === "home" && (
        <div className="home-screen">
          <div className="home-left-column">
            <div className="banner">
              {images.homeImages[bannerIndex] ? (
                <img src={images.homeImages[bannerIndex]} alt={`${SITE.projectName} Banner`} style={{ width: '100%', height: 'auto', display: 'block' }} />
              ) : (
                <div className="banner-text">{SITE.projectName}</div>
              )}
            </div>
            {loggedInUsername && (
              <>
                <div className="homepage-status-card">
                  <div className="status-card-header">
                    <span className="status-chip">VIP Progress</span>
                    <span
                      className={`status-badge ${userStatus === statusNames.vip ? "vip" : userStatus === statusNames.shark ? "shark" : userStatus === statusNames.whale ? "whale" : userStatus === statusNames.boss ? "boss" : "bot"}`}
                      onClick={() => setShowStatusLevels(true)}
                      style={{ cursor: 'pointer' }}
                    >
                      {userStatus || statusNames.default}
                    </span>
                  </div>
                  <div className="status-card-body">
                    <div className="status-line">
                      <span>Current referrals</span>
                      <strong>{userReferrals}</strong>
                    </div>
                    <div className="status-line emphasis-line">
                      {(() => {
                        const next = getNextStatus(userReferrals);
                        if (next) {
                          return `Invite ${next.needed} more to become ${next.name}`;
                        }
                        return 'Maximum status achieved!';
                      })()}
                    </div>
                    <div className="mini-progress-bar">
                      <div className="mini-progress-fill" style={{ width: `${Math.min((userReferrals / (statusLevels.boss || 50)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="homepage-referral-card">
                  <div className="referral-card-top">
                    <span className="referral-title">Your Invite Link</span>
                    <button
                      className="mini-copy-btn"
                      onClick={() => copyInviteLink(`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${encodeURIComponent(loggedInUsername)}`)}
                    >
                      {copyButtonText}
                    </button>
                  </div>
                  <div className="referral-link-box" onClick={() => copyInviteLink(`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${encodeURIComponent(loggedInUsername)}`)}>
                    {typeof window !== 'undefined' ? window.location.origin : ''}?ref={loggedInUsername}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="home-right-column">
          {/* ── LOGGED-IN STATE ── */}
          {loggedInUsername ? (
            <>
              {/* ── Premium User Card ── */}
              <div className="homepage-user-card">
                  <div className="user-card-top">
                    <div className="profile-box">
                      <div className="user-info-left">
                        <img src={images.brandImages[0] || "/logo.PNG"} alt={SITE.projectName} className="user-logo-icon" />
                        <div className="user-info-text">
                          <span className="user-name">{displayName(loggedInUsername)}</span>
                          {userReviewStatus === 'VERIFIED' && (
                            <span className="verified-badge-pill"><span className="verified-check">✓</span><span className="verified-text">Verified</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                  {showBalanceSection && (
                    <>
                      <div className="balance-box">
                        <span className="balance-label">{balanceLabelMichy}</span>
                        <div className="balance-value">
                          <img src={images.balanceIcons[1] || "/logo.PNG"} alt={SITE.projectName} className="balance-icon" />
                          <span>{userMxp.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="balance-box">
                        <span className="balance-label">{balanceLabelSol}</span>
                        <div className="balance-value">
                          <img src={images.balanceIcons[0] || "/shared/icon-top-1.svg"} alt="SOL" className="balance-icon" />
                          <span>0.00</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="user-card-bottom">
                  <button className="btn secondary-btn switch-btn" onClick={handleLogout}>
                    ⇄ Switch
                  </button>
                  <button
                    className="btn refresh-btn"
                    onClick={handleRefresh}
                    disabled={refreshCooldown}
                    style={{ flex: "0 0 auto", minWidth: 70, fontSize: 22 }}
                  >
                    {refreshing ? "..." : refreshCooldown ? "⏳" : "⟳"}
                  </button>
                  {walletButtonVisible && (
                  <button
                    className={`btn ${walletConnected ? "secondary-btn wallet-connected-btn" : "primary-btn connect-btn"}`}
                    onClick={() => setWalletModalOpen(true)}
                  >
                    {walletConnected ? "✓ Connected" : "Connect"}
                  </button>
                  )}
                </div>
              </div>


              {/* ── Verification status (no VERIFIED duplicate — badge is in user card) ── */}
              <div className="homepage-verification-status">
                {userReviewStatus === 'PENDING' && (
                  <div className="verify-status-row verify-pending">
                    <span>⏳</span>
                    <strong>Verification Pending</strong>
                    <button className="verify-refresh-btn" onClick={async () => { setRefreshing(true); await loadUserMxp(loggedInUsername); setRefreshing(false); }}>
                      {refreshing ? "..." : "↻"}
                    </button>
                  </div>
                )}
                {userReviewStatus === 'NEEDS_IMPROVEMENT' && (
                  <div className="verify-status-row verify-warn">
                    <span>⚠️</span>
                    <strong>Needs Improvement</strong>
                  </div>
                )}
                {userReviewStatus === 'DISQUALIFIED' && (
                  <div className="verify-status-row verify-warn">
                    <span>🚫</span>
                    <strong>Disqualified</strong>
                  </div>
                )}
              </div>

              <div className="action-buttons homepage-actions">
                  <button className="btn primary-btn" onClick={() => goToStep("join")}>
                    {buttonLabels.home_join}
                  </button>

                  <div className="action-row">
                    <button className="btn status-btn" onClick={() => setStatusModalOpen(true)}>
                      {buttonLabels.home_check || "STATUS"}
                    </button>
                    <button className="btn leaderboard-btn" onClick={() => { setLeaderboardOpen(true); loadLeaderboardData('referrers'); }}>
                      🏆 LEADERBOARD
                    </button>
                  </div>

                  {[
                    { label: campaign.buttonLabel, action: () => window.location.href = '/campaign', show: campaign.enabled },
                    { label: "Check NFTs", action: () => router.push('/checknfts'), show: true },
                    { label: "CONTACT US", action: () => window.location.href = '/contact', show: true },
                  ].filter(b => b.show).map((btn, idx) => (
                    <button key={idx} className={`btn ${idx % 2 === 0 ? 'primary-btn' : 'secondary-btn'}`} onClick={btn.action}>
                      {btn.label}
                    </button>
                  ))}
                </div>


            </>
          ) : (
            /* ── PUBLIC / NOT LOGGED-IN STATE ── */
            <>
              {/* Username Entry Box */}
              <div className="entry-box">
                <div className="entry-box-header">
                  <img src={images.brandImages[0] || "/logo.PNG"} alt={SITE.projectName} className="entry-box-logo" />
                  <h2 className="entry-box-title">ENTER eTHEREUM APES</h2>
                  <p className="entry-box-sub">Enter your username to continue, {`or get whitelisted to join ${SITE.projectName}.`}</p>
                </div>

                {!entryNotFound ? (
                  <div className="entry-box-form">
                    <input
                      type="text"
                      className="entry-input"
                      placeholder="@username"
                      value={entryUsername}
                      onChange={(e) => {
                        setEntryUsername(e.target.value);
                        setEntryError("");
                        setEntryNotFound(false);
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleEntrySubmit(); }}
                    />
                    {entryError && <p className="entry-error">{entryError}</p>}
                    <button
                      className="btn primary-btn entry-continue-btn"
                      onClick={handleEntrySubmit}
                      disabled={entryLoading}
                    >
                      {entryLoading ? "CHECKING..." : "JOIN"}
                    </button>
                    <div className="entry-divider">
                      <span>or</span>
                    </div>
                    <button
                      className="btn secondary-btn entry-whitelist-btn"
                      onClick={() => goToStep("identify")}
                    >
                      🚀 GET WHITELISTED
                    </button>
                  </div>
                ) : (
                  /* Not-found inline state */
                  <div className="entry-not-found">
                    <div className="entry-not-found-icon">🔍</div>
                    <p className="entry-not-found-msg">Username not found</p>
                    <p className="entry-not-found-sub">
                      <strong>{entryUsername.startsWith("@") ? entryUsername : "@" + entryUsername}</strong> is not on the whitelist yet.
                    </p>
                    <button
                      className="btn primary-btn entry-continue-btn"
                      onClick={handleGetWhitelistedFromEntry}
                    >
                      🚀 GET WHITELISTED
                    </button>
                    <button
                      className="btn text-btn entry-tryagain-btn"
                      onClick={() => {
                        setEntryNotFound(false);
                        setEntryError("");
                      }}
                    >
                      ← Try Again
                    </button>
                  </div>
                )}
              </div>            </>
          )}
          </div>
        </div>
      )}

      {currentStep === "join" && (
        <div className="step-screen join-entry-screen">
          <div className="join-entry-header">
            <img src={images.brandImages[0] || "/logo.PNG"} alt={SITE.projectName} className="join-entry-logo" />
            <h2 className="join-entry-title">{`Join ${SITE.projectName}`}</h2>
            <p className="join-entry-subtitle">Choose how you want to get started</p>
          </div>

          <div className="join-entry-actions">
            <button className="btn primary-btn join-entry-btn" onClick={() => goToStep("identify")}>
              <span className="join-btn-icon">🚀</span>
              <span className="join-btn-content">
                <span className="join-btn-label">{buttonLabels.home_getWhitelisted}</span>
                <span className="join-btn-desc">Complete tasks and get on the whitelist</span>
              </span>
            </button>
            <button className="btn secondary-btn join-entry-btn" onClick={openAlreadyModal}>
              <span className="join-btn-icon">✅</span>
              <span className="join-btn-content">
                <span className="join-btn-label">{buttonLabels.home_alreadyWhitelisted}</span>
                <span className="join-btn-desc">Check your existing whitelist status</span>
              </span>
            </button>
          </div>

          <div className="step-actions">
            <button className="btn text-btn" onClick={() => goToStep("home")}>← Back to Home</button>
          </div>
        </div>
      )}

      {currentStep === "identify" && (
        <Step step={1} title={stepsDef[0].title} active={true}>
          <div className="form-group">
            <div className="input-label-row">
              <span className="input-label">X/TWITTER USERNAME</span>
              <span className="input-mxp-hint">+{mxpRewards.usernameBonus || 30} MXP</span>
            </div>
            <input
              type="text"
              placeholder="@username"
              value={twitter}
              onChange={(e) => {
                setTwitter(e.target.value);
                setErrors((prev) => ({ ...prev, username: false, usernameExists: false }));
              }}
            />
            {errors.username && <p className="error-msg">Must start with @</p>}
            {errors.usernameExists && <p className="error-msg">Username already registered</p>}
          </div>

          <div className="form-group">
            <div className="input-label-row">
              <span className="input-label">WHO INVITED YOU (OPTIONAL)</span>
              <span className="input-mxp-hint">+{mxpRewards.inviteeBonus || 100} MXP</span>
            </div>
            <input
              type="text"
              placeholder="Who invited you? (Optional)"
              value={invitee}
              onChange={(e) => {
                setInvitee(e.target.value);
                setErrors((prev) => ({ ...prev, invitee: false, inviteeNotFound: false }));
              }}
              disabled={noInvitee}
            />
            {errors.invitee && <p className="error-msg">Invalid inviter username</p>}
            {errors.inviteeNotFound && <p className="error-msg">Inviter not found in database</p>}
          </div>

          <div className="mxp-teaser" style={{ marginTop: 10 }}>
            <div className="mxp-teaser-icon">🎁</div>
            <div className="mxp-teaser-text">
              Earn <b>+{mxpRewards.usernameBonus || 30} MXP</b> for your username{!noInvitee ? (
                <> and <b>+{mxpRewards.inviteeBonus || 100} MXP</b> if you enter an inviter</>
              ) : (
                <>. (Inviter bonus disabled)</>
              )}.
            </div>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="no_invitee"
              checked={noInvitee}
              onChange={(e) => setNoInvitee(e.target.checked)}
            />
            <label htmlFor="no_invitee">No inviter (found this myself)</label>
          </div>

          <button className="btn primary-btn" onClick={handleSaveUsername}>
            {buttonLabels.home_continue}
          </button>
          <button className="btn text-btn" onClick={() => goToStep("join")}>
            BACK
          </button>
        </Step>
      )}

      {currentStep === "verify" && (
        <Step step={2} title={stepsDef[1].title} active={true}>
          {getTasksForStep(2).map((task) => (
            <Task
              key={task.id}
              id={task.id}
              label={task.label}
              url={task.url}
              mxp={task.mxp}
              logoSrc={images.balanceIcons[1]}
              completed={completedTasks.includes(task.id)}
              onComplete={() => handleTaskComplete(task.id)}
            />
          ))}
          <button
            className={canProceedFromStep(2) ? "btn primary-btn" : "btn primary-btn disabled"}
            onClick={() => validateAndProceed(2)}
          >
            {buttonLabels.home_next}
          </button>
          <button className="btn text-btn" onClick={() => goToStep("identify")}>
            BACK
          </button>
        </Step>
      )}

      {currentStep === "engage1" && (
        <Step step={3} title={stepsDef[2].title} active={true}>
          {getTasksForStep(3).map((task) => (
            <Task
              key={task.id}
              id={task.id}
              label={task.label}
              url={task.url}
              mxp={task.mxp}
              logoSrc={images.balanceIcons[1]}
              completed={completedTasks.includes(task.id)}
              onComplete={() => handleTaskComplete(task.id)}
            />
          ))}
          <input
            type="text"
            placeholder="Paste Comment Link 1"
            value={commentLink1}
            onChange={(e) => {
              setCommentLink1(e.target.value);
              setLink1Error("");
            }}
            className={completedTasks.includes("t3") ? "task-input-reveal" : "hidden"}
          />
          {link1Error && <p className="error-msg">{link1Error}</p>}
          <button
            className={canProceedFromStep(3) ? "btn primary-btn" : "btn primary-btn disabled"}
            onClick={() => validateAndProceed(3)}
            style={{ marginTop: '15px' }}
          >
            {buttonLabels.home_nextTask}
          </button>
          <button className="btn text-btn" onClick={() => goToStep("verify")}>
            BACK
          </button>
        </Step>
      )}

      {currentStep === "engage2" && (
        <Step step={4} title={stepsDef[3].title} active={true}>
          {getTasksForStep(4).map((task) => (
            <Task
              key={task.id}
              id={task.id}
              label={task.label}
              url={task.url}
              mxp={task.mxp}
              logoSrc={images.balanceIcons[1]}
              completed={completedTasks.includes(task.id)}
              onComplete={() => handleTaskComplete(task.id)}
            />
          ))}
          <input
            type="text"
            placeholder="Paste Comment Link 2"
            value={commentLink2}
            onChange={(e) => {
              setCommentLink2(e.target.value);
              setLink2Error("");
            }}
            className={completedTasks.includes("t4") ? "task-input-reveal" : "hidden"}
          />
          {link2Error && <p className="error-msg">{link2Error}</p>}
          <button
            className={canProceedFromStep(4) ? "btn primary-btn" : "btn primary-btn disabled"}
            onClick={() => validateAndProceed(4)}
            style={{ marginTop: '15px' }}
          >
            {buttonLabels.home_nextTask}
          </button>
          <button className="btn text-btn" onClick={() => goToStep("engage1")}>
            BACK
          </button>
        </Step>
      )}

      {currentStep === "engage3" && (
        <Step step={5} title={taskNames['task5'] || "ENGAGE 3"} active={true}>
          {/* QT Options Selector — copy first */}
          <div className="qt-selector-card">
            <button
              className="btn secondary-btn qt-options-toggle"
              onClick={() => setQtDropdownOpen(prev => !prev)}
            >
              📋 COPY ONE OF THE QT FROM BELOW {qtDropdownOpen ? "▲" : "▼"}
            </button>

            {qtDropdownOpen && (
              <div className="qt-options-list">
                {QT_OPTIONS.map((qt, i) => (
                  <div key={i} className="qt-option-row">
                    <span className="qt-option-text">{qt}</span>
                    <button
                      className={`qt-copy-btn ${copiedQtIndex === i ? "qt-copied" : ""}`}
                      onClick={() => {
                        navigator.clipboard.writeText(qt);
                        setCopiedQtIndex(i);
                        setTimeout(() => setCopiedQtIndex(null), 2000);
                      }}
                    >
                      {copiedQtIndex === i ? "COPIED!" : "COPY"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QT THIS POST task button — open link second */}
          <div className="task">
            <div className="task-icon">5</div>
            <div className="task-content">
              <p style={{ fontWeight: 800, fontSize: '14px', marginBottom: '10px', fontFamily: "'Anton', sans-serif", letterSpacing: '0.5px' }}>
                {taskNames['task5'] || "QT THIS POST"}
              </p>
              <div className="task-actions">
                <button
                  className={`btn ${completedTasks.includes("t_qt3") ? "secondary-btn" : "primary-btn"}`}
                  onClick={() => {
                    const qtUrl = taskUrls['task5'] || SITE.twitterUrl;
                    window.open(qtUrl, '_blank');
                    handleTaskComplete("t_qt3");
                  }}
                >
                  {completedTasks.includes("t_qt3") ? "✓ DONE" : "QT THIS POST"}
                  {taskMxpValues['task5'] !== undefined && (
                    <span style={{ marginLeft: '8px' }}>+{taskMxpValues['task5']} MXP</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Link paste */}
          <input
            type="text"
            placeholder="Paste your QT link here (e.g. https://x.com/you/status/...)"
            value={commentLink3}
            onChange={(e) => {
              setCommentLink3(e.target.value);
              setLink3Error("");
            }}
            className="task-input-reveal"
            style={{ marginTop: '12px' }}
          />
          {link3Error && <p className="error-msg">{link3Error}</p>}
          <p className="small-hint">
            QT the post using one of the phrases above, then paste your QT link here
          </p>

          <button
            className={canProceedFromStep(5) ? "btn primary-btn" : "btn primary-btn disabled"}
            onClick={handleNextStep}
            style={{ marginTop: '15px' }}
          >
            {buttonLabels.home_nextTask || "NEXT TASK"}
          </button>
          <button className="btn text-btn" onClick={() => goToStep("engage2")}>
            BACK
          </button>
        </Step>
      )}

      {currentStep === "engage4" && (
        <Step step={6} title="ENGAGE 4" active={true}>
          {getTasksForStep(6).map((task) => (
            <Task
              key={task.id}
              id={task.id}
              label={task.label}
              url={task.url}
              mxp={task.mxp}
              logoSrc={images.balanceIcons[1]}
              completed={completedTasks.includes(task.id)}
              onComplete={() => handleTaskComplete(task.id)}
            />
          ))}
          {completedTasks.includes("telegram") && (
            <div className="task-card">
              <p className="task-label">PASTE YOUR @USERNAME</p>
              <input
                type="text"
                placeholder="@username"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="task-input-reveal"
              />
            </div>
          )}

          <button className={canProceedFromStep(6) ? "btn primary-btn" : "btn primary-btn disabled"} onClick={handleNextStep} style={{ marginTop: '15px' }}>
            {buttonLabels.home_nextTask || "NEXT TASK"}
          </button>
          <button className="btn text-btn" onClick={() => goToStep("engage3")}>
            BACK
          </button>
        </Step>
      )}

      {currentStep === "wallet" && (
        <Step step={7} title={stepsDef[6].title} active={true}>
          <div className="form-group">
            <label>Enter EVM wallet address</label>
            <input
              type="text"
              placeholder="0x..."
              value={wallet}
              onChange={(e) => {
                setWallet(e.target.value);
                setSubmitError("");
              }}
            />
            {wallet.length > 0 && !isValidEvmAddress(wallet) && !submitError && (
              <p className="error-msg">Wallet must be a valid 0x address (0x + 40 hex)</p>
            )}
          </div>

          <div className="form-group">
            <label>Enter Sol wallet address (Phantom)</label>
            <input
              type="text"
              placeholder="Sol wallet address (optional)"
              value={solWallet}
              onChange={(e) => {
                setSolWallet(e.target.value);
                setSubmitError("");
              }}
            />
            {solWallet.length > 0 && !isValidSolAddress(solWallet) && !submitError && (
              <p className="error-msg">Sol wallet must be a valid address (32-44 characters)</p>
            )}
          </div>

          {submitError && (
            <p className="error-msg">{submitError}</p>
          )}
          
          <button
            className={canProceedFromStep(7) ? "btn primary-btn" : "btn primary-btn disabled"}
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ marginTop: '15px' }}
          >
            {isSubmitting ? "VERIFYING..." : buttonLabels.home_getWhitelistedFinal}
          </button>
          <button className="btn text-btn" onClick={() => goToStep("engage4")}>
            BACK
          </button>
        </Step>
      )}

      {currentStep === "success" && (
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <h2>SUCCESS</h2>
          <p>YOU ARE ON THE LIST</p>

          {successData?.username && (
            <>
              <p className="user-username">YOUR USERNAME: <span>{successData.username}</span></p>
              <div className="mxp-token-section">
                <div className="mxp-token-header">
                  <img src={images.balanceIcons[1] || "/logo.PNG"} alt={SITE.xpLabel} className="mxp-token-logo" />
                  <span className="mxp-token-title">{SITE.xpLabel}</span>
                </div>
                <div className="mxp-amount">{userMxp || successData.mxp || 0}</div>
                <div className="mxp-label">MXP</div>
              </div>
              <div className="mxp-breakdown-card">
                <div className="mxp-breakdown-header">MXP Breakdown</div>
                <div className="mxp-breakdown-items">
                  <div className="mxp-breakdown-row">
                    <span>Username Bonus:</span>
                    <span className="mxp-plus">+{successData.mxpFromUsername || 0}</span>
                  </div>
                  <div className="mxp-breakdown-row">
                    <span>Invitee Bonus:</span>
                    <span className="mxp-plus">+{successData.mxpFromInvitee || 0}</span>
                  </div>
                  <div className="mxp-breakdown-row">
                    <span>Task MXP:</span>
                    <span className="mxp-plus">+{successData.mxpFromTasks || 0}</span>
                  </div>
                  <div className="mxp-breakdown-row">
                    <span>Referral MXP:</span>
                    <span className="mxp-plus">+{successData.mxpFromReferrals || 0}</span>
                  </div>
                  <div className="mxp-breakdown-total">
                    <span>TOTAL:</span>
                    <span className="mxp-plus">{successData.mxp || 0}</span>
                  </div>
                </div>
              </div>
              {successData.reviewStatus === 'PENDING' && (
                <div className="verification-pending-banner">
                  <span className="verification-pending-icon">⏳</span>
                  <div className="verification-pending-text">
                    <strong>Verification Pending</strong>
                    <span>Your task MXP will be added after approval.</span>
                  </div>
                  <button 
                    onClick={async () => { setRefreshing(true); const data = await checkUserStatus(successData.username, true); if (data) { setSuccessData(prev => prev ? { ...prev, reviewStatus: data.reviewStatus!, fakeMxpBlocked: data.fakeMxpBlocked! } : null); } setRefreshing(false); }} 
                    disabled={refreshing}
                    style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 11, background: '#fff', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                  >
                    {refreshing ? '...' : '↻'}
                  </button>
                </div>
              )}
              {successData.reviewStatus === 'VERIFIED' && (
                <div className="verification-pending-banner" style={{ background: '#d4edda', borderColor: '#28a745' }}>
                  <span className="verification-pending-icon">✅</span>
                  <div className="verification-pending-text">
                    <strong>Verified!</strong>
                    <span>Your account has been approved.</span>
                  </div>
                  <button 
                    onClick={async () => { setRefreshing(true); const data = await checkUserStatus(successData.username, true); if (data) { setSuccessData(prev => prev ? { ...prev, reviewStatus: data.reviewStatus!, fakeMxpBlocked: data.fakeMxpBlocked! } : null); } setRefreshing(false); }} 
                    disabled={refreshing}
                    style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 11, background: '#fff', border: '1px solid #28a745', borderRadius: 4, cursor: 'pointer' }}
                  >
                    {refreshing ? '...' : '↻'}
                  </button>
                </div>
              )}
              {(successData.reviewStatus === 'NEEDS_IMPROVEMENT' || successData.reviewStatus === 'DISQUALIFIED') && (
                <div className="verification-pending-banner" style={{ background: '#f8d7da', borderColor: '#dc3545' }}>
                  <span className="verification-pending-icon">⚠️</span>
                  <div className="verification-pending-text">
                    <strong>{successData.reviewStatus === 'NEEDS_IMPROVEMENT' ? 'Needs Improvement' : 'Disqualified'}</strong>
                    <span>Please contact support for more info.</span>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="user-status">
            <div className="status-display">
              <span className="label">YOUR STATUS:</span>
              <span className={`status-badge ${successData?.status === statusNames.vip ? "vip" : successData?.status === statusNames.shark ? "shark" : successData?.status === statusNames.whale ? "whale" : successData?.status === statusNames.boss ? "boss" : "bot"}`}>
                {successData?.status || statusNames.default}
              </span>
            </div>
            <div className="progress-container">
              <div className="progress-label">Referrals: {successData?.referrals || 0}</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(((successData?.referrals || 0) / (statusLevels.boss || 50)) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {(() => {
                  const next = getNextStatus(successData?.referrals || 0);
                  if (next) {
                    return `${next.needed} more to ${next.name}`;
                  }
                  return `Maximum status achieved!`;
                })()}
              </div>
            </div>
          </div>

          <div className="invite-section">
            <h4>YOUR INVITE LINK</h4>
            <div className="invite-link" onClick={() => copyInviteLink(successData?.refLink || "")}>
              {successData?.refLink}
            </div>
            <button className="btn secondary-btn" onClick={() => copyInviteLink(successData?.refLink || "")}>
              {copyButtonText === "COPIED!" ? "COPIED!" : buttonLabels.home_copyLink}
            </button>
          </div>

              <button className="btn primary-btn" onClick={() => {
                localStorage.setItem(SITE.lsKeys.user, successData?.username || "");
                goToStep("home");
              }}>
                Back
              </button>
        </div>
      )}

      {statusModalOpen && (
        <div className="modal-overlay" onClick={() => setStatusModalOpen(false)}>
          <div className="modal home-modal compact-modal simple-stack-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn floating-close-btn" onClick={() => setStatusModalOpen(false)}>×</button>
            <div className="modal-body simple-stack-body">
              <input
                type="text"
                placeholder="@username"
                value={checkUsername}
                onChange={(e) => {
                  setCheckUsername(e.target.value);
                  setCheckError("");
                  setStatusResult(null);
                }}
              />
              {checkError && <p className="error-msg">{checkError}</p>}
              <button className="btn primary-btn" onClick={handleCheckStatus} disabled={statusLoading}>
                {statusLoading ? "CHECKING..." : buttonLabels.home_check}
              </button>

              {statusResult && (
                <div className="result-card compact-result simple-result-card">
                  <div className="result-item">
                    <span className="label">Username:</span>
                    <span className="value">{checkUsername}</span>
                  </div>
                  <div className="result-item">
                    <span className="label">Status:</span>
                    <span className={`status-badge ${statusResult.status === statusNames.vip ? "vip" : statusResult.status === statusNames.shark ? "shark" : statusResult.status === statusNames.whale ? "whale" : statusResult.status === statusNames.boss ? "boss" : "bot"}`}>
                      {statusResult.status || statusNames.default}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="label">Referrals:</span>
                    <span className="value">{statusResult.referrals}</span>
                  </div>
                  <div className="result-item next-level-item">
                    <span className="label next-level-label">Next Level:</span>
                    <div className="next-level-content">
                      {(() => {
                        const next = getNextStatus(statusResult.referrals || 0);
                        if (next) {
                          return `${next.needed} more referrals to reach ${next.name}`;
                        }
                        return `Maximum status achieved!`;
                      })()}
                    </div>
                  </div>
                  <div className="result-item mxp-breakdown-item">
                    <span className="label mxp-breakdown-label">MXP Breakdown:</span>
                    <div className="mxp-breakdown-items">
                      <div className="mxp-breakdown-row">
                        <span>Username Bonus:</span>
                        <span className="mxp-plus">+{statusResult.mxpFromUsername || 0}</span>
                      </div>
                      <div className="mxp-breakdown-row">
                        <span>Invitee Bonus:</span>
                        <span className="mxp-plus">+{statusResult.mxpFromInvitee || 0}</span>
                      </div>
                      <div className="mxp-breakdown-row">
                        <span>Task MXP:</span>
                        <span className={statusResult.fakeMxpBlocked ? "mxp-blocked" : "mxp-plus"}>
                          {statusResult.fakeMxpBlocked ? 'BLOCKED' : `+${statusResult.mxpFromTasks || 0}`}
                        </span>
                      </div>
                      <div className="mxp-breakdown-row">
                        <span>Referral MXP:</span>
                        <span className="mxp-plus">+{statusResult.mxpFromReferrals || 0}</span>
                      </div>
                      <div className="mxp-breakdown-total">
                        <span>TOTAL MXP:</span>
                        <span className="mxp-total">{statusResult.mxp || 0}</span>
                      </div>
                    </div>
                  </div>
                  {statusResult.fakeMxpBlocked && (
                    <div className="verification-blocked">
                      ⚠️ Task MXP blocked: Account flagged as fake/invalid. Complete verification to unlock.
                    </div>
                  )}
                  {statusResult.reviewStatus === 'PENDING' && (
                    <div className="verification-pending">
                      ⏳ Verification pending. MXP will update after approval.
                    </div>
                  )}
                  {statusResult.reviewStatus === 'VERIFIED' && (
                    <div className="verification-pending" style={{ background: '#d4edda', color: '#155724' }}>
                      ✅ Account Verified! Your tasks have been approved.
                    </div>
                  )}
                  {(statusResult.reviewStatus === 'NEEDS_IMPROVEMENT' || statusResult.reviewStatus === 'DISQUALIFIED') && (
                    <div className="verification-blocked">
                      ⚠️ {statusResult.reviewStatus === 'NEEDS_IMPROVEMENT' ? 'Your submission needs improvement. Please contact support.' : 'Your account has been disqualified. Contact support for more info.'}
                    </div>
                  )}
                  {(statusResult.comment1 || statusResult.comment2) && (
                    <div style={{ marginTop: 12, padding: 10, background: '#f8f9fa', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Your Submitted Proof Links:</div>
                      {statusResult.comment1 && (
                        <a href={statusResult.comment1} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: '#007bff', fontSize: 12, marginBottom: 4 }}>
                          🔗 Engage 1 Proof
                        </a>
                      )}
                      {statusResult.comment2 && (
                        <a href={statusResult.comment2} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: '#007bff', fontSize: 12 }}>
                          🔗 Engage 2 Proof
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {alreadyModalOpen && (
        <div className="modal-overlay" onClick={() => setAlreadyModalOpen(false)}>
          <div className="modal home-modal compact-modal simple-stack-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn floating-close-btn" onClick={() => setAlreadyModalOpen(false)}>×</button>
            <div className="modal-body simple-stack-body">
              <input
                type="text"
                placeholder="@username"
                value={alreadyUsername}
                onChange={(e) => {
                  setAlreadyUsername(e.target.value);
                  setAlreadyError("");
                  setAlreadyFound(null);
                }}
              />
              {alreadyError && <p className="error-msg">{alreadyError}</p>}
              <button className="btn primary-btn" onClick={handleAlreadyCheck} disabled={alreadyLoading}>
                {alreadyLoading ? "CHECKING..." : buttonLabels.home_checkNow}
              </button>

              {alreadyFound === false && (
                <div className="already-not-found-actions">
                  <p className="error-msg" style={{ textAlign: "center", marginTop: "0" }}>User not found</p>
                  <button className="btn primary-btn" onClick={handleGetWhitelistedFromModal}>
                    GET WHITELISTED
                  </button>
                  <button className="btn text-btn" onClick={() => setAlreadyModalOpen(false)}>
                    BACK
                  </button>
                </div>
              )}

              {alreadyFound === true && successData && (
                <div className="result-card compact-result simple-result-card">
                  <div className="result-item">
                    <span className="label">Username:</span>
                    <span className="value">{alreadyUsername}</span>
                  </div>
                  <div className="result-item">
                    <span className="label">Status:</span>
                    <span className={`status-badge ${successData.status === statusNames.vip ? "vip" : successData.status === statusNames.shark ? "shark" : successData.status === statusNames.whale ? "whale" : successData.status === statusNames.boss ? "boss" : "bot"}`}>
                      {successData.status || statusNames.default}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="label">Referrals:</span>
                    <span className="value">{successData.referrals}</span>
                  </div>
                  <button className="btn primary-btn" onClick={() => { setAlreadyModalOpen(false); goToStep("success"); }} style={{ marginTop: "15px" }}>
                    {buttonLabels.home_viewStatus}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showStatusLevels && (
        <div className="modal-overlay" onClick={() => setShowStatusLevels(false)}>
          <div className="modal home-modal compact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--primary-color)' }}>YOUR STATS</h3>
              <button className="close-btn" onClick={() => setShowStatusLevels(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="stats-summary-card">
                <div style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '20px', marginBottom: '4px' }}>
                  {userStatus || statusNames.default}
                </div>
                <div style={{ color: 'var(--text-color)', fontSize: '12px', opacity: 0.7 }}>
                  {userReferrals} referrals
                </div>
              </div>
              <div className="status-level-grid">
                <div className="status-level-card">
                  <div className="status-level-head">
                    <span className="status-level-key">BOSS</span>
                    <span className="status-level-range">{statusLevels.boss || 50}+ refs</span>
                  </div>
                  <div className="status-level-name" style={{ color: '#f39c12' }}>👑 BOSS</div>
                </div>
                <div className="status-level-card">
                  <div className="status-level-head">
                    <span className="status-level-key">WHALE</span>
                    <span className="status-level-range">{statusLevels.whale || 21}+ refs</span>
                  </div>
                  <div className="status-level-name" style={{ color: '#9b59b6' }}>🐋 WHALE</div>
                </div>
                <div className="status-level-card">
                  <div className="status-level-head">
                    <span className="status-level-key">SHARK</span>
                    <span className="status-level-range">{statusLevels.shark || 7}+ refs</span>
                  </div>
                  <div className="status-level-name" style={{ color: '#3498db' }}>🦈 SHARK</div>
                </div>
                <div className="status-level-card">
                  <div className="status-level-head">
                    <span className="status-level-key">VIP</span>
                    <span className="status-level-range">{statusLevels.vip || 3}+ refs</span>
                  </div>
                  <div className="status-level-name" style={{ color: '#27ae60' }}>⭐ VIP</div>
                </div>
                <div className="status-level-card">
                  <div className="status-level-head">
                    <span className="status-level-key">DEFAULT</span>
                    <span className="status-level-range">0-{((statusLevels.vip || 3) - 1)} refs</span>
                  </div>
                  <div className="status-level-name" style={{ color: 'var(--text-color)', opacity: 0.65 }}>🤖 BOT</div>
                </div>
              </div>
              <p className="stats-modal-note">Refer friends to unlock higher status!</p>
            </div>
          </div>
        </div>
      )}

      {walletModalOpen && (
        <div className="modal-overlay" onClick={() => setWalletModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--primary-color)' }}>CONNECT WALLET</h3>
              <button className="close-btn" onClick={() => setWalletModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              {(false) ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎮</div>
                  <p style={{ fontSize: '14px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    PREVIEW
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-color)', opacity: 0.75, marginBottom: '18px' }}>
                    Your registered wallets are treated as connected. No blockchain connection required.
                  </p>
                  {(() => {
                    const userData = cachedUsers.get(loggedInUsername.toLowerCase());
                    const ethWallet = userData?.wallet || "";
                    const solWalletVal = (userData as any)?.sol_wallet || "";
                    return (
                      <div className="demo-wallet-info">
                        {ethWallet && (
                          <div className="demo-wallet-row">
                            <span className="demo-wallet-label">ETH Wallet</span>
                            <span className="demo-wallet-addr">{ethWallet.substring(0,8)}...{ethWallet.slice(-6)}</span>
                            <span className="demo-wallet-check">✓</span>
                          </div>
                        )}
                        {solWalletVal && (
                          <div className="demo-wallet-row">
                            <span className="demo-wallet-label">SOL Wallet</span>
                            <span className="demo-wallet-addr">{solWalletVal.substring(0,8)}...{solWalletVal.slice(-6)}</span>
                            <span className="demo-wallet-check">✓</span>
                          </div>
                        )}
                        {!ethWallet && !solWalletVal && (
                          <p style={{ color: 'var(--text-color)', opacity: 0.6, fontSize: '13px' }}>
                            No wallets found. Complete whitelist first.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  <button className="btn primary-btn" style={{ marginTop: '16px' }} onClick={() => {
                    setWalletConnected(true);
                    setWalletModalOpen(false);
                  }}>
                    ✓ USE MY REGISTERED WALLETS
                  </button>
                  <button className="btn text-btn" onClick={() => setWalletModalOpen(false)}>
                    CLOSE
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>⛓️</div>
                  <p style={{ fontSize: '14px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    LIVE - CONNECT WALLET
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-color)', opacity: 0.75, marginBottom: '18px' }}>
                    Connect your blockchain wallet to access Mint &amp; Buy features.
                  </p>
                  <div className="connect-wallet-options">
                    {walletConnect.evm && (
                    <button
                      className="btn primary-btn connect-wallet-option-btn"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' }}
                      onClick={connectMetaMask}
                    >
                      <span>🦊</span> Connect MetaMask (EVM)
                    </button>
                    )}
                    {walletConnect.solana && (
                    <button
                      className="btn secondary-btn connect-wallet-option-btn"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' }}
                      onClick={connectPhantom}
                    >
                      <span>👻</span> Connect Phantom (Solana)
                    </button>
                    )}
                  </div>
                  <button className="btn text-btn" style={{ marginTop: '8px' }} onClick={() => setWalletModalOpen(false)}>
                    CLOSE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {leaderboardOpen && (
        <div className="modal-overlay" onClick={() => setLeaderboardOpen(false)}>
          <div className="modal home-modal compact-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn floating-close-btn" onClick={() => setLeaderboardOpen(false)}>×</button>
            <div className="modal-header">
              <h3>🏆 LEADERBOARD</h3>
            </div>
            <div className="leaderboard-tabs">
              <button 
                className={`leaderboard-tab ${leaderboardTab === 'referrers' ? 'active' : ''}`}
                onClick={() => loadLeaderboardData('referrers')}
              >
                Top Referrers
              </button>
              <button 
                className={`leaderboard-tab ${leaderboardTab === 'holders' ? 'active' : ''}`}
                onClick={() => loadLeaderboardData('holders')}
              >
                Top Holders
              </button>
            </div>
            <div className="modal-body">
              {leaderboardLoading ? (
                <div className="leaderboard-loading">Loading...</div>
              ) : leaderboardData.length === 0 ? (
                <div className="leaderboard-empty">No data available</div>
              ) : (
                <div className="leaderboard-list">
                  {leaderboardData.map((item) => (
                    <div key={item.rank} className={`leaderboard-row rank-${item.rank}`}>
                      <span className="leaderboard-rank">
                        {item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : `#${item.rank}`}
                      </span>
                      <span className="leaderboard-username">@{item.username}</span>
                      <span className="leaderboard-value">
                        {leaderboardTab === 'referrers' ? `${item.value} refs` : `${item.value.toLocaleString()} MXP`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
