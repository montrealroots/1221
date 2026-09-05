/**
 * SLATE — Everything about a production, in one place.
 *
 * When somebody comes to you about a part, the first thing you want is the
 * picture: what it is, who is making it, who is already in it, what it is
 * being made for, and where it shoots. This is that page.
 *
 * It shows only what a person in the industry would actually be sent. The
 * script is not here, the other people reading are not here, and neither is
 * anything the production has not said out loud.
 */

import { useMemo, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Modal, Logo, Meter } from '@/ui/components/primitives';
import { formatLabel, titleCaseLabel } from '@/engine/core/text';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate, ageOn } from '@/engine/core/time';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import { STUDIOS } from '@/engine/content/studios';
import { NETWORKS } from '@/engine/content/networks';
import { CRAFT_LABEL, craftFocus, genre, genreName, runtimeBandOf } from '@/engine/content/genres';
import { rating } from '@/engine/content/ratings';
import { otherWorkOf } from '@/engine/systems/industry-people';
import { episodeTermsFor, roleCategoryOf } from '@/engine/systems/casting';
import { ROLE_CATEGORY_BY_ID } from '@/engine/content/casting-industry';
import type { Project, Role } from '@/engine/domain/model';

const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  en: 'English', fr: 'French', es: 'Spanish', de: 'German', it: 'Italian', ja: 'Japanese',
  ko: 'Korean', zh: 'Chinese', hi: 'Hindi', pt: 'Portuguese', ru: 'Russian', sv: 'Swedish',
  da: 'Danish', no: 'Norwegian', fi: 'Finnish', nl: 'Dutch', pl: 'Polish', tr: 'Turkish',
  th: 'Thai', he: 'Hebrew', ar: 'Arabic', id: 'Indonesian', vi: 'Vietnamese', el: 'Greek',
};

function languageName(code: string | undefined): string {
  if (!code) return 'Not Stated';
  return LANGUAGE_NAMES[code] ?? code.toUpperCase();
}

/** One line of the billing block: a name, what they do, and what else they have done. */
function CreditLine({ project, personId, label }: { project: Project; personId: string; label: string }) {
  const { sim } = useGame();
  const person = sim.universe.people[personId];
  if (!person) return null;
  const others = otherWorkOf(sim, personId, project.id)
    .filter((p) => p.phase === 'released' || p.phase === 'library')
    .slice(0, 2);
  return (
    <div className="xs" style={{ padding: '3px 0', overflowWrap: 'anywhere' }}>
      <span className="dim">{label}</span> <span className="strong">{person.stageName ?? person.displayName}</span>
      {others.length > 0 && (
        <span className="dim"> · also {others.map((p) => p.title).join(', ')}</span>
      )}
    </div>
  );
}

