/**
 * Account numbers hold to the real rules.
 *
 * Every example here is a published one: the IBAN registry's own examples
 * (ISO 13616, SWIFT's IBAN Registry), a French RIB and a Spanish CCC from the
 * same registry, Banxico's CLABE example and the routing number JPMorgan
 * Chase publishes for New York. If a rule in `core/banknumbers.ts` is wrong,
 * one of these fails.
 */

import { describe, expect, it } from 'vitest';
import {
  abaValid, clabeCheck, groupIban, iban, ibanValid, kennitala, kennitalaValid, ribKey, spanishControl,
} from '@/engine/core/banknumbers';

describe('the IBAN', () => {
  it('gives the registry’s own check digits', () => {
    expect(iban('DE', '370400440532013000')).toBe('DE89370400440532013000');
    expect(iban('GB', 'WEST12345698765432')).toBe('GB82WEST12345698765432');
    expect(iban('IE', 'AIBK93115212345678')).toBe('IE29AIBK93115212345678');
    expect(iban('ES', '21000418450200051332')).toBe('ES9121000418450200051332');
    expect(iban('FR', '20041010050500013M02606')).toBe('FR1420041010050500013M02606');
    expect(iban('IS', '0159260076545510730339')).toBe('IS140159260076545510730339');
  });

  it('checks one, and fails one with a digit changed', () => {
    expect(ibanValid('DE89 3704 0044 0532 0130 00')).toBe(true);
    expect(ibanValid('DE89370400440532013001')).toBe(false);
    expect(groupIban('DE89370400440532013000')).toBe('DE89 3704 0044 0532 0130 00');
  });
});

describe('the national check digits', () => {
  it('works out Spain’s control digits', () => {
    expect(spanishControl('2100', '0418', '0200051332')).toBe('45');
  });

  it('works out a French RIB key, letters and all', () => {
    expect(ribKey('20041', '01005', '0500013M026')).toBe('06');
  });

  it('works out a CLABE’s last digit', () => {
    expect(clabeCheck('03218000011835971')).toBe('9');
  });

  it('writes a kennitala whose check digit holds, and refuses the one that can’t', () => {
    const made = kennitala(14, 6, 2001, '23');
    if (made) {
      expect(kennitalaValid(made)).toBe(true);
      expect(made.startsWith('140601')).toBe(true);
      expect(made.endsWith('0')).toBe(true);
    }
    expect(kennitalaValid('5510730339')).toBe(true);
    expect(kennitalaValid('5510730349')).toBe(false);
    // Of the hundred possible drawn pairs, the ones whose check would be ten
    // are refused, and every other one checks.
    let refused = 0;
    for (let n = 0; n < 100; n += 1) {
      const k = kennitala(1, 1, 1990, String(n).padStart(2, '0'));
      if (k === undefined) refused += 1;
      else expect(kennitalaValid(k)).toBe(true);
    }
    expect(refused).toBeGreaterThan(0);
    expect(refused).toBeLessThan(20);
  });

  it('checks a US routing number', () => {
    expect(abaValid('021000021')).toBe(true);
    expect(abaValid('021000022')).toBe(false);
  });
});
