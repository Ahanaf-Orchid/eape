"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { SITE } from "@/lib/site-config";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const UPLOAD_ENDPOINT = "/api/admin/upload";

interface ImagesData {
  brandImages: string[];
  homeImages: string[];
  homeDurations: number[];
  balanceIcons: string[];
  checknftsLeft: string[];
  checknftsRight: string[];
  calendarIcon: string;
  durationIcon: string;
  faviconSrc: string;
  socialX: string;
  socialDiscord: string;
  socialTelegram: string;
  socialSolscan: string;
  updatedAt: number;
}

const DEFAULTS: ImagesData = {
  brandImages: ["/logo.PNG", "/shared/mint-logo.svg"],
  homeImages: ["/home/1.png"],
  homeDurations: [5],
  balanceIcons: ["/shared/icon-top-1.svg", "/shared/icon-top-2.svg", "/shared/icon-top-3.svg"],
  checknftsLeft: ["/shared/thumb-1.svg", "/shared/thumb-2.svg", "/shared/thumb-3.svg", "/shared/thumb-4.svg"],
  checknftsRight: ["/shared/thumb-5.svg", "/shared/thumb-1.svg"],
  calendarIcon: "/shared/thumb-1.svg",
  durationIcon: "/shared/thumb-1.svg",
  faviconSrc: "/shared/favicon.svg",
  socialX: "/shared/social-x.svg",
  socialDiscord: "/shared/social-discord.svg",
  socialTelegram: "/shared/social-telegram.svg",
  socialSolscan: "/shared/social-solscan.svg",
  updatedAt: 0,
};

