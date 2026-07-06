import { describe, it, expect } from 'vitest';
import { STAGE_STATUS, MODEL_TIER_LABEL } from './tokens';

/** Guards the fix: the handoff shipped 6 stage statuses; the backend enum has 8. */
describe('STAGE_STATUS tokens', () => {
  const BACKEND_STATUSES = [
    'DRAFT',
    'LOCKED',
    'READY',
    'RUNNING',
    'WAITING_HUMAN_REVIEW',
    'APPROVED',
    'REJECTED',
    'FAILED',
  ];

  it('covers all 8 backend stage statuses', () => {
    for (const s of BACKEND_STATUSES) {
      expect(STAGE_STATUS[s], `missing token for ${s}`).toBeDefined();
      expect(STAGE_STATUS[s].label).toBeTruthy();
      expect(STAGE_STATUS[s].icon).toBeTruthy();
    }
  });

  it('includes DRAFT and REJECTED (absent from the design handoff)', () => {
    expect(STAGE_STATUS.DRAFT).toBeDefined();
    expect(STAGE_STATUS.REJECTED).toBeDefined();
  });
});

describe('MODEL_TIER_LABEL', () => {
  it('labels every real backend tier plus the HUMAN_REVIEW sentinel', () => {
    const tiers = [
      'CHEAP_FAST_MODEL',
      'DESIGN_MODEL',
      'QA_MODEL',
      'CODING_STANDARD_MODEL',
      'SECURITY_MODEL',
      'CLAUDE_DESIGN',
      'FABLE_5',
      'HUMAN_REVIEW',
    ] as const;
    for (const t of tiers) {
      expect(MODEL_TIER_LABEL[t]).toBeTruthy();
    }
    expect(MODEL_TIER_LABEL.FABLE_5).toBe('Fable 5');
  });
});
