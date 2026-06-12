"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/site-config";
import { publicApi, userApi } from "@/lib/api";

interface CampaignTask {
  id: string;
  label: string;
  url: string;
  points: number;
  inputType?: "click" | "link" | "email" | "text";
}

interface CampaignConfig {
  enabled: boolean;
  buttonLabel: string;
  pageTitle: string;
  version: number;
  tasks: Record<string, CampaignTask>;
}

const DEFAULT_CONFIG: CampaignConfig = {
  enabled: false,
  buttonLabel: "JOIN DAILY CAMPAIGN",
  pageTitle: "DAILY CAMPAIGN",
  version: 1,
  tasks: {},
};

export default function CampaignPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [config, setConfig] = useState<CampaignConfig>(DEFAULT_CONFIG);
  const [tasks, setTasks] = useState<CampaignTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [campaignInputs, setCampaignInputs] = useState<Record<string, string>>({});
  const [userPoints, setUserPoints] = useState(0);
  const [username, setUsername] = useState("");
  const [campaignVersion, setCampaignVersion] = useState(1);
  const [isIdentified, setIsIdentified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [rewardMessage, setRewardMessage] = useState("");
  const [visitedLinkTasks, setVisitedLinkTasks] = useState<string[]>([]);
  const [mxpBreakdown, setMxpBreakdown] = useState({ fromUsername: 0, fromInvitee: 0, fromReferrals: 0, fromTasks: 0 });
  const [dailyRewardEnabled, setDailyRewardEnabled] = useState(true);
  const [dailyRewardMxp, setDailyRewardMxp] = useState(20);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [dailyClaiming, setDailyClaiming] = useState(false);
  const [dailyMessage, setDailyMessage] = useState("");
  const [pendingTasks, setPendingTasks] = useState<string[]>([]);
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userStatus, setUserStatus] = useState("");
  const [userReferrals, setUserReferrals] = useState(0);
  const [userReviewStatus, setUserReviewStatus] = useState("");
  const [images, setImages] = useState({ brandImages: ["/logo.PNG"], homeImages: ["/logo.PNG"], balanceIcons: ["/logo.PNG"] });
  const [bannerIndex, setBannerIndex] = useState(0);

  const getLocalStorageKey = (user: string, version: number) => {
    return `${SITE.shortName.toLowerCase()}_campaign_completed_${user.replace(/^@/, "")}_v${version}`;
  };

  const loadConfig = async () => {
    try {
      const result = await publicApi.getConfig();
      const data = result.campaign as Record<string, unknown> | null;

      if (data) {
        const loadedConfig: CampaignConfig = {
          enabled: (data.enabled as boolean) ?? false,
          buttonLabel: (data.buttonLabel as string) ?? "JOIN DAILY CAMPAIGN",
          pageTitle: (data.pageTitle as string) ?? "DAILY CAMPAIGN",
          version: (data.version as number) ?? 1,
          tasks: (data.tasks as Record<string, CampaignTask>) ?? {},
        };
        setConfig(loadedConfig);
        setCampaignVersion(loadedConfig.version);

        const tasksArray: CampaignTask[] = [];
        for (const key in loadedConfig.tasks) {
          tasksArray.push({
            id: key,
            label: loadedConfig.tasks[key].label || "",
            url: loadedConfig.tasks[key].url || "",
            points: loadedConfig.tasks[key].points || 0,
            inputType: loadedConfig.tasks[key].inputType || "click",
          });
        }
        setTasks(tasksArray);

        setDailyRewardEnabled(data.dailyRewardEnabled !== false);
        setDailyRewardMxp((data.dailyRewardMxp as number) || 20);

        const todayDate = new Date().toISOString().split("T")[0];
        const lastClaimKey = `eape_daily_claim_${todayDate}`;
        if (localStorage.getItem(lastClaimKey) === todayDate) {
          setDailyClaimed(true);
        }
      }

      const imagesData = result.images as Record<string, unknown> | null;
      if (imagesData) {
        setImages({
          brandImages: (imagesData.brandImages as string[]) || ["/logo.PNG"],
          homeImages: (imagesData.homeImages as string[]) || ["/logo.PNG"],
          balanceIcons: (imagesData.balanceIcons as string[]) || ["/logo.PNG"],
        });
      }
    } catch (error) {
      console.error("Load config error:", error);
    }
  };

  useEffect(() => {
    if (images.homeImages.length <= 1) return;
    const timer = setTimeout(() => {
      setBannerIndex((prev) => (prev + 1) % images.homeImages.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [bannerIndex, images.homeImages]);

  const copyInviteLink = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const verifyUser = async (usernameToVerify: string) => {
    try {
      const result = await userApi.lookup(usernameToVerify);

      if (result?.found) {
        setUserPoints(result.mxp || 0);
        setCampaignInputs(result.campaignInputs || {});
        setUserStatus(result.status || "");
        setUserReferrals(result.referrals || 0);
        setUserReviewStatus(
          (result.reviewStatus as string) || (result.verificationStatus as string) || "");

        setMxpBreakdown({
          fromUsername: result.mxpFromUsername || 0,
          fromInvitee: result.mxpFromInvitee || 0,
          fromReferrals: result.mxpFromReferrals || 0,
          fromTasks: result.mxpFromTasks || 0,
        });

        const userCampaignVersion = result.campaignVersion || 1;
        setCampaignVersion(userCampaignVersion);

        const dbCompleted = result.campaignCompletedTasks || [];
        if (userCampaignVersion === config.version) {
          setCompletedTasks(dbCompleted);
        } else {
          setCompletedTasks([]);
        }

        setIsIdentified(true);
        setShowIdModal(false);
        setPendingTasks([]);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Verify user error:", error);
      return false;
    }
  };

  const loadLocalCompletion = (user: string, version: number) => {
    const key = getLocalStorageKey(user, version);
    const saved = localStorage.getItem(key);
    if (saved) {
      try { setCompletedTasks(JSON.parse(saved)); } catch (e) { console.error("Error loading local completion:", e); }
    } else {
      setCompletedTasks([]);
    }
  };

  const saveLocalCompletion = (user: string, version: number, completed: string[]) => {
    const key = getLocalStorageKey(user, version);
    setCompletedTasks(completed);
    localStorage.setItem(key, JSON.stringify(completed));
  };

  const handleInputChange = (taskId: string, value: string) => {
    setCampaignInputs((prev) => ({ ...prev, [taskId]: value }));
  };

  useEffect(() => {
    setIsClient(true);
    loadConfig();
  }, []);

  useEffect(() => {
    if (isClient) {
      const savedUsername = localStorage.getItem(SITE.lsKeys.user);
      if (savedUsername) {
        setUsername(savedUsername);
        verifyUser(savedUsername);
      } else {
        setShowIdModal(true);
      }
    }
  }, [isClient, campaignVersion]);

  const handleIdentify = async () => {
    if (!username.startsWith("@") || username.length < 2) {
      alert("Please enter a valid username starting with @");
      return;
    }

    localStorage.setItem(SITE.lsKeys.user, username);

    setLoading(true);
    try {
      const result = await userApi.lookup(username);

      if (result?.found) {
        setUserPoints(result.mxp || 0);
        setCampaignInputs(result.campaignInputs || {});
        setUserStatus(result.status || "");
        setUserReferrals(result.referrals || 0);
        setUserReviewStatus(
          (result.reviewStatus as string) || (result.verificationStatus as string) || "");

        const userCampaignVersion = result.campaignVersion || 1;
        setCampaignVersion(userCampaignVersion);

        const dbCompleted = result.campaignCompletedTasks || [];
        if (userCampaignVersion === config.version) {
          setCompletedTasks(dbCompleted);
          localStorage.setItem(getLocalStorageKey(username, config.version), JSON.stringify(dbCompleted));
        } else {
          setCompletedTasks([]);
        }

        setIsIdentified(true);
        setShowIdModal(false);
        setPendingTasks([]);
        setLoading(false);
        return;
      }

      setLoading(false);
      alert("User not found! Please join via the main page first.");
      localStorage.removeItem(SITE.lsKeys.user);
    } catch (error) {
      console.error("Identify error:", error);
      setLoading(false);
      alert("Error verifying user. Please try again.");
    }
  };

  const handleClaimDailyReward = async () => {
    if (!username || dailyClaimed) return;
    setDailyClaiming(true);
    setDailyMessage("");
    try {
      const result = await userApi.claimDailyReward(username);
      if (result.success) {
        setDailyClaimed(true);
        setUserPoints(result.totalMxp || (userPoints + dailyRewardMxp));
        const todayDate = new Date().toISOString().split("T")[0];
        localStorage.setItem(`eape_daily_claim_${todayDate}`, todayDate);
        setDailyMessage(`+${result.rewardMxp} MXP claimed!`);
        setTimeout(() => setDailyMessage(""), 3000);
      } else if (result.alreadyClaimed) {
        setDailyClaimed(true);
        setDailyMessage("Already claimed today");
      } else {
        setDailyMessage(result.message || "Claim failed. Try again.");
      }
    } catch (error) {
      console.error("Daily reward claim error:", error);
      setDailyMessage("Error claiming reward. Try again.");
    }
    setDailyClaiming(false);
  };

  const handleRefresh = async () => {
    if (!username || refreshing) return;
    setRefreshing(true);
    try {
      const lookup = await userApi.lookup(username);
      if (lookup?.found) {
        setUserPoints(lookup.mxp || 0);
        setUserStatus(lookup.status || "");
        setUserReferrals(lookup.referrals || 0);
        setUserReviewStatus(
          (lookup.reviewStatus as string) || (lookup.verificationStatus as string) || ""
        );
        const dbCompleted = lookup.campaignCompletedTasks || [];
        if (lookup.campaignVersion === config.version) setCompletedTasks(dbCompleted);
        else setCompletedTasks([]);
        setCampaignInputs(lookup.campaignInputs || {});
      }
    } catch (e) { console.error("Refresh error:", e); }
    setRefreshing(false);
  };

  const handleTaskClick = (task: CampaignTask) => {
    if (task.inputType && task.inputType !== "click") return;
    if (task.url) window.open(task.url, "_blank");
    if (!pendingTasks.includes(task.id)) setPendingTasks(prev => [...prev, task.id]);
    setRewardMessage("");
  };

  const handlePasteSubmit = (task: CampaignTask) => {
    const userInput = campaignInputs[task.id] || "";
    if (!userInput.trim()) { alert("Please enter the required information"); return; }
    if (task.url) window.open(task.url, "_blank");
    if (!pendingTasks.includes(task.id)) setPendingTasks(prev => [...prev, task.id]);
    setRewardMessage("");
  };

  const handleFinalSubmit = async () => {
    if (!username || pendingTasks.length === 0) return;
    setFinalSubmitting(true);
    setRewardMessage("");
    try {
      const tasksToSubmit = pendingTasks.map(taskId => ({ taskId, proofValue: campaignInputs[taskId] || undefined }));
      const result = await userApi.finalSubmit(username, tasksToSubmit);
      if (result.success) {
        const user = result.user;
        setUserPoints(user.mxp || 0);
        setCompletedTasks(result.completedTasks || []);
        saveLocalCompletion(username, config.version, result.completedTasks || []);
        setCampaignInputs(user.campaignInputs || {});
        setPendingTasks([]);
        const taskPoints = pendingTasks.reduce((sum, id) => { const t = tasks.find(t => t.id === id); return sum + (t?.points || 0); }, 0);
        setRewardMessage(`+${taskPoints} MXP earned!`);
        setTimeout(() => setRewardMessage(""), 3000);
      } else if (result.failedTasks) {
        const msgs = result.failedTasks.map((f: { taskId: string; message: string }) => f.message).join("; ");
        setRewardMessage(msgs || result.message || "Some tasks failed validation");
      } else {
        setRewardMessage(result.message || "Submission failed. Try again.");
      }
    } catch (error) {
      console.error("Final submit error:", error);
      setRewardMessage("Error submitting tasks. Try again.");
    }
    setFinalSubmitting(false);
  };

  if (!isClient) return null;

  const statusLevels: Record<string, number> = { bot: 0, vip: 3, shark: 7, whale: 15, boss: 30 };
  const nextStatus = (current: string, refs: number) => {
    const tiers = ["bot", "vip", "shark", "whale", "boss"];
    const idx = tiers.indexOf(current.toLowerCase());
    for (let i = idx + 1; i < tiers.length; i++) {
      const needed = statusLevels[tiers[i]] || 0;
      if (refs < needed) return { name: tiers[i].toUpperCase(), needed, remaining: needed - refs };
    }
    return null;
  };
  const next = nextStatus(userStatus, userReferrals);

  return (
    <div className="container">
      <div className="main-content">
        <div className="home-left-column">
          <div className="banner">
            {images.homeImages[bannerIndex] ? (
              <img src={images.homeImages[bannerIndex]} alt={`${SITE.projectName} Banner`} style={{ width: "100%", height: "auto", display: "block" }} />
            ) : (
              <div className="banner-text">{SITE.projectName}</div>
          )}
          </div>

          {isIdentified && (
            <>
              <div className="homepage-status-card">
                <div className="status-card-header">
                  <span className="status-chip">VIP Progress</span>
                  <span className={`status-badge ${userStatus?.toLowerCase() || "bot"}`} style={{ cursor: "pointer" }}>
                    {userStatus || "BOT"}
                  </span>
                </div>
                <div className="status-card-body">
                  <div className="status-line">
                    <span>Current referrals</span>
                    <strong>{userReferrals}</strong>
                  </div>
                  {next && (
                    <div className="status-line emphasis-line">
                      Invite {next.remaining} more to become {next.name}
                    </div>
                  )}
                  <div className="mini-progress-bar">
                    <div className="mini-progress-fill" style={{ width: `${Math.min((userReferrals / (statusLevels.boss || 50)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="homepage-referral-card">
                <div className="referral-card-top">
                  <span className="referral-title">Your Invite Link</span>
                  <button className="mini-copy-btn" onClick={() => copyInviteLink(`${window.location.origin}?ref=${encodeURIComponent(username)}`)}>
                    COPY LINK
                  </button>
                </div>
                <div className="referral-link-box" onClick={() => copyInviteLink(`${window.location.origin}?ref=${encodeURIComponent(username)}`)}>
                  {`${window.location.origin}?ref=${username}`}
                </div>
              </div>
            </>
          )}

          {isIdentified && (
            <div className="homepage-status-card">
              <div className="status-card-header">
                <span className="status-chip">📋 Tasks</span>
                <span className="status-badge bot" style={{ cursor: "default" }}>
                  {completedTasks.length}/{tasks.length}
                </span>
              </div>
              <div className="status-card-body">
                <div className="status-line">
                  <span>Completed</span>
                  <strong>{tasks.length ? `${completedTasks.length} / ${tasks.length}` : "0 / 0"}</strong>
                </div>
                {tasks.length > 0 && (
                  <div className="mini-progress-bar">
                    <div className="mini-progress-fill"
                      style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }} />
                  </div>
                )}
                {completedTasks.length > 0 && (
                  <div className="status-line emphasis-line">
                    +{completedTasks.reduce((sum, id) => { const t = tasks.find(t => t.id === id); return sum + (t?.points || 0); }, 0)} MXP earned
                  </div>
                )}
                {pendingTasks.length > 0 && (
                  <div className="status-line" style={{ color: "#856404", fontWeight: 700, marginTop: 4 }}>
                    {pendingTasks.length} task{pendingTasks.length > 1 ? "s" : ""} ready → +{pendingTasks.reduce((sum, id) => sum + (tasks.find(t => t.id === id)?.points || 0), 0)} MXP
                  </div>
                )}
              </div>
            </div>
          )}

          <button className="btn secondary-btn" onClick={() => router.push("/")} style={{ marginTop: 16, width: "100%" }}>← BACK</button>
        </div>

        <div className="right-column">
          {config.version > 1 && (
            <div className="campaign-version-badge">Version {config.version}</div>
          )}

          {isIdentified ? (
            <div className="homepage-user-card">
              <div className="user-card-top">
                <div className="profile-box">
                  <div className="user-info-left">
                    <img src={images.brandImages[0] || "/logo.PNG"} alt={SITE.projectName} className="user-logo-icon" />
                    <div className="user-info-text">
                      <span className="user-name">{username.replace(/^@/, "").charAt(0).toUpperCase() + username.replace(/^@/, "").slice(1)}</span>
                      {(userReviewStatus === "VERIFIED" || userReviewStatus === "VERIFIED_AND_APPROVED") && (
                        <span className="verified-badge-pill"><span className="verified-check">✓</span><span className="verified-text">Verified</span></span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="balance-box">
                  <span className="balance-label">{SITE.xpLabel}</span>
                  <div className="balance-value">
                    <img src={images.balanceIcons[1] || "/logo.PNG"} alt={SITE.projectName} className="balance-icon" />
                    <span>{userPoints.toLocaleString()}</span>
                  </div>
                </div>
                <div className="balance-box">
                  <span className="balance-label">SOL Balance</span>
                  <div className="balance-value">
                    <img src={images.balanceIcons[0] || "/logo.PNG"} alt="SOL" className="balance-icon" />
                    <span>0.00</span>
                  </div>
                </div>
              </div>
              <div className="user-card-bottom">
                <button className="btn secondary-btn switch-btn" onClick={() => { localStorage.removeItem(SITE.lsKeys.user); setIsIdentified(false); setUsername(""); setUserPoints(0); setUserStatus(""); setUserReferrals(0); setUserReviewStatus(""); }}>
                  ⇄ Switch
                </button>
                <button className="btn refresh-btn" onClick={handleRefresh} disabled={refreshing}
                  style={{ flex: "0 0 auto", minWidth: 70, fontSize: 22 }}>
                  {refreshing ? "..." : "⟳"}
                </button>
              </div>
            </div>
          ) : (
            <div className="link-prompt">
              <div className="prompt-icon">🔗</div>
              <p>LINK YOUR ACCOUNT TO TRACK POINTS</p>
              <p className="prompt-desc">Enter your @username to track your campaign progress</p>
              <input type="text" placeholder="@username" value={username} onChange={(e) => setUsername(e.target.value)} className="prompt-input" />
              <button className="btn primary-btn" onClick={handleIdentify} disabled={loading}>
                {loading ? "VERIFYING..." : "CONFIRM"}
              </button>
            </div>
          )}

          {rewardMessage && <div className="reward-message">{rewardMessage}</div>}
          {dailyMessage && <div className="reward-message">{dailyMessage}</div>}

          {isIdentified && (
            <div className="daily-reward-card">
              <div className="daily-reward-header">
                <span className="daily-reward-icon">🎁</span>
                <span className="daily-reward-title">DAILY REWARD</span>
              </div>
              {!dailyRewardEnabled ? (
                <p className="daily-reward-disabled">Daily reward is currently disabled</p>
              ) : dailyClaimed ? (
                <div className="daily-reward-claimed"><span className="claimed-check">✓</span><span>Claimed +{dailyRewardMxp} MXP today</span></div>
              ) : (
                <>
                  <p className="daily-reward-amount">Claim +{dailyRewardMxp} MXP once per day</p>
                  <button className="btn primary-btn daily-claim-btn" onClick={handleClaimDailyReward} disabled={dailyClaiming}>
                    {dailyClaiming ? "CLAIMING..." : `CLAIM +${dailyRewardMxp} MXP`}
                  </button>
                </>
              )}
            </div>
          )}

          {isIdentified && (
            <>
              <div className="tasks-list">
                {tasks.length === 0 ? (
                  <div className="no-tasks"><p>No campaign tasks available yet.</p><p>Check back later!</p></div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className={`campaign-task${completedTasks.includes(task.id) ? " completed" : ""}${pendingTasks.includes(task.id) && !completedTasks.includes(task.id) ? " pending" : ""}${task.inputType && task.inputType !== "click" ? " paste-task" : ""}`}>
                      <div className="task-header-row" onClick={() => task.inputType === "click" && handleTaskClick(task)}>
                        <div className="task-info">
                          <span className="task-icon">🔗</span>
                          <span className="task-label">{task.label}</span>
                        </div>
                        <div className="task-mxp-badge">
                          <img src="/logo.PNG" alt={SITE.xpLabel} className="task-mxp-logo" />
                          <span>+{task.points} MXP</span>
                          <span className={`task-check${completedTasks.includes(task.id) || pendingTasks.includes(task.id) ? " visible" : ""}`}>
                            {completedTasks.includes(task.id) ? "✓" : "●"}
                          </span>
                        </div>
                      </div>

                      {task.inputType === "click" && !completedTasks.includes(task.id) && (
                        !pendingTasks.includes(task.id)
                          ? <button className="campaign-link-btn" onClick={() => handleTaskClick(task)}>GO TO LINK →</button>
                          : <div className="task-ready-indicator">✓ Ready to submit</div>
                      )}

                      {task.inputType === "link" && !completedTasks.includes(task.id) && (
                        <>
                          <button className="campaign-link-btn" onClick={() => { if (task.url) window.open(task.url, "_blank"); if (!visitedLinkTasks.includes(task.id)) setVisitedLinkTasks(prev => [...prev, task.id]); }}>
                            {visitedLinkTasks.includes(task.id) ? "↗ VISIT LINK AGAIN" : "↗ GO TO LINK →"}
                          </button>
                          {visitedLinkTasks.includes(task.id) && !pendingTasks.includes(task.id) && (
                            <div className="task-input-row" style={{ marginTop: 10 }}>
                              <input type="text" placeholder="Paste your link here..." value={campaignInputs[task.id] || ""} onChange={(e) => handleInputChange(task.id, e.target.value)} className="task-input" />
                              <button className="submit-btn" onClick={() => handlePasteSubmit(task)}>MARK READY</button>
                            </div>
                          )}
                          {pendingTasks.includes(task.id) && <div className="task-ready-indicator">✓ Ready to submit</div>}
                        </>
                      )}

                      {task.inputType && task.inputType !== "click" && task.inputType !== "link" && !completedTasks.includes(task.id) && !pendingTasks.includes(task.id) && (
                        <div className="task-input-row">
                          <input type={task.inputType === "email" ? "email" : "text"} placeholder={task.inputType === "email" ? "Enter your email..." : "Enter required text..."} value={campaignInputs[task.id] || ""} onChange={(e) => handleInputChange(task.id, e.target.value)} className="task-input" />
                          <button className="submit-btn" onClick={() => handlePasteSubmit(task)}>MARK READY</button>
                        </div>
                      )}

                      {task.inputType && task.inputType !== "click" && task.inputType !== "link" && !completedTasks.includes(task.id) && pendingTasks.includes(task.id) && (
                        <div className="task-ready-indicator">✓ Ready to submit</div>
                      )}

                      {task.inputType && task.inputType !== "click" && completedTasks.includes(task.id) && (
                        <div className="task-submitted"><span>Submitted: </span><span className="submitted-value">{campaignInputs[task.id] || "✓"}</span></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {isIdentified && (
            <div className="final-submit-section">
              <button className="btn primary-btn final-submit-btn" onClick={handleFinalSubmit} disabled={finalSubmitting || pendingTasks.length === 0}>
                {finalSubmitting
                  ? "SUBMITTING..."
                  : pendingTasks.length === 0
                    ? completedTasks.length === tasks.length && tasks.length > 0
                      ? "✓ All Tasks Completed"
                      : "NO TASKS READY"
                    : `COMPLETE TASKS → +${pendingTasks.reduce((sum, id) => sum + (tasks.find(t => t.id === id)?.points || 0), 0)} MXP`}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Comic+Neue:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #EED5C1; color: #1E1E1E; font-family: 'Comic Neue', cursive; overflow-y: auto; }
        a { color: inherit; text-decoration: none; }
        :root {
          --bg-color: #EED5C1; --card-bg: #FAFAFA; --border-color: #1E1E1E;
          --accent-color: #F28C28; --primary-color: #9E1B1E; --soft-white: #FAFAFA;
          --text-color: #1E1E1E; --shadow: 4px 4px 0 #8B5A2B;
          --font-heading: 'Anton', sans-serif; --font-body: 'Comic Neue', cursive;
        }

        .container { max-width: 1040px; margin: 0 auto; padding: 20px; min-height: 100vh; }
        .main-content { display: flex; gap: 24px; align-items: flex-start; }
        .home-left-column { flex: 0 0 auto; width: 40%; max-width: 380px; }
        .right-column { flex: 1; min-width: 0; max-width: 520px; }
        .header-section { display: none; }

        .banner { margin: 0 0 18px 0; border: 4px solid var(--border-color); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow); width: 100%; }
        .banner img { width: 100%; height: auto; display: block; object-fit: cover; }
        .banner-text { padding: 40px 20px; text-align: center; font-family: var(--font-heading); font-size: 28px; color: var(--primary-color); }

        .homepage-status-card { background: var(--card-bg); border: 3px solid var(--border-color); border-radius: 14px; padding: 16px 18px; box-shadow: var(--shadow); margin-bottom: 16px; }
        .status-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .status-chip { border-radius: 999px; border: 2px solid var(--border-color); background: #fff2d7; font-family: var(--font-heading); font-size: 13px; padding: 4px 12px; opacity: 0.65; }
        .status-badge { display: inline-block; padding: 8px 20px; border-radius: 20px; font-family: var(--font-heading); text-transform: uppercase; border: 2px solid var(--border-color); font-size: 13px; }
        .status-badge.bot { background: var(--primary-color); color: var(--soft-white); }
        .status-badge.vip { background: #28a745; color: var(--soft-white); }
        .status-badge.shark { background: #3498db; color: var(--soft-white); }
        .status-badge.whale { background: #9b59b6; color: var(--soft-white); }
        .status-badge.boss { background: #f39c12; color: var(--soft-white); }
        .status-card-body { display: flex; flex-direction: column; gap: 8px; }
        .status-line { display: flex; justify-content: space-between; font-size: 13px; }
        .emphasis-line { color: var(--primary-color); font-family: var(--font-heading); justify-content: center; }
        .mini-progress-bar { height: 10px; background: var(--bg-color); border: 2px solid var(--border-color); border-radius: 6px; overflow: hidden; }
        .mini-progress-fill { background: linear-gradient(90deg, var(--primary-color), var(--accent-color)); border-radius: 4px; transition: width 0.3s ease; height: 100%; }

        .homepage-referral-card { background: var(--card-bg); border: 3px solid var(--border-color); border-radius: 14px; padding: 16px 18px; box-shadow: var(--shadow); margin-bottom: 16px; }
        .referral-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .referral-title { font-family: var(--font-heading); font-size: 14px; letter-spacing: 0.5px; }
        .mini-copy-btn { background: var(--primary-color); color: var(--soft-white); border: 2px solid var(--border-color); border-radius: 8px; padding: 6px 14px; font-size: 11px; font-family: var(--font-heading); cursor: pointer; }
        .referral-link-box { border: 2px solid var(--border-color); border-radius: 10px; padding: 10px 14px; background: var(--bg-color); font-size: 12px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .homepage-user-card { background: var(--card-bg); border: 3px solid var(--border-color); border-radius: 18px; box-shadow: var(--shadow); padding: 14px; margin-bottom: 14px; }
        .user-card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(30,30,30,0.1); }
        .profile-box { background: #F8EEE7; border: 1px solid var(--border-color); border-radius: 16px; padding: 12px 16px; flex: 1; }
        .user-info-left { display: flex; align-items: center; gap: 10px; }
        .user-logo-icon { width: 48px; height: 48px; border-radius: 10px; border: 2px solid var(--border-color); object-fit: cover; }
        .user-info-text { display: flex; flex-direction: column; gap: 3px; }
        .user-name { font-family: var(--font-heading); font-size: 20px; color: var(--primary-color); }
        .balance-box { background: #F8EEE7; border: 1px solid var(--border-color); border-radius: 16px; padding: 12px; flex: 1; }
        .user-card-top .balance-box { padding: 12px; }
        .balance-label { display: block; color: #705B4E; font-size: 10px; margin-bottom: 6px; text-transform: uppercase; }
        .balance-value { display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 15px; }
        .balance-icon { width: 24px; height: 24px; border-radius: 9px; border: 1px solid var(--border-color); background: #fff; object-fit: cover; }
        .user-card-bottom { display: flex; gap: 10px; }
        .switch-btn { flex: 1; padding: 10px 16px; font-size: 14px; background: var(--card-bg); color: var(--text-color); }
        .refresh-btn { background: #60A5FA; color: #fff; border-color: #3B82F6; }
        .refresh-btn:disabled { opacity: 0.6; }

        .verified-badge-pill { background: #28a745; color: #fff; font-size: 10px; border-radius: 8px; padding: 3px 10px; display: inline-flex; align-items: center; gap: 3px; }
        .verified-check { font-size: 11px; font-weight: 800; }
        .verified-text { font-size: 7px; text-transform: uppercase; }

        .back-btn { background: #EED5C1; border: 3px solid #1E1E1E; padding: 10px 16px; font-weight: 700; cursor: pointer; border-radius: 8px; font-family: var(--font-body); }
        .btn { padding: 14px 28px; border: 3px solid #1E1E1E; font-weight: 700; cursor: pointer; border-radius: 10px; font-family: var(--font-body); font-size: 14px; }
        .primary-btn { background: var(--primary-color); color: var(--soft-white); }
        .secondary-btn { background: var(--card-bg); color: var(--text-color); }
        .campaign-version-badge { text-align: center; font-size: 12px; color: #705B4E; margin-bottom: 8px; }

        .link-prompt { background: var(--card-bg); border: 3px solid var(--border-color); border-radius: 14px; padding: 32px 24px; text-align: center; box-shadow: var(--shadow); margin-bottom: 16px; }
        .prompt-icon { font-size: 32px; margin-bottom: 12px; }
        .prompt-desc { font-size: 13px; color: #705B4E; margin-bottom: 16px; }
        .prompt-input { width: 100%; padding: 14px; border: 3px solid var(--border-color); border-radius: 10px; font-size: 16px; font-family: var(--font-body); font-weight: 700; margin-bottom: 14px; box-sizing: border-box; }
        .prompt-input:focus { outline: none; border-color: var(--accent-color); }

        .reward-message { background: #d4edda; color: #155724; padding: 10px 16px; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; margin-bottom: 12px; }

        .tasks-list { display: flex; flex-direction: column; gap: 10px; }
        .campaign-task { background: var(--card-bg); border: 3px solid var(--border-color); border-radius: 12px; padding: 14px; box-shadow: var(--shadow); }
        .campaign-task.completed { opacity: 0.6; background: #f0f8f0; }
        .campaign-task.pending { border-color: #F28C28; background: #FFF8F0; }
        .task-header-row { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .task-info { display: flex; align-items: center; gap: 8px; }
        .task-icon { font-size: 16px; }
        .task-label { font-weight: 700; font-size: 14px; }
        .task-mxp-badge { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; }
        .task-mxp-logo { width: 20px; height: 20px; border-radius: 4px; }
        .task-check { display: none; font-size: 14px; color: #28a745; font-weight: 800; }
        .task-check.visible { display: inline; }
        .campaign-link-btn { display: block; width: 100%; margin-top: 10px; padding: 10px; background: var(--primary-color); color: var(--soft-white); border: 2px solid var(--border-color); border-radius: 8px; font-weight: 700; cursor: pointer; font-family: var(--font-body); font-size: 13px; text-align: center; }
        .task-input-row { display: flex; gap: 8px; margin-top: 10px; }
        .task-input { flex: 1; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-family: var(--font-body); font-size: 13px; }
        .submit-btn { padding: 10px 18px; background: var(--accent-color); color: #fff; border: 2px solid var(--border-color); border-radius: 8px; font-weight: 700; cursor: pointer; font-family: var(--font-body); font-size: 13px; }
        .task-ready-indicator { margin-top: 8px; padding: 8px 12px; background: #FFF3CD; border: 2px solid #F28C28; border-radius: 8px; font-size: 13px; font-weight: 700; color: #856404; text-align: center; }
        .task-submitted { margin-top: 8px; font-size: 13px; color: #28a745; font-weight: 700; }
        .submitted-value { color: #1E1E1E; }
        .no-tasks { text-align: center; padding: 30px 20px; color: #705B4E; }
        .final-submit-section { margin: 20px 0; text-align: center; }
        .final-submit-btn { width: 100%; max-width: 320px; padding: 16px 28px; font-size: 16px; }
        .final-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #705B4E; }

        .daily-reward-card { margin: 14px 0; padding: 14px; border: 3px solid var(--border-color); border-radius: 12px; background: linear-gradient(135deg, #FFF8F0 0%, #FFF3E0 100%); text-align: center; }
        .daily-reward-header { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }
        .daily-reward-icon { font-size: 20px; }
        .daily-reward-title { font-family: var(--font-heading); font-size: 16px; color: var(--primary-color); letter-spacing: 1px; }
        .daily-reward-amount { font-size: 13px; color: #705B4E; margin-bottom: 8px; }
        .daily-claim-btn { width: 100%; max-width: 280px; margin: 0 auto; padding: 10px 20px; font-size: 14px; }
        .daily-reward-claimed { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 14px; color: #28a745; font-weight: 700; }
        .claimed-check { font-size: 16px; }
        .daily-reward-disabled { font-size: 14px; color: #705B4E; opacity: 0.7; }

        @media (max-width: 768px) { .main-content { flex-direction: column; } .home-left-column { width: 100%; max-width: 100%; } .right-column { width: 100%; } .banner { margin-bottom: 14px; } }
        @media (max-width: 480px) { .container { padding: 12px; } .task-header-row { flex-direction: column; align-items: flex-start; gap: 10px; } .task-input-row { flex-direction: column; } }
      `}</style>
    </div>
  );
}
