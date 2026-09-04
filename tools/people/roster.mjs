/**
 * SLATE — the roster: who the industry's real people are.
 *
 * One entry per person, with every role they were listed under. Somebody who
 * acts and produces and directs is one person with three roles, not three
 * people, which is the whole point: their profile carries a set of attributes
 * for each thing they do.
 *
 * Names here are only a key for looking the person up in the public record.
 * Everything shown about them in the game comes from that record (Wikidata,
 * CC0) or is SLATE's own derivation from it, and the interface says which.
 *
 * `hint` disambiguates where a name is shared. `skip` records a name that was
 * listed and deliberately left out, with the reason, so the decision is on the
 * record rather than silently applied.
 */

/** Roles a person can be listed under. Each one gets its own attribute sheet. */
export const ROLES = ['actor', 'showrunner', 'producer', 'director', 'cinematographer', 'composer'];

export const ROLE_LABEL = {
  actor: 'Actor', showrunner: 'Showrunner', producer: 'Producer',
  director: 'Director', cinematographer: 'Cinematographer', composer: 'Composer',
};

/** Names that were listed and are not in the database, and why. */
export const SKIPPED = [
  { name: 'Jonathan Nolan', listedUnder: 'cinematographer', reason: 'A writer, director and producer rather than a cinematographer. He is in the database under those roles.' },
  { name: 'Natalie Portman', listedUnder: 'composer', reason: 'An actor rather than a screen composer.' },
];

const ACTORS = [
  'Leonardo DiCaprio', 'Michael B. Jordan', 'Timothée Chalamet', 'Ryan Gosling', 'Cillian Murphy',
  'Pedro Pascal', 'Austin Butler', 'Jacob Elordi', 'Glen Powell', 'Paul Mescal',
  'Barry Keoghan', 'Damson Idris', 'Daniel Kaluuya', 'Robert Pattinson', 'Andrew Garfield',
  'Tom Holland', 'Tom Hardy', 'Henry Cavill', 'Chris Hemsworth', 'Chris Evans',
  'Ryan Reynolds', 'Brad Pitt', 'Dwayne Johnson', 'Adam Driver', 'Oscar Isaac',
  'Mahershala Ali', 'Idris Elba', 'Colman Domingo', 'Jeremy Allen White', 'Kieran Culkin',
  'Steven Yeun', 'Donald Glover', 'Jesse Plemons', 'Dev Patel', 'John Boyega',
  'LaKeith Stanfield', 'Yahya Abdul-Mateen II', 'Brian Tyree Henry', 'Sterling K. Brown', 'Anthony Mackie',
  'John David Washington', 'Aaron Pierre', 'Kelvin Harrison Jr.', 'Kingsley Ben-Adir', 'Winston Duke',
  'Aldis Hodge', 'Daniel Craig', 'Benedict Cumberbatch', 'Christian Bale', 'Joaquin Phoenix',
  'Jake Gyllenhaal', 'Bradley Cooper', 'Matt Damon', 'Ben Affleck', 'Mark Ruffalo',
  'Rami Malek', 'Nicholas Hoult', 'Aaron Taylor-Johnson', 'Taron Egerton', 'Theo James',
  'Jonathan Bailey', "Josh O'Connor", 'Harris Dickinson', 'David Corenswet', 'Nicholas Galitzine',
  'Charles Melton', 'Manny Jacinto', 'Archie Madekwe', "D'Pharaoh Woon-A-Tai", 'Cooper Koch',
  'Drew Starkey', 'Mike Faist', 'Joe Alwyn', 'Callum Turner', 'Will Poulter',
  "Jack O'Connell", 'George MacKay', 'Will Harrison', 'Tom Blyth', 'Kit Connor',
  'Joe Locke', 'Louis Partridge', 'Finn Wolfhard', 'Noah Schnapp', 'Caleb McLaughlin',
  'Gaten Matarazzo', 'Mason Thames', 'Walker Scobell', 'Iñaki Godoy', 'Xolo Maridueña',
  'Tanner Buchanan', 'Rudy Pankow', 'Drew Ray Tanner', 'Jaeden Martell', 'Dominic Sessa',
  'Gabriel LaBelle', 'Michael Cimino', 'Asa Butterfield', 'Justice Smith', 'Shameik Moore',
];

