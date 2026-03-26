const SUPABASE_URL = "https://bgzqwvfubndfosdecwlu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_p6zAbqptBjH1tr3Xdqyp7g_d7htH06E";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_KEYS = {
  theme: "pokemon_tracker_theme",
  mode: "pokemon_tracker_mode",
  trackerCaught: "pokemon_tracker_caught_v1",
  trackerSetFilter: "pokemon_tracker_set_filter_v1"
};

const TRACKER_LIMIT = 1025;

const els = {
  modeButtons: document.getElementById("modeButtons"),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  clearBtn: document.getElementById("clearBtn"),
  statusBox: document.getElementById("statusBox"),
  resultsTitle: document.getElementById("resultsTitle"),
  summaryText: document.getElementById("summaryText"),
  results: document.getElementById("results"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  pokemonModal: document.getElementById("pokemonModal"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  modalCloseBtn: document.getElementById("modalCloseBtn"),
  modalBody: document.getElementById("modalBody"),
};

const pokeCacheByName = new Map();
const pokemonSetAppearanceCache = new Map();
const setCardCache = new Map();
const setPokemonListCache = new Map();
const trackerDetailCache = new Map();
const trackerSetDexCache = new Map();

let trackerSetListCache = null;
let currentPokemonResult = null;
let currentMode = localStorage.getItem(STORAGE_KEYS.mode) || "pokemon";
let trackerPokemonCache = null;
let trackerCaughtMap = loadTrackerCaughtState();
let trackerSelectedSetId = loadTrackerSetFilterState();

const HIT_RARITY_ODDS = {
  "Rare": { label: "Rare slot", appearanceRate: 1 / 3, slotCount: 1 },
  "Rare Holo": { label: "Holo rare slot", appearanceRate: 1 / 3, slotCount: 1 },
  "Rare Holo EX": { label: "EX / ultra hit slot", appearanceRate: 1 / 7, slotCount: 1 },
  "Rare Holo GX": { label: "GX / ultra hit slot", appearanceRate: 1 / 7, slotCount: 1 },
  "Rare Holo LV.X": { label: "LV.X hit slot", appearanceRate: 1 / 7, slotCount: 1 },
  "Rare Holo Star": { label: "Star / premium slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Rare Holo V": { label: "V / ultra hit slot", appearanceRate: 1 / 7, slotCount: 1 },
  "Rare Holo VMAX": { label: "VMAX / premium slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Rare Holo VSTAR": { label: "VSTAR / premium slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Rare Prime": { label: "Prime / premium slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Rare Prism Star": { label: "Prism Star slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Rare Rainbow": { label: "Rainbow / premium slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Rare Secret": { label: "Secret rare slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Rare Shining": { label: "Shining slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Rare Shiny": { label: "Shiny slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Rare Ultra": { label: "Ultra rare slot", appearanceRate: 1 / 7, slotCount: 1 },
  "Amazing Rare": { label: "Amazing rare slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Trainer Gallery Rare Holo": { label: "Trainer Gallery slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Illustration Rare": { label: "Illustration rare slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Special Illustration Rare": { label: "Special illustration rare slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Hyper Rare": { label: "Hyper rare slot", appearanceRate: 1 / 25, slotCount: 1 },
  "ACE SPEC Rare": { label: "ACE SPEC slot", appearanceRate: 1 / 25, slotCount: 1 },
  "Double Rare": { label: "Double rare slot", appearanceRate: 1 / 7, slotCount: 1 }
};

const GENERATION_IMAGE_MAP = {
  "generation-i": { label: "Generation I", image: artworkUrl(1), sub: "Kanto" },
  "generation-ii": { label: "Generation II", image: artworkUrl(152), sub: "Johto" },
  "generation-iii": { label: "Generation III", image: artworkUrl(252), sub: "Hoenn" },
  "generation-iv": { label: "Generation IV", image: artworkUrl(387), sub: "Sinnoh" },
  "generation-v": { label: "Generation V", image: artworkUrl(495), sub: "Unova" },
  "generation-vi": { label: "Generation VI", image: artworkUrl(650), sub: "Kalos" },
  "generation-vii": { label: "Generation VII", image: artworkUrl(722), sub: "Alola" },
  "generation-viii": { label: "Generation VIII", image: artworkUrl(810), sub: "Galar / Hisui" },
  "generation-ix": { label: "Generation IX", image: artworkUrl(906), sub: "Paldea" }
};

const GENERATIONS_DATA = [
  {
    id: "wotc",
    title: "Wizards of the Coast Era",
    years: "1999–2003",
    image: "https://images.pokemontcg.io/base1/logo.png",
    description: "The Wizards of the Coast era marks the beginning of the Pokémon TCG in the West, launching in 1999 after Japan had already introduced the game in 1996. Published by Wizards of the Coast, this era established the iconic look of Pokémon cards: thick yellow borders, simple layouts, and bold energy symbols. It introduced holographic galaxy patterns, 1st Edition, Shadowless, Unlimited, Dark and Light Pokémon, Gym Leader cards, Baby Pokémon, Shining Pokémon, Crystal Pokémon, and the first reverse holos in Legendary Collection.",
    sets: [
      { name: "Base Set", year: "1999", image: "https://images.pokemontcg.io/base1/logo.png", note: "The original set that defined everything. 102 cards and the hobby’s most famous Charizard." },
      { name: "Jungle", year: "1999", image: "https://images.pokemontcg.io/base2/logo.png", note: "Added Eeveelutions, Snorlax, and more variety to early deck building." },
      { name: "Fossil", year: "1999", image: "https://images.pokemontcg.io/base3/logo.png", note: "Focused on prehistoric and legendary Pokémon like Aerodactyl and Zapdos." },
      { name: "Base Set 2", year: "2000", image: "https://images.pokemontcg.io/base4/logo.png", note: "A reprint set combining Base, Jungle, and Fossil cards." },
      { name: "Team Rocket", year: "2000", image: "https://images.pokemontcg.io/base5/logo.png", note: "Introduced Dark Pokémon and a darker tone." },
      { name: "Gym Heroes", year: "2000", image: "https://images.pokemontcg.io/gym1/logo.png", note: "Added Pokémon owned by Gym Leaders like Brock and Misty." },
      { name: "Gym Challenge", year: "2000", image: "https://images.pokemontcg.io/gym2/logo.png", note: "Expanded trainer-based Pokémon and strategy." },
      { name: "Neo Genesis", year: "2000", image: "https://images.pokemontcg.io/neo1/logo.png", note: "Introduced Generation 2 Pokémon, Baby Pokémon, Darkness, and Metal." },
      { name: "Neo Discovery", year: "2001", image: "https://images.pokemontcg.io/neo2/logo.png", note: "Expanded Johto Pokémon and introduced Unown mechanics." },
      { name: "Neo Revelation", year: "2001", image: "https://images.pokemontcg.io/neo3/logo.png", note: "Debuted Shining Pokémon." },
      { name: "Neo Destiny", year: "2002", image: "https://images.pokemontcg.io/neo4/logo.png", note: "Introduced Light Pokémon alongside Dark Pokémon." },
      { name: "Legendary Collection", year: "2002", image: "https://images.pokemontcg.io/base6/logo.png", note: "Famous for its fireworks reverse holo pattern." },
      { name: "Expedition", year: "2002", image: "https://images.pokemontcg.io/ecard1/logo.png", note: "First e-Reader set with scannable dot codes." },
      { name: "Aquapolis", year: "2003", image: "https://images.pokemontcg.io/ecard2/logo.png", note: "Expanded e-Reader mechanics and introduced Crystal Pokémon." },
      { name: "Skyridge", year: "2003", image: "https://images.pokemontcg.io/ecard3/logo.png", note: "Final WotC set, now extremely rare." }
    ]
  },
  {
    id: "ex",
    title: "EX Series Era",
    years: "2003–2007",
    image: "https://images.pokemontcg.io/ex1/logo.png",
    description: "This era began after Nintendo took full control and modernized the card design. It introduced Pokémon-ex, powerful high-risk cards with high HP and strong attacks. It also brought Delta Species Pokémon and Gold Star Pokémon, some of the rarest and most valuable cards in the hobby.",
    sets: [
      { name: "Ruby & Sapphire", year: "2003", image: "https://images.pokemontcg.io/ex1/logo.png", note: "The first set of the EX era." },
      { name: "Sandstorm", year: "2003", image: "https://images.pokemontcg.io/ex2/logo.png", note: "Expanded early EX-era mechanics." },
      { name: "Dragon", year: "2003", image: "https://images.pokemontcg.io/ex3/logo.png", note: "Known for Dragon-type focus and beautiful holos." },
      { name: "Team Magma vs Team Aqua", year: "2004", image: "https://images.pokemontcg.io/ex4/logo.png", note: "Brought in themed villain-team decks and cards." },
      { name: "Hidden Legends", year: "2004", image: "https://images.pokemontcg.io/ex5/logo.png", note: "Featured many legendary Pokémon." },
      { name: "FireRed & LeafGreen", year: "2004", image: "https://images.pokemontcg.io/ex6/logo.png", note: "Returned focus to classic Kanto Pokémon." },
      { name: "Team Rocket Returns", year: "2004", image: "https://images.pokemontcg.io/ex7/logo.png", note: "A darker return to Team Rocket themes." },
      { name: "Deoxys", year: "2005", image: "https://images.pokemontcg.io/ex8/logo.png", note: "Built around Deoxys and high-powered EX cards." },
      { name: "Emerald", year: "2005", image: "https://images.pokemontcg.io/ex9/logo.png", note: "Expanded Hoenn support." },
      { name: "Unseen Forces", year: "2005", image: "https://images.pokemontcg.io/ex10/logo.png", note: "Notable for Eeveelutions and Gold Stars." },
      { name: "Delta Species", year: "2005", image: "https://images.pokemontcg.io/ex11/logo.png", note: "Introduced off-type Delta Species Pokémon." },
      { name: "Legend Maker", year: "2006", image: "https://images.pokemontcg.io/ex12/logo.png", note: "Continued experimental EX-era design." },
      { name: "Holon Phantoms", year: "2006", image: "https://images.pokemontcg.io/ex13/logo.png", note: "Another beloved Delta Species-heavy set." },
      { name: "Crystal Guardians", year: "2006", image: "https://images.pokemontcg.io/ex14/logo.png", note: "Known for strong artwork and chase cards." },
      { name: "Dragon Frontiers", year: "2006", image: "https://images.pokemontcg.io/ex15/logo.png", note: "A fan-favorite late EX set." },
      { name: "Power Keepers", year: "2007", image: "https://images.pokemontcg.io/ex16/logo.png", note: "The final set of the EX Series era." }
    ]
  },
  {
    id: "dp",
    title: "Diamond & Pearl Era",
    years: "2007–2009",
    image: "https://images.pokemontcg.io/dp1/logo.png",
    description: "The Diamond & Pearl era introduced a cleaner, more structured card design and added Level indicators. Its defining feature was LV.X cards, which acted as upgrades placed on top of existing Pokémon. SP Pokémon and heavily featured legendary Pokémon shaped the era’s identity.",
    sets: [
      { name: "Diamond & Pearl", year: "2007", image: "https://images.pokemontcg.io/dp1/logo.png", note: "The start of the DP era." },
      { name: "Mysterious Treasures", year: "2007", image: "https://images.pokemontcg.io/dp2/logo.png", note: "Expanded the early Sinnoh-era card pool." },
      { name: "Secret Wonders", year: "2007", image: "https://images.pokemontcg.io/dp3/logo.png", note: "Known for broad Pokémon variety." },
      { name: "Great Encounters", year: "2008", image: "https://images.pokemontcg.io/dp4/logo.png", note: "Introduced many notable evolutions and legendaries." },
      { name: "Majestic Dawn", year: "2008", image: "https://images.pokemontcg.io/dp5/logo.png", note: "Focused heavily on legendary Pokémon." },
      { name: "Legends Awakened", year: "2008", image: "https://images.pokemontcg.io/dp6/logo.png", note: "Strong legendary and atmospheric identity." },
      { name: "Stormfront", year: "2008", image: "https://images.pokemontcg.io/dp7/logo.png", note: "Revisited nostalgia with reimagined Base Set Pokémon." },
      { name: "Platinum", year: "2009", image: "https://images.pokemontcg.io/pl1/logo.png", note: "Shifted into the Platinum sub-era." },
      { name: "Rising Rivals", year: "2009", image: "https://images.pokemontcg.io/pl2/logo.png", note: "Expanded SP Pokémon themes." },
      { name: "Supreme Victors", year: "2009", image: "https://images.pokemontcg.io/pl3/logo.png", note: "Another strong SP and legendary-heavy set." },
      { name: "Arceus", year: "2009", image: "https://images.pokemontcg.io/pl4/logo.png", note: "Featured many Arceus type variations." }
    ]
  },
  {
    id: "hgss",
    title: "HeartGold & SoulSilver Era",
    years: "2010–2011",
    image: "https://images.pokemontcg.io/hgss1/logo.png",
    description: "A short but visually stunning era tied to the HGSS games. It introduced Prime cards and Legend cards, brought back Double Colorless Energy, and is often seen as the last vintage-feeling era.",
    sets: [
      { name: "HeartGold & SoulSilver", year: "2010", image: "https://images.pokemontcg.io/hgss1/logo.png", note: "The start of the HGSS era." },
      { name: "Unleashed", year: "2010", image: "https://images.pokemontcg.io/hgss2/logo.png", note: "Expanded Prime-era cards and Johto flavor." },
      { name: "Undaunted", year: "2010", image: "https://images.pokemontcg.io/hgss3/logo.png", note: "Known for dark themes and strong art." },
      { name: "Triumphant", year: "2010", image: "https://images.pokemontcg.io/hgss4/logo.png", note: "A memorable late HGSS release." },
      { name: "Call of Legends", year: "2011", image: "https://images.pokemontcg.io/col1/logo.png", note: "A special set with standout shiny cards." }
    ]
  },
  {
    id: "bw",
    title: "Black & White Era",
    years: "2011–2013",
    image: "https://images.pokemontcg.io/bw1/logo.png",
    description: "A pivotal era that shaped modern collecting. It introduced the tiered rarity system, brought back EX cards, and most importantly introduced full art cards, which became a staple of the hobby.",
    sets: [
      { name: "Black & White", year: "2011", image: "https://images.pokemontcg.io/bw1/logo.png", note: "The start of the BW era." },
      { name: "Emerging Powers", year: "2011", image: "https://images.pokemontcg.io/bw2/logo.png", note: "Expanded Unova-era Pokémon and strategies." },
      { name: "Noble Victories", year: "2011", image: "https://images.pokemontcg.io/bw3/logo.png", note: "Added more major Unova Pokémon." },
      { name: "Next Destinies", year: "2012", image: "https://images.pokemontcg.io/bw4/logo.png", note: "Introduced EX cards into BW." },
      { name: "Dark Explorers", year: "2012", image: "https://images.pokemontcg.io/bw5/logo.png", note: "Famous for Darkrai EX and dark-themed cards." },
      { name: "Dragons Exalted", year: "2012", image: "https://images.pokemontcg.io/bw6/logo.png", note: "A dragon-heavy fan favorite." },
      { name: "Boundaries Crossed", year: "2012", image: "https://images.pokemontcg.io/bw7/logo.png", note: "Broad set with strong competitive cards." },
      { name: "Plasma Storm", year: "2013", image: "https://images.pokemontcg.io/bw8/logo.png", note: "Team Plasma theme continued." },
      { name: "Plasma Freeze", year: "2013", image: "https://images.pokemontcg.io/bw9/logo.png", note: "Expanded Team Plasma and icy designs." },
      { name: "Plasma Blast", year: "2013", image: "https://images.pokemontcg.io/bw10/logo.png", note: "Another major Plasma-era release." },
      { name: "Legendary Treasures", year: "2013", image: "https://images.pokemontcg.io/bw11/logo.png", note: "Introduced the Radiant Collection subset." }
    ]
  },
  {
    id: "xy",
    title: "XY Era",
    years: "2014–2016",
    image: "https://images.pokemontcg.io/xy1/logo.png",
    description: "Built on Black & White by introducing Mega EX cards and BREAK evolutions. It also experimented with Ancient Traits and expanded full art designs. Evolutions reprinted Base Set cards during the Pokémon GO boom.",
    sets: [
      { name: "XY", year: "2014", image: "https://images.pokemontcg.io/xy1/logo.png", note: "The first XY set." },
      { name: "Flashfire", year: "2014", image: "https://images.pokemontcg.io/xy2/logo.png", note: "Famous for Charizard chase cards." },
      { name: "Furious Fists", year: "2014", image: "https://images.pokemontcg.io/xy3/logo.png", note: "Fighting-focused release." },
      { name: "Phantom Forces", year: "2014", image: "https://images.pokemontcg.io/xy4/logo.png", note: "Brought in dark, spectral themes." },
      { name: "Primal Clash", year: "2015", image: "https://images.pokemontcg.io/xy5/logo.png", note: "Featured Kyogre and Groudon prominently." },
      { name: "Roaring Skies", year: "2015", image: "https://images.pokemontcg.io/xy6/logo.png", note: "A very popular set, especially for Rayquaza." },
      { name: "Ancient Origins", year: "2015", image: "https://images.pokemontcg.io/xy7/logo.png", note: "Introduced Ancient Traits." },
      { name: "BREAKthrough", year: "2015", image: "https://images.pokemontcg.io/xy8/logo.png", note: "Started the BREAK evolution mechanic." },
      { name: "BREAKpoint", year: "2016", image: "https://images.pokemontcg.io/xy9/logo.png", note: "Continued BREAK-focused design." },
      { name: "Fates Collide", year: "2016", image: "https://images.pokemontcg.io/xy10/logo.png", note: "Expanded full arts and strong EX cards." },
      { name: "Steam Siege", year: "2016", image: "https://images.pokemontcg.io/xy11/logo.png", note: "One of the more debated XY sets." },
      { name: "Evolutions", year: "2016", image: "https://images.pokemontcg.io/xy12/logo.png", note: "Base Set nostalgia during the Pokémon GO boom." }
    ]
  },
  {
    id: "sm",
    title: "Sun & Moon Era",
    years: "2017–2019",
    image: "https://images.pokemontcg.io/sm1/logo.png",
    description: "Introduced GX cards and dramatically expanded rarity with rainbow rares. Tag Team GX cards featured multiple Pokémon with huge power. Hidden Fates and Cosmic Eclipse were especially influential for collectors.",
    sets: [
      { name: "Sun & Moon", year: "2017", image: "https://images.pokemontcg.io/sm1/logo.png", note: "The start of the GX era." },
      { name: "Guardians Rising", year: "2017", image: "https://images.pokemontcg.io/sm2/logo.png", note: "Expanded early GX play and collecting." },
      { name: "Burning Shadows", year: "2017", image: "https://images.pokemontcg.io/sm3/logo.png", note: "Known for rainbow Charizard GX." },
      { name: "Crimson Invasion", year: "2017", image: "https://images.pokemontcg.io/sm4/logo.png", note: "Ultra Beast-heavy release." },
      { name: "Ultra Prism", year: "2018", image: "https://images.pokemontcg.io/sm5/logo.png", note: "Strong legendary and Prism Star presence." },
      { name: "Forbidden Light", year: "2018", image: "https://images.pokemontcg.io/sm6/logo.png", note: "Brought in Ultra Necrozma and more." },
      { name: "Celestial Storm", year: "2018", image: "https://images.pokemontcg.io/sm7/logo.png", note: "Popular for Rayquaza GX and strong art." },
      { name: "Lost Thunder", year: "2018", image: "https://images.pokemontcg.io/sm8/logo.png", note: "Large set with broad appeal." },
      { name: "Team Up", year: "2019", image: "https://images.pokemontcg.io/sm9/logo.png", note: "Started Tag Team GX." },
      { name: "Unbroken Bonds", year: "2019", image: "https://images.pokemontcg.io/sm10/logo.png", note: "Expanded Tag Team collecting." },
      { name: "Unified Minds", year: "2019", image: "https://images.pokemontcg.io/sm11/logo.png", note: "A large and varied late SM set." },
      { name: "Cosmic Eclipse", year: "2019", image: "https://images.pokemontcg.io/sm12/logo.png", note: "Introduced character rare-style cards that influenced later eras." },
      { name: "Hidden Fates", year: "2019", image: "https://images.pokemontcg.io/sm115/logo.png", note: "Famous for the Shiny Vault." }
    ]
  },
  {
    id: "swsh",
    title: "Sword & Shield Era",
    years: "2020–2023",
    image: "https://images.pokemontcg.io/swsh1/logo.png",
    description: "One of the most successful eras ever. It introduced V, VMAX, and VSTAR cards plus alternate art chase cards. Trainer Gallery and Galarian Gallery made packs feel more rewarding, and Celebrations marked the 25th anniversary.",
    sets: [
      { name: "Sword & Shield", year: "2020", image: "https://images.pokemontcg.io/swsh1/logo.png", note: "The beginning of the V era." },
      { name: "Rebel Clash", year: "2020", image: "https://images.pokemontcg.io/swsh2/logo.png", note: "Expanded early V cards and support." },
      { name: "Darkness Ablaze", year: "2020", image: "https://images.pokemontcg.io/swsh3/logo.png", note: "Known for Charizard VMAX." },
      { name: "Vivid Voltage", year: "2020", image: "https://images.pokemontcg.io/swsh4/logo.png", note: "Famous for Rainbow Pikachu VMAX." },
      { name: "Battle Styles", year: "2021", image: "https://images.pokemontcg.io/swsh5/logo.png", note: "Introduced Single Strike and Rapid Strike." },
      { name: "Chilling Reign", year: "2021", image: "https://images.pokemontcg.io/swsh6/logo.png", note: "Popular alt arts and legendary birds." },
      { name: "Evolving Skies", year: "2021", image: "https://images.pokemontcg.io/swsh7/logo.png", note: "Legendary chase set with Eeveelution alt arts." },
      { name: "Fusion Strike", year: "2021", image: "https://images.pokemontcg.io/swsh8/logo.png", note: "Huge set with Mew and Gengar chases." },
      { name: "Brilliant Stars", year: "2022", image: "https://images.pokemontcg.io/swsh9/logo.png", note: "Introduced Trainer Gallery into mainline sets." },
      { name: "Astral Radiance", year: "2022", image: "https://images.pokemontcg.io/swsh10/logo.png", note: "Strong Hisui-themed release." },
      { name: "Lost Origin", year: "2022", image: "https://images.pokemontcg.io/swsh11/logo.png", note: "Known for Giratina alt art." },
      { name: "Silver Tempest", year: "2022", image: "https://images.pokemontcg.io/swsh12/logo.png", note: "A major late-era release." },
      { name: "Crown Zenith", year: "2023", image: "https://images.pokemontcg.io/swsh12pt5/logo.png", note: "Collector favorite with Galarian Gallery." },
      { name: "Celebrations", year: "2021", image: "https://images.pokemontcg.io/cel25/logo.png", note: "25th anniversary special set." }
    ]
  },
  {
    id: "sv",
    title: "Scarlet & Violet Era",
    years: "2023–Present",
    image: "https://images.pokemontcg.io/sv1/logo.png",
    description: "The modern era with silver borders, Illustration Rares, and Special Illustration Rares replacing alt arts. Rainbow rares were removed, and the focus shifted even more heavily toward artwork, collector appeal, and improved pull rates.",
    sets: [
      { name: "Scarlet & Violet", year: "2023", image: "https://images.pokemontcg.io/sv1/logo.png", note: "The first SV main set." },
      { name: "Paldea Evolved", year: "2023", image: "https://images.pokemontcg.io/sv2/logo.png", note: "Expanded Paldea and illustration-heavy cards." },
      { name: "Obsidian Flames", year: "2023", image: "https://images.pokemontcg.io/sv3/logo.png", note: "Known for Charizard ex chase cards." },
      { name: "151", year: "2023", image: "https://images.pokemontcg.io/sv3pt5/logo.png", note: "A Kanto-focused collector favorite." },
      { name: "Paradox Rift", year: "2023", image: "https://images.pokemontcg.io/sv4/logo.png", note: "Introduced stronger Paradox Pokémon themes." },
      { name: "Paldean Fates", year: "2024", image: "https://images.pokemontcg.io/sv4pt5/logo.png", note: "Shiny-heavy special set." },
      { name: "Temporal Forces", year: "2024", image: "https://images.pokemontcg.io/sv5/logo.png", note: "Continued ancient/future themes." },
      { name: "Twilight Masquerade", year: "2024", image: "https://images.pokemontcg.io/sv6/logo.png", note: "Built around Kitakami-themed Pokémon." },
      { name: "Shrouded Fable", year: "2024", image: "https://images.pokemontcg.io/sv6pt5/logo.png", note: "A special set with unique art direction." },
      { name: "Stellar Crown", year: "2024", image: "https://images.pokemontcg.io/sv7/logo.png", note: "Expanded the modern SV era further." },
      { name: "Surging Sparks", year: "2024", image: "https://images.pokemontcg.io/sv8/logo.png", note: "Another late-2024 SV set." },
      { name: "Prismatic Evolutions", year: "2025", image: "https://images.pokemontcg.io/sv8pt5/logo.png", note: "A special Eeveelution-focused modern release." },
      { name: "Journey Together", year: "2025", image: "https://images.pokemontcg.io/sv9/logo.png", note: "Continued modern SV expansion." }
    ]
  },
  {
    id: "future",
    title: "Future: Mega Evolution Era",
    years: "2025+",
    image: "https://images.pokemontcg.io/xy1/logo.png",
    description: "A new upcoming era expected to reintroduce Mega Pokémon EX with modern mechanics and designs, continuing trends from Scarlet & Violet.",
    sets: [
      { name: "Mega Evolution Era", year: "2025+", image: "https://images.pokemontcg.io/xy1/logo.png", note: "Placeholder for the upcoming era and future set list." }
    ]
  }
];

function artworkUrl(dex) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dex}.png`;
}

function setStatus(text) {
  els.statusBox.textContent = text;
}

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function artwork(dex) {
  return artworkUrl(dex);
}

function sprite(dex) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;
}

function formatDex(dex) {
  return `#${String(dex).padStart(4, "0")}`;
}

function titleCaseFromSlug(text) {
  return String(text || "")
    .split("-")
    .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : "")
    .join(" ");
}

function getGenerationDisplay(generationName) {
  return GENERATION_IMAGE_MAP[generationName] || {
    label: titleCaseFromSlug(generationName || "unknown-generation"),
    image: artwork(25),
    sub: "Unknown region"
  };
}

function formatMonthYear(dateString) {
  if (!dateString) return "Unknown release";

  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateString)) {
    const [year, month] = dateString.split("/");
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const idx = Number(month) - 1;
    if (idx >= 0 && idx <= 11) return `${monthNames[idx]} ${year}`;
  }

  const d = new Date(dateString);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  }

  return dateString;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function clearResults() {
  currentPokemonResult = null;
  els.resultsTitle.textContent = "Results";
  els.summaryText.textContent = "";
  els.results.innerHTML = "";
}

function updateSearchPlaceholder() {
  const placeholders = {
    pokemon: "Try Clefairy or Charizard",
    set: "Try 151 or Base Set",
    generations: "Browse Pokémon TCG eras",
    holofoil: "Holofoil coming later",
    tracker: "National Dex tracker"
  };

  els.searchInput.placeholder = placeholders[currentMode] || "Search";
}

function setMode(mode) {
  currentMode = mode;
  localStorage.setItem(STORAGE_KEYS.mode, mode);

  const buttons = els.modeButtons.querySelectorAll(".modeBtn");
  buttons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  updateSearchPlaceholder();
  clearResults();
  setStatus("Ready.");
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    els.themeToggleBtn.textContent = "☀️ Light Mode";
  } else {
    document.body.classList.remove("dark-mode");
    els.themeToggleBtn.textContent = "🌙 Dark Mode";
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem(STORAGE_KEYS.theme, isDark ? "dark" : "light");
  els.themeToggleBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadTrackerSetFilterState() {
  return localStorage.getItem(STORAGE_KEYS.trackerSetFilter) || "";
}

function saveTrackerSetFilterState() {
  localStorage.setItem(STORAGE_KEYS.trackerSetFilter, trackerSelectedSetId || "");
}

async function fetchJSON(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const err = new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 160)}` : ""}`);
        err.status = res.status;
        throw err;
      }

      return await res.json();
    } catch (err) {
      const retryable =
        err.status === 429 ||
        err.status === 500 ||
        err.status === 502 ||
        err.status === 503 ||
        err.status === 504 ||
        !("status" in err);

      if (attempt < retries && retryable) {
        await sleep(400 * (attempt + 1));
        continue;
      }

      throw err;
    }
  }
}

async function fetchAllPages(baseUrl) {
  const all = [];
  let page = 1;
  let totalCount = Infinity;

  while (all.length < totalCount) {
    const url = `${baseUrl}&pageSize=250&page=${page}`;
    const payload = await fetchJSON(url);
    const items = Array.isArray(payload.data) ? payload.data : [];
    totalCount = typeof payload.totalCount === "number" ? payload.totalCount : items.length;

    all.push(...items);

    if (!items.length) break;
    page += 1;

    if (page > 60) break;
  }

  return all;
}

async function resolvePokemon(query) {
  const key = normalize(query);
  if (!key) throw new Error("Enter a Pokémon name.");

  if (pokeCacheByName.has(key)) {
    return pokeCacheByName.get(key);
  }

  const poke = await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(key)}`);
  const resolved = {
    dex: poke.id,
    name: poke.name.charAt(0).toUpperCase() + poke.name.slice(1)
  };

  pokeCacheByName.set(key, resolved);
  return resolved;
}

async function fetchPokemonSetAppearances(dex) {
  if (pokemonSetAppearanceCache.has(dex)) {
    return pokemonSetAppearanceCache.get(dex);
  }

  const q = encodeURIComponent(`nationalPokedexNumbers:${dex}`);
  const cards = await fetchAllPages(`https://api.pokemontcg.io/v2/cards?q=${q}&select=id,set`);

  const setMap = new Map();

  for (const card of cards) {
    const set = card.set;
    if (!set || !set.id) continue;

    if (!setMap.has(set.id)) {
      setMap.set(set.id, {
        id: set.id,
        name: set.name || "Unknown set",
        logo: set.images?.logo || "",
        symbol: set.images?.symbol || "",
        series: set.series || "Unknown era",
        date: set.releaseDate || "",
        chanceHtml: null
      });
    }
  }

  const sets = [...setMap.values()].sort((a, b) => {
    return (a.date || "").localeCompare(b.date || "") || a.name.localeCompare(b.name);
  });

  const result = { sets };
  pokemonSetAppearanceCache.set(dex, result);
  return result;
}

async function fetchAllCardsForSet(setId) {
  if (setCardCache.has(setId)) {
    return setCardCache.get(setId);
  }

  const q = encodeURIComponent(`set.id:${setId}`);
  const cards = await fetchAllPages(
    `https://api.pokemontcg.io/v2/cards?q=${q}&select=id,name,number,rarity,supertype,subtypes,nationalPokedexNumbers,set`
  );

  setCardCache.set(setId, cards);
  return cards;
}

async function fetchAllTcgSets() {
  if (trackerSetListCache) {
    return trackerSetListCache;
  }

  const payload = await fetchJSON("https://api.pokemontcg.io/v2/sets");
  const sets = (payload.data || []).map(set => ({
    id: set.id,
    name: set.name || "Unknown set",
    date: set.releaseDate || ""
  }));

  sets.sort((a, b) => {
    return (a.date || "").localeCompare(b.date || "") || a.name.localeCompare(b.name);
  });

  trackerSetListCache = sets;
  return sets;
}

async function fetchTrackerSetDexes(setId) {
  if (!setId) {
    return null;
  }

  if (trackerSetDexCache.has(setId)) {
    return trackerSetDexCache.get(setId);
  }

  const cards = await fetchAllCardsForSet(setId);
  const dexSet = new Set();

  for (const card of cards) {
    const dexes = Array.isArray(card.nationalPokedexNumbers) ? card.nationalPokedexNumbers : [];
    for (const dex of dexes) {
      if (dex >= 1 && dex <= TRACKER_LIMIT) {
        dexSet.add(dex);
      }
    }
  }

  trackerSetDexCache.set(setId, dexSet);
  return dexSet;
}

function getGenerationFromSeries(series) {
  const s = normalize(series);
  if (s === "base") return "Generation I";
  if (s === "neo") return "Generation II";
  if (s === "e-card") return "Generation III";
  if (s === "ex") return "Generation III";
  if (s === "diamond & pearl") return "Generation IV";
  if (s === "platinum") return "Generation IV";
  if (s === "heartgold & soulsilver") return "Generation IV";
  if (s === "black & white") return "Generation V";
  if (s === "xy") return "Generation VI";
  if (s === "sun & moon") return "Generation VII";
  if (s === "sword & shield") return "Generation VIII";
  if (s === "scarlet & violet") return "Generation IX";
  return "Unknown generation";
}

function buildSetSearchQuery(query) {
  const trimmed = query.trim();
  const escaped = trimmed.replace(/"/g, '\\"');

  const exactName = `name:"${escaped}"`;
  const exactId = `id:${escaped.toLowerCase()}`;
  const exactSeries = `series:"${escaped}"`;

  const words = trimmed.split(/\s+/).filter(Boolean);
  const prefixName = words.length
    ? "name:" + words
        .map((word, index) => {
          const safeWord = word.replace(/"/g, '\\"');
          return index === words.length - 1 ? `${safeWord}*` : `"${safeWord}"`;
        })
        .join(" ")
    : exactName;

  return `${exactName} OR ${prefixName} OR ${exactId} OR ${exactSeries}`;
}

function getPackProfile(series) {
  const s = normalize(series);

  if (s === "scarlet & violet") {
    return {
      commonSlots: 4,
      uncommonSlots: 3,
      reverseHoloSlots: 2,
      reverseEligibleRarities: new Set(["Common", "Uncommon", "Rare", "Rare Holo"])
    };
  }

  if (s === "sword & shield" || s === "sun & moon" || s === "xy" || s === "black & white") {
    return {
      commonSlots: 5,
      uncommonSlots: 3,
      reverseHoloSlots: 1,
      reverseEligibleRarities: new Set(["Common", "Uncommon", "Rare", "Rare Holo"])
    };
  }

  if (s === "diamond & pearl" || s === "platinum" || s === "heartgold & soulsilver" || s === "ex" || s === "e-card") {
    return {
      commonSlots: 5,
      uncommonSlots: 3,
      reverseHoloSlots: 1,
      reverseEligibleRarities: new Set(["Common", "Uncommon", "Rare", "Rare Holo"])
    };
  }

  if (s === "base" || s === "neo") {
    return {
      commonSlots: 5,
      uncommonSlots: 3,
      reverseHoloSlots: 0,
      reverseEligibleRarities: new Set()
    };
  }

  return {
    commonSlots: 5,
    uncommonSlots: 3,
    reverseHoloSlots: 1,
    reverseEligibleRarities: new Set(["Common", "Uncommon", "Rare", "Rare Holo"])
  };
}

function combination(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;

  const kk = Math.min(k, n - k);
  let result = 1;

  for (let i = 1; i <= kk; i++) {
    result = (result * (n - kk + i)) / i;
  }

  return result;
}

function probabilityAtLeastOneWithoutReplacement(totalPool, matchingCount, draws) {
  if (draws <= 0 || totalPool <= 0 || matchingCount <= 0) return 0;
  if (matchingCount >= totalPool) return 1;

  const safeDraws = Math.min(draws, totalPool);
  const missWays = combination(totalPool - matchingCount, safeDraws);
  const allWays = combination(totalPool, safeDraws);

  if (!allWays) return 0;

  return 1 - (missWays / allWays);
}

function isReverseHoloEligibleCard(card, profile) {
  return profile.reverseEligibleRarities.has(card.rarity || "");
}

function getReversePool(fullSetCards, profile) {
  return fullSetCards.filter(card => isReverseHoloEligibleCard(card, profile));
}

function uniqueKeyForCard(card) {
  return `${card.id}__${card.number || ""}__${card.name || ""}`;
}

function getCardVariantBreakdown(fullSetCards, targetDex, series) {
  const profile = getPackProfile(series);
  const matchingCards = fullSetCards.filter(card =>
    Array.isArray(card.nationalPokedexNumbers) &&
    card.nationalPokedexNumbers.includes(targetDex)
  );

  const uniqueMatches = [];
  const seen = new Set();

  for (const card of matchingCards) {
    const key = uniqueKeyForCard(card);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMatches.push(card);
    }
  }

  const reversePool = getReversePool(fullSetCards, profile);

  const variantResults = uniqueMatches.map(card => {
    const lines = [];
    const rarity = card.rarity || "Unknown";

    if (rarity === "Common") {
      const pool = fullSetCards.filter(c => (c.rarity || "") === "Common");
      const totalPool = pool.length;
      const probability = probabilityAtLeastOneWithoutReplacement(totalPool, 1, profile.commonSlots);

      if (probability > 0) {
        lines.push({
          label: "Regular common pull",
          appearanceRate: 1,
          slotCount: profile.commonSlots,
          matchingCount: 1,
          totalPool,
          otherCards: totalPool - 1,
          probability,
          formula: `1.00 × [1 - C(${totalPool - 1}, ${Math.min(profile.commonSlots, totalPool)}) / C(${totalPool}, ${Math.min(profile.commonSlots, totalPool)})]`
        });
      }
    } else if (rarity === "Uncommon") {
      const pool = fullSetCards.filter(c => (c.rarity || "") === "Uncommon");
      const totalPool = pool.length;
      const probability = probabilityAtLeastOneWithoutReplacement(totalPool, 1, profile.uncommonSlots);

      if (probability > 0) {
        lines.push({
          label: "Regular uncommon pull",
          appearanceRate: 1,
          slotCount: profile.uncommonSlots,
          matchingCount: 1,
          totalPool,
          otherCards: totalPool - 1,
          probability,
          formula: `1.00 × [1 - C(${totalPool - 1}, ${Math.min(profile.uncommonSlots, totalPool)}) / C(${totalPool}, ${Math.min(profile.uncommonSlots, totalPool)})]`
        });
      }
    } else {
      const slotInfo = HIT_RARITY_ODDS[rarity];
      if (slotInfo) {
        const pool = fullSetCards.filter(c => (c.rarity || "") === rarity);
        const totalPool = pool.length;
        const draws = Math.min(slotInfo.slotCount, totalPool);
        const pWithin = probabilityAtLeastOneWithoutReplacement(totalPool, 1, draws);
        const probability = slotInfo.appearanceRate * pWithin;

        if (probability > 0) {
          lines.push({
            label: slotInfo.label,
            appearanceRate: slotInfo.appearanceRate,
            slotCount: slotInfo.slotCount,
            matchingCount: 1,
            totalPool,
            otherCards: totalPool - 1,
            probability,
            formula: `${slotInfo.appearanceRate.toFixed(4)} × [1 - C(${totalPool - 1}, ${draws}) / C(${totalPool}, ${draws})]`
          });
        }
      }
    }

    if (isReverseHoloEligibleCard(card, profile) && profile.reverseHoloSlots > 0) {
      const reversePoolSize = reversePool.length;
      const reverseProbability = probabilityAtLeastOneWithoutReplacement(reversePoolSize, 1, profile.reverseHoloSlots);

      if (reverseProbability > 0) {
        lines.push({
          label: "Reverse holo pull",
          appearanceRate: 1,
          slotCount: profile.reverseHoloSlots,
          matchingCount: 1,
          totalPool: reversePoolSize,
          otherCards: reversePoolSize - 1,
          probability: reverseProbability,
          formula: `1.00 × [1 - C(${reversePoolSize - 1}, ${Math.min(profile.reverseHoloSlots, reversePoolSize)}) / C(${reversePoolSize}, ${Math.min(profile.reverseHoloSlots, reversePoolSize)})]`
        });
      }
    }

    const totalChance = 1 - lines.reduce((miss, line) => miss * (1 - line.probability), 1);

    return {
      card,
      totalChance,
      lines
    };
  });

  const overallTotal = 1 - variantResults.reduce((miss, variant) => miss * (1 - variant.totalChance), 1);

  return {
    overallTotal,
    variants: variantResults
  };
}

function renderVariantMathHtml(breakdown) {
  if (!breakdown.variants.length) {
    return `
      <div class="mathTitle">Estimated chance math</div>
      <div>No supported pull-path math was found for this Pokémon in this set.</div>
    `;
  }

  return `
    <div class="mathTitle">Estimated chance math</div>
    <div class="mathTotal">Combined estimated chance per pack: ${formatPercent(breakdown.overallTotal)}</div>

    ${breakdown.variants.map(variant => `
      <div class="variantBlock">
        <div class="variantTitle">
          ${escapeHtml(variant.card.name || "Unknown card")}
          ${variant.card.number ? ` • #${escapeHtml(variant.card.number)}` : ""}
          ${variant.card.rarity ? ` • ${escapeHtml(variant.card.rarity)}` : ""}
        </div>

        <div><strong>Total for this card/version:</strong> ${formatPercent(variant.totalChance)}</div>

        ${variant.lines.map(line => `
          <div class="mathLine">
            <strong>${escapeHtml(line.label)}</strong><br>
            Slot/group appears in pack: <strong>${formatPercent(line.appearanceRate)}</strong><br>
            Cards drawn from this slot/group: <strong>${line.slotCount}</strong><br>
            Matching copies of this exact card in pool: <strong>${line.matchingCount}</strong><br>
            Other possible cards in this pool: <strong>${line.otherCards}</strong><br>
            Pool size total: <strong>${line.totalPool}</strong><br>
            Contribution from this path: <strong>${formatPercent(line.probability)}</strong>
            <span class="mathFormula">${escapeHtml(line.formula)}</span>
          </div>
        `).join("")}
      </div>
    `).join("")}
  `;
}

function getEarliestSet(cards) {
  if (!Array.isArray(cards) || !cards.length) return null;

  const uniqueSets = new Map();

  for (const card of cards) {
    const set = card.set;
    if (!set || !set.id) continue;

    if (!uniqueSets.has(set.id)) {
      uniqueSets.set(set.id, {
        id: set.id,
        name: set.name || "Unknown set",
        logo: set.images?.logo || "",
        symbol: set.images?.symbol || "",
        releaseDate: set.releaseDate || ""
      });
    }
  }

  const sets = [...uniqueSets.values()].sort((a, b) => {
    return (a.releaseDate || "").localeCompare(b.releaseDate || "") || a.name.localeCompare(b.name);
  });

  return sets[0] || null;
}

async function fetchTrackerPokemonDetails(dex) {
  if (trackerDetailCache.has(dex)) {
    return trackerDetailCache.get(dex);
  }

  const promise = (async () => {
    const [pokemonData, speciesData] = await Promise.all([
      fetchJSON(`https://pokeapi.co/api/v2/pokemon/${dex}`),
      fetchJSON(`https://pokeapi.co/api/v2/pokemon-species/${dex}`)
    ]);

    const tcgCards = await fetchAllPages(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(`nationalPokedexNumbers:${dex}`)}&select=id,set`
    );

    const earliestSet = getEarliestSet(tcgCards);

    return {
      dex,
      name: pokemonData.name ? pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1) : `#${dex}`,
      art: pokemonData.sprites?.other?.["official-artwork"]?.front_default || artwork(dex),
      generation: getGenerationDisplay(speciesData.generation?.name || ""),
      originalSet: earliestSet
    };
  })();

  trackerDetailCache.set(dex, promise);
  return promise;
}

async function searchPokemon(query) {
  const pokemon = await resolvePokemon(query);
  const appearanceData = await fetchPokemonSetAppearances(pokemon.dex);

  return {
    dex: pokemon.dex,
    name: pokemon.name,
    sets: appearanceData.sets.map(set => ({ ...set }))
  };
}

async function searchSet(query) {
  const setQuery = buildSetSearchQuery(query);

  const payload = await fetchJSON(
    `https://api.pokemontcg.io/v2/sets?q=${encodeURIComponent(setQuery)}`
  );

  const results = (payload.data || []).map(set => ({
    id: set.id,
    name: set.name || "Unknown set",
    logo: set.images?.logo || "",
    symbol: set.images?.symbol || "",
    series: set.series || "Unknown era",
    date: set.releaseDate || "",
    generation: getGenerationFromSeries(set.series || "")
  }));

  results.sort((a, b) => {
    return (a.date || "").localeCompare(b.date || "") || a.name.localeCompare(b.name);
  });

  return results;
}

function renderPokemon(result) {
  currentPokemonResult = result;

  els.resultsTitle.textContent = "Pokémon Results";
  els.summaryText.textContent = `${result.sets.length} set(s) found for ${result.name}`;

  els.results.innerHTML = `
    <div class="card">
      <div class="cardHead">
        <img class="pokemonArt" src="${artwork(result.dex)}" alt="${escapeHtml(result.name)}">
        <div class="grow">
          <h2>#${result.dex} ${escapeHtml(result.name)}</h2>
          <div class="muted">${result.sets.length} set(s)</div>
          <div class="badge good">Fast search • optional split-out chance math</div>

          <div class="topActions">
            <button id="calculateAllBtn" class="inlineButton primary">Calculate All Chances</button>
          </div>
        </div>
      </div>

      <div class="listBlock">
        ${result.sets.map(set => `
          <div class="miniSet">
            ${set.logo ? `<img class="setLogoSmall" src="${escapeHtml(set.logo)}" alt="${escapeHtml(set.name)} logo">` : ""}
            <div class="grow">
              <div><strong>${escapeHtml(set.name)}</strong></div>
              <div class="muted">${escapeHtml(formatMonthYear(set.date))}</div>
              <div class="muted">${escapeHtml(set.series)} • ${escapeHtml(getGenerationFromSeries(set.series))}</div>

              <div class="setActions">
                <button class="inlineButton secondary calc-set-btn" data-set-id="${escapeHtml(set.id)}">
                  Calculate This Set Chance
                </button>
              </div>

              <div class="mathBox muted" id="chance-${escapeHtml(set.id)}">
                Chance not calculated yet.
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderSetResults(results) {
  currentPokemonResult = null;

  els.resultsTitle.textContent = "Set Results";
  els.summaryText.textContent = `${results.length} set(s) found`;

  els.results.innerHTML = results.length ? results.map(set => `
    <div class="card">
      <h2>${escapeHtml(set.name)}</h2>
      ${set.logo ? `<img class="setLogoLarge" src="${escapeHtml(set.logo)}" alt="${escapeHtml(set.name)} logo">` : ""}
      <div class="muted">${escapeHtml(formatMonthYear(set.date))}</div>
      <div class="muted">${escapeHtml(set.series)} • ${escapeHtml(set.generation)}</div>

      <div class="setActions">
        <button class="inlineButton secondary show-set-pokemon-btn" data-set-id="${escapeHtml(set.id)}">
          Show Pokémon in This Set
        </button>
      </div>

      <div class="mathBox muted" id="set-pokemon-${escapeHtml(set.id)}">
        Pokémon list not loaded yet.
      </div>
    </div>
  `).join("") : `<div class="empty">No sets found.</div>`;
}

function renderGenerations() {
  currentPokemonResult = null;
  els.resultsTitle.textContent = "Pokémon TCG Generations";
  els.summaryText.textContent = `${GENERATIONS_DATA.length} era(s) loaded`;

  els.results.innerHTML = `
    <div class="generationsWrap">
      ${GENERATIONS_DATA.map(era => `
        <div class="eraCard">
          <div class="eraHeader">
            <img class="eraImage" src="${escapeHtml(era.image)}" alt="${escapeHtml(era.title)} image">
            <div class="eraMeta">
              <h3>${escapeHtml(era.title)}</h3>
              <div class="eraYears">${escapeHtml(era.years)}</div>
              <div class="eraDesc">${escapeHtml(era.description)}</div>
            </div>
          </div>

          <div class="eraSetsTitle">Sets in this era</div>
          <div class="eraSetList">
            ${era.sets.map(set => `
              <div class="eraSetItem">
                <img class="eraSetImage" src="${escapeHtml(set.image)}" alt="${escapeHtml(set.name)} image">
                <div class="grow">
                  <div class="eraSetName">${escapeHtml(set.name)}</div>
                  <div class="eraSetYear">${escapeHtml(set.year)}</div>
                  <div class="eraSetNote">${escapeHtml(set.note)}</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function loadTrackerCaughtState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.trackerCaught);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveTrackerCaughtState() {
  localStorage.setItem(STORAGE_KEYS.trackerCaught, JSON.stringify(trackerCaughtMap));
}

async function fetchTrackerPokemonList() {
  if (trackerPokemonCache) return trackerPokemonCache;

  const payload = await fetchJSON(`https://pokeapi.co/api/v2/pokemon?limit=${TRACKER_LIMIT}`);

  const list = (payload.results || []).map((pokemon, index) => {
    const dex = index + 1;
    return {
      dex,
      name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
      sprite: sprite(dex)
    };
  });

  trackerPokemonCache = list;
  return list;
}

function getCaughtCountForList(pokemonList) {
  return pokemonList.filter(p => Boolean(trackerCaughtMap[p.dex])).length;
}

function buildTrackerStatsText(totalVisible, caughtVisible) {
  return `Attained: ${caughtVisible} / ${totalVisible}`;
}

function getSelectedSetName(sets) {
  if (!trackerSelectedSetId) return "All Pokémon";
  const match = sets.find(set => set.id === trackerSelectedSetId);
  return match ? match.name : "Selected set";
}

async function getFilteredTrackerPokemonList() {
  const [allPokemon, allSets] = await Promise.all([
    fetchTrackerPokemonList(),
    fetchAllTcgSets()
  ]);

  if (!trackerSelectedSetId) {
    return {
      pokemonList: allPokemon,
      sets: allSets
    };
  }

  const allowedDexes = await fetchTrackerSetDexes(trackerSelectedSetId);
  const filtered = allPokemon.filter(pokemon => allowedDexes && allowedDexes.has(pokemon.dex));

  return {
    pokemonList: filtered,
    sets: allSets
  };
}

async function renderTracker() {
  currentPokemonResult = null;
  els.resultsTitle.textContent = "National Dex Tracker";
  els.summaryText.textContent = "Loading tracker...";
  els.results.innerHTML = `<div class="empty">Loading tracker...</div>`;

  const { pokemonList, sets } = await getFilteredTrackerPokemonList();
  const caughtVisible = getCaughtCountForList(pokemonList);
  const statsText = buildTrackerStatsText(pokemonList.length, caughtVisible);
  const selectedSetName = getSelectedSetName(sets);

  els.resultsTitle.textContent = trackerSelectedSetId ? `National Dex Tracker • ${selectedSetName}` : "National Dex Tracker";
  els.summaryText.textContent = statsText;

  els.results.innerHTML = `
    <div class="trackerWrap">
      <div class="trackerTopBar">
        <div>
          <div class="trackerStats" id="trackerStats">${escapeHtml(statsText)}</div>
          <div class="trackerSubtext">
            ${trackerSelectedSetId ? `Showing Pokémon found in ${escapeHtml(selectedSetName)}.` : "Check a box when you have attained that Pokémon."}
          </div>
        </div>

        <div class="trackerFilterRow">
          <label class="trackerFilterLabel" for="trackerSetFilter">
            Filter by set
            <select id="trackerSetFilter">
              <option value="">All Pokémon</option>
              ${sets.map(set => `
                <option value="${escapeHtml(set.id)}" ${set.id === trackerSelectedSetId ? "selected" : ""}>
                  ${escapeHtml(set.name)}
                </option>
              `).join("")}
            </select>
          </label>
        </div>
      </div>

      <div class="trackerGrid">
        ${pokemonList.map(pokemon => {
          const isCaught = Boolean(trackerCaughtMap[pokemon.dex]);
          return `
            <div class="trackerItem ${isCaught ? "is-caught" : ""}" data-tracker-dex="${pokemon.dex}">
              <div class="trackerDex">${escapeHtml(formatDex(pokemon.dex))}</div>

              <input
                class="trackerCheckbox"
                type="checkbox"
                data-tracker-checkbox="${pokemon.dex}"
                ${isCaught ? "checked" : ""}
                aria-label="Mark ${escapeHtml(pokemon.name)} as attained"
              >

              <div class="trackerName">${escapeHtml(pokemon.name)}</div>

              <button
                class="trackerImageBtn"
                type="button"
                data-tracker-image="${pokemon.dex}"
                aria-label="Open ${escapeHtml(pokemon.name)} details"
              >
                <img class="trackerSprite" src="${escapeHtml(pokemon.sprite)}" alt="${escapeHtml(pokemon.name)}">
              </button>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function updateTrackerStatsInDom() {
  const trackerGridItems = [...document.querySelectorAll(".trackerItem[data-tracker-dex]")];
  const visibleDexes = trackerGridItems.map(item => Number(item.dataset.trackerDex)).filter(Boolean);
  const caughtVisible = visibleDexes.filter(dex => Boolean(trackerCaughtMap[dex])).length;
  const statsText = buildTrackerStatsText(visibleDexes.length, caughtVisible);

  els.summaryText.textContent = statsText;
  const statsEl = document.getElementById("trackerStats");
  if (statsEl) statsEl.textContent = statsText;
}

function setTrackerCaught(dex, isCaught) {
  if (isCaught) {
    trackerCaughtMap[dex] = true;
  } else {
    delete trackerCaughtMap[dex];
  }

  saveTrackerCaughtState();

  const item = document.querySelector(`[data-tracker-dex="${dex}"]`);
  if (item) {
    item.classList.toggle("is-caught", isCaught);
  }

  updateTrackerStatsInDom();
}

function openPokemonModal() {
  els.pokemonModal.classList.remove("hidden");
  els.pokemonModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closePokemonModal() {
  els.pokemonModal.classList.add("hidden");
  els.pokemonModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function renderPokemonModalHtml(details) {
  return `
    <div class="modalPokemonWrap">
      <div>
        <img class="modalPokemonArt" src="${escapeHtml(details.art)}" alt="${escapeHtml(details.name)} artwork">
      </div>

      <div class="modalInfo">
        <div class="modalDex">${escapeHtml(formatDex(details.dex))}</div>
        <h2 id="modalPokemonName" class="modalName">${escapeHtml(details.name)}</h2>

        <div class="modalInfoGrid">
          <div class="modalInfoCard">
            <div class="modalInfoLabel">Original TCG Set</div>
            <div class="modalInfoValue">${escapeHtml(details.originalSet?.name || "No set found")}</div>
            <div class="modalInfoSub">
              ${details.originalSet?.releaseDate ? escapeHtml(formatMonthYear(details.originalSet.releaseDate)) : "Unknown release"}
            </div>
            ${details.originalSet?.logo ? `<img class="modalBadgeImage" src="${escapeHtml(details.originalSet.logo)}" alt="${escapeHtml(details.originalSet.name)} logo">` : ""}
          </div>

          <div class="modalInfoCard">
            <div class="modalInfoLabel">Generation</div>
            <div class="modalInfoValue">${escapeHtml(details.generation.label)}</div>
            <div class="modalInfoSub">${escapeHtml(details.generation.sub)}</div>
            <img class="modalBadgeImage" src="${escapeHtml(details.generation.image)}" alt="${escapeHtml(details.generation.label)} image">
          </div>
        </div>
      </div>
    </div>
  `;
}

async function showTrackerPokemonModal(dex) {
  openPokemonModal();
  els.modalBody.innerHTML = `<div class="modalLoading">Loading Pokémon...</div>`;

  try {
    const details = await fetchTrackerPokemonDetails(dex);
    els.modalBody.innerHTML = renderPokemonModalHtml(details);
  } catch (err) {
    console.error(err);
    els.modalBody.innerHTML = `<div class="modalLoading">Error loading Pokémon details.</div>`;
  }
}

function renderComingSoon(mode) {
  const labels = {
    holofoil: "Holofoil"
  };

  const label = labels[mode] || "This mode";
  currentPokemonResult = null;
  els.resultsTitle.textContent = label;
  els.summaryText.textContent = `${label} mode is not built yet.`;
  els.results.innerHTML = `
    <div class="empty">
      ${escapeHtml(label)} mode is ready to be filled in later.
    </div>
  `;
}

function updateChanceBox(setId, html, mode = "muted") {
  const box = document.getElementById(`chance-${setId}`);
  if (!box) return;
  box.className = `mathBox ${mode}`;
  box.innerHTML = html;
}

function updateSetPokemonBox(setId, html, mode = "muted") {
  const box = document.getElementById(`set-pokemon-${setId}`);
  if (!box) return;
  box.className = `mathBox ${mode}`;
  box.innerHTML = html;
}

async function calculateSingleSetChance(setId) {
  if (!currentPokemonResult) return;

  const set = currentPokemonResult.sets.find(s => s.id === setId);
  if (!set) return;

  if (set.chanceHtml) {
    updateChanceBox(set.id, set.chanceHtml, "good");
    return;
  }

  updateChanceBox(set.id, "Calculating chance...", "muted");
  setStatus(`Calculating chance for ${currentPokemonResult.name} in ${set.name}...`);

  try {
    const fullSetCards = await fetchAllCardsForSet(set.id);
    const breakdown = getCardVariantBreakdown(fullSetCards, currentPokemonResult.dex, set.series);
    const html = renderVariantMathHtml(breakdown);

    set.chanceHtml = html;
    updateChanceBox(set.id, html, "good");
    setStatus("Done.");
  } catch (err) {
    console.error(err);
    updateChanceBox(set.id, "Error calculating this set's chance.", "muted");
    setStatus(`Error:\n${err.message}`);
  }
}

async function calculateAllChances() {
  if (!currentPokemonResult) return;

  for (let i = 0; i < currentPokemonResult.sets.length; i++) {
    const set = currentPokemonResult.sets[i];
    setStatus(
      `Calculating all chances for ${currentPokemonResult.name}...\n` +
      `Set ${i + 1} of ${currentPokemonResult.sets.length}: ${set.name}`
    );
    await calculateSingleSetChance(set.id);
  }

  setStatus("Done.");
}

async function showPokemonInSet(setId) {
  if (setPokemonListCache.has(setId)) {
    updateSetPokemonBox(setId, setPokemonListCache.get(setId), "muted");
    return;
  }

  updateSetPokemonBox(setId, "Loading Pokémon...", "muted");
  setStatus(`Loading Pokémon for set ${setId}...`);

  try {
    const cards = await fetchAllCardsForSet(setId);
    const pokemonMap = new Map();

    for (const card of cards) {
      const dexes = Array.isArray(card.nationalPokedexNumbers) ? card.nationalPokedexNumbers : [];
      for (const dex of dexes) {
        if (!pokemonMap.has(dex)) {
          pokemonMap.set(dex, {
            dex,
            name: card.name || `#${dex}`
          });
        }
      }
    }

    const pokemon = [...pokemonMap.values()].sort((a, b) => a.dex - b.dex);

    const html = pokemon.length
      ? `<div class="pokemonList">${pokemon.map(p => `
          <div class="miniPokemon">
            <img class="pokemonSprite" src="${sprite(p.dex)}" alt="${escapeHtml(p.name)}">
            <div>#${p.dex} ${escapeHtml(p.name)}</div>
          </div>
        `).join("")}</div>`
      : `No Pokémon found in this set.`;

    setPokemonListCache.set(setId, html);
    updateSetPokemonBox(setId, html, "muted");
    setStatus("Done.");
  } catch (err) {
    console.error(err);
    updateSetPokemonBox(setId, "Error loading Pokémon for this set.", "muted");
    setStatus(`Error:\n${err.message}`);
  }
}

async function runSearch() {
  const q = els.searchInput.value.trim();

  if (currentMode === "generations") {
    renderGenerations();
    setStatus("Generations loaded.");
    return;
  }

  if (currentMode === "tracker") {
    try {
      setStatus("Loading tracker...");
      await renderTracker();
      setStatus("Tracker loaded.");
    } catch (err) {
      console.error(err);
      clearResults();
      setStatus(`Error:\n${err.message}`);
      els.results.innerHTML = `<div class="empty">Error loading tracker.</div>`;
    }
    return;
  }

  if (currentMode === "holofoil") {
    renderComingSoon(currentMode);
    setStatus("That mode is not built yet.");
    return;
  }

  if (!q) {
    clearResults();
    setStatus("Ready.");
    return;
  }

  try {
    setStatus(`Loading ${currentMode} search...`);

    if (currentMode === "pokemon") {
      const result = await searchPokemon(q);
      renderPokemon(result);
    } else if (currentMode === "set") {
      const result = await searchSet(q);
      renderSetResults(result);
    }

    setStatus("Done.");
  } catch (err) {
    console.error(err);
    clearResults();
    setStatus(`Error:\n${err.message}`);
    els.results.innerHTML = `<div class="empty">Error loading data.</div>`;
  }
}

els.modeButtons.addEventListener("click", async (e) => {
  const btn = e.target.closest(".modeBtn");
  if (!btn) return;

  const mode = btn.dataset.mode;
  if (!mode) return;

  setMode(mode);

  if (mode === "generations") {
    renderGenerations();
    setStatus("Generations loaded.");
    return;
  }

  if (mode === "tracker") {
    try {
      setStatus("Loading tracker...");
      await renderTracker();
      setStatus("Tracker loaded.");
    } catch (err) {
      console.error(err);
      clearResults();
      setStatus(`Error:\n${err.message}`);
      els.results.innerHTML = `<div class="empty">Error loading tracker.</div>`;
    }
  }
});

els.themeToggleBtn.addEventListener("click", toggleTheme);

els.searchBtn.addEventListener("click", runSearch);

els.clearBtn.addEventListener("click", () => {
  els.searchInput.value = "";
  clearResults();
  setStatus("Ready.");
});

els.searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    runSearch();
  }
});

els.modalCloseBtn.addEventListener("click", closePokemonModal);
els.modalBackdrop.addEventListener("click", closePokemonModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.pokemonModal.classList.contains("hidden")) {
    closePokemonModal();
  }
});

els.results.addEventListener("click", async (e) => {
  const trackerImageBtn = e.target.closest("[data-tracker-image]");
  if (trackerImageBtn) {
    const dex = Number(trackerImageBtn.dataset.trackerImage);
    if (dex) {
      await showTrackerPokemonModal(dex);
    }
    return;
  }

  const calcAllBtn = e.target.closest("#calculateAllBtn");
  if (calcAllBtn) {
    await calculateAllChances();
    return;
  }

  const calcSetBtn = e.target.closest(".calc-set-btn");
  if (calcSetBtn) {
    const setId = calcSetBtn.dataset.setId;
    if (setId) await calculateSingleSetChance(setId);
    return;
  }

  const showSetPokemonBtn = e.target.closest(".show-set-pokemon-btn");
  if (showSetPokemonBtn) {
    const setId = showSetPokemonBtn.dataset.setId;
    if (setId) await showPokemonInSet(setId);
  }
});

els.results.addEventListener("change", async (e) => {
  const trackerSetFilter = e.target.closest("#trackerSetFilter");
  if (trackerSetFilter) {
    trackerSelectedSetId = trackerSetFilter.value || "";
    saveTrackerSetFilterState();

    try {
      setStatus("Applying tracker filter...");
      await renderTracker();
      setStatus("Tracker loaded.");
    } catch (err) {
      console.error(err);
      clearResults();
      setStatus(`Error:\n${err.message}`);
      els.results.innerHTML = `<div class="empty">Error loading tracker filter.</div>`;
    }
    return;
  }

  const checkbox = e.target.closest(".trackerCheckbox");
  if (!checkbox) return;

  const dex = Number(checkbox.dataset.trackerCheckbox);
  if (!dex) return;

  setTrackerCaught(dex, checkbox.checked);
});

applySavedTheme();
setMode(currentMode);

if (currentMode === "generations") {
  renderGenerations();
  setStatus("Generations loaded.");
}

if (currentMode === "tracker") {
  renderTracker()
    .then(() => setStatus("Tracker loaded."))
    .catch((err) => {
      console.error(err);
      clearResults();
      setStatus(`Error:\n${err.message}`);
      els.results.innerHTML = `<div class="empty">Error loading tracker.</div>`;
    });
}
