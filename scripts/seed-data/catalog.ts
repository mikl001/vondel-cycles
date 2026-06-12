// Hand-authored bilingual catalog content for the Vondel Cycles demo shop.
// Everything here is fictional. The generator script derives variants,
// descriptions, stock, reviews and images from these definitions.

export type LocalizedText = { nl: string; en: string };

export interface CategoryDef {
  key: string;
  parent?: string;
  slug: LocalizedText;
  name: LocalizedText;
  description: LocalizedText;
  sort: number;
}

export interface AttributeDef {
  slug: string;
  name: LocalizedText;
  sort: number;
  values: { slug: string; label: LocalizedText }[];
}

export interface ProductDef {
  key: string;
  category: string;
  brand: string;
  name: LocalizedText;
  intro: LocalizedText;
  /** Consumer price incl. BTW in euros */
  inclEuros: number;
  vatRate?: 9 | 21;
  /** attribute slug -> value slugs (also rendered as specs) */
  attrs: Record<string, string[]>;
  /** color value slugs -> one variant dimension + one image per color */
  colors?: string[];
  /** size labels (frame cm, helmet size, …) -> second variant dimension */
  sizes?: string[];
  sizeLabel?: LocalizedText;
  specsExtra?: { label: LocalizedText; value: LocalizedText }[];
  tags?: string[];
  weightGrams?: number;
}

export const COLOR_HEX: Record<string, string> = {
  zwart: "#1f1f1f",
  wit: "#f0ede6",
  rood: "#b3422f",
  blauw: "#2c5f8a",
  groen: "#346748",
  grijs: "#7c8388",
  oranje: "#d97d36",
  zand: "#cdb78f",
  bordeaux: "#722f37",
  mintgroen: "#9cc4b2",
};

export const categories: CategoryDef[] = [
  {
    key: "stadsfietsen",
    slug: { nl: "stadsfietsen", en: "city-bikes" },
    name: { nl: "Stadsfietsen", en: "City bikes" },
    description: {
      nl: "Degelijke stadsfietsen voor dagelijks gebruik: naar werk, college of de markt. Met verlichting, drager en slot-voorbereiding.",
      en: "Dependable city bikes for everyday riding: to work, class or the market. With lights, rack and lock mounts.",
    },
    sort: 1,
  },
  {
    key: "e-bikes",
    slug: { nl: "e-bikes", en: "e-bikes" },
    name: { nl: "E-bikes", en: "E-bikes" },
    description: {
      nl: "Elektrische fietsen met betrouwbare middenmotoren en accu's tot 130 km bereik. Proefrit? Kom langs bij het Vondelpark.",
      en: "Electric bikes with reliable mid-drive motors and batteries up to 130 km of range. Test ride? Visit us at the Vondelpark.",
    },
    sort: 2,
  },
  {
    key: "racefietsen",
    slug: { nl: "racefietsen", en: "road-bikes" },
    name: { nl: "Racefietsen", en: "Road bikes" },
    description: {
      nl: "Lichte racefietsen voor de dijken en duinen. Van instapmodel tot carbon klimgeit.",
      en: "Lightweight road bikes for dikes and dunes. From entry level to carbon climbing machines.",
    },
    sort: 3,
  },
  {
    key: "kinderfietsen",
    slug: { nl: "kinderfietsen", en: "kids-bikes" },
    name: { nl: "Kinderfietsen", en: "Kids' bikes" },
    description: {
      nl: "Veilige kinderfietsen van 16 tot 24 inch, met lage instap en stevige spatborden.",
      en: "Safe kids' bikes from 16 to 24 inch, with low step-through frames and sturdy mudguards.",
    },
    sort: 4,
  },
  {
    key: "accessoires",
    slug: { nl: "accessoires", en: "accessories" },
    name: { nl: "Accessoires", en: "Accessories" },
    description: {
      nl: "Alles voor onderweg: helmen, sloten, verlichting en tassen.",
      en: "Everything for the road: helmets, locks, lighting and bags.",
    },
    sort: 5,
  },
  {
    key: "helmen",
    parent: "accessoires",
    slug: { nl: "helmen", en: "helmets" },
    name: { nl: "Helmen", en: "Helmets" },
    description: {
      nl: "Fietshelmen voor stad, race en kinderen — allemaal met NTA-keurmerk (demo).",
      en: "Bike helmets for city, road and kids — all certified (demo).",
    },
    sort: 1,
  },
  {
    key: "sloten",
    parent: "accessoires",
    slug: { nl: "sloten", en: "locks" },
    name: { nl: "Sloten", en: "Locks" },
    description: {
      nl: "Kettingsloten, beugelsloten en vouwsloten met ART-sterren (demo).",
      en: "Chain locks, U-locks and folding locks with security ratings (demo).",
    },
    sort: 2,
  },
  {
    key: "verlichting",
    parent: "accessoires",
    slug: { nl: "verlichting", en: "lighting" },
    name: { nl: "Verlichting", en: "Lighting" },
    description: {
      nl: "USB-oplaadbare voor- en achterlichten, van 20 tot 1000 lumen.",
      en: "USB-rechargeable front and rear lights, from 20 to 1000 lumen.",
    },
    sort: 3,
  },
  {
    key: "fietstassen",
    parent: "accessoires",
    slug: { nl: "fietstassen", en: "bike-bags" },
    name: { nl: "Fietstassen", en: "Bike bags" },
    description: {
      nl: "Waterdichte enkele en dubbele fietstassen, stuurtassen en kratten.",
      en: "Waterproof single and double panniers, handlebar bags and crates.",
    },
    sort: 4,
  },
  {
    key: "onderdelen",
    slug: { nl: "onderdelen", en: "parts" },
    name: { nl: "Onderdelen", en: "Parts" },
    description: {
      nl: "Banden, zadels, kettingen en pedalen — de onderdelen die het vaakst aan vervanging toe zijn.",
      en: "Tyres, saddles, chains and pedals — the parts that wear out first.",
    },
    sort: 6,
  },
  {
    key: "boeken-kaarten",
    slug: { nl: "boeken-kaarten", en: "books-maps" },
    name: { nl: "Boeken & kaarten", en: "Books & maps" },
    description: {
      nl: "Fietsgidsen en routekaarten voor Nederland en daarbuiten. Boeken vallen onder het 9%-btw-tarief.",
      en: "Cycling guides and route maps for the Netherlands and beyond. Books fall under the reduced 9% VAT rate.",
    },
    sort: 7,
  },
];

