from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import List, Optional

# --- SCHEMAS DE USUARIO ---
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

# --- SCHEMAS DE MANTENIMIENTO ---
class MantenimientoBase(BaseModel):
    tipo: str
    km_momento_servicio: float
    fecha_servicio: Optional[date] = None 

class MantenimientoCreate(MantenimientoBase):
    moto_id: int

class MantenimientoResponse(MantenimientoBase):
    id: int
    fecha_servicio: Optional[date] = None 

    class Config:
        from_attributes = True

# --- SCHEMAS DE MOTO ---
class MotoBase(BaseModel):
    placa: str
    marca: str
    modelo: str
    kilometraje_actual: float

class MotoCreate(MotoBase):
    fecha_soat: Optional[date] = None
    fecha_tecno: Optional[date] = None

class MotoResponse(MotoBase): 
    id: int
    user_id: int
    mantenimientos: List[MantenimientoResponse] = []

    class Config:
        from_attributes = True

# --- SCHEMAS DE NOTIFICACIONES ---
# Agregamos esta clase que faltaba en tu último código enviado
class NotificationResponse(BaseModel):
    moto_id: int
    placa: str
    mensaje: str
    prioridad: str

    class Config:
        from_attributes = True