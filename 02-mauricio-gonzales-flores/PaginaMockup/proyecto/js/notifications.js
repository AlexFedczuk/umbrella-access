/* ==========================================================================
   Umbrella Access — Centro de Notificaciones (perfil Solicitante)
   Las notificaciones son internas: no se envían correos ni mensajes externos.
   ========================================================================== */
(function () {
  'use strict';
  var UA = (window.UA = window.UA || {});
  var U = UA.U, db = UA.db, ui = UA.ui, icon = UA.icon, esc = U.esc;

  var TYPES = {
    confirmacion: { label: 'Confirmación', icon: 'calendar_check', kind: 'ok', cat: 'confirmaciones' },
    pendiente: { label: 'En revisión', icon: 'hourglass', kind: 'warn', cat: 'solicitudes' },
    aprobacion: { label: 'Aprobación', icon: 'shield_check', kind: 'ok', cat: 'solicitudes' },
    rechazo: { label: 'Rechazo', icon: 'x_circle', kind: 'err', cat: 'solicitudes' },
    autorizacion: { label: 'Autorización', icon: 'key', kind: 'info', cat: 'solicitudes' },
    cancelacion: { label: 'Cancelación', icon: 'calendar_x', kind: 'err', cat: 'modificaciones' },
    reprogramacion: { label: 'Reprogramación', icon: 'edit_calendar', kind: 'info', cat: 'modificaciones' },
    aviso: { label: 'Aviso de aforo', icon: 'warning', kind: 'warn', cat: 'avisos' }
  };
  var FILTERS = [
    { id: 'todas', label: 'Todas' },
    { id: 'noleidas', label: 'No leídas' },
    { id: 'confirmaciones', label: 'Confirmaciones' },
    { id: 'solicitudes', label: 'Solicitudes y autorizaciones' },
    { id: 'modificaciones', label: 'Cancelaciones y reprogramaciones' }
  ];

  function matches(n, f) {
    if (f === 'todas') return true;
    if (f === 'noleidas') return !n.read;
    return (TYPES[n.type] || {}).cat === f;
  }

  /** Resalta los códigos de turno dentro del texto. */
  function highlight(text) {
    return esc(text).replace(/(TUR-\d{4}-\d{4})/g, '<span class="mono red strong">#$1</span>');
  }

  function view(user) {
    var st = UA.state.notif || (UA.state.notif = { filter: 'todas' });
    var html = ui.pageHeader('REGISTRO DE ACTIVIDAD // SOLICITANTE', 'Centro de Notificaciones',
      'Avisos del sistema sobre confirmaciones, cambios de autorización y estado de sus turnos de acceso.',
      '<button type="button" class="btn btn-secondary" data-act="all">' + icon('done_all') + ' Marcar todas como leídas</button>') +
      '<div class="tabs card tabs-bar" id="nt-tabs" role="tablist"></div>' +
      '<div class="stack" id="nt-list"></div>' +
      '<p class="xs muted center mt">' + icon('info') + ' Las notificaciones son internas del sistema: no se envían correos electrónicos ni mensajes externos.</p>';

    function mount(root) {
      function render() {
        var all = db.notifications(user.id);
        root.querySelector('#nt-tabs').innerHTML = FILTERS.map(function (f) {
          var n = all.filter(function (x) { return matches(x, f.id); }).length;
          return '<button type="button" role="tab" class="tab' + (st.filter === f.id ? ' active' : '') + '" data-filter="' + f.id + '">' +
            esc(f.label) + ' <span class="count' + (f.id === 'noleidas' && n ? ' count-red' : '') + '">' + n + '</span></button>';
        }).join('');
        var list = all.filter(function (x) { return matches(x, st.filter); });
        root.querySelector('#nt-list').innerHTML = list.length ? list.map(function (n) {
          var t = TYPES[n.type] || TYPES.aviso;
          var turn = n.turnId ? db.turn(n.turnId) : null;
          var link = turn && turn.userId === user.id
            ? '<a class="link red" href="#/solicitante/turno/' + turn.id + '" data-open="' + n.id + '">Ver detalle del turno ' + icon('arrow_right') + '</a>' : '';
          return '<article class="card notif' + (n.read ? ' read' : ' unread') + '">' +
            '<div class="notif-ico n-' + t.kind + '">' + icon(t.icon) + '</div>' +
            '<div class="notif-body"><div class="notif-head"><span class="label-sm ' + t.kind + '-text">' + t.label + '</span>' +
            (n.read ? '' : ui.badge('No leída', 'red')) + '<span class="xs muted">• ' + esc(U.relative(n.at)) + '</span></div>' +
            '<h3>' + esc(n.title) + '</h3><p>' + highlight(n.message) + '</p>' +
            '<div class="notif-actions">' + link +
            (n.read ? '<span class="xs muted">' + icon('check') + ' Leída</span>' : '<button type="button" class="link-btn" data-read="' + n.id + '">' + icon('check') + ' Marcar como leída</button>') +
            '</div></div></article>';
        }).join('') : '<div class="card">' + ui.empty('bell_off', 'No hay notificaciones en este filtro', 'No posee avisos registrados bajo este criterio.') + '</div>';
      }
      root.addEventListener('click', function (e) {
        var f = e.target.closest('[data-filter]');
        if (f) { st.filter = f.dataset.filter; render(); return; }
        var r = e.target.closest('[data-read]');
        if (r) { db.markRead(r.dataset.read, user.id); UA.app.refresh(); return; }
        var o = e.target.closest('[data-open]');
        if (o) { db.markRead(o.dataset.open, user.id); return; }
        if (e.target.closest('[data-act="all"]')) {
          var n = db.markAllRead(user.id);
          ui.toast(n ? U.plural(n, 'notificación marcada', 'notificaciones marcadas') + ' como leída' + (n === 1 ? '' : 's') + '.' : 'No hay notificaciones pendientes de lectura.', n ? 'ok' : 'info');
          UA.app.refresh();
        }
      });
      render();
    }
    return { html: html, mount: mount };
  }

  UA.views = UA.views || {};
  UA.views.solNotificaciones = view;
})();