export const attributes: AttributeDef[] = [
  {
    slug: "kleur",
    name: { nl: "Kleur", en: "Colour" },
    sort: 1,
    values: [
      { slug: "zwart", label: { nl: "Zwart", en: "Black" } },
      { slug: "wit", label: { nl: "Wit", en: "White" } },
      { slug: "rood", label: { nl: "Rood", en: "Red" } },
      { slug: "blauw", label: { nl: "Blauw", en: "Blue" } },
      { slug: "groen", label: { nl: "Groen", en: "Green" } },
      { slug: "grijs", label: { nl: "Grijs", en: "Grey" } },
      { slug: "oranje", label: { nl: "Oranje", en: "Orange" } },
      { slug: "zand", label: { nl: "Zand", en: "Sand" } },
      { slug: "bordeaux", label: { nl: "Bordeauxrood", en: "Burgundy" } },
      { slug: "mintgroen", label: { nl: "Mintgroen", en: "Mint green" } },
    ],
  },
  {
    slug: "type",
    name: { nl: "Type", en: "Type" },
    sort: 2,
    values: [
      { slug: "heren", label: { nl: "Heren", en: "Men" } },
      { slug: "dames", label: { nl: "Dames", en: "Women" } },
      { slug: "unisex", label: { nl: "Unisex", en: "Unisex" } },
      { slug: "kind", label: { nl: "Kind", en: "Kids" } },
    ],
  },
  {
    slug: "versnellingen",
    name: { nl: "Versnellingen", en: "Gears" },
    sort: 3,
    values: [
      { slug: "1", label: { nl: "1 (singlespeed)", en: "1 (single speed)" } },
      { slug: "3", label: { nl: "3", en: "3" } },
      { slug: "7", label: { nl: "7", en: "7" } },
      { slug: "8", label: { nl: "8", en: "8" } },
      { slug: "11", label: { nl: "11", en: "11" } },
      { slug: "22", label: { nl: "22", en: "22" } },
    ],
  },
  {
    slug: "wielmaat",
    name: { nl: "Wielmaat", en: "Wheel size" },
    sort: 4,
    values: [
      { slug: "16", label: { nl: "16 inch", en: "16 inch" } },
      { slug: "20", label: { nl: "20 inch", en: "20 inch" } },
      { slug: "24", label: { nl: "24 inch", en: "24 inch" } },
      { slug: "28", label: { nl: "28 inch", en: "28 inch" } },
    ],
  },
  {
    slug: "materiaal",
    name: { nl: "Framemateriaal", en: "Frame material" },
    sort: 5,
    values: [
      { slug: "staal", label: { nl: "Staal", en: "Steel" } },
      { slug: "aluminium", label: { nl: "Aluminium", en: "Aluminium" } },
      { slug: "carbon", label: { nl: "Carbon", en: "Carbon" } },
    ],
  },
  {
    slug: "accubereik",
    name: { nl: "Accubereik", en: "Battery range" },
    sort: 6,
    values: [
      { slug: "tot-50", label: { nl: "Tot 50 km", en: "Up to 50 km" } },
      { slug: "50-100", label: { nl: "50–100 km", en: "50–100 km" } },
      { slug: "100-plus", label: { nl: "Meer dan 100 km", en: "Over 100 km" } },
    ],
  },
];

export const tags: { slug: string; name: LocalizedText }[] = [
  { slug: "bestseller", name: { nl: "Bestseller", en: "Bestseller" } },
  { slug: "nieuw", name: { nl: "Nieuw", en: "New" } },
  { slug: "sale", name: { nl: "Aanbieding", en: "On sale" } },
  { slug: "amsterdam-proof", name: { nl: "Amsterdam-proof", en: "Amsterdam-proof" } },
];

const CITY_SIZES = ["49 cm", "53 cm", "57 cm"];
const ROAD_SIZES = ["52 cm", "54 cm", "56 cm", "58 cm"];
const HELMET_SIZES = ["S (51-55)", "M (55-59)", "L (59-63)"];
const FRAME = { nl: "Framemaat", en: "Frame size" };
const HELM = { nl: "Maat", en: "Size" };

