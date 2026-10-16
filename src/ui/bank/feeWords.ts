/**
 * SLATE — a current account's monthly fee and how its bank waives it, in the bank's own conditions (from 2026-10-16: moved
 * here from `ui/workspaces/BankWorkspace.tsx`, which says it for an account held, so the opening panel,
 * `ui/bank/BankMoves.tsx`, says it before Apply). The figures are the product's, the ones `feeFor`
 * (`systems/banking.ts`) charges by.
 */
import type { Product } from '@/engine/content/banks';

/** How a fee is waived, the way the bank puts its conditions, each one an "or", and what lowers it. */
export function waiverWords(product: Product, money: (cents: number) => string): string {
  const waiver = product.waiver;
  // As the bank counts them: any electronic deposit where it does, and until 2026-09-27 this said wages for every bank.
  const paidIn = product.deposits === 'electronic' ? 'of electronic deposits (wages, benefits or a tax refund) paid in' : 'of wages paid in';
  const cut = product.reduced;
  const lower = !cut ? '' : `; ${money(cut.to)} with ${[
    cut.depositsAtLeast !== undefined ? `${money(cut.depositsAtLeast)} ${paidIn}` : '',
    cut.averageAtLeast !== undefined ? `an average of ${money(cut.averageAtLeast)} over the month` : '',
    cut.ageBelow !== undefined ? `being under ${cut.ageBelow}` : '',
  ].filter(Boolean).join(', or ')}`;
  if (!waiver) return lower;
  const ways: string[] = [];
  if (waiver.depositsAtLeast !== undefined) {
    const also = waiver.depositsAlso;
    const extra = !also ? '' : also.either !== undefined
      ? ` and ${also.either} bills or card payments in ${also.months} months`
      : ` and ${[also.bills !== undefined ? `${also.bills} bills` : '', also.purchases !== undefined ? `${also.purchases} card payments` : ''].filter(Boolean).join(' or ')} in ${also.months} months`;
    ways.push(`${money(waiver.depositsAtLeast)} ${paidIn}${extra}`);
  }
  if (waiver.balanceAtLeast !== undefined) ways.push(`keeping ${money(waiver.balanceAtLeast)} in it all month`);
  if (waiver.averageAtLeast !== undefined) ways.push(`an average of ${money(waiver.averageAtLeast)} over the month`);
  if (waiver.linkedAverageAtLeast !== undefined) ways.push(`an average of ${money(waiver.linkedAverageAtLeast)} across your accounts at the bank`);
  if (waiver.ageBelow !== undefined) ways.push(`being under ${waiver.ageBelow}`);
  if (waiver.ageAtLeast !== undefined) ways.push(`being ${waiver.ageAtLeast} or over`);
  if (waiver.purchasesAtLeast !== undefined) ways.push(`${waiver.purchasesAtLeast} card payments in the month`);
  if (waiver.firstMonths !== undefined) ways.push(`the first ${waiver.firstMonths} months after opening`);
  if (ways.length === 0) return lower;
  return `, waived with ${ways.join(', or ')}${lower}`;
}
