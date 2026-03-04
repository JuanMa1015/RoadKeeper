import re
from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta, date
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import List

# Importaciones locales
from database import SessionLocal, engine, Base
import models
import schemas

SECRET_KEY = "TU_LLAVE_SECRETA_SUPER_SEGURA_CAMBIAME" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Road Keeper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el acceso",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise credentials_exception
    except JWTError: raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None: raise credentials_exception
    return user

# --- AUTH ---
@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Usuario o email ya registrados")
    
    hashed_pass = pwd_context.hash(user.password)
    new_user = models.User(username=user.username, email=user.email, hashed_password=hashed_pass)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user.username, "exp": int(expire.timestamp())}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

# --- MOTOS ---
@app.get("/motos", response_model=List[schemas.MotoResponse])
def get_motos(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Moto)\
             .options(joinedload(models.Moto.mantenimientos))\
             .filter(models.Moto.user_id == current_user.id)\
             .all()

@app.post("/motos", response_model=schemas.MotoResponse)
def create_moto(moto: schemas.MotoCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        placa_upper = moto.placa.upper().replace(" ", "").strip()
        
        if db.query(models.Moto).filter(models.Moto.placa == placa_upper).first():
            raise HTTPException(status_code=400, detail="Esta placa ya está en el sistema")

        # Excluimos campos que no van en la tabla Moto
        moto_dict = moto.dict(exclude={'placa', 'fecha_soat', 'fecha_tecno'})
        db_moto = models.Moto(**moto_dict, placa=placa_upper, user_id=current_user.id)
        
        db.add(db_moto)
        db.flush() 

        # Corregido: 'fecha' en lugar de 'fecha_servicio'
        for tipo, fecha_val in [("SOAT", moto.fecha_soat), ("Tecnomecánica", moto.fecha_tecno)]:
            if fecha_val:
                reg = models.Mantenimiento(
                    moto_id=db_moto.id,
                    tipo=tipo,
                    km_momento_servicio=db_moto.kilometraje_actual,
                    fecha=fecha_val  # <--- CORRECCIÓN AQUÍ
                )
                db.add(reg)
        
        db.commit()
        db.refresh(db_moto)
        return db_moto

    except Exception as e:
        db.rollback()
        print(f"--- ERROR CRÍTICO: {str(e)} ---")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/motos/{moto_id}/km", response_model=schemas.MotoResponse)
def update_kilometraje(moto_id: int, kilometraje_actual: int = Body(..., embed=True), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_moto = db.query(models.Moto).filter(models.Moto.id == moto_id, models.Moto.user_id == current_user.id).first()
    if not db_moto: raise HTTPException(status_code=404, detail="Moto no encontrada")
    if kilometraje_actual < db_moto.kilometraje_actual:
        raise HTTPException(status_code=400, detail="No puedes bajar el kilometraje")
    db_moto.kilometraje_actual = kilometraje_actual
    db.commit()
    db.refresh(db_moto)
    return db_moto

# --- MANTENIMIENTOS Y NOTIFICACIONES ---
@app.post("/mantenimientos", response_model=schemas.MantenimientoResponse)
def create_mantenimiento(mantenimiento: schemas.MantenimientoCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    moto = db.query(models.Moto).filter(models.Moto.id == mantenimiento.moto_id, models.Moto.user_id == current_user.id).first()
    if not moto: raise HTTPException(status_code=404, detail="Moto no encontrada")
    
    if mantenimiento.km_momento_servicio > moto.kilometraje_actual:
        moto.kilometraje_actual = mantenimiento.km_momento_servicio

    nuevo_reg = models.Mantenimiento(**mantenimiento.dict())
    db.add(nuevo_reg)
    db.commit()
    db.refresh(nuevo_reg)
    return nuevo_reg

@app.get("/notificaciones", response_model=List[schemas.NotificationResponse])
def get_notificaciones(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    motos = db.query(models.Moto).options(joinedload(models.Moto.mantenimientos))\
             .filter(models.Moto.user_id == current_user.id).all()
    
    alertas = []
    hoy = date.today()

    for moto in motos:
        # 1. Alertas por Kilometraje
        mants_aceite = [m.km_momento_servicio for m in moto.mantenimientos if m.tipo == "Aceite"]
        ult_aceite = max(mants_aceite, default=0)
        recorrido = moto.kilometraje_actual - ult_aceite
        if recorrido >= 4500:
            alertas.append({
                "moto_id": moto.id, "placa": moto.placa,
                "mensaje": f"Cambio de aceite pronto ({int(recorrido)}/5000 KM)",
                "prioridad": "ALTA" if recorrido >= 5000 else "MEDIA"
            })

        # 2. Alertas por Fecha
        for tipo in ["SOAT", "Tecnomecánica"]:
            # Usamos .date() porque en models es DateTime y comparamos con date.today()
            mants_tipo = [m.fecha.date() for m in moto.mantenimientos if m.tipo == tipo and m.fecha]
            ult_doc = max(mants_tipo, default=None)
            if ult_doc:
                vencimiento = ult_doc + timedelta(days=365)
                dias_restantes = (vencimiento - hoy).days
                if dias_restantes <= 15:
                    alertas.append({
                        "moto_id": moto.id, "placa": moto.placa,
                        "mensaje": f"{tipo} vence en {dias_restantes} días" if dias_restantes > 0 else f"{tipo} VENCIDO",
                        "prioridad": "ALTA" if dias_restantes <= 5 else "MEDIA"
                    })
    return alertas