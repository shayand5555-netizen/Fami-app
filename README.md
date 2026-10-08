# Fami

Fami ist ein installierbarer Familienplaner mit Kalender, Aufgaben, Dateien, Einkaufsliste, Rezepten und familiengerechten Aktivitätsideen.

## Aktueller Stand

Version: **0.31.6-beta.1**

Die einmalige Server-Einrichtung für die reine KI-Fotoanalyse steht in [AI_RECIPE_SETUP.md](AI_RECIPE_SETUP.md). Eine lokale OCR-Texterkennung wird nicht verwendet.

Diese Online-Beta ist für Bedienungs- und Mehrgeräte-Tests vorgesehen. Ohne Cloud-Einrichtung bleiben Daten lokal gespeichert. Nach Verbindung mit Supabase werden Familiendaten live synchronisiert und Anhänge geschützt in der Cloud gespeichert.

## Funktionen

- Monatskalender mit Personenfiltern
- Feiertage und Schulferien nach Bundesland
- Bearbeitbare Aufgaben und Termine
- Lokale Foto- und Dateianhänge
- Gemeinsame Einkaufsliste auf einem Gerät
- Gemeinsamer Wochenessensplan mit Rezeptbildern, Verschieben und Löschen direkt auf der Startseite
- Konfigurierbarer Putzplan mit sinnvollen Intervallen und fair rotierenden Aufgaben
- Rezeptideen mit direkter Zutatenübernahme
- Je 100 beliebte, ausführliche Rezeptkarten von Schmale Schulter und Yummy Gastronomy mit Mahlzeit-, Küchen- und Beliebtheitsfiltern
- Getrennte Buttons für Originalvideo und schriftliches Leserezept
- Einheitliche, filterbare Rezeptkarten mit Nährwerten und direkter Übernahme in die Einkaufsliste
- 100 zusätzliche Familiengerichte mit jeweils eigenem, passend generiertem Rezeptbild, Zutaten, Nährwertschätzung und eigener Kochanleitung ohne YouTube
- Kochanleitungen an Rezeptkarten und in jedem Videotreffer
- Eigene Rezepte per Foto oder Link lokal speichern
- Gemeinsamer Aufgabenbereich
- Familienaktivitäten im Kalenderbereich
- Automatisch geladene Hannover-Termine mit hervorgehobenen Stadtteil-, Tiergarten-, Kürbis- und Familienfesten
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
4. Unter Authentication → Email Templates → Magic Link die Variable `{{ .ConfirmationURL }}` durch einen Hinweis mit `{{ .Token }}` ersetzen. Nur dann enthält die E-Mail den Anmeldecode statt eines Browserlinks.
5. In Fami auf den Speicherstatus tippen, E-Mail-Adresse eingeben und den zugesandten Code direkt in Fami bestätigen. Projekt-URL und öffentlicher Publishable Key sind bereits eingebaut.
6. Eine Familie erstellen oder mit Einladungscode beitreten.

Niemals einen `service_role`- oder Secret-Key in die App eintragen. Fami benötigt ausschließlich den öffentlichen Publishable Key.

## Rezeptquellen

Die Startrezepte sind kompakte, eigenständig dargestellte Zusammenfassungen auf Basis öffentlich zugänglicher Videos von [Schmale Schulter](https://www.youtube.com/@schmaleschulter). Die App verlinkt jeweils auf das Originalvideo.

## Datenquellen

Regionale Ferien und Feiertage werden über die [OpenHolidays API](https://www.openholidaysapi.org/) geladen.

## Vor dem produktiven Einsatz

Für echte Familienkonten sind noch ein Backend, Anmeldung, Geräte-Synchronisation, Cloud-Dateispeicher, Push-Benachrichtigungen sowie ein Datenschutz- und Berechtigungskonzept erforderlich.
