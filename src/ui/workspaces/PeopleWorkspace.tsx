/**
 * People (`systems/people.ts`, from 2026-10-01): who you know, met at school
 * and at work, how near each is by the hours you've spent together, and an
 * invitation to a meal or to your home, which they answer and say why; and
 * asking somebody out, moving in together, and breaking up.
 */
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel } from '@/ui/components/primitives';
import { useFeature } from '@/ui/guide/Guide';
import { formatDate, instantFromZoned, MS_DAY, zonedParts } from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { CITIES } from '@/engine/content/geography';
import { RESTAURANTS } from '@/engine/content/restaurants';
import { diningQuote } from '@/engine/systems/dining';
import { billShare, divorceTerms, marriageCost, marryRefusal } from '@/engine/systems/marriage';
import { childBenefit, childrenOf, raisingMonth, tryRefusal } from '@/engine/systems/children';
import { APPS, MATCHES, appPrice } from '@/engine/systems/dating';
import { askingRefusal, contactsOf, inviteRefusal, levelOf, moveInRefusal, type Contact, type Invitation } from '@/engine/systems/people';

/** What somebody is to you: who you live with, your partner, who you're seeing, or how near by the hours. */
const standing = (c: Contact, spouse?: string): string => (c.id === spouse ? 'Your Spouse' : c.livesWith !== undefined ? 'Your Partner, Living With You' : c.dating?.couple !== undefined ? 'Your Partner' : c.dating ? `Seeing Each Other, ${c.dating.dates} ${c.dating.dates === 1 ? 'Date' : 'Dates'}` : levelOf(c));

