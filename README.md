# AI-Chatbot

Simple AI chat application with a FastAPI backend (Groq LLaMA) and a React frontend.

This README covers:
- Project overview
- Running the backend and frontend locally (PowerShell commands)
- Environment variables and `.env` template
- Notes about the `/reset` endpoint and `memory.json`
- Git / secrets guidance

---

## Project structure (important files)

- `backend/` - FastAPI backend. Key files:
  - `main.py` - FastAPI app with `/chat` and `/reset` endpoints
  - `memory.json` - simple file-based chat memory used by the backend
  - `.env` - contains `GROQ_API_KEY` (not included in the repo)
  - `requirements.txt` - Python dependencies

- `frontend/` - React app created with CRA. Key files:
  - `src/App.js` - main UI and logic
  - `src/App.css` - styles
  - `public/index.html`
  - `package.json`

---

## Quick start (Windows / PowerShell)

1. Start the backend

```powershell
cd c:\Users\Indrani01\ai-chatbot\backend
# Create a virtualenv if desired
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

2. Start the frontend (in a separate terminal)

```powershell
cd c:\Users\Indrani01\ai-chatbot\frontend
npm install
npm start
```

3. Open the frontend in your browser (usually http://localhost:3000)

---

## Environment variables

Create a `backend/.env` file (this file is in `.gitignore` and should not be committed). Example contents:

```
GROQ_API_KEY=your_groq_api_key_here
```

Replace the value with your actual Groq API key.

---

## `/reset` endpoint and refresh behavior

The frontend currently calls `POST http://127.0.0.1:8000/reset` once on mount so that a browser refresh results in a fresh chat. That endpoint simply writes an empty list to `memory.json`.

If you prefer to preserve conversation history across refreshes, remove or comment out the `useEffect` in `frontend/src/App.js` that calls `/reset`.

Security note: the `/reset` endpoint is intentionally simple and unauthenticated for local development. If you deploy this app publicly, consider removing or securing this endpoint.

---

## Secrets & .gitignore

A `.gitignore` is included at the repo root and excludes common artifacts and secrets, including `backend/.env` and `memory.json`. If you have already committed secrets to git, `.gitignore` alone will not remove them from history — you must remove them from the index and rotate the keys.

To stop tracking `backend/.env` but keep your local copy:

```powershell
git rm --cached backend/.env
git commit -m "Stop tracking backend/.env"
git push
```

If a secret was pushed to a remote, rotate the secret immediately (regenerate/replace the API key) and consider using a history-rewriting tool (BFG / git-filter-repo) to remove the secret from history. I can help with that when needed.

---

## Notes & next steps

- Consider replacing the simple file-based memory with a proper datastore if you need persistent multi-user state.
- Add authentication or a simple token for the `/reset` endpoint if you plan to deploy.
- Add tests and CI for the backend and frontend.

If you'd like, I can:
- Add a UI toggle to enable/disable the automatic reset on refresh
- Secure the `/reset` endpoint with a short token read from `backend/.env`
- Help remove committed secrets from Git history

---

Happy hacking! 👩‍💻👨‍💻
