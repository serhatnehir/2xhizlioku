/*****************************************************************
 * 1. DOSYA (script_core.js): E-POSTA & DOĞRULAMA KODU GİRİŞİ, OAUTH,
 *    ŞİFRE SIFIRLAMA, SHA-256 ŞİFRE KORUMASI, FIREBASE BULUT VERİTABANI,
 *    AYRI YASAL METİN PENCERELERİ, SATIN ALMA, AYARLAR, PWA & SES MOTORU
 *****************************************************************/
let ownerSecurityBypass = false;
let secretTapCount = 0;
let secretTapTimer = null;
let isAppBooted = false;

// E-Posta Doğrulama Kodu (OTP) ve Şifre Sıfırlama Durum Değişkenleri
let pendingVerificationUser = null;
let activeVerificationCode = null;
let forgotPasswordTargetEmail = null;
let forgotPasswordActiveCode = null;

/* SHA-256 ÖZETLEME (HASH) FONKSİYONU (Web Crypto + Saf JS Yedekli - file:// Uyumlu) */
function pureJsSha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = (pureJsSha256.h = pureJsSha256.h || []);
  const k = (pureJsSha256.k = pureJsSha256.k || []);
  let primeCounter = k[lengthProperty];
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;
  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const a = hash[0],
        e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

async function hashPassword(rawPassword) {
  const str = String(rawPassword || '');
  if (str.startsWith('sha256:')) return str;
  const salted = `2x_salt_v1_${encodeURIComponent(str)}`;
  try {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(salted);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `sha256:${hashHex}`;
    }
  } catch (e) {}
  return `sha256:${pureJsSha256(salted)}`;
}

async function verifyPasswordMatch(inputPlain, storedPassword) {
  if (!storedPassword) return false;
  if (String(storedPassword).startsWith('sha256:')) {
    const hashedInput = await hashPassword(inputPlain);
    return hashedInput === storedPassword;
  }
  return String(inputPlain) === String(storedPassword);
}

/* ŞİFREYİ GÖSTER / GİZLE FONKSİYONU */
function togglePasswordVisibility(inputId, btnEl) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const isPass = inp.type === 'password';
  inp.type = isPass ? 'text' : 'password';
  if (btnEl) btnEl.textContent = isPass ? '🙈' : '👁️';
}

function recheckSecurityShield() {
  const lockEl = document.getElementById('securityLockOverlay');
  if (!lockEl) return;
  lockEl.classList.remove('active');
}

(function initSecurityShield() {
  document.addEventListener('contextmenu', (e) => {
    if (!ownerSecurityBypass) e.preventDefault();
  });
  document.addEventListener('keydown', (e) => {
if (ownerSecurityBypass) return;
    const key = (e.key || '').toLowerCase();
    if (e.key === 'F12' || e.keyCode === 123 || (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) || (e.ctrlKey && ['u', 's'].includes(key))) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });
  setInterval(() => {
    if (ownerSecurityBypass) return;
    const lockEl = document.getElementById('securityLockOverlay');
    if (!lockEl) return;
    const dpr = window.devicePixelRatio || 1;
    const wDiff = window.outerWidth - (window.innerWidth * dpr);
    const hDiff = window.outerHeight - (window.innerHeight * dpr);
    if ((wDiff > 280 || hDiff > 280) && window.outerWidth > 760 && dpr === 1) {
      lockEl.classList.add('active');
    } else {
      lockEl.classList.remove('active');
    }
  }, 1500);
})();

