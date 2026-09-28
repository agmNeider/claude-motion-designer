/*
 * Shared timeline for the N.A.R. video. Both the picture (scene.js) and the music (music.js)
 * read these numbers, so every cut, hit, card and word lands on the same beat.
 *
 * 120 BPM → 1 beat = 0.5 s, 1 bar (4/4) = 2 s. 20 bars = 40 s.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.TIMELINE = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var BPM = 120;
  var BEAT = 60 / BPM;
  var BAR = BEAT * 4;
  var bar = function (n, beat) { return n * BAR + (beat || 0) * BEAT; };
  var range = function (n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; };

  var scenes = {
    intro: { start: 0, end: bar(2) },          // bars 0–1   question, letters imploding into the seal
    stamp: { start: bar(2), end: bar(4) },     // bars 2–3   the seal stamps, name, location
    ramas: { start: bar(4), end: bar(8) },     // bars 4–7   every branch of law, slot-machine roll
    tramites: { start: bar(8), end: bar(12) }, // bars 8–11  wall of cases and paperwork, cards flying in
    frase: { start: bar(12), end: bar(13) },   // bar 12     "Cualquier caso. Un solo equipo." (drop)
    valores: { start: bar(13), end: bar(15) }, // bars 13–14 three reasons
    lema: { start: bar(15), end: bar(17) },    // bars 15–16 breakdown, the motto letter by letter
    cierre: { start: bar(17), end: bar(20) },  // bars 17–19 impact, logo, call to action, contact
  };

  // How each scene hands over to the next (at the next scene's start).
  var transitions = [
    { t: bar(2), type: "hit" },
    { t: bar(4), type: "iris" },
    { t: bar(8), type: "slices" },
    { t: bar(12), type: "slam" },
    { t: bar(13), type: "wipe" },
    { t: bar(15), type: "fade" },
    { t: bar(17), type: "hit" },
  ];

  var introWords = [
    { text: "¿Necesitas", t: bar(0, 1) },
    { text: "asesoría", t: bar(0, 2) },
    { text: "legal?", t: bar(0, 3) },
  ];

  // ---- Ramas: headline, then one branch per beat.
  var ramas = {
    headline: bar(4),
    dock: bar(4, 2),
    list: ["Civil", "Penal", "de Familia", "Laboral", "Administrativo", "Comercial", "Constitucional",
      "de Tránsito", "Seguridad social", "Agrario", "Notarial", "Disciplinario"],
    rollStart: bar(4, 3),
    outro: { text: "y mucho más.", t: bar(7, 2) },
  };
  ramas.times = ramas.list.map(function (_, i) { return ramas.rollStart + i * BEAT; });

  // ---- Trámites: 12 cards, one per beat.
  var tramites = {
    headline: bar(8),
    cards: [
      { icon: "gavel", text: "Demandas" },
      { icon: "shield-check", text: "Tutelas" },
      { icon: "file-text", text: "Derechos de petición" },
      { icon: "file-pen-line", text: "Contratos" },
      { icon: "users", text: "Divorcios" },
      { icon: "house", text: "Sucesiones" },
      { icon: "baby", text: "Cuota alimentaria" },
      { icon: "hourglass", text: "Pensiones" },
      { icon: "banknote", text: "Cobro de cartera" },
      { icon: "heart-handshake", text: "Conciliaciones" },
      { icon: "shield", text: "Defensa penal" },
      { icon: "car", text: "Comparendos" },
    ],
    firstCard: bar(8, 2),
    exit: bar(11, 2),
  };
  tramites.times = tramites.cards.map(function (_, i) { return tramites.firstCard + i * BEAT; });

  var frase = [
    { text: "Cualquier caso.", t: bar(12, 0) },
    { text: "Un solo equipo.", t: bar(12, 2) },
  ];

  var valores = [
    { icon: "shield-check", text: "Asesoría personalizada", t: bar(13, 0) },
    { icon: "handshake", text: "Gestión eficiente y oportuna", t: bar(13, 2) },
    { icon: "scale", text: "Experiencia en el sector", t: bar(14, 0) },
  ];

  var lema = [
    { text: "Tu tranquilidad,", t: bar(15, 0) },
    { text: "nuestra prioridad.", t: bar(16, 0) },
  ];

  var contact = {
    phones: ["304 382 3713", "313 699 4178", "301 466 6391"],
    address: "Sincé, Sucre · frente al D1",
    handle: "@nar.abogadosyasociados",
    cta: "Agenda tu consulta",
    t: { logo: bar(17), cta: bar(18), phones: bar(18, 1), address: bar(18, 3), handle: bar(19), final: bar(19), fade: bar(19, 3) },
  };

  // Big hits: impact in the music, flash + shake in the picture.
  var hits = [bar(2), bar(17)];
  var slams = frase.map(function (f) { return f.t; });
  var whooshes = [bar(4), bar(8), bar(13), ramas.dock, tramites.exit];

  // Chord per bar (pad, bass, arpeggio). 20 bars.
  var chords = ["Bm", "A", "D", "A", "D", "Bm", "G", "A", "D", "Bm", "G", "A", "Bm", "G", "A", "G", "A", "D", "G", "D"];
  // Where the full groove plays (kick on every beat).
  var grooveBars = [4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 17, 18];

  return {
    BPM: BPM, BEAT: BEAT, BAR: BAR, bar: bar, range: range,
    DURATION: bar(20), FPS: 30, WIDTH: 1080, HEIGHT: 1920,
    scenes: scenes, transitions: transitions, introWords: introWords, ramas: ramas, tramites: tramites,
    frase: frase, valores: valores, lema: lema, contact: contact,
    hits: hits, slams: slams, whooshes: whooshes, chords: chords, grooveBars: grooveBars,
    location: { text: "Sincé, Sucre", sub: "Frente al D1", t: bar(3) },
  };
});
