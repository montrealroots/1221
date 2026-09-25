/**
 * SLATE — account numbers, the way each country writes them.
 *
 * A bank account is known by a number whose shape is the country's: an IBAN
 * across Europe and Iceland, a routing number and an account number in the
 * United States, a CLABE in Mexico, a BSB in Australia. The check digits are
 * the real ones, worked out by the real rules, so an IBAN here passes the
 * mod-97 check a bank's own form runs:
 *
 * - IBAN: ISO 13616, the two check digits making the whole number 1 mod 97.
 * - Spain: the two control digits of the old CCC, weights 1, 2, 4, 8, 5, 10,
 *   9, 7, 3, 6 mod 11.
 * - France: the RIB key, 97 less (89 × bank + 15 × branch + 3 × account)
 *   mod 97, with letters read as digits the way the RIB reads them.
 * - Mexico: the CLABE's last digit, weights 3, 7, 1 mod 10.
 * - Iceland: the kennitala's ninth digit, weights 3, 2, 7, 6, 5, 4, 3, 2
 *   mod 11, which is also the last ten digits of an Icelandic IBAN.
 *
 * Where a country checks the account part by a rule each bank keeps to
 * itself (a German account number, a British one), the digits are drawn
 * plain and the IBAN around them still checks.
 *
 * The digits themselves are drawn from the save's own stream by the caller
 * (`systems/banking.ts`), so the functions here are pure.
 */

/** A source of digits: each call gives one digit, 0 to 9. */
export type Digits = () => number;

export function digits(next: Digits, count: number): string {
  let out = '';
  for (let i = 0; i < count; i += 1) out += String(next());
  return out;
}

/** A number as a string of digits, read mod 97, any length. */
function mod97(numeric: string): number {
  let rest = 0;
  for (const ch of numeric) rest = (rest * 10 + Number(ch)) % 97;
  return rest;
}

/** Letters as the IBAN reads them: A is 10, Z is 35. */
function ibanDigits(text: string): string {
  return [...text.toUpperCase()].map((ch) => (/[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch)).join('');
}

/** An IBAN from its country and the national number inside it. */
export function iban(country: string, bban: string): string {
  const check = 98 - mod97(ibanDigits(`${bban}${country}00`));
  return `${country}${String(check).padStart(2, '0')}${bban}`;
}

/** Whether an IBAN's check digits hold. */
export function ibanValid(value: string): boolean {
  const plain = value.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(plain)) return false;
  return mod97(ibanDigits(plain.slice(4) + plain.slice(0, 4))) === 1;
}

/** An IBAN in groups of four, the way it is printed. */
export function groupIban(value: string): string {
  return value.replace(/(.{4})/g, '$1 ').trim();
}

/** Spain: the two control digits between the branch and the account. */
export function spanishControl(bank: string, branch: string, account: string): string {
  const weights = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];
  const one = (text: string) => {
    const sum = [...text].reduce((acc, ch, i) => acc + Number(ch) * weights[i]!, 0);
    const d = 11 - (sum % 11);
    return d === 11 ? 0 : d === 10 ? 1 : d;
  };
  return `${one(`00${bank}${branch}`)}${one(account)}`;
}

/** France: the RIB key after the account number. */
export function ribKey(bank: string, branch: string, account: string): string {
  // Letters in an account number read as digits, the RIB's own way.
  const table: Record<string, string> = {
    A: '1', B: '2', C: '3', D: '4', E: '5', F: '6', G: '7', H: '8', I: '9',
    J: '1', K: '2', L: '3', M: '4', N: '5', O: '6', P: '7', Q: '8', R: '9',
    S: '2', T: '3', U: '4', V: '5', W: '6', X: '7', Y: '8', Z: '9',
  };
  const plain = (text: string) => [...text.toUpperCase()].map((ch) => table[ch] ?? ch).join('');
  const b = Number(plain(bank)); const g = Number(plain(branch));
  const c = plain(account);
  // 3 × an eleven-digit account overflows nothing in a double, but it is
  // taken mod 97 first to keep it exact.
  const key = 97 - ((89 * b + 15 * g + 3 * mod97(c)) % 97);
  return String(key).padStart(2, '0');
}

