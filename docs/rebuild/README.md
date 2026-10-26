# The Rebuild Folder

Everything the owner has decided to carry from this SLATE into the new one, kept together so the whole folder can be
lifted into a clean repository when that repository exists. Nothing in here is read by this SLATE's build, tests or
gate: it is a record and a parts bin.

- `KEEP.md`: the register. One numbered entry per kept thing, with every detail the new build needs and the owner's
  words on the decision.
- `captures/`: the full-page screen captures the decisions were made from, numbered by page.
- `kept/`: verbatim copies of the source files behind each kept entry, taken from this tree at the commit the
  register names, in a folder per entry. They import paths that exist here (`@/engine/...`, `../domain/model`), so
  in the new repository they are the reference to rebuild from, not files to drop in unchanged.

When the clean GitHub repository is made, this folder goes in as its first commit's `docs/` or `reference/`, and the
register's entries become the new build's specification, one at a time.