/* ANA SAYFA SIKÇA SORULAN SORULAR (AKORDEON) */
function toggleFaqItem(btnEl) {
  if (!btnEl || !btnEl.parentElement) return;
  const item = btnEl.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

/* SATIN ALMA VE ÖDEME MODALI FONKSİYONLARI (1.900 TL & KUVEYT TÜRK IBAN) */
function openPurchaseModal(defaultTab = 'card') {
  if (typeof stopActiveTimers === 'function') stopActiveTimers();
  switchPaymentTab(defaultTab);
  const fb = document.getElementById('purchaseFeedbackMsg');
  if (fb) fb.textContent = '';
  const ibanFb = document.getElementById('ibanFeedbackMsg');
  if (ibanFb) ibanFb.textContent = '';
  document.getElementById('purchaseModal')?.classList.add('open');
}

function closePurchaseModal() {
  document.getElementById('purchaseModal')?.classList.remove('open');
}

function switchPaymentTab(tabName) {
  const isIban = tabName === 'iban';
  document.getElementById('payTabCardBtn')?.classList.toggle('active', !isIban);
  document.getElementById('payTabIbanBtn')?.classList.toggle('active', isIban);
  const cardSec = document.getElementById('paymentCardSection');
  const ibanSec = document.getElementById('paymentIbanSection');
  if (cardSec) cardSec.style.display = isIban ? 'none' : 'flex';
  if (ibanSec) ibanSec.style.display = isIban ? 'flex' : 'none';
}

function formatCardNumberInput(inp) {
  const digits = (inp.value || '').replace(/\D/g, '').slice(0, 16);
  inp.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatCardExpiryInput(inp) {
  const digits = (inp.value || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    inp.value = digits.slice(0, 2) + '/' + digits.slice(2, 4);
  } else {
    inp.value = digits;
  }
}

function copyIbanText() {
  const inp = document.getElementById('ibanCopyInput');
  const fb = document.getElementById('ibanFeedbackMsg');
  if (!inp) return;
  inp.select();
  navigator.clipboard?.writeText(inp.value).catch(() => document.execCommand('copy'));
  if (fb) fb.textContent = '📋 Kuveyt Türk IBAN numarası panoya kopyalandı!';
}

function handleCardCheckoutSubmit() {
  const fullName = (document.getElementById('payFullName')?.value || '').trim();
  const email = (document.getElementById('payEmail')?.value || '').trim();
  const holder = (document.getElementById('cardHolderName')?.value || '').trim();
  const cardNo = (document.getElementById('cardNumberInput')?.value || '').replace(/\s+/g, '');
  const exp = (document.getElementById('cardExpiryInput')?.value || '').trim();
  const cvv = (document.getElementById('cardCvvInput')?.value || '').trim();
  const fb = document.getElementById('purchaseFeedbackMsg');

  if (!fullName || !email || !email.includes('@')) {
    if (fb) { fb.style.color = 'var(--danger)'; fb.textContent = '✗ Lütfen Ad Soyad ve geçerli E-Posta adresinizi girin.'; }
    return;
  }
  if (!holder || cardNo.length < 15 || exp.length < 4 || cvv.length < 3) {
    if (fb) { fb.style.color = 'var(--danger)'; fb.textContent = '✗ Lütfen kart bilgilerini eksiksiz kontrol edin.'; }
    return;
  }

  const expParts = exp.split('/');
  const monthNum = parseInt(expParts[0], 10);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    if (fb) { fb.style.color = 'var(--danger)'; fb.textContent = '✗ Son kullanma tarihi ay bilgisi (01-12) geçersiz.'; }
    return;
  }

  if (fb) {
    fb.style.color = 'var(--accent)';
    fb.textContent = '🔄 Ödeme talebiniz alındı, öğrenci hesabı oluşturma adımına yönlendiriliyorsunuz...';
  }

  setTimeout(() => {
    closePurchaseModal();
    const parts = fullName.split(/\s+/);
    const fName = parts[0] || '';
    const lName = parts.slice(1).join(' ') || '';
    const rFirst = document.getElementById('regFirstName');
    const rLast = document.getElementById('regLastName');
    const rMail = document.getElementById('regEmail');
    if (rFirst) rFirst.value = fName;
    if (rLast) rLast.value = lName;
    if (rMail) rMail.value = email;
    openRegisterModal();
  }, 800);
}

/*****************************************************************
 * SİTE METİNLERİ (YASAL METİNLER, SSS VE VİDEOLAR)
 *****************************************************************/
const LEGAL_DOCUMENTS = {
  kvkk: { title: '📜 6698 Sayılı KVKK Kapsamında Aydınlatma Metni', html: '' },
  terms: { title: '⚖️ Kullanım ve Hizmet Koşulları Sözleşmesi', html: '' },
  privacy: { title: '🔒 Gizlilik ve Kişisel Verileri Koruma Politikası', html: '' },
  sales: { title: '💳 Mesafeli Satış Sözleşmesi ve İptal / İade Koşulları', html: '' }
};

let FAQ_ITEMS = [];
let INTRO_VIDEOS = [];
let activeVideoIdx = 0;

function renderFaqSection() {
  const container = document.getElementById('faqAccordionContainer');
  if (!container) return;
  if (!Array.isArray(FAQ_ITEMS) || FAQ_ITEMS.length === 0) {
    container.innerHTML = `<div class="faq-item"><div class="faq-answer-box" style="display:block;">Sıkça sorulan sorular yükleniyor...</div></div>`;
    return;
  }
  container.innerHTML = FAQ_ITEMS.map((item) => `
    <div class="faq-item">
      <button type="button" class="faq-question-btn" onclick="toggleFaqItem(this)">
        <span>${item.question}</span>
        <span class="faq-arrow">▼</span>
      </button>
      <div class="faq-answer-box">
        ${item.answer}
      </div>
    </div>
  `).join('');
}

function getRegisterCheckboxForLegalKey(docKey) {
  if (docKey === 'kvkk') return document.getElementById('regKvkkAccept');
  if (docKey === 'terms') return document.getElementById('regTermsAccept');
  if (docKey === 'privacy') return document.getElementById('regPrivacyAccept');
  return null;
}

function getModalElementsForLegalKey(docKey) {
  const key = ['kvkk', 'terms', 'privacy', 'sales'].includes(docKey) ? docKey : 'kvkk';
  return {
    key,
    modalEl: document.getElementById(`${key}Modal`),
    titleEl: document.getElementById(`${key}ModalTitle`),
    bodyEl: document.getElementById(`${key}ModalBody`),
    errorEl: document.getElementById(`${key}ModalError`),
    confirmBtnEl: document.getElementById(`${key}ConfirmBtn`)
  };
}

async function openLegalModal(docKey = 'kvkk', isFromRegister = false) {
  if (typeof ensureSiteMetinleriLoaded === 'function') {
    await ensureSiteMetinleriLoaded();
  }

  const { key, modalEl, titleEl, bodyEl, errorEl, confirmBtnEl } = getModalElementsForLegalKey(docKey);
  const doc = LEGAL_DOCUMENTS[key] || LEGAL_DOCUMENTS.kvkk;

  if (titleEl) titleEl.textContent = doc.title;
  if (errorEl) errorEl.textContent = '';

  const regChk = getRegisterCheckboxForLegalKey(key);
  const alreadyChecked = regChk ? regChk.checked : false;

  if (bodyEl) {
    if (isFromRegister && key !== 'sales') {
      bodyEl.innerHTML = `
        ${doc.html}
        <div class="legal-end-confirm-box" style="margin-top:1.1rem; padding:0.75rem 0.9rem; background:var(--accent-soft); border:1px solid var(--accent); border-radius:10px;">
          <label style="display:flex; align-items:center; gap:0.55rem; font-weight:800; color:var(--text-primary); cursor:pointer;">
            <input type="checkbox" id="legalInlineChk_${key}" ${alreadyChecked ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--accent); cursor:pointer;" onchange="onLegalInlineCheckChange('${key}', this.checked)" />
            <span><strong>${doc.title}</strong> metnini sonuna kadar okudum, anladım ve kabul ediyorum.</span>
          </label>
        </div>
      `;
    } else {
      bodyEl.innerHTML = doc.html;
    }
    bodyEl.scrollTop = 0;
  }

  if (confirmBtnEl) {
    confirmBtnEl.style.display = (isFromRegister && key !== 'sales') ? 'inline-flex' : 'none';
  }

  if (modalEl) {
    modalEl.style.zIndex = '260';
    modalEl.classList.add('open');
  }
}

function onLegalInlineCheckChange(docKey, isChecked) {
  const { errorEl } = getModalElementsForLegalKey(docKey);
  if (errorEl) errorEl.textContent = '';
  const regChk = getRegisterCheckboxForLegalKey(docKey);
  if (regChk) regChk.checked = !!isChecked;
}

function confirmSpecificLegalModal(docKey) {
  const inlineChk = document.getElementById(`legalInlineChk_${docKey}`);
  const { errorEl } = getModalElementsForLegalKey(docKey);

  if (!inlineChk || !inlineChk.checked) {
    if (errorEl) {
      errorEl.textContent = '✗ Devam etmek için lütfen metnin sonundaki "Okudum, anladım ve kabul ediyorum" kutucuğunu işaretleyin.';
    }
    return;
  }

  const regChk = getRegisterCheckboxForLegalKey(docKey);
  if (regChk) regChk.checked = true;

  const regErr = document.getElementById('registerErrorMsg');
  if (regErr) regErr.textContent = '';

  closeSpecificLegalModal(docKey);
}

function closeSpecificLegalModal(docKey) {
  const { modalEl, errorEl } = getModalElementsForLegalKey(docKey);
  if (errorEl) errorEl.textContent = '';
  if (modalEl) modalEl.classList.remove('open');
}

function closeLegalModal() {
  ['kvkk', 'terms', 'privacy', 'sales'].forEach(k => closeSpecificLegalModal(k));
}

/*****************************************************************
 * 5 OKUMA HIZI SINIFLANDIRMASI VE TEKİL SERTİFİKA KADEMELERİ
 *****************************************************************/
const SPEED_CLASSIFICATIONS = [
  {
    id: 'slow',
    tierOrder: 1,
    name: 'Çok Yavaş',
    rangeText: '160 kelime altı',
    minWpm: 0,
    maxWpm: 159,
    startStage: 1,
    milestoneStage: 3,
    milestoneWpm: 150,
    desc: 'Kelimeleri tek tek seslendirme, parmakla takip etme veya sıkça geri dönme nedeniyle akışın koptuğu seviyedir.'
  },
  {
    id: 'tr_avg',
    tierOrder: 2,
    name: 'Normal / Ortalama Hız',
    rangeText: '160 – 220 kelime / dakika',
    minWpm: 160,
    maxWpm: 220,
    startStage: 4,
    milestoneStage: 9,
    milestoneWpm: 220,
    desc: 'Türkiye ortalamasının ve standart bir yetişkin okuma hızının bulunduğu temel kademedir.'
  },
  {
    id: 'normal',
    tierOrder: 3,
    name: 'Biraz Yüksek / Giriş Düzeyi Hızlı Okuma',
    rangeText: '220 – 350 kelime / dakika',
    minWpm: 221,
    maxWpm: 349,
    startStage: 10,
    milestoneStage: 16,
    milestoneWpm: 320,
    desc: 'Göz kaslarının biraz daha geliştiği, iç seslendirmenin kısmen azaltıldığı başlangıç seviyesidir.'
  },
  {
    id: 'fast',
    tierOrder: 4,
    name: 'Hızlı Okuyucu',
    rangeText: '350 – 800 kelime / dakika',
    minWpm: 350,
    maxWpm: 800,
    startStage: 17,
    milestoneStage: 27,
    milestoneWpm: 800,
    desc: 'Blok okuma tekniklerinin kullanıldığı, gözün satırda daha az duraklama yaptığı verimli hızlı okuma kademesidir.'
  },
  {
    id: 'pro',
    tierOrder: 5,
    name: 'Çok Hızlı / İleri Seviye',
    rangeText: '800 – 1300+ kelime / dakika',
    minWpm: 801,
    maxWpm: 5000,
    startStage: 28,
    milestoneStage: 30,
    milestoneWpm: 1000,
    desc: 'Profesyonel hızlı okuma eğitimi almış kişilerin, anlama oranını koruyarak ulaştığı üst düzey sınırdır.'
  }
];

function getSpeedClassificationForWpm(wpm) {
  const val = Number(wpm) || 120;
  for (const c of SPEED_CLASSIFICATIONS) {
    if (val >= c.minWpm && val <= c.maxWpm) return c;
  }
  return SPEED_CLASSIFICATIONS[0];
}

function getActiveCertificateClassification() {
  const completed = Array.isArray(appState.completedStages) ? appState.completedStages : [];
  const passedTests = Array.isArray(appState.passedClassTests) ? appState.passedClassTests : [];
  let highestCertTier = null;

  for (const cls of SPEED_CLASSIFICATIONS) {
    let allStagesInTierDone = true;
    for (let s = cls.startStage; s <= cls.milestoneStage; s++) {
      if (!completed.includes(s)) {
        allStagesInTierDone = false;
        break;
      }
    }
    if (passedTests.includes(cls.tierOrder) || allStagesInTierDone || completed.includes(cls.milestoneStage)) {
      highestCertTier = cls;
    }
  }
  return highestCertTier;
}

function buildEmbedlyBridgeUrl(videoId) {
  const innerEmbed = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return `https://cdn.embedly.com/widgets/media.html?src=${encodeURIComponent(innerEmbed)}&url=${encodeURIComponent(watchUrl)}&image=${encodeURIComponent(thumbUrl)}&type=text%2Fhtml&schema=youtube`;
}

function renderVideoStudio() {
  const playlistEl = document.getElementById('videoPlaylistContainer');
  const totalBadge = document.getElementById('playlistTotalBadge');
  if (!playlistEl) return;

  if (!Array.isArray(INTRO_VIDEOS) || INTRO_VIDEOS.length === 0) {
    if (totalBadge) totalBadge.textContent = `0 Ders`;
    playlistEl.innerHTML = `<div style="padding:1rem; font-size:0.82rem; color:var(--text-secondary);">Eğitim videoları yükleniyor...</div>`;
    return;
  }

  if (activeVideoIdx >= INTRO_VIDEOS.length) activeVideoIdx = 0;
  if (totalBadge) totalBadge.textContent = `${INTRO_VIDEOS.length} Ders`;

  playlistEl.innerHTML = INTRO_VIDEOS.map((v, idx) => `
    <button type="button" class="playlist-item-btn ${idx === activeVideoIdx ? 'active' : ''}" onclick="selectPlaylistVideo(${idx})">
      <div class="playlist-item-left">
        <div class="playlist-thumb" style="background-image:url('https://i.ytimg.com/vi/${v.id}/hqdefault.jpg');"></div>
        <div class="playlist-item-info">
          <span class="playlist-lesson-no">Ders ${idx + 1} • Shorts</span>
          <span class="playlist-lesson-title">${v.title}</span>
        </div>
      </div>
      <span class="playlist-play-icon">${idx === activeVideoIdx ? '▶' : '▷'}</span>
    </button>
  `).join('');

  updateVerticalPlayerStage(false);
}

function selectPlaylistVideo(idx) {
  activeVideoIdx = idx;
  renderVideoStudio();
  updateVerticalPlayerStage(true);
}

function updateVerticalPlayerStage(autoPlay = false) {
  const v = INTRO_VIDEOS[activeVideoIdx] || INTRO_VIDEOS[0];
  const badgeEl = document.getElementById('activeVideoBadge');
  const titleEl = document.getElementById('activeVideoTitle');
  const stageEl = document.getElementById('verticalVideoStage');
  if (!stageEl || !v) return;

  if (badgeEl) badgeEl.textContent = `Ders ${activeVideoIdx + 1}`;
  if (titleEl) titleEl.textContent = v.title;

  if (!autoPlay) {
    stageEl.innerHTML = `
      <div class="video-poster-cover" style="background-image:url('https://i.ytimg.com/vi/${v.id}/hqdefault.jpg');" onclick="updateVerticalPlayerStage(true)">
        <div class="video-play-circle">▶</div>
      </div>
    `;
    return;
  }

  const isFileProtocol = window.location.protocol === 'file:';
  const playerSrc = isFileProtocol
    ? buildEmbedlyBridgeUrl(v.id)
    : `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`;

  stageEl.innerHTML = `
    <div class="embed-shield-top"></div>
    <div class="embed-shield-bottom-right"></div>
    <iframe
      src="${playerSrc}"
      scrolling="no"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  `;
}

const MALE_FIGURE_SVG = `<svg viewBox="0 0 64 64" width="100%" height="100%" fill="currentColor"><path d="M32 10c-6.6 0-11.5 4.8-11.5 11.5 0 2.8.9 5.5 2.4 7.6 1.9 2.7 5.2 4.9 9.1 4.9s7.2-2.2 9.1-4.9c1.5-2.1 2.4-4.8 2.4-7.6C43.5 14.8 38.6 10 32 10z" opacity="0.95"/><circle cx="32" cy="21.5" r="9.5"/><path d="M12 54c0-9.5 8.8-16 20-16s20 6.5 20 16v2H12v-2z"/></svg>`;
const FEMALE_FIGURE_SVG = `<svg viewBox="0 0 64 64" width="100%" height="100%" fill="currentColor"><path d="M32 9c-8.5 0-14.5 6.2-14.5 15.2 0 5.4 1.6 10.6 3.8 13.8h5.2c-1.8-2.6-3-6.2-3-10.5 0-5.2 3.8-9.2 8.5-9.2s8.5 4 8.5 9.2c0 4.3-1.2 7.9-3 10.5h5.2c2.2-3.2 3.8-8.4 3.8-13.8C46.5 15.2 40.5 9 32 9z" opacity="0.9"/><circle cx="32" cy="22.5" r="8.8"/><path d="M14 55c0-8.8 7.8-15.2 18-15.2S50 46.2 50 55v1H14v-1z"/></svg>`;

const certLogoImg = new Image();
certLogoImg.src = 'sn.png';

let selectedRegisterGender = 'male';
let selectedProfileGender = 'male';
let currentView = 'home';
let isGuestTestActive = false;

function selectRegisterGender(g) {
  selectedRegisterGender = g === 'female' ? 'female' : 'male';
  const mEl = document.getElementById('genderOptMale');
  const fEl = document.getElementById('genderOptFemale');
  if (mEl) mEl.className = 'gender-option ' + (selectedRegisterGender === 'male' ? 'selected-male' : '');
  if (fEl) fEl.className = 'gender-option ' + (selectedRegisterGender === 'female' ? 'selected-female' : '');
  const prev = document.getElementById('regAvatarPreview');
  if (prev) {
    prev.className = 'gender-avatar reg-avatar-preview ' + (selectedRegisterGender === 'female' ? 'female' : 'male');
    prev.innerHTML = selectedRegisterGender === 'female' ? FEMALE_FIGURE_SVG : MALE_FIGURE_SVG;
  }
}

function isAdminUser() {
  if (!currentUser) return false;
  const userLvl = String(currentUser.level || currentUser.seviye || currentUser.role || '').trim().toLowerCase();
  const isAdm = userLvl === 'admin' || userLvl === 'yönetici' || userLvl === 'yonetici';
  ownerSecurityBypass = isAdm;
  return isAdm;
}

function setArenaWidthCm(valCm, shouldSave = true) {
  let num = parseFloat(valCm);
  if (isNaN(num) || num < 20) num = 20;
  if (num > 35) num = 35;
  appState.arenaWidthCm = num;

  document.documentElement.style.setProperty('--arena-width', `${num}cm`);
  const lbl = document.getElementById('arenaWidthLabelTxt');
  if (lbl) lbl.textContent = `${num} cm`;
  const slider = document.getElementById('arenaWidthSlider');
  if (slider && parseFloat(slider.value) !== num) slider.value = String(num);

  if (shouldSave && currentUser) saveState();
}

/* SAYFA AYARLARI VE PALMING SÜRESİ (10 SN - 120 SN, VARSAYILAN: 30 SN) */
function setPalmingDurationSec(valSec, shouldSave = true) {
  let sec = parseInt(valSec, 10);
  if (isNaN(sec) || sec < 10) sec = 10;
  if (sec > 120) sec = 120;
  appState.palmingDurationSec = sec;

  const lbl = document.getElementById('palmingDurationLabelTxt');
  if (lbl) lbl.textContent = `${sec} sn`;
  const slider = document.getElementById('palmingDurationSlider');
  if (slider && parseInt(slider.value, 10) !== sec) slider.value = String(sec);
  const topBtn = document.getElementById('palmingTopBtn');
  if (topBtn) topBtn.innerHTML = `👁️ Palming (${sec}sn)`;
  const dropMeta = document.getElementById('dropdownPalmingMeta');
  if (dropMeta) dropMeta.textContent = `Sayfa Geçiş Efekti, Ses & Palming (${sec} sn)`;

  if (shouldSave && currentUser) saveState();
}

function openPageSettingsModal() {
  openPalmingSettingsModal();
}

function openPalmingSettingsModal() {
  if (typeof stopActiveTimers === 'function') stopActiveTimers();
  document.getElementById('userDropdownMenu')?.classList.remove('open');
  applyAppearanceControlsUI();
  setPalmingDurationSec(appState.palmingDurationSec || 30, false);
  document.getElementById('palmingSettingsModal')?.classList.add('open');
}

function closePalmingSettingsModal() {
  document.getElementById('palmingSettingsModal')?.classList.remove('open');
}

function setArenaCustomColor(colorKey, shouldSave = true) {
  appState.arenaCustomColor = colorKey || 'cream';
  document.documentElement.setAttribute('data-arena-color', appState.arenaCustomColor);
  document.querySelectorAll('.arena-color-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-ac') === appState.arenaCustomColor);
  });
  if (shouldSave && currentUser) saveState();
}

