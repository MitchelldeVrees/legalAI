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
    ecli: "ECLI:NL:HR:2019:1734",
    title: "Hoge Raad - ontslag op staande voet en proportionaliteit",
    court: "Hoge Raad",
    decision_date: "2019-11-08",
    content:
      "De Hoge Raad benadrukt dat voor ontslag op staande voet een integrale proportionaliteitstoets vereist is, inclusief eerdere waarschuwingen en context van het dienstverband.",
    score: 0.932
  },
  {
    ecli: "ECLI:NL:GHSHE:2022:1458",
    title: "Gerechtshof 's-Hertogenbosch - dringende reden onvoldoende onderbouwd",
    court: "Gerechtshof 's-Hertogenbosch",
    decision_date: "2022-05-17",
    content:
      "Het hof oordeelt dat de werkgever de dringende reden onvoldoende concreet heeft gemaakt en dat minder vergaande maatregelen eerst onderzocht hadden moeten worden.",
    score: 0.914
  },
  {
    ecli: "ECLI:NL:RBAMS:2021:5021",
    title: "Rechtbank Amsterdam - bewijswaardering bij integriteitskwestie",
    court: "Rechtbank Amsterdam",
    decision_date: "2021-09-29",
    content:
      "De rechtbank stelt dat interne onderzoeksbevindingen zonder hoor en wederhoor beperkt gewicht hebben bij beoordeling van een ontslag op staande voet.",
    score: 0.901
  },
  {
    ecli: "ECLI:NL:GHARL:2020:8119",
    title: "Gerechtshof Arnhem-Leeuwarden - waarschuwingsvereiste",
    court: "Gerechtshof Arnhem-Leeuwarden",
    decision_date: "2020-10-20",
    content:
      "Bij herhaald verwijtbaar gedrag kan ontslag op staande voet standhouden, mits de werknemer vooraf aantoonbaar is gewaarschuwd voor de gevolgen.",
    score: 0.887
  },
  {
    ecli: "ECLI:NL:RBDHA:2023:11874",
    title: "Rechtbank Den Haag - belangenafweging werknemer/werkgever",
    court: "Rechtbank Den Haag",
    decision_date: "2023-08-11",
    content:
      "In de belangenafweging wegen de gevolgen van ontslag zwaar mee, waaronder duur van het dienstverband en persoonlijke omstandigheden.",
    score: 0.873
  },
  {
    ecli: "ECLI:NL:HR:2018:2074",
    title: "Hoge Raad - onverwijldheidseis nader uitgewerkt",
    court: "Hoge Raad",
    decision_date: "2018-11-30",
    content:
      "Voor onverwijldheid geldt dat de werkgever voortvarend moet handelen na kennisneming van relevante feiten, met beperkte ruimte voor intern onderzoek.",
    score: 0.861
  }
];

const vraagSources = searchResults.slice(0, 4);

const vraagAnswerText = `Op basis van de geselecteerde jurisprudentie lijkt een ontslag op staande voet alleen houdbaar als (1) de dringende reden concreet en bewijsbaar is, (2) de werkgever onverwijld heeft gehandeld en (3) proportionaliteit in de specifieke context is gewaarborgd. In deze demo-bronnen benadrukt ECLI:NL:HR:2019:1734 dat eerdere waarschuwingen en omstandigheden van de werknemer zwaar meewegen. ECLI:NL:GHSHE:2022:1458 laat zien dat een onvoldoende feitelijke onderbouwing leidt tot vernietiging van het ontslag. Conclusie: zonder sterke dossieropbouw en duidelijke waarschuwingen is het procesrisico aanzienlijk.`;

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
