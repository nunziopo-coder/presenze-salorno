# Deploy da iPhone (guida rapida)

Questa guida spiega come pubblicare l'app su Render usando solo l'iPhone:
1. Crea un account GitHub (https://github.com/) se non ce l'hai.
2. Apri GitHub nel browser (Safari), crea un nuovo repository pubblico (es: presenze-salorno).
3. Nel repository, clicca "Add file" -> "Upload files" e carica il contenuto dello zip che hai scaricato (tutti i file e la cartelle).
   - Carica l'intera struttura (app.py, requirements.txt, Procfile, cartella static).
   - Commit dei file.
4. Vai su https://render.com e crea un account (puoi "Sign in with GitHub" per autorizzare).
5. In Render Dashboard clicca **New** → **Web Service** → scegli **Connect a repository** e seleziona il repository GitHub creato.
6. Imposta:
   - **Environment**: Python 3
   - **Build Command**: (lascia vuoto) o `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - Render userà il `Procfile` automaticamente in molti casi.
7. Clicca Deploy. Dopo pochi minuti otterrai un URL in HTTPS.
8. Apri l'URL su Safari del tuo iPhone e usa "Aggiungi a Home" dal menu di condivisione per avere un'icona come app.

Fonti: Render docs (deploy from GitHub) — Render richiede repository Git per Web Services.
