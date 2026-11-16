/* ==========================================================================
   Umbrella Access — utilidades generales (fechas, formato, texto)
   Script clásico: compatible con apertura directa mediante file://
   ========================================================================== */
(function () {
  'use strict';
  var UA = (window.UA = window.UA || {});
  /** Estado de interfaz en memoria (filtros, pasos del formulario, mensajes). */
  UA.state = UA.state || {};

  var DAYS =['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  var MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  var U = {
    DAYS: DAYS,
    DAYS_SHORT: DAYS_SHORT,
    MONTHS: MONTHS,

    pad: function (n) { return String(n).padStart(2, '0'); },

    /* ---------- Fechas (formato ISO local AAAA-MM-DD) ---------- */
    toISO: function (d) {
      return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate());
    },
    today: function () { return U.toISO(new Date()); },
    parse: function (iso) {
      var p = iso.split('-').map(Number);
      return new Date(p[0], p[1] - 1, p[2]);
    },
    addDays: function (iso, n) {
      var d = U.parse(iso);
      d.setDate(d.getDate() + n);
      return U.toISO(d);
    },
    weekday: function (iso) { return U.parse(iso).getDay(); },
    isWeekend: function (iso) { var w = U.weekday(iso); return w === 0 || w === 6; },
    /** Timestamp (ms) de una fecha ISO + minutos del día. */
    tsAt: function (iso, minutes) {
      var d = U.parse(iso);
      d.setMinutes(minutes);
      return d.getTime();
    },

    /* ---------- Horas ---------- */
    toMin: function (t) {
      var p = String(t).split(':').map(Number);
      return p[0] * 60 + (p[1] || 0);
    },
    toTime: function (min) { return U.pad(Math.floor(min / 60)) + ':' + U.pad(min % 60); },
    nowMin: function () { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); },
    validTime: function (t) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(t) || t === '24:00'; },

    /* ---------- Formatos de presentación ---------- */
    fmtLong: function (iso) {
      var d = U.parse(iso);
      return DAYS[d.getDay()] + ' ' + d.getDate() + ' de ' + MONTHS[d.getMonth()] + ' de ' + d.getFullYear();
    },
    fmtMedium: function (iso) {
      var d = U.parse(iso);
      return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    },
    fmtShort: function (iso) {
      var d = U.parse(iso);
      return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear();
    },
    fmtDayMonth: function (iso) {
      var d = U.parse(iso);
      return DAYS[d.getDay()] + ' ' + d.getDate() + ' de ' + MONTHS[d.getMonth()];
    },
    monthLabel: function (year, month) {
      var m = MONTHS[month];
      return m.charAt(0).toUpperCase() + m.slice(1) + ' ' + year;
    },
    fmtClock: function (ts) {
      var d = new Date(ts);
      return U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
    },
    fmtTs: function (ts) {
      var d = new Date(ts);
      return U.pad(d.getDate()) + '/' + U.pad(d.getMonth() + 1) + '/' + d.getFullYear() +
        ' ' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()) + ' hs';
    },
    /** "Hace 5 minutos", "Hoy, 09:15 hs", "Ayer, 18:30 hs", "18 de octubre, 16:45 hs" */
    relative: function (ts) {
      var now = Date.now();
      var diff = Math.round((now - ts) / 60000);
      var d = new Date(ts);
      var iso = U.toISO(d);
      var hhmm = U.fmtClock(ts) + ' hs';
      if (diff >= 0 && diff < 1) return 'Hace instantes';
      if (diff >= 1 && diff < 60) return 'Hace ' + diff + (diff === 1 ? ' minuto' : ' minutos');
      if (iso === U.today()) return 'Hoy, ' + hhmm;
      if (iso === U.addDays(U.today(), -1)) return 'Ayer, ' + hhmm;
      return d.getDate() + ' de ' + MONTHS[d.getMonth()] + ', ' + hhmm;
    },

    /* ---------- Texto ---------- */
    esc: function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    initials: function (name) {
      var words = String(name || '').split(/\s+/).filter(function (w) {
        return w && !/^(dr|dra|lic|ing|sr|sra)\.$/i.test(w) && !/^oficial$/i.test(w);
      });
      if (!words.length) return '?';
      var first = words[0].charAt(0);
      var last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
      return (first + last).toUpperCase();
    },
    /** Normaliza códigos ingresados por el usuario: "#tur-2026-0941 " → "TUR-2026-0941" */
    normCode: function (s) { return String(s || '').trim().toUpperCase().replace(/^#/, ''); },
    norm: function (s) {
      return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    },
    plural: function (n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  };

  UA.U = U;
})();