export const products: ProductDef[] = [
  // ── Stadsfietsen ──────────────────────────────────────────────────────────
  {
    key: "stadsrijder-3",
    category: "stadsfietsen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Stadsrijder 3", en: "Vondel City Rider 3" },
    intro: {
      nl: "Onze meest verkochte stadsfiets: onverwoestbaar stalen frame, drie versnellingen en altijd-aan naafdynamoverlichting.",
      en: "Our best-selling city bike: indestructible steel frame, three gears and always-on hub dynamo lights.",
    },
    inclEuros: 549,
    attrs: { type: ["unisex"], versnellingen: ["3"], wielmaat: ["28"], materiaal: ["staal"] },
    colors: ["zwart", "bordeaux"],
    sizes: CITY_SIZES,
    sizeLabel: FRAME,
    tags: ["bestseller", "amsterdam-proof"],
    weightGrams: 18500,
  },
  {
    key: "stadsrijder-7",
    category: "stadsfietsen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Stadsrijder 7", en: "Vondel City Rider 7" },
    intro: {
      nl: "De Stadsrijder met zeven versnellingen en hydraulische velgremmen, voor wie ook de Utrechtse heuvels aankan.",
      en: "The City Rider with seven gears and hydraulic rim brakes, for riders who also face the hills of Utrecht.",
    },
    inclEuros: 699,
    attrs: { type: ["unisex"], versnellingen: ["7"], wielmaat: ["28"], materiaal: ["staal"] },
    colors: ["zwart", "groen"],
    sizes: CITY_SIZES,
    sizeLabel: FRAME,
    weightGrams: 18900,
  },
  {
    key: "grachten-omafiets",
    category: "stadsfietsen",
    brand: "Grachtenfiets",
    name: { nl: "Grachtenfiets Oma Deluxe", en: "Grachtenfiets Granny Deluxe" },
    intro: {
      nl: "De klassieke omafiets met extra lage instap, terugtraprem en handgevlochten rieten mand.",
      en: "The classic Dutch granny bike with extra low step-through, coaster brake and hand-woven wicker basket.",
    },
    inclEuros: 429,
    attrs: { type: ["dames"], versnellingen: ["1"], wielmaat: ["28"], materiaal: ["staal"] },
    colors: ["zwart", "mintgroen", "rood"],
    sizes: ["50 cm", "54 cm"],
    sizeLabel: FRAME,
    tags: ["bestseller"],
    weightGrams: 19200,
  },
  {
    key: "grachten-opafiets",
    category: "stadsfietsen",
    brand: "Grachtenfiets",
    name: { nl: "Grachtenfiets Opa Classic", en: "Grachtenfiets Grandpa Classic" },
    intro: {
      nl: "Rechte stang, geveerd Brooks-stijl zadel en een frame dat generaties meegaat.",
      en: "Straight top tube, sprung Brooks-style saddle and a frame built to last generations.",
    },
    inclEuros: 449,
    attrs: { type: ["heren"], versnellingen: ["1"], wielmaat: ["28"], materiaal: ["staal"] },
    colors: ["zwart", "grijs"],
    sizes: ["56 cm", "60 cm"],
    sizeLabel: FRAME,
    weightGrams: 19000,
  },
  {
    key: "noordwiel-forens",
    category: "stadsfietsen",
    brand: "Noordwiel",
    name: { nl: "Noordwiel Forens 8", en: "Noordwiel Commuter 8" },
    intro: {
      nl: "Lichte aluminium forensenfiets met acht versnellingen, riemaandrijving en onderhoudsvrije remmen.",
      en: "Light aluminium commuter with eight gears, belt drive and maintenance-free brakes.",
    },
    inclEuros: 949,
    attrs: { type: ["unisex"], versnellingen: ["8"], wielmaat: ["28"], materiaal: ["aluminium"] },
    colors: ["grijs", "blauw"],
    sizes: CITY_SIZES,
    sizeLabel: FRAME,
    tags: ["nieuw"],
    weightGrams: 14800,
  },
  {
    key: "noordwiel-singel",
    category: "stadsfietsen",
    brand: "Noordwiel",
    name: { nl: "Noordwiel Singel", en: "Noordwiel Singel" },
    intro: {
      nl: "Minimalistische singlespeed voor de vlakke stad: licht, stil en vrijwel onderhoudsvrij.",
      en: "Minimalist single speed for the flat city: light, silent and nearly maintenance-free.",
    },
    inclEuros: 499,
    attrs: { type: ["unisex"], versnellingen: ["1"], wielmaat: ["28"], materiaal: ["aluminium"] },
    colors: ["wit", "zwart", "oranje"],
    sizes: CITY_SIZES,
    sizeLabel: FRAME,
    weightGrams: 11900,
  },
  {
    key: "tulp-moederfiets",
    category: "stadsfietsen",
    brand: "Tulp & Zwaan",
    name: { nl: "Tulp & Zwaan Moederfiets", en: "Tulp & Zwaan Family Bike" },
    intro: {
      nl: "Stabiele moederfiets met dubbele standaard, voordrager en bevestigingspunten voor twee kinderzitjes.",
      en: "Stable family bike with double kickstand, front carrier and mounting points for two child seats.",
    },
    inclEuros: 799,
    attrs: { type: ["dames"], versnellingen: ["7"], wielmaat: ["28"], materiaal: ["staal"] },
    colors: ["zand", "zwart"],
    sizes: ["50 cm", "54 cm"],
    sizeLabel: FRAME,
    tags: ["amsterdam-proof"],
    weightGrams: 21500,
  },
  {
    key: "tulp-transporter",
    category: "stadsfietsen",
    brand: "Tulp & Zwaan",
    name: { nl: "Tulp & Zwaan Transporter", en: "Tulp & Zwaan Transporter" },
    intro: {
      nl: "Transportfiets met verstevigde voordrager tot 25 kg — voor kratten bier, planten of een hond.",
      en: "Transport bike with a reinforced front rack up to 25 kg — for beer crates, plants or a dog.",
    },
    inclEuros: 649,
    attrs: { type: ["unisex"], versnellingen: ["3"], wielmaat: ["28"], materiaal: ["staal"] },
    colors: ["zwart", "groen"],
    sizes: ["53 cm", "57 cm"],
    sizeLabel: FRAME,
    weightGrams: 22000,
  },
  {
    key: "windkracht-vouwfiets",
    category: "stadsfietsen",
    brand: "Windkracht",
    name: { nl: "Windkracht Vouwfiets V20", en: "Windkracht Folding Bike V20" },
    intro: {
      nl: "In tien seconden gevouwen en gratis mee in de trein: de ideale combinatie met een OV-abonnement.",
      en: "Folds in ten seconds and travels free on the train: the perfect match for a transit pass.",
    },
    inclEuros: 579,
    attrs: { type: ["unisex"], versnellingen: ["7"], wielmaat: ["20"], materiaal: ["aluminium"] },
    colors: ["grijs", "rood"],
    weightGrams: 12700,
  },
  {
    key: "vondel-nachtrijder",
    category: "stadsfietsen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Nachtrijder", en: "Vondel Night Rider" },
    intro: {
      nl: "Stadsfiets met reflecterende lak en geïntegreerde verlichting voor wie vaak in het donker rijdt.",
      en: "City bike with reflective paint and integrated lighting for riders who are often out after dark.",
    },
    inclEuros: 749,
    attrs: { type: ["unisex"], versnellingen: ["7"], wielmaat: ["28"], materiaal: ["aluminium"] },
    colors: ["grijs", "zwart"],
    sizes: CITY_SIZES,
    sizeLabel: FRAME,
    tags: ["nieuw"],
    weightGrams: 15600,
  },

  // ── E-bikes ───────────────────────────────────────────────────────────────
  {
    key: "vondel-e-stad",
    category: "e-bikes",
    brand: "Vondel Cycles",
    name: { nl: "Vondel E-Stad", en: "Vondel E-City" },
    intro: {
      nl: "Onze instap-e-bike met middenmotor, 65 km bereik en een uitneembare accu die je binnen oplaadt.",
      en: "Our entry-level e-bike with mid-drive motor, 65 km range and a removable battery you charge indoors.",
    },
    inclEuros: 1899,
    attrs: { type: ["unisex"], versnellingen: ["7"], wielmaat: ["28"], materiaal: ["aluminium"], accubereik: ["50-100"] },
    colors: ["grijs", "blauw"],
    sizes: CITY_SIZES,
    sizeLabel: FRAME,
    tags: ["bestseller"],
    specsExtra: [
      { label: { nl: "Motor", en: "Motor" }, value: { nl: "Middenmotor, 65 Nm", en: "Mid-drive, 65 Nm" } },
      { label: { nl: "Accu", en: "Battery" }, value: { nl: "418 Wh, uitneembaar", en: "418 Wh, removable" } },
    ],
    weightGrams: 23500,
  },
  {
    key: "vondel-e-stad-plus",
    category: "e-bikes",
    brand: "Vondel Cycles",
    name: { nl: "Vondel E-Stad Plus", en: "Vondel E-City Plus" },
    intro: {
      nl: "De E-Stad met grotere accu (130 km), riemaandrijving en geïntegreerd kettingslot.",
      en: "The E-City with a bigger battery (130 km), belt drive and integrated chain lock.",
    },
    inclEuros: 2699,
    attrs: { type: ["unisex"], versnellingen: ["8"], wielmaat: ["28"], materiaal: ["aluminium"], accubereik: ["100-plus"] },
    colors: ["zwart", "zand"],
    sizes: CITY_SIZES,
    sizeLabel: FRAME,
    tags: ["nieuw"],
    specsExtra: [
      { label: { nl: "Motor", en: "Motor" }, value: { nl: "Middenmotor, 75 Nm", en: "Mid-drive, 75 Nm" } },
      { label: { nl: "Accu", en: "Battery" }, value: { nl: "725 Wh, uitneembaar", en: "725 Wh, removable" } },
    ],
    weightGrams: 24800,
  },
  {
    key: "noordwiel-e-forens",
    category: "e-bikes",
    brand: "Noordwiel",
    name: { nl: "Noordwiel E-Forens", en: "Noordwiel E-Commuter" },
    intro: {
      nl: "Sportieve e-bike voor woon-werkverkeer tot 30 km enkele reis, met snellaadfunctie.",
      en: "Sporty e-bike for commutes up to 30 km each way, with fast charging.",
    },
    inclEuros: 2299,
    attrs: { type: ["unisex"], versnellingen: ["8"], wielmaat: ["28"], materiaal: ["aluminium"], accubereik: ["50-100"] },
    colors: ["grijs", "groen"],
    sizes: CITY_SIZES,
    sizeLabel: FRAME,
    weightGrams: 22600,
  },
  {
    key: "tulp-e-moeder",
    category: "e-bikes",
    brand: "Tulp & Zwaan",
    name: { nl: "Tulp & Zwaan E-Moederfiets", en: "Tulp & Zwaan E-Family" },
    intro: {
      nl: "Elektrische gezinsfiets met extra sterke standaard en trapondersteuning die soepel aanzet met kinderen achterop.",
      en: "Electric family bike with an extra strong kickstand and assist that engages smoothly with kids on the back.",
    },
    inclEuros: 2499,
    attrs: { type: ["dames"], versnellingen: ["7"], wielmaat: ["28"], materiaal: ["staal"], accubereik: ["50-100"] },
    colors: ["zand", "zwart"],
    sizes: ["50 cm", "54 cm"],
    sizeLabel: FRAME,
    tags: ["bestseller", "amsterdam-proof"],
    weightGrams: 26900,
  },
  {
    key: "windkracht-e-vouw",
    category: "e-bikes",
    brand: "Windkracht",
    name: { nl: "Windkracht E-Vouw", en: "Windkracht E-Fold" },
    intro: {
      nl: "Elektrische vouwfiets van 17 kg met 45 km bereik — de trein in, de motor aan.",
      en: "A 17 kg electric folding bike with 45 km of range — hop on the train, switch on the motor.",
    },
    inclEuros: 1699,
    attrs: { type: ["unisex"], versnellingen: ["7"], wielmaat: ["20"], materiaal: ["aluminium"], accubereik: ["tot-50"] },
    colors: ["zwart", "wit"],
    weightGrams: 17000,
  },
  {
    key: "grachten-e-oma",
    category: "e-bikes",
    brand: "Grachtenfiets",
    name: { nl: "Grachtenfiets E-Oma", en: "Grachtenfiets E-Granny" },
    intro: {
      nl: "De vertrouwde omafiets, nu met stille voorwielmotor en accu verstopt in de bagagedrager.",
      en: "The trusted granny bike, now with a silent front-wheel motor and the battery hidden in the rear rack.",
    },
    inclEuros: 1599,
    attrs: { type: ["dames"], versnellingen: ["3"], wielmaat: ["28"], materiaal: ["staal"], accubereik: ["tot-50"] },
    colors: ["zwart", "mintgroen"],
    sizes: ["50 cm", "54 cm"],
    sizeLabel: FRAME,
    weightGrams: 24300,
  },
  {
    key: "windkracht-e-trekking",
    category: "e-bikes",
    brand: "Windkracht",
    name: { nl: "Windkracht E-Trekking 130", en: "Windkracht E-Trekking 130" },
    intro: {
      nl: "Trekking-e-bike met 130 km bereik, afgemonteerd met tassendragers en verende voorvork.",
      en: "Trekking e-bike with 130 km of range, fitted with pannier racks and a suspension fork.",
    },
    inclEuros: 2999,
    attrs: { type: ["unisex"], versnellingen: ["11"], wielmaat: ["28"], materiaal: ["aluminium"], accubereik: ["100-plus"] },
    colors: ["groen", "grijs"],
    sizes: CITY_SIZES,
    sizeLabel: FRAME,
    weightGrams: 25500,
  },
  {
    key: "noordwiel-e-singel",
    category: "e-bikes",
    brand: "Noordwiel",
    name: { nl: "Noordwiel E-Singel", en: "Noordwiel E-Singel" },
    intro: {
      nl: "Puristische e-bike die je nauwelijks van een gewone fiets onderscheidt — tot je de motor inschakelt.",
      en: "A purist e-bike you can barely tell from a regular bike — until you switch on the motor.",
    },
    inclEuros: 2199,
    attrs: { type: ["unisex"], versnellingen: ["1"], wielmaat: ["28"], materiaal: ["aluminium"], accubereik: ["tot-50"] },
    colors: ["zwart", "wit"],
    sizes: CITY_SIZES,
    sizeLabel: FRAME,
    tags: ["nieuw"],
    weightGrams: 16800,
  },

  // ── Racefietsen ───────────────────────────────────────────────────────────
  {
    key: "vondel-dijkenraser",
    category: "racefietsen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Dijkenraser", en: "Vondel Dike Racer" },
    intro: {
      nl: "Aluminium instapracer met carbon voorvork en 22 versnellingen — klaar voor je eerste toertocht.",
      en: "Aluminium entry-level racer with carbon fork and 22 gears — ready for your first sportive.",
    },
    inclEuros: 1299,
    attrs: { type: ["unisex"], versnellingen: ["22"], wielmaat: ["28"], materiaal: ["aluminium"] },
    colors: ["rood", "zwart"],
    sizes: ROAD_SIZES,
    sizeLabel: FRAME,
    tags: ["bestseller"],
    weightGrams: 9200,
  },
  {
    key: "vondel-dijkenraser-carbon",
    category: "racefietsen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Dijkenraser Carbon", en: "Vondel Dike Racer Carbon" },
    intro: {
      nl: "Volledig carbon frame van 7,9 kg met elektrisch schakelen, voor wie de Amstel Gold droomt.",
      en: "Full carbon 7.9 kg frame with electronic shifting, for riders dreaming of the Amstel Gold.",
    },
    inclEuros: 3499,
    attrs: { type: ["unisex"], versnellingen: ["22"], wielmaat: ["28"], materiaal: ["carbon"] },
    colors: ["zwart", "wit"],
    sizes: ROAD_SIZES,
    sizeLabel: FRAME,
    tags: ["nieuw"],
    weightGrams: 7900,
  },
  {
    key: "noordwiel-gravelaar",
    category: "racefietsen",
    brand: "Noordwiel",
    name: { nl: "Noordwiel Gravelaar", en: "Noordwiel Graveller" },
    intro: {
      nl: "Gravelbike met brede 40mm-banden voor schelpenpaden, bospaden en alles ertussenin.",
      en: "Gravel bike with wide 40mm tyres for shell paths, forest tracks and everything in between.",
    },
    inclEuros: 1899,
    attrs: { type: ["unisex"], versnellingen: ["11"], wielmaat: ["28"], materiaal: ["aluminium"] },
    colors: ["zand", "groen"],
    sizes: ROAD_SIZES,
    sizeLabel: FRAME,
    tags: ["bestseller"],
    weightGrams: 10100,
  },
  {
    key: "noordwiel-gravelaar-carbon",
    category: "racefietsen",
    brand: "Noordwiel",
    name: { nl: "Noordwiel Gravelaar Carbon", en: "Noordwiel Graveller Carbon" },
    intro: {
      nl: "De Gravelaar in carbon, met dragermogelijkheden voor bikepacking-avonturen.",
      en: "The Graveller in carbon, with mounting points for bikepacking adventures.",
    },
    inclEuros: 2899,
    attrs: { type: ["unisex"], versnellingen: ["11"], wielmaat: ["28"], materiaal: ["carbon"] },
    colors: ["bordeaux", "zwart"],
    sizes: ROAD_SIZES,
    sizeLabel: FRAME,
    weightGrams: 8800,
  },
  {
    key: "windkracht-tijdrit",
    category: "racefietsen",
    brand: "Windkracht",
    name: { nl: "Windkracht Tijdrit TT1", en: "Windkracht Time Trial TT1" },
    intro: {
      nl: "Aerodynamische tijdritfiets ontwikkeld in de windtunnel van Delft (althans, in ons verhaal).",
      en: "Aerodynamic time trial bike developed in the Delft wind tunnel (in our story, at least).",
    },
    inclEuros: 4299,
    attrs: { type: ["unisex"], versnellingen: ["22"], wielmaat: ["28"], materiaal: ["carbon"] },
    colors: ["zwart"],
    sizes: ["52 cm", "54 cm", "56 cm"],
    sizeLabel: FRAME,
    weightGrams: 8400,
  },
  {
    key: "vondel-veldrijder",
    category: "racefietsen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Veldrijder", en: "Vondel Cyclocrosser" },
    intro: {
      nl: "Cyclocross-fiets voor modderige winterrondjes door het Amsterdamse Bos.",
      en: "Cyclocross bike for muddy winter laps through the Amsterdamse Bos.",
    },
    inclEuros: 1799,
    attrs: { type: ["unisex"], versnellingen: ["11"], wielmaat: ["28"], materiaal: ["aluminium"] },
    colors: ["oranje", "zwart"],
    sizes: ROAD_SIZES,
    sizeLabel: FRAME,
    weightGrams: 9600,
  },
  {
    key: "grachten-retroracer",
    category: "racefietsen",
    brand: "Grachtenfiets",
    name: { nl: "Grachtenfiets Retroracer", en: "Grachtenfiets Retro Racer" },
    intro: {
      nl: "Stalen racefiets met klassieke buizen en moderne onderdelen — stijl van toen, schakelen van nu.",
      en: "Steel road bike with classic tubing and modern components — vintage looks, modern shifting.",
    },
    inclEuros: 1599,
    attrs: { type: ["unisex"], versnellingen: ["22"], wielmaat: ["28"], materiaal: ["staal"] },
    colors: ["bordeaux", "wit"],
    sizes: ROAD_SIZES,
    sizeLabel: FRAME,
    weightGrams: 10400,
  },
  {
    key: "windkracht-damesracer",
    category: "racefietsen",
    brand: "Windkracht",
    name: { nl: "Windkracht Damesracer D2", en: "Windkracht Women's Racer D2" },
    intro: {
      nl: "Racegeometrie afgestemd op vrouwen, met smaller stuur en kortere cranks.",
      en: "Race geometry tuned for women, with a narrower handlebar and shorter cranks.",
    },
    inclEuros: 1499,
    attrs: { type: ["dames"], versnellingen: ["22"], wielmaat: ["28"], materiaal: ["aluminium"] },
    colors: ["mintgroen", "zwart"],
    sizes: ["49 cm", "52 cm", "54 cm"],
    sizeLabel: FRAME,
    weightGrams: 9000,
  },

  // ── Kinderfietsen ─────────────────────────────────────────────────────────
  {
    key: "vondel-kleine-beer-16",
    category: "kinderfietsen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Kleine Beer 16\"", en: "Vondel Little Bear 16\"" },
    intro: {
      nl: "Eerste fietsje met zijwieltjes, kettingkast en een bel met beertje — voor kinderen van 4 tot 6.",
      en: "First bike with training wheels, chain guard and a little bear bell — for kids aged 4 to 6.",
    },
    inclEuros: 219,
    attrs: { type: ["kind"], versnellingen: ["1"], wielmaat: ["16"], materiaal: ["staal"] },
    colors: ["rood", "mintgroen"],
    tags: ["bestseller"],
    weightGrams: 10500,
  },
  {
    key: "vondel-kleine-beer-20",
    category: "kinderfietsen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Kleine Beer 20\"", en: "Vondel Little Bear 20\"" },
    intro: {
      nl: "De Kleine Beer voor kinderen van 6 tot 9, met drie versnellingen en handremmen.",
      en: "The Little Bear for kids aged 6 to 9, with three gears and hand brakes.",
    },
    inclEuros: 289,
    attrs: { type: ["kind"], versnellingen: ["3"], wielmaat: ["20"], materiaal: ["staal"] },
    colors: ["blauw", "oranje"],
    weightGrams: 11800,
  },
  {
    key: "vondel-kleine-beer-24",
    category: "kinderfietsen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Kleine Beer 24\"", en: "Vondel Little Bear 24\"" },
    intro: {
      nl: "Bijna een grote-mensenfiets: 24 inch, zeven versnellingen en verlichting op de dynamo.",
      en: "Almost a grown-up bike: 24 inch, seven gears and dynamo lighting.",
    },
    inclEuros: 349,
    attrs: { type: ["kind"], versnellingen: ["7"], wielmaat: ["24"], materiaal: ["staal"] },
    colors: ["zwart", "rood"],
    weightGrams: 13000,
  },
  {
    key: "tulp-loopfiets",
    category: "kinderfietsen",
    brand: "Tulp & Zwaan",
    name: { nl: "Tulp & Zwaan Loopfiets", en: "Tulp & Zwaan Balance Bike" },
    intro: {
      nl: "Houten loopfiets voor peuters vanaf 2 jaar, met verstelbaar zadel en luchtbanden.",
      en: "Wooden balance bike for toddlers from age 2, with adjustable saddle and pneumatic tyres.",
    },
    inclEuros: 119,
    attrs: { type: ["kind"], wielmaat: ["16"] },
    colors: ["zand"],
    tags: ["nieuw"],
    weightGrams: 3800,
  },
  {
    key: "noordwiel-junior-race",
    category: "kinderfietsen",
    brand: "Noordwiel",
    name: { nl: "Noordwiel Junior Race 24\"", en: "Noordwiel Junior Race 24\"" },
    intro: {
      nl: "Echte racefiets in het klein, voor de jeugdwielrenner vanaf 8 jaar.",
      en: "A real road bike in miniature, for young racers from age 8.",
    },
    inclEuros: 549,
    attrs: { type: ["kind"], versnellingen: ["8"], wielmaat: ["24"], materiaal: ["aluminium"] },
    colors: ["rood", "blauw"],
    weightGrams: 8900,
  },
  {
    key: "grachten-kindertransport",
    category: "kinderfietsen",
    brand: "Grachtenfiets",
    name: { nl: "Grachtenfiets Junior Transport 20\"", en: "Grachtenfiets Junior Transport 20\"" },
    intro: {
      nl: "Mini-transportfiets met voordrager, zodat de jongste ook de boodschappen kan doen.",
      en: "Mini transport bike with front rack, so the youngest can carry groceries too.",
    },
    inclEuros: 329,
    attrs: { type: ["kind"], versnellingen: ["3"], wielmaat: ["20"], materiaal: ["staal"] },
    colors: ["groen", "zand"],
    weightGrams: 12600,
  },

  // ── Helmen ────────────────────────────────────────────────────────────────
  {
    key: "kopstuk-stadshelm",
    category: "helmen",
    brand: "KopStuk",
    name: { nl: "KopStuk Stadshelm", en: "KopStuk City Helmet" },
    intro: {
      nl: "Stadshelm met geïntegreerd achterlicht en magneetsluiting — veilig zonder wielrenner-look.",
      en: "City helmet with integrated rear light and magnetic buckle — safe without the racer look.",
    },
    inclEuros: 79.95,
    attrs: {},
    colors: ["zwart", "zand", "mintgroen"],
    sizes: HELMET_SIZES,
    sizeLabel: HELM,
    tags: ["bestseller"],
    weightGrams: 380,
  },
  {
    key: "kopstuk-racehelm",
    category: "helmen",
    brand: "KopStuk",
    name: { nl: "KopStuk Racehelm Aero", en: "KopStuk Road Helmet Aero" },
    intro: {
      nl: "Geventileerde racehelm van 240 gram met aerodynamische schaal.",
      en: "Ventilated 240-gram road helmet with an aerodynamic shell.",
    },
    inclEuros: 129,
    attrs: {},
    colors: ["wit", "zwart", "rood"],
    sizes: HELMET_SIZES,
    sizeLabel: HELM,
    weightGrams: 240,
  },
  {
    key: "kopstuk-kinderhelm",
    category: "helmen",
    brand: "KopStuk",
    name: { nl: "KopStuk Kinderhelm", en: "KopStuk Kids' Helmet" },
    intro: {
      nl: "Vrolijke kinderhelm met dierenprint, draaiknop-pasvorm en groen achterlichtje.",
      en: "Cheerful kids' helmet with animal print, dial fit and a small green rear light.",
    },
    inclEuros: 39.95,
    attrs: {},
    colors: ["rood", "blauw", "mintgroen"],
    sizes: ["XS (47-51)", "S (51-55)"],
    sizeLabel: HELM,
    weightGrams: 290,
  },
  {
    key: "kopstuk-speed",
    category: "helmen",
    brand: "KopStuk",
    name: { nl: "KopStuk Speed Pedelec NTA", en: "KopStuk Speed Pedelec NTA" },
    intro: {
      nl: "Goedgekeurde helm voor speed pedelecs (45 km/u) met extra slaapbescherming.",
      en: "Certified helmet for speed pedelecs (45 km/h) with extra temple protection.",
    },
    inclEuros: 159,
    attrs: {},
    colors: ["zwart", "grijs"],
    sizes: HELMET_SIZES,
    sizeLabel: HELM,
    weightGrams: 450,
  },
  {
    key: "kopstuk-vouwhelm",
    category: "helmen",
    brand: "KopStuk",
    name: { nl: "KopStuk Vouwhelm", en: "KopStuk Folding Helmet" },
    intro: {
      nl: "Opvouwbare helm die in je tas past — geen excuus meer om hem thuis te laten.",
      en: "A folding helmet that fits in your bag — no more excuses to leave it at home.",
    },
    inclEuros: 99,
    attrs: {},
    colors: ["zwart", "wit"],
    sizes: HELMET_SIZES,
    sizeLabel: HELM,
    tags: ["nieuw"],
    weightGrams: 420,
  },
  {
    key: "kopstuk-winterset",
    category: "helmen",
    brand: "KopStuk",
    name: { nl: "KopStuk Wintermuts-set", en: "KopStuk Winter Liner Set" },
    intro: {
      nl: "Dunne wintermuts en oorwarmers die onder elke KopStuk-helm passen.",
      en: "Thin winter beanie and ear warmers that fit under any KopStuk helmet.",
    },
    inclEuros: 24.95,
    attrs: {},
    colors: ["zwart", "grijs"],
    weightGrams: 90,
  },

  // ── Sloten ────────────────────────────────────────────────────────────────
  {
    key: "slotvast-ketting-9",
    category: "sloten",
    brand: "SlotVast",
    name: { nl: "SlotVast Kettingslot 9mm", en: "SlotVast Chain Lock 9mm" },
    intro: {
      nl: "Kettingslot met 9mm-schalmen en stoffen hoes — het minimum voor de stad (ART 2, demo).",
      en: "Chain lock with 9mm links and fabric sleeve — the minimum for city parking (security level 2, demo).",
    },
    inclEuros: 44.95,
    attrs: {},
    colors: ["zwart"],
    sizes: ["90 cm", "120 cm"],
    sizeLabel: { nl: "Lengte", en: "Length" },
    tags: ["bestseller"],
    weightGrams: 2300,
  },
  {
    key: "slotvast-ketting-11",
    category: "sloten",
    brand: "SlotVast",
    name: { nl: "SlotVast Kettingslot 11mm Pro", en: "SlotVast Chain Lock 11mm Pro" },
    intro: {
      nl: "Zwaar kettingslot voor e-bikes, met verzekeringsgoedkeuring (ART 3, demo).",
      en: "Heavy chain lock for e-bikes, insurance approved (security level 3, demo).",
    },
    inclEuros: 79.95,
    attrs: {},
    colors: ["zwart"],
    sizes: ["100 cm", "140 cm"],
    sizeLabel: { nl: "Lengte", en: "Length" },
    weightGrams: 3600,
  },
  {
    key: "slotvast-beugel",
    category: "sloten",
    brand: "SlotVast",
    name: { nl: "SlotVast Beugelslot B450", en: "SlotVast U-Lock B450" },
    intro: {
      nl: "Compact beugelslot met dubbele vergrendeling en framehouder.",
      en: "Compact U-lock with double bolting and a frame mount.",
    },
    inclEuros: 59.95,
    attrs: {},
    colors: ["zwart", "oranje"],
    weightGrams: 1450,
  },
  {
    key: "slotvast-vouw",
    category: "sloten",
    brand: "SlotVast",
    name: { nl: "SlotVast Vouwslot V85", en: "SlotVast Folding Lock V85" },
    intro: {
      nl: "Vouwslot van 85 cm dat compact opvouwt tot broekzakformaat.",
      en: "An 85 cm folding lock that packs down to pocket size.",
    },
    inclEuros: 69.95,
    attrs: {},
    colors: ["zwart", "grijs"],
    tags: ["nieuw"],
    weightGrams: 1300,
  },
  {
    key: "slotvast-insteek",
    category: "sloten",
    brand: "SlotVast",
    name: { nl: "SlotVast Ringslot + insteekketting", en: "SlotVast Frame Lock + Plug-in Chain" },
    intro: {
      nl: "Klassiek ringslot met insteekketting — de Nederlandse dubbele standaard tegen diefstal.",
      en: "Classic frame lock with plug-in chain — the Dutch double standard against theft.",
    },
    inclEuros: 54.95,
    attrs: {},
    colors: ["zwart"],
    weightGrams: 1900,
  },

  // ── Verlichting ───────────────────────────────────────────────────────────
  {
    key: "lumen-voorlicht-100",
    category: "verlichting",
    brand: "LumenLicht",
    name: { nl: "LumenLicht Stadslamp 100", en: "LumenLicht City Beam 100" },
    intro: {
      nl: "USB-C-oplaadbaar voorlicht van 100 lumen met stuurhouder en regensensor-stand.",
      en: "USB-C rechargeable 100 lumen front light with bar mount and rain mode.",
    },
    inclEuros: 29.95,
    attrs: {},
    colors: ["zwart"],
    tags: ["bestseller"],
    weightGrams: 85,
  },
  {
    key: "lumen-set-basis",
    category: "verlichting",
    brand: "LumenLicht",
    name: { nl: "LumenLicht Basis-set", en: "LumenLicht Basic Set" },
    intro: {
      nl: "Voor- en achterlicht in één doosje, samen 40 lumen — voldoet aan de wettelijke eisen.",
      en: "Front and rear light in one box, 40 lumen combined — meets the legal requirements.",
    },
    inclEuros: 19.95,
    attrs: {},
    colors: ["zwart"],
    weightGrams: 60,
  },
  {
    key: "lumen-race-1000",
    category: "verlichting",
    brand: "LumenLicht",
    name: { nl: "LumenLicht Race 1000", en: "LumenLicht Race 1000" },
    intro: {
      nl: "1000 lumen voor onverlichte polderwegen, met afstandsbediening op het stuur.",
      en: "1000 lumen for unlit polder roads, with a handlebar remote.",
    },
    inclEuros: 89.95,
    attrs: {},
    colors: ["zwart"],
    tags: ["nieuw"],
    weightGrams: 170,
  },
  {
    key: "lumen-achterlicht-rem",
    category: "verlichting",
    brand: "LumenLicht",
    name: { nl: "LumenLicht Remlicht Achter", en: "LumenLicht Brake Light Rear" },
    intro: {
      nl: "Achterlicht met versnellingsmeter dat feller oplicht wanneer je remt.",
      en: "Rear light with an accelerometer that brightens when you brake.",
    },
    inclEuros: 34.95,
    attrs: {},
    colors: ["zwart"],
    weightGrams: 45,
  },
  {
    key: "lumen-spaakjes",
    category: "verlichting",
    brand: "LumenLicht",
    name: { nl: "LumenLicht Spaakreflectoren 36x", en: "LumenLicht Spoke Reflectors 36x" },
    intro: {
      nl: "Set van 36 reflecterende spaakhoesjes voor 360°-zichtbaarheid.",
      en: "Set of 36 reflective spoke sleeves for 360° visibility.",
    },
    inclEuros: 12.95,
    attrs: {},
    colors: ["wit", "oranje"],
    weightGrams: 110,
  },

  // ── Fietstassen ───────────────────────────────────────────────────────────
  {
    key: "polder-enkel",
    category: "fietstassen",
    brand: "Polderpack",
    name: { nl: "Polderpack Enkele Tas 20L", en: "Polderpack Single Pannier 20L" },
    intro: {
      nl: "Waterdichte enkele fietstas met rolsluiting en quick-release haken.",
      en: "Waterproof single pannier with roll-top closure and quick-release hooks.",
    },
    inclEuros: 64.95,
    attrs: {},
    colors: ["zwart", "groen", "zand"],
    tags: ["bestseller"],
    weightGrams: 850,
  },
  {
    key: "polder-dubbel",
    category: "fietstassen",
    brand: "Polderpack",
    name: { nl: "Polderpack Dubbele Tas 40L", en: "Polderpack Double Pannier 40L" },
    intro: {
      nl: "Klassieke dubbele tas voor de wekelijkse boodschappen — past op elke bagagedrager.",
      en: "Classic double pannier for the weekly groceries — fits any rear rack.",
    },
    inclEuros: 89.95,
    attrs: {},
    colors: ["zwart", "bordeaux"],
    weightGrams: 1400,
  },
  {
    key: "polder-stuurtas",
    category: "fietstassen",
    brand: "Polderpack",
    name: { nl: "Polderpack Stuurtas 5L", en: "Polderpack Handlebar Bag 5L" },
    intro: {
      nl: "Compacte stuurtas met kaartvenster en schouderband, voor dagtochten.",
      en: "Compact handlebar bag with map window and shoulder strap, for day trips.",
    },
    inclEuros: 39.95,
    attrs: {},
    colors: ["zand", "zwart"],
    weightGrams: 420,
  },
  {
    key: "polder-krat",
    category: "fietstassen",
    brand: "Polderpack",
    name: { nl: "Polderpack Voordragerkrat", en: "Polderpack Front Crate" },
    intro: {
      nl: "Stevig kunststof krat van gerecycled visnet, inclusief bevestigingsset.",
      en: "Sturdy crate made from recycled fishing nets, mounting kit included.",
    },
    inclEuros: 29.95,
    attrs: {},
    colors: ["zwart", "groen"],
    tags: ["nieuw"],
    weightGrams: 1100,
  },
  {
    key: "polder-bikepacking",
    category: "fietstassen",
    brand: "Polderpack",
    name: { nl: "Polderpack Bikepacking Zadeltas 12L", en: "Polderpack Bikepacking Saddle Bag 12L" },
    intro: {
      nl: "Lichte zadeltas voor bikepacking, rolt strak op en wiebelt niet.",
      en: "Light bikepacking saddle bag that rolls up tight and never sways.",
    },
    inclEuros: 74.95,
    attrs: {},
    colors: ["zwart", "zand"],
    weightGrams: 380,
  },

  // ── Onderdelen ────────────────────────────────────────────────────────────
  {
    key: "band-stad-28",
    category: "onderdelen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Stadsband 28\" anti-lek", en: "Vondel City Tyre 28\" puncture-proof" },
    intro: {
      nl: "Anti-lekband met 5mm-beschermlaag en reflecterende zijkant, per stuk.",
      en: "Puncture-proof tyre with 5mm protective layer and reflective sidewall, sold each.",
    },
    inclEuros: 27.95,
    attrs: { wielmaat: ["28"] },
    colors: ["zwart"],
    weightGrams: 900,
  },
  {
    key: "band-race-28",
    category: "onderdelen",
    brand: "Windkracht",
    name: { nl: "Windkracht Raceband 28mm", en: "Windkracht Road Tyre 28mm" },
    intro: {
      nl: "Soepele vouwband van 220 gram voor trainings- en wedstrijdkilometers.",
      en: "Supple 220-gram folding tyre for training and race kilometres.",
    },
    inclEuros: 49.95,
    attrs: { wielmaat: ["28"] },
    colors: ["zwart"],
    weightGrams: 220,
  },
  {
    key: "zadel-comfort",
    category: "onderdelen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Comfortzadel", en: "Vondel Comfort Saddle" },
    intro: {
      nl: "Breed gelzadel met dubbele vering, voor rechtop fietsen zonder zadelpijn.",
      en: "Wide gel saddle with double springs, for upright riding without saddle pain.",
    },
    inclEuros: 34.95,
    attrs: {},
    colors: ["zwart", "bordeaux"],
    tags: ["bestseller"],
    weightGrams: 780,
  },
  {
    key: "zadel-race",
    category: "onderdelen",
    brand: "Windkracht",
    name: { nl: "Windkracht Racezadel Carbon", en: "Windkracht Road Saddle Carbon" },
    intro: {
      nl: "Carbonrail-zadel van 145 gram met drukverlagende uitsparing.",
      en: "A 145-gram carbon-rail saddle with a pressure-relief cut-out.",
    },
    inclEuros: 119,
    attrs: { materiaal: ["carbon"] },
    colors: ["zwart"],
    weightGrams: 145,
  },
  {
    key: "ketting-8",
    category: "onderdelen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Ketting 8-speed", en: "Vondel Chain 8-speed" },
    intro: {
      nl: "Roestwerende ketting voor stads- en e-bikes met 7 of 8 versnellingen, inclusief sluitschakel.",
      en: "Rust-resistant chain for city and e-bikes with 7 or 8 gears, quick link included.",
    },
    inclEuros: 18.95,
    attrs: {},
    colors: ["grijs"],
    weightGrams: 310,
  },
  {
    key: "pedalen-stad",
    category: "onderdelen",
    brand: "Vondel Cycles",
    name: { nl: "Vondel Stadspedalen antislip", en: "Vondel City Pedals anti-slip" },
    intro: {
      nl: "Brede pedalen met rubberen antislip-inzet en reflectoren, per paar.",
      en: "Wide pedals with rubber anti-slip inserts and reflectors, per pair.",
    },
    inclEuros: 16.95,
    attrs: {},
    colors: ["zwart"],
    weightGrams: 540,
  },
  {
    key: "mandje-riet",
    category: "onderdelen",
    brand: "Grachtenfiets",
    name: { nl: "Grachtenfiets Rieten Mand", en: "Grachtenfiets Wicker Basket" },
    intro: {
      nl: "Handgevlochten rieten mand met lederen riempjes, past op elk stuur.",
      en: "Hand-woven wicker basket with leather straps, fits any handlebar.",
    },
    inclEuros: 39.95,
    attrs: {},
    colors: ["zand"],
    tags: ["amsterdam-proof"],
    weightGrams: 950,
  },
  {
    key: "bel-koper",
    category: "onderdelen",
    brand: "Grachtenfiets",
    name: { nl: "Grachtenfiets Koperen Bel", en: "Grachtenfiets Brass Bell" },
    intro: {
      nl: "Ouderwets heldere koperen bel — hoorbaar boven het stadsrumoer uit.",
      en: "Old-fashioned bright brass bell — audible above the city noise.",
    },
    inclEuros: 14.95,
    attrs: {},
    colors: ["zand"],
    tags: ["bestseller"],
    weightGrams: 95,
  },

  // ── Boeken & kaarten (9% BTW) ─────────────────────────────────────────────
  {
    key: "boek-knooppunten",
    category: "boeken-kaarten",
    brand: "Veluwe Uitgevers",
    name: {
      nl: "Knooppunten van Nederland — 50 routes",
      en: "Junction Routes of the Netherlands — 50 rides",
    },
    intro: {
      nl: "De vijftig mooiste knooppuntroutes, van Waddenkust tot Limburgse heuvels, met koffiestops.",
      en: "The fifty most beautiful junction-network routes, from the Wadden coast to the Limburg hills, with coffee stops.",
    },
    inclEuros: 24.99,
    vatRate: 9,
    attrs: {},
    specsExtra: [
      { label: { nl: "Pagina's", en: "Pages" }, value: { nl: "224", en: "224" } },
      { label: { nl: "Taal", en: "Language" }, value: { nl: "Nederlands", en: "Dutch" } },
    ],
    tags: ["bestseller"],
    weightGrams: 480,
  },
  {
    key: "boek-onderhoud",
    category: "boeken-kaarten",
    brand: "Veluwe Uitgevers",
    name: { nl: "Zelf je fiets onderhouden", en: "Maintain Your Own Bike" },
    intro: {
      nl: "Stap-voor-stap handboek voor al het onderhoud dat je zonder werkplaats kunt doen.",
      en: "Step-by-step manual for all the maintenance you can do without a workshop.",
    },
    inclEuros: 19.99,
    vatRate: 9,
    attrs: {},
    specsExtra: [
      { label: { nl: "Pagina's", en: "Pages" }, value: { nl: "168", en: "168" } },
      { label: { nl: "Taal", en: "Language" }, value: { nl: "Nederlands", en: "Dutch" } },
    ],
    weightGrams: 390,
  },
  {
    key: "kaart-randstad",
    category: "boeken-kaarten",
    brand: "Veluwe Uitgevers",
    name: { nl: "Fietskaart Randstad 1:50.000", en: "Cycling Map Randstad 1:50,000" },
    intro: {
      nl: "Scheurvaste en waterbestendige fietskaart van de hele Randstad, met knooppunten.",
      en: "Tear-proof and water-resistant cycling map of the entire Randstad, with junction numbers.",
    },
    inclEuros: 9.99,
    vatRate: 9,
    attrs: {},
    weightGrams: 120,
  },
  {
    key: "boek-bikepacking",
    category: "boeken-kaarten",
    brand: "Veluwe Uitgevers",
    name: { nl: "Bikepacking in de Lage Landen", en: "Bikepacking in the Low Countries" },
    intro: {
      nl: "Tien meerdaagse offroad-routes door Nederland en Vlaanderen, met pakgids en kampeerplekken.",
      en: "Ten multi-day off-road routes through the Netherlands and Flanders, with packing guide and campsites.",
    },
    inclEuros: 29.99,
    vatRate: 9,
    attrs: {},
    specsExtra: [
      { label: { nl: "Pagina's", en: "Pages" }, value: { nl: "256", en: "256" } },
      { label: { nl: "Taal", en: "Language" }, value: { nl: "Nederlands / Engels", en: "Dutch / English" } },
    ],
    tags: ["nieuw"],
    weightGrams: 520,
  },
];

