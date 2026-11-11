// node test/kern.test.cjs – prüft den Rechenkern gegen die Quellwerte
const assert = require('assert');
const D = require('../src/pf-daten.js');
const PF = require('../src/pf-kern.js');
let n = 0; const t = (name, f) => { f(); n++; console.log('ok', name); };

t('Heim 1. Jahr = vdek-Summe je Land (±1 € Rundung)', () => {
  for (const [code, soll] of Object.entries(D.vdekSumme1)) {
    const ist = PF.heim(code, 3, 1).eigen;
    assert(Math.abs(ist - soll) <= 1, `${code}: ${ist} statt ${soll}`);
  }
});
t('Heim Bund 2.–4. Jahr = vdek (3.051 / 2.633 / 2.111)', () => {
  [[2, 3051], [3, 2633], [4, 2111]].forEach(([j, s]) => assert(Math.abs(PF.heim('DE', 4, j).eigen - s) <= 1, j));
});
t('Eigenanteil hängt im Heim nicht vom Pflegegrad ab (2–5)', () => {
  const w = [2, 3, 4, 5].map(pg => PF.heim('NW', pg, 1).eigen); assert(w.every(x => x === w[0]));
});
t('Kombinationsleistung: halbe Sachleistung -> halbes Pflegegeld', () => {
  const z = PF.zuhause(3, 'dienst', 1497 / 2);
  assert.strictEqual(z.pflegegeld, 299.5); assert.strictEqual(z.eigen, 0);
});
t('Pflegedienst teurer als Sachleistung: Entlastungsbetrag mindert', () => {
  const z = PF.zuhause(2, 'dienst', 1000); assert.strictEqual(z.eigen, 1000 - 796 - 131); assert.strictEqual(z.pflegegeld, 0);
});
t('Beitrag Angestellte 4.000 €, 1 Kind: 72 € je Seite', () => {
  const b = PF.beitrag('angestellt', 4000, 1, 35, false); assert.strictEqual(b.gesamt, 144); assert.strictEqual(b.selbst, 72);
});
t('Beitrag kinderlos trägt Zuschlag allein, Deckel BBG', () => {
  const b = PF.beitrag('angestellt', 9000, 0, 40, false);
  assert.strictEqual(b.basis, 5812.5); assert.strictEqual(b.ag, 104.63); assert.strictEqual(b.gesamt, r(5812.5 * 0.042));
});
t('Sachsen: Arbeitgeber 1,3 %', () => { assert.strictEqual(PF.beitrag('angestellt', 4000, 1, 30, true).ag, 52); });
t('Elternunterhalt erst über 100.000 €', () => {
  assert.strictEqual(PF.elternunterhalt(100000).pruefen, false); assert.strictEqual(PF.elternunterhalt(100001).pruefen, true);
});
t('Verlauf: Vermögen über Schongrenze wird zuerst verbraucht', () => {
  const v = PF.verlauf({versorgung: 'heim', land: 'DE', pg: 3, einkommen: 1364, vermoegen: 34000, verheiratet: false}, 24);
  assert.strictEqual(v.frei0, 24000); assert.strictEqual(v.sozialAb, 13); // 12 Monate à 2.000 € Lücke
});
t('Barbetrag 27 % des Regelsatzes', () => { assert.strictEqual(PF.barbetrag(), 152.01); });
t('Bundesbeamter im Heim: Beihilfe stockt auf, Mindestverbleib bleibt', () => {
  const E = {versorgung: 'heim', land: 'NW', pg: 3, status: 'beamt', dienstherr: 'bund', einkommen: 2500, letztesGrundgehalt: 4000, verheiratet: false};
  const mv = PF.bundMindestverbleib(false, 4000); assert.strictEqual(mv, r(8167.33 * 0.08 + 120));
  const he = PF.heimEigen(E, 1); assert.strictEqual(he.eigen, r(2500 - mv)); assert.strictEqual(he.extra, r(PF.heim('NW', 3, 1).eigen - (2500 - mv)));
  assert.strictEqual(PF.verlauf(Object.assign({vermoegen: 50000}, E), 12).sozialAb, null);
});
t('Landesbeamter: keine Aufstockung im Rechner', () => {
  const he = PF.heimEigen({land: 'NW', pg: 3, status: 'beamt', dienstherr: 'land', einkommen: 2500}, 1); assert.strictEqual(he.extra, 0);
});
t('Richtwert Pflegedienst: Land und Bund, Eigenanteil PG 3 NRW', () => {
  assert.strictEqual(PF.richtwertDienst('NW', 3), 2521); assert.strictEqual(PF.richtwertDienst('DE', 5), 4279);
  assert.strictEqual(PF.zuhause(3, 'dienst', 2521).eigen, 2521 - 1497 - 131);
});
t('Zu Hause: Lücke = voller Eigenanteil, Rente wird nicht gegengerechnet', () => {
  const E = {versorgung: 'dienst', pg: 3, land: 'NW', dienstKosten: 2521, einkommen: 1600, vermoegen: 20000, verheiratet: false};
  const R = PF.berechne(E); assert.strictEqual(R.monat.luecke, 893); assert.strictEqual(R.verlauf.zeilen[0].ausVermoegen, 893);
  assert.strictEqual(R.verlauf.sozialAb, 12); // 10.000 € frei / 893 € = 11,2 Monate
});
t('Heim Pflegegrad 1: Untergrenze aus Unterkunft, Verpflegung, Investition minus 131 €', () => {
  const h = PF.heim('NW', 1, 3);
  assert.strictEqual(h.mindestens, true); assert.strictEqual(h.gesamt, 1985); assert.strictEqual(h.eigen, 1854); assert.strictEqual(h.zuschlagQuote, 0);
  const R = PF.berechne({versorgung: 'heim', land: 'NW', pg: 1, einkommen: 1600, vermoegen: 0, status: 'angestellt'});
  assert.strictEqual(R.monat.luecke, 254);
});
function r(x) { return Math.round(x * 100) / 100; }
console.log(`\n${n} Tests bestanden`);
