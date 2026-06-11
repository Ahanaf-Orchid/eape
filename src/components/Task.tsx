"use client";

import { SITE } from "@/lib/site-config";
import { useState } from "react";

interface TaskProps {
  id: string;
  label: string;
  url: string;
  completed: boolean;
  mxp?: number;
  logoSrc?: string;
  onComplete: () => void;
}

export default function Task({ id, label, url, completed, mxp, logoSrc, onComplete }: TaskProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (completed) { window.open(url, "_blank"); return; }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onComplete();
      window.open(url, "_blank");
    }, 1200);
  };

  return (
    <div 
      className={`task ${completed ? "done" : ""}`}
      onClick={handleClick}
      id={id}
    >
      <span>{label}</span>
      <div className="task-right">
        {mxp && mxp > 0 && (
          <div className={`task-mxp-badge ${completed ? "completed" : ""}`}>
            <img src={logoSrc || SITE.images.logo} alt={SITE.xpLabel} className="task-mxp-logo" />
            <span>+{mxp} MXP</span>
            <span className={`task-checkbox ${completed ? "checked" : ""}`}>
              <span className="task-checkbox-inner">✓</span>
            </span>
          </div>
        )}
        {!mxp && completed && (
          <span className="task-checkbox-only checked">
            <span className="task-checkbox-inner">✓</span>
          </span>
        )}
        {loading && <div className="loader"></div>}
      </div>
    </div>
  );
}
