# Pflegerechner – Rechenkern

Leistungen der Pflegeversicherung je Pflegegrad 2026, Eigenanteil im Pflegeheim für alle 16 Bundesländer, Pflegelücke zu Hause und im Heim, Beihilfe, Schonvermögen und Elternunterhalt.

👉 **Zum Rechner mit Oberfläche:** <https://pflege.lopsticles.com/>
(kostenlos, ohne Anmeldung, rechnet komplett im Browser)

Derselbe Code rechnet auch im Online-Rechner. Hier liegt er ohne Oberfläche, damit
die Rechnung nachvollzogen und geprüft werden kann.

## Grundlagen

| Thema | Grundlage |
|---|---|
| Pflegegeld, Sachleistung, Entlastungsbetrag | §§ 36, 37, 45b SGB XI |
| Vollstationäre Pflege, Leistungszuschlag nach Heimjahren | §§ 43, 43c SGB XI |
| Eigenanteile je Bundesland | vdek, Stichtag 01.07.2026 |
| Hilfe zur Pflege, Schonvermögen, Barbetrag | SGB XII §§ 27b, 90 |
| Elternunterhalt, 100.000-€-Grenze | § 94 Abs. 1a SGB XII |

## Tests

```sh
node test/kern.test.cjs   # Node.js >= 20, keine Abhängigkeiten
```

## Grenzen

Heimkosten sind Landesdurchschnitte; das einzelne Heim kann deutlich abweichen. Keine Rechtsberatung.

Fehler gefunden oder neue Rechengrößen? Gern als Issue melden.

## Weitere Rechner

Pension (NRW), Rente, Krankenversicherung im Alter, Pflege, Risiko, Bausparen und
geförderte Altersvorsorge: <https://lopsticles.com/> · alle Rechenkerne: <https://github.com/lopsticles>

## Lizenz

MIT – siehe [LICENSE](LICENSE).
