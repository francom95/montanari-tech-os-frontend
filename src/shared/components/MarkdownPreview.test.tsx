import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownPreview } from './MarkdownPreview';

describe('MarkdownPreview', () => {
  it('renders markdown as HTML (headings, lists, emphasis)', () => {
    render(<MarkdownPreview content={'# Discovery\n\n- requirement one\n- requirement two\n\n**bold**'} />);
    expect(screen.getByRole('heading', { name: 'Discovery' })).toBeInTheDocument();
    expect(screen.getByText('requirement one')).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('renders GFM tables', () => {
    render(<MarkdownPreview content={'| Tier | Mult |\n| --- | --- |\n| Fable 5 | 20 |'} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Fable 5')).toBeInTheDocument();
  });
});
