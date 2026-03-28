/**
 * @typedef {Object} DemoSearchResult
 * @property {string} ecli
 * @property {string} title
 * @property {string} court
 * @property {string} decision_date
 * @property {string} content
 * @property {number} score
 */

/**
 * @typedef {Object} DemoAnswer
 * @property {string} query
 * @property {string} text
 * @property {DemoSearchResult[]} sources
 */

/**
 * @typedef {Object} DemoEcliDetail
 * @property {string} ecli
 * @property {string} title
 * @property {string} court
 * @property {string} decision_date
 * @property {string[]} content
 */

/**
 * @typedef {Object} DemoScenario
 * @property {string} contractFileName
 * @property {string} contractTitle
 * @property {string} contractAnalysisMarkdown
 * @property {string} searchQuery
 * @property {DemoSearchResult[]} searchResults
 * @property {DemoAnswer} vraagStellen
 * @property {Record<string, DemoEcliDetail>} ecliDetails
 */

export const demoSidebarItems = {
  contract: [
    { label: "Contract reader", href: "/demo", active: true },
    { label: "Jurispudentie search", href: "/demo/jurispudentie-search" },
    { label: "Vraag stellen", href: "/demo/vraag-stellen" }
  ],
  upload: [
    { label: "Contract reader", href: "/demo" },
    { label: "Jurispudentie search", href: "/demo/jurispudentie-search" },
    { label: "Vraag stellen", href: "/demo/vraag-stellen" }
  ],
  search: [
    { label: "Contract reader", href: "/demo" },
    { label: "Jurispudentie search", href: "/demo/jurispudentie-search", active: true },
    { label: "Vraag stellen", href: "/demo/vraag-stellen" }
  ],
  vraag: [
    { label: "Contract reader", href: "/demo" },
    { label: "Jurispudentie search", href: "/demo/jurispudentie-search" },
    { label: "Vraag stellen", href: "/demo/vraag-stellen", active: true }
  ],
  detail: [
    { label: "Contract reader", href: "/demo" },
    { label: "Jurispudentie search", href: "/demo/jurispudentie-search" },
    { label: "Vraag stellen", href: "/demo/vraag-stellen" }
  ]
};

const contractAnalysisMarkdown = `# Analyse (demo)

## A. Documentprofiel
- **Type:** Huurcontract woonruimte (model ROZ 2017.21). **Zekerheid:** hoog.
- **Partijen:** Verhuurder (BV) en twee natuurlijke personen als huurders.
- **Datum / looptijd:** Ingang 1 september 2024; minimumduur 24 maanden.
- **Rechtsgebied:** huurrecht woonruimte.

## B. Samenvatting
- Huurprijs € 1.150 per maand met voorschotten voor nuts en servicekosten.
- Jaarlijkse indexatie per 1 juli volgens wettelijke regeling.
- Waarborgsom € 2.300 voor sleuteloverdracht.
- Boetebepalingen voor te late betaling en contractschending.
- Bijlagen genoemd, maar in dit dossier niet volledig aanwezig.

## C. Kernrisico's
- **Duurclausule:** minimumduur beperkt opzegflexibiliteit.
- **Servicekosten:** onderbouwing en afrekening onvoldoende uitgewerkt.
- **Boetebeding:** risico op disproportionaliteit bij toepassing.
- **Informatiegebrek:** status zelfstandig/onzelfstandig onduidelijk.

## D. Vragen voor behandelaar
1. Is het gehuurde juridisch zelfstandig of onzelfstandig?
2. Is de duurclausule in deze context redelijk en afdwingbaar?
3. Zijn boeteclausules voldoende gematigd geformuleerd?
4. Zijn alle verplichte bijlagen en specificaties verstrekt?
`;

