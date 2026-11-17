"use client";

export default function AskButton({ question, children, className = "btn" }: { question?: string; children: React.ReactNode; className?: string }) {
  return (
    <button className={className} onClick={() => window.dispatchEvent(new CustomEvent("open-chat", { detail: question }))}>
      {children}
    </button>
  );
}
