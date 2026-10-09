/**
 * SLATE — looking at the business where it’s named (from 2026-10-08): a
 * project, a company, a performer. A credit, an audition, a job or a
 * castmate opens one of these in place; each says what it is, where it comes
 * from (this save’s fiction, or one of the ten real companies), and goes on
 * to what it’s made of, and to its whole page in The Industry.
 */

import { useGame } from '@/app/game-context';
import { formatDate } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { COMPANIES, companyById, type IndustryCompany } from '@/engine/content/industry';
import { roleById } from '@/engine/systems/career';
import { contactsOf } from '@/engine/systems/people';
import { industryOf, performerById, projectById, type IndustryPerformer, type Project } from '@/engine/systems/industry';
import { formatWord, routeOf, statusWord, type EntryKind } from '@/engine/world/database';
import type { Simulation } from '@/engine';
import { defineLook, type Way } from './registry';
import { at } from './subject';

/** The whole page, in The Industry, by its address. */
function PageLink({ kind, id, name }: { kind: EntryKind; id: string; name: string }) {
  const { navigate } = useGame();
  return <button type="button" className="btn btn-sm" onClick={() => navigate(routeOf(kind, id), name)}>Open Its Page In The Industry</button>;
}

const town = (id: string) => CITIES.get(id)?.name ?? id;

/** Where each part’s holder goes: a performer, or a classmate’s contact. */
function holderWays(sim: Simulation, p: Project): Way[] {
  const out: Way[] = [];
  for (const part of p.parts) {
    const h = part.holder;
    if (h?.kind === 'performer') {
      const who = performerById(sim, h.id);
      if (who) out.push({ to: at('performer', who.id), label: who.name, detail: `${part.name}, ${roleById(part.roleId).label}` });
    } else if (h?.kind === 'classmate') {
      const contact = contactsOf(sim.player).find((c) => c.classmate === h.i);
      const name = sim.player.school?.classmates[h.i]?.name ?? 'A classmate';
      if (contact) out.push({ to: at('contact', contact.id), label: name, detail: `Your classmate, as ${part.name}` });
    }
  }
  return out;
}

defineLook<Project>('project', {
  gone: 'That project left the record: nobody touched it, and it was a year past its end.',
  resolve: (sim, id) => projectById(sim, id),
  seeds: (sim) => industryOf(sim).projects.slice(0, 40).map((p) => p.id),
  look: (p, { sim }) => {
    const company = companyById(p.companyId ?? '');
    const mine = (sim.player.career?.bookings ?? []).filter((b) => b.projectId === p.id);
    const ways: Way[] = [
      ...(company ? [{ to: at('company', company.id), label: company.short, detail: 'Its company, real; this project is the save’s fiction' }] : []),
      ...mine.map((b) => ({ to: at('job', b.id), label: 'Your Job On It', detail: 'What it pays you, your days, and who was on it with you' })),
      ...holderWays(sim, p),
    ];
    return {
      name: p.title,
      kind: `${formatWord(p.format)} In This Save`,
      summary: `${p.title} is a ${formatWord(p.format).toLowerCase()} by ${company ? company.short : p.producer.toLowerCase()}, in ${town(p.cityId)}: ${statusWord(p, sim.now).toLowerCase()}.`,
      body: (
        <div className="col gap-2">
          <p className="small" style={{ margin: 0 }}>
            {p.format === 'play' ? 'Rehearsals and the run' : 'Shooting'} {formatDate(p.shootFrom, sim.zone)} to {formatDate(p.shootUntil, sim.zone)}; {p.format === 'play' ? 'opening' : 'out'} {formatDate(p.releaseAt, sim.zone)}.
            {' '}{p.parts.length} {p.parts.length === 1 ? 'part' : 'parts'}, {p.parts.filter((x) => x.status === 'open').length} still open.
            {p.reception ? ` SLATE’s reception: critics ${p.reception.critics}, audiences ${p.reception.audience}.` : ''}
          </p>
          <div><PageLink kind="project" id={p.id} name={p.title} /></div>
        </div>
      ),
      ways,
      provenance: 'Its title, parts, dates and reception are this save’s invention; a real company in it is real, its part in it fiction.',
    };
  },
});

defineLook<IndustryCompany>('company', {
  gone: 'There’s no such company.',
  resolve: (_sim, id) => companyById(id),
  seeds: () => COMPANIES.map((c) => c.id),
  look: (c, { sim }) => {
    const projects = industryOf(sim).projects.filter((p) => p.companyId === c.id);
    const worked = industryOf(sim).worked[c.id];
    return {
      name: c.short,
      kind: 'One Of The Ten Companies',
      summary: `${c.name}, of ${c.headquarters.city}: ${c.release === 'streaming' ? `its work is first seen on ${c.streamer?.name}` : c.release === 'broadcast' ? `its work is first seen on ${c.network}` : 'its films open in cinemas'}.`,
      body: (
        <div className="col gap-2">
          <p className="small" style={{ margin: 0 }}>{c.scale}</p>
          <p className="small" style={{ margin: 0 }}>{projects.length} {projects.length === 1 ? 'project' : 'projects'} of its in this save. {worked ? `You’ve worked for it ${worked.jobs} ${worked.jobs === 1 ? 'time' : 'times'}, so its producers read you a little more warmly.` : 'You haven’t worked for it.'}</p>
          <div><PageLink kind="company" id={c.id} name={c.short} /></div>
        </div>
      ),
      ways: projects.slice(-6).reverse().map((p) => ({ to: at('project', p.id), label: p.title, detail: `${formatWord(p.format)}, ${statusWord(p, sim.now).toLowerCase()}` })),
      provenance: 'The company and its figures are real, from SLATE’s research; its projects here are the save’s fiction.',
    };
  },
});

defineLook<IndustryPerformer>('performer', {
  gone: 'There’s no such performer.',
  resolve: (sim, id) => performerById(sim, id),
  seeds: (sim) => industryOf(sim).performers.slice(0, 20).map((p) => p.id),
  look: (who, { sim }) => {
    const busy = who.commitments.filter((c) => c.until >= sim.now).sort((a, b) => a.from - b.from);
    return {
      name: who.name,
      kind: 'An Actor In This Save',
      summary: `${who.name} works out of ${town(who.cityId)}${busy.length ? `, booked until ${formatDate(busy.at(-1)!.until, sim.zone)}` : ', free now'}.`,
      body: (
        <div className="col gap-2">
          <p className="small" style={{ margin: 0 }}>{who.credits.length} {who.credits.length === 1 ? 'credit' : 'credits'} released.{busy.length ? ` ${busy.length} ${busy.length === 1 ? 'job' : 'jobs'} on their books, and nothing else in those dates.` : ''}</p>
          <div><PageLink kind="performer" id={who.id} name={who.name} /></div>
        </div>
      ),
      ways: [...new Set([...busy.map((c) => c.projectId), ...who.credits.map((c) => c.projectId)])].flatMap((id) => { const p = projectById(sim, id); return p ? [{ to: at('project', p.id), label: p.title, detail: statusWord(p, sim.now) }] : []; }).slice(0, 8),
      provenance: 'A performer the business cast in this save: a name, a town and the work; their level is SLATE’s.',
    };
  },
});
