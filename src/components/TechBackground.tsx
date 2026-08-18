import { useEffect, useState } from "react";

export function TechBackground() {
  const [binaryData, setBinaryData] = useState<string[]>([]);

  useEffect(() => {
    // Generate initial binary strings
    const rows = 20;
    const cols = 15;
    const initialBinary = Array.from({ length: rows * cols }, () =>
      Math.random() > 0.5 ? "1" : "0"
    );
    setBinaryData(initialBinary);

    const interval = setInterval(() => {
      setBinaryData(prev => {
        if (prev.length === 0) return prev;
        return prev.map((val) =>
          Math.random() > 0.95 ? (Math.random() > 0.5 ? "1" : "0") : val
        );
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tech-bg" aria-hidden="true">
      <div className="tech-grid" />
      <div className="binary-rain grid grid-cols-15 gap-2 p-4">
        {binaryData.map((bit, i) => (
          <span key={i} className="animate-pulse" style={{ animationDelay: `${(i % 10) * 0.1}s` }}>
            {bit}
          </span>
        ))}
      </div>
      <div className="tech-orb tech-orb-a" />
      <div className="tech-orb tech-orb-b" />
      <div className="tech-orb tech-orb-c" />
      <div className="scanlines" />
      <div className="scanning-line" style={{ opacity: 0.1 }} />
    </div>
  );
}
