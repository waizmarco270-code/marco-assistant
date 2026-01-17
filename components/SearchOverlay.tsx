import React, { useEffect, useRef } from 'react';

export const SearchOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&";
    const drops: number[] = [];
    const fontSize = 14;
    const columns = canvas.width / fontSize;

    for (let i = 0; i < columns; i++) drops[i] = 1;

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0ff"; // Cyan
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-500">
      <canvas ref={canvasRef} className="absolute inset-0 opacity-30" />
      <div className="z-10 flex flex-col items-center animate-pulse">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_#0ff]"></div>
        <h2 className="text-2xl font-display text-cyan-500 tracking-widest text-shadow">SEARCHING NEURAL NET</h2>
        <p className="text-xs font-mono text-cyan-300 mt-2 tracking-widest">ACCESSING GLOBAL DATA...</p>
      </div>
    </div>
  );
};