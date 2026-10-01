# Fami

Fami ist ein installierbarer Familienplaner mit Kalender, Aufgaben, Dateien, Einkaufsliste, Rezepten und familiengerechten Aktivitätsideen.

## Aktueller Stand

Version: **0.20.0-beta.1**

Diese Online-Beta ist für Bedienungs- und Mehrgeräte-Tests vorgesehen. Ohne Cloud-Einrichtung bleiben Daten lokal gespeichert. Nach Verbindung mit Supabase werden Familiendaten live synchronisiert und Anhänge geschützt in der Cloud gespeichert.

## Funktionen

- Monatskalender mit Personenfiltern
- Feiertage und Schulferien nach Bundesland
- Bearbeitbare Aufgaben und Termine
- Lokale Foto- und Dateianhänge
- Gemeinsame Einkaufsliste auf einem Gerät
- Rezeptideen mit direkter Zutatenübernahme
- Je 100 beliebte, ausführliche Rezeptkarten von Schmale Schulter und Yummy Gastronomy mit Mahlzeit-, Küchen- und Beliebtheitsfiltern
- Getrennte Buttons für Originalvideo und schriftliches Leserezept
- Einheitliche, filterbare Rezeptkarten mit Nährwerten und direkter Übernahme in die Einkaufsliste
- Kochanleitungen an Rezeptkarten und in jedem Videotreffer
- Eigene Rezepte per Foto oder Link lokal speichern
- Gemeinsamer Aufgabenbereich
- Familienaktivitäten im Kalenderbereich
- Lokale Sicherung und Wiederherstellung
- Installierbare Progressive Web App
- Optionaler Online-Modus mit E-Mail-Anmeldung und Familien-Einladungscode
- Live-Synchronisierung zwischen mehreren Geräten
- Geschützte Cloud-Dateien mit Familienzugriff
- Familienname, Profile, Namen und Altersangaben bearbeiten
- Täglich aktualisierte regionale Familienveranstaltungen aus Hannover.de
- Offizielle Kategorien für Kinder, Feste, kostenlose Angebote und Märkte

## Online-Modus aktivieren

1. Ein kostenloses Supabase-Projekt erstellen.
2. `supabase-schema.sql` vollständig im Supabase SQL Editor ausführen.
3. In Supabase unter Authentication → URL Configuration die GitHub-Pages-Adresse als Site URL und Redirect URL eintragen.
4. In Fami auf den Speicherstatus tippen und Projekt-URL sowie Publishable Key eintragen.
5. Per E-Mail anmelden und eine Familie erstellen oder mit Einladungscode beitreten.

Niemals einen `service_role`- oder Secret-Key in die App eintragen. Fami benötigt ausschließlich den öffentlichen Publishable Key.

## Rezeptquellen

Die Startrezepte sind kompakte, eigenständig dargestellte Zusammenfassungen auf Basis öffentlich zugänglicher Videos von [Schmale Schulter](https://www.youtube.com/@schmaleschulter). Die App verlinkt jeweils auf das Originalvideo.

## Datenquellen

Regionale Ferien und Feiertage werden über die [OpenHolidays API](https://www.openholidaysapi.org/) geladen.

## Vor dem produktiven Einsatz

Für echte Familienkonten sind noch ein Backend, Anmeldung, Geräte-Synchronisation, Cloud-Dateispeicher, Push-Benachrichtigungen sowie ein Datenschutz- und Berechtigungskonzept erforderlich.
