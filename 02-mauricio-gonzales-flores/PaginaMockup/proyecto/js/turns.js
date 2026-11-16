/* ==========================================================================
   Umbrella Access — pantallas del perfil SOLICITANTE
   Panel principal · Solicitar turno · Mis turnos · Detalle · Reprogramación
   ========================================================================== */
(function () {
  'use strict';
  var UA = (window.UA = window.UA || {});
  var U = UA.U, db = UA.db, R = UA.rules, ui = UA.ui, icon = UA.icon, esc = U.esc;

  var REASONS = ['Tareas operativas programadas', 'Mantenimiento técnico', 'Entrega o retiro de suministros',
    'Auditoría o inspección', 'Reunión de coordinación', 'Capacitación', 'Consulta de documentación técnica', 'Otro'];
  var RESCHEDULE_REASONS = ['Conflicto de agenda', 'Cambio en la planificación de tareas', 'Demora en la entrega de suministros',
    'Motivo personal', 'Otro'];

  function byDate(a, b) { return (a.date + a.start).localeCompare(b.date + b.start); }
  function fac(t) { var f = db.facility(t.facilityId); return f ? f.name : '-'; }
  function facShort(t) { var f = db.facility(t.facilityId); return f ? f.short : '-'; }
  function sec(t) { var s = db.sector(t.sectorId); return s ? s.name : '-'; }
  function daysLabel(s) { return s.weekends ? 'Todos los días' : 'Lunes a viernes'; }
  function hoursLabel(s) {
    return (s.open === '00:00' && s.close === '24:00' ? 'Operación 24 horas' : s.open + ' a ' + s.close + ' hs') +
      ' · franjas de ' + s.slotHours + ' h';
  }
  function go(path) { UA.app.go(path); }

  /** Diálogo de cancelación compartido (Mis turnos, Panel y Detalle). */
  function askCancel(user, turnId) {
    var t = db.turn(turnId);
    if (!t) return;
    var chk = R.canModify(t);
    if (!chk.ok) { ui.toast('No se puede cancelar: ' + chk.error, 'error'); return; }
    ui.confirm({
      title: 'Cancelar reserva de acceso',
      message: '<p>¿Confirma la cancelación del siguiente turno? La acción no se puede deshacer y el cupo quedará disponible para otras personas.</p>' + ui.turnSummary(t),
      confirmLabel: icon('x_circle') + ' Confirmar cancelación',
      cancelLabel: 'Volver sin cancelar',
      danger: true
    }, function (_, close) {
      var r = R.cancelTurn(turnId, user.id);
      close();
      if (!r.ok) { ui.toast(r.error, 'error'); return; }
      ui.toast('El turno #' + turnId + ' fue cancelado y el cupo liberado.', 'ok');
      UA.app.refresh();
    });
  }

  /* ========================================================================
     1. PANEL PRINCIPAL
     ======================================================================== */
  function panelView(user) {
    var mine = db.turns(function (t) { return t.userId === user.id; });
    var upcoming = mine.filter(R.isUpcoming).sort(byDate);
    var nextConfirmed = upcoming.filter(function (t) { return t.status === 'Confirmado'; })[0];
    var pending = upcoming.filter(function (t) { return t.status === 'Pendiente'; });

    var nextCard = nextConfirmed
      ? '<div class="mini-title"><strong>' + esc(U.fmtMedium(nextConfirmed.date)) + ' · <span class="mono">' + nextConfirmed.start + ' - ' + nextConfirmed.end + ' hs</span></strong></div>' +
        '<p class="muted">' + esc(fac(nextConfirmed)) + ' · ' + esc(sec(nextConfirmed)) + '</p>' +
        '<div class="card-foot"><span class="mono xs muted">ID: #' + nextConfirmed.id + '</span>' +
        '<a class="link red" href="#/solicitante/turno/' + nextConfirmed.id + '">Ver detalles ' + icon('arrow_right') + '</a></div>'
      : '<p class="muted">No tiene turnos confirmados próximos.</p><div class="card-foot"><span></span><a class="link red" href="#/solicitante/solicitar">Solicitar un turno ' + icon('arrow_right') + '</a></div>';

    var p0 = pending[0];
    var pendCard = p0
      ? '<div class="mini-title"><strong>' + esc(sec(p0)) + ' — ' + esc(facShort(p0)) + '</strong></div>' +
        '<p class="muted">Aguarda aprobación administrativa · ' + esc(U.fmtShort(p0.date)) + ' · <span class="mono">' + p0.start + ' - ' + p0.end + '</span></p>' +
        '<div class="card-foot"><span class="mono xs muted">ID: #' + p0.id + '</span>' +
        '<a class="link amber" href="#/solicitante/turno/' + p0.id + '">Consultar estado ' + icon('arrow_right') + '</a></div>'
      : '<p class="muted">No tiene solicitudes pendientes de aprobación.</p><div class="card-foot"><span></span><a class="link amber" href="#/solicitante/turnos">Ver mis turnos ' + icon('arrow_right') + '</a></div>';

    var list = upcoming.slice(0, 4).map(function (t) {
      var can = R.canModify(t).ok;
      return '<div class="turn-mini">' +
        '<div class="tm-body"><div class="tm-head"><span class="mono strong">#' + t.id + '</span>' + ui.statusBadge(t.status) + '</div>' +
        '<div class="tm-title">' + esc(fac(t)) + ' <span class="muted">· ' + esc(sec(t)) + '</span></div>' +
        '<div class="tm-meta">' + icon('calendar') + esc(U.fmtMedium(t.date)) + '<span class="sp"></span>' + icon('clock') + '<span class="mono">' + t.start + ' - ' + t.end + ' hs</span></div></div>' +
        '<div class="tm-actions"><a class="btn btn-secondary btn-sm" href="#/solicitante/turno/' + t.id + '">' + icon('eye') + ' Ver Detalle</a>' +
        (can ? '<a class="btn btn-secondary btn-sm" href="#/solicitante/reprogramar/' + t.id + '">' + icon('edit_calendar') + ' Reprogramar</a>' : '') +
        '</div></div>';
    }).join('');

    var sectorChips = user.sectors.length
      ? user.sectors.map(function (id) { var s = db.sector(id); return s ? '<span class="chip">' + esc(s.name) + '</span>' : ''; }).join('')
      : '<span class="muted xs">Sin sectores con autorización directa: sus solicitudes requieren aprobación.</span>';

    var html = '' +
      '<section class="card welcome">' +
      ' <div><div class="welcome-title"><h2>Bienvenido/a, ' + esc(user.name) + '</h2>' + ui.levelBadge(user.level) + '</div>' +
      ' <p class="muted">' + esc(user.position) + ' · ' + esc(user.type) + ' · Gestión simplificada de reservas y acceso a instalaciones.</p></div>' +
      ' <div class="actions"><a class="btn btn-primary" href="#/solicitante/solicitar">' + icon('add') + ' Solicitar Turno</a>' +
      ' <a class="btn btn-secondary" href="#/solicitante/turnos">' + icon('calendar') + ' Mis Turnos</a></div>' +
      '</section>' +
      '<div class="grid-2">' +
      ' <section class="card"><div class="card-title">' + icon('calendar_check', 'green') + '<h3 class="upper">Próximo turno confirmado</h3>' +
      (nextConfirmed ? ui.badge('Confirmado', 'ok') : '') + '</div>' + nextCard + '</section>' +
      ' <section class="card"><div class="card-title">' + icon('hourglass', 'amber') + '<h3 class="upper">Solicitudes en trámite</h3>' +
      ui.badge(pending.length + ' en revisión', pending.length ? 'warn' : 'neutral') + '</div>' + pendCard + '</section>' +
      '</div>' +
      '<div class="grid-main-aside">' +
      ' <section class="card"><div class="card-title">' + icon('calendar', 'red') + '<h3>Mis Próximos Turnos</h3><span class="mono xs muted">' + U.plural(upcoming.length, 'PROGRAMADO', 'PROGRAMADOS') + '</span></div>' +
      (list || ui.empty('calendar', 'No tiene turnos próximos', 'Puede solicitar una nueva reserva de acceso.', '<a class="btn btn-primary btn-sm" href="#/solicitante/solicitar">' + icon('add') + ' Solicitar Turno</a>')) +
      (upcoming.length > 4 ? '<div class="card-foot"><span></span><a class="link red" href="#/solicitante/turnos">Ver todos ' + icon('arrow_right') + '</a></div>' : '') +
      ' </section>' +
      ' <aside class="stack">' +
      '  <section class="card"><div class="card-title">' + icon('info', 'red') + '<h3>Requisitos Básicos de Ingreso</h3></div>' +
      '   <p class="muted sm">Para el ingreso en su horario asignado, recuerde contar con:</p>' +
      '   <ul class="checklist">' +
      '    <li>' + icon('check_circle', 'green') + 'Documento o credencial corporativa con su identificación</li>' +
      '    <li>' + icon('check_circle', 'green') + 'Código alfanumérico del turno (ej. #TUR-…)</li>' +
      '    <li>' + icon('check_circle', 'green') + 'Equipo de protección reglamentario del sector</li>' +
      '    <li>' + icon('check_circle', 'green') + 'Presentarse 10 minutos antes en el puesto de guardia</li>' +
      '   </ul></section>' +
      '  <section class="card"><div class="card-title">' + icon('badge', 'red') + '<h3>Credencial de Acceso</h3>' + ui.badge('Habilitada', 'ok') + '</div>' +
      '   <dl class="kv-list compact"><div><dt>Identificación</dt><dd class="mono">#' + esc(user.id) + '</dd></div>' +
      '   <div><dt>Tipo de solicitante</dt><dd>' + esc(user.type) + '</dd></div>' +
      '   <div><dt>Nivel de acceso</dt><dd>' + esc(R.levelLabel(user.level)) + '</dd></div></dl>' +
      '   <div class="label-sm mt">Sectores con autorización</div><div class="chips">' + sectorChips + '</div></section>' +
      ' </aside>' +
      '</div>';
    return { html: html };
  }

  /* ========================================================================
     2. SOLICITAR TURNO (formulario en 5 pasos)
     ======================================================================== */
  var STEP_SHORT = ['Instalación', 'Sector', 'Motivo', 'Fecha y Horario', 'Confirmación'];
  var STEP_TITLE = ['Selección de Instalación', 'Sector de Destino', 'Motivo de la Visita', 'Fecha y Horario de Ingreso', 'Confirmación de la Solicitud'];
  var STEP_SUB = [
    'Seleccione la instalación a la que necesita ingresar.',
    'Elija el sector de destino. Se indican el nivel requerido, la capacidad y si su autorización permite la confirmación inmediata.',
    'Indique el motivo de la visita para el registro de la solicitud.',
    'Seleccione el día y la franja horaria deseada para acceder a las instalaciones.',
    'Revise los datos y confirme la solicitud.'
  ];

  function wiz(user) {
    var w = UA.state.wizard;
    if (!w || w.userId !== user.id) {
      var t = U.today();
      w = UA.state.wizard = { userId: user.id, step: 1, facilityId: null, sectorId: null, reason: '', detail: '',
        date: null, start: null, month: t.slice(0, 7) };
    }
    // Coherencia: si un dato previo dejó de ser válido se retrocede de paso
    var sector = w.sectorId ? db.sector(w.sectorId) : null;
    if (w.step > 1 && !w.facilityId) w.step = 1;
    if (w.step > 2 && !sector) w.step = 2;
    return w;
  }

  function wizardSummary(user, w) {
    var f = w.facilityId ? db.facility(w.facilityId) : null;
    var s = w.sectorId ? db.sector(w.sectorId) : null;
    var slot = s && w.date && w.start ? db.slotsFor(s).filter(function (x) { return x.start === w.start; })[0] : null;
    var access = s ? R.evaluateAccess(user, s) : null;
    function item(label, value, cls) {
      return '<div class="sum-item ' + (cls || '') + '"><div class="label-sm">' + label + '</div><div class="sum-val">' + (value || '<span class="muted">Sin seleccionar</span>') + '</div></div>';
    }
    var state = '';
    if (access && access.allowed) {
      state = access.mode === 'auto'
        ? '<div class="alert alert-ok sm">' + icon('check_circle') + '<div><strong>Estado previsto: Confirmado</strong><br>Su autorización permite la confirmación inmediata.</div></div>'
        : '<div class="alert alert-warn sm">' + icon('hourglass') + '<div><strong>Estado previsto: Pendiente</strong><br>' + esc(access.reason) + '.</div></div>';
    }
    return '<section class="card sticky"><div class="card-title">' + icon('description', 'red') + '<h3>Resumen de Solicitud</h3></div>' +
      item('Instalación', f ? esc(f.name) : '') +
      item('Sector destino', s ? esc(s.name) : '') +
      item('Motivo', w.reason ? esc(w.reason === 'Otro' ? (w.detail || 'Otro') : w.reason) : '') +
      item('Fecha de ingreso', w.date ? esc(U.fmtMedium(w.date)) : '') +
      item('Franja horaria', slot ? '<span class="mono">' + slot.start + ' - ' + slot.end + ' hs (' + s.slotHours + ' h)</span>' : '', slot ? 'hl' : '') +
      state + '</section>';
  }

  function stepper(w) {
    return '<div class="card stepper">' + STEP_SHORT.map(function (label, i) {
      var n = i + 1;
      var cls = n < w.step ? 'done' : n === w.step ? 'active' : 'todo';
      var mark = n < w.step ? icon('check_circle') : '<span class="step-num">' + n + '</span>';
      return '<button type="button" class="step ' + cls + '" data-act="goto" data-step="' + n + '"' + (n < w.step ? '' : ' disabled') + '>' +
        '<span class="step-label">' + mark + n + '. ' + label + '</span><span class="step-bar"></span></button>';
    }).join('') + '</div>';
  }

  function step1(user, w) {
    var cards = db.facilities().map(function (f) {
      var secs = db.sectors(f.id);
      var enabled = secs.filter(function (s) { return s.status === 'Habilitado'; });
      var direct = enabled.filter(function (s) { return R.evaluateAccess(user, s).mode === 'auto'; }).length;
      var available = f.status === 'Operativo';
      return '<button type="button" class="option-card' + (w.facilityId === f.id ? ' selected' : '') + '" data-act="pick-fac" data-id="' + f.id + '"' + (available ? '' : ' disabled') + '>' +
        '<div class="oc-head">' + icon('building', 'red') + ui.badge(f.status, available ? 'ok' : 'neutral') + '</div>' +
        '<div class="oc-title">' + esc(f.name) + '</div>' +
        '<div class="oc-sub">' + esc(f.kind) + ' · ' + esc(f.location) + '</div>' +
        '<div class="oc-foot">' + U.plural(enabled.length, 'sector habilitado', 'sectores habilitados') + ' · ' +
        U.plural(direct, 'con autorización directa', 'con autorización directa') + '</div>' +
        (w.facilityId === f.id ? '<span class="oc-check">' + icon('check_circle') + '</span>' : '') + '</button>';
    }).join('');
    return '<section class="card"><div class="card-title">' + icon('building', 'red') + '<h3>Instalaciones disponibles</h3></div>' +
      '<div class="option-grid">' + cards + '</div></section>';
  }

  function step2(user, w) {
    var f = db.facility(w.facilityId);
    var cards = db.sectors(w.facilityId).map(function (s) {
      var ev = R.evaluateAccess(user, s);
      var evBadge = s.status !== 'Habilitado' ? ui.badge('En mantenimiento', 'neutral')
        : !ev.allowed ? ui.badge('Nivel insuficiente', 'err', true)
          : ev.mode === 'auto' ? ui.badge('Autorización directa', 'ok', true)
            : ui.badge('Requiere aprobación', 'warn', true);
      var sel = w.sectorId === s.id;
      return '<button type="button" class="option-card' + (sel ? ' selected' : '') + '" data-act="pick-sec" data-id="' + s.id + '"' + (ev.allowed ? '' : ' disabled') + '>' +
        '<div class="oc-head"><span class="mono xs muted">' + s.id + '</span>' + ui.levelBadge(s.level, true) + '</div>' +
        '<div class="oc-title">' + esc(s.name) + '</div>' +
        '<div class="oc-sub">' + icon('map_pin') + esc(s.location) + '</div>' +
        '<ul class="oc-meta"><li>' + icon('users') + 'Capacidad: ' + s.capacity + ' personas por franja</li>' +
        '<li>' + icon('clock') + esc(hoursLabel(s)) + '</li><li>' + icon('calendar') + daysLabel(s) + '</li></ul>' +
        '<div class="oc-foot">' + evBadge + (ev.allowed ? '' : '<span class="xs muted">' + esc(ev.reason) + '</span>') + '</div>' +
        (sel ? '<span class="oc-check">' + icon('check_circle') + '</span>' : '') + '</button>';
    }).join('');
    return '<div class="alert alert-info">' + icon('shield') + '<div>Su nivel de autorización es <strong>Nivel ' + user.level + '</strong>. ' +
      'Los sectores con <strong>autorización directa</strong> se confirman al instante; los que <strong>requieren aprobación</strong> quedan pendientes hasta la resolución de Administración.</div></div>' +
      '<section class="card"><div class="card-title">' + icon('layers', 'red') + '<h3>Sectores de ' + esc(f.name) + '</h3></div>' +
      '<div class="option-grid">' + cards + '</div></section>';
  }

  function step3(user, w) {
    var opts = REASONS.map(function (r) { return '<option' + (w.reason === r ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('');
    return '<section class="card"><div class="card-title">' + icon('description', 'red') + '<h3>Motivo de la visita</h3></div>' +
      '<div class="field"><label for="wiz-reason">Motivo <span class="req">*</span></label>' +
      '<select id="wiz-reason" class="input"><option value="">Seleccione un motivo…</option>' + opts + '</select></div>' +
      '<div class="field"><div class="label-row"><label for="wiz-detail">Detalle adicional <span class="muted" id="detail-req">' + (w.reason === 'Otro' ? '(obligatorio)' : '(opcional)') + '</span></label>' +
      '<span class="mono xs muted" id="detail-count">' + (w.detail || '').length + '/200</span></div>' +
      '<textarea id="wiz-detail" class="input" rows="4" maxlength="200" placeholder="Describa brevemente la tarea a realizar">' + esc(w.detail || '') + '</textarea></div>' +
      '<p class="xs muted">No incluya información científica confidencial: el sistema solo registra datos administrativos del acceso.</p></section>';
  }

  function calendar(sector, w) {
    var today = U.today();
    var parts = w.month.split('-').map(Number);
    var year = parts[0], month = parts[1] - 1;
    var first = new Date(year, month, 1);
    var offset = (first.getDay() + 6) % 7; // lunes primero
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var minMonth = today.slice(0, 7), maxMonth = R.maxDate().slice(0, 7);
    var cells = '';
    for (var i = 0; i < offset; i++) cells += '<span class="cal-cell blank"></span>';
    for (var d = 1; d <= daysInMonth; d++) {
      var iso = year + '-' + U.pad(month + 1) + '-' + U.pad(d);
      var st = R.dayStatus(sector, iso);
      var sel = w.date === iso;
      var cls = 'cal-cell ' + st.state + (sel ? ' selected' : '') + (iso === today ? ' today' : '');
      var title = st.state === 'available' ? st.free + ' cupos libres' : st.state === 'full' ? 'Sin cupos' : st.state === 'closed' ? 'Sector no habilitado ese día' : 'No disponible';
      cells += '<button type="button" class="' + cls + '" data-act="pick-date" data-date="' + iso + '" title="' + title + '"' +
        (st.state === 'available' ? '' : ' disabled') + '>' + d + '<span class="cal-dot"></span></button>';
    }
    var head = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(function (x) { return '<span class="cal-head">' + x + '</span>'; }).join('');
    return '<section class="card"><div class="card-title">' + icon('calendar', 'red') + '<h3>Seleccionar Fecha</h3>' +
      '<div class="month-nav"><button type="button" class="icon-btn" data-act="month" data-dir="-1"' + (w.month <= minMonth ? ' disabled' : '') + ' aria-label="Mes anterior">' + icon('chevron_left') + '</button>' +
      '<strong>' + U.monthLabel(year, month) + '</strong>' +
      '<button type="button" class="icon-btn" data-act="month" data-dir="1"' + (w.month >= maxMonth ? ' disabled' : '') + ' aria-label="Mes siguiente">' + icon('chevron_right') + '</button></div></div>' +
      '<div class="calendar">' + head + cells + '</div>' +
      '<div class="cal-legend">' + (w.date ? '<span><i class="lg lg-sel"></i>' + esc(U.fmtLong(w.date)) + ' (seleccionado)</span>' : '') +
      '<span><i class="lg lg-ok"></i>Día disponible</span><span><i class="lg lg-full"></i>Sin cupos</span><span><i class="lg lg-off"></i>No habilitado</span></div></section>';
  }

  function slotPicker(sector, date, selected, excludeId, currentStart) {
    if (!date) return ui.empty('clock', 'Seleccione una fecha', 'Las franjas horarias disponibles se mostrarán aquí.');
    var av = R.availability(sector, date, excludeId);
    return '<div class="slot-grid">' + av.map(function (s) {
      var isCurrent = currentStart && s.start === currentStart.start && date === currentStart.date;
      var sel = selected === s.start && !isCurrent;
      var stateTxt, cls;
      if (isCurrent) { stateTxt = '● Turno actual'; cls = 'muted'; }
      else if (sel) { stateTxt = '● Seleccionado · ' + U.plural(s.free, 'cupo libre', 'cupos libres'); cls = 'red'; }
      else if (s.past) { stateTxt = '● Horario vencido'; cls = 'muted'; }
      else if (s.free <= 0) { stateTxt = '● Sin cupos (capacidad máxima alcanzada)'; cls = 'err'; }
      else { stateTxt = '● Disponible · ' + U.plural(s.free, 'cupo libre', 'cupos libres'); cls = 'ok'; }
      var disabled = !s.available || isCurrent;
      return '<button type="button" class="slot' + (sel ? ' selected' : '') + (disabled ? ' off' : '') + '" data-act="pick-slot" data-start="' + s.start + '"' + (disabled ? ' disabled' : '') + '>' +
        '<span class="slot-time mono">' + s.start + ' - ' + s.end + ' hs</span><span class="slot-state ' + cls + '">' + stateTxt + '</span>' +
        (sel ? '<span class="slot-check">' + icon('check_circle') + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }

  function step4(user, w) {
    var s = db.sector(w.sectorId);
    return calendar(s, w) +
      '<section class="card"><div class="card-title">' + icon('clock', 'red') + '<h3>Franja Horaria</h3>' +
      (w.date ? '<span class="chip">' + esc(U.fmtDayMonth(w.date)) + '</span>' : '') + '</div>' +
      slotPicker(s, w.date, w.start) + '</section>';
  }

  function step5(user, w) {
    var s = db.sector(w.sectorId), f = db.facility(w.facilityId);
    var slot = db.slotsFor(s).filter(function (x) { return x.start === w.start; })[0];
    var ev = R.evaluateAccess(user, s);
    return '<section class="card"><div class="card-title">' + icon('check_circle', 'red') + '<h3>Revise los datos de su solicitud</h3></div>' +
      '<dl class="kv-grid">' +
      '<div><dt>Titular</dt><dd>' + esc(user.name) + '<span class="muted block">' + esc(user.type) + ' · #' + esc(user.id) + '</span></dd></div>' +
      '<div><dt>Nivel de acceso</dt><dd>' + esc(R.levelLabel(user.level)) + '</dd></div>' +
      '<div><dt>Instalación</dt><dd>' + esc(f.name) + '</dd></div>' +
      '<div><dt>Sector</dt><dd>' + esc(s.name) + '<span class="muted block">' + esc(s.location) + ' · requiere Nivel ' + s.level + '</span></dd></div>' +
      '<div><dt>Fecha</dt><dd>' + esc(U.fmtLong(w.date)) + '</dd></div>' +
      '<div><dt>Horario</dt><dd class="mono">' + slot.start + ' - ' + slot.end + ' hs</dd></div>' +
      '<div class="span-2"><dt>Motivo</dt><dd>' + esc(w.reason) + (w.detail ? '<span class="muted block">' + esc(w.detail) + '</span>' : '') + '</dd></div>' +
      '</dl>' +
      (ev.mode === 'auto'
        ? '<div class="alert alert-ok">' + icon('check_circle') + '<div><strong>La solicitud quedará Confirmada.</strong> Su autorización vigente permite la confirmación automática. Se generará un código único de turno.</div></div>'
        : '<div class="alert alert-warn">' + icon('hourglass') + '<div><strong>La solicitud quedará Pendiente.</strong> ' + esc(ev.reason) + '. No podrá ingresar hasta que Administración la apruebe; recibirá una notificación con la resolución.</div></div>') +
      '</section>';
  }

  function solicitarView(user) {
    var w = wiz(user);
    var content = [step1, step2, step3, step4, step5][w.step - 1](user, w);
    var next = w.step < 5
      ? '<button type="button" class="btn btn-primary" data-act="next">Continuar al Paso ' + (w.step + 1) + ': ' + STEP_SHORT[w.step] + ' ' + icon('arrow_right') + '</button>'
      : '<button type="button" class="btn btn-primary" data-act="submit">' + icon('check_circle') + ' Confirmar Solicitud</button>';
    var back = w.step > 1
      ? '<button type="button" class="btn btn-secondary" data-act="back">' + icon('arrow_left') + ' Volver al paso anterior</button>'
      : '<button type="button" class="btn btn-ghost" data-act="discard">' + icon('x') + ' Descartar solicitud</button>';
    var html = ui.pageHeader('<span class="red">PASO ' + w.step + ' DE 5</span> • SOLICITUD DE TURNO', STEP_TITLE[w.step - 1], STEP_SUB[w.step - 1]) +
      stepper(w) +
      '<div class="grid-main-aside"><div class="stack">' + content +
      '<div class="alert alert-err hidden" id="wiz-error" role="alert"></div>' +
      '<div class="card form-nav">' + back + next + '</div></div>' +
      '<aside>' + wizardSummary(user, w) + '</aside></div>';
    return { html: html, mount: function (root) { mountWizard(root, user, w); } };
  }

  function mountWizard(root, user, w) {
    var err = root.querySelector('#wiz-error');
    function showErr(msg) {
      err.innerHTML = icon('warning') + '<div>' + esc(msg) + '</div>';
      err.classList.remove('hidden');
      err.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    function validate(step) {
      if (step === 1 && !w.facilityId) return 'Seleccione una instalación para continuar.';
      if (step === 2) {
        if (!w.sectorId) return 'Seleccione un sector de destino para continuar.';
        var ev = R.evaluateAccess(user, db.sector(w.sectorId));
        if (!ev.allowed) return 'No puede solicitar este sector: ' + ev.reason + '.';
      }
      if (step === 3) {
        if (!w.reason) return 'Seleccione el motivo de la visita.';
        if (w.reason === 'Otro' && !w.detail.trim()) return 'Describa el motivo en el campo de detalle.';
      }
      if (step === 4) {
        var v = R.validateSlot(user, db.sector(w.sectorId), w.date, w.start);
        if (!v.ok) return v.error;
      }
      return null;
    }

    var reason = root.querySelector('#wiz-reason');
    var detail = root.querySelector('#wiz-detail');
    if (reason) reason.addEventListener('change', function () {
      w.reason = reason.value;
      root.querySelector('#detail-req').textContent = w.reason === 'Otro' ? '(obligatorio)' : '(opcional)';
    });
    if (detail) detail.addEventListener('input', function () {
      w.detail = detail.value;
      root.querySelector('#detail-count').textContent = detail.value.length + '/200';
    });

    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      var act = b.getAttribute('data-act');
      if (act === 'pick-fac') {
        if (w.facilityId !== b.dataset.id) { w.facilityId = b.dataset.id; w.sectorId = null; w.date = null; w.start = null; }
        UA.app.refresh();
      } else if (act === 'pick-sec') {
        if (w.sectorId !== b.dataset.id) { w.sectorId = b.dataset.id; w.date = null; w.start = null; }
        UA.app.refresh();
      } else if (act === 'pick-date') {
        w.date = b.dataset.date; w.start = null;
        UA.app.refresh();
      } else if (act === 'pick-slot') {
        w.start = b.dataset.start;
        UA.app.refresh();
      } else if (act === 'month') {
        var p = w.month.split('-').map(Number);
        var d = new Date(p[0], p[1] - 1 + Number(b.dataset.dir), 1);
        w.month = d.getFullYear() + '-' + U.pad(d.getMonth() + 1);
        UA.app.refresh();
      } else if (act === 'goto') {
        w.step = Number(b.dataset.step); UA.app.refresh();
      } else if (act === 'back') {
        w.step = Math.max(1, w.step - 1); UA.app.refresh();
      } else if (act === 'discard') {
        UA.state.wizard = null; go('/solicitante/panel');
      } else if (act === 'next') {
        var msg = validate(w.step);
        if (msg) { showErr(msg); return; }
        if (w.step === 3 && w.date) w.month = w.date.slice(0, 7);
        w.step += 1; UA.app.refresh(); window.scrollTo(0, 0);
      } else if (act === 'submit') {
        for (var s = 1; s <= 4; s++) {
          var m = validate(s);
          if (m) { w.step = s; UA.app.refresh(); UA.ui.toast(m, 'error'); return; }
        }
        var res = R.createTurn(user.id, w);
        if (!res.ok) { showErr(res.error); return; }
        UA.state.wizard = null;
        if (res.turn.status === 'Confirmado') ui.setFlash('ok', 'Solicitud registrada y confirmada automáticamente. Código de turno: #' + res.turn.id + '.');
        else ui.setFlash('warn', 'Solicitud registrada con código #' + res.turn.id + '. Quedó Pendiente de aprobación administrativa.');
        go('/solicitante/turno/' + res.turn.id);
      }
    });
  }

  /* ========================================================================
     3. MIS TURNOS
     ======================================================================== */
  var STATUS_TABS = [
    { id: 'Todos', label: 'Todos' }, { id: 'Confirmado', label: 'Confirmados', dot: 'ok' },
    { id: 'Pendiente', label: 'En revisión', dot: 'warn' }, { id: 'Denegado', label: 'Denegados', dot: 'err' },
    { id: 'Cancelado', label: 'Cancelados', dot: 'err' }
  ];

  function turnRow(t) {
    var s = db.sector(t.sectorId);
    var p = R.presence(t);
    var can = R.canModify(t).ok;
    var dim = t.status === 'Cancelado' || t.status === 'Denegado' || R.isOver(t) || p === 'Finalizado';
    var extra = '';
    if (p === 'Dentro') extra = ui.badge('Dentro de la instalación', 'ok');
    else if (p === 'Finalizado') extra = ui.badge('Finalizado', 'neutral');
    else if (t.status === 'Confirmado' && R.isOver(t)) extra = ui.badge('Vencido', 'neutral');
    return '<article class="card turn-row' + (dim ? ' dim' : '') + '">' +
      '<div class="code-box mono">#' + t.id + '</div>' +
      '<div class="tr-body"><div class="tr-title">' + esc(facShort(t)) + ' · ' + esc(s.name) + ' ' + ui.levelBadge(s.level, true) + '</div>' +
      '<div class="tr-meta">' + icon('calendar', 'red') + '<strong>' + esc(U.fmtMedium(t.date)) + '</strong><span class="sep">•</span><span class="mono">' + t.start + ' - ' + t.end + ' hs</span></div>' +
      '<div class="tr-sub">' + esc(fac(t)) + ' · ' + esc(s.location) + '</div></div>' +
      '<div class="tr-status">' + ui.statusBadge(t.status) + extra + '</div>' +
      '<div class="tr-actions"><a class="btn btn-secondary btn-sm" href="#/solicitante/turno/' + t.id + '">' + icon('eye') + ' Ver Detalle</a>' +
      (can ? '<a class="btn btn-secondary btn-sm" href="#/solicitante/reprogramar/' + t.id + '">' + icon('edit_calendar') + ' Reprogramar</a>' +
        '<button type="button" class="btn btn-danger-soft btn-sm" data-act="cancel" data-id="' + t.id + '">' + icon('x') + ' Cancelar</button>' : '') +
      '</div></article>';
  }

  function turnosView(user) {
    var f = UA.state.myTurns || (UA.state.myTurns = { q: '', status: 'Todos', period: 'Todos' });
    var mine = db.turns(function (t) { return t.userId === user.id; });
    var activeCount = mine.filter(R.isUpcoming).length;

    var html = '<section class="card hero">' +
      '<div><div class="eyebrow"><span class="chip mono xs">' + icon('shield') + ' GESTIÓN DE RESERVAS</span></div>' +
      '<h1>Mis Turnos y Reservas de Acceso</h1><p class="subtitle">Consulte y administre sus solicitudes de ingreso programadas en las instalaciones Umbrella.</p></div>' +
      '<div class="hero-stat"><div class="label-sm">Total reservas</div><div><span class="big">' + mine.length + '</span>' + ui.badge(activeCount + ' activas', 'ok') + '</div></div></section>' +
      '<section class="card filters">' +
      '<div class="input-icon grow">' + icon('search') + '<input id="mt-q" class="input" placeholder="Buscar por código, sector o instalación" value="' + esc(f.q) + '"></div>' +
      '<div class="tabs" id="mt-tabs" role="tablist"></div>' +
      '<label class="inline-field">' + icon('calendar') + '<select id="mt-period" class="input input-sm" aria-label="Filtrar por fecha">' +
      ['Todos', 'Próximos', 'Anteriores'].map(function (p) { return '<option' + (f.period === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') +
      '</select></label></section>' +
      '<div id="mt-list" class="stack"></div>';

    function mount(root) {
      function render() {
        var q = U.norm(f.q);
        var base = mine.filter(function (t) {
          if (f.period === 'Próximos' && !R.isUpcoming(t)) return false;
          if (f.period === 'Anteriores' && R.isUpcoming(t)) return false;
          if (q) {
            var s = db.sector(t.sectorId);
            var hay = U.norm(t.id + ' ' + s.name + ' ' + fac(t) + ' ' + s.location);
            if (hay.indexOf(q.replace('#', '')) < 0) return false;
          }
          return true;
        });
        root.querySelector('#mt-tabs').innerHTML = STATUS_TABS.map(function (tab) {
          var n = tab.id === 'Todos' ? base.length : base.filter(function (t) { return t.status === tab.id; }).length;
          return '<button type="button" role="tab" class="tab' + (f.status === tab.id ? ' active' : '') + '" data-tab="' + tab.id + '">' +
            (tab.dot ? '<span class="dot dot-' + tab.dot + '"></span>' : '') + tab.label + ' <span class="count">' + n + '</span></button>';
        }).join('');
        var list = base.filter(function (t) { return f.status === 'Todos' || t.status === f.status; });
        var upcoming = list.filter(R.isUpcoming).sort(byDate);
        var rest = list.filter(function (t) { return !R.isUpcoming(t); }).sort(byDate).reverse();
        var all = upcoming.concat(rest);
        root.querySelector('#mt-list').innerHTML = all.length
          ? all.map(turnRow).join('') + '<div class="card list-foot">Mostrando <strong>' + all.length + '</strong> de ' + mine.length + ' turnos registrados</div>'
          : '<div class="card">' + ui.empty('calendar_x', 'No se encontraron turnos', mine.length ? 'Pruebe con otros filtros de búsqueda.' : 'Todavía no registró solicitudes de acceso.',
            '<a class="btn btn-primary btn-sm" href="#/solicitante/solicitar">' + icon('add') + ' Solicitar Turno</a>') + '</div>';
      }
      root.querySelector('#mt-q').addEventListener('input', function (e) { f.q = e.target.value; render(); });
      root.querySelector('#mt-period').addEventListener('change', function (e) { f.period = e.target.value; render(); });
      root.addEventListener('click', function (e) {
        var tab = e.target.closest('[data-tab]');
        if (tab) { f.status = tab.dataset.tab; render(); return; }
        var b = e.target.closest('[data-act="cancel"]');
        if (b) askCancel(user, b.dataset.id);
      });
      render();
    }
    return { html: html, mount: mount };
  }

  /* ========================================================================
     4. DETALLE DEL TURNO
     ======================================================================== */
  function notFound(text) {
    return { html: '<div class="card">' + ui.empty('warning', 'Turno no disponible', text,
      '<a class="btn btn-secondary btn-sm" href="#/solicitante/turnos">' + icon('arrow_left') + ' Volver a Mis Turnos</a>') + '</div>' };
  }

  function detalleView(user, params) {
    var t = db.turn(params[0]);
    if (!t || t.userId !== user.id) return notFound('El turno solicitado no existe o no pertenece a su cuenta.');
    var s = db.sector(t.sectorId), f = db.facility(t.facilityId);
    var p = R.presence(t);
    var auth = R.authorization(t);
    var can = R.canModify(t);
    var inRec = R.record(t, 'Ingreso'), outRec = R.record(t, 'Egreso');

    var banner;
    if (t.status === 'Pendiente') banner = ['warn', 'hourglass', 'SOLICITUD EN REVISIÓN', 'La solicitud requiere aprobación administrativa. Todavía no está habilitado para ingresar.'];
    else if (t.status === 'Denegado') banner = ['err', 'x_circle', 'SOLICITUD DENEGADA', 'Administración rechazó la solicitud.' + (t.resolutionNote ? ' Motivo: ' + t.resolutionNote : '')];
    else if (t.status === 'Cancelado') banner = ['err', 'calendar_x', 'TURNO CANCELADO', 'La reserva fue cancelada y el cupo liberado.'];
    else if (p === 'Dentro') banner = ['ok', 'door', 'INGRESO REGISTRADO', 'Se encuentra dentro de la instalación desde las ' + U.fmtClock(inRec.at) + ' hs.'];
    else if (p === 'Finalizado') banner = ['neutral', 'check_circle', 'TURNO FINALIZADO', 'Ingreso ' + U.fmtClock(inRec.at) + ' hs · Egreso ' + U.fmtClock(outRec.at) + ' hs.'];
    else if (R.isOver(t)) banner = ['neutral', 'clock', 'TURNO VENCIDO', 'La franja horaria finalizó sin registrarse un ingreso.'];
    else if (auth.state !== 'Autorizado') banner = ['err', 'warning', 'AUTORIZACIÓN NO VÁLIDA', auth.reasons.join(' ')];
    else banner = ['ok', 'check_circle', 'TURNO CONFIRMADO Y AUTORIZADO', 'Su turno está habilitado para ingresar en el horario y sector asignados.'];

    var history = t.history.slice().reverse().map(function (h) {
      return '<li><span class="mono xs muted">' + esc(U.fmtTs(h.at)) + '</span><span>' + esc(h.text) + '</span></li>';
    }).join('');

    var actions = can.ok
      ? '<a class="btn btn-secondary btn-block" href="#/solicitante/reprogramar/' + t.id + '">' + icon('edit_calendar') + ' Reprogramar turno</a>' +
        '<button type="button" class="btn btn-danger-soft btn-block" data-act="cancel">' + icon('x_circle') + ' Cancelar reserva de acceso</button>'
      : '<p class="muted sm">' + icon('lock') + ' No hay acciones disponibles: ' + esc(can.error.charAt(0).toLowerCase() + can.error.slice(1)) + '</p>';

    var html = ui.takeFlash() +
      '<nav class="breadcrumb">' + icon('calendar') + '<a href="#/solicitante/turnos">Mis Turnos</a><span>/</span><span class="mono">' + t.id + '</span><span>/</span><strong>Detalle del Turno</strong></nav>' +
      '<section class="banner banner-' + banner[0] + '">' + icon(banner[1], 'banner-ico') +
      '<div class="grow"><div class="banner-title">' + banner[2] + '</div><div>' + esc(banner[3]) + '</div></div>' +
      '<div class="banner-right"><div class="label-sm">Punto de acceso</div><div class="mono sm">Puesto de Guardia — ' + esc(f.short) + '</div></div></section>' +
      '<div class="grid-main-aside">' +
      ' <div class="stack">' +
      '  <section class="card">' +
      '   <div class="card-title"><div><h3 class="upper">Pase de acceso a instalaciones</h3><div class="mono xs muted">Comprobante digital del turno</div></div>' + ui.levelBadge(s.level, true) + '</div>' +
      '   <div class="code-panel"><div><div class="label-sm">Identificador de turno</div><div class="code-big mono">#' + t.id + '</div>' +
      '     <div class="xs ' + (auth.state === 'Autorizado' && p === 'Sin ingreso' && !R.isOver(t) ? 'green' : 'muted') + ' mono">● ' +
      (auth.state === 'Autorizado' && p === 'Sin ingreso' && !R.isOver(t) ? 'Válido para ingreso' : 'Estado: ' + esc(t.status) + ' · Presencia: ' + esc(p)) + '</div></div>' +
      '     <div class="code-hint">' + icon('shield_check', 'red') + '<span>Presente este código y su identificación al oficial de guardia. La verificación es manual.</span></div></div>' +
      '   <dl class="kv-grid boxed">' +
      '    <div><dt>Titular</dt><dd><strong>' + esc(user.name) + '</strong><span class="muted block">' + esc(user.position) + ' (ID: ' + esc(user.id) + ')</span></dd></div>' +
      '    <div><dt>Estado de autorización</dt><dd>' + ui.statusBadge(t.status) + '<span class="muted block">Presencia: ' + esc(p) + '</span></dd></div>' +
      '    <div><dt>Instalación</dt><dd><strong>' + esc(f.name) + '</strong><span class="muted block">' + esc(f.location) + '</span></dd></div>' +
      '    <div><dt>Sector asignado</dt><dd><strong>' + esc(s.name) + '</strong><span class="muted block">' + esc(s.location) + '</span></dd></div>' +
      '    <div><dt>Fecha programada</dt><dd><strong>' + esc(U.fmtLong(t.date)) + '</strong></dd></div>' +
      '    <div><dt>Horario asignado</dt><dd><strong class="mono">' + t.start + ' a ' + t.end + ' hs</strong><span class="amber block xs">Ingreso habilitado desde ' + R.ENTRY_ADVANCE_MIN + ' min antes del inicio</span></dd></div>' +
      '    <div class="span-2"><dt>Motivo</dt><dd>' + esc(t.reason) + (t.detail ? '<span class="muted block">' + esc(t.detail) + '</span>' : '') + '</dd></div>' +
      '   </dl></section>' +
      '  <section class="card note">' + icon('info', 'info-ico') + '<span>Pase personal e intransferible. Presente el código de turno o su identificación al personal de guardia al momento del ingreso.</span>' + ui.badge('Nivel ' + s.level + ' requerido', 'neutral') + '</section>' +
      ' </div>' +
      ' <aside class="stack">' +
      '  <section class="card"><div class="card-title">' + icon('shield', 'red') + '<h3>Requisitos de Ingreso</h3></div>' +
      '   <ol class="req-list"><li><strong>Código de turno</strong><span>Presentar el código alfanumérico #' + t.id + ' al personal de seguridad.</span></li>' +
      '   <li><strong>Identificación ante el personal de seguridad</strong><span>Documento o credencial corporativa para la verificación manual del guardia.</span></li>' +
      '   <li><strong>Equipo de protección requerido</strong><span>Uso obligatorio del equipo provisto en el puesto de acceso del sector.</span></li></ol></section>' +
      '  <section class="card"><div class="card-title">' + icon('history', 'red') + '<h3>Historial de la Solicitud</h3>' + ui.badge(U.plural(t.history.length, 'evento', 'eventos'), 'ok') + '</div>' +
      '   <ul class="timeline">' + history + '</ul></section>' +
      '  <section class="card"><div class="card-title"><h3 class="upper">Acciones operativas</h3></div><div class="stack-sm">' + actions + '</div></section>' +
      ' </aside>' +
      '</div>';
    return {
      html: html,
      mount: function (root) {
        var b = root.querySelector('[data-act="cancel"]');
        if (b) b.addEventListener('click', function () { askCancel(user, t.id); });
      }
    };
  }

  /* ========================================================================
     5. REPROGRAMACIÓN
     ======================================================================== */
  function reprogramarView(user, params) {
    var t = db.turn(params[0]);
    if (!t || t.userId !== user.id) return notFound('El turno solicitado no existe o no pertenece a su cuenta.');
    var s = db.sector(t.sectorId), f = db.facility(t.facilityId);
    var can = R.canModify(t);
    if (!can.ok) {
      return {
        html: '<nav class="breadcrumb">' + icon('calendar') + '<a href="#/solicitante/turnos">Mis Turnos</a><span>/</span><a class="mono" href="#/solicitante/turno/' + t.id + '">' + t.id + '</a><span>/</span><strong>Reprogramar</strong></nav>' +
          '<div class="card">' + ui.empty('lock', 'Este turno no admite reprogramación', can.error,
            '<a class="btn btn-secondary btn-sm" href="#/solicitante/turno/' + t.id + '">' + icon('arrow_left') + ' Volver al detalle</a>') + '</div>'
      };
    }
    var st = UA.state.resched;
    if (!st || st.turnId !== t.id) st = UA.state.resched = { turnId: t.id, weekStart: U.today(), date: null, start: null, motive: '', obs: '' };
    var today = U.today(), max = R.maxDate();

    var days = '';
    for (var i = 0; i < 7; i++) {
      var iso = U.addDays(st.weekStart, i);
      if (iso > max) break;
      var ds = R.dayStatus(s, iso, t.id);
      var d = U.parse(iso);
      var sub = ds.state === 'available' ? ds.free + ' libres' : ds.state === 'full' ? 'Completo' : ds.state === 'closed' ? 'Cerrado' : 'Sin franjas';
      days += '<button type="button" class="day-btn ' + ds.state + (st.date === iso ? ' selected' : '') + '" data-act="day" data-date="' + iso + '"' + (ds.state === 'available' ? '' : ' disabled') + '>' +
        '<span class="day-name">' + U.DAYS_SHORT[d.getDay()].toUpperCase() + '</span><span class="day-num">' + d.getDate() + '</span>' +
        '<span class="day-sub"><span class="cal-dot"></span>' + sub + '</span></button>';
    }
    var weekEnd = U.addDays(st.weekStart, 6);
    var motives = RESCHEDULE_REASONS.map(function (m) { return '<option' + (st.motive === m ? ' selected' : '') + '>' + m + '</option>'; }).join('');

    var html = '<nav class="breadcrumb">' + icon('calendar') + '<a href="#/solicitante/turnos">Mis Turnos</a><span>/</span><a class="mono" href="#/solicitante/turno/' + t.id + '">' + t.id + '</a><span>/</span><strong class="red">Reprogramar acceso</strong></nav>' +
      ui.pageHeader('', 'Reprogramación de Turno de Acceso', 'Seleccione una nueva fecha y franja horaria disponible para transferir su reserva. El código del turno se conserva.') +
      '<div class="grid-aside-main">' +
      ' <section class="card">' +
      '  <div class="card-title"><div><div class="label-sm">Registro inicial</div><h3>Turno Original Actual</h3></div>' + ui.badge('Vigente', 'ok', true) + '</div>' +
      '  <dl class="kv-list boxed">' +
      '   <div><dt>Código de turno</dt><dd class="mono strong">#' + t.id + '</dd></div>' +
      '   <div><dt>Instalación y sector</dt><dd><strong>' + esc(f.short) + ' // ' + esc(s.name) + '</strong><span class="muted block xs">' + esc(s.location) + '</span></dd></div>' +
      '   <div><dt>Fecha registrada</dt><dd class="amber strong">' + esc(U.fmtLong(t.date)) + '</dd></div>' +
      '   <div><dt>Franja horaria actual</dt><dd class="mono">' + t.start + ' - ' + t.end + ' hs</dd></div>' +
      '   <div><dt>Titular</dt><dd>' + esc(user.name) + ' ' + ui.levelBadge(user.level, true) + '</dd></div>' +
      '   <div><dt>Estado</dt><dd>' + ui.statusBadge(t.status) + '</dd></div>' +
      '  </dl>' +
      '  <div class="alert alert-err mt">' + icon('warning') + '<div><strong>Liberación de cupo inmediata</strong><br>Al confirmar la nueva fecha, su cupo actual del ' + esc(U.fmtDayMonth(t.date)) + ' quedará liberado para otras personas autorizadas.</div></div>' +
      ' </section>' +
      ' <section class="card">' +
      '  <div class="card-title"><div><div class="label-sm red">Configuración de traslado</div><h3>Selección de Nueva Fecha y Horario</h3></div><span class="mono xs muted">DISPONIBILIDAD EN TIEMPO REAL</span></div>' +
      '  <div class="week-head">' + icon('calendar', 'red') + '<span class="label-sm">Semana del ' + esc(U.fmtShort(st.weekStart)) + ' al ' + esc(U.fmtShort(weekEnd)) + '</span>' +
      '   <div class="month-nav"><button type="button" class="icon-btn" data-act="week" data-dir="-1"' + (st.weekStart <= today ? ' disabled' : '') + ' aria-label="Semana anterior">' + icon('chevron_left') + '</button>' +
      '   <button type="button" class="icon-btn" data-act="week" data-dir="1"' + (U.addDays(st.weekStart, 7) > max ? ' disabled' : '') + ' aria-label="Semana siguiente">' + icon('chevron_right') + '</button></div></div>' +
      '  <div class="week-strip">' + days + '</div>' +
      '  <div class="label-sm mt">' + icon('clock', 'red') + ' Franjas horarias ' + (st.date ? 'disponibles (' + esc(U.fmtDayMonth(st.date)) + ')' : '') + ' · duración estándar: ' + s.slotHours + ' horas</div>' +
      slotPicker(s, st.date, st.start, t.id, { date: t.date, start: t.start }) +
      '  <div class="field mt"><label for="rp-motive">Motivo de la reprogramación <span class="req">*</span></label>' +
      '   <select id="rp-motive" class="input"><option value="">Seleccione un motivo…</option>' + motives + '</select></div>' +
      '  <div class="field"><div class="label-row"><label for="rp-obs">Observaciones adicionales</label><span class="mono xs muted" id="rp-count">' + st.obs.length + '/300</span></div>' +
      '   <textarea id="rp-obs" class="input" rows="3" maxlength="300" placeholder="Opcional">' + esc(st.obs) + '</textarea></div>' +
      ' </section>' +
      '</div>' +
      '<section class="card note info-soft">' + icon('shield_check', 'red') + '<div><strong>Mantenimiento de la autorización</strong><br><span class="muted">La reprogramación conserva el estado de autorización actual (' + esc(t.status) + '). El ingreso se registrará manualmente por el oficial de guardia en el puesto de acceso.</span></div></section>' +
      '<div class="alert alert-err hidden" id="rp-error" role="alert"></div>' +
      '<div class="form-nav plain"><a class="btn btn-secondary" href="#/solicitante/turno/' + t.id + '">' + icon('arrow_left') + ' Descartar cambios y mantener turno original</a>' +
      '<button type="button" class="btn btn-primary btn-lg" data-act="confirm">' + icon('refresh') + ' Confirmar Reprogramación de Turno</button></div>';

    function mount(root) {
      var err = root.querySelector('#rp-error');
      root.querySelector('#rp-motive').addEventListener('change', function (e) { st.motive = e.target.value; });
      root.querySelector('#rp-obs').addEventListener('input', function (e) {
        st.obs = e.target.value;
        root.querySelector('#rp-count').textContent = st.obs.length + '/300';
      });
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b || b.disabled) return;
        var act = b.dataset.act;
        if (act === 'day') { st.date = b.dataset.date; st.start = null; UA.app.refresh(); }
        else if (act === 'pick-slot') { st.start = b.dataset.start; UA.app.refresh(); }
        else if (act === 'week') {
          var ns = U.addDays(st.weekStart, 7 * Number(b.dataset.dir));
          st.weekStart = ns < today ? today : ns;
          UA.app.refresh();
        } else if (act === 'confirm') {
          var msg = !st.date ? 'Seleccione una nueva fecha.' : !st.start ? 'Seleccione una nueva franja horaria.' : !st.motive ? 'Seleccione el motivo de la reprogramación.' : null;
          if (!msg) { var v = R.validateSlot(user, s, st.date, st.start, t.id); if (!v.ok) msg = v.error; }
          if (msg) { err.innerHTML = icon('warning') + '<div>' + esc(msg) + '</div>'; err.classList.remove('hidden'); return; }
          var slot = db.slotsFor(s).filter(function (x) { return x.start === st.start; })[0];
          ui.confirm({
            title: 'Confirmar reprogramación',
            message: '<p>Se modificará el turno <strong class="mono">#' + t.id + '</strong>:</p>' +
              '<div class="change-box"><div><div class="label-sm">Actual</div><div>' + esc(U.fmtMedium(t.date)) + '</div><div class="mono">' + t.start + ' - ' + t.end + ' hs</div></div>' +
              icon('arrow_right', 'red') + '<div><div class="label-sm">Nuevo</div><div><strong>' + esc(U.fmtMedium(st.date)) + '</strong></div><div class="mono strong">' + slot.start + ' - ' + slot.end + ' hs</div></div></div>' +
              '<p class="muted sm">Motivo: ' + esc(st.motive) + '. El cupo anterior será liberado.</p>',
            confirmLabel: icon('check') + ' Confirmar cambio'
          }, function (_, close) {
            var r = R.rescheduleTurn(t.id, user.id, st.date, st.start, st.motive, st.obs.trim());
            close();
            if (!r.ok) { err.innerHTML = icon('warning') + '<div>' + esc(r.error) + '</div>'; err.classList.remove('hidden'); UA.ui.toast(r.error, 'error'); return; }
            UA.state.resched = null;
            ui.setFlash('ok', 'Turno reprogramado para el ' + U.fmtLong(r.turn.date) + ' (' + r.turn.start + ' - ' + r.turn.end + ' hs). El cupo anterior fue liberado.');
            go('/solicitante/turno/' + t.id);
          });
        }
      });
    }
    return { html: html, mount: mount };
  }

  UA.views = UA.views || {};
  UA.views.solPanel = panelView;
  UA.views.solSolicitar = solicitarView;
  UA.views.solTurnos = turnosView;
  UA.views.solDetalle = detalleView;
  UA.views.solReprogramar = reprogramarView;
})();
