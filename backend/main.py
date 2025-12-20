from fastapi import FastAPI
from pydantic import BaseModel
import os
from groq import Groq
from dotenv import load_dotenv
import json
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Serve frontend build (if present). This mounts the React build folder so the
# frontend static files are served at the root URL. Ensure the frontend has
# been built (`npm run build`) so `../frontend/build` exists relative to the
# backend folder.
# NOTE: The static mount is registered after API routes below so that
# API endpoints (e.g. /chat, /reset) take precedence. The actual mount
# call is appended to the bottom of this file.


# Load API Key
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize client
client = Groq(api_key=GROQ_API_KEY)


# Memory file
MEMORY_FILE = "memory.json"


def load_memory():
    if not os.path.exists(MEMORY_FILE):
        return []
    with open(MEMORY_FILE, "r") as f:
        return json.load(f)

def save_memory(messages):
    with open(MEMORY_FILE, "w") as f:
        json.dump(messages, f, indent=4)


# Request body
class ChatRequest(BaseModel):
    message: str


@app.get("/api/health")
def read_health():
    """Health endpoint for the API. Moved off `/` so the frontend static
    files mounted at `/` can be served by StaticFiles.
    """
    return {"message": "AI Chatbot API is running"}
    
@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        # Load old memory
        memory = load_memory()

        # Add user message
        memory.append({"role": "user", "content": req.message})

        # Keep last 10
        memory = memory[-10:]

        # Call Groq API
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=memory
        )

        # FIX: Correct way to get content
        reply = completion.choices[0].message.content

        # Add assistant response to memory
        memory.append({"role": "assistant", "content": reply})
        save_memory(memory)

        return {"response": reply}

    except Exception as e:
        return {"error": str(e)}


@app.post("/reset")
async def reset_memory():
    """Reset the conversation memory by truncating the memory file to an empty list.

    This endpoint is intentionally simple and unauthenticated because the
    frontend calls it on mount to ensure each page refresh starts a fresh chat.
    If you deploy publicly, consider adding authentication or removing this
    behavior.
    """
    try:
        save_memory([])
        return {"ok": True, "message": "memory reset"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


# Serve frontend build (if present). Mount this after routes so API endpoints
# respond first. We compute the build directory relative to this file and
# only mount it if it exists to avoid a RuntimeError when running without a
# built frontend (for example during development).
logger = logging.getLogger("uvicorn.error")

# Use absolute path to ensure frontend build is found on Render
build_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "build"))

if os.path.isdir(build_dir):
    app.mount("/", StaticFiles(directory=build_dir, html=True), name="frontend")
    logger.info(f"Serving frontend from: {build_dir}")
else:
    logger.warning(
        "Frontend build directory not found: '%s'. Make sure 'npm run build' was run in the frontend folder.",
        build_dir,
    )