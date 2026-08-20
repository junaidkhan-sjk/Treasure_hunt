import { useEffect, useState } from "react";

export function TechBackground() {
  return (
    <div className="tech-bg" aria-hidden="true" style={{ background: 'var(--color-bg-neo)', opacity: 1 }}>
      {/* Remove the tech grid and binary rain for a cleaner neomorphic look */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute h-96 w-96 rounded-full bg-white/40 blur-3xl"
          style={{ top: '-10%', left: '-10%' }}
        />
        <div
          className="absolute h-96 w-96 rounded-full bg-slate-400/10 blur-3xl"
          style={{ bottom: '-10%', right: '-10%' }}
        />
      </div>
    </div>
  );
}
