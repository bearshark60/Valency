// VALENCY — Stage 3D.1 Modular 2D Layered Character Portrait Animation Engine
// Strictly decoupled from battle rules (gameEngine.js) and progression state.
// Renderer-agnostic adapter (currently drives 16-layer unflattened SVG rigs; designed to swap
// future Rive / Spine runtimes cleanly via manifest.renderer without modifying UI or gameplay).

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const STORAGE_KEY = 'valency_portrait_anim_v1';
  const VALID_MODES = ['full', 'reduced', 'off'];
  const DEFAULT_EXPRESSIONS = [
    'neutral',
    'thoughtful',
    'amused',
    'explaining',
    'concerned',
    'disappointed',
    'irritated',
    'instability',
  ];

  // Built-in default rig manifests (kept in sync with assets/characters/<id>/rig_manifest.json
  // so synchronous mount & file:// offline mode always work immediately while HTTP loads live SVG layers!)
  const BUILTIN_CHARACTERS = {
    sci_lav_001_frontier: {
      characterId: 'sci_lav_001_frontier',
      displayName: 'Antoine Lavoisier',
      constructTitle: 'Frontier Construct: Antoine Lavoisier',
      aiFamily: 'FRONTIER',
      generationStage: 'GEN_1_INTACT',
      renderer: 'svg_rig',
      sourceAsset: 'assets/characters/sci_lav_001_frontier/master_layered.svg',
      manifestPath: 'assets/characters/sci_lav_001_frontier/rig_manifest.json',
      referenceSheet: 'assets/characters/sci_lav_001_frontier/reference_sheet.svg',
      requiredLayers: [
        'layer_bg', 'layer_hair_rear', 'layer_clothing_rear', 'layer_neck', 'layer_clothing_front',
        'layer_head_base', 'layer_jaw_lower', 'layer_eye_left', 'layer_eye_right',
        'layer_brow_left', 'layer_brow_right', 'layer_nose_detail', 'layer_mouth',
        'layer_hair_front', 'layer_mech_crystal', 'layer_fx_reconstruction',
      ],
      pivots: {
        torso: { x: 448, y: 1180 },
        head: { x: 412, y: 650 },
        jaw: { x: 394, y: 540 },
        eyeLeft: { x: 321, y: 394 },
        eyeRight: { x: 458, y: 392 },
        browLeft: { x: 318, y: 358 },
        browRight: { x: 456, y: 355 },
        mouth: { x: 382, y: 547 },
      },
      personality: {
        archetype: 'Human Reconstruction',
        traits: ['composed', 'intelligent', 'observant', 'deliberate', 'occasionally_unsettling'],
        summary: 'Organic irregular breathing, dwell-and-shift head composure with occasional subtle self-corrections, observant independent eye saccades, subtle asymmetric blink lag, fleeting idle micro-expressions, and rare restrained reconstruction instability.',
      },
      motionProfile: {
        breathingPeriodMs: 5300,
        breathingVarianceMs: 650,
        breathingAmplitudePx: 2.1,
        chestScaleAmplitude: 0.0042,
        postureHoldMinMs: 3600,
        postureHoldMaxMs: 7200,
        postureMaxTiltDeg: 1.35,
        postureMaxShiftXPx: 1.8,
        postureMaxShiftYPx: 1.4,
        postureCorrectionChance: 0.24,
        postureEaseMs: 460,
        headSwayDeg: 1.35,
        headNodPx: 1.4,
        blinkIntervalMinMs: 3400,
        blinkIntervalMaxMs: 7200,
        blinkDurationMs: 148,
        doubleBlinkChance: 0.1,
        allowAsymmetricBlink: true,
        asymmetricBlinkDelayMs: 54,
        asymmetricBlinkChance: 0.28,
        gazeShiftMinMs: 2800,
        gazeShiftMaxMs: 6200,
        gazeMaxOffsetPx: 3.8,
        gazeCenterBias: 0.44,
        rightEyeTrackLagMs: 44,
        allowIdleMicroExpressions: true,
        microExprIntervalMinMs: 8500,
        microExprIntervalMaxMs: 15500,
        microExprDurationMinMs: 1600,
        microExprDurationMaxMs: 2600,
        allowReconstructionGlitch: true,
        glitchIntervalMinMs: 14500,
        glitchIntervalMaxMs: 23500,
        glitchDurationMs: 460,
        restingSeamOpacity: 0.08,
        speakingCadence: {
          syllableMinMs: 125,
          syllableMaxMs: 245,
          gapMinMs: 55,
          gapMaxMs: 115,
          pauseMinMs: 340,
          pauseMaxMs: 680,
          phraseSyllablesMin: 3,
          phraseSyllablesMax: 6,
          ampMin: 0.24,
          ampMax: 0.56,
          browEmphasisPx: -1.45,
          headEmphasisPx: 1.55,
        },
      },
      expressions: {
        neutral: { label: 'Neutral / Composed', browLeftY: 0, browLeftRot: 0, browRightY: 0, browRightRot: 0, lidUpperOffset: 0, lidLowerOffset: 0, mouthScaleX: 1, mouthScaleY: 1, mouthY: 0, mouthRot: 0, mouthOpen: 0, jawY: 0, headTilt: 0, headShiftX: 0, headShiftY: 0, gazeBiasX: 0, gazeBiasY: 0, seamOpacity: 0.08 },
        thoughtful: { label: 'Thoughtful', browLeftY: 2.4, browLeftRot: 4.2, browRightY: -2.0, browRightRot: -2.8, lidUpperOffset: 2.6, lidLowerOffset: -1.4, mouthScaleX: 0.92, mouthScaleY: 0.96, mouthY: -0.6, mouthRot: -1.0, mouthOpen: 0, jawY: 0.2, headTilt: -2.4, headShiftX: -1.2, headShiftY: -1.0, gazeBiasX: -3.2, gazeBiasY: -1.6, seamOpacity: 0.1 },
        amused: { label: 'Slightly Amused', browLeftY: -3.0, browLeftRot: -2.2, browRightY: -4.4, browRightRot: 3.0, lidUpperOffset: 0.6, lidLowerOffset: -3.0, mouthScaleX: 1.09, mouthScaleY: 1.05, mouthY: -2.4, mouthRot: -1.4, mouthOpen: 0.08, jawY: 0.8, headTilt: 1.9, headShiftX: 0.8, headShiftY: -1.0, gazeBiasX: 0.8, gazeBiasY: -0.3, seamOpacity: 0.08 },
        explaining: { label: 'Explaining Principle', browLeftY: -4.2, browLeftRot: -2.6, browRightY: -3.8, browRightRot: 2.4, lidUpperOffset: -1.8, lidLowerOffset: 0, mouthScaleX: 1.03, mouthScaleY: 1.15, mouthY: 0.8, mouthRot: 0, mouthOpen: 0.36, jawY: 3.4, headTilt: 1.0, headShiftX: 0.4, headShiftY: -1.8, gazeBiasX: 0, gazeBiasY: -0.3, seamOpacity: 0.1 },
        concerned: { label: 'Concerned', browLeftY: -3.2, browLeftRot: -7.2, browRightY: -2.8, browRightRot: 6.8, lidUpperOffset: 1.8, lidLowerOffset: -1.6, mouthScaleX: 0.90, mouthScaleY: 0.94, mouthY: 2.0, mouthRot: 0.8, mouthOpen: 0.04, jawY: 1.2, headTilt: -1.5, headShiftX: -0.6, headShiftY: 1.4, gazeBiasX: 0, gazeBiasY: 0.9, seamOpacity: 0.16 },
        disappointed: { label: 'Disappointed', browLeftY: 3.6, browLeftRot: -5.2, browRightY: 3.6, browRightRot: 5.2, lidUpperOffset: 6.4, lidLowerOffset: -0.4, mouthScaleX: 0.91, mouthScaleY: 0.90, mouthY: 2.8, mouthRot: 0.6, mouthOpen: 0, jawY: 1.4, headTilt: -2.8, headShiftX: -0.8, headShiftY: 3.2, gazeBiasX: -0.4, gazeBiasY: 2.8, seamOpacity: 0.13 },
        irritated: { label: 'Irritated', browLeftY: 4.4, browLeftRot: 7.8, browRightY: 4.8, browRightRot: -8.2, lidUpperOffset: 4.8, lidLowerOffset: -3.0, mouthScaleX: 0.88, mouthScaleY: 0.84, mouthY: 1.4, mouthRot: -1.0, mouthOpen: 0, jawY: -1.0, headTilt: 1.3, headShiftX: 0.6, headShiftY: 1.6, gazeBiasX: 0, gazeBiasY: 0.5, seamOpacity: 0.24 },
        instability: { label: 'Reconstruction Instability', browLeftY: -1.0, browLeftRot: 1.4, browRightY: 3.2, browRightRot: -4.4, lidUpperOffset: -0.6, lidUpperLeftOffset: 0.6, lidUpperRightOffset: -1.8, lidLowerOffset: 0, mouthScaleX: 0.97, mouthScaleY: 0.95, mouthY: 0.8, mouthRot: 1.2, mouthOpen: 0.10, jawY: 0.8, headTilt: 2.3, headShiftX: 1.6, headShiftY: 0.4, gazeBiasX: 0.5, gazeBiasY: 0, seamOpacity: 0.82, rightEyeDesyncX: 3.8, rightEyeDesyncY: -1.6, fxOverlayOpacity: 0.72 },
      },
    },
    sci_lav_001_institute: {
      characterId: 'sci_lav_001_institute',
      displayName: 'Antoine Lavoisier (Institute Hologram)',
      constructTitle: 'Academy Archival Hologram: Antoine Lavoisier',
      aiFamily: 'INSTITUTE',
      generationStage: 'INSTITUTE_HOLOGRAM',
      renderer: 'svg_rig',
      sourceAsset: 'assets/characters/sci_lav_001_institute/master_layered.svg',
      manifestPath: 'assets/characters/sci_lav_001_institute/rig_manifest.json',
      requiredLayers: [
        'layer_bg', 'layer_hair_rear', 'layer_clothing_rear', 'layer_neck', 'layer_clothing_front',
        'layer_head_base', 'layer_jaw_lower', 'layer_eye_left', 'layer_eye_right',
        'layer_brow_left', 'layer_brow_right', 'layer_nose_detail', 'layer_mouth',
        'layer_hair_front', 'layer_mech_crystal', 'layer_fx_reconstruction',
      ],
      pivots: {
        torso: { x: 448, y: 1180 },
        head: { x: 448, y: 646 },
        jaw: { x: 448, y: 540 },
        eyeLeft: { x: 373, y: 395 },
        eyeRight: { x: 523, y: 395 },
        browLeft: { x: 370, y: 358 },
        browRight: { x: 526, y: 358 },
        mouth: { x: 448, y: 550 },
      },
      personality: {
        archetype: 'Preserved Intelligence',
        traits: ['precise', 'formal', 'controlled', 'highly_composed', 'almost_unnaturally_perfect'],
        summary: 'Ultra-restrained steady breathing, long formal stillness holds with minimal symmetrical posture adjustments, exact synchronized blinks, locked binocular gaze, crisp symmetrical facial transitions, and zero reconstruction instability.',
      },
      motionProfile: {
        breathingPeriodMs: 6200,
        breathingVarianceMs: 0,
        breathingAmplitudePx: 0.95,
        chestScaleAmplitude: 0.0018,
        postureHoldMinMs: 6500,
        postureHoldMaxMs: 11000,
        postureMaxTiltDeg: 0.42,
        postureMaxShiftXPx: 0.6,
        postureMaxShiftYPx: 0.5,
        postureCorrectionChance: 0,
        postureEaseMs: 360,
        headSwayDeg: 0.42,
        headNodPx: 0.5,
        blinkIntervalMinMs: 4900,
        blinkIntervalMaxMs: 5500,
        blinkDurationMs: 130,
        doubleBlinkChance: 0,
        allowAsymmetricBlink: false,
        asymmetricBlinkDelayMs: 0,
        asymmetricBlinkChance: 0,
        gazeShiftMinMs: 4800,
        gazeShiftMaxMs: 8200,
        gazeMaxOffsetPx: 2.1,
        gazeCenterBias: 0.62,
        rightEyeTrackLagMs: 0,
        allowIdleMicroExpressions: false,
        microExprIntervalMinMs: 0,
        microExprIntervalMaxMs: 0,
        microExprDurationMinMs: 0,
        microExprDurationMaxMs: 0,
        allowReconstructionGlitch: false,
        glitchIntervalMinMs: 0,
        glitchIntervalMaxMs: 0,
        glitchDurationMs: 0,
        restingSeamOpacity: 0,
        speakingCadence: {
          syllableMinMs: 140,
          syllableMaxMs: 210,
          gapMinMs: 65,
          gapMaxMs: 100,
          pauseMinMs: 420,
          pauseMaxMs: 620,
          phraseSyllablesMin: 3,
          phraseSyllablesMax: 5,
          ampMin: 0.22,
          ampMax: 0.45,
          browEmphasisPx: -1.0,
          headEmphasisPx: 0.85,
        },
      },
      expressions: {
        neutral: { label: 'Archival Composed', browLeftY: 0, browLeftRot: 0, browRightY: 0, browRightRot: 0, lidUpperOffset: 0, lidLowerOffset: 0, mouthScaleX: 1, mouthScaleY: 1, mouthY: 0, mouthRot: 0, mouthOpen: 0, jawY: 0, headTilt: 0, headShiftX: 0, headShiftY: 0, gazeBiasX: 0, gazeBiasY: 0, seamOpacity: 0 },
        thoughtful: { label: 'Analytical', browLeftY: 1.2, browLeftRot: 2.6, browRightY: 1.2, browRightRot: -2.6, lidUpperOffset: 1.6, lidLowerOffset: -0.8, mouthScaleX: 0.95, mouthScaleY: 0.98, mouthY: 0, mouthRot: 0, mouthOpen: 0, jawY: 0, headTilt: -1.1, headShiftX: -0.5, headShiftY: -0.5, gazeBiasX: -1.8, gazeBiasY: -0.9, seamOpacity: 0 },
        amused: { label: 'Courteous Approval', browLeftY: -2.8, browLeftRot: -2.0, browRightY: -2.8, browRightRot: 2.0, lidUpperOffset: 0.5, lidLowerOffset: -2.2, mouthScaleX: 1.07, mouthScaleY: 1.04, mouthY: -2.0, mouthRot: 0, mouthOpen: 0.06, jawY: 0.5, headTilt: 0.9, headShiftX: 0, headShiftY: -0.6, gazeBiasX: 0, gazeBiasY: 0, seamOpacity: 0 },
        explaining: { label: 'Lecturing', browLeftY: -3.4, browLeftRot: -2.0, browRightY: -3.4, browRightRot: 2.0, lidUpperOffset: -1.2, lidLowerOffset: 0, mouthScaleX: 1.02, mouthScaleY: 1.12, mouthY: 0.5, mouthRot: 0, mouthOpen: 0.32, jawY: 2.8, headTilt: 0.2, headShiftX: 0, headShiftY: -1.0, gazeBiasX: 0, gazeBiasY: 0, seamOpacity: 0 },
        concerned: { label: 'Cautionary', browLeftY: -2.4, browLeftRot: -5.2, browRightY: -2.4, browRightRot: 5.2, lidUpperOffset: 1.2, lidLowerOffset: -1.0, mouthScaleX: 0.93, mouthScaleY: 0.95, mouthY: 1.5, mouthRot: 0, mouthOpen: 0, jawY: 0.8, headTilt: -0.8, headShiftX: 0, headShiftY: 0.8, gazeBiasX: 0, gazeBiasY: 0.6, seamOpacity: 0 },
        disappointed: { label: 'Regretful', browLeftY: 2.6, browLeftRot: -3.8, browRightY: 2.6, browRightRot: 3.8, lidUpperOffset: 5.0, lidLowerOffset: 0, mouthScaleX: 0.94, mouthScaleY: 0.92, mouthY: 2.2, mouthRot: 0, mouthOpen: 0, jawY: 1.0, headTilt: -1.6, headShiftX: 0, headShiftY: 2.0, gazeBiasX: 0, gazeBiasY: 2.0, seamOpacity: 0 },
        irritated: { label: 'Stern Correction', browLeftY: 3.2, browLeftRot: 5.6, browRightY: 3.2, browRightRot: -5.6, lidUpperOffset: 3.6, lidLowerOffset: -2.2, mouthScaleX: 0.91, mouthScaleY: 0.88, mouthY: 1.0, mouthRot: 0, mouthOpen: 0, jawY: -0.6, headTilt: 0, headShiftX: 0, headShiftY: 1.0, gazeBiasX: 0, gazeBiasY: 0.3, seamOpacity: 0 },
        instability: { label: 'Stable Hologram (No Drift)', browLeftY: 0, browLeftRot: 0, browRightY: 0, browRightRot: 0, lidUpperOffset: 0, lidLowerOffset: 0, mouthScaleX: 1, mouthScaleY: 1, mouthY: 0, mouthRot: 0, mouthOpen: 0, jawY: 0, headTilt: 0, headShiftX: 0, headShiftY: 0, gazeBiasX: 0, gazeBiasY: 0, seamOpacity: 0 },
      },
    },
    sci_men_002_frontier: {
      characterId: 'sci_men_002_frontier',
      displayName: 'Dmitri Mendeleev',
      constructTitle: 'Frontier Construct: Dmitri Mendeleev',
      aiFamily: 'FRONTIER',
      generationStage: 'GEN_2_DRIFTING',
      renderer: 'svg_rig',
      sourceAsset: 'assets/characters/sci_men_002_frontier/master_layered.svg',
      manifestPath: 'assets/characters/sci_men_002_frontier/rig_manifest.json',
      requiredLayers: [
        'layer_bg', 'layer_hair_rear', 'layer_clothing_rear', 'layer_neck', 'layer_clothing_front',
        'layer_head_base', 'layer_jaw_lower', 'layer_eye_left', 'layer_eye_right',
        'layer_brow_left', 'layer_brow_right', 'layer_nose_detail', 'layer_mouth',
        'layer_hair_front', 'layer_mech_crystal', 'layer_fx_reconstruction',
      ],
      pivots: {
        torso: { x: 448, y: 1180 },
        head: { x: 496, y: 660 },
        jaw: { x: 514, y: 646 },
        eyeLeft: { x: 442, y: 383 },
        eyeRight: { x: 566, y: 386 },
        browLeft: { x: 445, y: 356 },
        browRight: { x: 571, y: 362 },
        mouth: { x: 516, y: 535 },
      },
      personality: {
        archetype: 'Sovereign Periodic Construct (Gen 2)',
        traits: ['authoritative', 'calculating', 'imposing', 'dry_wit', 'architectural_intensity'],
        summary: 'Heavy thoracic breathing with contemplative pauses, statuesque axial stillness holds, crisp periodic grid eye scans with subtle dual-tempo convergence, prolonged unblinking fixations, beard-safe authoritative speech bursts, and rare Gen-2 crystalline lattice desynchronization.',
      },
      motionProfile: {
        breathProfile: 'thoracic_contemplative',
        postureStyle: 'stepped_axial',
        gazePattern: 'periodic_grid_dual_tempo',
        blinkStyle: 'fixation_shutter',
        glitchStyle: 'gen2_orthogonal_lattice',
        breathingPeriodMs: 5900,
        breathingVarianceMs: 900,
        breathingAmplitudePx: 2.3,
        chestScaleAmplitude: 0.0046,
        postureHoldMinMs: 5000,
        postureHoldMaxMs: 9500,
        postureMaxTiltDeg: 0.95,
        postureMaxShiftXPx: 1.4,
        postureMaxShiftYPx: 1.9,
        postureCorrectionChance: 0,
        postureEaseMs: 280,
        headSwayDeg: 0.95,
        headNodPx: 1.9,
        blinkIntervalMinMs: 6500,
        blinkIntervalMaxMs: 11500,
        blinkDurationMs: 195,
        doubleBlinkChance: 0,
        allowAsymmetricBlink: true,
        asymmetricBlinkDelayMs: 72,
        asymmetricBlinkChance: 0.18,
        gazeShiftMinMs: 2400,
        gazeShiftMaxMs: 5400,
        gazeMaxOffsetPx: 3.6,
        gazeCenterBias: 0.42,
        rightEyeTrackLagMs: 85,
        allowIdleMicroExpressions: true,
        microExprIntervalMinMs: 10000,
        microExprIntervalMaxMs: 17500,
        microExprDurationMinMs: 1800,
        microExprDurationMaxMs: 2800,
        idleMicroExpressions: [
          {
            id: 'row_verify_furrow',
            browLeftY: 1.4, browLeftRot: 2.2, browRightY: 1.2, browRightRot: -1.8,
            lidUpperOffset: 1.3, lidLowerOffset: -1.2, mouthScaleX: -0.02, headTilt: -0.25, seamOpacityDelta: 0.03,
          },
          {
            id: 'heavy_nod_ack',
            browLeftY: -0.6, browLeftRot: 0, browRightY: -0.6, browRightRot: 0,
            lidUpperOffset: 0.8, lidLowerOffset: -0.4, mouthScaleX: 0.01, jawY: 0.4, headTilt: -0.4, seamOpacityDelta: 0.01,
          },
          {
            id: 'lattice_arrest',
            browLeftY: 0.9, browLeftRot: 1.4, browRightY: -0.7, browRightRot: -1.2,
            lidUpperOffset: -0.6, lidLowerOffset: -0.6, mouthScaleX: -0.03, jawY: -0.4, headTilt: 0.2, seamOpacityDelta: 0.08,
          },
        ],
        allowReconstructionGlitch: true,
        glitchIntervalMinMs: 12000,
        glitchIntervalMaxMs: 19000,
        glitchDurationMs: 420,
        restingSeamOpacity: 0.14,
        speakingCadence: {
          syllableMinMs: 115,
          syllableMaxMs: 205,
          gapMinMs: 50,
          gapMaxMs: 95,
          pauseMinMs: 520,
          pauseMaxMs: 920,
          phraseSyllablesMin: 2,
          phraseSyllablesMax: 5,
          ampMin: 0.22,
          ampMax: 0.48,
          jawSpeechScale: 3.5,
          browEmphasisPx: -1.3,
          headEmphasisPx: 1.9,
        },
      },
      expressions: {
        neutral: { label: 'Calculating Stillness', browLeftY: 0, browLeftRot: 0, browRightY: 0, browRightRot: 0, lidUpperOffset: 0, lidLowerOffset: 0, mouthScaleX: 1, mouthScaleY: 1, mouthY: 0, mouthRot: 0, mouthOpen: 0, jawY: 0, headTilt: 0, headShiftX: 0, headShiftY: 0, gazeBiasX: 0, gazeBiasY: 0, seamOpacity: 0.14 },
        thoughtful: { label: 'Indexing the Table', browLeftY: 3.0, browLeftRot: 5.4, browRightY: 1.4, browRightRot: -3.2, lidUpperOffset: 2.8, lidLowerOffset: -1.8, mouthScaleX: 0.93, mouthScaleY: 0.96, mouthY: -0.5, mouthRot: -0.6, mouthOpen: 0, jawY: -0.4, headTilt: -0.9, headShiftX: -0.6, headShiftY: 1.4, gazeBiasX: -3.4, gazeBiasY: -0.4, seamOpacity: 0.18 },
        amused: { label: 'Dry Mischievous Approval', browLeftY: -2.4, browLeftRot: 1.4, browRightY: -4.8, browRightRot: 3.8, lidUpperOffset: 0.6, lidLowerOffset: -3.4, mouthScaleX: 1.11, mouthScaleY: 1.05, mouthY: -2.4, mouthRot: -1.6, mouthOpen: 0.06, jawY: 0.6, headTilt: 1.1, headShiftX: 0.4, headShiftY: -1.4, gazeBiasX: 0.4, gazeBiasY: -0.3, seamOpacity: 0.12 },
        explaining: { label: 'Pronouncing Structure', browLeftY: -4.4, browLeftRot: -2.2, browRightY: -4.2, browRightRot: 2.2, lidUpperOffset: -2.0, lidLowerOffset: 0, mouthScaleX: 1.03, mouthScaleY: 1.12, mouthY: 0.6, mouthRot: 0, mouthOpen: 0.30, jawY: 2.6, headTilt: 0.4, headShiftX: 0.2, headShiftY: -1.8, gazeBiasX: 0, gazeBiasY: -0.2, seamOpacity: 0.14 },
        concerned: { label: 'Anomaly Detected', browLeftY: -2.8, browLeftRot: -8.0, browRightY: -2.6, browRightRot: 7.6, lidUpperOffset: 1.6, lidLowerOffset: -1.8, mouthScaleX: 0.90, mouthScaleY: 0.94, mouthY: 1.8, mouthRot: 0.6, mouthOpen: 0, jawY: 0.6, headTilt: -1.1, headShiftX: -0.8, headShiftY: 1.2, gazeBiasX: 0, gazeBiasY: 0.6, seamOpacity: 0.24 },
        disappointed: { label: 'Disorder Rejected', browLeftY: 4.0, browLeftRot: -4.8, browRightY: 4.0, browRightRot: 4.8, lidUpperOffset: 6.8, lidLowerOffset: -0.2, mouthScaleX: 0.91, mouthScaleY: 0.89, mouthY: 2.6, mouthRot: 0.5, mouthOpen: 0, jawY: 1.0, headTilt: -1.4, headShiftX: -0.4, headShiftY: 3.8, gazeBiasX: -0.2, gazeBiasY: 3.0, seamOpacity: 0.18 },
        irritated: { label: 'Formidable Displeasure', browLeftY: 5.2, browLeftRot: 8.8, browRightY: 5.4, browRightRot: -9.2, lidUpperOffset: 5.2, lidLowerOffset: -3.6, mouthScaleX: 0.86, mouthScaleY: 0.82, mouthY: 1.0, mouthRot: -0.8, mouthOpen: 0, jawY: -1.4, headTilt: 0.6, headShiftX: 0.4, headShiftY: 1.8, gazeBiasX: 0, gazeBiasY: 0.4, seamOpacity: 0.30 },
        instability: { label: 'Gen-2 Lattice Desynchronization', browLeftY: 2.4, browLeftRot: 3.6, browRightY: -2.8, browRightRot: -2.2, lidUpperOffset: 0, lidUpperLeftOffset: 2.6, lidUpperRightOffset: -2.4, lidLowerOffset: 0, mouthScaleX: 0.96, mouthScaleY: 0.94, mouthY: 0.6, mouthRot: 1.0, mouthOpen: 0.08, jawY: 0.6, headTilt: -2.2, headShiftX: -1.6, headShiftY: -0.6, gazeBiasX: -2.4, gazeBiasY: 0, seamOpacity: 0.88, leftEyeDesyncX: -2.4, rightEyeDesyncX: 3.6, rightEyeDesyncY: -2.4, fxOverlayOpacity: 0.80 },
      },
      battleReactions: {
        playerHighSynthMinSP: 14,
        onPlayerHighSynth: 'concerned',
        onPlayerMidSynth: 'thoughtful',
        onPlayerLowSynth: 'disappointed',
        onUnexpectedReaction: 'thoughtful',
        onOwnShield: 'amused',
        onOwnHighSynth: 'amused',
        onOwnStandardSynth: 'explaining',
      },
    },
    sci_men_002_institute: {
      characterId: 'sci_men_002_institute',
      displayName: 'Dmitri Mendeleev (Institute Hologram)',
      constructTitle: 'Academy Archival Hologram: Dmitri Mendeleev',
      aiFamily: 'INSTITUTE',
      generationStage: 'INSTITUTE_HOLOGRAM',
      renderer: 'svg_rig',
      sourceAsset: 'assets/characters/sci_men_002_institute/master_layered.svg',
      manifestPath: 'assets/characters/sci_men_002_institute/rig_manifest.json',
      requiredLayers: [
        'layer_bg', 'layer_hair_rear', 'layer_clothing_rear', 'layer_neck', 'layer_clothing_front',
        'layer_head_base', 'layer_jaw_lower', 'layer_eye_left', 'layer_eye_right',
        'layer_brow_left', 'layer_brow_right', 'layer_nose_detail', 'layer_mouth',
        'layer_hair_front', 'layer_mech_crystal', 'layer_fx_reconstruction',
      ],
      pivots: {
        torso: { x: 448, y: 1180 },
        head: { x: 448, y: 658 },
        jaw: { x: 448, y: 654 },
        eyeLeft: { x: 377, y: 392 },
        eyeRight: { x: 519, y: 392 },
        browLeft: { x: 376, y: 366 },
        browRight: { x: 520, y: 366 },
        mouth: { x: 448, y: 552 },
      },
      personality: {
        archetype: 'Archival Periodic Architect',
        traits: ['commanding', 'methodical', 'exacting', 'symmetrical', 'unshakeable_composure'],
        summary: 'Deep diaphragmatic breathing with steady poise holds, anchored vertical lecturer bearing, methodical horizontal periodic row eye sweeps, deliberate symmetrical dean blinks, beard-safe declarative speech pacing, and zero reconstruction drift.',
      },
      motionProfile: {
        breathProfile: 'diaphragmatic_poise',
        postureStyle: 'anchored_vertical',
        gazePattern: 'tabular_row',
        blinkStyle: 'heavy_symmetrical',
        glitchStyle: 'none',
        breathingPeriodMs: 6800,
        breathingVarianceMs: 0,
        breathingAmplitudePx: 1.1,
        chestScaleAmplitude: 0.0022,
        postureHoldMinMs: 7500,
        postureHoldMaxMs: 12000,
        postureMaxTiltDeg: 0.18,
        postureMaxShiftXPx: 0.4,
        postureMaxShiftYPx: 0.9,
        postureCorrectionChance: 0,
        postureEaseMs: 380,
        headSwayDeg: 0.18,
        headNodPx: 0.9,
        blinkIntervalMinMs: 5800,
        blinkIntervalMaxMs: 7600,
        blinkDurationMs: 168,
        doubleBlinkChance: 0,
        allowAsymmetricBlink: false,
        asymmetricBlinkDelayMs: 0,
        asymmetricBlinkChance: 0,
        gazeShiftMinMs: 4500,
        gazeShiftMaxMs: 7500,
        gazeMaxOffsetPx: 2.2,
        gazeCenterBias: 0.65,
        rightEyeTrackLagMs: 0,
        allowIdleMicroExpressions: false,
        microExprIntervalMinMs: 0,
        microExprIntervalMaxMs: 0,
        microExprDurationMinMs: 0,
        microExprDurationMaxMs: 0,
        allowReconstructionGlitch: false,
        glitchIntervalMinMs: 0,
        glitchIntervalMaxMs: 0,
        glitchDurationMs: 0,
        restingSeamOpacity: 0,
        speakingCadence: {
          syllableMinMs: 165,
          syllableMaxMs: 250,
          gapMinMs: 75,
          gapMaxMs: 120,
          pauseMinMs: 480,
          pauseMaxMs: 720,
          phraseSyllablesMin: 2,
          phraseSyllablesMax: 4,
          ampMin: 0.20,
          ampMax: 0.42,
          jawSpeechScale: 3.2,
          browEmphasisPx: 1.1,
          headEmphasisPx: 1.1,
        },
      },
      expressions: {
        neutral: { label: 'Archival Authority', browLeftY: 0, browLeftRot: 0, browRightY: 0, browRightRot: 0, lidUpperOffset: 0, lidLowerOffset: 0, mouthScaleX: 1, mouthScaleY: 1, mouthY: 0, mouthRot: 0, mouthOpen: 0, jawY: 0, headTilt: 0, headShiftX: 0, headShiftY: 0, gazeBiasX: 0, gazeBiasY: 0, seamOpacity: 0 },
        thoughtful: { label: 'Periodic Analysis', browLeftY: 2.2, browLeftRot: 3.8, browRightY: 2.2, browRightRot: -3.8, lidUpperOffset: 2.0, lidLowerOffset: -1.2, mouthScaleX: 0.95, mouthScaleY: 0.97, mouthY: -0.3, mouthRot: 0, mouthOpen: 0, jawY: -0.3, headTilt: 0, headShiftX: 0, headShiftY: 1.0, gazeBiasX: -2.2, gazeBiasY: -0.3, seamOpacity: 0 },
        amused: { label: 'Dry Scholarly Approval', browLeftY: -3.0, browLeftRot: -2.2, browRightY: -3.0, browRightRot: 2.2, lidUpperOffset: 0.4, lidLowerOffset: -2.6, mouthScaleX: 1.08, mouthScaleY: 1.04, mouthY: -2.0, mouthRot: 0, mouthOpen: 0.05, jawY: 0.4, headTilt: 0, headShiftX: 0, headShiftY: -1.1, gazeBiasX: 0, gazeBiasY: -0.2, seamOpacity: 0 },
        explaining: { label: 'Delivering Periodic Law', browLeftY: -3.6, browLeftRot: -1.8, browRightY: -3.6, browRightRot: 1.8, lidUpperOffset: -1.5, lidLowerOffset: 0, mouthScaleX: 1.02, mouthScaleY: 1.10, mouthY: 0.5, mouthRot: 0, mouthOpen: 0.26, jawY: 2.2, headTilt: 0, headShiftX: 0, headShiftY: -1.2, gazeBiasX: 0, gazeBiasY: -0.1, seamOpacity: 0 },
        concerned: { label: 'Structural Caution', browLeftY: -2.2, browLeftRot: -5.8, browRightY: -2.2, browRightRot: 5.8, lidUpperOffset: 1.2, lidLowerOffset: -1.2, mouthScaleX: 0.93, mouthScaleY: 0.95, mouthY: 1.4, mouthRot: 0, mouthOpen: 0, jawY: 0.4, headTilt: 0, headShiftX: 0, headShiftY: 0.9, gazeBiasX: 0, gazeBiasY: 0.4, seamOpacity: 0 },
        disappointed: { label: 'Methodological Regret', browLeftY: 3.0, browLeftRot: -3.6, browRightY: 3.0, browRightRot: 3.6, lidUpperOffset: 5.2, lidLowerOffset: 0, mouthScaleX: 0.93, mouthScaleY: 0.92, mouthY: 2.0, mouthRot: 0, mouthOpen: 0, jawY: 0.8, headTilt: -0.8, headShiftX: 0, headShiftY: 2.6, gazeBiasX: 0, gazeBiasY: 2.2, seamOpacity: 0 },
        irritated: { label: 'Stern Reprimand', browLeftY: 3.8, browLeftRot: 6.4, browRightY: 3.8, browRightRot: -6.4, lidUpperOffset: 3.8, lidLowerOffset: -2.6, mouthScaleX: 0.90, mouthScaleY: 0.87, mouthY: 0.8, mouthRot: 0, mouthOpen: 0, jawY: -1.0, headTilt: 0, headShiftX: 0, headShiftY: 1.2, gazeBiasX: 0, gazeBiasY: 0.3, seamOpacity: 0 },
        instability: { label: 'Calibrated Archival Lock (No Drift)', browLeftY: 0, browLeftRot: 0, browRightY: 0, browRightRot: 0, lidUpperOffset: 0, lidLowerOffset: 0, mouthScaleX: 1, mouthScaleY: 1, mouthY: 0, mouthRot: 0, mouthOpen: 0, jawY: 0, headTilt: 0, headShiftX: 0, headShiftY: 0, gazeBiasX: 0, gazeBiasY: 0, seamOpacity: 0 },
      },
      battleReactions: {
        playerHighSynthMinSP: 14,
        onPlayerHighSynth: 'thoughtful',
        onPlayerMidSynth: 'thoughtful',
        onPlayerLowSynth: 'thoughtful',
        onUnexpectedReaction: 'thoughtful',
        onOwnShield: 'amused',
        onOwnHighSynth: 'amused',
        onOwnStandardSynth: 'explaining',
      },
    },
  };

  // Documented Stage 3E.4 defaults & validation enums for manifest-driven Scientist onboarding
  const VALID_MOTION_ENUMS = Object.freeze({
    aiFamily: ['FRONTIER', 'INSTITUTE'],
    breathProfile: ['organic_wave', 'diaphragmatic_poise', 'thoracic_contemplative'],
    postureStyle: ['dwell_shift', 'anchored_vertical', 'stepped_axial'],
    gazePattern: ['saccade_center', 'tabular_row', 'periodic_grid_dual_tempo'],
    blinkStyle: ['natural_asym', 'heavy_symmetrical', 'fixation_shutter'],
    glitchStyle: ['none', 'gen1_right_drift', 'gen2_orthogonal_lattice'],
  });

  const DEFAULT_MOTION_PROFILE = Object.freeze({
    breathProfile: 'organic_wave',
    postureStyle: 'dwell_shift',
    gazePattern: 'saccade_center',
    blinkStyle: 'natural_asym',
    glitchStyle: 'none',
    breathingPeriodMs: 5400,
    breathingVarianceMs: 0,
    breathingAmplitudePx: 1.6,
    chestScaleAmplitude: 0.003,
    postureHoldMinMs: 4200,
    postureHoldMaxMs: 8000,
    postureMaxTiltDeg: 0.8,
    postureMaxShiftXPx: 1.0,
    postureMaxShiftYPx: 1.0,
    postureCorrectionChance: 0,
    postureEaseMs: 420,
    blinkIntervalMinMs: 4200,
    blinkIntervalMaxMs: 6800,
    blinkDurationMs: 145,
    doubleBlinkChance: 0,
    allowAsymmetricBlink: false,
    asymmetricBlinkDelayMs: 0,
    asymmetricBlinkChance: 0,
    gazeShiftMinMs: 3600,
    gazeShiftMaxMs: 6800,
    gazeMaxOffsetPx: 2.5,
    gazeCenterBias: 0.5,
    rightEyeTrackLagMs: 0,
    allowIdleMicroExpressions: false,
    allowReconstructionGlitch: false,
    restingSeamOpacity: 0,
    speakingCadence: Object.freeze({
      syllableMinMs: 130,
      syllableMaxMs: 230,
      gapMinMs: 55,
      gapMaxMs: 110,
      pauseMinMs: 360,
      pauseMaxMs: 640,
      phraseSyllablesMin: 3,
      phraseSyllablesMax: 6,
      ampMin: 0.22,
      ampMax: 0.5,
      jawSpeechScale: 4.8,
      browEmphasisPx: -1.2,
      headEmphasisPx: 1.2,
    }),
  });

  const REQUIRED_PIVOT_KEYS = ['torso', 'head', 'jaw', 'eyeLeft', 'eyeRight', 'browLeft', 'browRight', 'mouth'];

  function validateManifest(manifest) {
    const errors = [];
    const warnings = [];
    if (!manifest || typeof manifest !== 'object') {
      return { valid: false, errors: ['Manifest must be a non-null object'], warnings };
    }
    if (!manifest.characterId || typeof manifest.characterId !== 'string') {
      errors.push('Missing required string characterId');
    }
    if (!VALID_MOTION_ENUMS.aiFamily.includes(manifest.aiFamily)) {
      errors.push(`Invalid aiFamily "${manifest.aiFamily}" (expected FRONTIER or INSTITUTE)`);
    }
    if (!manifest.sourceAsset || typeof manifest.sourceAsset !== 'string') {
      errors.push('Missing required sourceAsset SVG path');
    }
    if (!manifest.pivots || typeof manifest.pivots !== 'object') {
      errors.push('Missing required pivots object');
    } else {
      for (const pk of REQUIRED_PIVOT_KEYS) {
        const pt = manifest.pivots[pk];
        if (!pt || typeof pt.x !== 'number' || typeof pt.y !== 'number') {
          errors.push(`Missing numeric pivot "${pk}" ({ x, y })`);
        }
      }
    }
    if (!manifest.expressions || typeof manifest.expressions !== 'object' || !manifest.expressions.neutral) {
      errors.push('Missing required expressions.neutral pose');
    } else {
      for (const expr of DEFAULT_EXPRESSIONS) {
        if (!manifest.expressions[expr]) {
          warnings.push(`Optional/standard expression "${expr}" missing (falls back to neutral)`);
        }
      }
    }

    const mp = manifest.motionProfile || {};
    if (!manifest.motionProfile) {
      warnings.push('motionProfile omitted; documented DEFAULT_MOTION_PROFILE values will apply');
    } else {
      for (const enumKey of ['breathProfile', 'postureStyle', 'gazePattern', 'blinkStyle', 'glitchStyle']) {
        if (mp[enumKey] !== undefined && !VALID_MOTION_ENUMS[enumKey].includes(mp[enumKey])) {
          errors.push(`Invalid motionProfile.${enumKey} "${mp[enumKey]}" (allowed: ${VALID_MOTION_ENUMS[enumKey].join(', ')})`);
        }
      }
      if (manifest.aiFamily === 'INSTITUTE' && mp.allowReconstructionGlitch) {
        errors.push('INSTITUTE characters must keep motionProfile.allowReconstructionGlitch = false');
      }
      if (mp.speakingCadence && mp.speakingCadence.jawSpeechScale !== undefined) {
        const js = Number(mp.speakingCadence.jawSpeechScale);
        if (Number.isNaN(js) || js < 0 || js > 8) {
          errors.push(`Invalid jawSpeechScale "${mp.speakingCadence.jawSpeechScale}" (expected 0..8)`);
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  const registry = Object.assign({}, BUILTIN_CHARACTERS);
  const svgCache = {};
  const svgPending = {};
  const activeRigs = new Set();
  const registrationDiagnostics = [];
  let instanceCounter = 0;
  let rafId = null;
  let animMode = 'full'; // 'full' | 'reduced' | 'off'

  function getStorage() {
    try {
      return global.localStorage || null;
    } catch (_) {
      return null;
    }
  }

  function loadAnimationPreference() {
    const store = getStorage();
    if (store) {
      try {
        const saved = store.getItem(STORAGE_KEY);
        if (VALID_MODES.includes(saved)) {
          animMode = saved;
          return animMode;
        }
      } catch (_) {}
    }
    try {
      if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animMode = 'reduced';
      }
    } catch (_) {}
    return animMode;
  }

  function setAnimationMode(mode) {
    if (!VALID_MODES.includes(mode)) return animMode;
    animMode = mode;
    const store = getStorage();
    if (store) {
      try {
        store.setItem(STORAGE_KEY, animMode);
      } catch (_) {}
    }
    syncAllRigsMode();
    return animMode;
  }

  function getAnimationMode() {
    return animMode;
  }

  function isEffectivelyAnimated() {
    if (animMode !== 'full') return false;
    if (V.isAnimationsEnabled && !V.isAnimationsEnabled()) return false;
    return true;
  }

  function registerCharacter(characterId, manifest, options) {
    const opts = options || {};
    if (!characterId || typeof characterId !== 'string' || !manifest || typeof manifest !== 'object') {
      registrationDiagnostics.push({
        type: 'invalid_registration',
        characterId: characterId || null,
        errors: ['registerCharacter requires a non-empty characterId and manifest object'],
      });
      return null;
    }
    const candidate = Object.assign({}, manifest, { characterId });
    const validation = validateManifest(candidate);
    if (!validation.valid) {
      registrationDiagnostics.push({
        type: 'invalid_manifest',
        characterId,
        errors: validation.errors,
        warnings: validation.warnings,
      });
      return null;
    }
    if (registry[characterId] && !opts.overwrite) {
      registrationDiagnostics.push({
        type: 'duplicate_id',
        characterId,
        rejected: Boolean(opts.rejectDuplicate),
      });
      if (opts.rejectDuplicate) return null;
    }
    if (validation.warnings.length > 0) {
      registrationDiagnostics.push({
        type: 'manifest_warning',
        characterId,
        warnings: validation.warnings,
      });
    }
    registry[characterId] = Object.assign({}, registry[characterId] || {}, candidate);
    return registry[characterId];
  }

  function getRegistrationDiagnostics() {
    return registrationDiagnostics.slice();
  }

  function getCharacterManifest(characterId) {
    return registry[characterId] || null;
  }

  function listCharacters() {
    return Object.values(registry);
  }

  /**
   * Namespace SVG <defs> IDs per mounted instance so multiple simultaneous portraits
   * (e.g. Frontier vs. Institute comparison or Battle Header + Studio) never collide on url(#id).
   */
  function namespaceSvgMarkup(rawSvg, prefix) {
    const idMatches = [];
    rawSvg.replace(/\sid="([^"]+)"/g, (_, id) => {
      if (!id.startsWith('layer_') && !id.startsWith('rig_')) {
        idMatches.push(id);
      }
      return '';
    });
    let out = rawSvg;
    for (const id of new Set(idMatches)) {
      const next = `${prefix}_${id}`;
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(`(\\s)id="${escaped}"`, 'g'), `$1id="${next}"`);
      out = out.replace(new RegExp(`url\\(#${escaped}\\)`, 'g'), `url(#${next})`);
    }
    return out;
  }

  function resolveSourcePath(characterId, manifest) {
    if (V.Visual && typeof V.Visual.resolveAsset === 'function') {
      const resolved = V.Visual.resolveAsset('characters', characterId);
      if (resolved && resolved.path) return resolved.path;
    }
    return manifest.sourceAsset;
  }

  function loadSvgSource(characterId, manifest) {
    const url = resolveSourcePath(characterId, manifest);
    if (svgCache[url]) {
      return Promise.resolve(svgCache[url]);
    }
    if (V.CHARACTER_SVG_SOURCES && V.CHARACTER_SVG_SOURCES[url]) {
      svgCache[url] = V.CHARACTER_SVG_SOURCES[url];
      return Promise.resolve(svgCache[url]);
    }
    if (svgPending[url]) {
      return svgPending[url];
    }
    if (typeof global.fetch !== 'function') {
      return Promise.resolve(null);
    }
    const req = global.fetch(url)
      .then((resp) => {
        if (!resp || !resp.ok) return null;
        return resp.text();
      })
      .then((text) => {
        delete svgPending[url];
        if (text && text.includes('<svg')) {
          svgCache[url] = text;
          return text;
        }
        return null;
      })
      .catch(() => {
        delete svgPending[url];
        return null;
      });
    svgPending[url] = req;
    return req;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function randRange(min, max) {
    return min + Math.random() * Math.max(0, max - min);
  }

  function randInt(min, max) {
    return Math.floor(randRange(min, max + 0.999));
  }

  function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(0.0001, edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  // Asymmetric organic breath curve: smooth inhale (0..0.38), soft crest poise (0.38..0.48),
  // unhurried exhale (0.48..0.90), calm resting stillness (0.90..1.00).
  function evalBreathCurve(phase, profile) {
    const p = ((phase % 1) + 1) % 1;
    if (profile === 'diaphragmatic_poise') {
      // Institute Mendeleev: deep measured inhale (0..0.32), prolonged held architectural poise (0.32..0.52),
      // weighted controlled exhale (0.52..0.88), grounded stillness (0.88..1.00).
      if (p < 0.32) return smoothstep(0, 0.32, p);
      if (p < 0.52) return 1.0 - 0.02 * ((p - 0.32) / 0.20);
      if (p < 0.88) return 0.98 * (1 - smoothstep(0.52, 0.88, p));
      return 0;
    }
    if (profile === 'thoracic_contemplative') {
      // Frontier Mendeleev: heavier thoracic rise (0..0.35), deliberate crest weight (0.35..0.47),
      // steady contemplative release (0.47..0.89), anchored trough (0.89..1.00).
      if (p < 0.35) return smoothstep(0, 0.35, p);
      if (p < 0.47) return 1.0 - 0.03 * ((p - 0.35) / 0.12);
      if (p < 0.89) return 0.97 * (1 - smoothstep(0.47, 0.89, p));
      return 0;
    }
    if (p < 0.38) return smoothstep(0, 0.38, p);
    if (p < 0.48) return 1 - 0.04 * ((p - 0.38) / 0.10);
    if (p < 0.90) return 0.96 * (1 - smoothstep(0.48, 0.90, p));
    return 0;
  }

  // Subtle idle micro-expressions used only by Frontier constructs during neutral stillness
  const IDLE_MICRO_EXPRESSIONS = [
    {
      id: 'observant_squint',
      browLeftY: 0.7, browLeftRot: 0.8, browRightY: -1.1, browRightRot: -1.5,
      lidUpperOffset: 1.4, lidLowerOffset: -1.1, mouthScaleX: -0.02, headTilt: -0.35, seamOpacityDelta: 0.01,
    },
    {
      id: 'quiet_ponder',
      browLeftY: 1.2, browLeftRot: 2.0, browRightY: -0.6, browRightRot: -0.8,
      lidUpperOffset: 0.9, lidLowerOffset: -0.5, mouthScaleX: -0.035, headTilt: -0.65, seamOpacityDelta: 0.02,
    },
    {
      id: 'subtle_tension',
      browLeftY: 0.9, browLeftRot: 1.2, browRightY: 1.2, browRightRot: -1.4,
      lidUpperOffset: 0.8, lidLowerOffset: -0.8, mouthScaleX: -0.04, jawY: -0.55, headTilt: 0.25, seamOpacityDelta: 0.055,
    },
  ];

  function syncAllRigsMode() {
    const animated = isEffectivelyAnimated();
    for (const rig of activeRigs) {
      rig._syncModeClasses();
      if (!animated) {
        rig._applyPose(0, true);
      }
    }
    if (animated && activeRigs.size > 0) {
      ensureTickLoop();
    } else if (!animated && rafId !== null && typeof global.cancelAnimationFrame === 'function') {
      global.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function ensureTickLoop() {
    if (rafId !== null) return;
    if (typeof global.requestAnimationFrame !== 'function') return;
    if (!isEffectivelyAnimated() || activeRigs.size === 0) return;

    function tick(now) {
      rafId = null;
      if (!isEffectivelyAnimated() || activeRigs.size === 0) return;
      if (typeof document !== 'undefined' && document.hidden) {
        rafId = global.requestAnimationFrame(tick);
        return;
      }

      for (const rig of Array.from(activeRigs)) {
        if (!rig.container || rig.destroyed || (typeof rig.container.isConnected === 'boolean' && !rig.container.isConnected)) {
          rig.destroy();
          continue;
        }
        rig._step(now);
      }

      if (activeRigs.size > 0 && isEffectivelyAnimated()) {
        rafId = global.requestAnimationFrame(tick);
      }
    }

    rafId = global.requestAnimationFrame(tick);
  }

  /**
   * Mount a live layered 2D animated character portrait into `container`.
   * Returns a clean controller handle:
   *   { setExpression, setSpeaking, triggerReconstructionGlitch, triggerEncounterTransition,
   *     setLayerVisibility, getLayers, getState, destroy }
   */
  function mount(container, options) {
    const opts = options || {};
    const characterId = opts.characterId || 'sci_lav_001_frontier';
    const manifest = getCharacterManifest(characterId);
    if (!container || !manifest) return null;

    instanceCounter += 1;
    const prefix = `vrig${instanceCounter}`;
    const sizeClass =
      opts.size === 'mini'
        ? 'v-portrait-mini'
        : opts.size === 'intro'
          ? 'v-portrait-intro'
          : opts.size === 'card'
            ? 'v-portrait-card'
            : 'v-portrait-stage';

    container.classList.add('v-portrait-mount', sizeClass);
    container.dataset.characterId = manifest.characterId;
    container.dataset.aiFamily = manifest.aiFamily;
    container.dataset.expression = opts.expression || 'neutral';

    const mp = manifest.motionProfile || {};
    const nowInit = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const rig = {
      id: prefix,
      characterId: manifest.characterId,
      manifest,
      container,
      destroyed: false,
      svgEl: null,
      parts: {},
      expression: opts.expression && manifest.expressions[opts.expression] ? opts.expression : 'neutral',
      speaking: Boolean(opts.speaking),
      lastFrameTs: nowInit,
      startTs: nowInit,

      // Smoothly interpolated live facial state
      cur: Object.assign({}, manifest.expressions.neutral),

      // Phase-accumulated organic breathing (supports Lavoisier organic_wave, Mendeleev diaphragmatic_poise & thoracic_contemplative)
      breathPhase: Math.random() * 0.25,
      breathPeriodCur: mp.breathingPeriodMs || 5300,
      breathAmpScale: 1.0,
      breathVal: 0,
      breathCycleCount: 0,
      breathArrestEndTs: -1,

      // Dwell-and-shift head posture (supports dwell_shift, anchored_vertical, stepped_axial)
      postureTiltTarget: 0,
      postureShiftXTarget: 0,
      postureShiftYTarget: 0,
      postureTilt: 0,
      postureShiftX: 0,
      postureShiftY: 0,
      nextPostureTs: nowInit + randRange(mp.postureHoldMinMs || 3600, mp.postureHoldMaxMs || 7200),
      pendingCorrectionTs: -1,
      pendingCorrectionTilt: 0,

      // Saccadic eye movement + optional periodic grid / dual-tempo convergence
      gazeTargetX: 0,
      gazeTargetY: 0,
      gazeRightGoalX: 0,
      gazeRightGoalY: 0,
      gazeRightDelayTs: -1,
      gazeX: 0,
      gazeY: 0,
      gazeRightX: 0,
      gazeRightY: 0,
      nextGazeTs: nowInit + randRange(mp.gazeShiftMinMs || 2800, mp.gazeShiftMaxMs || 6200),

      // Independent eye blinking (supports natural_asym, heavy_symmetrical, fixation_shutter)
      nextBlinkTs: nowInit + randRange(mp.blinkIntervalMinMs || 3400, mp.blinkIntervalMaxMs || 7200),
      blinkLeftStart: -1,
      blinkRightStart: -1,
      shutterStartTs: -1,
      shutterEndTs: -1,

      // Subtle Frontier idle micro-expressions (active only during neutral, non-speaking stillness)
      nextMicroExprTs: mp.allowIdleMicroExpressions
        ? nowInit + randRange(mp.microExprIntervalMinMs || 8500, mp.microExprIntervalMaxMs || 15500)
        : Infinity,
      activeMicroExpr: null,
      microExprEndTs: -1,
      microExprWeight: 0,

      // Phrase-structured natural speaking cadence (replaces mechanical sine-wave flapping)
      speakPhase: 'idle', // 'idle' | 'syllable' | 'gap' | 'pause'
      speakPhaseStartTs: -1,
      speakPhaseDurMs: 0,
      speakSyllablesLeft: 0,
      speakTargetAmp: 0,
      speakTargetWidth: 0,
      speakOpenCur: 0,
      speakWidthCur: 0,
      speakBrowPulse: 0,
      speakHeadPulse: 0,
      speakStopTimer: null,

      // Rare Frontier reconstruction instability pulse
      nextGlitchTs: mp.allowReconstructionGlitch
        ? nowInit + randRange(mp.glitchIntervalMinMs || 14500, mp.glitchIntervalMaxMs || 23500)
        : Infinity,
      glitchStartTs: -1,
      glitchEndTs: -1,

      // Encounter transition sweep
      transitionStartTs: -1,
      transitionEndTs: -1,

      _syncModeClasses() {
        if (!this.container) return;
        const eff = isEffectivelyAnimated();
        this.container.classList.toggle('rig-reduced', animMode === 'reduced' || (!eff && animMode !== 'off'));
        this.container.classList.toggle('rig-off', animMode === 'off');
        this.container.dataset.animMode = eff ? 'full' : animMode;
      },

      _bindSvgDom() {
        if (!this.container) return;
        const svg = this.container.querySelector('svg');
        if (!svg) return;
        this.svgEl = svg;
        const q = (sel) => svg.querySelector(sel);
        this.parts = {
          torso: q('[data-rig="torso"]'),
          head: q('[data-rig="head"]'),
          jaw: q('[data-layer="layer_jaw_lower"]'),
          eyeLeft: q('[data-layer="layer_eye_left"]'),
          eyeRight: q('[data-layer="layer_eye_right"]'),
          irisLeft: q('[data-layer="layer_eye_left"] [data-part="iris"]'),
          irisRight: q('[data-layer="layer_eye_right"] [data-part="iris"]'),
          lidUpperLeft: q('[data-layer="layer_eye_left"] [data-part="lid_upper"]'),
          lidLowerLeft: q('[data-layer="layer_eye_left"] [data-part="lid_lower"]'),
          lidUpperRight: q('[data-layer="layer_eye_right"] [data-part="lid_upper"]'),
          lidLowerRight: q('[data-layer="layer_eye_right"] [data-part="lid_lower"]'),
          browLeft: q('[data-layer="layer_brow_left"]'),
          browRight: q('[data-layer="layer_brow_right"]'),
          mouth: q('[data-layer="layer_mouth"]'),
          mouthCavity: q('[data-layer="layer_mouth"] [data-part="mouth_cavity"]'),
          mechCrystal: q('[data-layer="layer_mech_crystal"]'),
          fxOverlay: q('[data-layer="layer_fx_reconstruction"]'),
          fxScanbar: q('[data-layer="layer_fx_reconstruction"] [data-part="fx_scanbar"]'),
          fxLattice: q('[data-layer="layer_fx_reconstruction"] [data-part="fx_lattice"]'),
        };
        this._applyPose(0, true);
      },

      _computeBlinkProgress(now, startTs, durationMs) {
        if (startTs < 0) return 0;
        const elapsed = now - startTs;
        if (elapsed < 0 || elapsed >= durationMs) return 0;
        const closeEnd = durationMs * 0.36;
        const holdEnd = durationMs * 0.46;
        if (elapsed <= closeEnd) return smoothstep(0, closeEnd, elapsed);
        if (elapsed <= holdEnd) return 1;
        return 1 - smoothstep(holdEnd, durationMs, elapsed);
      },

      _stepSpeakingCadence(now, dt) {
        const sc = mp.speakingCadence || {
          syllableMinMs: 130, syllableMaxMs: 230,
          gapMinMs: 55, gapMaxMs: 110,
          pauseMinMs: 360, pauseMaxMs: 640,
          phraseSyllablesMin: 3, phraseSyllablesMax: 6,
          ampMin: 0.24, ampMax: 0.54,
          browEmphasisPx: -1.2, headEmphasisPx: 1.2,
        };

        if (!this.speaking) {
          this.speakPhase = 'idle';
          this.speakTargetAmp = 0;
          this.speakTargetWidth = 0;
          const settle = 1 - Math.exp(-dt / 105);
          this.speakOpenCur = lerp(this.speakOpenCur, 0, settle);
          this.speakWidthCur = lerp(this.speakWidthCur, 0, settle);
          this.speakBrowPulse = lerp(this.speakBrowPulse, 0, 1 - Math.exp(-dt / 165));
          this.speakHeadPulse = lerp(this.speakHeadPulse, 0, 1 - Math.exp(-dt / 185));
          return;
        }

        // Start a new phrase if entering speech from idle
        if (this.speakPhase === 'idle' || this.speakPhaseStartTs < 0) {
          this.speakSyllablesLeft = randInt(sc.phraseSyllablesMin || 3, sc.phraseSyllablesMax || 6);
          this.speakPhase = 'syllable';
          this.speakPhaseStartTs = now;
          this.speakPhaseDurMs = randRange(sc.syllableMinMs || 130, sc.syllableMaxMs || 230);
          this.speakTargetAmp = randRange(sc.ampMin || 0.24, sc.ampMax || 0.54);
          this.speakTargetWidth = (Math.random() * 2 - 1) * 0.045;
          this.speakBrowPulse = sc.browEmphasisPx || -1.2;
          this.speakHeadPulse = sc.headEmphasisPx || 1.2;
        }

        const elapsed = now - this.speakPhaseStartTs;
        if (elapsed >= this.speakPhaseDurMs) {
          if (this.speakPhase === 'syllable') {
            this.speakSyllablesLeft -= 1;
            if (this.speakSyllablesLeft <= 0) {
              // Natural phrase/clause breath pause — mouth settles closed!
              this.speakPhase = 'pause';
              this.speakPhaseStartTs = now;
              this.speakPhaseDurMs = randRange(sc.pauseMinMs || 360, sc.pauseMaxMs || 640);
              this.speakTargetAmp = 0;
              this.speakTargetWidth = 0;
            } else {
              // Brief consonant closure between syllables
              this.speakPhase = 'gap';
              this.speakPhaseStartTs = now;
              this.speakPhaseDurMs = randRange(sc.gapMinMs || 55, sc.gapMaxMs || 110);
              this.speakTargetAmp = randRange(0.03, 0.11);
              this.speakTargetWidth = 0;
            }
          } else if (this.speakPhase === 'gap') {
            this.speakPhase = 'syllable';
            this.speakPhaseStartTs = now;
            this.speakPhaseDurMs = randRange(sc.syllableMinMs || 130, sc.syllableMaxMs || 230);
            const stressed = Math.random() < 0.34;
            this.speakTargetAmp = stressed
              ? randRange((sc.ampMin + sc.ampMax) * 0.52, sc.ampMax || 0.55)
              : randRange(sc.ampMin || 0.24, (sc.ampMin + sc.ampMax) * 0.55);
            this.speakTargetWidth = (Math.random() * 2 - 1) * 0.05;
            if (stressed) {
              this.speakBrowPulse = (sc.browEmphasisPx || -1.2) * randRange(0.65, 1.05);
              this.speakHeadPulse = (sc.headEmphasisPx || 1.2) * randRange(0.55, 1.0);
            }
          } else if (this.speakPhase === 'pause') {
            // Begin next phrase cleanly
            this.speakSyllablesLeft = randInt(sc.phraseSyllablesMin || 3, sc.phraseSyllablesMax || 6);
            this.speakPhase = 'syllable';
            this.speakPhaseStartTs = now;
            this.speakPhaseDurMs = randRange(sc.syllableMinMs || 130, sc.syllableMaxMs || 230);
            this.speakTargetAmp = randRange(sc.ampMin || 0.24, sc.ampMax || 0.54);
            this.speakTargetWidth = (Math.random() * 2 - 1) * 0.045;
            this.speakBrowPulse = (sc.browEmphasisPx || -1.2) * randRange(0.7, 1.0);
            this.speakHeadPulse = (sc.headEmphasisPx || 1.2) * randRange(0.65, 1.0);
          }
        }

        // Smooth bell envelope inside each syllable so speech opens & closes organically
        let desiredOpen = this.speakTargetAmp;
        if (this.speakPhase === 'syllable') {
          const u = Math.max(0, Math.min(1, (now - this.speakPhaseStartTs) / Math.max(1, this.speakPhaseDurMs)));
          const env = Math.sin(u * Math.PI);
          desiredOpen = this.speakTargetAmp * (0.25 + 0.75 * env);
        } else if (this.speakPhase === 'pause') {
          desiredOpen = 0;
        }

        const openTau = this.speakPhase === 'pause' ? 95 : 46;
        this.speakOpenCur = lerp(this.speakOpenCur, desiredOpen, 1 - Math.exp(-dt / openTau));
        this.speakWidthCur = lerp(this.speakWidthCur, this.speakTargetWidth, 1 - Math.exp(-dt / 85));
        this.speakBrowPulse = lerp(this.speakBrowPulse, 0, 1 - Math.exp(-dt / 260));
        this.speakHeadPulse = lerp(this.speakHeadPulse, 0, 1 - Math.exp(-dt / 290));
      },

      _step(now) {
        if (!this.svgEl) return;
        const dt = Math.min(60, Math.max(8, now - this.lastFrameTs));
        this.lastFrameTs = now;

        const targetExpr = this.manifest.expressions[this.expression] || this.manifest.expressions.neutral;
        const blend = 1 - Math.exp(-dt / (this.manifest.aiFamily === 'INSTITUTE' ? 105 : 132));
        // Subtle Frontier facial synchronization lag on mouth/jaw settle when transitioning expressions
        const mouthBlend = this.manifest.aiFamily === 'FRONTIER' ? 1 - Math.exp(-dt / 185) : blend;

        for (const k of [
          'browLeftY', 'browLeftRot', 'browRightY', 'browRightRot',
          'lidUpperOffset', 'lidUpperLeftOffset', 'lidUpperRightOffset', 'lidLowerOffset',
          'headTilt', 'headShiftX', 'headShiftY', 'gazeBiasX', 'gazeBiasY', 'seamOpacity',
        ]) {
          let tv = targetExpr[k];
          if (tv === undefined) {
            if (k === 'lidUpperLeftOffset' || k === 'lidUpperRightOffset') tv = targetExpr.lidUpperOffset || 0;
            else tv = 0;
          }
          this.cur[k] = lerp(this.cur[k] !== undefined ? this.cur[k] : tv, tv, blend);
        }
        for (const k of ['mouthScaleX', 'mouthScaleY', 'mouthY', 'mouthRot', 'mouthOpen', 'jawY']) {
          const defVal = k.includes('Scale') ? 1 : 0;
          const tv = targetExpr[k] !== undefined ? targetExpr[k] : defVal;
          this.cur[k] = lerp(this.cur[k] !== undefined ? this.cur[k] : defVal, tv, mouthBlend);
        }

        // 1. Organic / Profile-Driven Breathing
        const breathProfile = mp.breathProfile || 'organic_wave';
        const inBreathArrest = breathProfile === 'thoracic_contemplative' && this.breathArrestEndTs > 0 && now < this.breathArrestEndTs;
        if (!inBreathArrest) {
          this.breathArrestEndTs = -1;
          this.breathPhase += dt / Math.max(1800, this.breathPeriodCur);
          if (this.breathPhase >= 1) {
            this.breathPhase -= 1;
            this.breathCycleCount += 1;
            const variance = mp.breathingVarianceMs || 0;
            const basePeriod = mp.breathingPeriodMs || 5300;
            this.breathPeriodCur = variance > 0 ? basePeriod + randRange(-variance, variance) : basePeriod;
            if (breathProfile === 'thoracic_contemplative' && this.breathCycleCount % 5 === 0) {
              // Periodic deep contemplative sigh (1.26x) on Frontier Mendeleev
              this.breathAmpScale = 1.26;
              this.breathPeriodCur = basePeriod + 700;
            } else {
              this.breathAmpScale = variance > 0 ? randRange(0.84, 1.16) : 1.0;
            }
          } else if (
            breathProfile === 'thoracic_contemplative' &&
            this.breathCycleCount > 0 &&
            this.breathCycleCount % 4 === 0 &&
            this.breathPhase > 0.39 &&
            this.breathPhase < 0.42 &&
            this.breathArrestEndTs === -1
          ) {
            // Brief mid-calculation breath arrest (~820ms) at upper chest crest
            this.breathArrestEndTs = now + 820;
          }
        }
        this.breathVal = evalBreathCurve(this.breathPhase, breathProfile) * this.breathAmpScale;

        // 2. Profile-Driven Head Posture (dwell_shift | anchored_vertical | stepped_axial)
        const postureStyle = mp.postureStyle || 'dwell_shift';
        if (now >= this.nextPostureTs) {
          const maxTilt = mp.postureMaxTiltDeg !== undefined ? mp.postureMaxTiltDeg : (mp.headSwayDeg || 1.0);
          const maxShiftX = mp.postureMaxShiftXPx !== undefined ? mp.postureMaxShiftXPx : 1.2;
          const maxShiftY = mp.postureMaxShiftYPx !== undefined ? mp.postureMaxShiftYPx : 1.0;
          const returnCenter = Math.random() < (this.manifest.aiFamily === 'INSTITUTE' ? 0.68 : 0.46);
          if (postureStyle === 'anchored_vertical') {
            // Institute Mendeleev: virtually 0 deg lateral tilt; calm vertical lecturer poise adjustments
            this.postureTiltTarget = returnCenter ? 0 : (Math.random() * 2 - 1) * maxTilt;
            this.postureShiftXTarget = returnCenter ? 0 : (Math.random() * 2 - 1) * (maxShiftX * 0.6);
            this.postureShiftYTarget = returnCenter ? 0 : (Math.random() * 2 - 1) * maxShiftY;
          } else if (postureStyle === 'stepped_axial') {
            // Frontier Mendeleev: crisp discrete analytical planes, zero nervous self-correction wobble
            if (returnCenter) {
              this.postureTiltTarget = 0;
              this.postureShiftXTarget = 0;
              this.postureShiftYTarget = 0;
            } else {
              const tiltSteps = [-maxTilt, -maxTilt * 0.5, 0, maxTilt * 0.5, maxTilt];
              const ySteps = [-maxShiftY, -maxShiftY * 0.4, 0, maxShiftY * 0.5, maxShiftY];
              this.postureTiltTarget = tiltSteps[randInt(0, tiltSteps.length - 1)];
              this.postureShiftXTarget = (Math.random() * 2 - 1) * maxShiftX;
              this.postureShiftYTarget = ySteps[randInt(0, ySteps.length - 1)];
            }
          } else if (returnCenter) {
            this.postureTiltTarget = (Math.random() * 2 - 1) * maxTilt * 0.16;
            this.postureShiftXTarget = (Math.random() * 2 - 1) * maxShiftX * 0.2;
            this.postureShiftYTarget = (Math.random() * 2 - 1) * maxShiftY * 0.2;
          } else {
            this.postureTiltTarget = (Math.random() * 2 - 1) * maxTilt;
            this.postureShiftXTarget = (Math.random() * 2 - 1) * maxShiftX;
            this.postureShiftYTarget = (Math.random() * 2 - 1) * maxShiftY;
          }
          // Subtle Frontier Lavoisier posture self-correction shortly after shifting (0 on Mendeleev)
          if (mp.postureCorrectionChance && Math.random() < mp.postureCorrectionChance) {
            this.pendingCorrectionTs = now + randRange(380, 560);
            this.pendingCorrectionTilt = (Math.random() < 0.5 ? -1 : 1) * randRange(0.22, 0.38);
          } else {
            this.pendingCorrectionTs = -1;
          }
          this.nextPostureTs = now + randRange(mp.postureHoldMinMs || 3600, mp.postureHoldMaxMs || 7200);
        }
        if (this.pendingCorrectionTs > 0 && now >= this.pendingCorrectionTs) {
          this.postureTiltTarget = Math.max(-1.6, Math.min(1.6, this.postureTiltTarget + this.pendingCorrectionTilt));
          this.pendingCorrectionTs = -1;
        }
        const postureEase = 1 - Math.exp(-dt / (mp.postureEaseMs || 440));
        this.postureTilt = lerp(this.postureTilt, this.postureTiltTarget, postureEase);
        this.postureShiftX = lerp(this.postureShiftX, this.postureShiftXTarget, postureEase);
        this.postureShiftY = lerp(this.postureShiftY, this.postureShiftYTarget, postureEase);

        // 3. Profile-Driven Blinking (natural_asym | heavy_symmetrical | fixation_shutter)
        const blinkStyle = mp.blinkStyle || 'natural_asym';
        const blinkDur = mp.blinkDurationMs || 145;
        if (now >= this.nextBlinkTs) {
          if (blinkStyle === 'fixation_shutter' && mp.allowAsymmetricBlink && Math.random() < (mp.asymmetricBlinkChance || 0.18)) {
            // Frontier Mendeleev: brief staggered half-lid shutter on left eye, then heavy synchronized reset blink
            this.shutterStartTs = now;
            this.shutterEndTs = now + 150;
            this.blinkLeftStart = now + 130;
            this.blinkRightStart = now + 130;
          } else {
            this.blinkLeftStart = now;
            const asym = blinkStyle !== 'heavy_symmetrical' && mp.allowAsymmetricBlink && Math.random() < (mp.asymmetricBlinkChance || 0.28);
            this.blinkRightStart = now + (asym ? (mp.asymmetricBlinkDelayMs || 54) : 0);
          }
          const doubleBlink = mp.doubleBlinkChance && Math.random() < mp.doubleBlinkChance;
          this.nextBlinkTs = doubleBlink
            ? now + randRange(310, 410)
            : now + randRange(mp.blinkIntervalMinMs || 3400, mp.blinkIntervalMaxMs || 7200);
        }
        if (this.blinkLeftStart > 0 && now - this.blinkLeftStart > blinkDur) this.blinkLeftStart = -1;
        if (this.blinkRightStart > 0 && now - this.blinkRightStart > blinkDur) this.blinkRightStart = -1;
        if (this.shutterStartTs > 0 && now >= this.shutterEndTs) {
          this.shutterStartTs = -1;
          this.shutterEndTs = -1;
        }

        // 4. Profile-Driven Eye Tracking (saccade_center | tabular_row | periodic_grid_dual_tempo)
        const gazePattern = mp.gazePattern || 'saccade_center';
        if (now >= this.nextGazeTs) {
          const maxG = mp.gazeMaxOffsetPx || 3.0;
          const centerBias = mp.gazeCenterBias !== undefined ? mp.gazeCenterBias : 0.45;
          if (gazePattern === 'tabular_row') {
            // Institute Mendeleev: methodical horizontal row check (-2.2, 0, +2.2), minimal vertical wander
            if (Math.random() < centerBias) {
              this.gazeTargetX = 0;
              this.gazeTargetY = 0;
            } else {
              const rowCols = [-maxG, -maxG * 0.5, 0, maxG * 0.5, maxG];
              this.gazeTargetX = rowCols[randInt(0, rowCols.length - 1)];
              this.gazeTargetY = (Math.random() * 2 - 1) * 0.25;
            }
          } else if (gazePattern === 'periodic_grid_dual_tempo') {
            // Frontier Mendeleev: crisp L-shaped orthogonal hops on a 2D periodic lattice (change X OR Y per hop)
            const prevX = this.gazeTargetX;
            const prevY = this.gazeTargetY;
            if (Math.random() < centerBias) {
              this.gazeTargetX = 0;
              this.gazeTargetY = 0;
            } else if (Math.random() < 0.62) {
              const cols = [-maxG, -maxG * 0.5, 0, maxG * 0.5, maxG];
              this.gazeTargetX = cols[randInt(0, cols.length - 1)];
              this.gazeTargetY = prevY;
            } else {
              const rows = [-1.5, 0, 1.3];
              this.gazeTargetX = prevX;
              this.gazeTargetY = rows[randInt(0, rows.length - 1)];
            }
            // Gen-2 dual-tempo convergence: right iris waits rightEyeTrackLagMs before snapping crisply!
            this.gazeRightDelayTs = now + (mp.rightEyeTrackLagMs || 85);
          } else if (Math.random() < centerBias) {
            this.gazeTargetX = (Math.random() * 2 - 1) * (maxG * 0.14);
            this.gazeTargetY = (Math.random() * 2 - 1) * (maxG * 0.1);
          } else {
            this.gazeTargetX = (Math.random() * 2 - 1) * maxG;
            this.gazeTargetY = (Math.random() * 2 - 1) * (maxG * 0.5);
          }
          this.nextGazeTs = now + randRange(mp.gazeShiftMinMs || 2800, mp.gazeShiftMaxMs || 6200);
        }
        const gazeGoalX = this.gazeTargetX + (this.cur.gazeBiasX || 0);
        const gazeGoalY = this.gazeTargetY + (this.cur.gazeBiasY || 0);
        if (gazePattern === 'periodic_grid_dual_tempo') {
          this.gazeX = lerp(this.gazeX, gazeGoalX, 1 - Math.exp(-dt / 68));
          this.gazeY = lerp(this.gazeY, gazeGoalY, 1 - Math.exp(-dt / 68));
          if (this.gazeRightDelayTs < 0 || now >= this.gazeRightDelayTs) {
            this.gazeRightGoalX = gazeGoalX;
            this.gazeRightGoalY = gazeGoalY;
            this.gazeRightDelayTs = -1;
          }
          this.gazeRightX = lerp(this.gazeRightX, this.gazeRightGoalX, 1 - Math.exp(-dt / 55));
          this.gazeRightY = lerp(this.gazeRightY, this.gazeRightGoalY, 1 - Math.exp(-dt / 55));
        } else {
          const leftGazeEase = 1 - Math.exp(-dt / 95);
          const rightLag = mp.rightEyeTrackLagMs || 0;
          const rightGazeEase = rightLag > 0 ? 1 - Math.exp(-dt / (95 + rightLag)) : leftGazeEase;
          this.gazeX = lerp(this.gazeX, gazeGoalX, leftGazeEase);
          this.gazeY = lerp(this.gazeY, gazeGoalY, leftGazeEase);
          this.gazeRightX = rightLag > 0 ? lerp(this.gazeRightX, gazeGoalX, rightGazeEase) : this.gazeX;
          this.gazeRightY = rightLag > 0 ? lerp(this.gazeRightY, gazeGoalY, rightGazeEase) : this.gazeY;
        }

        // 5. Fleeting idle micro-expressions (supports per-manifest idleMicroExpressions or Lavoisier default)
        const microPool = Array.isArray(mp.idleMicroExpressions) && mp.idleMicroExpressions.length > 0
          ? mp.idleMicroExpressions
          : IDLE_MICRO_EXPRESSIONS;
        if (mp.allowIdleMicroExpressions && this.expression === 'neutral' && !this.speaking) {
          if (!this.activeMicroExpr && now >= this.nextMicroExprTs) {
            this.activeMicroExpr = microPool[randInt(0, microPool.length - 1)];
            this.microExprEndTs = now + randRange(mp.microExprDurationMinMs || 1600, mp.microExprDurationMaxMs || 2600);
          } else if (this.activeMicroExpr && now >= this.microExprEndTs) {
            this.activeMicroExpr = null;
            this.microExprEndTs = -1;
            this.nextMicroExprTs = now + randRange(mp.microExprIntervalMinMs || 8500, mp.microExprIntervalMaxMs || 15500);
          }
        } else {
          this.activeMicroExpr = null;
          this.microExprEndTs = -1;
        }
        const targetMicroW = this.activeMicroExpr ? 1 : 0;
        this.microExprWeight = lerp(this.microExprWeight, targetMicroW, 1 - Math.exp(-dt / 260));

        // 6. Phrase-structured natural speaking cadence
        this._stepSpeakingCadence(now, dt);

        // 7. Rare Frontier reconstruction micro-glitch
        if (mp.allowReconstructionGlitch && now >= this.nextGlitchTs && this.glitchStartTs < 0) {
          this.glitchStartTs = now;
          this.glitchEndTs = now + (mp.glitchDurationMs || 460);
          this.nextGlitchTs = now + randRange(mp.glitchIntervalMinMs || 14500, mp.glitchIntervalMaxMs || 23500);
        }
        if (this.glitchStartTs > 0 && now >= this.glitchEndTs) {
          this.glitchStartTs = -1;
          this.glitchEndTs = -1;
        }

        if (this.transitionStartTs > 0 && now >= this.transitionEndTs) {
          this.transitionStartTs = -1;
          this.transitionEndTs = -1;
          this.container.classList.remove('rig-encounter-entering');
        }

        this._applyPose(now, false);
      },

      _applyPose(now, staticSnap) {
        if (!this.svgEl) return;
        const p = this.parts;
        const pv = this.manifest.pivots;
        const targetExpr = this.manifest.expressions[this.expression] || this.manifest.expressions.neutral;
        const pose = staticSnap ? targetExpr : this.cur;

        const mw = !staticSnap && this.activeMicroExpr ? this.microExprWeight : 0;
        const micro = (!staticSnap && this.activeMicroExpr) || {};

        // 1. Torso & chest breathing (vertical rise + subtle ribcage expansion around bottom pivot)
        const breathAmp = mp.breathingAmplitudePx || 1.8;
        const chestScaleAmp = mp.chestScaleAmplitude || 0.003;
        const breathVal = staticSnap ? 0 : this.breathVal;
        const breathY = -breathVal * breathAmp;
        const chestScaleY = 1 + breathVal * chestScaleAmp;

        if (p.torso) {
          if (staticSnap || Math.abs(breathVal) < 0.0001) {
            p.torso.setAttribute('transform', 'translate(0 0)');
          } else {
            p.torso.setAttribute(
              'transform',
              `translate(${pv.torso.x} ${(pv.torso.y + breathY).toFixed(2)}) scale(1 ${chestScaleY.toFixed(5)}) translate(${-pv.torso.x} ${-pv.torso.y})`
            );
          }
        }

        // 2. Head posture (dwell-and-shift + expression tilt/offset + subtle speaking emphasis nod)
        const headShiftX = (pose.headShiftX || 0) + (staticSnap ? 0 : this.postureShiftX);
        const headShiftY = (pose.headShiftY || 0)
          + (staticSnap ? 0 : (this.postureShiftY + this.speakHeadPulse - breathVal * 0.28));
        const headRot = (pose.headTilt || 0)
          + (staticSnap ? 0 : (this.postureTilt + (micro.headTilt || 0) * mw + this.speakHeadPulse * 0.22));

        if (p.head) {
          p.head.setAttribute(
            'transform',
            `translate(${headShiftX.toFixed(2)} ${headShiftY.toFixed(2)}) rotate(${headRot.toFixed(2)} ${pv.head.x} ${pv.head.y})`
          );
        }

        // 3. Coordinated Mouth & Jaw (expression + phrase-structured speaking cadence; respects beard-safe jawSpeechScale!)
        const sc = mp.speakingCadence || {};
        const jawScale = sc.jawSpeechScale !== undefined ? sc.jawSpeechScale : 4.8;
        const speakOpen = staticSnap ? 0 : this.speakOpenCur;
        const speakWidth = staticSnap ? 0 : this.speakWidthCur;
        const effectiveMouthOpen = Math.min(0.82, Math.max(0, (pose.mouthOpen || 0) + speakOpen));
        const effectiveJawY = (pose.jawY || 0) + (micro.jawY || 0) * mw + effectiveMouthOpen * jawScale;

        if (p.jaw) {
          p.jaw.setAttribute('transform', `translate(0 ${effectiveJawY.toFixed(2)})`);
        }

        // 4. Blinks + Rare Frontier Reconstruction Micro-Desync (Gen-1 single drift vs Gen-2 orthogonal dual-axis!)
        const blinkDur = mp.blinkDurationMs || 145;
        let blinkL = staticSnap ? 0 : this._computeBlinkProgress(now, this.blinkLeftStart, blinkDur);
        const blinkR = staticSnap ? 0 : this._computeBlinkProgress(now, this.blinkRightStart, blinkDur);
        if (!staticSnap && this.shutterStartTs > 0 && now < this.shutterEndTs) {
          const sp = (now - this.shutterStartTs) / Math.max(1, this.shutterEndTs - this.shutterStartTs);
          blinkL = Math.max(blinkL, 0.72 * Math.sin(sp * Math.PI));
        }

        const inGlitch = !staticSnap && this.glitchStartTs > 0 && now < this.glitchEndTs;
        const exprInstability = this.expression === 'instability' && this.manifest.aiFamily === 'FRONTIER';
        const isGen2Lattice = mp.glitchStyle === 'gen2_orthogonal_lattice';
        let leftDesyncX = 0;
        let glitchDesyncX = 0;
        let glitchDesyncY = 0;
        if (inGlitch) {
          const gp = (now - this.glitchStartTs) / Math.max(1, this.glitchEndTs - this.glitchStartTs);
          if (isGen2Lattice) {
            // Crisp stepped orthogonal row/column divergence on Gen-2 Frontier Mendeleev
            const stepOn = gp > 0.14 && gp < 0.84 ? 1 : 0;
            leftDesyncX = -2.4 * stepOn;
            glitchDesyncX = 3.2 * stepOn;
            glitchDesyncY = -2.4 * stepOn;
          } else {
            glitchDesyncX = 3.0 * Math.sin(gp * Math.PI);
            glitchDesyncY = -1.2;
          }
        } else if (exprInstability) {
          leftDesyncX = targetExpr.leftEyeDesyncX || 0;
          glitchDesyncX = targetExpr.rightEyeDesyncX || 0;
          glitchDesyncY = targetExpr.rightEyeDesyncY || 0;
        }

        const gxL = staticSnap ? (pose.gazeBiasX || 0) : this.gazeX;
        const gyL = staticSnap ? (pose.gazeBiasY || 0) : this.gazeY;
        const gxR = staticSnap ? (pose.gazeBiasX || 0) : this.gazeRightX;
        const gyR = staticSnap ? (pose.gazeBiasY || 0) : this.gazeRightY;

        if (p.irisLeft) p.irisLeft.setAttribute('transform', `translate(${(gxL + leftDesyncX).toFixed(2)} ${gyL.toFixed(2)})`);
        if (p.irisRight) p.irisRight.setAttribute('transform', `translate(${(gxR + glitchDesyncX).toFixed(2)} ${(gyR + glitchDesyncY).toFixed(2)})`);

        const lidBaseUL = (pose.lidUpperLeftOffset !== undefined ? pose.lidUpperLeftOffset : (pose.lidUpperOffset || 0)) + (micro.lidUpperOffset || 0) * mw;
        const lidBaseUR = (pose.lidUpperRightOffset !== undefined ? pose.lidUpperRightOffset : (pose.lidUpperOffset || 0)) + (micro.lidUpperOffset || 0) * mw;
        const lidBaseL = (pose.lidLowerOffset || 0) + (micro.lidLowerOffset || 0) * mw;
        if (p.lidUpperLeft) p.lidUpperLeft.setAttribute('transform', `translate(0 ${(lidBaseUL + blinkL * 24).toFixed(2)})`);
        if (p.lidUpperRight) p.lidUpperRight.setAttribute('transform', `translate(0 ${(lidBaseUR + blinkR * 24).toFixed(2)})`);
        if (p.lidLowerLeft) p.lidLowerLeft.setAttribute('transform', `translate(0 ${(lidBaseL - blinkL * 4).toFixed(2)})`);
        if (p.lidLowerRight) p.lidLowerRight.setAttribute('transform', `translate(0 ${(lidBaseL - blinkR * 4).toFixed(2)})`);

        // 5. Eyebrows (expression + subtle idle micro-expression + gentle speaking emphasis)
        const speakBrow = staticSnap ? 0 : this.speakBrowPulse;
        const browLY = (pose.browLeftY || 0) + (micro.browLeftY || 0) * mw + speakBrow;
        const browLRot = (pose.browLeftRot || 0) + (micro.browLeftRot || 0) * mw;
        const browRY = (pose.browRightY || 0) + (micro.browRightY || 0) * mw + speakBrow * 0.92;
        const browRRot = (pose.browRightRot || 0) + (micro.browRightRot || 0) * mw;

        if (p.browLeft) {
          p.browLeft.setAttribute(
            'transform',
            `translate(0 ${browLY.toFixed(2)}) rotate(${browLRot.toFixed(2)} ${pv.browLeft.x} ${pv.browLeft.y})`
          );
        }
        if (p.browRight) {
          p.browRight.setAttribute(
            'transform',
            `translate(0 ${browRY.toFixed(2)}) rotate(${browRRot.toFixed(2)} ${pv.browRight.x} ${pv.browRight.y})`
          );
        }

        // 6. Mouth (scale + subtle expression tilt/rotation + speaking vowel modulation)
        if (p.mouth) {
          const sx = (pose.mouthScaleX || 1) + (micro.mouthScaleX || 0) * mw + speakWidth;
          const sy = (pose.mouthScaleY || 1) + effectiveMouthOpen * 0.28;
          const my = (pose.mouthY || 0) + effectiveMouthOpen * 1.5;
          const mRot = pose.mouthRot || 0;
          const rotPart = Math.abs(mRot) > 0.05 ? ` rotate(${mRot.toFixed(2)})` : '';
          p.mouth.setAttribute(
            'transform',
            `translate(${pv.mouth.x} ${(pv.mouth.y + my).toFixed(2)})${rotPart} scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-pv.mouth.x} ${-pv.mouth.y})`
          );
        }
        if (p.mouthCavity) {
          p.mouthCavity.setAttribute('opacity', Math.min(0.92, effectiveMouthOpen * 1.48).toFixed(2));
        }

        // 7. Sub-surface micro-crystalline seam (Frontier only; strictly 0 on Institute)
        if (p.mechCrystal) {
          const seamOp = this.manifest.aiFamily === 'FRONTIER'
            ? (inGlitch
              ? 0.62
              : Math.min(0.9, (pose.seamOpacity !== undefined ? pose.seamOpacity : (mp.restingSeamOpacity || 0)) + (micro.seamOpacityDelta || 0) * mw))
            : 0;
          p.mechCrystal.setAttribute('opacity', seamOp.toFixed(2));
        }

        // 8. Reconstruction FX / Encounter Scan Sweep Overlay (Frontier only)
        if (p.fxOverlay && this.manifest.aiFamily === 'FRONTIER') {
          const inTransition = !staticSnap && this.transitionStartTs > 0 && now < this.transitionEndTs;
          if (inTransition) {
            const prog = (now - this.transitionStartTs) / Math.max(1, this.transitionEndTs - this.transitionStartTs);
            p.fxOverlay.setAttribute('opacity', (1 - prog * 0.72).toFixed(2));
            if (p.fxScanbar) p.fxScanbar.setAttribute('transform', `translate(0 ${(-240 + prog * 960).toFixed(1)})`);
            if (p.fxLattice) p.fxLattice.setAttribute('opacity', (prog > 0.25 && prog < 0.85 ? 0.65 : 0.15).toFixed(2));
          } else if (inGlitch || exprInstability) {
            p.fxOverlay.setAttribute('opacity', (inGlitch ? 0.56 : (targetExpr.fxOverlayOpacity || 0.68)).toFixed(2));
            if (p.fxScanbar) p.fxScanbar.setAttribute('transform', 'translate(0 185)');
            if (p.fxLattice) p.fxLattice.setAttribute('opacity', inGlitch ? '0.62' : '0.78');
          } else {
            p.fxOverlay.setAttribute('opacity', '0');
          }
        }
      },

      setExpression(exprId) {
        if (!this.manifest.expressions[exprId]) return false;
        this.expression = exprId;
        this.container.dataset.expression = exprId;
        if (exprId !== 'neutral') {
          this.activeMicroExpr = null;
          this.microExprEndTs = -1;
        }
        if (!isEffectivelyAnimated()) {
          this._applyPose(0, true);
        }
        return true;
      },

      setSpeaking(isSpeaking) {
        if (this.speakStopTimer) {
          clearTimeout(this.speakStopTimer);
          this.speakStopTimer = null;
        }
        this.speaking = Boolean(isSpeaking);
        this.container.dataset.speaking = this.speaking ? 'true' : 'false';
        if (!this.speaking) {
          this.speakPhase = 'idle';
          this.speakTargetAmp = 0;
          this.speakTargetWidth = 0;
          if (!isEffectivelyAnimated()) {
            this.speakOpenCur = 0;
            this.speakWidthCur = 0;
            this.speakBrowPulse = 0;
            this.speakHeadPulse = 0;
            this._applyPose(0, true);
          }
        }
      },

      speakForDuration(durationMs, onComplete) {
        const dur = Math.max(800, Math.min(8000, Number(durationMs) || 2600));
        this.setSpeaking(true);
        if (!isEffectivelyAnimated()) {
          this.setSpeaking(false);
          if (typeof onComplete === 'function') onComplete();
          return false;
        }
        this.speakStopTimer = setTimeout(() => {
          this.speakStopTimer = null;
          if (this.destroyed) return;
          this.setSpeaking(false);
          if (typeof onComplete === 'function') onComplete();
        }, dur);
        return true;
      },

      triggerReconstructionGlitch() {
        if (!this.manifest.motionProfile.allowReconstructionGlitch) return false;
        if (!isEffectivelyAnimated()) {
          this.setExpression('instability');
          return true;
        }
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.glitchStartTs = now;
        this.glitchEndTs = now + (this.manifest.motionProfile.glitchDurationMs || 460);
        return true;
      },

      triggerEncounterTransition() {
        if (!isEffectivelyAnimated()) return false;
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        this.transitionStartTs = now;
        this.transitionEndTs = now + 1050;
        this.container.classList.remove('rig-encounter-entering');
        void this.container.offsetWidth;
        this.container.classList.add('rig-encounter-entering');
        return true;
      },

      setLayerVisibility(layerId, visible) {
        if (!this.svgEl) return false;
        const el = this.svgEl.querySelector(`[data-layer="${layerId}"]`);
        if (!el) return false;
        el.style.display = visible ? '' : 'none';
        return true;
      },

      getLayers() {
        return Array.from(this.manifest.requiredLayers || []);
      },

      getState() {
        return {
          characterId: this.characterId,
          aiFamily: this.manifest.aiFamily,
          expression: this.expression,
          speaking: this.speaking,
          speakPhase: this.speakPhase,
          activeMicroExpression: this.activeMicroExpr ? this.activeMicroExpr.id : null,
          animMode: isEffectivelyAnimated() ? 'full' : animMode,
          mountedSvg: Boolean(this.svgEl),
          layerCount: this.svgEl ? this.svgEl.querySelectorAll('[data-layer]').length : 0,
        };
      },

      destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        if (this.speakStopTimer) {
          clearTimeout(this.speakStopTimer);
          this.speakStopTimer = null;
        }
        activeRigs.delete(this);
        this.parts = {};
        this.svgEl = null;
        this.container = null;
        if (activeRigs.size === 0 && rafId !== null && typeof global.cancelAnimationFrame === 'function') {
          global.cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
    };

    rig._syncModeClasses();
    activeRigs.add(rig);

    function applyLoadedSvg(svgText) {
      if (rig.destroyed || !container) return;
      if (svgText) {
        container.innerHTML = namespaceSvgMarkup(svgText, prefix);
        rig._bindSvgDom();
        if (opts.autoplayTransition && isEffectivelyAnimated()) {
          rig.triggerEncounterTransition();
        }
        if (isEffectivelyAnimated()) {
          ensureTickLoop();
        }
      } else {
        const src = resolveSourcePath(characterId, manifest);
        container.innerHTML = `<img src="${src}" alt="${manifest.displayName}" style="width:100%;height:100%;object-fit:cover;display:block;" />`;
      }
    }

    const cachedUrl = resolveSourcePath(characterId, manifest);
    if (svgCache[cachedUrl]) {
      applyLoadedSvg(svgCache[cachedUrl]);
    } else if (V.CHARACTER_SVG_SOURCES && V.CHARACTER_SVG_SOURCES[cachedUrl]) {
      svgCache[cachedUrl] = V.CHARACTER_SVG_SOURCES[cachedUrl];
      applyLoadedSvg(svgCache[cachedUrl]);
    } else {
      loadSvgSource(characterId, manifest).then(applyLoadedSvg);
    }

    return rig;
  }

  function destroyAll() {
    for (const rig of Array.from(activeRigs)) rig.destroy();
  }

  function getActiveRigCount() {
    for (const rig of Array.from(activeRigs)) {
      if (!rig || rig.destroyed || (rig.container && typeof rig.container.isConnected === 'boolean' && !rig.container.isConnected)) {
        if (rig && !rig.destroyed) rig.destroy();
        else activeRigs.delete(rig);
      }
    }
    return activeRigs.size;
  }

  // Initialize persisted preference immediately
  loadAnimationPreference();

  V.CharacterRig = {
    STORAGE_KEY,
    DEFAULT_EXPRESSIONS,
    REQUIRED_PIVOT_KEYS,
    VALID_MOTION_ENUMS,
    DEFAULT_MOTION_PROFILE,
    BUILTIN_CHARACTERS,
    validateManifest,
    registerCharacter,
    getCharacterManifest,
    listCharacters,
    getRegistrationDiagnostics,
    getAnimationMode,
    setAnimationMode,
    isEffectivelyAnimated,
    syncAllRigsMode,
    mount,
    destroyAll,
    getActiveRigCount,
    namespaceSvgMarkup,
  };
})(typeof window !== 'undefined' ? window : globalThis);