function resetAppearanceToDefaults() {
  setTheme('light', false);
  setArenaCustomColor('cream', false);
  setArenaWidthCm(22.5, false);
  appState.pageTurnEffectEnabled = false;
  appState.pageTurnSoundEnabled = false;
  applyAppearanceControlsUI();
  if (currentUser) saveState();
}

function togglePageTurnEffect(enabled) {
  appState.pageTurnEffectEnabled = !!enabled;
  saveState();
}

function togglePageTurnSound(enabled) {
  appState.pageTurnSoundEnabled = !!enabled;
  if (appState.pageTurnSoundEnabled) {
    playPageTurnSound();
  }
  saveState();
}

function applyAppearanceControlsUI() {
  const effChk = document.getElementById('pageTurnEffectChk');
  const sndChk = document.getElementById('pageTurnSoundChk');
  if (effChk) effChk.checked = appState.pageTurnEffectEnabled === true;
  if (sndChk) sndChk.checked = appState.pageTurnSoundEnabled === true;
  setArenaCustomColor(appState.arenaCustomColor || 'cream', false);
  setPalmingDurationSec(appState.palmingDurationSec || 30, false);
}

function openGoalModal() {
  if (!currentUser) { openLoginModal(); return; }
  if (typeof stopActiveTimers === 'function') stopActiveTimers();
  document.getElementById('userDropdownMenu')?.classList.remove('open');
  if (typeof updateHeaderAndGoalUI === 'function') updateHeaderAndGoalUI();
  const inp = document.getElementById('customGoalInput');
  if (inp) inp.value = appState.targetWpm || 240;
  const fb = document.getElementById('goalModalFeedback');
  if (fb) fb.textContent = '';
  document.getElementById('goalModal')?.classList.add('open');
}

function closeGoalModal() {
  document.getElementById('goalModal')?.classList.remove('open');
}

function openAppearanceModal() {
  if (typeof stopActiveTimers === 'function') stopActiveTimers();
  document.getElementById('userDropdownMenu')?.classList.remove('open');
  applyAppearanceControlsUI();
  setArenaWidthCm(appState.arenaWidthCm || 22.5, false);
  document.getElementById('appearanceModal')?.classList.add('open');
}

function closeAppearanceModal() {
  document.getElementById('appearanceModal')?.classList.remove('open');
}

function startGuestOrUserSpeedTest() {
  if (typeof stopActiveTimers === 'function') stopActiveTimers();

  if (currentUser) {
    appState.currentStage = 0;
    saveState();
    switchView('training');
  } else {
    isGuestTestActive = true;
    currentView = 'guest-test';
    document.body.setAttribute('data-auth', 'guest-test');
    const homeEl = document.getElementById('homePageView');
    const trainEl = document.getElementById('trainingPageView');
    if (homeEl) homeEl.style.display = 'none';
    if (trainEl) trainEl.style.display = 'flex';
    const ws = document.getElementById('mainWorkspace');
    if (ws && typeof renderSpeedTestModule === 'function') {
      renderSpeedTestModule(ws, true);
    }
  }
}

function exitGuestTestToHome() {
  if (typeof stopActiveTimers === 'function') stopActiveTimers();
  isGuestTestActive = false;
  currentView = 'home';
  document.body.setAttribute('data-auth', 'guest');
  const trainEl = document.getElementById('trainingPageView');
  const homeEl = document.getElementById('homePageView');
  if (trainEl) trainEl.style.display = 'none';
  if (homeEl) homeEl.style.display = 'flex';
  renderVideoStudio();
  renderFaqSection();
}

function onBrandLogoClick() {
  if (currentUser) switchView('training');
  else exitGuestTestToHome();
}

function switchView(viewName) {
  if (typeof stopActiveTimers === 'function') stopActiveTimers();
  isGuestTestActive = false;

  if (currentUser) {
    viewName = 'training';
  } else if (viewName === 'training') {
    exitGuestTestToHome();
    openLoginModal();
    return;
  }

  currentView = viewName === 'training' ? 'training' : 'home';
  const homeEl = document.getElementById('homePageView');
  const trainEl = document.getElementById('trainingPageView');

  if (currentView === 'home') {
    document.body.setAttribute('data-auth', 'guest');
    if (homeEl) homeEl.style.display = 'flex';
    if (trainEl) trainEl.style.display = 'none';
    renderVideoStudio();
    renderFaqSection();
  } else {
    document.body.setAttribute('data-auth', 'authenticated');
    if (appState.currentStage === undefined || appState.currentStage < 0) {
      appState.currentStage = Math.max(1, appState.unlockedStage || 1);
    }
    if (homeEl) homeEl.style.display = 'none';
    if (trainEl) trainEl.style.display = 'flex';
    if (typeof updateHeaderAndGoalUI === 'function') updateHeaderAndGoalUI();
    if (typeof renderWorkspace === 'function') renderWorkspace(false);
  }
}

