from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base 

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
    modelo = Column(String)
    kilometraje_actual = Column(Float, default=0)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Relación: Una moto tiene muchos mantenimientos
    mantenimientos = relationship("Mantenimiento", back_populates="moto")

class Mantenimiento(Base):
    __tablename__ = "mantenimientos"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String)  # "Aceite", "Filtro", "Llantas"
    km_momento_servicio = Column(Integer) 
    fecha = Column(DateTime, default=datetime.utcnow)
    moto_id = Column(Integer, ForeignKey("motos.id"))

    # Relación: El mantenimiento pertenece a una moto
    moto = relationship("Moto", back_populates="mantenimientos")