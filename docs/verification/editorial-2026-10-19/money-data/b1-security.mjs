/**
 * Batch 1: `content/security.ts`, the words Your Cards shows under the cards (`ui/bank/BankSecurity.tsx`): each bank's
 * `lostCardWords` and `suspectWords` (unlabelled, for the screen's bank), `replaceWords` ("The bank’s terms: … The game
 * charges nothing for it.", where the bank lists no fee for that card), `rushUnpublished` (before "With no fee
 * published, the game doesn’t offer a rushed card."), each country's `debitWords`, `creditWords` and `refundWords`
 * ("The law on the debit card: …", "The law on the credit card: …", "The law on a payment you report as not yours:
 * …"), and the source line. Applied with `apply-gen.mjs`; the before of each is in `b1-security-changes.json`.
 */
import { readDaysFor } from './read-days.mjs';

const edits = {
  SECURITY: {
    'us-chase': {
      lostCardWords: 'Once you report a card lost or stolen, Chase declines anything new on it and sends a replacement with a new number. For a credit card, the account itself stays open and keeps its age on your credit record.',
      suspectWords: 'Chase watches cards around the clock and may text, send an app notification, email or call to check that unusual activity was you. Fraud alerts are automatic: you don’t need to sign up. Chase can decline a payment it believes may be fraud, but it doesn’t say it holds a payment while it waits for your reply.',
    },
    'us-bank-of-america': {
      lostCardWords: 'Bank of America says it cancels a lost or stolen credit card and sends a replacement right away. You can lock a debit card in Online Banking or the app while you look for it, and replace it there or by phone.',
    },
    'us-wells-fargo': {
      rushUnpublished: 'Wells Fargo can rush a new credit card: “We may be able to replace your card in as little as 24 hours (additional fees may apply)” (wellsfargo.com/help/lost-wallet). Its Active Cash card agreement names a Rush Plastic Fee but gives no amount.',
      lostCardWords: 'Wells Fargo replaces a lost or stolen debit or credit card with a new number, expiration date and security code, and it arrives in about 5 to 7 calendar days. While you look for a misplaced card, you can turn it off in the app or online, and recurring charges still go through.',
      suspectWords: 'If Wells Fargo sees unusual card activity, it may call, email or text to ask whether the payments were you, and it may decline a payment it suspects is fraud. Its texts come from short codes such as 93557.',
    },
    'us-citi': {
      lostCardWords: 'A replacement credit card has a new number, security code and expiration date, and usually arrives within about 5 business days. Citi Quick Lock, in the app or online, blocks new charges on a misplaced card and lets recurring charges continue.',
    },
    'us-capital-one': {
      lostCardWords: 'When you report a credit card lost or stolen, Capital One locks it and sends a replacement with a new number in about 4 to 6 business days. A lost debit card is turned off at once. If you’re eligible, you can use a virtual card in the app while you wait.',
      suspectWords: 'If Capital One sees activity that might be fraud, it texts you, always from the same number, and you can reply on the spot. Answering no blocks the card. Alerts also come by email and in the app.',
    },
    'ca-rbc': {
      lostCardWords: 'RBC cancels a lost or stolen debit card and sends a new one, and blocks a lost or stolen credit card and sends a new card. Your first replacement debit card in a calendar year is free, and each one after that costs C$5.00, unless it’s replaced because of fraud, a name change or a card that arrived damaged. The game charges nothing for any of them.',
      suspectWords: 'On a credit card, RBC texts you from short code 722373 or 347722. Reply Y to confirm a payment, or N if you don’t recognize it, and a fraud specialist contacts you. The card agreement says RBC can block the card without telling you when it suspects fraud.',
    },
    'ca-td': {
      lostCardWords: 'TD closes a lost, stolen or compromised Access Card for good and sends a replacement by Canada Post in 5 to 7 business days, or you can pick one up the same day at a branch. You can lock the card instantly in the TD app while you look for it.',
      suspectWords: 'When TD sees suspicious activity on a credit card, it blocks the card and texts you. Reply Y and it’s unblocked at once. Reply N, or don’t answer, and it stays blocked until you call; TD phones you if you don’t reply. TD’s fraud alerts page covers credit cards and doesn’t mention debit cards.',
    },
    'ca-scotiabank': {
      lostCardWords: 'You report a lost or stolen ScotiaCard debit card in the Scotia app and order its replacement there, and the new card arrives in 5 to 10 business days. You report a lost credit card by phone, and its replacement arrives in about 7 to 10 business days. A locked debit card still lets pre-authorized payments and bills set up on it go through.',
      suspectWords: 'Scotia Fraud Alerts block the card as soon as a payment looks unusual, then reach you by app notification, a text from 267373, email or an automated call. You answer Yes or No. After you confirm, you have to make the purchase again.',
    },
    'ca-bmo': {
      lostCardWords: 'You can report a lost or stolen BMO debit or credit card and ask for a new one online or in the app. A replacement credit card comes by regular mail in six to eight business days. You can lock a misplaced card online to pause payments, and unlock it later.',
      suspectWords: 'BMO’s credit card agreement says it may block the card, or one kind of payment, without telling you when it suspects fraud. BMO’s Canadian pages don’t say how it tells you about a payment it suspects.',
    },
    'ca-cibc': {
      lostCardWords: 'CIBC turns off a lost or stolen credit card at once and mails a new one with a new number, which you can add to a mobile wallet right away. Report a lost debit card at a branch or by phone, and CIBC protects and replaces it. You can lock either card for a while in online or mobile banking.',
      suspectWords: 'CIBC asks you to confirm an unusual payment by text from 242-225 or 242-234 (reply Y or N), by an automated call you answer on the keypad, or by email. Its fraud alerts page doesn’t say whether the card is held until you answer.',
    },
    'mx-bbva': {
      lostCardWords: 'Block the card in the BBVA app (Emergencies, then Theft and loss) or by calling Línea BBVA, and ask for a replacement in the app or at a branch. The new card has a different number and has to be activated; meanwhile you can keep paying with the digital card. A new Libreton Basico debit card costs 169.50 pesos after loss or theft and nothing after damage or on renewal, and a new Azul credit card costs 192 pesos, both before 16% IVA.',
      suspectWords: 'When BBVA sees an unusual purchase, it sends a notification in the BBVA app and turns the card off as a precaution, so new purchases are declined. Confirm the purchase in the app and the card turns back on by itself. Reject it, and the card stays off and a fraud report starts.',
    },
    'mx-santander': {
      lostCardWords: 'Block the card in the Santander app (Block and replacement), choose a reason, then order a replacement to collect at a branch. A card with your name on it is ready at your own branch in 3 to 5 business days, or any branch can hand you a card without your name at once. There’s no charge if a cash machine kept the card or you were a victim of fraud. Santander’s fees are before 16% IVA.',
    },
    'mx-banamex': {
      lostCardWords: 'Report the card in the Banamex app (swipe the card, then Report) or by phone. The card is canceled and a replacement is sent to the address Banamex has for you, or you can collect it at a branch by calling 55 1226 2639. A new MiCuenta or Perfiles debit card costs 125 pesos and a new Clasica credit card 130 pesos, both before IVA.',
      suspectWords: 'Banamex says it contacts you if it sees suspicious activity on your cards or in online banking, and that it will never ask for your PIN, passwords or text-message codes. It doesn’t say whether a purchase is held until you confirm it.',
    },
    'mx-banorte': {
      source: 'Folleto Informativo Cuenta Enlace Personal (banorte.com, read via Wayback Machine snapshot of March 21, 2026); Folleto Informativo Tarjeta de Credito Clasica FI-Clasica.pdf (banorte.com, read via Wayback Machine snapshot of May 15, 2026), as the live banorte.com timed out on every request; Clasica brochure valid January to June 2026; Enlace Personal brochure undated (its GAT figure is valid to October 2019, so the fee table may be old); read September 26, 2026',
      lostCardWords: 'Report a lost or stolen card to Banorte. On the Clasica credit card, Blindaje Banorte covers fraudulent charges made up to 48 hours before you report it, at no cost. A new Cuenta Enlace Personal debit card costs 125 pesos and a new Clasica credit card 170 pesos, both before IVA.',
      suspectWords: 'Banorte Avisa sends free text alerts to help you catch charges you don’t recognize. Its brochure doesn’t say whether a suspicious purchase is held until you confirm it.',
    },
    'gb-barclays': {
      replaceWords: 'Barclays’ June 2025 tariff has no fee for a standard replacement debit card. Its only charge is £12 for a temporary card collected from a branch. Lost, stolen and damaged cards are handled the same way, except that a damaged card keeps working for 28 days or until you use the new one.',
      lostCardWords: 'Barclays cancels the card and posts a replacement by second-class Royal Mail within seven working days, or five if you order it in Online Banking. In an emergency, some branches give you a temporary debit card on the spot for £12. It lasts 28 days, and you can have two a year. A Barclaycard credit card is blocked for good from the app and replaced within seven working days. Barclays says it tries to pass the new debit card’s details to shops that take regular payments from the old one (Visa tells most big retailers); you have to tell any others yourself.',
      suspectWords: 'Barclays texts you about a suspicious payment and asks you to reply Y or N, or calls you with an automated call. It says it may delay or decline an unusual payment, or block the account, until it’s sure you made it.',
    },
    'gb-lloyds': {
      lostCardWords: 'Lloyds cancels the card straight away, and you can’t undo it. A new card arrives in five working days. Its details show in the app the next day for a debit card, or within five days for a credit card, so you can use them online while the card is in the post.',
      suspectWords: 'When your spending looks like fraud, Lloyds usually calls you with an automated service to check the purchase, and you can speak to someone if it wasn’t you. Lloyds doesn’t say whether the payment is held until you confirm it.',
    },
    'gb-natwest': {
      replaceWords: 'NatWest’s credit card fee page doesn’t mention replacing a card. Its list of extra charges on its accounts says “Replacing lost or damaged cards: No Charge”.',
      lostCardWords: 'NatWest cancels the card, and sends a new PIN if someone may know the old one. The new card arrives within 10 working days; meanwhile you can use its details from See details in the app. Emergency cash from a cash machine after you report a card lost or stolen is free. NatWest’s account terms say it may sign a replacement card up to the card scheme’s automatic updater, which passes the new details to companies you pay, but its help pages still tell you to update your subscriptions yourself.',
      suspectWords: 'When NatWest blocks a card over suspected fraud, its fraud team texts you, calls with automated calls and leaves voicemails, then emails or writes to you. The block stays until you contact the fraud team.',
    },
    'gb-hsbc': {
      replaceWords: 'HSBC lists no fee for a replacement card on its account charges page, its credit card fees page or its personal banking terms (effective July 6, 2026).',
      lostCardWords: 'HSBC cancels the card straight away and posts a new one within 5 to 7 working days in the UK, or 12 working days abroad. You can add the new card to Apple Pay or Google Pay from the app before it arrives. If you find the old card, don’t use it without contacting HSBC first.',
      suspectWords: 'HSBC’s terms say that when there’s fraud, or it suspects fraud, it contacts you the quickest secure way, which might be a text or a call. It may block the card while it suspects fraud, and unblocks it once the reason has gone.',
    },
    'gb-santander': {
      replaceWords: 'Santander’s list of interest rates and fees for its checking accounts (April 28, 2025) has no fee for a replacement card. Lost, stolen and damaged cards are all reported the same way.',
      lostCardWords: 'Santander blocks the old card and sends a new one within 5 to 7 working days, with the same PIN unless you ask for a new one. Digital wallets keep working meanwhile, and a branch can get you cash if you bring ID. The new card has a new number, which doesn’t affect Direct Debits or standing orders.',
      suspectWords: 'Santander sometimes declines a payment that doesn’t look right, then checks with you by an app notification, a text to your registered mobile (reply Y or N) or a call. Once you confirm, you can make the payment again.',
    },
    'gb-nationwide': {
      replaceWords: 'Nationwide says it replaces broken or damaged cards free. Its Guide to your Current Account (January 2026) lists no fee for replacing a lost or stolen card either, but doesn’t say it’s free. For a damaged credit card, you have to call.',
      lostCardWords: 'Nationwide cancels the card and sends a new one, which you can use online as soon as it shows in the app. Nationwide says to freeze a card only if it’s misplaced, not if it’s really lost or stolen. A frozen card still lets regular card payments, Direct Debits and wallet payments through.',
      suspectWords: 'Nationwide blocks the card, then sends a fraud alert by app notification, two texts or an automated call. You have 2 hours to answer in the app before the alert moves to text. The card stays blocked until you reply, and works again within minutes of you confirming.',
    },
    'ie-aib': {
      replaceWords: 'AIB’s credit card fee page lists no fee for a replacement card, but doesn’t say it’s free either. Its fee guide for personal accounts lists a debit card and its replacement among the services with no charge.',
      lostCardWords: 'Report the card lost or stolen in the app, in online banking, at a branch kiosk or by phone at any hour. AIB cancels it and posts a new one to your address. A card in Apple Pay or Google Pay updates to the new card by itself: a debit card by 5 p.m. the next working day, a credit card at once.',
      suspectWords: 'AIB texts you the payment’s amount, the shop and the card’s last four digits, and asks you to reply 1 if it’s yours or 9 if not. Reply 9, and AIB puts a hold on the card and its cards team contacts you. If you don’t reply within 8 hours, AIB puts a hold on the card and you have to phone. Its answer to a 1 tells you to check whether the payment went through, so the payment itself may have been declined.',
    },
    'ie-bank-of-ireland': {
      replaceWords: 'The Personal Current Account section of Bank of Ireland’s 2025 fee schedule lists no fee for a replacement debit card. Its only replacement fee, €8.00 for a lost, stolen or damaged card, is for the ATM card on a deposit account. The Classic Credit Card fee page lists no replacement fee. A damaged credit card is reissued with the same number, security code and expiry date.',
      lostCardWords: 'Phone the 24-hour line. The bank cancels the card as soon as you report it and sends a new one to the address it has for you in 5 to 7 working days, and the game takes 7. You can be liable for losses up to the moment you report it.',
    },
    'ie-ptsb': {
      replaceWords: '€5.00 to replace a lost or stolen debit or credit card. The fee list charges only for a lost or stolen card; a damaged card is replaced another way, with no fee listed.',
      lostCardWords: 'Report it in the app, in Open24 online banking or by phone at any hour. PTSB cancels the card, and the new card and PIN arrive separately within 5 to 7 working days; the game takes 7. A debit card replaced as lost or stolen updates in your digital wallet by itself; one replaced as damaged or expired takes up to 2 business days.',
      suspectWords: 'PTSB may phone, text or write to you to check unusual activity. Its texts only ask you to reply Yes or No, or to call the fraud line, and a No blocks the card. PTSB also says it may block particular card and ATM payments it finds unusual until you call.',
    },
    'is-landsbankinn': {
      replaceWords: '1,900 kr for a new debit or credit card to replace a lost or stolen one. No fee is listed for a damaged card.',
      lostCardWords: 'Freeze the card in the app straight away, or call 410 4000 (525 2000 outside opening hours). Once you report it, the card is closed for a while or for good. The new card has a new number but works online as soon as it’s made, and the card itself follows in 5 to 10 working days, or 2 to 3 by express delivery; the game takes the longer of each.',
      suspectWords: 'Landsbankinn’s terms let it decline a payment and close a card when it has reasonable grounds to suspect fraud. It tells you it has closed the card, and reopens it if the suspicion turns out to be wrong. It doesn’t say whether it contacts you by text, app or phone.',
    },
    'is-arion': {
      replaceWords: '2,490 kr to reissue a lost debit or credit card. The credit card terms say a faulty card is replaced free.',
      lostCardWords: 'Freeze the card in the app and report it to customer service on 444 7000 (weekdays, 9 to 4) or the emergency line on 525 2000. If it turns up, you can unfreeze it in the app. While it’s frozen, subscriptions and phone or watch payments keep working.',
      suspectWords: 'Arion’s credit card terms say that when it has reasonable grounds to suspect fraud, it may decline payments and must tell you without delay, and it lets payments through again at once if the suspicion turns out to be wrong. It doesn’t say whether it tells you by text, app or phone.',
    },
    'is-islandsbanki': {
      replaceWords: 'A new or renewed debit card costs 1,100 kr, and reissuing a credit card 2,200 kr. The credit card terms charge the fee when a card was lost, and replace a faulty card free.',
      lostCardWords: 'Íslandsbanki’s terms ask you to freeze the card in its app at once and report it on 440-4000 (the emergency line is open 24 hours), and the card is then closed. For a replacement, you make a lost-card statement and apply for a new card. A credit card reported as temporarily lost can be reopened if you ask by the next banking day.',
      suspectWords: 'Íslandsbanki’s debit card terms say that when it has reasonable grounds to suspect fraud, it may decline payments and close the card, tells you without delay afterwards, and reopens it if the suspicion turns out to be wrong. It doesn’t say how it tells you.',
    },
    'fr-bnp-paribas': {
      replaceWords: 'BNP Paribas charges €15 to reissue a card before it expires, and nothing for Visa Premier, Visa Infinite and virtual cards, or if you have BNP Paribas Sécurité insurance. Blocking the card is free. It has no separate standard credit card, so the game prices its credit card as the deferred-debit Visa Classic, under the same line.',
      lostCardWords: 'Report the card lost or stolen in the app, on the website, on the 3477 line or at a branch. It takes effect at once, it’s free, and it can’t be undone; you then confirm it in writing. Unless you say otherwise, BNP Paribas orders a new card with a new number and PIN, which takes 5 business days, and a virtual card is ready right away.',
      suspectWords: 'When BNP Paribas spots suspicious activity, it texts you to call its 3477 line. It says its advisors will never phone you about fraud. It doesn’t say whether the payment is held until you confirm.',
    },
    'fr-societe-generale': {
      replaceWords: '€20 a card for damage or an early reissue, and €20 after a card is stopped for loss, theft or fraud. It’s free on normal renewal or when a card stops working, and included in the JAZZ and Sobrio packages. Société Générale also sells a separate revolving credit card (CB Visa Alterna), and the game charges the same fee to replace it.',
      lostCardWords: 'You can stop the card at any hour in the SG app or online. The block is immediate and permanent, and you’re told by text, app notification or email. A new card is made automatically and sent to your home or your branch, with the same PIN unless you ask for a new one. Delivery to your home is free, but a card reissued with a new PIN can only be collected at a branch.',
      suspectWords: 'Société Générale says it will never call to ask you to cancel, block, approve or confirm a payment, or to read out a code or your card number. If in doubt, hang up and call 3933 yourself. It doesn’t say how it flags a suspicious card payment itself. Passing your new card’s details to shops is a service you opt into, and it reaches only the online shops that take part.',
    },
    'fr-lcl': {
      replaceWords: '€13.30 to replace a card at your request (damage, a new design or an early reissue). The tariff lists no fee for a replacement after loss or theft, and stopping the card is free. LCL also sells a revolving Visa Crédit Renouvelable card, and the game charges the same fee to replace it.',
      lostCardWords: 'Stop the card at any hour in the LCL Mes Comptes app (the SOS Carte service) or by phone. A virtual card is ready in the app right away, until the new card arrives. Sending the card by registered mail or Chronopost costs €10 plus postage.',
      suspectWords: 'LCL sends fraud alerts by text or email and asks you to call its fraud line (+33 969 391 133). It doesn’t say whether the payment is held. Passing your new card’s details to online shops is a free option you turn on, its automatic card update.',
    },
    'fr-credit-agricole': {
      replaceWords: 'An early reissue costs €10 in the Île-de-France tariff. The figures in the scanned April 2026 table don’t line up with their rows, but the April 2025 table clearly shows €10. Stopping a card for loss or theft is free. There’s no separate price for replacing a lost or stolen card: it’s part of the account packages. Crédit Agricole has no separate standard credit card, so the game prices its credit card as the deferred-debit card, under the same line.',
      lostCardWords: 'Stop the card through your branch or the 24-hour line, 09 69 39 92 91, then confirm it by registered letter to your branch. Your advisor orders a new card, and you can use Crédit Agricole’s virtual card until it arrives.',
      suspectWords: 'Crédit Agricole says it will never ask you to approve or block payments remotely, or for codes it has texted you. If you suspect fraud, stop the card straight away. It doesn’t say how it flags a suspicious payment. Passing your new card’s details to shops is a setting you turn on in the Ma Banque app.',
    },
    'fr-la-banque-postale': {
      replaceWords: 'An early reissue (renouvellement anticipé) costs €15, and €15 for a cash-only card. Stopping a card is free. The tariff has no separate line for a replacement after loss or theft. La Banque Postale has no separate standard credit card, so the game prices its credit card as the deferred-debit Visa, under the same line.',
      lostCardWords: 'Stop the card at any hour in the app, online or on 3639. It’s blocked at once, you confirm it in writing, and the new card arrives within a few days.',
      suspectWords: 'La Banque Postale says it watches for suspicious payments and texts you when one is accepted or refused. If you didn’t make the payment, contact your advisor straight away. It will never ask for codes it has texted you.',
    },
    'de-deutsche-bank': {
      replaceWords: 'Deutsche Bank’s price list, under Bestellung einer Ersatzkarte (ordering a replacement card), lists the Deutsche Bank Card (a girocard debit card; the Card Plus is a Debit Mastercard) and every version of its Mastercard and Visa credit cards as free, whatever the reason.',
      lostCardWords: 'Block the card in online banking or the app (Services, then Card, then block or replace it) or on the 24-hour card line, 069 910-10035, and order a replacement in the same step. Deutsche Bank describes only blocking and replacing a card, not freezing it yourself for a while.',
      suspectWords: 'When a card payment looks unusual, Deutsche Bank texts your mobile at once, and you text back to say whether you made it. It doesn’t say whether the payment is held until you confirm.',
    },
    'de-commerzbank': {
      replaceWords: 'Commerzbank’s price list has no fee for replacing a credit card. A replacement girocard (with a Visa debit function) costs €15.00 when you ask for one because of a name change, an account switch you started, or a lost, stolen or misused card, unless the bank caused the problem. Its FAQ says a replacement for a faulty girocard is €15.00, and that one after loss or theft may be free.',
      lostCardWords: 'Block the card in the banking app or online banking (Karte sperren), or by phone; for credit cards, the card-block line, +49 69 5050 2040, is open at any hour. A lost or stolen credit card is replaced by post with a new card number and PIN; a replacement for a faulty card keeps both. You can lift a temporary block you set on a credit card, or a girocard block, in the app or online banking.',
    },
    'de-postbank': {
      replaceWords: 'Postbank’s price list (as of July 1, 2026) has no line for a replacement card, and its Karten vermisst page says blocking a card and the replacement cost €0.00. The debit card terms allow a price-list fee for a card replaced after loss, theft or misuse, where the bank isn’t responsible, but no such fee is listed. The debit card is the Postbank Card (a girocard with a Debit Mastercard function), and the credit card is the Postbank Mastercard (€29 a year).',
      lostCardWords: 'Block a debit card in online banking or the app, or by phone on 0228 5500 5500. Block a credit card by phone, on 0228 5500 5525, at any hour. A replacement card comes by post within a few days, with a new PIN sent separately after loss or theft; a replacement for a faulty card keeps the old PIN. Postbank doesn’t describe a way to freeze a card yourself for a while.',
    },
    'de-ing': {
      replaceWords: 'ING’s price list charges €10 for a replacement VISA Card (a debit card) or girocard, only if you caused the need for it (loss, theft, misuse, a fault or a name change). Its help page says something different: free after theft, loss or misuse, €10 for a fault, free on expiry, and €10 for a name change or a new card you ask for. ING has no standard credit card; its VISA Card is a debit card.',
      lostCardWords: 'Block the card in the ING app or online banking, or on 116 116 or 069 / 34 22 24. A permanent block can’t be undone, and a new card with a new number comes by post within a few days. A temporary block, on the VISA Card only, takes effect at once and you can lift it yourself.',
    },
    'de-berliner-sparkasse': {
      replaceWords: 'Replacing a Sparkassen-Card (a girocard debit card) or a Mastercard or Visa credit card costs €0.00 after loss, theft or misuse, €0.00 for a name change, and €15.00 for a damaged card, only where you caused the damage.',
      lostCardWords: 'Call 116 116 or the bank’s 24-hour lines (030 869 869 05 for the Sparkassen-Card, 030 245 524 00 for a credit card), or block the card online. Blocking is free. Tell the police about a theft: it’s the only way to stop the card being used for direct debits (ELV). The bank’s pages don’t confirm that a replacement is sent automatically. Card Control in the app only switches card functions off for a while; it isn’t a full block.',
      suspectWords: 'Card Control sends an app or email alert the moment someone tries to use a card function you’ve switched off. The bank doesn’t describe calling or texting you about suspected fraud.',
    },
    'es-santander': {
      replaceWords: '€5.00 for each duplicate card, charged only when the reason for it is your doing; Santander publishes no separate fees for loss, theft or damage. The same tariff has another line for a duplicate physical card, whose figure couldn’t be matched to its row with confidence, and €3.00 for delivery to your home if you ask for it.',
      lostCardWords: 'A card blocked for good after loss or theft can’t be turned back on, and Santander makes a replacement automatically. If the card may just be mislaid, you can switch it off in the app or online banking and back on when it turns up, without waiting for a new card.',
      suspectWords: 'Santander Spain’s own pages don’t say how it flags a suspicious payment. Its tariff lists an optional paid text alert service that tells you about every card payment, so you can spot fraud and block the card yourself. It doesn’t describe asking you to confirm or decline a payment.',
    },
    'es-bbva': {
      replaceWords: '€4.00 for a duplicate debit card and €6.00 for a duplicate credit card. Note 6 of the tariff says the fee is charged only when the reason for it is your doing. There are no separate fees for loss, theft or damage.',
      lostCardWords: 'Block the card in the app, on bbva.es or by phone, and BBVA sends a new card under the same contract. It keeps your PIN but has a new number, so the old card’s payment history doesn’t carry over. If you only limit the card or switch it off instead, you can switch the same card back on without a new one.',
      suspectWords: 'BBVA Spain’s pages don’t describe calling or texting you about suspected fraud. If someone tries to use a card you’ve switched off, you get a notification that it has to be switched back on. You can set up your own alerts in the app or on the web, and you report a payment you don’t recognize yourself, by app, web, cash machine or phone.',
    },
    'es-caixabank': {
      replaceWords: 'CaixaBank’s tariff for payment services lists Duplicado de tarjeta (a duplicate card) at €5.00, whatever the card and whether it was lost, stolen or damaged. Its English FAQ says an urgent or international replacement is priced when you ask for it, and in Spain a branch can hand you a replacement on the spot.',
      lostCardWords: 'Block the card, for a while or for good, in CaixaBankNow or CaixaBank Pay or by phone, and order the duplicate in the same step. In Spain you can also go to a branch to get a card at once, or turn on mobile payments.',
      suspectWords: 'CaixaBank says it sends fraud alerts and card-block notices by text, or as a notification in the CaixaBankNow app, when you need to know at once. It doesn’t describe declining a payment until you confirm it.',
    },
    'es-sabadell': {
      replaceWords: '€3.01 for each replacement card when the reason for it is your doing (section 3.7, for all cardholders). There are no separate fees for loss, theft or damage. Delivery to your home, if you ask for it, is another €3.01.',
      lostCardWords: 'In the app (My Card, then Turn off, block or replace), you can switch a missing card off and back on, or block it for good after loss or theft and ask for a replacement. Sabadell’s free card protection refunds fraudulent payments made in the 48 hours before you reported the loss or theft.',
      suspectWords: 'Sabadell’s free card protection texts you about every credit or debit card payment over €150, and you have to phone the bank at once if you didn’t make it. Sabadell’s pages don’t describe declining a payment until you confirm it.',
    },
    'es-bankinter': {
      replaceWords: 'No current fee for a duplicate debit card was found in Bankinter’s terms. An older card tariff, from 2012, listed €3.00 for a duplicate when the reason was your doing. Its pre-contract information for the Visa Clásica credit card charges €25 for each duplicate or second card.',
      lostCardWords: 'Asking for a duplicate blocks your card at once, and the new card comes by ordinary mail to your home within 5 days, not yet activated (5 business days for a new account’s card; you can collect it at a branch to save time). For a card that may just be lost, you can switch it off in the app or on the web and back on again, or block it for good.',
    },
    'jp-mufg': {
      replaceWords: 'Reissuing a cash card or MUFG Debit card after loss or theft costs ¥550, tax included, in the app, or ¥1,100 by phone or at a branch. A 2011 notice set reissuing an MUFG Card (a credit card) at ¥1,000 before consumption tax, and no current figure with tax was found. Gold and Platinum cards are reissued free. MUFG says a cash card takes about a week to ten days to arrive, so the game uses 8 business days.',
      lostCardWords: 'Report the loss in the MUFG app, which stops the card at once at any hour, or by phone to the loss center. You can ask for a new card in the same step, and it comes by registered mail, which isn’t forwarded. A reissued debit card has a new number.',
      suspectWords: 'On the MUFG Card, a suspicious charge is held while MUFG asks you to confirm it by email, text, an automated call or a call from an operator. If you say it wasn’t you, the card is replaced with a new number. The debit card emails you about each purchase.',
    },
    'jp-smbc': {
      replaceWords: 'Reissuing a cash card costs ¥1,100, tax included. Olive Flexible Pay is reissued free, except at the Olive Standard rank, which pays ¥1,100 after loss or theft. A Sumitomo Mitsui Card (a credit card) is reissued free online and for ¥1,100 by phone; Gold and above are free. Bank cards arrive in 1 to 2 weeks, so the game uses 10 business days. Credit cards take about a week to ten days.',
      lostCardWords: 'Report it online or by phone. The card company either stops the card for good and reissues it with a new number, or restricts it for a while, which can be lifted if the card turns up. A reissued credit or debit card always has a new number.',
      suspectWords: 'A fraud detection system, running at all hours, restricts the card when a charge looks like fraud, and contacts you by email, phone or text. Confirm through the link in the message that the charge was yours, and the card works again.',
    },
    'jp-mizuho': {
      replaceWords: 'Reissuing a cash card costs ¥1,100, tax included, after loss or theft, and nothing for a failed chip or stripe or for wear. The page also lists ¥550 for a switch or reissue, which looks like the online (Mizuho Direct) price. Reissuing a Mileage Club credit card costs ¥1,100, depending on the reason. A cash card arrives about 10 days after you ask at a branch, or 1 to 2 weeks online, so the game uses 10 business days. Credit and debit-linked cards take 2 to 4 weeks.',
      lostCardWords: 'Call your branch on a weekday, or the loss center at any hour, and Mizuho stops the card at once and explains how to get a new one. If you find a card you’ve reported lost, you can’t use it again until you reopen it at a branch.',
    },
    'jp-resona': {
      replaceWords: 'Resona says only that the Resona Card (a credit card) has a set reissue fee, without saying how much. Reissuing a cash card or a Resona Debit (Visa) card costs ¥1,100 a card, tax included, after loss, theft or a forgotten PIN, and nothing for a damaged card. Cards by post arrive in 10 to 14 days, so the game uses 10 business days. A branch can usually give you the card on the spot, with no charge listed beyond the reissue fee.',
      lostCardWords: 'Phone your branch on a weekday, or the after-hours center, to stop the card. You can also suspend the cash card or the debit function in the Resona Group app and turn it back on, but you still have to report a lost card to the bank. Order the replacement online or at a branch, where you normally get it the same day.',
      suspectWords: 'Resona watches the debit card for fraud at all hours, and asks you to check your statements and call 0120-24-3989 about any withdrawal you don’t recognize. It doesn’t say how it would contact you.',
    },
    'jp-japan-post-bank': {
      replaceWords: 'Reissuing a JP BANK Card (a credit card) may cost a fee that isn’t stated; the Gold card is free. A JP BANK credit card takes about a month to arrive. Reissuing a cash card or a passbook after loss or theft costs ¥1,100 each, tax included, and Yucho Debit may cost the same. A cash card arrives about 2 weeks after you ask, so the game uses 10 business days.',
      lostCardWords: 'Call the card loss center, open at all hours, or use the web form, and the bank stops the card. Apply for the replacement at a Japan Post Bank or post office counter with your passbook, seal and ID, and it comes by registered mail. If you find the card afterward, it stays stopped until you lift the stop in person at a counter.',
      suspectWords: 'Japan Post Bank watches Yucho Debit for fraud at all hours and emails you to confirm each use. You can switch the debit card off and on yourself on the Yucho Debit member website; the passbook app can’t stop a cash card.',
    },
    'kr-kb-kookmin': {
      replaceWords: 'No fee was found for a new KB Kookmin credit card. A check card’s first three reissues in a year are free; from the fourth, each costs ₩2,000, whatever the reason.',
      lostCardWords: 'Once you report a loss (on 1588-1688, in the KB Pay app or at a branch), the card can’t be used at all. If it turns up, you can lift the report in KB Pay, as long as the replacement hasn’t gone into production. Charges someone else made in the 60 days before your report can be partly compensated.',
      suspectWords: 'KB Kookmin Card’s fraud detection system scores every payment, at all hours. When one is flagged, you get a text and a call from its monitoring staff to check whether you made it.',
    },
    'kr-shinhan': {
      replaceWords: 'No fee was found for a new Shinhan credit card. A check card’s design fee (₩1,000 on the Pick E, for example) is charged only when the card is first issued, not when the same design is reissued, unless the card was closed first.',
      lostCardWords: 'Reporting a loss stops the card at once. If you’re abroad, Shinhan sends an emergency credit card to where you’re staying within 1 to 3 business days, depending on the card network. It can’t be used at a cash machine or online.',
    },
    'kr-hana': {
      lostCardWords: 'Report a loss or theft on 1800-1111, at any hour, and the card is stopped so nobody else can use it. You can then have a new card issued.',
    },
    'kr-nh': {
      lostCardWords: 'Report the loss online, at an NH NongHyup Bank branch or on 1644-4000. Once a replacement is registered, the old card stops working for good, even if you find it. A fraud claim of ₩500,000 or more costs ₩10,000 a card to process.',
    },
    'kr-kakaobank': {
      replaceWords: 'KakaoBank charges ₩2,000 to reissue its check card, only when it was lost or damaged. No fee was found for a credit card.',
      lostCardWords: 'You can first lock payments at home and abroad in the app, then report the loss in the app, by phone on 1599-8888 or through the chatbot, and order a new card. The old card closes by itself once you use the new one. After a reissue, only the customer center can lift the loss report.',
      suspectWords: 'When KakaoBank’s fraud detection flags a payment, it asks you to confirm it on a video call.',
    },
    'au-commbank': {
      replaceWords: 'An ordinary replacement in Australia is free: neither fee schedule lists a fee. An emergency card delivered to you, usually overseas, costs A$20, and CommBank says it can send one anywhere in the world for that.',
      suspectWords: 'Within seconds of possible fraud, an automated text asks you to reply yes if it was you or no if it wasn’t, and a no brings a call from a fraud agent. You can also turn on app alerts for suspicious payments.',
    },
    'au-westpac': {
      replaceWords: 'Westpac’s fee tables for personal accounts list no replacement fee. If you’re overseas, you pay the courier. A credit card sent by courier within Australia puts an A$25 courier charge on the card, and more for same-day delivery.',
      lostCardWords: 'Reporting the card lost or stolen cancels it for good, along with any extra cardholders’ cards, and orders a replacement with a new number. A digital card is ready in the Westpac App right away. If the card is just misplaced, you can lock it for up to 15 days instead.',
    },
    'au-nab': {
      replaceWords: 'NAB’s personal banking fee guide lists no fee for a replacement card; its only card fees are A$10 a month for a Platinum Visa Debit and A$20 to change a card’s color. If you lose a card overseas, Visa can issue a temporary emergency card, usually within 48 to 72 hours, which expires after two months.',
      suspectWords: 'The app sends a notification asking “Yes, it’s me” or “No, not me”, and the card may be blocked until you answer. Otherwise an automated text asks you to reply 1 or 0, and a 0 brings a call from a fraud specialist. Since June 2026 you can review flagged payments and unblock the card in the app.',
    },
    'au-anz': {
      replaceWords: 'ANZ’s account and credit card fee schedules list no replacement fee. There’s an A$50 Priority Fee if you ask for a card or PIN to be issued and delivered as a priority, and courier delivery overseas costs A$50.',
      lostCardWords: 'ANZ cancels the card you report and sends a replacement with a new number within 5 to 7 working days in Australia; a reissued card keeps its number only if it wasn’t reported lost or stolen. For a credit card, ANZ may also open a new card account and move the balance across.',
      suspectWords: 'When its fraud system flags an unusual card payment, ANZ may decline it or block the card, and usually texts you at once asking you to reply. Once you confirm the payment, the card should be unblocked within 15 minutes.',
    },
    'nz-anz': {
      replaceWords: 'NZ$5 a card for EFTPOS, Visa Debit and credit cards, lost and stolen included. Urgent delivery costs whatever the courier charges, in New Zealand or overseas. ANZ doesn’t replace a lost card while you’re overseas: it waits until you’re back in New Zealand. The replacement card in Apple Pay or Google Pay is free.',
      lostCardWords: 'Cancel the card in goMoney, Internet Banking or by phone, and it stops working for anything new (cash machine withdrawals can take up to 15 minutes to block). Direct debits set up on the Visa Debit number stop, and the card in Apple Pay or Google Pay is canceled and made again for the replacement. ANZ orders the replacement when you ask, and posts it.',
      suspectWords: 'ANZ Fraud Check texts or emails you about an unusual payment, and you reply Yes or No. The card may be blocked until you reply, and stays blocked if ANZ can’t reach you. A No cancels the card, and a replacement may be ordered.',
    },
    'nz-asb': {
      replaceWords: 'ASB lists no fee for replacing a Visa Debit or credit card. Only delivery overseas is charged, at the “applicable courier service fee”. Standard delivery takes 5 to 7 business days in New Zealand; overseas, it depends on local carriers.',
      lostCardWords: 'Cancel and replace the card in the ASB app (Cards & devices), in FastNet Classic, by phone or at a branch. The old card is canceled at once and the new one is posted within 5 to 7 business days. Apple Pay and Google Pay keep working, and switch to the new card’s details around 5 a.m. the next day.',
      suspectWords: 'ASB’s fraud monitoring may block a payment, and ASB then asks you whether you made it, by a card security alert, a call, an email or a text.',
    },
    'nz-bnz': {
      replaceWords: 'No fee when a card is replaced because it’s faulty, damaged, lost or stolen. If you choose courier delivery, there may be a courier charge, and BNZ doesn’t publish it.',
      lostCardWords: 'Call BNZ, or cancel the card in the app and order a replacement, which arrives within 10 business days. If the old card turns up, cut it up. The replacement arrives unblocked, but you have to activate it.',
      suspectWords: 'BNZ’s monitoring may decline suspicious payments or block the card for security. BNZ doesn’t say whether it texts or calls you; it asks you to call 0800 735 901 if you suspect fraud.',
    },
    'nz-westpac': {
      replaceWords: 'Replacing a Debit Mastercard or EFTPOS card costs NZ$10, and a credit card NZ$0, plus courier costs where they apply. Standard delivery takes 5 to 10 days. A credit card about to expire is reissued free the month before.',
      lostCardWords: 'Cancel the card in Westpac One or at a branch, and Westpac blocks the old card for good. The new card should arrive in 5 to 10 days, and Apple Pay or Google Pay keep working meanwhile. Mastercard’s Automatic Billing Updater doesn’t cover a card replaced because it was lost, stolen or used by someone else, so you update your regular payments yourself.',
      suspectWords: 'When a payment looks unusual, Westpac first tries to reach you by phone (8 a.m. to 9:30 p.m. local time), email or text. If it can’t, it may block the card for a while, and lifts the block at once if you confirm the spending was yours. If it’s fraud, the card is blocked for good and replaced.',
    },
    'nz-kiwibank': {
      replaceWords: 'Kiwibank’s fees guide (effective May 14, 2026) lists no fee to replace or courier a Visa Debit, EFTPOS or credit card. Lost, stolen or damaged Visa Debit and credit cards can be replaced; EFTPOS cards only if lost or stolen.',
      lostCardWords: 'Ordering a replacement in the app cancels the old card at once, and a new one comes by post within 10 business days. Apple Pay and Google Pay keep working. If the new card has a different number, you have to update your regular payments and saved card details yourself.',
      suspectWords: 'If Kiwibank notices unusual spending, it may text or email to ask whether you made the payment. If it can’t reach you and fraud looks likely, it may block the card until you speak to it.',
    },
  },
  FRAUD_LAW: {
    US: {
      debitWords: 'If you report a lost or stolen debit card within two business days of finding out, you pay at most $50 of what was taken before you told the bank. After two business days, the most you pay rises to $500. And if a payment you didn’t make is on a statement and you don’t report it within 60 days of the statement being sent, you can be made to pay all of what’s taken after those 60 days. The two days start when you find out; the 60 days start when the statement is sent. This is Regulation E, 12 CFR 1005.6(b), under the Electronic Fund Transfer Act.',
      creditWords: 'If someone uses your credit card without your permission, you pay at most $50, or less if less was spent before you told the card’s issuer. This is the Truth in Lending Act’s Regulation Z, 12 CFR 1026.12(b)(1)(ii).',
      refundWords: 'The bank has 10 business days to decide, or 20 for a payment in a new account’s first 30 days. If it needs longer, it must put the money back in your account for now within those 10 business days, and it can then take up to 45 days, or 90 for a debit card purchase, a payment made from outside the US or one on a new account. It tells you the result within 3 business days of deciding. This is Regulation E, 12 CFR 1005.11.',
    },
    CA: {
      debitWords: 'You don’t pay for losses you couldn’t control: fraud, theft or being forced to use the card, a technical failure, or use after you reported the card lost or stolen. If you contributed to the loss, say by choosing to share your PIN or by not reporting it in reasonable time, you can be made to pay, but no more than the card’s withdrawal limits, unless an overdraft or a linked credit line is attached. No law sets a dollar limit for debit cards: this is the voluntary Canadian Code of Practice for Consumer Debit Card Services, section 5.',
      creditWords: 'If someone uses your credit card without your permission, you pay at most C$50, unless you were grossly negligent (gross fault, in Quebec), and nothing after you report the card lost, stolen or at risk. A payment made with your PIN doesn’t prove gross negligence on its own. For card issuers that aren’t banks but are federally regulated, the FCAC says the limit is C$50 or the amount in your agreement, whichever is less. This is the Bank Act, S.C. 1991, c. 46, s. 627.33.',
      refundWords: 'Under the Debit Card Code of Practice, the bank must answer your report of a payment you didn’t make as soon as it can, within 10 business days, though it can stop that clock while it waits for a signed statement or affidavit from you. No law sets a deadline to refund a credit card payment.',
    },
    MX: {
      debitWords: 'Report charges you don’t recognize, and the bank must put back any made in the 48 hours before your report by the second banking business day. Older charges go through the general dispute process (aclaración) under Article 23 of the Ley para la Transparencia y Ordenamiento de los Servicios Financieros, which sets no limit in pesos on what you can lose. These are Banco de México’s card rules, in force since 2019, as CONDUSEF describes them.',
      creditWords: 'No law was found that limits what you pay, in pesos. The same Banco de México rules apply to credit cards: charges from the 48 hours before your report are put back by the second business day. Under Article 23 of the Ley para la Transparencia y Ordenamiento de los Servicios Financieros, you can hold back payment of a disputed charge until your claim is settled, with no interest or late fee and without being reported to a credit bureau.',
      refundWords: 'Charges from the 48 hours before your report come back by the second banking business day (Banco de México’s rules, as CONDUSEF describes them). For other disputes, the bank must answer within 45 days, or 180 for a payment abroad, under Article 23 of the LTOSF. CONDUSEF says a claim left unanswered is settled in your favor.',
    },
    GB: {
      debitWords: 'You can be made to pay up to £35 of what’s lost on a lost, stolen or misused card, and nothing if you couldn’t have noticed the loss before the payment, if the bank’s staff or agents caused it, if it happened after you told the bank, or if the bank didn’t apply strong customer authentication (a second check, such as a code sent to your phone) where it was required. If you acted fraudulently, or broke your obligations on purpose or through gross negligence, you pay all of it. This is the Payment Services Regulations 2017, reg. 77.',
      creditWords: 'If your credit card is misused, you can be made to pay at most £35, or your credit limit if that’s lower, and nothing once you’ve told the card’s issuer it’s lost or stolen (Consumer Credit Act 1974, s. 84(1) and (3)). The same £35 limit in the Payment Services Regulations 2017, reg. 77, covers cards too.',
      refundWords: 'Your bank must refund you as soon as it can, and by the end of the next business day after it learns of the payment, unless it has reasonable grounds to suspect you of fraud and reports it to the authorities under the Proceeds of Crime Act 2002. This is the Payment Services Regulations 2017, reg. 76.',
    },
    IE: {
      debitWords: 'You pay up to €50 of what’s lost on a lost, stolen or misused card, and nothing if you couldn’t have noticed the loss before the payment, if the bank’s staff or agents caused it, or if the bank didn’t ask for strong customer authentication (a second check, such as a code sent to your phone). If you acted fraudulently, or broke your obligations under reg. 93 on purpose or through gross negligence, there’s no limit. This is the European Union (Payment Services) Regulations 2018 (S.I. No. 6 of 2018), reg. 98, which brings in Article 74 of the EU’s PSD2.',
      creditWords: 'The same €50 limit covers credit cards, since they’re payment instruments under PSD2 (S.I. 6/2018, reg. 98).',
      refundWords: 'Your bank must refund you at once, and by the end of the next business day after it notices the payment or is told of it, unless it has reasonable grounds to suspect fraud and gives them to the Central Bank (S.I. 6/2018, reg. 97(1)).',
    },
    IS: {
      debitWords: 'You pay up to the value of €50 in krónur, at the official mid-rate, of what’s lost on a lost, stolen or misused card, and nothing if you couldn’t have noticed the loss, the bank’s staff caused it, it happened after you told the bank, or the bank didn’t ask for strong customer authentication (a second check, such as a code sent to your phone). If you acted fraudulently, or broke your duties under art. 75 on purpose or through gross negligence, there’s no limit. This is Iceland’s Payment Services Act, Lög um greiðsluþjónustu nr. 114/2021, art. 80, which brings in PSD2.',
      creditWords: 'The same limit, the value of €50 in krónur, covers credit cards too: art. 80 of Act 114/2021 applies to any payment instrument.',
      refundWords: 'Your bank must refund you at once, and by the end of the next business day after it finds out or is told. A bank that suspects fraud may refuse, and must report it to the Financial Supervisory Authority (Act 114/2021, art. 79).',
    },
    FR: {
      debitWords: 'Until you tell the bank, you pay up to €50 of what’s lost on a lost or stolen card, and nothing if the payment was made without your PIN or other security details, you couldn’t have noticed the loss, the bank’s staff caused it, the card was used remotely without your knowledge, it was copied while you still had it, or the bank didn’t ask for strong authentication. If you acted fraudulently, or broke your obligations under articles L133-16 and L133-17 on purpose or through gross negligence, you pay all of it. This is the Code monétaire et financier, art. L133-19.',
      creditWords: 'The same €50 limit, on the same terms, covers credit cards: art. L133-19 of the Code monétaire et financier applies to every payment instrument.',
      refundWords: 'Your bank must refund you by the end of the first business day after it learns of the payment (Code monétaire et financier, art. L133-18).',
    },
    DE: {
      debitWords: 'Your bank can make you pay up to €50 of what’s lost on a lost, stolen or misused card, and nothing if you couldn’t have noticed the loss, the bank’s staff caused it, or the bank didn’t ask for strong customer authentication (a second check, such as a code sent to your phone). If you acted fraudulently, or broke your duties under §675l on purpose or through gross negligence, you pay all of it. This is the Bürgerliches Gesetzbuch (BGB), §675v.',
      creditWords: 'The same €50 limit, on the same terms, covers credit cards: BGB §675v applies to every payment instrument (Zahlungsinstrument).',
      refundWords: 'Your bank must refund you without delay, and by the end of the business day after it’s told of the payment or learns of it (BGB §675u).',
    },
    ES: {
      debitWords: 'You can be made to pay up to €50 of what’s lost on a lost, stolen or misused card, and nothing if you couldn’t have noticed the loss or the bank’s staff caused it. You also pay nothing for online or phone payments made with only the details printed on the card, for anything after you told the bank, or where the bank didn’t ask for strong customer authentication (a second check, such as a code sent to your phone). If you acted fraudulently, or broke your duties under art. 41 on purpose or through gross negligence, there’s no limit. This is Real Decreto-ley 19/2018, art. 46.',
      creditWords: 'The same €50 limit, on the same terms, covers credit cards: art. 46 of RDL 19/2018 applies to every payment instrument.',
      refundWords: 'Your bank must refund you at once, and by the end of the business day after it notices the payment or is told of it, unless it has reasonable grounds to suspect fraud and tells the Bank of Spain in writing (RDL 19/2018, art. 45).',
    },
    JP: {
      debitWords: 'No law limits what you lose on debit card purchases. The Depositor Protection Act (Act No. 94 of 2005) covers only cash machine withdrawals with a forged or stolen cash card. A withdrawal with a forged card is treated as never made, unless you acted on purpose or with gross negligence (art. 4). For a stolen card, the bank must repay withdrawals made from 30 days before you promptly reported it (art. 5): in full, or three quarters if the bank proves you were negligent, and nothing if you were grossly negligent or a family member took it. Withdrawals before those 30 days aren’t covered.',
      creditWords: 'No law was found that limits what you pay when your credit card is misused in Japan: each card issuer’s member terms set the protection, not the law.',
    },
    KR: {
      debitWords: 'Your bank must pay for losses from a forged or altered card or login, a processing error, or details stolen by hacking, unless you acted on purpose or with gross negligence under a written agreement made beforehand (Electronic Financial Transactions Act, art. 9; art. 10 covers a lost or stolen card or login). From the moment the card company is told your debit card is lost or stolen, it pays for any use (Specialized Credit Financial Business Act, art. 16(1)). No law was found that limits what you lose before you tell it.',
      creditWords: 'The card company pays for use of your credit card in the 60 days before it’s told of the loss or theft, and for everything after (Specialized Credit Financial Business Act, art. 16(2), and its Enforcement Decree, art. 6-9(1)). A written contract can pass some or all of that to you if you were at fault (art. 16(3)). The card company also bears forged cards, details stolen by hacking and cards issued in someone else’s name (art. 16(5)), and it can’t collect an amount you dispute until it has investigated (art. 16(10)).',
      refundWords: 'No law was found that sets a deadline for a refund. A card company can’t collect a credit card amount you dispute until it has finished investigating (art. 16(10)).',
    },
    AU: {
      debitWords: 'You don’t pay where it’s clear you didn’t contribute to the loss (cl. 10.3), or for fraud or negligence by bank staff, shops or networks (cl. 10.1). Where a passcode was needed and no one can show who was at fault, you pay the least of A$150, the balance available, or what was lost before you reported it (cl. 11.7). If the bank proves you contributed through fraud, by not keeping your passcode secure or by reporting the loss unreasonably late, you pay what was actually lost before your report, within the daily limits and the balance (cl. 11.2, 11.5). This is ASIC’s ePayments Code (June 2022), which covers ATM, EFTPOS, credit card, online and mobile payments.',
      creditWords: 'The ePayments Code covers credit card payments too, so the same rules apply: nothing if you clearly weren’t at fault, and at most A$150 where no one can show who was (cl. 11.7). The card issuer also has to try to get the money back through the card scheme’s chargeback rules (cl. 11.10).',
      refundWords: 'Within 21 days of your report, the bank must finish investigating or tell you in writing that it needs more time, and it must finish within 45 days unless the circumstances are exceptional. The code sets no separate deadline for a refund (ePayments Code, cl. 18).',
    },
    NZ: {
      debitWords: 'If someone uses your card or online banking without your permission, the bank pays you back, as long as you weren’t dishonest or negligent, took reasonable care to protect your banking, and cooperate with it quickly. This is the New Zealand Banking Association’s Code of Banking Practice (the current edition, with its scam commitments from November 30, 2025), an industry code: no law sets a dollar limit.',
      creditWords: 'The Code of Banking Practice’s promise covers credit cards too: you’re paid back in full if you weren’t dishonest or negligent. No law sets a limit.',
      refundWords: 'Once the bank has the information it needs, it pays you back within 30 business days (Code of Banking Practice).',
    },
  },
};

// Each law's source line ends on the day it was read (batch 2, `read-days.mjs`): "read September 26, 2026", not a bare
// day after a web address. The banks' own source lines already say which day was read.
for (const [name, entries] of Object.entries(readDaysFor('src/engine/content/security.ts', { FRAUD_LAW: [] }))) {
  for (const [key, fields] of Object.entries(entries)) edits[name][key] = { ...edits[name][key], ...fields };
}

export default edits;
