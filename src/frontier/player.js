// VALENCY: The Elemental Frontier — Player Entity State Model
// Pure world-space scientist avatar state (zero DOM or rendering logic).

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  const DIRECTIONS_8 = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

  /**
   * Map a 2D world-space direction vector (dx, dy) to one of 8 compass directions.
   * World convention: +X = East, -X = West, +Y = South, -Y = North.
   */
  function directionFromVector(dx, dy, fallback) {
    const magSq = dx * dx + dy * dy;
    if (magSq < 1e-8) return fallback || 'S';
    const angle = Math.atan2(dy, dx); // [-PI, PI], 0 = East, +PI/2 = South
    const octant = Math.round(angle / (Math.PI / 4));
    const idx = ((octant % 8) + 8) % 8;
    return DIRECTIONS_8[idx];
  }

  /**
   * Create the controllable placeholder scientist entity in world coordinates.
   */
  function createPlayer(options) {
    const opts = options || {};
    const startX = typeof opts.x === 'number' ? opts.x : 0;
    const startY = typeof opts.y === 'number' ? opts.y : 0;

    return {
      id: opts.id || 'player_scientist',
      name: opts.name || 'Field Chemist',
      role: opts.role || 'Academy Frontier Researcher',
      // World-space position & kinematics
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      radius: typeof opts.radius === 'number' ? opts.radius : 18,
      speed: typeof opts.speed === 'number' ? opts.speed : 240,
      acceleration: typeof opts.acceleration === 'number' ? opts.acceleration : 2200,
      deceleration: typeof opts.deceleration === 'number' ? opts.deceleration : 2600,
      // Renderer-agnostic orientation & locomotion phase
      facing: { x: 0, y: 1 },
      facingDir: 'S',
      isMoving: false,
      speedRatio: 0,
      walkCycle: 0,
      // Last collision telemetry (useful for future interactions/audio/debug)
      lastCollision: {
        collided: false,
        hitBoundary: false,
        hitIds: [],
      },
    };
  }

  /**
   * Reset player cleanly to a spawn point with zero residual velocity.
   */
  function resetPlayer(player, spawnX, spawnY) {
    if (!player) return player;
    player.x = typeof spawnX === 'number' ? spawnX : 0;
    player.y = typeof spawnY === 'number' ? spawnY : 0;
    player.vx = 0;
    player.vy = 0;
    player.facing = { x: 0, y: 1 };
    player.facingDir = 'S';
    player.isMoving = false;
    player.speedRatio = 0;
    player.walkCycle = 0;
    player.lastCollision = {
      collided: false,
      hitBoundary: false,
      hitIds: [],
    };
    return player;
  }

  F.Player = {
    DIRECTIONS_8,
    directionFromVector,
    createPlayer,
    resetPlayer,
  };
})(typeof window !== 'undefined' ? window : globalThis);
