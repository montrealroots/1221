# Brief 22: The Material’s Genre Weights, Reviewed

Written by `genre-weights.ts` from `src/engine/content/genre-weights.ts` and the catalogs. Every weight is **SLATE’s
design choice**, read from the material as the game has it (the play’s story and parts, the scene’s summary, the
breakdown’s words), **not a researched or objective fact**. A set is read as shares of its sum. “Brief 21” is what the
first-listed rule made of the same tags; “Now” is what the game resolves, at the level shown.

## The Rules

- **Levels, the most precise first:** a class scene’s own; a part’s or a role’s own; the play’s or the project’s. The
  first level that states a set states all of it. A level with tags and no set reads them evenly (the neutral fallback,
  for older content). A class scene’s filed genre (comedy, drama or tragedy) is read only where its play names none.
- **Invalid weights** (a genre the game doesn’t have, a weight below 0 or not a number, none above 0) are skipped and
  said; the level’s tags or the next level are read.
- **Normalized, bounded, order-free:** shares of the sum, each at most 1, summing to 1, sorted and summed by genre, so
  the order of a list changes nothing; a tag repeated is one; a broad genre beside one of its own kinds is folded into
  the kind.
- **Where nothing more precise exists, nothing more precise is claimed:** a professional audition, callback or
  self-tape has no sides of its own in the game, so it reads the role’s; School casting is of a play, before its parts
  are dealt, so it reads the play’s; a scene without its own reads its play’s.

## The Plays

