"""
Router de autenticación de usuarios: login, registro, cambio de contraseña, recuperación de contraseña.
"""
import os
import re
import smtplib
from email.message import EmailMessage
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import pyotp

from database import SessionLocal
import models
import schemas

# Configuración
SECRET_KEY = "TU_LLAVE_SECRETA_SUPER_SEGURA_CAMBIAME"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password):
    return pwd_context.hash(password)

def create_access_token(username: str, scope: str = "full"):
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": username,
        "scope": scope,
        "exp": int(expire.timestamp())
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def send_password_reset_email(to_email: str, username: str, reset_link: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM", smtp_user or "noreply@roadkeeper.app")

    if not smtp_host or not smtp_user or not smtp_password:
        # Si no hay configuración SMTP, no romper el endpoint en dev.
        print(f"[RoadKeeper] SMTP no configurado. Link de recuperación para {to_email}: {reset_link}")
        return

    msg = EmailMessage()
    msg["Subject"] = "RoadKeeper - Recuperación de cuenta"
    msg["From"] = from_email
    msg["To"] = to_email
    msg.set_content(
        f"""Hola {username},

Recibimos una solicitud para recuperar tu cuenta de RoadKeeper.

Por seguridad no podemos recordarte tu contraseña actual, pero puedes crear una nueva desde este enlace:
{reset_link}

Con ese enlace también puedes actualizar tu contraseña de acceso.

Si no hiciste esta solicitud, ignora este correo.

Equipo RoadKeeper
"""
    )

    with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el acceso",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


@router.get("/me", response_model=schemas.UserMeResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "two_factor_enabled": bool(current_user.two_factor_enabled),
    }


@router.put("/profile")
def update_profile(
    payload: schemas.ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not payload.new_username and not payload.new_email:
        raise HTTPException(status_code=400, detail="Debes enviar nuevo usuario o nuevo correo")

    is_2fa_active = bool(current_user.two_factor_enabled and current_user.totp_secret)

    # Si el usuario tiene 2FA activo, permitimos autenticar con password o código 2FA.
    # Si no tiene 2FA, exigimos contraseña actual.
    if is_2fa_active:
        authenticated = False
        if payload.current_password:
            authenticated = verify_password(payload.current_password, current_user.hashed_password)

        if not authenticated and payload.two_factor_code:
            totp = pyotp.TOTP(current_user.totp_secret)
            authenticated = bool(totp.verify(payload.two_factor_code))

        if not authenticated:
            raise HTTPException(
                status_code=401,
                detail="Debes validar con contraseña actual o código 2FA válido",
            )
    else:
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="La contraseña actual es obligatoria")
        if not verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")

    if payload.new_username and payload.new_username != current_user.username:
        existing_user = (
            db.query(models.User)
            .filter(models.User.username == payload.new_username)
            .filter(models.User.id != current_user.id)
            .first()
        )
        if existing_user:
            raise HTTPException(status_code=400, detail="Ese nombre de usuario ya está en uso")
        current_user.username = payload.new_username.strip()

    if payload.new_email and payload.new_email != current_user.email:
        existing_email = (
            db.query(models.User)
            .filter(models.User.email == payload.new_email)
            .filter(models.User.id != current_user.id)
            .first()
        )
        if existing_email:
            raise HTTPException(status_code=400, detail="Ese correo ya está registrado")
        current_user.email = payload.new_email

    db.commit()
    db.refresh(current_user)

    return {
        "success": True,
        "message": "Perfil actualizado correctamente",
        "user": {
            "username": current_user.username,
            "email": current_user.email,
            "two_factor_enabled": bool(current_user.two_factor_enabled),
        },
    }

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario.
    
    Validaciones:
    - Usuario y email únicos
    - Contraseña de al menos 8 caracteres
    - Email válido
    """
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Contraseña debe tener al menos 8 caracteres")
    
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_pattern, user.email):
        raise HTTPException(status_code=400, detail="Email no válido")
    
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Usuario o email ya registrados")
    
    hashed_pass = hash_password(user.password)
    new_user = models.User(username=user.username, email=user.email, hashed_password=hashed_pass)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Autentica un usuario y devuelve un token.
    
    Si el usuario tiene 2FA activado, devuelve un temp_token limitado.
    Si no, devuelve el access_token completo.
    """
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # Si el usuario tiene 2FA activado, devolver temp_token limitado
    if user.two_factor_enabled:
        expire = datetime.now() + timedelta(minutes=5)
        payload = {
            "sub": user.username,
            "scope": "2fa_pending",
            "exp": int(expire.timestamp())
        }
        temp_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        return {
            "requires_2fa": True,
            "temp_token": temp_token
        }
    
    # Si no tiene 2FA, devolver token de acceso completo
    access_token = create_access_token(user.username)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password")
async def forgot_password(email: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """
    Inicia el proceso de recuperación de contraseña.
    
    En un sistema real, aquí se enviaría un email con un token de recuperación.
    Por ahora, retorna un token temporal que el usuario puede usar para resetear.
    
    Nota: En producción, usar un servicio de email y almacenar tokens con expiración en BD.
    """
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return {
            "success": True,
            "message": "Si el correo existe, te enviamos instrucciones para recuperar tu cuenta.",
        }
    
    # Crear token temporal para reset (válido por 30 minutos)
    expire = datetime.now() + timedelta(minutes=30)
    payload = {
        "sub": user.username,
        "scope": "password_reset",
        "exp": int(expire.timestamp())
    }
    reset_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    send_password_reset_email(user.email, user.username, reset_link)

    return {
        "success": True,
        "message": "Si el correo existe, te enviamos instrucciones para recuperar tu cuenta.",
    }

@router.post("/reset-password")
async def reset_password(
    reset_token: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Resetea la contraseña usando un token de recuperación.
    
    Parámetros:
    - reset_token: Token recibido en el email de recuperación
    - new_password: Nueva contraseña (mín 8 caracteres)
    """
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Contraseña debe tener al menos 8 caracteres")
    
    # Validar token
    try:
        payload = jwt.decode(reset_token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        scope = payload.get("scope")
        
        if scope != "password_reset":
            raise JWTError()
    except JWTError:
        raise HTTPException(status_code=401, detail="Token de recuperación inválido o expirado")
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Actualizar contraseña
    user.hashed_password = hash_password(new_password)
    db.commit()
    
    return {"success": True, "message": "Contraseña actualizada. Puedes iniciar sesión con tu nueva contraseña."}
