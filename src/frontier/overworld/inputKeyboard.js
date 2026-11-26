// VALENCY: The Elemental Frontier — Overworld Desktop Keyboard Input Provider
// Translates WASD & Arrow keys into a 2D digital intent vector under window.Valency.Frontier.Overworld.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});
  const O = (F.Overworld = F.Overworld || {});

  const KEY_BINDINGS = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
  };

  function isEditableTarget(target) {
    if (!target || !target.tagName) return false;
    const tag = target.tagName.toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(target.isContentEditable);
  }

  function createKeyboardInput(options) {
    const opts = options || {};
    const eventTarget = opts.target || (typeof window !== 'undefined' ? window : null);
    const docTarget = opts.document || (typeof document !== 'undefined' ? document : null);
    const onEscape = typeof opts.onEscape === 'function' ? opts.onEscape : null;

    const heldCodes = new Set();
    let enabled = false;
    let attached = false;

    function clearHeld() {
      heldCodes.clear();
    }

    function handleKeyDown(e) {
      if (!enabled || !e) return;
      if (isEditableTarget(e.target)) return;

      const code = e.code || e.key;
      if (code === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (KEY_BINDINGS[code]) {
        heldCodes.add(code);
        if (code.startsWith('Arrow') && typeof e.preventDefault === 'function') {
          e.preventDefault();
        }
      }
    }

    function handleKeyUp(e) {
      if (!e) return;
      const code = e.code || e.key;
      if (KEY_BINDINGS[code]) {
        heldCodes.delete(code);
      }
    }

    function handleVisibilityChange() {
      if (docTarget && docTarget.hidden) {
        clearHeld();
      }
    }

    function attach() {
      if (attached || !eventTarget || typeof eventTarget.addEventListener !== 'function') return;
      eventTarget.addEventListener('keydown', handleKeyDown);
      eventTarget.addEventListener('keyup', handleKeyUp);
      eventTarget.addEventListener('blur', clearHeld);
      if (docTarget && typeof docTarget.addEventListener === 'function') {
        docTarget.addEventListener('visibilitychange', handleVisibilityChange);
      }
      attached = true;
    }

    function detach() {
      if (!attached || !eventTarget || typeof eventTarget.removeEventListener !== 'function') return;
      eventTarget.removeEventListener('keydown', handleKeyDown);
      eventTarget.removeEventListener('keyup', handleKeyUp);
      eventTarget.removeEventListener('blur', clearHeld);
      if (docTarget && typeof docTarget.removeEventListener === 'function') {
        docTarget.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      attached = false;
    }

    function getVector() {
      if (!enabled) return { x: 0, y: 0, active: false };
      let up = false;
      let down = false;
      let left = false;
      let right = false;

      heldCodes.forEach((code) => {
        const dir = KEY_BINDINGS[code];
        if (dir === 'up') up = true;
        else if (dir === 'down') down = true;
        else if (dir === 'left') left = true;
        else if (dir === 'right') right = true;
      });

      const x = (right ? 1 : 0) - (left ? 1 : 0);
      const y = (down ? 1 : 0) - (up ? 1 : 0);
      return { x, y, active: x !== 0 || y !== 0 };
    }

    function enable() {
      attach();
      enabled = true;
    }

    function disable() {
      enabled = false;
      clearHeld();
    }

    function destroy() {
      disable();
      detach();
    }

    return {
      enable,
      disable,
      reset: clearHeld,
      getVector,
      isEnabled: () => enabled,
      _setKeyForTest(code, pressed) {
        if (!KEY_BINDINGS[code]) return;
        if (pressed) heldCodes.add(code);
        else heldCodes.delete(code);
      },
      destroy,
    };
  }

  O.KeyboardInput = {
    KEY_BINDINGS,
    createKeyboardInput,
  };
})(typeof window !== 'undefined' ? window : globalThis);
