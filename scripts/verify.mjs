import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script, createContext } from 'node:vm';

// Regression checks for packaging and the host/plugin boundary. This small DOM
// models mutation/resize deliveries, not browser layout: screenshots, dragging,
// chat scrolling and editor interactions still require live acceptance.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFile(resolve(root, file), 'utf8');
const ID = 'dsh-theme-buriburizaemon-kitchen';
const ATTRIBUTE = 'data-buriburizaemon-kitchen';
const ROOT = '[data-slot="main"] .an3WzG_root';
const BRAND = '[data-slot="sidebar"] .wtg9ga_root:not(.wtg9ga_collapsed) .wtg9ga_logoRow';
const SCALE = '--kitch-scale';
const CHROME = '--kitch-top-chrome';
const [bundle, source, themeCss, sidebarCss, manifestText, patch] = await Promise.all([
  read('lib/client.js'), read('src/client.js'), read('src/theme.css'),
  read('src/sidebar.css'), read('package.json'), read('cordis.patch.yml'),
]);
const css = `${themeCss}\n${sidebarCss}`;
const manifest = JSON.parse(manifestText);
let passed = 0;
let failed = 0;
async function check(name, run) {
  try {
    await run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}\n  ${error.message}`);
  }
}

await check('the distributable matches current source, both stylesheets and exact PNG bytes', async () => {
  const artMatch = bundle.match(/const ART = (\{[^\n]*\});/);
  const cssMatch = bundle.match(/const CSS = ("(?:\\.|[^"\\])*");/);
  assert.ok(artMatch && cssMatch, 'Build first: assets and CSS must be embedded.');
  const art = JSON.parse(artMatch[1]);
  const files = { source: 'design-source.png', room: 'room-clean.png' };
  assert.deepEqual(Object.keys(art).sort(), Object.keys(files).sort());
  for (const [key, file] of Object.entries(files)) {
    const bytes = await readFile(resolve(root, 'assets', file));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file}: PNG signature`);
    assert.equal(bytes.subarray(12, 16).toString(), 'IHDR', `${file}: PNG header`);
    assert.ok(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0, `${file}: valid dimensions`);
    if (key === 'source') {
      assert.equal(bytes.readUInt32BE(16), 1489, 'source crop coordinates require the approved width');
      assert.equal(bytes.readUInt32BE(20), 1056, 'source crop coordinates require the approved height');
    }
    assert.equal(art[key], `data:image/png;base64,${bytes.toString('base64')}`, `${file}: embedded bytes are current`);
  }
  assert.equal(JSON.parse(cssMatch[1]), css, 'rebuild after changing either stylesheet');
  assert.equal(bundle, source.replace('/*__BURI_ASSETS__*/ {}', () => JSON.stringify(art))
    .replace('/*__BURI_CSS__*/ ""', () => JSON.stringify(css)), 'rebuild after changing client source');
  assert.ok(!bundle.includes('/*__BURI_'), 'no unresolved build marker');
  new Script(bundle, { filename: 'lib/client.js' });
});

await check('installable metadata resolves the native dependencies and entry points', async () => {
  assert.equal(manifest.name, ID);
  assert.equal(manifest.exports['.'], './lib/index.js');
  assert.equal(manifest.exports['./client'], './lib/client.js');
  assert.match(patch, new RegExp(`name:\\s*${ID}(?:\\s|$)`));
  assert.equal(manifest.dsh.client.platform, 'web');
  assert.equal(manifest.dsh.client.immediately, true);
  for (const dependency of ['@deepseek-ai/dsh-client-ui-theme', '@deepseek-ai/dsh-client-ui-renderer', '@deepseek-ai/dsh-client-ui-sidebar']) {
    assert.ok(manifest.dsh.client.inject.includes(dependency), `declares ${dependency}`);
  }
  for (const file of [manifest.main, manifest.exports['./client'],
    manifest.dsh.bundle.patch, 'locale/zh.json', 'locale/en.json']) await access(resolve(root, file));
  if (manifest.icon) {
    const icon = await readFile(resolve(root, manifest.icon));
    assert.ok(icon.byteLength <= 256 * 1024, 'DSH limits plugin icons to 256 KiB');
  }
});

