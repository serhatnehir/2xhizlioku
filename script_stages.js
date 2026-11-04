/*****************************************************************
 * 3. DOSYA (script_stages.js): 30 AŞAMA (YUMUŞAK PASTEL SOL AĞAÇ),
 *    SINIF BAŞLIKLARI, HER SINIF SONUNDA BARAJ TESTİ, 13 EGZERSİZ
 *    VE KOD YAZMADAN METİN / .TXT EKLEME YÖNETİCİSİ
 *****************************************************************/
const STAGE_WPM_TABLE = [
  120, 135, 150, 160, 172, 184, 196, 208, 220,
  235, 250, 265, 280, 295, 310, 320, 350, 395, 440,
  485, 530, 575, 620, 665, 710, 755, 800, 850, 920, 1000
];

/* 14. HIZLI OKUMA ANTRENMANI AŞAMA İÇİNDEN KALDIRILDI, SINIF SONU TAMAMLAMA TESTİ OLDU (13 EGZERSİZ) */
const STAGE_EXERCISES = [
  { id: 'sarkac', title: '1. Sarkaç (Karışıklaşan)', icon: '↔️', instruction: 'Başınızı oynatmadan noktayı takip edin; ekrana sol tek tıklayarak duraklatıp devam ettirebilirsiniz.' },
  { id: 'sonsuzluk', title: '2. Sonsuzluk', icon: '♾️', instruction: 'Sonsuzluk (∞) eğrisi üzerinde hareket eden noktayı gözlerinizle akıcı şekilde takip edin.' },
  { id: 'zikzak', title: '3. Zikzak', icon: '⚡', instruction: 'Satır başı ve satır sonu noktalar arasında Z çizerek göz sıçraması yapın.' },
  { id: 'satir_sekme', title: '4. Satır Başı-Sonu Sekme', icon: '⏭️', instruction: 'Metnin her satırında sırası gelince vurgulanan ilk (satır başı) ve son (satır sonu) kelimelere ritmik göz sekmesi yapın.' },
  { id: 'kare', title: '5. Genişleyen Kare', icon: '⬜', instruction: 'Merkezdeki kırmızı noktaya bakarken dışa doğru genişleyen karenin kenarlarındaki kelimeleri çevresel görüşle algılayın.' },
  { id: 'yuvarlak', title: '6. Genişleyen Yuvarlak', icon: '⭕', instruction: 'Merkezdeki kırmızı noktadan gözünüzü ayırmadan genişleyen çember üzerindeki kelimeleri 360° algılayın.' },
  { id: 'kose', title: '7. Çapraz Köşe', icon: '✥', instruction: 'Başınızı sabit tutarak dört dış köşede beliren kelimelere hızlı çapraz göz sıçramaları yapın.' },
  { id: 'schulte', title: '8. Schulte', icon: '🔢', instruction: 'Kırmızı merkez noktaya bakarak çevresel görüşünüzle 1’den başlayarak sırayla tıklayın.' },
  { id: 'acilim', title: '9. Kelime Açılımı', icon: '↔', instruction: 'Ortadaki kırmızı noktaya bakarak iki yandaki kelimeleri aynı anda okuyun.' },
  { id: 'takistoskop', title: '10. Takistoskop', icon: '⏱️', instruction: 'Ekranın ortasında anlık beliren kelimeyi yazın (doğru yazılınca otomatik geçer) veya Enter tuşuna basın.' },
  { id: 'sutun', title: '11. Blok Sütunlar', icon: '🏛️', instruction: 'Sütunlarda vurgulanan kelime öbeklerini iç seslendirme yapmadan ritmik takip edin.' },
  { id: 'anlam', title: '12. Anlam Antrenmanı', icon: '🧠', instruction: 'Ekranın ortasında anlık görünüp kaybolan kelimelerin anlamlı bir bütün oluşturup oluşturmadığını seçin.' },
  { id: 'blok_okuma', title: '13. İkili / Üçlü Blok Okuma', icon: '📑', instruction: 'Vurgulanan ikili ve üçlü kelime bloklarını tek bir fotoğraf gibi bütün olarak okuyun.' }
];

/* HER SINIFIN SONUNDAKİ HIZLI OKUMA VE ANLAMA TAMAMLAMA TESTİ HEDEFLERİ (101..105) */
function getClassCompletionTestReqs(tierOrder) {
  const cls = SPEED_CLASSIFICATIONS.find(c => c.tierOrder === Number(tierOrder)) || SPEED_CLASSIFICATIONS[0];
  const minWpmMap = {
    1: 135, // 1. Sınıf (Yavaş / Alt Sınır - 120..150 WPM) tamamlama barajı
    2: 185, // 2. Sınıf (Türkiye Ortalama Sınırı - 160..220 WPM) tamamlama barajı
    3: 260, // 3. Sınıf (Normal / Akıcı Sınır - 235..320 WPM) tamamlama barajı
    4: 420, // 4. Sınıf (Hızlı Okuma Sınırı - 350..800 WPM) tamamlama barajı
    5: 800  // 5. Sınıf (Çok Hızlı / Profesyonel Sınır - 850..1000 WPM) tamamlama barajı
  };
  return {
    stageCode: 100 + cls.tierOrder,
    tierOrder: cls.tierOrder,
    cls,
    targetWpm: cls.milestoneWpm,
    minPassWpm: minWpmMap[cls.tierOrder] || 135,
    minPassCompPct: 60 // 5 soruda en az 3 doğru (%60 anlama)
  };
}

function isClassTestStage(stageNum) {
  return stageNum >= 101 && stageNum <= 105;
}

function ensurePassedClassTestsArray() {
  if (!Array.isArray(appState.passedClassTests)) {
    appState.passedClassTests = [];
  }
  // Eğer kullanıcı seviye tespit testiyle üst aşamalara geçmişse önceki sınıfların testlerini geçilmiş say
  SPEED_CLASSIFICATIONS.forEach(cls => {
    if ((appState.unlockedStage || 1) > cls.milestoneStage && !appState.passedClassTests.includes(cls.tierOrder)) {
      appState.passedClassTests.push(cls.tierOrder);
    }
  });
  return appState.passedClassTests;
}

