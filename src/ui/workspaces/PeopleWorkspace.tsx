/**
 * People (`systems/people.ts`, from 2026-10-01): who you know, met at school
 * and at work, how near each is by the hours you've spent together, and an
 * invitation to a meal or to your home, which they answer and say why.
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
import { contactsOf, inviteRefusal, levelOf, type Contact, type Invitation } from '@/engine/systems/people';

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
                      <td className="small">{c.met.how === 'school' ? 'At School' : `At Work${c.met.what ? `: ${c.met.what}` : ''}`}</td>
                      <td>{levelOf(c)}</td>
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
        {contact.memory.length > 0 && (
          <ul className="small muted" style={{ margin: 0, paddingLeft: '1.2em' }}>
            {contact.memory.slice(0, 6).map((m, i) => <li key={i}>{formatDate(m.at, zone)}: {m.what}</li>)}
          </ul>
        )}
      </div>
    </Panel>
  );
}