| Play | Tags as listed | Brief 21 | Now (stated) | Register | Why |
|---|---|---|---|---|---|
| Hedda Gabler | Drama, Domestic Drama | Domestic Drama 100% | Domestic Drama 100% | Drama | A marriage in one drawing room: a domestic drama, drama being its broad genre. |
| The Importance Of Being Earnest | Comedy, Satire, Farce | Farce 50%, Satire 50% | Farce 50%, Satire 50% | Comedy | Wilde’s plot is farce (two invented Ernests, a handbag) and his talk is satire of the society it plays in, about evenly; comedy is the broad genre of both. |
| Woyzeck | Tragedy, Drama | Drama 50%, Tragedy 50% | Tragedy 60%, Drama 40% | Tragedy | A soldier’s tragedy told in short realist scenes: mostly tragedy, with the plain drama of its barracks and fairground. |
| Three Sisters | Drama, Tragicomedy | Drama 50%, Tragicomedy 50% | Tragicomedy 60%, Drama 40% | Drama | Chekhov’s mix of hope and loss, mostly tragicomedy, in the household drama of the Prozorovs. |
| Blood Wedding | Tragedy, Romantic Drama | Romantic Drama 50%, Tragedy 50% | Tragedy 60%, Romantic Drama 40% | Tragedy | A rural tragedy set off by a love the bride can’t give up: mostly tragedy, with a romantic drama at its heart. |
| The Cherry Orchard | Tragicomedy, Comedy | Tragicomedy 100% | Tragicomedy 100% | Tragicomedy | Chekhov called it a comedy; it plays as tragicomedy, comedy being tragicomedy’s broad genre. |
| Major Barbara | Comedy, Satire, Political Drama | Satire 75%, Political Drama 25% | Satire 60%, Political Drama 40% | Comedy | Shaw’s comedy of ideas: satire of charity and the arms trade, and an argument over power that makes its last act a political drama. |
| Spring Awakening | Coming Of Age, Drama | Coming Of Age 100% | Coming Of Age 100% | Coming Of Age | Adolescents kept from the truth about themselves: a coming of age, drama being one of its broad genres. |
| Ghosts | Drama, Domestic Drama | Domestic Drama 100% | Domestic Drama 100% | Drama | A mother, a son and the father’s legacy in one house: a domestic drama, drama being its broad genre. |
| The Wild Duck | Drama, Tragicomedy, Domestic Drama | Domestic Drama 75%, Tragicomedy 25% | Domestic Drama 60%, Tragicomedy 40% | Drama | A family in its attic, mostly domestic drama, its tragedy edged with comedy (Hjalmar’s self-pity, Relling’s lies for living); drama is the broad genre of the first. |
| Twelfth Night | Comedy, Romantic Comedy | Romantic Comedy 100% | Romantic Comedy 100% | Comedy | Viola, Orsino and Olivia: a romantic comedy, comedy being its broad genre. |
| Measure For Measure | Tragicomedy, Political Drama | Political Drama 50%, Tragicomedy 50% | Political Drama 50%, Tragicomedy 50% | Tragicomedy | A problem play: a city’s law and the ruler who abuses it, political drama, ending in comedy’s marriages after tragedy’s threats, tragicomedy; about evenly. |
| The Winter’s Tale | Romance, Tragicomedy, Fairy Tale | Romance 50%, Fairy Tale 25%, Tragicomedy 25% | Tragicomedy 50%, Romance 30%, Fairy Tale 20% | Romance | Half tragedy (Leontes’ jealousy), half pastoral comedy: tragicomedy first, then the romance of the lost daughter and the fairy tale of the statue that wakes. |
| Macbeth | Tragedy, Historical Drama, Supernatural | Tragedy 50%, Historical Drama 25%, Supernatural 25% | Tragedy 60%, Historical Drama 20%, Supernatural 20% | Tragedy | Mostly tragedy, with a Scottish history play’s kings and battles and the witches’ supernatural. |
| As You Like It | Romantic Comedy, Comedy | Romantic Comedy 100% | Romantic Comedy 100% | Romantic Comedy | Rosalind and Orlando in Arden: a romantic comedy, comedy being its broad genre. |
| Much Ado About Nothing | Romantic Comedy, Comedy | Romantic Comedy 100% | Romantic Comedy 100% | Romantic Comedy | Beatrice and Benedick, Hero and Claudio: a romantic comedy, comedy being its broad genre. |
| Julius Caesar | Tragedy, Historical Drama, Political Drama | Tragedy 50%, Historical Drama 25%, Political Drama 25% | Tragedy 50%, Political Drama 30%, Historical Drama 20% | Tragedy | Brutus’s tragedy first, in a political drama of conspiracy and persuasion, on Rome’s history. |
| A Midsummer Night’s Dream | Comedy, Romantic Comedy, Fairy Tale | Romantic Comedy 75%, Fairy Tale 25% | Romantic Comedy 60%, Fairy Tale 40% | Comedy | Mostly the lovers’ romantic comedy (comedy its broad genre), in the fairies’ wood. |
| A Doll’s House | Domestic Drama, Drama | Domestic Drama 100% | Domestic Drama 100% | Domestic Drama | A marriage and the door Nora shuts: a domestic drama, drama being its broad genre. |
| Uncle Vanya | Tragicomedy, Drama | Drama 50%, Tragicomedy 50% | Tragicomedy 60%, Drama 40% | Tragicomedy | Chekhov’s estate of wasted lives, mostly tragicomedy, in a plain household drama. |
| Tartuffe | Comedy, Satire | Satire 100% | Satire 100% | Comedy | Molière’s hypocrite: satire, comedy being its broad genre. |
| An Enemy Of The People | Political Drama, Drama | Political Drama 100% | Political Drama 100% | Political Drama | A doctor against his town over its poisoned baths: a political drama, drama being its broad genre. |
| The Playboy Of The Western World | Comedy, Satire | Satire 100% | Satire 100% | Comedy | A village that makes a hero of a man who says he killed his father: satire, comedy being its broad genre. |
| Mrs Warren’s Profession | Drama, Social Realism | Social Realism 100% | Social Realism 100% | Drama | A daughter learning where her education came from: social realism, drama being its broad genre. |
| Miss Julie | Drama, Tragedy | Drama 50%, Tragedy 50% | Tragedy 60%, Drama 40% | Drama | Strindberg’s “naturalistic tragedy”: mostly tragedy, played as the plain drama of one kitchen. |
| Trifles | Mystery, Drama | Drama 50%, Mystery 50% | Drama 60%, Mystery 40% | Mystery | A murder solved in a kitchen by the women the men ignore: mostly their drama, with a mystery. |
| The Bear | Comedy, Farce | Farce 100% | Farce 100% | Comedy | A duel that turns to a proposal: farce, comedy being its broad genre. |
| A Marriage Proposal | Comedy, Farce | Farce 100% | Farce 100% | Comedy | A proposal lost in quarrels over land and dogs: farce, comedy being its broad genre. |
| Riders To The Sea | Tragedy | Tragedy 100% | Tragedy 100% | Tragedy | A mother losing her last son to the sea: tragedy. |
| Salomé | Tragedy | Tragedy 100% | Tragedy 100% | Tragedy | Wilde’s Salomé: tragedy. |
| The Seagull | Tragicomedy, Drama | Drama 50%, Tragicomedy 50% | Tragicomedy 60%, Drama 40% | (none, as before) | As Uncle Vanya: Chekhov’s “comedy in four acts”, mostly tragicomedy, in the household drama of a summer estate. |

