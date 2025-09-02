import { ReactNode, HTMLAttributes } from 'react';
import { Card } from '@/components/ui/card';

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glowColor?: 'purple' | 'gold' | 'green';
  intensity?: 'low' | 'medium' | 'high';
}

export function GlowCard({ 
  children, 
  glowColor = 'purple', 
  intensity = 'medium',
  className = '',
  ...props 
}: GlowCardProps) {
  const glowClasses = {
    purple: {
      low: 'shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.3)]',
      medium: 'shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.4)]',
      high: 'shadow-[0_0_35px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)]'
    },
    gold: {
      low: 'shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]',
      medium: 'shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.4)]',
      high: 'shadow-[0_0_35px_rgba(245,158,11,0.4)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)]'
    },
    green: {
      low: 'shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:shadow-[0_0_25px_rgba(34,197,94,0.3)]',
      medium: 'shadow-[0_0_25px_rgba(34,197,94,0.3)] hover:shadow-[0_0_35px_rgba(34,197,94,0.4)]',
      high: 'shadow-[0_0_35px_rgba(34,197,94,0.4)] hover:shadow-[0_0_50px_rgba(34,197,94,0.5)]'
    }
  };

  const glowClass = glowClasses[glowColor][intensity];

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 ${glowClass} ${className}`}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pi-shimmer" />
      {children}
    </Card>
  );
}