const ACTRESSES = [
  'Zendaya', 'Emma Stone', 'Florence Pugh', 'Margot Robbie', 'Saoirse Ronan',
  'Anya Taylor-Joy', 'Jenna Ortega', 'Sydney Sweeney', 'Sadie Sink', 'Mikey Madison',
  'Cailee Spaeny', 'Margaret Qualley', 'Mia Goth', 'Rachel Sennott', 'Sophie Thatcher',
  'Isabela Merced', 'Storm Reid', 'Hunter Schafer', 'Inde Navarrette', 'Ariana Greenblatt',
  'Emma Myers', 'Dafne Keen', 'Joey King', 'Thomasin McKenzie', 'Rachel Zegler',
  'Hailee Steinfeld', 'Elle Fanning', 'Dakota Fanning', 'Daisy Edgar-Jones', 'Phoebe Dynevor',
  'Ayo Edebiri', 'Chase Infiniti', 'Bella Ramsey', 'McKenna Grace', 'Kiernan Shipka',
  'Millie Bobby Brown', 'Maya Hawke', "Odessa A'zion", 'Maude Apatow', 'Lola Tung',
  'Madelyn Cline', 'Camila Mendes', 'Lili Reinhart', 'Victoria Pedretti', 'Ella Purnell',
  'Ella Balinska', 'Naomi Scott', 'Olivia Cooke', 'Emma Mackey', 'Jodie Comer',
  'Vanessa Kirby', 'Rebecca Ferguson', 'Elizabeth Olsen', 'Brie Larson', 'Jennifer Lawrence',
  'Scarlett Johansson', 'Anne Hathaway', 'Natalie Portman', 'Emily Blunt', 'Jessica Chastain',
  'Amy Adams', 'Carey Mulligan', 'Kristen Stewart', 'Kirsten Dunst', 'Amanda Seyfried',
  'Michelle Williams', "Lupita Nyong'o", 'Tessa Thompson', 'Zazie Beetz', 'Keke Palmer',
  'Teyana Taylor', 'Letitia Wright', 'Naomi Ackie', 'Lashana Lynch', 'Danielle Deadwyler',
  'Danielle Brooks', "Da'Vine Joy Randolph", 'Quinta Brunson', 'Zoe Saldaña', 'Greta Lee',
  'Alicia Vikander', 'Janelle Monáe', 'Ruth Negga', 'Gemma Chan', 'Awkwafina',
  'Priyanka Chopra Jonas', 'Deepika Padukone', 'Michelle Yeoh', 'Sandra Oh', 'Cate Blanchett',
  'Nicole Kidman', 'Charlize Theron', 'Viola Davis', 'Regina King', 'Angela Bassett',
  'Kerry Washington', 'Taraji P. Henson', 'Halle Berry', 'Kate Winslet', 'Jessie Buckley',
];