export default function ImagesPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading, token } = useAdminAuth();
  const apiClient = token ? adminApi(token) : null;
  const [isClient, setIsClient] = useState(false);
  const [data, setData] = useState<ImagesData>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => {
    if (isLoggedIn && isClient && apiClient) loadConfig();
  }, [isLoggedIn, isClient, token]);

  const loadConfig = async () => {
    if (!apiClient) return;
    try {
      const res = await apiClient.getConfig("images");
      if (res?.value) {
        const v = res.value as ImagesData;
        if (v.checknftsLeft) {
          while (v.checknftsLeft.length < 4) v.checknftsLeft.push(DEFAULTS.checknftsLeft[v.checknftsLeft.length] || "");
        }
        if (v.checknftsRight) {
          while (v.checknftsRight.length < 2) v.checknftsRight.push(DEFAULTS.checknftsRight[v.checknftsRight.length] || "");
        }
        setData((prev) => ({ ...prev, ...v }));
      }
      setLoaded(true);
    } catch (e) {
      if (!String(e).includes("expired")) setLoaded(true);
    }
  };

  const save = async () => {
    if (!apiClient) return;
    setSaving(true);
    setMsg("");
    try {
      await apiClient.updateConfig("images", { ...data, updatedAt: Date.now() }, false);
      setMsg("Saved!");
      setTimeout(() => setMsg(""), 3000);
    } catch { setMsg("Save failed!"); }
    setSaving(false);
  };

  const editArr = (key: keyof ImagesData, index: number, val: string) => {
    const arr = [...(data[key] as string[])];
    arr[index] = val;
    setData((prev) => ({ ...prev, [key]: arr }));
  };

  const editDurations = (index: number, val: number) => {
    const arr = [...data.homeDurations];
    arr[index] = val;
    setData((prev) => ({ ...prev, homeDurations: arr }));
  };

  const addToArr = (key: keyof ImagesData) => {
    const arr = [...(data[key] as string[])];
    arr.push("");
    setData((prev) => ({ ...prev, [key]: arr }));
    if (key === "homeImages") {
      const dur = [...data.homeDurations];
      dur.push(5);
      setData((prev) => ({ ...prev, homeDurations: dur }));
    }
  };

  const removeFromArr = (key: keyof ImagesData, index: number) => {
    const arr = [...(data[key] as string[])];
    arr.splice(index, 1);
    setData((prev) => ({ ...prev, [key]: arr }));
    if (key === "homeImages") {
      const dur = [...data.homeDurations];
      dur.splice(index, 1);
      setData((prev) => ({ ...prev, homeDurations: dur }));
    }
  };

  const editSingle = (key: keyof ImagesData, val: string) => {
    setData((prev) => ({ ...prev, [key]: val }));
  };

  if (!isClient || isLoading || !loaded) return null;
  if (!isLoggedIn) { router.push("/connectadmin"); return null; }

  return (
    <>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <h2 style={styles.title}>IMAGE MANAGER</h2>
          <button style={styles.back} onClick={() => router.push("/connectadmin")}>BACK</button>
        </div>

        {/* ====== BRAND ====== */}
        <SectionLabel label="BRAND" />
        <GridRow>
          <UploadCell key="b0" src={data.brandImages[0]} label="Logo" onUpload={(p) => editArr("brandImages", 0, p)} />
          <UploadCell key="b1" src={data.brandImages[1]} label="Mint Logo" onUpload={(p) => editArr("brandImages", 1, p)} />
          <UploadCell key="bf" src={data.faviconSrc} label="Favicon" onUpload={(p) => editSingle("faviconSrc", p)} />
        </GridRow>

        {/* ====== HOME ====== */}
        <SectionLabel label="HOME" onAdd={() => addToArr("homeImages")} />
        <GridRow>
          {data.homeImages.map((img, i) => (
            <UploadCell
              key={`h${i}`}
              src={img}
              label={`Banner ${i + 1}`}
              onUpload={(p) => editArr("homeImages", i, p)}
              onRemove={() => removeFromArr("homeImages", i)}
              canRemove={data.homeImages.length > 1}
              extra={<DurationInput value={data.homeDurations[i] ?? 5} onChange={(v) => editDurations(i, v)} />}
            />
          ))}
        </GridRow>

        {/* ====== BALANCE ICONS ====== */}
        <SectionLabel label="BALANCE ICONS" />
        <GridRow>
          <UploadCell key="ba0" src={data.balanceIcons[0]} label="SOL Icon" onUpload={(p) => editArr("balanceIcons", 0, p)} />
          <UploadCell key="ba1" src={data.balanceIcons[1]} label={`${SITE.shortName} Icon`} onUpload={(p) => editArr("balanceIcons", 1, p)} />
          <UploadCell key="ba2" src={data.balanceIcons[2]} label="XP Icon" onUpload={(p) => editArr("balanceIcons", 2, p)} />
        </GridRow>

        {/* ====== CHECK NFTS — LEFT ====== */}
        <SectionLabel label="CHECK NFTS — LEFT (Phase 1-4)" />
        <GridRow>
          {data.checknftsLeft.map((img, i) => (
            <UploadCell key={`cl${i}`} src={img} label={`Phase ${i + 1}`} onUpload={(p) => editArr("checknftsLeft", i, p)} />
          ))}
        </GridRow>

        {/* ====== CHECK NFTS — RIGHT ====== */}
        <SectionLabel label="CHECK NFTS — RIGHT (Phase 5 + Price)" />
        <GridRow>
          <UploadCell src={data.checknftsRight[0]} label="Phase 5" onUpload={(p) => editArr("checknftsRight", 0, p)} />
          <UploadCell src={data.checknftsRight[1]} label="Price Icon" onUpload={(p) => editArr("checknftsRight", 1, p)} />
        </GridRow>

        {/* ====== CALENDAR + DURATION ====== */}
        <SectionLabel label="START DATE & DURATION ICONS" />
        <GridRow>
          <UploadCell src={data.calendarIcon} label="Start Date" onUpload={(p) => editSingle("calendarIcon", p)} round />
          <UploadCell src={data.durationIcon} label="Duration" onUpload={(p) => editSingle("durationIcon", p)} round />
        </GridRow>

        <button style={styles.save} onClick={save} disabled={saving}>
          {saving ? "SAVING..." : "SAVE ALL IMAGES"}
        </button>
        {msg && <p style={msg.includes("fail") ? styles.err : styles.ok}>{msg}</p>}
      </div>
      <style>{globals}</style>
    </>
  );
}

/* ---- Sub-components ---- */

function SectionLabel({ label, onAdd }: { label: string; onAdd?: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2, marginTop: 12 }}>
      <h3 style={styles.sLabel}>{label}</h3>
      {onAdd && <button style={styles.addBtn} onClick={onAdd}>+ ADD</button>}
    </div>
  );
}

function GridRow({ children }: { children: React.ReactNode }) {
  return <div className="grid-scroll" style={styles.gridRow}>{children}</div>;
}

function DurationInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
      <label style={{ fontSize: 9, color: "#1E1E1E", opacity: 0.45, textTransform: "uppercase" }}>Sec</label>
      <input
        type="number" min={1} max={60} value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 5)}
        style={styles.durInput}
      />
    </div>
  );
}

