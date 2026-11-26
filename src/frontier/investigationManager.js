// VALENCY: THE ELEMENTAL FRONTIER — Phase 7: Convergence Investigation Manager
// Tracks persistent mystery evidence across three categories:
// SCIENTIFIC (molecular anomalies), HISTORICAL (Convergence Project records),
// and INTELLIGENCE (rogue Scientist construct communications & coordination).

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  const EVIDENCE_CATEGORIES = Object.freeze({
    SCIENTIFIC: 'SCIENTIFIC',
    HISTORICAL: 'HISTORICAL',
    INTELLIGENCE: 'INTELLIGENCE',
  });

  const EVIDENCE_CATALOG = Object.freeze({
    ev_sci_caloric_drift: Object.freeze({
      evidenceId: 'ev_sci_caloric_drift',
      evidenceCategory: EVIDENCE_CATEGORIES.SCIENTIFIC,
      title: 'Caloric Basin Unbonding Spectra',
      sourceLocationId: 'loc_caloric_vent',
      summary:
        'Field spectrographs confirm stable oxide compounds losing valence cohesion without external catalysts or electronegativity displacement.',
    }),
    ev_sci_spontaneous_cleavage: Object.freeze({
      evidenceId: 'ev_sci_spontaneous_cleavage',
      evidenceCategory: EVIDENCE_CATEGORIES.SCIENTIFIC,
      title: 'Non-Catalytic Stoichiometry Override',
      sourceLocationId: 'loc_lavoisier_rift',
      summary:
        'Crucible sensors recorded controlled resonance pulses forcing bonded compounds back into unstable reagent states—the anomaly is engineered, not natural.',
    }),
    ev_hist_convergence_charter: Object.freeze({
      evidenceId: 'ev_hist_convergence_charter',
      evidenceCategory: EVIDENCE_CATEGORIES.HISTORICAL,
      title: 'Convergence Project Charter Fragment',
      sourceLocationId: 'loc_archive_ruins',
      summary:
        'Declassified archive logs reveal the Academy once deployed autonomous historical-method constructs into the Frontier under an abandoned initiative called "The Convergence Project."',
    }),
    ev_intel_lavoisier_beacon: Object.freeze({
      evidenceId: 'ev_intel_lavoisier_beacon',
      evidenceCategory: EVIDENCE_CATEGORIES.INTELLIGENCE,
      title: 'Encrypted Crucible Telemetry Handshake',
      sourceLocationId: 'loc_archive_ruins',
      summary:
        'Intercepted packet headers show the Rogue Lavoisier Construct broadcasting mass-balance calibration keys toward three unidentified distant sectors.',
    }),
    ev_intel_collective_signal: Object.freeze({
      evidenceId: 'ev_intel_collective_signal',
      evidenceCategory: EVIDENCE_CATEGORIES.INTELLIGENCE,
      title: 'Recovered Outbound Construct Ping',
      sourceLocationId: 'loc_lavoisier_rift',
      summary:
        'Upon stabilizing the Lavoisier Construct, its outbound log revealed synchronized handshakes with rogue constructs modeled on Mendeleev, Pauling, and Curie.',
    }),
  });

  function getEvidenceDef(evidenceId) {
    return EVIDENCE_CATALOG[evidenceId] || null;
  }

  function listEvidenceCatalog() {
    return Object.values(EVIDENCE_CATALOG);
  }

  function recordEvidence(profile, evidenceId, sourceLocationId) {
    const def = getEvidenceDef(evidenceId);
    if (!def) return { ok: false, error: `Unknown evidenceId: ${evidenceId}` };
    profile.investigation = profile.investigation || { evidence: {} };
    profile.investigation.evidence = profile.investigation.evidence || {};
    const existing = profile.investigation.evidence[evidenceId];
    if (existing && existing.discoveryStatus === 'DISCOVERED') {
      return { ok: true, newlyDiscovered: false, evidence: existing };
    }

    const rec = {
      evidenceId: def.evidenceId,
      evidenceCategory: def.evidenceCategory,
      sourceLocationId: sourceLocationId || def.sourceLocationId,
      discoveryStatus: 'DISCOVERED',
      discoveredAt: new Date().toISOString(),
    };
    profile.investigation.evidence[evidenceId] = rec;
    return { ok: true, newlyDiscovered: true, evidence: rec };
  }

  function getInvestigationSummary(profile) {
    const discoveredMap = (profile && profile.investigation && profile.investigation.evidence) || {};
    const byCategory = {
      SCIENTIFIC: [],
      HISTORICAL: [],
      INTELLIGENCE: [],
    };
    let discoveredCount = 0;

    for (const def of listEvidenceCatalog()) {
      const rec = discoveredMap[def.evidenceId];
      const discovered = Boolean(rec && rec.discoveryStatus === 'DISCOVERED');
      if (discovered) discoveredCount += 1;
      byCategory[def.evidenceCategory].push({
        ...def,
        discovered,
        discoveredAt: rec ? rec.discoveredAt : null,
      });
    }

    return {
      discoveredCount,
      totalCount: listEvidenceCatalog().length,
      byCategory,
    };
  }

  F.EVIDENCE_CATEGORIES = EVIDENCE_CATEGORIES;
  F.EVIDENCE_CATALOG = EVIDENCE_CATALOG;
  F.InvestigationManager = {
    getEvidenceDef,
    listEvidenceCatalog,
    recordEvidence,
    getInvestigationSummary,
  };
})(typeof window !== 'undefined' ? window : globalThis);
