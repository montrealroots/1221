/**
 * People (`systems/people.ts`, from 2026-10-01): who you know, met at school
 * and at work, how near each is by the hours you've spent together, and an
 * invitation to a meal or to your home, which they answer and say why; and
 * asking somebody out, moving in together, and breaking up.
 */
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { DROP_INS } from '@/engine/content/dropins';
import { dropInPrice } from '@/engine/systems/life';
import { Panel } from '@/ui/components/primitives';
import { useFeature } from '@/ui/guide/Guide';
import { formatDate, formatTime, instantFromZoned, MS_DAY, zonedParts } from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { CITIES } from '@/engine/content/geography';
import { RESTAURANTS } from '@/engine/content/restaurants';
import { diningQuote } from '@/engine/systems/dining';
import { billShare, divorceTerms, marriageCost, marryRefusal } from '@/engine/systems/marriage';
import { childBenefit, childrenOf, raisingMonth, tryRefusal } from '@/engine/systems/children';
import { childPassportRefusal, childPassportTerms } from '@/engine/systems/childpassports';
import { APPS, MATCHES, appPrice } from '@/engine/systems/dating';
import { adoptRefusal, adoptionRoute, pathCost } from '@/engine/systems/adoption';
import { Gated } from '@/ui/guide/Guide';
import { supportLines } from '@/engine/systems/support';
import { careHours, careRefusal, formatCare, needsCare, parentsOf, type Parent } from '@/engine/systems/parents';
import { MEET_KIND, NEW_HAVEN_OUTINGS, askingRefusal, atSchoolWith, cancelRefusal, contactsOf, inviteRefusal, levelOf, moveInRefusal, outingPrice, type Contact, type Invitation, type InvitationKind } from '@/engine/systems/people';
import { LookRegion, Open, at } from '@/ui/looks';
import { dateKey } from '@/engine/core/time';
import { groupLabelOf } from '@/ui/shell/destinations';
import { homeCourts } from '@/engine/systems/dwelling';
import { hostRefusal, type Gathering } from '@/engine/systems/hosting';
import { livingIn } from '@/engine/systems/homes';
import { seatsAtHome } from '@/engine/systems/furnishings';
import { RECIPES } from '@/engine/content/groceries';
import { cookRefusal, servingsRange } from '@/engine/systems/kitchen';
import { ClubsPanel } from '@/ui/components/ClubsPanel';
const COURT_LABEL = { tennis: 'Tennis', basketball: 'Basketball', pickleball: 'Pickleball', football: 'Football' } as const;
import { HALL } from '@/engine/content/people';
import { STAY_NIGHTS, stayRefusal } from '@/engine/systems/houseguests';
import { foodOf } from '@/engine/systems/household';
import { answerRefusal, askWords, askedBy } from '@/engine/systems/reachingout';

/** What somebody is to you: who you live with, your partner, who you're seeing, or how near by the hours. */
const standing = (c: Contact, spouse?: string): string => (c.id === spouse ? 'Your Spouse' : c.livesWith !== undefined ? 'Your Partner, Living With You' : c.dating?.couple !== undefined ? 'Your Partner' : c.dating ? `Seeing Each Other, ${c.dating.dates} ${c.dating.dates === 1 ? 'Date' : 'Dates'}` : levelOf(c));

