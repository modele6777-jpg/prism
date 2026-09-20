document.addEventListener('DOMContentLoaded', () => {
  // =========================================================
  // Shared Module State (전역 스코프 호이스팅 안전 관리)
  // =========================================================
  let isBreathingActive = false;
  let breathingInterval = null;
  let currentWbFilter = 'all';
  let currentWbSearch = '';

  // 1. Service Worker Registration for PWA (캐시 무효화 버전 24.0)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js?v=24.0')
        .then(reg => {
          reg.update();
          console.log('✅ PWA Service Worker Registered (v24.0):', reg.scope);
        })
        .catch(err => console.warn('⚠️ PWA Service Worker Registration Failed:', err));
    });
  }

  // 2. PWA Install Prompt
  let deferredPrompt = null;
  const btnInstallPwa = document.getElementById('btn-install-pwa');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btnInstallPwa) btnInstallPwa.classList.remove('hidden');
  });

  if (btnInstallPwa) {
    btnInstallPwa.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      deferredPrompt = null;
      btnInstallPwa.classList.add('hidden');
    });
  }

  // 3. Tab Switching Logic (토스/킨포크 스타일 세그먼트 탭)
  const tabPills = document.querySelectorAll('.tab-pill');
  const tabSections = document.querySelectorAll('.tab-view-section');

  function switchTab(targetTabId, shouldScroll = true) {
    if (targetTabId !== 'tab-breathing' && isBreathingActive && typeof stopBreathing === 'function') {
      stopBreathing(false);
    }

    try {
      localStorage.setItem('calm_active_tab', targetTabId);
    } catch (e) {}

    tabPills.forEach(pill => {
      if (pill.dataset.tab === targetTabId) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    tabSections.forEach(section => {
      if (section.id === targetTabId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    if (targetTabId === 'tab-workbook' && typeof renderWorkbook === 'function') {
      renderWorkbook();
    }

    if (shouldScroll) {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  }

  // 전역 인라인 및 모듈 간 탭 전환 지원
  window.switchTab = switchTab;

  tabPills.forEach(pill => {
    pill.addEventListener('click', () => {
      switchTab(pill.dataset.tab);
    });
  });

  const heroBtnExplore = document.getElementById('hero-btn-explore');
  if (heroBtnExplore) {
    heroBtnExplore.addEventListener('click', () => {
      switchTab('tab-exercises');
    });
  }

  const heroBtnChat = document.getElementById('hero-btn-chat');
  if (heroBtnChat) {
    heroBtnChat.addEventListener('click', () => {
      askLucyWithText('루시야, 마음이 불안하고 초조한데 나에게 맞는 따뜻한 위로와 Key 마음약방 연습을 추천해 줘.');
    });
  }

  const navBrand = document.getElementById('nav-brand');
  if (navBrand) {
    navBrand.addEventListener('click', () => {
      switchTab('tab-chat');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 4. Soundscape Pills (심리상담실 치유 배경음 14선 & 볼륨 제어)
  const soundBtns = document.querySelectorAll('.soundscape-pill-bar .sound-btn');
  const btnSoundStop = document.getElementById('sound-btn-stop');
  const soundVolSlider = document.getElementById('sound-vol-slider');

  soundBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const soundType = btn.getAttribute('data-sound');
      if (!soundType || !window.soundscapeEngine) return;
      const isPlaying = window.soundscapeEngine.play(soundType);

      soundBtns.forEach(b => b.classList.remove('active'));
      if (isPlaying) {
        btn.classList.add('active');
        if (btnSoundStop) btnSoundStop.classList.remove('hidden');
      } else {
        if (btnSoundStop) btnSoundStop.classList.add('hidden');
      }
    });
  });

  if (btnSoundStop) {
    btnSoundStop.addEventListener('click', () => {
      if (window.soundscapeEngine) {
        window.soundscapeEngine.stop();
      }
      soundBtns.forEach(b => b.classList.remove('active'));
      btnSoundStop.classList.add('hidden');
    });
  }

  if (soundVolSlider) {
    soundVolSlider.addEventListener('input', (e) => {
      if (window.soundscapeEngine) {
        window.soundscapeEngine.setVolume(e.target.value);
      }
    });
  }

  // 5. Book Companion & Page Sync Elements
  const companionPageInput = document.getElementById('companion-page-input');
  const btnSyncPage = document.getElementById('btn-sync-page');
  const btnRandomPrescription = document.getElementById('btn-random-prescription');
  const heroBtnRandom = document.getElementById('hero-btn-random');
  const syncDrawerCard = document.getElementById('sync-drawer-card');
  const syncChapterBadge = document.getElementById('sync-chapter-badge');
  const syncTitleText = document.getElementById('sync-title-text');
  const syncDescText = document.getElementById('sync-desc-text');
  const btnSyncPractice = document.getElementById('btn-sync-practice');
  const btnSyncAsk = document.getElementById('btn-sync-ask');

  let currentSyncedExIdx = 1;

  function syncPage(pageNum) {
    const page = parseInt(pageNum, 10) || 18;
    const info = window.BOOK_PAGE_INDEX(page);
    syncChapterBadge.textContent = info.chapter;
    syncTitleText.textContent = info.title;
    syncDescText.textContent = info.desc;
    currentSyncedExIdx = info.exerciseIdx;
  }

  if (btnSyncPage) {
    btnSyncPage.addEventListener('click', () => {
      syncPage(companionPageInput.value);
    });
  }

  if (companionPageInput) {
    companionPageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        syncPage(companionPageInput.value);
      }
    });
  }

  function askLucyWithText(text) {
    try {
      sessionStorage.setItem('lucy_injected_auto_send', text);
      sessionStorage.setItem('lucy_injected_input_draft', text);
    } catch (_) {}

    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'NAVIGATE_LUCKEY',
        path: '/chat',
        text: text
      }, '*');
    } else {
      window.location.href = '/chat';
    }
  }
  window.askLucyWithText = askLucyWithText;

  if (btnSyncPractice) {
    btnSyncPractice.addEventListener('click', () => {
      window.startPractice(currentSyncedExIdx);
    });
  }

  if (btnSyncAsk) {
    btnSyncAsk.addEventListener('click', () => {
      const exerciseTitle = syncTitleText ? syncTitleText.textContent : '불안 치유 연습';
      const text = `루시야, Key 마음약방의 '${exerciseTitle}'에 대해 질문하고 싶어. 실제 일상에서 불안하거나 마음이 초조할 때 어떻게 실천하면 효과가 좋은지 따뜻하게 안내해 줘.`;
      askLucyWithText(text);
    });
  }

  function launchRandomPractice() {
    if (!window.PRACTICE_EXERCISES || window.PRACTICE_EXERCISES.length === 0) return;

    // 40개 연습 중 무작위 1개 추첨
    const randIdx = Math.floor(Math.random() * window.PRACTICE_EXERCISES.length);
    const chosenEx = window.PRACTICE_EXERCISES[randIdx];

    // 쪽수 입력창과 쪽수 싱크 카드를 해당 연습으로 즉시 갱신
    if (companionPageInput) {
      companionPageInput.value = chosenEx.page;
    }
    syncPage(chosenEx.page);

    // 사운드 피드백 (싱잉볼 1회 단발 차임벨)
    if (window.soundscapeEngine && typeof window.soundscapeEngine.playChime === 'function') {
      window.soundscapeEngine.playChime();
    }

    // 40가지 연습 중 임의로 선정된 연습의 실천 스튜디오 즉시 실행!
    window.startPractice(chosenEx.globalIndex, true);
  }

  window.launchRandomPractice = launchRandomPractice;

  if (btnRandomPrescription) btnRandomPrescription.addEventListener('click', launchRandomPractice);
  if (heroBtnRandom) heroBtnRandom.addEventListener('click', launchRandomPractice);

  // 초기 18페이지 싱크 실행
  syncPage(18);

  // 6. Chat Interface
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const btnClearChat = document.getElementById('btn-clear-chat');
  const promptChips = document.querySelectorAll('.chip-btn');

  // Auto-resize textarea
  if (userInput) {
    userInput.addEventListener('input', () => {
      userInput.style.height = 'auto';
      userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
    });

    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  }

  // Prompt chips
  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt) {
        userInput.value = prompt;
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  });

  if (btnClearChat) {
    btnClearChat.addEventListener('click', () => {
      if (confirm('대화 기록을 지우고 새로 시작하시겠습니까?')) {
        chatMessages.innerHTML = `
          <div class="chat-bubble-row assistant">
            <div class="author-avatar" style="width: 34px; height: 34px; flex-shrink: 0;">
              <img src="/favicon.png?v=3.0" alt="Z" style="width: 20px; height: 20px;">
            </div>
            <div class="bubble-content">
              <p>대화가 초기화되었습니다. 지금 마음에 머무르는 어떤 생각이나 책 속 의문이든 편안하게 들려주세요.</p>
            </div>
          </div>
        `;
      }
    });
  }

  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = userInput.value.trim();
      if (!text) return;

      appendUserBubble(text);
      userInput.value = '';
      userInput.style.height = 'auto';

      const typingRow = appendTypingIndicator();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });

        const data = await res.json();
        typingRow.remove();

        if (data.grounding && data.healing && data.liberation) {
          append3StageAssistantBubble(data);
        } else if (data.reply) {
          appendAssistantBubble(data.reply, data.recommendedExercises);
        } else {
          appendAssistantBubble('죄송합니다. 일시적인 연결 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } catch (err) {
        typingRow.remove();
        appendAssistantBubble('네트워크 연결 상태를 확인해 주세요.');
      }
    });
  }

  function appendUserBubble(text) {
    const row = document.createElement('div');
    row.className = 'chat-bubble-row user';
    row.innerHTML = `
      <div class="bubble-content">
        ${escapeHtml(text).replace(/\n/g, '<br>')}
      </div>
    `;
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendTypingIndicator() {
    const row = document.createElement('div');
    row.className = 'chat-bubble-row assistant';
    row.innerHTML = `
      <div class="author-avatar" style="width: 34px; height: 34px; flex-shrink: 0;">
        <img src="/favicon.png?v=3.0" alt="Z" style="width: 20px; height: 20px;">
      </div>
      <div class="bubble-content" style="color: var(--text-muted); font-style: italic;">
        몸의 감각을 살피고 마음의 렌즈를 전환하는 3단계 치유를 구성하고 있습니다...
      </div>
    `;
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return row;
  }

  // 3단계 통합 내면 치유 카드 렌더러 (초기불교 접지 + 기적수업 용서 + 온전함 선언)
  function append3StageAssistantBubble(data) {
    const row = document.createElement('div');
    row.className = 'chat-bubble-row assistant';

    let cardsHtml = `
      <div style="margin-bottom: 8px; font-weight: 600; color: var(--copper-primary); font-size: 0.88rem;">
        🕊️ 3단계 통합 심층 치유 처방 (신체 접지 · 기적수업 용서 · 온전함 선언)
      </div>
      <div class="stage-cards-container">
        <!-- 1단계: 신체 접지 -->
        <div class="stage-card grounding">
          <div class="stage-card-header">
            <span class="stage-badge">🌿 1단계 · 신체 접지 (Grounding)</span>
          </div>
          <div class="stage-card-title">지금 몸의 감각에 닻 내리기</div>
          <div class="stage-card-body">${escapeHtml(data.grounding).replace(/\n/g, '<br>')}</div>
        </div>

        <!-- 2단계: 투사 치유 및 용서 -->
        <div class="stage-card healing">
          <div class="stage-card-header">
            <span class="stage-badge">💧 2단계 · 투사 치유 & 용서 (Healing)</span>
          </div>
          <div class="stage-card-title">두려운 마음의 해석 내려놓기</div>
          <div class="stage-card-body">${formatMarkdown(data.healing)}</div>
        </div>

        <!-- 3단계: 본래의 온전함 선언 -->
        <div class="stage-card liberation">
          <div class="stage-card-header">
            <span class="stage-badge">✨ 3단계 · 본래의 온전함 (Liberation)</span>
          </div>
          <div class="stage-card-title">훼손되지 않는 내면의 빛</div>
          <div class="stage-card-body"><strong>"${escapeHtml(data.liberation)}"</strong></div>
        </div>
      </div>
    `;

    if (data.recommendedExercises && data.recommendedExercises.length > 0) {
      const ex = data.recommendedExercises[0];
      const globalIdx = getGlobalExerciseIndex(ex.chapter, ex.index);
      cardsHtml += `
        <div style="margin-top: 18px; margin-bottom: 6px; font-weight: 700; color: var(--text-title); font-size: 0.92rem;">
          📖 도서 《왜 나는 불안할까》 맞춤 추천 실천:
        </div>
        <div class="chat-rec-box">
          <div class="chat-rec-header">
            <span class="chat-rec-tag">${ex.chapter}장 · ${ex.tag || '마음 연습'}</span>
            <button class="btn-copper" style="padding: 4px 12px; font-size: 0.8rem;" onclick="window.startPractice(${globalIdx})">
              🎯 직접 실천하기
            </button>
          </div>
          <div class="chat-rec-title">연습 ${ex.index}. ${ex.title} (${ex.page}쪽)</div>
          <div class="chat-rec-desc">${ex.subtitle ? `${ex.subtitle} - ` : ''}${ex.description || ex.purpose || ''}</div>
        </div>
      `;
    }

    row.innerHTML = `
      <div class="author-avatar" style="width: 34px; height: 34px; flex-shrink: 0;">
        <img src="/favicon.png?v=3.0" alt="Z" style="width: 20px; height: 20px;">
      </div>
      <div class="bubble-content">
        ${cardsHtml}
      </div>
    `;

    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendAssistantBubble(markdownText, recommendedExercises) {
    const row = document.createElement('div');
    row.className = 'chat-bubble-row assistant';

    let contentHtml = formatMarkdown(markdownText);

    if (recommendedExercises && recommendedExercises.length > 0) {
      const ex = recommendedExercises[0];
      const globalIdx = getGlobalExerciseIndex(ex.chapter, ex.index);
      contentHtml += `
        <div style="margin-top: 18px; margin-bottom: 6px; font-weight: 700; color: var(--text-title); font-size: 0.92rem;">
          📖 도서 《왜 나는 불안할까》 맞춤 추천 실천:
        </div>
        <div class="chat-rec-box">
          <div class="chat-rec-header">
            <span class="chat-rec-tag">${ex.chapter}장 · ${ex.tag || '마음 연습'}</span>
            <button class="btn-copper" style="padding: 4px 12px; font-size: 0.8rem;" onclick="window.startPractice(${globalIdx})">
              🎯 직접 실천하기
            </button>
          </div>
          <div class="chat-rec-title">연습 ${ex.index}. ${ex.title} (${ex.page}쪽)</div>
          <div class="chat-rec-desc">${ex.subtitle ? `${ex.subtitle} - ` : ''}${ex.description || ex.purpose || ''}</div>
        </div>
      `;
    }

    row.innerHTML = `
      <div class="author-avatar" style="width: 34px; height: 34px; flex-shrink: 0;">
        <img src="/favicon.png?v=3.0" alt="Z" style="width: 20px; height: 20px;">
      </div>
      <div class="bubble-content">
        ${contentHtml}
      </div>
    `;

    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getGlobalExerciseIndex(chapter, index) {
    const chapterOffsets = { 1: 0, 2: 12, 3: 22 };
    return (chapterOffsets[chapter] || 0) + parseInt(index, 10);
  }

  // 7. 40 Exercises Studio Grid 렌더링 및 필터링
  const exercisesGrid = document.getElementById('exercises-grid');
  const filterBtns = document.querySelectorAll('.exercises-filter-strip .filter-pill-btn');

  function renderExercisesGrid(filterChapter = 'all') {
    if (!exercisesGrid || !window.PRACTICE_EXERCISES) return;

    exercisesGrid.innerHTML = '';
    const filtered = window.PRACTICE_EXERCISES.filter(ex => {
      if (filterChapter === 'all') return true;
      return ex.chapter.toString() === filterChapter;
    });

    filtered.forEach(ex => {
      const card = document.createElement('div');
      card.className = 'studio-ex-card';
      const chapter = ex.chapter || 1;
      const tag = ex.tag || '마음 연습';
      const page = ex.page || 18;
      const icon = ex.icon || '🎯';
      const index = ex.index || 1;
      const title = ex.title || '마음 연습';
      const subtitle = ex.subtitle || '';
      const description = ex.description || ex.purpose || '마음의 평온을 되찾는 실천 연습입니다.';

      card.innerHTML = `
        <div class="ex-card-top-line">
          <span class="ex-card-tag">${chapter}장 · ${tag}</span>
          <span class="ex-card-page">P.${page}</span>
        </div>
        <h3 class="ex-card-title">${icon} 연습 ${index}. ${title}</h3>
        <div class="ex-card-subtitle">${subtitle}</div>
        <p class="ex-card-description">${description}</p>
        <div class="ex-card-footer-btns">
          <button class="btn-card-launch" onclick="window.startPractice(${ex.globalIndex})">
            <span>🎯 직접 실천하기</span>
          </button>
          <button class="btn-card-chat" onclick="window.askAboutPractice(${ex.globalIndex})">
            질문
          </button>
        </div>
      `;
      exercisesGrid.appendChild(card);
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderExercisesGrid(btn.dataset.chapter);
    });
  });

  renderExercisesGrid('all');

  window.askAboutPractice = function(globalIdx) {
    const ex = window.PRACTICE_EXERCISES.find(e => e.globalIndex === globalIdx);
    if (!ex) return;
    switchTab('tab-chat');
    userInput.value = `책 ${ex.page}쪽의 '연습 ${ex.index}. ${ex.title}'에 대해 저자의 핵심 의도와 실천 팁을 자세히 설명해 줘.`;
    chatForm.dispatchEvent(new Event('submit'));
  };

  // 8. Balloon Breathing (유기적 5초 호흡)
  const breathingBalloon = document.getElementById('breathing-balloon');
  const balloonPhase = document.getElementById('balloon-phase');
  const balloonTimer = document.getElementById('balloon-timer');
  const btnBreathingToggle = document.getElementById('btn-breathing-toggle');
  const cycleCountText = document.getElementById('cycle-count');

  let cycleCount = 0;
  let currentPhase = 'inhale'; // inhale, hold, exhale
  let countdown = 5;

  if (btnBreathingToggle) {
    btnBreathingToggle.addEventListener('click', () => {
      if (isBreathingActive) {
        stopBreathing();
      } else {
        startBreathing();
      }
    });
  }

  function startBreathing() {
    isBreathingActive = true;
    btnBreathingToggle.innerHTML = '<span>호흡 일시정지</span>';
    btnBreathingToggle.classList.add('btn-sage');
    btnBreathingToggle.classList.remove('btn-copper');
    currentPhase = 'inhale';
    countdown = 5;
    updateBalloonVisual();

    if (breathingInterval) {
      clearInterval(breathingInterval);
      breathingInterval = null;
    }

    breathingInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        if (currentPhase === 'inhale') {
          currentPhase = 'hold';
          countdown = 2;
        } else if (currentPhase === 'hold') {
          currentPhase = 'exhale';
          countdown = 5;
        } else {
          currentPhase = 'inhale';
          countdown = 5;
          cycleCount++;
          if (cycleCountText) cycleCountText.textContent = cycleCount;

          // 5회 호흡 (약 1분) 목표 달성 시 자동 세션 완료
          if (cycleCount >= 5) {
            stopBreathing(true);
            return;
          }
        }
        updateBalloonVisual();
      } else {
        if (balloonTimer) balloonTimer.textContent = countdown;
      }
    }, 1000);
  }

  function stopBreathing(isFinished = false) {
    isBreathingActive = false;
    if (breathingInterval) {
      clearInterval(breathingInterval);
      breathingInterval = null;
    }
    btnBreathingToggle.innerHTML = '<span>호흡 시작하기</span>';
    btnBreathingToggle.classList.add('btn-copper');
    btnBreathingToggle.classList.remove('btn-sage');
    if (breathingBalloon) breathingBalloon.style.transform = 'scale(1)';

    if (isFinished) {
      if (balloonPhase) balloonPhase.innerHTML = '🎉 <span style="color:var(--forest-accent); font-weight:700;">5회 호흡 완주! 온몸의 긴장이 부드럽게 이완되었습니다.</span>';
      if (balloonTimer) balloonTimer.textContent = '완료';
      if (window.soundscapeEngine && typeof window.soundscapeEngine.playChime === 'function') {
        window.soundscapeEngine.playChime();
      }
    } else {
      if (balloonPhase) balloonPhase.textContent = '준비';
      if (balloonTimer) balloonTimer.textContent = '5';
    }
  }

  function updateBalloonVisual() {
    if (!breathingBalloon) return;
    if (currentPhase === 'inhale') {
      balloonPhase.textContent = '들이쉬기 (숨을 가득 채우세요)';
      balloonTimer.textContent = countdown;
      breathingBalloon.style.transform = 'scale(1.55)';
    } else if (currentPhase === 'hold') {
      balloonPhase.textContent = '잠시 멈춤 (평온 유지)';
      balloonTimer.textContent = countdown;
      breathingBalloon.style.transform = 'scale(1.55)';
    } else {
      balloonPhase.textContent = '내쉬기 (긴장을 입으로 배출)';
      balloonTimer.textContent = countdown;
      breathingBalloon.style.transform = 'scale(0.85)';
    }
  }

  // 9. Interactive Practice Studio Modal
  const modalPractice = document.getElementById('modal-practice');
  const btnCloseStudio = document.getElementById('btn-close-studio');
  const studioIcon = document.getElementById('studio-icon');
  const studioChapter = document.getElementById('studio-chapter');
  const studioTitle = document.getElementById('studio-title');
  const studioBody = document.getElementById('studio-body');
  const studioStepperDots = document.getElementById('studio-stepper-dots');
  const studioPrevStep = document.getElementById('studio-prev-step');
  const studioNextStep = document.getElementById('studio-next-step');

  let activePractice = null;
  let activeStepIdx = 0;
  let practiceAnswers = {};
  let studioTimerInterval = null;
  let activePracticeIsRandom = false;

  window.startPractice = function(globalIdx, isRandom = false) {
    const ex = window.PRACTICE_EXERCISES.find(e => e.globalIndex === globalIdx);
    if (!ex) return;

    activePractice = ex;
    activeStepIdx = 0;
    practiceAnswers = {};
    activePracticeIsRandom = isRandom;

    studioIcon.textContent = ex.icon || '🎯';
    const randomBadge = isRandom ? '🎲 랜덤 처방 · ' : '';
    studioChapter.textContent = `${randomBadge}${ex.chapter || 1}장 · ${ex.tag || '마음 연습'} (P.${ex.page || 18})`;
    studioTitle.textContent = `연습 ${ex.index || 1}. ${ex.title || ''}`;

    renderStepDots();
    renderCurrentStep();

    modalPractice.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  function closePracticeStudio() {
    if (studioTimerInterval) {
      clearInterval(studioTimerInterval);
      studioTimerInterval = null;
    }
    modalPractice.classList.add('hidden');
    document.body.style.overflow = '';
  }

  if (btnCloseStudio) btnCloseStudio.addEventListener('click', closePracticeStudio);

  function renderStepDots() {
    if (!studioStepperDots || !activePractice) return;
    studioStepperDots.innerHTML = '';
    activePractice.steps.forEach((step, idx) => {
      const dot = document.createElement('div');
      dot.className = `s-dot ${idx === activeStepIdx ? 'active' : ''} ${idx < activeStepIdx ? 'completed' : ''}`;
      studioStepperDots.appendChild(dot);
    });
  }

  function renderCurrentStep() {
    if (!activePractice) return;
    if (studioTimerInterval) {
      clearInterval(studioTimerInterval);
      studioTimerInterval = null;
    }
    const step = activePractice.steps[activeStepIdx];
    renderStepDots();

    studioPrevStep.style.display = activeStepIdx > 0 ? 'inline-block' : 'none';
    if (activeStepIdx === activePractice.steps.length - 1) {
      studioNextStep.textContent = '실천 완료 및 워크북 저장';
    } else {
      studioNextStep.textContent = '다음 단계';
    }

    let stepHtml = '';

    // 첫 번째 단계일 때 상단에 실천 목적 및 Dr. Z 코칭 팁 배너 표시
    if (activeStepIdx === 0) {
      const purpose = activePractice.purpose || activePractice.description || '마음의 평온을 되찾기 위한 수용전념 실천입니다.';
      const clinicalTip = activePractice.clinicalTip || '불안은 지나가는 파도입니다. 가만히 바라보며 지금 여기에 머물러보세요.';

      if (activePracticeIsRandom) {
        stepHtml += `
          <div class="random-rx-banner">
            <span class="rx-badge-icon">🎲</span>
            <div>
              <div class="rx-badge-title">오늘의 랜덤 맞춤 처방 실천</div>
              <div class="rx-badge-sub">도서의 40가지 연습 중 지금 이 순간 당신에게 가장 필요한 연습이 추천되었습니다.</div>
            </div>
          </div>
        `;
      }

      stepHtml += `
        <div class="practice-overview-banner">
          <div class="practice-meta-row">
            <span class="practice-meta-pill">⏱ 소요시간: ${activePractice.timeEstimate || '3분'}</span>
            <span class="practice-meta-pill">📖 원전 ${activePractice.page || 18}쪽</span>
            <span class="practice-meta-pill">🏷️ ${activePractice.tag || '마음 연습'}</span>
            ${activePractice.preparation && activePractice.preparation !== '없음' ? `<span class="practice-meta-pill prep-pill" style="background: rgba(184, 115, 51, 0.12); color: var(--copper-primary); border-color: rgba(184, 115, 51, 0.3); font-weight: 700;">🎒 준비물: ${escapeHtml(activePractice.preparation)}</span>` : ''}
          </div>
          <div class="practice-purpose-text">
            <strong>🎯 실천 목적:</strong> ${purpose}
          </div>
        </div>

        <div class="clinical-tip-card">
          <div class="clinical-tip-title">💡 Dr. Z 제이미 저커먼의 원포인트 코칭</div>
          <div class="clinical-tip-content">${clinicalTip}</div>
        </div>
      `;
    }

    stepHtml += `
      <div class="studio-step-card">
        <h3 class="step-instruction-heading">${step.title || '실천 단계'}</h3>
        <p class="step-instruction-desc">${step.instruction || ''}</p>
    `;

    // 작성 예시가 있는 경우 예시 박스 출력
    if (step.example) {
      stepHtml += `
        <div class="practice-example-box">
          <div class="practice-example-badge">💡 작성 예시 가이드</div>
          <div class="practice-example-content">${escapeHtml(step.example)}</div>
        </div>
      `;
    }

    // 타입별 인터랙티브 렌더링
    if (step.type === 'text_input') {
      step.fields.forEach(f => {
        const val = practiceAnswers[f.id] || '';
        const isLong = f.type === 'textarea' || (f.label && f.label.length > 35) || (f.placeholder && f.placeholder.length > 40);
        stepHtml += `
          <div class="practice-field-row">
            <label>${escapeHtml(f.label)}</label>
            ${isLong ? `
              <textarea id="input-${f.id}" rows="${f.rows || 3}" placeholder="${escapeHtml(f.placeholder)}">${escapeHtml(val)}</textarea>
            ` : `
              <input type="text" id="input-${f.id}" placeholder="${escapeHtml(f.placeholder)}" value="${escapeHtml(val)}">
            `}
          </div>
        `;
      });
    } else if (step.type === 'textarea') {
      const val = practiceAnswers[step.field.id] || '';
      stepHtml += `
        <div class="practice-field-row">
          <label>${step.field.label}</label>
          <textarea id="input-${step.field.id}" rows="4" placeholder="${step.field.placeholder}">${escapeHtml(val)}</textarea>
        </div>
      `;
    } else if (step.type === 'reframer') {
      const valA = practiceAnswers[step.fieldA.id] || '';
      const valB = practiceAnswers[step.fieldB.id] || '';
      stepHtml += `
        <div class="reframer-grid">
          <div class="reframer-col">
            <label style="color: #c44;">❌ ${step.fieldA.label}</label>
            <textarea id="input-${step.fieldA.id}" rows="3" placeholder="${step.fieldA.placeholder}">${escapeHtml(valA)}</textarea>
          </div>
          <div class="reframer-col">
            <label style="color: var(--sage-accent);">🌿 ${step.fieldB.label}</label>
            <textarea id="input-${step.fieldB.id}" rows="3" placeholder="${step.fieldB.placeholder}">${escapeHtml(valB)}</textarea>
          </div>
        </div>
      `;
    } else if (step.type === 'timer') {
      stepHtml += `
        <div class="studio-timer-box">
          <div class="circle-timer-num" id="s-timer-display">${step.duration}<span>초</span></div>
          <div class="studio-timer-controls" style="display: flex; gap: 8px; justify-content: center; align-items: center; margin-top: 14px;">
            <button id="s-timer-btn" class="btn-copper" style="min-width: 130px;">카운트다운 시작</button>
            <button id="s-timer-reset-btn" class="btn-linen" style="display: none; padding: 10px 16px; border: 1px solid var(--border-linen); border-radius: var(--radius-sm); font-size: 0.88rem; cursor: pointer; color: var(--text-muted);">초기화</button>
          </div>
        </div>
      `;
      if (step.tip) {
        stepHtml += `<p style="text-align: center; font-size: 0.88rem; color: var(--text-muted);">${step.tip}</p>`;
      }
    } else if (step.type === 'checklist') {
      stepHtml += `<div class="practice-checklist" style="display: flex; flex-direction: column; gap: 10px; margin: 14px 0;">`;
      step.options.forEach((opt, idx) => {
        const checked = practiceAnswers[`chk_${idx}`] ? 'checked' : '';
        stepHtml += `
          <label style="display: flex; align-items: flex-start; gap: 12px; font-size: 0.95rem; cursor: pointer; background: #faf6f0; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-linen);">
            <input type="checkbox" id="chk_${idx}" ${checked} style="width: 18px; height: 18px; margin-top: 3px; accent-color: var(--copper-primary);">
            <span style="color: var(--text-body); line-height: 1.5;">${opt}</span>
          </label>
        `;
      });
      stepHtml += `</div>`;
    }

    // 마지막 단계일 경우 확언 및 실천 후 불안감 척도(SUD) 슬라이더 추가
    if (activeStepIdx === activePractice.steps.length - 1 && activePractice.affirmation) {
      const sudVal = practiceAnswers['sud_score'] || 3;
      stepHtml += `
        <div style="margin-top: 24px; padding: 16px 20px; background: linear-gradient(135deg, #fcf9f2, #f6f0df); border-left: 4px solid var(--gold-accent); border-radius: 0 var(--radius-md) var(--radius-md) 0;">
          <div style="font-size: 0.78rem; font-weight: 800; color: #a46c26; text-transform: uppercase;">🌟 가슴에 새길 오늘의 치유 확언</div>
          <p style="font-family: 'Nanum Myeongjo', serif; font-size: 1.05rem; font-weight: 700; color: var(--text-title); margin-top: 4px;">
            "${activePractice.affirmation}"
          </p>
        </div>

        <div class="sud-meter-box">
          <div class="sud-score-display">
            <span style="font-size: 0.88rem; font-weight: 700; color: var(--text-body);">실천 후 지금 마음의 불편함 정도 (SUD 척도):</span>
            <span class="sud-score-val" id="sud-val-text">${sudVal} / 10</span>
          </div>
          <input type="range" id="input-sud-meter" min="0" max="10" value="${sudVal}" style="cursor: pointer; accent-color: var(--copper-primary);">
          <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-muted);">
            <span>0점: 완전한 평온</span>
            <span>5점: 중간 불편함</span>
            <span>10점: 극심한 공황</span>
          </div>
        </div>
      `;
    }

    stepHtml += `</div>`;
    studioBody.innerHTML = stepHtml;

    // 단계별 인터랙티브 이벤트 바인딩
    if (step.type === 'timer') {
      const timerBtn = document.getElementById('s-timer-btn');
      const timerResetBtn = document.getElementById('s-timer-reset-btn');
      const timerDisplay = document.getElementById('s-timer-display');
      const totalDuration = step.duration;
      let remain = totalDuration;
      let isRunning = false;

      function updateDisplay() {
        if (!timerDisplay) return;
        if (remain <= 0) {
          timerDisplay.innerHTML = `<span style="color:var(--forest-accent); font-weight:800;">완료 ✨</span>`;
        } else {
          timerDisplay.innerHTML = `${remain}<span>초</span>`;
        }
      }

      function stopStudioTimer() {
        if (studioTimerInterval) {
          clearInterval(studioTimerInterval);
          studioTimerInterval = null;
        }
        isRunning = false;
      }

      if (timerBtn) {
        timerBtn.addEventListener('click', () => {
          if (remain <= 0) {
            remain = totalDuration;
            updateDisplay();
          }

          if (isRunning) {
            stopStudioTimer();
            timerBtn.textContent = '계속 진행';
            timerBtn.classList.remove('btn-sage');
            timerBtn.classList.add('btn-copper');
          } else {
            stopStudioTimer();
            isRunning = true;
            timerBtn.textContent = '일시 정지';
            timerBtn.classList.remove('btn-copper');
            timerBtn.classList.add('btn-sage');
            if (timerResetBtn) timerResetBtn.style.display = 'inline-block';

            studioTimerInterval = setInterval(() => {
              remain--;
              updateDisplay();
              if (remain <= 0) {
                stopStudioTimer();
                timerBtn.textContent = '다시 시작';
                timerBtn.classList.remove('btn-sage');
                timerBtn.classList.add('btn-copper');
                if (timerResetBtn) timerResetBtn.style.display = 'none';

                // 단발 싱잉볼 차임 (무한 반복 방지)
                if (window.soundscapeEngine && typeof window.soundscapeEngine.playChime === 'function') {
                  window.soundscapeEngine.playChime();
                }
              }
            }, 1000);
          }
        });
      }

      if (timerResetBtn) {
        timerResetBtn.addEventListener('click', () => {
          stopStudioTimer();
          remain = totalDuration;
          updateDisplay();
          timerBtn.textContent = '카운트다운 시작';
          timerBtn.classList.remove('btn-sage');
          timerBtn.classList.add('btn-copper');
          timerResetBtn.style.display = 'none';
        });
      }
    }

    const sudSlider = document.getElementById('input-sud-meter');
    const sudValText = document.getElementById('sud-val-text');
    if (sudSlider && sudValText) {
      sudSlider.addEventListener('input', () => {
        sudValText.textContent = `${sudSlider.value} / 10`;
        practiceAnswers['sud_score'] = sudSlider.value;
      });
    }
  }

  function saveCurrentStepInputs() {
    if (!activePractice) return;
    const step = activePractice.steps[activeStepIdx];

    if (step.type === 'text_input') {
      step.fields.forEach(f => {
        const inp = document.getElementById(`input-${f.id}`);
        if (inp) practiceAnswers[f.id] = inp.value.trim();
      });
    } else if (step.type === 'textarea') {
      const inp = document.getElementById(`input-${step.field.id}`);
      if (inp) practiceAnswers[step.field.id] = inp.value.trim();
    } else if (step.type === 'reframer') {
      const inpA = document.getElementById(`input-${step.fieldA.id}`);
      const inpB = document.getElementById(`input-${step.fieldB.id}`);
      if (inpA) practiceAnswers[step.fieldA.id] = inpA.value.trim();
      if (inpB) practiceAnswers[step.fieldB.id] = inpB.value.trim();
    } else if (step.type === 'checklist') {
      step.options.forEach((opt, idx) => {
        const inp = document.getElementById(`chk_${idx}`);
        if (inp) practiceAnswers[`chk_${idx}`] = inp.checked;
      });
    }

    const sudSlider = document.getElementById('input-sud-meter');
    if (sudSlider) {
      practiceAnswers['sud_score'] = sudSlider.value;
    }
  }

  if (studioPrevStep) {
    studioPrevStep.addEventListener('click', () => {
      if (studioTimerInterval) {
        clearInterval(studioTimerInterval);
        studioTimerInterval = null;
      }
      saveCurrentStepInputs();
      if (activeStepIdx > 0) {
        activeStepIdx--;
        renderCurrentStep();
      }
    });
  }

  if (studioNextStep) {
    studioNextStep.addEventListener('click', () => {
      if (studioTimerInterval) {
        clearInterval(studioTimerInterval);
        studioTimerInterval = null;
      }
      saveCurrentStepInputs();
      if (activeStepIdx < activePractice.steps.length - 1) {
        activeStepIdx++;
        renderCurrentStep();
      } else {
        // 실천 완료! 워크북에 저장
        savePracticeToJournal();
        closePracticeStudio();
        alert(`'${activePractice.title}' 실천을 성공적으로 마쳤습니다!\n내 워크북 기록장에 정성스럽게 보관되었습니다.`);
      }
    });
  }

  // =========================================================
  // 📓 Systematic Clinical ACT Workbook Engine (나의 실천 워크북)
  // =========================================================
  const workbookContainer = document.getElementById('workbook-entries-container');
  const journalModalContainer = document.getElementById('journal-entries-container');
  const modalJournal = document.getElementById('modal-journal');
  const btnOpenJournal = document.getElementById('btn-open-journal');
  const btnCloseJournal = document.getElementById('btn-close-journal');
  const btnDoneJournal = document.getElementById('btn-done-journal');
  const btnExportJournal = document.getElementById('btn-export-journal');
  const btnClearJournal = document.getElementById('btn-clear-journal');
  const wbBtnExport = document.getElementById('wb-btn-export');
  const wbBtnClear = document.getElementById('wb-btn-clear');
  const wbSearchInput = document.getElementById('wb-search-input');
  const wbFilterPills = document.querySelectorAll('.wb-pill');

  function savePracticeToJournal() {
    if (!activePractice) return;
    const journal = JSON.parse(localStorage.getItem('calm_journal_records') || '[]');
    const record = {
      id: Date.now(),
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      exerciseIdx: activePractice.globalIndex,
      chapter: activePractice.chapter,
      chapterTitle: activePractice.chapterTitle || '',
      title: activePractice.title,
      subtitle: activePractice.subtitle || '',
      page: activePractice.page || 18,
      icon: activePractice.icon || '🎯',
      tag: activePractice.tag || '마음 연습',
      affirmation: activePractice.affirmation || '',
      clinicalTip: activePractice.clinicalTip || '',
      answers: { ...practiceAnswers },
      sudScore: practiceAnswers['sud_score'] || null
    };
    journal.unshift(record);
    localStorage.setItem('calm_journal_records', JSON.stringify(journal));
    renderWorkbook();
  }

  // 체계적인 질의응답 (Q/A) 서식화 함수
  function formatRecordQA(record) {
    const ex = window.PRACTICE_EXERCISES?.find(e => e.globalIndex === record.exerciseIdx);
    const answers = record.answers || {};
    let html = '';

    if (ex && ex.steps && ex.steps.length > 0) {
      ex.steps.forEach(step => {
        if (step.type === 'text_input' && step.fields) {
          const filledFields = step.fields.filter(f => answers[f.id]);
          if (filledFields.length > 0) {
            filledFields.forEach(f => {
              html += `
                <div class="wb-qa-item">
                  <div class="wb-qa-q">${escapeHtml(f.label)}</div>
                  <div class="wb-qa-a" style="white-space: pre-wrap;">${escapeHtml(answers[f.id])}</div>
                </div>
              `;
            });
          }
        } else if (step.type === 'textarea' && step.field) {
          const val = answers[step.field.id];
          if (val) {
            html += `
              <div class="wb-qa-item">
                <div class="wb-qa-q">${escapeHtml(step.field.label || step.title)}</div>
                <div class="wb-qa-a" style="white-space: pre-wrap;">${escapeHtml(val)}</div>
              </div>
            `;
          }
        } else if (step.type === 'reframer' && step.fieldA && step.fieldB) {
          const valA = answers[step.fieldA.id];
          const valB = answers[step.fieldB.id];
          if (valA || valB) {
            html += `
              <div class="wb-reframer-grid">
                <div class="wb-rf-card neg">
                  <div class="wb-rf-lbl">❌ ${escapeHtml(step.fieldA.label)}</div>
                  <div>${escapeHtml(valA || '(작성 내용 없음)')}</div>
                </div>
                <div class="wb-rf-card pos">
                  <div class="wb-rf-lbl">🌿 ${escapeHtml(step.fieldB.label)}</div>
                  <div>${escapeHtml(valB || '(작성 내용 없음)')}</div>
                </div>
              </div>
            `;
          }
        } else if (step.type === 'checklist' && step.options) {
          const checked = [];
          step.options.forEach((opt, idx) => {
            if (answers[`chk_${idx}`]) checked.push(opt);
          });
          if (checked.length > 0) {
            html += `
              <div class="wb-qa-item">
                <div class="wb-qa-q">실천 체크 완료 항목</div>
                <ul class="wb-checklist-ul">
                  ${checked.map(c => `<li class="wb-checklist-li"><span>✅</span> <span>${escapeHtml(c)}</span></li>`).join('')}
                </ul>
              </div>
            `;
          }
        }
      });
    }

    // 대체 서식화 (처방전 또는 커스텀 입력)
    if (!html) {
      const entries = Object.entries(answers).filter(([k]) => k !== 'sud_score');
      if (entries.length > 0) {
        entries.forEach(([k, v]) => {
          html += `
            <div class="wb-qa-item">
              <div class="wb-qa-q">• ${escapeHtml(k)}</div>
              <div class="wb-qa-a">${escapeHtml(String(v))}</div>
            </div>
          `;
        });
      } else {
        html = `<div class="wb-qa-a" style="color:var(--text-muted); font-style:italic;">모든 단계 및 명상 리추얼 완주 완료</div>`;
      }
    }

    return html;
  }

  function renderWorkbook(filter = currentWbFilter, searchQuery = currentWbSearch) {
    currentWbFilter = filter;
    currentWbSearch = searchQuery;

    const records = JSON.parse(localStorage.getItem('calm_journal_records') || '[]');

    // 통계 계산
    const totalEntries = records.length;
    const uniqueIndices = new Set(records.filter(r => r.exerciseIdx && !String(r.title).includes('처방전')).map(r => r.exerciseIdx));
    const completionRate = Math.round((uniqueIndices.size / 40) * 100);

    // 필터별 개수 카운팅
    const cntAll = totalEntries;
    const cntCh1 = records.filter(r => String(r.chapter) === '1').length;
    const cntCh2 = records.filter(r => String(r.chapter) === '2').length;
    const cntCh3 = records.filter(r => String(r.chapter) === '3').length;
    const cntRx = records.filter(r => String(r.title).includes('처방전') || r.isRx).length;

    const elCntAll = document.getElementById('wb-cnt-all');
    const elCntCh1 = document.getElementById('wb-cnt-ch1');
    const elCntCh2 = document.getElementById('wb-cnt-ch2');
    const elCntCh3 = document.getElementById('wb-cnt-ch3');
    const elCntRx = document.getElementById('wb-cnt-rx');
    if (elCntAll) elCntAll.textContent = cntAll;
    if (elCntCh1) elCntCh1.textContent = cntCh1;
    if (elCntCh2) elCntCh2.textContent = cntCh2;
    if (elCntCh3) elCntCh3.textContent = cntCh3;
    if (elCntRx) elCntRx.textContent = cntRx;

    // SUD 평균 점수 계산
    const sudScores = records
      .map(r => r.sudScore || (r.answers ? r.answers['sud_score'] : null))
      .filter(s => s !== null && s !== undefined && !isNaN(Number(s)))
      .map(Number);

    const elStatRate = document.getElementById('wb-stat-rate');
    const elStatBar = document.getElementById('wb-stat-bar');
    const elStatCount = document.getElementById('wb-stat-count');
    const elStatSud = document.getElementById('wb-stat-sud');
    const elStatSudDesc = document.getElementById('wb-stat-sud-desc');
    const elStatLast = document.getElementById('wb-stat-last');
    const elStatLastCh = document.getElementById('wb-stat-last-chapter');

    if (elStatRate) elStatRate.textContent = `${uniqueIndices.size} / 40개 (${completionRate}%)`;
    if (elStatBar) elStatBar.style.width = `${completionRate}%`;
    if (elStatCount) elStatCount.textContent = `${totalEntries}회`;

    if (sudScores.length > 0) {
      const avgSud = (sudScores.reduce((a, b) => a + b, 0) / sudScores.length).toFixed(1);
      if (elStatSud) elStatSud.textContent = `${avgSud} / 10점`;
      if (elStatSudDesc) {
        if (avgSud <= 3) elStatSudDesc.textContent = '🌟 매우 편안하고 안정된 심리 상태';
        else if (avgSud <= 6) elStatSudDesc.textContent = '🌿 보통 수준의 감정 파도 완화 중';
        else elStatSudDesc.textContent = '🌊 감정이 다소 높은 상태, 호흡 권장';
      }
    } else {
      if (elStatSud) elStatSud.textContent = `- / 10점`;
      if (elStatSudDesc) elStatSudDesc.textContent = '실천 후 SUD 척도를 기록해보세요';
    }

    if (records.length > 0) {
      if (elStatLast) elStatLast.textContent = records[0].title;
      if (elStatLastCh) elStatLastCh.textContent = `${records[0].date} (${records[0].chapter || 1}장)`;
    } else {
      if (elStatLast) elStatLast.textContent = '-';
      if (elStatLastCh) elStatLastCh.textContent = '오늘의 실천을 시작해보세요';
    }

    // 필터링 적용
    let filtered = records;
    if (filter === 'rx') {
      filtered = filtered.filter(r => String(r.title).includes('처방전') || r.isRx);
    } else if (filter === '1' || filter === '2' || filter === '3') {
      filtered = filtered.filter(r => String(r.chapter) === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(r => {
        const titleMatch = (r.title || '').toLowerCase().includes(q);
        const dateMatch = (r.date || '').toLowerCase().includes(q);
        const ansMatch = JSON.stringify(r.answers || {}).toLowerCase().includes(q);
        const affMatch = (r.affirmation || '').toLowerCase().includes(q);
        return titleMatch || dateMatch || ansMatch || affMatch;
      });
    }

    // HTML 생성
    let cardsHtml = '';
    if (filtered.length === 0) {
      if (records.length === 0) {
        cardsHtml = `
          <div class="wb-empty-card">
            <div class="wb-empty-icon">📖</div>
            <div class="wb-empty-title">아직 기록된 실천 저널이 없습니다</div>
            <p class="wb-empty-desc">
              《왜 나는 불안할까》는 머리로만 읽는 책이 아닌, 직접 마주하고 실천하는 책입니다.<br>
              40가지 연습실이나 3분 응급 처방전에서 오늘의 치유 연습을 시작해 보세요.
            </p>
            <div class="wb-empty-btns">
              <button class="btn-copper" onclick="switchTab('tab-exercises')">🎯 40가지 실천 연습실 가기</button>
              <button class="btn-sage" onclick="launchRandomPractice()">🎲 오늘의 추천 연습 뽑기</button>
            </div>
          </div>
        `;
      } else {
        cardsHtml = `
          <div class="wb-empty-card">
            <div class="wb-empty-icon">🔍</div>
            <div class="wb-empty-title">일치하는 실천 기록이 없습니다</div>
            <p class="wb-empty-desc">선택하신 필터 조건이나 검색어와 일치하는 기록이 없습니다.</p>
            <div class="wb-empty-btns">
              <button class="btn-copper" onclick="window.resetWorkbookFilter()">전체 기록 보기</button>
            </div>
          </div>
        `;
      }
    } else {
      cardsHtml = filtered.map(r => {
        const isRx = String(r.title).includes('처방전') || r.isRx;
        const typeBadge = isRx ? '💊 3분 처방전' : '🎯 40가지 연습';
        const typeClass = isRx ? 'wb-badge-rx' : 'wb-badge-ch';
        const sud = r.sudScore || (r.answers ? r.answers['sud_score'] : null);
        let sudHtml = '';

        if (sud !== null && sud !== undefined && !isNaN(Number(sud))) {
          const sVal = Number(sud);
          let sColor = '#2e7d32';
          let sText = '평온';
          if (sVal > 3 && sVal <= 6) { sColor = '#d97706'; sText = '안정 완화'; }
          else if (sVal > 6) { sColor = '#dc2626'; sText = '주의 관찰'; }

          sudHtml = `
            <div class="wb-sud-banner">
              <div class="wb-sud-row">
                <span class="wb-sud-lbl">🌱 실천 후 마음 불편감(SUD) 척도:</span>
                <span class="wb-sud-num" style="color: ${sColor};">${sVal} / 10점 (${sText})</span>
              </div>
              <div class="wb-sud-track">
                <div class="wb-sud-fill" style="width: ${sVal * 10}%; background: ${sColor};"></div>
              </div>
            </div>
          `;
        }

        const affirmationHtml = r.affirmation ? `
          <div class="wb-affirmation-card">
            <div class="wb-aff-label">🌟 가슴에 새긴 오늘의 치유 확언</div>
            <div class="wb-aff-text">"${escapeHtml(r.affirmation)}"</div>
          </div>
        ` : '';

        const qaHtml = formatRecordQA(r);

        return `
          <div class="wb-card">
            <div class="wb-card-topbar">
              <div class="wb-badges-group">
                <span class="wb-badge-pill ${typeClass}">${typeBadge}</span>
                <span class="wb-badge-pill wb-badge-ch">${r.chapter || 1}장 · P.${r.page || 18}</span>
                <span class="wb-badge-date">📅 ${r.date}</span>
              </div>
            </div>

            <div class="wb-card-title-row">
              <div class="wb-card-icon">${r.icon || (isRx ? '💊' : '🎯')}</div>
              <div>
                <h3 class="wb-card-title">${escapeHtml(r.title)}</h3>
                <div class="wb-card-page">도서 《FIND YOUR 왜 나는 불안할까》 ${r.page || 18}쪽 연동 실천 기록</div>
              </div>
            </div>

            ${affirmationHtml}
            ${sudHtml}

            <div class="wb-qa-box">
              <div class="wb-qa-header-title">📝 나의 실천 및 작성 내용</div>
              ${qaHtml}
            </div>

            <div class="wb-card-footer">
              <button class="wb-btn-action redo" onclick="window.startPractice(${r.exerciseIdx || 1})">
                <span>🎯 다시 실천하기</span>
              </button>
              <button class="wb-btn-action consult" onclick="window.askDrZAboutJournal(${r.id})">
                <span>💬 루시에게 질문하기</span>
              </button>
              <button class="wb-btn-action del" onclick="window.deleteJournalRecord(${r.id})">
                <span>🗑️ 삭제</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    if (workbookContainer) workbookContainer.innerHTML = cardsHtml;
    if (journalModalContainer) journalModalContainer.innerHTML = cardsHtml;
  }

  window.resetWorkbookFilter = function() {
    currentWbFilter = 'all';
    currentWbSearch = '';
    if (wbSearchInput) wbSearchInput.value = '';
    wbFilterPills.forEach(p => {
      if (p.dataset.wbFilter === 'all') p.classList.add('active');
      else p.classList.remove('active');
    });
    renderWorkbook();
  };

  // 루시에게 워크북 실천 기록으로 질문하기
  window.askDrZAboutJournal = function(recordId) {
    const records = JSON.parse(localStorage.getItem('calm_journal_records') || '[]');
    const r = records.find(item => item.id === recordId);
    if (!r) return;

    let ansSummary = '';
    if (r.answers) {
      ansSummary = Object.entries(r.answers)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }

    const text = `Key 마음약방에서 '${r.title}'을 실천하고 다음과 같이 기록했어:\n\n[실천 내용: ${ansSummary}]\n\n이 기록을 바탕으로 루시의 다정한 통찰과 함께 불안을 이겨낼 수 있는 피드백과 조언을 들려줘.`;
    if (typeof askLucyWithText === 'function') {
      askLucyWithText(text);
    } else {
      try {
        sessionStorage.setItem('lucy_injected_auto_send', text);
        sessionStorage.setItem('lucy_injected_input_draft', text);
      } catch (_) {}
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'NAVIGATE_LUCKEY', path: '/chat', text: text }, '*');
      } else {
        window.location.href = '/chat';
      }
    }
  };

  // 개별 기록 삭제
  window.deleteJournalRecord = function(recordId) {
    if (!confirm('이 실천 기록을 정말 삭제하시겠습니까?')) return;
    let records = JSON.parse(localStorage.getItem('calm_journal_records') || '[]');
    records = records.filter(r => r.id !== recordId);
    localStorage.setItem('calm_journal_records', JSON.stringify(records));
    renderWorkbook();
  };

  // 필터 탭 클릭 이벤트 바인딩
  wbFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      wbFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderWorkbook(pill.dataset.wbFilter, currentWbSearch);
    });
  });

  // 검색 인풋 이벤트 바인딩
  if (wbSearchInput) {
    let searchDebounce = null;
    wbSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        renderWorkbook(currentWbFilter, e.target.value);
      }, 150);
    });
  }

  // 텍스트 내보내기 공통 함수
  function exportWorkbookRecords() {
    const records = JSON.parse(localStorage.getItem('calm_journal_records') || '[]');
    if (records.length === 0) {
      alert('내보낼 실천 기록이 없습니다.');
      return;
    }

    let exportText = `# 📓 CALM 《FIND YOUR 왜 나는 불안할까》 나만의 실천 워크북 기록장\n`;
    exportText += `> 임상심리학자 제이미 저커먼 박사 원작 연계 디지털 마음 저널\n\n`;
    exportText += `- 총 실천 횟수: ${records.length}회\n`;
    exportText += `- 내보낸 일시: ${new Date().toLocaleString('ko-KR')}\n\n`;
    exportText += `---\n\n`;

    records.forEach((r, idx) => {
      exportText += `### [${idx + 1}] ${r.title} (도서 ${r.page || 18}쪽)\n`;
      exportText += `- **기록 일시**: ${r.date}\n`;
      exportText += `- **챕터**: ${r.chapter || 1}장 · ${r.tag || '마음 연습'}\n`;
      if (r.affirmation) exportText += `- **치유 확언**: "${r.affirmation}"\n`;
      if (r.sudScore) exportText += `- **SUD 불편도**: ${r.sudScore} / 10점\n`;
      exportText += `\n**[실천 및 작성 내용]**\n`;
      Object.entries(r.answers || {}).forEach(([k, v]) => {
        if (k !== 'sud_score') {
          exportText += `- **${k}**: ${v}\n`;
        }
      });
      exportText += `\n---\n\n`;
    });

    const blob = new Blob([exportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CALM_마음실천워크북_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  }

  // 전체 삭제 공통 함수
  function clearWorkbookRecords() {
    if (confirm('저장된 모든 실천 워크북 기록을 영구히 삭제하시겠습니까?\n삭제된 기록은 복구할 수 없습니다.')) {
      localStorage.removeItem('calm_journal_records');
      renderWorkbook();
    }
  }

  if (wbBtnExport) wbBtnExport.addEventListener('click', exportWorkbookRecords);
  if (btnExportJournal) btnExportJournal.addEventListener('click', exportWorkbookRecords);
  if (wbBtnClear) wbBtnClear.addEventListener('click', clearWorkbookRecords);
  if (btnClearJournal) btnClearJournal.addEventListener('click', clearWorkbookRecords);

  function openJournalModal() {
    renderWorkbook();
    modalJournal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeJournalModal() {
    modalJournal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  if (btnOpenJournal) {
    btnOpenJournal.addEventListener('click', () => {
      switchTab('tab-workbook');
    });
  }
  if (btnCloseJournal) btnCloseJournal.addEventListener('click', closeJournalModal);
  if (btnDoneJournal) btnDoneJournal.addEventListener('click', closeJournalModal);

  // =========================================================
  // 💊 3-Minute Emergency Prescription Studio Engine
  // =========================================================
  const modalPrescription = document.getElementById('modal-prescription');
  const btnClosePrescription = document.getElementById('btn-close-prescription');
  const rxTimerDigits = document.getElementById('rx-timer-digits');
  const rxChip1 = document.getElementById('rx-chip-1');
  const rxChip2 = document.getElementById('rx-chip-2');
  const rxChip3 = document.getElementById('rx-chip-3');

  const rxStage1 = document.getElementById('rx-stage-1');
  const rxStage2 = document.getElementById('rx-stage-2');
  const rxStage3 = document.getElementById('rx-stage-3');

  const rxBreathVisual = document.getElementById('rx-breath-visual');
  const rxBreathInstruction = document.getElementById('rx-breath-instruction');
  const rxBreathSec = document.getElementById('rx-breath-sec');

  const rxWorryText = document.getElementById('rx-worry-text');
  const rxWorryInputArea = document.getElementById('rx-worry-input-area');
  const btnDissolveWorry = document.getElementById('btn-dissolve-worry');
  const rxDissolvedResult = document.getElementById('rx-dissolved-result');

  const rxReceiptDate = document.getElementById('rx-receipt-date');
  const rxReceiptWorryLabel = document.getElementById('rx-receipt-worry-label');
  const rxRecBadge = document.getElementById('rx-rec-badge');
  const rxRecTitle = document.getElementById('rx-rec-title');
  const rxRecDesc = document.getElementById('rx-rec-desc');
  const rxRecQuote = document.getElementById('rx-rec-quote');

  const btnRxSaveJournal = document.getElementById('btn-rx-save-journal');
  const btnRxPracticeNow = document.getElementById('btn-rx-practice-now');
  const btnRxToggleSound = document.getElementById('btn-rx-toggle-sound');
  const btnRxPrev = document.getElementById('btn-rx-prev');
  const btnRxNext = document.getElementById('btn-rx-next');

  let rxCurrentStage = 1; // 1: 이완, 2: 걱정 털기, 3: 처방전
  let rxTimerInterval = null;
  let rxBreathInterval = null;
  let rxRemainingSeconds = 180;
  let rxPrescribedEx = null;
  let rxUserWorry = '';
  let isRxSoundOn = false;

  const drZQuotes = [
    "괜찮지 않아도 괜찮습니다. 생각은 통제할 수 없지만, 그 생각을 대하는 나의 태도는 선택할 수 있습니다.",
    "감정은 바다의 파도와 같습니다. 맞서 싸우면 휩쓸리지만, 가만히 바라보면 스스로 정점을 찍고 가라앉습니다.",
    "지금 머무르는 불안은 단지 뇌가 나를 보호하려 보낸 과열된 경보일 뿐, 진실이 아닙니다.",
    "호흡에 닻을 내리세요. 세상의 어떤 소란도 당신 내면의 본래 평화를 빼앗을 수 없습니다."
  ];

  window.openPrescriptionStudio = function() {
    if (!modalPrescription) return;

    // 랜덤 추천 연습 1개 배정
    const randomIdx = Math.floor(Math.random() * 40) + 1;
    rxPrescribedEx = window.PRACTICE_EXERCISES.find(e => e.globalIndex === randomIdx) || window.PRACTICE_EXERCISES[0];
    rxUserWorry = '';

    // 상태 초기화
    rxRemainingSeconds = 180;
    rxCurrentStage = 1;
    updateRxStageUI(1);

    if (rxWorryText) rxWorryText.value = '';
    if (rxWorryInputArea) rxWorryInputArea.classList.remove('hidden');
    if (rxDissolvedResult) rxDissolvedResult.classList.add('hidden');

    // 모달 표시
    modalPrescription.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // 3분 메인 타이머 가동
    startRxTimer();

    // 1단계 호흡 가이드 가동
    startRxBreathing();
  };

  function closePrescriptionStudio() {
    if (rxTimerInterval) {
      clearInterval(rxTimerInterval);
      rxTimerInterval = null;
    }
    if (rxBreathInterval) {
      clearInterval(rxBreathInterval);
      rxBreathInterval = null;
    }
    if (window.soundscapeEngine && (window.soundscapeEngine.currentSound === 'ocean' || isRxSoundOn)) {
      window.soundscapeEngine.stop();
      isRxSoundOn = false;
      if (btnRxToggleSound) btnRxToggleSound.innerHTML = '<span>🔔 싱잉볼 소리 켜기</span>';
    }
    if (modalPrescription) modalPrescription.classList.add('hidden');
    document.body.style.overflow = '';
  }

  if (btnClosePrescription) btnClosePrescription.addEventListener('click', closePrescriptionStudio);

  function startRxTimer() {
    if (rxTimerInterval) {
      clearInterval(rxTimerInterval);
      rxTimerInterval = null;
    }

    updateTimerDisplay();

    rxTimerInterval = setInterval(() => {
      rxRemainingSeconds--;

      if (rxRemainingSeconds <= 0) {
        clearInterval(rxTimerInterval);
        rxTimerInterval = null;
        rxRemainingSeconds = 0;
        updateTimerDisplay();
        setRxStage(3); // 3분 종료 시 처방전 화면으로 이동
        if (window.soundscapeEngine && typeof window.soundscapeEngine.playChime === 'function') {
          window.soundscapeEngine.playChime();
        }
        return;
      }

      updateTimerDisplay();

      // 시간 경과에 따른 자동 스테이지 전환 가이드 (선택적)
      if (rxRemainingSeconds === 135 && rxCurrentStage === 1) {
        setRxStage(2);
      } else if (rxRemainingSeconds === 60 && rxCurrentStage === 2) {
        setRxStage(3);
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const min = Math.floor(rxRemainingSeconds / 60);
    const sec = rxRemainingSeconds % 60;
    if (rxTimerDigits) {
      rxTimerDigits.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
  }

  function setRxStage(stageNum) {
    rxCurrentStage = stageNum;
    updateRxStageUI(stageNum);

    if (stageNum === 1) {
      startRxBreathing();
    } else {
      if (rxBreathInterval) clearInterval(rxBreathInterval);
    }

    if (stageNum === 3) {
      renderRxReceipt();
    }
  }

  function updateRxStageUI(stageNum) {
    // 칩 업데이트
    [rxChip1, rxChip2, rxChip3].forEach((chip, idx) => {
      if (!chip) return;
      chip.classList.remove('active', 'completed');
      if (idx + 1 === stageNum) chip.classList.add('active');
      else if (idx + 1 < stageNum) chip.classList.add('completed');
    });

    // 뷰 전환
    if (rxStage1) rxStage1.classList.toggle('hidden', stageNum !== 1);
    if (rxStage2) rxStage2.classList.toggle('hidden', stageNum !== 2);
    if (rxStage3) rxStage3.classList.toggle('hidden', stageNum !== 3);

    // 하단 버튼
    if (btnRxPrev) btnRxPrev.classList.toggle('hidden', stageNum === 1);
    if (btnRxNext) {
      if (stageNum === 3) {
        btnRxNext.textContent = '처방 완료 및 닫기';
      } else {
        btnRxNext.textContent = '다음 단계';
      }
    }
  }

  // 1단계 4-6 호흡 엔진
  function startRxBreathing() {
    if (rxBreathInterval) clearInterval(rxBreathInterval);
    let phase = 'inhale'; // inhale: 4s, exhale: 6s
    let secLeft = 4;

    if (rxBreathVisual) {
      rxBreathVisual.className = 'rx-breath-circle inhale';
      rxBreathInstruction.textContent = '들이쉬기 (4초)';
      rxBreathSec.textContent = '4';
    }

    rxBreathInterval = setInterval(() => {
      secLeft--;
      if (secLeft <= 0) {
        if (phase === 'inhale') {
          phase = 'exhale';
          secLeft = 6;
          if (rxBreathVisual) {
            rxBreathVisual.className = 'rx-breath-circle exhale';
            rxBreathInstruction.textContent = '내쉬기 (6초)';
          }
        } else {
          phase = 'inhale';
          secLeft = 4;
          if (rxBreathVisual) {
            rxBreathVisual.className = 'rx-breath-circle inhale';
            rxBreathInstruction.textContent = '들이쉬기 (4초)';
          }
        }
      }
      if (rxBreathSec) rxBreathSec.textContent = secLeft;
    }, 1000);
  }

  // 2단계 걱정 파도 분해
  if (btnDissolveWorry) {
    btnDissolveWorry.addEventListener('click', () => {
      const text = (rxWorryText ? rxWorryText.value.trim() : '');
      rxUserWorry = text || '알 수 없는 불안과 긴장';

      // 파도 분해 사운드 및 전환
      window.soundscapeEngine.play('ocean');

      if (rxWorryInputArea) rxWorryInputArea.classList.add('hidden');
      if (rxDissolvedResult) rxDissolvedResult.classList.remove('hidden');

      setTimeout(() => {
        if (window.soundscapeEngine && window.soundscapeEngine.currentSound === 'ocean') {
          window.soundscapeEngine.stop();
        }
        setRxStage(3);
        if (window.soundscapeEngine && typeof window.soundscapeEngine.playChime === 'function') {
          window.soundscapeEngine.playChime();
        }
      }, 2500);
    });
  }

  // 3단계 처방전 카드 렌더링
  function renderRxReceipt() {
    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    if (rxReceiptDate) rxReceiptDate.textContent = today;
    if (rxReceiptWorryLabel) rxReceiptWorryLabel.textContent = rxUserWorry || '현재의 심리적 압박 및 불안 완화';

    if (rxPrescribedEx) {
      if (rxRecBadge) rxRecBadge.textContent = `${rxPrescribedEx.chapter || 1}장 · ${rxPrescribedEx.tag || '마음 연습'} (P.${rxPrescribedEx.page || 18})`;
      if (rxRecTitle) rxRecTitle.textContent = `연습 ${rxPrescribedEx.index || 1}. ${rxPrescribedEx.title || ''}`;
      const subPrefix = rxPrescribedEx.subtitle ? `${rxPrescribedEx.subtitle} - ` : '';
      const exDesc = rxPrescribedEx.description || rxPrescribedEx.purpose || '마음의 평온을 되찾는 실천 연습입니다.';
      if (rxRecDesc) rxRecDesc.textContent = `${subPrefix}${exDesc}`;
    }

    if (rxRecQuote) {
      const randQuote = drZQuotes[Math.floor(Math.random() * drZQuotes.length)];
      rxRecQuote.textContent = randQuote;
    }
  }

  // 처방전 워크북 보관
  if (btnRxSaveJournal) {
    btnRxSaveJournal.addEventListener('click', () => {
      if (!rxPrescribedEx) return;

      const journal = JSON.parse(localStorage.getItem('calm_journal_records') || '[]');
      const record = {
        id: Date.now(),
        date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        exerciseIdx: rxPrescribedEx.globalIndex,
        chapter: rxPrescribedEx.chapter,
        chapterTitle: '3분 응급 이완 프로토콜',
        title: `[💊 3분 처방전] ${rxPrescribedEx.title}`,
        subtitle: rxPrescribedEx.subtitle || '',
        page: rxPrescribedEx.page || 18,
        icon: '💊',
        tag: '3분 처방',
        affirmation: '불안에 맞서지 않고 바다의 파도처럼 가만히 지나가게 둡니다.',
        isRx: true,
        answers: {
          "흘려보낸 걱정": rxUserWorry || "알 수 없는 불안과 긴장",
          "처방 실천": `연습 ${rxPrescribedEx.index}. ${rxPrescribedEx.title} (${rxPrescribedEx.page}쪽)`,
          "마음 상태": "3분 이완 프로토콜 완료"
        },
        sudScore: null
      };
      journal.unshift(record);
      localStorage.setItem('calm_journal_records', JSON.stringify(journal));
      if (typeof renderWorkbook === 'function') {
        renderWorkbook();
      }

      btnRxSaveJournal.textContent = '✅ 워크북 저장 완료!';
      btnRxSaveJournal.disabled = true;
      setTimeout(() => {
        if (btnRxSaveJournal) {
          btnRxSaveJournal.textContent = '📓 내 워크북에 처방전 보관';
          btnRxSaveJournal.disabled = false;
        }
      }, 2500);
    });
  }

  // 처방된 연습 즉시 실천하기
  if (btnRxPracticeNow) {
    btnRxPracticeNow.addEventListener('click', () => {
      if (!rxPrescribedEx) return;
      closePrescriptionStudio();
      window.startPractice(rxPrescribedEx.globalIndex);
    });
  }

  // 네비게이션 버튼 (이전 / 다음)
  if (btnRxPrev) {
    btnRxPrev.addEventListener('click', () => {
      if (rxCurrentStage > 1) {
        setRxStage(rxCurrentStage - 1);
      }
    });
  }

  if (btnRxNext) {
    btnRxNext.addEventListener('click', () => {
      if (rxCurrentStage < 3) {
        setRxStage(rxCurrentStage + 1);
      } else {
        closePrescriptionStudio();
      }
    });
  }

  if (btnRxToggleSound) {
    btnRxToggleSound.addEventListener('click', () => {
      isRxSoundOn = !isRxSoundOn;
      if (isRxSoundOn) {
        window.soundscapeEngine.play('bowl');
        btnRxToggleSound.innerHTML = '<span>🔔 싱잉볼 소리 끄기</span>';
      } else {
        window.soundscapeEngine.stop();
        btnRxToggleSound.innerHTML = '<span>🔔 싱잉볼 소리 켜기</span>';
      }
    });
  }

  // =========================================================
  // 10. Inner Pause Teachings Section (내면의 쉼표 가르침 섹션)
  // =========================================================
  let currentTeaching = null;
  const oracleIcon = document.getElementById('oracle-icon');
  const oracleTheme = document.getElementById('oracle-theme');
  const oracleHeadline = document.getElementById('oracle-headline');
  const oracleQuote = document.getElementById('oracle-quote');
  const oracleGroundingInst = document.getElementById('oracle-grounding-inst');
  const oracleGroundingPrac = document.getElementById('oracle-grounding-prac');
  const oracleHealingInst = document.getElementById('oracle-healing-inst');
  const oracleHealingPrac = document.getElementById('oracle-healing-prac');
  const oracleLiberationDecl = document.getElementById('oracle-liberation-decl');
  const oracleQuestion = document.getElementById('oracle-question');

  const btnDrawTeaching = document.getElementById('btn-draw-teaching');
  const btnMeditateTeaching = document.getElementById('btn-meditate-teaching');
  const btnAskTeaching = document.getElementById('btn-ask-teaching');

  function renderTeaching(teaching) {
    if (!teaching) return;
    currentTeaching = teaching;

    if (oracleIcon) oracleIcon.textContent = teaching.icon || '✨';
    if (oracleTheme) oracleTheme.textContent = teaching.theme || '내면의 쉼표';
    if (oracleHeadline) oracleHeadline.textContent = teaching.headline;
    if (oracleQuote) oracleQuote.textContent = `"${teaching.quote}"`;

    if (oracleGroundingInst) oracleGroundingInst.textContent = teaching.grounding ? teaching.grounding.instruction : '';
    if (oracleGroundingPrac) oracleGroundingPrac.textContent = teaching.grounding ? teaching.grounding.practice : '';

    if (oracleHealingInst) oracleHealingInst.textContent = teaching.healing ? teaching.healing.instruction : '';
    if (oracleHealingPrac) oracleHealingPrac.textContent = teaching.healing ? teaching.healing.practice : '';

    if (oracleLiberationDecl) oracleLiberationDecl.textContent = teaching.liberation ? teaching.liberation.declaration : '';
    if (oracleQuestion) oracleQuestion.textContent = teaching.reflectionQuestion || '';

    const card = document.getElementById('teaching-oracle-card');
    if (card) {
      card.classList.remove('oracle-animate-pop');
      void card.offsetWidth;
      card.classList.add('oracle-animate-pop');
    }
  }

  // 초기 렌더링
  if (typeof window.getRandomTeaching === 'function') {
    renderTeaching(window.getRandomTeaching());
  }

  // 가르침 새로 뽑기 (오늘의 가르침 새로 받기)
  if (btnDrawTeaching) {
    btnDrawTeaching.addEventListener('click', () => {
      if (typeof window.getRandomTeaching !== 'function') return;
      const nextTeaching = window.getRandomTeaching(currentTeaching ? currentTeaching.id : null);
      renderTeaching(nextTeaching);

      if (window.soundscapeEngine && typeof window.soundscapeEngine.playChime === 'function') {
        window.soundscapeEngine.playChime();
      }
    });
  }

  // 이 가르침으로 상담받기
  if (btnAskTeaching) {
    btnAskTeaching.addEventListener('click', () => {
      if (!currentTeaching) return;
      switchTab('tab-chat');
      const questionPrompt = `오늘 내면의 쉼표 가르침 [${currentTeaching.theme}]: "${currentTeaching.headline}" 가르침을 읽었습니다. ${currentTeaching.reflectionQuestion}에 대해 제 상황을 나누고, 불안을 내려놓는 지혜를 얻고 싶어요.`;
      if (userInput && chatForm) {
        userInput.value = questionPrompt;
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  }

  // 가르침 카드 하단 3분 체화 명상 리추얼 이동 버튼
  if (btnMeditateTeaching) {
    btnMeditateTeaching.addEventListener('click', () => {
      const box = document.getElementById('teaching-meditation-box');
      if (box) {
        box.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          startRitual();
        }, 400);
      }
    });
  }

  const btnStartRitual = document.getElementById('btn-start-ritual');
  const btnStopRitual = document.getElementById('btn-stop-ritual');
  const btnNextStage = document.getElementById('btn-next-stage');
  const tMedPlayer = document.getElementById('t-med-player');
  const tMedSec = document.getElementById('t-med-sec');
  const tMedStageName = document.getElementById('t-med-stage-name');
  const tMedGuide = document.getElementById('t-med-guide');
  const tDot1 = document.getElementById('t-dot-1');
  const tDot2 = document.getElementById('t-dot-2');
  const tDot3 = document.getElementById('t-dot-3');

  // TTS 컨트롤 및 상태 DOM
  const btnRitualVoiceToggle = document.getElementById('btn-ritual-voice-toggle');
  const voiceToggleIcon = document.getElementById('voice-toggle-icon');
  const voiceToggleText = document.getElementById('voice-toggle-text');
  const ritualVoiceSelect = document.getElementById('ritual-voice-select');
  const tMedVoiceStatus = document.getElementById('t-med-voice-status');
  const voiceStatusText = document.getElementById('voice-status-text');
  const btnReplayVoice = document.getElementById('btn-replay-voice');

  // 3분 체화 명상 리추얼 및 실시간 음성 TTS 가이드 엔진
  let ritualTimer = null;
  let ritualStage = 1;
  let ritualSecondsLeft = 60;
  let ttsEnabled = true;
  let ttsVoice = 'Kore'; // 'Kore' | 'Puck' | 'Zephyr' | 'browser'
  let activeTtsAudio = null;
  let activeUtterance = null;
  const clientTtsCache = new Map();

  // 단계별 텍스트 가이드
  const RITUAL_STAGE_INFO = {
    1: {
      name: "1단계: 신체 접지 (Somatic Grounding)",
      time: 60,
      guide: "가만히 눈을 감고 어깨와 턱의 힘을 툭 뺍니다. 발바닥이 닿은 대지의 안정감을 느끼고, 아랫배가 오르내리는 숨의 파도에 집중하세요."
    },
    2: {
      name: "2단계: 기적수업 용서 (ACIM Forgiveness)",
      time: 60,
      guide: "불안한 생각을 통제하려던 손을 조용히 내려놓습니다. 떠오르는 생각과 감정을 싸우지 않고 '바람에 스쳐 지나가는 구름'으로 관찰하며 용서하세요."
    },
    3: {
      name: "3단계: 본래의 온전함 선언 (Inherent Wholeness)",
      time: 60,
      guide: "심연 속 깊은 바다는 어떤 거센 파도에도 다치지 않습니다. '나는 지금 이대로 온전하며, 내 안의 평화는 영원하다'고 마음속으로 읊조려보세요."
    }
  };

  // 단계별 전문 TTS 음성 스크립트 (차분하고 다정한 명상 나레이션)
  const RITUAL_TTS_SCRIPTS = {
    1: "1단계, 신체 접지입니다. 가만히 눈을 감고 어깨와 턱의 힘을 툭 뺍니다. 발바닥이 닿아 있는 대지의 안정감을 느껴보세요. 아랫배가 부풀어 오르고 가라앉는 숨의 파도에 집중합니다. 코로 4초간 깊게 들이쉬고, 입으로 6초간 모든 긴장을 비워냅니다.",
    2: "2단계, 기적수업 용서입니다. 불안한 생각을 억지로 통제하려던 손을 조용히 내려놓으세요. 떠오르는 생각과 감정을 나와 분리하여, 하늘에 스쳐 지나가는 구름처럼 그저 관찰합니다. 이 감정을 느끼는 나 자신을 따뜻하게 안아주고 용서하세요.",
    3: "3단계, 본래의 온전함 선언입니다. 심연 속 깊은 바다는 거센 파도에도 결코 다치지 않습니다. 마음속으로 가만히 선언해 보세요. '나는 지금 이대로 온전하며, 내 안의 깊은 평화는 영원하다.' 당신은 이미 완전하고 안전합니다.",
    done: "3분 내면의 쉼표 명상 리추얼이 모두 완료되었습니다. 내면의 깊은 평온을 가슴에 품고, 편안한 호흡과 함께 천천히 눈을 떠보세요."
  };

  // 사운드스케이프 배경음 볼륨 덕킹 (음성 재생 시 배경음 부드럽게 낮춤)
  function duckSoundscapeVolume(targetVol = 0.15) {
    if (window.soundscapeEngine && window.soundscapeEngine.masterGain && window.soundscapeEngine.ctx) {
      try {
        window.soundscapeEngine.masterGain.gain.linearRampToValueAtTime(targetVol, window.soundscapeEngine.ctx.currentTime + 0.3);
      } catch (e) {}
    }
  }

  function restoreSoundscapeVolume(normalVol = 0.4) {
    if (window.soundscapeEngine && window.soundscapeEngine.masterGain && window.soundscapeEngine.ctx) {
      try {
        window.soundscapeEngine.masterGain.gain.linearRampToValueAtTime(normalVol, window.soundscapeEngine.ctx.currentTime + 0.8);
      } catch (e) {}
    }
  }

  // TTS 상태 인디케이터 갱신
  function setVoiceIndicatorStatus(state, customText = '') {
    if (!tMedVoiceStatus) return;

    tMedVoiceStatus.classList.remove('speaking', 'loading');

    if (state === 'speaking') {
      tMedVoiceStatus.classList.add('speaking');
      if (voiceStatusText) voiceStatusText.textContent = customText || '🎙️ Dr. Z 음성 안내 재생 중...';
    } else if (state === 'loading') {
      tMedVoiceStatus.classList.add('loading');
      if (voiceStatusText) voiceStatusText.textContent = customText || '⏳ 음성 안내 불러오는 중...';
    } else if (state === 'completed') {
      if (voiceStatusText) voiceStatusText.textContent = customText || '✅ 음성 안내 완료 (깊은 호흡을 이어가세요)';
    } else if (state === 'disabled') {
      if (voiceStatusText) voiceStatusText.textContent = '🔇 음성 안내 꺼짐 (타이머 진행 중)';
    } else {
      if (voiceStatusText) voiceStatusText.textContent = customText || '🎙️ Dr. Z 음성 안내 준비 완료';
    }
  }

  // 재생 중인 TTS 중지
  function stopActiveTts() {
    if (activeTtsAudio) {
      try {
        activeTtsAudio.pause();
        activeTtsAudio.currentTime = 0;
      } catch (e) {}
      activeTtsAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    activeUtterance = null;
    setVoiceIndicatorStatus('idle');
    restoreSoundscapeVolume();
  }

  // 브라우저 Web Speech API 로컬 발화 (오프라인 / fallback)
  function playBrowserTts(text) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceIndicatorStatus('completed', '💡 브라우저 음성 미지원 환경');
      restoreSoundscapeVolume();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.90; // 명상에 최적화된 편안하고 느린 템포
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find(v => v.lang && (v.lang.startsWith('ko') || v.lang.includes('KR')));
      if (koVoice) utterance.voice = koVoice;

      activeUtterance = utterance;
      setVoiceIndicatorStatus('speaking', '🎙️ 브라우저 로컬 음성 안내 중...');

      utterance.onend = () => {
        activeUtterance = null;
        setVoiceIndicatorStatus('completed');
        restoreSoundscapeVolume();
      };
      utterance.onerror = () => {
        activeUtterance = null;
        setVoiceIndicatorStatus('idle');
        restoreSoundscapeVolume();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Browser TTS 오류:', err);
      setVoiceIndicatorStatus('idle');
      restoreSoundscapeVolume();
    }
  }

  // Audio URL(Base64 WAV) 재생
  function playAudioUrl(audioUrl, fallbackScript) {
    try {
      const audio = new Audio(audioUrl);
      activeTtsAudio = audio;
      setVoiceIndicatorStatus('speaking');

      audio.onended = () => {
        activeTtsAudio = null;
        setVoiceIndicatorStatus('completed');
        restoreSoundscapeVolume();
      };

      audio.onerror = () => {
        activeTtsAudio = null;
        playBrowserTts(fallbackScript);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn('Audio 자동 재생 차단 또는 오류:', e);
          playBrowserTts(fallbackScript);
        });
      }
    } catch (e) {
      playBrowserTts(fallbackScript);
    }
  }

  // 단계별 TTS 실행 함수
  function speakRitualScript(stageKey) {
    if (!ttsEnabled) {
      setVoiceIndicatorStatus('disabled');
      return;
    }

    const script = RITUAL_TTS_SCRIPTS[stageKey];
    if (!script) return;

    stopActiveTts();
    duckSoundscapeVolume(0.15);

    if (ttsVoice === 'browser') {
      playBrowserTts(script);
      return;
    }

    const cacheKey = `${ttsVoice}:${script}`;
    if (clientTtsCache.has(cacheKey)) {
      playAudioUrl(clientTtsCache.get(cacheKey), script);
      return;
    }

    setVoiceIndicatorStatus('loading');

    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: script, voice: ttsVoice })
    })
      .then(res => res.json())
      .then(data => {
        if (data.audio) {
          clientTtsCache.set(cacheKey, data.audio);
          playAudioUrl(data.audio, script);
        } else {
          // Gemini TTS 오류 또는 fallback 플래그 수신 시 브라우저 TTS 실행
          playBrowserTts(script);
        }
      })
      .catch(err => {
        console.warn('TTS API 호출 실패, 브라우저 음성으로 대체:', err);
        playBrowserTts(script);
      });
  }

  // 다음 단계 TTS 오디오 백그라운드 프리로딩 (무지연 재생 보장)
  function preloadRitualTts() {
    if (!ttsEnabled || ttsVoice === 'browser') return;
    [1, 2, 3, 'done'].forEach(key => {
      const script = RITUAL_TTS_SCRIPTS[key];
      const cacheKey = `${ttsVoice}:${script}`;
      if (!clientTtsCache.has(cacheKey)) {
        fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: script, voice: ttsVoice })
        })
          .then(r => r.json())
          .then(d => {
            if (d.audio) clientTtsCache.set(cacheKey, d.audio);
          })
          .catch(() => {});
      }
    });
  }

  function updateRitualUI() {
    const info = RITUAL_STAGE_INFO[ritualStage];
    if (!info) return;

    if (tMedSec) tMedSec.textContent = ritualSecondsLeft;
    if (tMedStageName) tMedStageName.textContent = info.name;
    if (tMedGuide) tMedGuide.textContent = info.guide;

    [tDot1, tDot2, tDot3].forEach((dot, idx) => {
      if (!dot) return;
      if (idx + 1 === ritualStage) {
        dot.classList.add('active');
        dot.classList.remove('completed');
      } else if (idx + 1 < ritualStage) {
        dot.classList.add('completed');
        dot.classList.remove('active');
      } else {
        dot.classList.remove('active', 'completed');
      }
    });
  }

  function startRitual() {
    if (ritualTimer) clearInterval(ritualTimer);
    stopActiveTts();

    ritualStage = 1;
    ritualSecondsLeft = 60;

    if (tMedPlayer) tMedPlayer.classList.remove('hidden');
    if (btnStartRitual) btnStartRitual.classList.add('hidden');

    updateRitualUI();

    // 시작 싱잉볼 차임벨 타종 후 TTS 음성 안내 발화
    if (window.soundscapeEngine && typeof window.soundscapeEngine.playChime === 'function') {
      window.soundscapeEngine.playChime();
    }

    // TTS 음성 안내 시작 (차임 소리와 겹치지 않게 700ms 후 부드럽게 시작)
    setTimeout(() => {
      speakRitualScript(1);
    }, 700);

    // 다음 단계 음성 사전 로딩
    preloadRitualTts();

    ritualTimer = setInterval(() => {
      ritualSecondsLeft--;
      if (ritualSecondsLeft <= 0) {
        advanceRitualStage();
      } else {
        if (tMedSec) tMedSec.textContent = ritualSecondsLeft;
      }
    }, 1000);
  }

  function advanceRitualStage() {
    if (ritualStage < 3) {
      ritualStage++;
      ritualSecondsLeft = 60;
      updateRitualUI();

      if (window.soundscapeEngine && typeof window.soundscapeEngine.playChime === 'function') {
        window.soundscapeEngine.playChime();
      }

      setTimeout(() => {
        speakRitualScript(ritualStage);
      }, 700);
    } else {
      // 명상 리추얼 완료
      if (ritualTimer) {
        clearInterval(ritualTimer);
        ritualTimer = null;
      }
      if (window.soundscapeEngine && typeof window.soundscapeEngine.playChime === 'function') {
        window.soundscapeEngine.playChime();
      }
      if (tMedGuide) {
        tMedGuide.innerHTML = "✨ <strong>3분 내면의 쉼표 명상 리추얼이 완료되었습니다.</strong><br>내면의 훼손되지 않는 평온을 품고 오늘 하루를 편안하게 살아가세요.";
      }
      if (tMedStageName) tMedStageName.textContent = "명상 리추얼 완료";
      if (tMedSec) tMedSec.textContent = "완료";
      if (tDot3) tDot3.classList.add('completed');

      setTimeout(() => {
        speakRitualScript('done');
      }, 700);
    }
  }

  function stopRitual() {
    if (ritualTimer) {
      clearInterval(ritualTimer);
      ritualTimer = null;
    }
    stopActiveTts();

    if (tMedPlayer) tMedPlayer.classList.add('hidden');
    if (btnStartRitual) btnStartRitual.classList.remove('hidden');

    ritualStage = 1;
    ritualSecondsLeft = 60;
    [tDot1, tDot2, tDot3].forEach(dot => {
      if (dot) dot.classList.remove('active', 'completed');
    });
  }

  // TTS 토글 버튼 핸들러
  if (btnRitualVoiceToggle) {
    btnRitualVoiceToggle.addEventListener('click', () => {
      ttsEnabled = !ttsEnabled;
      if (ttsEnabled) {
        btnRitualVoiceToggle.classList.add('active');
        if (voiceToggleIcon) voiceToggleIcon.textContent = '🔊';
        if (voiceToggleText) voiceToggleText.textContent = '음성 안내 ON';
        setVoiceIndicatorStatus('idle', '🎙️ 음성 안내 켜짐');
        // 현재 리추얼 진행 중이면 현재 단계 음성 재생
        if (ritualTimer && !tMedPlayer.classList.contains('hidden')) {
          speakRitualScript(ritualStage);
        }
      } else {
        btnRitualVoiceToggle.classList.remove('active');
        if (voiceToggleIcon) voiceToggleIcon.textContent = '🔇';
        if (voiceToggleText) voiceToggleText.textContent = '음성 안내 OFF';
        stopActiveTts();
        setVoiceIndicatorStatus('disabled');
      }
    });
  }

  // TTS 보이스 선택 드롭다운 핸들러
  if (ritualVoiceSelect) {
    ritualVoiceSelect.addEventListener('change', (e) => {
      ttsVoice = e.target.value;
      if (ttsEnabled && ritualTimer && !tMedPlayer.classList.contains('hidden')) {
        speakRitualScript(ritualStage);
      }
    });
  }

  // 음성 다시 듣기 버튼
  if (btnReplayVoice) {
    btnReplayVoice.addEventListener('click', () => {
      if (!ttsEnabled) {
        ttsEnabled = true;
        if (btnRitualVoiceToggle) btnRitualVoiceToggle.classList.add('active');
        if (voiceToggleIcon) voiceToggleIcon.textContent = '🔊';
        if (voiceToggleText) voiceToggleText.textContent = '음성 안내 ON';
      }
      speakRitualScript(ritualStage);
    });
  }

  // 다음 단계 바로 넘어가기 버튼
  if (btnNextStage) {
    btnNextStage.addEventListener('click', () => {
      advanceRitualStage();
    });
  }

  if (btnStartRitual) btnStartRitual.addEventListener('click', startRitual);
  if (btnStopRitual) btnStopRitual.addEventListener('click', stopRitual);



  function formatMarkdown(text) {
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    return `<p>${html}</p>`;
  }

  function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 초기 워크북 피드 및 통계 렌더링
  renderWorkbook();

  // 기본 활성 탭: Dr. Z 마음 대화(tab-chat) 안전 활성화 (모든 모듈 로드 완료 후 실행)
  let initialTab = 'tab-chat';
  try {
    const saved = localStorage.getItem('calm_active_tab');
    if (saved && saved !== 'tab-book' && saved !== 'tab-qa' && document.getElementById(saved)) {
      initialTab = saved;
    }
  } catch (e) {}
  switchTab(initialTab, false);
});
