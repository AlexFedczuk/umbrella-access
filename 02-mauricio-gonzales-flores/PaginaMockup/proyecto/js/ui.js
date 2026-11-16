/* ==========================================================================
   Umbrella Access — componentes de interfaz compartidos
   (estructura con barra lateral, encabezado, insignias, modales y avisos)
   ========================================================================== */
(function () {
  'use strict';
  var UA = (window.UA = window.UA || {});
  var U = UA.U;
  var icon = UA.icon;
  var esc = U.esc;

  var NAV = {
    solicitante: {
      brand: 'UMBRELLA ACCESS', sub: 'Portal del solicitante', section: 'Módulos operativos',
      items: [
        { id: 'panel', label: 'Panel Principal', icon: 'dashboard', href: '#/solicitante/panel', code: '#01' },
        { id: 'solicitar', label: 'Solicitar Turno', icon: 'add', href: '#/solicitante/solicitar', code: '#02' },
        { id: 'turnos', label: 'Mis Turnos', icon: 'calendar', href: '#/solicitante/turnos', code: '#03' },
        { id: 'notificaciones', label: 'Notificaciones', icon: 'bell', href: '#/solicitante/notificaciones', badge: true }
      ]
    },
    seguridad: {
      brand: 'UMBRELLA ACCESS', sub: 'Control de accesos', section: 'Operaciones de guardia',
      items: [
        { id: 'panel', label: 'Panel de Accesos', icon: 'shield', href: '#/seguridad/panel' },
        { id: 'verificar', label: 'Verificar Autorización', icon: 'badge', href: '#/seguridad/verificar' }
      ]
    },
    admin: {
      brand: 'UMBRELLA ADMIN', sub: 'Consola de administración', section: 'Administración',
      items: [
        { id: 'panel', label: 'Panel de Control', icon: 'dashboard', href: '#/admin/panel' },
        { id: 'instalaciones', label: 'Instalaciones y Sectores', icon: 'building', href: '#/admin/instalaciones' },
        { id: 'usuarios', label: 'Usuarios y Permisos', icon: 'users', href: '#/admin/usuarios' }
      ]
    }
  };

  var ROLE_LABEL = { solicitante: 'Solicitante', seguridad: 'Seguridad', admin: 'Administrador' };

  var ui = {
    ROLE_LABEL: ROLE_LABEL,

    /* ------------------------------------------------------------------
       Estructura general de las pantallas internas
       ------------------------------------------------------------------ */
    layout: function (user, route, content) {
      var nav = NAV[user.role];
      var unread = user.role === 'solicitante' ? UA.db.unreadCount(user.id) : 0;
      var items = nav.items.map(function (it) {
        var active = it.id === route.nav;
        var right = '';
        if (it.badge && unread) right = '<span class="nav-badge">' + unread + '</span>';
        else if (it.code) right = '<span class="nav-code">' + it.code + '</span>';
        return '<a class="nav-item' + (active ? ' active' : '') + '" href="' + it.href + '"' + (active ? ' aria-current="page"' : '') + '>' +
          icon(it.icon) + '<span class="nav-label">' + esc(it.label) + '</span>' + right + '</a>';
      }).join('');

      var userExtra = '';
      if (user.role === 'solicitante') {
        userExtra = '<span class="clearance"><span class="dot dot-warn"></span>NIVEL DE ACCESO ' + user.level + '</span>';
      } else {
        userExtra = '<span class="clearance muted">' + esc(user.position) + '</span>';
      }

      var bell = user.role === 'solicitante'
        ? '<a class="icon-btn" href="#/solicitante/notificaciones" title="Notificaciones" aria-label="Notificaciones">' + icon('bell') +
          (unread ? '<span class="icon-dot"></span>' : '') + '</a>'
        : '';

      return '' +
        '<div class="app" id="app-shell">' +
        '<aside class="sidebar" id="sidebar">' +
        '  <div class="sidebar-brand">' +
        '    <img src="assets/logo.svg" alt="Logotipo Umbrella Corporation" class="brand-logo">' +
        '    <div><div class="brand-title">' + nav.brand + '</div><div class="brand-sub">' + esc(nav.sub) + '</div></div>' +
        '  </div>' +
        '  <div class="sidebar-status"><span class="dot dot-ok"></span>SESIÓN ACTIVA // ' + ROLE_LABEL[user.role].toUpperCase() + '</div>' +
        '  <nav class="sidebar-nav" aria-label="Navegación principal">' +
        '    <div class="nav-section">' + esc(nav.section) + '</div>' + items +
        '  </nav>' +
        '  <div class="sidebar-user">' +
        '    <div class="user-row">' +
        '      <div class="avatar">' + esc(U.initials(user.name)) + '</div>' +
        '      <div class="user-meta"><div class="user-name">' + esc(user.name) + '</div>' +
        '        <div class="user-pos">' + esc(user.role === 'solicitante' ? user.position + ' · ' + user.type : ROLE_LABEL[user.role]) + '</div>' + userExtra + '</div>' +
        '    </div>' +
        '    <div class="user-foot"><span class="mono xs muted">#' + esc(user.id) + '</span>' +
        '      <button class="link-btn red" data-action="logout" type="button">' + icon('logout') + ' Cerrar sesión</button></div>' +
        '    <button class="link-btn xs muted reset-link" data-action="reset-demo" type="button">' + icon('refresh') + ' Restablecer datos de demostración</button>' +
        '  </div>' +
        '</aside>' +
        '<div class="sidebar-backdrop" data-action="close-menu"></div>' +
        '<div class="main">' +
        '  <header class="topbar">' +
        '    <button class="icon-btn menu-btn" data-action="toggle-menu" aria-label="Abrir menú" type="button">' + icon('menu') + '</button>' +
        '    <img src="assets/logo.svg" alt="" class="topbar-logo">' +
        '    <div class="crumbs"><span class="muted">INSTALACIONES UMBRELLA</span><span class="sep">/</span><strong>' + esc(route.title.toUpperCase()) + '</strong></div>' +
        '    <div class="topbar-right">' +
        '      <div class="clock"><span class="mono" id="ua-clock">' + ui.clockText() + '</span><span class="clock-sub"><span class="dot dot-ok"></span>' + ROLE_LABEL[user.role].toUpperCase() + '</span></div>' +
        bell +
        '      <div class="avatar avatar-red" title="' + esc(user.name) + '">' + esc(U.initials(user.name)) + '</div>' +
        '    </div>' +
        '  </header>' +
        '  <main class="page" id="page">' + content + '</main>' +
        '</div>' +
        '</div>';
    },

    clockText: function () {
      var d = new Date();
      return U.DAYS_SHORT[d.getDay()] + ' ' + U.pad(d.getDate()) + '/' + U.pad(d.getMonth() + 1) + '/' + d.getFullYear() +
        ' · ' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()) + ':' + U.pad(d.getSeconds());
    },

    pageHeader: function (eyebrow, title, subtitle, right) {
      return '<div class="page-header"><div class="ph-text">' +
        (eyebrow ? '<div class="eyebrow">' + eyebrow + '</div>' : '') +
        '<h1>' + title + '</h1>' + (subtitle ? '<p class="subtitle">' + subtitle + '</p>' : '') +
        '</div>' + (right ? '<div class="ph-right">' + right + '</div>' : '') + '</div>';
    },

    /* ------------------------------------------------------------------
       Insignias de estado
       ------------------------------------------------------------------ */
    badge: function (text, kind, withDot) {
      return '<span class="badge b-' + (kind || 'neutral') + '">' + (withDot ? '<span class="dot"></span>' : '') + esc(text) + '</span>';
    },
    statusBadge: function (status) {
      var map = { Confirmado: 'ok', Pendiente: 'warn', Denegado: 'err', Cancelado: 'err' };
      var label = status === 'Pendiente' ? 'Pendiente' : status;
      return ui.badge(label, map[status] || 'neutral', true);
    },
    authBadge: function (auth) {
      var map = { Autorizado: 'ok', Pendiente: 'warn', Denegado: 'err' };
      return ui.badge(auth.label, map[auth.state], true);
    },
    presenceBadge: function (turn, presence) {
      if (presence === 'Dentro') return ui.badge('Dentro de la instalación', 'ok', true);
      if (presence === 'Finalizado') return ui.badge('Finalizado', 'neutral', false);
      if (turn.status === 'Denegado' || turn.status === 'Cancelado') return ui.badge('Acceso bloqueado', 'err', false);
      if (turn.status === 'Pendiente') return ui.badge('No habilitado', 'neutral', false);
      if (UA.rules.isOver(turn)) return ui.badge('Vencido sin ingreso', 'neutral', false);
      return ui.badge('Pendiente de ingreso', 'warn', false);
    },
    levelBadge: function (n, short) {
      var kind = n >= 4 ? 'red' : n === 3 ? 'warn' : n === 2 ? 'info' : 'neutral';
      return '<span class="badge b-' + kind + ' level">' + (short ? 'Nivel ' + n : esc(UA.rules.levelLabel(n))) + '</span>';
    },

    empty: function (ic, title, text, action) {
      return '<div class="empty">' + icon(ic, 'empty-ico') + '<h3>' + esc(title) + '</h3>' +
        (text ? '<p>' + esc(text) + '</p>' : '') + (action || '') + '</div>';
    },

    /** Mensaje "flash" que sobrevive a una navegación (p. ej. tras crear un turno). */
    setFlash: function (type, text) { UA.state.flash = { type: type, text: text }; },
    takeFlash: function () {
      var f = UA.state.flash;
      UA.state.flash = null;
      if (!f) return '';
      var ic = f.type === 'ok' ? 'check_circle' : f.type === 'warn' ? 'hourglass' : f.type === 'err' ? 'warning' : 'info';
      return '<div class="alert alert-' + f.type + ' flash">' + icon(ic) + '<div>' + esc(f.text) + '</div></div>';
    },

    /* ------------------------------------------------------------------
       Avisos (toasts)
       ------------------------------------------------------------------ */
    toast: function (msg, type) {
      var host = document.getElementById('toasts');
      if (!host) return;
      var el = document.createElement('div');
      var ic = type === 'error' ? 'x_circle' : type === 'warn' ? 'warning' : type === 'info' ? 'info' : 'check_circle';
      el.className = 'toast toast-' + (type || 'ok');
      el.setAttribute('role', 'status');
      el.innerHTML = icon(ic) + '<span>' + esc(msg) + '</span>';
      host.appendChild(el);
      setTimeout(function () { el.classList.add('out'); }, 4200);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4600);
    },

    /* ------------------------------------------------------------------
       Ventanas modales
       opts: { title, body, size, actions: [{label, cls, onClick(close, root)}] }
       ------------------------------------------------------------------ */
    modal: function (opts) {
      var host = document.getElementById('modals');
      var wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML = '<div class="modal ' + (opts.size === 'lg' ? 'modal-lg' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.title) + '">' +
        '<div class="modal-head"><h2>' + opts.title + '</h2><button class="icon-btn" data-close aria-label="Cerrar" type="button">' + icon('x') + '</button></div>' +
        '<div class="modal-body">' + opts.body + '</div>' +
        '<div class="modal-foot"></div></div>';
      var foot = wrap.querySelector('.modal-foot');
      function close() {
        document.removeEventListener('keydown', onKey);
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      }
      function onKey(e) { if (e.key === 'Escape') close(); }
      (opts.actions || []).forEach(function (a) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn ' + (a.cls || 'btn-secondary');
        b.innerHTML = a.label;
        b.addEventListener('click', function () { if (a.onClick) a.onClick(close, wrap); else close(); });
        foot.appendChild(b);
      });
      wrap.addEventListener('click', function (e) {
        if (e.target === wrap || e.target.closest('[data-close]')) close();
      });
      document.addEventListener('keydown', onKey);
      host.appendChild(wrap);
      var focusable = wrap.querySelector('textarea, input, select') || foot.lastChild;
      if (focusable) focusable.focus();
      return { close: close, root: wrap };
    },

    /**
     * Confirmación previa a operaciones importantes.
     * opts: { title, message (html), confirmLabel, danger, input: {label, placeholder, required} }
     * onConfirm(value, close, root) recibe el texto ingresado si se pidió.
     */
    confirm: function (opts, onConfirm) {
      var body = '<div class="confirm-msg">' + opts.message + '</div>';
      if (opts.input) {
        body += '<div class="field mt"><label for="confirm-input">' + esc(opts.input.label) + (opts.input.required ? ' <span class="req">*</span>' : '') + '</label>' +
          '<textarea id="confirm-input" class="input" rows="3" maxlength="200" placeholder="' + esc(opts.input.placeholder || '') + '"></textarea>' +
          '<div class="field-error" id="confirm-error"></div></div>';
      }
      return ui.modal({
        title: opts.title,
        body: body,
        actions: [
          { label: opts.cancelLabel || 'Volver', cls: 'btn-secondary' },
          {
            label: opts.confirmLabel || 'Confirmar',
            cls: opts.danger ? 'btn-danger' : 'btn-primary',
            onClick: function (close, root) {
              var value = '';
              if (opts.input) {
                value = root.querySelector('#confirm-input').value.trim();
                if (opts.input.required && !value) {
                  root.querySelector('#confirm-error').textContent = 'Este campo es obligatorio.';
                  return;
                }
              }
              onConfirm(value, close, root);
            }
          }
        ]
      });
    },

    /** Datos del turno en formato breve (para modales de confirmación). */
    turnSummary: function (t) {
      var s = UA.db.sector(t.sectorId), f = UA.db.facility(t.facilityId), u = UA.db.user(t.userId);
      return '<dl class="kv-list">' +
        '<div><dt>Código</dt><dd class="mono red">#' + esc(t.id) + '</dd></div>' +
        (u ? '<div><dt>Solicitante</dt><dd>' + esc(u.name) + ' <span class="muted">(' + esc(u.type) + ')</span></dd></div>' : '') +
        '<div><dt>Instalación</dt><dd>' + esc(f ? f.name : '-') + '</dd></div>' +
        '<div><dt>Sector</dt><dd>' + esc(s ? s.name : '-') + '</dd></div>' +
        '<div><dt>Fecha</dt><dd>' + esc(U.fmtLong(t.date)) + '</dd></div>' +
        '<div><dt>Horario</dt><dd class="mono">' + t.start + ' - ' + t.end + ' hs</dd></div>' +
        '</dl>';
    }
  };

  UA.ui = ui;
})();
