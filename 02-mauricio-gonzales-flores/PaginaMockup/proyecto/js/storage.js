/* ==========================================================================
   Umbrella Access — almacenamiento local (localStorage) y datos de demostración
   --------------------------------------------------------------------------
   Toda la información (usuarios, instalaciones, sectores, turnos, registros de
   acceso y notificaciones) vive en UN solo objeto guardado bajo una clave de
   localStorage. Todas las pantallas leen y modifican esa misma fuente mediante
   las funciones de UA.db y UA.rules.
   ========================================================================== */
(function () {
  'use strict';
  var UA = (window.UA = window.UA || {});
  var U = UA.U;

  var KEY = 'umbrellaAccess.db';
  var VERSION = 3;
  var memoryFallback = {};
  var cache = null;

  function lsGet(k) {
    try { return window.localStorage.getItem(k); } catch (e) { return memoryFallback[k] || null; }
  }
  function lsSet(k, v) {
    try { window.localStorage.setItem(k, v); } catch (e) { memoryFallback[k] = v; }
  }

  /* ------------------------------------------------------------------------
     Franjas horarias de un sector.
     Se generan desde la apertura hasta el cierre, con la duración configurada
     y 30 minutos de intervalo entre franjas (como en los diseños de Stitch:
     08:00-11:00, 11:30-14:30, 15:00-18:00...).
     ------------------------------------------------------------------------ */
  function slotsFor(sector) {
    var open = U.toMin(sector.open);
    var close = U.toMin(sector.close);
    var dur = Math.round(Number(sector.slotHours) * 60);
    var out = [];
    if (!(dur > 0)) return out;
    var s = open;
    while (s + dur <= close) {
      out.push({ start: U.toTime(s), end: U.toTime(s + dur) });
      s += dur + 30;
    }
    return out;
  }

  /* ------------------------------------------------------------------------
     Datos de demostración (generados en relación con la fecha y hora actuales,
     para que siempre existan turnos "de hoy", futuros e históricos).
     ------------------------------------------------------------------------ */
  function buildSeed() {
    var T = U.today();
    var N = U.nowMin();
    var NOW = Date.now();
    var year = new Date().getFullYear();
    var MIN = 60000, HOUR = 3600000, DAY = 86400000;

    var facilities = [
      { id: 'ARK', name: 'Complejo Arklay // NEST-2', short: 'NEST-2', kind: 'Instalación principal',
        location: 'Montañas Arklay — Acceso Central', status: 'Operativo' },
      { id: 'TER', name: 'Centro de Ensayos Terrestres', short: 'C. Terrestre', kind: 'Instalación secundaria',
        location: 'Zona Industrial Este', status: 'Operativo' },
      { id: 'SPE', name: 'Laboratorio Spencer', short: 'L. Spencer', kind: 'Alta seguridad',
        location: 'Finca Spencer — Ala Este', status: 'Operativo' }
    ];

    function S(id, facilityId, name, location, capacity, level, open, close, slotHours, weekends, requiresApproval, status) {
      return { id: id, facilityId: facilityId, name: name, location: location, capacity: capacity, level: level,
        open: open, close: close, slotHours: slotHours, weekends: weekends, requiresApproval: requiresApproval,
        status: status || 'Habilitado' };
    }
    var sectors = [
      S('SEC-NEST-04', 'ARK', 'Lab. de Síntesis Genética B', 'Subnivel -4, Módulo B3', 15, 3, '08:00', '20:00', 3, false, false),
      S('SEC-NEST-06', 'ARK', 'Subnivel -6 Criocámaras', 'Subnivel -6', 8, 4, '00:00', '24:00', 3, true, true),
      S('SEC-NEST-02', 'ARK', 'Plataforma Carga Subterránea', 'Subnivel -1, Muelle de carga', 10, 2, '00:00', '24:00', 3, true, false),
      S('SEC-ARK-03', 'ARK', 'Archivo Biológico N3', 'Ala Norte', 3, 3, '09:00', '18:00', 4, false, false),
      S('SEC-ARK-08', 'ARK', 'Bóveda Aislada Norte', 'Ala Norte, Nivel -2', 4, 4, '09:00', '17:00', 4, false, true, 'Mantenimiento'),
      S('SEC-TERR-02', 'TER', 'Hangar de Almacenamiento 02', 'Zona Este', 25, 2, '09:00', '18:00', 4, false, false),
      S('SEC-TERR-01', 'TER', 'Plataforma de Descarga', 'Acceso Sur', 12, 1, '07:00', '19:00', 3, false, false),
      S('SEC-TERR-03', 'TER', 'Subestaciones de Mantenimiento', 'Zona Técnica', 6, 2, '08:00', '20:00', 3, false, false),
      S('SEC-SPEN-01', 'SPE', 'Cámara de Cultivo 4', 'Planta Baja', 6, 3, '08:00', '20:00', 2, false, false),
      S('SEC-SPEN-02', 'SPE', 'Pabellón de Enlace — Ala Este', 'Ala Este', 5, 3, '08:00', '20:00', 3, false, true)
    ];
    function sec(id) { return sectors.filter(function (s) { return s.id === id; })[0]; }

    function Usr(id, password, name, role, type, position, level, sectorsList, status) {
      return { id: id, password: password, name: name, role: role, type: type, position: position,
        level: level, sectors: sectorsList, status: status || 'Activo' };
    }
    var users = [
      Usr('UC-8842-BIO', 'vance123', 'Dr. Marcus Vance', 'solicitante', 'Empleado', 'Investigador Biogenética', 3,
        ['SEC-NEST-04', 'SEC-ARK-03', 'SEC-NEST-02', 'SEC-TERR-02']),
      Usr('VIS-0001-AUD', 'wesker123', 'Dr. Albert Wesker', 'solicitante', 'Visitante', 'Auditor Externo Corporativo', 3, []),
      Usr('PROV-9041-CRIO', 'rostova123', 'Elena Rostova', 'solicitante', 'Proveedor', 'Suministros Criogénicos Global', 4,
        ['SEC-NEST-06', 'SEC-TERR-01']),
      Usr('UC-1014-SEC', 'valentine123', 'Oficial Jill Valentine', 'seguridad', 'Seguridad', 'Supervisora de Acceso', 3, []),
      Usr('UC-0002-ADM', 'ashford123', 'Lic. A. Ashford', 'admin', 'Administrador', 'Administrador General', 4, []),
      Usr('UC-5520-MANT', 'oliveira123', 'Carlos Oliveira', 'solicitante', 'Empleado', 'Mantenimiento Técnico', 2,
        ['SEC-TERR-02', 'SEC-TERR-03', 'SEC-NEST-02']),
      Usr('VIS-3312-MED', 'chambers123', 'Dra. Rebecca Chambers', 'solicitante', 'Visitante', 'Asesora Externa', 3,
        ['SEC-SPEN-02']),
      Usr('PROV-7730-LOG', 'santos123', 'Miguel Santos', 'solicitante', 'Proveedor', 'Logística Externa', 2,
        ['SEC-TERR-01']),
      Usr('UC-6603-OPS', 'ginovaef123', 'Nikolai Ginovaef', 'solicitante', 'Empleado', 'Operaciones de Planta', 2,
        ['SEC-TERR-02'], 'Inactivo')
    ];

    /* ---- helpers de fechas para el seed ---- */
    function openDate(sector, iso, dir) {
      var d = iso;
      while (!sector.weekends && U.isWeekend(d)) d = U.addDays(d, dir || 1);
      return d;
    }
    function slotAt(sector, start) {
      return slotsFor(sector).filter(function (s) { return s.start === start; })[0];
    }
    /** Franja vigente ahora (habilitada desde 30 min antes del inicio). */
    function currentSlot(sector) {
      return slotsFor(sector).filter(function (s) {
        return U.toMin(s.start) - 30 <= N && N < U.toMin(s.end);
      })[0] || null;
    }
    function lastFinishedSlot(sector) {
      var list = slotsFor(sector).filter(function (s) { return U.toMin(s.end) <= N; });
      return list.length ? list[list.length - 1] : null;
    }

    var turns = [];
    var records = [];
    var notifications = [];
    var guard = 'UC-1014-SEC';
    var admin = 'UC-0002-ADM';

    function mk(num, userId, sectorId, date, slot, status, reason, createdAgoMs, extra) {
      var s = sec(sectorId);
      var user = users.filter(function (u) { return u.id === userId; })[0];
      var created = NOW - createdAgoMs;
      var t = {
        id: 'TUR-' + year + '-' + String(num).padStart(4, '0'),
        userId: userId, sectorId: sectorId, facilityId: s.facilityId,
        date: date, start: slot.start, end: slot.end,
        reason: reason, detail: '', status: status,
        createdAt: created, approvedBy: null, resolvedAt: null, resolutionNote: '',
        history: [{ at: created, text: 'Solicitud registrada por ' + user.name + '.' }]
      };
      if (status === 'Confirmado' && !(extra && extra.approvedBy)) {
        t.history.push({ at: created, text: 'Confirmada automáticamente: autorización vigente para el sector.' });
      }
      if (status === 'Pendiente') {
        t.history.push({ at: created, text: 'Enviada a revisión administrativa.' });
      }
      if (extra) {
        Object.keys(extra).forEach(function (k) { if (k !== 'events') t[k] = extra[k]; });
        (extra.events || []).forEach(function (e) { t.history.push(e); });
      }
      turns.push(t);
      return t;
    }
    var recSeq = 1;
    function rec(turn, type, ts) {
      records.push({ id: 'ACC-' + String(recSeq++).padStart(5, '0'), turnId: turn.id, userId: turn.userId,
        sectorId: turn.sectorId, type: type, at: ts, guardId: guard });
      turn.history.push({ at: ts, text: (type === 'Ingreso' ? 'Ingreso' : 'Egreso') + ' registrado por Oficial Jill Valentine.' });
    }
    var notSeq = 1;
    function notif(userId, type, title, message, turnId, ts, read) {
      notifications.push({ id: 'NOT-' + String(notSeq++).padStart(5, '0'), userId: userId, type: type,
        title: title, message: message, turnId: turnId || null, at: ts, read: !!read });
    }

    var lab = sec('SEC-NEST-04'), crio = sec('SEC-NEST-06'), carga = sec('SEC-NEST-02'),
      archivo = sec('SEC-ARK-03'), boveda = sec('SEC-ARK-08'), hangar = sec('SEC-TERR-02'),
      descarga = sec('SEC-TERR-01'), subest = sec('SEC-TERR-03'), cultivo = sec('SEC-SPEN-01'),
      pabellon = sec('SEC-SPEN-02');

    /* ---- Dr. Marcus Vance ---- */
    // Turno de HOY vigente (para el flujo de Seguridad). Si el laboratorio no
    // tiene una franja vigente ahora, se usa un sector de 24 horas autorizado.
    var mSec = lab, mSlot = U.isWeekend(T) ? null : currentSlot(lab);
    if (!mSlot) { mSec = carga; mSlot = currentSlot(carga); }
    var t0941 = mk(941, 'UC-8842-BIO', mSec.id, T, mSlot, 'Confirmado', 'Tareas operativas programadas', 2 * DAY);

    var dArchivo = openDate(archivo, U.addDays(T, 2));
    var t0990 = mk(990, 'UC-8842-BIO', 'SEC-ARK-03', dArchivo, slotAt(archivo, '09:00'), 'Confirmado',
      'Consulta de documentación técnica', 3 * DAY);
    var t0985 = mk(985, 'UC-8842-BIO', 'SEC-SPEN-02', openDate(pabellon, U.addDays(T, 3)), slotAt(pabellon, '08:00'),
      'Pendiente', 'Reunión de coordinación', 5 * HOUR);
    var t1012Date = openDate(hangar, U.addDays(T, 4));
    var t1012 = mk(1012, 'UC-8842-BIO', 'SEC-TERR-02', t1012Date, slotAt(hangar, '09:00'), 'Confirmado',
      'Inspección de equipamiento', 4 * DAY, {
        events: [{ at: NOW - 2 * DAY, text: 'Turno reprogramado por el solicitante. Motivo: Conflicto de agenda.' }]
      });
    var t0770 = mk(770, 'UC-8842-BIO', 'SEC-SPEN-01', openDate(cultivo, U.addDays(T, -5), -1), slotAt(cultivo, '15:30'),
      'Cancelado', 'Capacitación', 9 * DAY, {
        events: [{ at: NOW - 6 * DAY, text: 'Turno cancelado por el solicitante. Cupo liberado.' }]
      });
    var t0814 = mk(814, 'UC-8842-BIO', 'SEC-NEST-04', openDate(lab, U.addDays(T, -10), -1), slotAt(lab, '11:30'),
      'Confirmado', 'Tareas operativas programadas', 14 * DAY);
    rec(t0814, 'Ingreso', U.tsAt(t0814.date, U.toMin('11:24')));
    rec(t0814, 'Egreso', U.tsAt(t0814.date, U.toMin('14:12')));

    /* ---- Elena Rostova (proveedor) ---- */
    var eSlot = currentSlot(crio);
    var t0945 = mk(945, 'PROV-9041-CRIO', 'SEC-NEST-06', T, eSlot, 'Confirmado', 'Entrega o retiro de suministros', 3 * DAY, {
      approvedBy: admin, resolvedAt: NOW - 2 * DAY,
      events: [{ at: NOW - 2 * DAY, text: 'Solicitud aprobada por Lic. A. Ashford.' }]
    });
    var eIn = Math.max(0, U.toMin(eSlot.start) - 30, N - 20);
    rec(t0945, 'Ingreso', U.tsAt(T, eIn));
    var t1005 = mk(1005, 'PROV-9041-CRIO', 'SEC-TERR-01', openDate(descarga, U.addDays(T, 1)), slotAt(descarga, '07:00'),
      'Confirmado', 'Entrega o retiro de suministros', 6 * HOUR);
    var t0901 = mk(901, 'PROV-9041-CRIO', 'SEC-NEST-06', U.addDays(T, -3), slotAt(crio, '07:00'), 'Confirmado',
      'Entrega o retiro de suministros', 6 * DAY, {
        approvedBy: admin, resolvedAt: NOW - 5 * DAY,
        events: [{ at: NOW - 5 * DAY, text: 'Solicitud aprobada por Lic. A. Ashford.' }]
      });
    rec(t0901, 'Ingreso', U.tsAt(t0901.date, U.toMin('07:05')));
    rec(t0901, 'Egreso', U.tsAt(t0901.date, U.toMin('09:40')));

    /* ---- Carlos Oliveira ---- */
    var cDate = T, cSlot = lastFinishedSlot(carga);
    if (!cSlot) { cDate = U.addDays(T, -1); var all = slotsFor(carga); cSlot = all[all.length - 1]; }
    var t0950 = mk(950, 'UC-5520-MANT', 'SEC-NEST-02', cDate, cSlot, 'Confirmado', 'Mantenimiento técnico', 2 * DAY);
    rec(t0950, 'Ingreso', U.tsAt(cDate, U.toMin(cSlot.start) + 8));
    rec(t0950, 'Egreso', U.tsAt(cDate, U.toMin(cSlot.end) - 15));
    var t1040 = mk(1040, 'UC-5520-MANT', 'SEC-TERR-03', openDate(subest, U.addDays(T, 1)), slotAt(subest, '08:00'),
      'Confirmado', 'Mantenimiento técnico', 1 * DAY);
    var t1041 = mk(1041, 'UC-5520-MANT', 'SEC-TERR-01', openDate(descarga, U.addDays(T, 3)), slotAt(descarga, '10:30'),
      'Pendiente', 'Mantenimiento técnico', 3 * HOUR);

    /* ---- Dr. Albert Wesker (visitante) ---- */
    var wSec = U.isWeekend(T) ? carga : archivo;
    var wSlot = slotsFor(wSec)[wSec === carga ? 5 : 1];
    var t0952 = mk(952, 'VIS-0001-AUD', wSec.id, T, wSlot, 'Pendiente', 'Auditoría o inspección', 1 * DAY);
    var t0953 = mk(953, 'VIS-0001-AUD', 'SEC-ARK-03', dArchivo, slotAt(archivo, '09:00'), 'Pendiente',
      'Auditoría o inspección', 20 * HOUR);
    var t0920 = mk(920, 'VIS-0001-AUD', 'SEC-ARK-08', openDate(boveda, U.addDays(T, -2), -1), slotAt(boveda, '09:00'),
      'Denegado', 'Auditoría o inspección', 6 * DAY, {
        resolvedAt: NOW - 4 * DAY, resolutionNote: 'La Bóveda Aislada Norte no admite visitas externas.',
        events: [{ at: NOW - 4 * DAY, text: 'Solicitud rechazada por Lic. A. Ashford. Motivo: La Bóveda Aislada Norte no admite visitas externas.' }]
      });

    /* ---- Dra. Rebecca Chambers (visitante) ---- */
    var t1020 = mk(1020, 'VIS-3312-MED', 'SEC-ARK-03', dArchivo, slotAt(archivo, '09:00'), 'Pendiente',
      'Reunión de coordinación', 10 * HOUR);
    var t1031 = mk(1031, 'VIS-3312-MED', 'SEC-SPEN-02', openDate(pabellon, U.addDays(T, 5)), slotAt(pabellon, '11:30'),
      'Pendiente', 'Capacitación', 2 * HOUR);

    /* ---- Miguel Santos (proveedor) ---- */
    var t0938 = mk(938, 'PROV-7730-LOG', 'SEC-NEST-02', T, slotsFor(carga)[2], 'Denegado', 'Entrega o retiro de suministros',
      2 * DAY, {
        resolvedAt: NOW - 1 * DAY, resolutionNote: 'El proveedor no está habilitado para la Plataforma Carga Subterránea.',
        events: [{ at: NOW - 1 * DAY, text: 'Solicitud rechazada por Lic. A. Ashford. Motivo: El proveedor no está habilitado para la Plataforma Carga Subterránea.' }]
      });

    /* ---- Notificaciones ---- */
    function where(t) { var s = sec(t.sectorId); return s.name + ' (' + facilities.filter(function (f) { return f.id === s.facilityId; })[0].name + ')'; }
    function when(t) { return U.fmtLong(t.date) + ' (' + t.start + ' - ' + t.end + ' hs)'; }

    notif('UC-8842-BIO', 'confirmacion', 'Turno de acceso confirmado y autorizado',
      'Su solicitud ' + t0941.id + ' para ' + where(t0941) + ' fue confirmada para el ' + when(t0941) +
      '. Preséntese ante el oficial de guardia con su documento y el código de turno.', t0941.id, NOW - 25 * MIN, false);
    notif('UC-8842-BIO', 'pendiente', 'Solicitud enviada a revisión administrativa',
      'Su solicitud ' + t0985.id + ' para ' + where(t0985) + ' requiere aprobación administrativa. Recibirá un aviso cuando sea resuelta.',
      t0985.id, NOW - 5 * HOUR, false);
    notif('UC-8842-BIO', 'aviso', 'Aviso de aforo en Archivo Biológico N3',
      'El sector Archivo Biológico N3 alcanzó su capacidad máxima para el ' + U.fmtLong(dArchivo) +
      ' (09:00 - 13:00 hs). Considere solicitar franjas alternativas.', null, NOW - 1 * DAY, false);
    notif('UC-8842-BIO', 'reprogramacion', 'Reprogramación exitosa de turno',
      'El turno ' + t1012.id + ' fue reprogramado con éxito para el ' + when(t1012) + '.', t1012.id, NOW - 2 * DAY, true);
    notif('UC-8842-BIO', 'confirmacion', 'Turno de acceso confirmado y autorizado',
      'Su solicitud ' + t0990.id + ' para ' + where(t0990) + ' fue confirmada para el ' + when(t0990) + '.', t0990.id, NOW - 3 * DAY, true);
    notif('UC-8842-BIO', 'cancelacion', 'Cancelación confirmada de reserva de turno',
      'El turno ' + t0770.id + ' para ' + where(t0770) + ' fue cancelado conforme a su solicitud. El cupo fue reintegrado a la disponibilidad del sector.',
      t0770.id, NOW - 6 * DAY, true);

    notif('PROV-9041-CRIO', 'confirmacion', 'Turno de acceso confirmado y autorizado',
      'Su solicitud ' + t1005.id + ' para ' + where(t1005) + ' fue confirmada para el ' + when(t1005) + '.', t1005.id, NOW - 6 * HOUR, false);
    notif('PROV-9041-CRIO', 'aprobacion', 'Solicitud aprobada por Administración',
      'Su solicitud ' + t0945.id + ' para ' + where(t0945) + ' fue aprobada para el ' + when(t0945) + '.', t0945.id, NOW - 2 * DAY, true);

    notif('VIS-0001-AUD', 'pendiente', 'Solicitud enviada a revisión administrativa',
      'Su solicitud ' + t0953.id + ' para ' + where(t0953) + ' requiere aprobación administrativa.', t0953.id, NOW - 20 * HOUR, false);
    notif('VIS-0001-AUD', 'pendiente', 'Solicitud enviada a revisión administrativa',
      'Su solicitud ' + t0952.id + ' para ' + where(t0952) + ' requiere aprobación administrativa.', t0952.id, NOW - 1 * DAY, true);
    notif('VIS-0001-AUD', 'rechazo', 'Solicitud de acceso rechazada',
      'Su solicitud ' + t0920.id + ' para ' + where(t0920) + ' fue rechazada. Motivo: ' + t0920.resolutionNote, t0920.id, NOW - 4 * DAY, true);

    notif('UC-5520-MANT', 'confirmacion', 'Turno de acceso confirmado y autorizado',
      'Su solicitud ' + t1040.id + ' para ' + where(t1040) + ' fue confirmada para el ' + when(t1040) + '.', t1040.id, NOW - 1 * DAY, false);
    notif('UC-5520-MANT', 'pendiente', 'Solicitud enviada a revisión administrativa',
      'Su solicitud ' + t1041.id + ' para ' + where(t1041) + ' requiere aprobación administrativa.', t1041.id, NOW - 3 * HOUR, false);
    notif('VIS-3312-MED', 'pendiente', 'Solicitud enviada a revisión administrativa',
      'Su solicitud ' + t1031.id + ' para ' + where(t1031) + ' requiere aprobación administrativa.', t1031.id, NOW - 2 * HOUR, false);
    notif('PROV-7730-LOG', 'rechazo', 'Solicitud de acceso rechazada',
      'Su solicitud ' + t0938.id + ' para ' + where(t0938) + ' fue rechazada. Motivo: ' + t0938.resolutionNote, t0938.id, NOW - 1 * DAY, false);

    return {
      version: VERSION,
      createdAt: NOW,
      meta: { turnSeq: 1100, recordSeq: recSeq, notifSeq: notSeq },
      users: users,
      facilities: facilities,
      sectors: sectors,
      turns: turns,
      records: records,
      notifications: notifications
    };
  }

  /* ------------------------------------------------------------------------
     API de acceso a datos
     ------------------------------------------------------------------------ */
  var db = {
    KEY: KEY,
    slotsFor: slotsFor,

    data: function () {
      if (cache) return cache;
      var raw = lsGet(KEY);
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.version === VERSION) { cache = parsed; return cache; }
        } catch (e) { /* datos corruptos: se regeneran */ }
      }
      cache = buildSeed();
      db.save();
      return cache;
    },
    save: function () { lsSet(KEY, JSON.stringify(cache)); },
    /** Descarta la copia en memoria (p. ej. cuando otra pestaña modificó los datos). */
    invalidate: function () { cache = null; },
    reset: function () { cache = buildSeed(); db.save(); return cache; },

    /* ---- Lectura ---- */
    users: function () { return db.data().users; },
    user: function (id) {
      var key = U.normCode(id);
      return db.users().filter(function (u) { return u.id === key; })[0] || null;
    },
    facilities: function () { return db.data().facilities; },
    facility: function (id) { return db.facilities().filter(function (f) { return f.id === id; })[0] || null; },
    sectors: function (facilityId) {
      return db.data().sectors.filter(function (s) { return !facilityId || s.facilityId === facilityId; });
    },
    sector: function (id) { return db.data().sectors.filter(function (s) { return s.id === id; })[0] || null; },
    turns: function (pred) { var t = db.data().turns; return pred ? t.filter(pred) : t.slice(); },
    turn: function (id) {
      var key = U.normCode(id);
      return db.data().turns.filter(function (t) { return t.id === key; })[0] || null;
    },
    records: function (pred) { var r = db.data().records; return pred ? r.filter(pred) : r.slice(); },
    notifications: function (userId) {
      return db.data().notifications.filter(function (n) { return n.userId === userId; })
        .sort(function (a, b) { return b.at - a.at; });
    },
    unreadCount: function (userId) {
      return db.data().notifications.filter(function (n) { return n.userId === userId && !n.read; }).length;
    },

    /* ---- Escritura básica ---- */
    nextTurnId: function () {
      var d = db.data();
      d.meta.turnSeq += 1;
      return 'TUR-' + new Date().getFullYear() + '-' + String(d.meta.turnSeq).padStart(4, '0');
    },
    addRecord: function (r) {
      var d = db.data();
      r.id = 'ACC-' + String(d.meta.recordSeq++).padStart(5, '0');
      d.records.push(r);
      return r;
    },
    notify: function (userId, type, title, message, turnId) {
      var d = db.data();
      d.notifications.push({ id: 'NOT-' + String(d.meta.notifSeq++).padStart(5, '0'), userId: userId, type: type,
        title: title, message: message, turnId: turnId || null, at: Date.now(), read: false });
    },
    markRead: function (notifId, userId) {
      db.data().notifications.forEach(function (n) { if (n.id === notifId && n.userId === userId) n.read = true; });
      db.save();
    },
    markAllRead: function (userId) {
      var count = 0;
      db.data().notifications.forEach(function (n) { if (n.userId === userId && !n.read) { n.read = true; count++; } });
      db.save();
      return count;
    }
  };

  UA.db = db;
})();