export function PeopleWorkspace() {
  const { sim } = useGame();
  const person = useWorld((s) => s.player);
  const contacts = useWorld((s) => [...contactsOf(s.player)]);
  const [chosen, setChosen] = useState('');
  const picked = contacts.find((c) => c.id === chosen) ?? contacts[0];
  return (
    <>
      <div className="page-head">
        <div className="eyebrow">{groupLabelOf('/workspace/people')}</div>
        <h1>People</h1>
        <p className="muted">Who you know, from school and from work. Time together is what makes a friend: about {HALL.casual} hours a casual one, {HALL.friend} a friend, {HALL.close} a close one.</p>
      </div>
      <div className="col gap-5">
        <Panel title="Who You Know">
          {contacts.length === 0 ? <p className="small muted" style={{ margin: 0 }}>You don’t know anybody here yet: the class is known at the degree, and each job leaves you a castmate.</p> : (
            <LookRegion className="table-scroll">
              <table>
                <thead><tr><th scope="col">Name</th><th scope="col">Lives In</th><th scope="col">Met</th><th scope="col">Who They Are To You</th><th scope="col" className="num">Hours Together</th><th scope="col">Last Seen</th></tr></thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id} onClick={() => setChosen(c.id)} style={{ cursor: 'pointer' }} aria-selected={picked?.id === c.id}>
                      <td><Open subject={at('contact', c.id)}>{c.name}</Open></td>
                      <td><Open subject={at('place', c.cityId)}>{CITIES.get(c.cityId)?.name}</Open></td>
                      <td className="small">{c.met.how === 'school' ? 'At School' : c.met.how === 'club' ? `At ${c.met.what ?? 'A Club'}` : c.met.how === 'online' ? `Online: ${c.met.what ?? 'An App'}` : `At Work${c.met.what ? `: ${c.met.what}` : ''}`}</td>
                      <td>{standing(c, person.marriage?.contactId)}</td>
                      <td className="num">{Math.round(c.hours)}</td>
                      <td className="small">{c.lastSeen !== undefined ? <Open subject={at('day', dateKey(c.lastSeen, sim.homeZone))}>{formatDate(c.lastSeen, CITIES.require(c.cityId).timeZone)}</Open> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </LookRegion>
          )}
        </Panel>
        <AskedYou />
        <YourPlans />
        {picked && <Invite contact={picked} key={picked.id} homeCity={person.home?.cityId} />}
        {person.home && person.home.kind !== 'sofa' && contacts.some((c) => c.cityId === person.home!.cityId) && <HaveFriendsOver />}
        <ClubsPanel />
      <Classes />
        <Family />
        <Parents />
        <DatingPanel />
      </div>
    </>
  );
}


/**
 * The meetings on your calendar with people you know (from 2026-10-08): each
 * called off (with a day's notice it costs nothing; at shorter, they wait a
 * few days before making plans) or moved to the next day at the same hour,
 * which they take or don't as they would an invitation.
 */