/*****************************************************************
 * GOOGLE FIREBASE REALTIME DATABASE (YEREL ÖNBELLEKSİZ DOĞRUDAN BULUT KAYIT)
 *****************************************************************/
const DEFAULT_CLOUD_API_URL = 'https://xhizliokuma-ca5c9-default-rtdb.firebaseio.com';
const FIREBASE_PROJECT_ID = 'xhizliokuma-ca5c9';
const DEFAULT_FIREBASE_API_KEY = 'AIzaSyCL8ro5olBRNxeSrpEV4qpShMVl2CzzHAI';

let currentUser = null;
let firebaseAppInitialized = false;

function emailToDbKey(emailStr) {
  return String(emailStr || '')
    .trim()
    .toLowerCase()
    .replace(/@/g, '_at_')
    .replace(/\./g, '_dot_')
    .replace(/[^a-z0-9_-]/g, '');
}

/* VARSAYILAN TEMA: AÇIK (light), VARSAYILAN EKRAN RENGİ: KİTAP KREMİ (cream),
   3B SAYFA ÇEVİRME EFEKTİ VE SESİ: SEÇİLİ DEĞİL (false) */
function createDefaultAppState() {
  return {
    theme: 'light',
    arenaCustomColor: 'cream',
    arenaWidthCm: 22.5,
    palmingDurationSec: 30,
    pageTurnEffectEnabled: false,
    pageTurnSoundEnabled: false,
    sidebarHidden: false,
    rightSidebarHidden: false,
    topBannerHidden: false,
    audioEnabled: true,
    initialWpm: 120,
    currentWpm: 120,
    maxAchievedWpm: 120,
    targetWpm: 240,
    lastComprehensionPct: 0,
    currentStage: 1,
    unlockedStage: 1,
    completedStages: [],
    passedClassTests: [],
    stageExerciseDone: {},
    currentExerciseIdx: 0,
    progressHistory: [],
    manualConfig: { wpm: 250, bpm: 95, blockReadSize: 2, schulteSize: 4, tachiMs: 250, anlamMs: 500, chunkSize: 2, wordPoolLevel: 2 }
  };
}

let appState = createDefaultAppState();
let masterDB = {
  users: {},
  activeUser: null,
  rememberMe: true,
  cloudApiUrl: DEFAULT_CLOUD_API_URL,
  firebaseApiKey: DEFAULT_FIREBASE_API_KEY,
  updatedAt: 0
};

function initIndexedDB() {
  return Promise.resolve(null);
}

