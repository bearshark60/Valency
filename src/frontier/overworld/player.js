// VALENCY: The Elemental Frontier — Overworld Player Entity State Model
// Pure world-space scientist avatar state under window.Valency.Frontier.Overworld.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});
  const O = (F.Overworld = F.Overworld || {});

  const DIRECTIONS_8 = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

  function directionFromVector(dx, dy, fallback) {
    const magSq = dx * dx + dy * dy;
    if (magSq < 1e-8) return fallback || 'S';
    const angle = Math.atan2(dy, dx);
    const octant = Math.round(angle / (Math.PI / 4));
    const idx = ((octant % 8) + 8) % 8;
    return DIRECTIONS_8[idx];
  }

  function createPlayer(options) {
    const opts = options || {};
    const startX = typeof opts.x === 'number' ? opts.x : 0;
    const startY = typeof opts.y === 'number' ? opts.y : 0;

    return {
      id: opts.id || 'player_scientist',
      name: opts.name || 'Field Chemist',
      role: opts.role || 'Academy Frontier Researcher',
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      radius: typeof opts.radius === 'number' ? opts.radius : 18,
      speed: typeof opts.speed === 'number' ? opts.speed : 240,
      acceleration: typeof opts.acceleration === 'number' ? opts.acceleration : 2200,
      deceleration: typeof opts.deceleration === 'number' ? opts.deceleration : 2600,
      facing: { x: 0, y: 1 },
      facingDir: 'S',
      isMoving: false,
      speedRatio: 0,
      walkCycle: 0,
      lastCollision: {
        collided: false,
        hitBoundary: false,
        hitIds: [],
      },
    };
  }

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

  O.Player = {
    DIRECTIONS_8,
    directionFromVector,
    createPlayer,
    resetPlayer,
  };
})(typeof window !== 'undefined' ? window : globalThis);
