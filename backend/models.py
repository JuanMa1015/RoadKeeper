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
    totp_secret = Column(String, nullable=True, default=None)
    two_factor_enabled = Column(Integer, default=0)  # SQLite: usa INTEGER para boolean

    recordatorios = relationship("Recordatorio", back_populates="user", cascade="all, delete-orphan")

class Moto(Base):
    __tablename__ = "motos"
    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String, unique=True, index=True)
    marca = Column(String)
    modelo = Column(String)
    kilometraje_actual = Column(Float, default=0)
    user_id = Column(Integer, ForeignKey("users.id"))

    mantenimientos = relationship("Mantenimiento", back_populates="moto")
    recordatorios = relationship("Recordatorio", back_populates="moto", cascade="all, delete-orphan")

class Mantenimiento(Base):
    __tablename__ = "mantenimientos"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String)  # "Aceite", "SOAT", "Tecnomecánica", etc.
    km_momento_servicio = Column(Integer) 
    fecha = Column(DateTime, default=datetime.utcnow) # <--- EL NOMBRE ES 'fecha'
    moto_id = Column(Integer, ForeignKey("motos.id"))

    moto = relationship("Moto", back_populates="mantenimientos")


class Recordatorio(Base):
    __tablename__ = "recordatorios"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, nullable=False)  # revisiones | documentos
    titulo = Column(String, nullable=False)
    fecha_vencimiento = Column(DateTime, nullable=False)
    descripcion = Column(String, nullable=True)
    moto_id = Column(Integer, ForeignKey("motos.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    moto = relationship("Moto", back_populates="recordatorios")
    user = relationship("User", back_populates="recordatorios")