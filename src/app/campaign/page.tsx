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
  const [pageAvailable, setPageAvailable] = useState(true);
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
      }

      const pageData = result.pageRuntime as Record<string, unknown> | null;
      const campaignRuntime = pageData?.campaign as Record<string, unknown> | null;
      if (campaignRuntime) {
        setPageAvailable(campaignRuntime.enabled !== false);
      } else {
        setPageAvailable(!!data?.enabled);
      }
    } catch (error) {
      console.error("Load config error:", error);
    }
  };

  const verifyUser = async (usernameToVerify: string) => {
    try {
      const result = await userApi.lookup(usernameToVerify);

      if (result?.found) {
        setUserPoints(result.mxp || 0);
        setCampaignInputs(result.campaignInputs || {});

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
      try {
        setCompletedTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading local completion:", e);
      }
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

  const handleTaskClick = async (task: CampaignTask) => {
    if (task.inputType && task.inputType !== "click") {
      return;
    }

    if (task.url) {
      window.open(task.url, "_blank");
    }

    await completeTask(task, "");
  };

  const completeTask = async (task: CampaignTask, userInput: string) => {
    if (!username) return;

    setRewardMessage("");

    try {
      // Look up the userId first
      const lookup = await userApi.lookup(username);
      if (!lookup?.found || !lookup.userId) {
        setRewardMessage("User not found. Please re-identify.");
        return;
      }

      const currentCampaignVersion = lookup.campaignVersion || 1;
      const dbCompleted: string[] = lookup.campaignCompletedTasks || [];

      if (currentCampaignVersion !== config.version) {
        setRewardMessage("Campaign updated! Starting fresh.");
      } else if (dbCompleted.includes(task.id)) {
        setRewardMessage("Task already completed!");
        return;
      }

      // Use the dedicated backend endpoint — actually saves to DB
      const result = await userApi.completeTask(lookup.userId, task.id, userInput || undefined);

      if (result.success) {
        const updated = result.user;
        setUserPoints(updated.mxp || 0);

        const newCompleted = updated.campaignCompletedTasks || dbCompleted;
        setCompletedTasks(newCompleted);
        saveLocalCompletion(username, config.version, newCompleted);
        setCampaignInputs(updated.campaignInputs || {});

        if (currentCampaignVersion !== config.version) {
          setRewardMessage(`+${task.points} ${SITE.xpLabel} earned! (New campaign)`);
        } else {
          setRewardMessage(`+${task.points} ${SITE.xpLabel} earned!`);
        }
        setTimeout(() => setRewardMessage(""), 3000);
      } else {
        setRewardMessage(result.message || "Error completing task. Please try again.");
      }
    } catch (error) {
      console.error("Task completion error:", error);
      setRewardMessage("Error completing task. Please try again.");
    }
  };

  const handlePasteSubmit = async (task: CampaignTask) => {
    const userInput = campaignInputs[task.id] || "";

    if (!userInput.trim()) {
      alert("Please enter the required information");
      return;
    }

    if (task.url) {
      window.open(task.url, "_blank");
    }

    await completeTask(task, userInput);
  };

  const getTotalPoints = () => {
    return tasks.reduce((sum, task) => sum + task.points, 0);
  };

  const getCompletedPoints = () => {
    return tasks
      .filter((task) => completedTasks.includes(task.id))
      .reduce((sum, task) => sum + task.points, 0);
  };

  if (!isClient) return null;

  if (!pageAvailable) {
    return (
      <div className="campaign-container">
        <div className="campaign-header">
          <button className="back-btn" onClick={() => router.push("/")}>
            ← BACK
          </button>
          <img src="/logo.PNG" alt="Logo" className="campaign-logo" />
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ color: '#9E1B1E', fontFamily: 'Anton, sans-serif', fontSize: '24px' }}>PAGE UNAVAILABLE</h2>
          <p style={{ color: '#705B4E', marginTop: '16px' }}>This page is currently disabled.</p>
          <button 
            className="btn primary-btn" 
            style={{ marginTop: '24px' }}
            onClick={() => router.push("/")}
          >
            GO TO HOMEPAGE
          </button>
        </div>
        <style>{`
          .campaign-container { max-width: 520px; margin: 0 auto; padding: 20px; background: #FAFAFA; min-height: 100vh; }
          .campaign-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
          .back-btn { background: #EED5C1; border: 3px solid #1E1E1E; padding: 10px 16px; font-weight: 700; cursor: pointer; border-radius: 8px; }
          .campaign-logo { height: 40px; }
          .btn { padding: 14px 28px; border: 3px solid #1E1E1E; font-weight: 700; cursor: pointer; border-radius: 10px; }
          .primary-btn { background: #9E1B1E; color: #FAFAFA; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="campaign-container">
      <div className="campaign-header">
        <button className="back-btn" onClick={() => router.push("/")}>
          ← BACK
        </button>
        <img src="/logo.PNG" alt="Logo" className="campaign-logo" />
      </div>

      <h1 className="campaign-title">{config.pageTitle}</h1>

      {config.version > 1 && (
        <div className="campaign-version-badge">
          Version {config.version}
        </div>
      )}

      {isIdentified && (
        <p className="user-username">
          Logged in as: <span>{username}</span>
        </p>
      )}

      {rewardMessage && (
        <div className="reward-message">{rewardMessage}</div>
      )}

      {!isIdentified ? (
        <div className="link-prompt">
          <div className="prompt-icon">🔗</div>
          <p>LINK YOUR ACCOUNT TO TRACK POINTS</p>
          <p className="prompt-desc">
            Enter your @username to track your campaign progress
          </p>
          <input
            type="text"
            placeholder="@username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="prompt-input"
          />
          <button
            className="btn primary-btn"
            onClick={handleIdentify}
            disabled={loading}
          >
            {loading ? "VERIFYING..." : "CONFIRM"}
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="no-tasks">
          <p>No campaign tasks available yet.</p>
          <p>Check back later!</p>
        </div>
      ) : (
        <>
          <div className="tasks-list">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`campaign-task ${
                  completedTasks.includes(task.id) ? "completed" : ""
                } ${
                  task.inputType && task.inputType !== "click"
                    ? "paste-task"
                    : ""
                }`}
              >
                <div
                  className="task-header-row"
                  onClick={() =>
                    task.inputType === "click" && handleTaskClick(task)
                  }
                >
                  <div className="task-info">
                    <span className="task-icon">🔗</span>
                    <span className="task-label">{task.label}</span>
                  </div>
                  <div className="task-mxp-badge">
                    <img
                      src="/logo.PNG"
                      alt={SITE.xpLabel}
                      className="task-mxp-logo"
                    />
                    <span>+{task.points} MXP</span>
                    <span
                      className={`task-check ${
                        completedTasks.includes(task.id) ? "visible" : ""
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                </div>

                {task.inputType === "click" && !completedTasks.includes(task.id) && (
                  <button
                    className="campaign-link-btn"
                    onClick={() => handleTaskClick(task)}
                  >
                    GO TO LINK →
                  </button>
                )}

                {/* LINK type: show GO button first, then input appears after visiting */}
                {task.inputType === "link" && !completedTasks.includes(task.id) && (
                  <>
                    <button
                      className="campaign-link-btn"
                      onClick={() => {
                        if (task.url) window.open(task.url, "_blank");
                        if (!visitedLinkTasks.includes(task.id)) {
                          setVisitedLinkTasks(prev => [...prev, task.id]);
                        }
                      }}
                    >
                      {visitedLinkTasks.includes(task.id) ? "↗ VISIT LINK AGAIN" : "↗ GO TO LINK →"}
                    </button>
                    {visitedLinkTasks.includes(task.id) && (
                      <div className="task-input-row" style={{ marginTop: '10px' }}>
                        <input
                          type="text"
                          placeholder="Paste your link here..."
                          value={campaignInputs[task.id] || ""}
                          onChange={(e) => handleInputChange(task.id, e.target.value)}
                          className="task-input"
                        />
                        <button
                          className="submit-btn"
                          onClick={() => handlePasteSubmit(task)}
                        >
                          SUBMIT
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* email / text types: show input directly */}
                {task.inputType &&
                  task.inputType !== "click" &&
                  task.inputType !== "link" &&
                  !completedTasks.includes(task.id) && (
                    <div className="task-input-row">
                      <input
                        type={task.inputType === "email" ? "email" : "text"}
                        placeholder={
                          task.inputType === "email"
                            ? "Enter your email..."
                            : "Enter required text..."
                        }
                        value={campaignInputs[task.id] || ""}
                        onChange={(e) =>
                          handleInputChange(task.id, e.target.value)
                        }
                        className="task-input"
                      />
                      <button
                        className="submit-btn"
                        onClick={() => handlePasteSubmit(task)}
                      >
                        SUBMIT
                      </button>
                    </div>
                  )}

                {task.inputType &&
                  task.inputType !== "click" &&
                  completedTasks.includes(task.id) && (
                    <div className="task-submitted">
                      <span>Submitted: </span>
                      <span className="submitted-value">
                        {campaignInputs[task.id] || "✓"}
                      </span>
                    </div>
                  )}
              </div>
            ))}
          </div>

          <div className="points-summary">
            <div className="points-row">
              <span>COMPLETED</span>
              <span className="points-value">
                {getCompletedPoints()} / {getTotalPoints()} MXP
              </span>
            </div>
            <div className="points-bar">
              <div
                className="points-fill"
                style={{
                  width: `${
                    getTotalPoints() > 0
                      ? (getCompletedPoints() / getTotalPoints()) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            {isIdentified && (
              <div className="total-mxp">
                <img
                  src="/logo.PNG"
                  alt={SITE.xpLabel}
                  className="total-mxp-logo"
                />
                <span>YOUR TOTAL: {userPoints} {SITE.xpLabel}</span>
              </div>
            )}
            {isIdentified && userPoints > 0 && (
              <div className="mxp-breakdown">
                <div className="breakdown-title">MXP BREAKDOWN</div>
                {mxpBreakdown.fromUsername > 0 && (
                  <div className="breakdown-row">
                    <span>Username</span>
                    <span className="breakdown-value">+{mxpBreakdown.fromUsername}</span>
                  </div>
                )}
                {mxpBreakdown.fromInvitee > 0 && (
                  <div className="breakdown-row">
                    <span>Invited By</span>
                    <span className="breakdown-value">+{mxpBreakdown.fromInvitee}</span>
                  </div>
                )}
                {mxpBreakdown.fromTasks > 0 && (
                  <div className="breakdown-row">
                    <span>Campaign Tasks</span>
                    <span className="breakdown-value">+{mxpBreakdown.fromTasks}</span>
                  </div>
                )}
                {mxpBreakdown.fromReferrals > 0 && (
                  <div className="breakdown-row">
                    <span>Your Referrals</span>
                    <span className="breakdown-value">+{mxpBreakdown.fromReferrals}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isIdentified && (
            <button
              className="identify-btn"
              onClick={() => setShowIdModal(true)}
            >
              LINK MY ACCOUNT
            </button>
          )}
        </>
      )}

      <button className="btn secondary-btn" onClick={() => router.push("/")}>
        BACK TO HOME
      </button>

      {showIdModal && (
        <div className="modal-overlay" onClick={() => setShowIdModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: "var(--primary-color)" }}>LINK ACCOUNT</h3>
              <button
                className="close-btn"
                onClick={() => setShowIdModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">
                Enter your @username to track your campaign points
              </p>
              <input
                type="text"
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button
                className="btn primary-btn"
                onClick={handleIdentify}
                disabled={loading}
              >
                {loading ? "CHECKING..." : "CONFIRM"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .campaign-container {
          min-height: 100vh;
          background: var(--bg-color);
          padding: 20px;
          font-family: 'Comic Neue', cursive;
        }

        .campaign-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 30px;
        }

        .campaign-logo {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          border: 3px solid var(--border-color);
        }

        .campaign-title {
          font-family: 'Anton', sans-serif;
          font-size: 32px;
          color: var(--primary-color);
          text-align: center;
          margin-bottom: 10px;
        }

        .campaign-version-badge {
          text-align: center;
          font-size: 12px;
          color: var(--text-color);
          opacity: 0.7;
          margin-bottom: 15px;
        }

        .reward-message {
          text-align: center;
          padding: 10px;
          margin-bottom: 15px;
          background: #d4edda;
          border: 2px solid #28a745;
          border-radius: 10px;
          color: #155724;
          font-weight: 700;
        }

        .back-btn {
          display: inline-block;
          padding: 8px 16px;
          background: var(--card-bg);
          border: 2px solid var(--border-color);
          border-radius: 8px;
          font-weight: 700;
          text-decoration: none;
          color: var(--text-color);
          box-shadow: var(--shadow);
          cursor: pointer;
        }

        .back-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-hover);
        }

        .user-username {
          text-align: center;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .user-username span {
          color: var(--primary-color);
          font-weight: 700;
        }

        .link-prompt {
          background: var(--card-bg);
          border: 4px solid var(--border-color);
          border-radius: 18px;
          padding: 30px;
          text-align: center;
          box-shadow: var(--shadow);
          max-width: 400px;
          margin: 0 auto 20px;
        }

        .prompt-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .link-prompt p {
          font-family: 'Anton', sans-serif;
          font-size: 18px;
          margin-bottom: 10px;
        }

        .prompt-desc {
          font-size: 14px !important;
          opacity: 0.7;
          font-family: 'Comic Neue', cursive !important;
        }

        .prompt-input {
          width: 100%;
          padding: 15px;
          border: 3px solid var(--border-color);
          border-radius: 10px;
          font-size: 16px;
          font-family: 'Comic Neue', cursive;
          font-weight: 700;
          margin: 15px 0;
          box-shadow: inset 2px 2px 0 var(--border-color);
        }

        .prompt-input:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        .no-tasks {
          text-align: center;
          padding: 40px;
          background: var(--card-bg);
          border: 3px solid var(--border-color);
          border-radius: 18px;
          margin-bottom: 20px;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
        }

        .campaign-task {
          background: var(--card-bg);
          border: 3px solid var(--border-color);
          border-radius: 14px;
          padding: 15px;
          box-shadow: var(--shadow);
        }

        .campaign-task.completed {
          background: #d4edda;
          border-color: #28a745;
        }

        .task-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }

        .task-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .task-icon {
          font-size: 20px;
        }

        .task-label {
          font-family: 'Anton', sans-serif;
          font-size: 14px;
        }

        .task-mxp-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--accent-color);
          padding: 6px 12px;
          border-radius: 20px;
          border: 2px solid var(--border-color);
          font-size: 12px;
          font-weight: 700;
        }

        .campaign-task.completed .task-mxp-badge {
          background: #28a745;
          color: white;
        }

        .task-mxp-logo {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }

        .task-check {
          display: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          color: #28a745;
          font-size: 12px;
          text-align: center;
          line-height: 20px;
        }

        .task-check.visible {
          display: block;
        }

        .task-input-row {
          display: flex;
          gap: 10px;
          margin-top: 12px;
        }

        .task-input {
          flex: 1;
          padding: 12px;
          border: 3px solid var(--border-color);
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Comic Neue', cursive;
          font-weight: 700;
        }

        .task-input:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        .submit-btn {
          padding: 12px 20px;
          background: var(--primary-color);
          color: white;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .campaign-link-btn {
          display: block;
          width: 100%;
          margin-top: 12px;
          padding: 13px 16px;
          background: var(--accent-color);
          color: var(--text-color);
          border: 3px solid var(--border-color);
          border-radius: 12px;
          font-family: 'Anton', sans-serif;
          font-size: 14px;
          letter-spacing: 1px;
          font-weight: normal;
          text-align: center;
          cursor: pointer;
          box-shadow: 3px 3px 0 var(--border-color);
        }

        .campaign-link-btn:hover {
          opacity: 0.88;
        }

        .task-submitted {
          margin-top: 10px;
          font-size: 12px;
          opacity: 0.7;
        }

        .submitted-value {
          font-weight: 700;
          color: var(--primary-color);
        }

        .points-summary {
          background: var(--card-bg);
          border: 3px solid var(--border-color);
          border-radius: 14px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .points-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .points-value {
          color: var(--primary-color);
        }

        .points-bar {
          height: 16px;
          background: var(--bg-color);
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid var(--border-color);
        }

        .points-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
          transition: width 0.3s ease;
        }

        .total-mxp {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
          font-family: 'Anton', sans-serif;
          font-size: 18px;
          color: var(--primary-color);
        }

        .total-mxp-logo {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .mxp-breakdown {
          background: var(--card-bg);
          border: 2px solid var(--border-color);
          border-radius: 10px;
          padding: 12px;
          margin-top: 12px;
        }

        .breakdown-title {
          font-family: 'Anton', sans-serif;
          font-size: 11px;
          color: var(--text-color);
          opacity: 0.6;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          text-align: center;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid var(--bg-color);
          font-size: 13px;
        }

        .breakdown-row:last-child {
          border-bottom: none;
        }

        .breakdown-value {
          font-weight: 700;
          color: var(--primary-color);
        }

        .identify-btn {
          width: 100%;
          padding: 15px;
          background: var(--accent-color);
          color: var(--text-color);
          border: 3px solid var(--border-color);
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          margin-bottom: 20px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 20px;
        }

        .modal {
          background: var(--card-bg);
          border: 3px solid var(--border-color);
          border-radius: 14px;
          padding: 25px;
          width: 100%;
          max-width: 380px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          font-family: 'Anton', sans-serif;
          font-size: 18px;
          color: var(--primary-color);
          margin: 0;
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .modal-desc {
          font-size: 14px;
          text-align: center;
        }

        .modal-body input {
          width: 100%;
          padding: 14px;
          border: 3px solid var(--border-color);
          border-radius: 10px;
          font-size: 16px;
          font-family: 'Comic Neue', cursive;
          font-weight: 700;
        }

        .modal-body input:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        @media (max-width: 480px) {
          .campaign-title {
            font-size: 24px;
          }

          .task-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .task-input-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
