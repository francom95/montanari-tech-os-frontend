import { Button } from './Button';
import type { Page } from '@/shared/api';

/**
 * Prev/Next pager for a Spring `Page<T>` response. Renders nothing when there's only one page.
 * Extracted from three near-identical copies (audit logs, review queue, credits) — a single
 * place to fix pagination behavior/styling instead of three.
 */
export function Pagination({
  data,
  onPageChange,
}: {
  data: Pick<Page<unknown>, 'totalPages' | 'first' | 'last' | 'number'> | undefined;
  onPageChange: (page: number) => void;
}) {
  if (!data || data.totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, alignItems: 'center' }}>
      <Button size="sm" icon="chevron_left" disabled={data.first} onClick={() => onPageChange(data.number - 1)}>
        Prev
      </Button>
      <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>
        Page {data.number + 1} of {data.totalPages}
      </span>
      <Button size="sm" iconRight="chevron_right" disabled={data.last} onClick={() => onPageChange(data.number + 1)}>
        Next
      </Button>
    </div>
  );
}
