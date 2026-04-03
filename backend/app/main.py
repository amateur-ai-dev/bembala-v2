from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth as auth_router

app = FastAPI(title="Vaakya API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)

@app.get("/health")
def health():
    return {"status": "ok"}
