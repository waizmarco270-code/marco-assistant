import React, { useRef, useEffect } from 'react';
import { MarcoState } from '../types';

interface AvatarCoreProps {
  state: MarcoState;
  audioLevel: number; // 0 to 1
}

const AvatarCore: React.FC<AvatarCoreProps> = ({ state, audioLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const particles: {x: number, y: number, r: number, a: number, s: number}[] = [];
    
    // Init particles
    for(let i=0; i<50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 1,
            a: Math.random() * Math.PI * 2,
            s: Math.random() * 0.02 + 0.01
        });
    }

    const render = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Base Radius varies by state and audio level
      let baseRadius = 60;
      let color = '0, 255, 255'; // Cyan default

      if (state === MarcoState.SPEAKING) {
        baseRadius = 60 + (audioLevel * 40);
        color = '0, 255, 255'; // Cyan
      } else if (state === MarcoState.THINKING) {
        baseRadius = 50 + Math.sin(time * 2) * 10;
        color = '168, 85, 247'; // Purple
      } else if (state === MarcoState.LISTENING) {
        baseRadius = 70 + (audioLevel * 20); // Reacts to user mic
        color = '255, 255, 255'; // White
      } else if (state === MarcoState.SENTRY) {
        // SENTRY MODE: Red, slow breathing
        baseRadius = 55 + Math.sin(time * 0.5) * 5;
        color = '255, 50, 50'; // Red
      } else {
        // Idle
        baseRadius = 60 + Math.sin(time) * 5;
        color = '0, 100, 100'; // Dim Cyan
      }

      // Draw Core Glow
      const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.2, centerX, centerY, baseRadius * 2);
      gradient.addColorStop(0, `rgba(${color}, 0.8)`);
      gradient.addColorStop(0.5, `rgba(${color}, 0.2)`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw Core Solid
      ctx.strokeStyle = `rgba(${color}, 0.9)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Inner Rings
      if (state === MarcoState.SENTRY) {
         // Radar sweep effect for Sentry
         ctx.strokeStyle = `rgba(${color}, 0.5)`;
         ctx.beginPath();
         // Rotate the arc based on time
         const angle = (time % (Math.PI * 2));
         ctx.arc(centerX, centerY, baseRadius * 1.2, angle, angle + 1);
         ctx.stroke();
      } else {
         ctx.strokeStyle = `rgba(${color}, 0.5)`;
         ctx.beginPath();
         ctx.arc(centerX, centerY, baseRadius * 0.7, 0 + time, Math.PI + time);
         ctx.stroke();

         ctx.beginPath();
         ctx.arc(centerX, centerY, baseRadius * 0.4, Math.PI - time, 2 * Math.PI - time);
         ctx.stroke();
      }

      // Orbital Particles
      particles.forEach(p => {
          p.a += p.s * (state === MarcoState.THINKING ? 4 : 1);
          const orbitR = baseRadius + 40 + Math.sin(p.a * 3) * 10;
          const px = centerX + Math.cos(p.a) * orbitR;
          const py = centerY + Math.sin(p.a) * orbitR;
          
          ctx.fillStyle = `rgba(${color}, 0.6)`;
          ctx.beginPath();
          ctx.arc(px, py, p.r, 0, Math.PI * 2);
          ctx.fill();
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [state, audioLevel]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={400} 
      className="w-full max-w-[300px] h-auto z-10"
    />
  );
};

export default AvatarCore;