function isClassTestPassed(tierOrder) {
  const passed = ensurePassedClassTestsArray();
  return passed.includes(Number(tierOrder));
}

function isClassTestUnlocked(tierOrder) {
  const cls = SPEED_CLASSIFICATIONS.find(c => c.tierOrder === Number(tierOrder));
  if (!cls) return false;
  if (isClassTestPassed(tierOrder)) return true;
  if (appState.completedStages.includes(cls.milestoneStage)) return true;
  const doneInMilestone = (appState.stageExerciseDone[cls.milestoneStage] || []).length;
  return doneInMilestone >= STAGE_EXERCISES.length;
}

function getStageConfig(stageNum) {
  if (stageNum === 0) {
    return {
      stage: 0,
      name: "⏱️ Okuma ve Anlama Seviyesi Ölçüm Modülü",
      subtitle: "Metni okuyup 5 soruyu yanıtlayın; sistem WPM okuma hızınızı ve anlama yüzdesini hesaplar.",
      isTest: true
    };
  }
  if (isClassTestStage(stageNum)) {
    const tierOrder = stageNum - 100;
    const req = getClassCompletionTestReqs(tierOrder);
    return {
      stage: stageNum,
      name: `🏁 ${req.cls.tierOrder}. Sınıf Tamamlama Testi — ${req.cls.name}`,
      subtitle: `Üst sınıfa geçmek için en az ${req.minPassWpm} WPM hız ve %${req.minPassCompPct} anlama (5 soruda 3 doğru) gereklidir.`,
      isTest: true,
      isClassTest: true,
      tierOrder: req.tierOrder,
      classificationId: req.cls.id,
      classificationName: req.cls.name,
      wpm: req.targetWpm,
      minPassWpm: req.minPassWpm,
      minPassCompPct: req.minPassCompPct
    };
  }
  if (stageNum === 32) {
    const m = appState.manualConfig;
    const wpmVal = Number(m.wpm) || 250;
    const bpmVal = Number(m.bpm) || 95;
    const cls = getSpeedClassificationForWpm(wpmVal);
    const sarkacMode = bpmVal <= 85 ? 'standard' : (bpmVal <= 125 ? 'alternating' : 'random');
    const blockReadSize = Number(m.blockReadSize) || (wpmVal >= 320 ? 3 : 2);
    return {
      stage: 32,
      name: `🎛️ Manuel Mod — ${cls.name}`,
      subtitle: "Seçili egzersizin hız, sarkaç ve blok büyüklüğü ayarlarını aşağıdan kontrol edebilirsiniz.",
      isManual: true,
      classificationId: cls.id,
      classificationName: cls.name,
      wpm: wpmVal,
      bpm: bpmVal,
      sarkacMode: sarkacMode,
      blockReadSize: blockReadSize,
      schulteSize: Number(m.schulteSize) || 4,
      tachiMs: Number(m.tachiMs) || 250,
      anlamMs: Number(m.anlamMs) || 500,
      chunkSize: Number(m.chunkSize) || 2,
      wordPoolLevel: Number(m.wordPoolLevel) || 2
    };
  }
  if (stageNum === 31) {
    const maintainWpm = Math.max(220, appState.maxAchievedWpm || appState.currentWpm || 250);
    const ratio = Math.min(1, Math.max(0, (maintainWpm - 120) / 880));
    const cls = getSpeedClassificationForWpm(maintainWpm);
    return {
      stage: 31,
      name: `🛡️ Var Olanı Koruma Modu — ${cls.name}`,
      subtitle: `Ulaştığınız ${maintainWpm} WPM okuma hızını ve göz kası kondisyonunu koruma antrenmanı.`,
      isMaintenance: true,
      classificationId: cls.id,
      classificationName: cls.name,
      wpm: maintainWpm,
      bpm: Math.round(65 + ratio * 95),
      sarkacMode: maintainWpm >= 450 ? 'random' : 'alternating',
      blockReadSize: maintainWpm >= 350 ? 3 : 2,
      schulteSize: maintainWpm >= 550 ? 5 : 4,
      tachiMs: Math.round(Math.max(120, 380 - ratio * 250)),
      anlamMs: Math.round(Math.max(220, 850 - ratio * 620)),
      chunkSize: maintainWpm >= 650 ? 3 : 2,
      wordPoolLevel: ratio >= 0.55 ? 3 : 2
    };
  }

  const sIdx = Math.max(0, Math.min(29, stageNum - 1));
  const p = sIdx / 29;
  const wpm = STAGE_WPM_TABLE[sIdx];
  const cls = getSpeedClassificationForWpm(wpm);

  const sarkacMode = stageNum <= 8 ? 'standard' : (stageNum <= 18 ? 'alternating' : 'random');
  const blockReadSize = stageNum <= 15 ? 2 : 3;

  return {
    stage: stageNum,
    name: `${stageNum}. Aşama (${wpm} WPM)`,
    subtitle: `${cls.name} • ${cls.desc} (${cls.rangeText})`,
    classificationId: cls.id,
    classificationName: cls.name,
    wpm,
    bpm: Math.round(55 + p * 110),
    sarkacMode,
    blockReadSize,
    schulteSize: stageNum <= 7 ? 3 : (stageNum <= 18 ? 4 : (stageNum <= 27 ? 5 : 6)),
    tachiMs: Math.round(450 - p * 330),
    anlamMs: Math.round(1000 - p * 800),
    chunkSize: stageNum <= 7 ? 1 : (stageNum <= 19 ? 2 : (stageNum <= 27 ? 3 : 4)),
    wordPoolLevel: stageNum <= 9 ? 1 : (stageNum <= 20 ? 2 : 3)
  };
}

