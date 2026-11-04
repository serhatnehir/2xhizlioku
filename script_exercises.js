/*****************************************************************
 * 4. DOSYA (script_exercises.js): SOL TEK TIKLA DURAKLAT/DEVAM ETTİR,
 *    13 EGZERSİZ, SINIF SONU TAMAMLAMA TESTİ YÖNLENDİRMESİ,
 *    KOD YAZMADAN METİN / .TXT EKLEME MERKEZİ VE PDF SERTİFİKA
 *****************************************************************/
let activeInterval = null;
let activeCountdownInterval = null;
let activeAnimFrame = null;
let testClockInterval = null;
let tachiFlashTimeout = null;
let tachiAdvanceTimeout = null;
let meaningFlashTimeout = null;
let meaningAdvanceTimeout = null;
let satirSekmeStartTimeout = null;
let isExerciseRunning = false;
let isExercisePaused = false;

// 4. egzersiz alt açıklamasını çalışma mantığına göre güncelle
if (typeof STAGE_EXERCISES !== 'undefined' && Array.isArray(STAGE_EXERCISES)) {
  if (STAGE_EXERCISES[3]) {
    STAGE_EXERCISES[3].instruction = 'Metin havuzundan gelen düz metnin her satırında sırası gelince vurgulanan ilk ve son kelimelere ritmik göz sekmesi yapın.';
  }
}

function updatePauseBadgeUI() {
  const badge = document.getElementById('arenaPauseBadge');
  if (badge) {
    badge.classList.toggle('visible', Boolean(isExerciseRunning && isExercisePaused));
  }
}

function stopActiveTimers() {
  if (activeInterval) { clearInterval(activeInterval); activeInterval = null; }
  if (activeCountdownInterval) { clearInterval(activeCountdownInterval); activeCountdownInterval = null; }
  if (activeAnimFrame) { cancelAnimationFrame(activeAnimFrame); activeAnimFrame = null; }
  if (testClockInterval) { clearInterval(testClockInterval); testClockInterval = null; }
  if (tachiFlashTimeout) { clearTimeout(tachiFlashTimeout); tachiFlashTimeout = null; }
  if (tachiAdvanceTimeout) { clearTimeout(tachiAdvanceTimeout); tachiAdvanceTimeout = null; }
  if (meaningFlashTimeout) { clearTimeout(meaningFlashTimeout); meaningFlashTimeout = null; }
  if (meaningAdvanceTimeout) { clearTimeout(meaningAdvanceTimeout); meaningAdvanceTimeout = null; }
  if (satirSekmeStartTimeout) { clearTimeout(satirSekmeStartTimeout); satirSekmeStartTimeout = null; }
  isExerciseRunning = false;
  isExercisePaused = false;
  updatePauseBadgeUI();
}

/* ANTRENMAN BAŞLADIKTAN SONRA ÇALIŞMA EKRANINA SOL TEK TIKLAYINCA DURAKLAT / DEVAM ETTİR */
document.addEventListener('click', (e) => {
  if (e.button !== undefined && e.button !== 0) return;
  if (!isExerciseRunning) return;
  const arenaBody = e.target.closest('.arena-body');
  if (!arenaBody) return;
  if (e.target.closest('#exStartBtn, button, input, label, select, a, .schulte-cell')) return;

  isExercisePaused = !isExercisePaused;
  updatePauseBadgeUI();
  playTick(isExercisePaused ? 440 : 720, 0.035);
});

function hideStartButtonOnRun() {
  isExercisePaused = false;
  updatePauseBadgeUI();
  autoHideSidebarsOnExerciseStart();
  const btn = document.getElementById('exStartBtn');
  if (btn) btn.style.display = 'none';
}

/* DURAKLATMA DESTEKLİ GERİ SAYIM SAYACI */
function startExerciseCountdown(durationSeconds, onTickRemain, onFinished) {
  if (activeCountdownInterval) { clearInterval(activeCountdownInterval); activeCountdownInterval = null; }
  let remainingMs = durationSeconds * 1000;
  let lastTickTime = performance.now();

  activeCountdownInterval = setInterval(() => {
    const now = performance.now();
    const delta = now - lastTickTime;
    lastTickTime = now;

    if (isExercisePaused) return;

    remainingMs -= delta;
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
    const el = document.getElementById('exTimer');
    if (el) el.textContent = `${remainingSec} sn`;
    if (onTickRemain) onTickRemain(remainingSec);

    if (remainingMs <= 0) {
      stopActiveTimers();
      if (onFinished) onFinished();
    }
  }, 100);
}

function buildManualControlsForExercise(exId, cfg) {
  const controls = [];
  if (exId === 'blok_okuma') {
    controls.push(`<div class="manual-ctrl-box"><label><span>Hedef Okuma Hızı</span> <span class="m-val">${cfg.wpm} WPM</span></label><input type="range" min="100" max="1200" step="20" value="${cfg.wpm}" onchange="updateManualParam('wpm', this.value)" oninput="this.previousElementSibling.querySelector('.m-val').textContent = this.value + ' WPM'" /></div>`);
  }
  if (['sarkac', 'sonsuzluk', 'zikzak', 'satir_sekme', 'kare', 'yuvarlak', 'kose', 'acilim', 'sutun'].includes(exId)) {
    controls.push(`<div class="manual-ctrl-box"><label><span>Göz Ritmi</span> <span class="m-val">${cfg.bpm} BPM</span></label><input type="range" min="45" max="180" step="5" value="${cfg.bpm}" onchange="updateManualParam('bpm', this.value)" oninput="this.previousElementSibling.querySelector('.m-val').textContent = this.value + ' BPM'" /></div>`);
  }
  if (exId === 'blok_okuma') {
    controls.push(`<div class="manual-ctrl-box"><label><span>Blok Büyüklüğü</span> <span class="m-val">${cfg.blockReadSize} Kelime</span></label><select onchange="updateManualParam('blockReadSize', this.value)"><option value="2" ${cfg.blockReadSize === 2 ? 'selected' : ''}>İkili Blok (2 Kelime)</option><option value="3" ${cfg.blockReadSize === 3 ? 'selected' : ''}>Üçlü Blok (3 Kelime)</option></select></div>`);
  }
  if (exId === 'schulte') {
    controls.push(`<div class="manual-ctrl-box"><label><span>Schulte</span> <span class="m-val">${cfg.schulteSize}x${cfg.schulteSize}</span></label><select onchange="updateManualParam('schulteSize', this.value)"><option value="3" ${cfg.schulteSize === 3 ? 'selected' : ''}>3x3</option><option value="4" ${cfg.schulteSize === 4 ? 'selected' : ''}>4x4</option><option value="5" ${cfg.schulteSize === 5 ? 'selected' : ''}>5x5</option><option value="6" ${cfg.schulteSize === 6 ? 'selected' : ''}>6x6</option></select></div>`);
  }
  if (exId === 'takistoskop') {
    const inv = 570 - cfg.tachiMs;
    controls.push(`<div class="manual-ctrl-box"><label><span>Takistoskop</span> <span class="m-val">${cfg.tachiMs} ms</span></label><input type="range" min="100" max="470" step="10" value="${inv}" onchange="updateManualParam('tachiMs', 570 - Number(this.value))" oninput="this.previousElementSibling.querySelector('.m-val').textContent = (570 - Number(this.value)) + ' ms'" /></div>`);
  }
  if (exId === 'anlam') {
    const invA = 1200 - cfg.anlamMs;
    controls.push(`<div class="manual-ctrl-box"><label><span>Görme Süresi</span> <span class="m-val">${cfg.anlamMs} ms</span></label><input type="range" min="180" max="1020" step="20" value="${invA}" onchange="updateManualParam('anlamMs', 1200 - Number(this.value))" oninput="this.previousElementSibling.querySelector('.m-val').textContent = (1200 - Number(this.value)) + ' ms'" /></div>`);
  }
  if (exId === 'sutun') {
    controls.push(`<div class="manual-ctrl-box"><label><span>Kelime Bloğu</span> <span class="m-val">${cfg.chunkSize} Kelime</span></label><select onchange="updateManualParam('chunkSize', this.value)"><option value="1" ${cfg.chunkSize === 1 ? 'selected' : ''}>1 Kelime</option><option value="2" ${cfg.chunkSize === 2 ? 'selected' : ''}>2 Kelime</option><option value="3" ${cfg.chunkSize === 3 ? 'selected' : ''}>3 Kelime</option><option value="4" ${cfg.chunkSize === 4 ? 'selected' : ''}>4 Kelime</option></select></div>`);
  }
  return `<div class="manual-controls-grid">${controls.join('')}</div>`;
}

function renderWorkspace(animatePageTurn = false) {
  stopActiveTimers();
  const ws = document.getElementById('mainWorkspace');
  if (!ws) return;
  if (!currentUser && !isGuestTestActive) { ws.innerHTML = ''; return; }

  renderRightExercisesSidebar();
  const cfg = getStageConfig(appState.currentStage);

  if (appState.currentStage === 0 || isGuestTestActive || (typeof isClassTestStage === 'function' && isClassTestStage(appState.currentStage))) {
    renderSpeedTestModule(ws, animatePageTurn);
    return;
  }

  if (animatePageTurn && appState.pageTurnSoundEnabled === true) {
    playPageTurnSound();
  }
  const shouldFlip = animatePageTurn && (appState.pageTurnEffectEnabled === true);

  if (appState.currentExerciseIdx >= STAGE_EXERCISES.length) {
    appState.currentExerciseIdx = 0;
  }
  const exObj = STAGE_EXERCISES[appState.currentExerciseIdx] || STAGE_EXERCISES[0];
  const bannerParamsHtml = cfg.isManual
    ? buildManualControlsForExercise(exObj.id, cfg)
    : `<div class="locked-params">
        <div class="param-lock-badge">🔒 ${cfg.wpm} WPM</div>
        <div class="param-lock-badge">🔒 ${cfg.bpm} BPM</div>
        <div class="param-lock-badge">🔒 ${cfg.blockReadSize}'li Blok</div>
        <div class="param-lock-badge">🔒 ${cfg.schulteSize}x${cfg.schulteSize}</div>
        <div class="param-lock-badge">🔒 Takistoskop: ${cfg.tachiMs} ms</div>
      </div>`;

  ws.innerHTML = `
    <div class="stage-banner ${appState.topBannerHidden ? 'banner-hidden' : ''}">
      <div class="stage-banner-info"><h2>${cfg.name}</h2><p>${cfg.subtitle}</p></div>
      ${bannerParamsHtml}
    </div>
    <div class="book-viewport">
      <div class="arena-card ${shouldFlip ? 'turning-page' : ''}" id="exerciseArenaContainer"></div>
    </div>
  `;
  applyTopBannerState();

  const arena = document.getElementById('exerciseArenaContainer');
  if (exObj.id === 'sarkac') renderSarkacExercise(arena, cfg);
  else if (exObj.id === 'sonsuzluk') renderSonsuzlukExercise(arena, cfg);
  else if (exObj.id === 'zikzak') renderZikzakExercise(arena, cfg);
  else if (exObj.id === 'satir_sekme') renderSatirSekmeExercise(arena, cfg);
  else if (exObj.id === 'kare') renderExpandingSquareExercise(arena, cfg);
  else if (exObj.id === 'yuvarlak') renderExpandingCircleExercise(arena, cfg);
  else if (exObj.id === 'kose') renderCornerJumpExercise(arena, cfg);
  else if (exObj.id === 'schulte') renderSchulteExercise(arena, cfg);
  else if (exObj.id === 'acilim') renderKelimeAcilimiExercise(arena, cfg);
  else if (exObj.id === 'takistoskop') renderTakistoskopExercise(arena, cfg);
  else if (exObj.id === 'sutun') renderBlokSutunExercise(arena, cfg);
  else if (exObj.id === 'anlam') renderAnlamAntrenmaniExercise(arena, cfg);
  else if (exObj.id === 'blok_okuma') renderBlokOkumaExercise(arena, cfg);

  const arenaBody = arena.querySelector('.arena-body');
  if (arenaBody && !arenaBody.querySelector('#arenaPauseBadge')) {
    const pauseBadge = document.createElement('div');
    pauseBadge.className = 'pause-badge-indicator';
    pauseBadge.id = 'arenaPauseBadge';
    pauseBadge.textContent = '⏸ Duraklatıldı (Devam için tıklayın)';
    arenaBody.prepend(pauseBadge);
  }

  const footer = document.createElement('div');
  footer.className = 'page-footer-num';
  footer.innerHTML = `<span class="footer-inst">${exObj.instruction}</span><span class="footer-pg">Sayfa ${appState.currentExerciseIdx + 1} / ${STAGE_EXERCISES.length}</span>`;
  arena.appendChild(footer);
}

