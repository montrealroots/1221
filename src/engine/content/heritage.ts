/**
 * SLATE — where a name comes from.
 *
 * A family shares a name, and which names a family shares depends on where
 * that family is from. This is the list of heritages a character can be, and
 * for each one the given names and family names that are actually common in
 * it — so a Yoruba family is called Adeyemi and Okonjo rather than Rivera,
 * and a Korean one is called Park and Choi.
 *
 * What this is and is not. These are names drawn from published national and
 * regional name statistics — the lists registrars, census offices and civil
 * registries put out — and they are common names, not the only names. A
 * heritage is a naming tradition here and nothing else: it carries no
 * attribute, no skill, no advantage and no disadvantage anywhere in the game,
 * and the checker fails the build if it ever does. Nobody real is in this
 * file, and a name being on a list is not a claim about anybody who has it.
 */

export const HERITAGE_NOTE =
  'A heritage here is a naming tradition and nothing else. The names are common ones from published '
  + 'national and regional name lists, they aren’t the only names anybody has, and nobody real is '
  + 'in the list. It carries no attribute, no skill and no advantage anywhere in the game: it decides '
  + 'what your family is called and where they are likely to be from, and that’s all it does.';

export interface Heritage {
  id: string;
  /** What it is called on the picker. */
  label: string;
  /** The part of the world it names from. */
  region: string;
  /** Countries where a family of this heritage is most likely to be found. */
  countryIds: readonly string[];
  about: string;
  feminine: readonly string[];
  masculine: readonly string[];
  family: readonly string[];
}

const h = (
  id: string, label: string, region: string, countryIds: readonly string[], about: string,
  feminine: readonly string[], masculine: readonly string[], family: readonly string[],
): Heritage => ({ id, label, region, countryIds, about, feminine, masculine, family });

