// VALENCY: The Elemental Frontier — Overworld World-Space Camera & Projection Adapter
// Tracks targets strictly in world coordinates under window.Valency.Frontier.Overworld
// and exposes a pluggable Projection Adapter seam for Top-Down 2D and future Isometric 2D.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});
  const O = (F.Overworld = F.Overworld || {});

  const PROJECTIONS = Object.create(null);

  function registerProjection(id, adapter) {
    if (!id || !adapter) return;
    PROJECTIONS[id] = adapter;
  }

  function getProjection(id) {
    return PROJECTIONS[id] || PROJECTIONS.topdown;
  }

  function listProjections() {
    return Object.keys(PROJECTIONS);
  }

  const TopDownProjection = {
    id: 'topdown',
    label: 'Top-Down 2D',
    worldToScreen(wx, wy, cam) {
      const zoom = cam.zoom || 1;
      return {
        x: (wx - cam.x) * zoom + cam.viewportWidth * 0.5,
        y: (wy - cam.y) * zoom + cam.viewportHeight * 0.5,
      };
    },
    screenToWorld(sx, sy, cam) {
      const zoom = cam.zoom || 1;
      return {
        x: (sx - cam.viewportWidth * 0.5) / zoom + cam.x,
        y: (sy - cam.viewportHeight * 0.5) / zoom + cam.y,
      };
    },
    getVisibleWorldBounds(cam) {
      const zoom = cam.zoom || 1;
      const halfW = cam.viewportWidth / (2 * zoom);
      const halfH = cam.viewportHeight / (2 * zoom);
      return {
        minX: cam.x - halfW,
        maxX: cam.x + halfW,
        minY: cam.y - halfH,
        maxY: cam.y + halfH,
      };
    },
    clampCameraPosition(cx, cy, cam, world) {
      if (!world || !cam.clampToWorld) return { x: cx, y: cy };
      const zoom = cam.zoom || 1;
      const halfW = cam.viewportWidth / (2 * zoom);
      const halfH = cam.viewportHeight / (2 * zoom);
      const bounds = world.bounds || { minX: 0, minY: 0, maxX: world.width, maxY: world.height };
      const worldW = bounds.maxX - bounds.minX;
      const worldH = bounds.maxY - bounds.minY;

      let x = cx;
      let y = cy;

      if (worldW <= halfW * 2) {
        x = bounds.minX + worldW * 0.5;
      } else {
        x = Math.max(bounds.minX + halfW, Math.min(bounds.maxX - halfW, cx));
      }

      if (worldH <= halfH * 2) {
        y = bounds.minY + worldH * 0.5;
      } else {
        y = Math.max(bounds.minY + halfH, Math.min(bounds.maxY - halfH, cy));
      }

      return { x, y };
    },
  };

  const IsometricProjection = {
    id: 'isometric',
    label: 'Isometric 2D (2:1)',
    worldToScreen(wx, wy, cam) {
      const zoom = cam.zoom || 1;
      const dx = wx - cam.x;
      const dy = wy - cam.y;
      return {
        x: (dx - dy) * zoom + cam.viewportWidth * 0.5,
        y: (dx + dy) * 0.5 * zoom + cam.viewportHeight * 0.5,
      };
    },
    screenToWorld(sx, sy, cam) {
      const zoom = cam.zoom || 1;
      const rx = (sx - cam.viewportWidth * 0.5) / zoom;
      const ry = (sy - cam.viewportHeight * 0.5) / (0.5 * zoom);
      return {
        x: cam.x + (rx + ry) * 0.5,
        y: cam.y + (ry - rx) * 0.5,
      };
    },
    getVisibleWorldBounds(cam) {
      const corners = [
        this.screenToWorld(0, 0, cam),
        this.screenToWorld(cam.viewportWidth, 0, cam),
        this.screenToWorld(0, cam.viewportHeight, cam),
        this.screenToWorld(cam.viewportWidth, cam.viewportHeight, cam),
      ];
      return {
        minX: Math.min(corners[0].x, corners[1].x, corners[2].x, corners[3].x),
        maxX: Math.max(corners[0].x, corners[1].x, corners[2].x, corners[3].x),
        minY: Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y),
        maxY: Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y),
      };
    },
    clampCameraPosition(cx, cy, cam, world) {
      if (!world || !cam.clampToWorld) return { x: cx, y: cy };
      const bounds = world.bounds || { minX: 0, minY: 0, maxX: world.width, maxY: world.height };
      return {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, cx)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, cy)),
      };
    },
  };

  registerProjection('topdown', TopDownProjection);
  registerProjection('isometric', IsometricProjection);

  function createCamera(options) {
    const opts = options || {};
    const projectionId = opts.projectionId || 'topdown';
    return {
      x: typeof opts.x === 'number' ? opts.x : 0,
      y: typeof opts.y === 'number' ? opts.y : 0,
      viewportWidth: Math.max(1, Number(opts.viewportWidth) || 800),
      viewportHeight: Math.max(1, Number(opts.viewportHeight) || 600),
      zoom: typeof opts.zoom === 'number' && opts.zoom > 0 ? opts.zoom : 1,
      followSmoothing: typeof opts.followSmoothing === 'number' ? opts.followSmoothing : 10,
      clampToWorld: opts.clampToWorld !== false,
      projectionId,
      projection: getProjection(projectionId),
    };
  }

  function setProjection(camera, projectionId) {
    if (!camera) return camera;
    const adapter = getProjection(projectionId);
    camera.projectionId = adapter.id;
    camera.projection = adapter;
    return camera;
  }

  function setViewport(camera, width, height, world) {
    if (!camera) return camera;
    camera.viewportWidth = Math.max(1, Number(width) || camera.viewportWidth);
    camera.viewportHeight = Math.max(1, Number(height) || camera.viewportHeight);
    if (world) {
      const clamped = camera.projection.clampCameraPosition(camera.x, camera.y, camera, world);
      camera.x = clamped.x;
      camera.y = clamped.y;
    }
    return camera;
  }

  function snapTo(camera, targetX, targetY, world) {
    if (!camera) return camera;
    const clamped = camera.projection.clampCameraPosition(targetX, targetY, camera, world);
    camera.x = clamped.x;
    camera.y = clamped.y;
    return camera;
  }

  function updateCamera(camera, targetX, targetY, dtSeconds, world) {
    if (!camera) return camera;
    const dt = Math.max(0, Number(dtSeconds) || 0);
    const desired = camera.projection.clampCameraPosition(targetX, targetY, camera, world);

    if (camera.followSmoothing <= 0 || !Number.isFinite(camera.followSmoothing) || dt <= 0) {
      camera.x = desired.x;
      camera.y = desired.y;
      return camera;
    }

    const alpha = 1 - Math.exp(-camera.followSmoothing * dt);
    const nextX = camera.x + (desired.x - camera.x) * alpha;
    const nextY = camera.y + (desired.y - camera.y) * alpha;
    const clamped = camera.projection.clampCameraPosition(nextX, nextY, camera, world);

    camera.x = Math.abs(clamped.x - desired.x) < 0.05 ? desired.x : clamped.x;
    camera.y = Math.abs(clamped.y - desired.y) < 0.05 ? desired.y : clamped.y;
    return camera;
  }

  function worldToScreen(camera, wx, wy) {
    return camera.projection.worldToScreen(wx, wy, camera);
  }

  function screenToWorld(camera, sx, sy) {
    return camera.projection.screenToWorld(sx, sy, camera);
  }

  function getVisibleWorldBounds(camera) {
    return camera.projection.getVisibleWorldBounds(camera);
  }

  O.Camera = {
    TopDownProjection,
    IsometricProjection,
    registerProjection,
    getProjection,
    listProjections,
    createCamera,
    setProjection,
    setViewport,
    snapTo,
    updateCamera,
    worldToScreen,
    screenToWorld,
    getVisibleWorldBounds,
  };
})(typeof window !== 'undefined' ? window : globalThis);
