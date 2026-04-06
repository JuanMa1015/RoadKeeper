import { useState, useEffect } from 'react';
import {
  setup2FA,
  verify2FASetup,
  disable2FA,
  getCurrentUser,
  updateProfile,
} from '../services/authService';

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
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [setupState, setSetupState] = useState(null); // null | "setup_pending"
  const [qrUri, setQrUri] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [setupError, setSetupError] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [profileError, setProfileError] = useState('');

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

  const handleStartSetup = async () => {
    setLoading(true);
    setSetupError('');
    try {
      const data = await setup2FA();
      setQrUri(data.otpauth_uri);
      setSetupState('setup_pending');
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || 'Error al generar QR';
      setSetupError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSetup = async () => {
    if (!setupCode || setupCode.length < 6) {
      setSetupError('Ingresa un código válido de 6 dígitos');
      return;
    }

    setLoading(true);
    setSetupError('');
    try {
      const qrData = new URL(qrUri);
      const secret = qrData.searchParams.get('secret');

      await verify2FASetup(secret, setupCode);
      localStorage.setItem('has_2fa', 'true');
      setHas2FA(true);
      setSetupState(null);
      setSetupCode('');
      setHas2FA(true);
      localStorage.setItem('has_2fa', 'true');
      setSuccessMessage('2FA activado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || 'Código inválido';
      setSetupError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode || disableCode.length < 6) {
      setDisableError('Ingresa un código válido de 6 dígitos');
      return;
    }

    setLoading(true);
    setDisableError('');
    try {
      await disable2FA(disableCode);
      localStorage.setItem('has_2fa', 'false');
      setHas2FA(false);
      setSetupState(null);
      setDisableCode('');
      setSuccessMessage('2FA desactivado correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || 'Código inválido';
      setDisableError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');

    const normalizedNewUsername = newUsername.trim();
    const normalizedNewEmail = newEmail.trim();

    if (normalizedNewUsername === username && normalizedNewEmail === email) {
      setProfileError('No hay cambios para guardar.');
      return;
    }

    if (!currentPassword && !(has2FA && twoFactorCode.length === 6)) {
      setProfileError('Debes validar con contraseña actual o código 2FA.');
      return;
    }

    setLoading(true);

    try {
      const result = await updateProfile({
        newUsername: normalizedNewUsername,
        newEmail: normalizedNewEmail,
        currentPassword,
        twoFactorCode,
      });

      setUsername(result.user.username);
      setEmail(result.user.email);
      setNewUsername(result.user.username);
      setNewEmail(result.user.email);
      setCurrentPassword('');
      setTwoFactorCode('');

      setSuccessMessage('Datos de cuenta actualizados correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setProfileError(err?.response?.data?.detail || 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSetup = () => {
    setSetupState(null);
    setQrUri('');
    setSetupCode('');
    setSetupError('');
  };

  return (
    <section className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Configuración</h1>
        <p className="text-slate-400 mt-2">Administra seguridad y datos de tu cuenta.</p>
      </header>

      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-300 font-semibold">
          ✓ {successMessage}
        </div>
      )}

      <article className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
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
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold transition-all"
          >
            {loading ? 'Generando código QR...' : 'Activar autenticación de dos factores'}
          </button>
        )}

        {setupState === 'setup_pending' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl flex justify-center">
              <img
                src={`https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(qrUri)}`}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>

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
                ⚠️ {setupError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConfirmSetup}
                disabled={loading || setupCode.length < 6}
                className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-semibold transition-all"
              >
                {loading ? 'Verificando...' : 'Confirmar y activar'}
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
          <article className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
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
                ⚠️ {disableError}
              </div>
            )}

            <button
              onClick={handleDisable}
              disabled={loading || disableCode.length < 6}
              className="w-full px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white font-semibold transition-all"
            >
              {loading ? 'Desactivando...' : 'Desactivar 2FA'}
            </button>
          </article>
        )}
      </article>

      <article className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
        <div>
          <h2 className="text-xl font-black text-white">Datos de cuenta</h2>
          <p className="text-slate-400 text-sm">Actualiza tu usuario y correo con verificación de seguridad.</p>
        </div>

        {profileError && (
          <div className="p-4 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl">
            ⚠️ {profileError}
          </div>
        )}

        {profileLoading ? (
          <p className="text-slate-400 text-sm">Cargando perfil...</p>
        ) : (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nuevo usuario</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nuevo correo</label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="pt-2 border-t border-slate-700">
              <p className="text-[11px] text-slate-400 mb-3">
                Verifica identidad con contraseña actual {has2FA ? 'o código 2FA (puedes usar cualquiera).' : '(obligatoria).'}
              </p>

              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Contraseña actual"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                />

                {has2FA && (
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    placeholder="Código 2FA (opcional)"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                    disabled={loading}
                  />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold transition-all"
            >
              {loading ? 'Guardando...' : 'Actualizar datos de cuenta'}
            </button>
          </form>
        )}
      </article>
    </section>
  );
}