function calculateRecommendedStageFromWpm(measuredWpm) {
  let bestStage = 1, minDiff = Infinity;
  STAGE_WPM_TABLE.forEach((stageWpm, idx) => {
    const diff = Math.abs(measuredWpm - stageWpm);
    if (diff < minDiff) { minDiff = diff; bestStage = idx + 1; }
  });
  return Math.max(1, Math.min(30, bestStage));
}

function isStageUnlocked(stageNum) {
  if (stageNum === 0 || stageNum === 1 || stageNum === 31 || stageNum === 32) return true;
  if (isClassTestStage(stageNum)) {
    return isClassTestUnlocked(stageNum - 100);
  }
  // Bir sınıfın ilk aşamasıysa (4, 10, 17, 28), önceki sınıfın tamamlama testi geçilmiş olmalı
  const prevMilestoneCls = SPEED_CLASSIFICATIONS.find(c => c.milestoneStage + 1 === stageNum);
  if (prevMilestoneCls && !isClassTestPassed(prevMilestoneCls.tierOrder) && (appState.unlockedStage || 1) <= prevMilestoneCls.milestoneStage) {
    return false;
  }
  return stageNum <= (appState.unlockedStage || 1);
}

/* EN AZ 1 OKUMA HIZI SINIFLANDIRMASI TAMAMLANDIYSA SERTİFİKA AÇIKTIR */
function isTrainingCompleted() {
  return Boolean(getActiveCertificateClassification());
}

/* BİR AŞAMA TAMAMLANDIĞINDA SINIFLANDIRMA SONU (MILESTONE) İSE O SINIFLANDIRMAYI DÖNDÜRÜR */
function getMilestoneClassificationForStage(stageNum) {
  return SPEED_CLASSIFICATIONS.find(c => c.milestoneStage === stageNum) || null;
}

function updateHeaderAndGoalUI() {
  ensurePassedClassTestsArray();
  let stageLabel = `${appState.currentStage} / 30`;
  if (appState.currentStage === 0) stageLabel = 'Hız & Anlama Testi';
  else if (isClassTestStage(appState.currentStage)) stageLabel = `${appState.currentStage - 100}. Sınıf Testi`;
  else if (appState.currentStage === 31) stageLabel = 'Koruma Modu';
  else if (appState.currentStage === 32) stageLabel = 'Manuel Mod';

  const currWpm = appState.currentWpm || 120;
  const currClass = getSpeedClassificationForWpm(currWpm);

  const stageTxtEl = document.getElementById('topCurrentStageTxt');
  const wpmTxtEl = document.getElementById('topCurrentWpmTxt');
  const classEl = document.getElementById('topCurrentClassTxt');
  if (stageTxtEl) stageTxtEl.textContent = stageLabel;
  if (wpmTxtEl) wpmTxtEl.textContent = `${currWpm} WPM`;
  if (classEl) classEl.textContent = currClass.name;

  const start = appState.initialWpm || 120;
  const target = Math.max(100, appState.targetWpm || 240);
  const remain = Math.max(0, target - currWpm);
  let pct = 0;
  if (currWpm >= target) {
    pct = 100;
  } else if (target > start) {
    pct = Math.max(0, Math.min(99, Math.round(((currWpm - start) / (target - start)) * 100)));
  } else {
    pct = Math.max(0, Math.min(99, Math.round((currWpm / target) * 100)));
  }

  const gStartEl = document.getElementById('goalStartWpm');
  const gCurrEl = document.getElementById('goalCurrWpm');
  const gTargEl = document.getElementById('goalTargetWpm');
  const gBarEl = document.getElementById('goalProgressBar');
  const gRemEl = document.getElementById('goalRemainText');
  const gPctEl = document.getElementById('goalPercentText');
  const dropGoalMeta = document.getElementById('dropdownGoalMeta');

  if (gStartEl) gStartEl.textContent = start;
  if (gCurrEl) gCurrEl.textContent = currWpm;
  if (gTargEl) gTargEl.textContent = target;
  if (gBarEl) gBarEl.style.width = `${pct}%`;
  if (gRemEl) gRemEl.textContent = remain === 0 ? '🎉 Hedefe Ulaşıldı!' : `Hedefe kalan: ${remain} WPM`;
  if (gPctEl) gPctEl.textContent = `%${pct}`;
  if (dropGoalMeta) dropGoalMeta.textContent = `Hedef: ${target} WPM (%${pct})`;

  const activeCertCls = getActiveCertificateClassification();
  const certUnlocked = Boolean(activeCertCls);
  const certBtnEl = document.getElementById('dropdownCertBtn');
  const certTitleEl = document.getElementById('dropdownCertTitle');
  const certMetaEl = document.getElementById('dropdownCertMeta');
  const certBadgeEl = document.getElementById('dropdownCertBadge');

  if (certBtnEl) certBtnEl.classList.toggle('locked', !certUnlocked);

  if (certUnlocked && activeCertCls) {
    if (certTitleEl) certTitleEl.textContent = `🎓 Sertifika (${activeCertCls.name})`;
    if (certMetaEl) certMetaEl.textContent = `${activeCertCls.rangeText} • Görüntüle & PDF İndir`;
    if (certBadgeEl) certBadgeEl.textContent = `🏆 ${activeCertCls.tierOrder}. Kademe`;
  } else {
    if (certTitleEl) certTitleEl.textContent = `🎓 Başarı Sertifikası`;
    if (certMetaEl) certMetaEl.textContent = `1. Sınıflandırma (3. Aşama) Bitince Açılır`;
    if (certBadgeEl) certBadgeEl.textContent = `🔒 Kilitli`;
  }

  const tmMeta = document.getElementById('dropdownTextMgrMeta');
  if (tmMeta && typeof loadedTxtFiles !== 'undefined') {
    tmMeta.textContent = `Aktif Metin Havuzu: ${loadedTxtFiles.length} Metin`;
  }

  const compEl = document.getElementById('completedStagesCount');
  if (compEl) compEl.textContent = `${appState.completedStages.filter(s => s >= 1 && s <= 30).length}/30`;

  renderStagesSidebar();
  renderRightExercisesSidebar();
}

