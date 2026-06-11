"use client";

import { useState } from "react";
import { formApi } from "@/lib/api";
import { SITE } from "@/lib/site-config";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [hp, setHp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setError("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await formApi.contact({ name, email, subject, message, _hp: hp });
      setSubmitted(true);
    } catch {
      setError("Failed to send. Please try again.");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <>
        <div style={styles.wrap}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={styles.title}>MESSAGE SENT</h2>
            <p style={{ color: "#705B4E", fontSize: 14, marginBottom: 24 }}>We will get back to you soon.</p>
            <a href="/" style={styles.btn}>BACK TO HOME</a>
          </div>
        </div>
        <style>{globals}</style>
      </>
    );
  }

  return (
    <>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <h2 style={styles.title}>CONTACT US</h2>
          <a href="/" style={styles.back}>← Home</a>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>Name *</label>
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={100} />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Email *</label>
            <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" maxLength={200} />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Subject</label>
            <input style={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What is this about?" maxLength={200} />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Message *</label>
            <textarea style={{ ...styles.input, minHeight: 120, resize: "vertical" }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your message..." maxLength={2000} />
          </div>
          {error && <p style={styles.err}>{error}</p>}
          <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
            <label>Leave this empty</label>
            <input type="text" name="_hp" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" />
          </div>
          <button type="submit" style={{ ...styles.btn, ...styles.submitBtn }} disabled={submitting}>
            {submitting ? "SENDING..." : "SEND"}
          </button>
        </form>
      </div>
      <style>{globals}</style>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { width: "100%", maxWidth: 460, margin: "20px auto", padding: "24px 20px", border: "3px solid #1E1E1E", background: "#FAFAFA", borderRadius: 15, boxShadow: "4px 4px 0 #8B5A2B" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { margin: 0, fontFamily: "Anton, sans-serif", fontSize: 18, color: "#9E1B1E", letterSpacing: 2, textTransform: "uppercase", fontWeight: "normal" },
  back: { color: "#1E1E1E", textDecoration: "none", fontSize: 13, fontWeight: 700, fontFamily: "Comic Neue, cursive", opacity: 0.7 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  group: { textAlign: "left" },
  label: { display: "block", fontSize: 11, color: "#1E1E1E", opacity: 0.6, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 },
  input: { width: "100%", padding: "10px 12px", background: "#FAFAFA", border: "3px solid #1E1E1E", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "Comic Neue, cursive", color: "#1E1E1E", boxShadow: "inset 2px 2px 0 #1E1E1E", boxSizing: "border-box" } as React.CSSProperties,
  err: { color: "#C62828", fontSize: 13, fontWeight: 700 },
  btn: { display: "inline-block", padding: "12px 24px", background: "#9E1B1E", color: "#FAFAFA", border: "3px solid #1E1E1E", borderRadius: 10, fontWeight: 700, fontFamily: "Comic Neue, cursive", fontSize: 14, textDecoration: "none", textTransform: "uppercase", letterSpacing: 0.5, boxShadow: "4px 4px 0 #8B5A2B", cursor: "pointer" },
  submitBtn: { width: "100%" },
};

const globals = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Comic+Neue:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #EED5C1; color: #1E1E1E; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; font-family: 'Comic Neue', cursive; overflow-y: auto; padding: 20px; }
  input:focus, textarea:focus { outline: none; border-color: #F28C28 !important; }
`;
