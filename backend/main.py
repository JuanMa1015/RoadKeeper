import re
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import List
from sqlalchemy.orm import joinedload

# Importaciones locales
from database import SessionLocal, engine, Base
import models
import schemas

# --- CONFIGURACIÓN DE SEGURIDAD ---
SECRET_KEY = "TU_LLAVE_SECRETA_SUPER_SEGURA_CAMBIAME" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 día

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Inicialización de la base de datos
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Road Keeper API")

# --- CONFIGURACIÓN DE CORS ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DEPENDENCIAS ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- FUNCIONES DE SEGURIDAD ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el acceso",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# --- ENDPOINTS DE USUARIO ---

@app.get("/")
def home():
    return {"message": "Road Keeper Backend funcionando en Neon"}

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    
    if db_user:
        raise HTTPException(status_code=400, detail="Usuario o email ya registrados")
    
    hashed_pass = pwd_context.hash(user.password)
    new_user = models.User(
        username=user.username, 
        email=user.email, 
        hashed_password=hashed_pass
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# --- ENDPOINTS DE MOTOS ---

@app.post("/motos", response_model=schemas.MotoResponse)
def create_moto(
    moto: schemas.MotoCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Normalización
    placa_upper = moto.placa.upper().strip()

    # 2. Validación de Formato (Regex)
    # Este regex acepta el estándar común: 3 letras y 2-3 números/letras (Ej: ABC12, ABC123, ABC12D)
    # Ajusta el regex según el país objetivo de tu App real.
    patron_placa = r"^[A-Z]{3}[0-9A-Z]{2,3}$"
    if not re.match(patron_placa, placa_upper):
        raise HTTPException(
            status_code=400, 
            detail="El formato de la placa es inválido. Debe tener 3 letras seguidas de 2 o 3 caracteres alfanuméricos."
        )

    # 3. Validación de Unicidad
    # Evitamos que dos usuarios registren la misma placa en el sistema
    db_moto_existente = db.query(models.Moto).filter(models.Moto.placa == placa_upper).first()
    if db_moto_existente:
        raise HTTPException(
            status_code=400, 
            detail="Esta placa ya se encuentra registrada en el sistema."
        )

    # 4. Validación de Integridad de Datos
    if moto.kilometraje_actual < 0:
        raise HTTPException(
            status_code=400, 
            detail="El kilometraje no puede ser un valor negativo."
        )

    # 5. Creación del registro
    db_moto = models.Moto(
        placa=placa_upper,
        marca=moto.marca,
        modelo=moto.modelo,
        kilometraje_actual=moto.kilometraje_actual,
        user_id=current_user.id
    )
    
    try:
        db.add(db_moto)
        db.commit()
        db.refresh(db_moto)
        return db_moto
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error interno al guardar en la base de datos")

@app.get("/motos", response_model=List[schemas.MotoResponse])
def get_motos(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Moto)\
             .options(joinedload(models.Moto.mantenimientos))\
             .filter(models.Moto.user_id == current_user.id)\
             .all()

@app.patch("/motos/{moto_id}/kilometraje", response_model=schemas.MotoResponse)
def update_kilometraje(
    moto_id: int, 
    nuevo_km: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_moto = db.query(models.Moto).filter(
        models.Moto.id == moto_id, 
        models.Moto.user_id == current_user.id
    ).first()
    
    if not db_moto:
        raise HTTPException(status_code=404, detail="Moto no encontrada")
    
    # Debate: Validación de seguridad para el kilometraje
    if nuevo_km < db_moto.kilometraje_actual:
        raise HTTPException(
            status_code=400, 
            detail="El nuevo kilometraje no puede ser menor al registro actual"
        )

    db_moto.kilometraje_actual = nuevo_km
    db.commit()
    db.refresh(db_moto)
    return db_moto

# Endpoint para registrar un nuevo mantenimiento
@app.post("/mantenimientos", response_model=schemas.MantenimientoResponse)
def create_mantenimiento(
    mantenimiento: schemas.MantenimientoCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Verificar propiedad de la moto
    moto = db.query(models.Moto).filter(
        models.Moto.id == mantenimiento.moto_id, 
        models.Moto.user_id == current_user.id
    ).first()
    
    if not moto:
        raise HTTPException(status_code=404, detail="La moto no existe o no te pertenece")

    # 2. Validación lógica: No puedes hacer un mantenimiento a un KM mayor al actual 
    # (a menos que quieras que la moto se actualice sola)
    if mantenimiento.km_momento_servicio > moto.kilometraje_actual:
        moto.kilometraje_actual = mantenimiento.km_momento_servicio

    # 3. Crear el registro
    nuevo_registro = models.Mantenimiento(
        tipo=mantenimiento.tipo,
        km_momento_servicio=mantenimiento.km_momento_servicio,
        moto_id=mantenimiento.moto_id
    )
    
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return nuevo_registroget_motos