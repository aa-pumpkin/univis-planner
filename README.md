# UnivIS Planner

Ein Stundenplaner für Informatikstudierende der CAU Kiel.

UnivIS Planner lädt öffentliche Veranstaltungsdaten aus UnivIS, ordnet Vorlesungen und Übungen ihren Modulen zu und erstellt mehrere möglichst konfliktarme Stundenpläne. Alles läuft lokal im Browser – ohne Account und ohne CAU-Zugangsdaten.

> Das Projekt ist noch in der Alpha-Phase. UnivIS-Daten sind nicht immer eindeutig, daher können Termine fehlen oder falsch zugeordnet sein. Fehler und Hinweise bitte als [GitHub Issue](https://github.com/aa-pumpkin/univis-planner/issues/new) melden.

## Funktionen

- Pflicht- und Wahlpflichtmodule für den gewählten Studienabschnitt
- Übungen, Praktika und wechselnde Wochentermine
- mehrere bewertete Stundenplanvarianten
- sichtbare Terminkonflikte
- Export als `.ics`
- automatische tägliche Aktualisierung der UnivIS-Daten
- lokale Speicherung im Browser

## Lokal starten

```bash
npm install
npm run dev
```

Tests und Produktionsbuild:

```bash
npm test
npm run build
```

Die statischen Dateien entstehen in `dist/`. Für Cloudflare Pages lautet der Build-Befehl `npm run build`, das Ausgabeverzeichnis ist `dist`.

## Daten

Die Daten stammen aus den öffentlich zugänglichen Seiten von UnivIS und der CAU-Moduldatenbank. Ein täglicher GitHub-Workflow aktualisiert den aktuellen und den kommenden Veranstaltungszeitraum. Private CAU-Daten werden nicht verwendet.

## Unterstützen

Wenn dir das Projekt Zeit spart, kannst du dem Repository einen Stern geben. Eine freiwillige Unterstützung ist über [DonationAlerts](https://www.donationalerts.com/r/pumpkin_aa) möglich.

## Lizenz

Der Programmcode steht unter der [GNU AGPL v3 oder neuer](LICENSE). Wer eine veränderte Version öffentlich oder als Webdienst bereitstellt, muss den zugehörigen Quellcode ebenfalls unter dieser Lizenz verfügbar machen.

Die importierten Veranstaltungsdaten in `public/data/` stammen aus öffentlichen CAU-Quellen. Rechte an diesen Daten, Namen und Marken werden durch die Projektlizenz nicht beansprucht.
