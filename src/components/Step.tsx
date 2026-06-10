"use client";

interface StepProps {
  step: number;
  title: string;
  active: boolean;
  children: React.ReactNode;
}

export default function Step({ step, title, active, children }: StepProps) {
  return (
    <div className={`step ${active ? "active" : ""}`} id={`s${step}`}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