function harness({ previous = null, initialScale = '', initialChrome = '', withTargets = true, withResizeObserver = true } = {}) {
  const nodes = [];
  const mutationObservers = [];
  const resizeObservers = [];
  const frames = new Map();
  const listeners = new Map();
  const cleanups = [];
  const palettes = new Map();
  const slots = new Map();
  let sequence = 0;
  let frameId = 0;
  let registration;
  let nativeBaseline;
  const fixture = { height: 1024, chrome: 32, sidebarWidth: 303, roots: [], brands: [], shell: null };
  const descendantsOf = (node, ancestor) => {
    for (let current = node; current; current = current.parentElement) if (current === ancestor) return true;
    return false;
  };
  function mutation(record) {
    for (const observer of mutationObservers) {
      if (!observer.active || !descendantsOf(record.target, observer.target)) continue;
      if (record.type === 'attributes' && !observer.options.attributeFilter.includes(record.attributeName)) continue;
      observer.pending.push(record);
    }
  }
  function notifyResize() {
    for (const observer of resizeObservers) if (observer.targets.size) observer.pending = true;
  }
  class Style {
    constructor(owner) { this.owner = owner; this.values = new Map(); this.priorities = new Map(); }
    getPropertyValue(name) { return this.values.get(name) ?? ''; }
    getPropertyPriority(name) { return this.priorities.get(name) ?? ''; }
    setProperty(name, value, priority = '') {
      assert.ok(this.owner === body && [SCALE, CHROME].includes(name), `unexpected inline-style write on native ${this.owner.tagName}: ${name}`);
      this.values.set(name, String(value)); this.priorities.set(name, priority);
      notifyResize();
    }
    removeProperty(name) {
      assert.ok(this.owner === body && [SCALE, CHROME].includes(name));
      const old = this.getPropertyValue(name);
      this.values.delete(name); this.priorities.delete(name); notifyResize();
      return old;
    }
  }
  class Element {
    constructor(tagName, native = false) {
      this.id = ++sequence; this.tagName = tagName; this.native = native;
      this.parentElement = null; this.children = []; this.attributes = new Map();
      this.dataset = {}; this.style = new Style(this); this.className = ''; this._text = '';
      nodes.push(this);
    }
    get parentNode() { return this.parentElement; }
    get isConnected() { return this === documentRoot || Boolean(this.parentElement?.isConnected); }
    get textContent() { assert.ok(!this.native, 'native messages must not be read'); return this._text; }
    set textContent(value) { assert.ok(!this.native, 'native content must not be replaced'); this._text = value; }
    get innerHTML() { throw new Error('Native markup inspection is outside the theme contract.'); }
    set innerHTML(value) { throw new Error('Native markup replacement is outside the theme contract.'); }
    setAttribute(name, value) {
      assert.ok(!this.native || this === body && name === ATTRIBUTE, `unexpected native attribute write: ${name}`);
      this.attributes.set(name, String(value)); mutation({ type: 'attributes', target: this, attributeName: name });
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    removeAttribute(name) {
      assert.ok(!this.native || this === body && name === ATTRIBUTE);
      this.attributes.delete(name); mutation({ type: 'attributes', target: this, attributeName: name });
    }
    prepend(child) {
      assert.ok(!child.native && Object.hasOwn(child.dataset, 'buriOwned'), 'only owned decoration may enter native containers');
      assert.ok(fixture.roots.includes(this) || fixture.brands.includes(this), 'decoration is restricted to main and branding targets');
      child.parentElement = this; this.children.unshift(child); mutation({ type: 'childList', target: this });
    }
    appendChild(child) {
      assert.ok(this === head && child.tagName === 'style', 'only a stylesheet may be appended');
      child.parentElement = this; this.children.push(child); return child;
    }
    remove() {
      assert.ok(!this.native, 'native controls must not be removed');
      if (!this.parentElement) return;
      const parent = this.parentElement;
      parent.children = parent.children.filter((child) => child !== this); this.parentElement = null;
      mutation({ type: 'childList', target: parent });
    }
    getBoundingClientRect() {
      return { top: this === shell ? 0 : fixture.chrome,
        height: this === shell ? fixture.height + fixture.chrome : fixture.height,
        width: 1489 - fixture.sidebarWidth };
    }
  }
  const documentRoot = new Element('#document', true);
  const nativeChild = (parent, tagName) => {
    const child = new Element(tagName, true); child.parentElement = parent; parent.children.push(child); return child;
  };
  const head = nativeChild(documentRoot, 'head');
  const body = nativeChild(documentRoot, 'body');
  const app = nativeChild(body, 'app');
  const shell = nativeChild(app, 'frame');
  const sidebar = nativeChild(shell, 'sidebar');
  const sidebarHandle = nativeChild(shell, 'sidebar-resize-handle');
  const main = nativeChild(shell, 'main');
  const logo = nativeChild(sidebar, 'logo');
  nativeChild(sidebar, 'history'); nativeChild(sidebar, 'settings');
  const conversation = nativeChild(main, 'conversation');
  nativeChild(conversation, 'header'); nativeChild(conversation, 'transcript'); nativeChild(conversation, 'composer');
  shell.style.values.set('grid-template-columns', '303px minmax(0px, 1fr) minmax(0px, 0px)');
  shell.style.values.set('--dsh-windows-sidebar-width', '303px');
  sidebar.style.values.set('width', '303px'); sidebarHandle.style.values.set('left', '303px');
  sidebarHandle.attributes.set('data-side', 'sidebar');
  if (withTargets) Object.assign(fixture, { roots: [conversation], brands: [logo], shell });
  if (previous !== null) body.attributes.set(ATTRIBUTE, previous);
  for (const [name, value] of [[SCALE, initialScale], [CHROME, initialChrome]]) {
    if (value) { body.style.values.set(name, value); body.style.priorities.set(name, 'important'); }
  }
  const initialBodyStyle = [...body.style.values];
  const initialBodyPriorities = [...body.style.priorities];
  const snapshot = () => JSON.stringify(nodes.filter((node) => node.native && node !== body).map((node) => ({
    id: node.id, parent: node.parentElement?.id, children: node.children.filter((child) => child.native).map((child) => child.id),
    attrs: [...node.attributes], style: [...node.style.values], text: node._text,
  })));
  nativeBaseline = snapshot();
  const document = {
    head, body,
    createElement: (name) => { assert.ok(['style', 'div'].includes(name)); return new Element(name); },
    getElementById: (id) => { assert.equal(id, 'root'); return app; },
    querySelector: (selector) => { assert.equal(selector, '.mP3x-q_frame'); return fixture.shell; },
    querySelectorAll: (selector) => {
      if (selector === ROOT) return [...fixture.roots];
      assert.equal(selector, BRAND, 'the theme only locates its approved decorative targets'); return [...fixture.brands];
    },
  };
  class MutationObserver {
    constructor(callback) { this.callback = callback; this.pending = []; this.active = false; mutationObservers.push(this); }
    observe(target, options) {
      assert.equal(target, app); assert.equal(options.childList, true); assert.equal(options.subtree, true);
      assert.deepEqual(Array.from(options.attributeFilter), ['data-phase', 'data-sidebar-collapsed']);
      this.target = target; this.options = options; this.active = true;
    }
    disconnect() { this.active = false; this.pending = []; }
  }
  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.targets = new Set(); this.pending = false; resizeObservers.push(this); }
    observe(target) { assert.ok(target === shell || fixture.roots.includes(target)); this.targets.add(target); this.pending = true; }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); this.pending = false; }
  }
  const window = {
    innerHeight: 1056,
    addEventListener: (name, callback) => { assert.equal(name, 'resize'); const set = listeners.get(name) ?? new Set(); set.add(callback); listeners.set(name, set); },
    removeEventListener: (name, callback) => listeners.get(name)?.delete(callback),
    __ModuleLoader__: { load: (definition) => { assert.equal(registration, undefined); registration = definition; } },
  };
  const forbidden = (name) => () => { throw new Error(`Unexpected capability: ${name}`); };
  const context = createContext({
    document, window, MutationObserver, ...(withResizeObserver ? { ResizeObserver } : {}),
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
    getComputedStyle: (element) => { assert.equal(element, shell); return { paddingTop: `${fixture.chrome}px` }; },
    fetch: forbidden('network'), XMLHttpRequest: forbidden('network'), WebSocket: forbidden('network'),
    localStorage: { setItem: forbidden('host preferences'), getItem: forbidden('host preferences') },
  });
  new Script(bundle, { filename: 'lib/client.js' }).runInContext(context, { timeout: 2000 });
  assert.equal(registration.id, ID);
  const plugin = registration.factory((name) => {
    assert.equal(name, 'react'); return { createElement: (type, props, ...children) => ({ type, props, children }) };
  });
  const ctx = {
    effect: (effect) => { const cleanup = effect(); assert.equal(typeof cleanup, 'function'); cleanups.push(cleanup); },
    theme: { overrideTokens: (name, tokens) => {
      assert.equal(name, ID); assert.ok(!palettes.has(name));
      for (const [token, values] of Object.entries(tokens)) {
        assert.match(token, /^--dsw-/); assert.deepEqual(Object.keys(values).sort(), ['dark', 'light']);
        for (const value of Object.values(values)) assert.match(value, /^#[\da-f]{6}$/i);
      }
      palettes.set(name, tokens); return () => palettes.delete(name);
    } },
    slots: {
      inject: (name, factory) => { assert.equal(name, 'sidebar.footer.action'); cleanups.push(factory()); },
      register: (options, component) => {
        assert.equal(options.name, 'sidebar.footer.action'); assert.equal(options.id, 'kitch-sidebar-art');
        assert.ok(!slots.has(options.id), 'no duplicate native slot registration');
        slots.set(options.id, component); return () => slots.delete(options.id);
      },
    },
  };
  const owned = () => nodes.filter((node) => Object.hasOwn(node.dataset, 'buriOwned') && node.parentElement);
  const styles = () => head.children.filter((node) => node.tagName === 'style');
  const activeWork = () => frames.size || mutationObservers.some((observer) => observer.active && observer.pending.length)
    || resizeObservers.some((observer) => observer.pending && observer.targets.size);
  function flush() {
    let rounds = 0;
    while (activeWork()) {
      assert.ok(++rounds <= 12, 'mutation/resize/rAF deliveries must settle without a feedback loop');
      for (const observer of mutationObservers) if (observer.active && observer.pending.length) {
        const records = observer.pending.splice(0); observer.callback(records);
      }
      for (const observer of resizeObservers) if (observer.pending && observer.targets.size) {
        observer.pending = false; observer.callback([...observer.targets].map((target) => ({ target })));
      }
      const pending = [...frames.values()]; frames.clear(); for (const callback of pending) callback();
    }
    assert.equal(snapshot(), nativeBaseline, 'native columns, drag handle, controls and messages remain unchanged');
    return rounds;
  }
  const dispose = () => { while (cleanups.length) cleanups.pop()(); };
  const assertClean = () => {
    assert.equal(owned().length, 0); assert.equal(styles().length, 0);
    assert.equal(slots.size, 0); assert.equal(palettes.size, 0); assert.equal(frames.size, 0);
    assert.equal(mutationObservers.filter((observer) => observer.active).length, 0);
    assert.equal(resizeObservers.reduce((sum, observer) => sum + observer.targets.size, 0), 0);
    assert.equal(listeners.get('resize')?.size ?? 0, 0);
    assert.equal(body.getAttribute(ATTRIBUTE), previous);
    assert.deepEqual([...body.style.values], initialBodyStyle); assert.deepEqual([...body.style.priorities], initialBodyPriorities);
    assert.equal(snapshot(), nativeBaseline);
  };
  const nativeMutation = (run) => { run(); nativeBaseline = snapshot(); mutation({ type: 'childList', target: app }); };
  return { plugin, ctx, fixture, body, app, shell, sidebar, main, logo, conversation, slots, owned, styles, frames,
    mutation, notifyResize, flush, dispose, assertClean, nativeMutation, nativeChild, mutationObservers, resizeObservers,
    windowResize: () => { for (const callback of listeners.get('resize') ?? []) callback(); },
    hostSidebarResize: (width) => nativeMutation(() => {
      fixture.sidebarWidth = width;
      shell.style.values.set('grid-template-columns', `${width}px minmax(0px, 1fr) minmax(0px, 0px)`);
      shell.style.values.set('--dsh-windows-sidebar-width', `${width}px`);
      sidebar.style.values.set('width', `${width}px`);
      sidebarHandle.style.values.set('left', `${width}px`); notifyResize();
    }),
  };
}