const SHOWRUNNERS = [
  'Shonda Rhimes', 'Ryan Murphy', 'Taylor Sheridan', 'Vince Gilligan', 'David Benioff',
  'D. B. Weiss', 'Mike White', 'Jesse Armstrong', 'Bill Lawrence', 'Chuck Lorre',
  'Dick Wolf', 'Greg Berlanti', 'Damon Lindelof', 'Noah Hawley', 'David E. Kelley',
  'David Simon', 'Sam Esmail', 'Jonathan Nolan', 'Lisa Joy', 'Ronald D. Moore',
  'Dan Fogelman', 'Tony Gilroy', 'Craig Mazin', 'Christopher Storer', 'Dan Erickson',
  'Graham Yost', 'Scott Frank', 'Debora Cahn', 'Ryan Condal', 'Eric Kripke',
  'Rolin Jones', 'Lauren LeFranc', 'Mickey Down', 'Konrad Kay', 'John Hoffman',
  'Patrick McKay', 'J. D. Payne', 'Akiva Goldsman', 'Alex Kurtzman', 'Terry Matalas',
  'Quinta Brunson', 'Mindy Kaling', 'Michael Schur', 'Tina Fey', 'Robert Carlock',
  'Larry David', 'Dan Levy', 'Donald Glover', 'Francesca Sloane', 'Issa Rae',
  'Kenya Barris', 'Phoebe Waller-Bridge', 'Michaela Coel', 'Ramy Youssef', 'Sterlin Harjo',
  'Meredith Scardino', 'Paul W. Downs', 'Lucia Aniello', 'Jen Statsky', 'Rob McElhenney',
  'Charlie Day', 'Megan Ganz', 'Steven Levitan', 'Christopher Lloyd', 'Darren Star',
  'Matt Duffer', 'Ross Duffer', 'Jon Favreau', 'Dave Filoni', 'Mike Flanagan',
  'Carlton Cuse', 'Patrick Somerville', 'Bruno Heller', 'David S. Goyer', 'Jonathan Tropper',
  'Jonathan E. Steinberg', 'Robert Levine', 'Simon Kinberg', 'Steven S. DeKnight', 'J. H. Wyman',
  'Laeta Kalogridis', 'Bryan Fuller', 'Michael Green', 'Sera Gamble', 'Peter Gould',
  'George Pelecanos', 'Terence Winter', 'Nic Pizzolatto', 'Kurt Sutter', 'Elgin James',
  'Peter Morgan', 'Joe Weisberg', 'Joel Fields', 'Clyde Phillips', 'Veena Sud',
  'Melissa Rosenberg', 'Courtney A. Kemp', 'Sascha Penn', 'Katori Hall', 'Lee Daniels',
  'Peter Moffat', 'Gideon Raff', 'Howard Gordon', 'Alex Gansa', 'Lee Sung Jin',
  'Janine Nabers', 'Ashley Lyle', 'Bart Nickerson', 'Sam Levinson', 'Ziwe Fumudoh',
  'Bisha K. Ali', 'Issa López', 'Charlotte Stoudt', 'Alice Birch', 'Jack Thorne',
  'Joe Barton', 'Ron Nyswaner', 'Lucy Prebble', 'Molly Smith Metzler', 'Patrick Macmanus',
  'Zetna Fuentes', 'Tze Chun', 'Marissa Jo Cerar', 'Little Marvin',
];