// Review author pool (fictional Dutch names) and phrase pools per sentiment.
export const reviewAuthors = [
  "Sanne de Vries", "Daan Bakker", "Lotte Jansen", "Bram Visser", "Femke van Dijk",
  "Jesse Smit", "Anouk Meijer", "Ruben de Boer", "Eva Mulder", "Thijs Bos",
  "Nina Vos", "Lars Peters", "Maud Hendriks", "Sven Dekker", "Iris van Leeuwen",
  "Timo Brouwer", "Roos Kuipers", "Niels van der Berg", "Julia Willems", "Koen Schouten",
];

export const reviewTemplates: Record<number, { title: LocalizedText; body: LocalizedText }[]> = {
  5: [
    {
      title: { nl: "Precies wat ik zocht", en: "Exactly what I was looking for" },
      body: {
        nl: "Snel geleverd en degelijk afgewerkt. Ik gebruik hem nu elke dag en heb nergens spijt van.",
        en: "Fast delivery and solid build quality. I use it every day now and have zero regrets.",
      },
    },
    {
      title: { nl: "Topkwaliteit", en: "Top quality" },
      body: {
        nl: "Je merkt meteen dat dit goed doordacht is. Vondel Cycles heeft er weer een fan bij.",
        en: "You can tell right away this is well thought out. Vondel Cycles has another fan.",
      },
    },
    {
      title: { nl: "Aanrader!", en: "Highly recommended!" },
      body: {
        nl: "Na drie maanden intensief gebruik nog steeds als nieuw. Dikke aanrader.",
        en: "Still as good as new after three months of heavy use. Highly recommended.",
      },
    },
  ],
  4: [
    {
      title: { nl: "Goede koop", en: "Good buy" },
      body: {
        nl: "Prima prijs-kwaliteit. Eén sterretje eraf omdat de montagehandleiding wat summier was.",
        en: "Great value for money. One star off because the assembly instructions were a bit thin.",
      },
    },
    {
      title: { nl: "Doet wat het moet doen", en: "Does what it should" },
      body: {
        nl: "Geen verrassingen, gewoon degelijk. Levering duurde een dagje langer dan beloofd.",
        en: "No surprises, just solid. Delivery took a day longer than promised.",
      },
    },
  ],
  3: [
    {
      title: { nl: "Prima, maar niet bijzonder", en: "Fine, but not special" },
      body: {
        nl: "Werkt naar behoren, maar voor deze prijs had ik net iets meer afwerking verwacht.",
        en: "Works as intended, but at this price I expected slightly better finishing.",
      },
    },
  ],
  2: [
    {
      title: { nl: "Valt tegen", en: "Disappointing" },
      body: {
        nl: "Na twee weken al een onderdeel moeten bijstellen. De klantenservice hielp wel goed.",
        en: "Had to readjust a part after just two weeks. Customer service was helpful though.",
      },
    },
  ],
};
