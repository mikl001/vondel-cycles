import type { AppPathname, Locale } from "@/i18n/routing";

export interface InfoSection {
  heading?: Record<Locale, string>;
  paragraphs?: Record<Locale, string>[];
  bullets?: Record<Locale, string>[];
}

export interface InfoPage {
  pathname: AppPathname;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  sections: InfoSection[];
}

export const INFO_PAGES: Record<string, InfoPage> = {
  "over-ons": {
    pathname: "/over-ons",
    title: { nl: "Over Vondel Cycles", en: "About Vondel Cycles" },
    intro: {
      nl: "Sinds 1998 bouwen en verkopen we fietsen aan de rand van het Vondelpark — begonnen als reparatiewerkplaats, uitgegroeid tot webshop.",
      en: "Since 1998 we have built and sold bikes on the edge of the Vondelpark — started as a repair workshop, grown into a webshop.",
    },
    sections: [
      {
        heading: { nl: "Ons verhaal", en: "Our story" },
        paragraphs: [
          {
            nl: "Joris van der Meer begon in 1998 met een werkbank, twee bakfietsen en een eindeloze voorraad binnenbanden. De werkplaats aan de Vondelstraat groeide uit tot een begrip in Amsterdam-Zuid: eerlijk advies, geen verkooppraatjes, en fietsen die tegen het stadsleven kunnen.",
            en: "Joris van der Meer started in 1998 with one workbench, two cargo bikes and an endless supply of inner tubes. The workshop on the Vondelstraat became a fixture of Amsterdam-Zuid: honest advice, no sales talk, and bikes that survive city life.",
          },
          {
            nl: "Vandaag verkopen we stadsfietsen, e-bikes, racefietsen en accessoires door heel Nederland — maar elke fiets wordt nog steeds in onze eigen werkplaats afgemonteerd en gecontroleerd.",
            en: "Today we sell city bikes, e-bikes, road bikes and accessories across the Netherlands — but every bike is still assembled and checked in our own workshop.",
          },
        ],
      },
      {
        heading: { nl: "Waar we voor staan", en: "What we stand for" },
        bullets: [
          { nl: "Twee jaar Vondel-garantie op elke fiets", en: "Two-year Vondel warranty on every bike" },
          { nl: "Gratis eerste servicebeurt in de werkplaats", en: "Free first service in the workshop" },
          { nl: "Eerlijke prijzen, ook voor onderdelen en reparaties", en: "Fair prices, also for parts and repairs" },
          { nl: "Binnen één werkdag antwoord op al je vragen", en: "Answers to all your questions within one working day" },
        ],
      },
      {
        paragraphs: [
          {
            nl: "Let op: Vondel Cycles is een fictieve demo-webshop voor portfolio-doeleinden. Er bestaat geen echte winkel, werkplaats of Joris.",
            en: "Please note: Vondel Cycles is a fictional demo webshop for portfolio purposes. There is no real shop, workshop or Joris.",
          },
        ],
      },
    ],
  },

  contact: {
    pathname: "/contact",
    title: { nl: "Contact", en: "Contact" },
    intro: {
      nl: "Vragen over je bestelling, een product of een reparatie? We helpen je graag.",
      en: "Questions about your order, a product or a repair? We are happy to help.",
    },
    sections: [
      {
        heading: { nl: "Klantenservice", en: "Customer service" },
        bullets: [
          { nl: "E-mail: klantenservice@vondelcycles.example (demo)", en: "Email: klantenservice@vondelcycles.example (demo)" },
          { nl: "Telefoon: 020 - 000 00 00 (ma t/m za, 9:00–18:00, demo)", en: "Phone: +31 20 000 00 00 (Mon–Sat, 9:00–18:00, demo)" },
          { nl: "Reactietijd: binnen één werkdag", en: "Response time: within one working day" },
        ],
      },
      {
        heading: { nl: "Winkel & werkplaats", en: "Shop & workshop" },
        paragraphs: [
          {
            nl: "Vondelstraat 1, 1071 AA Amsterdam (fictief adres). Ma t/m za 9:00–18:00, do koopavond tot 21:00.",
            en: "Vondelstraat 1, 1071 AA Amsterdam (fictional address). Mon–Sat 9:00–18:00, Thursday late opening until 21:00.",
          },
        ],
      },
      {
        heading: { nl: "Zakelijk (B2B)", en: "Business (B2B)" },
        paragraphs: [
          {
            nl: "Bestellen op factuur met btw-verlegging binnen de EU? Kies bij het afrekenen voor 'Zakelijk' en vul je btw-nummer in.",
            en: "Ordering on invoice with intra-EU reverse-charged VAT? Select 'Business' at checkout and enter your VAT number.",
          },
        ],
      },
      {
        paragraphs: [
          {
            nl: "Dit is een demo-webshop: berichten worden niet echt beantwoord.",
            en: "This is a demo webshop: messages are not actually answered.",
          },
        ],
      },
    ],
  },

  "verzending-en-retour": {
    pathname: "/verzending-en-retour",
    title: { nl: "Verzending & retour", en: "Shipping & returns" },
    intro: {
      nl: "Voor 22:00 besteld is morgen in huis — en je mag alles 30 dagen thuis proberen.",
      en: "Order before 22:00 for next-day delivery — and try everything at home for 30 days.",
    },
    sections: [
      {
        heading: { nl: "Bezorgopties", en: "Delivery options" },
        bullets: [
          { nl: "PostNL bezorging — € 4,95, gratis vanaf € 50", en: "PostNL delivery — € 4.95, free from € 50" },
          { nl: "PostNL-punt afhalen — € 3,95, gratis vanaf € 50", en: "PostNL pickup point — € 3.95, free from € 50" },
          { nl: "DHL avondbezorging (18:00–22:00) — € 6,95", en: "DHL evening delivery (18:00–22:00) — € 6.95" },
          { nl: "Complete fietsen worden rijklaar afgeleverd", en: "Complete bikes are delivered ready to ride" },
        ],
      },
      {
        heading: { nl: "Retourneren", en: "Returns" },
        paragraphs: [
          {
            nl: "Niet tevreden? Je hebt 30 dagen bedenktijd vanaf de bezorgdatum. Meld je retour aan via je account of de klantenservice; je ontvangt dan een retourlabel. Na ontvangst storten we het volledige aankoopbedrag binnen 14 dagen terug via de oorspronkelijke betaalmethode.",
            en: "Not happy? You have a 30-day cooling-off period from the delivery date. Register your return via your account or customer service and you will receive a return label. After we receive the item, the full purchase amount is refunded within 14 days via the original payment method.",
          },
          {
            nl: "Fietsen halen we gratis bij je op. Accessoires en onderdelen retourneer je ongebruikt en in de originele verpakking.",
            en: "Bikes are collected free of charge. Accessories and parts should be returned unused and in the original packaging.",
          },
        ],
      },
      {
        heading: { nl: "Track & trace", en: "Track & trace" },
        paragraphs: [
          {
            nl: "Zodra je bestelling onderweg is, vind je de track & trace-code in je account bij de bestelling.",
            en: "Once your order ships, you will find the track & trace code with the order in your account.",
          },
        ],
      },
      {
        paragraphs: [
          {
            nl: "Demo-webshop: er wordt niets echt verzonden of terugbetaald.",
            en: "Demo webshop: nothing is actually shipped or refunded.",
          },
        ],
      },
    ],
  },

  privacy: {
    pathname: "/privacy",
    title: { nl: "Privacyverklaring (AVG)", en: "Privacy statement (GDPR)" },
    intro: {
      nl: "We verwerken zo min mogelijk persoonsgegevens en je houdt er zelf de regie over.",
      en: "We process as little personal data as possible and you stay in control of it.",
    },
    sections: [
      {
        heading: { nl: "Welke gegevens we verwerken", en: "What data we process" },
        bullets: [
          { nl: "Bestellingen: naam, adres, e-mail — nodig voor levering en factuur", en: "Orders: name, address, email — required for delivery and invoicing" },
          { nl: "Account: profiel, adresboek, verlanglijst en bestelhistorie", en: "Account: profile, address book, wishlist and order history" },
          { nl: "Betalingen: volledig afgehandeld door de betaalprovider; wij slaan nooit kaartgegevens op", en: "Payments: handled entirely by the payment provider; we never store card details" },
          { nl: "Statistieken: alleen na jouw toestemming via de cookiebanner, anoniem (Plausible)", en: "Statistics: only with your consent via the cookie banner, anonymous (Plausible)" },
        ],
      },
      {
        heading: { nl: "Jouw rechten", en: "Your rights" },
        paragraphs: [
          {
            nl: "In je account onder 'Privacy & gegevens' download je al je gegevens als JSON (recht op inzage en overdraagbaarheid) en verwijder je je account definitief (recht op vergetelheid). Bestellingen worden daarbij geanonimiseerd: factuurgegevens vallen onder de wettelijke fiscale bewaarplicht van 7 jaar.",
            en: "In your account under 'Privacy & data' you can download all your data as JSON (right of access and portability) and permanently delete your account (right to erasure). Orders are anonymized in the process: invoice data falls under the statutory 7-year fiscal retention duty.",
          },
        ],
      },
      {
        heading: { nl: "Beveiliging", en: "Security" },
        paragraphs: [
          {
            nl: "Gegevens worden versleuteld verstuurd (TLS) en opgeslagen bij Supabase binnen de EU. Toegang is per gebruiker afgeschermd op databaseniveau (row level security).",
            en: "Data is sent encrypted (TLS) and stored with Supabase within the EU. Access is isolated per user at the database level (row level security).",
          },
        ],
      },
      {
        paragraphs: [
          {
            nl: "Demo-webshop voor portfolio-doeleinden — gebruik geen echte persoonsgegevens.",
            en: "Demo webshop for portfolio purposes — please do not use real personal data.",
          },
        ],
      },
    ],
  },

  "algemene-voorwaarden": {
    pathname: "/algemene-voorwaarden",
    title: { nl: "Algemene voorwaarden", en: "Terms & conditions" },
    intro: {
      nl: "De spelregels in gewone taal — geen kleine lettertjes.",
      en: "The rules in plain language — no fine print.",
    },
    sections: [
      {
        heading: { nl: "Bestellen en betalen", en: "Ordering and payment" },
        paragraphs: [
          {
            nl: "Alle prijzen zijn in euro's inclusief btw, tenzij anders vermeld (zakelijke weergave). Een overeenkomst komt tot stand zodra je de orderbevestiging per e-mail ontvangt. Betalen kan via iDEAL, Bancontact en creditcard; betaling wordt afgehandeld door onze betaalprovider.",
            en: "All prices are in euros including VAT unless stated otherwise (business view). A contract is concluded once you receive the order confirmation by email. Payment is possible via iDEAL, Bancontact and credit card, processed by our payment provider.",
          },
        ],
      },
      {
        heading: { nl: "Levering en eigendom", en: "Delivery and ownership" },
        paragraphs: [
          {
            nl: "Levertijden zijn indicatief. Het risico gaat over op het moment van bezorging; het eigendom na volledige betaling.",
            en: "Delivery times are indicative. Risk passes at the moment of delivery; ownership after full payment.",
          },
        ],
      },
      {
        heading: { nl: "Garantie en klachten", en: "Warranty and complaints" },
        paragraphs: [
          {
            nl: "Naast de wettelijke garantie geldt op fietsen twee jaar Vondel-garantie op frame en afmontage. Klachten melden we binnen één werkdag terug en lossen we binnen 14 dagen op. Kom je er met ons niet uit, dan kun je terecht bij het ODR-platform van de Europese Commissie.",
            en: "In addition to statutory warranty, bikes carry a two-year Vondel warranty on frame and assembly. Complaints receive a response within one working day and a resolution within 14 days. If we cannot work it out, you can turn to the European Commission's ODR platform.",
          },
        ],
      },
      {
        heading: { nl: "Herroepingsrecht", en: "Right of withdrawal" },
        paragraphs: [
          {
            nl: "Voor consumenten geldt het wettelijke herroepingsrecht van 14 dagen; wij verruimen dit vrijwillig tot 30 dagen. Zie ook Verzending & retour.",
            en: "Consumers have the statutory 14-day right of withdrawal; we voluntarily extend it to 30 days. See also Shipping & returns.",
          },
        ],
      },
      {
        paragraphs: [
          {
            nl: "Vondel Cycles is een fictieve demo-webshop; aan deze voorwaarden kunnen geen rechten worden ontleend.",
            en: "Vondel Cycles is a fictional demo webshop; no rights can be derived from these terms.",
          },
        ],
      },
    ],
  },
};