/** Mexico: the CLABE's check digit, for its first seventeen. */
export function clabeCheck(first17: string): string {
  const weights = [3, 7, 1];
  const sum = [...first17].reduce((acc, ch, i) => acc + ((Number(ch) * weights[i % 3]!) % 10), 0);
  return String((10 - (sum % 10)) % 10);
}

/**
 * Iceland: a kennitala from a birth date and two drawn digits, with its real
 * check digit and the century digit (9 for the 1900s, 0 for the 2000s).
 * Returns undefined for the one draw in eleven whose check would be ten,
 * which the registry never issues; the caller draws again.
 */
export function kennitala(day: number, month: number, year: number, drawn: string): string | undefined {
  const base = `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${String(year % 100).padStart(2, '0')}${drawn}`;
  const weights = [3, 2, 7, 6, 5, 4, 3, 2];
  const sum = [...base].reduce((acc, ch, i) => acc + Number(ch) * weights[i]!, 0);
  const rest = sum % 11;
  const check = rest === 0 ? 0 : 11 - rest;
  if (check === 10) return undefined;
  const century = Math.floor(year / 100) === 19 ? '9' : Math.floor(year / 100) === 20 ? '0' : '8';
  return `${base}${check}${century}`;
}

/** Whether a kennitala's check digit holds. */
export function kennitalaValid(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  const weights = [3, 2, 7, 6, 5, 4, 3, 2];
  const sum = [...value.slice(0, 8)].reduce((acc, ch, i) => acc + Number(ch) * weights[i]!, 0);
  const rest = sum % 11;
  return Number(value[8]) === (rest === 0 ? 0 : 11 - rest);
}

/** Whether a US routing number's checksum holds: 3, 7, 1 weights, mod 10. */
export function abaValid(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false;
  const w = [3, 7, 1, 3, 7, 1, 3, 7, 1];
  return [...routing].reduce((acc, ch, i) => acc + Number(ch) * w[i]!, 0) % 10 === 0;
}

/**
 * A BBAN built to its country's structure in the IBAN Registry's notation
 * ("4!a10!n": four letters, then ten digits): the bank's own code at its
 * place, and every other position drawn as the kind of character the
 * registry says goes there. `letter` and `digit` draw one each.
 */
export function bbanFrom(
  structure: string,
  bank: { code: string; offset: number },
  draw: { digit: () => number; letter: () => string },
): string | undefined {
  const parts = [...structure.matchAll(/(\d+)!?([nac])/g)];
  if (parts.length === 0) return undefined;
  let out = '';
  for (const [, count, kind] of parts) {
    for (let i = 0; i < Number(count); i += 1) out += kind === 'a' ? draw.letter() : String(draw.digit());
  }
  if (bank.code && bank.offset + bank.code.length <= out.length) {
    out = out.slice(0, bank.offset) + bank.code.toUpperCase() + out.slice(bank.offset + bank.code.length);
  }
  return out;
}

/** Belgium's national check: the BBAN's last two digits are its first ten mod 97, and 97 for 0. */
export function belgianCheck(first10: string): string {
  const rest = Number(BigInt(first10) % 97n);
  return String(rest === 0 ? 97 : rest).padStart(2, '0');
}

/**
 * ISO 7064 MOD 97-10 as a national check inside a BBAN (Portugal's NIB,
 * Serbia, Montenegro, North Macedonia, Slovenia, Timor-Leste): the last two
 * digits are 98 less the rest, followed by 00, mod 97.
 */
export function mod9710(base: string): string {
  return String(98 - mod97(`${base}00`)).padStart(2, '0');
}