function UploadCell({ src, label, onUpload, onRemove, canRemove, round, extra }: {
  src: string; label: string; onUpload: (path: string) => void;
  onRemove?: () => void; canRemove?: boolean; round?: boolean; extra?: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [up, setUp] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUp(true);
    try {
      const session = JSON.parse(localStorage.getItem("eape_admin_session") || "{}");
      const token = session.token || "";
      const fd = new FormData();
      fd.append("file", file);
      fd.append("section", label.toLowerCase().replace(/\s+/g, "-"));
      const res = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      onUpload(json.path);
    } catch {}
    setUp(false);
  };

  const copyUrl = () => {
    if (!src) return;
    navigator.clipboard.writeText(src);
  };

  return (
    <div style={{ ...styles.cell, ...(round ? styles.cellRound : {}), position: "relative" }}>
      {/* clickable preview */}
      <div
        onClick={() => ref.current?.click()}
        style={{
          width: "100%", paddingBottom: round ? "100%" : "66%", background: "#FAFAFA",
          borderRadius: round ? "50%" : 8, overflow: "hidden", border: "2px solid #1E1E1E", cursor: "pointer",
          position: "relative",
        }}
      >
        {src ? (
          <img src={src} alt={label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><rect fill='%23eee' width='100' height='66'/></svg>"; }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 24 }}>＋</div>
        )}
        {up && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11 }}>Uploading...</div>}
      </div>

      {/* label */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#1E1E1E", opacity: 0.45, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center", marginTop: 5 }}>
        {label}
      </div>

      {/* editable URL */}
      <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
        <input
          value={src || ""}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          onChange={(e) => onUpload(e.target.value)}
          style={styles.urlInput}
        />
        <button onClick={copyUrl} style={styles.copyBtn}>Copy</button>
      </div>

      {extra}

      {canRemove && onRemove && (
        <button style={styles.rmBtn} onClick={onRemove}>✕</button>
      )}

      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

/* ---- Styles ---- */

const styles: Record<string, React.CSSProperties> = {
  wrap: { width: "100%", maxWidth: 460, margin: "20px auto", padding: "20px 18px", border: "3px solid #1E1E1E", background: "#FAFAFA", borderRadius: 15, boxShadow: "4px 4px 0 #8B5A2B" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  title: { margin: 0, fontFamily: "Anton, sans-serif", fontSize: 16, color: "#9E1B1E", letterSpacing: 2, textTransform: "uppercase", fontWeight: "normal" },
  back: { background: "#FAFAFA", border: "3px solid #1E1E1E", color: "#1E1E1E", padding: "6px 14px", fontSize: 11, fontWeight: 700, fontFamily: "Comic Neue, cursive", cursor: "pointer", borderRadius: 8, boxShadow: "2px 2px 0 #8B5A2B" },
  sLabel: { fontFamily: "Anton, sans-serif", fontSize: 10, color: "#1E1E1E", opacity: 0.4, textTransform: "uppercase", letterSpacing: 1.5, margin: 0 },
  addBtn: { background: "#EED5C1", border: "2px solid #1E1E1E", color: "#1E1E1E", padding: "2px 10px", fontSize: 10, fontWeight: 700, fontFamily: "Comic Neue, cursive", cursor: "pointer", borderRadius: 5, boxShadow: "1px 1px 0 #8B5A2B" },
  gridRow: { display: "grid", gridAutoFlow: "column", gridTemplateRows: "auto auto", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" as any, msOverflowStyle: "none" as any },
  cell: { background: "#EED5C1", border: "3px solid #1E1E1E", borderRadius: 12, padding: 8, boxShadow: "2px 2px 0 #8B5A2B", width: 205 },
  cellRound: {},
  rmBtn: { position: "absolute", top: 4, right: 4, background: "#C62828", border: "2px solid #1E1E1E", color: "#FFF", width: 20, height: 20, fontSize: 10, fontWeight: 700, cursor: "pointer", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, lineHeight: 1, zIndex: 2 },
  save: { width: "100%", padding: 12, background: "#9E1B1E", color: "#FAFAFA", border: "3px solid #1E1E1E", fontWeight: 700, cursor: "pointer", fontFamily: "Comic Neue, cursive", fontSize: 13, borderRadius: 10, boxShadow: "4px 4px 0 #8B5A2B", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 12 },
  durInput: { width: 40, padding: "2px 4px", background: "#FAFAFA", border: "2px solid #1E1E1E", borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: "Comic Neue, cursive", textAlign: "center" },
  urlInput: { flex: 1, padding: "3px 6px", background: "#FFF", border: "1px solid #ddd", borderRadius: 4, fontSize: 9, fontFamily: "monospace", color: "#333", cursor: "text", minWidth: 0 } as React.CSSProperties,
  copyBtn: { flex: "0 0 auto", background: "#EED5C1", border: "1px solid #ccc", borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontSize: 10, fontFamily: "Comic Neue, cursive" },
  err: { color: "#C62828", fontSize: 12, fontWeight: 700, textAlign: "center", marginTop: 8 },
  ok: { color: "#2e7d32", fontSize: 12, fontWeight: 700, textAlign: "center", marginTop: 8 },
};

const globals = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Comic+Neue:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #EED5C1; color: #1E1E1E; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; font-family: 'Comic Neue', cursive; overflow-y: auto; padding: 20px; }
  .grid-scroll::-webkit-scrollbar { display: none; }
`;