await check('activation is inert to native content and disposal restores previous state', () => {
  for (const initial of [{}, { previous: 'existing', initialScale: '.93', initialChrome: '28px' }]) {
    const h = harness(initial); h.plugin.apply(h.ctx); h.flush();
    assert.equal(h.owned().length, 2); assert.equal(h.styles().length, 1); assert.equal(h.slots.size, 1);
    const footer = h.slots.get('kitch-sidebar-art');
    assert.equal(footer({ wide: false }), null);
    const tree = footer({ wide: true });
    assert.equal(tree.props['aria-hidden'], true);
    assert.equal(tree.children[0].children[0].props.draggable, false);
    h.dispose(); h.assertClean();
    h.plugin.apply(h.ctx); h.flush(); assert.equal(h.owned().length, 2);
    h.dispose(); h.assertClean();
  }
});

await check('mutation and resize bursts settle without duplicate background layers', () => {
  const h = harness(); h.plugin.apply(h.ctx); h.flush();
  const original = h.owned().map((node) => node.id);
  for (let index = 0; index < 50; index += 1) {
    h.mutation({ type: 'childList', target: h.conversation }); h.notifyResize(); h.windowResize();
  }
  assert.ok(h.frames.size <= 1, 'events coalesce into one animation frame'); h.flush();
  assert.deepEqual(h.owned().map((node) => node.id), original, 'stable targets retain their existing layers');
  h.owned().find((node) => node.className === 'kitch-room').remove(); h.flush();
  assert.equal(h.owned().length, 2, 'a removed layer is repaired once');
  for (const name of ['kitch-room', 'kitch-brand']) {
    assert.equal(h.owned().filter((node) => node.className === name).length, 1, `${name}: exactly one instance`);
  }
  h.dispose(); h.assertClean();
});