## The Parts That Ask Otherwise

Every other part reads its play’s.

| Play | Part | Now (stated, part) | Why |
|---|---|---|---|
| The Importance Of Being Earnest | Lady Bracknell | Satire 75%, Farce 25% | Lady Bracknell has little of the plot’s confusion and most of its satire: the interview, the handbag, the terminus. |
| Blood Wedding | The Moon | Tragedy 100% | Lighting the killing, not the love story: the Moon belongs to the tragedy. |
| Blood Wedding | The Beggar Woman | Tragedy 100% | Death in the forest, the Beggar Woman is tragedy alone. |
| The Cherry Orchard | Epikhodov | Comedy 100% | Epikhodov, “twenty-two misfortunes”, is the play’s clown: comedy without its sorrow. |
| The Cherry Orchard | Charlotta | Comedy 100% | Charlotta’s conjuring and ventriloquism are the play’s comic turns. |
| Twelfth Night | Malvolio | Comedy 100% | Malvolio gulled and the revels below stairs: comedy, without the romance. |
| Twelfth Night | Sir Toby Belch | Comedy 100% | Malvolio gulled and the revels below stairs: comedy, without the romance. |
| Twelfth Night | Sir Andrew Aguecheek | Comedy 100% | Malvolio gulled and the revels below stairs: comedy, without the romance. |
| Twelfth Night | Maria | Comedy 100% | Malvolio gulled and the revels below stairs: comedy, without the romance. |
| Twelfth Night | Fabian | Comedy 100% | Malvolio gulled and the revels below stairs: comedy, without the romance. |
| Twelfth Night | Feste | Comedy 100% | Malvolio gulled and the revels below stairs: comedy, without the romance. |
| Measure For Measure | Pompey | Comedy 100% | Vienna’s comic underworld, its bawds and its slanderer: comedy. |
| Measure For Measure | Mistress Overdone | Comedy 100% | Vienna’s comic underworld, its bawds and its slanderer: comedy. |
| Measure For Measure | Lucio | Comedy 100% | Vienna’s comic underworld, its bawds and its slanderer: comedy. |
| The Winter’s Tale | Autolycus | Comedy 100% | Rogue and rustics of the sheep-shearing: comedy. |
| The Winter’s Tale | The Clown | Comedy 100% | Rogue and rustics of the sheep-shearing: comedy. |
| The Winter’s Tale | The Old Shepherd | Comedy 100% | Rogue and rustics of the sheep-shearing: comedy. |
| Macbeth | The First Witch | Supernatural 70%, Tragedy 30% | Its supernatural: the witches’ prophecy is the tragedy’s spring. |
| Macbeth | The Second Witch | Supernatural 70%, Tragedy 30% | Its supernatural: the witches’ prophecy is the tragedy’s spring. |
| Macbeth | The Third Witch | Supernatural 70%, Tragedy 30% | Its supernatural: the witches’ prophecy is the tragedy’s spring. |
| As You Like It | Touchstone | Comedy 100% | Touchstone, the court fool in the forest: comedy. |
| As You Like It | Audrey | Comedy 100% | Audrey, Touchstone’s goatherd: comedy. |
| Much Ado About Nothing | Dogberry | Comedy 100% | Dogberry and the watch: comedy without the romance. |
| A Midsummer Night’s Dream | Bottom | Farce 100% | Pyramus and Thisbe, as the mechanicals play it: farce. |
| A Midsummer Night’s Dream | Peter Quince | Farce 100% | Pyramus and Thisbe, as the mechanicals play it: farce. |
| A Midsummer Night’s Dream | Francis Flute | Farce 100% | Pyramus and Thisbe, as the mechanicals play it: farce. |
| A Midsummer Night’s Dream | Oberon | Fairy Tale 60%, Romantic Comedy 40% | Mostly the fairy tale, the fairies’ spells working the lovers’ comedy. |
| A Midsummer Night’s Dream | Titania | Fairy Tale 60%, Romantic Comedy 40% | Mostly the fairy tale, the fairies’ spells working the lovers’ comedy. |
| A Midsummer Night’s Dream | Puck | Fairy Tale 60%, Romantic Comedy 40% | Mostly the fairy tale, the fairies’ spells working the lovers’ comedy. |