function set2XGoal() {
  const base = appState.initialWpm > 0 ? appState.initialWpm : 120;
  appState.targetWpm = base * 2;
  const inp = document.getElementById('customGoalInput');
  if (inp) inp.value = appState.targetWpm;
  saveState();
  const fb = document.getElementById('goalModalFeedback');
  if (fb) {
    fb.style.color = 'var(--success)';
    fb.textContent = `✓ 2X hedefiniz ${appState.targetWpm} WPM olarak ayarlandı!`;
  }
}

function saveCustomGoal() {
  const val = parseInt(document.getElementById('customGoalInput').value, 10);
  const fb = document.getElementById('goalModalFeedback');
  if (!isNaN(val) && val >= 100 && val <= 2500) {
    appState.targetWpm = val;
    saveState();
    if (fb) {
      fb.style.color = 'var(--success)';
      fb.textContent = `✓ Hedef hızınız ${val} WPM olarak kaydedildi!`;
    }
  } else if (fb) {
    fb.style.color = 'var(--danger)';
    fb.textContent = '✗ Lütfen 100 ile 2500 arasında geçerli bir WPM girin.';
  }
}

/* SOL MENÜ: SINIFLANDIRMA BAŞLIKLARI + AŞAMALAR (ALTINDA SINIF YAZMAZ) + HER SINIF SONUNDA BARAJ TESTİ */
function renderStagesSidebar() {
  const container = document.getElementById('stagesListContainer');
  if (!container) return;
  let html = `
    <button type="button" class="stage-item test-mode ${appState.currentStage === 0 ? 'active' : ''}" onclick="selectStage(0)">
      <div class="stage-left"><span class="stage-title">⏱️ Hızlı Okuma ve Anlama Testi</span><span class="stage-meta">Genel Seviye Ölçümü (5 Soru)</span></div>
      <span class="stage-status-badge">Modül</span>
    </button>
    <button type="button" class="stage-item manual-mode ${appState.currentStage === 32 ? 'active' : ''}" onclick="selectStage(32)">
      <div class="stage-left"><span class="stage-title">🎛️ Manuel Mod</span><span class="stage-meta">Hızları ve Blokları Kendin Ayarla</span></div>
      <span class="stage-status-badge">Serbest</span>
    </button>
  `;
  const maintainCfg = getStageConfig(31);
  html += `
    <button type="button" class="stage-item maintain-mode ${appState.currentStage === 31 ? 'active' : ''}" onclick="selectStage(31)">
      <div class="stage-left"><span class="stage-title">🛡️ Var Olanı Koruma Modu</span><span class="stage-meta">${maintainCfg.wpm} WPM • Kondisyon Koruma</span></div>
      <span class="stage-status-badge">Koruma</span>
    </button>
  `;

  for (let s = 1; s <= 30; s++) {
    // Sınıf başlangıcı ise üst grup başlığını ekle
    const startCls = SPEED_CLASSIFICATIONS.find(c => c.startStage === s);
    if (startCls) {
      html += `
        <div class="stage-class-group-header header-${startCls.id}">
          <span>🏷️ ${startCls.tierOrder}. ${startCls.name}</span>
          <span class="scg-range">${startCls.rangeText}</span>
        </div>
      `;
    }

    const cfg = getStageConfig(s);
    const unlocked = isStageUnlocked(s);
    const isCompleted = appState.completedStages.includes(s);
    const doneCount = Math.min(STAGE_EXERCISES.length, (appState.stageExerciseDone[s] || []).filter(idx => idx < STAGE_EXERCISES.length).length);
    const badge = !unlocked ? '🔒 Kilitli' : (isCompleted ? '✅ Tamam' : `${doneCount}/${STAGE_EXERCISES.length}`);
    const tierClass = `tier-${cfg.classificationId || 'slow'}`;

    html += `
      <button type="button" class="stage-item ${tierClass} ${appState.currentStage === s ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!unlocked ? 'locked' : ''}" onclick="selectStage(${s})">
        <div class="stage-left">
          <span class="stage-title">${s}. Aşama (${cfg.wpm} WPM)</span>
          <span class="stage-meta">${cfg.bpm} BPM • ${cfg.blockReadSize}'li Blok • ${cfg.schulteSize}x${cfg.schulteSize} Schulte</span>
        </div>
        <span class="stage-status-badge">${badge}</span>
      </button>
    `;

    // Sınıfın son aşaması (milestoneStage) ise hemen altına o sınıfın Hızlı Okuma ve Anlama Tamamlama Testini ekle
    const endCls = SPEED_CLASSIFICATIONS.find(c => c.milestoneStage === s);
    if (endCls) {
      const req = getClassCompletionTestReqs(endCls.tierOrder);
      const testStageCode = req.stageCode;
      const testUnlocked = isClassTestUnlocked(endCls.tierOrder);
      const testPassed = isClassTestPassed(endCls.tierOrder);
      const testBadge = !testUnlocked ? '🔒 Kilitli' : (testPassed ? '🏆 Geçildi' : '🎯 Baraj Testi');

      html += `
        <button type="button" class="stage-item class-test-mode ${appState.currentStage === testStageCode ? 'active' : ''} ${testPassed ? 'completed' : ''} ${!testUnlocked ? 'locked' : ''}" onclick="selectStage(${testStageCode})">
          <div class="stage-left">
            <span class="stage-title">🏁 ${endCls.name} Tamamlama Testi</span>
            <span class="stage-meta">Hedef: En az ${req.minPassWpm} WPM & %${req.minPassCompPct} Anlama</span>
          </div>
          <span class="stage-status-badge">${testBadge}</span>
        </button>
      `;
    }
  }
  container.innerHTML = html;
}

