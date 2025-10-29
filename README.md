# Presenze Agenti - Polizia locale - comune di Salorno

Questa è una web app semplice per registrare check-in / check-out degli agenti.
È pronta per il deploy su Render (o altra piattaforma che deploya da GitHub).

## Contenuto
- `app.py` — backend Flask
- `static/` — frontend (HTML/CSS/JS), manifest, service worker, icone
- `requirements.txt`, `Procfile`

## Note importanti
- Render richiede un repository Git (GitHub/GitLab/Bitbucket). Vedi istruzioni nel file `DEPLOY_FROM_IPHONE.md`.
- L'app non ha autenticazione (accesso libero). Se vuoi, posso aggiungere autenticazione.
