// Rechenkern Pflegerechner: reine Funktionen ohne DOM. PF.berechne(eingabe) liefert alles für die Oberfläche.
(function (g) {
'use strict';
const D = g.PF_DATEN || (typeof require !== 'undefined' ? require('./pf-daten.js') : null);
const r2 = x => Math.round(x * 100 + 1e-7) / 100; // 104,625 -> 104,63 trotz Gleitkomma

function land(code) {
  const z = code === 'DE' ? D.bund : D.laender.find(l => l[0] === code) || D.bund;
  return {code: z[0], name: z[1], eee: z[2], uv: z[3], inv: z[4]};
}

// Heimjahr 1..4 (4 = ab dem 4. Jahr). Liefert, was im Monat anfällt und wer es trägt.
function heim(code, pg, jahr) {
  const L = land(code), i = Math.min(Math.max(jahr, 1), 4) - 1;
  const zq = pg >= 2 ? D.zuschlag[i] : 0;
  const zuschlag = r2(L.eee * zq);
  const eeeNach = r2(L.eee - zuschlag);
  const leistung = D.leistung.stationaer[pg - 1];
  if (pg === 1) {
    // Pflegegrad 1: Kasse zahlt nur 131 € Zuschuss (§ 43 Abs. 3 SGB XI), kein Zuschlag (§ 43c), der EEE gilt nicht.
    // Den Pflegesatz PG 1 legt jedes Heim selbst fest – bekannt ist nur die Untergrenze aus Unterkunft,
    // Verpflegung und Investitionskosten abzüglich des Zuschusses.
    return {land: L, jahr: i + 1, zuschlagQuote: 0, mindestens: true, pflegeGesamt: null,
      kasseLeistung: leistung, kasseZuschlag: 0, kasse: leistung, eeeNach: 0, uv: L.uv, inv: L.inv,
      eigen: r2(Math.max(0, L.uv + L.inv - leistung)), gesamt: r2(L.uv + L.inv)};
  }
  return {
    land: L, jahr: i + 1, zuschlagQuote: zq,
    pflegeGesamt: leistung + L.eee,      // pflegebedingte Kosten insgesamt (Durchschnitt)
    kasseLeistung: leistung, kasseZuschlag: zuschlag, kasse: r2(leistung + zuschlag),
    eeeNach, uv: L.uv, inv: L.inv,
    eigen: r2(eeeNach + L.uv + L.inv),     // was der Bewohner selbst zahlt
    gesamt: r2(leistung + L.eee + L.uv + L.inv),
  };
}

// Häusliche Pflege. modus 'angehoerige' = nur Pflegegeld; 'dienst' = Pflegedienst mit Rechnung kosten (€/Monat)
function zuhause(pg, modus, kosten) {
  const i = pg - 1, pgeld = D.leistung.pflegegeld[i], sach = D.leistung.sachleistung[i], entl = D.leistung.entlastung;
  if (modus === 'angehoerige') {
    return {modus, kosten: 0, sachGenutzt: 0, entlastung: 0, pflegegeld: pgeld, eigen: 0, kasse: pgeld, anteilSach: 0};
  }
  const k = Math.max(0, kosten || 0);
  const sachGenutzt = Math.min(k, sach);
  const entlastung = Math.min(entl, k - sachGenutzt);
  const anteilSach = sach > 0 ? sachGenutzt / sach : 1;
  const pflegegeld = r2(pgeld * (1 - anteilSach)); // Kombinationsleistung § 38 SGB XI
  const eigen = r2(Math.max(0, k - sachGenutzt - entlastung));
  return {modus, kosten: k, sachGenutzt, entlastung, pflegegeld, eigen, kasse: r2(sachGenutzt + entlastung + pflegegeld), anteilSach};
}

// Wer trägt den Kassenanteil: Beamte bekommen Beihilfe + private Pflegepflichtversicherung (gleiche Summe)
function traeger(status, beihilfesatz) {
  if (status === 'beamt') return {beihilfe: beihilfesatz, versicherung: 1 - beihilfesatz, name: 'Private Pflegepflichtversicherung'};
  return {beihilfe: 0, versicherung: 1, name: status === 'selbst_pkv' ? 'Private Pflegepflichtversicherung' : 'Soziale Pflegeversicherung'};
}

// Monatsbeitrag zur sozialen Pflegeversicherung 2026
function beitrag(art, brutto, kinder, alter, sachsen) {
  const B = D.beitrag, basis = Math.min(Math.max(brutto, 0), B.bbgMonat);
  const kinderlos = kinder === 0 && alter >= 23 ? B.kinderlos : 0;
  const abschlag = kinder >= 2 ? Math.min(kinder - 1, 4) * B.abschlagJeKind : 0;
  const satz = B.satz + kinderlos - abschlag;
  const gesamt = r2(basis * satz);
  if (art === 'angestellt') {
    const agQuote = sachsen ? B.satz - B.sachsenAN : B.satz / 2;
    const ag = r2(basis * agQuote);
    return {basis, satz, gesamt, ag, selbst: r2(gesamt - ag), kinderlos, abschlag};
  }
  if (art === 'rente') { // Rentner tragen den Beitrag zur Pflegeversicherung voll
    return {basis, satz, gesamt, ag: 0, selbst: gesamt, kinderlos, abschlag};
  }
  return {basis, satz, gesamt, ag: 0, selbst: gesamt, kinderlos, abschlag}; // selbstständig, freiwillig gesetzlich
}

// Bundesbeamte im Heim (§ 39 Abs. 2 BBhV): Was nach dem Eigenanteil von den Einnahmen bleiben muss
function bundMindestverbleib(verheiratet, letztesGrundgehalt) {
  const B = D.bundHeim;
  return r2(B.a13s8 * B.jePflegeperson + (verheiratet ? B.a13s8 * B.partnerOhnePflege : 0) + (letztesGrundgehalt || 0) * B.eigenesGrundgehalt);
}
// Eigenanteil im Heim nach Beihilfe-Aufstockung; extra = zusätzliche Beihilfe (100 %)
function heimEigen(E, jahr) {
  const h = heim(E.land, E.pg, jahr);
  if (E.status !== 'beamt' || E.dienstherr !== 'bund' || E.pg < 2) return {h, eigen: h.eigen, extra: 0};
  const tragbar = Math.max(0, (E.einkommen || 0) - bundMindestverbleib(E.verheiratet, E.letztesGrundgehalt));
  const eigen = Math.min(h.eigen, r2(tragbar));
  return {h, eigen, extra: r2(h.eigen - eigen)};
}

function richtwertDienst(code, pg) { const t = D.ambulant[code] || D.ambulant.DE; return t[pg - 1]; }

function schongrenze(verheiratet) { return D.sozial.schonvermoegen * (verheiratet ? 2 : 1); }
function barbetrag() { return r2(D.sozial.regelsatz1 * D.sozial.barbetragQuote); }

// Elternunterhalt: Sozialamt darf Kinder nur ab 100.000 € Jahresbrutto heranziehen (§ 94 Abs. 1a SGB XII)
function elternunterhalt(brutto) {
  const grenze = D.sozial.elternunterhaltGrenze;
  if (brutto == null || isNaN(brutto)) return {pruefen: false, grenze};
  return {pruefen: brutto > grenze, grenze, abstand: grenze - brutto};
}

// Monatsverlauf über bis zu 72 Monate: Lücke, Vermögen, ab wann Hilfe zur Pflege
function verlauf(E, monate = 72) {
  const frei0 = Math.max(0, (E.vermoegen || 0) - schongrenze(E.verheiratet));
  let frei = frei0, sozialAb = null;
  const zeilen = [];
  for (let m = 1; m <= monate; m++) {
    let kosten;
    if (E.versorgung === 'heim') {
      const monatImHeim = (E.heimSeit || 0) + m;           // 1-basiert
      const jahr = Math.min(4, Math.floor((monatImHeim - 1) / 12) + 1);
      kosten = heimEigen(E, jahr).eigen;
    } else {
      kosten = zuhause(E.pg, E.versorgung, E.dienstKosten).eigen;
    }
    // Heim: Wohnen und Essen stecken im Eigenanteil, die Rente fließt hinein. Zu Hause trägt die Rente weiter
    // Miete und Alltag – die Lücke ist dort der volle Eigenanteil.
    const luecke = E.versorgung === 'heim' ? Math.max(0, kosten - (E.einkommen || 0)) : kosten;
    const ausVermoegen = Math.min(frei, luecke);
    frei = r2(frei - ausVermoegen);
    const sozial = r2(luecke - ausVermoegen);
    if (sozial > 0 && sozialAb == null) sozialAb = m;
    zeilen.push({m, kosten, luecke, ausVermoegen, sozial, frei});
  }
  return {frei0, sozialAb, zeilen};
}

function berechne(E) {
  const pg = E.pg;
  const tr = traeger(E.status, E.beihilfe);
  let monat;
  if (E.versorgung === 'heim') {
    const jahr = Math.min(4, Math.floor((E.heimSeit || 0) / 12) + 1);
    const he = heimEigen(E, jahr), h = he.h;
    monat = {gesamt: h.gesamt, kasse: h.kasse, eigen: he.eigen, eigenVorBeihilfe: h.eigen, beihilfeExtra: he.extra, heim: h,
      mindestverbleib: E.status === 'beamt' && E.dienstherr === 'bund' ? bundMindestverbleib(E.verheiratet, E.letztesGrundgehalt) : null};
  } else {
    const z = zuhause(pg, E.versorgung, E.dienstKosten);
    monat = {gesamt: z.kosten, kasse: z.kasse, eigen: z.eigen, zuhause: z};
  }
  const heimFall = E.versorgung === 'heim';
  monat.luecke = heimFall ? r2(Math.max(0, monat.eigen - (E.einkommen || 0))) : monat.eigen;
  monat.ueberschuss = heimFall ? r2(Math.max(0, (E.einkommen || 0) - monat.eigen)) : 0;
  monat.anteilEinkommen = (E.einkommen || 0) > 0 ? monat.eigen / E.einkommen : null;
  const v = verlauf(E);
  const heimJahre = [1, 2, 3, 4].map(j => heim(E.land, Math.max(pg, 2), j));
  const laender = D.laender.map(l => heim(l[0], 2, 1)).sort((a, b) => a.eigen - b.eigen);
  return {eingabe: E, monat, traeger: tr, verlauf: v, heimJahre, laender,
    schongrenze: schongrenze(E.verheiratet), barbetrag: barbetrag(), unterhalt: elternunterhalt(E.kindBrutto)};
}

const PF = {land, heim, heimEigen, richtwertDienst, bundMindestverbleib, zuhause, traeger, beitrag, schongrenze, barbetrag, elternunterhalt, verlauf, berechne, D};
g.PF = PF;
if (typeof module !== 'undefined') module.exports = PF;
})(typeof window !== 'undefined' ? window : globalThis);