await check('native sidebar dragging and target replacement do not reset width or retain stale artwork', () => {
  const h = harness(); h.plugin.apply(h.ctx); h.flush();
  for (const width of [200, 440, 303]) { h.hostSidebarResize(width); h.flush(); }
  h.nativeMutation(() => { h.fixture.brands = []; }); h.flush();
  assert.equal(h.owned().length, 1, 'collapsed sidebar loses only its decorative brand');
  h.nativeMutation(() => {
    h.fixture.brands = [h.logo];
    h.main.children = h.main.children.filter((child) => child !== h.conversation);
    h.conversation.parentElement = null;
    const next = h.nativeChild(h.main, 'new-conversation');
    h.nativeChild(next, 'new-native-composer'); h.fixture.roots = [next];
  }); h.flush();
  assert.equal(h.owned().length, 2); assert.equal(h.conversation.children.filter((node) => !node.native).length, 0);
  assert.ok(h.resizeObservers.every((observer) => !observer.targets.has(h.conversation)), 'detached roots are unobserved');
  h.dispose(); h.assertClean();
});

await check('late mounting, missing ResizeObserver, and queued notifications survive unload safely', () => {
  for (const withResizeObserver of [true, false]) {
    const h = harness({ withTargets: false, withResizeObserver }); h.plugin.apply(h.ctx); h.flush();
    assert.equal(h.owned().length, 0);
    h.nativeMutation(() => Object.assign(h.fixture, { roots: [h.conversation], brands: [h.logo], shell: h.shell }));
    h.flush(); assert.equal(h.owned().length, 2);
    h.fixture.height = 620; h.fixture.chrome = 40; h.windowResize(); h.flush();
    assert.equal(h.body.style.getPropertyValue(SCALE), (660 / 1056).toFixed(5));
    assert.equal(h.body.style.getPropertyValue(CHROME), '40.000px');
    h.windowResize(); assert.equal(h.frames.size, 1);
    const callbacks = [...h.mutationObservers, ...h.resizeObservers].map((observer) => observer.callback);
    h.dispose(); h.assertClean();
    for (const callback of callbacks) callback([{ type: 'childList', target: h.app }]);
    h.flush(); h.assertClean();
  }
});

