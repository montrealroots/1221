# Why A Student Who Looks After Themselves Takes The Lead

Measured 2026-10-10 on the code of this pass, with `tools/lives.ts --why` and its `casts` record. The profile is New
York, attentive, three seeds, 3.3 years each. The question: are four or five leads in five productions a defect, a
consequence of the profiles, or a matter of taste?

## What the castings show

Here is seed lives-1 as played: five leads.

| Term | Play | Fit | Group's Mean Fit | Delivered | Balance | Read | Part | Place | Margin |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Carlotta | 58.6 | 55.3 | 100% | 0 | 58.6 | lead | 1 of 16 | +0.4 |
| 2 | Woyzeck | 61.5 | 58.5 | 100% | −2 | 59.5 | lead | 1 of 8 | +1.8 |
| 3 | Three Sisters | 63.4 | 60.5 | 98% | −2 | 61.2 | lead | 2 of 8 | −0.7 |
| 4 | Spring Awakening | 65.1 | 62.1 | 99% | −2 | 63.0 | lead | 2 of 8 | −0.2 |
| 5 | Measure For Measure | 66.0 | 63.3 | 99% | −2 | 63.8 | lead | 1 of 5 | +0.1 |

- **Fit:** the student's fit runs about three points above their group's mean every term.
- **Margins:** the margin over the next student is small, under two points.
- **Second-placed leads:** two of the leads came in second place. The part is written for an actor or an actress, and the top read was the other.

## Defect, or consequence?

No defect was found:
- **Delivery is the same construct for everyone.** A classmate's delivery is the share of calls they keep, which is exactly the preparation their runs are judged with. The student's is their preparation × condition. An attentive student prepares fully, so theirs is near 100%.
- **Fit is read the same way for everyone** (`castFit`).
- **Balance is applied once per casting**, from the last School or Rep part.

The leads follow from two design choices:
1. **The student's talent is drawn from the class's top quarter.** `ESTIMATE.talent.playerFrom` is 50 against the class's 40 to 56: "among its strongest, not above everyone".
2. **An attentive student does the work**, and their fit grows with it.

## Measured alternatives

None of these was adopted. Each ran on the same three seeds.

| Change | Leads in five productions (seeds 0, 1, 2) | Abilities at the end | All graduated |
|---|---|---|---|
| As it is | 2, 5, 4 | 60–61 | yes |
| Balance after a lead −4 (from −2) | 2, 4, 4 | 60–61 | yes |
| Student's talent from the class's whole range (40 to 56) | 1, 3, 1 | 56–57 | yes |

## Recommendation

Leave it, unless the owner wants the student to start as one of the class rather than among its best.
- **The balance is not the lever.** Doubling it moved one seed by one lead.
- **The talent range is the lever.** Drawn from the class's whole range, a careful student takes one to three leads in five, and ends a few ability points lower.

The second is a change of difficulty and of what the game says the student is. So it's the owner's call, and this pass doesn't make it.
