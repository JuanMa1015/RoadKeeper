"""
Router de gestión de motos.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import SessionLocal
import models
import schemas
from routers.auth_users import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

router = APIRouter(prefix="/motos", tags=["Motos"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str, db: Session = Depends(get_db)):
    """Obtener usuario autenticado desde token"""
    from fastapi.security import OAuth2PasswordBearer
    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise JWTError()
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

@router.get("/", response_model=List[schemas.MotoResponse])
def get_motos(
    db: Session = Depends(get_db),
    authorization: str = None
):
    """Obtiene las motos del usuario autenticado"""
    current_user = get_current_user(authorization.replace("Bearer ", "") if authorization else "", db)
    
    return db.query(models.Moto)\
             .options(joinedload(models.Moto.mantenimientos))\
             .filter(models.Moto.user_id == current_user.id)\
             .all()

@router.post("/", response_model=schemas.MotoResponse)
def create_moto(
    moto: schemas.MotoCreate,
    db: Session = Depends(get_db),
    authorization: str = None
):
    """Crea una nueva moto para el usuario autenticado"""
    current_user = get_current_user(authorization.replace("Bearer ", "") if authorization else "", db)
    
    placa_upper = moto.placa.upper().replace(" ", "").strip()
    
    if db.query(models.Moto).filter(models.Moto.placa == placa_upper).first():
        raise HTTPException(status_code=400, detail="Esta placa ya está en el sistema")

    moto_dict = moto.dict(exclude={'placa', 'fecha_soat', 'fecha_tecno'})
    db_moto = models.Moto(**moto_dict, placa=placa_upper, user_id=current_user.id)
    
    db.add(db_moto)
    db.flush()

    for tipo, fecha_val in [("SOAT", moto.fecha_soat), ("Tecnomecánica", moto.fecha_tecno)]:
        if fecha_val:
            reg = models.Mantenimiento(
                moto_id=db_moto.id,
                tipo=tipo,
                km_momento_servicio=db_moto.kilometraje_actual,
                fecha=fecha_val
            )
            db.add(reg)
    
    db.commit()
    db.refresh(db_moto)
    return db_moto

@router.put("/{moto_id}/km")
def update_kilometraje(
    moto_id: int,
    kilometraje_actual: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    authorization: str = None
):
    """Actualiza el kilometraje actual de una moto"""
    current_user = get_current_user(authorization.replace("Bearer ", "") if authorization else "", db)
    
    db_moto = db.query(models.Moto).filter(
        models.Moto.id == moto_id,
        models.Moto.user_id == current_user.id
    ).first()
    
    if not db_moto:
        raise HTTPException(status_code=404, detail="Moto no encontrada")
    
    if kilometraje_actual < db_moto.kilometraje_actual:
        raise HTTPException(status_code=400, detail="No puedes bajar el kilometraje")
    
    db_moto.kilometraje_actual = kilometraje_actual
    db.commit()
    db.refresh(db_moto)
    return db_moto
