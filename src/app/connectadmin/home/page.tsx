"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { SITE, MXP_REWARDS, STATUS_NAMES, STATUS_LEVELS, BUTTON_LABELS, TASK_NAMES, TASK_URLS } from "@/lib/site-config";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

type Tab = "frontend" | "backend";

interface HomepageData {
  // Frontend
  walletButtonVisible?: boolean;
  showBalanceSection?: boolean;
  balanceLabelMichy?: string;
  balanceLabelSol?: string;
  balanceLabelXp?: string;
  statusNames?: Record<string, string>;
  statusLevels?: Record<string, number>;
  pageAvailability?: Record<string, boolean>;
  homeButtons?: Record<string, HomeButton>;
  // Backend
  walletConnect?: { solana: boolean; evm: boolean };
  taskNames?: Record<string, string>;
  taskUrls?: Record<string, string>;
  taskMxp?: Record<string, number>;
  mxpRewards?: { usernameBonus: number; inviteeBonus: number; perReferral: number };
}

interface HomeButton {
  label: string;
  redirectType: "internal" | "external";
  redirectPath: string;
  visible: "always" | "connected" | "hidden";
}

const TASK_KEYS = ["task1", "task2", "task3", "task4", "task5", "telegram"] as const;
const STATUS_KEYS = ["vip", "shark", "whale", "boss"] as const;
const BUTTON_KEYS = ["home_join", "home_check", "campaign", "home_copyLink", "home_done", "home_continue"] as const;
const PAGE_OPTIONS = ["/campaign", "/checknfts", "/contact"];

function defaultButton(k: string): HomeButton {
  const labels: Record<string, string> = {
    home_join: `JOIN ${SITE.shortName}`,
    home_check: "CHECK ROLE",
    campaign: "CAMPAIGN",
    home_copyLink: "COPY LINK",
    home_done: "DONE",
    home_continue: "CONTINUE",
  };
  return { label: labels[k] || k, redirectType: "internal", redirectPath: "", visible: "always" };
}

const DEFAULT_HOMEPAGE: HomepageData = {
  walletButtonVisible: true,
  showBalanceSection: true,
  balanceLabelMichy: SITE.balanceLabel,
  balanceLabelSol: "SOL Balance",
  balanceLabelXp: SITE.xpLabel,
  statusNames: { ...STATUS_NAMES },
  statusLevels: { ...STATUS_LEVELS },
  pageAvailability: { campaign: true },
  homeButtons: Object.fromEntries(BUTTON_KEYS.map((k) => [k, defaultButton(k)])),
  walletConnect: { solana: false, evm: true },
  taskNames: { ...TASK_NAMES },
  taskUrls: { ...TASK_URLS },
  taskMxp: { task1: 10, task2: 10, task3: 10, task4: 10, task5: 10, telegram: 10 },
  mxpRewards: { ...MXP_REWARDS },
};

