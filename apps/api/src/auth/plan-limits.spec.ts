import { PLAN_LIMITS, SELF_HOSTED_LIMITS } from '@asobeast/shared';
import { planScopeOf, selfHostedLimits } from './plan-limits';

const NOW = new Date('2026-10-02T12:00:00.000Z');
const INDIE = { plan: 'indie', trialEndsAt: null, planExpiresAt: null };

describe('selfHostedLimits', () => {
  it('applies the self hosted ai cap', () => {
    expect(selfHostedLimits(40)).toEqual({
      ...SELF_HOSTED_LIMITS,
      aiCallsPerMonth: 40,
    });
  });

  it('stays unlimited without a cap', () => {
    expect(selfHostedLimits(null)).toEqual(SELF_HOSTED_LIMITS);
  });

  it('keeps competitors unlimited when no cap is configured', () => {
    expect(selfHostedLimits(null).competitorsPerApp).toBe(
      SELF_HOSTED_LIMITS.competitorsPerApp,
    );
    expect(selfHostedLimits(null, undefined).competitorsPerApp).toBe(
      SELF_HOSTED_LIMITS.competitorsPerApp,
    );
  });

  it('applies a configured competitor cap', () => {
    expect(selfHostedLimits(null, 25).competitorsPerApp).toBe(25);
  });

  it('leaves competitors unlimited when configured as unlimited', () => {
    expect(selfHostedLimits(null, null).competitorsPerApp).toBeNull();
  });

  it('reads a competitor cap of null as unlimited rather than as unset', () => {
    expect(selfHostedLimits(null, null)).toEqual({
      ...SELF_HOSTED_LIMITS,
      competitorsPerApp: null,
    });
  });
});

describe('planScopeOf', () => {
  it('uses the configured self hosted limits when billing is off', () => {
    expect(
      planScopeOf(false, INDIE, NOW, selfHostedLimits(40)).limits
        .aiCallsPerMonth,
    ).toBe(40);
  });

  it('uses the configured competitor cap when billing is off', () => {
    expect(
      planScopeOf(false, INDIE, NOW, selfHostedLimits(null, null)).limits
        .competitorsPerApp,
    ).toBeNull();
  });

  it('keeps the plan allowance when billing is on', () => {
    expect(planScopeOf(true, INDIE, NOW, selfHostedLimits(40)).limits).toBe(
      PLAN_LIMITS.indie,
    );
  });

  it('keeps the plan competitor cap when billing is on', () => {
    expect(
      planScopeOf(true, INDIE, NOW, selfHostedLimits(null, null)).limits
        .competitorsPerApp,
    ).toBe(PLAN_LIMITS.indie.competitorsPerApp);
  });
});
