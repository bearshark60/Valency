// VALENCY — Story Mode UI & Historical Research Archive Controller
// Drives Chapter 0: Academy Licensure Hub, Registration/Examination Dialogues,
// Briefings, Post-Match Licensure Evaluations, and the Two-Stage Scientist Research Archive.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  let activeHubTab = 'missions'; // 'missions' | 'archive' | 'audio'

  const SCIENTIST_AUDIO_TRACKS = [
    {
      mode: 'scientist_lavoisier',
      portraitRef: 'lavoisier',
      title: 'Antoine Lavoisier — Conservation Theme',
      filename: 'lavoisier-theme.wav',
      styleNote: 'Built-in fallback: 18th-century Baroque harpsichord arpeggio in D major (108 BPM)',
    },
    {
      mode: 'scientist_mendeleev',
      portraitRef: 'mendeleev',
      title: 'Dmitri Mendeleev — Periodic Law Theme',
      filename: 'mendeleev-theme.wav',
      styleNote: 'Built-in fallback: Structured periodic octave waltz in A minor (114 BPM)',
    },
    {
      mode: 'scientist_pauling',
      portraitRef: 'pauling',
      title: 'Linus Pauling — Electronegativity Theme',
      filename: 'pauling-theme.wav',
      styleNote: 'Built-in fallback: High-energy syncopated E-Dorian tactical groove (128 BPM)',
    },
    {
      mode: 'scientist_curie',
      portraitRef: 'curie',
      title: 'Marie Curie — Luminous Nocturne',
      filename: 'curie-theme.wav',
      styleNote: 'Built-in fallback: Crystalline glass-bell nocturne in F♯ minor (96 BPM)',
    },
    {
      mode: 'scientist_proctor',
      portraitRef: 'proctor',
      title: 'Final Examination — The Licensure Trial',
      filename: 'final-exam-theme.wav',
      styleNote: 'Built-in fallback: Stately C-minor examination cadence (120 BPM)',
    },
  ];

  /**
   * Open the main Story Mode Hub modal (Chapter 0: Academy Licensure + Research Archive).
   */
  function openStoryHub(initialTab) {
    if (initialTab) activeHubTab = initialTab;
    const prog = V.Story.loadProgression();
    const chapter = V.Story.getChapter0();
    const scientists = V.Story.listScientistProfiles();

    const completedCount = chapter.missions.filter(
      (m) => prog.completedMissions[m.missionId] && prog.completedMissions[m.missionId].completed
    ).length;

    const stage1Count = scientists.filter((s) => V.Story.getScientistProgress(prog, s.scientistId).stageOneUnlocked).length;
    const stage2Count = scientists.filter((s) => V.Story.getScientistProgress(prog, s.scientistId).stageTwoUnlocked).length;

    const missionsHTML = chapter.missions.map((m) => {
      const unlocked = V.Story.isMissionUnlocked(m, prog);
      const rec = prog.completedMissions[m.missionId];
      const completed = Boolean(rec && rec.completed);
      const sci = m.scientistId ? V.Story.getScientistProfile(m.scientistId) : null;
      const oppCfg = m.opponentConfigId ? V.Story.getOpponentConfig(m.opponentConfigId) : null;
      const sProg = m.scientistId ? V.Story.getScientistProgress(prog, m.scientistId) : null;
      const portraitKey = sci ? sci.portraitRef : (m.opponentPortraitRef || 'proctor');
      const avatarHTML = V.renderPortraitSVG ? V.renderPortraitSVG(portraitKey, 'story-row-avatar') : '';

      const badges = [];
      if (completed) badges.push(`<span class="story-badge badge-done">✓ Cleared</span>`);
      else if (unlocked) badges.push(`<span class="story-badge badge-open">Ready</span>`);
      else badges.push(`<span class="story-badge badge-locked">🔒 Locked</span>`);

      if (oppCfg) badges.push(`<span class="story-badge badge-diff">${esc(oppCfg.difficulty)}</span>`);
      if (rec && rec.bestLicensureTier && rec.bestLicensureTier !== 'Not Yet Certified') {
        badges.push(`<span class="story-badge badge-tier">${esc(rec.bestLicensureTier)} (${rec.bestOverall}%)</span>`);
      }
      if (sProg && sProg.stageTwoUnlocked) {
        badges.push(`<span class="story-badge badge-stage2">★ Stage 2 Eligible</span>`);
      }

      return `
        <div class="story-mission-row ${completed ? 'completed' : ''} ${unlocked ? '' : 'locked'}">
          ${avatarHTML}
          <div class="story-mission-info">
            <div class="story-badges">${badges.join('')}</div>
            <strong class="story-mission-title">${m.order}. ${esc(m.title)}</strong>
            <div class="story-mission-sub">${esc(m.subtitle)}</div>
          </div>
          <button class="btn-action ${unlocked ? (completed ? 'btn-pass' : 'btn-synth') : 'btn-pass'}" data-launch-mission="${m.missionId}" ${unlocked ? '' : 'disabled'}>
            ${unlocked ? (completed ? 'Replay' : (m.type === 'narrative' ? 'Attend ▶' : 'Begin Exam ▶')) : 'Locked'}
          </button>
        </div>
      `;
    }).join('');

    const frontierCard = prog.chapter1Unlocked
      ? `
        <div class="frontier-teaser unlocked">
          <strong>🧭 ${esc(chapter.nextChapterPreview.title)} — UNLOCKED!</strong>
          <p>${esc(chapter.nextChapterPreview.teaser)}</p>
          <span class="story-badge badge-stage2">Academy License: ${esc(prog.chapter0LicensureTier)} • Ready for Chapter 1 Expansion</span>
        </div>
      `
      : `
        <div class="frontier-teaser">
          <strong>🔒 Next Chapter: ${esc(chapter.nextChapterPreview.title)}</strong>
          <p>Complete the Final Examination – The Licensure Trial to earn your Academy License and investigate the Molecular Instability Mystery.</p>
        </div>
      `;

    const archiveHTML = scientists.map((sci) => {
      const sProg = V.Story.getScientistProgress(prog, sci.scientistId);
      const rc = V.Story.getResearchChallenge(sci.researchChallengeRef);
      const futCard = V.Story.getFutureScientistCard(sci.futureCardRef);
      const avatar = V.renderPortraitSVG ? V.renderPortraitSVG(sci.portraitRef, 'archive-avatar') : '';

      if (!sProg.stageOneUnlocked) {
        return `
          <div class="archive-card locked">
            <div class="archive-head">
              ${avatar}
              <div>
                <h4>${esc(sci.historicalName)} <small>(${esc(sci.lifespan)})</small></h4>
                <div class="archive-spec">Specialty: ${esc(sci.specialty)}</div>
                <span class="story-badge badge-locked">🔒 Stage 1 Locked — Defeat simulation in Chapter 0</span>
              </div>
            </div>
          </div>
        `;
      }

      const bestRec = sProg.bestExaminationRecord;
      const discoveries = sci.historicalDiscoveries.map((d) => `<li>${esc(d)}</li>`).join('');
      const stageTwoBlock = sProg.stageTwoUnlocked
        ? `
          <div class="archive-stage2 unlocked">
            <strong>★ STAGE TWO UNLOCKED — Future Scientist Card Eligible</strong>
            <div>Research Challenge "${esc(rc ? rc.title : '')}" completed. Persistent eligibility recorded for <code>${esc(futCard ? futCard.cardId : sci.futureCardRef)}</code> (inactive in Unit 1; reserved for future Scientist Card expansion).</div>
          </div>
        `
        : `
          <div class="archive-stage2">
            <strong>○ STAGE TWO: Research Challenge — ${esc(rc ? rc.title : '')}</strong>
            <div>${esc(rc ? rc.description : '')}</div>
          </div>
        `;

      return `
        <div class="archive-card unlocked">
          <div class="archive-head">
            ${avatar}
            <div>
              <h4>${esc(sci.historicalName)} <small>(${esc(sci.lifespan)})</small></h4>
              <div class="archive-spec">${esc(sci.specialty)} • Affinities: ${esc(sci.elementalAffinities.join(', '))}</div>
              <div class="story-badges" style="margin-top:4px;">
                <span class="story-badge badge-done">✓ Stage 1 Archive Unlocked</span>
                ${bestRec ? `<span class="story-badge badge-tier">${esc(bestRec.licensureTier)} (${bestRec.overall}%)</span>` : ''}
              </div>
            </div>
          </div>
          <p class="archive-bio">${esc(sci.biography)}</p>
          <div class="archive-discoveries">
            <strong>Historical Discoveries:</strong>
            <ul>${discoveries}</ul>
          </div>
          ${stageTwoBlock}
          <div class="archive-disclaimer">${esc(sci.simulationPersonality.disclaimer)}</div>
        </div>
      `;
    }).join('');

    const currentMode = V.Sound && V.Sound.getMusicMode ? V.Sound.getMusicMode() : null;
    const audioTracksHTML = SCIENTIST_AUDIO_TRACKS.map((t) => {
      const avatar = V.renderPortraitSVG ? V.renderPortraitSVG(t.portraitRef, 'story-row-avatar') : '';
      const isPlaying = currentMode === t.mode;
      return `
        <div class="story-mission-row ${isPlaying ? 'completed' : ''}">
          ${avatar}
          <div class="story-mission-info">
            <div class="story-badges">
              <span class="story-badge ${isPlaying ? 'badge-done' : 'badge-open'}">${isPlaying ? '♪ Playing Now' : 'Drop-in Ready'}</span>
              <span class="story-badge badge-diff">assets/audio/${esc(t.filename)}</span>
            </div>
            <strong class="story-mission-title">${esc(t.title)}</strong>
            <div class="story-mission-sub">${esc(t.styleNote)}</div>
          </div>
          <div class="story-audio-actions">
            <button class="ctrl-btn" data-preview-track="${t.mode}">${isPlaying ? '■ Stop' : '▶ Preview'}</button>
            <button class="ctrl-btn" data-pick-track="${t.mode}" title="Test a local .wav / .mp3 / .ogg / .m4a file immediately">📁 Load File</button>
            <input type="file" accept="audio/*" class="hidden" data-track-input="${t.mode}" />
          </div>
        </div>
      `;
    }).join('');

    const body = `
      <div class="story-hub-summary">
        <div>
          <strong>${esc(chapter.title)}</strong>
          <div class="story-hub-sub">Progress: ${completedCount} / ${chapter.missions.length} Missions • Archive: ${stage1Count}/4 Stage 1, ${stage2Count}/4 Stage 2 • Licensure: <strong style="color:#5eead4">${esc(prog.chapter0LicensureTier)}</strong></div>
        </div>
        <button id="btn-story-reset" class="ctrl-btn" title="Reset Story Mode progression">Reset Save</button>
      </div>

      <div class="story-tabs story-tabs-3">
        <button id="story-tab-missions" class="sidebar-tab ${activeHubTab === 'missions' ? 'active' : ''}">📋 Chapter 0 Missions</button>
        <button id="story-tab-archive" class="sidebar-tab ${activeHubTab === 'archive' ? 'active' : ''}">📚 Research Archive (${stage1Count}/4)</button>
        <button id="story-tab-audio" class="sidebar-tab ${activeHubTab === 'audio' ? 'active' : ''}">🎵 Scientist Themes</button>
      </div>

      <div class="${activeHubTab === 'missions' ? '' : 'hidden'}">
        <div class="story-mission-list">${missionsHTML}</div>
        ${frontierCard}
      </div>

      <div class="${activeHubTab === 'archive' ? '' : 'hidden'}">
        <div class="archive-list">${archiveHTML}</div>
      </div>

      <div class="${activeHubTab === 'audio' ? '' : 'hidden'}">
        <div class="briefing-box" style="margin-bottom:10px;">
          <strong>Custom Per-Scientist Music:</strong> Drop your own <code>.wav</code>, <code>.mp3</code>, <code>.ogg</code>, or <code>.m4a</code> files into <code>assets/audio/</code> using the exact filenames below and refresh—or click <strong>📁 Load File</strong> to audition a track live right now. Built-in synthesized themes play automatically whenever no custom file is present.
        </div>
        <div class="story-mission-list">${audioTracksHTML}</div>
      </div>
    `;

    V.UI.openModal('📖 VALENCY Story Mode — Academy Licensure', body, (root) => {
      root.querySelector('#story-tab-missions').addEventListener('click', () => openStoryHub('missions'));
      root.querySelector('#story-tab-archive').addEventListener('click', () => openStoryHub('archive'));
      root.querySelector('#story-tab-audio').addEventListener('click', () => openStoryHub('audio'));
      root.querySelector('#btn-story-reset').addEventListener('click', () => {
        openResetConfirmModal();
      });
      root.querySelectorAll('[data-launch-mission]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const m = V.Story.getMissionById(btn.getAttribute('data-launch-mission'));
          if (m) openMissionBriefingModal(m);
        });
      });
      root.querySelectorAll('[data-preview-track]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!V.Sound) return;
          V.Sound.unlockAudio();
          const targetMode = btn.getAttribute('data-preview-track');
          if (V.Sound.getMusicMode && V.Sound.getMusicMode() === targetMode) {
            V.Sound.setMusicMode('menu');
          } else {
            V.Sound.setMusicEnabled(true);
            V.Sound.setMusicMode(targetMode);
          }
          openStoryHub('audio');
        });
      });
      root.querySelectorAll('[data-pick-track]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetMode = btn.getAttribute('data-pick-track');
          const input = root.querySelector(`[data-track-input="${targetMode}"]`);
          if (input) input.click();
        });
      });
      root.querySelectorAll('[data-track-input]').forEach((input) => {
        input.addEventListener('change', () => {
          const file = input.files && input.files[0];
          const targetMode = input.getAttribute('data-track-input');
          if (!file || !V.Sound || !V.Sound.loadCustomTrackForMode) return;
          V.Sound.unlockAudio();
          V.Sound.loadCustomTrackForMode(targetMode, file);
          openStoryHub('audio');
        });
      });
    });
  }

  /**
   * Explicit confirmation dialog before wiping Story Mode campaign progress.
   */
  function openResetConfirmModal() {
    const body = `
      <div class="story-confirm-box">
        <p style="font-size:13.5px;color:#fecaca;line-height:1.5;">
          <strong>Erase all Chapter 0: Academy Licensure progress?</strong><br />
          This permanently clears completed missions, Historical Research Archive entries, Stage Two eligibility records, and earned Licensure tiers.
        </p>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:12px;">
          <button id="btn-reset-cancel" class="btn-action btn-pass">Cancel</button>
          <button id="btn-reset-confirm" class="btn-action btn-play-red">Confirm Reset</button>
        </div>
      </div>
    `;
    V.UI.openModal('⚠ Confirm Campaign Reset', body, (root) => {
      root.querySelector('#btn-reset-cancel').addEventListener('click', () => openStoryHub(activeHubTab));
      root.querySelector('#btn-reset-confirm').addEventListener('click', () => {
        V.Story.resetProgression();
        openStoryHub('missions');
      });
    });
  }

  /**
   * Open the pre-encounter Introduction -> Character/Scientist Intro -> Dialogue -> Examination Briefing modal.
   */
  function openMissionBriefingModal(mission) {
    if (mission.type === 'narrative') {
      const lav = V.Story.getScientistProfile('lavoisier');
      const lines = (mission.dialogue || []).map((d) => `
        <div class="dialogue-line">
          ${V.renderPortraitSVG ? V.renderPortraitSVG(d.portraitRef || 'proctor', 'dialogue-avatar') : ''}
          <div>
            <strong>${esc(d.speaker)}</strong>
            <p>“${esc(d.text)}”</p>
          </div>
        </div>
      `).join('');

      const focusChips = ((mission.briefing && mission.briefing.licensureFocus) || [])
        .map((f) => `<span class="story-badge badge-tier">${esc(f)}</span>`)
        .join('');

      const body = `
        <div class="story-intro-banner">
          <div class="story-section-kicker">CHAPTER 0 PROLOGUE • STORY INTRODUCTION</div>
          <p class="story-intro-text">${esc(mission.introduction)}</p>
        </div>

        <div class="story-char-grid">
          <div class="story-char-card">
            <img src="assets/portraits/proctor.svg" alt="Academy Registrar" class="story-char-img" />
            <div>
              <div class="story-section-kicker">CHARACTER INTRODUCTION</div>
              <strong>Academy Registrar &amp; Licensure Proctor</strong>
              <div class="story-mission-sub">Oversees candidate enrollment, legal deck verification, and the Academy Licensure Board.</div>
            </div>
          </div>
          ${lav ? `
            <div class="story-char-card">
              <img src="${esc(lav.artworkRef)}" alt="${esc(lav.historicalName)}" class="story-char-img" />
              <div>
                <div class="story-section-kicker">FIRST EXAMINER • CHAMBER 1</div>
                <strong>${esc(lav.historicalName)} (${esc(lav.lifespan)})</strong>
                <div class="story-mission-sub">${esc(lav.specialty)}</div>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="dialogue-stack">${lines}</div>

        <div class="briefing-box">
          <div class="story-section-kicker">MISSION BRIEFING</div>
          <div><strong>Academy Objective:</strong> ${esc(mission.briefing.objective)}</div>
          ${focusChips ? `<div class="story-badges" style="margin-top:7px;">${focusChips}</div>` : ''}
        </div>

        <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
          <button id="btn-brief-back" class="btn-action btn-pass">← Back to Hub</button>
          <button id="btn-complete-reg" class="btn-action btn-synth">Complete Registration &amp; Unlock Chamber 1 →</button>
        </div>
      `;

      V.UI.openModal(`📋 ${mission.title}`, body, (root) => {
        root.querySelector('#btn-brief-back').addEventListener('click', () => openStoryHub('missions'));
        root.querySelector('#btn-complete-reg').addEventListener('click', () => {
          V.Story.recordNarrativeMissionComplete(mission.missionId, mission.unlocksBranchFlags);
          if (V.Sound) V.Sound.playTurnChime();
          openStoryHub('missions');
        });
      });
      return;
    }

    // Examination Mission (Lavoisier, Mendeleev, Pauling, Curie, or Final Examination)
    const sci = mission.scientistId ? V.Story.getScientistProfile(mission.scientistId) : null;
    const oppCfg = V.Story.getOpponentConfig(mission.opponentConfigId);
    const rc = mission.researchChallengeId ? V.Story.getResearchChallenge(mission.researchChallengeId) : null;
    const portraitKey = sci ? sci.portraitRef : (mission.opponentPortraitRef || 'proctor');
    const artworkSrc = sci ? sci.artworkRef : 'assets/portraits/proctor.svg';
    const speakerName = sci ? sci.displayName : (mission.opponentDisplayName || 'Academy Proctor');

    const opponentIntroCard = sci
      ? `
        <div class="story-char-card story-char-featured">
          <img src="${esc(artworkSrc)}" alt="${esc(sci.historicalName)}" class="story-char-img story-char-img-lg" />
          <div style="flex:1;min-width:0;">
            <div class="story-section-kicker">SCIENTIST OPPONENT INTRODUCTION</div>
            <strong style="font-size:15px;color:#f8fafc;">${esc(sci.historicalName)} <small style="color:#94a3b8;font-weight:500;">(${esc(sci.lifespan)})</small></strong>
            <div class="archive-spec" style="margin-top:2px;">${esc(sci.specialty)}</div>
            <div class="story-mission-sub" style="margin-top:3px;">${esc(sci.simulationPersonality.summary)}</div>
            <div class="story-badges" style="margin-top:6px;">
              <span class="story-badge badge-open">${esc(sci.simulationPersonality.archetype)}</span>
              <span class="story-badge badge-diff">${esc(oppCfg.difficulty)}</span>
              <span class="story-badge badge-tier">Affinities: ${esc(sci.elementalAffinities.join(', '))}</span>
            </div>
          </div>
        </div>
      `
      : `
        <div class="story-char-card story-char-featured">
          <img src="${esc(artworkSrc)}" alt="${esc(speakerName)}" class="story-char-img story-char-img-lg" />
          <div style="flex:1;min-width:0;">
            <div class="story-section-kicker">FINAL EXAMINATION OPPONENT</div>
            <strong style="font-size:15px;color:#f8fafc;">${esc(speakerName)}</strong>
            <div class="story-mission-sub" style="margin-top:3px;">${esc(oppCfg.strategyProfile)}</div>
          </div>
        </div>
      `;

    const dialogueLines = sci
      ? sci.dialogue.intro.map((text) => ({ speaker: speakerName, portraitRef: portraitKey, text }))
      : (mission.dialogue || []);

    const dialogueHTML = dialogueLines.map((d) => `
      <div class="dialogue-line">
        ${V.renderPortraitSVG ? V.renderPortraitSVG(d.portraitRef, 'dialogue-avatar') : ''}
        <div>
          <strong>${esc(d.speaker)}</strong>
          <p>“${esc(d.text)}”</p>
        </div>
      </div>
    `).join('');

    const sciBriefingLine = sci && sci.dialogue && sci.dialogue.briefing
      ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(56,189,248,0.22);color:#bae6fd;"><strong>${esc(sci.historicalName)}'s Examination Standard:</strong> <em>“${esc(sci.dialogue.briefing)}”</em></div>`
      : '';

    const rcHTML = rc
      ? `
        <div class="briefing-rc">
          <strong>🔬 Optional Stage Two Research Challenge — ${esc(rc.title)}</strong>
          <p>${esc(rc.description)}</p>
        </div>
      `
      : '';

    const disclaimerHTML = sci
      ? `<div class="archive-disclaimer">${esc(sci.simulationPersonality.disclaimer)}</div>`
      : '';

    const body = `
      <div class="story-intro-banner">
        <div class="story-section-kicker">STORY INTRODUCTION</div>
        <p class="story-intro-text">${esc(mission.introduction)}</p>
      </div>
      ${opponentIntroCard}
      <div class="dialogue-stack">${dialogueHTML}</div>
      <div class="briefing-box">
        <div class="story-section-kicker">MISSION BRIEFING</div>
        <div><strong>Opponent Strategy:</strong> ${esc(oppCfg.strategyProfile)} <span class="story-badge badge-diff">${esc(oppCfg.difficulty)}</span></div>
        <div style="margin-top:4px;"><strong>Examination Objective:</strong> ${esc(mission.briefing.objective)}</div>
        <div style="margin-top:4px;color:#94a3b8;"><strong>Lab Tip:</strong> ${esc(mission.briefing.tacticalTip)}</div>
        ${sciBriefingLine}
      </div>
      ${rcHTML}
      ${disclaimerHTML}
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;flex-wrap:wrap;">
        <button id="btn-brief-back" class="btn-action btn-pass">← Mission Hub</button>
        <button id="btn-launch-exam" class="btn-action btn-synth">Begin Examination Match ⚛</button>
      </div>
    `;

    V.UI.openModal(`🧪 ${mission.title}`, body, (root) => {
      root.querySelector('#btn-brief-back').addEventListener('click', () => openStoryHub('missions'));
      root.querySelector('#btn-launch-exam').addEventListener('click', () => {
        if (V.Sound) V.Sound.unlockAudio();
        V.UI.startStoryEncounter(mission);
      });
    });
  }

  /**
   * Called by app.js when a Story Mode Examination encounter ends (win OR defeat).
   * Runs Licensure Evaluation, Research Challenge check, Two-Stage Progression save, and displays Results.
   */
  function handleEncounterComplete(state, mission, tracker) {
    const evalResult = V.Story.evaluateExamination(tracker, state, 0);
    const rc = mission.researchChallengeId ? V.Story.getResearchChallenge(mission.researchChallengeId) : null;
    const rcResult = rc ? rc.evaluate(evalResult) : null;
    const { progression, unlockedNow } = V.Story.recordExaminationOutcome(mission, evalResult, rcResult);

    if (evalResult.won) {
      if (V.Sound) V.Sound.playVictory();
    } else if (V.Sound && V.Sound.playDefeat) {
      V.Sound.playDefeat();
    }

    const sci = mission.scientistId ? V.Story.getScientistProfile(mission.scientistId) : null;
    const portraitKey = sci ? sci.portraitRef : (mission.opponentPortraitRef || 'proctor');

    // Render full authored dialogue: scientist onVictory/onDefeat, OR Final Exam postVictoryDialogue array!
    let reactionLines = [];
    if (sci) {
      reactionLines.push({
        speaker: sci.displayName,
        portraitRef: portraitKey,
        text: evalResult.won ? sci.dialogue.onVictory : sci.dialogue.onDefeat,
      });
    } else if (evalResult.won && Array.isArray(mission.postVictoryDialogue) && mission.postVictoryDialogue.length > 0) {
      reactionLines = mission.postVictoryDialogue;
    } else {
      reactionLines.push({
        speaker: 'Academy Licensure Board',
        portraitRef: portraitKey,
        text: evalResult.won
          ? 'Examination concluded. Your Academy License has been ratified — Chapter 1: The Frontier is now unlocked.'
          : 'The Licensure Board requires a victory to certify this examination. Review your competency scores and re-attempt the trial.',
      });
    }

    const reactionHTML = reactionLines.map((d) => `
      <div class="dialogue-line">
        ${V.renderPortraitSVG ? V.renderPortraitSVG(d.portraitRef || portraitKey, 'dialogue-avatar') : ''}
        <div>
          <strong>${esc(d.speaker)}</strong>
          <p>“${esc(d.text)}”</p>
        </div>
      </div>
    `).join('');

    const challengeQuoteHTML =
      rcResult && rcResult.completed && sci && sci.dialogue && sci.dialogue.challengeComplete
        ? `
          <div class="story-challenge-quote">
            <strong>★ ${esc(sci.historicalName)} — Research Challenge Commendation:</strong>
            <p>“${esc(sci.dialogue.challengeComplete)}”</p>
          </div>
        `
        : '';

    const compRows = [
      ['Synthesis Competency', evalResult.competencies.synthesis],
      ['Stability Management', evalResult.competencies.stability],
      ['Defensive Competency', evalResult.competencies.defensive],
      ['Tactical Competency', evalResult.competencies.tactical],
    ].map(([label, val]) => `
      <div class="eval-row">
        <div class="eval-label-row"><span>${label}</span><strong>${val}%</strong></div>
        <div class="sp-bar-track"><div class="sp-bar-fill" style="width:${val}%"></div></div>
      </div>
    `).join('');

    const rcCriteriaHTML = rcResult && rcResult.criteria
      ? `
        <div class="briefing-rc ${rcResult.completed ? 'rc-complete' : ''}">
          <strong>${rcResult.completed ? '★ Research Challenge Complete' : '○ Research Challenge'}: ${esc(rc.title)}</strong>
          <ul class="rc-criteria-list">
            ${rcResult.criteria.map((c) => `<li>${c.met ? '✓' : '○'} ${esc(c.label)}</li>`).join('')}
          </ul>
          ${rcResult.completed ? '<div style="font-size:11.5px;color:#86efac;margin-top:4px;">Stage Two Recorded: Acquisition &amp; Future Scientist Card Eligibility unlocked (no collectible cards active yet).</div>' : ''}
        </div>
      `
      : '';

    const unlockNotes = [];
    if (unlockedNow.stageOneNewlyUnlocked && sci) {
      unlockNotes.push(`📚 Stage One Unlocked: ${sci.historicalName}'s Biography, Historical Discoveries & Research Archive Entry!`);
    }
    if (unlockedNow.stageTwoNewlyUnlocked && sci) {
      unlockNotes.push(`★ Stage Two Unlocked: Persistent Future Scientist Card Eligibility recorded for ${sci.historicalName}!`);
    }
    if (unlockedNow.chapter1NewlyUnlocked) {
      unlockNotes.push(`🧭 Chapter 0 Complete (${progression.chapter0LicensureTier}) — Chapter 1: The Frontier Unlocked!`);
    }

    const unlocksHTML = unlockNotes.length
      ? `<div class="story-unlock-banner">${unlockNotes.map((u) => `<div>${esc(u)}</div>`).join('')}</div>`
      : '';

    const nextMissionId = mission.nextMissionIds && mission.nextMissionIds[0];
    const nextMission = nextMissionId ? V.Story.getMissionById(nextMissionId) : null;

    const body = `
      <div class="dialogue-stack">${reactionHTML}</div>

      ${challengeQuoteHTML}
      ${unlocksHTML}

      <div class="eval-card">
        <div class="eval-top">
          <div>
            <div style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;">Academy Licensure Evaluation (Separate from SP)</div>
            <strong style="font-size:18px;color:${evalResult.won ? '#5eead4' : '#fca5a5'}">${esc(evalResult.licensureTier)}</strong>
          </div>
          <div class="eval-overall-pill">${evalResult.overall}% Overall</div>
        </div>
        <div class="eval-grid">${compRows}</div>
      </div>

      ${rcCriteriaHTML}

      <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:8px;">
        ${evalResult.won && nextMission ? `<button id="btn-story-next" class="btn-action btn-synth">Next: ${esc(nextMission.title)} →</button>` : ''}
        <button id="btn-story-retry" class="btn-action ${evalResult.won ? 'btn-pass' : 'btn-play-red'}">↻ Retry Examination</button>
        <button id="btn-story-archive-open" class="btn-action btn-pass">📚 Research Archive</button>
        <button id="btn-story-hub-back" class="btn-action btn-pass">📋 Story Hub</button>
        <button id="btn-story-menu-back" class="btn-action btn-pass">← Main Menu</button>
      </div>
    `;

    V.UI.openModal(
      evalResult.won ? `🎓 Examination Passed — ${mission.title}` : `☣ Examination Failed — ${mission.title}`,
      body,
      (root) => {
        const bNext = root.querySelector('#btn-story-next');
        if (bNext && nextMission) bNext.addEventListener('click', () => openMissionBriefingModal(nextMission));
        root.querySelector('#btn-story-retry').addEventListener('click', () => V.UI.startStoryEncounter(mission));
        root.querySelector('#btn-story-archive-open').addEventListener('click', () => openStoryHub('archive'));
        root.querySelector('#btn-story-hub-back').addEventListener('click', () => openStoryHub('missions'));
        root.querySelector('#btn-story-menu-back').addEventListener('click', () => V.UI.showMenuScreen());
      }
    );
  }

  V.StoryUI = {
    openStoryHub,
    openMissionBriefingModal,
    handleEncounterComplete,
  };
})(typeof window !== 'undefined' ? window : globalThis);