function ensureFirebaseAuthReady() {
  if (typeof firebase === 'undefined' || !firebase.auth) return false;
  const activeKey = masterDB.firebaseApiKey || DEFAULT_FIREBASE_API_KEY;
  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp({
        apiKey: activeKey,
        authDomain: `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
        databaseURL: DEFAULT_CLOUD_API_URL,
        projectId: FIREBASE_PROJECT_ID
      });
    }
    firebaseAppInitialized = true;
    return true;
  } catch (e) {
    return false;
  }
}

async function getFirebaseIdTokenSafe() {
  try {
    if (firebaseAppInitialized && typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      return await firebase.auth().currentUser.getIdToken(false);
    }
  } catch (e) {}
  return null;
}

function mergePendingGuestTestIntoState(targetState) {
  if (typeof window.pendingGuestTestResult === 'object' && window.pendingGuestTestResult) {
    const g = window.pendingGuestTestResult;
    targetState.initialWpm = g.measuredRawWpm || targetState.initialWpm || 120;
    targetState.currentWpm = g.measuredRawWpm || targetState.currentWpm || 120;
    targetState.targetWpm = (g.measuredRawWpm || 120) * 2;
    targetState.lastComprehensionPct = g.comprehensionPct ?? targetState.lastComprehensionPct;
    if ((g.measuredRawWpm || 0) > (targetState.maxAchievedWpm || 0)) {
      targetState.maxAchievedWpm = g.measuredRawWpm;
    }
    const rec = g.recommendedStage || 1;
    for (let s = 1; s < rec; s++) {
      if (!targetState.completedStages.includes(s)) targetState.completedStages.push(s);
    }
    if (rec > (targetState.unlockedStage || 1)) {
      targetState.unlockedStage = rec;
    }
    targetState.currentStage = rec;
    if (!Array.isArray(targetState.progressHistory)) targetState.progressHistory = [];
    targetState.progressHistory.unshift({
      date: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      stageLabel: 'Okuma & Anlama Testi',
      exerciseTitle: g.testTitle || 'Seviye Ölçümü',
      resultLabel: `${g.measuredRawWpm} WPM • %${g.comprehensionPct} Anlama`,
      wpm: g.measuredRawWpm
    });
    window.pendingGuestTestResult = null;
  }
}

function buildNormalizedUserAppState(savedStateObj) {
  const def = createDefaultAppState();
  const savedState = savedStateObj || {};
  return {
    ...def,
    ...savedState,
    theme: savedState.theme || 'light',
    arenaCustomColor: savedState.arenaCustomColor || 'cream',
    arenaWidthCm: savedState.arenaWidthCm || 22.5,
    palmingDurationSec: savedState.palmingDurationSec || 30,
    pageTurnEffectEnabled: savedState.pageTurnEffectEnabled === true,
    pageTurnSoundEnabled: savedState.pageTurnSoundEnabled === true,
    currentStage: (savedState.currentStage && savedState.currentStage > 0) ? savedState.currentStage : (savedState.unlockedStage || 1),
    sidebarHidden: false,
    rightSidebarHidden: false,
    topBannerHidden: false,
    completedStages: Array.isArray(savedState.completedStages) ? savedState.completedStages : [],
    passedClassTests: Array.isArray(savedState.passedClassTests) ? savedState.passedClassTests : [],
    progressHistory: Array.isArray(savedState.progressHistory) ? savedState.progressHistory : [],
    manualConfig: { ...def.manualConfig, ...(savedState.manualConfig || {}) }
  };
}

/* GOOGLE, MICROSOFT VE FACEBOOK HESABI İLE TEK TIKLA OTURUM AÇMA */
async function handleSocialAuthClick(providerType = 'google') {
  const isRegisterOpen = document.getElementById('registerModal')?.classList.contains('open');
  const errEl = isRegisterOpen
    ? document.getElementById('registerErrorMsg')
    : (document.getElementById('loginErrorMsg') || document.getElementById('registerErrorMsg'));

  if (isRegisterOpen) {
    ['regKvkkAccept', 'regTermsAccept', 'regPrivacyAccept'].forEach(id => {
      const chk = document.getElementById(id);
      if (chk) chk.checked = true;
    });
  }

  const providerLabel = providerType === 'microsoft' ? 'Microsoft' : (providerType === 'facebook' ? 'Facebook' : 'Google');
  let sUser = null;

  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    if (ensureFirebaseAuthReady()) {
      try {
        if (errEl) {
          errEl.style.color = 'var(--accent)';
          errEl.textContent = `${providerLabel} hesap penceresi açılıyor...`;
        }
        let provider = null;
        if (providerType === 'microsoft') {
          provider = new firebase.auth.OAuthProvider('microsoft.com');
          provider.setCustomParameters({ prompt: 'select_account' });
        } else if (providerType === 'facebook') {
          provider = new firebase.auth.FacebookAuthProvider();
          provider.setCustomParameters({ display: 'popup' });
        } else {
          provider = new firebase.auth.GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
        }
        const result = await firebase.auth().signInWithPopup(provider);
        sUser = result.user;
      } catch (popupErr) {
        sUser = null;
      }
    }
  }

  if (!sUser) {
    const defaultDomain = providerType === 'microsoft' ? 'outlook.com' : (providerType === 'facebook' ? 'facebook.com' : 'gmail.com');
    const promptMail = prompt(
      `${providerLabel} ile Tek Tıkla Başlamak için ${providerLabel} e-posta adresinizi girin:`,
      `kullanici@${defaultDomain}`
    );
    if (!promptMail || !promptMail.trim().includes('@')) {
      if (errEl) errEl.textContent = '';
      return;
    }
    const cleanMail = promptMail.trim().toLowerCase();
    const defaultName = cleanMail.split('@')[0].replace(/[._-]+/g, ' ');
    const socialPass = `social_${providerType}_${emailToDbKey(cleanMail)}`;

    if (ensureFirebaseAuthReady()) {
      try {
        await firebase.auth().signInWithEmailAndPassword(cleanMail, socialPass);
      } catch (e) {
        await firebase.auth().createUserWithEmailAndPassword(cleanMail, socialPass).catch(() => {});
      }
    }

    sUser = {
      uid: emailToDbKey(cleanMail),
      email: cleanMail,
      displayName: defaultName.charAt(0).toUpperCase() + defaultName.slice(1)
    };
  }

  try {
    const emailRaw = (sUser.email || `${providerType}_${sUser.uid.slice(0, 8)}@2xokuma.com`).toLowerCase();
    const dbKey = emailToDbKey(emailRaw);
    const fullNameParts = (sUser.displayName || emailRaw.split('@')[0]).trim().split(/\s+/);
    const firstName = fullNameParts[0] || 'Öğrenci';
    const lastName = fullNameParts.slice(1).join(' ') || '';

    const existing = await dbGetUser(emailRaw);
    const defaultOAuthHash = await hashPassword(`${providerType}_${sUser.uid}`);

    currentUser = {
      username: dbKey,
      email: emailRaw,
      emailVerified: true,
      authProvider: (existing && existing.authProvider) ? existing.authProvider : providerType,
      hasCustomPassword: !!(existing && existing.hasCustomPassword),
      password: (existing && existing.password) ? existing.password : defaultOAuthHash,
      firstName: (existing && existing.firstName) ? existing.firstName : firstName,
      lastName: (existing && existing.lastName) ? existing.lastName : lastName,
      birthDate: (existing && existing.birthDate) ? existing.birthDate : '',
      city: (existing && existing.city) ? existing.city : '',
      level: (existing && (existing.level || existing.seviye)) ? (existing.level || existing.seviye) : 'Yetişkin',
      gender: (existing && existing.gender) ? existing.gender : 'male'
    };

    appState = buildNormalizedUserAppState(existing ? existing.state : null);
    mergePendingGuestTestIntoState(appState);

    await dbSaveUser({
      username: dbKey,
      displayName: emailRaw,
      email: emailRaw,
      emailVerified: true,
      authProvider: currentUser.authProvider,
      hasCustomPassword: currentUser.hasCustomPassword,
      password: currentUser.password,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      birthDate: currentUser.birthDate,
      city: currentUser.city,
      level: currentUser.level || 'Yetişkin',
      gender: currentUser.gender,
      state: appState
    });

    if (errEl) errEl.textContent = '';
    closeLoginModal();
    closeRegisterModal();
    applyLoadedUserSession();
    switchView('training');
  } catch (err) {
    if (errEl) {
      errEl.style.color = 'var(--danger)';
      errEl.textContent = `${providerLabel} oturumu tamamlanamadı: (${err.message || err})`;
    }
  }
}

function handleGoogleAuthClick() {
  handleSocialAuthClick('google');
}

async function loadMasterDatabase() {
  masterDB.cloudApiUrl = DEFAULT_CLOUD_API_URL;
  masterDB.firebaseApiKey = DEFAULT_FIREBASE_API_KEY;
  masterDB.users = {};
}

function persistMasterDatabaseSync() {
  // Yerel önbellek kullanılmaz; tüm üyelik ve ilerleme bilgileri Google Firebase'de tutulur.
}

function buildCloudUserEndpoint(baseUrl, usernameKey, idToken = null) {
  const cleanUrl = (baseUrl || DEFAULT_CLOUD_API_URL).trim().replace(/\/+$/, '');
  if (cleanUrl.includes('firebaseio.com') || cleanUrl.includes('firebasedatabase.app')) {
    const query = idToken ? `?auth=${encodeURIComponent(idToken)}` : '';
    return `${cleanUrl}/2x_users/${encodeURIComponent(usernameKey)}.json${query}`;
  }
  return `${cleanUrl}/users/${encodeURIComponent(usernameKey)}`;
}

async function silentPushToCloud(userRecord) {
  const activeUrl = masterDB.cloudApiUrl || DEFAULT_CLOUD_API_URL;
  if (!activeUrl || !userRecord || !userRecord.username) return;
  try {
    const token = await getFirebaseIdTokenSafe();
    const endpoint = buildCloudUserEndpoint(activeUrl, userRecord.username.toLowerCase(), token);
    const resp = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userRecord)
    });
    if (!resp.ok && token) {
      const fallbackEndpoint = buildCloudUserEndpoint(activeUrl, userRecord.username.toLowerCase(), null);
      await fetch(fallbackEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userRecord)
      });
    }
  } catch (e) {
    console.warn('Firebase bulut kayıt uyarısı:', e);
  }
}

async function silentDeleteFromCloud(usernameKey) {
  const activeUrl = masterDB.cloudApiUrl || DEFAULT_CLOUD_API_URL;
  if (!activeUrl || !usernameKey) return;
  try {
    const token = await getFirebaseIdTokenSafe();
    const endpoint = buildCloudUserEndpoint(activeUrl, usernameKey.toLowerCase(), token);
    await fetch(endpoint, { method: 'DELETE' });
  } catch (e) {}
}

async function dbGetUser(emailOrKey) {
  const raw = (emailOrKey || '').trim().toLowerCase();
  if (!raw) return null;
  const activeUrl = masterDB.cloudApiUrl || DEFAULT_CLOUD_API_URL;

  const candidateKeys = [emailToDbKey(raw), raw];
  if (raw.includes('@')) {
    candidateKeys.push(raw.split('@')[0].replace(/[^a-z0-9_.-]/g, ''));
  }

  const token = await getFirebaseIdTokenSafe();
  for (const k of candidateKeys) {
    if (!k) continue;
    try {
      let resp = await fetch(buildCloudUserEndpoint(activeUrl, k, token), { cache: 'no-store' });
      if (!resp.ok && token) {
        resp = await fetch(buildCloudUserEndpoint(activeUrl, k, null), { cache: 'no-store' });
      }
      if (resp.ok) {
        const cloudUser = await resp.json();
        if (cloudUser && (cloudUser.username || cloudUser.email)) {
          masterDB.users[k] = cloudUser;
          return cloudUser;
        }
      }
    } catch (e) {}
  }

  if (masterDB.users) {
    for (const k of candidateKeys) {
      if (masterDB.users[k]) return masterDB.users[k];
    }
  }
  return null;
}

async function dbSaveUser(userRecord) {
  const key = (userRecord.username || emailToDbKey(userRecord.email)).trim().toLowerCase();
  if (!key) return;
  const hashedPass = await hashPassword(userRecord.password || '');
  const recordToSave = { ...userRecord, username: key, password: hashedPass, updatedAt: Date.now() };
  if (!masterDB.users) masterDB.users = {};
  masterDB.users[key] = recordToSave;
  masterDB.activeUser = key;
  await silentPushToCloud(recordToSave);
}

/*****************************************************************
 * E-POSTA DOĞRULAMA KODU (6 HANELİ OTP) GÖNDERİM VE ONAY SİSTEMİ
 *****************************************************************/
async function sendVerificationCodeToEmail(targetEmail, fullName, codeStr, customNoticeElId = 'verifyDispatchNotice') {
  const noticeEl = document.getElementById(customNoticeElId);
  if (noticeEl) {
    noticeEl.innerHTML = `📨 <strong>${targetEmail}</strong> adresine 6 haneli doğrulama kodu gönderiliyor...`;
  }

  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: `2X Hızlı Okuma Eğitimi — Doğrulama Kodunuz: ${codeStr}`,
        _template: 'table',
        _captcha: 'false',
        Ad_Soyad: fullName,
        Dogrulama_Kodu: codeStr,
        Mesaj: `Merhaba ${fullName}, 2X Hızlı Okuma Eğitimi üyeliğinizi tamamlamak için 6 haneli doğrulama kodunuz: ${codeStr}`
      })
    });
  } catch (e) {}

  if (noticeEl) {
    noticeEl.innerHTML = `✅ 6 haneli doğrulama kodu <strong>${targetEmail}</strong> adresinize gönderildi. Lütfen e-posta gelen kutunuzu (veya Gereksiz/Spam klasörünü) kontrol edin.`;
  }
}

function openEmailVerifyModal(pendingUserObj) {
  pendingVerificationUser = pendingUserObj;
  activeVerificationCode = String(Math.floor(100000 + Math.random() * 900000));

  document.getElementById('verifyTargetEmailTxt').textContent = pendingUserObj.email;
  document.getElementById('emailVerifyCodeInput').value = '';
  document.getElementById('verifyCodeErrorMsg').textContent = '';

  closeRegisterModal();
  closeLoginModal();
  document.getElementById('emailVerifyModal')?.classList.add('open');

  const fullName = [pendingUserObj.firstName, pendingUserObj.lastName].filter(Boolean).join(' ');
  sendVerificationCodeToEmail(pendingUserObj.email, fullName, activeVerificationCode, 'verifyDispatchNotice');
  setTimeout(() => document.getElementById('emailVerifyCodeInput')?.focus(), 120);
}

function closeEmailVerifyModal() {
  document.getElementById('emailVerifyModal')?.classList.remove('open');
}

function resendEmailVerificationCode() {
  if (!pendingVerificationUser) return;
  activeVerificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const fullName = [pendingVerificationUser.firstName, pendingVerificationUser.lastName].filter(Boolean).join(' ');
  sendVerificationCodeToEmail(pendingVerificationUser.email, fullName, activeVerificationCode, 'verifyDispatchNotice');
}

async function confirmEmailVerificationCode() {
  const entered = (document.getElementById('emailVerifyCodeInput').value || '').trim();
  const errEl = document.getElementById('verifyCodeErrorMsg');

  if (!entered || entered.length < 6) {
    errEl.textContent = '✗ Lütfen 6 haneli doğrulama kodunu eksiksiz girin.';
    return;
  }
  if (entered !== activeVerificationCode) {
    errEl.textContent = '✗ Girdiğiniz doğrulama kodu hatalı! Lütfen kontrol edin.';
    return;
  }

  if (!pendingVerificationUser) return;
  const u = pendingVerificationUser;
  const dbKey = emailToDbKey(u.email);
  const firebaseSafePass = u.password.length >= 6 ? u.password : (u.password + '_2xokuma');
  const hashedPassword = await hashPassword(u.password);

  if (ensureFirebaseAuthReady()) {
    try {
      await firebase.auth().createUserWithEmailAndPassword(u.email, firebaseSafePass);
    } catch (fbErr) {
      if (fbErr && fbErr.code === 'auth/email-already-in-use') {
        await firebase.auth().signInWithEmailAndPassword(u.email, firebaseSafePass).catch(() => {});
      }
    }
  }

  currentUser = {
    username: dbKey,
    email: u.email,
    emailVerified: true,
    authProvider: 'email',
    hasCustomPassword: true,
    password: hashedPassword,
    firstName: u.firstName,
    lastName: u.lastName,
    birthDate: u.birthDate,
    city: u.city,
    level: u.level || 'Yetişkin',
    gender: u.gender
  };

  appState = buildNormalizedUserAppState(appState);
  mergePendingGuestTestIntoState(appState);

  await dbSaveUser({
    username: dbKey,
    displayName: u.email,
    email: u.email,
    emailVerified: true,
    authProvider: 'email',
    hasCustomPassword: true,
    password: hashedPassword,
    firstName: u.firstName,
    lastName: u.lastName,
    birthDate: u.birthDate,
    city: u.city,
    level: u.level || 'Yetişkin',
    gender: u.gender,
    state: appState
  });

  pendingVerificationUser = null;
  activeVerificationCode = null;
  closeEmailVerifyModal();
  applyLoadedUserSession();
  switchView('training');
}

/*****************************************************************
 * ŞİFREMİ UNUTTUM / ŞİFRE SIFIRLAMA SİSTEMİ
 *****************************************************************/
function openForgotPasswordModal() {
  const currentLoginMail = (document.getElementById('loginEmailInput')?.value || '').trim();
  closeLoginModal();
  const mailInp = document.getElementById('forgotEmailInput');
  if (mailInp) mailInp.value = currentLoginMail;
  const fb = document.getElementById('forgotFeedbackMsg');
  if (fb) fb.textContent = '';
  forgotPasswordTargetEmail = null;
  forgotPasswordActiveCode = null;
  document.getElementById('forgotPasswordModal')?.classList.add('open');
}

function closeForgotPasswordModal() {
  document.getElementById('forgotPasswordModal')?.classList.remove('open');
}

async function sendForgotPasswordCode() {
  const email = (document.getElementById('forgotEmailInput')?.value || '').trim().toLowerCase();
  const fb = document.getElementById('forgotFeedbackMsg');
  if (!email || !email.includes('@')) {
    if (fb) { fb.style.color = 'var(--danger)'; fb.textContent = '✗ Lütfen geçerli bir e-posta adresi girin.'; }
    return;
  }

  if (fb) { fb.style.color = 'var(--accent)'; fb.textContent = 'Hesap kontrol ediliyor ve şifreniz e-posta adresinize gönderiliyor...'; }
  const existing = await dbGetUser(email);
  if (!existing) {
    if (fb) { fb.style.color = 'var(--danger)'; fb.textContent = '✗ Bu e-posta adresine kayıtlı üye hesabı bulunamadı.'; }
    return;
  }

  const tempPassword = String(Math.floor(100000 + Math.random() * 900000));
  existing.password = await hashPassword(tempPassword);
  existing.hasCustomPassword = true;
  await dbSaveUser(existing);

  if (ensureFirebaseAuthReady()) {
    await firebase.auth().sendPasswordResetEmail(email).catch(() => {});
  }

  const fullName = [existing.firstName, existing.lastName].filter(Boolean).join(' ') || 'Üye';
  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: `2X Hızlı Okuma Eğitimi — Yeni Giriş Şifreniz`,
        _template: 'table',
        _captcha: 'false',
        Ad_Soyad: fullName,
        Yeni_Sifreniz: tempPassword,
        Bilgi: `Merhaba ${fullName}, hesabınıza giriş yapabileceğiniz yeni şifreniz: ${tempPassword} (Giriş yaptıktan sonra Profilim menüsünden şifrenizi değiştirebilirsiniz).`
      })
    });
  } catch (e) {}

  if (fb) {
    fb.style.color = 'var(--success)';
    fb.textContent = `✓ Yeni giriş şifreniz ${email} adresinize gönderildi! Lütfen e-postanızı kontrol edin.`;
  }
}

/* PROFİLİM FONKSİYONLARI */
function selectProfileGender(g) {
  selectedProfileGender = g === 'female' ? 'female' : 'male';
  const mEl = document.getElementById('profGenderMale');
  const fEl = document.getElementById('profGenderFemale');
  if (mEl) mEl.className = 'gender-option ' + (selectedProfileGender === 'male' ? 'selected-male' : '');
  if (fEl) fEl.className = 'gender-option ' + (selectedProfileGender === 'female' ? 'selected-female' : '');
  const prev = document.getElementById('profAvatarPreview');
  if (prev) {
    prev.className = 'gender-avatar ' + (selectedProfileGender === 'female' ? 'female' : 'male');
    prev.innerHTML = selectedProfileGender === 'female' ? FEMALE_FIGURE_SVG : MALE_FIGURE_SVG;
  }
}

function isOAuthUserWithoutCustomPassword(userObj) {
  if (!userObj) return false;
  if (userObj.hasCustomPassword) return false;
  const prov = userObj.authProvider || '';
  if (['google', 'microsoft', 'facebook'].includes(prov)) return true;
  const p = String(userObj.password || '');
  return p.startsWith('google_') || p.startsWith('microsoft_') || p.startsWith('facebook_');
}

function openProfileModal() {
  if (!currentUser) { openLoginModal(); return; }
  if (typeof stopActiveTimers === 'function') stopActiveTimers();
  document.getElementById('userDropdownMenu')?.classList.remove('open');

  document.getElementById('profEmailHeaderDisplay').textContent = currentUser.email || currentUser.username;
  document.getElementById('profFirstName').value = currentUser.firstName || '';
  document.getElementById('profLastName').value = currentUser.lastName || '';
  document.getElementById('profEmail').value = currentUser.email || '';
  document.getElementById('profBirthDate').value = currentUser.birthDate || '';
  document.getElementById('profCity').value = currentUser.city || '';
  const profLvlEl = document.getElementById('profLevel');
  if (profLvlEl && String(currentUser.level || '').toLowerCase() !== 'admin') {
    profLvlEl.value = currentUser.level || 'Yetişkin';
  }
  document.getElementById('profCurrentPassword').value = '';
  document.getElementById('profNewPassword').value = '';
  document.getElementById('profNewPasswordConfirm').value = '';
  document.getElementById('profileFeedbackMsg').textContent = '';

  const isOAuthNoPass = isOAuthUserWithoutCustomPassword(currentUser);
  const currPassField = document.getElementById('profCurrentPasswordField');
  const passTitle = document.getElementById('profPasswordSectionTitle');
  if (currPassField) currPassField.style.display = isOAuthNoPass ? 'none' : 'block';
  if (passTitle) {
    passTitle.textContent = isOAuthNoPass
      ? '🔒 Hesabınız İçin Şifre Belirleyin (İsteğe Bağlı)'
      : '🔒 Şifre Değiştir (İsteğe Bağlı)';
  }

  selectProfileGender(currentUser.gender || 'male');
  document.getElementById('profileModal')?.classList.add('open');
}

function closeProfileModal() {
  document.getElementById('profileModal')?.classList.remove('open');
}

async function saveProfileChanges() {
  if (!currentUser) return;
  const firstName = (document.getElementById('profFirstName').value || '').trim();
  const lastName = (document.getElementById('profLastName').value || '').trim();
  const email = (document.getElementById('profEmail').value || '').trim().toLowerCase();
  const birthDate = (document.getElementById('profBirthDate').value || '').trim();
  const city = (document.getElementById('profCity').value || '').trim();
  const currPass = (document.getElementById('profCurrentPassword').value || '').trim();
  const newPass = (document.getElementById('profNewPassword').value || '').trim();
  const newPassConf = (document.getElementById('profNewPasswordConfirm').value || '').trim();
  const fb = document.getElementById('profileFeedbackMsg');

  if (!firstName || !lastName) {
    fb.style.color = 'var(--danger)';
    fb.textContent = '✗ Ad ve Soyad alanları boş bırakılamaz.';
    return;
  }
  if (!email || !email.includes('@')) {
    fb.style.color = 'var(--danger)';
    fb.textContent = '✗ Lütfen geçerli bir e-posta adresi girin.';
    return;
  }

  const oldUsernameKey = (currentUser.username || emailToDbKey(currentUser.email)).toLowerCase();
  const newUsernameKey = emailToDbKey(email);

  if (newUsernameKey !== oldUsernameKey) {
    const existingOther = await dbGetUser(email);
    if (existingOther && existingOther.username && existingOther.username.toLowerCase() !== oldUsernameKey) {
      fb.style.color = 'var(--danger)';
      fb.textContent = '✗ Bu e-posta adresi başka bir öğrenci hesabı tarafından kullanılıyor.';
      return;
    }
  }

  const isOAuthNoPass = isOAuthUserWithoutCustomPassword(currentUser);
  let updatedPassword = currentUser.password;
  let updatedHasCustomPass = !!currentUser.hasCustomPassword;

  if (currPass || newPass || newPassConf) {
    if (!isOAuthNoPass) {
      const isCurrentValid = await verifyPasswordMatch(currPass, currentUser.password);
      if (!isCurrentValid) {
        fb.style.color = 'var(--danger)';
        fb.textContent = '✗ Mevcut şifrenizi yanlış girdiniz!';
        return;
      }
    }
    if (newPass.length < 4) {
      fb.style.color = 'var(--danger)';
      fb.textContent = '✗ Yeni şifre en az 4 karakter olmalıdır.';
      return;
    }
    if (newPass !== newPassConf) {
      fb.style.color = 'var(--danger)';
      fb.textContent = '✗ Yeni şifre ile tekrarı uyuşmuyor!';
      return;
    }
    updatedPassword = await hashPassword(newPass);
    updatedHasCustomPass = true;
  }

  currentUser.firstName = firstName;
  currentUser.lastName = lastName;
  currentUser.email = email;
  currentUser.username = newUsernameKey;
  const selectedLevel = (document.getElementById('profLevel')?.value || 'Yetişkin').trim();
  currentUser.birthDate = birthDate;
  currentUser.city = city;
  if (String(currentUser.level || currentUser.seviye || '').toLowerCase() !== 'admin') {
    currentUser.level = selectedLevel;
  }
  currentUser.gender = selectedProfileGender;
  currentUser.password = updatedPassword;
  currentUser.hasCustomPassword = updatedHasCustomPass;

  if (newUsernameKey !== oldUsernameKey) {
    if (masterDB.users && masterDB.users[oldUsernameKey]) {
      delete masterDB.users[oldUsernameKey];
    }
    await silentDeleteFromCloud(oldUsernameKey);
  }

  await saveState();
  updateUserTopBadge();
  document.getElementById('profEmailHeaderDisplay').textContent = email;

  document.getElementById('profCurrentPassword').value = '';
  document.getElementById('profNewPassword').value = '';
  document.getElementById('profNewPasswordConfirm').value = '';

  const currPassField = document.getElementById('profCurrentPasswordField');
  if (currPassField) currPassField.style.display = 'block';

  fb.style.color = 'var(--success)';
  fb.textContent = (newPass ? '✓ Profil bilgileriniz, e-posta adresiniz ve yeni şifreniz Firebase veritabanına kaydedildi!' : '✓ Profil bilgileriniz ve e-posta adresiniz Firebase veritabanında güncellendi!');
}

/* SADECE ADMİN KİLİDİ AÇIKKEN GÖRÜNEN VERİTABANI MODALI */
async function openDatabaseModal() {
  if (!isAdminUser()) return;
  if (typeof stopActiveTimers === 'function') stopActiveTimers();
  document.getElementById('userDropdownMenu')?.classList.remove('open');

  const apiUrl = (masterDB.cloudApiUrl || DEFAULT_CLOUD_API_URL || '').trim().replace(/\/+$/, '');
  const urlInp = document.getElementById('cloudApiUrlInput');
  if (urlInp) urlInp.value = apiUrl;

  const fb = document.getElementById('dbFeedbackMsg');
  document.getElementById('databaseModal')?.classList.add('open');

  if (apiUrl) {
    try {
      if (fb) { fb.style.color = 'var(--accent)'; fb.textContent = '☁️ Firebase bulut veritabanından tüm kullanıcılar yükleniyor...'; }
      const token = await getFirebaseIdTokenSafe();
      const query = token ? `?auth=${encodeURIComponent(token)}` : '';
      const baseEndpoint = (apiUrl.includes('firebaseio.com') || apiUrl.includes('firebasedatabase.app'))
        ? `${apiUrl}/2x_users.json`
        : `${apiUrl}/users`;
      let resp = await fetch(`${baseEndpoint}${query}`, { cache: 'no-store' });
      if (!resp.ok && token) {
        resp = await fetch(baseEndpoint, { cache: 'no-store' });
      }
      if (resp.ok) {
        const cloudUsersMap = await resp.json();
        masterDB.users = {};
        if (cloudUsersMap && typeof cloudUsersMap === 'object') {
          for (const k of Object.keys(cloudUsersMap)) {
            const uObj = cloudUsersMap[k];
            if (uObj && (uObj.username || uObj.email)) {
              masterDB.users[k.toLowerCase()] = uObj;
            }
          }
        }
      }
      if (fb) { fb.style.color = 'var(--success)'; fb.textContent = '✓ Firebase bulut veritabanı senkronize edildi.'; }
    } catch (e) {
      if (fb) { fb.style.color = 'var(--warning)'; fb.textContent = '⚠️ Bulut veritabanına ulaşılamadı.'; }
    }
  }

  renderDatabaseUsersTable();
}

function closeDatabaseModal() { document.getElementById('databaseModal')?.classList.remove('open'); }

async function saveCloudApiUrl() {
  const val = (document.getElementById('cloudApiUrlInput').value || DEFAULT_CLOUD_API_URL).trim().replace(/\/+$/, '');
  masterDB.cloudApiUrl = val;
  await openDatabaseModal();
}

function renderDatabaseUsersTable() {
  const tbody = document.getElementById('dbUsersTableBody');
  const countEl = document.getElementById('dbTotalUsersCount');
  if (!tbody) return;
  const usersList = Object.values(masterDB.users || {});
  if (countEl) countEl.textContent = String(usersList.length);
  if (usersList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1rem; color:var(--text-muted);">Kayıtlı kullanıcı bulunmuyor.</td></tr>`;
    return;
  }
  tbody.innerHTML = usersList.map(u => {
    const st = u.state || {};
    const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || '-';
    const compCount = Array.isArray(st.completedStages) ? st.completedStages.filter(s => s >= 1 && s <= 30).length : 0;
    const emailDisplay = u.email || u.displayName || u.username;
    const levelDisplay = u.level || u.seviye || 'Yetişkin';
    return `<tr><td><strong>${emailDisplay}</strong></td><td>${fullName}</td><td><span class="stage-status-badge">${levelDisplay}</span></td><td>${[u.city, u.birthDate].filter(Boolean).join(' / ') || '-'}</td><td style="color:var(--accent); font-weight:700;">${st.initialWpm || 120} → ${st.currentWpm || 120} WPM</td><td>${compCount} / 30 Aşama</td></tr>`;
  }).join('');
}

function exportDatabaseFile() {
  const blob = new Blob([JSON.stringify(masterDB, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `2x_veritabani_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function importDatabaseFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(String(e.target.result || ''));
      if (!parsed || !parsed.users) throw new Error();
      for (const k of Object.keys(parsed.users)) {
        const uRec = parsed.users[k];
        uRec.password = await hashPassword(uRec.password || '');
        masterDB.users[k.toLowerCase()] = uRec;
        await silentPushToCloud(uRec);
      }
      renderDatabaseUsersTable();
    } catch (err) {}
  };
  reader.readAsText(file);
}

/* E-POSTA ADRESİ VE ŞİFRE İLE GİRİŞ (DOĞRUDAN GOOGLE FIREBASE İLE SENKRONİZE) */
async function handleUserLogin() {
  const rawEmail = (document.getElementById('loginEmailInput').value || '').trim().toLowerCase();
  const password = (document.getElementById('loginPasswordInput').value || '').trim();
  const errEl = document.getElementById('loginErrorMsg');

  if (!rawEmail || !rawEmail.includes('@') || !password) {
    errEl.style.color = 'var(--danger)';
    errEl.textContent = 'Lütfen geçerli e-posta adresinizi ve şifrenizi girin.';
    return;
  }
  errEl.style.color = 'var(--accent)';
  errEl.textContent = 'Firebase veritabanından kontrol ediliyor...';

  const existing = await dbGetUser(rawEmail);
  errEl.style.color = 'var(--danger)';
  if (!existing) {
    errEl.textContent = 'Bu e-posta adresine ait hesap bulunamadı! Lütfen Kayıt Ol düğmesinden kaydolun.';
    return;
  }

  const isPassValid = await verifyPasswordMatch(password, existing.password);
  if (!isPassValid) {
    errEl.textContent = 'Şifre hatalı! Lütfen kontrol edip tekrar deneyin.';
    return;
  }

  if (ensureFirebaseAuthReady()) {
    const firebaseSafePass = password.length >= 6 ? password : (password + '_2xokuma');
    try {
      await firebase.auth().signInWithEmailAndPassword(rawEmail, firebaseSafePass);
    } catch (fbLoginErr) {
      if (fbLoginErr && (fbLoginErr.code === 'auth/user-not-found' || fbLoginErr.code === 'auth/invalid-credential')) {
        await firebase.auth().createUserWithEmailAndPassword(rawEmail, firebaseSafePass).catch(() => {});
      }
    }
  }

  const hashedPassword = await hashPassword(password);
  const dbKey = existing.username || emailToDbKey(rawEmail);
  currentUser = {
    username: dbKey,
    email: existing.email || rawEmail,
    emailVerified: true,
    authProvider: existing.authProvider || 'email',
    hasCustomPassword: true,
    password: hashedPassword,
    firstName: existing.firstName || rawEmail.split('@')[0],
    lastName: existing.lastName || '',
    birthDate: existing.birthDate || '',
    city: existing.city || '',
    level: existing.level || existing.seviye || 'Yetişkin',
    gender: existing.gender || 'male'
  };

  appState = buildNormalizedUserAppState(existing.state);
  mergePendingGuestTestIntoState(appState);

  await dbSaveUser({
    username: dbKey,
    displayName: currentUser.email,
    email: currentUser.email,
    emailVerified: true,
    authProvider: currentUser.authProvider,
    hasCustomPassword: true,
    password: currentUser.password,
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    birthDate: currentUser.birthDate,
    city: currentUser.city,
    gender: currentUser.gender,
    state: appState
  });

  errEl.textContent = '';
  closeLoginModal();
  applyLoadedUserSession();
  switchView('training');
}

/* E-POSTA VE ŞİFRE İLE KAYIT + ZORUNLU İÇERİDEN ONAYLI KVKK/KOŞULLAR/GİZLİLİK */
async function handleUserRegister() {
  const firstName = (document.getElementById('regFirstName').value || '').trim();
  const lastName = (document.getElementById('regLastName').value || '').trim();
  const email = (document.getElementById('regEmail').value || '').trim().toLowerCase();
  const password = (document.getElementById('regPassword').value || '').trim();
  const birthDate = (document.getElementById('regBirthDate').value || '').trim();
  const city = (document.getElementById('regCity').value || '').trim();
  const level = (document.getElementById('regLevel')?.value || 'Lise (LGS/YKS)').trim();

  const kvkkAccepted = document.getElementById('regKvkkAccept')?.checked === true;
  const termsAccepted = document.getElementById('regTermsAccept')?.checked === true;
  const privacyAccepted = document.getElementById('regPrivacyAccept')?.checked === true;

  const errEl = document.getElementById('registerErrorMsg');
  if (errEl) errEl.style.color = 'var(--danger)';

  if (!firstName || !lastName || !email || !birthDate || !city || password.length < 4) {
    errEl.textContent = '✗ Lütfen tüm kişisel bilgi alanlarını doldurun (şifre en az 4 karakter olmalıdır).';
    return;
  }
  if (!email.includes('@') || !email.includes('.')) {
    errEl.textContent = '✗ Lütfen geçerli bir e-posta adresi girin.';
    return;
  }
  if (!kvkkAccepted || !termsAccepted || !privacyAccepted) {
    errEl.textContent = '✗ Kayıt olabilmek için lütfen KVKK Aydınlatma Metni, Kullanım Koşulları ve Gizlilik Politikası bağlantılarına tıklayıp içeriden onaylayın.';
    return;
  }

  const existing = await dbGetUser(email);
  if (existing) {
    errEl.textContent = '✗ Bu e-posta adresiyle kayıtlı bir hesap zaten mevcut. Giriş ekranından oturum açabilirsiniz.';
    return;
  }

  errEl.textContent = '';
  openEmailVerifyModal({
    firstName,
    lastName,
    email,
    password,
    birthDate,
    city,
    level,
    gender: selectedRegisterGender
  });
}

function toggleUserDropdown(event) {
  if (event) event.stopPropagation();
  document.getElementById('userDropdownMenu')?.classList.toggle('open');
}
window.addEventListener('click', () => { document.getElementById('userDropdownMenu')?.classList.remove('open'); });

function logoutUser() {
  if (typeof stopActiveTimers === 'function') stopActiveTimers();
  try {
    if (firebaseAppInitialized && typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().signOut().catch(() => {});
    }
  } catch (e) {}
  currentUser = null;
  ownerSecurityBypass = false;
  masterDB.activeUser = null;
  document.getElementById('userDropdownMenu')?.classList.remove('open');
  appState = createDefaultAppState();
  applyLoadedUserSession();
  exitGuestTestToHome();
}

function applyLoadedUserSession() {
  document.body.setAttribute('data-auth', currentUser ? 'authenticated' : 'guest');
  setTheme(appState.theme || 'light', false);
  setArenaCustomColor(appState.arenaCustomColor || 'cream', false);
  setArenaWidthCm(appState.arenaWidthCm || 22.5, false);
  setPalmingDurationSec(appState.palmingDurationSec || 30, false);
  applyAppearanceControlsUI();
  applySidebarState();
  applyRightSidebarState();
  applyTopBannerState();
  updateAudioBtnUI();
  updateUserTopBadge();
  if (typeof updateHeaderAndGoalUI === 'function') updateHeaderAndGoalUI();
}

function updateUserTopBadge() {
  const loginBtn = document.getElementById('topLoginBtn');
  const profilePill = document.getElementById('userProfileWidget');
  const logoEl = document.getElementById('topUserGenderLogo');
  const nameEl = document.getElementById('topUserNameTxt');
  const adminDbBtn = document.getElementById('adminDbDropdownBtn');
  const adminTextMgrBtn = document.getElementById('adminTextMgrDropdownBtn');

  if (currentUser) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (profilePill) profilePill.style.display = 'flex';
    const isFemale = currentUser.gender === 'female';
    logoEl.className = 'gender-avatar ' + (isFemale ? 'female' : 'male');
    logoEl.innerHTML = isFemale ? FEMALE_FIGURE_SVG : MALE_FIGURE_SVG;
    nameEl.textContent = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.email;

    const showAdmin = isAdminUser();
    if (adminDbBtn) {
      adminDbBtn.style.setProperty('display', showAdmin ? 'flex' : 'none', 'important');
    }
    if (adminTextMgrBtn) {
      adminTextMgrBtn.style.setProperty('display', showAdmin ? 'flex' : 'none', 'important');
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (profilePill) profilePill.style.display = 'none';
    if (adminDbBtn) adminDbBtn.style.setProperty('display', 'none', 'important');
    if (adminTextMgrBtn) adminTextMgrBtn.style.setProperty('display', 'none', 'important');
  }
}

function openLoginModal() {
  const errEl = document.getElementById('loginErrorMsg');
  if (errEl) errEl.textContent = '';
  document.getElementById('loginModal')?.classList.add('open');
}
function closeLoginModal() { document.getElementById('loginModal')?.classList.remove('open'); }
function openRegisterModal() {
  selectRegisterGender(selectedRegisterGender);
  ['regKvkkAccept', 'regTermsAccept', 'regPrivacyAccept'].forEach(id => {
    const chk = document.getElementById(id);
    if (chk) chk.checked = false;
  });
  const errEl = document.getElementById('registerErrorMsg');
  if (errEl) errEl.textContent = '';
  document.getElementById('registerModal')?.classList.add('open');
}
function closeRegisterModal() { document.getElementById('registerModal')?.classList.remove('open'); }
function switchToRegisterModal() { closeLoginModal(); openRegisterModal(); }

function addProgressLogEntry(stageLabel, exerciseTitle, resultLabel, wpmVal) {
  if (!Array.isArray(appState.progressHistory)) appState.progressHistory = [];
  appState.progressHistory.unshift({
    date: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    stageLabel, exerciseTitle, resultLabel,
    wpm: wpmVal || appState.currentWpm || 120
  });
  if (appState.progressHistory.length > 60) appState.progressHistory = appState.progressHistory.slice(0, 60);
}

async function saveState() {
  if (typeof updateHeaderAndGoalUI === 'function') updateHeaderAndGoalUI();
  if (currentUser) {
    const dbKey = currentUser.username || emailToDbKey(currentUser.email);
    await dbSaveUser({
      username: dbKey,
      displayName: currentUser.email || dbKey,
      email: currentUser.email || '',
      emailVerified: true,
      authProvider: currentUser.authProvider || 'email',
      hasCustomPassword: !!currentUser.hasCustomPassword,
      password: currentUser.password,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      birthDate: currentUser.birthDate,
      city: currentUser.city,
      level: currentUser.level || 'Yetişkin',
      gender: currentUser.gender,
      state: appState
    });
  }
}

function setTheme(themeName, shouldSave = true) {
  appState.theme = themeName || 'light';
  document.documentElement.setAttribute('data-theme', appState.theme);
  document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-t') === appState.theme));
  if (shouldSave && currentUser) saveState();
}

function toggleSidebar() { if (!currentUser) return; appState.sidebarHidden = !appState.sidebarHidden; applySidebarState(); saveState(); }
function applySidebarState() {
  document.getElementById('trainingPageView')?.classList.toggle('sidebar-hidden', !!appState.sidebarHidden);
  const btn = document.getElementById('sidebarToggleBtn');
  if (btn) btn.textContent = appState.sidebarHidden ? '❯' : '☰';
}

function toggleRightSidebar() { if (!currentUser) return; appState.rightSidebarHidden = !appState.rightSidebarHidden; applyRightSidebarState(); saveState(); }
function applyRightSidebarState() {
  document.getElementById('trainingPageView')?.classList.toggle('right-sidebar-hidden', !!appState.rightSidebarHidden);
  const btn = document.getElementById('rightSidebarToggleBtn');
  if (btn) btn.textContent = appState.rightSidebarHidden ? '❮' : '☰';
}

function toggleTopBanner() {
  if (!currentUser) return;
  appState.topBannerHidden = !appState.topBannerHidden;
  applyTopBannerState();
  saveState();
}

function applyTopBannerState() {
  const isHidden = !!appState.topBannerHidden;
  document.querySelectorAll('.stage-banner').forEach(b => b.classList.toggle('banner-hidden', isHidden));
  const btn = document.getElementById('topBannerToggleBtn');
  if (btn) btn.textContent = isHidden ? '▾' : '▴';
}

function autoHideSidebarsOnExerciseStart() {
  appState.sidebarHidden = true;
  appState.rightSidebarHidden = true;
  appState.topBannerHidden = true;
  applySidebarState();
  applyRightSidebarState();
  applyTopBannerState();
}

function openSidebarsDefault() {
  appState.sidebarHidden = false;
  appState.rightSidebarHidden = false;
  appState.topBannerHidden = false;
  applySidebarState();
  applyRightSidebarState();
  applyTopBannerState();
}

/*****************************************************************
 * SES MOTORU
 *****************************************************************/
let audioCtx = null;

function ensureAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

document.addEventListener('pointerdown', () => {
  ensureAudioContext();
}, { once: true });

function playTick(freq = 660, duration = 0.045) {
  if (!appState.audioEnabled) return;
  try {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function playPageTurnSound() {
  if (appState.pageTurnSoundEnabled !== true) return;
  try {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.24;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const env = Math.pow(Math.sin(t * Math.PI), 0.55) * (1 - 0.35 * t);
      data[i] = (Math.random() * 2 - 1) * env * 0.9;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + duration * 0.75);
    filter.Q.setValueAtTime(0.75, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.008, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(210, now);
    snapOsc.frequency.exponentialRampToValueAtTime(75, now + 0.09);
    snapGain.gain.setValueAtTime(0.16, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.09);
  } catch (e) {}
}

function toggleAudio() { appState.audioEnabled = !appState.audioEnabled; updateAudioBtnUI(); saveState(); }
function updateAudioBtnUI() {
  const btn = document.getElementById('audioToggleBtn');
  if (btn) btn.textContent = appState.audioEnabled ? '🔊' : '🔇';
}

/* PWA SERVICE WORKER KAYDI */
function registerPwaServiceWorker() {
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.protocol === 'http:')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

/* HIZLI BAŞLATICI (DOĞRUDAN FIREBASE AUTH OTURUMUNU DİNLER) */
window.addEventListener('DOMContentLoaded', async () => {
  if (isAppBooted) return;
  isAppBooted = true;

  registerPwaServiceWorker();
  ensureFirebaseAuthReady();

  const mSvg = document.getElementById('modalMaleSvg'), fSvg = document.getElementById('modalFemaleSvg');
  if (mSvg) mSvg.innerHTML = MALE_FIGURE_SVG;
  if (fSvg) fSvg.innerHTML = FEMALE_FIGURE_SVG;
  selectRegisterGender('male');

  if (typeof ensureSiteMetinleriLoaded === 'function') {
    await ensureSiteMetinleriLoaded().catch(() => {});
  }
  renderVideoStudio();
  renderFaqSection();

  await loadMasterDatabase();
  if (typeof autoDiscoverTxtFiles === 'function') {
    await autoDiscoverTxtFiles().catch(() => {});
  }

  // Firebase Auth üzerinde aktif oturum varsa kullanıcı bilgilerini ve ilerlemesini doğrudan Firebase'den çek
  if (firebaseAppInitialized && typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(async (fbUser) => {
      if (fbUser && fbUser.email && !currentUser) {
        const found = await dbGetUser(fbUser.email);
        if (found) {
          currentUser = {
            username: found.username || emailToDbKey(found.email),
            email: found.email || found.displayName || fbUser.email,
            emailVerified: true,
            authProvider: found.authProvider || 'email',
            hasCustomPassword: !!found.hasCustomPassword,
            password: found.password,
            firstName: found.firstName || 'Öğrenci',
            lastName: found.lastName || '',
            birthDate: found.birthDate || '',
            city: found.city || '',
            level: found.level || found.seviye || 'Yetişkin',
            gender: found.gender || 'male'
          };
          appState = buildNormalizedUserAppState(found.state);
          applyLoadedUserSession();
          switchView('training');
        }
      }
    });
  }

  applyLoadedUserSession();
  if (currentUser) switchView('training');
  else if (!isGuestTestActive) switchView('home');
});
