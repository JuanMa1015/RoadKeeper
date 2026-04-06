"""
RoadKeeper API - Main Application
Punto de entrada centralizado que configura la app e importa todos los routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from database import engine
import models

# Importar todos los routers
from routers import auth_users, auth_2fa, motos, mantenimientos, recordatorios

# Crear las tablas si no existen
models.Base.metadata.create_all(bind=engine)


def ensure_users_2fa_columns():
    """Agrega columnas de 2FA a users si la tabla existe sin migración."""
    inspector = inspect(engine)
    if 'users' not in inspector.get_table_names():
        return

    existing_columns = {col['name'] for col in inspector.get_columns('users')}
    statements = []

    if 'totp_secret' not in existing_columns:
        statements.append("ALTER TABLE users ADD COLUMN totp_secret VARCHAR")

    if 'two_factor_enabled' not in existing_columns:
        statements.append("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0")

    if statements:
        with engine.begin() as conn:
            for stmt in statements:
                conn.execute(text(stmt))


ensure_users_2fa_columns()

# Inicializar FastAPI app
app = FastAPI(
    title="RoadKeeper API",
    description="Sistema de gestión y control de motocicletas",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth_users.router)
app.include_router(auth_2fa.router)
app.include_router(motos.router)
app.include_router(mantenimientos.router)
app.include_router(recordatorios.router)

@app.get("/")
def read_root():
    """Health check del API"""
    return {
        "status": "ok",
        "message": "RoadKeeper API is running",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/health")
def health_check():
    """Verificar estado de la API"""
    return {"status": "healthy", "service": "roadkeeper-api"}

