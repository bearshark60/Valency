// VALENCY: The Elemental Frontier — World Space & Collision Geometry Module
// Pure world-coordinate data and physics/collision solver.
// Strictly rendering-independent: zero DOM, Canvas, or screen-projection dependencies.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  const DEFAULT_TILE_SIZE = 64;

  /**
   * Create the canonical Frontier Outpost test world in abstract world coordinates.
   * Coordinates use 2D world units (1 tile = 64 world units; 30 x 20 tiles = 1920 x 1280).
   * Renderers (top-down 2D today, isometric 2D later) project these coordinates via Camera.
   */
  function createTestWorld() {
    const tileSize = DEFAULT_TILE_SIZE;
    const cols = 30;
    const rows = 20;
    const width = cols * tileSize;   // 1920
    const height = rows * tileSize;  // 1280

    return {
      id: 'frontier_outpost_01',
      name: 'Outpost Alpha — Elemental Field Lab',
      tileSize,
      cols,
      rows,
      width,
      height,
      bounds: {
        minX: 0,
        minY: 0,
        maxX: width,
        maxY: height,
      },
      spawn: {
        x: 960,
        y: 640,
      },
      // Semantic ground zones (pure world-space regions; styling decided by active renderer)
      zones: [
        { id: 'outpost_plaza', kind: 'plaza', x: 704, y: 448, width: 512, height: 384, label: 'Central Courtyard' },
        { id: 'path_ew', kind: 'path', x: 192, y: 608, width: 1536, height: 64, label: 'East-West Survey Path' },
        { id: 'path_ns', kind: 'path', x: 928, y: 128, width: 64, height: 1024, label: 'North-South Lab Axis' },
        { id: 'north_pad', kind: 'pad', x: 800, y: 128, width: 320, height: 192, label: 'Expedition Pad' },
        { id: 'mineral_basin', kind: 'basin', x: 1344, y: 768, width: 416, height: 320, label: 'Alkali Mineral Basin' },
        { id: 'specimen_flats', kind: 'flats', x: 192, y: 768, width: 384, height: 288, label: 'Crystalline Flats' },
      ],
      // Solid static collision geometry (pure world-space AABBs and circles)
      colliders: [
        // North-West Field Laboratory HQ
        {
          id: 'field_lab_hq',
          kind: 'rect',
          x: 256,
          y: 192,
          width: 320,
          height: 224,
          tag: 'building',
          label: 'Field Lab HQ',
        },
        // North-East Synthesis Containment Bay
        {
          id: 'containment_bay',
          kind: 'rect',
          x: 1344,
          y: 192,
          width: 320,
          height: 192,
          tag: 'building',
          label: 'Containment Bay',
        },
        // West Outdoor Analysis Bench
        {
          id: 'analysis_bench',
          kind: 'rect',
          x: 416,
          y: 512,
          width: 144,
          height: 64,
          tag: 'prop',
          label: 'Analysis Bench',
        },
        // South-West Supply Crates
        {
          id: 'supply_crates_sw',
          kind: 'rect',
          x: 256,
          y: 832,
          width: 128,
          height: 128,
          tag: 'crate',
          label: 'Reagent Crates',
        },
        // Southern Perimeter Checkpoints (with a central 256-unit walkable gate)
        {
          id: 'south_wall_west',
          kind: 'rect',
          x: 448,
          y: 1088,
          width: 384,
          height: 48,
          tag: 'wall',
          label: 'Perimeter Barrier',
        },
        {
          id: 'south_wall_east',
          kind: 'rect',
          x: 1088,
          y: 1088,
          width: 384,
          height: 48,
          tag: 'wall',
          label: 'Perimeter Barrier',
        },
        // Circular natural/tech obstacles (for smooth curved deflection testing)
        {
          id: 'beacon_nw',
          kind: 'circle',
          x: 688,
          y: 352,
          radius: 34,
          tag: 'beacon',
          label: 'Survey Beacon',
        },
        {
          id: 'relay_dish_ne',
          kind: 'circle',
          x: 1232,
          y: 352,
          radius: 36,
          tag: 'beacon',
          label: 'Telemetry Relay',
        },
        {
          id: 'crystal_cluster_e',
          kind: 'circle',
          x: 1488,
          y: 896,
          radius: 52,
          tag: 'crystal',
          label: 'Halite Outcrop',
        },
        {
          id: 'crystal_cluster_se',
          kind: 'circle',
          x: 1648,
          y: 976,
          radius: 40,
          tag: 'crystal',
          label: 'Quartz Spire',
        },
        {
          id: 'vent_sw',
          kind: 'circle',
          x: 512,
          y: 944,
          radius: 38,
          tag: 'vent',
          label: 'Thermal Vent',
        },
      ],
    };
  }

  /**
   * Clamp a circular entity inside the world boundary.
   */
  function clampToWorldBounds(x, y, radius, world) {
    const r = Math.max(0, Number(radius) || 0);
    const bounds = (world && world.bounds) || {
      minX: 0,
      minY: 0,
      maxX: (world && world.width) || 0,
      maxY: (world && world.height) || 0,
    };

    const minX = bounds.minX + r;
    const maxX = Math.max(minX, bounds.maxX - r);
    const minY = bounds.minY + r;
    const maxY = Math.max(minY, bounds.maxY - r);

    const clampedX = Math.max(minX, Math.min(maxX, x));
    const clampedY = Math.max(minY, Math.min(maxY, y));

    return {
      x: clampedX,
      y: clampedY,
      hitX: clampedX !== x,
      hitY: clampedY !== y,
      hitBoundary: clampedX !== x || clampedY !== y,
    };
  }

  /**
   * Resolve circle-vs-AABB collision in world space.
   * Returns adjusted { x, y, collided } with exact shortest push-out vector.
   */
  function resolveCircleRect(x, y, radius, rect) {
    const r = Math.max(0, Number(radius) || 0);
    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;

    const closestX = Math.max(left, Math.min(x, right));
    const closestY = Math.max(top, Math.min(y, bottom));

    const dx = x - closestX;
    const dy = y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq >= r * r) {
      return { x, y, collided: false };
    }

    // Center is strictly outside the rectangle
    if (distSq > 1e-12) {
      const dist = Math.sqrt(distSq);
      const overlap = r - dist;
      return {
        x: x + (dx / dist) * overlap,
        y: y + (dy / dist) * overlap,
        collided: true,
      };
    }

    // Center is inside or exactly on an edge of the rectangle: push along shallowest axis
    const penLeft = Math.abs(x - left);
    const penRight = Math.abs(right - x);
    const penTop = Math.abs(y - top);
    const penBottom = Math.abs(bottom - y);
    const minPen = Math.min(penLeft, penRight, penTop, penBottom);

    if (minPen === penLeft) return { x: left - r, y, collided: true };
    if (minPen === penRight) return { x: right + r, y, collided: true };
    if (minPen === penTop) return { x, y: top - r, collided: true };
    return { x, y: bottom + r, collided: true };
  }

  /**
   * Resolve circle-vs-circle collision in world space.
   */
  function resolveCircleCircle(x, y, radius, circle) {
    const r = Math.max(0, Number(radius) || 0);
    const minDist = r + Math.max(0, Number(circle.radius) || 0);
    const dx = x - circle.x;
    const dy = y - circle.y;
    const distSq = dx * dx + dy * dy;

    if (distSq >= minDist * minDist) {
      return { x, y, collided: false };
    }

    if (distSq > 1e-12) {
      const dist = Math.sqrt(distSq);
      const overlap = minDist - dist;
      return {
        x: x + (dx / dist) * overlap,
        y: y + (dy / dist) * overlap,
        collided: true,
      };
    }

    // Exact center coincidence: push deterministically along +X
    return {
      x: circle.x + minDist,
      y,
      collided: true,
    };
  }

  /**
   * Iteratively resolve all world colliders and outer world boundaries for a circular entity.
   * Multiple passes ensure clean corner sliding without penetration or jitter.
   */
  function resolveCollisions(x, y, radius, world, maxIterations) {
    const passes = Math.max(1, maxIterations || 4);
    let curX = x;
    let curY = y;
    let hitBoundary = false;
    let hitBoundaryX = false;
    let hitBoundaryY = false;
    const hitIdSet = new Set();
    const colliders = (world && Array.isArray(world.colliders)) ? world.colliders : [];

    for (let iter = 0; iter < passes; iter++) {
      let movedThisPass = false;

      for (let i = 0; i < colliders.length; i++) {
        const col = colliders[i];
        let res = null;
        if (col.kind === 'rect') {
          res = resolveCircleRect(curX, curY, radius, col);
        } else if (col.kind === 'circle') {
          res = resolveCircleCircle(curX, curY, radius, col);
        }
        if (res && res.collided) {
          if (res.x !== curX || res.y !== curY) {
            curX = res.x;
            curY = res.y;
            movedThisPass = true;
          }
          if (col.id) hitIdSet.add(col.id);
        }
      }

      const clamped = clampToWorldBounds(curX, curY, radius, world);
      if (clamped.hitBoundary) {
        curX = clamped.x;
        curY = clamped.y;
        hitBoundary = true;
        if (clamped.hitX) hitBoundaryX = true;
        if (clamped.hitY) hitBoundaryY = true;
        movedThisPass = true;
      }

      if (!movedThisPass) break;
    }

    return {
      x: curX,
      y: curY,
      collided: hitBoundary || hitIdSet.size > 0,
      hitBoundary,
      hitBoundaryX,
      hitBoundaryY,
      hitIds: Array.from(hitIdSet),
    };
  }

  /**
   * Pure query: returns true if a circle at (x, y) is inside world bounds and clears all colliders.
   */
  function isPositionClear(x, y, radius, world) {
    const res = resolveCollisions(x, y, radius, world, 1);
    return !res.collided;
  }

  F.World = {
    DEFAULT_TILE_SIZE,
    createTestWorld,
    clampToWorldBounds,
    resolveCircleRect,
    resolveCircleCircle,
    resolveCollisions,
    isPositionClear,
  };
})(typeof window !== 'undefined' ? window : globalThis);
