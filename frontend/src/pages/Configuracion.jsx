import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  setup2FA,
  verify2FASetup,
  disable2FA,
  getCurrentUser,
  updateProfile,
} from '../services/authService';
import { enviarNotificacionesEmail } from '../services/motoService';

function LockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm6-10V7a3 3 0 00-6 0v4a3 3 0 006 0z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

export default function Configuracion() {
  const [has2FA, setHas2FA] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [setupState, setSetupState] = useState(null); // null | "setup_pending"
  const [qrUri, setQrUri] = useState('');
  const [qrImageData, setQrImageData] = useState('');
  const [qrImageError, setQrImageError] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [setupError, setSetupError] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [pendingProfile, setPendingProfile] = useState(null);

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState('password');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyTwoFactorCode, setVerifyTwoFactorCode] = useState('');
  const [verifyError, setVerifyError] = useState('');

  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [profileError, setProfileError] = useState('');
  const [notifSending, setNotifSending] = useState(false);
  const [browserPermission, setBrowserPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => {
      setFeedback((prev) => (prev.message === message ? { type: '', message: '' } : prev));
    }, 3500);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const me = await getCurrentUser();
        setUsername(me.username || '');
        setEmail(me.email || '');
        setNewUsername(me.username || '');
        setNewEmail(me.email || '');
        setHas2FA(Boolean(me.two_factor_enabled));
      } catch (err) {
        setProfileError(err?.response?.data?.detail || 'No fue posible cargar tu perfil.');
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setBrowserPermission('unsupported');
      return;
    }
    setBrowserPermission(Notification.permission);
  }, []);

  useEffect(() => {
    const buildQr = async () => {
      if (!qrUri) {
        setQrImageData('');
        setQrImageError('');
        return;
      }

      try {
        const imageData = await QRCode.toDataURL(qrUri, {
          width: 240,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrImageData(imageData);
        setQrImageError('');
      } catch {
        setQrImageData('');
        setQrImageError('No fue posible generar el QR automáticamente.');
      }
    };

    buildQr();
  }, [qrUri]);

  const extractTotpSecret = () => {
    if (!qrUri) return '';
    try {
      const qrData = new URL(qrUri);
      return qrData.searchParams.get('secret') || '';
    } catch {
      return '';
    }
  };

  const handleStartSetup = async () => {
    setTwoFaLoading(true);
    setSetupError('');
    setQrImageError('');
    try {
      const data = await setup2FA();
      setQrUri(data.otpauth_uri);
      setSetupState('setup_pending');
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || 'Error al generar QR';
      setSetupError(detail);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleConfirmSetup = async () => {
    if (!setupCode || setupCode.length < 6) {
      setSetupError('Ingresa un código válido de 6 dígitos');
      return;
    }

    setTwoFaLoading(true);
    setSetupError('');
    try {
      const secret = extractTotpSecret();
      if (!secret) {
        throw new Error('No se pudo leer el secret del QR. Vuelve a generar la configuración 2FA.');
      }

      await verify2FASetup(secret, setupCode);
      localStorage.setItem('has_2fa', 'true');
      setHas2FA(true);
      setSetupState(null);
      setSetupCode('');
      showFeedback('success', '2FA activado correctamente');
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || 'Código inválido';
      setSetupError(detail);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode || disableCode.length < 6) {
      setDisableError('Ingresa un código válido de 6 dígitos');
      return;
    }

    setTwoFaLoading(true);
    setDisableError('');
    try {
      await disable2FA(disableCode);
      localStorage.setItem('has_2fa', 'false');
      setHas2FA(false);
      setSetupState(null);
      setDisableCode('');
      showFeedback('success', '2FA desactivado correctamente');
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || 'Código inválido';
      setDisableError(detail);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleRequestProfileUpdate = (e) => {
    e.preventDefault();
    setProfileError('');

    const normalizedNewUsername = newUsername.trim();
    const normalizedNewEmail = newEmail.trim();

    if (normalizedNewUsername === username && normalizedNewEmail === email) {
      setProfileError('No hay cambios para guardar.');
      return;
    }

    setPendingProfile({
      newUsername: normalizedNewUsername,
      newEmail: normalizedNewEmail,
    });
    setVerifyMethod(has2FA ? '2fa' : 'password');
    setVerifyPassword('');
    setVerifyTwoFactorCode('');
    setVerifyError('');
    setVerifyModalOpen(true);
  };

  const handleConfirmProfileUpdate = async () => {
    if (!pendingProfile) return;

    if (verifyMethod === 'password' && !verifyPassword.trim()) {
      setVerifyError('Ingresa tu contraseña actual para continuar.');
      return;
    }

    if (verifyMethod === '2fa' && verifyTwoFactorCode.length !== 6) {
      setVerifyError('Ingresa un código 2FA válido de 6 dígitos.');
      return;
    }

    setProfileSubmitting(true);
    setVerifyError('');
    setProfileError('');

    try {
      const result = await updateProfile({
        newUsername: pendingProfile.newUsername,
        newEmail: pendingProfile.newEmail,
        currentPassword: verifyMethod === 'password' ? verifyPassword : '',
        twoFactorCode: verifyMethod === '2fa' ? verifyTwoFactorCode : '',
      });

      setUsername(result.user.username);
      setEmail(result.user.email);
      setNewUsername(result.user.username);
      setNewEmail(result.user.email);

      setVerifyModalOpen(false);
      setPendingProfile(null);
      setVerifyPassword('');
      setVerifyTwoFactorCode('');
      showFeedback('success', 'Datos de cuenta actualizados correctamente');
    } catch (err) {
      const detail = err?.response?.data?.detail || 'No se pudo actualizar el perfil';
      setVerifyError(detail);
    } finally {
      setProfileSubmitting(false);
    }
  };

  const closeVerifyModal = () => {
    setVerifyModalOpen(false);
    setVerifyError('');
    setVerifyPassword('');
    setVerifyTwoFactorCode('');
  };

  const handleCancelSetup = () => {
    setSetupState(null);
    setQrUri('');
    setQrImageData('');
    setQrImageError('');
    setSetupCode('');
    setSetupError('');
  };

  const handleSendNotificationEmail = async () => {
    try {
      setNotifSending(true);
      const result = await enviarNotificacionesEmail();
      showFeedback('success', result?.message || 'Correo de notificaciones enviado.');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      showFeedback('error', typeof detail === 'string' ? detail : 'No se pudo enviar el correo de notificaciones.');
    } finally {
      setNotifSending(false);
    }
  };

  const handleEnableBrowserPush = async () => {
    if (typeof Notification === 'undefined') {
      showFeedback('error', 'Este navegador no soporta notificaciones push.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        showFeedback('success', 'Notificaciones del navegador activadas.');
      } else {
        showFeedback('error', 'Permiso de notificaciones no concedido.');
      }
    } catch {
      showFeedback('error', 'No fue posible solicitar permiso de notificaciones.');
    }
  };

  return (
    <section className="w-full max-w-[1280px] mx-auto min-h-[calc(100vh-180px)] px-3 md:px-4 xl:px-0 pb-8 space-y-5 md:space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Configuración</h1>
        <p className="text-slate-400 mt-2">Administra seguridad y datos de tu cuenta.</p>
      </header>

      {feedback.message && (
        <div className={`rounded-2xl p-4 font-semibold border ${feedback.type === 'success' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-red-500/40 bg-red-500/10 text-red-300'}`}>
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 items-start">
        <article className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-blue-500/20">
                <LockIcon />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Autenticación de dos factores</h2>
                <p className="text-slate-400 text-sm">Protege tu cuenta con un segundo factor de autenticación.</p>
              </div>
            </div>

            {has2FA && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <CheckIcon />
                <span className="text-xs font-bold text-emerald-300">ACTIVADO</span>
              </div>
            )}
          </div>
          {!has2FA && setupState === null && (
            <button
              onClick={handleStartSetup}
              disabled={twoFaLoading}
              className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold transition-all"
            >
              {twoFaLoading ? 'Generando código QR...' : 'Activar autenticación de dos factores'}
            </button>
          )}

          {setupState === 'setup_pending' && (
            <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl flex justify-center">
              {qrImageData ? (
                <img src={qrImageData} alt="QR de autenticación 2FA" className="w-52 h-52" />
              ) : (
                <div className="w-52 h-52 rounded-lg border border-slate-300 bg-slate-100 flex items-center justify-center text-slate-600 text-sm text-center px-4">
                  Preparando código QR...
                </div>
              )}
            </div>

            {qrImageError && (
              <div className="p-3 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                {qrImageError}
              </div>
            )}

            {extractTotpSecret() && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">Código manual (si no puedes escanear)</p>
                <p className="text-sm text-slate-200 break-all font-mono">{extractTotpSecret()}</p>
              </div>
            )}

            <p className="text-slate-300 text-sm text-center">
              Escanea el QR con tu app autenticadora y confirma con el código de 6 dígitos.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Código de confirmación (6 dígitos)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="6"
                placeholder="000000"
                className="w-full px-4 py-3 text-center tracking-[0.2em] bg-slate-950 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white text-lg"
                value={setupCode}
                onChange={(e) => {
                  setSetupCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6));
                  setSetupError('');
                }}
              />
            </div>

            {setupError && (
              <div className="p-3 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                {setupError}
              </div>
            )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleConfirmSetup}
                  disabled={twoFaLoading || setupCode.length < 6}
                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-semibold transition-all"
                >
                  {twoFaLoading ? 'Verificando...' : 'Confirmar y activar'}
                </button>
                <button
                  onClick={handleCancelSetup}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {has2FA && (
            <article className="rounded-2xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">
            <div>
              <h2 className="text-xl font-black text-white">Desactivar 2FA</h2>
              <p className="text-slate-400 text-sm">
                Ingresa un código actual de tu autenticador para desactivar la verificación en dos pasos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Código actual (6 dígitos)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="6"
                placeholder="000000"
                className="w-full px-4 py-3 text-center tracking-[0.2em] bg-slate-950 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white text-lg"
                value={disableCode}
                onChange={(e) => {
                  setDisableCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6));
                  setDisableError('');
                }}
              />
            </div>

            {disableError && (
              <div className="p-3 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                {disableError}
              </div>
            )}

              <button
                onClick={handleDisable}
                disabled={twoFaLoading || disableCode.length < 6}
                className="w-full px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white font-semibold transition-all"
              >
                {twoFaLoading ? 'Desactivando...' : 'Desactivar 2FA'}
              </button>
            </article>
          )}
        </article>

        <article className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
          <div>
            <h2 className="text-xl font-black text-white">Datos de cuenta</h2>
            <p className="text-slate-400 text-sm">Actualiza tu usuario y correo. Te pediremos verificación en el siguiente paso.</p>
          </div>

          {profileError && (
            <div className="p-4 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl">
              {profileError}
            </div>
          )}

          {profileLoading ? (
            <p className="text-slate-400 text-sm">Cargando perfil...</p>
          ) : (
            <form onSubmit={handleRequestProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nuevo usuario</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  disabled={profileSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nuevo correo</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={profileSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={profileSubmitting}
                className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold transition-all"
              >
                {profileSubmitting ? 'Procesando...' : 'Actualizar datos de cuenta'}
              </button>
            </form>
          )}
        </article>

        <article className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
          <div>
            <h2 className="text-xl font-black text-white">Notificaciones</h2>
            <p className="text-slate-400 text-sm">Recibe alertas por correo y en el navegador cuando algo esté por vencer o requiera cambio.</p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">Correo electrónico</p>
                <p className="text-xs text-slate-400">Envía ahora un resumen de alertas pendientes a tu correo registrado.</p>
              </div>
              <button
                onClick={handleSendNotificationEmail}
                disabled={notifSending}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white text-sm font-semibold"
              >
                {notifSending ? 'Enviando...' : 'Enviar ahora'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">Push del navegador</p>
                <p className="text-xs text-slate-400">
                  Estado actual: {browserPermission === 'granted' ? 'Activado' : browserPermission === 'denied' ? 'Bloqueado' : browserPermission === 'unsupported' ? 'No soportado' : 'Pendiente de permiso'}
                </p>
              </div>
              <button
                onClick={handleEnableBrowserPush}
                disabled={browserPermission === 'granted' || browserPermission === 'unsupported'}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white text-sm font-semibold"
              >
                {browserPermission === 'granted' ? 'Activo' : 'Activar push'}
              </button>
            </div>
          </div>
        </article>
      </div>

      {verifyModalOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-xl font-black text-white">Verifica tu identidad</h3>
              <p className="text-slate-400 text-sm mt-1">Confirma con contraseña o código 2FA para aplicar los cambios.</p>
            </div>

            {has2FA && (
              <div className="flex gap-2 rounded-xl bg-slate-800 p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('password');
                    setVerifyError('');
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${verifyMethod === 'password' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  Contraseña
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('2fa');
                    setVerifyError('');
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${verifyMethod === '2fa' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  Código 2FA
                </button>
              </div>
            )}

            {verifyMethod === 'password' ? (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Contraseña actual</label>
                <input
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white"
                  value={verifyPassword}
                  onChange={(e) => setVerifyPassword(e.target.value)}
                  disabled={profileSubmitting}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Código 2FA (6 dígitos)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="000000"
                  className="w-full px-4 py-3 tracking-[0.2em] text-center bg-slate-950 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white"
                  value={verifyTwoFactorCode}
                  onChange={(e) => setVerifyTwoFactorCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                  disabled={profileSubmitting}
                />
              </div>
            )}

            {verifyError && (
              <div className="p-3 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                {verifyError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={handleConfirmProfileUpdate}
                disabled={profileSubmitting}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold transition-all"
              >
                {profileSubmitting ? 'Guardando...' : 'Confirmar cambios'}
              </button>
              <button
                type="button"
                onClick={closeVerifyModal}
                disabled={profileSubmitting}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 text-white font-semibold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
