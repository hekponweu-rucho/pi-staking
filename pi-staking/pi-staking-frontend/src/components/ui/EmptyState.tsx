import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  inline?: boolean;
}

export function EmptyState({ icon, title = 'Aucune donnée', message, actionLabel, onAction, inline = false }: EmptyStateProps) {
  const Content = (
    <div className="text-center py-10">
      {icon ? <div className="mb-4 flex items-center justify-center">{icon}</div> : null}
      {title ? <h3 className="text-lg font-semibold mb-1">{title}</h3> : null}
      {message ? <p className="text-muted-foreground mb-4 mx-auto max-w-sm">{message}</p> : null}
      {actionLabel && onAction ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </div>
  );

  if (inline) return Content;

  return (
    <Card>
      <CardHeader>{title ? <CardTitle>{title}</CardTitle> : null}</CardHeader>
      <CardContent>{Content}</CardContent>
    </Card>
  );
}
