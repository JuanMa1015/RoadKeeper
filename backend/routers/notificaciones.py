"""
Router de notificaciones multicanal (email + push/web-app).
"""
import os
import smtplib
import html
from datetime import date, datetime
from email.message import EmailMessage
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import SessionLocal
import models
from routers.auth_users import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


KM_RULES = [
    {"tipo": "Aceite", "limite": 5000},
    {"tipo": "Frenos", "limite": 8000},
    {"tipo": "Kit Arrastre", "limite": 15000},
]

DOC_TYPES = ["SOAT", "Tecnomecánica"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str, db: Session = Depends(get_db)):
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


def compute_user_alerts(db: Session, user: models.User):
    hoy = date.today()
    motos = db.query(models.Moto)\
        .options(joinedload(models.Moto.mantenimientos))\
        .filter(models.Moto.user_id == user.id)\
        .all()

    events = []
    for moto in motos:
        for rule in KM_RULES:
            servicios = [m.km_momento_servicio for m in moto.mantenimientos if m.tipo == rule["tipo"]]
            last_km = max(servicios, default=0)
            recorrido = int(moto.kilometraje_actual - last_km)
            threshold = int(rule["limite"] * 0.85)

            if recorrido >= rule["limite"]:
                message = f"{rule['tipo']} vencido para {moto.placa} ({recorrido}/{rule['limite']} km)."
                events.append({
                    "event_key": f"km:{moto.id}:{rule['tipo']}:due",
                    "moto_id": moto.id,
                    "placa": moto.placa,
                    "priority": "ALTA",
                    "message": message,
                })
            elif recorrido >= threshold:
                message = f"{rule['tipo']} próximo para {moto.placa} ({recorrido}/{rule['limite']} km)."
                events.append({
                    "event_key": f"km:{moto.id}:{rule['tipo']}:soon",
                    "moto_id": moto.id,
                    "placa": moto.placa,
                    "priority": "MEDIA",
                    "message": message,
                })

        for tipo in DOC_TYPES:
            fechas = [m.fecha.date() for m in moto.mantenimientos if m.tipo == tipo and m.fecha]
            vencimiento = max(fechas, default=None)
            if not vencimiento:
                continue

            dias = (vencimiento - hoy).days
            if dias > 15:
                continue

            if dias < 0:
                message = f"{tipo} vencido para {moto.placa}."
                suffix = "expired"
                priority = "ALTA"
            elif dias == 0:
                message = f"{tipo} vence hoy para {moto.placa}."
                suffix = "today"
                priority = "ALTA"
            elif dias == 1:
                message = f"{tipo} vence mañana para {moto.placa}."
                suffix = "tomorrow"
                priority = "ALTA"
            else:
                message = f"{tipo} vence en {dias} días para {moto.placa}."
                suffix = "soon"
                priority = "MEDIA"

            events.append({
                "event_key": f"doc:{moto.id}:{tipo}:{suffix}",
                "moto_id": moto.id,
                "placa": moto.placa,
                "priority": priority,
                "message": message,
            })

    return events


def already_sent_today(db: Session, user_id: int, event_key: str, channel: str, sent_on: str) -> bool:
    existing = db.query(models.NotificationDelivery).filter(
        models.NotificationDelivery.user_id == user_id,
        models.NotificationDelivery.event_key == event_key,
        models.NotificationDelivery.channel == channel,
        models.NotificationDelivery.sent_on == sent_on,
    ).first()
    return existing is not None


def mark_sent(db: Session, user_id: int, moto_id: int, event_key: str, channel: str, sent_on: str, message: str):
    db.add(models.NotificationDelivery(
        user_id=user_id,
        moto_id=moto_id,
        event_key=event_key,
        channel=channel,
        sent_on=sent_on,
        message=message,
    ))


