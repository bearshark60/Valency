// VALENCY — Layer 3: Battle Presentation Integration Bridge
// Connects battle card deployment events (via animations.js / app.js) to Layer 1 (ChemicalIdentity)
// and Layer 2 (FormationChoreography) without modifying combat math, SP scoring, or card resolution.
//
// STRICT LAYER BOUNDARY:
//   - Reads event metadata emitted by gameEngine (SYNTHESIZE, STABILIZE_COMPOUND, EN_TAKEOVER).
//   - Resolves Layer 1 ChemicalIdentity and drives Layer 2 FormationChoreography.
//   - Never mutates game state, deck, hands, SP, or status effects.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const FORMATION_EVENT_TYPES = new Set(['SYNTHESIZE', 'STABILIZE_COMPOUND', 'EN_TAKEOVER']);

  let overlayRoot = null;
  let activeHandle = null;
  let activeKeyHandler = null;
  let exitTimer = null;
  const formationQueue = [];
  let isPresenting = false;

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureOverlayRoot() {
    if (typeof document === 'undefined' || !document.body) return null;
    if (overlayRoot && overlayRoot.parentNode) return overlayRoot;
    let existing = document.getElementById('molecular-formation-root');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'molecular-formation-root';
      existing.className = 'mol-formation-root hidden';
      existing.setAttribute('aria-live', 'polite');
      document.body.appendChild(existing);
    }
    overlayRoot = existing;
    return overlayRoot;
  }

  function clearKeyHandler() {
    if (activeKeyHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', activeKeyHandler);
      activeKeyHandler = null;
    }
  }

  function cleanupActivePresentation() {
    clearKeyHandler();
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }
    if (activeHandle) {
      try {
        activeHandle.destroy();
      } catch (_) {}
      activeHandle = null;
    }
  }

  function cancelActive() {
    formationQueue.length = 0;
    isPresenting = false;
    cleanupActivePresentation();
    if (overlayRoot) {
      overlayRoot.classList.add('hidden');
      overlayRoot.classList.remove('mol-formation-exit');
      overlayRoot.innerHTML = '';
    }
  }

  function getEventTag(meta) {
    if (!meta) return { badge: 'FORMATION', tone: 'synth', spText: '' };
    const spText = typeof meta.sp === 'number' && meta.sp > 0 ? `+${meta.sp} SP` : '';
    if (meta.type === 'EN_TAKEOVER') {
      return { badge: '⚡ EN TAKEOVER FORMATION', tone: 'takeover', spText };
    }
    if (meta.type === 'STABILIZE_COMPOUND') {
      return { badge: '⚛ STABILIZED FORMATION', tone: 'synth', spText };
    }
    return { badge: '⚛ MOLECULAR FORMATION', tone: 'synth', spText };
  }

  function getBondBadgeText(identity) {
    if (identity.bondingModel === 'ionic') return 'Ionic Transfer → Crystal Lattice';
    if (identity.bondingModel === 'polar_covalent') return 'Polar Covalent';
    return 'Nonpolar Covalent';
  }

  function presentNextInQueue() {
    if (formationQueue.length === 0) {
      isPresenting = false;
      return;
    }
    const item = formationQueue.shift();
    isPresenting = true;
    mountBattleOverlay(item.identity, item.meta, item.options);
  }

  function mountBattleOverlay(identity, meta, options) {
    const root = ensureOverlayRoot();
    if (!root || !V.FormationChoreography) {
      isPresenting = false;
      return;
    }

    cleanupActivePresentation();

    const tag = getEventTag(meta);
    const speed = V.FormationChoreography.getSpeed();
    const reduced = V.FormationChoreography.isReducedMotion();
    const isMobile = typeof document !== 'undefined' && document.body && document.body.classList.contains('valency-mobile');

    root.innerHTML = `
      <div class="mol-formation-card mol-tone-${tag.tone} ${identity.bondingModel === 'ionic' ? 'mol-card-ionic' : 'mol-card-covalent'}" role="region" aria-label="Molecular formation of ${esc(identity.name)}">
        <div class="mol-formation-header">
          <div class="mol-formation-title-group">
            <div class="mol-formation-badges">
              <span class="mol-formation-pill">${esc(tag.badge)}</span>
              ${tag.spText ? `<span class="mol-formation-sp">${esc(tag.spText)}</span>` : ''}
            </div>
            <div class="mol-formation-heading">
              <strong class="mol-formation-formula">${esc(identity.formula)}</strong>
              <span class="mol-formation-name">${esc(identity.name)}</span>
            </div>
          </div>
          <div class="mol-formation-controls">
            <button type="button" class="mol-ctrl-btn" data-mol-speed title="Cycle formation playback speed">${speed}×</button>
            <button type="button" class="mol-ctrl-btn mol-ctrl-skip" data-mol-skip title="Skip formation animation (Esc / Space)">Skip ⏭</button>
          </div>
        </div>

        <div class="mol-formation-stage" data-mol-stage></div>

        <div class="mol-formation-footer">
          <div class="mol-formation-meta-row">
            <span class="mol-meta-chip">${esc(getBondBadgeText(identity))}</span>
            <span class="mol-meta-chip">${esc(identity.geometry.label)}</span>
            <span class="mol-meta-chip mol-meta-phase" data-mol-phase>${reduced ? 'Equilibrium View (Reduced Motion)' : 'Initializing…'}</span>
          </div>
          <p class="mol-formation-caption">${esc(identity.polarity.summary)}</p>
        </div>
      </div>
    `;

    root.classList.remove('hidden', 'mol-formation-exit');

    const stageEl = root.querySelector('[data-mol-stage]');
    const phaseEl = root.querySelector('[data-mol-phase]');
    const speedBtn = root.querySelector('[data-mol-speed]');
    const skipBtn = root.querySelector('[data-mol-skip]');

    let dismissed = false;
    function dismissOverlay() {
      if (dismissed) return;
      dismissed = true;
      clearKeyHandler();
      root.classList.add('mol-formation-exit');
      exitTimer = setTimeout(() => {
        cleanupActivePresentation();
        if (formationQueue.length > 0) {
          presentNextInQueue();
        } else {
          root.classList.add('hidden');
          root.classList.remove('mol-formation-exit');
          root.innerHTML = '';
          isPresenting = false;
        }
      }, reduced ? 120 : 240);
    }

    activeHandle = V.FormationChoreography.play(stageEl, identity, {
      compact: isMobile,
      speed,
      reducedMotion: reduced,
      onPhaseChange(ts) {
        if (phaseEl && ts && ts.activeLabel) {
          phaseEl.textContent = reduced ? 'Equilibrium View (Reduced Motion)' : ts.activeLabel;
        }
      },
      onComplete() {
        dismissOverlay();
      },
    });

    if (speedBtn) {
      speedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const presets = V.FormationChoreography.SPEED_PRESETS;
        const idx = presets.indexOf(V.FormationChoreography.getSpeed());
        const next = presets[(idx + 1) % presets.length];
        V.FormationChoreography.setSpeed(next);
        speedBtn.textContent = `${next}×`;
        if (activeHandle) activeHandle.setSpeed(next);
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeHandle) activeHandle.skip();
        else dismissOverlay();
      });
    }

    // Allow keyboard Skip (Escape or Space) without swallowing normal input
    if (typeof window !== 'undefined') {
      activeKeyHandler = function (e) {
        if (e.key === 'Escape' || e.key === ' ') {
          if (activeHandle) activeHandle.skip();
          else dismissOverlay();
        }
      };
      window.addEventListener('keydown', activeKeyHandler);
    }

    if (options && typeof options.onMounted === 'function') {
      options.onMounted(activeHandle);
    }
  }

  /**
   * Primary Battle Card Deployment Hook (called from animations.js playGameEvents).
   * Returns `true` when a verified Layer 1 ChemicalIdentity formation animation was triggered,
   * or `false` so animations.js falls back cleanly to its existing banner.
   */
  function presentFromEvent(meta, context) {
    if (!meta || !FORMATION_EVENT_TYPES.has(meta.type)) return false;
    if (!V.ChemicalIdentity || !V.FormationChoreography) return false;

    const formula = meta.type === 'EN_TAKEOVER' ? meta.newFormula : meta.formula;
    const identity = V.ChemicalIdentity.getCompoundIdentity(formula);
    if (!identity) return false;

    // When Visual FX are toggled completely off in topbar, keep reduced static presentation or skip overlay?
    // Respect reduced-motion mode seamlessly so the chemistry stays visible and instant without continuous motion!
    const entry = { identity, meta, options: context || {} };
    if (isPresenting) {
      // Keep queue bounded to latest 2 to avoid backlog during fast AI sequences
      if (formationQueue.length >= 2) formationQueue.shift();
      formationQueue.push(entry);
    } else {
      isPresenting = true;
      mountBattleOverlay(entry.identity, entry.meta, entry.options);
    }
    return true;
  }

  /**
   * Field Tile Cluster SVG Delegate (called by animations.js renderMoleculeClusterSVG).
   * Returns chemically faithful SVG for any registered Layer 1 compound, or null to fall back.
   */
  function renderFieldClusterSVG(comp) {
    if (!comp || !V.ChemicalIdentity || !V.FormationChoreography) return null;
    const identity = V.ChemicalIdentity.getCompoundIdentity(comp);
    if (!identity) return null;
    return V.FormationChoreography.renderEquilibriumMiniSVG(identity, {
      shield: comp.shield || null,
      inactive: Boolean(comp.inactive),
    });
  }

  function syncReducedMotion() {
    // Re-syncs active playback if user toggles FX off mid-animation
    if (activeHandle && V.FormationChoreography && V.FormationChoreography.isReducedMotion()) {
      activeHandle.skip();
    }
  }

  function getActiveState() {
    return {
      isPresenting,
      queueLength: formationQueue.length,
      speed: V.FormationChoreography ? V.FormationChoreography.getSpeed() : 1,
      reducedMotion: V.FormationChoreography ? V.FormationChoreography.isReducedMotion() : false,
    };
  }

  /**
   * Interactive Molecular Formation Lab Modal (accessible from Main Menu).
   * Reuses V.UI.openModal (zero modal duplication) to preview all registered Layer 1 compounds,
   * verify speed presets, skip, reduced-motion mode, and inspect chemical identity metadata.
   */
  function openFormationLabModal() {
    if (!V.UI || !V.UI.openModal || !V.ChemicalIdentity || !V.FormationChoreography) return;
    const compounds = V.ChemicalIdentity.listCompounds();
    if (compounds.length === 0) return;

    let selectedId = compounds[0].id;
    let labHandle = null;

    const tabsHtml = compounds
      .map((c, idx) => `
        <button type="button" class="mol-lab-tab ${idx === 0 ? 'active' : ''}" data-lab-id="${esc(c.id)}">
          <strong>${esc(c.formula)}</strong>
          <span>${esc(c.name)}</span>
        </button>
      `)
      .join('');

    const speed = V.FormationChoreography.getSpeed();
    const reduced = V.FormationChoreography.isReducedMotion();

    const body = `
      <div class="mol-lab-shell">
        <div class="mol-lab-tabs" role="tablist">${tabsHtml}</div>

        <div class="mol-lab-stage-card">
          <div class="mol-lab-toolbar">
            <div class="mol-lab-phase-pill" id="mol-lab-phase">Ready</div>
            <div class="mol-lab-actions">
              <button type="button" class="ctrl-btn" id="mol-lab-replay">↻ Replay</button>
              <button type="button" class="ctrl-btn" id="mol-lab-skip">Skip ⏭</button>
              <select class="ctrl-btn" id="mol-lab-speed" aria-label="Formation playback speed">
                ${V.FormationChoreography.SPEED_PRESETS.map((s) => `<option value="${s}" ${s === speed ? 'selected' : ''}>Speed: ${s}×</option>`).join('')}
              </select>
              <button type="button" class="ctrl-btn" id="mol-lab-reduced">${reduced ? 'Motion: Reduced' : 'Motion: Full'}</button>
            </div>
          </div>

          <div class="mol-lab-canvas" id="mol-lab-canvas"></div>
          <p class="mol-lab-summary" id="mol-lab-summary"></p>
        </div>

        <div class="mol-lab-specs" id="mol-lab-specs"></div>
      </div>
    `;

    V.UI.openModal('⚛ Molecular Formation Lab — Chemistry-Driven Choreography', body, (root) => {
      const canvasEl = root.querySelector('#mol-lab-canvas');
      const phaseEl = root.querySelector('#mol-lab-phase');
      const summaryEl = root.querySelector('#mol-lab-summary');
      const specsEl = root.querySelector('#mol-lab-specs');
      const replayBtn = root.querySelector('#mol-lab-replay');
      const skipBtn = root.querySelector('#mol-lab-skip');
      const speedSel = root.querySelector('#mol-lab-speed');
      const reducedBtn = root.querySelector('#mol-lab-reduced');

      function renderSpecs(identity) {
        const bondDesc = identity.bondingModel === 'ionic'
          ? `Electron transfer (${identity.electronTransfers[0].from.replace(/\d+$/, '')} → ${identity.electronTransfers[0].to.replace(/\d+$/, '')}, ΔEN ${identity.electronTransfers[0].deltaEN.toFixed(1)})`
          : identity.bonds.map((b) => `${b.bondId} (order ${b.order}, ΔEN ${b.deltaEN.toFixed(1)})`).join(' • ');
        const elemDesc = identity.elements
          .map((e) => `${e.symbol}×${e.count} (${e.valenceElectrons}e⁻, EN ${e.electronegativity.toFixed(1)})`)
          .join(' • ');

        specsEl.innerHTML = `
          <div class="mol-spec-box"><span>Formula &amp; Valence</span><strong>${esc(identity.formula)} • ${identity.totalValenceElectrons} total valence e⁻</strong></div>
          <div class="mol-spec-box"><span>Geometry &amp; Angle</span><strong>${esc(identity.geometry.label)} (${esc(identity.geometry.vseprNotation)})</strong></div>
          <div class="mol-spec-box"><span>Bonding Mechanism</span><strong>${esc(bondDesc)}</strong></div>
          <div class="mol-spec-box"><span>Elements &amp; EN</span><strong>${esc(elemDesc)}</strong></div>
        `;
      }

      function playSelected() {
        const identity = V.ChemicalIdentity.getCompoundIdentity(selectedId);
        if (!identity || !canvasEl) return;
        if (labHandle) {
          labHandle.destroy();
          labHandle = null;
        }
        renderSpecs(identity);
        if (summaryEl) summaryEl.textContent = identity.polarity.summary;

        labHandle = V.FormationChoreography.play(canvasEl, identity, {
          keepMountedIndefinitely: true,
          onPhaseChange(ts) {
            if (phaseEl && ts) {
              phaseEl.textContent = V.FormationChoreography.isReducedMotion()
                ? 'Reduced Motion • Final Equilibrium'
                : `${ts.activeLabel} (${Math.round(ts.progress * 100)}%)`;
            }
          },
          onComplete(info) {
            if (phaseEl) {
              phaseEl.textContent = info.skipped
                ? 'Skipped → Equilibrium'
                : info.reducedMotion
                  ? 'Reduced Motion • Final Equilibrium'
                  : `Complete (${(info.durationMs / 1000).toFixed(2)}s)`;
            }
          },
        });
      }

      root.querySelectorAll('[data-lab-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedId = btn.getAttribute('data-lab-id');
          root.querySelectorAll('[data-lab-id]').forEach((b) => b.classList.toggle('active', b === btn));
          playSelected();
        });
      });

      if (replayBtn) replayBtn.addEventListener('click', playSelected);
      if (skipBtn) skipBtn.addEventListener('click', () => { if (labHandle) labHandle.skip(); });
      if (speedSel) {
        speedSel.addEventListener('change', () => {
          const val = Number(speedSel.value);
          V.FormationChoreography.setSpeed(val);
          playSelected();
        });
      }
      if (reducedBtn) {
        reducedBtn.addEventListener('click', () => {
          const next = !V.FormationChoreography.isReducedMotion();
          V.FormationChoreography.setReducedMotion(next);
          reducedBtn.textContent = next ? 'Motion: Reduced' : 'Motion: Full';
          playSelected();
        });
      }

      playSelected();

      return () => {
        if (labHandle) {
          labHandle.destroy();
          labHandle = null;
        }
      };
    });
  }

  V.BattleFormation = {
    presentFromEvent,
    renderFieldClusterSVG,
    cancelActive,
    syncReducedMotion,
    getActiveState,
    openFormationLabModal,
  };
})(typeof window !== 'undefined' ? window : globalThis);
