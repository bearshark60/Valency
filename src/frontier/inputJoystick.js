// VALENCY: The Elemental Frontier — Decoupled Mobile Virtual Joystick Input Module
// Standalone touch/pointer thumbstick emitting a normalized analog vector { x, y, magnitude, active }.
// Works with Pointer Events (desktop mouse/touch/stylus) + Touch Events fallback (older iOS Safari).
// Completely decoupled from player physics, world collision, and rendering.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  /**
   * Pure math helper: convert pointer offset (dx, dy) relative to joystick center
   * into clamped knob offset and normalized analog vector in unit circle.
   */
  function computeJoystickState(dx, dy, maxRadius, deadzone) {
    const r = Math.max(1, Number(maxRadius) || 40);
    const dz = typeof deadzone === 'number' ? Math.max(0, Math.min(0.9, deadzone)) : 0.08;
    const dist = Math.hypot(dx, dy);

    if (!Number.isFinite(dist) || dist < 1e-6) {
      return {
        knobX: 0,
        knobY: 0,
        x: 0,
        y: 0,
        magnitude: 0,
        active: false,
      };
    }

    const clampedDist = Math.min(dist, r);
    const ux = dx / dist;
    const uy = dy / dist;
    const knobX = ux * clampedDist;
    const knobY = uy * clampedDist;

    const rawRatio = clampedDist / r;
    if (rawRatio <= dz) {
      return {
        knobX,
        knobY,
        x: 0,
        y: 0,
        magnitude: 0,
        active: false,
      };
    }

    const scaled = Math.min(1, (rawRatio - dz) / (1 - dz));
    return {
      knobX,
      knobY,
      x: ux * scaled,
      y: uy * scaled,
      magnitude: scaled,
      active: true,
    };
  }

  /**
   * Mount a decoupled virtual joystick into containerEl.
   */
  function createVirtualJoystick(containerEl, options) {
    const opts = options || {};
    const deadzone = typeof opts.deadzone === 'number' ? opts.deadzone : 0.08;
    const onChange = typeof opts.onChange === 'function' ? opts.onChange : null;

    let enabled = false;
    let visible = false;
    let activePointerId = null;
    let activeTouchId = null;
    let centerX = 0;
    let centerY = 0;
    let maxRadius = 40;

    let vector = { x: 0, y: 0, magnitude: 0, active: false };

    let rootEl = null;
    let baseEl = null;
    let knobEl = null;

    function emitChange() {
      if (onChange) onChange({ ...vector });
    }

    function applyKnobTransform(kx, ky, engaged) {
      if (!knobEl || !baseEl) return;
      knobEl.style.transform = `translate3d(${kx.toFixed(1)}px, ${ky.toFixed(1)}px, 0)`;
      baseEl.classList.toggle('is-active', Boolean(engaged));
    }

    function reset() {
      activePointerId = null;
      activeTouchId = null;
      vector = { x: 0, y: 0, magnitude: 0, active: false };
      applyKnobTransform(0, 0, false);
      emitChange();
    }

    function measureCenter() {
      if (!baseEl) return;
      const rect = baseEl.getBoundingClientRect();
      centerX = rect.left + rect.width * 0.5;
      centerY = rect.top + rect.height * 0.5;
      maxRadius = Math.max(20, rect.width * 0.38);
    }

    function updateFromClientPoint(clientX, clientY) {
      const next = computeJoystickState(clientX - centerX, clientY - centerY, maxRadius, deadzone);
      vector = {
        x: next.x,
        y: next.y,
        magnitude: next.magnitude,
        active: next.active,
      };
      applyKnobTransform(next.knobX, next.knobY, true);
      emitChange();
    }

    // ===== Pointer Events (modern mobile Safari/Chrome + desktop mouse drag) =====
    function onPointerDown(e) {
      if (!enabled || !visible) return;
      if (activePointerId !== null) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      e.preventDefault();
      activePointerId = e.pointerId;
      measureCenter();
      if (baseEl && typeof baseEl.setPointerCapture === 'function') {
        try { baseEl.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      }
      updateFromClientPoint(e.clientX, e.clientY);
    }

    function onPointerMove(e) {
      if (!enabled || activePointerId === null || e.pointerId !== activePointerId) return;
      e.preventDefault();
      updateFromClientPoint(e.clientX, e.clientY);
    }

    function onPointerEnd(e) {
      if (activePointerId === null || e.pointerId !== activePointerId) return;
      if (baseEl && typeof baseEl.releasePointerCapture === 'function') {
        try { baseEl.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      }
      reset();
    }

    // ===== Touch Events Fallback (for environments without PointerEvent) =====
    function onTouchStart(e) {
      if (!enabled || !visible || activeTouchId !== null) return;
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      e.preventDefault();
      const t = e.changedTouches[0];
      activeTouchId = t.identifier;
      measureCenter();
      updateFromClientPoint(t.clientX, t.clientY);
    }

    function onTouchMove(e) {
      if (!enabled || activeTouchId === null || !e.changedTouches) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === activeTouchId) {
          e.preventDefault();
          updateFromClientPoint(t.clientX, t.clientY);
          break;
        }
      }
    }

    function onTouchEnd(e) {
      if (activeTouchId === null || !e.changedTouches) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          reset();
          break;
        }
      }
    }

    const usePointerEvents = typeof global.PointerEvent !== 'undefined';

    if (containerEl && typeof document !== 'undefined') {
      rootEl = document.createElement('div');
      rootEl.className = 'frontier-joystick-zone hidden';
      rootEl.setAttribute('role', 'application');
      rootEl.setAttribute('aria-label', 'Virtual movement joystick');

      baseEl = document.createElement('div');
      baseEl.className = 'frontier-joystick-base';
      baseEl.innerHTML = `
        <span class="frontier-joy-dir frontier-joy-n" aria-hidden="true">▲</span>
        <span class="frontier-joy-dir frontier-joy-s" aria-hidden="true">▼</span>
        <span class="frontier-joy-dir frontier-joy-w" aria-hidden="true">◀</span>
        <span class="frontier-joy-dir frontier-joy-e" aria-hidden="true">▶</span>
        <div class="frontier-joystick-knob" aria-hidden="true"></div>
      `;
      knobEl = baseEl.querySelector('.frontier-joystick-knob');

      rootEl.appendChild(baseEl);
      containerEl.appendChild(rootEl);

      if (usePointerEvents) {
        baseEl.addEventListener('pointerdown', onPointerDown, { passive: false });
        baseEl.addEventListener('pointermove', onPointerMove, { passive: false });
        baseEl.addEventListener('pointerup', onPointerEnd);
        baseEl.addEventListener('pointercancel', onPointerEnd);
        baseEl.addEventListener('lostpointercapture', onPointerEnd);
      } else {
        baseEl.addEventListener('touchstart', onTouchStart, { passive: false });
        baseEl.addEventListener('touchmove', onTouchMove, { passive: false });
        baseEl.addEventListener('touchend', onTouchEnd);
        baseEl.addEventListener('touchcancel', onTouchEnd);
      }
    }

    function setVisible(show) {
      visible = Boolean(show);
      if (rootEl) {
        rootEl.classList.toggle('hidden', !visible);
      }
      if (!visible) reset();
    }

    function enable() {
      enabled = true;
    }

    function disable() {
      enabled = false;
      reset();
    }

    function destroy() {
      disable();
      if (baseEl) {
        if (usePointerEvents) {
          baseEl.removeEventListener('pointerdown', onPointerDown);
          baseEl.removeEventListener('pointermove', onPointerMove);
          baseEl.removeEventListener('pointerup', onPointerEnd);
          baseEl.removeEventListener('pointercancel', onPointerEnd);
          baseEl.removeEventListener('lostpointercapture', onPointerEnd);
        } else {
          baseEl.removeEventListener('touchstart', onTouchStart);
          baseEl.removeEventListener('touchmove', onTouchMove);
          baseEl.removeEventListener('touchend', onTouchEnd);
          baseEl.removeEventListener('touchcancel', onTouchEnd);
        }
      }
      if (rootEl && rootEl.parentNode) {
        rootEl.parentNode.removeChild(rootEl);
      }
      rootEl = null;
      baseEl = null;
      knobEl = null;
    }

    return {
      enable,
      disable,
      reset,
      setVisible,
      isVisible: () => visible,
      isEnabled: () => enabled,
      getVector: () => ({ x: vector.x, y: vector.y, magnitude: vector.magnitude, active: vector.active }),
      // Programmatic helper for automated verification tests
      _setVectorForTest(dx, dy, radiusOverride) {
        const res = computeJoystickState(dx, dy, radiusOverride || maxRadius || 40, deadzone);
        vector = { x: res.x, y: res.y, magnitude: res.magnitude, active: res.active };
        applyKnobTransform(res.knobX, res.knobY, res.active);
        emitChange();
        return vector;
      },
      destroy,
    };
  }

  F.VirtualJoystick = {
    computeJoystickState,
    createVirtualJoystick,
  };
})(typeof window !== 'undefined' ? window : globalThis);
