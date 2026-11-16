/* ==========================================================================
   Umbrella Access — autenticación SIMULADA y pantalla de inicio de sesión
   --------------------------------------------------------------------------
   Las credenciales se validan contra los datos locales. No ofrece seguridad
   real: es un prototipo académico sin servidor.
   ========================================================================== */
(function () {
  'use strict';
  var UA = (window.UA = window.UA || {});
  var U = UA.U;
  var icon = UA.icon;
  var esc = U.esc;

  var SKEY = 'umbrellaAccess.session';
  var HOME = { solicitante: '/solicitante/panel', seguridad: '/seguridad/panel', admin: '/admin/panel' };

  function store(kind) {
    try { return kind === 'local' ? window.localStorage : window.sessionStorage; } catch (e) { return null; }
  }
  function readSession() {
    var raw = null;
    var ss = store('session'), ls = store('local');
    try { raw = (ss && ss.getItem(SKEY)) || (ls && ls.getItem(SKEY)); } catch (e) { raw = null; }
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  var auth = {
    HOME: HOME,

    login: function (id, password, remember) {
      id = U.normCode(id);
      if (!id || !password) return { ok: false, error: 'Complete la identificación y la contraseña.' };
      var user = UA.db.user(id);
      if (!user || user.password !== password) return { ok: false, error: 'Identificación o contraseña incorrecta. Verifique los datos e intente nuevamente.' };
      if (user.status !== 'Activo') return { ok: false, error: 'La cuenta se encuentra inactiva. Comuníquese con Administración.' };
      var session = JSON.stringify({ userId: user.id, at: Date.now() });
      auth.logout();
      var target = store(remember ? 'local' : 'session');
      try { if (target) target.setItem(SKEY, session); } catch (e) { /* sin almacenamiento */ }
      UA.state.memorySession = session;
      return { ok: true, user: user };
    },

    logout: function () {
      UA.state.memorySession = null;
      ['local', 'session'].forEach(function (k) {
        var s = store(k);
        try { if (s) s.removeItem(SKEY); } catch (e) { /* ignorar */ }
      });
    },

    /** Usuario autenticado actual (o null). Cierra la sesión si la cuenta fue desactivada. */
    current: function () {
      var s = readSession() || (UA.state.memorySession ? JSON.parse(UA.state.memorySession) : null);
      if (!s) return null;
      var user = UA.db.user(s.userId);
      if (!user || user.status !== 'Activo') { auth.logout(); return null; }
      return user;
    },

    home: function (user) { return HOME[user.role] || '/login'; }
  };

  /* ------------------------------------------------------------------------
     Pantalla: Inicio de sesión (compartida por todos los perfiles)
     ------------------------------------------------------------------------ */
  var DEMO = [
    { id: 'UC-8842-BIO', pwd: 'vance123', profile: 'Solicitante · Empleado' },
    { id: 'VIS-0001-AUD', pwd: 'wesker123', profile: 'Solicitante · Visitante' },
    { id: 'PROV-9041-CRIO', pwd: 'rostova123', profile: 'Solicitante · Proveedor' },
    { id: 'UC-1014-SEC', pwd: 'valentine123', profile: 'Seguridad' },
    { id: 'UC-0002-ADM', pwd: 'ashford123', profile: 'Administrador' }
  ];

  function loginView() {
    var rows = DEMO.map(function (d) {
      var u = UA.db.user(d.id);
      return '<button type="button" class="demo-row" data-id="' + d.id + '" data-pwd="' + d.pwd + '">' +
        '<span class="demo-profile">' + esc(d.profile) + '</span>' +
        '<span class="demo-name">' + esc(u ? u.name : '') + '</span>' +
        '<span class="mono xs">' + d.id + '</span>' +
        '<span class="mono xs muted">' + d.pwd + '</span></button>';
    }).join('');

    return '' +
      '<div class="login-wrap">' +
      ' <div class="login-grid-bg" aria-hidden="true"></div>' +
      ' <div class="login-box">' +
      '  <div class="login-brand">' +
      '   <div class="login-logo"><img src="assets/logo.svg" alt="Logotipo Umbrella Corporation"></div>' +
      '   <h1>UMBRELLA ACCESS</h1>' +
      '   <p>Sistema de Gestión de Turnos y Control de Acceso</p>' +
      '  </div>' +
      '  <div class="card notice-card">' + icon('shield_check', 'red') + '<span>Acceso restringido para personal autorizado de Umbrella Corporation.</span></div>' +
      '  <div class="card login-card">' +
      '   <form id="login-form" novalidate>' +
      '    <div class="field">' +
      '     <label for="login-id">Identificación de Empleado / Solicitante <span class="req">*</span></label>' +
      '     <div class="input-icon">' + icon('badge') + '<input id="login-id" class="input input-lg mono" placeholder="Ej. UC-8842-BIO" autocomplete="username" spellcheck="false"></div>' +
      '    </div>' +
      '    <div class="field">' +
      '     <div class="label-row"><label for="login-pwd">Contraseña <span class="req">*</span></label>' +
      '      <button type="button" class="link-btn xs red" id="forgot-btn">¿Olvidó su contraseña?</button></div>' +
      '     <div class="input-icon">' + icon('lock') + '<input id="login-pwd" type="password" class="input input-lg mono" placeholder="••••••••" autocomplete="current-password">' +
      '      <button type="button" class="pwd-toggle" id="pwd-toggle" aria-label="Mostrar u ocultar contraseña">' + icon('eye') + '</button></div>' +
      '    </div>' +
      '    <label class="check"><input type="checkbox" id="login-remember" checked> <span>Mantener la sesión iniciada en este equipo</span></label>' +
      '    <div class="alert alert-err hidden" id="login-error" role="alert"></div>' +
      '    <button class="btn btn-primary btn-block btn-lg upper" type="submit">' + icon('login') + ' Iniciar sesión</button>' +
      '   </form>' +
      '   <div class="login-help">' +
      '    <span>' + icon('help') + ' ¿Dificultades para ingresar?</span>' +
      '    <button type="button" class="link-btn red" id="support-btn">' + icon('info') + ' Soporte técnico</button>' +
      '   </div>' +
      '   <details class="demo-accounts" id="demo-accounts">' +
      '    <summary>' + icon('flask', 'red') + ' Cuentas de demostración <span class="mono xs muted">Prototipo académico</span></summary>' +
      '    <p class="xs muted">Seleccione una cuenta para completar el formulario y luego presione “Iniciar sesión”.</p>' +
      '    <div class="demo-head"><span>Perfil</span><span>Nombre</span><span>Identificación</span><span>Contraseña</span></div>' +
      '    <div class="demo-list">' + rows + '</div>' +
      '    <div class="demo-foot"><button type="button" class="link-btn xs muted" data-action="reset-demo">' + icon('refresh') + ' Restablecer datos de demostración</button></div>' +
      '   </details>' +
      '  </div>' +
      '  <div class="login-foot mono">© Umbrella Corporation · Prototipo académico — Metodología de Sistemas I</div>' +
      ' </div>' +
      '</div>';
  }

  function mountLogin(root) {
    var form = root.querySelector('#login-form');
    var idInput = root.querySelector('#login-id');
    var pwdInput = root.querySelector('#login-pwd');
    var errorBox = root.querySelector('#login-error');

    function showError(msg) {
      errorBox.innerHTML = icon('warning') + '<div>' + esc(msg) + '</div>';
      errorBox.classList.remove('hidden');
    }

    root.querySelector('#pwd-toggle').addEventListener('click', function () {
      var show = pwdInput.type === 'password';
      pwdInput.type = show ? 'text' : 'password';
      this.innerHTML = icon(show ? 'eye_off' : 'eye');
    });
    root.querySelector('#forgot-btn').addEventListener('click', function () {
      UA.ui.toast('La recuperación de contraseña se gestiona con Administración. Consulte las cuentas de demostración.', 'info');
    });
    root.querySelector('#support-btn').addEventListener('click', function () {
      UA.ui.toast('Soporte técnico: comuníquese con la Mesa Central de Seguridad (simulado).', 'info');
    });
    Array.prototype.forEach.call(root.querySelectorAll('.demo-row'), function (b) {
      b.addEventListener('click', function () {
        idInput.value = b.getAttribute('data-id');
        pwdInput.value = b.getAttribute('data-pwd');
        errorBox.classList.add('hidden');
        idInput.classList.remove('invalid');
        pwdInput.classList.remove('invalid');
        form.querySelector('button[type=submit]').focus();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      idInput.classList.toggle('invalid', !idInput.value.trim());
      pwdInput.classList.toggle('invalid', !pwdInput.value);
      var res = auth.login(idInput.value, pwdInput.value, root.querySelector('#login-remember').checked);
      if (!res.ok) { showError(res.error); return; }
      UA.ui.toast('Bienvenido/a, ' + res.user.name + '.', 'ok');
      UA.app.go(auth.home(res.user));
    });
    idInput.focus();
  }

  UA.auth = auth;
  UA.views = UA.views || {};
  UA.views.login = function () { return { html: loginView(), mount: mountLogin }; };
})();