export default function AdminHomePage() {
  const router = useRouter();
  const { isLoggedIn, isLoading, token } = useAdminAuth();
  const [isClient, setIsClient] = useState(false);
  const [tab, setTab] = useState<Tab>("frontend");
  const [data, setData] = useState<HomepageData>(DEFAULT_HOMEPAGE);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({});

  const api = token ? adminApi(token) : null;

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => {
    if (isLoggedIn && isClient && api) loadConfig();
  }, [isLoggedIn, isClient, token]);

  const toggle = (section: string) => setExpanded((p) => ({ ...p, [section]: !p[section] }));
  const toggleSub = (key: string) => setExpandedSub((p) => ({ ...p, [key]: !p[key] }));
  const isOpen = (section: string) => !!expanded[section];
  const subOpen = (key: string) => !!expandedSub[key];

  const loadConfig = async () => {
    if (!api) return;
    try {
      const res = await api.getConfig("homepage");
      if (res?.value) {
        setData((prev) => ({ ...prev, ...res.value }));
      }
      setLoaded(true);
    } catch (e) {
      console.error("Load config error:", e);
      setLoaded(true);
    }
  };

  const saveConfig = async (fields: Partial<HomepageData>) => {
    if (!api) return;
    setSaving(true);
    setMsg("");
    try {
      await api.updateConfig("homepage", fields, true);
      setMsg("Saved!");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      console.error("Save error:", e);
      setMsg("Save failed!");
    }
    setSaving(false);
  };

  if (!isClient || isLoading) return null;
  if (!isLoggedIn) { router.push("/connectadmin"); return null; }
  if (!loaded) return <div style={styles.loading}>Loading...</div>;

  return (
    <>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>HOMEPAGE SETTINGS</h2>
          <button style={styles.backBtn} onClick={() => router.push("/connectadmin")}>BACK</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tab, ...(tab === "frontend" ? styles.tabActive : {}) }}
            onClick={() => setTab("frontend")}
          >
            FRONTEND
          </button>
          <button
            style={{ ...styles.tab, ...(tab === "backend" ? styles.tabActive : {}) }}
            onClick={() => setTab("backend")}
          >
            BACKEND
          </button>
        </div>

        {/* ======== FRONTEND ======== */}
        {tab === "frontend" && (
          <>
            <Section open={isOpen("balance")} onToggle={() => toggle("balance")} title="BALANCE DISPLAY">
              <div style={styles.formGroup}>
                <label style={styles.label}>SHOW BALANCE SECTION</label>
                <Toggle value={!!data.showBalanceSection} onChange={(v) => setData({ ...data, showBalanceSection: v })} labels={["SHOWN", "HIDDEN"]} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>{SITE.shortName} LABEL</label>
                <input style={styles.input} value={data.balanceLabelMichy || ""} onChange={(e) => setData({ ...data, balanceLabelMichy: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>SOL LABEL</label>
                <input style={styles.input} value={data.balanceLabelSol || ""} onChange={(e) => setData({ ...data, balanceLabelSol: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>XP LABEL</label>
                <input style={styles.input} value={data.balanceLabelXp || ""} onChange={(e) => setData({ ...data, balanceLabelXp: e.target.value })} />
              </div>
            </Section>

            <Section open={isOpen("status")} onToggle={() => toggle("status")} title="STATUS EDITOR">
              {STATUS_KEYS.map((key) => (
                <Section key={key} open={subOpen(`status-${key}`)} onToggle={() => toggleSub(`status-${key}`)} title={(data.statusNames?.[key] || key).toUpperCase()} level={2}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>STATUS NAME</label>
                    <input
                      style={styles.input}
                      value={data.statusNames?.[key] || ""}
                      onChange={(e) => setData({ ...data, statusNames: { ...data.statusNames, [key]: e.target.value } })}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>REFERRALS NEEDED</label>
                    <input
                      style={styles.input}
                      type="number"
                      value={data.statusLevels?.[key] ?? 0}
                      onChange={(e) => setData({ ...data, statusLevels: { ...data.statusLevels, [key]: parseInt(e.target.value) || 0 } })}
                    />
                  </div>
                </Section>
              ))}
            </Section>

            <Section open={isOpen("pages")} onToggle={() => toggle("pages")} title="PAGE AVAILABILITY">
              <div style={styles.formGroup}>
                <label style={styles.label}>CAMPAIGN PAGE</label>
                <Toggle
                  value={data.pageAvailability?.campaign !== false}
                  onChange={(v) => setData({ ...data, pageAvailability: { ...data.pageAvailability, campaign: v } })}
                  labels={["AVAILABLE", "UNAVAILABLE"]}
                />
              </div>
            </Section>

            <Section open={isOpen("buttons")} onToggle={() => toggle("buttons")} title="BUTTON EDITOR">
              {BUTTON_KEYS.map((key) => (
                <Section key={key} open={subOpen(`btn-${key}`)} onToggle={() => toggleSub(`btn-${key}`)} title={data.homeButtons?.[key]?.label || defaultButton(key).label} level={2}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>BUTTON LABEL</label>
                    <input
                      style={styles.input}
                      value={data.homeButtons?.[key]?.label || ""}
                      onChange={(e) => {
                        const btns = { ...data.homeButtons };
                        if (!btns[key]) btns[key] = defaultButton(key);
                        btns[key] = { ...btns[key], label: e.target.value };
                        setData({ ...data, homeButtons: btns as Record<string, HomeButton> });
                      }}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>REDIRECT TYPE</label>
                    <select
                      style={styles.input}
                      value={data.homeButtons?.[key]?.redirectType || "internal"}
                      onChange={(e) => {
                        const btns = { ...data.homeButtons };
                        if (!btns[key]) btns[key] = defaultButton(key);
                        btns[key] = { ...btns[key], redirectType: e.target.value as "internal" | "external", redirectPath: "" };
                        setData({ ...data, homeButtons: btns as Record<string, HomeButton> });
                      }}
                    >
                      <option value="internal">INTERNAL PAGE</option>
                      <option value="external">EXTERNAL LINK</option>
                    </select>
                  </div>
                  {(data.homeButtons?.[key]?.redirectType || "internal") === "internal" ? (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>PAGE PATH</label>
                      <select
                        style={styles.input}
                        value={PAGE_OPTIONS.includes(data.homeButtons?.[key]?.redirectPath || "") ? (data.homeButtons?.[key]?.redirectPath || "") : ""}
                        onChange={(e) => {
                          const btns = { ...data.homeButtons };
                          if (!btns[key]) btns[key] = defaultButton(key);
                          btns[key] = { ...btns[key], redirectPath: e.target.value };
                          setData({ ...data, homeButtons: btns as Record<string, HomeButton> });
                        }}
                      >
                        <option value="">Choose page...</option>
                        {PAGE_OPTIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        style={{ ...styles.input, marginTop: 6 }}
                        placeholder="Or type custom path (e.g. /some-page)"
                        value={PAGE_OPTIONS.includes(data.homeButtons?.[key]?.redirectPath || "") ? "" : (data.homeButtons?.[key]?.redirectPath || "")}
                        onChange={(e) => {
                          const btns = { ...data.homeButtons };
                          if (!btns[key]) btns[key] = defaultButton(key);
                          btns[key] = { ...btns[key], redirectPath: e.target.value };
                          setData({ ...data, homeButtons: btns as Record<string, HomeButton> });
                        }}
                      />
                    </div>
                  ) : (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>EXTERNAL URL</label>
                      <input
                        style={styles.input}
                        placeholder="https://example.com"
                        value={data.homeButtons?.[key]?.redirectPath || ""}
                        onChange={(e) => {
                          const btns = { ...data.homeButtons };
                          if (!btns[key]) btns[key] = defaultButton(key);
                          btns[key] = { ...btns[key], redirectPath: e.target.value };
                          setData({ ...data, homeButtons: btns as Record<string, HomeButton> });
                        }}
                      />
                    </div>
                  )}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>VISIBILITY</label>
                    <select
                      style={styles.input}
                      value={data.homeButtons?.[key]?.visible || "always"}
                      onChange={(e) => {
                        const btns = { ...data.homeButtons };
                        if (!btns[key]) btns[key] = defaultButton(key);
                        btns[key] = { ...btns[key], visible: e.target.value as HomeButton["visible"] };
                        setData({ ...data, homeButtons: btns as Record<string, HomeButton> });
                      }}
                    >
                      <option value="always">ALWAYS VISIBLE</option>
                      <option value="connected">AFTER USER CONNECTED</option>
                      <option value="hidden">HIDDEN</option>
                    </select>
                  </div>
                </Section>
              ))}
            </Section>

            <Section open={isOpen("walletBtn")} onToggle={() => toggle("walletBtn")} title="WALLET BUTTON VISIBILITY">
              <div style={styles.formGroup}>
                <label style={styles.label}>SHOW CONNECT BUTTON</label>
                <Toggle value={!!data.walletButtonVisible} onChange={(v) => setData({ ...data, walletButtonVisible: v })} labels={["SHOWN", "HIDDEN"]} />
              </div>
            </Section>

            <div style={styles.actionBar}>
              <button style={styles.saveBtn} onClick={() => saveConfig(frontendFields(data))} disabled={saving}>
                {saving ? "SAVING..." : "SAVE"}
              </button>
              {msg && <p style={msg.includes("fail") ? styles.errorMsg : styles.successMsg}>{msg}</p>}
            </div>
          </>
        )}

        {/* ======== BACKEND ======== */}
        {tab === "backend" && (
          <>
            <Section open={isOpen("wallet")} onToggle={() => toggle("wallet")} title="WALLET CONNECT">
              <div style={styles.formGroup}>
                <label style={styles.label}>SOLANA</label>
                <Toggle
                  value={!!data.walletConnect?.solana}
                  onChange={(v) => {
                    const wc = { ...data.walletConnect, solana: v };
                    if (!wc.solana && !wc.evm) wc.evm = true;
                    setData({ ...data, walletConnect: wc as { solana: boolean; evm: boolean } });
                  }}
                  labels={["ON", "OFF"]}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>EVM / ETH</label>
                <Toggle
                  value={!!data.walletConnect?.evm}
                  onChange={(v) => {
                    const wc = { ...data.walletConnect, evm: v };
                    if (!wc.solana && !wc.evm) wc.solana = true;
                    setData({ ...data, walletConnect: wc as { solana: boolean; evm: boolean } });
                  }}
                  labels={["ON", "OFF"]}
                />
              </div>
              <p style={styles.hint}>At least one chain must remain enabled.</p>
            </Section>

            <Section open={isOpen("tasks")} onToggle={() => toggle("tasks")} title="TASK EDITOR">
              {TASK_KEYS.map((key) => (
                <Section key={key} open={subOpen(`task-${key}`)} onToggle={() => toggleSub(`task-${key}`)} title={data.taskNames?.[key] || key} level={2}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>TASK NAME</label>
                    <input
                      style={styles.input}
                      value={data.taskNames?.[key] || ""}
                      onChange={(e) => setData({ ...data, taskNames: { ...data.taskNames, [key]: e.target.value } })}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>TASK URL</label>
                    <input
                      style={styles.input}
                      value={data.taskUrls?.[key] || ""}
                      onChange={(e) => setData({ ...data, taskUrls: { ...data.taskUrls, [key]: e.target.value } })}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>POINTS (MXP)</label>
                    <input
                      style={styles.input}
                      type="number"
                      value={data.taskMxp?.[key] ?? 10}
                      onChange={(e) => setData({ ...data, taskMxp: { ...data.taskMxp, [key]: parseInt(e.target.value) || 0 } })}
                    />
                  </div>
                </Section>
              ))}
            </Section>

            <Section open={isOpen("referral")} onToggle={() => toggle("referral")} title="REFERRAL SETTINGS">
              <div style={styles.formGroup}>
                <label style={styles.label}>USERNAME BONUS</label>
                <input
                  style={styles.input}
                  type="number"
                  value={data.mxpRewards?.usernameBonus ?? 30}
                  onChange={(e) => setData({ ...data, mxpRewards: { ...(data.mxpRewards || MXP_REWARDS), usernameBonus: parseInt(e.target.value) || 0 } })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>INVITEE BONUS</label>
                <input
                  style={styles.input}
                  type="number"
                  value={data.mxpRewards?.inviteeBonus ?? 100}
                  onChange={(e) => setData({ ...data, mxpRewards: { ...(data.mxpRewards || MXP_REWARDS), inviteeBonus: parseInt(e.target.value) || 0 } })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>PER REFERRAL</label>
                <input
                  style={styles.input}
                  type="number"
                  value={data.mxpRewards?.perReferral ?? 50}
                  onChange={(e) => setData({ ...data, mxpRewards: { ...(data.mxpRewards || MXP_REWARDS), perReferral: parseInt(e.target.value) || 0 } })}
                />
              </div>
            </Section>

            <div style={styles.actionBar}>
              <button style={{ ...styles.saveBtn, background: "#1E1E1E" }} onClick={() => saveConfig(backendFields(data))} disabled={saving}>
                {saving ? "SAVING..." : "SAVE TO BACKEND"}
              </button>
              {msg && <p style={msg.includes("fail") ? styles.errorMsg : styles.successMsg}>{msg}</p>}
            </div>
          </>
        )}
      </div>
      <style>{globals}</style>
    </>
  );
}

function frontendFields(d: HomepageData): Partial<HomepageData> {
  return {
    walletButtonVisible: d.walletButtonVisible,
    showBalanceSection: d.showBalanceSection,
    balanceLabelMichy: d.balanceLabelMichy,
    balanceLabelSol: d.balanceLabelSol,
    balanceLabelXp: d.balanceLabelXp,
    statusNames: d.statusNames,
    statusLevels: d.statusLevels,
    pageAvailability: d.pageAvailability,
    homeButtons: d.homeButtons,
  };
}

function backendFields(d: HomepageData): Partial<HomepageData> {
  return {
    walletConnect: d.walletConnect,
    taskNames: d.taskNames,
    taskUrls: d.taskUrls,
    taskMxp: d.taskMxp,
    mxpRewards: d.mxpRewards,
  };
}

function Toggle({ value, onChange, labels }: { value: boolean; onChange: (v: boolean) => void; labels: [string, string] }) {
  return (
    <div style={styles.toggleRow}>
      <button style={{ ...styles.toggleBtn, ...(value ? styles.toggleActive : {}) }} onClick={() => onChange(true)}>
        {labels[0]}
      </button>
      <button style={{ ...styles.toggleBtn, ...(!value ? styles.toggleActive : {}) }} onClick={() => onChange(false)}>
        {labels[1]}
      </button>
    </div>
  );
}

function Section({ open, onToggle, title, children, level = 1 }: { open: boolean; onToggle: () => void; title: string; children: React.ReactNode; level?: number }) {
  const isLevel2 = level === 2;
  return (
    <div style={{ ...styles.section, ...(isLevel2 ? styles.sectionInner : {}) }}>
      <div style={isLevel2 ? styles.sectionHeadInner : styles.sectionHead} onClick={onToggle}>
        <h3 style={isLevel2 ? styles.sectionTitleInner : styles.sectionTitle}>{title}</h3>
        <span style={styles.arrow}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={styles.sectionBody}>{children}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: { padding: 40, textAlign: "center", fontFamily: "Comic Neue, cursive" },
  container: { width: "100%", maxWidth: 560, margin: "20px auto", padding: "28px 24px", border: "3px solid #1E1E1E", background: "#FAFAFA", borderRadius: 15, boxShadow: "4px 4px 0 #8B5A2B" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { margin: 0, fontFamily: "Anton, sans-serif", fontSize: 18, color: "#9E1B1E", letterSpacing: 2, textTransform: "uppercase", fontWeight: "normal" },
  backBtn: { background: "#FAFAFA", border: "3px solid #1E1E1E", color: "#1E1E1E", padding: "8px 16px", fontSize: 12, fontWeight: 700, fontFamily: "Comic Neue, cursive", cursor: "pointer", borderRadius: 8, boxShadow: "2px 2px 0 #8B5A2B" },
  tabBar: { display: "flex", gap: 0, marginBottom: 20, borderRadius: 10, overflow: "hidden", border: "2px solid #1E1E1E" },
  tab: { flex: 1, padding: "12px", background: "#FAFAFA", border: "none", fontFamily: "Anton, sans-serif", fontSize: 13, color: "#1E1E1E", cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontWeight: "normal" },
  tabActive: { background: "#9E1B1E", color: "#FAFAFA" },
  section: { background: "#EED5C1", border: "3px solid #1E1E1E", borderRadius: 12, marginBottom: 14, boxShadow: "3px 3px 0 #8B5A2B", overflow: "hidden" },
  sectionInner: { background: "#F6E6DA", border: "2px solid #1E1E1E", borderRadius: 8, marginBottom: 8, marginTop: 8, boxShadow: "2px 2px 0 #8B5A2B" },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", cursor: "pointer" },
  sectionHeadInner: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer" },
  sectionTitle: { margin: 0, fontFamily: "Anton, sans-serif", fontSize: 13, color: "#9E1B1E", textTransform: "uppercase", letterSpacing: 1, fontWeight: "normal" },
  sectionTitleInner: { margin: 0, fontFamily: "Anton, sans-serif", fontSize: 11, color: "#1E1E1E", textTransform: "uppercase", letterSpacing: 1, fontWeight: "normal" },
  arrow: { fontSize: 14 },
  sectionBody: { padding: "0 16px 16px" },
  formGroup: { marginBottom: 14, textAlign: "left" },
  label: { display: "block", fontSize: 11, color: "#1E1E1E", opacity: 0.6, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 },
  input: { width: "100%", background: "#FAFAFA", border: "3px solid #1E1E1E", padding: "10px 12px", color: "#1E1E1E", fontFamily: "Comic Neue, cursive", fontWeight: 700, fontSize: 13, borderRadius: 8, boxShadow: "inset 2px 2px 0 #1E1E1E", boxSizing: "border-box" } as React.CSSProperties,
  toggleRow: { display: "flex", gap: 10 },
  toggleBtn: { flex: 1, padding: 10, background: "#FAFAFA", border: "3px solid #1E1E1E", color: "#1E1E1E", fontWeight: 700, cursor: "pointer", fontFamily: "Comic Neue, cursive", fontSize: 11, borderRadius: 8, boxShadow: "2px 2px 0 #8B5A2B" },
  toggleActive: { background: "#9E1B1E", color: "#FAFAFA", borderColor: "#9E1B1E", boxShadow: "2px 2px 0 #5a0f10" },
  actionBar: { marginTop: 6 },
  saveBtn: { width: "100%", padding: 14, background: "#9E1B1E", color: "#FAFAFA", border: "3px solid #1E1E1E", fontWeight: 700, cursor: "pointer", fontFamily: "Comic Neue, cursive", fontSize: 14, borderRadius: 10, boxShadow: "4px 4px 0 #8B5A2B", textTransform: "uppercase", letterSpacing: 0.5 },
  errorMsg: { color: "#C62828", fontSize: 13, fontWeight: 700, textAlign: "center", marginTop: 10 },
  successMsg: { color: "#2e7d32", fontSize: 13, fontWeight: 700, textAlign: "center", marginTop: 10 },
  hint: { fontSize: 11, color: "#705B4E", margin: "8px 0 0", textAlign: "center" },
};

const globals = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Comic+Neue:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #EED5C1; color: #1E1E1E; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; font-family: 'Comic Neue', cursive; overflow-y: auto; padding: 20px; }
  input:focus, select:focus { outline: none; border-color: #F28C28 !important; }
  button:hover { opacity: 0.9; }
`;