const uncommented = css.replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...uncommented.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({ selector: match[1].trim(), declarations: match[2] }));
await check('CSS leaves native frame, resize hit targets and sticky scroll ownership intact', () => {
  for (const { selector, declarations } of rules) {
    const targetIsFrame = /\.mP3x-q_(?:frame|sidebarCol|handle)(?:[^\s>]*)$/.test(selector);
    if (targetIsFrame) assert.doesNotMatch(declarations,
      /(?:^|;)\s*(?:grid-template-columns|width|min-width|max-width|flex-basis|position|display|left|right|transform|translate|pointer-events)\s*:/,
      `native resize geometry must remain host-owned: ${selector}`);
    assert.doesNotMatch(declarations, /(?:^|;)\s*--dsh-windows-sidebar-width\s*:/, 'do not overwrite native sidebar width');
    if (/\.an3WzG_composerSeat(?:[^\s>]*)$/.test(selector)) {
      assert.doesNotMatch(declarations, /position\s*:\s*(?:absolute|fixed)/, 'composer remains in native sticky flow');
      assert.doesNotMatch(declarations, /background(?:-color)?\s*:\s*(?:transparent|none|#(?:0000|ffffff00))/, 'do not remove the native message shield');
    }
    if (/\.an3WzG_scrollBody(?:[^\s>]*)$/.test(selector)) assert.doesNotMatch(declarations,
      /(?:height|max-height)\s*:\s*calc\([^;]*(?:composer|input)|overflow(?:-y)?\s*:\s*hidden/, 'chat keeps its native scrollport');
  }
});

await check('CSS prevents illustrated avatars, assistant bubbles and overlapping character silhouettes', () => {
  for (const { selector, declarations } of rules) {
    if (selector.includes('.xMeOpW_body') && !selector.includes('.md-table-wide')) {
      for (const match of declarations.matchAll(/(?:^|;)\s*(background(?:-color)?|padding(?:-[\w]+)?|border-radius)\s*:\s*([^;]+)/g)) {
        assert.match(match[2].trim(), /^(?:transparent|none|0(?:px)?(?:\s+0(?:px)?)*)$/, `native assistant body must remain unboxed: ${match[1]}`);
      }
    }
    if (/(?:LOmM4q_userStack|xMeOpW_body)::(?:before|after)/.test(selector)) assert.match(declarations, /content\s*:\s*none/, 'no chat avatar pseudoelements');
  }
  const compact = uncommented.replace(/\s+/g, '');


  assert.ok(rules.some(({ selector, declarations }) => selector.includes('.kitch-room') && /pointer-events\s*:\s*none/.test(declarations)), 'backgrounds must not intercept controls or resize handles');
  assert.ok(rules.some(({ selector, declarations }) => selector.endsWith('.wtg9ga_regionArea') && /flex\s*:\s*1\s+0\s+min\(/.test(declarations)), 'history receives a usable flex basis before decoration');
  for (const ancestor of ['.wtg9ga_footArea', '.wtg9ga_footerActions']) {
    assert.ok(rules.some(({ selector, declarations }) => selector.includes(ancestor) && /flex\s*:\s*0\s+1\s/.test(declarations)), `${ancestor}: decorative footer ancestors can shrink`);
  }
});

console.log(`\nVerified ${passed} checks; ${failed} failed. Browser layout and native interaction require the separate live acceptance pass.`);
if (failed) process.exitCode = 1;