def build_email_content(events, frontend_url: str):
        critical = [e for e in events if e.get("priority") == "ALTA"]
        medium = [e for e in events if e.get("priority") != "ALTA"]

        plain_lines = [
                "RoadKeeper - Alertas importantes de tu moto",
                "",
                f"Total alertas: {len(events)}",
                f"Criticas: {len(critical)} | Preventivas: {len(medium)}",
                "",
                "Detalle:",
        ]
        for event in events:
                plain_lines.append(f"- [{event.get('priority', 'INFO')}] {event.get('message', '')}")

        plain_lines.extend([
                "",
                f"Ir a Mantenimientos: {frontend_url}/mantenimientos",
                f"Ir a Recordatorios: {frontend_url}/recordatorios",
                f"Ir a Reportes: {frontend_url}/reportes",
                "",
                "RoadKeeper Professional Systems",
        ])

        row_html = []
        for event in events:
                is_critical = event.get("priority") == "ALTA"
                badge_bg = "#7f1d1d" if is_critical else "#78350f"
                badge_text = "#fecaca" if is_critical else "#fde68a"
                row_html.append(
                        f"""
                        <tr>
                            <td style=\"padding:12px 10px;border-bottom:1px solid #1f2937;\">
                                <span style=\"display:inline-block;padding:4px 8px;border-radius:999px;background:{badge_bg};color:{badge_text};font-size:11px;font-weight:700;\">{html.escape(str(event.get('priority', 'INFO')))}</span>
                            </td>
                            <td style=\"padding:12px 10px;border-bottom:1px solid #1f2937;color:#e2e8f0;font-size:14px;\">{html.escape(str(event.get('message', '')))}</td>
                            <td style=\"padding:12px 10px;border-bottom:1px solid #1f2937;color:#93c5fd;font-size:13px;font-weight:700;\">{html.escape(str(event.get('placa', '-')))}</td>
                        </tr>
                        """
                )

        html_body = f"""
        <div style=\"background:#020617;padding:24px;font-family:Segoe UI,Arial,sans-serif;color:#e2e8f0;\">
            <div style=\"max-width:760px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:18px;overflow:hidden;\">
                <div style=\"padding:20px 22px;background:linear-gradient(120deg,#0b1226,#1d4ed8 140%);\">
                    <h1 style=\"margin:0;font-size:24px;color:#ffffff;font-weight:900;\">RoadKeeper Alert Center</h1>
                    <p style=\"margin:8px 0 0 0;color:#bfdbfe;font-size:13px;\">Resumen automático de eventos por vencer y acciones recomendadas.</p>
                </div>

                <div style=\"padding:18px 22px 8px 22px;\">
                    <div style=\"display:flex;gap:10px;flex-wrap:wrap;\">
                        <div style=\"background:#111827;border:1px solid #374151;border-radius:12px;padding:10px 12px;\">
                            <div style=\"font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;\">Total alertas</div>
                            <div style=\"font-size:22px;color:#fff;font-weight:900;\">{len(events)}</div>
                        </div>
                        <div style=\"background:#111827;border:1px solid #7f1d1d;border-radius:12px;padding:10px 12px;\">
                            <div style=\"font-size:11px;color:#fca5a5;text-transform:uppercase;letter-spacing:.08em;\">Críticas</div>
                            <div style=\"font-size:22px;color:#fecaca;font-weight:900;\">{len(critical)}</div>
                        </div>
                        <div style=\"background:#111827;border:1px solid #78350f;border-radius:12px;padding:10px 12px;\">
                            <div style=\"font-size:11px;color:#fcd34d;text-transform:uppercase;letter-spacing:.08em;\">Preventivas</div>
                            <div style=\"font-size:22px;color:#fde68a;font-weight:900;\">{len(medium)}</div>
                        </div>
                    </div>
                </div>

                <div style=\"padding:12px 22px 10px 22px;\">
                    <table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;background:#0b1221;border:1px solid #1f2937;border-radius:12px;overflow:hidden;\">
                        <thead>
                            <tr style=\"background:#111827;\">
                                <th align=\"left\" style=\"padding:10px;color:#93c5fd;font-size:12px;text-transform:uppercase;\">Prioridad</th>
                                <th align=\"left\" style=\"padding:10px;color:#93c5fd;font-size:12px;text-transform:uppercase;\">Detalle</th>
                                <th align=\"left\" style=\"padding:10px;color:#93c5fd;font-size:12px;text-transform:uppercase;\">Placa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {''.join(row_html)}
                        </tbody>
                    </table>
                </div>

                <div style=\"padding:18px 22px 24px 22px;\">
                    <a href=\"{frontend_url}/mantenimientos\" style=\"display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:10px;margin-right:8px;\">Abrir Mantenimientos</a>
                    <a href=\"{frontend_url}/recordatorios\" style=\"display:inline-block;background:#0f172a;color:#93c5fd;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:10px;border:1px solid #334155;margin-right:8px;\">Ver Recordatorios</a>
                    <a href=\"{frontend_url}/reportes\" style=\"display:inline-block;background:#0f172a;color:#93c5fd;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:10px;border:1px solid #334155;\">Ir a Reportes</a>

                    <p style=\"margin:16px 0 0 0;color:#64748b;font-size:12px;\">Mensaje automático de RoadKeeper. Revisa tus módulos para tomar acción preventiva.</p>
                </div>
            </div>
        </div>
        """

        return "\n".join(plain_lines), html_body


