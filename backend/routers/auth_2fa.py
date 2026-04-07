import pyotp
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

from database import SessionLocal, engine, Base
import models
import schemas
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer

# Configuración (debe coincidir con main.py)
SECRET_KEY = "TU_LLAVE_SECRETA_SUPER_SEGURA_CAMBIAME"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
TMP_TOKEN_EXPIRE_MINUTES = 5
TOTP_ISSUER = "RoadKeeper"
TOTP_DIGITS = 6

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Validar token JWT normal (acceso completo)"""
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


router = APIRouter(prefix="/auth", tags=["2FA"])


def get_current_user_from_temp_token(
    temp_token: str = Body(..., embed=True), 
    db: Session = Depends(get_db)
):
    """
    Valida y extrae el usuario de un temp_token (token limitado con scope '2fa_pending').
    Usado por /2fa/login-verify y /2fa/disable.
    """
    try:
        payload = jwt.decode(temp_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        scope: str = payload.get("scope")
        
        if username is None or scope != "2fa_pending":
            raise JWTError("Token inválido o scope incorrecto")
        
        user = db.query(models.User).filter(models.User.username == username).first()
        if user is None:
            raise JWTError("Usuario no encontrado")
        
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de 2FA inválido o expirado"
        )


@router.post("/2fa/setup")
def setup_2fa(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Genera un nuevo TOTP secret y URI para 2FA (Google Authenticator / Authy).
    
    NO guarda el secret aún en BD — el usuario debe confirmar con un código.
    
    Respuesta:
    {
      "totp_secret": "ABC1234567890DEF",
      "otpauth_uri": "otpauth://totp/RoadKeeper:user@email.com?secret=...&issuer=RoadKeeper",
      "qr_data": "data para mostrar QR"
    }
    """
    if current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario ya tiene 2FA activado. Desactívalo primero si deseas configurar uno nuevo."
        )
    
    totp_secret = pyotp.random_base32()
    totp = pyotp.TOTP(totp_secret, issuer=TOTP_ISSUER)
    
    otpauth_uri = totp.provisioning_uri(
        name=current_user.email,
        issuer_name=TOTP_ISSUER
    )
    
    qr_data = otpauth_uri  # El frontend puede usar esta URI para generar QR
    
    return {
        "totp_secret": totp_secret,
        "otpauth_uri": otpauth_uri,
        "qr_data": qr_data
    }


@router.post("/2fa/verify-setup")
def verify_setup_2fa(
    payload: dict = Body(...),  # {"totp_secret": "...", "code": "123456"}
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Verifica el código TOTP proporcionado contra el secret enviado.
    Si es válido, guarda el secret en la BD y activa 2FA para el usuario.
    
    Parámetros:
    - totp_secret: El secret generado en /2fa/setup
    - code: El código de 6 dígitos del autenticador del usuario
    
    Respuesta:
    {
      "success": true,
      "message": "2FA activado correctamente"
    }
    """
    if current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="2FA ya está activado para este usuario"
        )
    
    totp_secret = payload.get("totp_secret")
    code = str(payload.get("code", "")).strip().replace(" ", "")
    
    if not totp_secret or not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="totp_secret y code son requeridos"
        )
    
    if not code.isdigit() or len(code) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ingresa un código válido de 6 dígitos"
        )

    totp = pyotp.TOTP(totp_secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Código TOTP inválido o expirado"
        )
    
    # Guardar el secret en BD y activar 2FA
    current_user.totp_secret = totp_secret
    current_user.two_factor_enabled = 1
    db.commit()
    
    return {
        "success": True,
        "message": "2FA activado correctamente"
    }


@router.post("/2fa/login-verify")
def login_verify_2fa(
    temp_token: str = Body(..., embed=True),
    code: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Verifica el código TOTP del usuario pendiente de autenticación 2FA.
    
    Parámetros:
    - temp_token: JWT temporal con scope "2fa_pending" del login inicial
    - code: Código de 6 dígitos del autenticador
    
    Respuesta:
    {
      "access_token": "JWT_COMPLETO",
      "token_type": "bearer"
    }
    """
    current_user = get_current_user_from_temp_token(temp_token, db)
    
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA no está configurado para este usuario"
        )
    
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="TOTP secret no configurado"
        )
    
    normalized_code = str(code).strip().replace(" ", "")
    if not normalized_code.isdigit() or len(normalized_code) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ingresa un código válido de 6 dígitos"
        )

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(normalized_code, valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Código TOTP inválido o expirado"
        )
    
    # Emitir JWT de acceso completo
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": current_user.username,
        "exp": int(expire.timestamp())
    }
    access_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/2fa/disable")
def disable_2fa(
    code: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Desactiva 2FA para el usuario autenticado.
    Requiere confirmación con un código TOTP válido.
    
    Parámetros:
    - temp_token: JWT del usuario autenticado
    - code: Código TOTP actual del usuario
    
    Respuesta:
    {
      "success": true,
      "message": "2FA desactivado"
    }
    """
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA no está activado para este usuario"
        )
    
    normalized_code = str(code).strip().replace(" ", "")
    if not normalized_code.isdigit() or len(normalized_code) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ingresa un código válido de 6 dígitos"
        )

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(normalized_code, valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Código TOTP inválido o expirado"
        )
    
    current_user.totp_secret = None
    current_user.two_factor_enabled = 0
    db.commit()
    
    return {
        "success": True,
        "message": "2FA desactivado correctamente"
    }


