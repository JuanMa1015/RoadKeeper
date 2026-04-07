import { useEffect, useRef } from 'react';
import api from '../api/axios';

const PUSH_SEEN_KEY = 'rk-push-seen-v1';

function getSeenMap() {
  try {
    const raw = localStorage.getItem(PUSH_SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function setSeenMap(map) {
  localStorage.setItem(PUSH_SEEN_KEY, JSON.stringify(map));
}

export default function NotificationPushWatcher() {
  const runningRef = useRef(false);
  const permissionAskedRef = useRef(false);

  useEffect(() => {
    const poll = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      if (
        !permissionAskedRef.current &&
        'Notification' in window &&
        Notification.permission === 'default'
      ) {
        permissionAskedRef.current = true;
        // Solo se intenta una vez por sesión. Si el navegador lo bloquea, no rompe flujo.
        Notification.requestPermission().catch(() => {});
      }

      if (runningRef.current) return;
      runningRef.current = true;

      try {
        const { data } = await api.get('/notificaciones/pendientes');
        const items = Array.isArray(data?.items) ? data.items : [];
        const seen = getSeenMap();
        const today = new Date().toISOString().slice(0, 10);

        for (const item of items) {
          const key = `${today}|${item.event_key}`;
          if (seen[key]) continue;

          if ('Notification' in window && Notification.permission === 'granted') {
            const title = item.priority === 'ALTA' ? 'RoadKeeper: alerta crítica' : 'RoadKeeper: alerta preventiva';
            new Notification(title, {
              body: item.message,
              tag: key,
              renotify: false,
            });
          }

          seen[key] = 1;
        }

        setSeenMap(seen);
      } catch {
        // No interrumpir UX si falla polling de push.
      } finally {
        runningRef.current = false;
      }
    };

    poll();
    const interval = window.setInterval(poll, 120000);
    return () => window.clearInterval(interval);
  }, []);

  return null;
}
