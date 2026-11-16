/* ==========================================================================
   Umbrella Access — enrutador y arranque de la aplicación
   --------------------------------------------------------------------------
   Navegación por "hash" (#/ruta), compatible con file://.
   Cada ruta declara el perfil autorizado: si se intenta abrir una sección
   de otro perfil (incluso escribiendo la dirección), se bloquea.
   ========================================================================== */
(function () {
  'use strict';
  var UA = (window.UA = window.UA || {});
  var V = UA.views;

  var ROUTES = [
    { re: /^\/solicitante\/panel$/, role: 'solicitante', nav: 'panel', title: 'Panel Principal', view: V.solPanel },
    { re: /^\/solicitante\/solicitar$/, role: 'solicitante', nav: 'solicitar', title: 'Solicitar Turno', view: V.solSolicitar },
    { re: /^\/solicitante\/turnos$/, role: 'solicitante', nav: 'turnos', title: 'Mis Turnos', view: V.solTurnos },
    { re: /^\/solicitante\/turno\/([^/]+)$/, role: 'solicitante', nav: 'turnos', title: 'Detalle del Turno', view: V.solDetalle },
    { re: /^\/solicitante\/reprogramar\/([^/]+)$/, role: 'solicitante', nav: 'turnos', title: 'Reprogramar Turno', view: V.solReprogramar },
    { re: /^\/solicitante\/notificaciones$/, role: 'solicitante', nav: 'notificaciones', title: 'Notificaciones', view: V.solNotificaciones },
    { re: /^\/seguridad\/panel$/, role: 'seguridad', nav: 'panel', title: 'Control de Accesos', view: V.secPanel },
    { re: /^\/seguridad\/verificar(?:\/([^/]+))?$/, role: 'seguridad', nav: 'verificar', title: 'Verificación de Autorización', view: V.secVerificar },
    { re: /^\/admin\/panel$/, role: 'admin', nav: 'panel', title: 'Panel de Administración', view: V.admPanel },
    { re: /^\/admin\/instalaciones$/, role: 'admin', nav: 'instalaciones', title: 'Instalaciones y Sectores', view: V.admInstalaciones },
    { re: /^\/admin\/usuarios$/, role: 'admin', nav: 'usuarios', title: 'Usuarios y Autorizaciones', view: V.admUsuarios }
  ];

  var root;
  var lastPath = null;

  function currentPath() {
    var h = window.location.hash.replace(/^#/, '');
    return h || '/login';
  }

  var app = {
    /** Navega a una ruta (sin agregar pasos innecesarios al historial al redirigir). */
    go: function (path, replace) {
      if ('#' + path === window.location.hash) { app.render(); return; }
      if (replace) window.location.replace('#' + path);
      else window.location.hash = path;
    },
    refresh: function () { app.render(true); },

    render: function (keepScroll) {
      var path = currentPath();
      var user = UA.auth.current();
      var scroll = window.scrollY;
      document.getElementById('modals').innerHTML = '';
      document.body.classList.remove('menu-open');

      if (path === '/login') {
        if (user) { app.go(UA.auth.home(user), true); return; }
        document.title = 'Iniciar sesión · Umbrella Access';
        var lv = V.login();
        root.innerHTML = lv.html;
        lv.mount(root);
        lastPath = path;
        return;
      }
      if (!user) {
        if (lastPath !== null) UA.ui.toast('Su sesión no está iniciada. Ingrese sus credenciales.', 'info');
        app.go('/login', true);
        return;
      }
      var route = null, params = [];
      for (var i = 0; i < ROUTES.length; i++) {
        var m = ROUTES[i].re.exec(path);
        if (m) { route = ROUTES[i]; params = m.slice(1).filter(function (x) { return x !== undefined; }); break; }
      }
      if (!route) {
        UA.ui.toast('La sección solicitada no existe. Se redirigió a su panel.', 'warn');
        app.go(UA.auth.home(user), true);
        return;
      }
      if (route.role !== user.role) {
        UA.ui.toast('Acceso denegado: la sección no corresponde al perfil ' + UA.ui.ROLE_LABEL[user.role] + '.', 'error');
        app.go(UA.auth.home(user), true);
        return;
      }
      var view = route.view(user, params);
      document.title = route.title + ' · Umbrella Access';
      root.innerHTML = UA.ui.layout(user, route, view.html);
      if (view.mount) view.mount(document.getElementById('page'));
      if (keepScroll && path === lastPath) window.scrollTo(0, scroll);
      else window.scrollTo(0, 0);
      lastPath = path;
    }
  };
  UA.app = app;

  /* ---- Acciones globales (cerrar sesión, menú móvil, restablecer datos) ---- */
  function onGlobalClick(e) {
    var el = e.target.closest('[data-action]');
    if (!el) {
      // Cerrar el menú lateral en móviles al elegir una opción
      if (e.target.closest('.sidebar .nav-item')) document.body.classList.remove('menu-open');
      return;
    }
    var action = el.getAttribute('data-action');
    if (action === 'logout') {
      UA.ui.confirm({ title: 'Cerrar sesión', message: '<p>¿Desea cerrar la sesión actual?</p>', confirmLabel: UA.icon('logout') + ' Cerrar sesión' }, function (_, close) {
        close();
        UA.auth.logout();
        UA.state.wizard = null;
        UA.state.resched = null;
        UA.ui.toast('Sesión cerrada correctamente.', 'ok');
        app.go('/login');
      });
    } else if (action === 'toggle-menu') {
      document.body.classList.toggle('menu-open');
    } else if (action === 'close-menu') {
      document.body.classList.remove('menu-open');
    } else if (action === 'reset-demo') {
      e.preventDefault();
      UA.ui.confirm({
        title: 'Restablecer datos de demostración',
        message: '<p>Se eliminarán todos los cambios realizados (turnos, ingresos, notificaciones, configuraciones y permisos) y se cargarán nuevamente los datos iniciales.</p><p class="muted sm">La sesión actual se mantiene.</p>',
        confirmLabel: UA.icon('refresh') + ' Restablecer datos',
        danger: true
      }, function (_, close) {
        close();
        UA.db.reset();
        UA.state.wizard = null; UA.state.resched = null; UA.state.myTurns = null; UA.state.sec = null;
        UA.state.inst = null; UA.state.users = null; UA.state.notif = null;
        UA.ui.toast('Datos de demostración restablecidos.', 'ok');
        app.refresh();
      });
    }
  }

  function start() {
    root = document.getElementById('app');
    UA.db.data(); // inicializa los datos si es la primera ejecución
    window.addEventListener('hashchange', function () { app.render(); });
    document.addEventListener('click', onGlobalClick);
    // Si otra pestaña modifica los datos, se recargan y se vuelve a dibujar.
    window.addEventListener('storage', function (e) {
      if (e.key === UA.db.KEY || e.key === null) { UA.db.invalidate(); if (!document.querySelector('.modal-backdrop')) app.refresh(); }
      else if (e.key === 'umbrellaAccess.session') app.render();
    });
    setInterval(function () {
      var c = document.getElementById('ua-clock');
      if (c) c.textContent = UA.ui.clockText();
    }, 1000);
    app.render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
