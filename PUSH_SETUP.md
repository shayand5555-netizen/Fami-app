# Fami-Terminerinnerungen einrichten

Die App-Oberfläche und lokale Testnachrichten sind ab Version 0.20 vorhanden. Für Erinnerungen bei vollständig geschlossener App wird zusätzlich der Supabase-Hintergrunddienst eingerichtet.

## 1. Datenbank aktualisieren

Im Supabase SQL Editor den Abschnitt **„Ab Version 0.20“** aus `supabase-schema.sql` ausführen. Dadurch entstehen `push_subscriptions` und `push_deliveries` samt sicheren RLS-Regeln.

## 2. VAPID-Schlüssel erzeugen

Einmalig auf einem Rechner mit Node.js ausführen:

```bash
npx web-push generate-vapid-keys --json
```

- `publicKey` darf in `push-config.js` eingetragen und veröffentlicht werden.
- `privateKey` niemals in GitHub oder in die Browser-App eintragen.

## 3. Supabase-Geheimnisse setzen

Mit der Supabase CLI im Projektordner:

```bash
supabase link --project-ref ahqvjbkdunvclqhlpuju
supabase secrets set VAPID_SUBJECT=mailto:DEINE-EMAIL VAPID_PUBLIC_KEY=DEIN_PUBLIC_KEY VAPID_PRIVATE_KEY=DEIN_PRIVATE_KEY CRON_SECRET=EIN_LANGES_ZUFAELLIGES_PASSWORT
supabase functions deploy send-reminders --no-verify-jwt
```

`SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` werden einer Supabase Edge Function automatisch bereitgestellt.

## 4. Minütliche Ausführung aktivieren

Im Supabase Dashboard unter **Integrations → Cron** einen Job anlegen:

- Zeitplan: jede Minute (`* * * * *`)
- Ziel: Edge Function `send-reminders`
- Methode: `POST`
- Header: `x-cron-secret` mit demselben Wert wie `CRON_SECRET`

## 5. Auf dem Handy testen

1. Fami als App auf den Home-Bildschirm installieren.
2. Mit Fami Online anmelden und der Familie beitreten.
3. Oben auf die Glocke tippen und Benachrichtigungen aktivieren.
4. Zuerst die Testnachricht senden.
5. Einen Termin etwa zehn Minuten in der Zukunft anlegen und „10 Minuten vorher“ auswählen.

Auf dem iPhone werden Web-Push-Benachrichtigungen erst angeboten, wenn die Website als App zum Home-Bildschirm hinzugefügt und von dort geöffnet wurde.
