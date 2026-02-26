from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    class Config:
        from_attributes = True


from pydantic import BaseModel, EmailStr
from typing import Optional

# Esquema para crear una moto
class MotoCreate(BaseModel):
    placa: str
    marca: str
    modelo: Optional[str] = None
    kilometraje_actual: int

# Esquema para responder con los datos de la moto (lo que faltaba)
class MotoResponse(BaseModel):
    id: int
    placa: str
    marca: str
    modelo: Optional[str]
    kilometraje_actual: int
    user_id: int

    class Config:
        from_attributes = True # Esto permite que SQLAlchemy lea los datos