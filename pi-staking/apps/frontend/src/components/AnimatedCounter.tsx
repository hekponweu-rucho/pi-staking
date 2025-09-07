import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 2000, 
  decimals = 0, 
  prefix = '', 
  suffix = '',
  className = ''
}: AnimatedCounterProps) {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const progress = (timestamp - startTime) / duration;
      
      if (progress < 1) {
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCurrent(value * easeOutQuart);
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCurrent(value);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);
  
  const formatNumber = (num: number) => {
    return decimals > 0 ? num.toFixed(decimals) : Math.floor(num).toLocaleString();
  };
  
  return (
    <span className={className}>
      {prefix}{formatNumber(current)}{suffix}
    </span>
  );
}