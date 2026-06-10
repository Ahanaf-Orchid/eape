"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface ContactMsg {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: number;
  closedAt?: number;
}

export default function ContactsPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading, token } = useAdminAuth();
  const apiClient = token ? adminApi(token) : null;
  const [isClient, setIsClient] = useState(false);
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => {
    if (isLoggedIn && isClient && apiClient) loadMessages();
  }, [isLoggedIn, isClient, token, filter]);

  const loadMessages = async () => {
    if (!apiClient) return;
    try {
      const res = await apiClient.getContacts(filter);
      if (res?.messages) setMessages(res.messages);
      setLoaded(true);
    } catch (e) {
      if (!String(e).includes("expired")) setLoaded(true);
    }
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const closeMsg = async (id: string) => {
    if (!apiClient) return;
    await apiClient.updateContact(id, "close");
    loadMessages();
  };

  const deleteMsg = async (id: string) => {
    if (!apiClient) return;
    if (!confirm("Delete this message?")) return;
    await apiClient.updateContact(id, "delete");
    loadMessages();
  };

  const mailReply = (email: string, subject: string) => {
    window.open(`mailto:${email}?subject=${encodeURIComponent("Re: " + subject)}`);
  };

  if (!isClient || isLoading || !loaded) return null;
  if (!isLoggedIn) { router.push("/connectadmin"); return null; }

  const openCount = messages.filter((m) => m.status === "open").length;

  return (
    <>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <h2 style={styles.title}>CONTACT MESSAGES {openCount > 0 && <span style={styles.badge}>{openCount}</span>}</h2>
          <button style={styles.back} onClick={() => router.push("/connectadmin")}>BACK</button>
        </div>

        <div style={styles.filterBar}>
          {(["all", "open", "closed"] as const).map((f) => (
            <button
              key={f}
              style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {messages.length === 0 && (
          <p style={{ color: "#999", textAlign: "center", padding: 20 }}>No messages</p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={styles.card}>
            <div style={styles.cardHead} onClick={() => toggle(msg.id)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{msg.name} <span style={{ color: "#999", fontWeight: 400, fontSize: 12 }}>{msg.email}</span></div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{msg.subject || "(no subject)"}</div>
              </div>
              <span style={{ ...styles.status, background: msg.status === "open" ? "#EED5C1" : "#ddd", color: msg.status === "open" ? "#9E1B1E" : "#888" }}>
                {msg.status.toUpperCase()}
              </span>
              <span style={{ marginLeft: 8, fontSize: 12 }}>{expanded[msg.id] ? "▲" : "▼"}</span>
            </div>

            {expanded[msg.id] && (
              <div style={styles.cardBody}>
                <div style={styles.msgText}>{msg.message}</div>
                <div style={{ fontSize: 10, color: "#999", marginTop: 8 }}>
                  {new Date(msg.createdAt).toLocaleString()}
                  {msg.closedAt && ` · Closed ${new Date(msg.closedAt).toLocaleString()}`}
                </div>
                <div style={styles.actions}>
                  <button style={styles.actionBtn} onClick={() => mailReply(msg.email, msg.subject)}>📧 Reply</button>
                  {msg.status === "open" && (
                    <button style={{ ...styles.actionBtn, background: "#F8EEE7" }} onClick={() => closeMsg(msg.id)}>✓ Close</button>
                  )}
                  <button style={{ ...styles.actionBtn, background: "#f8d7da", color: "#C62828" }} onClick={() => deleteMsg(msg.id)}>🗑 Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{globals}</style>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { width: "100%", maxWidth: 520, margin: "20px auto", padding: "20px 18px", border: "3px solid #1E1E1E", background: "#FAFAFA", borderRadius: 15, boxShadow: "4px 4px 0 #8B5A2B" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { margin: 0, fontFamily: "Anton, sans-serif", fontSize: 16, color: "#9E1B1E", letterSpacing: 2, textTransform: "uppercase", fontWeight: "normal", display: "flex", alignItems: "center", gap: 8 },
  badge: { background: "#C62828", color: "#FFF", fontSize: 11, padding: "2px 8px", borderRadius: 10, fontFamily: "Comic Neue, cursive" },
  back: { background: "#FAFAFA", border: "3px solid #1E1E1E", color: "#1E1E1E", padding: "6px 14px", fontSize: 11, fontWeight: 700, fontFamily: "Comic Neue, cursive", cursor: "pointer", borderRadius: 8, boxShadow: "2px 2px 0 #8B5A2B" },
  filterBar: { display: "flex", gap: 8, marginBottom: 14 },
  filterBtn: { flex: 1, padding: "6px", background: "#FAFAFA", border: "2px solid #1E1E1E", color: "#1E1E1E", fontSize: 11, fontWeight: 700, fontFamily: "Comic Neue, cursive", cursor: "pointer", borderRadius: 6 },
  filterActive: { background: "#9E1B1E", color: "#FAFAFA" },
  card: { background: "#EED5C1", border: "3px solid #1E1E1E", borderRadius: 12, marginBottom: 10, boxShadow: "2px 2px 0 #8B5A2B", overflow: "hidden" },
  cardHead: { display: "flex", alignItems: "center", padding: "10px 14px", cursor: "pointer", gap: 10 },
  status: { padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", flexShrink: 0 },
  cardBody: { padding: "0 14px 14px", borderTop: "1px solid rgba(30,30,30,0.1)", marginTop: 0, paddingTop: 10 },
  msgText: { fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  actions: { display: "flex", gap: 6, marginTop: 10 },
  actionBtn: { padding: "6px 12px", background: "#FAFAFA", border: "2px solid #1E1E1E", borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: "Comic Neue, cursive", cursor: "pointer" },
};

const globals = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Comic+Neue:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #EED5C1; color: #1E1E1E; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; font-family: 'Comic Neue', cursive; overflow-y: auto; padding: 20px; }
  input:focus, textarea:focus { outline: none; border-color: #F28C28 !important; }
`;
