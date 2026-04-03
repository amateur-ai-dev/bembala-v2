from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth as auth_router
from app.api import voice as voice_router
from app.api import translate as translate_router
from app.api import chat as chat_router
from app.api import s2s as s2s_router
from app.api import sessions as sessions_router
from app.api import employer as employer_router

app = FastAPI(title="Vaakya API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(voice_router.router)
app.include_router(translate_router.router)
app.include_router(chat_router.router)
app.include_router(s2s_router.router)
app.include_router(sessions_router.router)
app.include_router(employer_router.router)

@app.get("/health")
def health():
    return {"status": "ok"}
