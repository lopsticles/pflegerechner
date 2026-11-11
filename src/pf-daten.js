// Rechengrößen Pflegerechner. Jede Zahl mit Fundstelle; Stand siehe PF_DATEN.stand.
// Leistungsbeträge: BMG "Leistungsansprüche der Versicherten im Jahr 2026" (Stand 04.11.2025)
// Heimkosten:       vdek-Pressemitteilung 14.07.2026, Stichtag 01.07.2026
(function (g) {
'use strict';
const PF_DATEN = {
  stand: '2026-11-05',
  rechtsstand: 'SGB XI und SGB XII in der Fassung für 2026; Heimkosten vdek, Stichtag 01.07.2026',

  // Index 0..4 = Pflegegrad 1..5, Euro je Monat
  leistung: {
    pflegegeld:   [0, 347, 599, 800, 990],          // § 37 SGB XI
    sachleistung: [0, 796, 1497, 1859, 2299],       // § 36 SGB XI
    tagespflege:  [0, 721, 1357, 1685, 2085],       // § 41 SGB XI
    stationaer:   [131, 805, 1319, 1855, 2096],     // § 43 SGB XI (PG 1: Zuschuss)
    rvBeitrag:    [0, 198.62, 316.32, 514.94, 735.63], // § 44 SGB XI, höchstens
    entlastung: 131,             // § 45b SGB XI, alle Pflegegrade
    jahresbetragVerhKzp: 3539,   // § 42a SGB XI, gemeinsamer Jahresbetrag PG 2–5
    hilfsmittel: 42,             // § 40 Abs. 2 SGB XI
    wohnumfeld: 4180,            // § 40 Abs. 4 SGB XI, je Maßnahme
    wohngruppe: 224,             // § 45f SGB XI (früher § 38a, weggefallen)
    dipa: 70,                    // § 40a/40b SGB XI (40 + 30)
  },
  // § 43c SGB XI: Anteil des pflegebedingten Eigenanteils, den die Kasse zusätzlich trägt
  zuschlag: [0.15, 0.30, 0.50, 0.75],

  // vdek, 01.07.2026: EEE ohne Zuschuss, Unterkunft+Verpflegung, Investitionskosten (€/Monat)
  laender: [
    ['BW', 'Baden-Württemberg',      2401, 1153, 463],
    ['BY', 'Bayern',                 2185,  979, 434],
    ['BE', 'Berlin',                 2410,  870, 469],
    ['BB', 'Brandenburg',            2172,  972, 332],
    ['HB', 'Bremen',                 2296, 1179, 630],
    ['HH', 'Hamburg',                2159, 1074, 572],
    ['HE', 'Hessen',                 2233, 1005, 528],
    ['MV', 'Mecklenburg-Vorpommern', 2070,  901, 371],
    ['NI', 'Niedersachsen',          1862,  857, 568],
    ['NW', 'Nordrhein-Westfalen',    1983, 1331, 654],
    ['RP', 'Rheinland-Pfalz',        1766, 1280, 508],
    ['SL', 'Saarland',               2176, 1271, 574],
    ['SN', 'Sachsen',                2136,  881, 455],
    ['ST', 'Sachsen-Anhalt',         1993,  852, 345],
    ['SH', 'Schleswig-Holstein',     1782, 1060, 573],
    ['TH', 'Thüringen',              2045,  971, 454],
  ],
  bund: ['DE', 'Bundesdurchschnitt', 2088, 1068, 521],
  // Kontrollwerte vdek (Summe 1. Jahr) für den Test
  vdekSumme1: {DE: 3364, BW: 3657, BY: 3270, BE: 3388, BB: 3150, HB: 3761, HH: 3481, HE: 3431, MV: 3032, NI: 3008,
    NW: 3671, RP: 3289, SL: 3695, SN: 3152, ST: 2891, SH: 3148, TH: 3163},

  // Richtwerte: Monatsrechnung eines ambulanten Pflegedienstes je Pflegegrad 1–5 (Gesamtkosten vor Kassenleistung).
  // Keine amtliche Statistik. Quelle: pflegeversicherung-tarif.de, "Durchschnittliche Pflegekosten bei ambulanter
  // Pflege 2025", dort "Quelle: VDEK Report + Statistisches Bundesamt". Abgerufen 2026-11-05.
  ambulant: {
    stand: '2025',
    DE: [516, 1397, 2422, 3841, 4279],
    BW: [630, 1774, 2831, 4246, 4618], BY: [452, 1588, 2554, 3775, 4248], BE: [503, 1623, 2673, 4368, 4693],
    BB: [478, 1376, 2187, 3652, 4017], HB: [537, 1508, 2333, 3750, 4295], HH: [577, 1787, 2877, 4190, 4608],
    HE: [671, 1619, 2555, 3836, 4485], MV: [520, 1071, 2125, 3504, 4118], NI: [508, 1431, 2594, 4236, 4564],
    NW: [493, 1391, 2521, 4117, 4436], RP: [459, 1371, 2491, 4240, 4664], SL: [442, 1332, 2871, 4296, 4715],
    SN: [524, 1028, 1757, 2975, 3498], ST: [530, 1120, 2007, 3186, 3573], SH: [447, 1341, 2544, 3945, 4377],
    TH: [490, 987, 1835, 3141, 3555],
  },
  // Geförderte Pflegezusatzversicherung (§§ 126–128 SGB XI, "Pflege-Bahr")
  pflegeBahr: {zulage: 5, mindestbeitrag: 10},

  // Beiträge 2026 (§ 55 SGB XI)
  beitrag: {
    satz: 0.036,                 // allgemeiner Beitragssatz
    kinderlos: 0.006,            // Zuschlag Kinderlose ab 23
    abschlagJeKind: 0.0025,      // ab dem 2. bis 5. Kind unter 25
    bbgMonat: 5812.50,           // Beitragsbemessungsgrenze 2026
    sachsenAN: 0.023,            // Sachsen: Beschäftigte 2,3 %, Arbeitgeber 1,3 %
  },

  // Sozialhilfe / Elternunterhalt
  sozial: {
    schonvermoegen: 10000,       // § 90 Abs. 2 Nr. 9 SGB XII i. V. m. DVO, je Person
    elternunterhaltGrenze: 100000, // § 94 Abs. 1a SGB XII, Jahresbruttoeinkommen je Kind
    regelsatz1: 563,             // Regelbedarfsstufe 1 2026 (unverändert gegenüber 2025)
    barbetragQuote: 0.27,        // § 27b Abs. 3 SGB XII
    schenkungJahre: 10,          // § 528, § 529 BGB
  },

  // Beihilfe-Bemessungssätze Bund (§ 46 BBhV); Länder weichen teils ab
  beihilfe: {aktiv: 0.5, aktiv2Kinder: 0.7, pension: 0.7},
  // § 39 Abs. 2 BBhV (Bund): Heimkosten über der Pauschale sind auf Antrag zu 100 % (§ 47 Abs. 7) beihilfefähig,
  // soweit von den Einnahmen sonst weniger bliebe als: 8 % A 13/8 je Person mit Pflegeanspruch, 30 % A 13/8 für
  // Ehepartner ohne Pflegeanspruch, 3 % des Grundgehalts der letzten Besoldungsgruppe.
  // A 13 Stufe 8 Bund ab 01.05.2026: 8.167,33 € (BMI-Rundschreiben 03.09.2025, vorläufige Tabelle)
  bundHeim: {a13s8: 8167.33, jePflegeperson: 0.08, partnerOhnePflege: 0.30, eigenesGrundgehalt: 0.03},

  // Geplante Reform (nicht beschlossen): Pflegeneuordnungsgesetz, BT-Drs. 21/8869, 1. Lesung 05.11.2026
  reform: {
    status: 'Gesetzentwurf, 1. Lesung im Bundestag am 05.11.2026 – noch nicht beschlossen',
    punkte: [
      'Zuschlag für Kinderlose soll ab 2027 von 0,6 auf 0,9 Prozent steigen.',
      'Beitragsbemessungsgrenze der Pflegeversicherung soll um 300 € im Monat steigen.',
      'Entlastungsbetrag von 131 € in Pflegegrad 1 soll entfallen; ab Pflegegrad 2 kommt ein Sozialraumbudget.',
      'Für mitversicherte Ehepartner soll ab 2028 ein Beitragszuschlag von 0,52 Prozent gelten.',
      'Die für 2028 geplante Erhöhung der Leistungen entfällt; ab 2029 sollen die Beträge jährlich mit der Inflation steigen.',
    ],
  },

  quellen: [
    ['Leistungsbeträge 2026', 'BMG, Leistungsansprüche der Versicherten im Jahr 2026 im Kurzüberblick (Stand 04.11.2025)',
      'https://www.bundesgesundheitsministerium.de/fileadmin/Dateien/3_Downloads/P/Pflegeversicherung_Leistungsbeitraege/Uebersicht_Leistungsbetraege_2026.pdf'],
    ['Vollstationäre Pflege, Zuschläge', 'BMG, Vollstationäre Pflege im Heim (Stand 15.09.2026); § 43, § 43c SGB XI',
      'https://www.bundesgesundheitsministerium.de/themen/pflege/online-ratgeber-pflege/leistungen-der-pflegeversicherung/vollstationaere-pflege-im-heim'],
    ['Heimkosten je Bundesland', 'vdek, Pressemitteilung vom 14.07.2026, Stichtag 01.07.2026',
      'https://www.vdek.com/presse/pressemitteilungen/2026/stationaere-pflege-eigenanteile-juli-2026.html'],
    ['Beiträge', '§ 55 SGB XI; Beitragsbemessungsgrenze 2026 lt. BMG',
      'https://www.bundesgesundheitsministerium.de/service/begriffe-von-a-z/b/beitragsbemessungsgrenze'],
    ['Schonvermögen, Elternunterhalt, Barbetrag', '§ 90, § 94 Abs. 1a, § 27b SGB XII',
      'https://www.gesetze-im-internet.de/sgb_12/'],
    ['Rückforderung von Schenkungen', '§ 528, § 529 BGB', 'https://www.gesetze-im-internet.de/bgb/__528.html'],
    ['Beihilfe Bund', '§ 46 BBhV (Bemessungssätze), § 37–39 BBhV (Pflege)', 'https://www.gesetze-im-internet.de/bbhv/'],
    ['Beihilfe Bund im Heim', '§ 39 Abs. 2 und § 47 Abs. 7 BBhV (100 % über dem Mindestverbleib)', 'https://www.gesetze-im-internet.de/bbhv/__39.html'],
    ['Haus und Darlehen, Erbenhaftung', '§ 90 Abs. 2 Nr. 8, § 91, § 102 SGB XII', 'https://www.gesetze-im-internet.de/sgb_12/__90.html'],
    ['Kosten Pflegedienst (Richtwert)', 'pflegeversicherung-tarif.de, Durchschnittliche Pflegekosten bei ambulanter Pflege 2025 (nach vdek-Report und Statistischem Bundesamt) – keine amtliche Statistik',
      'https://www.pflegeversicherung-tarif.de/durchschnittliche-pflegekosten/ambulanter-pflegedienst'],
    ['Pflege-Bahr', '§§ 126–128 SGB XI', 'https://www.gesetze-im-internet.de/sgb_11/__127.html'],
    ['Pflegereform (Entwurf)', 'Bundestag, Pflegeneuordnungsgesetz, 1. Lesung 05.11.2026',
      'https://www.bundestag.de/dokumente/textarchiv/2026/kw45-de-pflegeneuordnungsgesetz-1225076'],
  ],
};
g.PF_DATEN = PF_DATEN;
if (typeof module !== 'undefined') module.exports = PF_DATEN;
})(typeof window !== 'undefined' ? window : globalThis);
