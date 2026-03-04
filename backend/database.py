import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()


# Esto le dice: "Busca el archivo .env un nivel arriba de donde está este script"
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, "../.env"))

DATABASE_URL = os.getenv("DATABASE_URL")
# print(f"DEBUG: Conectando a: {DATABASE_URL}") # <--- Deja esto para estar seguros

# Debatamos esto: Si no usas "postgresql+psycopg2", SQLAlchemy podría fallar en algunos entornos
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()