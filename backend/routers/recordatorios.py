"""
Router de gestión de recordatorios categorizados.
"""
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import List

from database import SessionLocal
import models
import schemas
from routers.auth_users import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

router = APIRouter(prefix="/api/recordatorios", tags=["Recordatorios"])

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


def sync_document_recordatorios(current_user: models.User, db: Session):
    """Sincroniza recordatorios de documentos legales desde mantenimientos SOAT/Tecnomecánica."""
    motos = db.query(models.Moto)\
        .options(joinedload(models.Moto.mantenimientos))\
        .filter(models.Moto.user_id == current_user.id)\
        .all()

    changed = False
    for moto in motos:
        for tipo_doc in ["SOAT", "Tecnomecánica"]:
            ult_doc = max(
                [m.fecha for m in moto.mantenimientos if m.tipo == tipo_doc and m.fecha],
                default=None
            )
            if not ult_doc:
                continue

            titulo = f"{tipo_doc} ({moto.placa})"
            descripcion = f"Vencimiento de {tipo_doc} para la moto {moto.placa}."

            existente = db.query(models.Recordatorio).filter(
                models.Recordatorio.user_id == current_user.id,
                models.Recordatorio.moto_id == moto.id,
                models.Recordatorio.tipo == "documentos",
                models.Recordatorio.titulo == titulo,
            ).first()

            if existente:
                if existente.fecha_vencimiento != ult_doc or existente.descripcion != descripcion:
                    existente.fecha_vencimiento = ult_doc
                    existente.descripcion = descripcion
                    changed = True
            else:
                db.add(models.Recordatorio(
                    tipo="documentos",
                    titulo=titulo,
                    moto_id=moto.id,
                    fecha_vencimiento=ult_doc,
                    descripcion=descripcion,
                    user_id=current_user.id,
                ))
                changed = True

    if changed:
        db.commit()

@router.get("", response_model=List[schemas.RecordatorioResponse], include_in_schema=False)
@router.get("/", response_model=List[schemas.RecordatorioResponse])
def get_recordatorios(
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """Obtiene recordatorios del usuario autenticado"""
    current_user = get_current_user(authorization.replace("Bearer ", "") if authorization else "", db)
    sync_document_recordatorios(current_user, db)
    
    recordatorios = db.query(models.Recordatorio)\
        .options(joinedload(models.Recordatorio.moto))\
        .filter(models.Recordatorio.user_id == current_user.id)\
        .order_by(models.Recordatorio.fecha_vencimiento.asc())\
        .all()

    resultado = []
    for recordatorio in recordatorios:
        moto_nombre = f"{recordatorio.moto.marca} {recordatorio.moto.modelo}" if recordatorio.moto else "Moto sin nombre"
        resultado.append({
            "id": recordatorio.id,
            "tipo": recordatorio.tipo,
            "titulo": recordatorio.titulo,
            "moto_id": recordatorio.moto_id,
            "placa": recordatorio.moto.placa if recordatorio.moto else None,
            "moto_nombre": moto_nombre,
            "fecha_vencimiento": recordatorio.fecha_vencimiento.date(),
            "descripcion": recordatorio.descripcion,
        })
    return resultado

@router.post("/", response_model=schemas.RecordatorioResponse, status_code=status.HTTP_201_CREATED)
def create_recordatorio(
    payload: schemas.RecordatorioCreate,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """Crea un nuevo recordatorio"""
    current_user = get_current_user(authorization.replace("Bearer ", "") if authorization else "", db)
    
    moto = db.query(models.Moto).filter(
        models.Moto.id == payload.moto_id,
        models.Moto.user_id == current_user.id
    ).first()
    
    if not moto:
        raise HTTPException(status_code=404, detail="Moto no encontrada")

    nuevo = models.Recordatorio(
        tipo=payload.tipo,
        titulo=payload.titulo,
        moto_id=payload.moto_id,
        fecha_vencimiento=datetime.combine(payload.fecha_vencimiento, datetime.min.time()),
        descripcion=payload.descripcion,
        user_id=current_user.id,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return {
        "id": nuevo.id,
        "tipo": nuevo.tipo,
        "titulo": nuevo.titulo,
        "moto_id": nuevo.moto_id,
        "placa": moto.placa,
        "moto_nombre": f"{moto.marca} {moto.modelo}",
        "fecha_vencimiento": nuevo.fecha_vencimiento.date(),
        "descripcion": nuevo.descripcion,
    }

@router.put("/{recordatorio_id}", response_model=schemas.RecordatorioResponse)
def update_recordatorio(
    recordatorio_id: int,
    payload: schemas.RecordatorioUpdate,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """Actualiza un recordatorio existente"""
    current_user = get_current_user(authorization.replace("Bearer ", "") if authorization else "", db)
    
    recordatorio = db.query(models.Recordatorio).filter(
        models.Recordatorio.id == recordatorio_id,
        models.Recordatorio.user_id == current_user.id
    ).first()
    
    if not recordatorio:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado")

    moto = db.query(models.Moto).filter(
        models.Moto.id == payload.moto_id,
        models.Moto.user_id == current_user.id
    ).first()
    
    if not moto:
        raise HTTPException(status_code=404, detail="Moto no encontrada")

    recordatorio.tipo = payload.tipo
    recordatorio.titulo = payload.titulo
    recordatorio.moto_id = payload.moto_id
    recordatorio.fecha_vencimiento = datetime.combine(payload.fecha_vencimiento, datetime.min.time())
    recordatorio.descripcion = payload.descripcion

    db.commit()
    db.refresh(recordatorio)

    return {
        "id": recordatorio.id,
        "tipo": recordatorio.tipo,
        "titulo": recordatorio.titulo,
        "moto_id": recordatorio.moto_id,
        "placa": moto.placa,
        "moto_nombre": f"{moto.marca} {moto.modelo}",
        "fecha_vencimiento": recordatorio.fecha_vencimiento.date(),
        "descripcion": recordatorio.descripcion,
    }
