# Defects Found In The Material Area

Brief 14, the material area, 2026-10-17.

No functional defect was found. Every brief and every class scene was rendered on its own screen by
`tests/material-words.test.ts` (BriefPane for all 298 briefs, CourseworkPane's table work for every scene, both roles and
every option, and the teacher's note for every reason that cuts against), and none printed a doubled stop, a space
before a stop, `undefined`, `NaN` or `[object Object]`, or dropped a field. No number appears in a changed sentence.

What was looked for and not found:

- **A note that contradicts its rule.** Each allows note was checked against the brief's own `allows`; the new test
  holds every note to it, and all 18 match. Before the rewrite, the notes didn't name the choice at all, so none could
  be wrong; now none is.
- **A reason that contradicts its scene.** Each rewritten scene reason was read against the scene's circumstances,
  facts and the other role's options (the meaning-sensitive changes in `batches.md`).
- **Text read for computation.** The judge keys on ids (`callbackFor`), the readings on `lean` and `draws`, and the
  scenes' scoring on `supported`; none reads a brief's or a scene's words.

One observation that isn't a defect: `riders-sea` has two options with the id `mother`, one under The Relationship (cut
against) and one under The Obstacle (supported). Option ids are unique within a question, and answers are kept by
question (`a.answers[q.id]`), so the two never meet.
