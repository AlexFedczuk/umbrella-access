/* ==========================================================================
   Umbrella Access — pantallas del perfil SEGURIDAD
   Panel de Control de Accesos · Verificación de Autorización
   Ingresos y egresos se registran MANUALMENTE (sin lectores, QR ni biometría).
   ========================================================================== */
(function () {
  'use strict';
  var UA = (window.UA = window.UA || {});
  var U = UA.U, db = UA.db, R = UA.rules, ui = UA.ui, icon = UA.icon, esc = U.esc;

  function byStart(a, b) { return (a.date + a.start).localeCompare(b.date + b.start); }

  /** Registro de ingreso con confirmación previa (usado en panel y verificación). */
  function doEntry(guard, turnId, after) {
    var t = db.turn(turnId);
    var chk = R.entryCheck(t);
    if (!chk.ok) {
      var f = chk.checks.filter(function (c) { return !c.ok; })[0];
      ui.toast('Ingreso no habilitado: ' + f.label.toLowerCase() + ' — ' + f.detail, 'error');
      return;
    }
    var u = db.user(t.userId);
    ui.confirm({
      title: 'Registrar ingreso',
      message: '<p>Confirme que verificó la identidad de <strong>' + esc(u.name) + '</strong> (documento ' + esc(u.id) + ').</p>' + ui.turnSummary(t) +
        '<p class="muted sm">Se registrará la fecha y hora actual (' + esc(U.fmtTs(Date.now())) + ') con usted como guardia responsable.</p>',
      confirmLabel: icon('login') + ' Registrar ingreso'
    }, function (_, close) {
      var r = R.registerEntry(turnId, guard.id);
      close();
      if (!r.ok) { ui.toast(r.error, 'error'); return; }
      ui.toast('Ingreso registrado: ' + u.name + ' a las ' + U.fmtClock(r.at) + ' hs.', 'ok');
      if (after) after(); else UA.app.refresh();
    });
  }

  function doExit(guard, turnId, after) {
    var t = db.turn(turnId);
    var u = db.user(t.userId);
    var p = R.presence(t);
    if (p !== 'Dentro') {
      ui.toast(p === 'Finalizado' ? 'La salida de este turno ya fue registrada.' : 'La persona no registra un ingreso activo.', 'error');
      return;
    }
    ui.confirm({
      title: 'Registrar salida',
      message: '<p>¿Registrar el egreso de <strong>' + esc(u.name) + '</strong>?</p>' + ui.turnSummary(t) +
        '<p class="muted sm">Ingreso registrado a las ' + U.fmtClock(R.record(t, 'Ingreso').at) + ' hs. El turno pasará a estado “Finalizado”.</p>',
      confirmLabel: icon('logout') + ' Registrar salida'
    }, function (_, close) {
      var r = R.registerExit(turnId, guard.id);
      close();
      if (!r.ok) { ui.toast(r.error, 'error'); return; }
      ui.toast('Egreso registrado: ' + u.name + ' a las ' + U.fmtClock(r.at) + ' hs.', 'ok');
      if (after) after(); else UA.app.refresh();
    });
  }

  function presenceCell(t, p) {
    var html = ui.presenceBadge(t, p);
    if (p === 'Dentro') html += '<div class="mono xs muted">Ingreso: ' + U.fmtClock(R.record(t, 'Ingreso').at) + ' hs</div>';
    if (p === 'Finalizado') html += '<div class="mono xs muted">Egreso: ' + U.fmtClock(R.record(t, 'Egreso').at) + ' hs</div>';
    return html;
  }

  /* ========================================================================
     PANEL DE CONTROL DE ACCESOS
     ======================================================================== */
  var CHIPS = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendientes', label: 'Pendientes de ingreso' },
    { id: 'dentro', label: 'Dentro' },
    { id: 'finalizados', label: 'Finalizados' },
    { id: 'bloqueados', label: 'No habilitados' }
  ];

  function panelView(guard) {
    var st = UA.state.sec || (UA.state.sec = { date: U.today(), facility: '', q: '', chip: 'todos' });
    var facOpts = '<option value="">Todas las instalaciones</option>' + db.facilities().map(function (f) {
      return '<option value="' + f.id + '"' + (st.facility === f.id ? ' selected' : '') + '>' + esc(f.name) + '</option>';
    }).join('');

    var html = ui.pageHeader('<span class="red">' + icon('shield') + ' DIVISIÓN DE SEGURIDAD DE PLANTA // MÓDULO DE CONTROL</span>', 'Control de Accesos',
      'Gestión operativa y registro manual de ingresos y egresos según los turnos programados.',
      '<div class="card guard-card"><div class="xs muted right">Guardia activo: <strong class="text">' + esc(guard.name) + '</strong></div>' +
      '<div class="guard-row"><span class="xs muted">Fecha de hoy</span><strong class="xs">' + esc(U.fmtLong(U.today())) + '</strong></div></div>') +
      '<section class="card filters">' +
      '<label class="inline-field">' + icon('calendar') + '<span class="xs muted">Agenda del día</span><input type="date" id="sp-date" class="input input-sm" value="' + st.date + '"></label>' +
      '<label class="inline-field">' + icon('building') + '<select id="sp-fac" class="input input-sm" aria-label="Instalación">' + facOpts + '</select></label>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-act="today">Hoy</button></section>' +
      '<div class="stats-3" id="sp-stats"></div>' +
      '<section class="card table-card">' +
      ' <div class="table-tools"><div class="input-icon grow">' + icon('search') + '<input id="sp-q" class="input" placeholder="Buscar por nombre, documento o código de turno" value="' + esc(st.q) + '"></div>' +
      '  <div class="chips-row" id="sp-chips"></div>' +
      '  <a class="btn btn-outline-red" href="#/seguridad/verificar">' + icon('person_check') + ' Verificar Turno</a></div>' +
      ' <div class="table-wrap"><table class="table"><thead><tr><th>Sujeto / Código</th><th>Tipo y ocupación</th><th>Sector asignado</th><th>Horario programado</th><th>Autorización</th><th>Estado de presencia</th><th class="right">Gestión</th></tr></thead>' +
      ' <tbody id="sp-rows"></tbody></table></div>' +
      ' <div class="table-foot" id="sp-foot"></div>' +
      '</section>';

    function mount(root) {
      function render() {
        var inFac = function (t) { return !st.facility || t.facilityId === st.facility; };
        var day = db.turns(function (t) { return t.date === st.date && t.status !== 'Cancelado' && inFac(t); }).sort(byStart);
        var info = day.map(function (t) { return { t: t, p: R.presence(t), a: R.authorization(t) }; });
        var programados = info.filter(function (x) { return x.t.status === 'Confirmado'; }).length;
        var dentro = db.turns(inFac).filter(function (t) { return R.presence(t) === 'Dentro'; }).length;
        var porIngresar = info.filter(function (x) { return x.t.status === 'Confirmado' && x.p === 'Sin ingreso' && x.a.state === 'Autorizado' && !R.isOver(x.t); }).length;
        var isToday = st.date === U.today();

        root.querySelector('#sp-stats').innerHTML =
          '<div class="card stat"><div class="stat-head"><span class="label-sm">Ingresos programados</span><span class="stat-ico">' + icon('calendar') + '</span></div>' +
          '<div class="stat-value">' + programados + '<small>' + (isToday ? 'turnos confirmados hoy' : 'turnos confirmados el ' + esc(U.fmtShort(st.date))) + '</small></div></div>' +
          '<div class="card stat"><div class="stat-head"><span class="label-sm">Personas dentro de la instalación</span><span class="stat-ico green-bg">' + icon('door') + '</span></div>' +
          '<div class="stat-value green">' + dentro + '<small>actualmente en sitio</small></div></div>' +
          '<div class="card stat"><div class="stat-head"><span class="label-sm">Ingresos pendientes</span><span class="stat-ico amber-bg">' + icon('hourglass') + '</span></div>' +
          '<div class="stat-value amber">' + porIngresar + '<small>por ingresar</small></div></div>';

        var q = U.norm(st.q).replace('#', '');
        var searched = info.filter(function (x) {
          if (!q) return true;
          var u = db.user(x.t.userId);
          return U.norm(u.name + ' ' + u.id + ' ' + x.t.id).indexOf(q) >= 0;
        });
        function chipMatch(x, id) {
          if (id === 'todos') return true;
          if (id === 'pendientes') return x.t.status === 'Confirmado' && x.p === 'Sin ingreso';
          if (id === 'dentro') return x.p === 'Dentro';
          if (id === 'finalizados') return x.p === 'Finalizado';
          return x.t.status !== 'Confirmado' || x.a.state !== 'Autorizado';
        }
        root.querySelector('#sp-chips').innerHTML = CHIPS.map(function (c) {
          var n = searched.filter(function (x) { return chipMatch(x, c.id); }).length;
          return '<button type="button" class="chip-btn' + (st.chip === c.id ? ' active' : '') + '" data-chip="' + c.id + '">' + c.label + ' <span class="count">' + n + '</span></button>';
        }).join('');

        var rows = searched.filter(function (x) { return chipMatch(x, st.chip); });
        root.querySelector('#sp-rows').innerHTML = rows.length ? rows.map(function (x) {
          var t = x.t, u = db.user(t.userId), s = db.sector(t.sectorId), f = db.facility(t.facilityId);
          var action = '';
          if (x.p === 'Dentro') action = '<button type="button" class="btn btn-secondary btn-sm" data-exit="' + t.id + '">' + icon('logout') + ' Registrar Salida</button>';
          else if (R.entryCheck(t).ok) action = '<button type="button" class="btn btn-primary btn-sm" data-entry="' + t.id + '">' + icon('login') + ' Registrar Ingreso</button>';
          return '<tr><td><div class="strong">' + esc(u.name) + '</div><div class="mono xs muted">#' + t.id + '</div><div class="mono xs muted">' + esc(u.id) + '</div></td>' +
            '<td><div class="strong">' + esc(u.type) + '</div><div class="xs muted">' + esc(u.position) + '</div></td>' +
            '<td><div>' + esc(s.name) + '</div><div class="xs muted">' + esc(f.short) + '</div></td>' +
            '<td class="mono sm nowrap">' + t.start + ' - ' + t.end + ' hs</td>' +
            '<td>' + ui.authBadge(x.a) + '</td>' +
            '<td>' + presenceCell(t, x.p) + '</td>' +
            '<td class="right"><div class="row-actions">' + action +
            '<a class="btn btn-ghost btn-sm" href="#/seguridad/verificar/' + t.id + '">Verificar</a></div></td></tr>';
        }).join('') : '<tr><td colspan="7">' + ui.empty('search', 'Sin resultados', day.length ? 'No hay reservas que coincidan con la búsqueda o el filtro.' : 'No hay reservas previstas para la fecha seleccionada.') + '</td></tr>';
        root.querySelector('#sp-foot').innerHTML = 'Mostrando <strong>' + rows.length + '</strong> de <strong>' + day.length + '</strong> registros previstos para el ' +
          (isToday ? 'día de hoy' : esc(U.fmtLong(st.date))) + ' <span class="muted">(no se listan turnos cancelados)</span>';
      }

      root.querySelector('#sp-q').addEventListener('input', function (e) { st.q = e.target.value; render(); });
      root.querySelector('#sp-date').addEventListener('change', function (e) { if (e.target.value) { st.date = e.target.value; render(); } });
      root.querySelector('#sp-fac').addEventListener('change', function (e) { st.facility = e.target.value; render(); });
      root.addEventListener('click', function (e) {
        var c = e.target.closest('[data-chip]');
        if (c) { st.chip = c.dataset.chip; render(); return; }
        if (e.target.closest('[data-act="today"]')) { st.date = U.today(); root.querySelector('#sp-date').value = st.date; render(); return; }
        var en = e.target.closest('[data-entry]');
        if (en) { doEntry(guard, en.dataset.entry, render); return; }
        var ex = e.target.closest('[data-exit]');
        if (ex) doExit(guard, ex.dataset.exit, render);
      });
      render();
    }
    return { html: html, mount: mount };
  }

  /* ========================================================================
     VERIFICACIÓN DE AUTORIZACIÓN
     ======================================================================== */
  function resultCard(t) {
    var u = db.user(t.userId), s = db.sector(t.sectorId), f = db.facility(t.facilityId);
    var chk = R.entryCheck(t);
    var p = chk.presence, auth = chk.auth;
    var res;
    if (p === 'Dentro') res = ['info', 'door', 'PERSONA DENTRO DE LA INSTALACIÓN', 'Ingreso activo registrado', 'La persona ingresó a las ' + U.fmtClock(R.record(t, 'Ingreso').at) + ' hs. Registre la salida cuando abandone la instalación.'];
    else if (p === 'Finalizado') res = ['neutral', 'check_circle', 'TURNO FINALIZADO', 'Ingreso y egreso registrados', 'El turno ya fue utilizado. No admite un nuevo ingreso.'];
    else if (auth.state === 'Pendiente') res = ['warn', 'hourglass', 'AUTORIZACIÓN PENDIENTE', 'Ingreso bloqueado', 'La solicitud aún no fue aprobada por Administración.'];
    else if (auth.state === 'Denegado') res = ['err', 'block', auth.label === 'Cancelado' ? 'TURNO CANCELADO' : 'ACCESO DENEGADO', 'Ingreso bloqueado', auth.reasons.join(' ')];
    else if (chk.ok) res = ['ok', 'check_circle', 'AUTORIZADO PARA EL INGRESO', 'Pase válido para turno en curso', 'El turno está confirmado y el horario coincide con la franja autorizada para este sector. Verifique la identidad antes de registrar el ingreso.'];
    else {
      var failed = chk.checks.filter(function (c) { return !c.ok; });
      res = ['warn', 'clock', 'INGRESO NO HABILITADO', 'Autorización vigente — condiciones no cumplidas', failed.map(function (c) { return c.label + ': ' + c.detail; }).join(' · ')];
    }
    var occ = R.occupancy(s.id);
    var checks = chk.checks.map(function (c) {
      return '<li class="' + (c.ok ? 'ok' : 'fail') + '">' + icon(c.ok ? 'check_circle' : 'x_circle') + '<div><strong>' + esc(c.label) + '</strong><span>' + esc(c.detail) + '</span></div></li>';
    }).join('');
    var recs = db.records(function (r) { return r.turnId === t.id; }).map(function (r) {
      var g = db.user(r.guardId);
      return '<li><span class="badge b-' + (r.type === 'Ingreso' ? 'ok' : 'neutral') + '">' + r.type + '</span><span class="mono sm">' + esc(U.fmtTs(r.at)) + '</span><span class="xs muted">' + esc(g ? g.name : r.guardId) + '</span></li>';
    }).join('');

    return '<section class="card result result-' + res[0] + '">' +
      ' <div class="result-ico">' + icon(res[1]) + '</div>' +
      ' <div class="result-body"><div class="result-badges"><span class="badge solid-' + res[0] + '">' + res[2] + '</span>' + ui.presenceBadge(t, p) + '</div>' +
      '  <h2>' + esc(res[3]) + '</h2><p class="muted">' + esc(res[4]) + '</p></div>' +
      ' <div class="result-actions">' +
      '  <a class="btn btn-secondary" href="#/seguridad/verificar">Limpiar</a>' +
      '  <button type="button" class="btn btn-secondary" data-exit="' + t.id + '"' + (p === 'Dentro' ? '' : ' disabled') + '>' + icon('logout') + ' Registrar Salida</button>' +
      '  <button type="button" class="btn btn-primary btn-lg" data-entry="' + t.id + '"' + (chk.ok ? '' : ' disabled') + '>' + icon('login') + ' Registrar Ingreso</button>' +
      ' </div>' +
      '</section>' +
      '<div class="grid-2">' +
      ' <section class="card"><div class="card-title">' + icon('badge', 'red') + '<h3>Datos del Solicitante</h3></div>' +
      '  <div class="person"><div class="avatar avatar-xl">' + esc(U.initials(u.name)) + '</div><div><div class="person-name">' + esc(u.name) + '</div>' +
      '   <div class="muted">' + esc(u.type) + '</div><div class="xs strong">' + esc(u.position) + '</div></div></div>' +
      '  <dl class="kv-rows"><div><dt>Documento de identificación</dt><dd class="mono strong">' + esc(u.id) + '</dd></div>' +
      '  <div><dt>Nivel de autorización</dt><dd>' + ui.levelBadge(u.level, true) + '</dd></div>' +
      '  <div><dt>Estado de la cuenta</dt><dd>' + ui.badge(u.status, u.status === 'Activo' ? 'ok' : 'err') + '</dd></div>' +
      '  <div><dt>Código de turno consultado</dt><dd class="mono red strong">#' + t.id + '</dd></div></dl></section>' +
      ' <section class="card"><div class="card-title">' + icon('door', 'red') + '<h3>Detalles de la Reserva</h3></div>' +
      '  <dl class="kv-rows"><div><dt>' + icon('building') + 'Instalación asignada</dt><dd>' + esc(f.name) + '</dd></div>' +
      '  <div><dt>' + icon('layers') + 'Sector destino</dt><dd class="red strong">' + esc(s.name) + '</dd></div>' +
      '  <div><dt>' + icon('calendar') + 'Fecha</dt><dd>' + esc(U.fmtLong(t.date)) + '</dd></div>' +
      '  <div><dt>' + icon('clock') + 'Horario permitido</dt><dd class="mono strong">' + t.start + ' a ' + t.end + ' hs</dd></div>' +
      '  <div><dt>' + icon('key') + 'Nivel de acceso requerido</dt><dd>' + ui.badge('Nivel ' + s.level, 'neutral') + '</dd></div>' +
      '  <div><dt>' + icon('shield') + 'Estado de autorización</dt><dd>' + ui.authBadge(auth) + '</dd></div>' +
      '  <div><dt>' + icon('users') + 'Ocupación del sector</dt><dd class="mono">' + occ + ' / ' + s.capacity + ' personas</dd></div></dl></section>' +
      '</div>' +
      '<div class="grid-2">' +
      ' <section class="card"><div class="card-title">' + icon('shield_check', 'red') + '<h3>Validaciones realizadas</h3></div><ul class="check-results">' + checks + '</ul></section>' +
      ' <section class="card"><div class="card-title">' + icon('history', 'red') + '<h3>Movimientos registrados</h3></div>' +
      (recs ? '<ul class="moves">' + recs + '</ul>' : '<p class="muted sm">Sin ingresos ni egresos registrados para este turno.</p>') + '</section>' +
      '</div>';
  }

  function verificarView(guard, params) {
    var query = params[0] ? decodeURIComponent(params[0]) : '';
    var body;
    if (!query) {
      body = '<div class="card">' + ui.empty('search', 'Ingrese un código de turno o una identificación',
        'Ejemplos: TUR-' + new Date().getFullYear() + '-0941 o UC-8842-BIO. La verificación es manual: no se utilizan escáneres ni lectores.') + '</div>';
    } else {
      var turn = db.turn(query);
      if (turn) body = resultCard(turn);
      else {
        var nq = U.norm(query);
        var user = db.user(query);
        var users = user ? [user] : db.users().filter(function (u) { return u.role === 'solicitante' && nq.length >= 3 && U.norm(u.name).indexOf(nq) >= 0; });
        var list = [];
        users.forEach(function (u) { list = list.concat(db.turns(function (t) { return t.userId === u.id; })); });
        var today = U.today();
        list.sort(function (a, b) {
          var ka = (a.date === today ? '0' : a.date > today ? '1' : '2') + (a.date > today ? a.date : '') + a.start;
          var kb = (b.date === today ? '0' : b.date > today ? '1' : '2') + (b.date > today ? b.date : '') + b.start;
          return ka.localeCompare(kb);
        });
        if (!users.length) {
          body = '<div class="card">' + ui.empty('x_circle', 'Sin coincidencias', 'No se encontró ningún turno ni solicitante con “' + query + '”. Verifique el código o la identificación.') + '</div>';
        } else if (!list.length) {
          body = '<div class="card">' + ui.empty('calendar_x', 'El solicitante no posee turnos', users.map(function (u) { return u.name + ' (' + u.id + ')'; }).join(', ') + ' no registra reservas.') + '</div>';
        } else {
          body = '<section class="card table-card"><div class="card-title pad">' + icon('users', 'red') + '<h3>Turnos de ' + esc(users.map(function (u) { return u.name; }).join(', ')) + '</h3>' +
            '<span class="xs muted">Seleccione el turno a verificar</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Código</th><th>Solicitante</th><th>Sector</th><th>Fecha y horario</th><th>Estado</th><th>Presencia</th><th></th></tr></thead><tbody>' +
            list.map(function (t) {
              var s = db.sector(t.sectorId), u = db.user(t.userId);
              return '<tr><td class="mono strong">#' + t.id + '</td><td>' + esc(u.name) + '<div class="xs muted mono">' + esc(u.id) + '</div></td><td>' + esc(s.name) + '</td>' +
                '<td>' + esc(U.fmtShort(t.date)) + (t.date === today ? ' ' + ui.badge('Hoy', 'info') : '') + '<div class="mono xs">' + t.start + ' - ' + t.end + ' hs</div></td>' +
                '<td>' + ui.statusBadge(t.status) + '</td><td>' + ui.presenceBadge(t, R.presence(t)) + '</td>' +
                '<td class="right"><a class="btn btn-secondary btn-sm" href="#/seguridad/verificar/' + t.id + '">Verificar</a></td></tr>';
            }).join('') + '</tbody></table></div></section>';
        }
      }
    }

    var html = ui.pageHeader('<span class="red">CONTROL DE ACCESO</span> • PUESTO DE GUARDIA', 'Verificación de Autorización',
      'Compruebe la validez del turno y registre manualmente el ingreso o egreso del personal.',
      '<div class="card guard-chip"><span class="dot dot-ok"></span>' + esc(guard.name) + ' — Guardia activo</div>') +
      '<section class="card search-card"><form id="vf-form" class="search-row" novalidate>' +
      '<div class="input-icon grow">' + icon('search') + '<input id="vf-q" class="input input-lg mono" placeholder="Código de turno (TUR-…) o identificación del solicitante" value="' + esc(query) + '" autocomplete="off"></div>' +
      '<button class="btn btn-primary btn-lg" type="submit">' + icon('search') + ' Buscar</button></form>' +
      '<div class="field-error" id="vf-error"></div></section>' + body;

    function mount(root) {
      root.querySelector('#vf-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var q = root.querySelector('#vf-q').value.trim();
        if (!q) { root.querySelector('#vf-error').textContent = 'Ingrese un código de turno o una identificación.'; return; }
        var target = '/seguridad/verificar/' + encodeURIComponent(U.normCode(q) && db.turn(q) ? U.normCode(q) : q);
        if ('#' + target === location.hash) UA.app.refresh(); else UA.app.go(target);
      });
      root.addEventListener('click', function (e) {
        var en = e.target.closest('[data-entry]');
        if (en && !en.disabled) { doEntry(guard, en.dataset.entry); return; }
        var ex = e.target.closest('[data-exit]');
        if (ex && !ex.disabled) doExit(guard, ex.dataset.exit);
      });
      if (!query) root.querySelector('#vf-q').focus();
    }
    return { html: html, mount: mount };
  }

  UA.views = UA.views || {};
  UA.views.secPanel = panelView;
  UA.views.secVerificar = verificarView;
})();
