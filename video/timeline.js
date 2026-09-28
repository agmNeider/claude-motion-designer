/*
 * Shared timeline for the N.A.R. video. Both the picture (scene.js) and the music (music.js)
 * read these numbers, so every cut, hit and word lands on the same beat.
 *
 * 120 BPM → 1 beat = 0.5 s, 1 bar (4/4) = 2 s. 16 bars = 32 s.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.TIMELINE = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var BPM = 120;
  var BEAT = 60 / BPM;
  var BAR = BEAT * 4;
  var bar = function (n, beat) { return n * BAR + (beat || 0) * BEAT; };

  var services = [
    { icon: "users", area: "Derecho de familia", title: ["Familia"], items: ["Cuota alimentaria", "Divorcio", "Separación de cuerpos", "Sociedad conyugal"] },
    { icon: "car", area: "Tránsito", title: ["Trámites de", "tránsito"], items: ["Comparendos", "Multas y acuerdos de pago", "Licencias de conducción", "Embargos vehiculares"] },
    { icon: "file-text", area: "Documentos", title: ["Elaboración de", "documentos"], items: ["Derechos de petición", "Tutelas", "Contratos", "Poderes y autorizaciones"] },
    { icon: "file-badge", area: "Trámites", title: ["Certificados"], items: ["Libertad y tradición", "RUNT · RUT", "REDAM", "Antecedentes"] },
    { icon: "scale", area: "Asesoría", title: ["Asesoría", "jurídica"], items: ["Acompañamiento legal", "en cada paso del proceso"] },
  ];

  var scenes = {
    intro: { start: 0, end: bar(2) },            // bars 0–1: question + rings drawing, riser
    stamp: { start: bar(2), end: bar(4) },       // bars 2–3: the seal stamps on the downbeat, name, location
    services: { start: bar(4), end: bar(9) },    // bars 4–8: five services, one bar each
    values: { start: bar(9), end: bar(11) },     // bars 9–10: three values, then "Cada caso es diferente."
    lema: { start: bar(11), end: bar(13) },      // bars 11–12: breakdown, the motto word by word
    close: { start: bar(13), end: bar(16) },     // bars 13–15: impact, logo, contact, final chord
  };

  // Words of the intro question, one per beat.
  var introWords = [
    { text: "¿Necesitas", t: bar(0, 1) },
    { text: "asesoría", t: bar(0, 2) },
    { text: "legal?", t: bar(0, 3) },
  ];

  var values = [
    { icon: "shield-check", text: "Asesoría personalizada", t: bar(9, 0) },
    { icon: "handshake", text: "Gestión eficiente y oportuna", t: bar(9, 1) },
    { icon: "scale", text: "Experiencia en el sector", t: bar(9, 2) },
  ];
  var caseLine = { text: "Cada caso es diferente.", t: bar(10, 0) };

  var lemaWords = [
    { text: "Tu", t: bar(11, 0), line: 0 },
    { text: "tranquilidad,", t: bar(11, 1), line: 0 },
    { text: "nuestra", t: bar(12, 0), line: 1 },
    { text: "prioridad.", t: bar(12, 1), line: 1 },
  ];

  // Hits: big moments with an impact in the music and a flash/shake in the picture.
  var hits = [bar(2), bar(13)];
  // Transitions (diagonal wipe + whoosh): one per service change and into values.
  var wipes = [bar(4), bar(5), bar(6), bar(7), bar(8), bar(9)];
  // Service items appear on eighth notes after beat 1 of their bar.
  function serviceItemTimes(i) {
    var s = bar(4 + i);
    return services[i].items.map(function (_, k) { return s + BEAT * 1 + k * (BEAT / 2); });
  }

  // Chord per bar (drives pad, bass, arp). 16 bars.
  var chords = ["Bm", "A", "D", "A", "D", "Bm", "G", "A", "D", "Bm", "Em", "G", "A", "D", "G", "D"];

  var contact = {
    phones: ["313 699 4178", "304 382 3723", "304 382 3717", "301 466 6391"],
    address: "Sincé, Sucre · frente al D1",
    handle: "@nar.abogadosyasociados",
    cta: "Agenda tu consulta",
    t: { logo: bar(13), cta: bar(14), phones: bar(14, 1), address: bar(14, 3), handle: bar(15), fade: bar(15, 3) },
  };

  return {
    BPM: BPM, BEAT: BEAT, BAR: BAR, bar: bar,
    DURATION: bar(16), FPS: 30, WIDTH: 1080, HEIGHT: 1920,
    scenes: scenes, services: services, introWords: introWords, values: values, caseLine: caseLine,
    lemaWords: lemaWords, hits: hits, wipes: wipes, serviceItemTimes: serviceItemTimes, chords: chords, contact: contact,
    location: { text: "Sincé, Sucre", sub: "Frente al D1", t: bar(3) },
  };
});