const searchResults = [
  {
    ecli: "ECLI:NL:PHR:2023:779",
    detail_url:
      "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:PHR:2023:779&showbutton=true&keyword=Ontslag%2Bop%2Bstaande%2Bvoet%253a%2Beisen%2Baan%2Bdringende%2Breden%2Ben%2Bbewijs&idx=1",
    title: "Conclusie PHR - dringende reden en bewijs bij ontslag op staande voet",
    court: "Parket bij de Hoge Raad",
    decision_date: "2023-01-01",
    content:
      "De conclusie behandelt welke feiten en bewijsstukken nodig zijn om een dringende reden juridisch houdbaar te onderbouwen.",
    score: 0.932
  },
  {
    ecli: "ECLI:NL:GHSHE:2013:BZ8607",
    detail_url:
      "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:GHSHE:2013:BZ8607&showbutton=true&keyword=Ontslag%2Bop%2Bstaande%2Bvoet%253a%2Beisen%2Baan%2Bdringende%2Breden%2Ben%2Bbewijs&idx=2",
    title: "Gerechtshof 's-Hertogenbosch - toetsing dringende reden",
    court: "Gerechtshof 's-Hertogenbosch",
    decision_date: "2013-01-01",
    content:
      "Het hof benadrukt dat de beoordeling sterk afhangt van concrete feiten, onderbouwing en de context van het dienstverband.",
    score: 0.914
  },
  {
    ecli: "ECLI:NL:RBROT:2023:11286",
    detail_url:
      "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:RBROT:2023:11286&showbutton=true&keyword=Ontslag%2Bop%2Bstaande%2Bvoet%253a%2Beisen%2Baan%2Bdringende%2Breden%2Ben%2Bbewijs&idx=4",
    title: "Rechtbank Rotterdam - onderbouwing en bewijspositie werkgever",
    court: "Rechtbank Rotterdam",
    decision_date: "2023-01-01",
    content:
      "De rechtbank bespreekt welke dossiervorming en feitelijke onderbouwing nodig zijn bij een beroep op ontslag op staande voet.",
    score: 0.901
  },
  {
    ecli: "ECLI:NL:RBZWB:2026:1393",
    detail_url:
      "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:RBZWB:2026:1393&showbutton=true&keyword=Ontslag%2Bop%2Bstaande%2Bvoet%253a%2Beisen%2Baan%2Bdringende%2Breden%2Ben%2Bbewijs&idx=2",
    title: "Rechtbank Zeeland-West-Brabant - beoordeling ontslag op staande voet",
    court: "Rechtbank Zeeland-West-Brabant",
    decision_date: "2026-01-01",
    content:
      "In deze uitspraak staat de combinatie van dringende reden, proportionaliteit en bewijswaardering centraal.",
    score: 0.887
  },
  {
    ecli: "ECLI:NL:RBZWB:2026:1207",
    detail_url:
      "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:RBZWB:2026:1207&showbutton=true&keyword=Ontslag%2Bop%2Bstaande%2Bvoet%253a%2Beisen%2Baan%2Bdringende%2Breden%2Ben%2Bbewijs&idx=3",
    title: "Rechtbank Zeeland-West-Brabant - motivering en bewijslast",
    court: "Rechtbank Zeeland-West-Brabant",
    decision_date: "2026-01-01",
    content:
      "De uitspraak geeft handvatten voor motivering, feitenvaststelling en de bewijslast bij ontslag op staande voet.",
    score: 0.861
  }
];

const vraagSources = searchResults.slice(0, 4);

const vraagAnswerText = `Op basis van de geselecteerde jurisprudentie lijkt een ontslag op staande voet alleen houdbaar als (1) de dringende reden concreet en bewijsbaar is, (2) de werkgever onverwijld heeft gehandeld en (3) proportionaliteit in de specifieke context is gewaarborgd. In deze demo-bronnen benadrukken ECLI:NL:PHR:2023:779 en ECLI:NL:GHSHE:2013:BZ8607 dat feitelijke onderbouwing en consistente dossiervorming doorslaggevend zijn. Conclusie: zonder sterke dossieropbouw en duidelijke motivering is het procesrisico aanzienlijk.`;

const ecliDetails = searchResults.reduce((acc, result) => {
  acc[result.ecli] = {
    ecli: result.ecli,
    title: result.title,
    court: result.court,
    decision_date: result.decision_date,
    content: [
      `${result.title} (${result.ecli}) betreft in deze demo een samengevatte weergave van de relevante overwegingen.`,
      result.content,
      "Belangrijk voor de beoordeling is de combinatie van feitenvaststelling, belangenafweging en toetsing aan proportionaliteit.",
      "Deze tekst is fictief en bedoeld om de werking van de demo-omgeving te tonen."
    ]
  };
  return acc;
}, {});

/** @type {DemoScenario} */
export const demoScenario = {
  contractFileName: "HUURCONTRACT_WOONRUIMTE_demo.pdf",
  contractTitle: "Huurcontract woonruimte",
  contractAnalysisMarkdown,
  searchQuery: "Ontslag op staande voet: eisen aan dringende reden en bewijs",
  searchResults,
  vraagStellen: {
    query: "Wanneer is ontslag op staande voet juridisch houdbaar?",
    text: vraagAnswerText,
    sources: vraagSources
  },
  ecliDetails
};
