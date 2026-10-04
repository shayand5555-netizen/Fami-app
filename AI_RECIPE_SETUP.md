# KI-Rezeptscanner einrichten

Die App nutzt die Supabase Edge Function `analyze-recipe`. Der private OpenAI-Schlüssel darf ausschließlich als Supabase-Secret gespeichert werden.

1. Im Supabase-Dashboard **Edge Functions** öffnen und den Ordner `supabase/functions/analyze-recipe` bereitstellen.
2. Unter **Project Settings → Edge Functions → Secrets** ein Secret `OPENAI_API_KEY` mit einem OpenAI-API-Schlüssel anlegen.
3. Die Function mit aktivierter JWT-Prüfung bereitstellen. Dadurch können nur bei Fami angemeldete Personen die Analyse aufrufen.
4. In Fami anmelden und unter **Rezepte → Rezept hinzufügen → KI-Fotoanalyse** testen.

Falls die Function oder das Secret noch fehlt, wechselt Fami automatisch zur lokalen OCR-Texterkennung. Bilder werden für die Analyse verkleinert. Ergebnisse und Nährwerte bleiben Schätzungen und müssen vor allem bei Allergenen geprüft werden.
