// VALENCY — Stage 3D.2 / 3E.4 Centralized Opponent & Scientist Character Registry
// Resolves animated portraits strictly from canonical encounterId / opponentEntityId / storyMissionId
// (never fragile display-name matching). Supports data-driven multi-Scientist onboarding, duplicate
// alias detection, missing-asset validation, and dynamic Studio Scientist discovery.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const BY_ENCOUNTER_ID = {
    enc_rogue_lavoisier: 'sci_lav_001_frontier',
    enc_rogue_mendeleev: 'sci_men_002_frontier',
  };

  const BY_OPPONENT_ENTITY_ID = {
    opp_entity_rogue_lavoisier: 'sci_lav_001_frontier',
    opp_entity_rogue_mendeleev: 'sci_men_002_frontier',
  };

  const BY_STORY_MISSION_ID = {
    ch0_m2_lavoisier: 'sci_lav_001_institute',
    ch0_m3_mendeleev: 'sci_men_002_institute',
  };

  // Data-driven Scientist roster pairs used by Character Animation Studio & Frontier UIs.
  // Adding a new Scientist via registerScientist() automatically surfaces them in Studio & Registry.
  const SCIENTIST_ROSTER = {
    lavoisier: {
      key: 'lavoisier',
      code: 'SCI-LAV-001',
      fullName: 'Antoine Lavoisier',
      shortLabel: 'Lavoisier (SCI-LAV-001)',
      frontierId: 'sci_lav_001_frontier',
      instituteId: 'sci_lav_001_institute',
      frontierGenLabel: 'FRONTIER AI • GEN 1',
      encounterId: 'enc_rogue_lavoisier',
      storyMissionId: 'ch0_m2_lavoisier',
      staticFallbackRef: 'lavoisier',
    },
    mendeleev: {
      key: 'mendeleev',
      code: 'SCI-MEN-002',
      fullName: 'Dmitri Mendeleev',
      shortLabel: 'Mendeleev (SCI-MEN-002)',
      frontierId: 'sci_men_002_frontier',
      instituteId: 'sci_men_002_institute',
      frontierGenLabel: 'FRONTIER AI • GEN 2',
      encounterId: 'enc_rogue_mendeleev',
      storyMissionId: 'ch0_m3_mendeleev',
      staticFallbackRef: 'mendeleev',
    },
  };

  const aliasDiagnostics = [];

  function recordAliasCollision(bucketName, aliasKey, existingId, nextId) {
    if (existingId && existingId !== nextId) {
      aliasDiagnostics.push(`Duplicate ${bucketName} alias "${aliasKey}": replaced "${existingId}" with "${nextId}"`);
    }
  }

  function registerOpponentMapping(mapping, options) {
    const opts = options || {};
    if (!mapping || !mapping.characterId || typeof mapping.characterId !== 'string') return false;
    const cid = mapping.characterId;
    const encList = [].concat(mapping.encounterId || [], mapping.encounterIds || []).filter(Boolean);
    const oppList = [].concat(mapping.opponentEntityId || [], mapping.opponentEntityIds || []).filter(Boolean);
    const misList = [].concat(mapping.storyMissionId || [], mapping.storyMissionIds || []).filter(Boolean);

    for (const k of encList) {
      if (BY_ENCOUNTER_ID[k] && BY_ENCOUNTER_ID[k] !== cid && !opts.overwrite) {
        recordAliasCollision('encounterId', k, BY_ENCOUNTER_ID[k], cid);
        continue;
      }
      BY_ENCOUNTER_ID[k] = cid;
    }
    for (const k of oppList) {
      if (BY_OPPONENT_ENTITY_ID[k] && BY_OPPONENT_ENTITY_ID[k] !== cid && !opts.overwrite) {
        recordAliasCollision('opponentEntityId', k, BY_OPPONENT_ENTITY_ID[k], cid);
        continue;
      }
      BY_OPPONENT_ENTITY_ID[k] = cid;
    }
    for (const k of misList) {
      if (BY_STORY_MISSION_ID[k] && BY_STORY_MISSION_ID[k] !== cid && !opts.overwrite) {
        recordAliasCollision('storyMissionId', k, BY_STORY_MISSION_ID[k], cid);
        continue;
      }
      BY_STORY_MISSION_ID[k] = cid;
    }
    return true;
  }

  /**
   * Centralized data-driven Scientist registration (Stage 3E.4).
   * Registers Frontier/Institute manifests (if supplied), encounter/mission aliases,
   * visualTheme asset entries, and Studio roster metadata in a single declarative call.
   */
  function registerScientist(def, options) {
    if (!def || typeof def !== 'object' || !def.key) {
      return { ok: false, errors: ['Scientist definition requires a non-empty key'] };
    }
    const opts = options || {};
    const errors = [];
    if (SCIENTIST_ROSTER[def.key] && !opts.overwrite) {
      errors.push(`Duplicate Scientist roster key "${def.key}" (pass { overwrite: true } to replace)`);
      return { ok: false, errors };
    }

    if (def.frontierManifest && V.CharacterRig && V.CharacterRig.registerCharacter) {
      const regF = V.CharacterRig.registerCharacter(def.frontierId || def.frontierManifest.characterId, def.frontierManifest, opts);
      if (!regF) errors.push(`Failed to register frontier manifest for "${def.key}"`);
    }
    if (def.instituteManifest && V.CharacterRig && V.CharacterRig.registerCharacter) {
      const regI = V.CharacterRig.registerCharacter(def.instituteId || def.instituteManifest.characterId, def.instituteManifest, opts);
      if (!regI) errors.push(`Failed to register institute manifest for "${def.key}"`);
    }
    if (errors.length > 0) return { ok: false, errors };

    const frontierId = def.frontierId || (def.frontierManifest && def.frontierManifest.characterId) || null;
    const instituteId = def.instituteId || (def.instituteManifest && def.instituteManifest.characterId) || null;

    if (frontierId) {
      registerOpponentMapping({
        characterId: frontierId,
        encounterId: def.encounterId,
        encounterIds: def.encounterIds,
        opponentEntityId: def.opponentEntityId,
        opponentEntityIds: def.opponentEntityIds,
      }, opts);
    }
    if (instituteId) {
      registerOpponentMapping({
        characterId: instituteId,
        storyMissionId: def.storyMissionId,
        storyMissionIds: def.storyMissionIds,
      }, opts);
    }

    SCIENTIST_ROSTER[def.key] = {
      key: def.key,
      code: def.code || def.key.toUpperCase(),
      fullName: def.fullName || def.key,
      shortLabel: def.shortLabel || `${def.fullName || def.key} (${def.code || def.key.toUpperCase()})`,
      frontierId,
      instituteId,
      frontierGenLabel: def.frontierGenLabel || 'FRONTIER AI',
      encounterId: def.encounterId || (Array.isArray(def.encounterIds) ? def.encounterIds[0] : null) || null,
      storyMissionId: def.storyMissionId || (Array.isArray(def.storyMissionIds) ? def.storyMissionIds[0] : null) || null,
      staticFallbackRef: def.staticFallbackRef || def.key,
    };

    return { ok: true, entry: SCIENTIST_ROSTER[def.key], errors: [] };
  }

  function listScientistPairs() {
    const out = [];
    const seenIds = new Set();
    for (const entry of Object.values(SCIENTIST_ROSTER)) {
      const fMan = entry.frontierId && V.CharacterRig ? V.CharacterRig.getCharacterManifest(entry.frontierId) : null;
      const iMan = entry.instituteId && V.CharacterRig ? V.CharacterRig.getCharacterManifest(entry.instituteId) : null;
      if (!fMan && !iMan) continue;
      if (entry.frontierId) seenIds.add(entry.frontierId);
      if (entry.instituteId) seenIds.add(entry.instituteId);
      out.push(Object.assign({}, entry, {
        frontierManifest: fMan,
        instituteManifest: iMan,
      }));
    }

    // Auto-discover any standalone characters registered directly on V.CharacterRig outside SCIENTIST_ROSTER
    if (V.CharacterRig && typeof V.CharacterRig.listCharacters === 'function') {
      const extraByBase = {};
      for (const man of V.CharacterRig.listCharacters()) {
        if (!man || !man.characterId || seenIds.has(man.characterId)) continue;
        const baseKey = man.characterId.replace(/_(frontier|institute)$/i, '');
        if (!extraByBase[baseKey]) {
          extraByBase[baseKey] = {
            key: baseKey,
            code: baseKey.toUpperCase().replace(/_/g, '-'),
            fullName: (man.displayName || baseKey).replace(/\s*\(Institute Hologram\)$/i, ''),
            shortLabel: man.displayName || baseKey,
            frontierId: null,
            instituteId: null,
            frontierGenLabel: `FRONTIER AI • ${man.generationStage || 'CONSTRUCT'}`,
            encounterId: null,
            storyMissionId: null,
            staticFallbackRef: baseKey,
            frontierManifest: null,
            instituteManifest: null,
          };
        }
        if (man.aiFamily === 'FRONTIER') {
          extraByBase[baseKey].frontierId = man.characterId;
          extraByBase[baseKey].frontierManifest = man;
        } else {
          extraByBase[baseKey].instituteId = man.characterId;
          extraByBase[baseKey].instituteManifest = man;
        }
      }
      for (const ex of Object.values(extraByBase)) out.push(ex);
    }

    return out;
  }

  function hasAnimatedCharacterForScientist(scientistKey) {
    if (!scientistKey) return false;
    return listScientistPairs().some((p) => p.key === scientistKey);
  }

  function validateRegistry() {
    const errors = [];
    const warnings = aliasDiagnostics.slice();
    const missingCharacterIds = [];
    const missingSvgSources = [];

    const allMappings = [
      ...Object.entries(BY_ENCOUNTER_ID).map(([k, v]) => ({ bucket: 'encounterId', key: k, characterId: v })),
      ...Object.entries(BY_OPPONENT_ENTITY_ID).map(([k, v]) => ({ bucket: 'opponentEntityId', key: k, characterId: v })),
      ...Object.entries(BY_STORY_MISSION_ID).map(([k, v]) => ({ bucket: 'storyMissionId', key: k, characterId: v })),
    ];

    for (const m of allMappings) {
      const man = V.CharacterRig ? V.CharacterRig.getCharacterManifest(m.characterId) : null;
      if (!man) {
        missingCharacterIds.push(`${m.bucket}:${m.key}->${m.characterId}`);
        errors.push(`Mapped ${m.bucket} "${m.key}" references unregistered characterId "${m.characterId}"`);
      } else if (V.CHARACTER_SVG_SOURCES && man.sourceAsset && !V.CHARACTER_SVG_SOURCES[man.sourceAsset]) {
        missingSvgSources.push(`${m.characterId}:${man.sourceAsset}`);
        warnings.push(`Character "${m.characterId}" sourceAsset "${man.sourceAsset}" is not pre-indexed in CHARACTER_SVG_SOURCES (HTTP fetch fallback required)`);
      }
    }

    if (V.CharacterRig && typeof V.CharacterRig.listCharacters === 'function' && typeof V.CharacterRig.validateManifest === 'function') {
      for (const man of V.CharacterRig.listCharacters()) {
        const check = V.CharacterRig.validateManifest(man);
        if (!check.valid) {
          for (const e of check.errors) errors.push(`${man.characterId}: ${e}`);
        }
        for (const w of check.warnings) warnings.push(`${man.characterId}: ${w}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      duplicateAliases: aliasDiagnostics.slice(),
      missingCharacterIds,
      missingSvgSources,
      characterCount: V.CharacterRig && V.CharacterRig.listCharacters ? V.CharacterRig.listCharacters().length : 0,
      scientistPairCount: listScientistPairs().length,
    };
  }

  function getAliasDiagnostics() {
    return aliasDiagnostics.slice();
  }

  function resolveCharacterId(context) {
    if (!context) return null;
    if (context.encounterId && BY_ENCOUNTER_ID[context.encounterId]) {
      return BY_ENCOUNTER_ID[context.encounterId];
    }
    if (context.opponentEntityId && BY_OPPONENT_ENTITY_ID[context.opponentEntityId]) {
      return BY_OPPONENT_ENTITY_ID[context.opponentEntityId];
    }
    if (context.storyMissionId && BY_STORY_MISSION_ID[context.storyMissionId]) {
      return BY_STORY_MISSION_ID[context.storyMissionId];
    }
    if (context.animatedPortraitId && V.CharacterRig && V.CharacterRig.getCharacterManifest(context.animatedPortraitId)) {
      return context.animatedPortraitId;
    }
    return null;
  }

  function resolveForBattleState(state) {
    if (!state) return null;
    const opp = state.players && state.players[1] ? state.players[1] : null;
    const encounterId = state.encounterMeta && state.encounterMeta.encounterId ? state.encounterMeta.encounterId : null;
    const opponentEntityId = opp && opp.entityId ? opp.entityId : null;
    const storyMissionId = state.storyMissionId || null;
    const explicitId = state.storyOpponentMeta && state.storyOpponentMeta.animatedPortraitId ? state.storyOpponentMeta.animatedPortraitId : null;

    const characterId = resolveCharacterId({
      encounterId,
      opponentEntityId,
      storyMissionId,
      animatedPortraitId: explicitId,
    });
    if (!characterId) return null;
    const manifest = V.CharacterRig ? V.CharacterRig.getCharacterManifest(characterId) : null;
    if (!manifest) return null;
    return { characterId, manifest };
  }

  function listMappings() {
    return {
      byEncounterId: Object.assign({}, BY_ENCOUNTER_ID),
      byOpponentEntityId: Object.assign({}, BY_OPPONENT_ENTITY_ID),
      byStoryMissionId: Object.assign({}, BY_STORY_MISSION_ID),
    };
  }

  V.CharacterRegistry = {
    registerOpponentMapping,
    registerScientist,
    listScientistPairs,
    hasAnimatedCharacterForScientist,
    validateRegistry,
    getAliasDiagnostics,
    resolveCharacterId,
    resolveForBattleState,
    listMappings,
  };
})(typeof window !== 'undefined' ? window : globalThis);
