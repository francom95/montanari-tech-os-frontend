import { AppError } from '@/shared/api';
import { Icon } from './Icon';
import { Button } from './Button';

/** Renders a normalized AppError (or any error) with an optional retry. */
export function ErrorState({
  error,
  onRetry,
  minHeight = 200,
}: {
  error: unknown;
  onRetry?: () => void;
  minHeight?: number;
}) {
  const message =
    error instanceof AppError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Something went wrong.';
  const forbidden = error instanceof AppError && error.code === 'FORBIDDEN';

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        minHeight,
        textAlign: 'center',
        padding: 24,
      }}
    >
      <Icon
        name={forbidden ? 'block' : 'error'}
        size={28}
        color="var(--color-danger)"
      />
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-danger-text)' }}>
        {forbidden ? 'You don’t have access to this' : 'Something went wrong'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 420, lineHeight: 1.6 }}>
        {message}
      </div>
      {onRetry && !forbidden && (
        <Button icon="refresh" onClick={onRetry} size="sm">
          Retry
        </Button>
      )}
    </div>
  );
}