def send_email(to_email: str, subject: str, body_text: str, body_html: Optional[str] = None):
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM") or username

    if not host or not sender:
        raise RuntimeError("SMTP no configurado. Define SMTP_HOST y SMTP_FROM (o SMTP_USER).")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email
    msg.set_content(body_text)
    if body_html:
        msg.add_alternative(body_html, subtype="html")

    with smtplib.SMTP(host, port, timeout=20) as server:
        server.ehlo()
        use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
        if use_tls:
            server.starttls()
            server.ehlo()
        if username and password:
            server.login(username, password)
        server.send_message(msg)


@router.get("/pendientes")
def get_pending_notifications(
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    current_user = get_current_user(authorization.replace("Bearer ", "") if authorization else "", db)
    events = compute_user_alerts(db, current_user)
    return {
        "total": len(events),
        "items": events,
    }


@router.post("/enviar-email")
def send_pending_notifications_email(
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    current_user = get_current_user(authorization.replace("Bearer ", "") if authorization else "", db)
    if not current_user.email:
        raise HTTPException(status_code=400, detail="El usuario no tiene email registrado")

    today_key = date.today().isoformat()
    events = compute_user_alerts(db, current_user)

    pending = [
        event for event in events
        if not already_sent_today(db, current_user.id, event["event_key"], "email", today_key)
    ]

    if not pending:
        return {"sent": 0, "message": "No hay notificaciones nuevas para enviar hoy."}

    frontend_url = (os.getenv("FRONTEND_URL") or "http://localhost:5173").rstrip("/")
    text_body, html_body = build_email_content(pending, frontend_url)

    try:
        send_email(
            to_email=current_user.email,
            subject="RoadKeeper | Alertas importantes de tu moto",
            body_text=text_body,
            body_html=html_body,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"No se pudo enviar el correo: {exc}")

    for event in pending:
        mark_sent(db, current_user.id, event.get("moto_id"), event["event_key"], "email", today_key, event["message"])

    db.commit()
    return {
        "sent": len(pending),
        "email": current_user.email,
        "message": "Correo enviado correctamente.",
    }


@router.post("/enviar-email-masivo")
def send_mass_notifications_email(
    cron_secret: str = Header(None, alias="X-Cron-Secret"),
    db: Session = Depends(get_db),
):
    expected = os.getenv("NOTIFICATIONS_CRON_SECRET")
    if not expected:
        raise HTTPException(status_code=503, detail="NOTIFICATIONS_CRON_SECRET no configurado")
    if cron_secret != expected:
        raise HTTPException(status_code=401, detail="Cron secret inválido")

    users = db.query(models.User).all()
    today_key = date.today().isoformat()
    sent_count = 0

    for user in users:
        if not user.email:
            continue

        events = compute_user_alerts(db, user)
        pending = [
            event for event in events
            if not already_sent_today(db, user.id, event["event_key"], "email", today_key)
        ]
        if not pending:
            continue

        frontend_url = (os.getenv("FRONTEND_URL") or "http://localhost:5173").rstrip("/")
        text_body, html_body = build_email_content(pending, frontend_url)

        try:
            send_email(
                to_email=user.email,
                subject="RoadKeeper | Alertas importantes de tu moto",
                body_text=text_body,
                body_html=html_body,
            )
        except Exception:
            continue

        for event in pending:
            mark_sent(db, user.id, event.get("moto_id"), event["event_key"], "email", today_key, event["message"])

        sent_count += len(pending)

    db.commit()
    return {"sent": sent_count, "message": "Proceso masivo ejecutado."}
