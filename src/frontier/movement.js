// VALENCY: The Elemental Frontier — Movement & Kinematics System
// Pure 8-direction + analog movement math with normalized diagonal vectors,
// isotropic acceleration/deceleration, substep anti-tunneling, and world collision integration.
// Strictly decoupled from rendering and DOM input devices.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  const DEFAULT_DEADZONE = 0.08;
  const MAX_FRAME_DT = 0.25;
  const MAX_SUBSTEP_DT = 1 / 60;
  const STOP_SPEED_EPSILON = 1.5;

  /**
   * Normalize a raw 2D input vector (keyboard digital or joystick analog).
   * - Applies radial deadzone and smoothly remaps [deadzone, 1] -> [0, 1].
   * - Clamps length to <= 1.0 so diagonal keyboard vectors (1, 1) normalize to (~0.7071, ~0.7071)
   *   and never exceed cardinal movement speed.
   */
  function normalizeInputVector(rawX, rawY, deadzone) {
    const x = Number(rawX) || 0;
    const y = Number(rawY) || 0;
    const dz = typeof deadzone === 'number' ? Math.max(0, Math.min(0.95, deadzone)) : DEFAULT_DEADZONE;

    const len = Math.hypot(x, y);
    if (!Number.isFinite(len) || len <= dz) {
      return { x: 0, y: 0, magnitude: 0, active: false };
    }

    const ux = x / len;
    const uy = y / len;

    // Preserve analog ramp inside (dz, 1), clamp at 1.0 for diagonals / saturated inputs
    const scaledMag = len >= 1 ? 1 : (len - dz) / (1 - dz);
    const clampedMag = Math.max(0, Math.min(1, scaledMag));

    return {
      x: ux * clampedMag,
      y: uy * clampedMag,
      magnitude: clampedMag,
      active: clampedMag > 0,
    };
  }

  /**
   * Combine multiple independent input providers (e.g., desktop keyboard + mobile virtual joystick)
   * into one normalized movement vector bounded to unit magnitude.
   */
  function combineInputVectors(vectors, deadzone) {
    if (!Array.isArray(vectors) || vectors.length === 0) {
      return { x: 0, y: 0, magnitude: 0, active: false };
    }
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < vectors.length; i++) {
      const vec = vectors[i];
      if (!vec) continue;
      sumX += Number(vec.x) || 0;
      sumY += Number(vec.y) || 0;
    }
    return normalizeInputVector(sumX, sumY, deadzone);
  }

  /**
   * Move velocity smoothly toward target velocity using isotropic rate-limited stepping.
   */
  function approachVelocity(vx, vy, targetVx, targetVy, accelRate, dt) {
    const dvx = targetVx - vx;
    const dvy = targetVy - vy;
    const deltaMag = Math.hypot(dvx, dvy);
    const maxStep = accelRate * dt;

    if (deltaMag <= maxStep || deltaMag < 1e-9) {
      return { vx: targetVx, vy: targetVy };
    }

    const scale = maxStep / deltaMag;
    return {
      vx: vx + dvx * scale,
      vy: vy + dvy * scale,
    };
  }

  /**
   * Advance player world position and kinematics by dtSeconds using normalized input and world collision.
   * Substeps large frame deltas to prevent tunneling through thin walls on frame hitches.
   */
  function stepPlayerMovement(player, rawInput, dtSeconds, world, options) {
    if (!player) return null;
    const opts = options || {};
    const dtTotal = Math.max(0, Math.min(MAX_FRAME_DT, Number(dtSeconds) || 0));
    const norm = normalizeInputVector(
      rawInput ? rawInput.x : 0,
      rawInput ? rawInput.y : 0,
      opts.deadzone
    );

    if (dtTotal === 0) {
      return {
        input: norm,
        moved: false,
        collision: player.lastCollision,
      };
    }

    const substeps = Math.max(1, Math.ceil(dtTotal / MAX_SUBSTEP_DT));
    const subDt = dtTotal / substeps;

    const targetVx = norm.x * player.speed;
    const targetVy = norm.y * player.speed;
    const useInstant = Boolean(opts.instantVelocity);

    let anyCollided = false;
    let anyBoundary = false;
    const hitIdSet = new Set();
    let totalDistMoved = 0;

    for (let step = 0; step < substeps; step++) {
      if (useInstant) {
        player.vx = targetVx;
        player.vy = targetVy;
      } else {
        const rate = norm.active ? player.acceleration : player.deceleration;
        const nextVel = approachVelocity(player.vx, player.vy, targetVx, targetVy, rate, subDt);
        player.vx = nextVel.vx;
        player.vy = nextVel.vy;
      }

      if (!norm.active && Math.hypot(player.vx, player.vy) < STOP_SPEED_EPSILON) {
        player.vx = 0;
        player.vy = 0;
      }

      const prevX = player.x;
      const prevY = player.y;
      const desiredX = prevX + player.vx * subDt;
      const desiredY = prevY + player.vy * subDt;

      if (world && F.World && typeof F.World.resolveCollisions === 'function') {
        const res = F.World.resolveCollisions(desiredX, desiredY, player.radius, world);
        player.x = res.x;
        player.y = res.y;

        if (res.collided) {
          anyCollided = true;
          if (res.hitBoundary) anyBoundary = true;
          for (let i = 0; i < res.hitIds.length; i++) {
            hitIdSet.add(res.hitIds[i]);
          }
          // Damp blocked velocity components so pushing into a wall does not store phantom momentum
          const actualVx = (player.x - prevX) / subDt;
          const actualVy = (player.y - prevY) / subDt;
          if (Math.abs(desiredX - player.x) > 1e-4) player.vx = actualVx;
          if (Math.abs(desiredY - player.y) > 1e-4) player.vy = actualVy;
        }
      } else {
        player.x = desiredX;
        player.y = desiredY;
      }

      totalDistMoved += Math.hypot(player.x - prevX, player.y - prevY);
    }

    const currentSpeed = Math.hypot(player.vx, player.vy);
    const speedRatio = player.speed > 0 ? Math.min(1, currentSpeed / player.speed) : 0;

    // Update facing from active input first (feels responsive even while sliding along a wall),
    // falling back to actual velocity vector when coasting to a stop.
    if (norm.active) {
      const len = Math.hypot(norm.x, norm.y) || 1;
      player.facing = { x: norm.x / len, y: norm.y / len };
      if (F.Player && F.Player.directionFromVector) {
        player.facingDir = F.Player.directionFromVector(player.facing.x, player.facing.y, player.facingDir);
      }
    } else if (currentSpeed > STOP_SPEED_EPSILON) {
      player.facing = { x: player.vx / currentSpeed, y: player.vy / currentSpeed };
      if (F.Player && F.Player.directionFromVector) {
        player.facingDir = F.Player.directionFromVector(player.facing.x, player.facing.y, player.facingDir);
      }
    }

    player.isMoving = totalDistMoved > 0.01 || currentSpeed > STOP_SPEED_EPSILON;
    player.speedRatio = speedRatio;
    if (totalDistMoved > 0.001) {
      player.walkCycle = (player.walkCycle + totalDistMoved * 0.14) % (Math.PI * 2);
    } else if (!player.isMoving) {
      player.walkCycle = 0;
    }

    player.lastCollision = {
      collided: anyCollided,
      hitBoundary: anyBoundary,
      hitIds: Array.from(hitIdSet),
    };

    return {
      input: norm,
      moved: totalDistMoved > 0.001,
      distanceMoved: totalDistMoved,
      collision: player.lastCollision,
    };
  }

  F.Movement = {
    DEFAULT_DEADZONE,
    MAX_FRAME_DT,
    MAX_SUBSTEP_DT,
    normalizeInputVector,
    combineInputVectors,
    stepPlayerMovement,
  };
})(typeof window !== 'undefined' ? window : globalThis);
