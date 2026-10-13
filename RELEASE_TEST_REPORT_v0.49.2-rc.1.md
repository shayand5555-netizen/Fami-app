# Fami – großer Release-Test 0.49.2-rc.1

**Testdatum:** 13. Oktober 2026  
**Getestete Live-App:** `https://shayand5555-netizen.github.io/Fami-app/`  
**Ergebnis:** **40 von 40 automatisierten Prüfungen bestanden**; zusätzlich 6 statische Prüfgruppen ohne Befund.

## Testaufbau

- Frisches, vom Familienkonto getrenntes Browserprofil
- iPhone-Simulation mit 320, 390 und 430 Pixel Breite
- Live-Dateien der veröffentlichten App, nicht nur lokale Dateien
- Simulierter voller Gerätespeicher und vollständig deaktiviertes Netzwerk
- Temporäre Testdaten wurden am Ende des Laufs wieder entfernt

## Bestandene Prüfungen

| Bereich | Prüfungen | Ergebnis |
|---|---:|---|
| Start, Version und Laufzeit | 4 | bestanden |
| iPhone-Layout | 4 | bestanden, keine horizontale Überbreite |
| Kalender und Termine | 8 | bestanden |
| Aufgaben | 1 | bestanden |
| Papierkorb | 2 | bestanden |
| Einladung und Versionshistorie | 2 | bestanden |
| Wochenessensplan und Einkauf | 2 | bestanden |
| Rezepte, Bilder und Videos | 4 | bestanden |
| Speicher- und Cloud-Warteschlange | 2 | bestanden |
| Live-Auslieferung der App-Dateien | 8 | bestanden, jeweils HTTP 200 |
| Offline-Funktion | 2 | bestanden |
| Unbehandelte Browserfehler | 1 | bestanden, 0 Fehler |

## Besonders geprüfte Abläufe

- Termin anlegen, lokal sichern und Formular schließen
- Mehrere zuständige Personen speichern
- Mehrtägige Termine in einer Wiederholungsserie beibehalten
- 105 eindeutige wöchentliche Wiederholungen erzeugen
- Aufgabe anlegen
- Eintrag in den Papierkorb verschieben und mit neuer ID wiederherstellen
- Versionshistorie über die Versionsnummer öffnen
- Familienassistent über „Einladen“ öffnen
- Alle 25 aha-Abholtermine, Bioabfall und orange Markierung prüfen
- Aha-Termine trotz Personenfilter sichtbar halten
- Monats- und Wochenansicht prüfen
- Gleiche Zutaten zu einer Menge zusammenfassen: `2 Stk + 3 Stk = 5 Stück`
- Einkaufskategorie automatisch setzen
- Speichern bei simuliert vollem iPhone-Speicher
- Defekte Cloud-Warteschlange darf lokales Speichern nicht blockieren
- 1.673 Videorezepte laden
- 1.673 von 1.673 Videorezepten mit Zutaten/Zubereitung prüfen
- 1.673 von 1.673 Videorezepten mit gültigem Link prüfen
- 48 sichtbare Rezeptbilder über Ansichtswechsel stabil halten
- Service Worker und Startseite vollständig offline laden

## Statische Zusatzprüfung

- Keine doppelten HTML-IDs
- Keine fehlenden Dateien im Service-Worker-Cache
- Manifest ist gültig und als eigenständige App konfiguriert
- Keine versehentlich eingecheckten API-Schlüssel oder privaten Schlüssel gefunden
- Keine Whitespace- oder Patchfehler
- Versions- und Cache-Verweise kontrolliert

## Gefundene und behobene Auffälligkeit

Der Rezeptvideokatalog wurde noch mit der älteren Cache-Kennung `0.49.0` geladen. Das konnte dazu führen, dass ein iPhone kurzzeitig einen älteren Stand der Videorezepte anzeigt. Die Kennung wurde auf `0.49.2` aktualisiert.

## Bewusste Grenze des automatischen Tests

Der Test verwendet absichtlich kein echtes Familienkonto, damit keine privaten Termine verändert werden. Die tatsächliche Ende-zu-Ende-Übertragung zwischen zwei angemeldeten Geräten und die Zustellung einer Push-Mitteilung müssen deshalb weiterhin einmal mit Shayan und Selina auf zwei echten Geräten bestätigt werden. Alle dafür notwendigen lokalen Speicher-, Cloud-Warteschlangen- und Bedienwege wurden automatisiert geprüft.

## Wiederholen

Der Test kann jederzeit mit folgendem Skript wiederholt werden:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\release-qa.ps1
```