/* 1. YATAY VE DİKEY SARKAÇ */
function renderSarkacExercise(arena, cfg) {
  let modeLabel = 'Standart Yatay & Dikey';
  if (cfg.sarkacMode === 'alternating') modeLabel = 'Dönüşümlü Karışık (Yatay ⇄ Dikey)';
  else if (cfg.sarkacMode === 'random') modeLabel = 'İleri Seviye Rastgele Karışık';

  arena.innerHTML = `
    <div class="arena-header">
      <h3>↔️ 1. Yatay ve Dikey Sarkaç (${cfg.bpm} BPM)</h3>
      <span class="stat-pill" style="font-size:0.74rem;">Mod: <span class="val">${modeLabel}</span></span>
    </div>
    <div class="arena-body">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startSarkac(${cfg.bpm}, ${cfg.stage}, '${cfg.sarkacMode}')">Başla</button>
      <div id="sarkacDot" style="width:28px; height:28px; border-radius:50%; background:var(--accent); box-shadow:0 0 18px var(--accent); position:absolute; left:6%; top:50%; transform:translate(-50%,-50%); transition:left 0.08s ease, top 0.08s ease;"></div>
      <div class="bottom-center-timer">Kalan Süre: <span class="val" id="exTimer">30 sn</span></div>
    </div>
  `;
}

function startSarkac(bpm, stageNum, sarkacMode = 'standard') {
  if (isExerciseRunning) return;
  stopActiveTimers(); isExerciseRunning = true; hideStartButtonOnRun();
  const dot = document.getElementById('sarkacDot');
  let step = 0, currentRemaining = 30, lastRandIdx = -1;

  const alternatingTargets = [
    { left: '6%', top: '50%' },
    { left: '50%', top: '10%' },
    { left: '94%', top: '50%' },
    { left: '50%', top: '86%' },
    { left: '94%', top: '50%' },
    { left: '50%', top: '10%' },
    { left: '6%', top: '50%' },
    { left: '50%', top: '86%' }
  ];

  const randomMixTargets = [
    { left: '6%', top: '50%' },
    { left: '94%', top: '50%' },
    { left: '50%', top: '10%' },
    { left: '50%', top: '86%' },
    { left: '14%', top: '16%' },
    { left: '86%', top: '82%' },
    { left: '86%', top: '16%' },
    { left: '14%', top: '82%' }
  ];

  startExerciseCountdown(30, (rem) => { currentRemaining = rem; }, () => {
    markExerciseComplete(stageNum, 0, `${bpm} BPM (${sarkacMode})`);
    goNextExercise();
  });

  activeInterval = setInterval(() => {
    if (!dot) { stopActiveTimers(); return; }
    if (isExercisePaused) return;
    playTick(step % 2 === 0 ? 700 : 520, 0.04);

    if (sarkacMode === 'standard') {
      if (currentRemaining > 15) {
        dot.style.top = '50%';
        dot.style.left = (step % 2 === 0) ? '6%' : '94%';
      } else {
        dot.style.left = '50%';
        dot.style.top = (step % 2 === 0) ? '10%' : '86%';
      }
    } else if (sarkacMode === 'alternating') {
      const pt = alternatingTargets[step % alternatingTargets.length];
      dot.style.left = pt.left;
      dot.style.top = pt.top;
    } else {
      let rIdx = Math.floor(Math.random() * randomMixTargets.length);
      if (rIdx === lastRandIdx) rIdx = (rIdx + 1) % randomMixTargets.length;
      lastRandIdx = rIdx;
      const pt = randomMixTargets[rIdx];
      dot.style.left = pt.left;
      dot.style.top = pt.top;
    }
    step++;
  }, Math.round(60000 / bpm));
}