const PRODUCERS = [
  'Steven Spielberg', 'Jerry Bruckheimer', 'Kathleen Kennedy', 'Kevin Feige', 'David Heyman',
  'Emma Thomas', 'Christopher Nolan', 'Dede Gardner', 'Jeremy Kleiner', 'Brad Pitt',
  'Jason Blum', 'James Wan', 'Jordan Peele', 'Ryan Coogler', 'Zinzi Coogler',
  'Sev Ohanian', 'Michael De Luca', 'Charles Roven', 'Scott Stuber', 'Dan Lin',
  'Lorenzo di Bonaventura', 'Neal H. Moritz', 'David Leitch', 'Kelly McCormick', 'Shawn Levy',
  'Simon Kinberg', 'Matthew Vaughn', 'Amy Pascal', 'Avi Arad', 'Matt Tolmach',
  'Phil Lord', 'Christopher Miller', 'Roy Lee', 'James Gunn', 'Peter Safran',
  'J.J. Abrams', 'Bryan Burk', 'Guillermo del Toro', 'Sam Mendes', 'Marc Platt',
  'Scott Rudin', 'Graham King', 'Tim Bevan', 'Eric Fellner', 'Donna Gigliotti',
  'Nina Jacobson', 'Brad Simpson', 'Reese Witherspoon', 'Margot Robbie', 'Tom Ackerley',
  'Josey McNamara', 'Leonardo DiCaprio', 'Jennifer Davisson', 'Will Smith', 'Denzel Washington',
  'Michael B. Jordan', 'LeBron James', 'Maverick Carter', 'Issa Rae', 'Ava DuVernay',
  'Tyler Perry', 'Oprah Winfrey', 'Shonda Rhimes', 'Ryan Murphy', 'Greg Berlanti',
  'Chuck Lorre', 'Dick Wolf', 'Taylor Sheridan', 'Vince Gilligan', 'Peter Gould',
  'Mike White', 'David Benioff', 'D. B. Weiss', 'Jonathan Nolan', 'Lisa Joy',
  'Dan Fogelman', 'Jesse Armstrong', 'Bill Lawrence', 'Michael Schur', 'Mindy Kaling',
  'Donald Glover', 'Phoebe Waller-Bridge', 'Seth Rogen', 'Evan Goldberg', 'Ben Stiller',
  'Adam McKay', 'Will Ferrell', 'Jordan Horowitz', 'Lars Knudsen', 'Ed Guiney',
  'Andrew Lowe', 'Yorgos Lanthimos', 'Megan Ellison', 'David Ellison', 'Dana Goldberg',
  'Don Granger', 'Mary Parent', 'Frank Marshall', 'Brian Grazer', 'Ron Howard',
  'Jason Bateman', 'Matt Damon', 'Ben Affleck', 'Viola Davis', 'Julius Tennon',
  'Kerry Washington', 'Sterling K. Brown', 'Daniel Dae Kim', 'Kenya Barris', 'Lena Waithe',
  'Quinta Brunson', 'Ayo Edebiri', 'Steve Martin', 'Martin Short', 'Selena Gomez',
  'Taika Waititi', 'Greta Gerwig', 'Noah Baumbach', 'Todd Phillips', 'Denis Villeneuve',
];

const DIRECTORS = [
  'Christopher Nolan', 'Steven Spielberg', 'Martin Scorsese', 'James Cameron', 'Quentin Tarantino',
  'Denis Villeneuve', 'Ryan Coogler', 'Greta Gerwig', 'Jordan Peele', 'Paul Thomas Anderson',
  'David Fincher', 'Ridley Scott', 'Christopher McQuarrie', 'James Gunn', 'Matt Reeves',
  'Jon Favreau', 'Shawn Levy', 'Sam Raimi', 'James Wan', 'David Leitch',
  'Chad Stahelski', 'Zack Snyder', 'Taika Waititi', 'Rian Johnson', 'J.J. Abrams',
  'Damien Chazelle', 'Ari Aster', 'Robert Eggers', 'Luca Guadagnino', 'Yorgos Lanthimos',
  'Emerald Fennell', 'Chloé Zhao', 'Barry Jenkins', 'Ava DuVernay', 'Gina Prince-Bythewood',
  'Nia DaCosta', 'Dee Rees', 'Regina King', 'Olivia Wilde', 'Sofia Coppola',
  'Kathryn Bigelow', 'Patty Jenkins', 'Sarah Polley', 'Celine Song', 'Coralie Fargeat',
  'Maggie Gyllenhaal', 'Rebecca Hall', 'Janicza Bravo', 'Boots Riley', 'Spike Lee',
  'Antoine Fuqua', 'F. Gary Gray', 'Malcolm D. Lee', 'Tim Story', 'Tyler Perry',
  'Lee Daniels', 'Kasi Lemmons', 'Jeymes Samuel', 'Blitz Bazawule', 'Steve McQueen',
  'Jordan Vogt-Roberts', 'Destin Daniel Cretton', 'Justin Lin', 'Jon M. Chu', 'Daniel Kwan',
  'Daniel Scheinert', 'Phil Lord', 'Christopher Miller', 'Joseph Kosinski', 'Gareth Edwards',
  'Matt Shakman', 'Andy Muschietti', 'Jaume Collet-Serra', 'Ruben Fleischer', 'Drew Goddard',
  'Scott Derrickson', 'Mike Flanagan', 'Ti West', 'Zach Cregger', 'Parker Finn',
  'Leigh Whannell', 'Jennifer Kent', 'Julia Ducournau', 'M. Night Shyamalan', 'Guillermo del Toro',
  'Alfonso Cuarón', 'Alejandro G. Iñárritu', 'Bong Joon-ho', 'Park Chan-wook', 'Hirokazu Kore-eda',
  'Ryusuke Hamaguchi', 'Pedro Almodóvar', 'Asghar Farhadi', 'Joachim Trier', 'Ruben Östlund',
  'Sean Baker', 'Josh Safdie', 'Benny Safdie', 'Darren Aronofsky', 'Todd Field',
  'Todd Phillips', 'Wes Anderson', 'Richard Linklater', 'Noah Baumbach', 'Alexander Payne',
  'Richard Curtis', 'Edgar Wright', 'Guy Ritchie', 'Matthew Vaughn', 'Sam Mendes',
  'Danny Boyle', 'Kenneth Branagh', 'George Miller', 'Peter Jackson', 'Robert Zemeckis',
  'Ron Howard', 'Clint Eastwood', 'Ben Affleck', 'Bradley Cooper', 'George Clooney',
  'Denzel Washington', 'Michael B. Jordan', 'John Krasinski', 'Ben Stiller', 'Jason Bateman',
  'Donald Glover', 'Bill Hader', 'Hiro Murai', 'Sam Esmail', 'Cary Joji Fukunaga',
  'Craig Mazin', 'Mark Mylod', 'Mimi Leder', 'Reed Morano', 'Michelle MacLaren',
  'Deborah Chow', 'Jessica Yu', 'S.J. Clarkson', 'Kogonada', 'Charlotte Wells',
  'Cooper Raiff', 'A.V. Rockwell', 'Raven Jackson',
];

