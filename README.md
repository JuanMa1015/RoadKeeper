# RoadKeeper

Sistema de gestión de motos con control de mantenimientos, documentos legales, recordatorios y alertas.

## Canales de notificación

RoadKeeper ahora soporta:

- Correo electrónico (SMTP)
- Push del navegador (Web Notifications)
- Alertas en app (panel de notificaciones)

## Configuración SMTP (backend)

Define estas variables en `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo
SMTP_PASSWORD=tu_password_app
SMTP_FROM=RoadKeeper <tu_correo>
SMTP_USE_TLS=true
NOTIFICATIONS_CRON_SECRET=un_secreto_largo
```

Endpoints relevantes:

- `POST /notificaciones/enviar-email`: envía alertas pendientes del usuario autenticado.
- `GET /notificaciones/pendientes`: devuelve alertas activas para push/web.
- `POST /notificaciones/enviar-email-masivo`: envío masivo para cron (requiere header `X-Cron-Secret`).

## Programar envío automático (opcional)

Puedes ejecutar `POST /notificaciones/enviar-email-masivo` con una tarea programada (cada mañana, por ejemplo) usando el header `X-Cron-Secret`.

## Seguridad

- No subas credenciales reales SMTP al repositorio.
- Usa passwords de aplicación (no contraseña principal del correo).
- Rota credenciales si ya fueron expuestas.
