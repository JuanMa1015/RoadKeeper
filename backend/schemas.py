from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
from typing import List, Optional, Literal

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


class UserMeResponse(UserBase):
    id: int
    two_factor_enabled: bool

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    new_username: Optional[str] = None
    new_email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    two_factor_code: Optional[str] = None

# --- SCHEMAS DE MANTENIMIENTO ---
class MantenimientoBase(BaseModel):
    tipo: str
    km_momento_servicio: float
    fecha_servicio: Optional[date] = None 

class MantenimientoCreate(MantenimientoBase):
    moto_id: int

class MantenimientoResponse(MantenimientoBase):
    id: int
    # El modelo ORM usa `fecha`; la API expone `fecha_servicio` para el frontend.
    fecha_servicio: Optional[date] = Field(default=None, validation_alias="fecha")

    class Config:
        from_attributes = True
        populate_by_name = True

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


class RecordatorioBase(BaseModel):
    tipo: Literal["revisiones", "documentos"]
    titulo: str
    moto_id: int
    fecha_vencimiento: date
    descripcion: Optional[str] = None


class RecordatorioCreate(RecordatorioBase):
    pass


class RecordatorioUpdate(BaseModel):
    tipo: Literal["revisiones", "documentos"]
    titulo: str
    moto_id: int
    fecha_vencimiento: date
    descripcion: Optional[str] = None


class RecordatorioResponse(BaseModel):
    id: int
    tipo: Literal["revisiones", "documentos"]
    titulo: str
    moto_id: int
    moto_nombre: str
    fecha_vencimiento: date
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True