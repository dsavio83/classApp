import React, { useEffect, useRef } from 'react';

// A simple, reusable fireworks component for celebrations.
export const Fireworks: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        const fireworks: HTMLDivElement[] = [];

        for (let i = 0; i < 30; i++) {
            const firework = document.createElement('div');
            firework.style.position = 'absolute';
            firework.style.width = '5px';
            firework.style.height = '5px';
            firework.style.borderRadius = '50%';
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            firework.style.left = `${40 + Math.random() * 20}%`;
            firework.style.top = `${40 + Math.random() * 20}%`;
            container.appendChild(firework);
            fireworks.push(firework);

            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 150;
            const duration = 1 + Math.random() * 1;

            firework.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`, opacity: 0 }
            ], {
                duration: duration * 1000,
                easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
                delay: Math.random() * 500
            });
        }
        
        const timeoutId = setTimeout(() => {
            fireworks.forEach(fw => fw.remove());
        }, 2500);

        return () => {
            clearTimeout(timeoutId);
            fireworks.forEach(fw => {
                if(fw.parentElement) {
                    fw.remove()
                }
            });
        }
    }, []);

    return <div ref={containerRef} className="absolute inset-0 pointer-events-none" />;
};
