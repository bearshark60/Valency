// VALENCY: The Elemental Frontier — Swappable Top-Down 2D Canvas Renderer
// Strictly presentation-only: consumes read-only (world, player, camera) state and projects all
// world coordinates through F.Camera.worldToScreen(). Replacing this with an isometric 2D renderer
// requires zero changes to world.js, player.js, movement.js, or camera.js tracking logic.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  function createTopDownRenderer(canvas) {
    if (!canvas) {
      throw new Error('TopDownRenderer requires a valid <canvas> element.');
    }
    const ctx = canvas.getContext('2d');
    let cssWidth = 800;
    let cssHeight = 600;
    let dpr = 1;

    function resize(width, height) {
      cssWidth = Math.max(1, Math.floor(width || canvas.clientWidth || 800));
      cssHeight = Math.max(1, Math.floor(height || canvas.clientHeight || 600));
      dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);

      const targetW = Math.floor(cssWidth * dpr);
      const targetH = Math.floor(cssHeight * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      return { width: cssWidth, height: cssHeight, dpr };
    }

    function roundedRectPath(x, y, w, h, radius) {
      const r = Math.min(radius, Math.abs(w) * 0.5, Math.abs(h) * 0.5);
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, r);
        return;
      }
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function projectRect(camera, x, y, w, h) {
      const tl = F.Camera.worldToScreen(camera, x, y);
      const br = F.Camera.worldToScreen(camera, x + w, y + h);
      return {
        x: tl.x,
        y: tl.y,
        w: br.x - tl.x,
        h: br.y - tl.y,
      };
    }

    function drawBackgroundAndGrid(world, camera) {
      // Deep slate out-of-bounds backdrop
      ctx.fillStyle = '#070d18';
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      // Playable world ground plane
      const wr = projectRect(camera, 0, 0, world.width, world.height);
      const groundGrad = ctx.createLinearGradient(wr.x, wr.y, wr.x, wr.y + wr.h);
      groundGrad.addColorStop(0, '#102033');
      groundGrad.addColorStop(0.5, '#12263a');
      groundGrad.addColorStop(1, '#0e1d2e');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(wr.x, wr.y, wr.w, wr.h);

      // Semantic terrain zones
      const zones = world.zones || [];
      for (let i = 0; i < zones.length; i++) {
        const z = zones[i];
        const zr = projectRect(camera, z.x, z.y, z.width, z.height);
        if (z.kind === 'plaza') {
          ctx.fillStyle = 'rgba(30, 58, 95, 0.55)';
          ctx.fillRect(zr.x, zr.y, zr.w, zr.h);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.lineWidth = 2;
          ctx.strokeRect(zr.x + 1, zr.y + 1, zr.w - 2, zr.h - 2);
        } else if (z.kind === 'path') {
          ctx.fillStyle = 'rgba(51, 78, 108, 0.42)';
          ctx.fillRect(zr.x, zr.y, zr.w, zr.h);
        } else if (z.kind === 'pad') {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.78)';
          ctx.fillRect(zr.x, zr.y, zr.w, zr.h);
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
          ctx.strokeRect(zr.x + 6, zr.y + 6, zr.w - 12, zr.h - 12);
          ctx.setLineDash([]);
        } else if (z.kind === 'basin') {
          ctx.fillStyle = 'rgba(13, 148, 136, 0.22)';
          ctx.fillRect(zr.x, zr.y, zr.w, zr.h);
          ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(zr.x, zr.y, zr.w, zr.h);
        } else if (z.kind === 'flats') {
          ctx.fillStyle = 'rgba(99, 102, 241, 0.14)';
          ctx.fillRect(zr.x, zr.y, zr.w, zr.h);
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.28)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(zr.x, zr.y, zr.w, zr.h);
        }
      }

      // Subtle tile grid (culled strictly to visible world bounds)
      const visible = F.Camera.getVisibleWorldBounds(camera);
      const tile = world.tileSize || 64;
      const startX = Math.max(0, Math.floor(visible.minX / tile) * tile);
      const endX = Math.min(world.width, Math.ceil(visible.maxX / tile) * tile);
      const startY = Math.max(0, Math.floor(visible.minY / tile) * tile);
      const endY = Math.min(world.height, Math.ceil(visible.maxY / tile) * tile);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let wx = startX; wx <= endX; wx += tile) {
        const p1 = F.Camera.worldToScreen(camera, wx, Math.max(0, visible.minY));
        const p2 = F.Camera.worldToScreen(camera, wx, Math.min(world.height, visible.maxY));
        ctx.moveTo(Math.round(p1.x) + 0.5, p1.y);
        ctx.lineTo(Math.round(p2.x) + 0.5, p2.y);
      }
      for (let wy = startY; wy <= endY; wy += tile) {
        const p1 = F.Camera.worldToScreen(camera, Math.max(0, visible.minX), wy);
        const p2 = F.Camera.worldToScreen(camera, Math.min(world.width, visible.maxX), wy);
        ctx.moveTo(p1.x, Math.round(p1.y) + 0.5);
        ctx.lineTo(p2.x, Math.round(p2.y) + 0.5);
      }
      ctx.stroke();

      // Spawn marker ring in Central Courtyard
      if (world.spawn) {
        const sp = F.Camera.worldToScreen(camera, world.spawn.x, world.spawn.y);
        const r = 28 * camera.zoom;
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.fill();
        ctx.restore();
      }

      // World boundary perimeter frame
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(wr.x + 1.5, wr.y + 1.5, wr.w - 3, wr.h - 3);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 10;
      ctx.strokeRect(wr.x + 5, wr.y + 5, wr.w - 10, wr.h - 10);
      ctx.restore();
    }

    function drawColliders(world, camera, player) {
      const colliders = world.colliders || [];
      const hitIds = (player && player.lastCollision && player.lastCollision.hitIds) || [];

      for (let i = 0; i < colliders.length; i++) {
        const col = colliders[i];
        const isHit = hitIds.indexOf(col.id) !== -1;

        if (col.kind === 'rect') {
          const r = projectRect(camera, col.x, col.y, col.width, col.height);
          // Skip off-screen colliders
          if (r.x + r.w < -20 || r.y + r.h < -20 || r.x > cssWidth + 20 || r.y > cssHeight + 20) {
            continue;
          }

          // Drop shadow
          ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
          ctx.fillRect(r.x + 5, r.y + 6, r.w, r.h);

          // Fill by semantic tag
          if (col.tag === 'building') {
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = isHit ? '#38bdf8' : '#64748b';
          } else if (col.tag === 'wall') {
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = isHit ? '#38bdf8' : '#94a3b8';
          } else if (col.tag === 'crate') {
            ctx.fillStyle = '#3f2e21';
            ctx.strokeStyle = isHit ? '#fbbf24' : '#d97706';
          } else {
            ctx.fillStyle = '#1e3a5f';
            ctx.strokeStyle = isHit ? '#38bdf8' : '#38bdf8';
          }

          ctx.lineWidth = isHit ? 2.5 : 1.75;
          ctx.fillRect(r.x, r.y, r.w, r.h);
          ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

          // Architectural roof accent on buildings
          if (col.tag === 'building') {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
            ctx.fillRect(r.x + 10, r.y + 10, Math.max(0, r.w - 20), Math.max(0, r.h - 20));
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.lineWidth = 1;
            ctx.strokeRect(r.x + 10, r.y + 10, Math.max(0, r.w - 20), Math.max(0, r.h - 20));
          }

          // Clean label centered on obstacle
          if (col.label && r.w >= 72 && r.h >= 30) {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '700 11px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(col.label, r.x + r.w * 0.5, r.y + r.h * 0.5);
          }
        } else if (col.kind === 'circle') {
          const p = F.Camera.worldToScreen(camera, col.x, col.y);
          const rad = col.radius * camera.zoom;
          if (p.x + rad < -20 || p.y + rad < -20 || p.x - rad > cssWidth + 20 || p.y - rad > cssHeight + 20) {
            continue;
          }

          // Shadow
          ctx.fillStyle = 'rgba(2, 6, 23, 0.42)';
          ctx.beginPath();
          ctx.arc(p.x + 4, p.y + 5, rad, 0, Math.PI * 2);
          ctx.fill();

          // Body fill by tag
          if (col.tag === 'crystal') {
            ctx.fillStyle = '#0f766e';
            ctx.strokeStyle = isHit ? '#99f6e4' : '#2dd4bf';
          } else if (col.tag === 'vent') {
            ctx.fillStyle = '#7c2d12';
            ctx.strokeStyle = isHit ? '#fde68a' : '#f97316';
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = isHit ? '#7dd3fc' : '#38bdf8';
          }

          ctx.lineWidth = isHit ? 2.8 : 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Inner core detail
          ctx.fillStyle = col.tag === 'crystal'
            ? 'rgba(94, 234, 212, 0.35)'
            : col.tag === 'vent'
              ? 'rgba(251, 146, 60, 0.38)'
              : 'rgba(56, 189, 248, 0.28)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad * 0.45, 0, Math.PI * 2);
          ctx.fill();

          if (col.label && rad >= 26) {
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '700 10px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(col.label, p.x, p.y + rad + 5);
          }
        }
      }
    }

    function drawScientist(player, camera) {
      const p = F.Camera.worldToScreen(camera, player.x, player.y);
      const zoom = camera.zoom || 1;
      const r = player.radius * zoom;
      const angle = Math.atan2(player.facing.y, player.facing.x);
      const stride = player.isMoving ? Math.sin(player.walkCycle) * 4.5 * zoom * player.speedRatio : 0;
      const bob = player.isMoving ? Math.abs(Math.cos(player.walkCycle)) * 2.0 * zoom * player.speedRatio : 0;

      ctx.save();
      ctx.translate(p.x, p.y);

      // Soft ground shadow
      ctx.fillStyle = 'rgba(2, 6, 23, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.45, r * 0.95, r * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle directional ground ring
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
      ctx.stroke();

      // Rotate character silhouette cleanly toward 8-way / analog facing vector
      ctx.rotate(angle);
      ctx.translate(0, -bob * 0.35);

      // Animated boots/feet underneath coat
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(stride, -r * 0.42, r * 0.34, r * 0.22, 0, 0, Math.PI * 2);
      ctx.ellipse(-stride, r * 0.42, r * 0.34, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Field satchel / reagent pack on back (-X side)
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      roundedRectPath(-r * 0.96, -r * 0.52, r * 0.46, r * 1.04, 4 * zoom);
      ctx.fill();
      ctx.stroke();

      // White laboratory coat torso/shoulders
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(-r * 0.08, 0, r * 0.68, r * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Coat teal lapel stripe
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.ellipse(r * 0.16, 0, r * 0.26, r * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#f1c29b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(r * 0.06, 0, r * 0.48, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Lab safety goggles / visor facing forward (+X)
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      roundedRectPath(r * 0.28, -r * 0.34, r * 0.26, r * 0.68, 3 * zoom);
      ctx.fill();
      ctx.stroke();

      // Forward facing indicator chevron
      ctx.fillStyle = '#5eead4';
      ctx.beginPath();
      ctx.moveTo(r * 1.48, 0);
      ctx.lineTo(r * 1.12, -r * 0.24);
      ctx.lineTo(r * 1.12, r * 0.24);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Nameplate above scientist
      ctx.save();
      ctx.font = '700 11px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
      const tagText = player.name || 'Field Chemist';
      const tw = ctx.measureText(tagText).width + 12;
      ctx.beginPath();
      roundedRectPath(p.x - tw * 0.5, p.y - r - 24, tw, 17, 6);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.fillText(tagText, p.x, p.y - r - 10);
      ctx.restore();
    }

    function render(world, player, camera) {
      if (!ctx || !world || !player || !camera) return;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      drawBackgroundAndGrid(world, camera);
      drawColliders(world, camera, player);
      drawScientist(player, camera);

      ctx.restore();
    }

    function destroy() {
      // No retained DOM listeners; canvas lifecycle owned by frontier.js
    }

    return {
      id: 'topdown_canvas_2d',
      projectionId: 'topdown',
      resize,
      render,
      destroy,
    };
  }

  F.TopDownRenderer = {
    createTopDownRenderer,
  };
})(typeof window !== 'undefined' ? window : globalThis);