export const HERITAGES: readonly Heritage[] = [
  // --- The British Isles and the anglophone world -------------------------
  h('english', 'English', 'Northern Europe', ['uk', 'us', 'au', 'nz', 'ca'],
    'Names common across England and the countries English settlement carried them to.',
    ['Amelia', 'Olivia', 'Charlotte', 'Emily', 'Grace', 'Alice', 'Eleanor', 'Harriet', 'Jane', 'Rosie', 'Freya', 'Imogen', 'Beatrice', 'Poppy', 'Nancy'],
    ['Oliver', 'George', 'Harry', 'Thomas', 'Arthur', 'Henry', 'Edward', 'Alfie', 'Charlie', 'William', 'Freddie', 'Albie', 'Reggie', 'Stanley', 'Rupert'],
    ['Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Davies', 'Evans', 'Thomas', 'Johnson', 'Roberts', 'Walker', 'Wright', 'Robinson', 'Thompson', 'Hall', 'Green', 'Wood', 'Harris', 'Clarke', 'Baker']),
  h('irish', 'Irish', 'Northern Europe', ['ie', 'uk', 'us', 'au'],
    'Names common in Ireland and through the Irish diaspora.',
    ['Saoirse', 'Aoife', 'Niamh', 'Ciara', 'Sinead', 'Roisin', 'Maeve', 'Orla', 'Clodagh', 'Fiadh', 'Grainne', 'Aisling'],
    ['Sean', 'Conor', 'Cian', 'Oisin', 'Fionn', 'Padraig', 'Eoin', 'Cormac', 'Ronan', 'Declan', 'Tadhg', 'Diarmuid'],
    ['Murphy', 'Kelly', 'OSullivan', 'Walsh', 'Smith', 'OBrien', 'Byrne', 'Ryan', 'OConnor', 'ONeill', 'Reilly', 'Doyle', 'McCarthy', 'Gallagher', 'Doherty', 'Kennedy', 'Lynch', 'Murray', 'Quinn', 'Moore']),
  h('scottish', 'Scottish', 'Northern Europe', ['uk', 'ca', 'nz'],
    'Names common in Scotland and where Scots settled.',
    ['Isla', 'Eilidh', 'Skye', 'Mhairi', 'Catriona', 'Morag', 'Fiona', 'Iona', 'Lorna', 'Ailsa'],
    ['Callum', 'Hamish', 'Fraser', 'Angus', 'Euan', 'Rory', 'Lachlan', 'Struan', 'Alasdair', 'Duncan'],
    ['MacDonald', 'Campbell', 'Stewart', 'Robertson', 'Thomson', 'Anderson', 'MacLeod', 'Fraser', 'Ross', 'Murray', 'Grant', 'Cameron', 'Duncan', 'Ferguson', 'Kerr']),
  h('welsh', 'Welsh', 'Northern Europe', ['uk'],
    'Names common in Wales.',
    ['Ffion', 'Carys', 'Seren', 'Bethan', 'Nia', 'Eleri', 'Angharad', 'Megan'],
    ['Dylan', 'Rhys', 'Owain', 'Gareth', 'Ieuan', 'Bryn', 'Emrys', 'Gruffydd'],
    ['Jones', 'Williams', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Lewis', 'Hughes', 'Morgan', 'Griffiths', 'Owen', 'Rees', 'Price', 'Powell']),

  // --- Continental Europe --------------------------------------------------
  h('french', 'French', 'Western Europe', ['fr', 'be', 'ch', 'ca', 'lu'],
    'Names common in France and francophone Europe and Canada.',
    ['Camille', 'Chloe', 'Manon', 'Ines', 'Louise', 'Juliette', 'Zoe', 'Elise', 'Margaux', 'Amelie', 'Solene', 'Océane'],
    ['Lucas', 'Hugo', 'Nathan', 'Theo', 'Antoine', 'Baptiste', 'Mathieu', 'Guillaume', 'Julien', 'Etienne', 'Florian', 'Loic'],
    ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier']),
  h('german', 'German', 'Central Europe', ['de', 'at', 'ch'],
    'Names common in Germany, Austria and German-speaking Switzerland.',
    ['Hannah', 'Lena', 'Emilia', 'Greta', 'Johanna', 'Leonie', 'Annika', 'Franziska', 'Katharina', 'Ingrid'],
    ['Lukas', 'Jonas', 'Maximilian', 'Felix', 'Sebastian', 'Matthias', 'Tobias', 'Stefan', 'Klaus', 'Andreas'],
    ['Muller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Schwarz', 'Zimmermann']),
  h('italian', 'Italian', 'Southern Europe', ['it', 'ch', 'us', 'ar'],
    'Names common in Italy and through the Italian diaspora.',
    ['Giulia', 'Chiara', 'Francesca', 'Martina', 'Alessia', 'Valentina', 'Elena', 'Beatrice', 'Ludovica', 'Serena'],
    ['Lorenzo', 'Matteo', 'Alessandro', 'Francesco', 'Giuseppe', 'Andrea', 'Marco', 'Luca', 'Davide', 'Riccardo'],
    ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Giordano', 'Rizzo', 'Lombardi']),
  h('spanish', 'Spanish', 'Southern Europe', ['es'],
    'Names common in Spain.',
    ['Lucia', 'Sofia', 'Martina', 'Paula', 'Carmen', 'Marta', 'Alba', 'Irene', 'Rocio', 'Nuria'],
    ['Hugo', 'Mateo', 'Pablo', 'Alvaro', 'Javier', 'Sergio', 'Ignacio', 'Rodrigo', 'Iker', 'Gonzalo'],
    ['Garcia', 'Rodriguez', 'Gonzalez', 'Fernandez', 'Lopez', 'Martinez', 'Sanchez', 'Perez', 'Gomez', 'Martin', 'Jimenez', 'Ruiz', 'Hernandez', 'Diaz', 'Moreno', 'Alvarez', 'Romero', 'Navarro']),
  h('portuguese', 'Portuguese', 'Southern Europe', ['pt'],
    'Names common in Portugal.',
    ['Beatriz', 'Matilde', 'Leonor', 'Ines', 'Carolina', 'Mariana', 'Constanca', 'Joana'],
    ['Joao', 'Tomas', 'Duarte', 'Rodrigo', 'Afonso', 'Goncalo', 'Tiago', 'Diogo'],
    ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Jesus', 'Sousa', 'Fernandes', 'Goncalves', 'Gomes', 'Lopes', 'Marques', 'Alves']),
  h('dutch', 'Dutch', 'Western Europe', ['nl', 'be'],
    'Names common in the Netherlands and Flanders.',
    ['Emma', 'Julia', 'Sanne', 'Lotte', 'Fenna', 'Anouk', 'Marieke', 'Saskia'],
    ['Daan', 'Sem', 'Bram', 'Thijs', 'Jeroen', 'Willem', 'Joris', 'Bas'],
    ['De Jong', 'Jansen', 'De Vries', 'Van den Berg', 'Van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer', 'De Boer', 'Mulder', 'De Groot', 'Bos', 'Vos']),
  h('nordic', 'Nordic', 'Northern Europe', ['se', 'no', 'dk', 'fi', 'is'],
    'Names common across Sweden, Norway, Denmark, Finland and Iceland.',
    ['Astrid', 'Ingrid', 'Freja', 'Sigrid', 'Maja', 'Elin', 'Solveig', 'Annika', 'Liv', 'Thora'],
    ['Lars', 'Erik', 'Bjorn', 'Magnus', 'Anders', 'Sven', 'Henrik', 'Kristian', 'Mikael', 'Rasmus'],
    ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Larsson', 'Olsen', 'Hansen', 'Jensen', 'Nielsen', 'Pedersen', 'Lindgren', 'Berg', 'Lund', 'Sandberg', 'Virtanen', 'Korhonen']),
  h('polish', 'Polish', 'Central Europe', ['pl'],
    'Names common in Poland and through the Polish diaspora.',
    ['Zofia', 'Julia', 'Lena', 'Maja', 'Alicja', 'Agnieszka', 'Katarzyna', 'Magdalena'],
    ['Jakub', 'Kacper', 'Szymon', 'Wojciech', 'Piotr', 'Tomasz', 'Krzysztof', 'Marcin'],
    ['Nowak', 'Kowalski', 'Wisniewski', 'Wojcik', 'Kowalczyk', 'Kaminski', 'Lewandowski', 'Zielinski', 'Szymanski', 'Wozniak', 'Dabrowski', 'Kozlowski', 'Mazur', 'Krawczyk']),
  h('russian', 'Russian', 'Eastern Europe', ['ru', 'by', 'kz'],
    'Names common in Russia and Russian-speaking Eurasia.',
    ['Anastasia', 'Sofia', 'Ekaterina', 'Yulia', 'Svetlana', 'Irina', 'Natalia', 'Ksenia'],
    ['Ivan', 'Dmitri', 'Sergei', 'Andrei', 'Nikolai', 'Alexei', 'Maxim', 'Vladimir'],
    ['Ivanov', 'Smirnov', 'Kuznetsov', 'Popov', 'Vasiliev', 'Petrov', 'Sokolov', 'Mikhailov', 'Novikov', 'Fedorov', 'Morozov', 'Volkov', 'Alekseev', 'Lebedev']),
  h('ukrainian', 'Ukrainian', 'Eastern Europe', ['ua'],
    'Names common in Ukraine.',
    ['Sofiia', 'Anna', 'Kateryna', 'Oksana', 'Yaryna', 'Solomiya', 'Nataliya'],
    ['Andriy', 'Bohdan', 'Taras', 'Oleh', 'Mykola', 'Yaroslav', 'Volodymyr'],
    ['Melnyk', 'Shevchenko', 'Boyko', 'Kovalenko', 'Bondarenko', 'Tkachenko', 'Kravchenko', 'Oliynyk', 'Shevchuk', 'Koval', 'Polishchuk', 'Marchenko']),
  h('greek', 'Greek', 'Southern Europe', ['gr', 'cy'],
    'Names common in Greece and Cyprus.',
    ['Eleni', 'Maria', 'Sofia', 'Katerina', 'Despina', 'Ioanna', 'Anastasia'],
    ['Yiannis', 'Nikos', 'Dimitris', 'Kostas', 'Panagiotis', 'Stavros', 'Alexandros'],
    ['Papadopoulos', 'Papadakis', 'Georgiou', 'Nikolaou', 'Vlachos', 'Antoniou', 'Christodoulou', 'Ioannou', 'Dimitriou', 'Makris', 'Pappas', 'Karagiannis']),
  h('balkan', 'Balkan', 'Southern Europe', ['rs', 'hr', 'ba', 'me', 'mk', 'si'],
    'Names common across the western Balkans.',
    ['Ana', 'Marija', 'Jelena', 'Milica', 'Ivana', 'Dragana', 'Sanja'],
    ['Marko', 'Nikola', 'Stefan', 'Luka', 'Milos', 'Dusan', 'Ivan'],
    ['Jovanovic', 'Petrovic', 'Nikolic', 'Markovic', 'Djordjevic', 'Stojanovic', 'Ilic', 'Horvat', 'Kovacevic', 'Babic', 'Maric', 'Novak']),
  h('hungarian', 'Hungarian', 'Central Europe', ['hu'],
    'Names common in Hungary.',
    ['Anna', 'Hanna', 'Zsofia', 'Eszter', 'Reka', 'Ildiko', 'Boglarka'],
    ['Bence', 'Mate', 'Levente', 'Zoltan', 'Attila', 'Gergely', 'Csaba'],
    ['Nagy', 'Kovacs', 'Toth', 'Szabo', 'Horvath', 'Varga', 'Kiss', 'Molnar', 'Nemeth', 'Farkas', 'Balogh', 'Papp']),
  h('czechslovak', 'Czech And Slovak', 'Central Europe', ['cz', 'sk'],
    'Names common in Czechia and Slovakia.',
    ['Tereza', 'Eliska', 'Katerina', 'Lucie', 'Zuzana', 'Barbora'],
    ['Jakub', 'Tomas', 'Ondrej', 'Petr', 'Marek', 'Vojtech'],
    ['Novak', 'Svoboda', 'Novotny', 'Dvorak', 'Cerny', 'Prochazka', 'Kucera', 'Vesely', 'Horak', 'Nemec', 'Pokorny', 'Marek']),
  h('romanian', 'Romanian', 'Eastern Europe', ['ro', 'md'],
    'Names common in Romania and Moldova.',
    ['Maria', 'Ioana', 'Andreea', 'Elena', 'Gabriela', 'Alexandra'],
    ['Andrei', 'Mihai', 'Stefan', 'Cristian', 'Ionut', 'Vlad'],
    ['Popa', 'Popescu', 'Ionescu', 'Radu', 'Dumitru', 'Stan', 'Stoica', 'Gheorghe', 'Matei', 'Constantin', 'Marin', 'Diaconu']),
  h('ashkenazi', 'Ashkenazi Jewish', 'Central Europe', ['us', 'il', 'uk', 'ca', 'ar'],
    'Names common in Ashkenazi Jewish families in Europe, Israel and the Americas.',
    ['Miriam', 'Rivka', 'Shoshana', 'Naomi', 'Tamar', 'Chava', 'Esther', 'Yael'],
    ['Aryeh', 'Shmuel', 'Yosef', 'Mordechai', 'Menachem', 'Baruch', 'Eli', 'Avi'],
    ['Cohen', 'Levy', 'Katz', 'Friedman', 'Goldberg', 'Rosenberg', 'Shapiro', 'Weiss', 'Schwartz', 'Kaplan', 'Bernstein', 'Feldman', 'Stern', 'Gross']),
  h('sephardi', 'Sephardi And Mizrahi Jewish', 'Middle East', ['il', 'fr', 'us', 'ma'],
    'Names common in Sephardi and Mizrahi Jewish families.',
    ['Yaffa', 'Simcha', 'Ora', 'Shulamit', 'Rachel', 'Aviva'],
    ['Moshe', 'Yitzhak', 'Chaim', 'Shlomo', 'Nissim', 'Eliyahu'],
    ['Mizrahi', 'Peretz', 'Biton', 'Amar', 'Ohana', 'Dahan', 'Azoulay', 'Elbaz', 'Toledano', 'Sasson', 'Hazan', 'Malka']),

  // --- The Middle East and North Africa ------------------------------------
  h('arab', 'Arab', 'Middle East', ['eg', 'sa', 'ae', 'jo', 'lb', 'iq', 'sy', 'kw', 'qa', 'om', 'bh'],
    'Names common across the Arabic-speaking world.',
    ['Fatima', 'Aisha', 'Layla', 'Noor', 'Maryam', 'Zainab', 'Rania', 'Hala', 'Amira', 'Salma'],
    ['Mohammed', 'Ahmed', 'Ali', 'Omar', 'Youssef', 'Khalid', 'Hassan', 'Ibrahim', 'Tariq', 'Karim'],
    ['Al Sayed', 'Haddad', 'Khalil', 'Nasser', 'Saleh', 'Mansour', 'Farah', 'Aziz', 'Hakim', 'Sultan', 'Rashid', 'Najjar', 'Qureshi', 'Shammari']),
  h('amazigh', 'Amazigh And Maghrebi', 'North Africa', ['ma', 'dz', 'tn', 'ly'],
    'Names common in the Maghreb, Amazigh and Arabic together.',
    ['Yasmine', 'Amina', 'Nadia', 'Malika', 'Tinhinan', 'Kahina', 'Sara'],
    ['Yacine', 'Karim', 'Mehdi', 'Idir', 'Massinissa', 'Sofiane', 'Bilal'],
    ['Benali', 'Bouzid', 'Amrani', 'Belkacem', 'Cherif', 'Idrissi', 'Alaoui', 'Bennani', 'Tazi', 'Ouali', 'Hamdi', 'Zerrouki']),
  h('persian', 'Persian', 'Middle East', ['ir', 'af', 'tj'],
    'Names common in Iran and Persian-speaking Central Asia.',
    ['Shirin', 'Roya', 'Parisa', 'Nasrin', 'Leila', 'Setareh', 'Mahsa'],
    ['Reza', 'Amir', 'Kaveh', 'Farhad', 'Babak', 'Siavash', 'Arash'],
    ['Hosseini', 'Ahmadi', 'Rezaei', 'Mohammadi', 'Karimi', 'Moradi', 'Jafari', 'Ghasemi', 'Rahimi', 'Sadeghi', 'Kazemi', 'Naderi']),
  h('turkish', 'Turkish', 'Middle East', ['tr'],
    'Names common in Turkey.',
    ['Zeynep', 'Elif', 'Ayse', 'Fatma', 'Merve', 'Ece', 'Defne'],
    ['Mehmet', 'Mustafa', 'Emre', 'Burak', 'Kaan', 'Cem', 'Ahmet'],
    ['Yilmaz', 'Kaya', 'Demir', 'Sahin', 'Celik', 'Yildiz', 'Yildirim', 'Ozturk', 'Aydin', 'Ozdemir', 'Arslan', 'Dogan', 'Kilic', 'Aslan']),
  h('armenian', 'Armenian', 'Caucasus', ['am', 'us', 'fr', 'ru'],
    'Names common in Armenia and through the Armenian diaspora.',
    ['Anahit', 'Lusine', 'Gayane', 'Nare', 'Sona', 'Mariam'],
    ['Aram', 'Vahe', 'Tigran', 'Hayk', 'Levon', 'Gevorg'],
    ['Sargsyan', 'Grigoryan', 'Hakobyan', 'Harutyunyan', 'Petrosyan', 'Khachatryan', 'Vardanyan', 'Avetisyan', 'Manukyan', 'Karapetyan']),

  // --- Africa ---------------------------------------------------------------
  h('yoruba', 'Yoruba', 'West Africa', ['ng', 'bj'],
    'Names common among Yoruba families in Nigeria and Benin.',
    ['Adunni', 'Folake', 'Yewande', 'Titilayo', 'Omolara', 'Bunmi', 'Adeola', 'Simisola'],
    ['Adebayo', 'Olumide', 'Babatunde', 'Kayode', 'Segun', 'Femi', 'Tunde', 'Oluwaseun'],
    ['Adeyemi', 'Ogunleye', 'Balogun', 'Adebayo', 'Okonkwo', 'Afolabi', 'Oyelaran', 'Adegoke', 'Ogundipe', 'Bakare', 'Alabi', 'Sowande']),
  h('igbo', 'Igbo', 'West Africa', ['ng'],
    'Names common among Igbo families in Nigeria.',
    ['Chiamaka', 'Ngozi', 'Adaeze', 'Nkechi', 'Ifeoma', 'Chinelo', 'Amarachi'],
    ['Chidi', 'Emeka', 'Obinna', 'Ikenna', 'Chukwuemeka', 'Nnamdi', 'Uche'],
    ['Okafor', 'Okonkwo', 'Eze', 'Nwosu', 'Obi', 'Anyanwu', 'Nwachukwu', 'Chukwu', 'Onyeka', 'Ikechukwu', 'Madu', 'Nwankwo']),
  h('akan', 'Akan And Ghanaian', 'West Africa', ['gh', 'ci'],
    'Names common in Ghana and among Akan families.',
    ['Akosua', 'Abena', 'Afia', 'Ama', 'Adwoa', 'Yaa', 'Esi'],
    ['Kwame', 'Kofi', 'Kwaku', 'Yaw', 'Kojo', 'Kwabena', 'Kwasi'],
    ['Mensah', 'Boateng', 'Asante', 'Owusu', 'Agyeman', 'Appiah', 'Osei', 'Amoah', 'Danso', 'Ofori', 'Frimpong', 'Sarpong']),
  h('swahili', 'East African', 'East Africa', ['ke', 'tz', 'ug'],
    'Names common in Kenya, Tanzania and Uganda.',
    ['Amani', 'Zuri', 'Neema', 'Halima', 'Rehema', 'Asha', 'Wanjiru'],
    ['Juma', 'Baraka', 'Jabari', 'Kamau', 'Mwangi', 'Otieno', 'Bakari'],
    ['Mwangi', 'Otieno', 'Kamau', 'Wanjiku', 'Ochieng', 'Njoroge', 'Mutua', 'Kimani', 'Onyango', 'Wafula', 'Mbeki', 'Juma']),
  h('ethiopian', 'Ethiopian And Eritrean', 'East Africa', ['et', 'er'],
    'Names common in Ethiopia and Eritrea.',
    ['Selam', 'Hanna', 'Bethlehem', 'Meseret', 'Tigist', 'Rahel'],
    ['Abebe', 'Dawit', 'Yonas', 'Tesfaye', 'Bereket', 'Kidane'],
    ['Tesfaye', 'Bekele', 'Girma', 'Haile', 'Gebre', 'Alemu', 'Desta', 'Mekonnen', 'Tadesse', 'Assefa', 'Wolde', 'Abera']),
  h('southernafrican', 'Southern African', 'Southern Africa', ['za', 'zw', 'bw', 'ls', 'sz'],
    'Names common among Zulu, Xhosa, Sotho and Tswana families.',
    ['Thandiwe', 'Nomsa', 'Zanele', 'Lerato', 'Nokuthula', 'Palesa', 'Ayanda'],
    ['Sipho', 'Thabo', 'Bongani', 'Mandla', 'Kagiso', 'Lwazi', 'Tshepo'],
    ['Dlamini', 'Nkosi', 'Ndlovu', 'Mokoena', 'Khumalo', 'Mabaso', 'Zulu', 'Sithole', 'Molefe', 'Mahlangu', 'Tshabalala', 'Maseko']),
  h('somali', 'Somali', 'East Africa', ['so', 'et', 'ke', 'uk', 'us'],
    'Names common in Somalia and the Somali diaspora.',
    ['Hodan', 'Ayaan', 'Sagal', 'Ifrah', 'Deqa', 'Amal'],
    ['Abdi', 'Farah', 'Guled', 'Warsame', 'Hassan', 'Ismail'],
    ['Hassan', 'Ahmed', 'Farah', 'Mohamed', 'Abdi', 'Warsame', 'Jama', 'Osman', 'Yusuf', 'Ali', 'Nur', 'Aden']),

  // --- The Americas ---------------------------------------------------------
  h('africanamerican', 'African American', 'North America', ['us'],
    'Names common in African American families in the United States.',
    ['Aaliyah', 'Imani', 'Jada', 'Nia', 'Tiana', 'Kiara', 'Zaria', 'Amari', 'Denise', 'Latoya'],
    ['Jamal', 'Malik', 'Darius', 'Terrence', 'Marquis', 'Andre', 'Jerome', 'Devon', 'Tyrone', 'Isaiah'],
    ['Washington', 'Jefferson', 'Jackson', 'Robinson', 'Coleman', 'Freeman', 'Booker', 'Dupree', 'Gaines', 'Whitfield', 'Bradley', 'Hayes', 'Baldwin', 'Carver', 'Lofton', 'Ellison']),
  h('caribbean', 'Afro Caribbean', 'The Caribbean', ['jm', 'tt', 'bb', 'ht', 'uk', 'us'],
    'Names common in Caribbean families and the Caribbean diaspora.',
    ['Shanice', 'Kadeisha', 'Anika', 'Marcia', 'Camille', 'Nadine'],
    ['Devon', 'Dwayne', 'Everton', 'Rohan', 'Kemar', 'Andre'],
    ['Campbell', 'Brown', 'Williams', 'Grant', 'Bailey', 'Clarke', 'Reid', 'Gordon', 'Henry', 'Blake', 'Morgan', 'Sinclair']),
  h('mexican', 'Mexican', 'North America', ['mx', 'us'],
    'Names common in Mexico and Mexican American families.',
    ['Guadalupe', 'Ximena', 'Regina', 'Valentina', 'Fernanda', 'Itzel', 'Renata'],
    ['Santiago', 'Diego', 'Emiliano', 'Alejandro', 'Sebastian', 'Rodrigo', 'Cuauhtemoc'],
    ['Hernandez', 'Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Cruz', 'Flores', 'Reyes', 'Torres', 'Rivera', 'Morales', 'Ortiz', 'Vazquez']),
  h('brazilian', 'Brazilian', 'South America', ['br'],
    'Names common in Brazil.',
    ['Ana Clara', 'Beatriz', 'Larissa', 'Camila', 'Fernanda', 'Juliana', 'Bruna'],
    ['Gabriel', 'Rafael', 'Thiago', 'Vinicius', 'Matheus', 'Bruno', 'Caio'],
    ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Ferreira', 'Alves', 'Costa', 'Ribeiro', 'Carvalho', 'Almeida', 'Barbosa', 'Rocha']),
  h('andean', 'Andean', 'South America', ['pe', 'bo', 'ec'],
    'Names common in Peru, Bolivia and Ecuador, Spanish and Quechua together.',
    ['Milagros', 'Rosa', 'Yolanda', 'Nayra', 'Sisa', 'Killa'],
    ['Wilfredo', 'Nestor', 'Amaru', 'Tupac', 'Rodrigo', 'Yupanqui'],
    ['Quispe', 'Mamani', 'Condori', 'Flores', 'Huaman', 'Choque', 'Vargas', 'Apaza', 'Ticona', 'Cusi', 'Guaman', 'Yupanqui']),
  h('southerncone', 'Southern Cone', 'South America', ['ar', 'cl', 'uy'],
    'Names common in Argentina, Chile and Uruguay.',
    ['Sofia', 'Valentina', 'Catalina', 'Josefa', 'Agustina', 'Florencia'],
    ['Mateo', 'Benjamin', 'Agustin', 'Joaquin', 'Tomas', 'Vicente'],
    ['Gonzalez', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez', 'Munoz', 'Rojas', 'Diaz', 'Silva', 'Soto', 'Contreras', 'Sepulveda']),
  h('nativeamerican', 'Native American', 'North America', ['us', 'ca'],
    'Family names common in Native American and First Nations communities.',
    ['Aiyana', 'Winona', 'Kaya', 'Talulah', 'Nizhoni', 'Awinita'],
    ['Dakota', 'Ahanu', 'Chayton', 'Tokala', 'Hototo', 'Nayati'],
    ['Begay', 'Yazzie', 'Tsosie', 'Benally', 'Whitehorse', 'Redcloud', 'Runningwater', 'Twobears', 'Silvermoon', 'Littlefeather', 'Blackfeather', 'Standingbear']),

  // --- Asia -----------------------------------------------------------------
  h('han', 'Chinese', 'East Asia', ['cn', 'tw', 'sg', 'my', 'hk'],
    'Names common across Chinese-speaking families.',
    ['Xiuying', 'Meiling', 'Yan', 'Jing', 'Fang', 'Li Na', 'Xiaoyu', 'Wenjing'],
    ['Wei', 'Jun', 'Hao', 'Ming', 'Lei', 'Zhiyuan', 'Chen', 'Xiaolong'],
    ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou', 'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'Lin', 'He']),
  h('korean', 'Korean', 'East Asia', ['kr'],
    'Names common in Korea and the Korean diaspora.',
    ['Ji-woo', 'Seo-yeon', 'Ha-eun', 'Min-seo', 'Soo-jin', 'Eun-ji', 'Yu-na'],
    ['Min-jun', 'Do-yun', 'Ji-hoon', 'Seung-min', 'Jae-won', 'Tae-yang', 'Hyun-woo'],
    ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Shin', 'Oh', 'Seo']),
  h('japanese', 'Japanese', 'East Asia', ['jp'],
    'Names common in Japan.',
    ['Yui', 'Aoi', 'Hina', 'Sakura', 'Rin', 'Mei', 'Hana', 'Kaede'],
    ['Haruto', 'Sota', 'Yuto', 'Ren', 'Kaito', 'Riku', 'Hiroshi', 'Takumi'],
    ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto']),
  h('vietnamese', 'Vietnamese', 'Southeast Asia', ['vn'],
    'Names common in Vietnam and the Vietnamese diaspora.',
    ['Linh', 'Mai', 'Thao', 'Ngoc', 'Huong', 'Trang', 'Quyen'],
    ['Minh', 'Tuan', 'Hoang', 'Duc', 'Khanh', 'Bao', 'Long'],
    ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Phan', 'Vu', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly']),
  h('filipino', 'Filipino', 'Southeast Asia', ['ph'],
    'Names common in the Philippines.',
    ['Maria Clara', 'Angelica', 'Kristine', 'Divina', 'Luzviminda', 'Analyn'],
    ['Jose', 'Ricardo', 'Emmanuel', 'Rolando', 'Danilo', 'Jerome'],
    ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Torres', 'Ramos', 'Del Rosario', 'Aquino', 'Villanueva', 'Castillo']),
  h('thai', 'Thai', 'Southeast Asia', ['th'],
    'Names common in Thailand.',
    ['Siriporn', 'Kanya', 'Malee', 'Ratana', 'Pim', 'Nong'],
    ['Somchai', 'Anan', 'Chaiwat', 'Nattapong', 'Prasert', 'Thanawat'],
    ['Saetang', 'Wongsawat', 'Chaiyaphum', 'Srisuk', 'Boonmee', 'Rattanakosin', 'Thongchai', 'Sawatdee', 'Phong', 'Kittisak']),
  h('malay', 'Malay And Indonesian', 'Southeast Asia', ['id', 'my', 'bn', 'sg'],
    'Names common in Indonesia, Malaysia and Brunei.',
    ['Siti', 'Nurul', 'Dewi', 'Ayu', 'Putri', 'Rina', 'Farah'],
    ['Muhammad', 'Ahmad', 'Budi', 'Rizky', 'Adi', 'Hafiz', 'Iqbal'],
    ['Abdullah', 'Ibrahim', 'Hassan', 'Rahman', 'Yusof', 'Wijaya', 'Santoso', 'Pratama', 'Kusuma', 'Halim', 'Saputra', 'Nugroho']),
  h('northindian', 'North Indian', 'South Asia', ['in'],
    'Names common in north India, Hindi and related languages.',
    ['Aanya', 'Diya', 'Priya', 'Kavita', 'Meera', 'Ananya', 'Sneha', 'Radhika'],
    ['Arjun', 'Rohan', 'Aditya', 'Vikram', 'Rahul', 'Karan', 'Ishaan', 'Devendra'],
    ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Yadav', 'Mishra', 'Tiwari', 'Chauhan', 'Joshi', 'Agarwal', 'Pandey', 'Shukla', 'Saxena']),
  h('southindian', 'South Indian', 'South Asia', ['in', 'lk'],
    'Names common in south India, Tamil, Telugu, Kannada and Malayalam.',
    ['Lakshmi', 'Divya', 'Kavya', 'Anitha', 'Padma', 'Revathi', 'Deepa'],
    ['Karthik', 'Suresh', 'Venkatesh', 'Arjun', 'Ravi', 'Balaji', 'Naveen'],
    ['Iyer', 'Nair', 'Menon', 'Reddy', 'Naidu', 'Pillai', 'Rao', 'Krishnan', 'Subramanian', 'Chandran', 'Gowda', 'Varma']),
  h('punjabi', 'Punjabi And Sikh', 'South Asia', ['in', 'pk', 'ca', 'uk'],
    'Names common in Punjab and through the Punjabi and Sikh diaspora.',
    ['Simran', 'Harpreet', 'Manpreet', 'Jaspreet', 'Gurleen', 'Amrit'],
    ['Gurpreet', 'Harjit', 'Jaskaran', 'Ranjit', 'Baljit', 'Sukhdev'],
    ['Singh', 'Kaur', 'Gill', 'Sidhu', 'Dhillon', 'Grewal', 'Bajwa', 'Sandhu', 'Brar', 'Randhawa', 'Chahal', 'Mann']),
  h('bengali', 'Bengali', 'South Asia', ['bd', 'in'],
    'Names common in Bangladesh and West Bengal.',
    ['Rupa', 'Sharmila', 'Nusrat', 'Tania', 'Moushumi', 'Ishita'],
    ['Rahim', 'Shakib', 'Arnab', 'Sourav', 'Tanvir', 'Anik'],
    ['Rahman', 'Hossain', 'Islam', 'Chowdhury', 'Ahmed', 'Banerjee', 'Chatterjee', 'Mukherjee', 'Das', 'Ghosh', 'Sarkar', 'Roy']),
  h('pakistani', 'Pakistani', 'South Asia', ['pk'],
    'Names common in Pakistan.',
    ['Ayesha', 'Fatima', 'Hina', 'Sana', 'Mahnoor', 'Zara'],
    ['Bilal', 'Usman', 'Hamza', 'Faisal', 'Imran', 'Zain'],
    ['Khan', 'Malik', 'Butt', 'Chaudhry', 'Sheikh', 'Qureshi', 'Baig', 'Awan', 'Abbasi', 'Bhatti', 'Rana', 'Mirza']),

  // --- Oceania --------------------------------------------------------------
  h('maori', 'Maori', 'Oceania', ['nz'],
    'Names common among Maori families in Aotearoa New Zealand.',
    ['Aroha', 'Ngaire', 'Hinewai', 'Ataahua', 'Marama', 'Kiri'],
    ['Tane', 'Rangi', 'Manaia', 'Wiremu', 'Tama', 'Nikau'],
    ['Ngata', 'Te Rangi', 'Waititi', 'Rewiri', 'Hohepa', 'Kingi', 'Tamati', 'Wiremu', 'Paora', 'Rakena', 'Heke', 'Mahuta']),
  h('pacific', 'Pacific Islander', 'Oceania', ['ws', 'to', 'fj', 'nz', 'au'],
    'Names common in Samoan, Tongan and Fijian families.',
    ['Sina', 'Malia', 'Ana', 'Lupe', 'Fetu', 'Tavita'],
    ['Sione', 'Tevita', 'Maleko', 'Faleolo', 'Semisi', 'Ioane'],
    ['Tuilagi', 'Fifita', 'Vunipola', 'Taufa', 'Latu', 'Faletau', 'Nauta', 'Sikahema', 'Tupou', 'Havili', 'Maka', 'Toa']),
];

export const HERITAGE_BY_ID: Readonly<Record<string, Heritage>> = Object.fromEntries(
  HERITAGES.map((one) => [one.id, one]),
);

/** The regions the picker groups by. */
export function heritageRegions(): string[] {
  return [...new Set(HERITAGES.map((one) => one.region))];
}

/** Heritages a family in this country is most likely to be. */
export function heritagesIn(countryId: string): Heritage[] {
  return HERITAGES.filter((one) => one.countryIds.includes(countryId));
}

/** The one used where nothing was chosen. */
export const DEFAULT_HERITAGE = 'english';
