import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StageStatusBadge } from './StageStatusBadge';

/** Covers the timeline states (locked/ready/...) rendering label + icon, never color alone. */
describe('StageStatusBadge', () => {
  it('renders the label text for LOCKED', () => {
    render(<StageStatusBadge status="LOCKED" />);
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('renders the label text for READY', () => {
    render(<StageStatusBadge status="READY" />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('renders REJECTED (a status the design handoff omitted)', () => {
    render(<StageStatusBadge status="REJECTED" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('falls back gracefully for an unknown status', () => {
    render(<StageStatusBadge status="SOMETHING_ELSE" />);
    // Falls back to the DRAFT token rather than crashing.
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});
