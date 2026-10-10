# Fami 0.45.0-rc.1 – interner Freigabetest

Datum: 10. Oktober 2026

## Ergebnis

Freigabefähig. Die neuen Abläufe wurden in einer frischen Browser-Sitzung und mit einer simulierten iPhone-Breite von 390 px geprüft.

## Geprüfte Kernfälle

- Wochengericht benötigt 1,5 kg Reis, Vorrat enthält 500 g: Einkaufsliste erhält 1 kg.
- Vollständig vorhandene Mengen werden nicht erneut eingekauft.
- Vorräte ohne verlässliche Mengenangabe werden bei numerischem Bedarf nicht vorschnell abgezogen.
- Stückmengen werden wie Gewichts- und Flüssigkeitsmengen differenziert verrechnet.
- Papierkorb zeigt Bereichsfilter und „Alles wiederherstellen“.
- Zwei Testeinträge wurden gemeinsam vollständig wiederhergestellt.
- Vor der Sammelwiederherstellung wird eine lokale Sicherheitskopie erzeugt.
- App-Version 0.45.0 RC wird angezeigt.
- Bei 390 px Breite: 390 px Inhalt, kein horizontales Überlaufen.
- JavaScript und Cloud-Skript wurden im Browser ohne Syntax- oder Startfehler geladen.

## Datenschutz und Sicherheit

- Stabilitätsfehler bleiben lokal auf dem Gerät und werden nicht automatisch übertragen.
- Private Einladungen verlangen vor dem Teilen eine Bestätigung und nennen Profil, Familiengruppe und Zugriffsumfang.
