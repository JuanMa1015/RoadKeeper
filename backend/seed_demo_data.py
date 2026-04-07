"""
Seed de datos demo para RoadKeeper.

Crea un usuario demo si no existe y agrega motos, mantenimientos y recordatorios
con estados vencido, por vencer y al día, usando placas colombianas realistas.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from database import engine, SessionLocal
import models
from routers.auth_users import hash_password

models.Base.metadata.create_all(bind=engine)


def get_or_create_seed_user(db):
    user = db.query(models.User).order_by(models.User.id.asc()).first()
    if user:
        return user

    user = models.User(
        username="demo_roadkeeper",
        email="demo@roadkeeper.local",
        hashed_password=hash_password("Demo1234!"),
        two_factor_enabled=0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def add_mantenimiento(db, moto, tipo, fecha_vencimiento, km_momento_servicio):
    existing = db.query(models.Mantenimiento).filter(
        models.Mantenimiento.moto_id == moto.id,
        models.Mantenimiento.tipo == tipo,
        models.Mantenimiento.fecha == datetime.combine(fecha_vencimiento, datetime.min.time()),
        models.Mantenimiento.km_momento_servicio == km_momento_servicio,
    ).first()
    if existing:
        return existing

    mantenimiento = models.Mantenimiento(
        moto_id=moto.id,
        tipo=tipo,
        km_momento_servicio=km_momento_servicio,
        fecha=datetime.combine(fecha_vencimiento, datetime.min.time()),
    )
    db.add(mantenimiento)
    return mantenimiento


def add_recordatorio(db, user, moto, tipo, titulo, fecha_vencimiento, descripcion):
    existing = db.query(models.Recordatorio).filter(
        models.Recordatorio.user_id == user.id,
        models.Recordatorio.moto_id == moto.id,
        models.Recordatorio.tipo == tipo,
        models.Recordatorio.titulo == titulo,
    ).first()
    if existing:
        existing.fecha_vencimiento = datetime.combine(fecha_vencimiento, datetime.min.time())
        existing.descripcion = descripcion
        return existing

    recordatorio = models.Recordatorio(
        user_id=user.id,
        moto_id=moto.id,
        tipo=tipo,
        titulo=titulo,
        fecha_vencimiento=datetime.combine(fecha_vencimiento, datetime.min.time()),
        descripcion=descripcion,
    )
    db.add(recordatorio)
    return recordatorio


def main():
    db = SessionLocal()
    try:
        user = get_or_create_seed_user(db)

        motos_data = [
            {
                "placa": "ABC12F",
                "marca": "Yamaha",
                "modelo": "MT-09",
                "kilometraje_actual": 10240,
                "docs": {
                    "SOAT": date(2026, 4, 5),
                    "Tecnomecánica": date(2026, 4, 7),
                },
                "revisiones": [
                    ("Aceite", 5480, date(2026, 3, 18)),
                    ("Frenos", 7900, date(2026, 2, 10)),
                ],
                "recordatorios": [
                    ("revisiones", "Cambio de aceite", date(2026, 4, 10), "Revisión preventiva para aceite y filtro."),
                    ("revisiones", "Revision de frenos", date(2026, 4, 14), "Verificar pastillas y líquido de frenos."),
                ],
            },
            {
                "placa": "JQL84G",
                "marca": "Honda",
                "modelo": "CB 500X",
                "kilometraje_actual": 18750,
                "docs": {
                    "SOAT": date(2026, 4, 20),
                    "Tecnomecánica": date(2026, 7, 12),
                },
                "revisiones": [
                    ("Aceite", 14150, date(2026, 3, 1)),
                    ("Kit Arrastre", 11200, date(2026, 1, 20)),
                ],
                "recordatorios": [
                    ("documentos", "SOAT por vencer", date(2026, 4, 20), "Renovar el SOAT antes de la fecha límite."),
                    ("revisiones", "Revisar kit de arrastre", date(2026, 4, 22), "Cadena, piñón y corona."),
                ],
            },
            {
                "placa": "RKM72D",
                "marca": "Suzuki",
                "modelo": "V-Strom 250",
                "kilometraje_actual": 24500,
                "docs": {
                    "SOAT": date(2026, 1, 15),
                    "Tecnomecánica": date(2026, 6, 1),
                },
                "revisiones": [
                    ("Aceite", 19900, date(2026, 1, 28)),
                    ("Frenos", 16100, date(2025, 12, 18)),
                ],
                "recordatorios": [
                    ("documentos", "SOAT vencido", date(2026, 1, 15), "Documento vencido: requiere renovación inmediata."),
                    ("revisiones", "Chequeo general", date(2026, 4, 6), "Revisión mecánica general por kilometraje."),
                ],
            },
            {
                "placa": "MZP45H",
                "marca": "Kawasaki",
                "modelo": "Z400",
                "kilometraje_actual": 8400,
                "docs": {
                    "SOAT": date(2026, 4, 6),
                    "Tecnomecánica": date(2026, 5, 1),
                },
                "revisiones": [
                    ("Aceite", 3500, date(2026, 2, 20)),
                    ("Frenos", 4200, date(2026, 2, 25)),
                ],
                "recordatorios": [
                    ("documentos", "SOAT vence hoy", date(2026, 4, 6), "Renovación inmediata para circular sin problemas."),
                ],
            },
            {
                "placa": "TQK16E",
                "marca": "Bajaj",
                "modelo": "Dominar 400",
                "kilometraje_actual": 13200,
                "docs": {
                    "SOAT": date(2026, 8, 18),
                    "Tecnomecánica": date(2026, 9, 10),
                },
                "revisiones": [
                    ("Aceite", 8200, date(2026, 3, 28)),
                    ("Kit Arrastre", 6400, date(2026, 2, 14)),
                ],
                "recordatorios": [
                    ("revisiones", "Alineación y tensión", date(2026, 5, 2), "Revisar tensión de cadena y alineación."),
                ],
            },
        ]

        created = 0
        updated = 0

        for data in motos_data:
            moto = db.query(models.Moto).filter(models.Moto.user_id == user.id, models.Moto.placa == data["placa"]).first()
            if not moto:
                moto = models.Moto(
                    user_id=user.id,
                    placa=data["placa"],
                    marca=data["marca"],
                    modelo=data["modelo"],
                    kilometraje_actual=data["kilometraje_actual"],
                )
                db.add(moto)
                db.flush()
                created += 1
            else:
                moto.marca = data["marca"]
                moto.modelo = data["modelo"]
                moto.kilometraje_actual = data["kilometraje_actual"]
                updated += 1

            for tipo, fecha_vencimiento in data["docs"].items():
                add_mantenimiento(db, moto, tipo, fecha_vencimiento, moto.kilometraje_actual)

            for tipo, km_servicio, fecha_servicio in data["revisiones"]:
                add_mantenimiento(db, moto, tipo, fecha_servicio, km_servicio)

            for tipo, titulo, fecha_vencimiento, descripcion in data["recordatorios"]:
                add_recordatorio(db, user, moto, tipo, titulo, fecha_vencimiento, descripcion)

        db.commit()

        print(f"Seed completado. Usuario: {user.username} ({user.email})")
        print(f"Motos creadas: {created} | Motos actualizadas: {updated}")
        print("Placas sembradas: " + ", ".join(item["placa"] for item in motos_data))
    finally:
        db.close()


if __name__ == "__main__":
    main()