const CINEMATOGRAPHERS = [
  'Roger Deakins', 'Greig Fraser', 'Hoyte van Hoytema', 'Rodrigo Prieto', 'Linus Sandgren',
  'Darius Khondji', 'Bradford Young', 'Emmanuel Lubezki', 'Robert Richardson', 'Claudio Miranda',
  'Rachel Morrison', 'Autumn Durald Arkapaw', 'Mandy Walker', 'Ari Wegner', 'Natasha Braier',
  'Polly Morgan', 'Alice Brooks', 'Kira Kelly', 'Charlotte Bruus Christensen', 'Maryse Alberti',
  'Ellen Kuras', 'Eduard Grau', 'Phedon Papamichael', 'Edward Lachman', 'Dan Laustsen',
  'Łukasz Żal', 'James Laxton', 'Sean Bobbitt', 'Matthew Libatique', 'Jeff Cronenweth',
  'Erik Messerschmidt', 'Lawrence Sher', 'Bill Pope', 'Larry Fong', 'Ben Davis',
  'Seamus McGarvey', 'Dion Beebe', 'John Mathieson', 'Newton Thomas Sigel', 'Jeff Cutter',
  'Jonathan Sela', 'Russell Carpenter', 'Don Burgess', 'Dean Cundey', 'Dariusz Wolski',
  'Salvatore Totino', 'Wally Pfister', 'Robert Elswit', 'Janusz Kamiński', 'Mihai Mălaimare Jr.',
  'Bruno Delbonnel', 'Stéphane Fontaine', 'Yorick Le Saux', 'Sayombhu Mukdeeprom', 'Chung Chung-hoon',
  'Hong Kyung-pyo', 'Kim Ji-yong', 'Hélène Louvart', 'Claire Mathon', 'Caroline Champetier',
  'Lol Crawley', 'Rob Hardy', 'George Steel', 'Fabian Wagner', 'Jonathan Freeman',
  'M. David Mullen', 'David Klein', 'Adam Arkapaw', 'Adam Newport-Berra', 'Alex Disenhof',
  'Michael Bauman', 'Adolpho Veloso', 'Mátyás Erdély', 'Christopher Blauvelt', 'Jarin Blaschke',
  'Benjamin Loeb', 'Zak Mulligan', 'Andrew Droz Palermo', 'Drew Daniels', 'Marcell Rév',
  'Rina Yang', 'Ashley Connor', 'Diana Olifirova', 'Larkin Seiple', 'Jomo Fray',
  'Shabier Kirchner', 'Khalid Mohtaseb', 'Mauro Fiore', 'Daniel Mindel', 'Henry Braham',
  'Matthew Jensen', 'Larry Blanford', 'Barry Ackroyd', 'Anthony Dod Mantle', 'Florian Hoffmeister',
  'James Friend', 'Danny Cohen', 'Robbie Ryan', 'Andrew Lesnie', 'Simon Duggan',
  'John Toll', 'Caleb Deschanel', 'Jeffrey Jur', 'Paul Cameron', 'Jo Willems',
  'Haris Zambarloukos', 'Rogier Stoffers', 'Roman Vasyanov', 'Steve Yedlin', 'Michael Seresin',
  'Bojan Bazelli', 'Peter Deming', 'Michael Fimognari', 'Daniel Moder', 'David Lanzenberg',
  "Jules O'Loughlin", 'Christophe Nuyens',
];