export function PeopleWorkspace() {
  const person = useWorld((s) => s.player);
  const contacts = useWorld((s) => [...contactsOf(s.player)]);
  const [chosen, setChosen] = useState('');
  const picked = contacts.find((c) => c.id === chosen) ?? contacts[0];
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Life</div>
        <h1>People</h1>
        <p className="muted">Who you know, from school and from work. Time together is what makes a friend: about fifty hours a casual one, ninety a friend, two hundred a close one.</p>
      </div>
      <div className="col gap-5">
        <Panel title="Who You Know">
          {contacts.length === 0 ? <p className="small muted" style={{ margin: 0 }}>You don’t know anybody here yet: the class is known at the degree, and each job leaves you a castmate.</p> : (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">Name</th><th scope="col">Lives In</th><th scope="col">Met</th><th scope="col">Who They Are To You</th><th scope="col" className="num">Hours Together</th><th scope="col">Last Seen</th></tr></thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id} onClick={() => setChosen(c.id)} style={{ cursor: 'pointer' }} aria-selected={picked?.id === c.id}>
                      <td>{c.name}</td>
                      <td>{CITIES.get(c.cityId)?.name}</td>
                      <td className="small">{c.met.how === 'school' ? 'At School' : c.met.how === 'online' ? `Online: ${c.met.what ?? 'An App'}` : `At Work${c.met.what ? `: ${c.met.what}` : ''}`}</td>
                      <td>{standing(c, person.marriage?.contactId)}</td>
                      <td className="num">{Math.round(c.hours)}</td>
                      <td className="small">{c.lastSeen !== undefined ? formatDate(c.lastSeen, CITIES.require(c.cityId).timeZone) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        {picked && <Invite contact={picked} key={picked.id} homeCity={person.home?.cityId} />}
        <Family />
        <DatingPanel />
      </div>
    </>
  );
}

function Invite({ contact, homeCity }: { contact: Contact; homeCity?: string }) {
  const { sim, run, toast } = useGame();
  const invite = useFeature('social.invite');
  const zone = CITIES.require(contact.cityId).timeZone;
  const places = RESTAURANTS.filter((r) => r.cityId === contact.cityId && r.menu.some((m) => m.price !== null));
  const [what, setWhat] = useState<'meal' | 'visit'>(places.length ? 'meal' : 'visit');
  const [restaurantId, setRestaurantId] = useState(places[0]?.id ?? '');
  const r = places.find((x) => x.id === restaurantId) ?? places[0];
  const dishes = r ? r.menu.filter((m) => m.price !== null) : [];
  const [item, setItem] = useState('');
  const dish = dishes.find((m) => m.item === item) ?? dishes[0];
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(19);
  const today = zonedParts(sim.now, zone);
  const at = instantFromZoned({ year: today.year, month: today.month, day: today.day, hour, minute: 0 }, zone) + day * MS_DAY;
  const inv: Invitation = { contactId: contact.id, at, what, ...(what === 'meal' && r ? { restaurantId: r.id, item: dish?.item } : {}) };
  const no = inviteRefusal(sim, sim.player, inv);
  const cur = saveCurrency(sim.universe);
  const quote = what === 'meal' && r && dish ? diningQuote(sim, r, [dish.item], 'in') : undefined;
  const first = contact.name.split(' ')[0];
  return (
    <Panel title={`Ask ${first}`} subtitle={`${contact.name}, ${levelOf(contact)}, in ${CITIES.require(contact.cityId).name}`}>
      <div className="col gap-3">
        <div className="field-row">
          <div className="field">
            <label htmlFor="people-what">To</label>
            <select id="people-what" value={what} onChange={(e) => setWhat(e.target.value as 'meal' | 'visit')}>
              <option value="visit" disabled={!homeCity}>Come Over</option>
              {places.length > 0 && <option value="meal">A Meal Out</option>}
            </select>
          </div>
          {what === 'meal' && r && (
            <>
              <div className="field">
                <label htmlFor="people-where">Where</label>
                <select id="people-where" value={r.id} onChange={(e) => { setRestaurantId(e.target.value); setItem(''); }}>
                  {places.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="people-dish">You’ll Have</label>
                <select id="people-dish" value={dish?.item ?? ''} onChange={(e) => setItem(e.target.value)}>
                  {dishes.map((m) => <option key={m.item} value={m.item}>{m.item}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="field">
            <label htmlFor="people-day">Day</label>
            <select id="people-day" value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {Array.from({ length: 14 }, (_, i) => i).map((d) => <option key={d} value={d}>{d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : formatDate(sim.now + d * MS_DAY, zone)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="people-hour">At</label>
            <select id="people-hour" value={hour} onChange={(e) => setHour(Number(e.target.value))}>
              {Array.from({ length: 16 }, (_, i) => i + 8).map((h) => <option key={h} value={h}>{`${String(h).padStart(2, '0')}:00`}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn-sm" disabled={!invite.open || Boolean(no)} title={no ?? invite.reason} onClick={() => {
            const a = run<{ accepted: boolean; reason?: string }>('social.invite', { ...inv });
            if (a.ok) toast(a.value!.accepted ? `${first} said yes.` : `${first} said no: ${a.value!.reason}`, a.value!.accepted ? 'positive' : 'neutral');
          }}>{quote ? `Ask Them, Your Meal ${formatMoney(quote.total, cur, { cents: false })}` : 'Ask Them'}</button>
        </div>
        <Together contact={contact} />
        {contact.memory.length > 0 && (
          <ul className="small muted" style={{ margin: 0, paddingLeft: '1.2em' }}>
            {contact.memory.slice(0, 6).map((m, i) => <li key={i}>{formatDate(m.at, zone)}: {m.what}</li>)}
          </ul>
        )}
      </div>
    </Panel>
  );
}

/** Asking them out, moving in together, and breaking up (`systems/people.ts`). */
function Together({ contact }: { contact: Contact }) {
  const { sim, run, toast } = useGame();
  const askOut = useFeature('social.ask_out');
  const moveIn = useFeature('social.move_in');
  const breakUp = useFeature('social.break_up');
  const split = useFeature('social.split');
  const marry = useFeature('social.marry');
  const divorce = useFeature('social.divorce');
  const tryFor = useFeature('social.try_for_child');
  const noTry = tryRefusal(sim.player);
  const [ceremony, setCeremony] = useState<'registry' | 'wedding'>('registry');
  const [separate, setSeparate] = useState(false);
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const married = sim.player.marriage?.contactId === contact.id;
  const reg = marriageCost(sim, sim.player, false);
  const wed = marriageCost(sim, sim.player, true);
  const noMarry = marryRefusal(sim, sim.player, contact.id);
  const terms = married ? divorceTerms(sim, sim.player) : undefined;
  const mexico = (sim.player.home?.cityId ?? '').startsWith('mx-');
  const first = contact.name.split(' ')[0];
  const mine = askingRefusal(sim.player);
  const noMove = moveInRefusal(sim.player, contact);
  return (
    <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
      {!contact.dating && (
        <button type="button" className="btn btn-sm btn-ghost" disabled={!askOut.open || Boolean(mine)} title={mine ?? askOut.reason} onClick={() => {
          const a = run<{ accepted: boolean; reason?: string }>('social.ask_out', { contactId: contact.id });
          if (a.ok) toast(a.value!.accepted ? `${first} said yes.` : `${first} said no: ${a.value!.reason}`, a.value!.accepted ? 'positive' : 'neutral');
        }}>Ask Them Out</button>
      )}
      {contact.dating?.couple !== undefined && contact.livesWith === undefined && (
        <button type="button" className="btn btn-sm btn-ghost" disabled={!moveIn.open || Boolean(noMove)} title={noMove ?? moveIn.reason} onClick={() => { if (run('social.move_in', { contactId: contact.id }).ok) toast(`${first} moved in. Each of you pays half the rent and the bills.`, 'positive'); }}>Move In Together</button>
      )}
      {contact.dating && !married && (
        <button type="button" className="btn btn-sm btn-ghost" disabled={!breakUp.open} title={breakUp.reason} onClick={() => { if (run('social.break_up', { contactId: contact.id }).ok) toast(`You and ${first} broke up.`, 'neutral'); }}>Break Up</button>
      )}
      {contact.livesWith !== undefined && (
        <select aria-label="The Bills" value={sim.player.billSplit ?? 'even'} disabled={!split.open} title={split.reason} onChange={(e) => run('social.split', { how: e.target.value })} style={{ width: 'auto' }}>
          <option value="income">{`The Bills By What You Each Earn: Yours ${Math.round(billShare(sim, sim.player) * 100)}%`}</option>
          <option value="even">The Bills Split Evenly</option>
        </select>
      )}
      {contact.dating?.couple !== undefined && !married && (
        <>
          <select aria-label="The Ceremony" value={ceremony} onChange={(e) => setCeremony(e.target.value as 'registry' | 'wedding')} style={{ width: 'auto' }}>
            <option value="registry">{reg ? `A Civil Ceremony, ${money(reg.fee)}` : 'A Civil Ceremony'}</option>
            <option value="wedding">{wed ? `A Wedding, Your Share ${money(wed.fee + wed.wedding)}` : 'A Wedding'}</option>
          </select>
          {mexico && <label className="small row gap-1"><input type="checkbox" checked={separate} onChange={(e) => setSeparate(e.target.checked)} />Separate Property</label>}
          <button type="button" className="btn btn-sm btn-ghost" disabled={!marry.open || Boolean(noMarry)} title={noMarry ?? (reg ? reg.basis : marry.reason)} onClick={() => { const a = run<{ at: number }>('social.marry', { contactId: contact.id, wedding: ceremony === 'wedding', separate }); if (a.ok) toast(`Set for ${formatDate(a.value!.at, sim.zone)}.`, 'positive'); }}>Marry</button>
        </>
      )}
      {married && (
        <span className="small">{sim.player.marriage!.divorcing ? `Divorcing, Final ${formatDate(sim.player.marriage!.divorcing.finalAt, sim.zone)}` : `Married Since ${formatDate(sim.player.marriage!.at, sim.zone)}`}</span>
      )}
      {married && !sim.player.marriage!.divorcing && (
        <button type="button" className="btn btn-sm btn-ghost" disabled={!divorce.open} title={terms ? `${terms.basis}: ${money(terms.fee)}, and ${money(terms.settlement)} on the division as things stand` : divorce.reason} onClick={() => { const a = run<{ finalAt: number }>('social.divorce', {}); if (a.ok) toast(`It’s final on ${formatDate(a.value!.finalAt, sim.zone)}.`, 'neutral'); }}>Ask For A Divorce</button>
      )}
      {contact.livesWith !== undefined && (
        <button type="button" className="btn btn-sm btn-ghost" disabled={!tryFor.open || (!sim.player.trying && Boolean(noTry))} title={(!sim.player.trying ? noTry : undefined) ?? tryFor.reason} onClick={() => { const a = run<{ trying: boolean }>('social.try_for_child', { trying: !sim.player.trying }); if (a.ok) toast(a.value!.trying ? 'Trying for a child.' : 'Not trying for now.', 'neutral'); }}>{sim.player.trying ? 'Stop Trying' : 'Try For A Child'}</button>
      )}
      {contact.income && contact.dating?.couple !== undefined && <span className="xs dim">{contact.income.employed ? `Earns ${formatMoney(Math.round(contact.income.annual * 100), contact.income.currency, { cents: false })} A Year` : 'Not Working'}</span>}
    </div>
  );
}

/** Children, and a child on the way (`systems/children.ts`). */
function Family() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const kids = childrenOf(person);
  if (!kids.length && !person.pregnancy) return null;
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const age = (born: number) => Math.floor((sim.now - born) / (365.2425 * MS_DAY));
  return (
    <Panel title="Your Family" subtitle={`Raising them, your share: ${money(raisingMonth(sim, person, sim.now))} A Month; the State’s Child Benefit: ${money(childBenefit(sim, person, sim.now))} A Month`}>
      <div className="col gap-1 small">
        {person.pregnancy && <div>{`A Baby Due ${formatDate(person.pregnancy.due, sim.zone)}`}</div>}
        {kids.map((k) => <div key={k.id}>{`${k.name}, ${age(k.born)}`}</div>)}
      </div>
    </Panel>
  );
}

/** A dating app (`systems/dating.ts`): free or paid, matches each month in your town. */
function DatingPanel() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const app = useFeature('dating.app');
  const cur = saveCurrency(sim.universe);
  const sold = APPS.map((a) => ({ a, price: appPrice(sim, person, a.label) })).filter((x) => x.price !== undefined).sort((x, y) => x.price! - y.price!);
  return (
    <Panel title="Join A Dating App" subtitle={person.datingApp ? `On ${person.datingApp.label}` : 'Matches in your town each month, who aren’t from the business'}>
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        {sold.map(({ a, price }) => (
          <button key={a.label} type="button" className="btn btn-sm btn-ghost" disabled={!app.open || person.datingApp?.label === a.label} title={app.reason} onClick={() => { if (run('dating.app', { label: a.label }).ok) toast(`On ${a.label}.`, 'positive'); }}>{`${a.label}, ${price ? `${formatMoney(price, cur, { cents: false })} A Month` : 'Free'}, ${MATCHES[a.tier]} ${MATCHES[a.tier] === 1 ? 'Match' : 'Matches'} A Month`}</button>
        ))}
        {person.datingApp && <button type="button" className="btn btn-sm btn-ghost" disabled={!app.open} title={app.reason} onClick={() => { if (run('dating.app', {}).ok) toast('Off the app.', 'neutral'); }}>Leave The App</button>}
      </div>
    </Panel>
  );
}