/* 2. SONSUZLUK */
function renderSonsuzlukExercise(arena, cfg) {
  arena.innerHTML = `
    <div class="arena-header"><h3>♾️ 2. Sonsuzluk (∞) Göz Takibi (${cfg.bpm} BPM)</h3></div>
    <div class="arena-body">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startSonsuzluk(${cfg.bpm}, ${cfg.stage})">Başla</button>
      <canvas id="infCanvas" width="960" height="420" style="width:100%; max-height:100%; height:auto;"></canvas>
      <div class="bottom-center-timer">Kalan Süre: <span class="val" id="exTimer">30 sn</span></div>
    </div>
  `;
  drawInfinityStatic();
}
function drawInfinityStatic() {
  const cvs = document.getElementById('infCanvas'); if (!cvs) return;
  const ctx = cvs.getContext('2d'); ctx.clearRect(0, 0, cvs.width, cvs.height);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.32)'; ctx.lineWidth = 3; ctx.beginPath();
  const cx = cvs.width / 2, cy = cvs.height / 2, a = 390;
  for (let t = 0; t <= Math.PI * 2; t += 0.03) {
    const denom = 1 + Math.sin(t) * Math.sin(t);
    const x = cx + (a * Math.cos(t)) / denom;
    const y = cy + (a * Math.sin(t) * Math.cos(t)) / denom;
    if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
function startSonsuzluk(bpm, stageNum) {
  if (isExerciseRunning) return;
  stopActiveTimers(); isExerciseRunning = true; hideStartButtonOnRun();
  const cvs = document.getElementById('infCanvas'), ctx = cvs.getContext('2d');
  let lastTime = performance.now(), t = 0;
  const radPerSec = (bpm / 60) * 1.9;
  startExerciseCountdown(30, null, () => { markExerciseComplete(stageNum, 1, `${bpm} BPM`); goNextExercise(); });
  function animate(now) {
    if (!document.getElementById('infCanvas') || !isExerciseRunning) return;
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    if (!isExercisePaused) {
      t += radPerSec * dt;
      drawInfinityStatic();
      const cx = cvs.width / 2, cy = cvs.height / 2, a = 390, denom = 1 + Math.sin(t) * Math.sin(t);
      ctx.fillStyle = '#06b6d4'; ctx.beginPath();
      ctx.arc(cx + (a * Math.cos(t)) / denom, cy + (a * Math.sin(t) * Math.cos(t)) / denom, 13, 0, Math.PI * 2);
      ctx.fill();
    }
    activeAnimFrame = requestAnimationFrame(animate);
  }
  activeAnimFrame = requestAnimationFrame(animate);
}

/* 3. ZİKZAK */
function renderZikzakExercise(arena, cfg) {
  arena.innerHTML = `
    <div class="arena-header"><h3>⚡ 3. Zikzak (Z) Satır Dönüşü (${cfg.bpm} BPM)</h3></div>
    <div class="arena-body">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startZikzak(${cfg.bpm}, ${cfg.stage})">Başla</button>
      <div id="zikzakGrid" style="width:94%; height:100%; min-height:280px; position:relative;"></div>
      <div class="bottom-center-timer">Kalan Süre: <span class="val" id="exTimer">25 sn</span></div>
    </div>
  `;
}
function startZikzak(bpm, stageNum) {
  if (isExerciseRunning) return;
  stopActiveTimers(); isExerciseRunning = true; hideStartButtonOnRun();
  const grid = document.getElementById('zikzakGrid');
  const points = [
    { x: '6%', y: '12%' }, { x: '94%', y: '12%' },
    { x: '6%', y: '37%' }, { x: '94%', y: '37%' },
    { x: '6%', y: '62%' }, { x: '94%', y: '62%' },
    { x: '6%', y: '86%' }, { x: '94%', y: '86%' }
  ];
  let idx = 0;
  startExerciseCountdown(25, null, () => { markExerciseComplete(stageNum, 2, `${bpm} BPM`); goNextExercise(); });
  activeInterval = setInterval(() => {
    if (!grid) { stopActiveTimers(); return; }
    if (isExercisePaused) return;
    const pt = points[idx % points.length];
    playTick(640, 0.04);
    grid.innerHTML = `<div style="width:26px;height:26px;border-radius:50%;background:var(--success);box-shadow:0 0 15px var(--success);position:absolute;left:${pt.x};top:${pt.y};transform:translate(-50%,-50%);"></div>`;
    idx++;
  }, Math.round(60000 / bpm));
}

/* 4. SATIR BAŞI-SONU SEKME ANTRENMANI */
function renderSatirSekmeExercise(arena, cfg) {
  const txtObj = getUniqueReadingText();
  const allWords = txtObj.content.trim().split(/\s+/).filter(Boolean);

  arena.innerHTML = `
    <div class="arena-header">
      <h3>⏭️ 4. Metnin Satır Başı ve Satır Sonuna Sekme (${cfg.bpm} BPM)</h3>
      <span class="stat-pill" style="font-size:0.74rem;">Metin: <span class="val">${txtObj.title}</span> • Ritim: <span class="val">${cfg.bpm} BPM</span></span>
    </div>
    <div class="arena-body" style="align-items:stretch;">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startSatirSekme(${cfg.bpm}, ${cfg.stage})">Başla</button>
      <div class="guided-text-area line-jump-plain-box" id="lineJumpBox">
        ${allWords.map((w, idx) => `<span class="lj-plain-word" id="ljpw_${idx}">${w}</span>`).join(' ')}
      </div>
      <div class="bottom-center-timer">Kalan Süre: <span class="val" id="exTimer">25 sn</span></div>
    </div>
  `;
}

function computeVisualLineTargets() {
  const wordSpans = Array.from(document.querySelectorAll('#lineJumpBox .lj-plain-word'));
  if (wordSpans.length === 0) return [];

  const lines = [];
  let currentLine = [];
  let currentTop = null;

  wordSpans.forEach((sp) => {
    const top = sp.offsetTop;
    if (currentTop === null || Math.abs(top - currentTop) <= 6) {
      currentLine.push(sp);
      if (currentTop === null) currentTop = top;
    } else {
      if (currentLine.length > 0) lines.push(currentLine);
      currentLine = [sp];
      currentTop = top;
    }
  });
  if (currentLine.length > 0) lines.push(currentLine);

  const targets = [];
  lines.forEach((ln) => {
    if (ln.length >= 2) {
      targets.push({ el: ln[0], isStart: true });
      targets.push({ el: ln[ln.length - 1], isStart: false });
    } else if (ln.length === 1) {
      targets.push({ el: ln[0], isStart: true });
    }
  });
  return targets;
}

function startSatirSekme(bpm, stageNum) {
  if (isExerciseRunning) return;
  stopActiveTimers();
  isExerciseRunning = true;
  hideStartButtonOnRun();

  let step = 0;
  let targets = [];
  let lastBoxWidth = 0;
  let lastBoxHeight = 0;

  const highlightCurrentStep = () => {
    const box = document.getElementById('lineJumpBox');
    if (!box) { stopActiveTimers(); return; }
    if (isExercisePaused) return;

    if (
      !targets ||
      targets.length === 0 ||
      box.clientWidth !== lastBoxWidth ||
      box.clientHeight !== lastBoxHeight
    ) {
      lastBoxWidth = box.clientWidth;
      lastBoxHeight = box.clientHeight;
      targets = computeVisualLineTargets();
      if (targets.length === 0) return;
    }

    document.querySelectorAll('.lj-plain-word.active-jump').forEach(el => el.classList.remove('active-jump'));

    const targetObj = targets[step % targets.length];
    if (targetObj && targetObj.el) {
      targetObj.el.classList.add('active-jump');
      targetObj.el.scrollIntoView({ block: 'nearest' });
      playTick(targetObj.isStart ? 620 : 780, 0.04);
    }
    step++;
  };

  startExerciseCountdown(25, null, () => {
    markExerciseComplete(stageNum, 3, `${bpm} BPM Satır Sekme`);
    goNextExercise();
  });

  satirSekmeStartTimeout = setTimeout(() => {
    if (!isExerciseRunning) return;
    const box = document.getElementById('lineJumpBox');
    if (box) {
      lastBoxWidth = box.clientWidth;
      lastBoxHeight = box.clientHeight;
    }
    targets = computeVisualLineTargets();
    highlightCurrentStep();
    activeInterval = setInterval(highlightCurrentStep, Math.round(60000 / bpm));
  }, 360);
}

/* 5. GENİŞLEYEN KARE */
function renderExpandingSquareExercise(arena, cfg) {
  const firstWords = getUniqueExpandingSquareWords();
  arena.innerHTML = `
    <div class="arena-header"><h3>⬜ 5. Genişleyen Kare (${cfg.bpm} BPM)</h3></div>
    <div class="arena-body">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startExpandingSquare(${cfg.bpm}, ${cfg.stage})">Başla</button>
      <canvas id="expSquareCanvas" width="980" height="440" style="width:100%; max-height:100%; height:auto;"></canvas>
      <div class="bottom-center-timer">Kalan Süre: <span class="val" id="exTimer">25 sn</span></div>
    </div>
  `;
  drawExpandingSquareFrame(0, firstWords);
}

function drawCanvasWordPill(ctx, text, x, y, bgColor, textColor) {
  const str = String(text || '');
  ctx.font = 'bold 20px "Inter", sans-serif';
  const metrics = ctx.measureText(str);
  const padX = 10;
  const w = metrics.width + padX * 2;
  const h = 28;
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
  else ctx.rect(x - w / 2, y - h / 2, w, h);
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawExpandingSquareFrame(stepIndex, words4) {
  const cvs = document.getElementById('expSquareCanvas'); if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const W = cvs.width, H = cvs.height, cx = W / 2, cy = H / 2;
  ctx.clearRect(0, 0, W, H);

  const levels = [38, 68, 98, 128, 158, 186];
  levels.forEach((halfH, idx) => {
    const halfW = Math.round(halfH * 2.22);
    const isActive = idx === stepIndex;
    ctx.strokeStyle = isActive ? '#0284c7' : 'rgba(148, 163, 184, 0.24)';
    ctx.lineWidth = isActive ? 3.5 : 1.2;
    ctx.strokeRect(cx - halfW, cy - halfH, halfW * 2, halfH * 2);

    if (isActive && words4 && words4.length >= 4) {
      drawCanvasWordPill(ctx, words4[0], cx, Math.max(18, cy - halfH - 16), 'rgba(2, 132, 199, 0.16)', '#0284c7');
      drawCanvasWordPill(ctx, words4[1], cx, Math.min(H - 18, cy + halfH + 16), 'rgba(2, 132, 199, 0.16)', '#0284c7');
      drawCanvasWordPill(ctx, words4[2], Math.max(65, cx - halfW + 52), cy, 'rgba(2, 132, 199, 0.16)', '#0284c7');
      drawCanvasWordPill(ctx, words4[3], Math.min(W - 65, cx + halfW - 52), cy, 'rgba(2, 132, 199, 0.16)', '#0284c7');
    }
  });

  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
}

function startExpandingSquare(bpm, stageNum) {
  if (isExerciseRunning) return;
  stopActiveTimers(); isExerciseRunning = true; hideStartButtonOnRun();
  let step = 0;
  startExerciseCountdown(25, null, () => { markExerciseComplete(stageNum, 4, `${bpm} BPM`); goNextExercise(); });
  activeInterval = setInterval(() => {
    if (!document.getElementById('expSquareCanvas')) { stopActiveTimers(); return; }
    if (isExercisePaused) return;
    const words4 = getUniqueExpandingSquareWords();
    const lvl = step % 6;
    playTick(520 + lvl * 65, 0.04);
    drawExpandingSquareFrame(lvl, words4);
    step++;
  }, Math.round(60000 / bpm));
}

/* 6. GENİŞLEYEN YUVARLAK */
function renderExpandingCircleExercise(arena, cfg) {
  const firstWords = getUniqueExpandingCircleWords();
  arena.innerHTML = `
    <div class="arena-header"><h3>⭕ 6. Genişleyen Yuvarlak (${cfg.bpm} BPM)</h3></div>
    <div class="arena-body">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startExpandingCircle(${cfg.bpm}, ${cfg.stage})">Başla</button>
      <canvas id="expCircleCanvas" width="980" height="440" style="width:100%; max-height:100%; height:auto;"></canvas>
      <div class="bottom-center-timer">Kalan Süre: <span class="val" id="exTimer">25 sn</span></div>
    </div>
  `;
  drawExpandingCircleFrame(0, firstWords);
}

function drawExpandingCircleFrame(stepIndex, words4) {
  const cvs = document.getElementById('expCircleCanvas'); if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const W = cvs.width, H = cvs.height, cx = W / 2, cy = H / 2;
  ctx.clearRect(0, 0, W, H);

  const radiiY = [36, 66, 96, 126, 156, 184];
  radiiY.forEach((ry, idx) => {
    const rx = Math.round(ry * 2.18);
    const isActive = idx === stepIndex;
    ctx.strokeStyle = isActive ? '#10b981' : 'rgba(148, 163, 184, 0.24)';
    ctx.lineWidth = isActive ? 3.5 : 1.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (isActive && words4 && words4.length >= 4) {
      const dx = Math.round(rx * 0.707);
      const dy = Math.round(ry * 0.707);
      drawCanvasWordPill(ctx, words4[0], cx - dx, Math.max(18, cy - dy - 14), 'rgba(16, 185, 129, 0.16)', '#059669');
      drawCanvasWordPill(ctx, words4[1], cx + dx, Math.max(18, cy - dy - 14), 'rgba(16, 185, 129, 0.16)', '#059669');
      drawCanvasWordPill(ctx, words4[2], cx - dx, Math.min(H - 18, cy + dy + 14), 'rgba(16, 185, 129, 0.16)', '#059669');
      drawCanvasWordPill(ctx, words4[3], cx + dx, Math.min(H - 18, cy + dy + 14), 'rgba(16, 185, 129, 0.16)', '#059669');
    }
  });

  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
}

function startExpandingCircle(bpm, stageNum) {
  if (isExerciseRunning) return;
  stopActiveTimers(); isExerciseRunning = true; hideStartButtonOnRun();
  let step = 0;
  startExerciseCountdown(25, null, () => { markExerciseComplete(stageNum, 5, `${bpm} BPM`); goNextExercise(); });
  activeInterval = setInterval(() => {
    if (!document.getElementById('expCircleCanvas')) { stopActiveTimers(); return; }
    if (isExercisePaused) return;
    const words4 = getUniqueExpandingCircleWords();
    const lvl = step % 6;
    playTick(540 + lvl * 65, 0.04);
    drawExpandingCircleFrame(lvl, words4);
    step++;
  }, Math.round(60000 / bpm));
}

/* 7. ÇAPRAZ KÖŞE SIÇRAMASI */
function renderCornerJumpExercise(arena, cfg) {
  arena.innerHTML = `
    <div class="arena-header"><h3>✥ 7. Çapraz Köşe Sıçraması (${cfg.bpm} BPM)</h3></div>
    <div class="arena-body">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startCornerJump(${cfg.bpm}, ${cfg.stage})">Başla</button>
      <div id="cornerJumpStage" style="width:96%; height:100%; min-height:280px; position:relative;">
        <div class="schulte-center-dot"></div>
      </div>
      <div class="bottom-center-timer">Kalan Süre: <span class="val" id="exTimer">25 sn</span></div>
    </div>
  `;
}

function startCornerJump(bpm, stageNum) {
  if (isExerciseRunning) return;
  stopActiveTimers(); isExerciseRunning = true; hideStartButtonOnRun();
  const stage = document.getElementById('cornerJumpStage');
  const corners = [
    { x: '8%', y: '12%' },
    { x: '92%', y: '86%' },
    { x: '92%', y: '12%' },
    { x: '8%', y: '86%' }
  ];
  let idx = 0;
  startExerciseCountdown(25, null, () => { markExerciseComplete(stageNum, 6, `${bpm} BPM`); goNextExercise(); });
  activeInterval = setInterval(() => {
    if (!stage) { stopActiveTimers(); return; }
    if (isExercisePaused) return;
    const pt = corners[idx % corners.length];
    const word = getUniqueCornerWord();
    playTick(690, 0.04);
    stage.innerHTML = `
      <div class="schulte-center-dot"></div>
      <div style="position:absolute; left:${pt.x}; top:${pt.y}; transform:translate(-50%,-50%); background:var(--accent); color:#fff; padding:0.42rem 0.95rem; border-radius:999px; font-weight:800; font-size:1rem; box-shadow:0 4px 14px rgba(2,132,199,0.4);">
        ${word}
      </div>
    `;
    idx++;
  }, Math.round(60000 / bpm));
}

/* 8. SCHULTE TABLOSU */
let schulteTarget = 1;
let schulteElapsedMs = 0;
function renderSchulteExercise(arena, cfg) {
  const N = cfg.schulteSize, total = N * N;
  const nums = Array.from({ length: total }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
  schulteTarget = 1;
  schulteElapsedMs = 0;
  arena.innerHTML = `
    <div class="arena-header">
      <h3>🔢 8. Schulte Tablosu (${N}x${N})</h3>
      <button type="button" class="btn" onclick="renderWorkspace(false)">🔄 Yenile</button>
    </div>
    <div class="arena-body">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startSchulteExercise()">Başla</button>
      <div class="schulte-grid" id="schulteGridBox" style="grid-template-columns: repeat(${N}, 1fr); filter:blur(4px);">
        <div class="schulte-center-dot"></div>
        ${nums.map(n => `<div class="schulte-cell" onclick="handleSchulteClick(this, ${n}, ${total}, ${cfg.stage})">${n}</div>`).join('')}
      </div>
      <div class="bottom-center-timer">Sıradaki Sayı: <span class="val" id="schulteNextNum">1</span> / ${total} • Süre: <span class="val" id="schulteTimerTxt">0 sn</span></div>
    </div>
  `;
}
function startSchulteExercise() {
  if (isExerciseRunning) return;
  stopActiveTimers(); isExerciseRunning = true; hideStartButtonOnRun();
  const grid = document.getElementById('schulteGridBox');
  if (grid) grid.style.filter = 'none';
  schulteElapsedMs = 0;
  let lastTick = performance.now();
  activeInterval = setInterval(() => {
    const now = performance.now();
    const dt = now - lastTick;
    lastTick = now;
    if (isExercisePaused) return;
    schulteElapsedMs += dt;
    const sec = Math.floor(schulteElapsedMs / 1000);
    const el = document.getElementById('schulteTimerTxt');
    if (el) el.textContent = `${sec} sn`;
  }, 200);
}
function handleSchulteClick(cellEl, num, total, stageNum) {
  if (!isExerciseRunning || isExercisePaused) return;
  if (num === schulteTarget) {
    playTick(780, 0.04); cellEl.classList.add('correct-flash'); schulteTarget++;
    if (schulteTarget > total) {
      const finishedSec = Math.max(1, Math.round(schulteElapsedMs / 1000));
      stopActiveTimers();
      markExerciseComplete(stageNum, 7, `${Math.sqrt(total)}x${Math.sqrt(total)} Tablo (${finishedSec} sn)`);
      setTimeout(() => goNextExercise(), 380);
    } else document.getElementById('schulteNextNum').textContent = schulteTarget;
  } else playTick(240, 0.08);
}

/* 9. KELİME AÇILIMI */
function renderKelimeAcilimiExercise(arena, cfg) {
  const firstPair = getUniqueWordPair();
  arena.innerHTML = `
    <div class="arena-header"><h3>↔ 9. Merkez Odaklı Kelime Açılımı (${cfg.bpm} BPM)</h3></div>
    <div class="arena-body">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startKelimeAcilimi(${cfg.bpm}, ${cfg.stage})">Başla</button>
      <div style="display:flex; align-items:center; justify-content:center; width:100%; position:relative; height:140px;">
        <span id="leftExpandWord" style="font-size:1.45rem; font-weight:800; position:absolute; right:56%;">${firstPair[0]}</span>
        <div style="width:11px; height:11px; border-radius:50%; background:var(--danger); box-shadow:0 0 8px var(--danger);"></div>
        <span id="rightExpandWord" style="font-size:1.45rem; font-weight:800; position:absolute; left:56%;">${firstPair[1]}</span>
      </div>
      <div class="bottom-center-timer">Kalan Süre: <span class="val" id="exTimer">25 sn</span></div>
    </div>
  `;
}
function startKelimeAcilimi(bpm, stageNum) {
  if (isExerciseRunning) return;
  stopActiveTimers(); isExerciseRunning = true; hideStartButtonOnRun();
  let step = 0;
  startExerciseCountdown(25, null, () => { markExerciseComplete(stageNum, 8, `${bpm} BPM`); goNextExercise(); });
  activeInterval = setInterval(() => {
    const lEl = document.getElementById('leftExpandWord'), rEl = document.getElementById('rightExpandWord');
    if (!lEl || !rEl) { stopActiveTimers(); return; }
    if (isExercisePaused) return;
    playTick(620, 0.04);
    const pair = getUniqueWordPair();
    const gap = 55 + (step % 7) * 5;
    lEl.style.right = `${gap}%`; rEl.style.left = `${gap}%`;
    lEl.textContent = pair[0]; rEl.textContent = pair[1];
    step++;
  }, Math.round(60000 / bpm));
}

/* 10. TAKİSTOSKOP */
let tachiCurrentTarget = "", tachiRound = 0, tachiCorrectCount = 0, tachiWrongCount = 0, tachiLockInput = false;
const TACHI_TOTAL_ROUNDS = 8;

function renderTakistoskopExercise(arena, cfg) {
  tachiRound = 0; tachiCorrectCount = 0; tachiWrongCount = 0; tachiCurrentTarget = "";
  arena.innerHTML = `
    <div class="arena-header">
      <h3>⏱️ 10. Takistoskop (${cfg.tachiMs} ms)</h3>
      <div style="display:flex; gap:0.45rem; font-size:0.78rem; font-weight:800;">
        <span style="color:var(--success);">✓ Doğru: <span id="tachiCorrectNum">0</span></span><span>|</span><span style="color:var(--danger);">✗ Yanlış: <span id="tachiWrongNum">0</span></span>
      </div>
    </div>
    <div class="arena-body" style="justify-content:center;">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startTachiAutoSequence(${cfg.tachiMs}, ${cfg.wordPoolLevel}, ${cfg.stage})">Başla</button>
      <div class="arena-center-stack">
        <div class="tachi-flash-box" id="tachiFlashBox">Başla'ya basın</div>
        <div style="width:100%; display:flex; flex-direction:column; align-items:center; gap:0.4rem;">
          <div style="display:flex; gap:0.4rem; width:100%; max-width:460px; justify-content:center;">
            <input type="text" id="tachiAutoInput" class="tachi-input" style="flex:1;" placeholder="Gördüğünüz ifadeyi yazın (veya Enter)" autocomplete="off" oninput="onTachiInputChanged(${cfg.tachiMs}, ${cfg.wordPoolLevel}, ${cfg.stage})" onkeydown="onTachiKeyDown(event, ${cfg.tachiMs}, ${cfg.wordPoolLevel}, ${cfg.stage})" disabled />
            <button type="button" class="btn btn-primary" id="tachiSubmitBtn" onclick="evaluateAndAdvanceTachi(${cfg.tachiMs}, ${cfg.wordPoolLevel}, ${cfg.stage}, true)" disabled title="Onayla / Sonraki Kelime">↵</button>
          </div>
          <div class="tachi-results-log" id="tachiResultsLog"></div>
        </div>
      </div>
      <div class="bottom-center-timer">Kalan Tur: <span class="val" id="tachiProgressTxt">0 / ${TACHI_TOTAL_ROUNDS}</span></div>
    </div>
  `;
}
function startTachiAutoSequence(ms, level, stageNum) {
  if (isExerciseRunning) return;
  stopActiveTimers(); isExerciseRunning = true; hideStartButtonOnRun();
  const inp = document.getElementById('tachiAutoInput');
  const subBtn = document.getElementById('tachiSubmitBtn');
  if (inp) { inp.disabled = false; inp.value = ''; inp.focus(); }
  if (subBtn) subBtn.disabled = false;
  tachiRound = 0; tachiCorrectCount = 0; tachiWrongCount = 0;
  flashNextTachiWord(ms, level, stageNum);
}
function flashNextTachiWord(ms, level, stageNum) {
  if (!isExerciseRunning) return;
  if (isExercisePaused) {
    tachiAdvanceTimeout = setTimeout(() => flashNextTachiWord(ms, level, stageNum), 200);
    return;
  }
  const box = document.getElementById('tachiFlashBox'), inp = document.getElementById('tachiAutoInput');
  if (!box || !inp) return;
  tachiCurrentTarget = getUniqueTachiWord(level).replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  tachiLockInput = false;
  inp.value = '';
  inp.style.borderColor = 'var(--accent)';
  inp.focus();
  box.textContent = tachiCurrentTarget; playTick(820, 0.035);
  tachiFlashTimeout = setTimeout(() => { if (document.getElementById('tachiFlashBox') && isExerciseRunning) { box.textContent = "•••"; inp.focus(); } }, ms);
}
function evaluateAndAdvanceTachi(ms, level, stageNum, immediateByEnter = false) {
  if (!isExerciseRunning || tachiLockInput || !tachiCurrentTarget) return;
  tachiLockInput = true;
  const inp = document.getElementById('tachiAutoInput');
  const val = (inp ? inp.value : '').replace(/\s+/g, ' ').trim();
  const isCorrect = (val.toLocaleLowerCase('tr-TR') === tachiCurrentTarget.toLocaleLowerCase('tr-TR'));
  if (inp) inp.style.borderColor = isCorrect ? 'var(--success)' : 'var(--danger)';
  tachiRound++;
  if (isCorrect) { tachiCorrectCount++; playTick(920, 0.05); } else { tachiWrongCount++; playTick(280, 0.08); }
  document.getElementById('tachiCorrectNum').textContent = tachiCorrectCount;
  document.getElementById('tachiWrongNum').textContent = tachiWrongCount;
  document.getElementById('tachiProgressTxt').textContent = `${tachiRound} / ${TACHI_TOTAL_ROUNDS}`;
  const logBox = document.getElementById('tachiResultsLog');
  if (logBox) {
    const itemDiv = document.createElement('div'); itemDiv.className = 'tachi-log-item';
    itemDiv.innerHTML = isCorrect ? `<span style="color:var(--success); font-weight:700;">✓ Doğru: ${tachiCurrentTarget}</span>` : `<span style="color:var(--danger); font-weight:700;">✗ Yanlış: ${tachiCurrentTarget} (${val || 'Boş'})</span>`;
    logBox.prepend(itemDiv);
  }
  if (tachiRound >= TACHI_TOTAL_ROUNDS) {
    stopActiveTimers(); markExerciseComplete(stageNum, 9, `${tachiCorrectCount} Doğru / ${tachiWrongCount} Yanlış`);
    tachiAdvanceTimeout = setTimeout(() => goNextExercise(), 800);
  } else tachiAdvanceTimeout = setTimeout(() => flashNextTachiWord(ms, level, stageNum), immediateByEnter ? 260 : 450);
}
function onTachiInputChanged(ms, level, stageNum) {
  if (!isExerciseRunning || tachiLockInput || !tachiCurrentTarget) return;
  const inp = document.getElementById('tachiAutoInput');
  const val = (inp ? inp.value : '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr-TR');
  const target = tachiCurrentTarget.toLocaleLowerCase('tr-TR');
  if (val === target) {
    evaluateAndAdvanceTachi(ms, level, stageNum, false);
  } else if (inp) {
    inp.style.borderColor = target.startsWith(val) ? 'var(--accent)' : 'var(--warning)';
  }
}
function onTachiKeyDown(event, ms, level, stageNum) {
  if (event.key === 'Enter') {
    event.preventDefault();
    evaluateAndAdvanceTachi(ms, level, stageNum, true);
  }
}

/* 11. BLOK SÜTUNLAR */
function renderBlokSutunExercise(arena, cfg) {
  const chunks = getUniqueColumnChunks(cfg.chunkSize, 18);
  arena.innerHTML = `
    <div class="arena-header"><h3>🏛️ 11. Blok Sütun Sıçramaları (${cfg.bpm} BPM)</h3></div>
    <div class="arena-body">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startBlokSutun(${cfg.bpm}, ${cfg.stage})">Başla</button>
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0.55rem; width:100%;" id="sutunGridContainer">
        ${chunks.map((c, idx) => `<div class="sutun-cell" id="sutunCell_${idx}" style="padding:0.52rem; font-size:0.9rem; background:var(--bg-card); border:1px solid var(--border); border-radius:8px; text-align:center; font-weight:600;">${c}</div>`).join('')}
      </div>
      <div class="bottom-center-timer">Kalan Süre: <span class="val" id="exTimer">25 sn</span></div>
    </div>
  `;
}
function startBlokSutun(bpm, stageNum) {
  if (isExerciseRunning) return;
  stopActiveTimers(); isExerciseRunning = true; hideStartButtonOnRun();
  let idx = 0;
  startExerciseCountdown(25, null, () => { markExerciseComplete(stageNum, 10, `${bpm} BPM`); goNextExercise(); });
  activeInterval = setInterval(() => {
    const all = document.querySelectorAll('.sutun-cell');
    if (all.length === 0) { stopActiveTimers(); return; }
    if (isExercisePaused) return;
    all.forEach(el => { el.style.background = 'var(--bg-card)'; el.style.color = 'var(--text-primary)'; });
    const activeEl = document.getElementById(`sutunCell_${idx % all.length}`);
    if (activeEl) { activeEl.style.background = 'var(--accent)'; activeEl.style.color = '#fff'; }
    playTick(680, 0.035); idx++;
  }, Math.round(60000 / bpm));
}

/* 12. ANLAM ANTRENMANI */
let currentMeaningItem = null, meaningRound = 0, meaningCorrectCount = 0, meaningLockAnswer = false;
const MEANING_TOTAL_ROUNDS = 10;

function renderAnlamAntrenmaniExercise(arena, cfg) {
  meaningRound = 0; meaningCorrectCount = 0; currentMeaningItem = null; meaningLockAnswer = false;
  arena.innerHTML = `
    <div class="arena-header">
      <h3>🧠 12. Anlam Antrenmanı — Görme Hızı (${cfg.anlamMs} ms)</h3>
      <span class="stat-pill" style="font-size:0.74rem;">Görünme Süresi: <span class="val">${cfg.anlamMs} ms</span></span>
    </div>
    <div class="arena-body" style="justify-content:center;">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startMeaningExercise(${cfg.anlamMs}, ${cfg.stage})">Başla</button>
      <div class="arena-center-stack">
        <div class="tachi-flash-box" id="meaningWordsBox">Başla'ya basın</div>
        <div style="width:100%; display:flex; flex-direction:column; align-items:center;">
          <div style="display:flex; gap:0.85rem; width:100%; max-width:440px; justify-content:center;">
            <button type="button" class="btn btn-success" id="btnIsMeaningful" style="flex:1; justify-content:center; padding:0.8rem; font-size:0.95rem;" onclick="answerMeaningTraining(true, ${cfg.anlamMs}, ${cfg.stage})" disabled>✅ Anlamlı</button>
            <button type="button" class="btn btn-danger" id="btnNotMeaningful" style="flex:1; justify-content:center; padding:0.8rem; font-size:0.95rem;" onclick="answerMeaningTraining(false, ${cfg.anlamMs}, ${cfg.stage})" disabled>❌ Anlamsız</button>
          </div>
          <p id="meaningFeedbackTxt" style="margin-top:0.5rem; font-size:0.84rem; font-weight:700; min-height:22px; text-align:center;"></p>
        </div>
      </div>
      <div class="bottom-center-timer">Kalan Tur: <span class="val" id="meaningRoundTxt">0 / ${MEANING_TOTAL_ROUNDS}</span></div>
    </div>
  `;
}
function startMeaningExercise(anlamMs, stageNum) {
  if (isExerciseRunning) return;
  stopActiveTimers(); isExerciseRunning = true; hideStartButtonOnRun();
  meaningRound = 0; meaningCorrectCount = 0;
  document.getElementById('btnIsMeaningful').disabled = false;
  document.getElementById('btnNotMeaningful').disabled = false;
  nextMeaningQuestion(anlamMs);
}
function nextMeaningQuestion(anlamMs) {
  if (!isExerciseRunning) return;
  if (isExercisePaused) {
    meaningAdvanceTimeout = setTimeout(() => nextMeaningQuestion(anlamMs), 200);
    return;
  }
  const box = document.getElementById('meaningWordsBox'); if (!box) return;
  currentMeaningItem = getUniqueMeaningItem();
  meaningLockAnswer = false;
  box.textContent = String(currentMeaningItem.words || '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  playTick(740, 0.04);
  meaningFlashTimeout = setTimeout(() => { if (document.getElementById('meaningWordsBox') && isExerciseRunning) box.textContent = "•••"; }, anlamMs);
}
function answerMeaningTraining(userSaysMeaningful, anlamMs, stageNum) {
  if (!isExerciseRunning || !currentMeaningItem || meaningLockAnswer) return;
  meaningLockAnswer = true;
  const isCorrect = (userSaysMeaningful === currentMeaningItem.isMeaningful);
  const fb = document.getElementById('meaningFeedbackTxt');
  meaningRound++;
  if (isCorrect) { meaningCorrectCount++; playTick(920, 0.05); if (fb) fb.innerHTML = `<span style="color:var(--success);">✓ Doğru! (${meaningCorrectCount}/${meaningRound})</span>`; }
  else { playTick(260, 0.08); if (fb) fb.innerHTML = `<span style="color:var(--danger);">✗ Yanlış! "${currentMeaningItem.words}"</span>`; }
  document.getElementById('meaningRoundTxt').textContent = `${meaningRound} / ${MEANING_TOTAL_ROUNDS}`;
  if (meaningRound >= MEANING_TOTAL_ROUNDS) {
    stopActiveTimers(); markExerciseComplete(stageNum, 11, `${meaningCorrectCount}/${MEANING_TOTAL_ROUNDS} Doğru`);
    meaningAdvanceTimeout = setTimeout(() => goNextExercise(), 600);
  } else meaningAdvanceTimeout = setTimeout(() => nextMeaningQuestion(anlamMs), 480);
}

/* 13. VURGULU İKİLİ VE ÜÇLÜ BLOK OKUMA ANTRENMANI */
function renderBlokOkumaExercise(arena, cfg) {
  const txtObj = getUniqueReadingText();
  const words = txtObj.content.trim().split(/\s+/).filter(Boolean);
  const blockSize = cfg.blockReadSize || (cfg.stage <= 15 ? 2 : 3);
  const blockLabel = blockSize === 2 ? 'İkili Bloklar (2 Kelime)' : 'Üçlü Bloklar (3 Kelime)';

  const blocks = [];
  for (let i = 0; i < words.length; i += blockSize) {
    blocks.push(words.slice(i, i + blockSize).join(' '));
  }

  const intervalMs = Math.max(60, Math.round((60000 / cfg.wpm) * blockSize));
  const totalSeconds = Math.max(3, Math.ceil((blocks.length * intervalMs) / 1000));

  arena.innerHTML = `
    <div class="arena-header">
      <h3>📑 13. Vurgulu Blok Okuma — ${blockLabel} (${cfg.wpm} WPM)</h3>
      <span class="stat-pill" style="font-size:0.74rem;">Metin: <span class="val">${txtObj.title}</span> • Blok: <span class="val">${blockLabel}</span></span>
    </div>
    <div class="arena-body" style="align-items:stretch;">
      <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startBlokOkuma(${cfg.wpm}, ${blockSize}, ${cfg.stage}, ${blocks.length})">Başla</button>
      <div class="rsvp-stage" id="blockFocusDisplay" style="border:2px solid var(--accent); color:var(--accent);">${blocks[0] || ''}</div>
      <div class="guided-text-area" id="blockTextContainer">
        ${blocks.map((bText, idx) => `<span class="block-word-group" id="bwg_${idx}">${bText}</span>`).join(' ')}
      </div>
      <div class="bottom-center-timer">Kalan Süre: <span class="val" id="exTimer">${totalSeconds} sn</span></div>
    </div>
  `;
}

function startBlokOkuma(wpm, blockSize, stageNum, totalBlocks) {
  if (isExerciseRunning) return;
  stopActiveTimers();
  isExerciseRunning = true;
  hideStartButtonOnRun();

  const allBlocks = document.querySelectorAll('.block-word-group');
  const focusBox = document.getElementById('blockFocusDisplay');
  let bIdx = 0;

  const intervalMs = Math.max(60, Math.round((60000 / wpm) * blockSize));

  const stepBlock = () => {
    if (!document.getElementById('blockFocusDisplay')) { stopActiveTimers(); return; }
    if (isExercisePaused) return;

    allBlocks.forEach(el => el.classList.remove('active-block-emphasis'));

    if (bIdx >= totalBlocks) {
      stopActiveTimers();
      const timerEl = document.getElementById('exTimer');
      if (timerEl) timerEl.textContent = '0 sn';
      markExerciseComplete(stageNum, 12, `${wpm} WPM (${blockSize}'li Blok)`);
      if (focusBox) focusBox.textContent = "🎉 Blok Okuma Tamamlandı!";
      setTimeout(() => goNextExercise(), 600);
      return;
    }

    const remainSec = Math.max(1, Math.ceil(((totalBlocks - bIdx) * intervalMs) / 1000));
    const timerEl = document.getElementById('exTimer');
    if (timerEl) timerEl.textContent = `${remainSec} sn`;

    const currentEl = document.getElementById(`bwg_${bIdx}`);
    if (currentEl) {
      currentEl.classList.add('active-block-emphasis');
      currentEl.scrollIntoView({ block: 'nearest' });
      if (focusBox) focusBox.textContent = currentEl.textContent;
      playTick(660, 0.03);
    }
    bIdx++;
  };

  stepBlock();
  activeInterval = setInterval(stepBlock, intervalMs);
}

function goNextExercise() {
  stopActiveTimers();
  if (appState.currentExerciseIdx < STAGE_EXERCISES.length - 1) {
    appState.currentExerciseIdx++; saveState(); renderWorkspace(true);
  } else {
    if (appState.currentStage === 32) { appState.currentExerciseIdx = 0; saveState(); renderWorkspace(true); }
    else completeStageAndAdvance(appState.currentStage);
  }
}

/* AŞAMA TAMAMLANDIĞINDA: SINIF SONU İSE (3, 9, 16, 27, 30) O SINIFIN BARAJ TESTİNE YÖNLENDİRİR */
function completeStageAndAdvance(stageNum) {
  stopActiveTimers(); openSidebarsDefault();
  for (let i = 0; i < STAGE_EXERCISES.length; i++) {
    if (!appState.stageExerciseDone[stageNum] || !appState.stageExerciseDone[stageNum].includes(i)) markExerciseComplete(stageNum, i);
  }

  const milestoneTier = (typeof getMilestoneClassificationForStage === 'function')
    ? getMilestoneClassificationForStage(stageNum)
    : null;

  if (milestoneTier) {
    appState.currentStage = 100 + milestoneTier.tierOrder;
    appState.currentExerciseIdx = 0;
    saveState();
    renderWorkspace(true);
    return;
  }

  if (stageNum >= 1 && stageNum < 30) {
    if (appState.unlockedStage <= stageNum) appState.unlockedStage = stageNum + 1;
    appState.currentStage = stageNum + 1;
    appState.currentExerciseIdx = 0;
    saveState();
    renderWorkspace(true);
  } else {
    appState.currentStage = 31;
    appState.currentExerciseIdx = 0;
    saveState();
    renderWorkspace(true);
  }
}

/*****************************************************************
 * MANUEL METİN EKLEME, DÜZENLEME VE YEREL .DB VERİTABANI MERKEZİ
 *****************************************************************/
function syncCustomTextsIntoPools() {
  if (typeof loadedTxtFiles === 'undefined' || !Array.isArray(loadedTxtFiles)) return;
  loadedTxtFiles = loadedTxtFiles.map((item, idx) =>
    typeof normalizeTextRecord === 'function' ? normalizeTextRecord(item, idx) : item
  );
  speedTestsPool = loadedTxtFiles;

  const badgeEl = document.getElementById('tmTotalCountBadge');
  if (badgeEl) badgeEl.textContent = String(loadedTxtFiles.length);
  const dropMeta = document.getElementById('dropdownTextMgrMeta');
  if (dropMeta) dropMeta.textContent = `Metin Havuzu: ${loadedTxtFiles.length} Metin`;
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => syncCustomTextsIntoPools(), 80);
});

function openTextManagerModal() {
  if (typeof isAdminUser === 'function' && !isAdminUser()) return;
  stopActiveTimers();
  document.getElementById('userDropdownMenu')?.classList.remove('open');
  syncCustomTextsIntoPools();
  resetTextManagerForm();
  renderCustomTextsTable();
  switchTextManagerTab('list');
  document.getElementById('textManagerModal')?.classList.add('open');
}

function closeTextManagerModal() {
  document.getElementById('textManagerModal')?.classList.remove('open');
}

function switchTextManagerTab(tab) {
  document.getElementById('tmTabAddBtn')?.classList.toggle('active', tab === 'add');
  document.getElementById('tmTabListBtn')?.classList.toggle('active', tab === 'list');

  const sAdd = document.getElementById('tmSectionAdd');
  const sList = document.getElementById('tmSectionList');

  if (sAdd) sAdd.style.display = tab === 'add' ? 'flex' : 'none';
  if (sList) {
    sList.style.display = tab === 'list' ? 'flex' : 'none';
    if (tab === 'list') renderCustomTextsTable();
  }
}

function updateTmWordCount() {
  const txt = (document.getElementById('tmNewContentInput')?.value || '').trim();
  const count = txt ? txt.split(/\s+/).filter(Boolean).length : 0;
  const el = document.getElementById('tmLiveWordCount');
  if (el) el.textContent = `${count} Kelime`;
}

function renderCustomQuestionsInputs() {
  const container = document.getElementById('tmCustomQuestionsContainer');
  if (!container || container.children.length > 0) return;
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `
      <div style="background:var(--bg-surface); border:1px solid var(--border); border-radius:8px; padding:0.55rem;">
        <div class="auth-field" style="margin-bottom:0.35rem;">
          <label>${i}. Soru Cümlesi</label>
          <input type="text" id="tmQ_${i}_text" placeholder="${i}. soruyu yazın..." />
        </div>
        <div class="auth-grid-2" style="margin-bottom:0.35rem;">
          <input type="text" id="tmQ_${i}_opt0" placeholder="A Şıkkı" />
          <input type="text" id="tmQ_${i}_opt1" placeholder="B Şıkkı" />
          <input type="text" id="tmQ_${i}_opt2" placeholder="C Şıkkı" />
          <input type="text" id="tmQ_${i}_opt3" placeholder="D Şıkkı" />
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.74rem;">
          <span style="font-weight:700; color:var(--text-secondary);">Doğru Şık:</span>
          <select id="tmQ_${i}_ans" style="padding:0.25rem 0.5rem;">
            <option value="0">A Şıkkı</option>
            <option value="1">B Şıkkı</option>
            <option value="2">C Şıkkı</option>
            <option value="3">D Şıkkı</option>
          </select>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function toggleTmCustomQuestionsBox(checked) {
  renderCustomQuestionsInputs();
  const box = document.getElementById('tmCustomQuestionsContainer');
  if (box) box.style.display = checked ? 'flex' : 'none';
}

function resetTextManagerForm() {
  renderCustomQuestionsInputs();
  const editIdEl = document.getElementById('tmEditingTextId');
  if (editIdEl) editIdEl.value = '';
  const banner = document.getElementById('tmEditModeBanner');
  if (banner) banner.style.display = 'none';
  const tabTitle = document.getElementById('tmFormTabTitle');
  if (tabTitle) tabTitle.textContent = 'Metin Ekle';
  const submitBtn = document.getElementById('tmSaveSubmitBtn');
  if (submitBtn) submitBtn.innerHTML = '💾 Metni Kaydet';

  const titleInp = document.getElementById('tmNewTitleInput');
  const contentInp = document.getElementById('tmNewContentInput');
  const tierSel = document.getElementById('tmNewTierSelect');
  const qChk = document.getElementById('tmCustomQuestionsToggle');
  if (titleInp) titleInp.value = '';
  if (contentInp) contentInp.value = '';
  if (tierSel) tierSel.value = 'all';
  if (qChk) qChk.checked = false;
  toggleTmCustomQuestionsBox(false);

  for (let i = 1; i <= 5; i++) {
    const qTxt = document.getElementById(`tmQ_${i}_text`);
    const o0 = document.getElementById(`tmQ_${i}_opt0`);
    const o1 = document.getElementById(`tmQ_${i}_opt1`);
    const o2 = document.getElementById(`tmQ_${i}_opt2`);
    const o3 = document.getElementById(`tmQ_${i}_opt3`);
    const ans = document.getElementById(`tmQ_${i}_ans`);
    if (qTxt) qTxt.value = '';
    if (o0) o0.value = '';
    if (o1) o1.value = '';
    if (o2) o2.value = '';
    if (o3) o3.value = '';
    if (ans) ans.value = '0';
  }
  updateTmWordCount();
  const fb = document.getElementById('tmFeedbackMsg');
  if (fb) fb.textContent = '';
}

function editTextItemInModal(textId) {
  if (typeof loadedTxtFiles === 'undefined') return;
  const found = loadedTxtFiles.find(item => item.id === textId || item.title === textId);
  if (!found) return;

  resetTextManagerForm();
  switchTextManagerTab('add');

  const editIdEl = document.getElementById('tmEditingTextId');
  if (editIdEl) editIdEl.value = found.id;

  const cleanTitle = typeof stripLegacyTxtPrefix === 'function'
    ? stripLegacyTxtPrefix(found.title)
    : found.title;

  const banner = document.getElementById('tmEditModeBanner');
  const bannerTxt = document.getElementById('tmEditModeBannerTxt');
  if (banner) banner.style.display = 'flex';
  if (bannerTxt) bannerTxt.textContent = `✏️ "${cleanTitle}" Metnini Düzenliyorsunuz`;

  const tabTitle = document.getElementById('tmFormTabTitle');
  if (tabTitle) tabTitle.textContent = 'Metni Düzenle';
  const submitBtn = document.getElementById('tmSaveSubmitBtn');
  if (submitBtn) submitBtn.innerHTML = '💾 Metni Kaydet';

  document.getElementById('tmNewTitleInput').value = cleanTitle;
  document.getElementById('tmNewContentInput').value = found.content || '';
  const tierSel = document.getElementById('tmNewTierSelect');
  if (tierSel) tierSel.value = found.tier || 'all';
  updateTmWordCount();

  if (Array.isArray(found.questions) && found.questions.length > 0) {
    const qChk = document.getElementById('tmCustomQuestionsToggle');
    if (qChk) qChk.checked = true;
    toggleTmCustomQuestionsBox(true);
    found.questions.slice(0, 5).forEach((qObj, idx) => {
      const i = idx + 1;
      const qTxt = document.getElementById(`tmQ_${i}_text`);
      const o0 = document.getElementById(`tmQ_${i}_opt0`);
      const o1 = document.getElementById(`tmQ_${i}_opt1`);
      const o2 = document.getElementById(`tmQ_${i}_opt2`);
      const o3 = document.getElementById(`tmQ_${i}_opt3`);
      const ans = document.getElementById(`tmQ_${i}_ans`);
      if (qTxt) qTxt.value = String(qObj.q || '').replace(/^\d+\.\s*/, '');
      if (o0 && qObj.options) o0.value = qObj.options[0] || '';
      if (o1 && qObj.options) o1.value = qObj.options[1] || '';
      if (o2 && qObj.options) o2.value = qObj.options[2] || '';
      if (o3 && qObj.options) o3.value = qObj.options[3] || '';
      if (ans) ans.value = String(qObj.answerIndex ?? 0);
    });
  }
}

async function saveCustomTextFromModal() {
  const editingId = (document.getElementById('tmEditingTextId')?.value || '').trim();
  const rawTitleInp = (document.getElementById('tmNewTitleInput')?.value || '').trim();
  const tierVal = document.getElementById('tmNewTierSelect')?.value || 'all';
  const contentRaw = (document.getElementById('tmNewContentInput')?.value || '').trim();
  const useCustomQ = document.getElementById('tmCustomQuestionsToggle')?.checked === true;
  const fb = document.getElementById('tmFeedbackMsg');

  if (!rawTitleInp) {
    if (fb) {
      fb.style.color = 'var(--danger)';
      fb.textContent = '✗ Lütfen metin için bir başlık girin.';
    }
    return;
  }

  const cleanTitle = typeof stripLegacyTxtPrefix === 'function'
    ? stripLegacyTxtPrefix(rawTitleInp, loadedTxtFiles.length + 1)
    : rawTitleInp;

  const cleanContent = typeof cleanInlineFootnotes === 'function'
    ? cleanInlineFootnotes(contentRaw)
    : contentRaw.replace(/\s+/g, ' ').trim();

  const words = cleanContent.split(/\s+/).filter(Boolean);
  if (words.length < 15) {
    if (fb) {
      fb.style.color = 'var(--danger)';
      fb.textContent = '✗ Lütfen en az 15 kelimeden oluşan bir okuma metni girin.';
    }
    return;
  }

  let questions = [];
  if (useCustomQ) {
    for (let i = 1; i <= 5; i++) {
      const qTxt = (document.getElementById(`tmQ_${i}_text`)?.value || '').trim();
      const o0 = (document.getElementById(`tmQ_${i}_opt0`)?.value || '').trim();
      const o1 = (document.getElementById(`tmQ_${i}_opt1`)?.value || '').trim();
      const o2 = (document.getElementById(`tmQ_${i}_opt2`)?.value || '').trim();
      const o3 = (document.getElementById(`tmQ_${i}_opt3`)?.value || '').trim();
      const ans = parseInt(document.getElementById(`tmQ_${i}_ans`)?.value || '0', 10);
      if (qTxt && o0 && o1 && o2 && o3) {
        questions.push({
          q: `${i}. ${qTxt.replace(/^\d+\.\s*/, '')}`,
          options: [o0, o1, o2, o3],
          answerIndex: ans
        });
      }
    }
  }

  if (questions.length < 5 && typeof buildQuestionsFromPassageContent === 'function') {
    questions = buildQuestionsFromPassageContent(cleanContent, loadedTxtFiles.length + 1);
  }

  if (editingId) {
    const idx = loadedTxtFiles.findIndex(item => item.id === editingId);
    if (idx !== -1) {
      loadedTxtFiles[idx] = {
        ...loadedTxtFiles[idx],
        title: cleanTitle,
        fileName: cleanTitle,
        tier: tierVal,
        content: cleanContent,
        questions,
        updatedAt: Date.now()
      };
    }
  } else {
    const newId = `metin_${Date.now()}`;
    loadedTxtFiles.push({
      id: newId,
      title: cleanTitle,
      fileName: cleanTitle,
      tier: tierVal,
      content: cleanContent,
      questions,
      updatedAt: Date.now()
    });
  }

  if (typeof persistTextsToLocalDatabase === 'function') {
    await persistTextsToLocalDatabase(loadedTxtFiles);
  }
  syncCustomTextsIntoPools();
  renderCustomTextsTable();

  const statusEl = document.getElementById('tmDbStatusText');
  if (statusEl) {
    statusEl.textContent = `● metinler_veritabani.db Güncellendi (${loadedTxtFiles.length} Metin)`;
  }

  resetTextManagerForm();
  if (fb) {
    fb.style.color = 'var(--success)';
    fb.textContent = editingId
      ? `✓ "${cleanTitle}" metni güncellendi ve yerel .db veritabanına kaydedildi!`
      : `✓ "${cleanTitle}" (${words.length} kelime) eklendi ve yerel .db veritabanına kaydedildi!`;
  }
}

function renderCustomTextsTable() {
  const tbody = document.getElementById('tmTextsTableBody');
  if (!tbody || typeof loadedTxtFiles === 'undefined') return;

  const filterVal = document.getElementById('tmListFilterTierSelect')?.value || 'all';
  const tierLabels = {
    ilkokul: 'İlkokul',
    ortaokul: 'Ortaokul',
    lise: 'Lise (LGS/YKS)',
    universite: 'Üniversite',
    yetiskin: 'Yetişkin',
    all: 'Genel'
  };

  const filteredList = filterVal === 'all'
    ? loadedTxtFiles
    : loadedTxtFiles.filter(item => String(item.tier || 'all').toLowerCase() === filterVal);

  tbody.innerHTML = filteredList.map((item, idx) => {
    const wCount = item.content ? item.content.trim().split(/\s+/).filter(Boolean).length : 0;
    const cleanTitle = typeof stripLegacyTxtPrefix === 'function'
      ? stripLegacyTxtPrefix(item.title || item.fileName || '', idx + 1)
      : (item.title || `${idx + 1}. Metin`);
    const safeId = item.id || `metin_${idx + 1}`;
    const tierBadge = tierLabels[String(item.tier || 'all').toLowerCase()] || item.tier || 'Genel';
    return `
      <tr>
        <td style="font-weight:800; color:var(--text-muted);">${idx + 1}</td>
        <td><strong>${cleanTitle}</strong></td>
        <td><span class="stage-status-badge">${tierBadge}</span></td>
        <td style="color:var(--accent); font-weight:700;">${wCount} Kelime</td>
        <td>
          <div style="display:flex; gap:0.35rem;">
            <button type="button" class="btn btn-primary" style="padding:0.22rem 0.58rem; font-size:0.72rem;" onclick="editTextItemInModal('${safeId}')">✏️ Düzenle</button>
            <button type="button" class="btn btn-danger" style="padding:0.22rem 0.55rem; font-size:0.72rem;" onclick="deleteCustomTextItem('${safeId}')">🗑️ Sil</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteCustomTextItem(textId) {
  if (loadedTxtFiles.length <= 1) {
    alert('Sistemde en az 1 okuma metni bulunmalıdır.');
    return;
  }
  const target = loadedTxtFiles.find(item => item.id === textId);
  if (!confirm(`"${target ? target.title : 'Seçili'}" metnini yerel veritabanından silmek istediğinize emin misiniz?`)) {
    return;
  }
  loadedTxtFiles = loadedTxtFiles.filter(item => item.id !== textId);
  if (typeof persistTextsToLocalDatabase === 'function') {
    await persistTextsToLocalDatabase(loadedTxtFiles);
  }
  syncCustomTextsIntoPools();
  renderCustomTextsTable();
}

/* YEREL .DB DOSYASINA KAYDETME VE .DB DOSYASINDAN YÜKLEME */
async function saveTextsToLocalDbFile() {
  const payload = typeof buildLocalDbPayload === 'function'
    ? buildLocalDbPayload(loadedTxtFiles)
    : { dbFormat: '2X_METINLER_SQLITE_JSON_DB_V2', dbFileName: 'metinler_veritabani.db', updatedAt: Date.now(), texts: loadedTxtFiles };

  const jsonStr = JSON.stringify(payload, null, 2);

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'metinler_veritabani.db',
        types: [{
          description: 'Yerel Metin Veritabanı (.db)',
          accept: { 'application/octet-stream': ['.db'] }
        }]
      });
      localDbFileHandle = handle;
      const writable = await handle.createWritable();
      await writable.write(jsonStr);
      await writable.close();
      const statusEl = document.getElementById('tmDbStatusText');
      if (statusEl) statusEl.textContent = `● metinler_veritabani.db Dosyaya Kaydedildi (${loadedTxtFiles.length} Metin)`;
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }

  const blob = new Blob([jsonStr], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'metinler_veritabani.db';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

async function loadTextsFromLocalDbFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    const rawText = await file.text();
    const parsed = JSON.parse(rawText);
    const list = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.texts) ? parsed.texts : null);
    if (!list || list.length === 0) throw new Error('Geçersiz veritabanı');

    if (typeof persistTextsToLocalDatabase === 'function') {
      await persistTextsToLocalDatabase(list);
    }
    syncCustomTextsIntoPools();
    renderCustomTextsTable();
    const statusEl = document.getElementById('tmDbStatusText');
    if (statusEl) statusEl.textContent = `● ${file.name} Yüklendi (${loadedTxtFiles.length} Metin Aktif)`;
    alert(`✓ ${file.name} veritabanından toplam ${loadedTxtFiles.length} metin başarıyla yüklendi!`);
  } catch (e) {
    alert('✗ Seçilen .db dosyası okunamadı. Lütfen geçerli bir metinler_veritabani.db dosyası seçin.');
  }
  event.target.value = '';
}