function renderRightExercisesSidebar() {
  const container = document.getElementById('rightExerciseListContainer');
  const ratioEl = document.getElementById('rightExDoneRatio');
  if (!container) return;
  const isTestMode = appState.currentStage === 0 || isClassTestStage(appState.currentStage);
  const doneList = (appState.stageExerciseDone[appState.currentStage] || []).filter(idx => idx < STAGE_EXERCISES.length);
  if (ratioEl) ratioEl.textContent = isTestMode ? 'Test' : `${doneList.length}/${STAGE_EXERCISES.length}`;

  container.innerHTML = STAGE_EXERCISES.map((ex, i) => {
    const isDone = doneList.includes(i);
    const isCurrent = !isTestMode && appState.currentExerciseIdx === i;
    return `
      <button type="button" class="right-ex-btn ${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}" onclick="selectExercise(${i})">
        <span>${ex.icon} ${ex.title}</span>
        <span>${isDone ? '✅' : (isCurrent ? '▶' : '')}</span>
      </button>
    `;
  }).join('');
}

function selectStage(stageNum) {
  if (!currentUser) { openLoginModal(); return; }
  if (!isStageUnlocked(stageNum)) {
    playTick(220, 0.1);
    if (isClassTestStage(stageNum)) {
      const cls = SPEED_CLASSIFICATIONS.find(c => c.tierOrder === stageNum - 100);
      alert(`🔒 Bu sınıf tamamlama testini açmak için önce ${cls ? cls.milestoneStage : ''}. Aşamadaki 13 antrenmanı tamamlamalısınız.`);
    } else {
      const prevMilestoneCls = SPEED_CLASSIFICATIONS.find(c => c.milestoneStage + 1 === stageNum);
      if (prevMilestoneCls && !isClassTestPassed(prevMilestoneCls.tierOrder)) {
        alert(`🔒 ${stageNum}. Aşamaya geçebilmek için önce "${prevMilestoneCls.name} Tamamlama Testi"ni başarıyla geçmelisiniz!`);
      } else {
        alert('🔒 Bu aşama kilitli! Açmak için önceki aşamayı tamamlamalı veya Okuma ve Anlama Testi ile seviyenizi ölçmelisiniz.');
      }
    }
    return;
  }
  stopActiveTimers();
  appState.currentStage = stageNum;
  appState.currentExerciseIdx = 0;
  appState.topBannerHidden = false;
  saveState();
  renderWorkspace(true);
}

function selectExercise(exIdx) {
  if (!currentUser) { openLoginModal(); return; }
  stopActiveTimers();
  if (appState.currentStage === 0 || isClassTestStage(appState.currentStage)) {
    appState.currentStage = appState.unlockedStage || 1;
  }
  appState.currentExerciseIdx = Math.max(0, Math.min(STAGE_EXERCISES.length - 1, exIdx));
  saveState();
  renderWorkspace(true);
}

function updateManualParam(key, rawValue) {
  stopActiveTimers();
  appState.manualConfig[key] = Number(rawValue);
  saveState();
  renderWorkspace(false);
}

function markExerciseComplete(stageNum, exIdx, customResultLabel = 'Tamamlandı') {
  const cfg = getStageConfig(stageNum);
  const exObj = STAGE_EXERCISES[exIdx];
  addProgressLogEntry(
    stageNum === 32 ? 'Manuel Mod' : (stageNum === 31 ? 'Koruma Modu' : `${stageNum}. Aşama`),
    exObj ? exObj.title : 'Antrenman',
    customResultLabel,
    cfg.wpm
  );
  if (stageNum === 32 || stageNum === 0 || isClassTestStage(stageNum)) { saveState(); return; }
  if (!appState.stageExerciseDone[stageNum]) appState.stageExerciseDone[stageNum] = [];
  if (!appState.stageExerciseDone[stageNum].includes(exIdx)) appState.stageExerciseDone[stageNum].push(exIdx);
  if (cfg.wpm && cfg.wpm > appState.currentWpm) appState.currentWpm = cfg.wpm;
  if (appState.currentWpm > appState.maxAchievedWpm) appState.maxAchievedWpm = appState.currentWpm;

  const doneValid = appState.stageExerciseDone[stageNum].filter(idx => idx < STAGE_EXERCISES.length);
  if (doneValid.length >= STAGE_EXERCISES.length) {
    if (!appState.completedStages.includes(stageNum)) appState.completedStages.push(stageNum);
    const milestoneCls = getMilestoneClassificationForStage(stageNum);
    // Sınıf sonu değilse bir sonraki aşamayı aç; sınıf sonuysa baraj testi geçilince açılır
    if (!milestoneCls && stageNum >= 1 && stageNum < 30 && appState.unlockedStage <= stageNum) {
      appState.unlockedStage = stageNum + 1;
    }
  }
  saveState();
}

/*****************************************************************
 * 5 SORULUK HIZLI OKUMA VE ANLAMA TESTİ MODÜLÜ
 * (HEM GENEL SEVİYE TESTİ HEM DE SINIF SONU BARAJ TESTİ İÇİN ÇALIŞIR)
 *****************************************************************/
let currentTestObj = null;
let measuredRawWpm = 120;
let measuredElapsedSeconds = 0;
let testElapsedMs = 0;

