/* @ds-bundle: {"format":4,"namespace":"NAR","components":[{"name":"Button"},{"name":"Tag"},{"name":"Icon"},{"name":"ServiceCard"},{"name":"Callout"},{"name":"ContactCard"},{"name":"CarouselSlide"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var ICONS = {"arrow-right":[["path",{"d":"M5 12h14"}],["path",{"d":"m12 5 7 7-7 7"}]],"car":[["path",{"d":"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"}],["circle",{"cx":"7","cy":"17","r":"2"}],["path",{"d":"M9 17h6"}],["circle",{"cx":"17","cy":"17","r":"2"}]],"clock":[["circle",{"cx":"12","cy":"12","r":"10"}],["polyline",{"points":"12 6 12 12 16 14"}]],"file-badge":[["path",{"d":"M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3"}],["path",{"d":"M14 2v4a2 2 0 0 0 2 2h4"}],["path",{"d":"M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"}],["path",{"d":"M7 16.5 8 22l-3-1-3 1 1-5.5"}]],"file-text":[["path",{"d":"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"}],["path",{"d":"M14 2v4a2 2 0 0 0 2 2h4"}],["path",{"d":"M10 9H8"}],["path",{"d":"M16 13H8"}],["path",{"d":"M16 17H8"}]],"gavel":[["path",{"d":"m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8"}],["path",{"d":"m16 16 6-6"}],["path",{"d":"m8 8 6-6"}],["path",{"d":"m9 7 8 8"}],["path",{"d":"m21 11-8-8"}]],"handshake":[["path",{"d":"m11 17 2 2a1 1 0 1 0 3-3"}],["path",{"d":"m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"}],["path",{"d":"m21 3 1 11h-2"}],["path",{"d":"M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"}],["path",{"d":"M3 4h8"}]],"landmark":[["line",{}],["line",{}],["line",{}],["line",{}],["line",{}],["polygon",{"points":"12 2 20 7 4 7"}]],"map-pin":[["path",{"d":"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"}],["circle",{"cx":"12","cy":"10","r":"3"}]],"message-circle":[["path",{"d":"M7.9 20A9 9 0 1 0 4 16.1L2 22Z"}]],"phone":[["path",{"d":"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"}]],"scale":[["path",{"d":"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"}],["path",{"d":"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"}],["path",{"d":"M7 21h10"}],["path",{"d":"M12 3v18"}],["path",{"d":"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"}]],"shield-check":[["path",{"d":"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"}],["path",{"d":"m9 12 2 2 4-4"}]],"stamp":[["path",{"d":"M5 22h14"}],["path",{"d":"M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z"}],["path",{"d":"M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-3-3c-1.66 0-3 1-3 3s1 2 1 3.5V13"}]],"users":[["path",{"d":"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}],["circle",{"cx":"9","cy":"7","r":"4"}],["path",{"d":"M22 21v-2a4 4 0 0 0-3-3.87"}],["path",{"d":"M16 3.13a4 4 0 0 1 0 7.75"}]]};
  function cx() {
    return Array.prototype.slice.call(arguments).filter(Boolean).join(" ");
  }
  function omit(p, keys) {
    var o = {};
    for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k) && keys.indexOf(k) < 0) o[k] = p[k];
    return o;
  }

  function Icon(p) {
    var els = ICONS[p.name] || [];
    var size = p.size || 24;
    return h("svg", {
      className: cx("nar-icon", p.className), width: size, height: size, viewBox: "0 0 24 24",
      fill: "none", stroke: "currentColor", strokeWidth: p.strokeWidth || 1.5,
      strokeLinecap: "round", strokeLinejoin: "round",
      "aria-hidden": p.label ? undefined : "true", role: p.label ? "img" : undefined, "aria-label": p.label
    }, els.map(function (e, i) { return h(e[0], Object.assign({ key: i }, e[1])); }));
  }
  Icon.names = Object.keys(ICONS);

  function Button(p) {
    var variant = p.variant || "secondary";
    var rest = omit(p, ["variant", "icon", "className", "children"]);
    return h("button", Object.assign({ type: "button" }, rest, { className: cx("nar-btn", "nar-btn-" + variant, p.className) }),
      p.children, p.icon ? h(Icon, { name: p.icon, size: 18 }) : null);
  }

  function Tag(p) {
    return h("span", { className: cx("nar-tag", "nar-tag-" + (p.tone || "nogal"), p.className) },
      p.icon ? h(Icon, { name: p.icon, size: 14, strokeWidth: 1.75 }) : null, p.children);
  }

  function ServiceCard(p) {
    return h("article", { className: cx("nar-service", p.className) },
      h("div", { className: "nar-service-head" },
        h("span", { className: "nar-disc" }, h(Icon, { name: p.icon || "scale", size: 26 })),
        h("div", null,
          p.area ? h("p", { className: "nar-eyebrow" }, p.area) : null,
          h("h3", { className: "nar-service-title" }, p.title))),
      p.items && p.items.length ? h("ul", { className: "nar-service-list" },
        p.items.map(function (it, i) { return h("li", { key: i }, it); })) : null,
      p.footer ? h("div", { className: "nar-service-foot" }, p.footer) : null);
  }

  function Callout(p) {
    return h("figure", { className: cx("nar-callout", p.className) },
      h("span", { className: "nar-callout-rule", "aria-hidden": "true" }),
      h("blockquote", { className: "nar-callout-quote" }, p.children),
      p.cite ? h("figcaption", { className: "nar-callout-cite" }, p.cite) : null);
  }

  function ContactCard(p) {
    var phones = p.phones || [];
    return h("section", { className: cx("nar-contact", p.className), "aria-label": "Datos de contacto" },
      h("div", { className: "nar-contact-lead" },
        h("span", { className: "nar-disc nar-disc-solid" }, h(Icon, { name: "phone", size: 22 })),
        h("p", { className: "nar-contact-title" }, p.title || "Contáctanos")),
      h("ul", { className: "nar-contact-phones" }, phones.map(function (n, i) { return h("li", { key: i }, n); })),
      p.address ? h("p", { className: "nar-contact-line" }, h(Icon, { name: "map-pin", size: 18 }), p.address) : null,
      p.handle ? h("p", { className: "nar-contact-line" }, h(Icon, { name: "message-circle", size: 18 }), p.handle) : null);
  }

  function CarouselSlide(p) {
    return h("article", { className: cx("nar-slide", p.tone === "dark" ? "nar-slide-dark" : null, p.className) },
      h("div", { className: "nar-slide-card" },
        p.eyebrow ? h("p", { className: "nar-eyebrow" }, p.eyebrow) : null,
        h("h2", { className: "nar-slide-title" }, p.title),
        p.children ? h("div", { className: "nar-slide-body" }, p.children) : null,
        p.next === false ? null : h("span", { className: "nar-slide-next", "aria-hidden": "true" }, h(Icon, { name: "arrow-right", size: 28, strokeWidth: 1.25 }))),
      h("p", { className: "nar-slide-handle" }, p.handle || "@nar.abogadosyasociados"));
  }

  window.NAR = Object.assign(window.NAR || {}, {
    Button: Button, Tag: Tag, Icon: Icon, ServiceCard: ServiceCard,
    Callout: Callout, ContactCard: ContactCard, CarouselSlide: CarouselSlide
  });
})();
