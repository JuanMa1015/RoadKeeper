"""
Router de gestión de mantenimientos.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import SessionLocal
import models
import schemas
from routers.auth_users import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

router = APIRouter(prefix="/mantenimientos", tags=["Mantenimientos"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str, db: Session = Depends(get_db)):
    """Obtener usuario autenticado desde token"""
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

@router.post("/", response_model=schemas.MantenimientoResponse)
def create_mantenimiento(
    mantenimiento: schemas.MantenimientoCreate,
    db: Session = Depends(get_db),
    authorization: str = None
):
    """Crea un nuevo registro de mantenimiento"""
    current_user = get_current_user(authorization.replace("Bearer ", "") if authorization else "", db)
    
    moto = db.query(models.Moto).filter(
        models.Moto.id == mantenimiento.moto_id,
        models.Moto.user_id == current_user.id
    ).first()
    
    if not moto:
        raise HTTPException(status_code=404, detail="Moto no encontrada")
    
    if mantenimiento.km_momento_servicio > moto.kilometraje_actual:
        moto.kilometraje_actual = mantenimiento.km_momento_servicio

    nuevo_reg = models.Mantenimiento(**mantenimiento.dict())
    db.add(nuevo_reg)
    db.commit()
    db.refresh(nuevo_reg)
    return nuevo_reg

@router.get("/notificaciones", response_model=List[schemas.NotificationResponse])
def get_notificaciones(
    db: Session = Depends(get_db),
    authorization: str = None
):
    """Obtiene alertas de mantenimiento vencidos o próximos a vencer"""
    from datetime import datetime, timedelta, date
    from sqlalchemy.orm import joinedload
    
    current_user = get_current_user(authorization.replace("Bearer ", "") if authorization else "", db)
    
    motos = db.query(models.Moto)\
        .options(joinedload(models.Moto.mantenimientos))\
        .filter(models.Moto.user_id == current_user.id)\
        .all()
    
    alertas = []
    hoy = date.today()

    for moto in motos:
        # Alertas por Kilometraje
        mants_aceite = [m.km_momento_servicio for m in moto.mantenimientos if m.tipo == "Aceite"]
        ult_aceite = max(mants_aceite, default=0)
        recorrido = moto.kilometraje_actual - ult_aceite
        if recorrido >= 4500:
            alertas.append({
                "moto_id": moto.id,
                "placa": moto.placa,
                "mensaje": f"Cambio de aceite pronto ({int(recorrido)}/5000 KM)",
                "prioridad": "ALTA" if recorrido >= 5000 else "MEDIA"
            })

        # Alertas por Fecha
        for tipo in ["SOAT", "Tecnomecánica"]:
            mants_tipo = [m.fecha.date() for m in moto.mantenimientos if m.tipo == tipo and m.fecha]
            ult_doc = max(mants_tipo, default=None)
            if ult_doc:
                vencimiento = ult_doc + timedelta(days=365)
                dias_restantes = (vencimiento - hoy).days
                if dias_restantes <= 15:
                    alertas.append({
                        "moto_id": moto.id,
                        "placa": moto.placa,
                        "mensaje": f"{tipo} vence en {dias_restantes} días" if dias_restantes > 0 else f"{tipo} VENCIDO",
                        "prioridad": "ALTA" if dias_restantes <= 5 else "MEDIA"
                    })
    
    return alertas