const COMPOSERS = [
  'Hans Zimmer', 'Ludwig Göransson', 'John Williams', 'Alexandre Desplat', 'Trent Reznor',
  'Atticus Ross', 'Jonny Greenwood', 'Hildur Guðnadóttir', 'Nicholas Britell', 'Daniel Pemberton',
  'Michael Giacchino', 'Alan Silvestri', 'James Newton Howard', 'Thomas Newman', 'Howard Shore',
  'Danny Elfman', 'John Powell', 'Harry Gregson-Williams', 'Ramin Djawadi', 'Bear McCreary',
  'Max Richter', 'Volker Bertelmann', 'Justin Hurwitz', 'Kris Bowers', 'Laura Karpman',
  'Natalie Holt', 'Mica Levi', 'Emile Mosseri', 'Jerskin Fendrix', 'Bryce Dessner',
  'Aaron Dessner', 'Carter Burwell', 'Marco Beltrami', 'Clint Mansell', 'Brian Tyler',
  'Steve Jablonsky', 'Lorne Balfe', 'Henry Jackman', 'Benjamin Wallfisch', 'Rupert Gregson-Williams',
  'Tom Holkenborg', 'Tyler Bates', 'Christophe Beck', 'Theodore Shapiro', 'Mark Mothersbaugh',
  'David Arnold', 'Patrick Doyle', 'Dario Marianelli', 'Abel Korzeniowski', 'Alex Heffes',
  'Daniel Hart', 'Dustin O’Halloran', 'Darren Korb', 'Austin Wintory', 'Christopher Willis',
  'Jeff Russo', 'Mac Quayle', 'Cristobal Tapia de Veer', 'Max Aruj', 'David Fleming',
  'Geoff Barrow', 'Ben Frost', 'Colin Stetson', 'Jed Kurzel', 'Daniel Lopatin',
  'Bobby Krlic', 'Rich Vreeland', 'Joseph Bishara', 'Christopher Young', 'Charlie Clouser',
  'Roque Baños', 'Fernando Velázquez', 'Michael Abels', 'Terence Blanchard', 'Raphael Saadiq',
  'Branford Marsalis', 'Tamar-kali', 'Kathryn Bostic', 'Germaine Franco', 'Nainita Desai',
  'Amelia Warner', 'Isobel Waller-Bridge', 'Anne-Kathrin Dern', 'Stephanie Economou', 'Pinar Toprak',
  'Amie Doherty', 'Laura Rossi', 'Rachel Portman', 'Debbie Wiseman', 'Lolita Ritmanis',
  'Sherri Chung', 'Heather McIntosh', 'Lesley Barber', 'Miriam Cutler', 'Chanda Dancy',
  'Emilie Levienaise-Farrouch', 'Hesham Nazih', 'Siddhartha Khosla', 'Carlos Rafael Rivera', 'Jeff Beal',
  'Nathan Barr', 'Trevor Morris', 'Sean Callery', 'Blake Neely', 'Atli Örvarsson',
  'Jeff Rona', 'Chris Bacon', 'Kevin Kiner', 'Sean Kiner', 'Deana Kiner',
  'Gordy Haab', 'Stephen Barton', 'David Buckley', 'Christopher Lennertz', 'John Debney',
  'Mark Isham', 'Craig Armstrong', 'George Fenton', 'Ilan Eshkeri', 'Steven Price',
  'Rob Simonsen', 'Andrew Lockington', 'Heitor Pereira', 'Marcelo Zarvos', 'Nathan Johnson',
  'David Wingo', 'Chris Bear', 'Daniel Rossen', 'Robin Carolan', 'Ryan Lott',
  'Rafiq Bhatia', 'Ian Chang', 'Nicholas Hooper', 'Alberto Iglesias', 'Gustavo Santaolalla',
  'Tomás Barreiro', 'Antonio Sánchez', 'Michael Brook', 'A. R. Rahman', 'Nitin Sawhney',
  'Jung Jae-il', 'Eiko Ishibashi',
];

