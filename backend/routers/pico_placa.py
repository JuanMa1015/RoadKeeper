import re
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, HTTPException


router = APIRouter(tags=["Pico y Placa"])


DAY_NAMES = {
    0: "Lunes",
    1: "Martes",
    2: "Miércoles",
    3: "Jueves",
    4: "Viernes",
    5: "Sábado",
    6: "Domingo",
}

RESTRICTION_BY_DAY = {
    0: {1, 7},  # Lunes
    1: {0, 3},  # Martes
    2: {4, 6},  # Miércoles
    3: {5, 9},  # Jueves
    4: {2, 8},  # Viernes
}

RESTRICTION_SCHEDULE = "5:00am - 8:00pm"

GENERAL_SCHEDULE = [
    {"dia": "Lunes", "digitos": [1, 7]},
    {"dia": "Martes", "digitos": [0, 3]},
    {"dia": "Miércoles", "digitos": [4, 6]},
    {"dia": "Jueves", "digitos": [5, 9]},
    {"dia": "Viernes", "digitos": [2, 8]},
]


def get_bogota_now() -> datetime:
    try:
        return datetime.now(ZoneInfo("America/Bogota"))
    except ZoneInfoNotFoundError:
        try:
            import pytz  # type: ignore

            return datetime.now(pytz.timezone("America/Bogota"))
        except Exception:
            # Fallback final para entornos sin base de zonas horarias.
            return datetime.now(timezone(timedelta(hours=-5)))


@router.get("/pico-y-placa/{placa}")
def get_pico_y_placa(placa: str):
    # NOTA: Estas reglas corresponden a la normativa vigente de Medellín. Verificar periódicamente con fuentes oficiales de la Alcaldía de Medellín ya que están sujetas a cambios.
    if (placa or "").strip().lower() == "resumen":
        return get_pico_y_placa_resumen()

    digits = re.findall(r"\d", placa or "")
    if not digits:
        raise HTTPException(status_code=400, detail="La placa debe contener al menos un dígito numérico válido")

    first_digit = int(digits[0])

    now = get_bogota_now()
    weekday = now.weekday()
    day_name = DAY_NAMES[weekday]

    restricted_digits = RESTRICTION_BY_DAY.get(weekday)
    if restricted_digits is None:
        return {
            "placa": placa,
            "aplica_hoy": False,
            "dia": day_name,
            "digito_evaluado": first_digit,
            "horarios": None,
            "mensaje": "Tu moto no tiene restricción hoy",
            "criterio": "Primer dígito numérico de la placa",
        }

    applies_today = first_digit in restricted_digits
    return {
        "placa": placa,
        "aplica_hoy": applies_today,
        "dia": day_name,
        "digito_evaluado": first_digit,
        "horarios": RESTRICTION_SCHEDULE if applies_today else None,
        "mensaje": "Tu moto tiene restricción de Pico y Placa hoy" if applies_today else "Tu moto no tiene restricción hoy",
        "criterio": "Primer dígito numérico de la placa",
    }


@router.get("/pico-y-placa/resumen")
def get_pico_y_placa_resumen():
    return {
        "ciudad": "Medellín",
        "periodo": "Primer semestre 2026",
        "tipo_vehiculo": "Motos de 2 y 4 tiempos",
        "criterio": "Primer dígito numérico de la placa",
        "horario": RESTRICTION_SCHEDULE,
        "reglas": GENERAL_SCHEDULE,
        "mensaje": "Consulta informativa general. Verifica siempre fuentes oficiales de la Alcaldía de Medellín.",
    }


# ROADKEEPER - modificado por Copilot 2026-04-06