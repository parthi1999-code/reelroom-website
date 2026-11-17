/*
 * dc-lite.js — a tiny renderer for the Audioheads pages.
 * Each page keeps its markup in <template id="dc-tpl"> with {{ holes }}, <sc-if> and <sc-for>,
 * and a Component class (extends DCLogic) that supplies renderVals(). State changes are
 * re-rendered to an HTML string and patched into the page with morphdom, so canvases,
 * inputs and focus survive updates.
 */
(function () {
  'use strict';
  var VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, source: 1, track: 1, wbr: 1 };
  var EVENTS = ['click', 'submit', 'keydown', 'change', 'input'];
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;

  function lookup(path, scope) {
    path = String(path).trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return parseFloat(path);
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  function single(str) { var m = String(str || '').match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/); return m ? m[1] : null; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escA(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
  function subst(str, scope) { return str.replace(HOLE, function (_, p) { var v = lookup(p, scope); return v == null ? '' : String(v); }); }

  function kids(node, scope, reg, out) { for (var c = node.firstChild; c; c = c.nextSibling) renderNode(c, scope, reg, out); }
  function renderNode(node, scope, reg, out) {
    if (node.nodeType === 3) { out.push(esc(subst(node.nodeValue, scope))); return; }
    if (node.nodeType !== 1) return;
    var tag = node.localName;
    if (tag === 'helmet') return;
    if (tag === 'sc-if') { if (lookup(single(node.getAttribute('value')), scope)) kids(node, scope, reg, out); return; }
    if (tag === 'sc-for') {
      var list = lookup(single(node.getAttribute('list')), scope) || [], as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) { var s2 = Object.create(scope); s2[as] = list[i]; kids(node, s2, reg, out); }
      return;
    }
    out.push('<' + tag);
    var attrs = node.attributes;
    for (var k = 0; k < attrs.length; k++) {
      var a = attrs[k], n = a.name, v = a.value;
      if (n.indexOf('hint-') === 0) continue;
      if (n.length > 2 && n.charAt(0) === 'o' && n.charAt(1) === 'n') {
        var hp = single(v);
        if (hp) { var fn = lookup(hp, scope); if (typeof fn === 'function') { var id = 'h' + (reg.n++); reg.map[id] = fn; out.push(' data-dc-' + n.slice(2).toLowerCase() + '="' + id + '"'); } }
        continue;
      }
      var sp = single(v);
      if (sp !== null) {
        var val = lookup(sp, scope);
        if (val === false || val == null) continue;
        out.push(' ' + n + '="' + escA(val === true ? '' : val) + '"');
      } else out.push(' ' + n + '="' + escA(subst(v, scope)) + '"');
    }
    out.push('>');
    if (VOID[tag]) return;
    kids(node, scope, reg, out);
    out.push('</' + tag + '>');
  }

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (u) {
    if (typeof u === 'function') u = u(this.state, this.props);
    if (u) for (var k in u) this.state[k] = u[k];
    if (this.__dc) this.__dc.schedule();
  };
  window.DCLogic = DCLogic;

  window.DC = {
    mount: function (Comp, props) {
      var tplEl = document.getElementById('dc-tpl'), root = document.getElementById('dc-root');
      var tpl = tplEl.content;
      var inst = new Comp(props || {});
      if (!inst.state) inst.state = {};
      var reg = { n: 0, map: {} }, pending = false;
      function html() { reg = { n: 0, map: {} }; var out = []; kids(tpl, inst.renderVals(), reg, out); return out.join(''); }
      function patch() {
        pending = false;
        var next = html();
        morphdom(root, '<div id="dc-root">' + next + '</div>', {
          childrenOnly: true,
          onBeforeElUpdated: function (from, to) {
            var t = from.tagName;
            if (t === 'CANVAS') { var st = to.getAttribute('style'); if (from.getAttribute('style') !== st) from.setAttribute('style', st || ''); return false; }
            if ((t === 'INPUT' && from.type !== 'hidden') || t === 'TEXTAREA' || t === 'SELECT') {
              for (var i = 0; i < to.attributes.length; i++) { var a = to.attributes[i]; if (a.name.indexOf('data-dc-') === 0) from.setAttribute(a.name, a.value); }
              return false;
            }
            return true;
          }
        });
        state.reg = reg;
      }
      var state = { reg: reg };
      inst.__dc = { schedule: function () { if (pending) return; pending = true; Promise.resolve().then(patch); } };
      root.innerHTML = html(); state.reg = reg;
      EVENTS.forEach(function (ev) {
        root.addEventListener(ev, function (e) {
          var el = e.target;
          while (el && el !== root) {
            if (el.getAttribute) { var id = el.getAttribute('data-dc-' + ev); if (id) { var fn = state.reg.map[id]; if (fn) fn(e); return; } }
            el = el.parentNode;
          }
        });
      });
      if (inst.componentDidMount) inst.componentDidMount();
      window.addEventListener('pagehide', function () { if (inst.componentWillUnmount) try { inst.componentWillUnmount(); } catch (e) {} });
      return inst;
    }
  };
})();