/**
 * Where a name is shared with somebody better known, or where the person is
 * usually credited under another spelling. The hint is matched against the
 * record's own description of them.
 */
export const HINTS = {
  // Not the actor: the British television writer and producer.
  'Will Smith': { wants: /writer|producer|screenwriter|comedian/i, avoids: /^American actor|rapper/i, note: 'The British television writer and producer, not the actor.' },
  'Michael Cimino': { wants: /actor/i, avoids: /director|1939|1943/i, note: 'The actor, not the late director of the same name.' },
  'Michael Green': { wants: /screenwriter|producer|writer/i },
  'Bruno Heller': { wants: /screenwriter|producer|writer/i },
  'Robert Levine': { wants: /screenwriter|producer|writer|television/i },
  'Chris Bear': { wants: /musician|drummer|composer/i },
  'Sean Kiner': { wants: /composer/i },
  'Deana Kiner': { wants: /composer/i },
  'Steve Levitan': { wants: /producer|writer|television/i },
  'Christopher Lloyd': { wants: /screenwriter|producer|television writer/i, avoids: /^American actor/i, note: 'The television writer and producer, not the actor.' },
  'David Klein': { wants: /cinematograph/i },
  'George Steel': { wants: /cinematograph/i },
  'Jonathan Freeman': { wants: /cinematograph/i, avoids: /^American actor|voice actor/i, note: 'The cinematographer, not the actor.' },
  'Alice Brooks': { wants: /cinematograph/i },
  'Kira Kelly': { wants: /cinematograph/i },
  'Polly Morgan': { wants: /cinematograph/i, avoids: /sculptor|artist/i },
  'Rina Yang': { wants: /cinematograph/i },
  'Drew Daniels': { wants: /cinematograph/i },
  'Michael Bauman': { wants: /cinematograph/i },
  'Larry Blanford': { wants: /cinematograph/i },
  'Matthew Jensen': { wants: /cinematograph/i },
  'Jeff Cutter': { wants: /cinematograph/i },
  'Alex Disenhof': { wants: /cinematograph/i },
  'Adolpho Veloso': { wants: /cinematograph/i },
  'Zak Mulligan': { wants: /cinematograph/i },
  'Benjamin Loeb': { wants: /cinematograph/i },
  'Jomo Fray': { wants: /cinematograph/i },
  'Khalid Mohtaseb': { wants: /cinematograph/i },
  'Diana Olifirova': { wants: /cinematograph/i },
  'Ashley Connor': { wants: /cinematograph/i },
  'Tze Chun': { wants: /director|producer|writer/i },
  'Little Marvin': { wants: /writer|producer|creator/i },
  'Storm Reid': { wants: /actress|actor/i },
  'Chase Infiniti': { wants: /actress|actor/i },
  'Will Harrison': { wants: /actor/i },
  'Drew Ray Tanner': { wants: /actor/i },
  'Inde Navarrette': { wants: /actress|actor/i },
};

