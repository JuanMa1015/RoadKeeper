from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

# Importaciones locales
from database import SessionLocal, engine, Base
import models
import schemas

# Configuración de seguridad (Mantenla en secreto)
SECRET_KEY = "TU_LLAVE_SECRETA_SUPER_SEGURA_CAMBIAME" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 día de duración

# Herramientas de cifrado
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Inicialización de la App y creación de tablas en Neon
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Road Keeper API")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencia para obtener la DB
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

# --- ENDPOINTS ---

@app.get("/")
def home():
    return {"message": "Road Keeper Backend funcionando en Neon"}

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Verificar si el usuario o email ya existen en la DB de Neon
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    
    if db_user:
        raise HTTPException(status_code=400, detail="Usuario o email ya registrados")
    
    # Hashear contraseña y guardar
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
    # DEBATE: Aquí ya no usamos fake_users_db, consultamos a NEON directamente
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/motos", response_model=schemas.MotoResponse)
def create_moto(moto: schemas.MotoCreate, db: Session = Depends(get_db)):
    # Aquí deberías obtener el user_id del token JWT que enviamos en el interceptor de Axios
    new_moto = models.Moto(**moto.dict(), user_id=1) # Por ahora manual, luego con token
    db.add(new_moto)
    db.commit()
    db.refresh(new_moto)
    return new_moto

# Función para obtener el usuario desde el token
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

# ENDPOINT CORREGIDO: Ahora usa 'current_user'
@app.post("/motos", response_model=schemas.MotoResponse)
def create_moto(
    moto: schemas.MotoCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Importante para la seguridad
):
    # Creamos la moto asociada al ID del usuario del token
    db_moto = models.Moto(
        placa=moto.placa,
        marca=moto.marca,
        modelo=moto.modelo,
        kilometraje_actual=moto.kilometraje_actual,
        user_id=current_user.id
    )
    db.add(db_moto)
    db.commit()
    db.refresh(db_moto)
    return db_moto

@app.get("/motos", response_model=list[schemas.MotoResponse])
def get_motos(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Debate: No filtramos por ID enviado desde el frente, 
    # usamos el ID del token por pura seguridad.
    motos = db.query(models.Moto).filter(models.Moto.user_id == current_user.id).all()
    return motos

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
    
    # Debate: ¿Podemos bajar el kilometraje? 
    # En un sistema real, el kilometraje solo debería subir.
    if nuevo_km < db_moto.kilometraje_actual:
        raise HTTPException(status_code=400, detail="El kilometraje no puede ser menor al actual")

    db_moto.kilometraje_actual = nuevo_km
    db.commit()
    db.refresh(db_moto)
    return db_moto