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
  abaValid, bbanFrom, belgianCheck, clabeCheck, mod9710, groupIban, iban, ibanValid, kennitala, kennitalaValid, ribKey, spanishControl,
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

describe('a BBAN built to its country’s structure', () => {
  const draws = () => { let i = 0; return { digit: () => (i++ * 7) % 10, letter: () => 'X' }; };

  it('puts the bank’s code where the registry says, and the kinds of character everywhere else', () => {
    const nl = bbanFrom('4!a10!n', { code: 'INGB', offset: 0 }, draws())!;
    expect(nl).toMatch(/^INGB\d{10}$/);
    expect(ibanValid(iban('NL', nl))).toBe(true);
    const it = bbanFrom('1!a5!n5!n12!c', { code: '03069', offset: 1 }, draws())!;
    expect(it).toMatch(/^X03069\d{17}$/);
  });

  it('works out Belgium’s own check, as the registry’s example has it', () => {
    // BE68 5390 0754 7034: 5390075470 mod 97 is 34.
    expect(belgianCheck('5390075470')).toBe('34');
    expect(iban('BE', '539007547034')).toBe('BE68539007547034');
  });
});

describe('the national checks inside a BBAN', () => {
  it('works out ISO 7064 MOD 97-10 as the registry’s examples have it', () => {
    // PT50 0002 0123 1234 5678 9015 4 and RS35 2600 0560 1001 6113 79.
    expect(mod9710('0002012312345678901')).toBe('54');
    expect(mod9710('2600056010016113')).toBe('79');
  });
});
