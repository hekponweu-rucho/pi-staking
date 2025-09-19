import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
  inline?: boolean;
}

export function ErrorState({ title = 'Une erreur est survenue', message, onRetry, retryLabel = 'Réessayer', inline = false }: ErrorStateProps) {
  const Content = (
    <div className="text-center p-6">
      <div className="flex items-center justify-center gap-2 text-destructive mb-2">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">{title}</span>
      </div>
      {message ? <p className="text-muted-foreground mb-4">{message}</p> : null}
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} aria-label={retryLabel}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );

  if (inline) return Content;

  return (
    <Card>
      <CardContent>{Content}</CardContent>
    </Card>
  );
}
