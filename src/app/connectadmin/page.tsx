"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { SITE } from "@/lib/site-config";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

export default function AdminPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading, login, logout, token } = useAdminAuth();
  const apiClient = token ? adminApi(token) : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isClient, setIsClient] = useState(false);

  const [stats, setStats] = useState({ totalUsers: 0, verifiedUsers: 0, totalLogins: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (isLoggedIn && isClient && apiClient && !statsLoaded) {
      loadStats();
    }
  }, [isLoggedIn, isClient, token, statsLoaded]);

  const loadStats = async () => {
    if (!apiClient) return;
    try {
      const data = await apiClient.getStats();
      if (data) setStats(data);
    } catch (e) { console.error("Stats error:", e); }
    setStatsLoaded(true);
  };

  const handleLogin = async () => {
    const result = await login(email, password);
    if (!result.ok) {
      setLoginError(result.error || "Invalid credentials");
    } else {
      setLoginError("");
      setStatsLoaded(false);
    }
  };

  const handleLogout = () => {
    logout();
    setEmail("");
    setPassword("");
    setStatsLoaded(false);
  };

  const navTo = (path: string) => router.push(`/connectadmin/${path}`);

  if (!isClient || isLoading) return null;

  if (!isLoggedIn) {
    return (
      <>
        <div style={styles.container}>
          <h2 style={styles.title}>{SITE.projectName.toUpperCase()} ADMIN</h2>
          <div style={styles.section}>
            <div style={styles.formGroup}>
              <label style={styles.label}>EMAIL</label>
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>PASSWORD</label>
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            {loginError && <p style={styles.error}>{loginError}</p>}
            <button style={styles.btn} onClick={handleLogin}>LOGIN</button>
          </div>
        </div>
        <style>{globals}</style>
      </>
    );
  }

  return (
    <>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>{SITE.projectName.toUpperCase()} ADMIN</h2>
          <button style={styles.logoutBtn} onClick={handleLogout}>LOGOUT</button>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.totalUsers}</div>
            <div style={styles.statLabel}>TOTAL USERS</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.verifiedUsers}</div>
            <div style={styles.statLabel}>VERIFIED</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.totalLogins}</div>
            <div style={styles.statLabel}>LOGINS</div>
          </div>
        </div>

        <div style={styles.navGrid}>
          <button style={styles.navBtn} onClick={() => navTo("home")}>
            HOMEPAGE SETTINGS
          </button>
          <button style={styles.navBtn} onClick={() => navTo("campaign")}>
            CAMPAIGN EDITOR
          </button>
          <button style={styles.navBtn} onClick={() => navTo("holders")}>
            USER HOLDERS
          </button>
          <button style={styles.navBtn} onClick={() => navTo("verify")}>
            VERIFY USERS
          </button>
          <button style={styles.navBtn} onClick={() => navTo("images")}>
            IMAGE MANAGER
          </button>
          <button style={styles.navBtn} onClick={() => navTo("contacts")}>
            CONTACT MESSAGES
          </button>
        </div>
      </div>
      <style>{globals}</style>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { width: "100%", maxWidth: 460, margin: "20px auto", padding: "28px 24px", border: "3px solid #1E1E1E", background: "#FAFAFA", borderRadius: 15, boxShadow: "4px 4px 0 #8B5A2B" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { margin: 0, fontFamily: "Anton, sans-serif", fontSize: 18, color: "#9E1B1E", letterSpacing: 2, textTransform: "uppercase", fontWeight: "normal", textAlign: "center" as const },
  logoutBtn: { background: "#FAFAFA", border: "3px solid #1E1E1E", color: "#1E1E1E", padding: "8px 16px", fontSize: 12, fontWeight: 700, fontFamily: "Comic Neue, cursive", cursor: "pointer", borderRadius: 8, boxShadow: "2px 2px 0 #8B5A2B" },
  section: { background: "#EED5C1", border: "3px solid #1E1E1E", borderRadius: 12, padding: 20, marginBottom: 14, boxShadow: "3px 3px 0 #8B5A2B" },
  formGroup: { marginBottom: 14, textAlign: "left" },
  label: { display: "block", fontSize: 11, color: "#1E1E1E", opacity: 0.6, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 },
  input: { width: "100%", background: "#FAFAFA", border: "3px solid #1E1E1E", padding: "12px", color: "#1E1E1E", fontFamily: "Comic Neue, cursive", fontWeight: 700, fontSize: 14, borderRadius: 8, boxShadow: "inset 2px 2px 0 #1E1E1E", boxSizing: "border-box" } as React.CSSProperties,
  btn: { width: "100%", padding: 14, background: "#9E1B1E", color: "#FAFAFA", border: "3px solid #1E1E1E", fontWeight: 700, cursor: "pointer", fontFamily: "Comic Neue, cursive", fontSize: 14, borderRadius: 10, boxShadow: "4px 4px 0 #8B5A2B", textTransform: "uppercase", letterSpacing: 0.5 },
  error: { color: "#C62828", fontSize: 13, fontWeight: 700, textAlign: "center", marginBottom: 12 },
  statsRow: { display: "flex", gap: 12, marginBottom: 24 },
  statCard: { flex: 1, background: "#EED5C1", border: "3px solid #1E1E1E", borderRadius: 12, padding: "16px 12px", textAlign: "center", boxShadow: "2px 2px 0 #8B5A2B" },
  statValue: { fontFamily: "Anton, sans-serif", fontSize: 28, color: "#9E1B1E", lineHeight: 1 },
  statLabel: { fontSize: 10, color: "#1E1E1E", opacity: 0.6, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginTop: 4 },
  navGrid: { display: "flex", flexDirection: "column", gap: 10 },
  navBtn: { width: "100%", padding: 14, background: "#EED5C1", border: "3px solid #1E1E1E", color: "#1E1E1E", fontWeight: 700, cursor: "pointer", fontFamily: "Comic Neue, cursive", fontSize: 13, borderRadius: 10, boxShadow: "3px 3px 0 #8B5A2B", textTransform: "uppercase", letterSpacing: 0.5 },
};

const globals = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Comic+Neue:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #EED5C1; color: #1E1E1E; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; font-family: 'Comic Neue', cursive; overflow-y: auto; padding: 20px; }
  input:focus { outline: none; border-color: #F28C28 !important; }
  button:hover { opacity: 0.9; }
`;
