# KI-Rezeptscanner einrichten

Die App nutzt die Supabase Edge Function `analyze-recipe` mit der Gemini API. Der private Gemini-Schlüssel darf ausschließlich als Supabase-Secret gespeichert werden.

1. Im Supabase-Dashboard **Edge Functions** öffnen und den Ordner `supabase/functions/analyze-recipe` bereitstellen.
2. In [Google AI Studio](https://aistudio.google.com/apikey) einen Gemini-API-Schlüssel erstellen.
3. Unter **Project Settings → Edge Functions → Secrets** ein Secret `GEMINI_API_KEY` mit diesem Schlüssel anlegen.
4. Die Function mit aktivierter JWT-Prüfung bereitstellen. Dadurch können nur bei Fami angemeldete Personen die Analyse aufrufen.
5. In Fami anmelden und unter **Rezepte → Rezept hinzufügen → KI-Fotoanalyse** testen.

Falls die Function oder das Secret noch fehlt, zeigt Fami die konkrete Fehlermeldung an. Eine lokale OCR-Texterkennung wird nicht verwendet. Bilder werden für die KI-Analyse verkleinert. Ergebnisse und Nährwerte bleiben Schätzungen und müssen vor allem bei Allergenen geprüft werden. Beim kostenlosen Gemini-Tarif gelten Nutzungslimits und Google kann die übermittelten Inhalte zur Verbesserung seiner Produkte verwenden.