## The Class Scenes That Ask Otherwise

5 of 67 scenes state their own; 20 read their play’s; 42, of plays with no kinds, read their filed genre, as no scene did before brief 22 (until then a scene of a play with no kinds read no genre).

| Scene | Play | The play’s | Now (stated, scene) | Why |
|---|---|---|---|---|
| caesar-3-2 (Act Three, Scene Two, the Forum) | Julius Caesar | Tragedy 50%, Political Drama 30%, Historical Drama 20% | Political Drama 60%, Tragedy 30%, Historical Drama 10% | At the Forum, Brutus and Antony persuade a crowd: the play’s politics at their height. |
| caesar-2-1 (Act Two, Scene One, Brutus’s orchard) | Julius Caesar | Tragedy 50%, Political Drama 30%, Historical Drama 20% | Tragedy 75%, Political Drama 25% | Brutus and Portia in the orchard: his private torment over the conspiracy, the tragedy’s heart. |
| caesar-4-3 (Act Four, Scene Three, Brutus’s tent near Sardis) | Julius Caesar | Tragedy 50%, Political Drama 30%, Historical Drama 20% | Tragedy 70%, Political Drama 30% | Two friends quarrel in the tent over money and honor, then Portia’s death and the ghost: the tragedy closing in. |
| dream-3-2 (Act Three, Scene Two, the wood near Athens) | A Midsummer Night’s Dream | Romantic Comedy 60%, Fairy Tale 40% | Romantic Comedy 70%, Farce 30% | In the wood the lovers quarrel: the romantic comedy at its most farcical. |
| dream-5-1 (Act Five, Scene One, the mechanicals’ play at the palace of Theseus) | A Midsummer Night’s Dream | Romantic Comedy 60%, Fairy Tale 40% | Farce 80%, Romantic Comedy 20% | Pyramus and Thisbe by the mechanicals, before the married lovers: farce. |

## The Professional Projects And Roles

No role asks other than its project (`ROLE_GENRES` is empty: 0); each pair of parts is one story from two sides.

| Project | Roles | Tags as listed | Brief 21 | Now (stated, project) | Why |
|---|---|---|---|---|---|
| A House On Calder Street | Nell, Callum | Domestic Drama, Drama | Domestic Drama 100% | Domestic Drama 100% | A family in one house, the secret the brother kept and the sister says: a domestic drama, drama being its broad genre. |
| The Winter Ledger | Tobias Marsh, Hester Vane | Comedy, Farce | Farce 100% | Farce 100% | Two fiancées, two sets of books and one inn on one night: a farce, comedy being its broad genre. |
| The Calloway Files | Desk Clerk | Police Procedural, Crime | Police Procedural 100% | Police Procedural 100% | An investigation episode of a network series: a police procedural, crime being its broad genre. |
| Gull Season | Wren, Ferris | Psychological Thriller, Thriller | Psychological Thriller 100% | Psychological Thriller 100% | A drowning nobody tells the truth about: a psychological thriller, thriller being its broad genre. |
| Static On Route 9 | Jess | Psychological Horror, Horror | Psychological Horror 100% | Psychological Horror 100% | Two hosts hearing their own voices call in: a psychological horror, horror being its broad genre. |
| Paper Moons | Felix, Ivy | Coming Of Age, Drama | Coming Of Age 100% | Coming Of Age 100% | A brother not going back, a sister deciding whether to say so, one summer: a coming of age. |
| Last Bus To Eastview | Robin | Romantic Comedy | Romantic Comedy 100% | Romantic Comedy 100% | Two strangers arguing through the night over a job abroad: a romantic comedy. |

## What Moved

13 of 31 plays read otherwise than brief 21’s rule read them: Woyzeck; Three Sisters; Blood Wedding; Major Barbara; The Wild Duck; The Winter’s Tale; Macbeth; Julius Caesar; A Midsummer Night’s Dream; Uncle Vanya; Miss Julie; Trifles; The Seagull. Every project reads as before: each states one genre, and its tags were that genre beside its broad genre, which brief 21 folded into it.