function renderSpeedTestModule(ws, animatePageTurn) {
  if (animatePageTurn && appState.pageTurnSoundEnabled === true) {
    playPageTurnSound();
  }
  const useFlipEffect = animatePageTurn && (appState.pageTurnEffectEnabled === true);

  const isClassBaraj = !isGuestTestActive && isClassTestStage(appState.currentStage);
  const classReq = isClassBaraj ? getClassCompletionTestReqs(appState.currentStage - 100) : null;

  currentTestObj = getUniqueSpeedTestWithQuestions();
  const wordCount = currentTestObj.content.trim().split(/\s+/).filter(Boolean).length;

  const bannerTitle = isClassBaraj
    ? `🏁 ${classReq.cls.tierOrder}. Sınıf Tamamlama Testi (${classReq.cls.name}) — ${currentTestObj.title}`
    : `⏱️ Okuma ve Anlama Seviyesi Ölçümü — ${currentTestObj.title}`;

  const bannerSub = isClassBaraj
    ? `Bir üst sınıfa geçmek için bu metni en az <strong>${classReq.minPassWpm} WPM</strong> hızla okuyup 5 sorudan en az <strong>3'ünü (%${classReq.minPassCompPct})</strong> doğru yanıtlamalısınız.`
    : `Metni anlama hızınızda okuyup bitirin. Ardından metinle ilgili <strong>5 kavrama sorusu</strong> sorulacaktır.`;

  const extraLockBadge = isClassBaraj
    ? `<div class="param-lock-badge">🎯 Baraj: ${classReq.minPassWpm} WPM & %${classReq.minPassCompPct} Anlama</div>`
    : ``;

  ws.innerHTML = `
    <div class="stage-banner ${appState.topBannerHidden ? 'banner-hidden' : ''}">
      <div class="stage-banner-info">
        <h2>${bannerTitle}</h2>
        <p>${bannerSub}</p>
      </div>
      <div class="locked-params">
        ${extraLockBadge}
        <div class="param-lock-badge">📄 ${wordCount} Kelime</div>
        <div class="param-lock-badge">❓ 5 Anlama Sorusu</div>
      </div>
    </div>

    <div class="book-viewport">
      <div class="arena-card ${useFlipEffect ? 'turning-page' : ''}">
        <div class="arena-header">
          <h3 id="testStepHeaderTitle">📖 1. Adım: Metni Okuyun</h3>
          <button type="button" class="btn btn-success" id="finishTestBtn" onclick="showReadingComprehensionQuestions(${wordCount})" disabled>✅ Okumayı Bitirdim (Sorulara Geç)</button>
        </div>

        <div class="arena-body" id="testArenaBody" style="align-items:stretch;">
          <div class="pause-badge-indicator" id="arenaPauseBadge">⏸ Duraklatıldı (Devam için tıklayın)</div>
          <button type="button" class="center-circle-btn" id="exStartBtn" onclick="startReadingTest()">Başla</button>
          <div class="reading-box" id="testReadingBox" style="filter: blur(6px); user-select:none;">
            ${currentTestObj.content}
          </div>
          <div id="testQuizAndResultArea" style="display:none; width:100%; height:100%; flex-direction:column;"></div>
          <div class="bottom-center-timer" id="testBottomTimerWrap">Geçen Süre: <span class="val" id="testTimerTxt">00:00</span></div>
        </div>

        <div class="page-footer-num">
          <span class="footer-inst">Başla düğmesine basarak metni okuyun, bitirdiğinizde soruları yanıtlayarak WPM ve Anlama yüzdesini görün.</span>
          <span class="footer-pg">${isClassBaraj ? `${classReq.cls.name} Baraj Testi` : 'Okuma & Anlama Testi'}</span>
        </div>
      </div>
    </div>
  `;
  applyTopBannerState();
}

function startReadingTest() {
  if (isExerciseRunning) return;
  stopActiveTimers();
  isExerciseRunning = true;
  isExercisePaused = false;
  autoHideSidebarsOnExerciseStart();
  const startBtn = document.getElementById('exStartBtn');
  if (startBtn) startBtn.style.display = 'none';

  const box = document.getElementById('testReadingBox');
  if (box) box.style.filter = 'none';
  document.getElementById('finishTestBtn').disabled = false;
  testElapsedMs = 0;
  let lastTick = performance.now();

  testClockInterval = setInterval(() => {
    const now = performance.now();
    const dt = now - lastTick;
    lastTick = now;
    const rBox = document.getElementById('testReadingBox');
    if (isExercisePaused) {
      if (rBox && rBox.style.display !== 'none') rBox.style.filter = 'blur(6px)';
      return;
    }
    if (rBox && rBox.style.display !== 'none' && rBox.style.filter !== 'none') {
      rBox.style.filter = 'none';
    }
    testElapsedMs += dt;
    const elapsedSec = Math.floor(testElapsedMs / 1000);
    const m = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
    const s = String(elapsedSec % 60).padStart(2, '0');
    const el = document.getElementById('testTimerTxt');
    if (el) el.textContent = `${m}:${s}`;
  }, 150);
}

