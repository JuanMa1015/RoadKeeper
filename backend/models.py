from sqlalchemy import Column, Integer, String, Float, ForeignKey
from database import Base # Importante: debe usar el mismo Base de database.py

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Moto(Base):
    __tablename__ = "motos"
    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String, unique=True, index=True)
    marca = Column(String)
    kilometraje = Column(Float, default=0)
    user_id = Column(Integer, ForeignKey("users.id"))