/**
 * Where the check cannot settle it but the identity is not in doubt: a person
 * the record does not file under the job they are best known for. Each one is
 * the entry the name means, chosen by hand and recorded here so the decision
 * is visible rather than buried in a heuristic.
 */
export const OVERRIDES = {
  'Janine Nabers': { qid: 'Q101109897', why: 'The record files her as a writer; she created and ran Swarm.' },
  'Ziwe Fumudoh': { qid: 'Q62269204', why: 'The record files her as a comedian and writer; she created and ran Ziwe.' },
  'Zetna Fuentes': { qid: 'Q16201697', why: 'The record files her as a television director, which is how she is credited.' },
  'LeBron James': { qid: 'Q36159', why: 'The record files him as a basketball player; he produces through SpringHill.' },
  'Max Aruj': { qid: 'Q135184205', why: 'The record has him as a film score composer with a thin occupation list.' },
  'Daniel Rossen': { qid: 'Q5218629', why: 'The record files him as a singer-songwriter; he has written for the screen.' },
  'Steven Levitan': { qid: 'Q542414', why: 'Listed as Steve Levitan; the record has him as Steven Levitan.' },
  'John Powell': { qid: 'Q313540', why: 'The film composer, not the American pianist of the same name who died in 1963.' },
};

/**
 * Listed, looked for, and not in the public record under any spelling. They
 * are kept here so the roster is honest about it: the game shows them as
 * named but unlisted rather than inventing a birthday and a filmography.
 */
export const NOT_IN_RECORD = [
  { name: 'Bart Nickerson', roles: ['showrunner'], note: 'Co-creator of Yellowjackets. No entry in the public record.' },
  { name: 'Marissa Jo Cerar', roles: ['showrunner'], note: 'No entry in the public record.' },
  { name: 'Little Marvin', roles: ['showrunner'], note: 'Creator of Them. No entry in the public record under that name.' },
  { name: 'Robert Levine', roles: ['showrunner'], note: 'Co-creator of Black Sails. The record has other people of that name, none of them him.' },
  { name: 'Diana Olifirova', roles: ['cinematographer'], note: 'No entry in the public record.' },
  { name: 'Larry Blanford', roles: ['cinematographer'], note: 'No entry in the public record.' },
  { name: 'Christophe Nuyens', roles: ['cinematographer'], note: 'No entry in the public record.' },
  { name: 'Tomás Barreiro', roles: ['composer'], note: 'No entry in the public record.' },
];

const LISTS = [
  ['actor', ACTORS], ['actor', ACTRESSES], ['showrunner', SHOWRUNNERS], ['producer', PRODUCERS],
  ['director', DIRECTORS], ['cinematographer', CINEMATOGRAPHERS], ['composer', COMPOSERS],
];

/** The roster: one entry per person, carrying every role they were listed under. */
export function roster() {
  const byName = new Map();
  for (const [role, names] of LISTS) {
    for (const name of names) {
      const entry = byName.get(name) ?? { name, roles: [], listedAs: [] };
      if (!entry.roles.includes(role)) entry.roles.push(role);
      byName.set(name, entry);
    }
  }
  // The two lists the roster was given as actors and actresses are kept as
  // they were given, because that is how the request grouped them.
  for (const name of ACTORS) if (byName.has(name)) byName.get(name).listedAs.push('actor');
  for (const name of ACTRESSES) if (byName.has(name)) byName.get(name).listedAs.push('actress');
  return [...byName.values()];
}

export const COUNTS = {
  actors: ACTORS.length, actresses: ACTRESSES.length, showrunners: SHOWRUNNERS.length,
  producers: PRODUCERS.length, directors: DIRECTORS.length,
  cinematographers: CINEMATOGRAPHERS.length, composers: COMPOSERS.length,
};