/* GELİŞİM RAPORU, GELİŞİM SIFIRLAMA VE SINIFLANDIRMA BAZLI TEKİL PDF SERTİFİKA MOTORU */
function openProgressModal() {
  stopActiveTimers(); document.getElementById('userDropdownMenu')?.classList.remove('open');
  const fullName = currentUser ? ([currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.email) : 'Öğrenci';
  document.getElementById('progressUserSubtitle').textContent = `${fullName} — Hızlı Okuma ve Anlama Gelişim Analizi`;
  const currWpm = appState.currentWpm || 120, currClass = getSpeedClassificationForWpm(currWpm);
  const activeCertCls = getActiveCertificateClassification();

  document.getElementById('pStatInitialWpm').textContent = `${appState.initialWpm || 120} WPM`;
  document.getElementById('pStatCurrentWpm').textContent = `${currWpm} WPM`;
  document.getElementById('pStatCurrentClass').textContent = currClass.name;
  document.getElementById('pStatStages').textContent = `${appState.completedStages.filter(s => s >= 1 && s <= 30).length} / 30`;

  const refEl = document.getElementById('speedClassificationsReference');
  if (refEl) {
    refEl.innerHTML = SPEED_CLASSIFICATIONS.map(c => {
      const isCurrentCert = activeCertCls && activeCertCls.id === c.id;
      return `
        <div class="class-pill-item ${c.id === currClass.id ? 'active-class' : ''}">
          <div style="font-weight:800; color:var(--accent); display:flex; justify-content:space-between; align-items:center; gap:0.25rem;">
            <span>${c.tierOrder}. ${c.name} (${c.rangeText})</span>
            ${isCurrentCert ? '<span style="color:var(--warning); font-size:0.68rem;">🏆 Aktif Sertifika</span>' : ''}
          </div>
          <div style="color:var(--text-secondary); margin-top:2px;">${c.desc} (Sertifika Aşaması: ${c.milestoneStage}. Aşama)</div>
        </div>
      `;
    }).join('');
  }
  drawProgressChart();
  const tbody = document.getElementById('progressHistoryTableBody');
  const history = Array.isArray(appState.progressHistory) ? appState.progressHistory : [];
  tbody.innerHTML = history.length === 0
    ? `<tr><td colspan="4" style="text-align:center; padding:1rem;">Kayıt bulunmuyor.</td></tr>`
    : history.map(item => `<tr><td>${item.date}</td><td><strong>${item.stageLabel}</strong></td><td>${item.exerciseTitle}</td><td style="color:var(--accent); font-weight:700;">${item.resultLabel}</td></tr>`).join('');
  document.getElementById('progressModal').classList.add('open');
}

function closeProgressModal() { document.getElementById('progressModal').classList.remove('open'); }

async function resetUserProgress() {
  if (!confirm('⚠️ Tüm aşama ilerlemelerinizi, WPM hız kaydınız ve antrenman geçmişiniz sıfırlanarak 1. Aşamaya (120 WPM) döndürülecektir. Onaylıyor musunuz?')) {
    return;
  }
  stopActiveTimers();
  appState.initialWpm = 120;
  appState.currentWpm = 120;
  appState.maxAchievedWpm = 120;
  appState.targetWpm = 240;
  appState.lastComprehensionPct = 0;
  appState.currentStage = 1;
  appState.unlockedStage = 1;
  appState.completedStages = [];
  appState.passedClassTests = [];
  appState.stageExerciseDone = {};
  appState.currentExerciseIdx = 0;
  appState.progressHistory = [];

  await saveState();
  openProgressModal();
  renderWorkspace(true);
}

function drawProgressChart() {
  const cvs = document.getElementById('progressChartCanvas'); if (!cvs) return;
  const ctx = cvs.getContext('2d'), W = cvs.width, H = cvs.height;
  ctx.clearRect(0, 0, W, H);
  const padL = 48, padR = 20, padT = 18, padB = 26, plotW = W - padL - padR, plotH = H - padT - padB;

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Inter", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  [120, 350, 650, 1000].forEach(wVal => {
    const y = padT + plotH - ((wVal - 120) / 880) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    ctx.fillText(`${wVal}`, padL - 6, y);
  });

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let s = 1; s <= 30; s++) {
    const cfg = getStageConfig(s);
    const x = padL + ((s - 1) / 29) * plotW;
    const y = padT + plotH - ((cfg.wpm - 120) / 880) * plotH;
    if (s === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const maxStage = Math.max(1, Math.min(30, appState.unlockedStage || 1));
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let s = 1; s <= maxStage; s++) {
    const cfg = getStageConfig(s);
    const x = padL + ((s - 1) / 29) * plotW;
    const y = padT + plotH - ((cfg.wpm - 120) / 880) * plotH;
    if (s === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const lastCfg = getStageConfig(maxStage);
  const lastX = padL + ((maxStage - 1) / 29) * plotW;
  const lastY = padT + plotH - ((lastCfg.wpm - 120) / 880) * plotH;
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(lastX, lastY, 5.5, 0, Math.PI * 2);
  ctx.fill();
}

function handleCertificateClick() {
  document.getElementById('userDropdownMenu')?.classList.remove('open');
  const activeCertCls = getActiveCertificateClassification();
  if (!activeCertCls) {
    alert('🎓 Başarı Sertifikası, ilk Okuma Hızı Sınıflandırması (3. Aşama ve Sınıf Tamamlama Testi) tamamlandığında açılır ve sonraki her sınıflandırma bittiğinde güncellenir.');
    return;
  }
  openCertificateModal();
}

function openCertificateModal() {
  stopActiveTimers();
  const activeCertCls = getActiveCertificateClassification() || SPEED_CLASSIFICATIONS[0];
  const modalTitle = document.getElementById('certModalMainTitle');
  const modalSub = document.getElementById('certModalSubtitle');

  if (modalTitle) {
    modalTitle.textContent = `🎓 Başarı Sertifikası — ${activeCertCls.name}`;
  }
  if (modalSub) {
    modalSub.textContent = `Tebrikler! ${activeCertCls.tierOrder}. Kademe Okuma Hızı Sınıflandırması (${activeCertCls.name} • ${activeCertCls.rangeText}) eğitimini başarıyla tamamladınız.`;
  }

  drawCertificateCanvas(document.getElementById('certCanvas'), false);
  document.getElementById('certificateModal').classList.add('open');
}

function closeCertificateModal() { document.getElementById('certificateModal').classList.remove('open'); }

function drawCertificateCanvas(targetCanvas, skipExternalImage = false) {
  const cvs = targetCanvas || document.getElementById('certCanvas'); if (!cvs) return;
  const ctx = cvs.getContext('2d'), W = cvs.width, H = cvs.height;

  const activeCertCls = getActiveCertificateClassification() || SPEED_CLASSIFICATIONS[0];

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0f172a'); grad.addColorStop(0.5, '#1e293b'); grad.addColorStop(1, '#0b0f19');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 8; ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5; ctx.strokeRect(44, 44, W - 88, H - 88);

  if (!skipExternalImage && certLogoImg && certLogoImg.complete && certLogoImg.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath(); ctx.arc(W / 2, 118, 44, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(W / 2 - 44, 74, 88, 88);
    ctx.drawImage(certLogoImg, W / 2 - 44, 74, 88, 88);
    ctx.restore();
  } else {
    ctx.save();
    ctx.beginPath(); ctx.arc(W / 2, 118, 42, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#f59e0b'; ctx.stroke();
    ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 28px "Inter", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('2X', W / 2, 118);
    ctx.restore();
  }

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 44px "Inter", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('BAŞARI SERTİFİKASI', W / 2, 222);

  ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 24px "Inter", sans-serif';
  ctx.fillText(`OKUMA HIZI SINIFLANDIRMASI: ${activeCertCls.name.toLocaleUpperCase('tr-TR')} (${activeCertCls.rangeText})`, W / 2, 268);

  const studentName = currentUser ? ([currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.email) : 'Değerli Katılımcı';
  ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 42px "Inter", sans-serif';
  ctx.fillText(studentName.toLocaleUpperCase('tr-TR'), W / 2, 348);

  const startWpm = appState.initialWpm || 120;
  const reachedWpm = Math.max(appState.maxAchievedWpm || 0, appState.currentWpm || 0, activeCertCls.milestoneWpm);

  ctx.fillStyle = '#e2e8f0'; ctx.font = '20px "Inter", sans-serif';
  ctx.fillText(`2X Hızlı Okuma ve Okülomotor Göz Kasları Eğitim Programı kapsamında`, W / 2, 415);
  ctx.fillText(`"${activeCertCls.name}" (${activeCertCls.rangeText}) kademesini (${activeCertCls.startStage}. – ${activeCertCls.milestoneStage}. Aşama) başarıyla tamamlayarak`, W / 2, 450);
  ctx.fillText(`okuma hızını ${startWpm} WPM seviyesinden ${reachedWpm} WPM seviyesine çıkarmıştır.`, W / 2, 485);

  const dateStr = new Date().toLocaleDateString('tr-TR');
  ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 18px "Inter", sans-serif';
  ctx.fillText(`Sınıflandırma: ${activeCertCls.name}   |   Sınır: ${activeCertCls.rangeText}   |   Ulaşılan Hız: ${reachedWpm} WPM   |   Tarih: ${dateStr}`, W / 2, 565);

  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px "Inter", sans-serif'; ctx.fillText('Serhat Nehir', W - 240, 680);
  ctx.fillStyle = '#06b6d4'; ctx.font = '16px "Inter", sans-serif'; ctx.fillText('Geliştirici — 2X Hızlı Okuma Eğitimi', W - 240, 708);
}

function getSafeCertificateJpegDataUrl() {
  const mainCvs = document.getElementById('certCanvas');
  drawCertificateCanvas(mainCvs, false);
  try {
    return mainCvs.toDataURL('image/jpeg', 0.95);
  } catch (e) {
    const offCvs = document.createElement('canvas');
    offCvs.width = 1123; offCvs.height = 794;
    drawCertificateCanvas(offCvs, true);
    return offCvs.toDataURL('image/jpeg', 0.95);
  }
}

function buildCertificatePDFBlob() {
  const jpegDataUrl = getSafeCertificateJpegDataUrl();
  const imgBytes = atob(jpegDataUrl.split(',')[1]);
  const imgLen = imgBytes.length;
  const pageW = 842, pageH = 595, imgW = 1123, imgH = 794;
  const chunks = [], offsets = [];
  let byteCount = 0;

  function pushStr(str) { chunks.push(str); byteCount += str.length; }
  function startObj(id) { offsets[id] = byteCount; pushStr(`${id} 0 obj\n`); }

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');
  startObj(1); pushStr('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  startObj(2); pushStr('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  startObj(3); pushStr(`<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im0 4 0 R >> >> /MediaBox [0 0 ${pageW} ${pageH}] /Contents 5 0 R >>\nendobj\n`);
  startObj(4); pushStr(`<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgLen} >>\nstream\n`);
  pushStr(imgBytes); pushStr('\nendstream\nendobj\n');
  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  startObj(5); pushStr(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`);

  const xrefOffset = byteCount;
  pushStr('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) pushStr(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const totalBytes = new Uint8Array(byteCount);
  let pos = 0;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) totalBytes[pos++] = chunk.charCodeAt(i) & 0xff;
  }
  return new Blob([totalBytes], { type: 'application/pdf' });
}

function downloadCertificateAsPDF() {
  const activeCertCls = getActiveCertificateClassification() || SPEED_CLASSIFICATIONS[0];
  const blob = buildCertificatePDFBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `2X_Okuma_Sertifikasi_${activeCertCls.id}_${currentUser ? (currentUser.firstName || 'ogrenci') : 'ogrenci'}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function printCertificateAsPDF() {
  const blob = buildCertificatePDFBlob();
  const pdfUrl = URL.createObjectURL(blob);
  const printFrame = document.getElementById('pdfPrintFrame');
  if (printFrame) {
    printFrame.onload = () => {
      setTimeout(() => {
        try { printFrame.contentWindow.focus(); printFrame.contentWindow.print(); }
        catch (err) { window.print(); }
      }, 250);
    };
    printFrame.src = pdfUrl;
  } else {
    window.print();
  }
}

/* PALMING MODALI */
let palmingInterval = null;
function openPalmingModal() {
  stopActiveTimers();
  const durationSec = Math.max(10, Math.min(120, Number(appState.palmingDurationSec) || 30));
  const modal = document.getElementById('palmingModal');
  const disp = document.getElementById('palmingTimerDisplay');
  modal.classList.add('open');
  const endTime = performance.now() + durationSec * 1000;
  disp.textContent = durationSec;
  if (palmingInterval) clearInterval(palmingInterval);
  palmingInterval = setInterval(() => {
    const rem = Math.max(0, Math.ceil((endTime - performance.now()) / 1000));
    disp.textContent = rem;
    if (rem <= 0) {
      clearInterval(palmingInterval);
      playTick(528, 0.25);
      closePalmingModal();
    }
  }, 150);
}
function closePalmingModal() { if (palmingInterval) clearInterval(palmingInterval); document.getElementById('palmingModal').classList.remove('open'); }

let deferredPwaPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
  const btn = document.getElementById('installPwaBtn');
  if (btn) btn.style.display = 'inline-flex';
});

async function installMobileApp() {
  if (!deferredPwaPrompt) return;
  deferredPwaPrompt.prompt();
  await deferredPwaPrompt.userChoice;
  deferredPwaPrompt = null;
  const btn = document.getElementById('installPwaBtn');
  if (btn) btn.style.display = 'none';
}
