from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


# --- SCHEMAS DE USUARIO ---
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase): # <--- ESTE ES EL QUE FALTA
    id: int

    class Config:
        from_attributes = True
        
# --- SCHEMAS DE MANTENIMIENTO ---
class MantenimientoBase(BaseModel):
    tipo: str
    km_momento_servicio: int

class MantenimientoCreate(MantenimientoBase):
    moto_id: int

class MantenimientoResponse(MantenimientoBase):
    id: int
    fecha: datetime

    class Config:
        from_attributes = True

# --- SCHEMAS DE MOTO (Actualizado) ---
class MotoBase(BaseModel):
    placa: str
    marca: str
    modelo: str
    kilometraje_actual: float

class MotoCreate(MotoBase):
    pass

class MotoResponse(MotoBase):
    id: int
    user_id: int
    # Esto permite ver el historial de mantenimientos dentro de la moto
    mantenimientos: List[MantenimientoResponse] = []

    class Config:
        from_attributes = True