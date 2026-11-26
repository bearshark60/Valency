// VALENCY: THE ELEMENTAL FRONTIER — Phase 7: Frontier Exploration, Expedition & Lab UI Controller
// Provides a complete playable vertical slice for Sector 01: The Caloric Basin,
// connecting Regional Exploration, Branching Expeditions, Scientist Equipment/Research,
// Collection/Deck Management, and the Convergence Investigation Log to the canonical battle UI.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  let activeTab = 'world'; // 'world' | 'expedition' | 'scientists' | 'collection' | 'investigation'
  let lastBannerNotice = '';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openFrontierHub(tab, notice) {
    if (tab) activeTab = tab;
    if (notice !== undefined) lastBannerNotice = notice;

    const profile = F.PlayerProfile.loadProfile();
    const activeExp = F.ExpeditionManager.loadActiveExpedition();
    if (activeExp && activeTab === 'world' && !tab) {
      activeTab = 'expedition';
    }

    const region = F.WorldManager.getRegion(profile.currentRegionId || 'region_caloric_basin');
    const curLoc = F.WorldManager.getLocation(profile.currentLocationId);
    const activeDeck = profile.decks[profile.activeDeckId];
    const deckCheck = F.CollectionManager.validateDeck(activeDeck, profile);
    const invSum = F.InvestigationManager.getInvestigationSummary(profile);
    const eqDef = profile.equippedScientistId ? F.ScientistEquipment.getScientistDef(profile.equippedScientistId) : null;

    // Apply Stage 3C Scene Visual Theme & Scene Audio Routing (never silently reusing unrelated music)
    let visualScene = 'frontier_hub';
    let audioScene = 'frontier_hub';
    if (activeTab === 'world') {
      if (curLoc && curLoc.isSafeZone) {
        visualScene = 'frontier_settlement';
        audioScene = 'frontier_settlement';
      } else if (curLoc && curLoc.locationId === 'loc_archive_ruins') {
        visualScene = 'frontier_laboratory';
        audioScene = 'frontier_laboratory';
      } else {
        visualScene = 'frontier_region';
        audioScene = 'frontier_exploration';
      }
    } else if (activeTab === 'expedition') {
      visualScene = 'frontier_expedition';
      audioScene = 'frontier_expedition';
    } else if (activeTab === 'scientists' || activeTab === 'collection') {
      visualScene = 'frontier_laboratory';
      audioScene = 'frontier_laboratory';
    } else if (activeTab === 'investigation') {
      visualScene = 'collective_anomaly';
      audioScene = 'collective_story';
    }
    const modalSceneOpts = { visualScene, audioScene };

    const noticeHTML = lastBannerNotice
      ? `<div class="story-unlock-banner" style="margin-bottom:8px;">${esc(lastBannerNotice)}</div>`
      : '';

    const tabContent =
      activeTab === 'world'
        ? renderWorldTab(profile, activeExp, region, curLoc)
        : activeTab === 'expedition'
          ? renderExpeditionTab(profile, activeExp)
          : activeTab === 'scientists'
            ? renderScientistsTab(profile, activeExp)
            : activeTab === 'collection'
              ? renderCollectionTab(profile, activeExp)
              : renderInvestigationTab(profile, invSum);

    const themeBadgeHTML = V.Visual && V.Visual.renderThemePill ? V.Visual.renderThemePill() : '';
    const resourceRowHTML = V.Visual && V.Visual.renderResourcePill
      ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px;">
           ${V.Visual.renderResourcePill('📍', 'Location', curLoc ? curLoc.name : '')}
           ${V.Visual.renderResourcePill('🪙', 'Credits', profile.currencies.reagentCredits)}
           ${V.Visual.renderResourcePill('🔬', 'Research Data', profile.currencies.researchData)}
           ${V.Visual.renderResourcePill('🧬', 'Equipped', eqDef ? eqDef.historicalName : 'None')}
         </div>`
      : `<div class="story-hub-sub">
           Location: <strong style="color:#5eead4">${esc(curLoc ? curLoc.name : '')}</strong>
           • Credits: <strong>${profile.currencies.reagentCredits}</strong>
           • Research Data: <strong>${profile.currencies.researchData}</strong>
           • Equipped: <strong>${esc(eqDef ? eqDef.historicalName : 'None')}</strong>
         </div>`;

    const body = `
      <div class="story-hub-summary">
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <strong>🧭 VALENCY: The Elemental Frontier — ${esc(region ? region.name : 'Sector 01')}</strong>
            ${themeBadgeHTML}
          </div>
          ${resourceRowHTML}
        </div>
        <button id="btn-frontier-reset" class="ctrl-btn" title="Reset Frontier profile">Reset Frontier</button>
      </div>

      ${noticeHTML}

      <div class="frontier-tabs">
        <button class="sidebar-tab ${activeTab === 'world' ? 'active' : ''}" data-ftab="world">🗺 Region</button>
        <button class="sidebar-tab ${activeTab === 'expedition' ? 'active' : ''}" data-ftab="expedition">🧭 Expedition ${activeExp ? '(Active)' : ''}</button>
        <button class="sidebar-tab ${activeTab === 'scientists' ? 'active' : ''}" data-ftab="scientists">🧬 Scientists</button>
        <button class="sidebar-tab ${activeTab === 'collection' ? 'active' : ''}" data-ftab="collection">🃏 Deck (${deckCheck.totalCards})</button>
        <button class="sidebar-tab ${activeTab === 'investigation' ? 'active' : ''}" data-ftab="investigation">🔍 Clues (${invSum.discoveredCount}/${invSum.totalCount})</button>
      </div>

      <div class="frontier-tab-body">${tabContent}</div>
    `;

    V.UI.openModal('🧭 VALENCY: The Elemental Frontier', body, (root) => {
      root.querySelectorAll('[data-ftab]').forEach((btn) => {
        btn.addEventListener('click', () => openFrontierHub(btn.getAttribute('data-ftab'), ''));
      });
      const resetBtn = root.querySelector('#btn-frontier-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => openFrontierResetConfirm());
      }
      bindTabActions(root, profile, activeExp);
    }, modalSceneOpts);
  }

  function openFrontierResetConfirm() {
    const body = `
      <div class="story-confirm-box">
        <p style="font-size:13px;color:#fecaca;">
          <strong>Reset Frontier Profile &amp; Active Expedition?</strong><br />
          Your Academy Chapter 0 save remains untouched and will automatically re-migrate.
        </p>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:10px;">
          <button id="btn-freset-cancel" class="btn-action btn-pass">Cancel</button>
          <button id="btn-freset-ok" class="btn-action btn-play-red">Confirm Frontier Reset</button>
        </div>
      </div>
    `;
    V.UI.openModal('⚠ Confirm Frontier Reset', body, (root) => {
      root.querySelector('#btn-freset-cancel').addEventListener('click', () => openFrontierHub(activeTab, ''));
      root.querySelector('#btn-freset-ok').addEventListener('click', () => {
        F.ExpeditionManager.clearActiveExpedition();
        F.PlayerProfile.resetProfile();
        openFrontierHub('world', 'Frontier profile reset (Academy progression preserved).');
      });
    });
  }

  function renderWorldTab(profile, activeExp, region, curLoc) {
    const reachable = F.WorldManager.getReachableLocations(profile);
    const academyNote = profile.storyFlags.academyGraduated
      ? `<span class="story-badge badge-done">✓ Academy Licensed (${esc(profile.storyFlags.academyLicensureTier)})</span>`
      : `<span class="story-badge badge-open">Frontier Preview Access (Academy Chapter 0 Progress Preserved)</span>`;

    const interactionsHTML = (curLoc.interactions || []).map((inter) => `
      <div class="story-mission-row">
        <div class="story-mission-info">
          <strong class="story-mission-title">${esc(inter.label)}</strong>
          <div class="story-mission-sub">${esc(inter.description)}</div>
        </div>
        <button class="btn-action btn-synth" data-finteract="${inter.interactionId}" ${activeExp ? 'disabled' : ''}>Investigate</button>
      </div>
    `).join('');

    const expeditionBtnHTML = curLoc.expeditionId
      ? `
        <div class="briefing-rc" style="margin-top:6px;">
          <strong>🧭 Expedition Entrance: The Conservation Crucible</strong>
          <p>Branching Sector 01 expedition with temporary cards, permanent discoveries, extraction lift, and the Rogue Lavoisier Construct. Permanent rewards always survive failure; unsecured loot &amp; temporary cards are lost on failure/withdrawal.</p>
          <div style="margin-top:8px;">
            <button id="btn-start-expedition" class="btn-action btn-synth">${activeExp ? 'Resume Active Expedition →' : 'Launch Expedition →'}</button>
          </div>
        </div>
      `
      : '';

    const travelHTML = reachable.map((loc) => `
      <div class="story-mission-row">
        <div class="story-mission-info">
          <div class="story-badges">
            <span class="story-badge ${loc.isSafeZone ? 'badge-done' : 'badge-open'}">${loc.isSafeZone ? '🛡 Safe Lab Zone' : esc(loc.type)}</span>
          </div>
          <strong class="story-mission-title">${esc(loc.name)}</strong>
          <div class="story-mission-sub">${esc(loc.description)}</div>
        </div>
        <button class="btn-action btn-pass" data-ftravel="${loc.locationId}" ${activeExp ? 'disabled' : ''}>Travel →</button>
      </div>
    `).join('');

    return `
      <div class="story-intro-banner">
        <div class="story-badges" style="margin-bottom:5px;">
          ${academyNote}
          <span class="story-badge ${curLoc.isSafeZone ? 'badge-done' : 'badge-diff'}">${curLoc.isSafeZone ? '🛡 Safe Preparation Zone (Equip/Deck Enabled)' : '⚠ Field Zone'}</span>
        </div>
        <strong>${esc(curLoc.name)}</strong>
        <p class="story-intro-text" style="margin-top:3px;">${esc(curLoc.description)}</p>
      </div>

      ${activeExp ? '<div class="briefing-box"><strong>Active Expedition in Progress!</strong> Switch to the <strong>🧭 Expedition</strong> tab to continue or withdraw.</div>' : ''}

      ${interactionsHTML ? `<div class="story-section-kicker" style="margin-top:6px;">LOCATION ACTIONS</div><div class="story-mission-list">${interactionsHTML}</div>` : ''}
      ${expeditionBtnHTML}

      <div class="story-section-kicker" style="margin-top:8px;">CONNECTED SECTOR 01 LOCATIONS</div>
      <div class="story-mission-list">${travelHTML || '<div class="story-mission-sub">Inspect the Hearth Sensor Array to reveal connected Sector 01 routes.</div>'}</div>
    `;
  }

  function renderExpeditionTab(profile, activeExp) {
    if (!activeExp) {
      return `
        <div class="briefing-box">
          <strong>No Active Expedition</strong>
          <p style="margin-top:4px;">Travel to <strong>The Conservation Crucible</strong> in Sector 01 to launch a branching expedition (scan the Caloric Thermal Vent first to unlock the route!).</p>
          <div style="margin-top:8px;">
            <button class="btn-action btn-pass" data-ftab="world">← Back to Region Map</button>
          </div>
        </div>
      `;
    }

    const def = F.ExpeditionManager.getExpeditionDef(activeExp.expeditionId);
    const curNode = def.nodes[activeExp.currentNodeId];
    const nextNodes = F.ExpeditionManager.getAvailableNextNodes(activeExp);
    const isResolved = activeExp.resolvedNodeIds.includes(curNode.nodeId);

    const tempCardsText = activeExp.temporaryCards.length
      ? activeExp.temporaryCards.map((t) => `${t.quantity}x ${t.cardId}`).join(', ')
      : 'None yet';
    const unsecuredText = activeExp.unsecuredRewards.length
      ? activeExp.unsecuredRewards.map((u) => u.label).join(' • ')
      : 'None staged';
    const permText = activeExp.committedPermanentLog.length
      ? activeExp.committedPermanentLog.map((p) => p.summary.join(', ')).join(' • ')
      : 'None yet';

    const nodeActionHTML =
      !isResolved && curNode.encounterId
        ? `<button class="btn-action btn-synth" data-flaunch-enc="${curNode.encounterId}">⚔ Enter Molecular Battle →</button>`
        : curNode.type === 'extraction'
          ? `<button id="btn-fextract" class="btn-action btn-synth">🚁 Extract &amp; Secure Rewards</button>`
          : '';

    const branchButtons = nextNodes.map((n) => `
      <div class="story-mission-row">
        <div class="story-mission-info">
          <div class="story-badges"><span class="story-badge badge-open">${esc(n.type.replace(/_/g, ' '))}</span></div>
          <strong class="story-mission-title">${esc(n.title)}</strong>
          <div class="story-mission-sub">${esc(n.description)}</div>
        </div>
        <button class="btn-action btn-synth" data-fmove-node="${n.nodeId}">Advance →</button>
      </div>
    `).join('');

    return `
      <div class="story-intro-banner">
        <div class="story-section-kicker">ACTIVE EXPEDITION • ${esc(def.title)}</div>
        <strong>Current Node: ${esc(curNode.title)}</strong>
        <p class="story-intro-text" style="margin-top:3px;">${esc(curNode.description)}</p>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
          ${nodeActionHTML}
          <button id="btn-fwithdraw" class="btn-action btn-play-red">Withdraw (Keep Permanent / Lose Unsecured)</button>
        </div>
      </div>

      <div class="eval-card">
        <div class="story-section-kicker">PERMANENT VS. TEMPORARY EXPEDITION LEDGER</div>
        <div style="font-size:12px;color:#86efac;"><strong>✓ Permanent Rewards Committed (Kept Even on Failure):</strong> ${esc(permText)}</div>
        <div style="font-size:12px;color:#fde68a;"><strong>⚠ Unsecured Loot (Secured Only on Extraction/Victory):</strong> ${esc(unsecuredText)}</div>
        <div style="font-size:12px;color:#c4b5fd;"><strong>⏳ Temporary Expedition Cards (Removed After Run):</strong> ${esc(tempCardsText)}</div>
      </div>

      ${branchButtons ? `<div class="story-section-kicker" style="margin-top:6px;">NEXT BRANCHING PATHS</div><div class="story-mission-list">${branchButtons}</div>` : ''}
    `;
  }

  function renderScientistsTab(profile, activeExp) {
    const gate = F.ScientistEquipment.canChangeEquipment(profile, activeExp);
    const defs = F.ScientistEquipment.listScientistDefs();

    const cardsHTML = defs.map((def) => {
      const rec = profile.scientists[def.scientistId] || { unlocked: false, experience: 0, level: 1, researchUnlocks: [] };
      const isEquipped = profile.equippedScientistId === def.scientistId;
      const isPoC = def.status === 'ACTIVE_PROOF_OF_CONCEPT';

      const researchHTML = (def.researchTree || []).map((node) => {
        const done = (rec.researchUnlocks || []).includes(node.researchId);
        return `
          <div class="archive-stage2 ${done ? 'unlocked' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
              <strong>${done ? '✓' : '○'} ${esc(node.title)}</strong>
              ${!done && rec.unlocked ? `<button class="ctrl-btn" data-fresearch="${def.scientistId}:${node.researchId}">Unlock (${node.costResearchData} Data)</button>` : ''}
            </div>
            <div>${esc(node.description)}</div>
          </div>
        `;
      }).join('');

      return `
        <div class="archive-card ${rec.unlocked ? 'unlocked' : 'locked'}">
          <div class="archive-head">
            ${V.Visual && V.Visual.renderPortrait ? V.Visual.renderPortrait(def.portraitRef || def.scientistId, 'story-char-img', def.historicalName) : `<img src="${esc(def.artworkRef)}" alt="${esc(def.historicalName)}" class="story-char-img" />`}
            <div style="flex:1;">
              <h4>${esc(def.constructName)}</h4>
              <div class="archive-spec">${esc(def.scientificSpecialty)} • Affinities: ${esc(def.elementalAffinities.join(', '))}</div>
              <div class="story-badges" style="margin-top:4px;">
                <span class="story-badge ${rec.unlocked ? 'badge-done' : 'badge-locked'}">${rec.unlocked ? `✓ Unlocked • Lv.${rec.level} (${rec.experience} XP)` : `🔒 Locked (${def.originTerritoryLabel})`}</span>
                ${isEquipped ? '<span class="story-badge badge-stage2">★ EQUIPPED (Primary Slot)</span>' : ''}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
              ${rec.unlocked && isPoC ? `
                <button class="btn-action ${isEquipped ? 'btn-pass' : 'btn-synth'}" data-fequip="${isEquipped ? '' : def.scientistId}" ${gate.allowed ? '' : 'disabled'}>
                  ${isEquipped ? 'Unequip' : 'Equip'}
                </button>
              ` : ''}
              ${V.CharacterRig && ((V.CharacterRegistry && V.CharacterRegistry.hasAnimatedCharacterForScientist && V.CharacterRegistry.hasAnimatedCharacterForScientist(def.scientistId)) || def.scientistId === 'lavoisier' || def.scientistId === 'mendeleev') ? `
                <button class="ctrl-btn" data-open-portrait-studio="true" data-studio-scientist="${esc(def.scientistId)}" title="Inspect Animated Frontier & Institute Portraits">🎭 Animated Portrait</button>
              ` : ''}
            </div>
          </div>
          ${def.passiveAbility ? `<div class="briefing-box" style="margin-top:4px;"><strong>Passive — ${esc(def.passiveAbility.name)}:</strong> ${esc(def.passiveAbility.description)}<br /><strong>Active — ${esc(def.activeAbility.name)}:</strong> ${esc(def.activeAbility.description)}</div>` : '<div class="story-mission-sub">Frontier abilities reserved for future regional expansion.</div>'}
          ${researchHTML}
          <div class="archive-disclaimer">${esc(def.disclaimer)}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="briefing-box" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div>
          <strong>Primary Scientist Equipment Slot:</strong> ${gate.allowed ? 'Safe Lab Zone active — you may equip or unequip unlocked Frontier Scientists.' : esc(gate.reason)}
        </div>
        ${V.CharacterRig ? '<button id="btn-open-portrait-studio" class="ctrl-btn" data-open-portrait-studio="true">🎭 Character Animation Studio</button>' : ''}
      </div>
      <div class="archive-list">${cardsHTML}</div>
    `;
  }

  function renderCollectionTab(profile, activeExp) {
    const deck = profile.decks[profile.activeDeckId];
    const check = F.CollectionManager.validateDeck(deck, profile);
    const sum = F.CollectionManager.getCollectionSummary(profile);
    const catalog = F.CollectionManager.getCanonicalCatalog();

    const sampleRows = ['el_O', 'el_H', 'el_C', 'el_F', 'ng_He', 'inst_CATALYST', 'inst_EXOTHERMIC_SURGE', 'ev_ACID_RAIN']
      .filter((id) => catalog[id])
      .map((id) => {
        const spec = catalog[id].spec;
        const owned = F.CollectionManager.getOwnedQuantity(profile, id);
        const inDeck = (deck && deck.cardCounts[id]) || 0;
        const variants = Object.entries((profile.collection[id] && profile.collection[id].variants) || {})
          .map(([v, q]) => `${v}: ${q}`)
          .join(', ');
        return `
          <div class="story-mission-row">
            <div class="story-mission-info">
              <strong class="story-mission-title">${esc(spec.name)} (${esc(spec.symbol || spec.effectId)})</strong>
              <div class="story-mission-sub">Owned Permanently: <strong>${owned}</strong> (${esc(variants)}) • In Active Deck: <strong>${inDeck}</strong></div>
            </div>
            <div class="story-audio-actions">
              <button class="ctrl-btn" data-fdeck-adj="${id}:-1" ${activeExp || inDeck <= 0 ? 'disabled' : ''}>−</button>
              <button class="ctrl-btn" data-fdeck-adj="${id}:1" ${activeExp || inDeck >= owned ? 'disabled' : ''}>+</button>
            </div>
          </div>
        `;
      }).join('');

    return `
      <div class="briefing-box">
        <strong>Permanent Card Collection &amp; Active Deck (${esc(deck ? deck.name : '')})</strong>
        <div class="story-mission-sub" style="margin-top:3px;">
          Unique Templates Owned: <strong>${sum.uniqueOwned}</strong> • Total Permanent Copies: <strong>${sum.totalCopies}</strong> (Duplicates: ${sum.duplicateCopies})
          • Deck Size: <strong>${check.totalCards}</strong> (${check.valid ? '✓ Legal' : '⚠ Invalid'})
        </div>
        <div class="story-mission-sub" style="margin-top:3px;">
          <em>Note: Temporary expedition cards are strictly isolated and never added to permanent ownership.</em>
        </div>
      </div>
      <div class="story-mission-list" style="margin-top:8px;">${sampleRows}</div>
    `;
  }

  function renderInvestigationTab(profile, invSum) {
    const renderGroup = (title, items) => `
      <div class="story-section-kicker" style="margin-top:6px;">${title}</div>
      <div class="story-mission-list">
        ${items.map((item) => `
          <div class="archive-card ${item.discovered ? 'unlocked' : 'locked'}">
            <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <strong>${item.discovered ? '✓' : '🔒'} ${esc(item.title)}</strong>
              <span class="story-badge ${item.discovered ? 'badge-done' : 'badge-locked'}">${item.discovered ? 'Discovered' : 'Undiscovered'}</span>
            </div>
            <div class="story-mission-sub">${item.discovered ? esc(item.summary) : 'Explore Sector 01 anomalies, relay stations, and expeditions to uncover this evidence.'}</div>
          </div>
        `).join('')}
      </div>
    `;

    return `
      <div class="briefing-box">
        <strong>The Convergence Mystery (${invSum.discoveredCount} / ${invSum.totalCount} Evidence Entries)</strong>
        <div class="story-mission-sub">All investigation evidence is permanent and persists across expedition failures and reloads.</div>
      </div>
      ${renderGroup('🔬 SCIENTIFIC EVIDENCE', invSum.byCategory.SCIENTIFIC)}
      ${renderGroup('📜 HISTORICAL EVIDENCE', invSum.byCategory.HISTORICAL)}
      ${renderGroup('📡 INTELLIGENCE EVIDENCE', invSum.byCategory.INTELLIGENCE)}
    `;
  }

  function bindTabActions(root, profile, activeExp) {
    root.querySelectorAll('[data-ftravel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const res = F.WorldManager.travelToLocation(profile, btn.getAttribute('data-ftravel'), activeExp);
        openFrontierHub('world', res.ok ? `Traveled to ${res.location.name}.` : res.error);
      });
    });

    root.querySelectorAll('[data-finteract]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const res = F.WorldManager.interactAtCurrentLocation(profile, btn.getAttribute('data-finteract'));
        if (!res.ok) {
          openFrontierHub('world', res.error);
          return;
        }
        const parts = [];
        if (res.discoveredNow.length) parts.push(`Discovered ${res.discoveredNow.length} new location(s)!`);
        if (res.evidenceNow.length) parts.push(`Logged ${res.evidenceNow.length} permanent Convergence clue(s)!`);
        if (res.rewardResult && res.rewardResult.committed && res.rewardResult.committed.length) {
          parts.push(res.rewardResult.committed.join(', '));
        }
        openFrontierHub('world', parts.join(' • ') || 'Inspection complete.');
      });
    });

    const startExpBtn = root.querySelector('#btn-start-expedition');
    if (startExpBtn) {
      startExpBtn.addEventListener('click', () => {
        const res = F.ExpeditionManager.startExpedition(profile, 'exp_caloric_crucible');
        openFrontierHub('expedition', res.resumed ? 'Resumed active expedition.' : 'Entered The Conservation Crucible!');
      });
    }

    root.querySelectorAll('[data-fmove-node]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const res = F.ExpeditionManager.moveToNode(profile, activeExp, btn.getAttribute('data-fmove-node'));
        if (!res.ok) {
          openFrontierHub('expedition', res.error);
          return;
        }
        openFrontierHub('expedition', `Arrived at ${res.node.title}.`);
      });
    });

    root.querySelectorAll('[data-flaunch-enc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const encId = btn.getAttribute('data-flaunch-enc');
        if (V.Sound) V.Sound.unlockAudio();
        const enc = F.EncounterManager && F.EncounterManager.getEncounterDef ? F.EncounterManager.getEncounterDef(encId) : null;
        if (enc && enc.animatedPortraitId && enc.preBattleDialogue && enc.preBattleDialogue.length && V.CharacterRig) {
          openFrontierEncounterIntro(encId, { previewOnly: false });
        } else if (V.UI && V.UI.startFrontierEncounter) {
          V.UI.startFrontierEncounter(encId);
        }
      });
    });

    root.querySelectorAll('[data-open-portrait-studio]').forEach((btn) => {
      const sid = btn.getAttribute('data-studio-scientist') || 'lavoisier';
      btn.addEventListener('click', () => openPortraitPrototypeStudio({ origin: 'frontier', returnTab: activeTab, scientistKey: sid }));
    });

    const extractBtn = root.querySelector('#btn-fextract');
    if (extractBtn) {
      extractBtn.addEventListener('click', () => {
        const res = F.ExpeditionManager.extractFromExpedition(profile, activeExp);
        const msg = res.securedSummary && res.securedSummary.length
          ? `Extracted safely! Secured: ${res.securedSummary.join(', ')}. Temporary cards cleared.`
          : 'Extracted safely to Hearth Outpost! Temporary expedition state cleared.';
        openFrontierHub('world', msg);
      });
    }

    const withdrawBtn = root.querySelector('#btn-fwithdraw');
    if (withdrawBtn) {
      withdrawBtn.addEventListener('click', () => {
        const res = F.ExpeditionManager.withdrawFromExpedition(profile, activeExp);
        const lost = res.lostUnsecuredSummary.length ? `Lost unsecured: ${res.lostUnsecuredSummary.join(', ')}.` : 'No unsecured loot lost.';
        openFrontierHub('world', `Withdrew to Hearth Outpost. All permanent rewards kept! ${lost} Temporary cards removed.`);
      });
    }

    root.querySelectorAll('[data-fequip]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sid = btn.getAttribute('data-fequip') || null;
        const res = F.ScientistEquipment.equipScientist(profile, sid, activeExp);
        if (res.ok) F.PlayerProfile.saveProfile(profile);
        openFrontierHub('scientists', res.ok ? (sid ? `Equipped ${sid} in Primary Scientist Slot!` : 'Unequipped Scientist.') : res.error);
      });
    });

    root.querySelectorAll('[data-fresearch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [sid, rid] = btn.getAttribute('data-fresearch').split(':');
        const res = F.ScientistEquipment.unlockResearchNode(profile, sid, rid);
        if (res.ok) F.PlayerProfile.saveProfile(profile);
        openFrontierHub('scientists', res.ok ? `Unlocked research: ${res.node.title}!` : res.error);
      });
    });

    root.querySelectorAll('[data-fdeck-adj]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [cid, deltaStr] = btn.getAttribute('data-fdeck-adj').split(':');
        const deck = profile.decks[profile.activeDeckId];
        const nextCount = ((deck && deck.cardCounts[cid]) || 0) + Number(deltaStr);
        const res = F.CollectionManager.setDeckCardCount(profile, profile.activeDeckId, cid, nextCount);
        if (res.ok) F.PlayerProfile.saveProfile(profile);
        openFrontierHub('collection', res.ok ? `Updated active deck (${res.validation.totalCards} cards).` : res.error);
      });
    });
  }

  /**
   * Post-battle modal for Frontier encounters.
   */
  function handleFrontierEncounterComplete(battleState, encounterId) {
    const profile = F.PlayerProfile.loadProfile();
    const activeExp = F.ExpeditionManager.loadActiveExpedition();
    const outcome = F.EncounterManager.resolveEncounterOutcome(profile, activeExp, encounterId, battleState);

    if (V.Visual && V.Visual.applyScene) V.Visual.applyScene('frontier_expedition');
    if (V.Sound && V.Sound.requestScene) {
      V.Sound.requestScene(outcome.won ? 'frontier_victory' : 'frontier_defeat');
    }
    if (outcome.won && V.Sound) V.Sound.playVictory();
    else if (!outcome.won && V.Sound && V.Sound.playDefeat) V.Sound.playDefeat();

    const committedNotes = [];
    for (const r of outcome.rewardResults || []) {
      if (r.committed && r.committed.length) committedNotes.push(...r.committed);
      if (r.persistenceClass === 'UNSECURED') committedNotes.push('Staged Unsecured Expedition Loot');
    }

    const fin = outcome.expeditionFinalSummary;
    const finHTML = fin
      ? `
        <div class="eval-card">
          <strong>Expedition Outcome: ${esc(fin.outcome)}</strong>
          ${fin.securedSummary.length ? `<div style="color:#86efac;font-size:12.5px;">✓ Secured Permanently: ${esc(fin.securedSummary.join(', '))}</div>` : ''}
          ${fin.lostUnsecuredSummary.length ? `<div style="color:#fca5a5;font-size:12.5px;">✕ Lost Unsecured Rewards: ${esc(fin.lostUnsecuredSummary.join(', '))}</div>` : ''}
          <div style="color:#cbd5e1;font-size:12px;">Temporary expedition cards &amp; modifications cleared (${fin.clearedTemporaryCount}). All permanent rewards preserved!</div>
        </div>
      `
      : '';

    const body = `
      <div class="story-intro-banner">
        <strong>${outcome.won ? '✓ Frontier Encounter Victory!' : '☣ Expedition Failed — Returned to Hearth Outpost'}</strong>
        <p class="story-intro-text" style="margin-top:4px;">
          ${outcome.won
            ? `Defeated ${esc(outcome.encounter.opponentDisplayName)} using the canonical molecular battle system.`
            : `Defeated by ${esc(outcome.encounter.opponentDisplayName)}. Per Frontier rules, all previously earned permanent cards, Scientist unlocks, research, and world discoveries remain safely in your Profile.`}
        </p>
      </div>
      ${committedNotes.length ? `<div class="story-unlock-banner">${committedNotes.map((n) => `<div>• ${esc(n)}</div>`).join('')}</div>` : ''}
      ${finHTML}
      <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:8px;">
        <button id="btn-fpost-continue" class="btn-action btn-synth">${outcome.activeExpedition ? 'Continue Expedition →' : 'Return to Hearth Outpost →'}</button>
        <button id="btn-fpost-menu" class="btn-action btn-pass">← Main Menu</button>
      </div>
    `;

    V.UI.openModal(
      outcome.won ? `⚛ Frontier Victory — ${outcome.encounter.opponentDisplayName}` : `☣ Expedition Failed — ${outcome.encounter.opponentDisplayName}`,
      body,
      (root) => {
        root.querySelector('#btn-fpost-continue').addEventListener('click', () => {
          V.UI.showMenuScreen();
          openFrontierHub(outcome.activeExpedition ? 'expedition' : 'world', '');
        });
        root.querySelector('#btn-fpost-menu').addEventListener('click', () => V.UI.showMenuScreen());
      }
    );
  }

  /**
   * Stage 3D.1 — Animated Pre-Battle Frontier Encounter Introduction (e.g., Rogue Lavoisier Construct).
   * Plays atmospheric encounter transition, dialogue expression shifts, and subtle synthetic cues
   * strictly separated from canonical battle rules.
   */
  function openFrontierEncounterIntro(encounterId, options) {
    const opts = options || {};
    const enc = F.EncounterManager.getEncounterDef(encounterId);
    if (!enc) return;

    const lines = enc.preBattleDialogue || [
      { expression: 'neutral', speaker: enc.opponentDisplayName, text: enc.introSubtitle },
    ];
    let lineIndex = 0;
    let activeRig = null;

    const animMode = V.CharacterRig ? V.CharacterRig.getAnimationMode() : 'full';
    const isMendeleevEnc = encounterId === 'enc_rogue_mendeleev' || enc.animatedPortraitId === 'sci_men_002_frontier';
    const constructBadge = isMendeleevEnc ? 'SCI-MEN-002 • Gen-2 Drifting' : 'SCI-LAV-001 • Gen-1 Intact';
    const sectorKicker = isMendeleevEnc ? 'PERIODIC SPIRE • GEN-2 CONSTRUCT ENCOUNTER' : 'SECTOR 01 • FRONTIER CONSTRUCT ENCOUNTER';

    const body = `
      <div class="poc-stage-grid">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <div id="fenc-animated-stage"></div>
          <div class="poc-meta-strip">
            <span class="story-badge badge-open">${constructBadge}</span>
            <span id="fenc-expr-badge" class="story-badge badge-tier">neutral</span>
            <span id="fenc-speak-badge" class="story-badge badge-diff">Speaking</span>
          </div>
        </div>

        <div class="poc-dialogue-box">
          <div class="story-section-kicker">${sectorKicker}</div>
          <strong id="fenc-speaker" style="font-size:15px;color:#e0f2fe;">${esc(lines[0].speaker)}</strong>
          <div id="fenc-quote" class="poc-dialogue-quote">“${esc(lines[0].text)}”</div>
          <div style="font-size:11.5px;color:#94a3b8;">Line <span id="fenc-step">1</span> / ${lines.length} • Phrase-paced speaking cadence returns smoothly to idle composure</div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
            <button id="btn-fenc-next-line" class="btn-action btn-pass">${lines.length > 1 ? 'Next Dialogue Line →' : 'Replay Transition'}</button>
            <button id="btn-fenc-replay-trans" class="ctrl-btn">🌊 Encounter Transition</button>
          </div>

          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px;padding-top:8px;border-top:1px solid rgba(148,163,184,0.2);">
            <label for="fenc-anim-mode" style="font-size:11.5px;color:#cbd5e1;font-weight:700;">Portrait Motion:</label>
            <select id="fenc-anim-mode" class="ctrl-btn">
              <option value="full" ${animMode === 'full' ? 'selected' : ''}>Full Motion</option>
              <option value="reduced" ${animMode === 'reduced' ? 'selected' : ''}>Reduced Motion</option>
              <option value="off" ${animMode === 'off' ? 'selected' : ''}>Off (Static)</option>
            </select>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:8px;">
            <button id="btn-fenc-back" class="btn-action btn-pass">← Back</button>
            <button id="btn-fenc-fight" class="btn-action btn-synth">${opts.previewOnly ? '⚔ Launch Practice Encounter →' : '⚔ Begin Molecular Battle →'}</button>
          </div>
        </div>
      </div>
    `;

    V.UI.openModal(`⚛ Frontier Encounter — ${enc.opponentDisplayName}`, body, (root) => {
      const mountEl = root.querySelector('#fenc-animated-stage');
      const speakerEl = root.querySelector('#fenc-speaker');
      const quoteEl = root.querySelector('#fenc-quote');
      const stepEl = root.querySelector('#fenc-step');
      const exprBadge = root.querySelector('#fenc-expr-badge');
      const speakBadge = root.querySelector('#fenc-speak-badge');
      const nextBtn = root.querySelector('#btn-fenc-next-line');
      const transBtn = root.querySelector('#btn-fenc-replay-trans');
      const modeSel = root.querySelector('#fenc-anim-mode');

      function estimateLineDurationMs(text) {
        const len = String(text || '').length;
        return Math.max(1900, Math.min(4200, Math.round(len * 44)));
      }

      function triggerLineSpeech(ln) {
        if (!activeRig) return;
        const dur = estimateLineDurationMs(ln && ln.text);
        if (speakBadge) speakBadge.textContent = V.CharacterRig && V.CharacterRig.isEffectivelyAnimated() ? 'Speaking' : 'Idle';
        if (typeof activeRig.speakForDuration === 'function') {
          activeRig.speakForDuration(dur, () => {
            if (speakBadge) speakBadge.textContent = 'Idle';
          });
        } else {
          activeRig.setSpeaking(true);
        }
      }

      if (mountEl && V.CharacterRig) {
        activeRig = V.CharacterRig.mount(mountEl, {
          characterId: enc.animatedPortraitId || 'sci_lav_001_frontier',
          size: 'stage',
          expression: lines[0].expression || 'neutral',
          speaking: false,
          autoplayTransition: true,
        });
        triggerLineSpeech(lines[0]);
      }

      function cleanup() {
        if (activeRig) {
          activeRig.destroy();
          activeRig = null;
        }
      }

      function applyLine(idx) {
        const ln = lines[idx];
        if (!ln) return;
        if (speakerEl) speakerEl.textContent = ln.speaker;
        if (quoteEl) quoteEl.textContent = `“${ln.text}”`;
        if (stepEl) stepEl.textContent = String(idx + 1);
        if (exprBadge) exprBadge.textContent = ln.expression;
        if (activeRig) {
          activeRig.setExpression(ln.expression || 'neutral');
          triggerLineSpeech(ln);
          if (ln.expression === 'instability') activeRig.triggerReconstructionGlitch();
        }
        if (nextBtn) {
          nextBtn.textContent = idx < lines.length - 1 ? 'Next Dialogue Line →' : 'Restart Dialogue ↺';
        }
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          lineIndex = (lineIndex + 1) % lines.length;
          applyLine(lineIndex);
        });
      }
      if (transBtn) {
        transBtn.addEventListener('click', () => {
          if (activeRig) activeRig.triggerEncounterTransition();
        });
      }
      if (modeSel && V.CharacterRig) {
        modeSel.addEventListener('change', () => {
          V.CharacterRig.setAnimationMode(modeSel.value);
        });
      }
      root.querySelector('#btn-fenc-back').addEventListener('click', () => {
        cleanup();
        if (opts.returnToStudio) openPortraitPrototypeStudio(opts.studioOriginOpts || {});
        else openFrontierHub(activeTab, '');
      });
      root.querySelector('#btn-fenc-fight').addEventListener('click', () => {
        cleanup();
        if (V.UI && V.UI.startFrontierEncounter) V.UI.startFrontierEncounter(encounterId);
      });
      return cleanup;
    }, {
      visualScene: 'frontier_encounter',
      audioScene: enc.musicThemeRef || 'frontier_encounter_rogue_scientist',
    });
  }

  // Dynamically discovers all Scientist pairs from V.CharacterRegistry.listScientistPairs()
  // (e.g. Lavoisier: sci_lav_001_frontier / sci_lav_001_institute, Mendeleev: sci_men_002_frontier /
  // sci_men_002_institute with enc_rogue_mendeleev preview, plus any future Scientists registered via
  // V.CharacterRegistry.registerScientist()).
  function discoverStudioScientists() {
    const pairs = V.CharacterRegistry && typeof V.CharacterRegistry.listScientistPairs === 'function'
      ? V.CharacterRegistry.listScientistPairs()
      : [];
    const map = {};
    for (const p of pairs) {
      const fMan = p.frontierManifest || (p.frontierId && V.CharacterRig ? V.CharacterRig.getCharacterManifest(p.frontierId) : null);
      const iMan = p.instituteManifest || (p.instituteId && V.CharacterRig ? V.CharacterRig.getCharacterManifest(p.instituteId) : null);
      if (!fMan && !iMan) continue;
      map[p.key] = {
        key: p.key,
        shortLabel: p.shortLabel || p.fullName || p.key,
        fullName: p.fullName || (fMan && fMan.displayName) || (iMan && iMan.displayName) || p.key,
        frontierId: fMan ? fMan.characterId : null,
        instituteId: iMan ? iMan.characterId : null,
        frontierCode: p.code || (p.key || '').toUpperCase(),
        frontierGen: p.frontierGenLabel || (fMan && fMan.generationStage ? `FRONTIER AI • ${fMan.generationStage}` : 'FRONTIER AI'),
        frontierDesc: (fMan && fMan.personality && fMan.personality.summary) || 'Frontier animated reconstruction',
        instituteDesc: (iMan && iMan.personality && iMan.personality.summary) || 'Institute archival hologram',
        encounterId: p.encounterId || null,
      };
    }
    return map;
  }

  /**
   * Stage 3D.1 / 3E.3 / 3E.4 — Dynamic Character Animation Studio.
   * Dynamically discovers all registered Scientists from V.CharacterRegistry & V.CharacterRig
   * (zero hardcoded character list required for future Scientists). Supports Side-by-Side,
   * Institute-only, and Frontier-only views, all 8 expressions, timed speaking cadence,
   * live contextual battle reaction testing, Reduced/Off modes, 16-layer inspection, and Encounter Intro replay.
   */
  function openPortraitPrototypeStudio(options) {
    if (!V.CharacterRig) return;
    const opts = options || {};
    const fromMenu = opts.origin === 'menu';
    const returnTab = opts.returnTab || activeTab || 'scientists';
    const studioScientists = discoverStudioScientists();
    const availableKeys = Object.keys(studioScientists);
    if (availableKeys.length === 0) return;

    const selectedKey = studioScientists[opts.scientistKey] ? opts.scientistKey : availableKeys[0];
    const sciDef = studioScientists[selectedKey];
    let viewMode = opts.viewMode === 'institute' || opts.viewMode === 'frontier' ? opts.viewMode : 'both';
    if (viewMode === 'frontier' && !sciDef.frontierId) viewMode = 'institute';
    if (viewMode === 'institute' && !sciDef.instituteId) viewMode = 'frontier';
    if (viewMode === 'both' && (!sciDef.frontierId || !sciDef.instituteId)) {
      viewMode = sciDef.frontierId ? 'frontier' : 'institute';
    }

    const frontierManifest = sciDef.frontierId ? V.CharacterRig.getCharacterManifest(sciDef.frontierId) : null;
    const instituteManifest = sciDef.instituteId ? V.CharacterRig.getCharacterManifest(sciDef.instituteId) : null;
    const primaryManifest = frontierManifest || instituteManifest;
    if (!primaryManifest) return;

    const exprEntries = Object.entries(primaryManifest.expressions || {});
    const animMode = V.CharacterRig.getAnimationMode();
    const layers = primaryManifest.requiredLayers || [];
    const hasEncPreview = Boolean(sciDef.encounterId && F.EncounterManager && F.EncounterManager.getEncounterDef && F.EncounterManager.getEncounterDef(sciDef.encounterId));

    const sciTabsHTML = availableKeys
      .map((k) => {
        const s = studioScientists[k];
        return `<button class="poc-motion-btn ${s.key === selectedKey ? 'active' : ''}" data-poc-scientist="${esc(s.key)}">${esc(s.shortLabel)}</button>`;
      })
      .join('');

    const exprButtonsHTML = exprEntries
      .map(([id, spec], idx) => `<button class="ctrl-btn poc-expr-btn ${idx === 0 ? 'active' : ''}" data-poc-expr="${esc(id)}">${esc(spec.label || id)}</button>`)
      .join('');

    const layerCheckboxesHTML = layers
      .map((lid) => `<label class="poc-layer-toggle"><input type="checkbox" checked data-poc-layer="${esc(lid)}" /><span>${esc(lid.replace('layer_', ''))}</span></label>`)
      .join('');

    const mountFrontier = Boolean(sciDef.frontierId && viewMode !== 'institute');
    const mountInstitute = Boolean(sciDef.instituteId && viewMode !== 'frontier');

    const body = `
      <div class="poc-switcher-bar">
        <div class="poc-motion-group" role="group" aria-label="Scientist Selector">${sciTabsHTML}</div>
        <div class="poc-motion-group" role="group" aria-label="Variant View Mode">
          ${sciDef.frontierId && sciDef.instituteId ? `<button class="poc-motion-btn ${viewMode === 'both' ? 'active' : ''}" data-poc-view="both">Side-by-Side</button>` : ''}
          ${sciDef.instituteId ? `<button class="poc-motion-btn ${viewMode === 'institute' ? 'active' : ''}" data-poc-view="institute">Institute</button>` : ''}
          ${sciDef.frontierId ? `<button class="poc-motion-btn ${viewMode === 'frontier' ? 'active' : ''}" data-poc-view="frontier">Frontier</button>` : ''}
        </div>
      </div>

      <div class="poc-stage-sticky">
        <div class="poc-compare-grid ${viewMode !== 'both' ? 'poc-single-view' : ''}">
          <div class="poc-compare-card frontier-card ${mountFrontier ? '' : 'hidden'}">
            <div class="poc-meta-strip">
              <span class="story-badge badge-open">${esc(sciDef.frontierGen)}</span>
              <span class="story-badge badge-diff">${esc(sciDef.frontierCode)}</span>
            </div>
            <div id="poc-rig-frontier"></div>
            <strong style="font-size:13px;">Frontier ${esc(sciDef.fullName.split(' ').slice(-1)[0])}</strong>
            <div class="story-mission-sub">${esc(sciDef.frontierDesc)}</div>
          </div>

          <div class="poc-compare-card institute-card ${mountInstitute ? '' : 'hidden'}">
            <div class="poc-meta-strip">
              <span class="story-badge badge-tier">INSTITUTE AI</span>
              <span class="story-badge badge-done">HOLOGRAM</span>
            </div>
            <div id="poc-rig-institute"></div>
            <strong style="font-size:13px;">Institute ${esc(sciDef.fullName.split(' ').slice(-1)[0])}</strong>
            <div class="story-mission-sub">${esc(sciDef.instituteDesc)}</div>
          </div>
        </div>
      </div>

      <div class="eval-card" style="margin-top:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <div class="poc-expr-status">
            <span>Selected Expression:</span>
            <strong id="poc-active-expr-label">${esc(primaryManifest.expressions.neutral.label || 'Neutral')}</strong>
          </div>
          <div class="poc-motion-group" role="group" aria-label="Animation Motion Mode">
            <button class="poc-motion-btn ${animMode === 'full' ? 'active' : ''}" data-poc-motion="full">Full Motion</button>
            <button class="poc-motion-btn ${animMode === 'reduced' ? 'active' : ''}" data-poc-motion="reduced">Reduced Motion</button>
            <button class="poc-motion-btn ${animMode === 'off' ? 'active' : ''}" data-poc-motion="off">Off</button>
          </div>
        </div>

        <div class="story-section-kicker" style="margin-top:8px;">8 DIALOGUE EXPRESSIONS (LIVE ON ${esc(sciDef.fullName.toUpperCase())})</div>
        <div class="poc-expr-grid" style="margin-top:5px;">${exprButtonsHTML}</div>

        <div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:9px;">
          <button id="btn-poc-reset-idle" class="ctrl-btn">↺ Reset to Idle</button>
          <button id="btn-poc-glitch" class="ctrl-btn">⚡ Reconstruction Instability</button>
          <button id="btn-poc-transition" class="ctrl-btn">🌊 Encounter Transition</button>
          <button id="btn-poc-speak" class="ctrl-btn">💬 Speaking: Off</button>
          <button id="btn-poc-cadence" class="ctrl-btn">🗣 Test Cadence (3s)</button>
          ${hasEncPreview ? '<button id="btn-poc-enc-preview" class="btn-action btn-synth">▶ Replay Encounter Intro &amp; Dialogue</button>' : ''}
          <button id="btn-poc-back-hub" class="ctrl-btn">${fromMenu ? '← Main Menu' : '← Frontier Hub'}</button>
        </div>

        <div class="story-section-kicker" style="margin-top:10px;">CONTEXTUAL BATTLE REACTION TESTER (USES LIVE COOLDOWN &amp; DEDUP EVALUATOR)</div>
        <div class="poc-reaction-row" style="margin-top:5px;">
          <button class="ctrl-btn" data-poc-react="player_synth_big">⚔ Player Synth (+14 SP)</button>
          <button class="ctrl-btn" data-poc-react="opp_pillar">🛡 Own Pillar (+12 SP)</button>
          <button class="ctrl-btn" data-poc-react="hostile_hit">⚡ Disrupted (Acid Rain)</button>
          <button class="ctrl-btn" data-poc-react="major_swing">📉 Major Swing (18 vs 8 SP)</button>
          <span id="poc-react-status" style="font-size:11.5px;color:#94a3b8;">Ready</span>
        </div>
      </div>

      <details class="eval-card poc-layer-details" style="margin-top:8px;">
        <summary>🧩 16-Layer Unflattened Source Inspector (click to toggle layers live)</summary>
        <div class="story-mission-sub" style="margin-top:5px;">Toggle individual facial, hair, beard, clothing, and crystalline layers to verify unflattened rigging separation and continuous under-paint.</div>
        <div class="poc-layer-grid">${layerCheckboxesHTML}</div>
      </details>
    `;

    V.UI.openModal(`🎭 Character Animation Studio — ${sciDef.fullName}`, body, (root) => {
      const elFront = root.querySelector('#poc-rig-frontier');
      const elInst = root.querySelector('#poc-rig-institute');
      const exprLabelEl = root.querySelector('#poc-active-expr-label');
      const reactStatusEl = root.querySelector('#poc-react-status');
      const rigFrontier = mountFrontier
        ? V.CharacterRig.mount(elFront, {
            characterId: sciDef.frontierId,
            size: 'card',
            expression: 'neutral',
            autoplayTransition: true,
          })
        : null;
      const rigInstitute = mountInstitute
        ? V.CharacterRig.mount(elInst, {
            characterId: sciDef.instituteId,
            size: 'card',
            expression: 'neutral',
          })
        : null;

      let speaking = false;
      let reactResetTimer = null;
      let reactStateFront = { battleStartTs: 0, lastReactionTs: 0, lastReactionExpr: 'neutral', lastGlitchTs: 0, prevPlayerSP: 4, prevOppSP: 10 };
      let reactStateInst = { battleStartTs: 0, lastReactionTs: 0, lastReactionExpr: 'neutral', lastGlitchTs: 0, prevPlayerSP: 4, prevOppSP: 10 };

      function cleanup() {
        if (reactResetTimer) {
          clearTimeout(reactResetTimer);
          reactResetTimer = null;
        }
        if (rigFrontier) rigFrontier.destroy();
        if (rigInstitute) rigInstitute.destroy();
      }

      function selectExpression(exprId) {
        const spec = (primaryManifest.expressions && primaryManifest.expressions[exprId]) || { label: exprId };
        if (exprLabelEl) exprLabelEl.textContent = spec.label || exprId;
        root.querySelectorAll('[data-poc-expr]').forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-poc-expr') === exprId);
        });
        if (rigFrontier) rigFrontier.setExpression(exprId);
        if (rigInstitute) rigInstitute.setExpression(exprId);
      }

      // Scientist switcher & variant view toggles
      root.querySelectorAll('[data-poc-scientist]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const nextKey = btn.getAttribute('data-poc-scientist');
          if (nextKey === selectedKey) return;
          cleanup();
          openPortraitPrototypeStudio(Object.assign({}, opts, { scientistKey: nextKey, viewMode }));
        });
      });

      root.querySelectorAll('[data-poc-view]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const nextView = btn.getAttribute('data-poc-view');
          if (nextView === viewMode) return;
          cleanup();
          openPortraitPrototypeStudio(Object.assign({}, opts, { scientistKey: selectedKey, viewMode: nextView }));
        });
      });

      root.querySelectorAll('[data-poc-expr]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const expr = btn.getAttribute('data-poc-expr');
          selectExpression(expr);
          if (expr === 'instability' && rigFrontier) rigFrontier.triggerReconstructionGlitch();
        });
      });

      root.querySelector('#btn-poc-reset-idle').addEventListener('click', () => {
        speaking = false;
        if (reactResetTimer) {
          clearTimeout(reactResetTimer);
          reactResetTimer = null;
        }
        const sBtn = root.querySelector('#btn-poc-speak');
        if (sBtn) sBtn.textContent = '💬 Speaking: Off';
        if (rigFrontier) rigFrontier.setSpeaking(false);
        if (rigInstitute) rigInstitute.setSpeaking(false);
        if (reactStatusEl) reactStatusEl.textContent = 'Idle';
        selectExpression('neutral');
      });

      root.querySelector('#btn-poc-transition').addEventListener('click', () => {
        if (rigFrontier) rigFrontier.triggerEncounterTransition();
        if (rigInstitute) rigInstitute.triggerEncounterTransition();
      });

      root.querySelector('#btn-poc-glitch').addEventListener('click', () => {
        selectExpression('instability');
        if (rigFrontier) rigFrontier.triggerReconstructionGlitch();
      });

      const speakBtn = root.querySelector('#btn-poc-speak');
      speakBtn.addEventListener('click', () => {
        speaking = !speaking;
        speakBtn.textContent = speaking ? '💬 Speaking: On' : '💬 Speaking: Off';
        if (rigFrontier) rigFrontier.setSpeaking(speaking);
        if (rigInstitute) rigInstitute.setSpeaking(speaking);
      });

      const cadenceBtn = root.querySelector('#btn-poc-cadence');
      if (cadenceBtn) {
        cadenceBtn.addEventListener('click', () => {
          speaking = true;
          speakBtn.textContent = '💬 Speaking: On';
          if (rigFrontier && rigFrontier.speakForDuration) {
            rigFrontier.speakForDuration(3000, () => {
              speaking = false;
              speakBtn.textContent = '💬 Speaking: Off';
            });
          }
          if (rigInstitute && rigInstitute.speakForDuration) {
            rigInstitute.speakForDuration(3000);
          }
        });
      }

      // Live Contextual Battle Reaction Tester (uses canonical V.evaluateBattlePortraitReaction)
      const REACTION_SCENARIOS = {
        player_synth_big: { batch: [{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 14 } }], playerSP: 14, oppSP: 10 },
        opp_pillar: { batch: [{ meta: { type: 'SYNTHESIZE', playerId: 1, sp: 12 } }], playerSP: 8, oppSP: 14 },
        hostile_hit: { batch: [{ meta: { type: 'ACID_RAIN', playerId: 0, victimId: 1, lostSP: 4 } }], playerSP: 10, oppSP: 6 },
        major_swing: { batch: [{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 8 } }], playerSP: 18, oppSP: 8 },
      };
      root.querySelectorAll('[data-poc-react]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const sc = REACTION_SCENARIOS[btn.getAttribute('data-poc-react')];
          if (!sc || !V.evaluateBattlePortraitReaction) return;
          const now = Date.now();
          const resF = frontierManifest
            ? V.evaluateBattlePortraitReaction(sc.batch, {
                now, aiFamily: 'FRONTIER', characterId: sciDef.frontierId, manifest: frontierManifest, playerSP: sc.playerSP, oppSP: sc.oppSP, reactionState: reactStateFront,
              })
            : { action: 'none', nextState: reactStateFront };
          const resI = instituteManifest
            ? V.evaluateBattlePortraitReaction(sc.batch, {
                now, aiFamily: 'INSTITUTE', characterId: sciDef.instituteId, manifest: instituteManifest, playerSP: sc.playerSP, oppSP: sc.oppSP, reactionState: reactStateInst,
              })
            : { action: 'none', nextState: reactStateInst };
          reactStateFront = resF.nextState;
          reactStateInst = resI.nextState;

          const fLabel = !frontierManifest ? 'n/a' : (resF.action === 'react' ? resF.expression : `cooldown(${resF.reason || 'wait'})`);
          const iLabel = !instituteManifest ? 'n/a' : (resI.action === 'react' ? resI.expression : `cooldown(${resI.reason || 'wait'})`);
          if (reactStatusEl) reactStatusEl.textContent = `Frontier → ${fLabel} | Institute → ${iLabel}`;

          if (resF.action === 'react' && rigFrontier) {
            rigFrontier.setExpression(resF.expression);
            if (resF.triggerGlitch) rigFrontier.triggerReconstructionGlitch();
          }
          if (resI.action === 'react' && rigInstitute) {
            rigInstitute.setExpression(resI.expression);
          }
          if (resF.action === 'react' || resI.action === 'react') {
            if (reactResetTimer) clearTimeout(reactResetTimer);
            reactResetTimer = setTimeout(() => {
              if (rigFrontier && !rigFrontier.destroyed) rigFrontier.setExpression('neutral');
              if (rigInstitute && !rigInstitute.destroyed) rigInstitute.setExpression('neutral');
              if (reactStatusEl) reactStatusEl.textContent = 'Returned to neutral idle';
            }, 2600);
          }
        });
      });

      root.querySelectorAll('[data-poc-motion]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const nextMode = btn.getAttribute('data-poc-motion');
          V.CharacterRig.setAnimationMode(nextMode);
          root.querySelectorAll('[data-poc-motion]').forEach((b) => {
            b.classList.toggle('active', b.getAttribute('data-poc-motion') === nextMode);
          });
        });
      });

      root.querySelectorAll('[data-poc-layer]').forEach((cb) => {
        cb.addEventListener('change', () => {
          const lid = cb.getAttribute('data-poc-layer');
          if (rigFrontier) rigFrontier.setLayerVisibility(lid, cb.checked);
          if (rigInstitute) rigInstitute.setLayerVisibility(lid, cb.checked);
        });
      });

      const encPreviewBtn = root.querySelector('#btn-poc-enc-preview');
      if (encPreviewBtn && sciDef.encounterId) {
        encPreviewBtn.addEventListener('click', () => {
          cleanup();
          openFrontierEncounterIntro(sciDef.encounterId, {
            previewOnly: true,
            returnToStudio: true,
            studioOriginOpts: Object.assign({}, opts, { scientistKey: selectedKey, viewMode }),
          });
        });
      }

      root.querySelector('#btn-poc-back-hub').addEventListener('click', () => {
        cleanup();
        if (fromMenu) V.UI.closeModal();
        else openFrontierHub(returnTab, '');
      });

      return cleanup;
    }, {
      visualScene: 'frontier_laboratory',
    });
  }

  V.FrontierUI = {
    openFrontierHub,
    handleFrontierEncounterComplete,
    openFrontierEncounterIntro,
    openPortraitPrototypeStudio,
  };
})(typeof window !== 'undefined' ? window : globalThis);
