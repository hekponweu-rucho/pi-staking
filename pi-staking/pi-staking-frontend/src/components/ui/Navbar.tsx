import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
  right?: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function Navbar({ onMenuClick, right, title, subtitle, className }: NavbarProps) {
  return (
    <header className={cn('relative z-20 border-b border-border/50 bg-card/80 backdrop-blur-md', className)}>
      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            aria-label="Ouvrir le menu"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full pi-gradient animate-pi-pulse shrink-0">
              <span className="text-base md:text-xl font-bold text-white">Pi</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold whitespace-nowrap text-ellipsis overflow-hidden max-w-[55vw] md:max-w-none">
                {title || 'Pi Staking'}
              </h1>
              {subtitle ? (
                <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap text-ellipsis overflow-hidden max-w-[60vw] md:max-w-none">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">{right}</div>
      </div>
    </header>
  );
}
