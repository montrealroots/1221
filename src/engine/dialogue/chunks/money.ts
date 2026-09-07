/**
 * Money — the branch, the adviser, the bill, the arrears, the good month.
 *
 * Every bank and product in the game is SLATE's own and says so; nothing here
 * is financial advice and nothing here is a rate anybody is offering. These
 * are the words money gets talked about in, and every one of them describes
 * something a command has already decided and posted to the ledger.
 */

import { line, type DialogueChunk, type DialogueLine } from '../schema';

const S = 'money';
const M = (purpose: string, beat: string, key: string, text: string, opts: Parameters<typeof line>[5] = {}): DialogueLine =>
  line(S, purpose, beat, key, text, { role: 'banker', ...opts });

const LINES: DialogueLine[] = [
  // --- The counter -------------------------------------------------------------------------------------
  M('counter', 'branch', 'greet.1', '"Take a seat. It will not be five minutes, whatever the screen says."', { role: 'reception' }),
  M('counter', 'branch', 'greet.2', 'A branch with two tellers, four windows and a queue that has opinions about that ratio.', { speaker: 'narrator', role: 'world' }),
  M('counter', 'branch', 'greet.3', '"Card and something with your address on it, and we can do the whole thing today."', {}),
  M('counter', 'branch', 'greet.4', 'Everything in here is beige on purpose. Nobody has ever made a fast decision in this room.', { speaker: 'narrator', role: 'world' }),
  M('counter', 'branch', 'private.1', '"I have put you in the room at the back. Coffee is coming."', { when: { flags: ['private'] } }),
  M('counter', 'branch', 'private.2', 'A door with no signage, a person who knows your name, and a chair that cost more than most people’s sofa.', { when: { flags: ['private'] }, speaker: 'narrator' }),
  M('counter', 'branch', 'private.3', '"You will not need to queue again. That is largely what the fee is for."', { when: { flags: ['private'], tone: ['dry'] } }),

  // --- Opening and closing ---------------------------------------------------------------------------------
  M('open', 'desk', 'yes.1', '"That is opened. Card in five working days, and the app will let you in tonight."', { when: { result: ['opened'] } }),
  M('open', 'desk', 'yes.2', '"Minimum is {amount} and you have brought {amount}, so that is the easy part done."', { when: { result: ['opened'] } }),
  M('open', 'desk', 'yes.3', 'Signatures in three places, a booklet you will not read, and a new account number.', { when: { result: ['opened'] }, speaker: 'narrator' }),
  M('open', 'desk', 'no.1', '"Not on this one. The opening deposit is {amount} and I cannot move it."', { when: { result: ['refused'] } }),
  M('open', 'desk', 'no.2', '"Your score is not there yet. Six months of the everyday account and it will be."', { when: { result: ['refused'], tone: ['warm'] } }),
  M('open', 'desk', 'no.3', 'The screen says no and the person reading it is sorry about it in a professional way.', { when: { result: ['refused'] }, speaker: 'narrator' }),
  M('open', 'desk', 'close.1', '"Closed. The balance goes across today and the direct debits are your problem, gently."', { when: { result: ['closed'] } }),
  M('open', 'desk', 'close.2', '"I have to ask why you are leaving. I do not have to write down the real answer."', { when: { result: ['closed'], tone: ['dry'] } }),

  // --- The bill ----------------------------------------------------------------------------------------------
  M('bill', 'post', 'due.1', 'An envelope with a window in it. Everybody knows what those are.', { speaker: 'narrator', role: 'world' }),
  M('bill', 'post', 'due.2', 'The statement arrives and the number at the bottom is a number you already knew and had chosen not to.', { speaker: 'narrator', role: 'world' }),
  M('bill', 'post', 'due.3', '"{amount}, due on the twelfth. Minimum is on the second page and I would not recommend it."', {}),
  M('bill', 'post', 'paid.1', 'Paid in full, on time, and the very small satisfaction of a zero.', { when: { result: ['paid'] }, speaker: 'narrator', role: 'world' }),
  M('bill', 'post', 'paid.2', '"Cleared. Nothing carried, nothing charged. That is how it is supposed to work and mostly does not."', { when: { result: ['paid'] } }),
  M('bill', 'post', 'partial.1', 'You pay what you can and the rest starts costing money quietly, at a rate that is on page four.', { when: { result: ['partial'] }, speaker: 'narrator', role: 'world' }),
  M('bill', 'post', 'partial.2', '"Minimum is fine. It is not free, but it is fine."', { when: { result: ['partial'] } }),
  M('bill', 'post', 'late.1', '"It went past. There is a fee, and it will show on the file for a while."', { when: { result: ['late'], tone: ['firm'] } }),
  M('bill', 'post', 'late.2', 'A letter with a different tone of voice from the last one.', { when: { result: ['late'] }, speaker: 'narrator', role: 'world' }),
  M('bill', 'post', 'late.3', '"I can waive it once. I am waiving it once."', { when: { result: ['late'], tone: ['warm'] } }),

  // --- Being short ----------------------------------------------------------------------------------------------
  M('short', 'account', 'edge.1', 'You do the sum in your head at the till and then again properly afterwards, and both come out the same.', { speaker: 'narrator', role: 'world' }),
  M('short', 'account', 'edge.2', '"You are inside your cover, but only just, and the cover has a fee every time it works."', {}),
  M('short', 'account', 'edge.3', 'Four days until payday and a fridge with a plan of its own.', { speaker: 'narrator', role: 'world' }),
  M('short', 'account', 'declined.1', 'The reader thinks, and then declines, and the queue behind you finds something else to look at.', { when: { result: ['declined'] }, speaker: 'narrator', role: 'world' }),
  M('short', 'account', 'declined.2', '"Try the other card. It happens more than you think."', { when: { result: ['declined'] }, role: 'world', speaker: 'npc' }),
  M('short', 'account', 'over.1', '"You have gone under. There is a charge for that and there is a charge for each thing that went through."', { when: { result: ['overdrawn'], tone: ['firm'] } }),
  M('short', 'account', 'over.2', 'Three small charges you had forgotten about arrive in the same hour, in the worst possible order.', { when: { result: ['overdrawn'] }, speaker: 'narrator', role: 'world' }),

  // --- The good month ----------------------------------------------------------------------------------------------
  M('flush', 'account', 'in.1', 'The money lands and the app shows a number that takes a second to parse.', { when: { result: ['paid_in'] }, speaker: 'narrator', role: 'world' }),
  M('flush', 'account', 'in.2', '"That has cleared. Do you want to leave it there or shall we do something more interesting with it?"', { when: { result: ['paid_in'] } }),
  M('flush', 'account', 'in.3', 'A check with more zeroes on it than you have had before, and the strange flatness of it just being a number in an app by Thursday.', { when: { result: ['paid_in'] }, speaker: 'narrator', role: 'world' }),
  M('flush', 'account', 'advice.1', '"Keep six months of costs where you can reach it and stop thinking about the rest for a year."', { when: { move: ['advise'] } }),
  M('flush', 'account', 'advice.2', '"A quarter of that is not yours. It is the tax office’s and it is only visiting."', { when: { move: ['advise'], tone: ['dry'] } }),
  M('flush', 'account', 'advice.3', '"The mistake everybody in your business makes is treating a good year like a salary."', { when: { move: ['advise'], tone: ['firm'] } }),
  M('flush', 'account', 'advice.4', '"You can afford it. That is a different question from whether it is a good idea, and I am only paid to answer the first one."', { when: { move: ['advise'] } }),

  // --- Lending -------------------------------------------------------------------------------------------------------
  M('lend', 'desk', 'yes.1', '"Approved. The rate is what the rate is because of the score, and the score is good."', { when: { result: ['approved'] } }),
  M('lend', 'desk', 'yes.2', '"We can do that. I want a deposit and I want it from an account we can see."', { when: { result: ['approved'], tone: ['firm'] } }),
  M('lend', 'desk', 'no.1', '"Declined. Income is the issue, not the score. Yours goes up and down and the model does not like that."', { when: { result: ['refused'] } }),
  M('lend', 'desk', 'no.2', '"Come back with two years of accounts and it is a different conversation."', { when: { result: ['refused'], tone: ['warm'] } }),
  M('lend', 'desk', 'terms.1', '"Read the early repayment clause. That is the one that catches people."', { when: { move: ['warn'] } }),
  M('lend', 'desk', 'terms.2', '"Fixed for two years and then it is whatever the world is doing in two years."', { when: { move: ['warn'] } }),

  // --- The score and the file --------------------------------------------------------------------------------------------
  M('file', 'record', 'good.1', '"Clean file. Nothing on it, and nothing on it is the whole aim."', { when: { result: ['good'] } }),
  M('file', 'record', 'good.2', 'The number has gone up eleven points for reasons nobody will ever fully explain to you.', { when: { result: ['good'] }, speaker: 'narrator', role: 'world' }),
  M('file', 'record', 'bad.1', '"There is a mark. It drops off in a few years and until then it is going to cost you on every rate."', { when: { result: ['bad'], tone: ['firm'] } }),
  M('file', 'record', 'bad.2', 'A missed payment from eighteen months ago, still there, still doing damage out of all proportion.', { when: { result: ['bad'] }, speaker: 'narrator', role: 'world' }),
];

export const MONEY_CHUNK: DialogueChunk = {
  section: S,
  version: 1,
  lines: LINES,
  expects: [
    { purpose: 'counter', beat: 'branch' },
    { purpose: 'counter', beat: 'branch', flags: ['private'] },
    { purpose: 'open', beat: 'desk', result: ['opened', 'refused', 'closed'] },
    { purpose: 'bill', beat: 'post' },
    { purpose: 'bill', beat: 'post', result: ['paid', 'partial', 'late'] },
    { purpose: 'short', beat: 'account' },
    { purpose: 'short', beat: 'account', result: ['declined', 'overdrawn'] },
    { purpose: 'flush', beat: 'account', result: ['paid_in'] },
    { purpose: 'flush', beat: 'account', move: ['advise'] },
    { purpose: 'lend', beat: 'desk', result: ['approved', 'refused'] },
    { purpose: 'file', beat: 'record', result: ['good', 'bad'] },
  ],
};
