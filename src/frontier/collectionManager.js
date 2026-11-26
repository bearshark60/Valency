// VALENCY: THE ELEMENTAL FRONTIER — Phase 3: Collection & Deck Manager
// Uses canonical card definitions from src/data/cards.js (zero duplicate card definitions).
// Tracks permanent card quantities, variants, and upgrade state; separates permanent vs. temporary expedition cards.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  /**
   * Explicitly flagged deck-construction rules not yet specified in Unit 1 rules.
   * Do NOT invent arbitrary constructed caps without design approval.
   */
  const DECK_RULE_GAPS_FOR_DESIGN_APPROVAL = Object.freeze({
    minConstructedDeckSize: 'NOT_DEFINED_IN_UNIT_1 (currently enforces technical deal floor of 14 cards)',
    maxConstructedDeckSize: 'NOT_DEFINED_IN_UNIT_1 (no arbitrary upper cap enforced yet)',
    maxCopiesPerCardId: 'NOT_DEFINED_IN_UNIT_1 (currently bounded only by player owned quantity)',
  });

  const TECHNICAL_MIN_DEAL_CARDS = 14; // 5+5 opening deal + 2+2 Turn 1/2 draws

  function canonicalCardIdForSpec(spec) {
    if (!spec) return null;
    if (spec.kind === 'noble_gas') return `ng_${spec.symbol}`;
    if (spec.kind === 'element') return `el_${spec.symbol}`;
    if (spec.kind === 'instance') return `inst_${spec.effectId}`;
    if (spec.kind === 'event') return `ev_${spec.effectId}`;
    return null;
  }

  /**
   * Build read-only lookup of all canonical Unit 1 card definitions from src/data/cards.js.
   */
  function getCanonicalCatalog() {
    const catalog = {};
    for (const spec of V.ELEMENT_SPECS || []) {
      const id = canonicalCardIdForSpec(spec);
      if (id) catalog[id] = { cardId: id, spec };
    }
    for (const spec of V.INSTANCE_SPECS || []) {
      const id = canonicalCardIdForSpec(spec);
      if (id) catalog[id] = { cardId: id, spec };
    }
    for (const spec of V.EVENT_SPECS || []) {
      const id = canonicalCardIdForSpec(spec);
      if (id) catalog[id] = { cardId: id, spec };
    }
    return catalog;
  }

  function getCardSpec(cardId) {
    const entry = getCanonicalCatalog()[cardId];
    return entry ? entry.spec : null;
  }

  /**
   * Seed the player's starter permanent collection and starter Frontier deck from canonical Unit 1 counts.
   * Called ONCE per new PlayerProfile during migration.
   */
  function seedStarterCollection(profile) {
    const catalog = getCanonicalCatalog();
    profile.collection = profile.collection || {};
    const starterDeckCounts = {};

    for (const [cardId, { spec }] of Object.entries(catalog)) {
      const qty = spec.copies || 1;
      if (!profile.collection[cardId]) {
        profile.collection[cardId] = {
          cardId,
          quantity: qty,
          variants: { standard: qty },
          upgradeState: { tier: 0, upgradedCopies: 0 },
        };
      }
      starterDeckCounts[cardId] = qty;
    }

    profile.decks = profile.decks || {};
    if (!profile.decks.deck_frontier_starter) {
      profile.decks.deck_frontier_starter = {
        deckId: 'deck_frontier_starter',
        name: 'Academy Standard Reagent Deck',
        cardCounts: starterDeckCounts,
        equippedScientistId: profile.equippedScientistId || null,
        deckConfiguration: {
          derivedFrom: 'UNIT_1_CANONICAL_120',
          allowTemporaryExpeditionCards: true,
        },
      };
    }
    profile.activeDeckId = profile.activeDeckId || 'deck_frontier_starter';
    return profile;
  }

  /**
   * Add permanent card copies to a PlayerProfile's collection (meaningful duplicates & variant support).
   * Should only be invoked via RewardProcessor for permanent rewards!
   */
  function addPermanentCard(profile, cardId, quantity, variantName) {
    const spec = getCardSpec(cardId);
    if (!spec) return { ok: false, error: `Unknown canonical cardId: ${cardId}` };
    const addQty = Math.max(1, Number(quantity) || 1);
    const variant = variantName || 'standard';

    profile.collection = profile.collection || {};
    if (!profile.collection[cardId]) {
      profile.collection[cardId] = {
        cardId,
        quantity: 0,
        variants: {},
        upgradeState: { tier: 0, upgradedCopies: 0 },
      };
    }
    const rec = profile.collection[cardId];
    rec.quantity += addQty;
    rec.variants = rec.variants || {};
    rec.variants[variant] = (rec.variants[variant] || 0) + addQty;
    return { ok: true, entry: rec };
  }

  function getOwnedQuantity(profile, cardId) {
    const rec = profile && profile.collection && profile.collection[cardId];
    return rec ? rec.quantity || 0 : 0;
  }

  function getCollectionSummary(profile) {
    const col = (profile && profile.collection) || {};
    let uniqueOwned = 0;
    let totalCopies = 0;
    let duplicateCopies = 0;
    let variantCount = 0;
    for (const rec of Object.values(col)) {
      if ((rec.quantity || 0) > 0) {
        uniqueOwned += 1;
        totalCopies += rec.quantity;
        if (rec.quantity > 1) duplicateCopies += rec.quantity - 1;
        variantCount += Object.keys(rec.variants || {}).length;
      }
    }
    return { uniqueOwned, totalCopies, duplicateCopies, variantCount };
  }

  /**
   * Validate a Deck strictly against existing Unit 1 game rules and permanent ownership.
   */
  function validateDeck(deck, profile) {
    const errors = [];
    const warnings = [];
    if (!deck || typeof deck !== 'object' || !deck.cardCounts) {
      return { valid: false, errors: ['Deck is missing cardCounts.'], warnings, totalCards: 0 };
    }
    const catalog = getCanonicalCatalog();
    let totalCards = 0;
    let bondingElements = 0;

    for (const [cardId, rawCount] of Object.entries(deck.cardCounts)) {
      const count = Number(rawCount) || 0;
      if (count < 0 || !Number.isInteger(count)) {
        errors.push(`Invalid card count for ${cardId}: ${rawCount}`);
        continue;
      }
      if (count === 0) continue;
      const entry = catalog[cardId];
      if (!entry) {
        errors.push(`Card ${cardId} does not exist in canonical Unit 1 card definitions.`);
        continue;
      }
      const owned = getOwnedQuantity(profile, cardId);
      if (count > owned) {
        errors.push(`Deck uses ${count}x ${entry.spec.name} (${cardId}), but player owns only ${owned}.`);
      }
      totalCards += count;
      if (entry.spec.kind === 'element') bondingElements += count;
    }

    if (totalCards < TECHNICAL_MIN_DEAL_CARDS) {
      errors.push(`Deck must contain at least ${TECHNICAL_MIN_DEAL_CARDS} cards so opening hands and turns can deal cleanly.`);
    }
    if (bondingElements < 4) {
      errors.push('Deck must contain at least 4 bonding Element cards to legally synthesize compounds.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      totalCards,
      bondingElements,
      flaggedDesignGaps: DECK_RULE_GAPS_FOR_DESIGN_APPROVAL,
    };
  }

  function setDeckCardCount(profile, deckId, cardId, newCount) {
    const deck = profile.decks && profile.decks[deckId];
    if (!deck) return { ok: false, error: 'Deck not found.' };
    const spec = getCardSpec(cardId);
    if (!spec) return { ok: false, error: `Unknown cardId: ${cardId}` };
    const count = Math.max(0, Math.floor(Number(newCount) || 0));
    const owned = getOwnedQuantity(profile, cardId);
    if (count > owned) {
      return { ok: false, error: `Cannot assign ${count}x ${spec.name}; only ${owned} owned permanently.` };
    }
    const nextDeck = {
      ...deck,
      cardCounts: { ...deck.cardCounts, [cardId]: count },
    };
    const check = validateDeck(nextDeck, profile);
    if (!check.valid) {
      return { ok: false, error: check.errors[0], validation: check };
    }
    profile.decks[deckId] = nextDeck;
    return { ok: true, deck: nextDeck, validation: check };
  }

  /**
   * Build live battle card objects from permanent deck + OPTIONAL temporary expedition cards.
   * Guarantees temporary cards are flagged `isTemporary: true` and NEVER written into `profile.collection`.
   */
  function buildBattleDeckCards(profile, deckId, temporaryExpeditionCards, temporaryModifications) {
    const activeId = deckId || (profile && profile.activeDeckId) || 'deck_frontier_starter';
    const deck = profile && profile.decks && profile.decks[activeId];
    const validation = validateDeck(deck, profile);
    if (!validation.valid) {
      // Safe fallback to canonical full deck if deck somehow invalid
      return { ok: false, error: validation.errors.join(' '), cards: V.buildFullDeck() };
    }

    const catalog = getCanonicalCatalog();
    const cards = [];
    let seq = 1;

    // 1. Permanent owned deck cards
    for (const [cardId, count] of Object.entries(deck.cardCounts)) {
      const spec = catalog[cardId] && catalog[cardId].spec;
      if (!spec) continue;
      for (let i = 0; i < count; i++) {
        cards.push({
          id: `perm_${seq++}_${spec.symbol || spec.effectId}`,
          canonicalCardId: cardId,
          isTemporary: false,
          ...spec,
        });
      }
    }

    // 2. Temporary expedition-only cards (isolated from permanent collection!)
    const tempList = Array.isArray(temporaryExpeditionCards) ? temporaryExpeditionCards : [];
    for (const temp of tempList) {
      const spec = catalog[temp.cardId] && catalog[temp.cardId].spec;
      if (!spec) continue;
      const qty = Math.max(1, Number(temp.quantity) || 1);
      for (let i = 0; i < qty; i++) {
        cards.push({
          id: `temp_${seq++}_${spec.symbol || spec.effectId}`,
          canonicalCardId: temp.cardId,
          isTemporary: true,
          expeditionSourceNodeId: temp.sourceNodeId || null,
          ...spec,
        });
      }
    }

    return {
      ok: true,
      cards,
      permanentCount: validation.totalCards,
      temporaryCount: cards.length - validation.totalCards,
      appliedModifications: Array.isArray(temporaryModifications) ? temporaryModifications.length : 0,
    };
  }

  F.DECK_RULE_GAPS_FOR_DESIGN_APPROVAL = DECK_RULE_GAPS_FOR_DESIGN_APPROVAL;
  F.CollectionManager = {
    canonicalCardIdForSpec,
    getCanonicalCatalog,
    getCardSpec,
    seedStarterCollection,
    addPermanentCard,
    getOwnedQuantity,
    getCollectionSummary,
    validateDeck,
    setDeckCardCount,
    buildBattleDeckCards,
  };
})(typeof window !== 'undefined' ? window : globalThis);
