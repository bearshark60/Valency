// VALENCY: THE ELEMENTAL FRONTIER — Phase 5: Persistent World & Regional Exploration Manager
// Manages regions, connected locations, safe preparation zones, persistent discovery flags,
// points of interest, and expedition entrances.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  const REGIONS = Object.freeze({
    region_caloric_basin: Object.freeze({
      regionId: 'region_caloric_basin',
      name: 'Sector 01: The Caloric Basin',
      subtitle: 'Territory of the Rogue Lavoisier Construct',
      description:
        'An arid geothermal research basin where Academy telemetry first detected stable oxide and hydride molecules spontaneously slipping into unstable states.',
      scientistTerritoryId: 'lavoisier',
      locationIds: ['loc_hearth_outpost', 'loc_caloric_vent', 'loc_archive_ruins', 'loc_lavoisier_rift'],
      availableRoutes: [
        { routeId: 'route_hearth_to_vent', from: 'loc_hearth_outpost', to: 'loc_caloric_vent', bidirectional: true },
        { routeId: 'route_vent_to_ruins', from: 'loc_caloric_vent', to: 'loc_archive_ruins', bidirectional: true },
        { routeId: 'route_vent_to_rift', from: 'loc_caloric_vent', to: 'loc_lavoisier_rift', bidirectional: true },
        { routeId: 'route_ruins_to_rift', from: 'loc_archive_ruins', to: 'loc_lavoisier_rift', bidirectional: true },
      ],
      encounterIds: ['enc_caloric_sentinel', 'enc_rogue_lavoisier'],
    }),
  });

  const LOCATIONS = Object.freeze({
    loc_hearth_outpost: Object.freeze({
      locationId: 'loc_hearth_outpost',
      regionId: 'region_caloric_basin',
      name: 'Hearth Settlement & Field Lab',
      type: 'settlement',
      isSafeZone: true, // Designated preparation zone: equip Scientists, edit Deck, spend Research Data
      description:
        'A fortified Frontier staging settlement equipped with clean calibration benches. Manage your permanent Collection, equip recovered Scientists, and review Convergence evidence here.',
      interactions: [
        {
          interactionId: 'int_hearth_briefing',
          label: 'Inspect Sector 01 Sensor Array',
          description: 'Review initial Frontier sensor readouts pointing toward the Caloric Thermal Vent.',
          unlocksLocations: ['loc_caloric_vent'],
          unlocksRoutes: ['route_hearth_to_vent'],
        },
      ],
      expeditionId: null,
    }),

    loc_caloric_vent: Object.freeze({
      locationId: 'loc_caloric_vent',
      regionId: 'region_caloric_basin',
      name: 'Caloric Thermal Vent',
      type: 'anomaly',
      isSafeZone: false,
      description:
        'Steam vents crusted with partially dissociated oxides. Field spectrographs record spontaneous unbonding events radiating deeper into the basin.',
      interactions: [
        {
          interactionId: 'int_scan_vent_anomaly',
          label: 'Sample Spontaneous Unbonding Anomaly',
          description: 'Collect Scientific Evidence and triangulate routes to the Relay Ruins and Conservation Crucible.',
          evidenceId: 'ev_sci_caloric_drift',
          unlocksLocations: ['loc_archive_ruins', 'loc_lavoisier_rift'],
          unlocksRoutes: ['route_vent_to_ruins', 'route_vent_to_rift'],
          storyFlag: 'caloricAnomalyInvestigated',
          permanentReward: {
            rewardKey: 'world_vent_scan_data',
            persistenceClass: 'PERMANENT',
            currencies: { researchData: 15 },
          },
        },
      ],
      expeditionId: null,
    }),

    loc_archive_ruins: Object.freeze({
      locationId: 'loc_archive_ruins',
      regionId: 'region_caloric_basin',
      name: 'Convergence Relay Station',
      type: 'laboratory',
      isSafeZone: false,
      description:
        'An abandoned Convergence Project telemetry relay. Cracked magnetic tapes and encrypted construct handshakes still pulse inside its shielded vault.',
      interactions: [
        {
          interactionId: 'int_recover_convergence_log',
          label: 'Decrypt Convergence Relay Archive',
          description: 'Recover Historical Evidence of the Convergence Project and Intelligence Evidence on the rogue Lavoisier construct.',
          evidenceIds: ['ev_hist_convergence_charter', 'ev_intel_lavoisier_beacon'],
          unlocksLocations: ['loc_lavoisier_rift'],
          unlocksRoutes: ['route_ruins_to_rift'],
          permanentReward: {
            rewardKey: 'world_relay_decrypt_reward',
            persistenceClass: 'PERMANENT',
            currencies: { researchData: 20, reagentCredits: 40 },
          },
        },
      ],
      expeditionId: null,
    }),

    loc_lavoisier_rift: Object.freeze({
      locationId: 'loc_lavoisier_rift',
      regionId: 'region_caloric_basin',
      name: 'The Conservation Crucible',
      type: 'expedition_entrance',
      isSafeZone: false,
      description:
        'A sealed caldera laboratory broadcasting rogue stoichiometry overrides. Entering launches a multi-node Frontier Expedition to confront and recover the Rogue Lavoisier Construct.',
      interactions: [],
      expeditionId: 'exp_caloric_crucible',
    }),
  });

  function getRegion(regionId) {
    return REGIONS[regionId] || null;
  }

  function listRegions() {
    return Object.values(REGIONS);
  }

  function getLocation(locationId) {
    return LOCATIONS[locationId] || null;
  }

  function isSafePreparationLocation(locationId) {
    const loc = getLocation(locationId);
    return Boolean(loc && loc.isSafeZone);
  }

  function discoverLocation(profile, locationId) {
    const loc = getLocation(locationId);
    if (!loc) return false;
    profile.discoveredLocations = profile.discoveredLocations || [];
    profile.discoveredRegions = profile.discoveredRegions || [];
    let newlyDiscovered = false;
    if (!profile.discoveredRegions.includes(loc.regionId)) {
      profile.discoveredRegions.push(loc.regionId);
    }
    if (!profile.discoveredLocations.includes(locationId)) {
      profile.discoveredLocations.push(locationId);
      newlyDiscovered = true;
    }
    return newlyDiscovered;
  }

  function unlockRoute(profile, routeId) {
    profile.unlockedRoutes = profile.unlockedRoutes || [];
    if (!profile.unlockedRoutes.includes(routeId)) {
      profile.unlockedRoutes.push(routeId);
      return true;
    }
    return false;
  }

  /**
   * Return all connected locations reachable from the player's current location via unlocked routes.
   */
  function getReachableLocations(profile) {
    const region = getRegion(profile.currentRegionId || 'region_caloric_basin');
    if (!region) return [];
    const cur = profile.currentLocationId;
    const unlocked = new Set(profile.unlockedRoutes || []);
    const reachableIds = new Set();

    for (const r of region.availableRoutes) {
      if (!unlocked.has(r.routeId)) continue;
      if (r.from === cur) reachableIds.add(r.to);
      if (r.bidirectional && r.to === cur) reachableIds.add(r.from);
    }
    // Also allow fast travel back to any already-discovered location in the same connected region
    for (const discId of profile.discoveredLocations || []) {
      const loc = getLocation(discId);
      if (loc && loc.regionId === region.regionId && discId !== cur) {
        reachableIds.add(discId);
      }
    }

    return Array.from(reachableIds).map(getLocation).filter(Boolean);
  }

  function travelToLocation(profile, targetLocationId, activeExpedition) {
    if (activeExpedition && activeExpedition.expeditionStatus === 'ACTIVE') {
      return { ok: false, error: 'Cannot travel across regional map while an expedition is active.' };
    }
    const target = getLocation(targetLocationId);
    if (!target) return { ok: false, error: `Unknown location: ${targetLocationId}` };
    const reachable = getReachableLocations(profile);
    if (targetLocationId !== profile.currentLocationId && !reachable.some((l) => l.locationId === targetLocationId)) {
      return { ok: false, error: `Route to ${target.name} has not been discovered yet.` };
    }
    profile.currentRegionId = target.regionId;
    profile.currentLocationId = targetLocationId;
    const newlyDiscovered = discoverLocation(profile, targetLocationId);
    F.PlayerProfile.saveProfile(profile);
    return { ok: true, location: target, newlyDiscovered };
  }

  function interactAtCurrentLocation(profile, interactionId) {
    const loc = getLocation(profile.currentLocationId);
    if (!loc) return { ok: false, error: 'Invalid current location.' };
    const inter = (loc.interactions || []).find((i) => i.interactionId === interactionId);
    if (!inter) return { ok: false, error: `Interaction not found at ${loc.name}.` };

    const discoveredNow = [];
    for (const locId of inter.unlocksLocations || []) {
      if (discoverLocation(profile, locId)) discoveredNow.push(locId);
    }
    for (const rId of inter.unlocksRoutes || []) {
      unlockRoute(profile, rId);
    }
    if (inter.storyFlag) {
      profile.storyFlags = profile.storyFlags || {};
      profile.storyFlags[inter.storyFlag] = true;
    }

    const evidenceNow = [];
    const evList = [...(inter.evidenceId ? [inter.evidenceId] : []), ...(inter.evidenceIds || [])];
    if (F.InvestigationManager && F.InvestigationManager.recordEvidence) {
      for (const evId of evList) {
        const evRes = F.InvestigationManager.recordEvidence(profile, evId, loc.locationId);
        if (evRes.ok && evRes.newlyDiscovered) evidenceNow.push(evId);
      }
    }

    let rewardResult = null;
    if (inter.permanentReward && F.RewardProcessor) {
      rewardResult = F.RewardProcessor.processReward(profile, null, inter.permanentReward);
    }

    const saved = F.PlayerProfile.saveProfile(profile);
    return {
      ok: true,
      profile: saved,
      discoveredNow,
      evidenceNow,
      rewardResult,
    };
  }

  F.REGIONS = REGIONS;
  F.LOCATIONS = LOCATIONS;
  F.WorldManager = {
    getRegion,
    listRegions,
    getLocation,
    isSafePreparationLocation,
    discoverLocation,
    unlockRoute,
    getReachableLocations,
    travelToLocation,
    interactAtCurrentLocation,
  };
})(typeof window !== 'undefined' ? window : globalThis);