function showReadingComprehensionQuestions(wordCount) {
  measuredElapsedSeconds = Math.max(3, Math.round(testElapsedMs / 1000));
  stopActiveTimers();
  measuredRawWpm = Math.max(60, Math.min(2000, Math.round((wordCount / measuredElapsedSeconds) * 60)));

  if (appState.pageTurnSoundEnabled === true) playPageTurnSound();

  document.getElementById('finishTestBtn').style.display = 'none';
  document.getElementById('testReadingBox').style.display = 'none';
  document.getElementById('testBottomTimerWrap').style.display = 'none';
  document.getElementById('testStepHeaderTitle').textContent = `❓ 2. Adım: Okuduğunu Anlama Soruları (5 Soru)`;

  const quizArea = document.getElementById('testQuizAndResultArea');
  quizArea.style.display = 'flex';

  const questions = (currentTestObj && currentTestObj.questions) ? currentTestObj.questions : [];
  quizArea.innerHTML = `
    <div class="quiz-container">
      ${questions.map((qObj, qIdx) => `
        <div class="quiz-question-card">
          <h4>${qObj.q}</h4>
          <div class="quiz-options-grid">
            ${qObj.options.map((optText, oIdx) => `
              <label class="quiz-opt-label">
                <input type="radio" name="comp_q_${qIdx}" value="${oIdx}" />
                <span>${optText}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `).join('')}
      <div style="display:flex; justify-content:center; padding:0.4rem 0;">
        <button type="button" class="btn btn-primary" style="padding:0.75rem 1.8rem; font-size:0.95rem; font-weight:800;" onclick="evaluateComprehensionTest()">
          📊 Testi Bitir ve Sonucu Göster
        </button>
      </div>
    </div>
  `;
}

function evaluateComprehensionTest() {
  const questions = (currentTestObj && currentTestObj.questions) ? currentTestObj.questions : [];
  let correctCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const selected = document.querySelector(`input[name="comp_q_${i}"]:checked`);
    if (!selected) {
      alert(`Lütfen ${i + 1}. soruyu yanıtlayın.`);
      return;
    }
    if (parseInt(selected.value, 10) === questions[i].answerIndex) {
      correctCount++;
    }
  }

  const totalQ = questions.length || 5;
  const comprehensionPct = Math.round((correctCount / totalQ) * 100);
  const effectiveWpm = Math.round(measuredRawWpm * (comprehensionPct / 100));
  const isClassBaraj = !isGuestTestActive && isClassTestStage(appState.currentStage);

  if (isClassBaraj) {
    evaluateClassBarajResult(correctCount, totalQ, comprehensionPct, effectiveWpm);
    return;
  }

  const recommendedStage = calculateRecommendedStageFromWpm(measuredRawWpm);
  const cls = getSpeedClassificationForWpm(measuredRawWpm);

  appState.initialWpm = measuredRawWpm;
  appState.targetWpm = measuredRawWpm * 2;
  appState.currentWpm = measuredRawWpm;
  appState.lastComprehensionPct = comprehensionPct;
  if (measuredRawWpm > appState.maxAchievedWpm) appState.maxAchievedWpm = measuredRawWpm;

  if (currentUser) {
    addProgressLogEntry(
      'Okuma & Anlama Testi',
      currentTestObj.title,
      `${measuredRawWpm} WPM • %${comprehensionPct} Anlama (${correctCount}/${totalQ})`,
      measuredRawWpm
    );
    for (let s = 1; s < recommendedStage; s++) {
      if (!appState.completedStages.includes(s)) appState.completedStages.push(s);
    }
    if (recommendedStage > appState.unlockedStage) appState.unlockedStage = recommendedStage;
    ensurePassedClassTestsArray();
    openSidebarsDefault();
    saveState();
  } else {
    window.pendingGuestTestResult = {
      measuredRawWpm,
      comprehensionPct,
      recommendedStage,
      testTitle: currentTestObj ? currentTestObj.title : 'Seviye Ölçümü'
    };
  }

  document.getElementById('testStepHeaderTitle').textContent = `📊 3. Adım: Okuma Hızı ve Anlama İstatistikleriniz`;
  const quizArea = document.getElementById('testQuizAndResultArea');

  const actionButtonsHtml = currentUser
    ? `<button type="button" class="btn btn-primary" style="padding:0.7rem 1.4rem; font-size:0.92rem;" onclick="selectStage(${recommendedStage})">🚀 ${recommendedStage}. Aşamadan Antrenmana Başla</button>
       <button type="button" class="btn" style="padding:0.7rem 1.1rem;" onclick="renderSpeedTestModule(document.getElementById('mainWorkspace'), true)">🔄 Yeni Test Çöz</button>`
    : `<button type="button" class="btn btn-success" style="padding:0.7rem 1.3rem; font-size:0.9rem;" onclick="openPurchaseModal('card')">💳 Eğitimi Satın Al (1.900 ₺)</button>
       <button type="button" class="btn btn-primary" style="padding:0.7rem 1.3rem; font-size:0.9rem;" onclick="openLoginModal()">🔑 Giriş Yap / Kayıt Ol ve ${recommendedStage}. Aşamadan Başla</button>
       <button type="button" class="btn" style="padding:0.7rem 1rem;" onclick="exitGuestTestToHome()">🏠 Ana Sayfaya Dön</button>`;

  quizArea.innerHTML = `
    <div style="background:var(--bg-card); border:2px solid var(--accent); border-radius:14px; padding:1.4rem; text-align:center; margin:auto; width:100%; max-width:680px;">
      <h3 style="font-size:1.25rem; margin-bottom:0.85rem;">🎯 Okuma ve Anlama Ölçüm Raporu</h3>

      <div class="progress-stats-grid" style="margin-bottom:1rem;">
        <div class="p-stat-card">
          <div class="lbl">Okuma Hızı</div>
          <div class="val">${measuredRawWpm} WPM</div>
        </div>
        <div class="p-stat-card">
          <div class="lbl">Anlama Oranı</div>
          <div class="val" style="color:var(--success);">%${comprehensionPct} (${correctCount}/${totalQ})</div>
        </div>
        <div class="p-stat-card">
          <div class="lbl">Net Etkin Hız</div>
          <div class="val">${effectiveWpm} WPM</div>
        </div>
        <div class="p-stat-card">
          <div class="lbl">Okuma Süresi</div>
          <div class="val">${measuredElapsedSeconds} sn</div>
        </div>
      </div>

      <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1.1rem;">
        Okuma Sınıfınız: <strong style="color:var(--accent);">${cls.name}</strong> (${cls.rangeText})<br/>
        Önerilen Başlangıç Seviyesi: <strong>${recommendedStage}. Aşama</strong>
      </p>

      <div style="display:flex; gap:0.65rem; justify-content:center; flex-wrap:wrap;">
        ${actionButtonsHtml}
      </div>
    </div>
  `;
}

/* SINIF SONU TAMAMLAMA (BARAJ) TESTİ DEĞERLENDİRMESİ */
function evaluateClassBarajResult(correctCount, totalQ, comprehensionPct, effectiveWpm) {
  const tierOrder = appState.currentStage - 100;
  const req = getClassCompletionTestReqs(tierOrder);
  const wpmPassed = measuredRawWpm >= req.minPassWpm;
  const compPassed = comprehensionPct >= req.minPassCompPct;
  const isPassed = wpmPassed && compPassed;

  const nextStageNum = req.cls.milestoneStage < 30 ? req.cls.milestoneStage + 1 : 31;

  addProgressLogEntry(
    `${req.cls.tierOrder}. Sınıf Testi`,
    currentTestObj ? currentTestObj.title : req.cls.name,
    `${isPassed ? 'GEÇTİ' : 'TEKRAR'} • ${measuredRawWpm} WPM • %${comprehensionPct} Anlama`,
    measuredRawWpm
  );

  if (isPassed) {
    ensurePassedClassTestsArray();
    if (!appState.passedClassTests.includes(tierOrder)) {
      appState.passedClassTests.push(tierOrder);
    }
    if (!appState.completedStages.includes(req.cls.milestoneStage)) {
      appState.completedStages.push(req.cls.milestoneStage);
    }
    if (req.cls.milestoneStage < 30 && appState.unlockedStage <= req.cls.milestoneStage) {
      appState.unlockedStage = req.cls.milestoneStage + 1;
    }
    if (measuredRawWpm > appState.currentWpm) appState.currentWpm = measuredRawWpm;
    if (appState.currentWpm > appState.maxAchievedWpm) appState.maxAchievedWpm = appState.currentWpm;
    playTick(880, 0.12);
  } else {
    playTick(240, 0.15);
  }

  openSidebarsDefault();
  saveState();

  document.getElementById('testStepHeaderTitle').textContent = isPassed
    ? `🎉 Tebrikler! ${req.cls.name} Tamamlama Testini Geçtiniz`
    : `⚠️ ${req.cls.name} Tamamlama Testi Barajı Geçilemedi`;

  const quizArea = document.getElementById('testQuizAndResultArea');
  const statusBorder = isPassed ? 'var(--success)' : 'var(--warning)';

  let reasonText = '';
  if (!isPassed) {
    const reasons = [];
    if (!wpmPassed) reasons.push(`okuma hızınız (${measuredRawWpm} WPM) sınıf barajının (${req.minPassWpm} WPM) altında kaldı`);
    if (!compPassed) reasons.push(`anlama oranınız (%${comprehensionPct}) gereken %${req.minPassCompPct} barajının altında kaldı`);
    reasonText = `<p style="font-size:0.86rem; color:var(--danger); font-weight:700; margin-bottom:1rem;">Sonuç: ${reasons.join(' ve ')}. Bir sonraki aşamaya geçmek için lütfen yeni metinle testi tekrarlayın.</p>`;
  } else {
    reasonText = `<p style="font-size:0.88rem; color:var(--success); font-weight:700; margin-bottom:1rem;">✓ Harika! Hem hız barajını (en az ${req.minPassWpm} WPM) hem de anlama barajını (%${req.minPassCompPct}+) başarıyla geçtiniz. Yeni sınıfın kilidi ve Başarı Sertifikanız açıldı!</p>`;
  }

  const buttonsHtml = isPassed
    ? `<button type="button" class="btn btn-success" style="padding:0.75rem 1.4rem; font-size:0.92rem; font-weight:800;" onclick="selectStage(${nextStageNum})">🚀 ${nextStageNum === 31 ? 'Koruma Moduna Geç' : `${nextStageNum}. Aşamaya (Yeni Sınıfa) Geç`}</button>
       <button type="button" class="btn btn-warning" style="padding:0.75rem 1.2rem; font-weight:800;" onclick="openCertificateModal()">🎓 Sınıf Başarı Sertifikasını Gör</button>`
    : `<button type="button" class="btn btn-primary" style="padding:0.75rem 1.5rem; font-size:0.92rem; font-weight:800;" onclick="renderSpeedTestModule(document.getElementById('mainWorkspace'), true)">🔄 Farklı Metinle Testi Tekrarla</button>
       <button type="button" class="btn" style="padding:0.75rem 1.1rem;" onclick="selectStage(${req.cls.milestoneStage})">↩️ ${req.cls.milestoneStage}. Aşama Antrenmanlarına Dön</button>`;

  quizArea.innerHTML = `
    <div style="background:var(--bg-card); border:2px solid ${statusBorder}; border-radius:14px; padding:1.4rem; text-align:center; margin:auto; width:100%; max-width:680px;">
      <h3 style="font-size:1.22rem; margin-bottom:0.85rem;">${isPassed ? '🏆 Sınıf Geçiş Onayı' : '📊 Sınıf Tamamlama Testi Sonucu'}</h3>

      <div class="progress-stats-grid" style="margin-bottom:0.9rem;">
        <div class="p-stat-card">
          <div class="lbl">Okuma Hızınız</div>
          <div class="val" style="color:${wpmPassed ? 'var(--success)' : 'var(--danger)'};">${measuredRawWpm} WPM</div>
          <div style="font-size:0.66rem; color:var(--text-muted);">Baraj: ${req.minPassWpm} WPM</div>
        </div>
        <div class="p-stat-card">
          <div class="lbl">Anlama Oranı</div>
          <div class="val" style="color:${compPassed ? 'var(--success)' : 'var(--danger)'};">%${comprehensionPct} (${correctCount}/${totalQ})</div>
          <div style="font-size:0.66rem; color:var(--text-muted);">Baraj: %${req.minPassCompPct}</div>
        </div>
        <div class="p-stat-card">
          <div class="lbl">Net Etkin Hız</div>
          <div class="val">${effectiveWpm} WPM</div>
        </div>
        <div class="p-stat-card">
          <div class="lbl">Okuma Süresi</div>
          <div class="val">${measuredElapsedSeconds} sn</div>
        </div>
      </div>

      ${reasonText}

      <div style="display:flex; gap:0.65rem; justify-content:center; flex-wrap:wrap;">
        ${buttonsHtml}
      </div>
    </div>
  `;
}
