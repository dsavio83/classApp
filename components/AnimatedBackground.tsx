import React, { useEffect, useState } from 'react';

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  symbol: string;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

export const AnimatedBackground: React.FC = () => {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  // Educational symbols and formulas
  const educationalSymbols = [
    // Mathematics
    '∑', '∫', 'π', '√', '∞', 'α', 'β', 'γ', 'θ', 'λ', 'μ', 'σ', 'ω', 'Δ', '∂', '∇',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '-', '×', '÷', '=', '%',
    'E=mc²', 'a²+b²=c²', 'f(x)', 'lim', 'log', 'sin', 'cos', 'tan',
    
    // Physics & Chemistry
    'H₂O', 'CO₂', 'NaCl', 'H₂SO₄', 'O₂', 'N₂', 'He', 'Ne', 'Ar',
    '⚛', '⚡', '🔬', '🧪', '⚗️', '🌡️', '📐', '⚖️',
    
    // Social Science & Geography
    '🗺️', '🌍', '🌎', '🏔️', '🏛️', '⚖️', '📚', '📜',
    
    // Space & Astronomy
    '⭐', '🌟', '✨', '🌙', '🪐', '🚀', '🛰️', '🌌', '☄️',
    
    // General Learning
    '📖', '✏️', '🧠', '💡', '🎯', '🏆', '📊', '📈'
  ];

  useEffect(() => {
    const createFloatingElement = (id: number): FloatingElement => ({
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      symbol: educationalSymbols[Math.floor(Math.random() * educationalSymbols.length)],
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 12, // 8-20 seconds
      size: 12 + Math.random() * 20, // 12-32px
      opacity: 0.1 + Math.random() * 0.3 // 0.1-0.4
    });

    // Create initial elements
    const initialElements = Array.from({ length: 25 }, (_, i) => createFloatingElement(i));
    setElements(initialElements);

    // Periodically create new elements
    const interval = setInterval(() => {
      setElements(prev => {
        const newElements = [...prev];
        if (newElements.length < 30) {
          newElements.push(createFloatingElement(Date.now()));
        }
        // Remove oldest elements to maintain performance
        if (newElements.length > 30) {
          newElements.shift();
        }
        return newElements;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900"></div>
      
      {/* Animated Shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-300 dark:bg-indigo-700 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Floating Educational Elements */}
      {elements.map((element) => (
        <div
          key={element.id}
          className="absolute text-blue-600 dark:text-blue-300 font-mono select-none animate-float"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            fontSize: `${element.size}px`,
            opacity: element.opacity,
            animationDelay: `${element.delay}s`,
            animationDuration: `${element.duration}s`,
          }}
        >
          {element.symbol}
        </div>
      ))}

      {/* Additional animated patterns */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" className="animate-pulse" />
        </svg>
      </div>
    </div>
  );
};