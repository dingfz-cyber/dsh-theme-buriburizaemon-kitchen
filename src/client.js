/** 肥嘟嘟左卫门 · 暖黄厨房 — reference canvas 1489 × 1056. */
window.__ModuleLoader__.load({
  id: 'dsh-theme-buriburizaemon-kitchen',
  factory: (require) => {
    const React = require('react');
    const ART = /*__BURI_ASSETS__*/ {};
    const CSS = /*__BURI_CSS__*/ "";
    const ID = 'dsh-theme-buriburizaemon-kitchen';
    const ATTRIBUTE = 'data-buriburizaemon-kitchen';
    const SCALE = '--kitch-scale';
    const ROOT_SELECTOR = '[data-slot="main"] .an3WzG_root';
    const BRAND_SELECTOR = '[data-slot="sidebar"] .wtg9ga_root:not(.wtg9ga_collapsed) .wtg9ga_logoRow';
    const palette = {
      '--dsw-alias-bg-base': ['#fffdf4', '#2c2224'],
      '--dsw-alias-bg-layer-1': ['#fffdf6', '#37292c'],
      '--dsw-alias-bg-layer-2': ['#fff6d6', '#423034'],
      '--dsw-alias-bg-layer-3': ['#ffefbf', '#513b40'],
      '--dsw-alias-bg-overlay': ['#fffdf6', '#3c2c30'],
      '--dsw-alias-bg-module-platform': ['#fffdf4', '#2c2224'],
      '--dsw-alias-bg-multi-select': ['#ffe39c', '#68434c'],
      '--dsw-alias-bg-skeleton': ['#f4e1dd', '#4b363c'],
      '--dsw-alias-label-primary': ['#542b1d', '#ffede8'],
      '--dsw-alias-label-primary-bluish': ['#542b1d', '#ffede8'],
      '--dsw-alias-label-secondary': ['#927557', '#e7c7c4'],
      '--dsw-alias-label-tertiary': ['#ad9270', '#cda6a4'],
      '--dsw-alias-label-caption': ['#a4937e', '#bc9799'],
      '--dsw-alias-label-dimmed': ['#c6bba4', '#99777b'],
      '--dsw-alias-border-l1': ['#edc675', '#975d6c'],
      '--dsw-alias-border-l2': ['#f5ddb0', '#78515b'],
      '--dsw-alias-border-l3': ['#f5e9cb', '#573d45'],
      '--dsw-alias-border-l4': ['#eac37e', '#956273'],
      '--dsw-alias-border-l2-darkmode-thin': ['#f5ddb0', '#78515b'],
      '--dsw-alias-brand-primary': ['#eea327', '#f7bd5d'],
      '--dsw-alias-brand-text': ['#ffffff', '#37222b'],
      '--dsw-alias-brand-primary-invert': ['#f7bd5d', '#eea327'],
      '--dsw-alias-button-primary-fill': ['#eea327', '#f5bc62'],
      '--dsw-alias-button-primary-hover': ['#df901c', '#ffd18a'],
      '--dsw-alias-button-primary-dimmed': ['#f1d6a2', '#9c626f'],
      '--dsw-alias-button-info-fill': ['#efb344', '#f5bc62'],
      '--dsw-alias-button-info-hover': ['#e5a230', '#ffd18a'],
      '--dsw-alias-button-elevated-fill': ['#fffdf6', '#403035'],
      '--dsw-alias-button-floating-fill': ['#fffdf6', '#403035'],
      '--dsw-alias-button-floating-hover': ['#fff0bf', '#5b3f48'],
      '--dsw-alias-button-tool-bar-fill': ['#fff9e8', '#403035'],
      '--dsw-alias-button-tool-bar-hover': ['#fff0c2', '#5b3f48'],
      '--dsw-alias-button-ghost-active-border': ['#eea327', '#f5bc62'],
      '--dsw-alias-button-ghost-active-fill': ['#fff0bf', '#68434c'],
      '--dsw-alias-button-ghost-active-hover': ['#ffe3a0', '#7b515e'],
      '--dsw-alias-state-business-primary': ['#c98923', '#f7bd5d'],
      '--dsw-alias-state-business-tertiary': ['#fff0bf', '#68434c'],
      '--dsw-alias-interactive-bg-hover': ['#fff3cc', '#543940'],
      '--dsw-alias-interactive-bg-active': ['#ffe29d', '#6c4651'],
      '--dsw-alias-interactive-bg-hover-solid': ['#fff3cc', '#543940'],
      '--dsw-alias-interactive-bg-hover-accent': ['#ffedb6', '#68434c'],
      '--dsw-alias-markdown-code-block': ['#faf4e5', '#34272c'],
      '--dsw-alias-markdown-code-block-banner': ['#f2e5c8', '#4e3840'],
      '--dsw-alias-markdown-inline-code': ['#f8eccc', '#593d48'],
      '--dsw-alias-markdown-citation': ['#fcf5e2', '#45323a'],
      '--dsw-alias-separator-primary': ['#f0ddb0', '#6e4854'],
      '--dsw-alias-scrollbar-bg-l1': ['#dfc78f', '#93616e'],
      '--dsw-alias-scrollbar-bg-l2': ['#ebd7a9', '#805360'],
      '--dsw-alias-scrollbar-hover-l1': ['#ccaa5f', '#c8889c'],
      '--dsw-alias-scrollbar-hover-l2': ['#dcc185', '#b1778a'],
      '--dsw-specific-sidebar-fill': ['#fff3c7', '#3c2b2d'],
      '--dsw-specific-sidebar-nav-item-active': ['#ffe29d', '#6c4651'],
      '--dsw-specific-sidebar-nav-item-active-accent': ['#f8d983', '#7d5160'],
      '--dsw-specific-sidebar-nav-item-hover': ['#fff0bf', '#563b41'],
      '--dsw-specific-bubble': ['#fff3c9', '#63424b'],
      '--dsw-specific-bubble-highlight': ['#f8d889', '#7d5262'],
      '--dsw-specific-input-major': ['#fffdf4', '#382a30'],
      '--dsw-specific-login-input': ['#fffdf4', '#382a30'],
      '--dsw-specific-menu': ['#fffdf6', '#403036'],
      '--dsw-specific-selector': ['#fff9e8', '#593c47'],
      '--dsw-specific-tip': ['#fff5db', '#5c4544']
    };
    const tokens = Object.fromEntries(Object.entries(palette).map(([key, [light, dark]]) => [key, {light, dark}]));

    function SidebarArtwork({wide}) {
      return wide ? React.createElement('div', {className: 'kitch-sidebar-art', 'aria-hidden': true},
        React.createElement('span', {className: 'kitch-sidebar-crop'},
          React.createElement('img', {src: ART.source, alt: '', draggable: false}))) : null;
    }

    function apply(ctx) {
      ctx.effect(() => ctx.theme.overrideTokens(ID, tokens), 'kitch: palette');
      ctx.effect(() => {
        const body = document.body;
        const previousAttribute = body.getAttribute(ATTRIBUTE);
        const previousScale = body.style.getPropertyValue(SCALE);
        const previousScalePriority = body.style.getPropertyPriority(SCALE);
        const previousChrome = body.style.getPropertyValue('--kitch-top-chrome');
        const previousChromePriority = body.style.getPropertyPriority('--kitch-top-chrome');
        const style = document.createElement('style');
        style.dataset.plugin = ID;
        const sourceSelectors = [
          '.kitch-brand'
        ].map(selector => `body[${ATTRIBUTE}] ${selector}`).join(',');
        // Direct image declarations avoid Chromium's large custom-property limit.
        style.textContent = CSS
          + `\nbody[${ATTRIBUTE}] .kitch-room{background-image:url(${JSON.stringify(ART.room)})}`
          + `\n${sourceSelectors}{background-image:url(${JSON.stringify(ART.source)})}`;
        document.head.appendChild(style);
        body.setAttribute(ATTRIBUTE, '1');

        const mounted = new Map();
        const observed = new Set();
        let frame = 0;
        let disposed = false;
        const schedule = () => {
          if (!disposed && !frame) frame = requestAnimationFrame(update);
        };
        const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;

        function make(className, parent) {
          const element = document.createElement('div');
          element.className = className;
          element.setAttribute('aria-hidden', 'true');
          element.dataset.buriOwned = '';
          parent.prepend(element);
          return element;
        }

        function update() {
          frame = 0;
          if (disposed) return;
          const roots = [...document.querySelectorAll(ROOT_SELECTOR)];
          const brands = [...document.querySelectorAll(BRAND_SELECTOR)];
          const shell = document.querySelector('.mP3x-q_frame');
          const root = roots.find(element => element.getBoundingClientRect().height > 0);
          const area = (root || shell)?.getBoundingClientRect();
          // The reference includes the window chrome. Use that complete height
          // once, then compensate for DSH's real title bar in the layout.
          const chrome = root ? Math.max(0, area.top)
            : shell ? parseFloat(getComputedStyle(shell).paddingTop) || 0 : 0;
          const height = root ? area.height + chrome : area?.height || window.innerHeight;
          const scale = Math.max(.62, Math.min(1.5, height / 1056)).toFixed(5);
          if (body.style.getPropertyValue(SCALE) !== scale) body.style.setProperty(SCALE, scale);
          const chromeValue = `${chrome.toFixed(3)}px`;
          if (body.style.getPropertyValue('--kitch-top-chrome') !== chromeValue) body.style.setProperty('--kitch-top-chrome', chromeValue);

          const targets = new Set([...roots, ...brands]);
          for (const [element, nodes] of mounted) {
            if (!targets.has(element) || !element.isConnected || nodes.some(node => node.parentNode !== element)) {
              nodes.forEach(node => node.remove());
              mounted.delete(element);
            }
          }
          for (const element of targets) {
            if (mounted.has(element)) continue;
            const names = brands.includes(element)
              ? ['kitch-brand']
              : ['kitch-room'];
            mounted.set(element, names.map(name => make(name, element)));
          }

          const nextObserved = new Set([...roots, ...(shell ? [shell] : [])]);
          for (const element of observed) {
            if (!nextObserved.has(element)) {
              resizeObserver?.unobserve(element);
              observed.delete(element);
            }
          }
          for (const element of nextObserved) {
            if (!observed.has(element)) {
              resizeObserver?.observe(element);
              observed.add(element);
            }
          }
        }

        const observer = new MutationObserver(records => {
          if (records.some(record => record.type === 'childList'
            || record.attributeName === 'data-phase'
            || record.attributeName === 'data-sidebar-collapsed')) schedule();
        });
        observer.observe(document.getElementById('root') || body, {
          childList: true, subtree: true, attributes: true,
          attributeFilter: ['data-phase', 'data-sidebar-collapsed']
        });
        window.addEventListener('resize', schedule);
        update();

        return () => {
          disposed = true;
          observer.disconnect();
          resizeObserver?.disconnect();
          observed.clear();
          window.removeEventListener('resize', schedule);
          if (frame) cancelAnimationFrame(frame);
          for (const nodes of mounted.values()) nodes.forEach(node => node.remove());
          mounted.clear();
          style.remove();
          if (previousScale) body.style.setProperty(SCALE, previousScale, previousScalePriority);
          else body.style.removeProperty(SCALE);
          if (previousChrome) body.style.setProperty('--kitch-top-chrome', previousChrome, previousChromePriority);
          else body.style.removeProperty('--kitch-top-chrome');
          if (body.getAttribute(ATTRIBUTE) === '1') {
            if (previousAttribute === null) body.removeAttribute(ATTRIBUTE);
            else body.setAttribute(ATTRIBUTE, previousAttribute);
          }
        };
      }, 'kitch: scoped layout and artwork');
      ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
        name: 'sidebar.footer.action', id: 'kitch-sidebar-art', order: 15
      }, SidebarArtwork));
    }

    return {inject: ['theme', 'slots'], apply};
  }
});
