/* ==========================================================================
   Umbrella Access — pantallas del perfil ADMINISTRADOR
   Panel de Administración · Instalaciones y Sectores · Usuarios y Autorizaciones
   ========================================================================== */
(function () {
  'use strict';
  var UA = (window.UA = window.UA || {});
  var U = UA.U, db = UA.db, R = UA.rules, ui = UA.ui, icon = UA.icon, esc = U.esc;

  function byDate(a, b) { return (a.date + a.start).localeCompare(b.date + b.start); }

  /* ========================================================================
     Aprobación / rechazo (compartido por la tabla y el modal "Revisar")
     ======================================================================== */
  function approve(admin, turnId, after) {
    var t = db.turn(turnId);
    ui.confirm({
      title: 'Aprobar solicitud',
      message: '<p>La solicitud pasará a estado <strong>Confirmado</strong> y se notificará al solicitante.</p>' + ui.turnSummary(t),
      confirmLabel: icon('check') + ' Aprobar'
    }, function (_, close) {
      var r = R.approveTurn(turnId, admin.id);
      close();
      if (!r.ok) { ui.toast(r.error, 'error'); return; }
      ui.toast('Solicitud #' + turnId + ' aprobada. Se notificó al solicitante.', 'ok');
      if (after) after();
      UA.app.refresh();
    });
  }
  function reject(admin, turnId, after) {
    var t = db.turn(turnId);
    ui.confirm({
      title: 'Rechazar solicitud',
      message: '<p>La solicitud pasará a estado <strong>Denegado</strong>, se liberará el cupo y se notificará al solicitante.</p>' + ui.turnSummary(t),
      confirmLabel: icon('x') + ' Rechazar',
      danger: true,
      input: { label: 'Motivo del rechazo (se informa al solicitante)', placeholder: 'Ej.: El sector no admite visitas en esa fecha.', required: false }
    }, function (note, close) {
      var r = R.rejectTurn(turnId, admin.id, note);
      close();
      if (!r.ok) { ui.toast(r.error, 'error'); return; }
      ui.toast('Solicitud #' + turnId + ' rechazada. Se notificó al solicitante.', 'ok');
      if (after) after();
      UA.app.refresh();
    });
  }

  function review(admin, turnId) {
    var t = db.turn(turnId), u = db.user(t.userId), s = db.sector(t.sectorId);
    var ev = R.evaluateAccess(u, s);
    var used = R.slotUsed(s.id, t.date, t.start, t.id);
    var userSectors = u.sectors.length ? u.sectors.map(function (id) { var x = db.sector(id); return '<span class="chip' + (id === s.id ? ' chip-ok' : '') + '">' + esc(x ? x.name : id) + '</span>'; }).join('') : '<span class="muted xs">Sin sectores habilitados</span>';
    var hist = t.history.slice().reverse().map(function (h) { return '<li><span class="mono xs muted">' + esc(U.fmtTs(h.at)) + '</span><span>' + esc(h.text) + '</span></li>'; }).join('');
    var body = ui.turnSummary(t) +
      '<dl class="kv-list compact"><div><dt>Motivo</dt><dd>' + esc(t.reason) + (t.detail ? ' — ' + esc(t.detail) : '') + '</dd></div>' +
      '<div><dt>Nivel del solicitante</dt><dd>' + esc(R.levelLabel(u.level)) + '</dd></div>' +
      '<div><dt>Nivel requerido</dt><dd>' + esc(R.levelLabel(s.level)) + (s.requiresApproval ? ' · exige aprobación' : '') + '</dd></div>' +
      '<div><dt>Ocupación de la franja</dt><dd class="mono">' + (used + 1) + ' / ' + s.capacity + ' reservas (incluida esta)</dd></div>' +
      '<div><dt>Evaluación</dt><dd>' + (ev.allowed ? ui.badge(ev.reason, ev.mode === 'auto' ? 'ok' : 'warn') : ui.badge(ev.reason, 'err')) + '</dd></div></dl>' +
      '<div class="label-sm mt">Sectores habilitados del solicitante</div><div class="chips">' + userSectors + '</div>' +
      '<div class="label-sm mt">Historial</div><ul class="timeline compact">' + hist + '</ul>';
    var m = ui.modal({
      title: 'Revisión de solicitud #' + esc(t.id),
      body: body,
      size: 'lg',
      actions: [
        { label: 'Cerrar', cls: 'btn-secondary' },
        { label: icon('x') + ' Rechazar', cls: 'btn-danger-soft', onClick: function (close) { close(); reject(admin, t.id); } },
        { label: icon('check') + ' Aprobar', cls: 'btn-success', onClick: function (close) { close(); approve(admin, t.id); } }
      ]
    });
    return m;
  }

  /* ========================================================================
     PANEL DE ADMINISTRACIÓN
     ======================================================================== */
  function panelView(admin) {
    var today = U.today();
    var todays = db.turns(function (t) { return t.date === today && R.ACTIVE.indexOf(t.status) >= 0; });
    var confirmedToday = todays.filter(function (t) { return t.status === 'Confirmado'; });
    var finishedToday = confirmedToday.filter(function (t) { return R.presence(t) === 'Finalizado'; });
    var pending = db.turns(function (t) { return t.status === 'Pendiente'; }).sort(byDate);
    var activeFac = db.facilities().filter(function (f) { return f.status === 'Operativo'; });
    var recToday = db.records(function (r) { return U.toISO(new Date(r.at)) === today; });
    var inToday = recToday.filter(function (r) { return r.type === 'Ingreso'; });
    var outToday = recToday.filter(function (r) { return r.type === 'Egreso'; });
    var last = recToday.sort(function (a, b) { return b.at - a.at; })[0];
    var sectorsCount = db.sectors().length;
    var usersCount = db.users().length;

    var rows = pending.map(function (t) {
      var u = db.user(t.userId), s = db.sector(t.sectorId), f = db.facility(t.facilityId);
      var ev = R.evaluateAccess(u, s);
      var expired = R.isOver(t);
      return '<tr><td><div class="person-cell"><span class="avatar avatar-sm">' + esc(U.initials(u.name)) + '</span><div><div class="strong">' + esc(u.name) + '</div>' +
        '<div class="xs muted">' + esc(u.type) + ' // ' + esc(u.position) + '</div></div></div></td>' +
        '<td><div class="strong sm">' + esc(f.short) + '</div><div class="xs muted">' + esc(s.name) + '</div></td>' +
        '<td class="nowrap">' + esc(U.fmtShort(t.date)) + '</td>' +
        '<td class="mono sm nowrap">' + t.start + ' - ' + t.end + '</td>' +
        '<td>' + ui.levelBadge(s.level, true) + '</td>' +
        '<td>' + (expired ? ui.badge('Vencida', 'neutral') : ui.badge('En revisión', 'warn', true)) + '<div class="xs muted mt-xs">' + esc(ev.reason) + '</div></td>' +
        '<td class="right"><div class="row-actions">' +
        '<button type="button" class="btn btn-success btn-sm" data-approve="' + t.id + '"' + (expired ? ' disabled title="La franja ya finalizó"' : '') + '>' + icon('check') + ' Aprobar</button>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-reject="' + t.id + '">' + icon('x') + ' Rechazar</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-review="' + t.id + '">Revisar</button></div></td></tr>';
    }).join('');

    var html = ui.pageHeader('<span class="red">● CONSOLA CENTRAL OPERATIVA</span> // DIRECTIVA CORPORATIVA', 'Panel de Administración',
      'Visión general operativa, gestión de instalaciones y control de solicitudes corporativas de acceso.') +
      '<div class="stats-4">' +
      ' <div class="card stat"><div class="stat-head"><span class="label-sm">Programación activa</span><span class="stat-ico">' + icon('calendar') + '</span></div>' +
      '  <div class="stat-value">' + todays.length + '</div><div class="stat-cap">Total de turnos del día</div>' +
      '  <div class="stat-sub"><span><span class="dot dot-ok"></span>Confirmados: <strong>' + confirmedToday.length + '</strong></span><span><span class="dot"></span>Finalizados: <strong>' + finishedToday.length + '</strong></span></div></div>' +
      ' <div class="card stat"><div class="stat-head"><span class="label-sm">Atención requerida</span><span class="stat-ico amber-bg">' + icon('hourglass') + '</span></div>' +
      '  <div class="stat-value">' + pending.length + '</div><div class="stat-cap">Solicitudes pendientes</div>' +
      '  <div class="stat-sub">' + (pending.length ? '<span class="amber">' + icon('warning') + ' Requieren dictamen</span>' : '<span class="green">' + icon('check_circle') + ' Sin solicitudes en espera</span>') + '</div></div>' +
      ' <div class="card stat"><div class="stat-head"><span class="label-sm">Infraestructura</span><span class="stat-ico">' + icon('building') + '</span></div>' +
      '  <div class="stat-value">' + activeFac.length + '</div><div class="stat-cap">Instalaciones activas</div>' +
      '  <div class="stat-sub xs">' + esc(activeFac.map(function (f) { return f.short; }).join(' / ')) + '</div></div>' +
      ' <div class="card stat"><div class="stat-head"><span class="label-sm">Control manual de guardia</span><span class="stat-ico green-bg">' + icon('person_check') + '</span></div>' +
      '  <div class="stat-value">' + inToday.length + '</div><div class="stat-cap">Accesos registrados hoy</div>' +
      '  <div class="stat-sub"><span>Egresos: <strong>' + outToday.length + '</strong></span><span>' + (last ? 'Último: ' + U.fmtClock(last.at) + ' hs' : 'Sin movimientos') + '</span></div></div>' +
      '</div>' +
      '<div class="section-title">' + icon('tune', 'red') + '<h2>Accesos directos a funciones administrativas</h2><span class="label-sm muted">2 módulos principales</span></div>' +
      '<div class="grid-2">' +
      ' <a class="card shortcut" href="#/admin/instalaciones"><span class="stat-ico red-soft">' + icon('building') + '</span><h3>Gestión de Instalaciones y Sectores</h3>' +
      '  <p class="muted">Configurar capacidad máxima, horarios de acceso y nivel de autorización requerido por sector.</p>' +
      '  <div class="shortcut-foot"><span class="label-sm">' + sectorsCount + ' sectores registrados</span><span class="link red">Administrar instalaciones ' + icon('arrow_right') + '</span></div></a>' +
      ' <a class="card shortcut" href="#/admin/usuarios"><span class="stat-ico red-soft">' + icon('users') + '</span><h3>Usuarios y Autorizaciones</h3>' +
      '  <p class="muted">Gestionar niveles de autorización (1 a 4) y sectores habilitados de empleados, visitantes y proveedores.</p>' +
      '  <div class="shortcut-foot"><span class="label-sm">' + usersCount + ' perfiles registrados</span><span class="link red">Gestionar usuarios ' + icon('arrow_right') + '</span></div></a>' +
      '</div>' +
      '<section class="card table-card">' +
      ' <div class="card-title pad"><div><h3>Solicitudes que requieren aprobación administrativa</h3><p class="xs muted">Accesos sujetos a verificación antes de su confirmación. La resolución se notifica al solicitante.</p></div>' +
      ui.badge(pending.length + ' en cola', pending.length ? 'warn' : 'neutral') + '</div>' +
      ' <div class="table-wrap"><table class="table"><thead><tr><th>Solicitante</th><th>Instalación y sector</th><th>Fecha programada</th><th>Franja horaria</th><th>Nivel req.</th><th>Estado actual</th><th class="right">Acciones de resolución</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="7">' + ui.empty('check_circle', 'No hay solicitudes pendientes', 'Todas las solicitudes fueron resueltas.') + '</td></tr>') +
      ' </tbody></table></div>' +
      ' <div class="table-foot">Mostrando <strong>' + pending.length + '</strong> ' + (pending.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes') + ' de validación</div>' +
      '</section>';

    function mount(root) {
      root.addEventListener('click', function (e) {
        var a = e.target.closest('[data-approve]');
        if (a && !a.disabled) { approve(admin, a.dataset.approve); return; }
        var r = e.target.closest('[data-reject]');
        if (r) { reject(admin, r.dataset.reject); return; }
        var v = e.target.closest('[data-review]');
        if (v) review(admin, v.dataset.review);
      });
    }
    return { html: html, mount: mount };
  }

  /* ========================================================================
     GESTIÓN DE INSTALACIONES Y SECTORES
     ======================================================================== */
  function hoursText(s) {
    return s.open === '00:00' && s.close === '24:00' ? '24 horas' : s.open + ' a ' + s.close + ' hs';
  }
  function activeReservations(sectorId) {
    return db.turns(function (t) { return t.sectorId === sectorId && R.ACTIVE.indexOf(t.status) >= 0; })
      .filter(function (t) { return !R.isOver(t) && R.presence(t) !== 'Finalizado'; }).length;
  }

  function instalacionesView(admin) {
    var st = UA.state.inst || (UA.state.inst = { q: '', fac: '', level: '', status: 'Todos', selected: null });

    var facCards = db.facilities().map(function (f) {
      var secs = db.sectors(f.id);
      var enabled = secs.filter(function (s) { return s.status === 'Habilitado'; });
      var cap = enabled.reduce(function (a, s) { return a + s.capacity; }, 0);
      var occ = secs.reduce(function (a, s) { return a + R.occupancy(s.id); }, 0);
      var pct = cap ? Math.round(occ / cap * 100) : 0;
      return '<div class="card fac-card"><div class="fac-head"><span class="label-sm">' + icon('building', 'red') + esc(f.kind) + '</span>' + ui.badge(f.status, 'ok') + '</div>' +
        '<h3>' + esc(f.name) + '</h3><p class="xs muted">' + U.plural(secs.length, 'sector configurado', 'sectores configurados') + ' • ' + enabled.length + ' habilitados • ' + esc(f.location) + '</p>' +
        '<div class="bar-row"><span class="label-sm">Ocupación actual</span><span class="mono xs"><strong>' + pct + '%</strong> (' + occ + '/' + cap + ')</span></div>' +
        '<div class="bar"><span style="width:' + Math.min(100, pct) + '%"></span></div></div>';
    }).join('');

    var facOpts = '<option value="">Todas las instalaciones</option>' + db.facilities().map(function (f) {
      return '<option value="' + f.id + '"' + (st.fac === f.id ? ' selected' : '') + '>' + esc(f.name) + '</option>';
    }).join('');
    var levelOpts = '<option value="">Nivel de autorización (todos)</option>' + [1, 2, 3, 4].map(function (n) {
      return '<option value="' + n + '"' + (String(st.level) === String(n) ? ' selected' : '') + '>' + esc(R.levelLabel(n)) + '</option>';
    }).join('');

    var html = ui.pageHeader('<span class="red">● MÓDULO DE CONTROL DE INFRAESTRUCTURA</span>', 'Gestión de Instalaciones y Sectores',
      'Administración de capacidades máximas, horarios habilitados y requisitos de nivel de autorización por sector.') +
      '<div class="stats-3">' + facCards + '</div>' +
      '<section class="card filters">' +
      ' <div class="input-icon grow">' + icon('search') + '<input id="in-q" class="input" placeholder="Buscar por sector o código…" value="' + esc(st.q) + '"></div>' +
      ' <select id="in-fac" class="input input-sm" aria-label="Instalación">' + facOpts + '</select>' +
      ' <select id="in-level" class="input input-sm" aria-label="Nivel de autorización">' + levelOpts + '</select>' +
      ' <div class="tabs" id="in-tabs"></div></section>' +
      '<div class="grid-main-side">' +
      ' <section class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Sector y código</th><th>Instalación</th><th>Capacidad y ocupación</th><th>Horarios habilitados</th><th>Nivel req.</th><th>Estado</th><th></th></tr></thead>' +
      ' <tbody id="in-rows"></tbody></table></div><div class="table-foot" id="in-foot"></div></section>' +
      ' <aside id="in-config"></aside>' +
      '</div>';

    function mount(root) {
      function filtered() {
        var q = U.norm(st.q);
        return db.sectors().filter(function (s) {
          if (st.fac && s.facilityId !== st.fac) return false;
          if (st.level && String(s.level) !== String(st.level)) return false;
          if (q && U.norm(s.name + ' ' + s.id + ' ' + s.location).indexOf(q) < 0) return false;
          return true;
        });
      }
      function renderTable() {
        var base = filtered();
        var tabs = [['Todos', base.length], ['Habilitado', base.filter(function (s) { return s.status === 'Habilitado'; }).length],
          ['Mantenimiento', base.filter(function (s) { return s.status === 'Mantenimiento'; }).length]];
        root.querySelector('#in-tabs').innerHTML = tabs.map(function (t) {
          return '<button type="button" class="tab' + (st.status === t[0] ? ' active' : '') + '" data-status="' + t[0] + '">' +
            (t[0] === 'Habilitado' ? 'Habilitados' : t[0]) + ' <span class="count">' + t[1] + '</span></button>';
        }).join('');
        var list = base.filter(function (s) { return st.status === 'Todos' || s.status === st.status; });
        root.querySelector('#in-rows').innerHTML = list.length ? list.map(function (s) {
          var f = db.facility(s.facilityId);
          var occ = R.occupancy(s.id);
          var pct = Math.round(occ / s.capacity * 100);
          var res = activeReservations(s.id);
          return '<tr class="clickable' + (st.selected === s.id ? ' selected' : '') + '" data-sel="' + s.id + '">' +
            '<td><div class="strong">' + esc(s.name) + '</div><div class="mono xs muted">#' + s.id + '</div></td>' +
            '<td><span class="chip">' + esc(f.short) + '</span></td>' +
            '<td><div class="mono sm' + (occ >= s.capacity ? ' red' : '') + '">' + occ + ' / ' + s.capacity + ' pers. <span class="muted">' + pct + '%</span></div>' +
            '<div class="bar sm"><span style="width:' + Math.min(100, pct) + '%"></span></div><div class="xs muted">' + U.plural(res, 'reserva vigente', 'reservas vigentes') + '</div></td>' +
            '<td><div class="sm">' + hoursText(s) + '</div><div class="xs muted">Franjas de ' + s.slotHours + ' h · ' + (s.weekends ? 'todos los días' : 'lun. a vie.') + '</div></td>' +
            '<td>' + ui.levelBadge(s.level, true) + (s.requiresApproval ? '<div class="xs amber mt-xs">Requiere aprobación</div>' : '') + '</td>' +
            '<td>' + ui.badge(s.status, s.status === 'Habilitado' ? 'ok' : 'neutral', true) + '</td>' +
            '<td class="right"><button type="button" class="btn btn-secondary btn-sm" data-sel="' + s.id + '">' + icon('tune') + ' Editar</button></td></tr>';
        }).join('') : '<tr><td colspan="7">' + ui.empty('search', 'No se encontraron sectores', 'Modifique los filtros de búsqueda.') + '</td></tr>';
        root.querySelector('#in-foot').innerHTML = 'Mostrando <strong>' + list.length + '</strong> de <strong>' + db.sectors().length + '</strong> sectores registrados';
      }

      function renderConfig(message) {
        var box = root.querySelector('#in-config');
        var s = st.selected ? db.sector(st.selected) : null;
        if (!s) {
          box.innerHTML = '<section class="card sticky">' + ui.empty('tune', 'Configuración rápida', 'Seleccione un sector de la tabla para consultar y modificar su configuración.') + '</section>';
          return;
        }
        var f = db.facility(s.facilityId);
        var is24 = s.open === '00:00' && s.close === '24:00';
        box.innerHTML = '<section class="card sticky config">' +
          '<div class="card-title">' + icon('tune', 'red') + '<h3>Configuración del sector</h3></div>' +
          '<div class="sum-item"><div class="label-sm">Sector seleccionado</div><div class="sum-val strong">' + esc(s.name) + '</div><div class="mono xs muted">ID: ' + s.id + ' • ' + esc(f.name) + '</div></div>' +
          (message || '') +
          '<form id="cfg-form" novalidate>' +
          '<div class="field"><label for="cf-cap">Capacidad máxima (aforo por franja) <span class="req">*</span></label><div class="input-suffix"><input id="cf-cap" type="number" min="1" max="500" step="1" class="input" value="' + s.capacity + '"><span>personas</span></div></div>' +
          '<div class="label-sm">Ventana horaria de operación</div>' +
          '<div class="field-row"><div class="field"><label for="cf-open">Apertura</label><input id="cf-open" type="time" class="input" value="' + s.open + '"' + (is24 ? ' disabled' : '') + '></div>' +
          '<div class="field"><label for="cf-close">Cierre</label><input id="cf-close" type="time" class="input" value="' + (is24 ? '23:59' : s.close) + '"' + (is24 ? ' disabled' : '') + '></div></div>' +
          '<label class="check"><input type="checkbox" id="cf-24"' + (is24 ? ' checked' : '') + '> <span>Habilitar operación 24 horas</span></label>' +
          '<div class="field-row"><div class="field"><label for="cf-hours">Duración de franja</label><select id="cf-hours" class="input">' +
          [1, 2, 3, 4].map(function (h) { return '<option value="' + h + '"' + (Number(s.slotHours) === h ? ' selected' : '') + '>' + h + ' hora' + (h > 1 ? 's' : '') + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label>&nbsp;</label><label class="check"><input type="checkbox" id="cf-weekends"' + (s.weekends ? ' checked' : '') + '> <span>Sábados y domingos</span></label></div></div>' +
          '<div class="xs muted" id="cf-preview"></div>' +
          '<div class="field mt"><label for="cf-level">Nivel mínimo de autorización</label><select id="cf-level" class="input">' +
          [1, 2, 3, 4].map(function (n) { return '<option value="' + n + '"' + (s.level === n ? ' selected' : '') + '>' + esc(R.levelLabel(n)) + '</option>'; }).join('') + '</select></div>' +
          '<label class="check"><input type="checkbox" id="cf-approval"' + (s.requiresApproval ? ' checked' : '') + '> <span>Toda solicitud requiere aprobación administrativa</span></label>' +
          '<div class="label-sm mt">Estado de disponibilidad</div>' +
          '<div class="radio-row"><label class="radio-card"><input type="radio" name="cf-status" value="Habilitado"' + (s.status === 'Habilitado' ? ' checked' : '') + '> Habilitado</label>' +
          '<label class="radio-card"><input type="radio" name="cf-status" value="Mantenimiento"' + (s.status === 'Mantenimiento' ? ' checked' : '') + '> Mantenimiento</label></div>' +
          '<div class="xs muted mt">Reservas vigentes en este sector: <strong>' + activeReservations(s.id) + '</strong>. Si un cambio las afecta, no se aplicará.</div>' +
          '<div class="form-actions"><button type="submit" class="btn btn-primary">' + icon('check') + ' Guardar Cambios</button>' +
          '<button type="button" class="btn btn-secondary" data-act="cfg-cancel">Cancelar</button></div></form></section>';

        var form = box.querySelector('#cfg-form');
        var c24 = form.querySelector('#cf-24'), open = form.querySelector('#cf-open'), close = form.querySelector('#cf-close');
        function values() {
          var all = c24.checked;
          return {
            capacity: form.querySelector('#cf-cap').value,
            open: all ? '00:00' : open.value,
            close: all ? '24:00' : close.value,
            slotHours: form.querySelector('#cf-hours').value,
            weekends: form.querySelector('#cf-weekends').checked,
            level: form.querySelector('#cf-level').value,
            requiresApproval: form.querySelector('#cf-approval').checked,
            status: (form.querySelector('input[name=cf-status]:checked') || {}).value
          };
        }
        function preview() {
          var v = values();
          var ok = U.validTime(v.open) && U.validTime(v.close) && U.toMin(v.open) < U.toMin(v.close);
          var slots = ok ? db.slotsFor({ open: v.open, close: v.close, slotHours: Number(v.slotHours) }) : [];
          form.querySelector('#cf-preview').innerHTML = slots.length
            ? 'Franjas resultantes: <span class="mono">' + slots.map(function (x) { return x.start + '-' + x.end; }).join(', ') + '</span>'
            : '<span class="red">El horario no genera franjas válidas.</span>';
        }
        c24.addEventListener('change', function () {
          open.disabled = close.disabled = c24.checked;
          if (c24.checked) { open.value = '00:00'; close.value = '23:59'; } else if (close.value === '23:59') { open.value = '08:00'; close.value = '20:00'; }
          preview();
        });
        form.addEventListener('input', preview);
        form.addEventListener('change', preview);
        preview();
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var r = R.updateSector(s.id, values(), admin.id);
          if (!r.ok) {
            var list = (r.conflicts || []).slice(0, 6).map(function (c) {
              return '<li>' + (c.turn ? '<span class="mono">#' + c.turn.id + '</span> (' + esc(U.fmtShort(c.turn.date)) + ' ' + c.turn.start + '): ' : '') + esc(c.reason) + '</li>';
            }).join('');
            var more = r.conflicts && r.conflicts.length > 6 ? '<li>… y ' + (r.conflicts.length - 6) + ' más</li>' : '';
            renderConfigWith(values(), '<div class="alert alert-' + (r.conflicts ? 'warn' : 'err') + '">' + icon('warning') + '<div><strong>' + esc(r.error) + '</strong>' +
              (list ? '<ul class="conflicts">' + list + more + '</ul>' : '') + '</div></div>');
            ui.toast(r.conflicts ? 'Cambio no aplicado: afecta reservas existentes.' : r.error, 'error');
            return;
          }
          ui.toast('Configuración de "' + s.name + '" guardada.', 'ok');
          UA.app.refresh();
        });
      }
      /** Vuelve a dibujar el panel conservando lo que el administrador escribió. */
      function renderConfigWith(v, message) {
        renderConfig(message);
        var form = root.querySelector('#cfg-form');
        if (!form) return;
        form.querySelector('#cf-cap').value = v.capacity;
        var all = v.open === '00:00' && v.close === '24:00';
        form.querySelector('#cf-24').checked = all;
        form.querySelector('#cf-open').value = v.open; form.querySelector('#cf-open').disabled = all;
        form.querySelector('#cf-close').value = all ? '23:59' : v.close; form.querySelector('#cf-close').disabled = all;
        form.querySelector('#cf-hours').value = v.slotHours;
        form.querySelector('#cf-weekends').checked = v.weekends;
        form.querySelector('#cf-level').value = v.level;
        form.querySelector('#cf-approval').checked = v.requiresApproval;
        var radio = form.querySelector('input[name=cf-status][value="' + v.status + '"]');
        if (radio) radio.checked = true;
        form.dispatchEvent(new Event('change'));
      }

      root.querySelector('#in-q').addEventListener('input', function (e) { st.q = e.target.value; renderTable(); });
      root.querySelector('#in-fac').addEventListener('change', function (e) { st.fac = e.target.value; renderTable(); });
      root.querySelector('#in-level').addEventListener('change', function (e) { st.level = e.target.value; renderTable(); });
      root.addEventListener('click', function (e) {
        var t = e.target.closest('[data-status]');
        if (t) { st.status = t.dataset.status; renderTable(); return; }
        if (e.target.closest('[data-act="cfg-cancel"]')) { renderConfig(); return; }
        var sel = e.target.closest('[data-sel]');
        if (sel) {
          st.selected = sel.dataset.sel; renderTable(); renderConfig();
          if (window.innerWidth < 1600) root.querySelector('#in-config').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      renderTable();
      renderConfig();
    }
    return { html: html, mount: mount };
  }

  /* ========================================================================
     GESTIÓN DE USUARIOS Y AUTORIZACIONES
     ======================================================================== */
  var USER_TABS = [
    { id: 'todos', label: 'Todos' }, { id: 'Empleado', label: 'Empleados' }, { id: 'Visitante', label: 'Visitantes' },
    { id: 'Proveedor', label: 'Proveedores' }, { id: 'Seguridad', label: 'Seguridad' }, { id: 'Administrador', label: 'Administración' }
  ];

  function sectorChips(u) {
    if (u.role !== 'solicitante') return '<span class="xs muted">No aplica (perfil ' + esc(ui.ROLE_LABEL[u.role].toLowerCase()) + ')</span>';
    if (!u.sectors.length) return '<span class="xs muted">Sin sectores: toda solicitud requiere aprobación</span>';
    return u.sectors.map(function (id) { var s = db.sector(id); return '<span class="chip">' + esc(s ? s.name : id) + '</span>'; }).join('');
  }

  function viewPermissions(u) {
    var turns = db.turns(function (t) { return t.userId === u.id; });
    var upcoming = turns.filter(R.isUpcoming);
    ui.modal({
      title: 'Permisos de ' + esc(u.name),
      body: '<div class="person"><div class="avatar avatar-xl">' + esc(U.initials(u.name)) + '</div><div><div class="person-name">' + esc(u.name) + '</div>' +
        '<div class="mono xs muted">#' + esc(u.id) + '</div><div class="muted">' + esc(u.type) + ' · ' + esc(u.position) + '</div></div></div>' +
        '<dl class="kv-list compact"><div><dt>Perfil del sistema</dt><dd>' + esc(ui.ROLE_LABEL[u.role]) + '</dd></div>' +
        '<div><dt>Nivel de autorización</dt><dd>' + esc(R.levelLabel(u.level)) + '</dd></div>' +
        '<div><dt>Estado de la cuenta</dt><dd>' + ui.badge(u.status, u.status === 'Activo' ? 'ok' : 'err', true) + '</dd></div>' +
        (u.role === 'solicitante' ? '<div><dt>Turnos registrados</dt><dd>' + turns.length + ' (' + upcoming.length + ' vigentes)</dd></div>' : '') + '</dl>' +
        '<div class="label-sm mt">Sectores habilitados</div><div class="chips">' + sectorChips(u) + '</div>',
      actions: [{ label: 'Cerrar', cls: 'btn-secondary' }]
    });
  }

  function editPermissions(admin, u) {
    if (u.id === admin.id) { ui.toast('No puede modificar los permisos de su propia cuenta.', 'error'); return; }
    var groups = db.facilities().map(function (f) {
      return '<fieldset class="sector-group"><legend>' + esc(f.name) + '</legend>' + db.sectors(f.id).map(function (s) {
        return '<label class="check sector-check" data-level="' + s.level + '"><input type="checkbox" value="' + s.id + '"' + (u.sectors.indexOf(s.id) >= 0 ? ' checked' : '') + '>' +
          '<span>' + esc(s.name) + ' <span class="xs muted">· Nivel ' + s.level + (s.requiresApproval ? ' · exige aprobación' : '') + (s.status !== 'Habilitado' ? ' · en mantenimiento' : '') + '</span>' +
          '<span class="xs red lvl-warn"> — requiere Nivel ' + s.level + '</span></span></label>';
      }).join('') + '</fieldset>';
    }).join('');
    var body = '<div class="person"><div class="avatar avatar-xl">' + esc(U.initials(u.name)) + '</div><div><div class="person-name">' + esc(u.name) + '</div>' +
      '<div class="mono xs muted">#' + esc(u.id) + '</div><div class="muted">' + esc(u.type) + ' · ' + esc(u.position) + '</div></div></div>' +
      '<div class="field-row"><div class="field"><label for="ed-level">Nivel de autorización</label><select id="ed-level" class="input">' +
      [1, 2, 3, 4].map(function (n) { return '<option value="' + n + '"' + (u.level === n ? ' selected' : '') + '>' + esc(R.levelLabel(n)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="ed-status">Estado de la cuenta</label><select id="ed-status" class="input">' +
      ['Activo', 'Inactivo'].map(function (x) { return '<option' + (u.status === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div></div>' +
      (u.role === 'solicitante'
        ? '<div class="label-sm">Sectores con autorización directa</div><p class="xs muted">Las solicitudes a sectores marcados se confirman automáticamente (salvo que el sector exija aprobación). Los cambios se aplican en las próximas verificaciones de Seguridad.</p>' + groups
        : '<div class="alert alert-info">' + icon('info') + '<div>Los perfiles de ' + esc(ui.ROLE_LABEL[u.role]) + ' no reservan turnos: solo se gestionan nivel y estado de la cuenta.</div></div>') +
      '<div class="alert alert-err hidden" id="ed-error"></div>';

    var m = ui.modal({
      title: 'Modificar autorización',
      body: body,
      size: 'lg',
      actions: [
        { label: 'Cancelar', cls: 'btn-secondary' },
        {
          label: icon('check') + ' Guardar autorización', cls: 'btn-primary', onClick: function (close, root) {
            var sectors = Array.prototype.map.call(root.querySelectorAll('.sector-check input:checked'), function (i) { return i.value; });
            var r = R.updateUserAuth(u.id, { level: root.querySelector('#ed-level').value, status: root.querySelector('#ed-status').value, sectors: sectors }, admin.id);
            if (!r.ok) {
              var err = root.querySelector('#ed-error');
              err.innerHTML = icon('warning') + '<div>' + esc(r.error) + ' Se conservan los permisos anteriores.</div>';
              err.classList.remove('hidden');
              return;
            }
            close();
            ui.toast('Autorización de ' + u.name + ' actualizada.', 'ok');
            if (r.affected.length) ui.toast(U.plural(r.affected.length, 'turno confirmado quedó', 'turnos confirmados quedaron') + ' sin autorización válida para el ingreso.', 'warn');
            UA.app.refresh();
          }
        }
      ]
    });
    var root = m.root;
    function markLevels() {
      var lvl = Number(root.querySelector('#ed-level').value);
      Array.prototype.forEach.call(root.querySelectorAll('.sector-check'), function (l) {
        l.classList.toggle('over', Number(l.dataset.level) > lvl);
      });
    }
    root.querySelector('#ed-level').addEventListener('change', markLevels);
    markLevels();
  }

  function usuariosView(admin) {
    var st = UA.state.users || (UA.state.users = { tab: 'todos', q: '', level: '', status: '' });
    var html = '<section class="card hero">' +
      '<div><div class="eyebrow red">● PROTOCOLO UMBRELLA ACCESS // DIRECTORIO CORPORATIVO</div>' +
      '<h1>Gestión de Usuarios y Autorizaciones</h1><p class="subtitle">Control de perfiles de acceso, asignación de niveles de autorización y sectores habilitados para personal, visitantes y proveedores.</p></div></section>' +
      '<section class="card filters col">' +
      ' <div class="tabs tabs-bar" id="us-tabs"></div>' +
      ' <div class="filters-row"><div class="input-icon grow">' + icon('search') + '<input id="us-q" class="input" placeholder="Buscar por nombre, documento o puesto…" value="' + esc(st.q) + '"></div>' +
      ' <select id="us-level" class="input input-sm" aria-label="Nivel"><option value="">Nivel: todos</option>' + [1, 2, 3, 4].map(function (n) { return '<option value="' + n + '"' + (String(st.level) === String(n) ? ' selected' : '') + '>Nivel ' + n + '</option>'; }).join('') + '</select>' +
      ' <select id="us-status" class="input input-sm" aria-label="Estado"><option value="">Estado: todos</option><option' + (st.status === 'Activo' ? ' selected' : '') + '>Activo</option><option' + (st.status === 'Inactivo' ? ' selected' : '') + '>Inactivo</option></select></div>' +
      '</section>' +
      '<section class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Usuario e identificación</th><th>Tipo</th><th>Nivel de autorización</th><th>Sectores habilitados</th><th>Estado</th><th class="right">Acciones</th></tr></thead>' +
      '<tbody id="us-rows"></tbody></table></div><div class="table-foot" id="us-foot"></div></section>' +
      '<section class="card note">' + icon('shield_check', 'red') + '<div><strong>Política de concesión de permisos</strong><br><span class="muted">Solo Administración puede modificar autorizaciones; los usuarios no pueden cambiar sus propios permisos. ' +
      'Un sector solo puede habilitarse si el nivel del usuario alcanza el nivel requerido. Los cambios se reflejan en las futuras verificaciones de Seguridad.</span></div></section>';

    function mount(root) {
      function render() {
        var q = U.norm(st.q);
        var base = db.users().filter(function (u) {
          if (st.level && String(u.level) !== String(st.level)) return false;
          if (st.status && u.status !== st.status) return false;
          if (q && U.norm(u.name + ' ' + u.id + ' ' + u.position).indexOf(q) < 0) return false;
          return true;
        });
        root.querySelector('#us-tabs').innerHTML = USER_TABS.map(function (t) {
          var n = t.id === 'todos' ? base.length : base.filter(function (u) { return u.type === t.id; }).length;
          return '<button type="button" class="tab' + (st.tab === t.id ? ' active' : '') + '" data-tab="' + t.id + '">' + t.label + ' <span class="count">' + n + '</span></button>';
        }).join('');
        var list = base.filter(function (u) { return st.tab === 'todos' || u.type === st.tab; });
        root.querySelector('#us-rows').innerHTML = list.length ? list.map(function (u) {
          var self = u.id === admin.id;
          return '<tr><td><div class="person-cell"><span class="avatar avatar-sm">' + esc(U.initials(u.name)) + '</span><div><div class="strong">' + esc(u.name) + '</div>' +
            '<div class="mono xs muted">#' + esc(u.id) + '</div><div class="xs muted">' + esc(u.position) + '</div></div></div></td>' +
            '<td>' + ui.badge(u.type.toUpperCase(), u.type === 'Administrador' || u.type === 'Seguridad' ? 'red' : 'neutral') + '</td>' +
            '<td>' + ui.levelBadge(u.level) + '</td>' +
            '<td><div class="chips">' + sectorChips(u) + '</div></td>' +
            '<td>' + ui.badge(u.status.toUpperCase(), u.status === 'Activo' ? 'ok' : 'err', true) + '</td>' +
            '<td class="right"><div class="row-actions">' +
            '<button type="button" class="btn btn-secondary btn-sm" data-edit="' + u.id + '"' + (self ? ' disabled title="No puede modificar su propia cuenta"' : '') + '>' + icon('key') + ' Modificar Autorización</button>' +
            '<button type="button" class="icon-btn bordered" data-view="' + u.id + '" title="Consultar permisos" aria-label="Consultar permisos">' + icon('eye') + '</button></div></td></tr>';
        }).join('') : '<tr><td colspan="6">' + ui.empty('users', 'No se encontraron usuarios', 'Modifique los filtros de búsqueda.') + '</td></tr>';
        root.querySelector('#us-foot').innerHTML = 'Mostrando <strong>' + list.length + '</strong> de <strong>' + db.users().length + '</strong> usuarios registrados';
      }
      root.querySelector('#us-q').addEventListener('input', function (e) { st.q = e.target.value; render(); });
      root.querySelector('#us-level').addEventListener('change', function (e) { st.level = e.target.value; render(); });
      root.querySelector('#us-status').addEventListener('change', function (e) { st.status = e.target.value; render(); });
      root.addEventListener('click', function (e) {
        var t = e.target.closest('[data-tab]');
        if (t) { st.tab = t.dataset.tab; render(); return; }
        var ed = e.target.closest('[data-edit]');
        if (ed && !ed.disabled) { editPermissions(admin, db.user(ed.dataset.edit)); return; }
        var v = e.target.closest('[data-view]');
        if (v) viewPermissions(db.user(v.dataset.view));
      });
      render();
    }
    return { html: html, mount: mount };
  }

  UA.views = UA.views || {};
  UA.views.admPanel = panelView;
  UA.views.admInstalaciones = instalacionesView;
  UA.views.admUsuarios = usuariosView;
})();
