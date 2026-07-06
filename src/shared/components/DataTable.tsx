import type { ReactNode } from 'react';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** CSS grid track for this column, e.g. "2fr", "120px", "40px". */
  width: string;
  align?: 'start' | 'center' | 'end';
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}) {
  const template = columns.map((c) => c.width).join(' ');

  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className={styles.table} role="table">
      <div className={styles.headerRow} style={{ gridTemplateColumns: template }} role="row">
        {columns.map((c) => (
          <span key={c.key} role="columnheader" style={{ justifySelf: c.align ?? 'start' }}>
            {c.header}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={getRowKey(row)}
          className={[styles.row, onRowClick ? styles.clickable : ''].filter(Boolean).join(' ')}
          style={{ gridTemplateColumns: template }}
          role="row"
          tabIndex={onRowClick ? 0 : undefined}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          onKeyDown={
            onRowClick
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }
              : undefined
          }
        >
          {columns.map((c) => (
            <span key={c.key} role="cell" className={styles.cell} style={{ justifySelf: c.align ?? 'start' }}>
              {c.render(row)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