export function ProjectDossier({ project, roleId, onClose }: { project: Project; roleId?: string; onClose: () => void }) {
  const { sim, run } = useGame();
  const player = useWorld((s) => s.player);
  const age = ageOn(player.birthInstant, sim.now, sim.homeZone);

  const roles = useWorld((s) => Object.values(s.universe.roles).filter((r) => r.projectId === project.id));
  const submitted = useWorld((s) => new Set(Object.values(s.universe.auditions)
    .filter((a) => a.personId === s.player.id).map((a) => a.roleId)));

  const studio = project.studioId ? STUDIOS.get(project.studioId) : undefined;
  const network = project.networkId ? NETWORKS.get(project.networkId) : undefined;
  const certificate = project.contentRating ? rating(project.contentRating) : undefined;
  const focus = useMemo(() => craftFocus(project.genres), [project.genres]);
  const band = runtimeBandOf(project.genres);
  const city = CITIES.get(project.productionLocationIds[0] ?? '');
  const country = COUNTRIES.get(project.productionCountryId ?? '');

  const attached = roles.filter((r) => r.status === 'cast' && r.castPersonId);
  const open = roles.filter((r) => r.status === 'casting');

  const submit = (role: Role) => run('cast.submit', { roleId: role.id });

  return (
    <Modal title={project.title} onClose={onClose} wide footer={<button className="btn" onClick={onClose}>Close</button>}>
      <div className="row-between gap-2" style={{ alignItems: 'flex-start', marginBottom: 'var(--s3)' }}>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="xs dim">
            {formatLabel(project.format)} · {project.genres.map(genreName).join(', ')}
            {certificate && ` · ${certificate.code}`}
            {project.runtime ? ` · ${project.runtime} minutes` : ` · around ${Math.round((band[0] + band[1]) / 2)} minutes`}
            {' · '}{languageName(project.language)}
            {country && ` · ${country.name}`}
          </div>
          <p className="small" style={{ margin: 'var(--s2) 0 0', lineHeight: 1.55, overflowWrap: 'anywhere' }}>{project.logline}</p>
        </div>
        {(network ?? studio) && (
          <Logo id={(network ?? studio)!.id} name={(network ?? studio)!.name} />
        )}
      </div>

      <div className="grid grid-2 gap-4">
        <div>
          <div className="xs dim" style={{ marginBottom: 4 }}>Who Is Making It</div>
          {project.directorId && <CreditLine project={project} personId={project.directorId} label="Directed By" />}
          {project.showrunnerId && <CreditLine project={project} personId={project.showrunnerId} label="Run By" />}
          {project.writerIds.map((id) => <CreditLine key={id} project={project} personId={id} label="Written By" />)}
          {project.producerIds.map((id) => <CreditLine key={id} project={project} personId={id} label="Produced By" />)}
          <div className="xs" style={{ padding: '3px 0' }}>
            <span className="dim">For</span> <span className="strong">{network?.name ?? studio?.name ?? project.distributorName ?? 'Nobody yet'}</span>
          </div>
        </div>
        <div>
          <div className="xs dim" style={{ marginBottom: 4 }}>What It Is Being Made At</div>
          <div className="xs" style={{ padding: '3px 0' }}>
            <span className="dim">Budget</span> <span className="mono">{formatMoneyCompact(project.budget)}</span>
            <span className="dim"> as the trades have it</span>
          </div>
          {city && <div className="xs" style={{ padding: '3px 0' }}><span className="dim">Shoots in</span> <span className="strong">{city.name}</span></div>}
          {project.productionStartAt && (
            <div className="xs" style={{ padding: '3px 0' }}>
              <span className="dim">Starts</span> <span className="strong">{formatDate(project.productionStartAt, sim.homeZone)}</span>
            </div>
          )}
          <div className="xs" style={{ padding: '3px 0' }}>
            <span className="dim">Phase</span> <span className="strong">{titleCaseLabel(project.phase.replace(/_/g, ' '))}</span>
          </div>
          {certificate && (
            <div className="xs dim" style={{ padding: '3px 0', overflowWrap: 'anywhere' }}>
              <span className="strong">{certificate.code}.</span> {certificate.description}
            </div>
          )}
        </div>
      </div>

      {(project.format === 'series' || project.format === 'limited_series') && (
        <div style={{ marginTop: 'var(--s4)' }}>
          <div className="xs dim" style={{ marginBottom: 4 }}>The Series</div>
          <div className="xs" style={{ overflowWrap: 'anywhere' }}>
            {(() => {
              const seasons = project.seasons ?? [];
              const current = seasons[seasons.length - 1];
              if (!current) return 'A first season, not yet ordered to a number of episodes.';
              const aired = seasons.filter((x) => x.status === 'aired' || x.status === 'complete').length;
              return `Season ${current.number}, ${current.episodeCount} episodes${aired > 0 ? ` · ${aired} season${aired === 1 ? '' : 's'} already made` : ''}${current.status ? ` · ${titleCaseLabel(current.status.replace(/_/g, ' '))}` : ''}`;
            })()}
          </div>
        </div>
      )}

      <div style={{ marginTop: 'var(--s4)' }}>
        <div className="xs dim" style={{ marginBottom: 4 }}>Cast Attached</div>
        {attached.length === 0 ? (
          <div className="xs dim">Nobody yet. Every part is still to be cast, which is unusual and worth knowing.</div>
        ) : (
          attached.map((role) => {
            const person = sim.universe.people[role.castPersonId!];
            return (
              <div key={role.id} className="xs" style={{ padding: '3px 0', overflowWrap: 'anywhere' }}>
                <span className="strong">{person?.stageName ?? person?.displayName ?? 'Not named'}</span>
                <span className="dim"> as {role.characterName} · {ROLE_CATEGORY_BY_ID[roleCategoryOf(role, project)].name}</span>
              </div>
            );
          })
        )}
      </div>

      {open.length > 0 && (
        <div style={{ marginTop: 'var(--s4)' }}>
          <div className="xs dim" style={{ marginBottom: 4 }}>Parts Still Open</div>
          <div className="list">
            {open.map((role) => {
              const inRange = age >= role.ageRange[0] - 4 && age <= role.ageRange[1] + 6;
              const mine = submitted.has(role.id);
              return (
                <div key={role.id} className="list-item list-static" style={roleId === role.id ? { background: 'var(--accent-dim)' } : undefined}>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small strong">{role.characterName}</div>
                    <div className="xs dim">
                      {ROLE_CATEGORY_BY_ID[roleCategoryOf(role, project)].name} · {role.shootDays} shoot days · ages {role.ageRange[0]}–{role.ageRange[1]}
                      {(() => {
                        const terms = episodeTermsFor(role, project);
                        return terms ? ` · season ${terms.season}, ${terms.guaranteed} of ${terms.ofEpisodes} episodes` : '';
                      })()}
                    </div>
                    <div className="xs muted">{ROLE_CATEGORY_BY_ID[roleCategoryOf(role, project)].what}</div>
                    <div className="xs muted" style={{ overflowWrap: 'anywhere' }}>{role.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono xs">{formatMoney(role.payLow, { cents: false })}</div>
                    <div className="xs dim">to {formatMoney(role.payHigh, { cents: false })}</div>
                  </div>
                  <button
                    className="btn btn-sm"
                    disabled={mine || !inRange}
                    title={!inRange ? `They are looking for ${role.ageRange[0]} to ${role.ageRange[1]}. You are ${age}.` : undefined}
                    onClick={() => submit(role)}
                  >
                    {mine ? 'Submitted' : inRange ? 'Submit' : 'Wrong Age'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="callout" style={{ marginTop: 'var(--s4)' }}>
        <div className="small">
          <span className="strong">What it lives or dies on.</span> {focus.map((d) => CRAFT_LABEL[d]).join(', ')} — that is what{' '}
          {project.genres.map(genreName).join(' and ')} is judged against, and it is what the finished thing gets scored on.
        </div>
        {genre(project.genres[0] ?? '')?.description && (
          <div className="xs dim" style={{ marginTop: 'var(--s2)' }}>{genre(project.genres[0] ?? '')!.description}</div>
        )}
      </div>

      {project.scriptQuality > 0 && (
        <div style={{ marginTop: 'var(--s3)' }}>
          <Meter
            label="How The Script Is Being Talked About"
            value={project.scriptQuality}
            hint="What the town says, which is not the same as what it is. Nobody has sent you the pages."
          />
        </div>
      )}
    </Modal>
  );
}

/** The button that opens a dossier, for lists that carry projects. */
export function DossierButton({ project, roleId, label = 'The Project' }: { project: Project; roleId?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-sm btn-ghost" onClick={() => setOpen(true)}>{label}</button>
      {open && <ProjectDossier project={project} roleId={roleId} onClose={() => setOpen(false)} />}
    </>
  );
}
