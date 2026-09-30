# Fami – Versionsverlauf

## 0.11.0-beta.1 – 30. September 2026

- Familienverwaltung mit editierbarem Familiennamen und Mitgliederprofilen ergänzt
- Namen werden beim Umbenennen in Aufgaben, Kalender und Filtern übernommen
- Aktuelles Profil pro Gerät auswählbar
- Optionale Altersangaben für passendere Familienvorschläge ergänzt
- Regionale Live-Veranstaltungssuche über Ticketmaster Discovery API eingebaut
- Live-Termine lassen sich direkt in den Familienkalender übernehmen
- Beispielaktivitäten bleiben als Rückfall bei fehlender Internet- oder API-Verbindung erhalten

## 0.10.0-beta.2 – 30. September 2026

- Erzeugung von Familien-Einladungscodes mit Supabase-Projekten korrigiert
- Kleine Reparaturabfrage `supabase-fix-001.sql` für bereits eingerichtete Projekte ergänzt

## 0.10.0-beta.1 – 30. September 2026

- Optionalen Supabase-Online-Modus ergänzt
- Passwortlose Anmeldung per E-Mail vorbereitet
- Familien erstellen und per Einladungscode beitreten
- Aufgaben, Termine, Einkaufsliste, Rezepte und Einstellungen live synchronisieren
- Anhänge zusätzlich geschützt im Familien-Cloudspeicher ablegen
- Sicheren Offline-Rückfall beibehalten
- SQL-Einrichtung mit Row-Level-Security für getrennte Familiendaten ergänzt

## 0.9.2 – 30. September 2026

- Aufgaben und Einkaufsliste in einem gemeinsamen Bereich zusammengeführt
- Direkter Wechsel zwischen Aufgaben und Einkaufsliste innerhalb der Seite ergänzt
- Eigenen Einkaufsliste-Reiter aus der Hauptnavigation entfernt

## 0.9.1 – 30. September 2026

- „Aufgaben & To-dos“ einheitlich in „Aufgaben“ umbenannt
- Einkaufsliste als direkter Reiter in der mobilen Navigation ergänzt

## 0.8.0-rc.1 – 30. September 2026

- Gemeinsame Einkaufsliste mit Mengen, Kategorien und Erledigt-Status
- Drei proteinreiche Rezeptideen mit Quellenlinks zu Schmale Schulter
- Alle Rezeptzutaten mit einem Klick zur Einkaufsliste hinzufügen
- Echte lokale Dateibibliothek für sämtliche Anhänge
- Mobile „Mehr“-Navigation für Einkaufsliste, Rezepte und Dateien
- Lokale Datensicherung und Wiederherstellung ergänzt
- Irreführenden Synchronisationsstatus durch klaren lokalen Teststatus ersetzt
- Funktionslose Notiz-Auswahl entfernt

## 0.7.1 – 30. September 2026

- Eigenen Navigationspunkt „Entdecken“ entfernt
- Aktivitätsvorschläge unterhalb der Terminliste in den Kalender integriert
- Standort, Kinderalter und Vorschläge bleiben beim Scrollen im Kalender erreichbar

## 0.7.0 – 30. September 2026

- Familienzeit und Timer vollständig entfernt
- Navigation auf die zentralen Familienfunktionen reduziert
- Dateibereich nutzt die frei gewordene Breite auf dem Dashboard

## 0.6.1 – 30. September 2026

- Monatskalender direkt nach oben verschoben
- Personen-, Feiertags- und Ferienauswahl kompakt unter dem Kalender angeordnet
- Auswahlbereich ein- und ausklappbar
- Bearbeiten-Schaltfläche in der Terminliste nach rechts verschoben
- Terminzeilen kompakter gestaltet

## 0.6.0 – 30. September 2026

- Vollständige Monatsansicht mit Wochenzahlen ergänzt
- Termine als farbige Einträge direkt im Monatsraster
- Monatsnavigation und „Heute“-Schaltfläche
- Feiertage je Bundesland ein- und ausblendbar
- Schulferien je Bundesland ein- und ausblendbar
- Auswahl aller 16 deutschen Bundesländer
- Ferien- und Feiertagsdaten werden über OpenHolidays API geladen

## 0.5.0 – 30. September 2026

- Dateien und Fotos an Aufgaben anhängen, öffnen und löschen
- Dateien und Fotos an Kalendereinträge anhängen, öffnen und löschen
- Anhänge werden lokal und offlinefähig auf dem Gerät gespeichert
- Neuer Bereich „Entdecken“ mit Familienaktivitäten
- Ort beziehungsweise Postleitzahl und Alter der Kinder speicherbar
- Vorschläge zeigen Altersgruppe, Entfernung, Termin und Kategorie
- Aktivitäten lassen sich direkt zum Familienkalender hinzufügen

## 0.4.0 – 30. September 2026

- Kalendereinträge können nachträglich bearbeitet werden
- Titel, Datum, Uhrzeit, Ort, Person und Farbe anpassbar
- Termine können gelöscht werden
- Neue Termine werden im Kalender gespeichert
- Kalender und Startseite zeigen stets denselben Datenstand

## 0.3.1 – 30. September 2026

- Cache-Problem behoben, durch das Kalender und Aufgaben noch die alte Platzhalteransicht zeigten
- JavaScript und Stylesheets erhalten eine Versionskennung und werden bei Updates zuverlässig neu geladen

## 0.3.0 – 30. September 2026

- Personenfilter für Aufgaben ergänzt
- Personenfilter für Kalendereinträge ergänzt
- Eltern können eigene Einträge und die Aufgaben oder Termine der Kinder gemeinsam anzeigen
- Getrennte Auswahl für Aufgaben und Kalender
- Auswahl wird lokal gespeichert und auf dem Startbildschirm übernommen
- Kalenderübersicht zeigt Termine samt beteiligten Familienmitgliedern
- Aktuelle Versionsnummer wird dauerhaft oben rechts angezeigt

## 0.2.0 – 30. September 2026

- Vollständige Aufgabenansicht ergänzt
- Aufgaben nachträglich bearbeiten
- Zuständigkeit, Termin und Notiz ändern
- Aufgaben erledigen, erneut öffnen und löschen
- Filter für offene, erledigte und alle Aufgaben
- Synchronisierte Darstellung auf Start- und Aufgabenseite
- Lokale Speicherung der Änderungen

## 0.1.0 – 29. September 2026

- Erste testbare Version
- Familien-Dashboard, Kalender, Aufgaben, Timer und Dateien
- PWA-Installation und Offline-Unterstützung
