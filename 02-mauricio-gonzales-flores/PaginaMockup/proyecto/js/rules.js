/* ==========================================================================
   Umbrella Access — reglas de negocio
   --------------------------------------------------------------------------
   Todas las operaciones que modifican datos pasan por estas funciones, que
   validan y luego guardan en la fuente única (UA.db). Cada operación devuelve
   { ok: true, ... } o { ok: false, error: 'mensaje' }.
   ========================================================================== */
(function () {
  'use strict';
  var UA = (window.UA = window.UA || {});
  var U = UA.U;
  var db = UA.db;

  var ACTIVE = ['Pendiente', 'Confirmado'];
  var BOOKING_WINDOW_DAYS = 60;   // anticipación máxima para reservar
  var ENTRY_ADVANCE_MIN = 30;     // el ingreso se habilita 30 min antes del inicio

  var LEVEL_NAMES = { 1: 'Acceso general', 2: 'Técnico', 3: 'Restringido', 4: 'Especial' };

  function fail(msg, extra) { var r = { ok: false, error: msg }; if (extra) Object.keys(extra).forEach(function (k) { r[k] = extra[k]; }); return r; }
  function ok(extra) { var r = { ok: true }; if (extra) Object.keys(extra).forEach(function (k) { r[k] = extra[k]; }); return r; }

  var R = {
    ACTIVE: ACTIVE,
    BOOKING_WINDOW_DAYS: BOOKING_WINDOW_DAYS,
    ENTRY_ADVANCE_MIN: ENTRY_ADVANCE_MIN,
    LEVEL_NAMES: LEVEL_NAMES,
    levelLabel: function (n) { return 'Nivel ' + n + ' — ' + (LEVEL_NAMES[n] || ''); },

    /* ====================================================================
       Disponibilidad
       ==================================================================== */
    maxDate: function () { return U.addDays(U.today(), BOOKING_WINDOW_DAYS); },

    /** ¿El sector admite reservas en esa fecha? (estado, fines de semana, ventana) */
    dateOpen: function (sector, date) {
      if (!sector || sector.status !== 'Habilitado') return false;
      var fac = db.facility(sector.facilityId);
      if (!fac || fac.status !== 'Operativo') return false;
      if (!sector.weekends && U.isWeekend(date)) return false;
      return true;
    },

    slotUsed: function (sectorId, date, start, excludeId) {
      return db.turns(function (t) {
        return t.sectorId === sectorId && t.date === date && t.start === start &&
          ACTIVE.indexOf(t.status) >= 0 && t.id !== excludeId;
      }).length;
    },

    /** Franjas de un sector para una fecha, con cupos usados/libres y si están vencidas. */
    availability: function (sector, date, excludeId) {
      var today = U.today();
      var N = U.nowMin();
      var open = R.dateOpen(sector, date) && date >= today && date <= R.maxDate();
      return db.slotsFor(sector).map(function (s) {
        var used = R.slotUsed(sector.id, date, s.start, excludeId);
        var free = Math.max(0, sector.capacity - used);
        var past = date < today || (date === today && U.toMin(s.start) <= N);
        return { start: s.start, end: s.end, used: used, free: free, past: past, available: open && !past && free > 0 };
      });
    },

    /** Resumen de un día: 'closed' | 'past' | 'full' | 'available' y cupos libres totales. */
    dayStatus: function (sector, date, excludeId) {
      var today = U.today();
      if (date < today) return { state: 'past', free: 0 };
      if (date > R.maxDate()) return { state: 'out', free: 0 };
      if (!R.dateOpen(sector, date)) return { state: 'closed', free: 0 };
      var av = R.availability(sector, date, excludeId);
      var free = av.reduce(function (acc, s) { return acc + (s.available ? s.free : 0); }, 0);
      if (!av.some(function (s) { return s.available; })) {
        return { state: av.every(function (s) { return s.past; }) ? 'past' : 'full', free: 0 };
      }
      return { state: 'available', free: free };
    },

    /* ====================================================================
       Autorización para solicitar un sector
       - Nivel del usuario menor al requerido → no puede solicitar.
       - Sector entre sus autorizaciones y sin aprobación obligatoria → se
         confirma automáticamente.
       - En otro caso → queda Pendiente de aprobación administrativa.
       ==================================================================== */
    evaluateAccess: function (user, sector) {
      if (!sector || sector.status !== 'Habilitado') return { allowed: false, mode: null, reason: 'Sector en mantenimiento' };
      if (!user || user.status !== 'Activo') return { allowed: false, mode: null, reason: 'Usuario inactivo' };
      if (user.level < sector.level) {
        return { allowed: false, mode: null, reason: 'Nivel insuficiente: requiere Nivel ' + sector.level + ' (su nivel: ' + user.level + ')' };
      }
      var listed = user.sectors.indexOf(sector.id) >= 0;
      if (listed && !sector.requiresApproval) return { allowed: true, mode: 'auto', reason: 'Autorización directa' };
      if (sector.requiresApproval) return { allowed: true, mode: 'approval', reason: 'El sector exige aprobación administrativa' };
      return { allowed: true, mode: 'approval', reason: 'Sector fuera de sus autorizaciones: requiere aprobación' };
    },

    /* ====================================================================
       Estado de presencia (derivado de los registros de acceso)
       ==================================================================== */
    presence: function (turn) {
      var recs = db.records(function (r) { return r.turnId === turn.id; });
      var hasIn = recs.some(function (r) { return r.type === 'Ingreso'; });
      var hasOut = recs.some(function (r) { return r.type === 'Egreso'; });
      if (hasOut) return 'Finalizado';
      if (hasIn) return 'Dentro';
      return 'Sin ingreso';
    },
    record: function (turn, type) {
      return db.records(function (r) { return r.turnId === turn.id && r.type === type; })[0] || null;
    },
    occupancy: function (sectorId) {
      return db.turns(function (t) { return t.sectorId === sectorId; })
        .filter(function (t) { return R.presence(t) === 'Dentro'; }).length;
    },
    userInside: function (userId, exceptTurnId) {
      return db.turns(function (t) { return t.userId === userId && t.id !== exceptTurnId; })
        .filter(function (t) { return R.presence(t) === 'Dentro'; })[0] || null;
    },

    /* ====================================================================
       Estado de autorización de un turno (independiente de la presencia)
       ==================================================================== */
    authorization: function (turn) {
      if (turn.status === 'Pendiente') return { state: 'Pendiente', label: 'Pendiente', reasons: ['La solicitud aguarda aprobación administrativa.'] };
      if (turn.status === 'Denegado') return { state: 'Denegado', label: 'Denegado', reasons: ['Solicitud rechazada' + (turn.resolutionNote ? ': ' + turn.resolutionNote : '.')] };
      if (turn.status === 'Cancelado') return { state: 'Denegado', label: 'Cancelado', reasons: ['El turno fue cancelado.'] };
      var user = db.user(turn.userId);
      var sector = db.sector(turn.sectorId);
      var reasons = [];
      if (!user || user.status !== 'Activo') reasons.push('La cuenta del solicitante está inactiva.');
      if (user && sector && user.level < sector.level) reasons.push('Nivel de autorización insuficiente (requiere Nivel ' + sector.level + ').');
      if (user && sector && user.sectors.indexOf(sector.id) < 0 && !turn.approvedBy) reasons.push('El sector ya no figura entre las autorizaciones del solicitante.');
      if (!sector || sector.status !== 'Habilitado') reasons.push('El sector se encuentra en mantenimiento.');
      if (reasons.length) return { state: 'Denegado', label: 'Denegado', reasons: reasons };
      return { state: 'Autorizado', label: 'Autorizado', reasons: [] };
    },

    /** ¿Terminó la franja del turno? */
    isOver: function (turn) {
      var today = U.today();
      return turn.date < today || (turn.date === today && U.toMin(turn.end) <= U.nowMin());
    },
    /** ¿Ya comenzó la franja? (desde ese momento no se puede cancelar ni reprogramar) */
    hasStarted: function (turn) {
      var today = U.today();
      return turn.date < today || (turn.date === today && U.toMin(turn.start) <= U.nowMin());
    },

    /** ¿Se puede cancelar / reprogramar? */
    canModify: function (turn) {
      if (turn.status === 'Cancelado') return fail('El turno está cancelado.');
      if (turn.status === 'Denegado') return fail('La solicitud fue denegada.');
      var p = R.presence(turn);
      if (p === 'Finalizado') return fail('El turno ya fue utilizado (finalizado).');
      if (p === 'Dentro') return fail('La persona se encuentra dentro de la instalación.');
      if (R.hasStarted(turn)) return fail('La franja horaria ya comenzó o finalizó.');
      return ok();
    },

    /** ¿El turno está próximo/vigente? (para paneles y listados) */
    isUpcoming: function (turn) {
      return ACTIVE.indexOf(turn.status) >= 0 && !R.isOver(turn) && R.presence(turn) !== 'Finalizado';
    },

    /* ====================================================================
       Validación común de una fecha/franja para reservar o reprogramar
       ==================================================================== */
    validateSlot: function (user, sector, date, start, excludeId) {
      if (!date) return fail('Seleccione una fecha.');
      if (!start) return fail('Seleccione una franja horaria.');
      var today = U.today();
      if (date < today) return fail('No se pueden reservar fechas pasadas.');
      if (date > R.maxDate()) return fail('Solo se admiten reservas con hasta ' + BOOKING_WINDOW_DAYS + ' días de anticipación.');
      if (!R.dateOpen(sector, date)) return fail('El sector no habilita turnos en la fecha seleccionada.');
      var slot = R.availability(sector, date, excludeId).filter(function (s) { return s.start === start; })[0];
      if (!slot) return fail('La franja seleccionada no existe para este sector.');
      if (slot.past) return fail('La franja seleccionada ya comenzó.');
      if (slot.free <= 0) return fail('El horario seleccionado no tiene cupos disponibles. Elija otra franja.');
      var overlap = db.turns(function (t) {
        return t.userId === user.id && t.id !== excludeId && t.date === date && ACTIVE.indexOf(t.status) >= 0 &&
          U.toMin(t.start) < U.toMin(slot.end) && U.toMin(slot.start) < U.toMin(t.end);
      })[0];
      if (overlap) return fail('Ya posee el turno ' + overlap.id + ' en un horario superpuesto ese día.');
      return ok({ slot: slot });
    },

    /* ====================================================================
       Operaciones del Solicitante
       ==================================================================== */
    createTurn: function (userId, data) {
      var user = db.user(userId);
      if (!user || user.role !== 'solicitante') return fail('Solo los solicitantes pueden reservar turnos.');
      if (!data.facilityId) return fail('Seleccione una instalación.');
      var sector = db.sector(data.sectorId);
      if (!sector || sector.facilityId !== data.facilityId) return fail('Seleccione un sector válido de la instalación.');
      if (!data.reason) return fail('Indique el motivo de la visita.');
      if (data.reason === 'Otro' && !String(data.detail || '').trim()) return fail('Describa el motivo de la visita.');
      var access = R.evaluateAccess(user, sector);
      if (!access.allowed) return fail('No es posible solicitar este sector: ' + access.reason + '.');
      var v = R.validateSlot(user, sector, data.date, data.start);
      if (!v.ok) return v;

      var now = Date.now();
      var status = access.mode === 'auto' ? 'Confirmado' : 'Pendiente';
      var turn = {
        id: db.nextTurnId(), userId: user.id, sectorId: sector.id, facilityId: sector.facilityId,
        date: data.date, start: v.slot.start, end: v.slot.end,
        reason: data.reason, detail: String(data.detail || '').trim(), status: status,
        createdAt: now, approvedBy: null, resolvedAt: null, resolutionNote: '',
        history: [{ at: now, text: 'Solicitud registrada por ' + user.name + '.' }]
      };
      var fac = db.facility(sector.facilityId);
      var where = sector.name + ' (' + fac.name + ')';
      var when = U.fmtLong(turn.date) + ' (' + turn.start + ' - ' + turn.end + ' hs)';
      if (status === 'Confirmado') {
        turn.history.push({ at: now, text: 'Confirmada automáticamente: autorización vigente para el sector.' });
        db.notify(user.id, 'confirmacion', 'Turno de acceso confirmado y autorizado',
          'Su solicitud ' + turn.id + ' para ' + where + ' fue confirmada para el ' + when +
          '. Preséntese ante el oficial de guardia con su documento y el código de turno.', turn.id);
      } else {
        turn.history.push({ at: now, text: 'Enviada a revisión administrativa (' + access.reason.toLowerCase() + ').' });
        db.notify(user.id, 'pendiente', 'Solicitud enviada a revisión administrativa',
          'Su solicitud ' + turn.id + ' para ' + where + ' (' + when + ') requiere aprobación administrativa. ' +
          'Recibirá un aviso cuando sea resuelta.', turn.id);
      }
      db.data().turns.push(turn);
      db.save();
      return ok({ turn: turn });
    },

    cancelTurn: function (turnId, userId) {
      var turn = db.turn(turnId);
      if (!turn || turn.userId !== userId) return fail('El turno no existe o no le pertenece.');
      var c = R.canModify(turn);
      if (!c.ok) return fail('No se puede cancelar: ' + c.error);
      var now = Date.now();
      turn.status = 'Cancelado';
      turn.history.push({ at: now, text: 'Turno cancelado por el solicitante. Cupo liberado.' });
      var sector = db.sector(turn.sectorId);
      db.notify(userId, 'cancelacion', 'Cancelación confirmada de reserva de turno',
        'El turno ' + turn.id + ' para ' + sector.name + ' del ' + U.fmtLong(turn.date) + ' (' + turn.start + ' - ' + turn.end +
        ' hs) fue cancelado. El cupo fue reintegrado a la disponibilidad del sector.', turn.id);
      db.save();
      return ok({ turn: turn });
    },

    rescheduleTurn: function (turnId, userId, date, start, motive, obs) {
      var turn = db.turn(turnId);
      var user = db.user(userId);
      if (!turn || !user || turn.userId !== userId) return fail('El turno no existe o no le pertenece.');
      var c = R.canModify(turn);
      if (!c.ok) return fail('No se puede reprogramar: ' + c.error);
      if (!motive) return fail('Seleccione el motivo de la reprogramación.');
      if (date === turn.date && start === turn.start) return fail('Seleccione una fecha u horario diferente al actual.');
      var sector = db.sector(turn.sectorId);
      var v = R.validateSlot(user, sector, date, start, turn.id);
      if (!v.ok) return v;
      var now = Date.now();
      var before = U.fmtShort(turn.date) + ' ' + turn.start + '-' + turn.end;
      turn.date = date;
      turn.start = v.slot.start;
      turn.end = v.slot.end;
      turn.history.push({ at: now, text: 'Turno reprogramado del ' + before + ' al ' + U.fmtShort(date) + ' ' + turn.start + '-' + turn.end +
        '. Motivo: ' + motive + (obs ? ' (' + obs + ')' : '') + '. Cupo anterior liberado.' });
      db.notify(userId, 'reprogramacion', 'Reprogramación exitosa de turno',
        'El turno ' + turn.id + ' fue reprogramado para el ' + U.fmtLong(date) + ' (' + turn.start + ' - ' + turn.end +
        ' hs). El cupo anterior (' + before + ') fue liberado. Estado de autorización: ' + turn.status + '.', turn.id);
      db.save();
      return ok({ turn: turn });
    },

    /* ====================================================================
       Operaciones del Administrador sobre solicitudes
       ==================================================================== */
    approveTurn: function (turnId, adminId) {
      var admin = db.user(adminId);
      if (!admin || admin.role !== 'admin') return fail('Operación permitida solo para Administración.');
      var turn = db.turn(turnId);
      if (!turn) return fail('La solicitud no existe.');
      if (turn.status !== 'Pendiente') return fail('La solicitud ya fue resuelta (' + turn.status + ').');
      if (R.isOver(turn)) return fail('La franja horaria de la solicitud ya finalizó. Solo puede rechazarse.');
      var sector = db.sector(turn.sectorId);
      var user = db.user(turn.userId);
      if (!sector || sector.status !== 'Habilitado') return fail('El sector se encuentra en mantenimiento.');
      if (!user || user.status !== 'Activo') return fail('La cuenta del solicitante está inactiva.');
      if (user.level < sector.level) return fail('El solicitante no posee el nivel requerido (Nivel ' + sector.level + ').');
      var used = R.slotUsed(sector.id, turn.date, turn.start, turn.id);
      if (used >= sector.capacity) return fail('La franja no tiene cupos disponibles.');
      var now = Date.now();
      turn.status = 'Confirmado';
      turn.approvedBy = admin.id;
      turn.resolvedAt = now;
      turn.history.push({ at: now, text: 'Solicitud aprobada por ' + admin.name + '.' });
      db.notify(user.id, 'aprobacion', 'Solicitud aprobada por Administración',
        'Su solicitud ' + turn.id + ' para ' + sector.name + ' fue aprobada para el ' + U.fmtLong(turn.date) +
        ' (' + turn.start + ' - ' + turn.end + ' hs). El turno se encuentra Confirmado.', turn.id);
      db.save();
      return ok({ turn: turn });
    },

    rejectTurn: function (turnId, adminId, note) {
      var admin = db.user(adminId);
      if (!admin || admin.role !== 'admin') return fail('Operación permitida solo para Administración.');
      var turn = db.turn(turnId);
      if (!turn) return fail('La solicitud no existe.');
      if (turn.status !== 'Pendiente') return fail('La solicitud ya fue resuelta (' + turn.status + ').');
      var now = Date.now();
      note = String(note || '').trim();
      turn.status = 'Denegado';
      turn.resolvedAt = now;
      turn.resolutionNote = note;
      turn.history.push({ at: now, text: 'Solicitud rechazada por ' + admin.name + '.' + (note ? ' Motivo: ' + note : '') });
      var sector = db.sector(turn.sectorId);
      db.notify(turn.userId, 'rechazo', 'Solicitud de acceso rechazada',
        'Su solicitud ' + turn.id + ' para ' + sector.name + ' (' + U.fmtLong(turn.date) + ', ' + turn.start + ' - ' + turn.end +
        ' hs) fue rechazada.' + (note ? ' Motivo: ' + note : '') + ' El cupo fue liberado.', turn.id);
      db.save();
      return ok({ turn: turn });
    },

    /* ====================================================================
       Seguridad: verificación, ingreso y egreso (registro manual)
       ==================================================================== */
    entryCheck: function (turn) {
      var checks = [];
      var auth = R.authorization(turn);
      var sector = db.sector(turn.sectorId);
      var today = U.today();
      var N = U.nowMin();
      var p = R.presence(turn);
      checks.push({ label: 'Turno registrado en el sistema', ok: true, detail: turn.id });
      checks.push({ label: 'Autorización válida', ok: auth.state === 'Autorizado',
        detail: auth.state === 'Autorizado' ? 'Turno confirmado y permisos vigentes' : auth.reasons.join(' ') });
      checks.push({ label: 'Fecha del turno', ok: turn.date === today,
        detail: turn.date === today ? 'Corresponde al día de hoy' : 'El turno es para el ' + U.fmtLong(turn.date) });
      var from = U.toMin(turn.start) - ENTRY_ADVANCE_MIN, to = U.toMin(turn.end);
      var inWindow = turn.date === today && N >= from && N < to;
      checks.push({ label: 'Horario habilitado', ok: inWindow,
        detail: 'Ingreso permitido de ' + U.toTime(Math.max(0, from)) + ' a ' + turn.end + ' hs' +
          (turn.date === today && N < from ? ' (aún no habilitado)' : turn.date === today && N >= to ? ' (franja finalizada)' : '') });
      var occ = sector ? R.occupancy(sector.id) : 0;
      var capOk = !!sector && occ < sector.capacity;
      checks.push({ label: 'Capacidad del sector', ok: capOk || p === 'Dentro',
        detail: 'Ocupación actual: ' + occ + ' / ' + (sector ? sector.capacity : '-') + ' personas' });
      var inside = R.userInside(turn.userId, turn.id);
      var noDup = p === 'Sin ingreso' && !inside;
      checks.push({ label: 'Sin ingreso activo duplicado', ok: noDup,
        detail: p === 'Dentro' ? 'La persona ya registra un ingreso activo con este turno' :
          p === 'Finalizado' ? 'El turno ya fue utilizado (egreso registrado)' :
            inside ? 'La persona se encuentra dentro con el turno ' + inside.id : 'Sin presencia activa' });
      return { ok: checks.every(function (c) { return c.ok; }), checks: checks, auth: auth, presence: p };
    },

    registerEntry: function (turnId, guardId) {
      var guard = db.user(guardId);
      if (!guard || guard.role !== 'seguridad') return fail('Operación permitida solo para el personal de Seguridad.');
      var turn = db.turn(turnId);
      if (!turn) return fail('El turno no existe.');
      var chk = R.entryCheck(turn);
      if (!chk.ok) {
        var failed = chk.checks.filter(function (c) { return !c.ok; })[0];
        return fail('No se puede registrar el ingreso: ' + failed.label.toLowerCase() + ' — ' + failed.detail + '.');
      }
      var now = Date.now();
      db.addRecord({ turnId: turn.id, userId: turn.userId, sectorId: turn.sectorId, type: 'Ingreso', at: now, guardId: guard.id });
      turn.history.push({ at: now, text: 'Ingreso registrado por ' + guard.name + '.' });
      db.save();
      return ok({ turn: turn, at: now });
    },

    registerExit: function (turnId, guardId) {
      var guard = db.user(guardId);
      if (!guard || guard.role !== 'seguridad') return fail('Operación permitida solo para el personal de Seguridad.');
      var turn = db.turn(turnId);
      if (!turn) return fail('El turno no existe.');
      var p = R.presence(turn);
      if (p === 'Sin ingreso') return fail('No corresponde registrar la salida: la persona no registra un ingreso activo.');
      if (p === 'Finalizado') return fail('La salida de este turno ya fue registrada.');
      var now = Date.now();
      db.addRecord({ turnId: turn.id, userId: turn.userId, sectorId: turn.sectorId, type: 'Egreso', at: now, guardId: guard.id });
      turn.history.push({ at: now, text: 'Egreso registrado por ' + guard.name + '.' });
      db.save();
      return ok({ turn: turn, at: now });
    },

    /* ====================================================================
       Administración: configuración de sectores
       ==================================================================== */
    updateSector: function (sectorId, changes, adminId) {
      var admin = db.user(adminId);
      if (!admin || admin.role !== 'admin') return fail('Operación permitida solo para Administración.');
      var sector = db.sector(sectorId);
      if (!sector) return fail('El sector no existe.');

      var cap = Number(changes.capacity);
      if (!Number.isInteger(cap) || cap < 1 || cap > 500) return fail('La capacidad máxima debe ser un número entero entre 1 y 500.');
      if (!U.validTime(changes.open) || !U.validTime(changes.close)) return fail('Ingrese horarios de apertura y cierre válidos.');
      if (U.toMin(changes.open) >= U.toMin(changes.close)) return fail('El horario de apertura debe ser anterior al de cierre.');
      var hours = Number(changes.slotHours);
      if ([1, 2, 3, 4].indexOf(hours) < 0) return fail('La duración de franja debe ser de 1, 2, 3 o 4 horas.');
      var level = Number(changes.level);
      if ([1, 2, 3, 4].indexOf(level) < 0) return fail('El nivel de autorización debe estar entre 1 y 4.');
      if (['Habilitado', 'Mantenimiento'].indexOf(changes.status) < 0) return fail('Estado de disponibilidad inválido.');

      var next = {
        id: sector.id, facilityId: sector.facilityId, name: sector.name, location: sector.location,
        capacity: cap, level: level, open: changes.open, close: changes.close, slotHours: hours,
        weekends: !!changes.weekends, requiresApproval: !!changes.requiresApproval, status: changes.status
      };
      var newSlots = db.slotsFor(next);
      if (!newSlots.length) return fail('Con ese horario y duración no se genera ninguna franja. Amplíe el horario o reduzca la duración.');

      /* --- Detección de conflictos con reservas vigentes --- */
      var conflicts = [];
      var future = db.turns(function (t) { return t.sectorId === sector.id && ACTIVE.indexOf(t.status) >= 0; })
        .filter(function (t) { return !R.isOver(t) && R.presence(t) !== 'Finalizado'; });
      var perSlot = {};
      future.forEach(function (t) {
        var who = db.user(t.userId);
        if (next.status !== 'Habilitado') conflicts.push({ turn: t, reason: 'Reserva vigente en un sector que pasaría a mantenimiento' });
        else if (!newSlots.some(function (s) { return s.start === t.start && s.end === t.end; })) conflicts.push({ turn: t, reason: 'Su franja ' + t.start + '-' + t.end + ' dejaría de existir' });
        else if (!next.weekends && U.isWeekend(t.date)) conflicts.push({ turn: t, reason: 'Reserva en fin de semana' });
        else if (who && who.level < level) conflicts.push({ turn: t, reason: who.name + ' no alcanzaría el nivel requerido' });
        var k = t.date + '|' + t.start;
        perSlot[k] = (perSlot[k] || 0) + 1;
      });
      Object.keys(perSlot).forEach(function (k) {
        if (perSlot[k] > cap) {
          var parts = k.split('|');
          conflicts.push({ turn: null, reason: 'El ' + U.fmtShort(parts[0]) + ' a las ' + parts[1] + ' hay ' + perSlot[k] + ' reservas (supera la nueva capacidad de ' + cap + ')' });
        }
      });
      var occ = R.occupancy(sector.id);
      if (occ > cap) conflicts.push({ turn: null, reason: 'Hay ' + occ + ' personas dentro del sector actualmente' });
      if (conflicts.length) {
        return fail('El cambio afecta reservas existentes y no se aplicó. Resuelva los conflictos (cancelación o reprogramación) o ajuste los valores.', { conflicts: conflicts });
      }
      Object.keys(next).forEach(function (k) { sector[k] = next[k]; });
      db.save();
      return ok({ sector: sector });
    },

    /* ====================================================================
       Administración: autorizaciones de usuarios
       ==================================================================== */
    updateUserAuth: function (userId, changes, adminId) {
      var admin = db.user(adminId);
      if (!admin || admin.role !== 'admin') return fail('Operación permitida solo para Administración.');
      var user = db.user(userId);
      if (!user) return fail('El usuario no existe.');
      if (user.id === admin.id) return fail('No puede modificar los permisos de su propia cuenta.');
      var level = Number(changes.level);
      if ([1, 2, 3, 4].indexOf(level) < 0) return fail('El nivel de autorización debe estar entre 1 y 4.');
      if (['Activo', 'Inactivo'].indexOf(changes.status) < 0) return fail('Estado de cuenta inválido.');
      var sectorsList = (changes.sectors || []).slice();
      for (var i = 0; i < sectorsList.length; i++) {
        var s = db.sector(sectorsList[i]);
        if (!s) return fail('Uno de los sectores seleccionados no existe.');
        if (s.level > level) return fail('Permiso inválido: "' + s.name + '" exige Nivel ' + s.level + ' y el usuario tendría Nivel ' + level + '.');
      }
      if (user.role !== 'solicitante') sectorsList = [];

      user.level = level;
      user.sectors = sectorsList;
      user.status = changes.status;

      // Turnos confirmados que dejarían de pasar la verificación de Seguridad
      var affected = db.turns(function (t) { return t.userId === user.id && t.status === 'Confirmado'; })
        .filter(function (t) { return !R.isOver(t) && R.presence(t) === 'Sin ingreso' && R.authorization(t).state !== 'Autorizado'; });
      if (user.role === 'solicitante') {
        db.notify(user.id, 'autorizacion', 'Actualización de sus autorizaciones de acceso',
          'Administración actualizó sus permisos: ' + R.levelLabel(level) + ', ' +
          U.plural(sectorsList.length, 'sector habilitado', 'sectores habilitados') + ', cuenta ' + changes.status.toLowerCase() + '.' +
          (affected.length ? ' ' + U.plural(affected.length, 'turno confirmado quedó', 'turnos confirmados quedaron') + ' sin autorización válida para el ingreso.' : ''), null);
      }
      db.save();
      return ok({ user: user, affected: affected });
    }
  };

  UA.rules = R;
})();
