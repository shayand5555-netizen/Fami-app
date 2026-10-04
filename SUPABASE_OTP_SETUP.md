# Sechsstelligen Fami-Anmeldecode aktivieren

Die App unterstützt ab Version 0.25.1 die Anmeldung mit sechs- oder achtstelligen Codes. Damit Supabase den Code statt eines Browserlinks verschickt, muss einmal die E-Mail-Vorlage geändert werden.

1. Das Supabase-Projekt `Fami-app` öffnen.
2. **Authentication → Email Templates** aufrufen.
3. Die Vorlage **Magic Link** öffnen.
4. Betreff auf `Dein Fami-Anmeldecode` setzen.
5. Den Inhalt durch diese Vorlage ersetzen:

```html
<h2>Dein Fami-Anmeldecode</h2>
<p>Gib diesen Code direkt in der Fami-App ein:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:8px">{{ .Token }}</p>
<p>Der Code ist einmalig und eine Stunde gültig.</p>
<p>Wenn du den Code nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>
```

6. Speichern.

Danach in der installierten Fami-App **Familie verbinden → Code senden** wählen. Die Mail-App darf kurz geöffnet werden; der Code wird anschließend in derselben Fami-App eingegeben. Safari wird nicht benötigt.

Supabase erlaubt standardmäßig nur eine begrenzte Zahl von Anmelde-E-Mails. Für einen größeren Familientest sollte unter **Project Settings → Authentication → SMTP Settings** ein eigener SMTP-Maildienst eingerichtet werden.