function YourPlans() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const plans = sim.universe.scheduled.filter((x) => x.kind === MEET_KIND && x.status === 'pending' && x.payload.personId === person.id).sort((a, b) => a.at - b.at).slice(0, 8);
  if (plans.length === 0) return null;
  return (
    <Panel title="Your Plans" subtitle="Called off with a day’s notice, it costs nothing">
      <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>
        {plans.map((p) => {
          const c = contactsOf(person).find((x) => x.id === p.payload.contactId);
          const zone = CITIES.require(c?.cityId ?? person.currentLocationId).timeZone;
          const no = cancelRefusal(sim, person, p.id);
          const late = p.at - sim.now < MS_DAY;
          return (
            <li key={p.id} className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <span>{p.label}, {formatDate(p.at, zone)} at {formatTime(p.at, zone)}</span>
              <Gated feature="social.cancel" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? (late ? 'Short notice: they’ll wait a few days before making plans' : 'With notice: it costs nothing')} onClick={() => { const r = run<{ late: boolean }>('social.cancel', { itemId: p.id }); if (r.ok) toast(r.value!.late ? 'Called off, at short notice.' : 'Called off, with notice.', 'neutral'); }}>Call It Off</Gated>
              <Gated feature="social.reschedule" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? 'The next day, the same hour, if it suits them'} onClick={() => { const r = run<{ moved: boolean; reason?: string }>('social.reschedule', { itemId: p.id, at: p.at + MS_DAY }); if (r.ok) toast(r.value!.moved ? 'Moved to the next day.' : `It didn’t suit them: ${r.value!.reason}`, r.value!.moved ? 'positive' : 'neutral'); }}>The Next Day Instead</Gated>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** What friends have asked you to, a meal, a visit, a game or a class (`social.answer`, from 2026-10-06): yes, and it's on the calendar; no; or left, and it lapses. */
function AskedYou() {
  const { sim, run, toast } = useGame();
  const asked = useWorld((s) => askedBy(s.player));
  const answer = useFeature('social.answer');
  if (asked.length === 0) return null;
  return (
    <Panel title="Asked You Out" subtitle="Friends who asked first; unanswered, it lapses at its hour">
      <ul className="small" style={{ margin: 0, paddingLeft: '1.1rem' }}>
        {asked.map((c) => {
          const a = c.ask!;
          const first = c.name.split(' ')[0];
          const no = answerRefusal(sim, sim.player, c.id, true);
          return (
            <li key={c.id} className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <span>{c.name}: {askWords(a)}, {formatDate(a.at, CITIES.require(c.cityId).timeZone)} at {formatTime(a.at, CITIES.require(c.cityId).timeZone)}{a.item ? `, ${a.item}` : ''}</span>
              <Gated feature="social.answer" className="btn btn-sm btn-ghost" disabled={Boolean(no)} title={no ?? answer.reason} onClick={() => { if (run('social.answer', { contactId: c.id, yes: true }).ok) toast(`It’s on the calendar with ${first}.`, 'positive'); }}>Say Yes</Gated>
              <Gated feature="social.answer" className="btn btn-sm btn-ghost" title={answer.reason} onClick={() => { if (run('social.answer', { contactId: c.id, yes: false }).ok) toast(`You told ${first} another time.`, 'neutral'); }}>Say No</Gated>
              {(() => {
                const later = a.at + MS_DAY;
                const no2 = answerRefusal(sim, sim.player, c.id, false, later);
                return (
                  <Gated feature="social.answer" className="btn btn-sm btn-ghost" disabled={Boolean(no2)} title={no2 ?? `Ask for ${formatDate(later, CITIES.require(c.cityId).timeZone)} instead`}
                    onClick={() => { const r = run<{ at?: number; reason?: string }>('social.answer', { contactId: c.id, yes: false, at: later }); if (r.ok) toast(r.value!.at ? `${first} can do the next day.` : `${first} can’t: ${r.value!.reason}`, r.value!.at ? 'positive' : 'neutral'); }}>
                    The Next Day Instead
                  </Gated>
                );
              })()}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** Yoga and dance classes in the town you're in, taken one at a time at each studio's single price (`content/dropins.ts`). */
function Classes() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const take = useFeature('class.take');
  const here = DROP_INS.filter((c) => c.cityId === person.currentLocationId).map((c) => ({ c, price: dropInPrice(sim, c) })).sort((a, b) => a.price - b.price);
  if (here.length === 0) return null;
  const cur = saveCurrency(sim.universe);
  return (
    <Panel title="Classes" subtitle="Yoga and dance, one class at a time, an hour each">
      <div className="col gap-1">
        {here.map(({ c, price }) => (
          <div key={c.id} className="row-between small">
            <span>{`${c.studio}: ${c.label}`}</span>
            <button type="button" className="btn btn-sm btn-ghost" disabled={!take.open} title={take.reason ?? `The Compendium’s ${c.met} METs`} onClick={() => { if (run('class.take', { classId: c.id }).ok) toast(`${c.label}, at ${c.studio}.`, 'positive'); }}>{`Take It, ${formatMoney(price, cur, { cents: false })}`}</button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** Friends asked home together, for dinner or drinks (`systems/hosting.ts`): as many as there are seats for, a dinner at a table. */
function HaveFriendsOver() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const zone = CITIES.require(person.home!.cityId).timeZone;
  const near = contactsOf(person).filter((c) => c.cityId === person.home!.cityId && !c.rival);
  const [asked, setAsked] = useState<string[]>([]);
  const [what, setWhat] = useState<Gathering>('dinner');
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(19);
  const [recipeId, setRecipeId] = useState('');
  const today = zonedParts(sim.now, zone);
  const when = instantFromZoned({ year: today.year, month: today.month, day: today.day, hour, minute: 0 }, zone) + day * MS_DAY;
  const room = seatsAtHome(person);
  // A recipe that cooks for everyone, as the kitchen has it now; it's checked again on the night.
  const recipes = RECIPES.filter((r) => servingsRange(r).most >= asked.length + 1);
  const no = hostRefusal(sim, person, asked, when, what);
  const toggle = (id: string) => setAsked((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  return (
    <Panel title="Have Friends Over" subtitle={`Seats For ${room.seats}, A Table For ${room.table}`}>
      <div className="col gap-3">
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          {near.map((c) => (
            <label key={c.id} className="small row gap-1" style={{ alignItems: 'center' }}>
              <input type="checkbox" checked={asked.includes(c.id)} onChange={() => toggle(c.id)} />{c.name}
            </label>
          ))}
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="host-what">For</label>
            <select id="host-what" value={what} onChange={(e) => setWhat(e.target.value === 'drinks' || e.target.value === 'film' ? e.target.value : 'dinner')}>
              <option value="drinks">Drinks</option>
              <option value="dinner">Dinner</option>
              {livingIn(person)?.facts.features.includes('homeTheater') && <option value="film">A Film In The Theater</option>}
            </select>
          </div>
          <div className="field">
            <label htmlFor="host-day">Day</label>
            <select id="host-day" value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {Array.from({ length: 14 }, (_, i) => i).map((d) => <option key={d} value={d}>{d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : formatDate(sim.now + d * MS_DAY, zone)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="host-hour">At</label>
            <select id="host-hour" value={hour} onChange={(e) => setHour(Number(e.target.value))}>
              {Array.from({ length: 13 }, (_, i) => i + 10).map((h) => <option key={h} value={h}>{`${String(h).padStart(2, '0')}:00`}</option>)}
            </select>
          </div>
          {what === 'dinner' && (
            <div className="field">
              <label htmlFor="host-recipe">Cook</label>
              <select id="host-recipe" value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
                <option value="">Nothing Particular, At A Meal’s Price</option>
                {recipes.map((r) => <option key={r.id} value={r.id}>{`${r.name}${cookRefusal(sim, person, r.id, asked.length + 1) ? ' (Not In The Kitchen Now)' : ''}`}</option>)}
              </select>
            </div>
          )}
          <Gated feature="social.host" className="btn btn-sm" disabled={Boolean(no)} title={no} onClick={() => {
            const a = run<{ coming: string[]; declined: { contactId: string; reason: string }[] }>('social.host', { contactIds: asked, at: when, what, ...(what === 'dinner' && recipeId ? { recipeId } : {}) });
            if (a.ok) { toast(a.value!.coming.length ? `${a.value!.coming.length} coming${a.value!.declined.length ? `; ${a.value!.declined.map((d) => d.reason).join(' ')}` : '.'}` : `Nobody can come: ${a.value!.declined.map((d) => d.reason).join(' ')}`, a.value!.coming.length ? 'positive' : 'neutral'); setAsked([]); }
          }}>Ask Them Over</Gated>
        </div>
        {no && asked.length > 0 && <div className="xs dim">{no}</div>}
        <div className="xs dim">A dinner is cooked for everyone at what a meal at home costs here, or from a recipe you choose where the kitchen has it for everyone on the night, and sits everyone at your table; each guest is poured a drink from the beer and wine in the kitchen, as far as it goes. A home in a mess is noticed.</div>
      </div>
    </Panel>
  );
}

function Invite({ contact, homeCity }: { contact: Contact; homeCity?: string }) {
  const { sim, run, toast } = useGame();
  const invite = useFeature('social.invite');
  const zone = CITIES.require(contact.cityId).timeZone;
  const places = RESTAURANTS.filter((r) => r.cityId === contact.cityId && r.menu.some((m) => m.price !== null));
  const [what, setWhat] = useState<InvitationKind>(places.length ? 'meal' : 'visit');
  const classes = DROP_INS.filter((d) => d.cityId === contact.cityId);
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const courts = homeCourts(sim.player);
  const [court, setCourt] = useState(courts[0]?.court ?? 'tennis');
  const [restaurantId, setRestaurantId] = useState(places[0]?.id ?? '');
  const r = places.find((x) => x.id === restaurantId) ?? places[0];
  const dishes = r ? r.menu.filter((m) => m.price !== null) : [];
  const [item, setItem] = useState('');
  const dish = dishes.find((m) => m.item === item) ?? dishes[0];
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(19);
  const [counter, setCounter] = useState<number | undefined>(undefined);
  const today = zonedParts(sim.now, zone);
  const at = instantFromZoned({ year: today.year, month: today.month, day: today.day, hour, minute: 0 }, zone) + day * MS_DAY;
  const inv: Invitation = { contactId: contact.id, at, what, ...(what === 'meal' && r ? { restaurantId: r.id, item: dish?.item } : {}), ...(what === 'play' ? { court } : {}), ...(what === 'class' ? { classId } : {}) };
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
            <select id="people-what" value={what} onChange={(e) => setWhat(e.target.value as InvitationKind)}>
              <option value="visit" disabled={!homeCity}>Come Over</option>
              {places.length > 0 && <option value="meal">A Meal Out</option>}
              {courts.length > 0 && <option value="play" disabled={!homeCity}>Come Over To Play</option>}
              {classes.length > 0 && <option value="class">A Class Together</option>}
              <option value="walk" disabled={!homeCity}>A Walk In The Park</option>
              {homeCity && outingPrice(sim, homeCity, 'film') !== undefined && <option value="film">A Film At The Cinema</option>}
              {homeCity && outingPrice(sim, homeCity, 'pint') !== undefined && <option value="pint">A Pint At A Bar</option>}
              {atSchoolWith(sim.player, contact) && <option value="study">Study Together At The Library</option>}
              {contact.cityId === NEW_HAVEN_OUTINGS.cityId && <option value="coffee">A Coffee At Atticus Market</option>}
              {contact.cityId === NEW_HAVEN_OUTINGS.cityId && <option value="show">A Show At The Yale Cabaret</option>}
            </select>
          </div>
          {what === 'class' && (
            <div className="field">
              <label htmlFor="people-class">Class</label>
              <select id="people-class" value={classId} onChange={(e) => setClassId(e.target.value)}>
                {classes.map((c) => <option key={c.id} value={c.id}>{`${c.label}, ${c.studio}`}</option>)}
              </select>
            </div>
          )}
          {what === 'play' && courts.length > 1 && (
            <div className="field">
              <label htmlFor="people-court">Play</label>
              <select id="people-court" value={court} onChange={(e) => setCourt(e.target.value as typeof court)}>
                {courts.map((c) => <option key={c.court} value={c.court}>{COURT_LABEL[c.court]}</option>)}
              </select>
            </div>
          )}
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
            const a = run<{ accepted: boolean; reason?: string; counter?: number }>('social.invite', { ...inv });
            if (a.ok) { setCounter(a.value!.counter); toast(a.value!.accepted ? `${first} said yes.` : `${first} said no: ${a.value!.reason}`, a.value!.accepted ? 'positive' : 'neutral'); }
          }}>{quote ? `Ask Them, Your Meal ${formatMoney(quote.total, cur, { cents: false })}` : 'Ask Them'}</button>
        </div>
        {counter !== undefined && counter > sim.now && (
          <div className="row gap-2 small" style={{ alignItems: 'center' }}>
            <span>{first} could do {formatDate(counter, zone)} at {formatTime(counter, zone)}.</span>
            <button type="button" className="btn btn-sm btn-ghost" disabled={!invite.open} title={invite.reason} onClick={() => {
              const a = run<{ accepted: boolean; reason?: string }>('social.invite', { ...inv, at: counter });
              if (a.ok) { setCounter(undefined); toast(a.value!.accepted ? `It’s on the calendar with ${first}.` : `${first} said no: ${a.value!.reason}`, a.value!.accepted ? 'positive' : 'neutral'); }
            }}>Take That Time</button>
          </div>
        )}
        <Together contact={contact} />
        {homeCity && homeCity !== contact.cityId && <ComeToStay contact={contact} homeCity={homeCity} />}
        {contact.memory.length > 0 && (
          <ul className="small muted" style={{ margin: 0, paddingLeft: '1.2em' }}>
            {contact.memory.slice(0, 6).map((m, i) => <li key={i}>{formatDate(m.at, zone)}: {m.what}</li>)}
          </ul>
        )}
      </div>
    </Panel>
  );
}

/** A friend from another town asked to stay in the guest room, or their stay called off before they come (`systems/houseguests.ts`). */
function ComeToStay({ contact, homeCity }: { contact: Contact; homeCity: string }) {
  const { sim, run, toast } = useGame();
  const ask = useFeature('social.ask_to_stay');
  const cancel = useFeature('social.cancel_stay');
  const zone = CITIES.require(homeCity).timeZone;
  const [day, setDay] = useState(7);
  const [hour, setHour] = useState(15);
  const [nights, setNights] = useState(3);
  const today = zonedParts(sim.now, zone);
  const from = instantFromZoned({ year: today.year, month: today.month, day: today.day, hour, minute: 0 }, zone) + day * MS_DAY;
  const first = contact.name.split(' ')[0];
  const stay = contact.stay;
  const cur = saveCurrency(sim.universe);
  const food = foodOf(sim, { ...sim.player, currentLocationId: homeCity });
  if (stay) {
    const ends = stay.from + stay.nights * MS_DAY;
    return (
      <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="small">{stay.from > sim.now ? `${first} comes to stay ${formatDate(stay.from, zone)}, ${stay.nights === 1 ? 'a night' : `${stay.nights} nights`}, to ${formatDate(ends, zone)}.` : `${first} is staying until ${formatDate(ends, zone)}.`}</span>
        {stay.from > sim.now && <button type="button" className="btn btn-sm btn-ghost" disabled={!cancel.open} title={cancel.reason} onClick={() => { if (run('social.cancel_stay', { contactId: contact.id }).ok) toast(`${first}’s stay is called off.`, 'neutral'); }}>Call It Off</button>}
      </div>
    );
  }
  const no = stayRefusal(sim, sim.player, contact, from, nights);
  return (
    <div className="field-row">
      <div className="field">
        <label htmlFor="stay-day">Arriving</label>
        <select id="stay-day" value={day} onChange={(e) => setDay(Number(e.target.value))}>
          {Array.from({ length: 60 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d === 1 ? 'Tomorrow' : formatDate(sim.now + d * MS_DAY, zone)}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="stay-hour">At</label>
        <select id="stay-hour" value={hour} onChange={(e) => setHour(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 10).map((h) => <option key={h} value={h}>{`${String(h).padStart(2, '0')}:00`}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="stay-nights">Nights</label>
        <select id="stay-nights" value={nights} onChange={(e) => setNights(Number(e.target.value))}>
          {Array.from({ length: STAY_NIGHTS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <button type="button" className="btn btn-sm" disabled={!ask.open || Boolean(no)} title={no ?? ask.reason} onClick={() => {
        if (run('social.ask_to_stay', { contactId: contact.id, from, nights }).ok) toast(`${first} is coming to stay.`, 'positive');
      }}>{`Ask To Stay, Their Food About ${formatMoney(food * nights, cur, { cents: false })}`}</button>
    </div>
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
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const kids = childrenOf(person);
  const adopt = useFeature('social.adopt');
  const cur = saveCurrency(sim.universe);
  const noAdopt = adoptRefusal(sim, person, 'adoption', sim.now);
  const noSurrogate = adoptRefusal(sim, person, 'surrogacy', sim.now);
  const route = adoptionRoute(person);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const age = (born: number) => Math.floor((sim.now - born) / (365.2425 * MS_DAY));
  return (
    <Panel title="Your Family" subtitle={`Raising them, your share: ${money(raisingMonth(sim, person, sim.now))} A Month; the State’s Child Benefit: ${money(childBenefit(sim, person, sim.now))} A Month`}>
      <LookRegion className="col gap-1 small">
        {person.pregnancy && <div>A Baby Due <Open subject={at('day', dateKey(person.pregnancy.due, sim.homeZone))}>{formatDate(person.pregnancy.due, sim.zone)}</Open></div>}
        {kids.map((k) => {
          // Their own passport (`systems/childpassports.ts`, from 2026-10-05).
          const noPass = childPassportRefusal(sim, person, k.id);
          const terms = childPassportTerms(person, k, sim.now);
          const pass = k.passport ? (k.passport.readyAt > sim.now ? `, A Passport Ready ${formatDate(k.passport.readyAt, sim.zone)}` : k.passport.expiresAt > sim.now ? `, A Passport To ${formatDate(k.passport.expiresAt, sim.zone)}` : ', Their Passport Expired') : '';
          return (
            <div key={k.id} className="field-row">
              <span><Open subject={at('child', k.id)}>{k.name}</Open>{`, ${age(k.born)}${k.livesWith === 'them' ? ', Living With Their Other Parent' : ''}${pass}`}</span>
              {!noPass && typeof terms !== 'string' && <Gated feature="children.passport" className="btn btn-sm btn-ghost" title={`${terms.adult ? 'An adult’s passport' : 'A child’s passport'}, ${terms.years} years, ready in ${terms.days} days`} onClick={() => { if (run('children.passport', { childId: k.id }).ok) toast('Applied for.', 'positive'); }}>Apply For Their Passport</Gated>}
            </div>
          );
        })}
        {supportLines(sim, person, sim.now).map((l) => <div key={l.contact.id}>{l.amount < 0 ? 'Child Support To ' : 'Child Support From '}<Open subject={at('contact', l.contact.id)}>{l.contact.name}</Open>{`: ${money(Math.abs(l.amount))} A Month`}</div>)}
        {person.familyPath && <div>{`${person.familyPath.kind === 'adoption' ? 'Adopting: A Child Expected' : 'A Surrogacy: The Baby Due'} `}<Open subject={at('day', dateKey(person.familyPath.arrives, sim.homeZone))}>{formatDate(person.familyPath.arrives, sim.zone)}</Open></div>}
      </LookRegion>
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Gated feature="social.adopt" className="btn btn-sm btn-ghost" disabled={Boolean(noAdopt)} title={noAdopt ?? (route ? `${route.agency}, ${route.place}` : adopt.reason)} onClick={() => { if (run('social.adopt', { kind: 'adoption' }).ok) toast('Adoption started.', 'positive'); }}>{noAdopt ? 'Adopt' : `Adopt, ${money(pathCost(sim, person, 'adoption'))}`}</Gated>
        <Gated feature="social.adopt" className="btn btn-sm btn-ghost" disabled={Boolean(noSurrogate)} title={noSurrogate ?? 'Its costs paid at the start, the child born a pregnancy later.'} onClick={() => { if (run('social.adopt', { kind: 'surrogacy' }).ok) toast('A surrogacy, under way.', 'positive'); }}>{noSurrogate ? 'A Surrogacy' : `A Surrogacy, ${money(pathCost(sim, person, 'surrogacy'))}`}</Gated>
      </div>
    </Panel>
  );
}

/** Your parents, and their care when they need it (`systems/parents.ts`). */
function Parents() {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const care = useFeature('family.care');
  const parents = parentsOf(person);
  if (!parents.length) return null;
  const age = (p: Parent) => Math.floor((Math.min(sim.now, p.dies) - p.born) / (365.2425 * MS_DAY));
  return (
    <Panel title="Your Parents" subtitle={CITIES.require(parents[0]!.cityId).name}>
      <LookRegion className="col gap-2 small">
        {parents.map((p) => (
          <div key={p.role} className="field-row">
            <span><Open subject={at('parent', p.role)}>{p.role === 'mother' ? 'Your Mother' : 'Your Father'}</Open>{`, ${age(p)}${p.died ? ', Died' : needsCare(p, sim.now) ? `, Needs ${p.care!.kind === 'facility' ? 'A Care Home' : 'Care At Home'}` : ''}`}</span>
            {needsCare(p, sim.now) && (['pay', 'give', 'none'] as const).map((how) => {
              const no = careRefusal(person, p, how, sim.now);
              const label = how === 'pay' ? `Pay For It, ${formatCare(sim, p)} A Month` : how === 'give' ? `Care For Them, ${Math.round(careHours(person))} Hours A Week` : 'Leave It To The State';
              return <Gated key={how} feature="family.care" className="btn btn-sm btn-ghost" disabled={Boolean(no) || (p.how ?? 'none') === how} title={no ?? care.reason} onClick={() => { if (run('family.care', { role: p.role, how }).ok) toast('Done.', 'neutral'); }}>{label}</Gated>;
            })}
          </div>
        ))}
      </LookRegion>
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
