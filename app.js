// =========================================================
// THE NOBLE QURAN - CORE APPLICATION ENGINE
// =========================================================

// State & In-Memory Cache
const surahCache = new Map(); // key: `${surahNum}_${reciter}`
let currentSurahNumber = 76;
let chaptersList = [];
let surahData = null;
let currentView = 'reading';
let isVbvRenderedForCurrentSurah = false;
let fontScaleLevel = 1;
let currentAudioIndex = -1;
let isMinimized = true;
let selectedReciter = 'ar.alafasy';
let currentActiveSpan = null;
let activeHoveredWordEl = null;

// Precompiled Regex
const HARAKAT_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g;

// Memorize State
let isMemorizeMode = false;
let revealedWordCount = 0;
let totalWordElements = [];
let totalAyahMarkers = [];
let isHarakatVisible = true;
let isAyahNumberAlwaysVisible = true;
let isAutoRevealing = false;
let autoRevealInterval = null;
let autoRevealSpeed = 1.0;
let isGradeMode = false;
let isMistakeMode = false;
let isReviewMode = false;
let activeAyahContextVerse = 1;
let wordPopupTrigger = localStorage.getItem('quran_word_popup_trigger') || 'hover'; // 'hover' | 'tap'

// Hold/Press State
let holdInterval = null;
let holdTimeout = null;

// Repeat Logic
let repeatMode = 'range';
let rangeStart = 1;
let rangeEnd = 31;
let playRangeCount = Infinity;
let repeatVerseCount = 1;
let delaySeconds = 0;
let currentVersePlayIteration = 1;
let currentRangeIteration = 1;

// Hover & Modal state
let activeHoveredWordData = null;
let modalSelectedWord = { verseIndex: 1, wordIndex: 1 };
let hoverTimeout = null;

// Elements
const surahSelectBtn = document.getElementById('surahSelectBtn');
const surahDropdown = document.getElementById('surahDropdown');
const headerSurahTitle = document.getElementById('headerSurahTitle');
const pageMetaText = document.getElementById('pageMetaText');
const readingView = document.getElementById('readingView');
const vbvView = document.getElementById('vbvView');
const viewBtnReading = document.getElementById('viewBtnReading');
const viewBtnVbv = document.getElementById('viewBtnVbv');
const viewBtnMemorize = document.getElementById('viewBtnMemorize');
const bismillahBlock = document.getElementById('bismillahBlock');
const btnListen = document.getElementById('btnListen');

// Memorize Bar Elements
const memorizeBar = document.getElementById('memorizeBar');
const memUnrevealZoneBtn = document.getElementById('memUnrevealZoneBtn');
const memRevealZoneBtn = document.getElementById('memRevealZoneBtn');
const memActionsGroup = document.getElementById('memActionsGroup');
const memToggleAyahNumBtn = document.getElementById('memToggleAyahNumBtn');
const memToggleHarakatBtn = document.getElementById('memToggleHarakatBtn');
const memPlayRevealBtn = document.getElementById('memPlayRevealBtn');
const memPlayIcon = document.getElementById('memPlayIcon');
const memSpeedBadge = document.getElementById('memSpeedBadge');
const memSpeedPopover = document.getElementById('memSpeedPopover');
const memToggleRevealAllBtn = document.getElementById('memToggleRevealAllBtn');
const memToggleGradeBtn = document.getElementById('memToggleGradeBtn');
const memToggleReviewBtn = document.getElementById('memToggleReviewBtn');
const memMarkMistakeBtn = document.getElementById('memMarkMistakeBtn');
const gradeModeToast = document.getElementById('gradeModeToast');
const gradeToastCloseBtn = document.getElementById('gradeToastCloseBtn');

// Audio Bar Elements
const audioBarWrapper = document.getElementById('audioBarWrapper');
const audioCollapseBtn = document.getElementById('audioCollapseBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressHandle = document.getElementById('progressHandle');
const currentTimeDisplay = document.getElementById('currentTimeDisplay');
const durationTimeDisplay = document.getElementById('durationTimeDisplay');
const mainPlayPauseBtn = document.getElementById('mainPlayPauseBtn');
const prevAyahBtn = document.getElementById('prevAyahBtn');
const nextAyahBtn = document.getElementById('nextAyahBtn');
const closeAudioBtn = document.getElementById('closeAudioBtn');
const audioMuteBtn = document.getElementById('audioMuteBtn');
const audioPlayer = document.getElementById('audioPlayer');

// Audio 3-Dots & Repeat Elements
const threeDotsBtn = document.getElementById('threeDotsBtn');
const threeDotsPopup = document.getElementById('threeDotsPopup');
const menuItemDownload = document.getElementById('menuItemDownload');
const menuItemRepeat = document.getElementById('menuItemRepeat');
const menuItemSpeed = document.getElementById('menuItemSpeed');
const menuItemReciter = document.getElementById('menuItemReciter');
const speedCurrentLabel = document.getElementById('speedCurrentLabel');
const submenuSpeed = document.getElementById('submenuSpeed');
const submenuReciter = document.getElementById('submenuReciter');
const repeatModalOverlay = document.getElementById('repeatModalOverlay');
const repeatTabs = document.querySelectorAll('.repeat-tab-btn');
const repeatFromVerse = document.getElementById('repeatFromVerse');
const repeatToVerse = document.getElementById('repeatToVerse');
const rangeInputsRow = document.getElementById('rangeInputsRow');
const playRangeVal = document.getElementById('playRangeVal');
const playRangeDecBtn = document.getElementById('playRangeDecBtn');
const playRangeIncBtn = document.getElementById('playRangeIncBtn');
const repeatVerseVal = document.getElementById('repeatVerseVal');
const repeatVerseDecBtn = document.getElementById('repeatVerseDecBtn');
const repeatVerseIncBtn = document.getElementById('repeatVerseIncBtn');
const delayVal = document.getElementById('delayVal');
const delayDecBtn = document.getElementById('delayDecBtn');
const delayIncBtn = document.getElementById('delayIncBtn');
const repeatCancelBtn = document.getElementById('repeatCancelBtn');
const repeatStartBtn = document.getElementById('repeatStartBtn');

// Word Tooltip & Modal Elements
const wordHoverTooltip = document.getElementById('wordHoverTooltip');
const wordTooltipDotsBtn = document.getElementById('wordTooltipDotsBtn');
const wordTooltipTransBtn = document.getElementById('wordTooltipTransBtn');
const wordTooltipTransText = document.getElementById('wordTooltipTransText');
const wordContextMenu = document.getElementById('wordContextMenu');
const ctxItemMore = document.getElementById('ctxItemMore');
const ctxItemPlayWord = document.getElementById('ctxItemPlayWord');
const ctxItemToggleMistake = document.getElementById('ctxItemToggleMistake');
const ctxMistakeLabel = document.getElementById('ctxMistakeLabel');
const ctxItemPinVisible = document.getElementById('ctxItemPinVisible');
const ctxItemPinHidden = document.getElementById('ctxItemPinHidden');
const ctxItemResetVisibility = document.getElementById('ctxItemResetVisibility');
const ctxPinVisLabel = document.getElementById('ctxPinVisLabel');
const ctxPinHiddenLabel = document.getElementById('ctxPinHiddenLabel');

// Ayah Rosette Context Menu Elements
const ayahContextMenu = document.getElementById('ayahContextMenu');
const ayahCtxHeader = document.getElementById('ayahCtxHeader');
const ayahCtxPinVisible = document.getElementById('ayahCtxPinVisible');
const ayahCtxPinHidden = document.getElementById('ayahCtxPinHidden');
const ayahCtxResetVis = document.getElementById('ayahCtxResetVis');
const ayahCtxGrade = document.getElementById('ayahCtxGrade');
const ayahCtxPlay = document.getElementById('ayahCtxPlay');

const wordDetailOverlay = document.getElementById('wordDetailOverlay');
const wdCloseBtn = document.getElementById('wdCloseBtn');
const wdSurahPill = document.getElementById('wdSurahPill');
const wdAyahPill = document.getElementById('wdAyahPill');
const wdVerseKeyText = document.getElementById('wdVerseKeyText');
const wdBannerTranslation = document.getElementById('wdBannerTranslation');
const wdBannerTransliteration = document.getElementById('wdBannerTransliteration');
const wdArabicVerseContainer = document.getElementById('wdArabicVerseContainer');
const wdTransEnText = document.getElementById('wdTransEnText');
const wdTransIdText = document.getElementById('wdTransIdText');
const wdPrevWordBtn = document.getElementById('wdPrevWordBtn');
const wdNextWordBtn = document.getElementById('wdNextWordBtn');
const wdPrevAyahBtn = document.getElementById('wdPrevAyahBtn');
const wdNextAyahBtn = document.getElementById('wdNextAyahBtn');
const wdPlayVerseBtn = document.getElementById('wdPlayVerseBtn');

// Top Badges (Due & New)
const topSurahDueBadge = document.getElementById('topSurahDueBadge');
const topSurahNewBadge = document.getElementById('topSurahNewBadge');

// Ayah FSRS Grading Modal Elements
const ayahGradingOverlay = document.getElementById('ayahGradingOverlay');
const gradingSurahBadge = document.getElementById('gradingSurahBadge');
const gradingAyahTitle = document.getElementById('gradingAyahTitle');
const gradingPrevAyahBtn = document.getElementById('gradingPrevAyahBtn');
const gradingNextAyahBtn = document.getElementById('gradingNextAyahBtn');
const gradingAyahCounter = document.getElementById('gradingAyahCounter');
const btnGradingPlayAudio = document.getElementById('btnGradingPlayAudio');
const gradingCloseBtn = document.getElementById('gradingCloseBtn');
const gradingArabicVerse = document.getElementById('gradingArabicVerse');
const gradingVerseTrans = document.getElementById('gradingVerseTrans');
const gradingAyahStatus = document.getElementById('gradingAyahStatus');
const btnOpenFsrsFromGrade = document.getElementById('btnOpenFsrsFromGrade');
const btnGradeAyahAgain = document.getElementById('btnGradeAyahAgain');
const btnGradeAyahHard = document.getElementById('btnGradeAyahHard');
const btnGradeAyahGood = document.getElementById('btnGradeAyahGood');
const btnGradeAyahEasy = document.getElementById('btnGradeAyahEasy');
const gradeIntAgain = document.getElementById('gradeIntAgain');
const gradeIntHard = document.getElementById('gradeIntHard');
const gradeIntGood = document.getElementById('gradeIntGood');
const gradeIntEasy = document.getElementById('gradeIntEasy');

// Comprehensive FSRS Browser Elements
const btnOpenFsrsBrowser = document.getElementById('btnOpenFsrsBrowser');
const fsrsDueBadge = document.getElementById('fsrsDueBadge');
const fsrsBrowserModal = document.getElementById('fsrsBrowserModal');
const closeFsrsBrowserBtn = document.getElementById('closeFsrsBrowserBtn');
const btnReviewDueNow = document.getElementById('btnReviewDueNow');
const btnStudyNewNow = document.getElementById('btnStudyNewNow');
const btnOpenFsrsFromSettings = document.getElementById('btnOpenFsrsFromSettings');

const kpiRetentionRate = document.getElementById('kpiRetentionRate');
const kpiDueCount = document.getElementById('kpiDueCount');
const kpiNewCount = document.getElementById('kpiNewCount');
const kpiTrackedWords = document.getElementById('kpiTrackedWords');
const kpiTrackedPercent = document.getElementById('kpiTrackedPercent');
const kpiMatureWords = document.getElementById('kpiMatureWords');

const segNew = document.getElementById('segNew');
const segDue = document.getElementById('segDue');
const segLearning = document.getElementById('segLearning');
const segYoung = document.getElementById('segYoung');
const segMature = document.getElementById('segMature');
const legNewCount = document.getElementById('legNewCount');
const legDueCount = document.getElementById('legDueCount');
const legLearningCount = document.getElementById('legLearningCount');
const legYoungCount = document.getElementById('legYoungCount');
const legMatureCount = document.getElementById('legMatureCount');
const distMetaSummary = document.getElementById('distMetaSummary');

const fsrsSearchInput = document.getElementById('fsrsSearchInput');
const fsrsFilterStage = document.getElementById('fsrsFilterStage');
const fsrsFilterSurah = document.getElementById('fsrsFilterSurah');
const fsrsSortBy = document.getElementById('fsrsSortBy');
const fsrsTableBody = document.getElementById('fsrsTableBody');

// Reset FSRS Modal Elements
const btnResetFsrsModal = document.getElementById('btnResetFsrsModal');
const btnResetFsrsSettings = document.getElementById('btnResetFsrsSettings');
const fsrsResetModal = document.getElementById('fsrsResetModal');
const closeResetFsrsModalBtn = document.getElementById('closeResetFsrsModalBtn');
const btnCancelResetFsrs = document.getElementById('btnCancelResetFsrs');
const btnConfirmResetSurah = document.getElementById('btnConfirmResetSurah');
const btnConfirmResetAll = document.getElementById('btnConfirmResetAll');
const resetSurahNameDesc = document.getElementById('resetSurahNameDesc');

// Whole Surah Recall Mode Elements
const memToggleRecallBtn = document.getElementById('memToggleRecallBtn');
const toggleWholeSurahRecall = document.getElementById('toggleWholeSurahRecall');
const recallHudContainer = document.getElementById('recallHudContainer');
const recallStatsCounter = document.getElementById('recallStatsCounter');
const recallAyahTitle = document.getElementById('recallAyahTitle');
const btnRecallPrevAyah = document.getElementById('btnRecallPrevAyah');
const btnRecallToggleAyah = document.getElementById('btnRecallToggleAyah');
const btnRecallNextAyah = document.getElementById('btnRecallNextAyah');
const btnRecallFlagMistake = document.getElementById('btnRecallFlagMistake');
const btnRecallGradeAyah = document.getElementById('btnRecallGradeAyah');
const btnRecallExit = document.getElementById('btnRecallExit');
const recallProgressBarFill = document.getElementById('recallProgressBarFill');

// FSRS Notifications Elements
const fsrsNotificationToast = document.getElementById('fsrsNotificationToast');
const fsrsNotifTitle = document.getElementById('fsrsNotifTitle');
const fsrsNotifMsg = document.getElementById('fsrsNotifMsg');
const fsrsNotifReviewBtn = document.getElementById('fsrsNotifReviewBtn');
const fsrsNotifCloseBtn = document.getElementById('fsrsNotifCloseBtn');
const toggleFsrsNotifications = document.getElementById('toggleFsrsNotifications');
const btnTestFsrsNotification = document.getElementById('btnTestFsrsNotification');

// Settings Elements
const settingsToggle = document.getElementById('settingsToggle');
const settingsDrawer = document.getElementById('settingsDrawer');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
const fontStyleSelect = document.getElementById('fontStyleSelect');
const fontIncBtn = document.getElementById('fontIncBtn');
const fontDecBtn = document.getElementById('fontDecBtn');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');
const drawerCloseIconBtn = document.getElementById('drawerCloseIconBtn');
const togglePopupTap = document.getElementById('togglePopupTap');
const memorizeOverridesStats = document.getElementById('memorizeOverridesStats');
const btnClearSurahMistakes = document.getElementById('btnClearSurahMistakes');
const btnResetVisOverrides = document.getElementById('btnResetVisOverrides');
const btnSaveLocalOffline = document.getElementById('btnSaveLocalOffline');
const btnSaveAllQuranOffline = document.getElementById('btnSaveAllQuranOffline');
const btnDownloadSurahTxt = document.getElementById('btnDownloadSurahTxt');
const btnDownloadSurahJson = document.getElementById('btnDownloadSurahJson');
const saveLocalStatusMsg = document.getElementById('saveLocalStatusMsg');
const offlineStorageCount = document.getElementById('offlineStorageCount');
const menuItemSaveText = document.getElementById('menuItemSaveText');
const toggleReviewMode = document.getElementById('toggleReviewMode');

// Sync Elements (Desktop ⇄ Android)
const btnExportSyncData = document.getElementById('btnExportSyncData');
const btnImportSyncTrigger = document.getElementById('btnImportSyncTrigger');
const fileSyncInput = document.getElementById('fileSyncInput');
const btnCopySyncClipboard = document.getElementById('btnCopySyncClipboard');
const btnPasteSyncClipboard = document.getElementById('btnPasteSyncClipboard');
const syncStatusMsg = document.getElementById('syncStatusMsg');

// Mistakes & Persistent Visibility Storage
const MISTAKES_STORAGE_KEY = 'quran_memorize_mistakes';
const WORD_VIS_OVERRIDES_KEY = 'quran_word_visibility_overrides';
const AYAH_VIS_OVERRIDES_KEY = 'quran_ayah_visibility_overrides';
const POPUP_TRIGGER_KEY = 'quran_word_popup_trigger';

function loadMistakes() {
  try {
    const raw = localStorage.getItem(MISTAKES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function saveMistakes(data) {
  try {
    localStorage.setItem(MISTAKES_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}
let memorizeMistakes = loadMistakes();

function loadWordVisOverrides() {
  try {
    const raw = localStorage.getItem(WORD_VIS_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function saveWordVisOverrides(data) {
  try {
    localStorage.setItem(WORD_VIS_OVERRIDES_KEY, JSON.stringify(data));
  } catch (e) {}
}
let wordVisOverrides = loadWordVisOverrides();

function loadAyahVisOverrides() {
  try {
    const raw = localStorage.getItem(AYAH_VIS_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function saveAyahVisOverrides(data) {
  try {
    localStorage.setItem(AYAH_VIS_OVERRIDES_KEY, JSON.stringify(data));
  } catch (e) {}
}
let ayahVisOverrides = loadAyahVisOverrides();

function showToastNotification(msg) {
  let toast = document.getElementById('appActionToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appActionToast';
    toast.className = 'grade-mode-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>${msg}</span><button type="button" class="grade-toast-close" onclick="this.parentElement.classList.remove('show')">✕</button>`;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    if (toast) toast.classList.remove('show');
  }, 3200);
}

// =========================================================
// UTILITY & HELPER FUNCTIONS
// =========================================================

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toArabicDigits(num) {
  return num.toString().replace(/\d/g, d => ARABIC_DIGITS[d]);
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function stripHarakat(text) {
  return text.replace(HARAKAT_REGEX, '');
}

function safePlay(audio) {
  const p = audio.play();
  if (p !== undefined) {
    p.catch(err => {
      if (err.name !== 'AbortError') console.warn('Audio play interrupted:', err);
    });
  }
}

/**
 * Screen focus: smoothly scrolls the target word into the comfortable viewing area
 * Works for both reveal and unreveal operations
 */
function scrollWordIntoFocus(wordEl, isRapid = false) {
  if (!wordEl) return;
  const rect = wordEl.getBoundingClientRect();
  const topSafe = 85; // Below sticky header
  const bottomSafe = window.innerHeight - 150; // Above memorize control bar

  // Check if word is already comfortably positioned
  if (rect.top < topSafe || rect.bottom > bottomSafe) {
    wordEl.scrollIntoView({
      behavior: isRapid ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }
}

function getRosetteSvg(number) {
  const arabicNum = toArabicDigits(number);
  const ayahKey = `${currentSurahNumber}:${number}`;
  const ayahOverride = ayahVisOverrides[ayahKey];
  let overrideClass = '';
  if (ayahOverride === 'visible') overrideClass = 'ayah-persist-visible';
  else if (ayahOverride === 'hidden') overrideClass = 'ayah-persist-hidden';

  const isHidden = (ayahOverride === 'hidden') || (!ayahOverride && !isAyahNumberAlwaysVisible && isMemorizeMode);
  const lenClass = number >= 100 ? 'digits-3' : '';
  return `
    <span class="ayah-marker ${isHidden ? 'hidden-ayah' : ''} ${overrideClass}" 
          data-verse="${number}" 
          id="ayah-marker-${number}"
          title="Ayah ${number} (Right-click for options)">
      <svg class="ayah-rosette-svg" viewBox="0 0 60 60">
        <use href="#ayah-rosette-sym" />
      </svg>
      <span class="ayah-number-text ${lenClass}">${arabicNum}</span>
    </span>
  `;
}

// =========================================================
// DATA INGESTION & CACHING
// =========================================================

function getDueAyahsCountForSurah(surahNum) {
  if (!fsrsCardStore) return 0;
  const now = Date.now();
  let count = 0;
  Object.keys(fsrsCardStore).forEach(k => {
    const parts = k.split(':');
    if (parts.length === 2 && parseInt(parts[0]) === surahNum) {
      const card = fsrsCardStore[k];
      if (card && (card.state === 1 || card.state === 3 || (card.state === 2 && card.due && new Date(card.due).getTime() <= now))) {
        count++;
      }
    }
  });
  return count;
}

function getSurahMasteryPercent(surahNum, totalAyahs) {
  if (!totalAyahs || !fsrsCardStore) return 0;
  let mature = 0;
  Object.keys(fsrsCardStore).forEach(k => {
    const parts = k.split(':');
    if (parts.length === 2 && parseInt(parts[0]) === surahNum) {
      const card = fsrsCardStore[k];
      if (card && card.state === 2 && (card.stability >= 21 || card.reps >= 2)) {
        mature++;
      }
    }
  });
  return Math.min(100, Math.round((mature / totalAyahs) * 100));
}

function getNewAyahsCountForSurah(surahNum, totalAyahs) {
  if (!totalAyahs) {
    const ch = chaptersList ? chaptersList.find(c => c.number === surahNum) : null;
    totalAyahs = ch ? ch.numberOfAyahs : (surahData && surahData.meta && surahData.meta.number === surahNum ? surahData.verses.length : 0);
  }
  if (!totalAyahs) return 0;
  let studiedCount = 0;
  if (fsrsCardStore) {
    Object.keys(fsrsCardStore).forEach(k => {
      const parts = k.split(':');
      if (parts.length === 2 && parseInt(parts[0]) === surahNum) {
        const card = fsrsCardStore[k];
        if (card && (card.state > 0 || (card.reps || 0) > 0)) {
          studiedCount++;
        }
      }
    });
  }
  return Math.max(0, totalAyahs - studiedCount);
}

function updateTopSurahBadges() {
  if (!currentSurahNumber) return;
  const dueCount = getDueAyahsCountForSurah(currentSurahNumber);
  const totalAyahs = surahData && surahData.verses ? surahData.verses.length : 0;
  const newCount = getNewAyahsCountForSurah(currentSurahNumber, totalAyahs);

  if (topSurahDueBadge) {
    topSurahDueBadge.textContent = `⚡ ${dueCount} due`;
    topSurahDueBadge.className = dueCount > 0 ? 'top-stat-pill top-due-pill has-due' : 'top-stat-pill top-due-pill zero';
    topSurahDueBadge.title = `${dueCount} Ayahs due for review (Click to study)`;
  }
  if (topSurahNewBadge) {
    topSurahNewBadge.textContent = `✨ ${newCount} new`;
    topSurahNewBadge.className = newCount > 0 ? 'top-stat-pill top-new-pill has-new' : 'top-stat-pill top-new-pill zero';
    topSurahNewBadge.title = `${newCount} unstudied Ayahs in Surah (Click to study)`;
  }
}

function updateTopSurahDueBadge() {
  updateTopSurahBadges();
}

if (topSurahDueBadge) {
  topSurahDueBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    const dueCount = getDueAyahsCountForSurah(currentSurahNumber);
    if (dueCount > 0 && surahData) {
      const now = Date.now();
      const dueV = surahData.verses.find(v => {
        const k = `${currentSurahNumber}:${v.verseNumber}`;
        const card = fsrsCardStore[k];
        return card && (card.state === 1 || card.state === 3 || (card.state === 2 && card.due && new Date(card.due).getTime() <= now));
      });
      if (dueV) {
        openAyahGradingModal(currentSurahNumber, dueV.verseNumber);
        return;
      }
    }
    openFsrsBrowser();
  });
}

if (topSurahNewBadge) {
  topSurahNewBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    if (surahData) {
      const newV = surahData.verses.find(v => {
        const k = `${currentSurahNumber}:${v.verseNumber}`;
        const card = fsrsCardStore[k];
        return !card || (card.state === 0 && (card.reps || 0) === 0);
      });
      if (newV) {
        openAyahGradingModal(currentSurahNumber, newV.verseNumber);
        return;
      }
    }
    openFsrsBrowser();
  });
}

function renderSurahDropdown() {
  if (!chaptersList || !chaptersList.length || !surahDropdown) return;
  surahDropdown.innerHTML = chaptersList.map(ch => {
    const dueCount = getDueAyahsCountForSurah(ch.number);
    const newCount = getNewAyahsCountForSurah(ch.number, ch.numberOfAyahs);
    const masteryPercent = getSurahMasteryPercent(ch.number, ch.numberOfAyahs);
    return `
      <div class="dropdown-item ${ch.number === currentSurahNumber ? 'active' : ''}" onclick="selectSurah(${ch.number})">
        <div class="dropdown-item-left">
          <span class="dropdown-surah-name">${ch.number}. ${ch.englishName}</span>
          ${dueCount > 0 ? `<span class="dropdown-due-pill has-due">${dueCount} due</span>` : ''}
          ${newCount > 0 ? `<span class="dropdown-new-pill has-new">${newCount} new</span>` : ''}
        </div>
        <div class="dropdown-item-right">
          <span class="dropdown-mastery-tag ${masteryPercent === 0 ? 'zero' : ''}">${masteryPercent}%</span>
          <span class="dropdown-arabic-name">${ch.name.replace('سُورَةُ ', '')}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function initChapters() {
  try {
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const json = await res.json();
    chaptersList = json.data;
    renderSurahDropdown();
  } catch (e) {
    console.error('Failed to load chapters:', e);
  }
}

async function loadSurah(num) {
  currentSurahNumber = num;
  isVbvRenderedForCurrentSurah = false;
  const cacheKey = `${num}_${selectedReciter}`;

  if (surahCache.has(cacheKey)) {
    surahData = surahCache.get(cacheKey);
    rangeStart = 1;
    rangeEnd = surahData.verses.length;
    repeatFromVerse.value = `${num}:1`;
    repeatToVerse.value = `${num}:${surahData.verses.length}`;
    updateBanner();
    renderViews();
    return;
  }

  // Check offline storage cache
  let localOfflineData = null;
  try {
    localOfflineData = await getSurahFromLocalOffline(num);
  } catch (err) {
    console.warn('Could not read offline storage cache:', err);
  }

  if (!navigator.onLine && localOfflineData) {
    surahData = localOfflineData;
    surahCache.set(cacheKey, surahData);
    rangeStart = 1;
    rangeEnd = surahData.verses.length;
    repeatFromVerse.value = `${num}:1`;
    repeatToVerse.value = `${num}:${surahData.verses.length}`;
    updateBanner();
    renderViews();
    return;
  }

  readingView.innerHTML = '<p style="text-align:center;padding:3rem;">Loading Mushaf Madinah Text & Words...</p>';
  vbvView.innerHTML = '<p style="text-align:center;padding:3rem;">Loading Verse by Verse...</p>';

  try {
    // per_page=300 fetches complete chapters (Surah 2 has max 286 verses)
    const [qdcRes, metaRes] = await Promise.all([
      fetch(`https://api.quran.com/api/v4/verses/by_chapter/${num}?language=en&words=true&word_fields=text_uthmani&translations=20,33&per_page=300`),
      fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/${selectedReciter}`)
    ]);

    const json = await qdcRes.json();
    const metaJson = await metaRes.json();
    const metaInfo = metaJson.data[0];

    let globalWordCounter = 0;
    const bismillahWords = ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَـٰنِ", "ٱلرَّحِيمِ", "اللَّهِ", "الرَّحْمٰنِ", "الرَّحِيمِ"];

    const verses = json.verses.map((v, idx) => {
      const wordList = v.words.filter(w => w.char_type_name === 'word').map(w => ({
        id: w.id,
        position: w.position,
        arabic: w.text_uthmani,
        plain: stripHarakat(w.text_uthmani),
        translation: w.translation ? w.translation.text : '',
        transliteration: w.transliteration ? w.transliteration.text : '',
        audioUrl: w.audio_url ? `https://audio.qurancdn.com/${w.audio_url}` : null
      }));

      // Strip Bismillah prefix if present in Ayah 1 of Surahs 2-114 (except 9)
      if (v.verse_number === 1 && num !== 1 && num !== 9) {
        while (wordList.length > 0 && bismillahWords.includes(wordList[0].arabic)) {
          wordList.shift();
        }
      }

      const startIdx = globalWordCounter;
      globalWordCounter += wordList.length;
      const endIdx = globalWordCounter - 1;

      return {
        verseNumber: v.verse_number,
        verseKey: v.verse_key,
        pageNumber: v.page_number,
        juzNumber: v.juz_number,
        hizbNumber: v.hizb_number,
        words: wordList,
        startWordIdx: startIdx,
        endWordIdx: endIdx,
        translationEn: v.translations && v.translations[0] ? v.translations[0].text.replace(/<[^>]+>/g, '') : '',
        translationId: v.translations && v.translations[1] ? v.translations[1].text.replace(/<[^>]+>/g, '') : '',
        audioUrl: metaInfo.ayahs[idx] ? metaInfo.ayahs[idx].audio : ''
      };
    });

    surahData = {
      meta: metaInfo,
      verses: verses
    };

    surahCache.set(cacheKey, surahData);

    rangeStart = 1;
    rangeEnd = surahData.verses.length;
    repeatFromVerse.value = `${num}:1`;
    repeatToVerse.value = `${num}:${surahData.verses.length}`;

    updateBanner();
    renderViews();

    // Auto-cache to local offline store in background
    saveSurahToLocalOffline(surahData).then(() => {
      updateOfflineStorageStatus();
    });
  } catch (e) {
    console.error("Error loading Surah from network:", e);
    if (!localOfflineData) {
      localOfflineData = await getSurahFromLocalOffline(num);
    }
    if (localOfflineData) {
      console.log(`Loading Surah ${num} from offline fallback...`);
      surahData = localOfflineData;
      surahCache.set(cacheKey, surahData);
      rangeStart = 1;
      rangeEnd = surahData.verses.length;
      repeatFromVerse.value = `${num}:1`;
      repeatToVerse.value = `${num}:${surahData.verses.length}`;
      updateBanner();
      renderViews();
      return;
    }
    readingView.innerHTML = '<p style="text-align:center;padding:3rem;color:red;">Failed to load Mushaf words. Check network or saved offline text.</p>';
  }
}

function updateBanner() {
  const { meta, verses } = surahData;
  const first = verses[0];

  headerSurahTitle.textContent = `${meta.number}. ${meta.englishName}`;
  pageMetaText.textContent = `${first.pageNumber} • ${first.juzNumber}`;
  updateTopSurahDueBadge();
  renderSurahDropdown();
  document.getElementById('bannerTitle').textContent = `${meta.number}. Surah ${meta.englishName}`;
  document.getElementById('bannerSubName').textContent = meta.englishNameTranslation;
  document.getElementById('bannerArabicCalligraphy').textContent = meta.name.replace('سُورَةُ ', '');
  bismillahBlock.style.display = (meta.number === 9 || meta.number === 1) ? 'none' : 'block';
}

function renderViews() {
  if (isRecallMode) {
    currentRecallVerseIdx = 0;
    recallRevealedVerses.clear();
    renderReadingView();
    updateRecallHud();
    return;
  }
  // Lazy render: only render the active view to avoid unnecessary DOM operations
  if (currentView === 'reading' || isMemorizeMode) {
    renderReadingView();
  } else {
    renderVbvView();
  }
}

function renderReadingView() {
  const { verses } = surahData;
  const pagesMap = {};

  verses.forEach((verse, vIdx) => {
    if (!pagesMap[verse.pageNumber]) pagesMap[verse.pageNumber] = [];
    pagesMap[verse.pageNumber].push({ ...verse, vIdx });
  });

  const pageKeys = Object.keys(pagesMap).map(Number).sort((a, b) => a - b);
  let html = '';
  let globalWordIndex = 0;

  pageKeys.forEach((pageNumber, pIndex) => {
    const pageVerses = pagesMap[pageNumber];
    let contentHtml = '';

    pageVerses.forEach(verse => {
      let wordsHtml = '';
      verse.words.forEach((w, wIdx) => {
        const wordDisplay = isHarakatVisible ? w.arabic : w.plain;
        const wordKey = `${surahData.meta.number}:${verse.verseNumber}:${wIdx + 1}`;
        const isMistake = !!memorizeMistakes[wordKey];
        wordsHtml += `
          <span class="mushaf-word ${isMistake ? 'word-mistake' : ''}" 
                id="m-word-${globalWordIndex}"
                data-global-idx="${globalWordIndex}"
                data-verse-idx="${verse.vIdx}" 
                data-verse-num="${verse.verseNumber}"
                data-word-idx="${wIdx}"
                data-orig-arabic="${w.arabic}"
                data-plain-arabic="${w.plain}"
                data-trans="${w.translation}" 
                data-translit="${w.transliteration}">
            ${wordDisplay}
          </span> 
        `;
        globalWordIndex++;
      });

      contentHtml += `
        <span class="mushaf-verse-span reading-verse-span" id="reading-verse-span-${verse.vIdx}" data-verse-idx="${verse.vIdx}" data-verse-num="${verse.verseNumber}">
          ${wordsHtml}
          ${getRosetteSvg(verse.verseNumber)}
        </span>
      `;
    });

    html += `
      <div class="mushaf-page">
        <div class="mushaf-page-content">${contentHtml}</div>
        <div class="page-footer-number">${pageNumber}</div>
        ${pIndex < pageKeys.length - 1 ? '<hr class="page-divider" />' : ''}
      </div>
    `;
  });

  readingView.innerHTML = html;
  totalWordElements = Array.from(readingView.querySelectorAll('.mushaf-word'));
  totalAyahMarkers = Array.from(readingView.querySelectorAll('.ayah-marker'));

  if (isRecallMode) {
    applyRecallVersesState();
  } else if (isMemorizeMode) {
    applyMemorizeState(true);
  }
  updateActiveMistakeButtonState();
  updateMemorizeOverridesStats();
}

function renderVbvView() {
  const { meta, verses } = surahData;
  let html = '';

  verses.forEach((verse, idx) => {
    let arabicWords = verse.words.map(w => isHarakatVisible ? w.arabic : w.plain).join(' ');

    html += `
      <div class="vbv-card" id="vbv-card-${idx}">
        <div class="vbv-header">
          <div class="vbv-left">
            <span>${meta.number}:${verse.verseNumber}</span>
            <button class="vbv-btn" onclick="playAyah(${idx})" title="Play Verse">▷</button>
          </div>
        </div>

        <div class="vbv-arabic">
          ${arabicWords} ${getRosetteSvg(verse.verseNumber)}
        </div>

        <div class="vbv-translation-block vbv-trans-en">
          <div class="vbv-trans-text">${verse.translationEn}</div>
          <div class="vbv-trans-source">— Saheeh International</div>
        </div>

        <div class="vbv-translation-block vbv-trans-id">
          <div class="vbv-trans-text">${verse.translationId}</div>
          <div class="vbv-trans-source">— Indonesian Islamic affairs ministry</div>
        </div>
      </div>
    `;
  });

  vbvView.innerHTML = html;
  isVbvRenderedForCurrentSurah = true;
}

// =========================================================
// HIGH-PERFORMANCE MEMORIZE MODE ENGINE (O(1) INCREMENTAL)
// =========================================================

function toggleMemorizeMode() {
  isMemorizeMode = !isMemorizeMode;

  if (isMemorizeMode) {
    document.body.classList.add('memorize-active');
    viewBtnMemorize.classList.add('active');
    viewBtnReading.classList.add('active');
    viewBtnVbv.classList.remove('active');
    readingView.style.display = 'block';
    vbvView.style.display = 'none';

    revealedWordCount = 0;
    memorizeBar.classList.add('show');
    isMinimized = true;
    audioBarWrapper.classList.add('open', 'minimized');
    applyMemorizeState(true);

    if (totalWordElements.length > 0) {
      scrollWordIntoFocus(totalWordElements[0], false);
    }
  } else {
    document.body.classList.remove('memorize-active');
    viewBtnMemorize.classList.remove('active');
    memorizeBar.classList.remove('show');
    stopAutoReveal();
    if (isGradeMode) {
      isGradeMode = false;
      if (memToggleGradeBtn) memToggleGradeBtn.classList.remove('active');
      document.body.classList.remove('grade-mode-active');
      if (gradeModeToast) gradeModeToast.classList.remove('show');
    }
    if (isMistakeMode) {
      isMistakeMode = false;
      document.body.classList.remove('mistake-mode-active');
      if (memMarkMistakeBtn) memMarkMistakeBtn.classList.remove('mistake-mode-on', 'mistake-active');
    }
    totalWordElements.forEach(w => {
      w.classList.remove('memorize-hidden', 'mem-active-focus', 'persist-visible', 'persist-hidden', 'review-mastered-visible');
    });
    totalAyahMarkers.forEach(m => m.classList.remove('hidden-ayah', 'ayah-persist-visible', 'ayah-persist-hidden'));
  }
}

viewBtnMemorize.addEventListener('click', toggleMemorizeMode);

function isAyahDueOrNew(surahNum, verseNum) {
  const ayahKey = `${surahNum}:${verseNum}`;
  if (memorizeMistakes) {
    if (memorizeMistakes[ayahKey]) return true;
    for (const k in memorizeMistakes) {
      if (k.startsWith(`${ayahKey}:`)) return true;
    }
  }
  const card = (typeof fsrsCardStore !== 'undefined' && fsrsCardStore) ? (fsrsCardStore[ayahKey] || fsrsCardStore[`${ayahKey}:1`]) : null;
  if (!card || card.state === 0) return true; // FSRS_STATE.NEW
  if (card.state === 1 || card.state === 3) return true; // LEARNING / RELEARNING
  if (card.due && new Date(card.due).getTime() <= Date.now()) return true; // Due for review
  return false;
}

function isWordDueOrNew(surahNum, verseNum, wordPos) {
  const wordKey = `${surahNum}:${verseNum}:${wordPos}`;
  if (memorizeMistakes && memorizeMistakes[wordKey]) return true;
  return isAyahDueOrNew(surahNum, verseNum);
}

function getWordVisibilityState(wordEl) {
  if (!surahData || !wordEl) return null;
  const verseNum = parseInt(wordEl.getAttribute('data-verse-num'));
  const wordIdx = parseInt(wordEl.getAttribute('data-word-idx'));
  const wordPos = wordIdx + 1;
  const wordKey = `${currentSurahNumber}:${verseNum}:${wordPos}`;
  const ayahKey = `${currentSurahNumber}:${verseNum}`;

  if (wordVisOverrides[wordKey]) return wordVisOverrides[wordKey];
  if (ayahVisOverrides[ayahKey]) return ayahVisOverrides[ayahKey];
  return null;
}

function applyWordMemorizeVisibility(wordEl, idx, revealedCount) {
  const override = getWordVisibilityState(wordEl);
  if (override === 'visible') {
    wordEl.classList.remove('memorize-hidden', 'review-mastered-visible');
    wordEl.classList.add('persist-visible');
    wordEl.classList.remove('persist-hidden');
    return;
  }
  if (override === 'hidden') {
    wordEl.classList.remove('review-mastered-visible');
    wordEl.classList.add('memorize-hidden', 'persist-hidden');
    wordEl.classList.remove('persist-visible');
    return;
  }
  wordEl.classList.remove('persist-visible', 'persist-hidden');

  if (isReviewMode) {
    const vNum = parseInt(wordEl.getAttribute('data-verse-num'));
    const wIdx = parseInt(wordEl.getAttribute('data-word-idx'));
    const wordPos = wIdx + 1;
    const isDue = isWordDueOrNew(currentSurahNumber, vNum, wordPos);

    if (!isDue) {
      wordEl.classList.remove('memorize-hidden');
      wordEl.classList.add('review-mastered-visible');
      return;
    } else {
      wordEl.classList.remove('review-mastered-visible');
      if (idx < revealedCount) {
        wordEl.classList.remove('memorize-hidden');
      } else {
        wordEl.classList.add('memorize-hidden');
      }
      return;
    }
  }

  // Normal memorize mode
  wordEl.classList.remove('review-mastered-visible');
  if (idx < revealedCount) {
    wordEl.classList.remove('memorize-hidden');
  } else {
    wordEl.classList.add('memorize-hidden');
  }
}

function setRevealedWordCount(newCount) {
  newCount = Math.max(0, Math.min(totalWordElements.length, newCount));
  if (newCount === revealedWordCount) return;
  const oldCount = revealedWordCount;
  revealedWordCount = newCount;
  applyIncrementalMemorize(oldCount, newCount);
}

function applyIncrementalMemorize(oldCount, newCount) {
  const start = Math.min(oldCount, newCount);
  const end = Math.max(oldCount, newCount);
  for (let i = start; i < end; i++) {
    if (totalWordElements[i]) {
      applyWordMemorizeVisibility(totalWordElements[i], i, newCount);
    }
  }

  // Update leading focus indicator
  if (totalWordElements[oldCount - 1]) {
    totalWordElements[oldCount - 1].classList.remove('mem-active-focus');
  }
  if (newCount > 0 && totalWordElements[newCount - 1]) {
    totalWordElements[newCount - 1].classList.add('mem-active-focus');
  }

  updateAyahMarkersVisibility();
  updateActiveMistakeButtonState();
}

function applyMemorizeState(fullReset = false) {
  if (!isMemorizeMode) return;
  totalWordElements.forEach((wordEl, idx) => {
    wordEl.classList.remove('mem-active-focus');
    applyWordMemorizeVisibility(wordEl, idx, revealedWordCount);
  });

  if (revealedWordCount > 0 && totalWordElements[revealedWordCount - 1]) {
    totalWordElements[revealedWordCount - 1].classList.add('mem-active-focus');
  }

  updateAyahMarkersVisibility();
  updateActiveMistakeButtonState();
}

function updateAyahMarkersVisibility() {
  if (!surahData) return;
  const alwaysVis = isAyahNumberAlwaysVisible || !isMemorizeMode;
  surahData.verses.forEach(v => {
    const marker = document.getElementById(`ayah-marker-${v.verseNumber}`);
    if (marker) {
      const ayahKey = `${currentSurahNumber}:${v.verseNumber}`;
      const override = ayahVisOverrides[ayahKey];
      if (override === 'visible') {
        marker.classList.remove('hidden-ayah');
        marker.classList.add('ayah-persist-visible');
        marker.classList.remove('ayah-persist-hidden');
      } else if (override === 'hidden') {
        marker.classList.add('hidden-ayah');
        marker.classList.add('ayah-persist-hidden');
        marker.classList.remove('ayah-persist-visible');
      } else {
        marker.classList.remove('ayah-persist-visible', 'ayah-persist-hidden');
        if (alwaysVis || revealedWordCount > v.endWordIdx) {
          marker.classList.remove('hidden-ayah');
        } else {
          marker.classList.add('hidden-ayah');
        }
      }
    }
  });
}

function revealNextWord(isRapid = false) {
  if (revealedWordCount < totalWordElements.length) {
    setRevealedWordCount(revealedWordCount + 1);
    const activeWord = totalWordElements[revealedWordCount - 1];
    if (activeWord) {
      scrollWordIntoFocus(activeWord, isRapid);
    }
  } else {
    stopAutoReveal();
  }
}

function unrevealPreviousWord(isRapid = false) {
  if (revealedWordCount > 0) {
    setRevealedWordCount(revealedWordCount - 1);
    const targetWord = revealedWordCount > 0 
      ? totalWordElements[revealedWordCount - 1] 
      : totalWordElements[0];
    if (targetWord) {
      scrollWordIntoFocus(targetWord, isRapid);
    }
  }
}

function setupHoldZone(btnElement, actionFn) {
  const startHold = (e) => {
    e.preventDefault();
    actionFn(false); // Single tap / initial press
    clearTimeout(holdTimeout);
    clearInterval(holdInterval);
    holdTimeout = setTimeout(() => {
      holdInterval = setInterval(() => actionFn(true), 75); // Rapid hold mode
    }, 300);
  };

  const clearHold = () => {
    clearTimeout(holdTimeout);
    clearInterval(holdInterval);
  };

  btnElement.addEventListener('mousedown', startHold);
  btnElement.addEventListener('mouseup', clearHold);
  btnElement.addEventListener('mouseleave', clearHold);
  btnElement.addEventListener('touchstart', startHold, { passive: false });
  btnElement.addEventListener('touchend', clearHold);
  btnElement.addEventListener('touchcancel', clearHold);
}

setupHoldZone(memRevealZoneBtn, revealNextWord);
setupHoldZone(memUnrevealZoneBtn, unrevealPreviousWord);

// Prevent clicks in the top-right action buttons from triggering the Reveal button underneath
if (memActionsGroup) {
  memActionsGroup.addEventListener('mousedown', e => e.stopPropagation());
  memActionsGroup.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
  memActionsGroup.addEventListener('click', e => e.stopPropagation());
}

memToggleRevealAllBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (revealedWordCount >= totalWordElements.length) {
    setRevealedWordCount(0);
    if (totalWordElements.length > 0) scrollWordIntoFocus(totalWordElements[0], false);
  } else {
    setRevealedWordCount(totalWordElements.length);
    if (totalWordElements.length > 0) scrollWordIntoFocus(totalWordElements[totalWordElements.length - 1], false);
  }
});

function toggleAutoReveal() {
  if (isAutoRevealing) {
    stopAutoReveal();
  } else {
    startAutoReveal();
  }
}

function startAutoReveal() {
  isAutoRevealing = true;
  memPlayIcon.textContent = '❚❚';
  memPlayRevealBtn.classList.add('active');
  const intervalMs = Math.round(900 / autoRevealSpeed);
  autoRevealInterval = setInterval(() => revealNextWord(false), intervalMs);
}

function stopAutoReveal() {
  isAutoRevealing = false;
  memPlayIcon.textContent = '▶';
  memPlayRevealBtn.classList.remove('active');
  clearInterval(autoRevealInterval);
}

memPlayRevealBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleAutoReveal();
});

// Click the 1x badge directly to open the speed selection menu
memSpeedBadge.addEventListener('click', (e) => {
  e.stopPropagation();
  memSpeedPopover.classList.toggle('show');
});

// Right click on the play button also opens speed menu
memPlayRevealBtn.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  e.stopPropagation();
  memSpeedPopover.classList.toggle('show');
});

let playHoldTimer = null;
memPlayRevealBtn.addEventListener('mousedown', (e) => {
  e.stopPropagation();
  playHoldTimer = setTimeout(() => {
    memSpeedPopover.classList.toggle('show');
  }, 400);
});
memPlayRevealBtn.addEventListener('mouseup', () => clearTimeout(playHoldTimer));
memPlayRevealBtn.addEventListener('mouseleave', () => clearTimeout(playHoldTimer));

document.querySelectorAll('.mem-speed-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    autoRevealSpeed = parseFloat(item.getAttribute('data-speed'));
    memSpeedBadge.textContent = `${autoRevealSpeed}x`;
    document.querySelectorAll('.mem-speed-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    memSpeedPopover.classList.remove('show');
    if (isAutoRevealing) {
      stopAutoReveal();
      startAutoReveal();
    }
  });
});

memToggleHarakatBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  isHarakatVisible = !isHarakatVisible;
  memToggleHarakatBtn.classList.toggle('active', isHarakatVisible);

  totalWordElements.forEach(wordEl => {
    wordEl.textContent = isHarakatVisible ? wordEl.dataset.origArabic : wordEl.dataset.plainArabic;
  });

  if (isVbvRenderedForCurrentSurah) {
    renderVbvView();
  }
});

memToggleAyahNumBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  isAyahNumberAlwaysVisible = !isAyahNumberAlwaysVisible;
  memToggleAyahNumBtn.classList.toggle('active', isAyahNumberAlwaysVisible);
  updateAyahMarkersVisibility();
});

function setReviewMode(enabled) {
  isReviewMode = enabled;
  if (toggleReviewMode) toggleReviewMode.checked = enabled;
  if (memToggleReviewBtn) memToggleReviewBtn.classList.toggle('review-active', enabled);
  document.body.classList.toggle('review-mode-active', enabled);
  showToastNotification(enabled ? '⚡ Review Mode ON (Only new & due words hidden)' : 'Review Mode OFF');
  if (isMemorizeMode) {
    applyMemorizeState(true);
  }
}

if (memToggleReviewBtn) {
  memToggleReviewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setReviewMode(!isReviewMode);
  });
}

if (toggleReviewMode) {
  toggleReviewMode.addEventListener('change', (e) => {
    setReviewMode(e.target.checked);
  });
}

// Mark Mistake Button Logic (Click: flag active word • Hold/Shift-click: Mistake Mode)
if (memMarkMistakeBtn) {
  memMarkMistakeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.shiftKey) {
      toggleMistakeMode();
      return;
    }
    if (revealedWordCount > 0 && totalWordElements[revealedWordCount - 1]) {
      const activeEl = totalWordElements[revealedWordCount - 1];
      const vNum = parseInt(activeEl.getAttribute('data-verse-num'));
      const wIdx = parseInt(activeEl.getAttribute('data-word-idx'));
      toggleWordMistake(currentSurahNumber, vNum, wIdx + 1);
    } else if (totalWordElements.length > 0) {
      const activeEl = totalWordElements[0];
      const vNum = parseInt(activeEl.getAttribute('data-verse-num'));
      const wIdx = parseInt(activeEl.getAttribute('data-word-idx'));
      toggleWordMistake(currentSurahNumber, vNum, wIdx + 1);
    } else {
      toggleMistakeMode();
    }
  });

  let mistakeHoldTimer = null;
  memMarkMistakeBtn.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    mistakeHoldTimer = setTimeout(() => {
      toggleMistakeMode();
    }, 400);
  });
  memMarkMistakeBtn.addEventListener('mouseup', () => clearTimeout(mistakeHoldTimer));
  memMarkMistakeBtn.addEventListener('mouseleave', () => clearTimeout(mistakeHoldTimer));
  memMarkMistakeBtn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMistakeMode();
  });
}

function toggleMistakeMode() {
  isMistakeMode = !isMistakeMode;
  document.body.classList.toggle('mistake-mode-active', isMistakeMode);
  updateActiveMistakeButtonState();
  if (isMistakeMode) {
    showToastNotification('🚩 Mistake Mode ON: Click any word to mark or unmark mistake');
  } else {
    showToastNotification('✓ Mistake Mode OFF');
  }
}

function toggleWordMistake(surahNum, verseNum, wordPos) {
  const key = `${surahNum}:${verseNum}:${wordPos}`;
  if (memorizeMistakes[key]) {
    delete memorizeMistakes[key];
    showToastNotification(`✓ Cleared mistake on ${surahNum}:${verseNum} #${wordPos}`);
  } else {
    memorizeMistakes[key] = {
      timestamp: Date.now(),
      surah: surahNum,
      verse: verseNum,
      wordPos: wordPos
    };
    showToastNotification(`🚩 Marked mistake on ${surahNum}:${verseNum} #${wordPos}`);
  }
  saveMistakes(memorizeMistakes);
  updateWordElementsMistakeClasses();
  updateActiveMistakeButtonState();
  updateMemorizeOverridesStats();
}

function updateWordElementsMistakeClasses() {
  if (!surahData) return;
  totalWordElements.forEach(el => {
    const vNum = parseInt(el.getAttribute('data-verse-num'));
    const wIdx = parseInt(el.getAttribute('data-word-idx'));
    const key = `${currentSurahNumber}:${vNum}:${wIdx + 1}`;
    if (memorizeMistakes[key]) {
      el.classList.add('word-mistake');
    } else {
      el.classList.remove('word-mistake');
    }
  });
}

function updateActiveMistakeButtonState() {
  if (!memMarkMistakeBtn) return;
  if (isMistakeMode) {
    memMarkMistakeBtn.classList.add('mistake-mode-on');
    memMarkMistakeBtn.classList.remove('mistake-active');
    return;
  }
  memMarkMistakeBtn.classList.remove('mistake-mode-on');
  if (isMemorizeMode && revealedWordCount > 0 && totalWordElements[revealedWordCount - 1]) {
    const activeEl = totalWordElements[revealedWordCount - 1];
    const vNum = parseInt(activeEl.getAttribute('data-verse-num'));
    const wIdx = parseInt(activeEl.getAttribute('data-word-idx'));
    const key = `${currentSurahNumber}:${vNum}:${wIdx + 1}`;
    if (memorizeMistakes[key]) {
      memMarkMistakeBtn.classList.add('mistake-active');
      return;
    }
  }
  memMarkMistakeBtn.classList.remove('mistake-active');
}

function setWordVisibilityOverride(surahNum, verseNum, wordPos, state) {
  const key = `${surahNum}:${verseNum}:${wordPos}`;
  if (!state) {
    delete wordVisOverrides[key];
    showToastNotification(`↺ Reset visibility for ${surahNum}:${verseNum} #${wordPos}`);
  } else {
    wordVisOverrides[key] = state; // 'visible' | 'hidden'
    showToastNotification(state === 'visible' 
      ? `📌 Word ${surahNum}:${verseNum} #${wordPos} pinned Always Visible` 
      : `🙈 Word ${surahNum}:${verseNum} #${wordPos} pinned Always Hidden`);
  }
  saveWordVisOverrides(wordVisOverrides);
  if (isMemorizeMode) applyMemorizeState(true);
  updateMemorizeOverridesStats();
}

function setAyahVisibilityOverride(surahNum, verseNum, state) {
  const key = `${surahNum}:${verseNum}`;
  if (!state) {
    delete ayahVisOverrides[key];
    showToastNotification(`↺ Reset visibility for Ayah ${surahNum}:${verseNum}`);
  } else {
    ayahVisOverrides[key] = state; // 'visible' | 'hidden'
    showToastNotification(state === 'visible' 
      ? `📌 Ayah ${surahNum}:${verseNum} pinned Always Visible` 
      : `🙈 Ayah ${surahNum}:${verseNum} pinned Always Hidden`);
  }
  saveAyahVisOverrides(ayahVisOverrides);
  if (isMemorizeMode) applyMemorizeState(true);
  updateAyahMarkersVisibility();
  updateMemorizeOverridesStats();
}

function showAyahContextMenu(verseNum, x, y) {
  activeAyahContextVerse = verseNum;
  if (ayahCtxHeader) ayahCtxHeader.textContent = `Ayah ${currentSurahNumber}:${verseNum}`;

  const ayahKey = `${currentSurahNumber}:${verseNum}`;
  const override = ayahVisOverrides[ayahKey];
  if (ayahCtxPinVisible) ayahCtxPinVisible.classList.toggle('active', override === 'visible');
  if (ayahCtxPinHidden) ayahCtxPinHidden.classList.toggle('active', override === 'hidden');

  if (ayahContextMenu) {
    ayahContextMenu.style.left = `${Math.min(window.innerWidth - 220, Math.max(10, x - 10))}px`;
    ayahContextMenu.style.top = `${Math.min(window.innerHeight - 220, Math.max(10, y - 10)) + window.scrollY}px`;
    ayahContextMenu.classList.add('show');
  }
}

function hideAyahContextMenu() {
  if (ayahContextMenu) ayahContextMenu.classList.remove('show');
}

// =========================================================
// EVENT DELEGATION (READING & VBV VIEWS)
// =========================================================

readingView.addEventListener('mouseover', (e) => {
  if (isRecallMode || wordPopupTrigger === 'tap') return; // Tap or Recall mode active: ignore hover
  const wordEl = e.target.closest('.mushaf-word');
  if (!wordEl) return;
  if (isMemorizeMode && wordEl.classList.contains('memorize-hidden')) return;
  clearTimeout(hoverTimeout);
  showWordTooltip(wordEl);
});

readingView.addEventListener('mouseout', (e) => {
  if (isRecallMode || wordPopupTrigger === 'tap') return;
  const wordEl = e.target.closest('.mushaf-word');
  if (!wordEl) return;
  hoverTimeout = setTimeout(() => {
    if (!wordHoverTooltip.matches(':hover') && !wordContextMenu.classList.contains('show')) {
      hideWordTooltip();
    }
  }, 250);
});

readingView.addEventListener('click', (e) => {
  // 0. Whole Surah Recall Mode active: tapping anywhere in an Ayah reveals/hides or focuses it
  if (isRecallMode) {
    const verseSpan = e.target.closest('.reading-verse-span, .mushaf-verse-span');
    if (verseSpan) {
      e.stopPropagation();
      const vIdx = parseInt(verseSpan.getAttribute('data-verse-idx'));
      if (!isNaN(vIdx)) {
        if (currentRecallVerseIdx === vIdx) {
          toggleCurrentRecallVerse();
        } else {
          setRecallVerseIndex(vIdx);
        }
        return;
      }
    }
  }

  const wordEl = e.target.closest('.mushaf-word');
  if (wordEl) {
    const vNum = parseInt(wordEl.getAttribute('data-verse-num'));
    const wIdx = parseInt(wordEl.getAttribute('data-word-idx'));

    // 1. Mistake mode active: tapping any word marks/unmarks mistake
    if (isMistakeMode) {
      e.stopPropagation();
      toggleWordMistake(currentSurahNumber, vNum, wIdx + 1);
      return;
    }

    // 2. Memorize mode active
    if (isMemorizeMode) {
      const clickedIdx = parseInt(wordEl.getAttribute('data-global-idx'));
      const isCurrentlyHidden = wordEl.classList.contains('memorize-hidden');

      if (!isNaN(clickedIdx) && isCurrentlyHidden) {
        setRevealedWordCount(clickedIdx + 1);
        scrollWordIntoFocus(wordEl, false);
      } else {
        // Word is already revealed or pinned visible
        if (wordPopupTrigger === 'tap') {
          e.stopPropagation();
          showWordTooltip(wordEl);
        }
      }
      return;
    }

    // 3. Normal view (Reading View)
    if (wordPopupTrigger === 'tap') {
      e.stopPropagation();
      showWordTooltip(wordEl);
    }
    return;
  }

  const marker = e.target.closest('.ayah-marker');
  if (marker) {
    const verseNum = parseInt(marker.getAttribute('data-verse'));
    if (isMemorizeMode && isGradeMode) {
      e.stopPropagation();
      openAyahGradingModal(currentSurahNumber, verseNum);
      return;
    }
    if (!isNaN(verseNum)) playAyahByNumber(verseNum);
  }
});

readingView.addEventListener('contextmenu', (e) => {
  const marker = e.target.closest('.ayah-marker');
  if (marker) {
    e.preventDefault();
    e.stopPropagation();
    const verseNum = parseInt(marker.getAttribute('data-verse'));
    showAyahContextMenu(verseNum, e.clientX, e.clientY);
  }
});

// =========================================================
// AUDIO BAR & AUTOPLAY WITH REPEAT CONTROLS
// =========================================================

function showAudioBar() {
  if (!audioBarWrapper) return;
  audioBarWrapper.classList.remove('minimized');
  audioBarWrapper.classList.add('open');
  isMinimized = false;
  if (audioCollapseBtn) {
    audioCollapseBtn.textContent = '▾';
    audioCollapseBtn.title = 'Minimize audio bar to line';
  }
}

function openAudioBar(forceUnminimize = true) {
  if (!audioBarWrapper) return;
  audioBarWrapper.classList.add('open');
  if (forceUnminimize) {
    showAudioBar();
  } else if (isMinimized) {
    audioBarWrapper.classList.add('minimized');
  } else {
    audioBarWrapper.classList.remove('minimized');
  }
}

function closeAudioBar() {
  audioPlayer.pause();
  currentAudioIndex = -1;
  mainPlayPauseBtn.textContent = '▶';
  btnListen.textContent = '▶';
  if (currentActiveSpan) {
    currentActiveSpan.classList.remove('ayah-active-span');
    currentActiveSpan = null;
  }
  isMinimized = true;
  audioBarWrapper.classList.add('open', 'minimized');
}

window.playAyahByNumber = function(verseNum) {
  playAyah(verseNum - 1);
};

window.playAyah = function(index) {
  if (!surahData || !surahData.verses[index]) return;
  currentAudioIndex = index;
  openAudioBar();

  const verse = surahData.verses[index];
  audioPlayer.src = verse.audioUrl;
  safePlay(audioPlayer);
  mainPlayPauseBtn.textContent = '❚❚';
  btnListen.textContent = '❚❚';

  if (currentActiveSpan) {
    currentActiveSpan.classList.remove('ayah-active-span');
  }
  currentActiveSpan = document.getElementById(`reading-verse-span-${index}`);
  if (currentActiveSpan) {
    currentActiveSpan.classList.add('ayah-active-span');
    if (currentView === 'reading' || isMemorizeMode) {
      currentActiveSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  if (currentView === 'vbv') {
    if (!isVbvRenderedForCurrentSurah) renderVbvView();
    const activeCard = document.getElementById(`vbv-card-${index}`);
    if (activeCard) {
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

audioPlayer.addEventListener('ended', () => {
  if (currentVersePlayIteration < repeatVerseCount) {
    currentVersePlayIteration++;
    setTimeout(() => safePlay(audioPlayer), delaySeconds * 1000);
    return;
  }
  currentVersePlayIteration = 1;

  const nextIdx = currentAudioIndex + 1;
  const rangeEndIdx = rangeEnd - 1;

  if (nextIdx <= rangeEndIdx && nextIdx < surahData.verses.length) {
    setTimeout(() => playAyah(nextIdx), delaySeconds * 1000);
  } else {
    if (playRangeCount === Infinity || currentRangeIteration < playRangeCount) {
      currentRangeIteration++;
      setTimeout(() => playAyah(rangeStart - 1), delaySeconds * 1000);
    } else {
      closeAudioBar();
    }
  }
});

btnListen.addEventListener('click', () => {
  if (currentAudioIndex === -1) {
    playAyah(rangeStart - 1);
  } else if (audioPlayer.paused) {
    openAudioBar();
    safePlay(audioPlayer);
    mainPlayPauseBtn.textContent = '❚❚';
    btnListen.textContent = '❚❚';
  } else {
    audioPlayer.pause();
    mainPlayPauseBtn.textContent = '▶';
    btnListen.textContent = '▶';
  }
});

mainPlayPauseBtn.addEventListener('click', () => {
  if (currentAudioIndex === -1) {
    playAyah(rangeStart - 1);
  } else if (audioPlayer.paused) {
    safePlay(audioPlayer);
    mainPlayPauseBtn.textContent = '❚❚';
    btnListen.textContent = '❚❚';
  } else {
    audioPlayer.pause();
    mainPlayPauseBtn.textContent = '▶';
    btnListen.textContent = '▶';
  }
});

prevAyahBtn.addEventListener('click', () => {
  if (currentAudioIndex > 0) playAyah(currentAudioIndex - 1);
});

const seekBack5Btn = document.getElementById('seekBack5Btn');
if (seekBack5Btn) {
  seekBack5Btn.addEventListener('click', () => {
    if (audioPlayer.src) {
      audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 5);
      currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
      if (audioPlayer.duration) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width = `${percent}%`;
        progressHandle.style.left = `${percent}%`;
      }
    }
  });
}

const seekForward5Btn = document.getElementById('seekForward5Btn');
if (seekForward5Btn) {
  seekForward5Btn.addEventListener('click', () => {
    if (audioPlayer.src) {
      const targetTime = audioPlayer.duration ? Math.min(audioPlayer.duration, audioPlayer.currentTime + 5) : audioPlayer.currentTime + 5;
      audioPlayer.currentTime = targetTime;
      currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
      if (audioPlayer.duration) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width = `${percent}%`;
        progressHandle.style.left = `${percent}%`;
      }
    }
  });
}

nextAyahBtn.addEventListener('click', () => {
  if (surahData && currentAudioIndex < surahData.verses.length - 1) {
    playAyah(currentAudioIndex + 1);
  }
});

let isDraggingAudioProgress = false;

function updateAudioProgressFromPointer(e) {
  if (!audioPlayer.duration || isNaN(audioPlayer.duration)) return 0;
  const rect = progressContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
  progressFill.style.width = `${percentage * 100}%`;
  progressHandle.style.left = `${percentage * 100}%`;
  currentTimeDisplay.textContent = formatTime(percentage * audioPlayer.duration);
  return percentage;
}

progressContainer.addEventListener('pointerdown', (e) => {
  if (!audioPlayer.duration || isNaN(audioPlayer.duration)) return;
  e.preventDefault();
  isDraggingAudioProgress = true;
  progressContainer.classList.add('dragging');
  try { progressContainer.setPointerCapture(e.pointerId); } catch (err) {}
  const percentage = updateAudioProgressFromPointer(e);
  audioPlayer.currentTime = percentage * audioPlayer.duration;
});

progressContainer.addEventListener('pointermove', (e) => {
  if (!isDraggingAudioProgress) return;
  e.preventDefault();
  const percentage = updateAudioProgressFromPointer(e);
  audioPlayer.currentTime = percentage * audioPlayer.duration;
});

const stopAudioProgressDrag = (e) => {
  if (!isDraggingAudioProgress) return;
  isDraggingAudioProgress = false;
  progressContainer.classList.remove('dragging');
  try {
    if (e && progressContainer.hasPointerCapture && progressContainer.hasPointerCapture(e.pointerId)) {
      progressContainer.releasePointerCapture(e.pointerId);
    }
  } catch (err) {}
};

progressContainer.addEventListener('pointerup', stopAudioProgressDrag);
progressContainer.addEventListener('pointercancel', stopAudioProgressDrag);

progressContainer.addEventListener('click', (e) => {
  if (!audioPlayer.duration || isNaN(audioPlayer.duration)) return;
  const rect = progressContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
  audioPlayer.currentTime = percentage * audioPlayer.duration;
});

audioPlayer.addEventListener('timeupdate', () => {
  if (isDraggingAudioProgress) return;
  const cur = audioPlayer.currentTime;
  const dur = audioPlayer.duration;
  currentTimeDisplay.textContent = formatTime(cur);

  if (dur && !isNaN(dur)) {
    const percent = (cur / dur) * 100;
    progressFill.style.width = `${percent}%`;
    progressHandle.style.left = `${percent}%`;
  }
});

audioPlayer.addEventListener('loadedmetadata', () => {
  durationTimeDisplay.textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener('play', () => {
  if (btnGradingPlayAudio && currentAudioIndex === currentGradingVerseIndex) {
    btnGradingPlayAudio.textContent = '❚❚';
    btnGradingPlayAudio.title = 'Pause Ayah Audio';
    btnGradingPlayAudio.classList.add('playing');
  }
});

audioPlayer.addEventListener('pause', () => {
  if (btnGradingPlayAudio) {
    btnGradingPlayAudio.textContent = '▶';
    btnGradingPlayAudio.title = 'Play Ayah Audio';
    btnGradingPlayAudio.classList.remove('playing');
  }
});

closeAudioBtn.addEventListener('click', closeAudioBar);

// Clicking the minimized line expands the audio bar
audioBarWrapper.addEventListener('click', (e) => {
  if (isMinimized) {
    isMinimized = false;
    audioBarWrapper.classList.remove('minimized');
    audioBarWrapper.classList.add('open');
    if (audioCollapseBtn) {
      audioCollapseBtn.textContent = '⌵';
      audioCollapseBtn.title = 'Minimize audio bar to line';
    }
  }
});

audioCollapseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  isMinimized = true;
  audioBarWrapper.classList.add('minimized');
  audioBarWrapper.setAttribute('title', 'Click to open audio bar');
});

audioMuteBtn.addEventListener('click', () => {
  audioPlayer.muted = !audioPlayer.muted;
  audioMuteBtn.style.opacity = audioPlayer.muted ? '0.4' : '1';
});

threeDotsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  threeDotsPopup.classList.toggle('show');
});

menuItemDownload.addEventListener('click', () => {
  if (currentAudioIndex === -1 && surahData) currentAudioIndex = 0;
  const url = surahData.verses[currentAudioIndex].audioUrl;
  const a = document.createElement('a');
  a.href = url;
  a.download = `Surah_${currentSurahNumber}_Ayah_${currentAudioIndex + 1}.mp3`;
  a.target = '_blank';
  a.click();
  threeDotsPopup.classList.remove('show');
});

menuItemRepeat.addEventListener('click', () => {
  threeDotsPopup.classList.remove('show');
  repeatModalOverlay.classList.add('show');
});

menuItemSpeed.addEventListener('click', (e) => {
  e.stopPropagation();
  menuItemSpeed.classList.toggle('open-sub');
  menuItemReciter.classList.remove('open-sub');
});

menuItemReciter.addEventListener('click', (e) => {
  e.stopPropagation();
  menuItemReciter.classList.toggle('open-sub');
  menuItemSpeed.classList.remove('open-sub');
});

document.querySelectorAll('#submenuSpeed .submenu-option').forEach(opt => {
  opt.addEventListener('click', (e) => {
    e.stopPropagation();
    const speed = parseFloat(opt.getAttribute('data-speed'));
    audioPlayer.playbackRate = speed;
    speedCurrentLabel.textContent = `${speed}x`;
    document.querySelectorAll('#submenuSpeed .submenu-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    menuItemSpeed.classList.remove('open-sub');
    threeDotsPopup.classList.remove('show');
  });
});

document.querySelectorAll('#submenuReciter .submenu-option').forEach(opt => {
  opt.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedReciter = opt.getAttribute('data-reciter');
    document.querySelectorAll('#submenuReciter .submenu-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    menuItemReciter.classList.remove('open-sub');
    threeDotsPopup.classList.remove('show');
    loadSurah(currentSurahNumber);
  });
});

repeatTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    repeatTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    repeatMode = tab.getAttribute('data-tab');

    if (repeatMode === 'single') {
      rangeInputsRow.style.display = 'flex';
      repeatToVerse.parentElement.style.display = 'none';
    } else if (repeatMode === 'range') {
      rangeInputsRow.style.display = 'flex';
      repeatToVerse.parentElement.style.display = 'block';
    } else {
      rangeInputsRow.style.display = 'none';
    }
  });
});

playRangeIncBtn.addEventListener('click', () => {
  playRangeCount = (playRangeCount === Infinity) ? 1 : playRangeCount + 1;
  playRangeVal.textContent = playRangeCount;
});

playRangeDecBtn.addEventListener('click', () => {
  if (playRangeCount === 1) {
    playRangeCount = Infinity;
    playRangeVal.textContent = '∞';
  } else if (playRangeCount > 1 && playRangeCount !== Infinity) {
    playRangeCount--;
    playRangeVal.textContent = playRangeCount;
  }
});

repeatVerseIncBtn.addEventListener('click', () => {
  repeatVerseCount++;
  repeatVerseVal.textContent = repeatVerseCount;
});
repeatVerseDecBtn.addEventListener('click', () => {
  if (repeatVerseCount > 1) {
    repeatVerseCount--;
    repeatVerseVal.textContent = repeatVerseCount;
  }
});

delayIncBtn.addEventListener('click', () => {
  delaySeconds++;
  delayVal.textContent = delaySeconds;
});
delayDecBtn.addEventListener('click', () => {
  if (delaySeconds > 0) {
    delaySeconds--;
    delayVal.textContent = delaySeconds;
  }
});

repeatCancelBtn.addEventListener('click', () => repeatModalOverlay.classList.remove('show'));
repeatModalOverlay.addEventListener('click', (e) => {
  if (e.target === repeatModalOverlay) repeatModalOverlay.classList.remove('show');
});

repeatStartBtn.addEventListener('click', () => {
  if (repeatMode === 'single') {
    const parts = repeatFromVerse.value.split(':');
    rangeStart = parseInt(parts[1]) || 1;
    rangeEnd = rangeStart;
  } else if (repeatMode === 'range') {
    const fromParts = repeatFromVerse.value.split(':');
    const toParts = repeatToVerse.value.split(':');
    rangeStart = parseInt(fromParts[1]) || 1;
    rangeEnd = parseInt(toParts[1]) || surahData.verses.length;
  } else {
    rangeStart = 1;
    rangeEnd = surahData.verses.length;
  }

  currentVersePlayIteration = 1;
  currentRangeIteration = 1;
  repeatModalOverlay.classList.remove('show');
  playAyah(rangeStart - 1);
});

// =========================================================
// WORD HOVER TOOLTIP & DETAIL MODAL
// =========================================================

wordHoverTooltip.addEventListener('mouseleave', () => {
  hoverTimeout = setTimeout(() => {
    if (!wordContextMenu.classList.contains('show')) {
      hideWordTooltip();
    }
  }, 200);
});

function showWordTooltip(wordEl) {
  const vIdx = parseInt(wordEl.getAttribute('data-verse-idx'));
  const wIdx = parseInt(wordEl.getAttribute('data-word-idx'));
  const trans = wordEl.getAttribute('data-trans') || '[We] created';

  activeHoveredWordData = { verseIndex: vIdx, wordIndex: wIdx, element: wordEl };

  if (activeHoveredWordEl && activeHoveredWordEl !== wordEl) {
    activeHoveredWordEl.classList.remove('active-word');
  }
  activeHoveredWordEl = wordEl;
  wordEl.classList.add('active-word');

  wordTooltipTransText.textContent = trans;
  const rect = wordEl.getBoundingClientRect();
  wordHoverTooltip.style.left = `${rect.left + rect.width / 2}px`;
  wordHoverTooltip.style.top = `${rect.top + window.scrollY}px`;
  wordHoverTooltip.classList.add('show');
  wordContextMenu.classList.remove('show');

  // Update context menu labels for this word
  const verse = surahData.verses[vIdx];
  const wordPos = wIdx + 1;
  const wordKey = `${currentSurahNumber}:${verse.verseNumber}:${wordPos}`;

  if (ctxMistakeLabel) {
    ctxMistakeLabel.textContent = memorizeMistakes[wordKey] ? '✓ Clear Mistake (Flagged)' : '🚩 Mark as Mistake';
  }
  const override = wordVisOverrides[wordKey];
  if (ctxPinVisLabel) {
    ctxPinVisLabel.textContent = override === 'visible' ? '✓ Pinned Always Visible' : '📌 Always Visible';
  }
  if (ctxPinHiddenLabel) {
    ctxPinHiddenLabel.textContent = override === 'hidden' ? '✓ Pinned Always Hidden' : '🙈 Always Hidden';
  }

}

function hideWordTooltip() {
  wordHoverTooltip.classList.remove('show');
  wordContextMenu.classList.remove('show');
  if (activeHoveredWordEl) {
    activeHoveredWordEl.classList.remove('active-word');
    activeHoveredWordEl = null;
  }
  activeHoveredWordData = null;
}

wordTooltipDotsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  wordContextMenu.classList.toggle('show');
});

wordTooltipTransBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (activeHoveredWordData) {
    openWordDetailModal(activeHoveredWordData.verseIndex, activeHoveredWordData.wordIndex);
  }
});

ctxItemMore.addEventListener('click', (e) => {
  e.stopPropagation();
  if (activeHoveredWordData) {
    openWordDetailModal(activeHoveredWordData.verseIndex, activeHoveredWordData.wordIndex);
  }
});

ctxItemPlayWord.addEventListener('click', (e) => {
  e.stopPropagation();
  if (activeHoveredWordData) {
    const word = surahData.verses[activeHoveredWordData.verseIndex].words[activeHoveredWordData.wordIndex];
    if (word && word.audioUrl) {
      audioPlayer.src = word.audioUrl;
      safePlay(audioPlayer);
    } else {
      audioPlayer.src = surahData.verses[activeHoveredWordData.verseIndex].audioUrl;
      safePlay(audioPlayer);
    }
    hideWordTooltip();
  }
});

if (ctxItemToggleMistake) {
  ctxItemToggleMistake.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeHoveredWordData) {
      const verse = surahData.verses[activeHoveredWordData.verseIndex];
      toggleWordMistake(currentSurahNumber, verse.verseNumber, activeHoveredWordData.wordIndex + 1);
      hideWordTooltip();
    }
  });
}

if (ctxItemPinVisible) {
  ctxItemPinVisible.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeHoveredWordData) {
      const verse = surahData.verses[activeHoveredWordData.verseIndex];
      const wordPos = activeHoveredWordData.wordIndex + 1;
      const wordKey = `${currentSurahNumber}:${verse.verseNumber}:${wordPos}`;
      const cur = wordVisOverrides[wordKey];
      setWordVisibilityOverride(currentSurahNumber, verse.verseNumber, wordPos, cur === 'visible' ? null : 'visible');
      hideWordTooltip();
    }
  });
}

if (ctxItemPinHidden) {
  ctxItemPinHidden.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeHoveredWordData) {
      const verse = surahData.verses[activeHoveredWordData.verseIndex];
      const wordPos = activeHoveredWordData.wordIndex + 1;
      const wordKey = `${currentSurahNumber}:${verse.verseNumber}:${wordPos}`;
      const cur = wordVisOverrides[wordKey];
      setWordVisibilityOverride(currentSurahNumber, verse.verseNumber, wordPos, cur === 'hidden' ? null : 'hidden');
      hideWordTooltip();
    }
  });
}

if (ctxItemResetVisibility) {
  ctxItemResetVisibility.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeHoveredWordData) {
      const verse = surahData.verses[activeHoveredWordData.verseIndex];
      setWordVisibilityOverride(currentSurahNumber, verse.verseNumber, activeHoveredWordData.wordIndex + 1, null);
      hideWordTooltip();
    }
  });
}

// Ayah Context Menu Actions
if (ayahCtxPinVisible) {
  ayahCtxPinVisible.addEventListener('click', () => {
    const cur = ayahVisOverrides[`${currentSurahNumber}:${activeAyahContextVerse}`];
    setAyahVisibilityOverride(currentSurahNumber, activeAyahContextVerse, cur === 'visible' ? null : 'visible');
    hideAyahContextMenu();
  });
}

if (ayahCtxPinHidden) {
  ayahCtxPinHidden.addEventListener('click', () => {
    const cur = ayahVisOverrides[`${currentSurahNumber}:${activeAyahContextVerse}`];
    setAyahVisibilityOverride(currentSurahNumber, activeAyahContextVerse, cur === 'hidden' ? null : 'hidden');
    hideAyahContextMenu();
  });
}

if (ayahCtxResetVis) {
  ayahCtxResetVis.addEventListener('click', () => {
    setAyahVisibilityOverride(currentSurahNumber, activeAyahContextVerse, null);
    hideAyahContextMenu();
  });
}

if (ayahCtxGrade) {
  ayahCtxGrade.addEventListener('click', () => {
    hideAyahContextMenu();
    openAyahGradingModal(currentSurahNumber, activeAyahContextVerse);
  });
}

if (ayahCtxPlay) {
  ayahCtxPlay.addEventListener('click', () => {
    hideAyahContextMenu();
    playAyahByNumber(activeAyahContextVerse);
  });
}

function openWordDetailModal(verseIdx, wordIdx) {
  hideWordTooltip();
  modalSelectedWord = { verseIndex: verseIdx, wordIndex: wordIdx };
  renderModalContent();
  wordDetailOverlay.classList.add('show');
}

function renderModalContent() {
  const { meta, verses } = surahData;
  const verse = verses[modalSelectedWord.verseIndex];
  const word = verse.words[modalSelectedWord.wordIndex];

  wdSurahPill.textContent = `${meta.englishName} ▾`;
  wdAyahPill.textContent = `${verse.verseNumber} ▾`;
  wdVerseKeyText.textContent = `${verse.verseKey}`;
  wdBannerTranslation.textContent = word ? word.translation : '[We] created';
  wdBannerTransliteration.textContent = word ? word.transliteration : 'khalaqnā';

  let arabicVerseHtml = '';
  verse.words.forEach((w, idx) => {
    const isSelected = idx === modalSelectedWord.wordIndex;
    arabicVerseHtml += `
      <span class="${isSelected ? 'wd-arabic-word-highlight' : ''}" 
            style="cursor:pointer; margin: 0 3px;"
            onclick="changeModalWord(${idx})">
        ${isHarakatVisible ? w.arabic : w.plain}
      </span>
    `;
  });
  arabicVerseHtml += getRosetteSvg(verse.verseNumber);
  wdArabicVerseContainer.innerHTML = arabicVerseHtml;
  wdTransEnText.textContent = verse.translationEn;
  wdTransIdText.textContent = verse.translationId;
}

window.changeModalWord = function(newWordIdx) {
  modalSelectedWord.wordIndex = newWordIdx;
  renderModalContent();
};

wdPrevWordBtn.addEventListener('click', () => {
  if (modalSelectedWord.wordIndex > 0) {
    modalSelectedWord.wordIndex--;
    renderModalContent();
  }
});

wdNextWordBtn.addEventListener('click', () => {
  const verse = surahData.verses[modalSelectedWord.verseIndex];
  if (modalSelectedWord.wordIndex < verse.words.length - 1) {
    modalSelectedWord.wordIndex++;
    renderModalContent();
  }
});

wdPrevAyahBtn.addEventListener('click', () => {
  if (modalSelectedWord.verseIndex > 0) {
    modalSelectedWord.verseIndex--;
    modalSelectedWord.wordIndex = 0;
    renderModalContent();
  }
});

wdNextAyahBtn.addEventListener('click', () => {
  if (modalSelectedWord.verseIndex < surahData.verses.length - 1) {
    modalSelectedWord.verseIndex++;
    modalSelectedWord.wordIndex = 0;
    renderModalContent();
  }
});

wdCloseBtn.addEventListener('click', () => wordDetailOverlay.classList.remove('show'));
wordDetailOverlay.addEventListener('click', (e) => {
  if (e.target === wordDetailOverlay) wordDetailOverlay.classList.remove('show');
});

wdPlayVerseBtn.addEventListener('click', () => {
  const verse = surahData.verses[modalSelectedWord.verseIndex];
  audioPlayer.src = verse.audioUrl;
  safePlay(audioPlayer);
});

// =========================================================
// VIEW SWITCHING & SETTINGS DRAWER
// =========================================================

viewBtnReading.addEventListener('click', () => {
  currentView = 'reading';
  if (isMemorizeMode) toggleMemorizeMode();
  viewBtnReading.classList.add('active');
  viewBtnVbv.classList.remove('active');
  readingView.style.display = 'block';
  vbvView.style.display = 'none';
  showAudioBar();
});

viewBtnVbv.addEventListener('click', () => {
  currentView = 'vbv';
  if (isMemorizeMode) toggleMemorizeMode();
  viewBtnVbv.classList.add('active');
  viewBtnReading.classList.remove('active');
  if (!isVbvRenderedForCurrentSurah) {
    renderVbvView();
  }
  vbvView.style.display = 'block';
  readingView.style.display = 'none';
  showAudioBar();
});

settingsToggle.addEventListener('click', () => {
  settingsDrawer.classList.add('open');
  sidebarOverlay.classList.add('open');
});

function closeSettings() {
  settingsDrawer.classList.remove('open');
  sidebarOverlay.classList.remove('open');
}
closeSettingsBtn.addEventListener('click', closeSettings);
sidebarOverlay.addEventListener('click', closeSettings);
if (drawerCloseIconBtn) drawerCloseIconBtn.addEventListener('click', closeSettings);

fontIncBtn.addEventListener('click', () => {
  if (fontScaleLevel < 5) {
    fontScaleLevel++;
    fontSizeDisplay.textContent = fontScaleLevel;
    document.documentElement.style.setProperty('--arabic-scale', `${28 + fontScaleLevel * 3}px`);
  }
});

fontDecBtn.addEventListener('click', () => {
  if (fontScaleLevel > -2) {
    fontScaleLevel--;
    fontSizeDisplay.textContent = fontScaleLevel;
    document.documentElement.style.setProperty('--arabic-scale', `${28 + fontScaleLevel * 3}px`);
  }
});

fontStyleSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  let fontStack = '';
  switch (val) {
    case 'KFGQPC-Hafs':
      fontStack = "'KFGQPC-Hafs', 'Amiri Quran', 'Amiri', serif";
      break;
    case 'Amiri Quran':
      fontStack = "'Amiri Quran', 'Amiri', serif";
      break;
    case 'Amiri':
      fontStack = "'Amiri', serif";
      break;
    case 'Scheherazade New':
      fontStack = "'Scheherazade New', 'Amiri', serif";
      break;
    case 'Parastoo':
      fontStack = "'Parastoo', 'Scheherazade New', 'Amiri', serif";
      break;
    case 'Noto Naskh Arabic':
      fontStack = "'Noto Naskh Arabic', 'Amiri', serif";
      break;
    case 'Lateef':
      fontStack = "'Lateef', 'Amiri', serif";
      break;
    default:
      fontStack = "'KFGQPC-Hafs', 'Amiri Quran', 'Amiri', serif";
  }
  document.documentElement.style.setProperty('--font-arabic', fontStack);
  if (previewArabicText) previewArabicText.style.fontFamily = fontStack;
});

// Line Height Controls
let currentLineHeight = 2.4;
const lineHeightDecBtn = document.getElementById('lineHeightDecBtn');
const lineHeightIncBtn = document.getElementById('lineHeightIncBtn');
const lineHeightDisplay = document.getElementById('lineHeightDisplay');

if (lineHeightDecBtn && lineHeightIncBtn) {
  lineHeightDecBtn.addEventListener('click', () => {
    if (currentLineHeight > 1.6) {
      currentLineHeight = +(currentLineHeight - 0.2).toFixed(1);
      lineHeightDisplay.textContent = currentLineHeight.toFixed(1);
      document.documentElement.style.setProperty('--arabic-line-height', currentLineHeight);
    }
  });

  lineHeightIncBtn.addEventListener('click', () => {
    if (currentLineHeight < 3.8) {
      currentLineHeight = +(currentLineHeight + 0.2).toFixed(1);
      lineHeightDisplay.textContent = currentLineHeight.toFixed(1);
      document.documentElement.style.setProperty('--arabic-line-height', currentLineHeight);
    }
  });
}

// Verse By Verse Visibility Options (Arabic & Translations)
const toggleVbvArabic = document.getElementById('toggleVbvArabic');
const toggleVbvEn = document.getElementById('toggleVbvEn');
const toggleVbvId = document.getElementById('toggleVbvId');

if (toggleVbvArabic) {
  toggleVbvArabic.addEventListener('change', () => {
    document.body.classList.toggle('hide-vbv-arabic', !toggleVbvArabic.checked);
  });
}

if (toggleVbvEn) {
  toggleVbvEn.addEventListener('change', () => {
    document.body.classList.toggle('hide-vbv-en', !toggleVbvEn.checked);
  });
}

if (toggleVbvId) {
  toggleVbvId.addEventListener('change', () => {
    document.body.classList.toggle('hide-vbv-id', !toggleVbvId.checked);
  });
}

if (togglePopupTap) {
  togglePopupTap.checked = (wordPopupTrigger === 'tap');
  togglePopupTap.addEventListener('change', (e) => {
    wordPopupTrigger = e.target.checked ? 'tap' : 'hover';
    localStorage.setItem(POPUP_TRIGGER_KEY, wordPopupTrigger);
    showToastNotification(`Word Pop-up set to ${wordPopupTrigger === 'tap' ? 'Tap / Click' : 'Hover'}`);
  });
}

function updateMemorizeOverridesStats() {
  if (!memorizeOverridesStats) return;
  const curMistakes = Object.keys(memorizeMistakes).filter(k => k.startsWith(`${currentSurahNumber}:`)).length;
  const totalMistakes = Object.keys(memorizeMistakes).length;
  const pinnedWords = Object.keys(wordVisOverrides).length;
  const pinnedAyahs = Object.keys(ayahVisOverrides).length;
  memorizeOverridesStats.textContent = `${curMistakes} mistakes in Surah ${currentSurahNumber} (${totalMistakes} total) • ${pinnedWords} pinned words • ${pinnedAyahs} pinned ayahs`;
}

if (btnClearSurahMistakes) {
  btnClearSurahMistakes.addEventListener('click', () => {
    let count = 0;
    Object.keys(memorizeMistakes).forEach(key => {
      if (key.startsWith(`${currentSurahNumber}:`)) {
        delete memorizeMistakes[key];
        count++;
      }
    });
    saveMistakes(memorizeMistakes);
    updateWordElementsMistakeClasses();
    updateActiveMistakeButtonState();
    updateMemorizeOverridesStats();
    showToastNotification(`Cleared ${count} mistakes from Surah ${currentSurahNumber}`);
  });
}

if (btnResetVisOverrides) {
  btnResetVisOverrides.addEventListener('click', () => {
    wordVisOverrides = {};
    ayahVisOverrides = {};
    saveWordVisOverrides(wordVisOverrides);
    saveAyahVisOverrides(ayahVisOverrides);
    applyMemorizeState(true);
    updateAyahMarkersVisibility();
    updateMemorizeOverridesStats();
    showToastNotification('Reset all word and ayah visibility overrides');
  });
}

resetSettingsBtn.addEventListener('click', () => {
  fontScaleLevel = 1;
  fontSizeDisplay.textContent = '1';
  document.documentElement.style.setProperty('--arabic-scale', '32px');
  currentLineHeight = 2.4;
  if (lineHeightDisplay) lineHeightDisplay.textContent = '2.4';
  document.documentElement.style.setProperty('--arabic-line-height', '2.4');
  fontStyleSelect.value = 'KFGQPC-Hafs';
  document.documentElement.style.setProperty('--font-arabic', "'KFGQPC-Hafs', 'Amiri Quran', 'Amiri', serif");
  if (toggleVbvArabic) { toggleVbvArabic.checked = true; document.body.classList.remove('hide-vbv-arabic'); }
  if (toggleVbvEn) { toggleVbvEn.checked = true; document.body.classList.remove('hide-vbv-en'); }
  if (toggleVbvId) { toggleVbvId.checked = true; document.body.classList.remove('hide-vbv-id'); }
  if (togglePopupTap) {
    togglePopupTap.checked = false;
    wordPopupTrigger = 'hover';
    localStorage.setItem(POPUP_TRIGGER_KEY, 'hover');
  }
});

surahSelectBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  surahDropdown.classList.toggle('show');
});

// Global outside-click dismisser
document.addEventListener('click', (e) => {
  if (!surahSelectBtn.contains(e.target)) {
    surahDropdown.classList.remove('show');
  }
  if (!threeDotsPopup.contains(e.target) && e.target !== threeDotsBtn) {
    threeDotsPopup.classList.remove('show');
    menuItemSpeed.classList.remove('open-sub');
    menuItemReciter.classList.remove('open-sub');
  }
  if (!memSpeedPopover.contains(e.target) && !memPlayRevealBtn.contains(e.target) && e.target !== memSpeedBadge) {
    memSpeedPopover.classList.remove('show');
  }
  if (ayahContextMenu && !ayahContextMenu.contains(e.target) && !e.target.closest('.ayah-marker')) {
    hideAyahContextMenu();
  }
  if (wordPopupTrigger === 'tap' && wordHoverTooltip && !wordHoverTooltip.contains(e.target) && !e.target.closest('.mushaf-word')) {
    hideWordTooltip();
  }
});

window.selectSurah = function(id) {
  surahDropdown.classList.remove('show');
  loadSurah(id);
};

// =========================================================
// LOCAL STORAGE OFFLINE PERSISTENCE & FILE EXPORT
// =========================================================

const QURAN_DB_NAME = 'QuranOfflineDB';
const QURAN_DB_VERSION = 1;
const QURAN_STORE_NAME = 'surahs';

function openQuranDb() {
  return new Promise((resolve) => {
    if (!window.indexedDB) return resolve(null);
    try {
      const req = indexedDB.open(QURAN_DB_NAME, QURAN_DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(QURAN_STORE_NAME)) {
          db.createObjectStore(QURAN_STORE_NAME, { keyPath: 'surahNumber' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
}

async function saveSurahToLocalOffline(surahObj) {
  if (!surahObj || !surahObj.meta) return false;
  const num = surahObj.meta.number;

  // Save to IndexedDB (virtually unlimited browser storage)
  const db = await openQuranDb();
  if (db) {
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(QURAN_STORE_NAME, 'readwrite');
        const store = tx.objectStore(QURAN_STORE_NAME);
        store.put({ surahNumber: num, data: surahObj, savedAt: new Date().toISOString() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
      // Also cache in localStorage if possible
      try { localStorage.setItem(`quran_offline_surah_${num}`, JSON.stringify(surahObj)); } catch (e) {}
      return true;
    } catch (e) {
      console.warn('IndexedDB save failed, falling back to localStorage:', e);
    }
  }

  // Fallback to localStorage
  try {
    localStorage.setItem(`quran_offline_surah_${num}`, JSON.stringify(surahObj));
    return true;
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    return false;
  }
}

async function getSurahFromLocalOffline(num) {
  const db = await openQuranDb();
  if (db) {
    try {
      const data = await new Promise((resolve) => {
        const tx = db.transaction(QURAN_STORE_NAME, 'readonly');
        const store = tx.objectStore(QURAN_STORE_NAME);
        const req = store.get(num);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      });
      if (data) return data;
    } catch (e) {}
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(`quran_offline_surah_${num}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function getOfflineSurahsCount() {
  const db = await openQuranDb();
  if (db) {
    try {
      return await new Promise((resolve) => {
        const tx = db.transaction(QURAN_STORE_NAME, 'readonly');
        const store = tx.objectStore(QURAN_STORE_NAME);
        const req = store.count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      });
    } catch (e) {}
  }

  let count = 0;
  for (let i = 1; i <= 114; i++) {
    if (localStorage.getItem(`quran_offline_surah_${i}`)) count++;
  }
  return count;
}

async function updateOfflineStorageStatus() {
  if (!offlineStorageCount) return;
  const count = await getOfflineSurahsCount();
  offlineStorageCount.textContent = `Offline Cache: ${count} of 114 Surahs saved locally`;
}

async function fetchSurahPayload(num) {
  const [qdcRes, metaRes] = await Promise.all([
    fetch(`https://api.quran.com/api/v4/verses/by_chapter/${num}?language=en&words=true&word_fields=text_uthmani&translations=20,33&per_page=300`),
    fetch(`https://api.alquran.cloud/v1/surah/${num}/editions/${selectedReciter}`)
  ]);
  const json = await qdcRes.json();
  const metaJson = await metaRes.json();
  const metaInfo = metaJson.data[0];

  let globalWordCounter = 0;
  const bismillahWords = ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَـٰنِ", "ٱلرَّحِيمِ", "اللَّهِ", "الرَّحْمٰنِ", "الرَّحِيمِ"];

  const verses = json.verses.map((v, idx) => {
    const wordList = v.words.filter(w => w.char_type_name === 'word').map(w => ({
      id: w.id,
      position: w.position,
      arabic: w.text_uthmani,
      plain: stripHarakat(w.text_uthmani),
      translation: w.translation ? w.translation.text : '',
      transliteration: w.transliteration ? w.transliteration.text : '',
      audioUrl: w.audio_url ? `https://audio.qurancdn.com/${w.audio_url}` : null
    }));

    if (v.verse_number === 1 && num !== 1 && num !== 9) {
      while (wordList.length > 0 && bismillahWords.includes(wordList[0].arabic)) {
        wordList.shift();
      }
    }

    const startIdx = globalWordCounter;
    globalWordCounter += wordList.length;
    const endIdx = globalWordCounter - 1;

    return {
      verseNumber: v.verse_number,
      verseKey: v.verse_key,
      pageNumber: v.page_number,
      juzNumber: v.juz_number,
      hizbNumber: v.hizb_number,
      words: wordList,
      startWordIdx: startIdx,
      endWordIdx: endIdx,
      translationEn: v.translations && v.translations[0] ? v.translations[0].text.replace(/<[^>]+>/g, '') : '',
      translationId: v.translations && v.translations[1] ? v.translations[1].text.replace(/<[^>]+>/g, '') : '',
      audioUrl: metaInfo.ayahs[idx] ? metaInfo.ayahs[idx].audio : ''
    };
  });

  return { meta: metaInfo, verses: verses };
}

let isBatchOfflineDownloading = false;

async function saveAllQuranOffline() {
  if (isBatchOfflineDownloading) {
    isBatchOfflineDownloading = false;
    if (btnSaveAllQuranOffline) btnSaveAllQuranOffline.textContent = '📦 Save All 114 Surahs';
    if (saveLocalStatusMsg) saveLocalStatusMsg.textContent = '⏸ Paused offline download.';
    return;
  }

  isBatchOfflineDownloading = true;
  if (btnSaveAllQuranOffline) btnSaveAllQuranOffline.textContent = '⏹ Stop Saving';
  if (saveLocalStatusMsg) {
    saveLocalStatusMsg.style.color = '#3b82f6';
    saveLocalStatusMsg.textContent = 'Starting download of all 114 Surahs...';
  }

  let savedCount = 0;
  for (let i = 1; i <= 114; i++) {
    if (!isBatchOfflineDownloading) break;
    const existing = await getSurahFromLocalOffline(i);
    if (existing) {
      savedCount++;
      if (saveLocalStatusMsg) saveLocalStatusMsg.textContent = `Surah ${i}/114 already saved locally...`;
      continue;
    }

    if (saveLocalStatusMsg) saveLocalStatusMsg.textContent = `Downloading Surah ${i} of 114 for offline use...`;
    try {
      const payload = await fetchSurahPayload(i);
      await saveSurahToLocalOffline(payload);
      savedCount++;
      await updateOfflineStorageStatus();
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.warn(`Failed to fetch Surah ${i}:`, err);
    }
  }

  isBatchOfflineDownloading = false;
  if (btnSaveAllQuranOffline) btnSaveAllQuranOffline.textContent = '📦 Save All 114 Surahs';
  if (saveLocalStatusMsg) {
    saveLocalStatusMsg.style.color = '#10b981';
    saveLocalStatusMsg.textContent = `✓ Offline download complete! ${savedCount} Surahs saved locally.`;
  }
  await updateOfflineStorageStatus();
}

function downloadSurahAsText() {
  if (!surahData) return;
  const meta = surahData.meta;
  let textContent = `=================================================\n`;
  textContent += `SURAH ${meta.number}: ${meta.englishName.toUpperCase()} (${meta.name})\n`;
  textContent += `Translation: ${meta.englishNameTranslation}\n`;
  textContent += `Revelation: ${meta.revelationType} | Total Verses: ${surahData.verses.length}\n`;
  textContent += `=================================================\n\n`;

  if (meta.number !== 1 && meta.number !== 9) {
    textContent += `بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ\n\n`;
  }

  surahData.verses.forEach(v => {
    const arabicText = v.words.map(w => w.arabic).join(' ');
    textContent += `[${meta.number}:${v.verseNumber}] ${arabicText}\n`;
    if (v.translationEn) {
      textContent += `(EN) ${v.translationEn}\n`;
    }
    if (v.translationId) {
      textContent += `(ID) ${v.translationId}\n`;
    }
    textContent += `\n`;
  });

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Surah_${meta.number}_${meta.englishName.replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadSurahAsJson() {
  if (!surahData) return;
  const meta = surahData.meta;
  const jsonString = JSON.stringify(surahData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Surah_${meta.number}_${meta.englishName.replace(/\s+/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

if (btnSaveLocalOffline) {
  btnSaveLocalOffline.addEventListener('click', async () => {
    if (!surahData) return;
    saveLocalStatusMsg.textContent = `Saving Surah ${currentSurahNumber} locally...`;
    saveLocalStatusMsg.style.color = '#3b82f6';
    const ok = await saveSurahToLocalOffline(surahData);
    if (ok) {
      saveLocalStatusMsg.textContent = `✓ Surah ${currentSurahNumber} saved to local storage for offline use.`;
      saveLocalStatusMsg.style.color = '#10b981';
      await updateOfflineStorageStatus();
    } else {
      saveLocalStatusMsg.textContent = `✕ Failed to save Surah to local storage.`;
      saveLocalStatusMsg.style.color = '#ef4444';
    }
    setTimeout(() => {
      if (saveLocalStatusMsg && !isBatchOfflineDownloading) saveLocalStatusMsg.textContent = '';
    }, 4500);
  });
}

if (btnSaveAllQuranOffline) {
  btnSaveAllQuranOffline.addEventListener('click', saveAllQuranOffline);
}

if (btnDownloadSurahTxt) {
  btnDownloadSurahTxt.addEventListener('click', downloadSurahAsText);
}

if (btnDownloadSurahJson) {
  btnDownloadSurahJson.addEventListener('click', downloadSurahAsJson);
}

if (menuItemSaveText) {
  menuItemSaveText.addEventListener('click', () => {
    threeDotsPopup.classList.remove('show');
    downloadSurahAsText();
  });
}

// =========================================================
// KEYBOARD SHORTCUTS FOR MEMORIZE REVEAL & UNREVEAL
// =========================================================

window.addEventListener('keydown', (e) => {
  const activeEl = document.activeElement;
  const tag = activeEl ? activeEl.tagName.toLowerCase() : '';
  if (['input', 'textarea', 'select'].includes(tag) || activeEl?.isContentEditable) {
    return;
  }

  if (isRecallMode) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleCurrentRecallVerse();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextRecallVerse();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      prevRecallVerse();
    } else if (e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 'x') {
      e.preventDefault();
      flagRecallMistake();
    } else if (e.key.toLowerCase() === 'g') {
      e.preventDefault();
      gradeRecallVerse();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      toggleWholeSurahRecallMode(false);
    }
    return;
  }

  if (isMemorizeMode) {
    // ArrowRight, ArrowDown, Space reveal next word
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      revealNextWord(false);
    }
    // ArrowLeft, ArrowUp, Backspace unreveal previous word
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'Backspace') {
      e.preventDefault();
      unrevealPreviousWord(false);
    }
    // 'm' or 'x': Mark/Unmark Mistake on active word
    else if (e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 'x') {
      e.preventDefault();
      if (revealedWordCount > 0 && totalWordElements[revealedWordCount - 1]) {
        const activeEl = totalWordElements[revealedWordCount - 1];
        const vNum = parseInt(activeEl.getAttribute('data-verse-num'));
        const wIdx = parseInt(activeEl.getAttribute('data-word-idx'));
        toggleWordMistake(currentSurahNumber, vNum, wIdx + 1);
      }
    }
    // 'v': Toggle Always Visible on active word
    else if (e.key.toLowerCase() === 'v') {
      e.preventDefault();
      if (revealedWordCount > 0 && totalWordElements[revealedWordCount - 1]) {
        const activeEl = totalWordElements[revealedWordCount - 1];
        const vNum = parseInt(activeEl.getAttribute('data-verse-num'));
        const wIdx = parseInt(activeEl.getAttribute('data-word-idx'));
        const wordKey = `${currentSurahNumber}:${vNum}:${wIdx + 1}`;
        const curOverride = wordVisOverrides[wordKey];
        setWordVisibilityOverride(currentSurahNumber, vNum, wIdx + 1, curOverride === 'visible' ? null : 'visible');
      }
    }
    // 'h': Toggle Always Hidden on active word
    else if (e.key.toLowerCase() === 'h') {
      e.preventDefault();
      if (revealedWordCount > 0 && totalWordElements[revealedWordCount - 1]) {
        const activeEl = totalWordElements[revealedWordCount - 1];
        const vNum = parseInt(activeEl.getAttribute('data-verse-num'));
        const wIdx = parseInt(activeEl.getAttribute('data-word-idx'));
        const wordKey = `${currentSurahNumber}:${vNum}:${wIdx + 1}`;
        const curOverride = wordVisOverrides[wordKey];
        setWordVisibilityOverride(currentSurahNumber, vNum, wIdx + 1, curOverride === 'hidden' ? null : 'hidden');
      }
    }
  }
});

// =========================================================
// WORD FSRS SPACED REPETITION ENGINE (Free Spaced Repetition Scheduler)
// Reference: https://open-spaced-repetition.github.io/awesome-fsrs/
// =========================================================

const FSRS_RATING = {
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4
};

const FSRS_STATE = {
  NEW: 0,
  LEARNING: 1,
  REVIEW: 2,
  RELEARNING: 3
};

// Standard FSRS Parameters (v4.5)
const FSRS_PARAMS = {
  w: [
    0.40255, 1.18385, 3.173, 15.69105, 
    7.1949, 0.5345, 1.4604, 0.0046, 
    1.54575, 0.1192, 1.01925, 1.9395, 
    0.11, 0.29605, 2.2698, 0.2315, 2.9898
  ],
  requestRetention: 0.9,
  maximumInterval: 36500
};

const FSRS_STORAGE_KEY = 'quran_fsrs_word_cards';

function loadFsrsCards() {
  try {
    const raw = localStorage.getItem(FSRS_STORAGE_KEY);
    const loaded = raw ? JSON.parse(raw) : {};
    const migrated = {};
    Object.keys(loaded).forEach(k => {
      const parts = k.split(':');
      if (parts.length === 2) {
        migrated[k] = loaded[k];
      } else if (parts.length === 3) {
        const ayahKey = `${parts[0]}:${parts[1]}`;
        if (!migrated[ayahKey]) {
          const c = loaded[k];
          migrated[ayahKey] = {
            id: ayahKey,
            surahNumber: parseInt(parts[0]),
            verseNumber: parseInt(parts[1]),
            arabic: '',
            translation: '',
            state: c.state,
            due: c.due,
            stability: c.stability,
            difficulty: c.difficulty,
            reps: c.reps,
            lapses: c.lapses,
            last_review: c.last_review,
            last_rating: c.last_rating
          };
        }
      }
    });
    return migrated;
  } catch (e) {
    console.warn('Failed to load FSRS cards:', e);
    return {};
  }
}

let fsrsCardStore = loadFsrsCards();

function saveFsrsCards() {
  try {
    localStorage.setItem(FSRS_STORAGE_KEY, JSON.stringify(fsrsCardStore));
  } catch (e) {
    console.warn('Failed to save FSRS cards:', e);
  }
}

function getAyahCardKey(surahNum, verseNum) {
  return `${surahNum}:${verseNum}`;
}

function getOrCreateAyahCard(surahNum, verseNum, verseData) {
  const key = getAyahCardKey(surahNum, verseNum);
  if (fsrsCardStore[key]) {
    if (verseData) {
      if (!fsrsCardStore[key].arabic && verseData.words) {
        fsrsCardStore[key].arabic = verseData.words.map(w => w.arabic).join(' ');
      }
      if (!fsrsCardStore[key].translation && verseData.translationEn) {
        fsrsCardStore[key].translation = verseData.translationEn;
      }
    }
    return fsrsCardStore[key];
  }
  let arabicText = '';
  let transText = '';
  if (verseData) {
    arabicText = verseData.words ? verseData.words.map(w => w.arabic).join(' ') : (verseData.arabic || '');
    transText = verseData.translationEn || verseData.translation || '';
  }
  const newCard = {
    id: key,
    surahNumber: surahNum,
    verseNumber: verseNum,
    arabic: arabicText,
    translation: transText,
    state: FSRS_STATE.NEW,
    due: new Date().toISOString(),
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    last_review: null,
    last_rating: null
  };
  fsrsCardStore[key] = newCard;
  return newCard;
}

function getWordCardKey(surahNum, verseNum, wordPos) {
  return getAyahCardKey(surahNum, verseNum);
}

function getOrCreateWordCard(surahNum, verseNum, wordPos, wordData) {
  return getOrCreateAyahCard(surahNum, verseNum);
}

function scheduleFsrsReview(card, rating, now = new Date()) {
  const w = FSRS_PARAMS.w;
  const r = FSRS_PARAMS.requestRetention;
  const lastDate = card.last_review ? new Date(card.last_review) : now;
  const elapsedDays = Math.max(0, (now.getTime() - lastDate.getTime()) / 86400000);

  let newStability = 0;
  let newDifficulty = 0;
  let nextState = card.state;
  let scheduledDays = 0;
  let lapses = card.lapses || 0;
  let reps = (card.reps || 0) + 1;

  if (card.state === FSRS_STATE.NEW) {
    newStability = w[rating - 1];
    newDifficulty = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
    newDifficulty = Math.max(1, Math.min(10, newDifficulty));

    if (rating === FSRS_RATING.AGAIN) {
      nextState = FSRS_STATE.LEARNING;
      scheduledDays = 0;
      lapses++;
    } else if (rating === FSRS_RATING.HARD) {
      nextState = FSRS_STATE.LEARNING;
      scheduledDays = 0;
    } else if (rating === FSRS_RATING.GOOD) {
      nextState = FSRS_STATE.REVIEW;
      scheduledDays = 1;
    } else if (rating === FSRS_RATING.EASY) {
      nextState = FSRS_STATE.REVIEW;
      scheduledDays = Math.max(2, Math.round(newStability));
    }
  } else {
    const currentS = Math.max(0.1, card.stability);
    const currentD = Math.max(1, Math.min(10, card.difficulty));
    const retrievability = Math.pow(1 + (19 / 81) * (elapsedDays / currentS), -0.5);

    const deltaD = -w[6] * (rating - 3);
    const meanD0 = w[4] - Math.exp(w[5] * 2) + 1;
    let nextD = currentD + deltaD * ((10 - currentD) / 9);
    nextD = w[7] * meanD0 + (1 - w[7]) * nextD;
    newDifficulty = Math.max(1, Math.min(10, nextD));

    if (rating === FSRS_RATING.AGAIN) {
      newStability = w[11] * Math.pow(newDifficulty, -w[12]) * (Math.pow(currentS + 1, w[13]) - 1) * Math.exp(w[14] * (1 - retrievability));
      newStability = Math.max(0.1, newStability);
      nextState = FSRS_STATE.RELEARNING;
      lapses++;
      scheduledDays = 0;
    } else {
      const hardPenalty = (rating === FSRS_RATING.HARD) ? w[15] : 1.0;
      const easyBonus = (rating === FSRS_RATING.EASY) ? w[16] : 1.0;
      newStability = currentS * (1 + Math.exp(w[8]) * (11 - newDifficulty) * Math.pow(currentS, -w[9]) * (Math.exp(w[10] * (1 - retrievability)) - 1) * hardPenalty * easyBonus);
      newStability = Math.max(0.1, newStability);
      nextState = FSRS_STATE.REVIEW;

      let interval = Math.round(newStability * ((Math.pow(r, -2) - 1) / (19 / 81)));
      interval = Math.max(1, Math.min(FSRS_PARAMS.maximumInterval, interval || Math.round(newStability)));
      if (rating === FSRS_RATING.HARD) {
        interval = Math.max(1, Math.min(interval, Math.round(elapsedDays + 1)));
      }
      scheduledDays = interval;
    }
  }

  let dueTime;
  if (scheduledDays === 0) {
    const mins = (rating === FSRS_RATING.AGAIN) ? 10 : 30;
    dueTime = new Date(now.getTime() + mins * 60000);
  } else {
    dueTime = new Date(now.getTime() + scheduledDays * 86400000);
  }

  card.stability = +newStability.toFixed(2);
  card.difficulty = +newDifficulty.toFixed(2);
  card.state = nextState;
  card.reps = reps;
  card.lapses = lapses;
  card.elapsed_days = +elapsedDays.toFixed(1);
  card.scheduled_days = scheduledDays;
  card.last_review = now.toISOString();
  card.last_rating = rating;
  card.due = dueTime.toISOString();

  saveFsrsCards();
  return card;
}

function getIntervalLabel(card, rating) {
  if (!card || card.state === FSRS_STATE.NEW) {
    if (rating === 1) return '<10m';
    if (rating === 2) return '30m';
    if (rating === 3) return '1d';
    if (rating === 4) return '3d';
  }
  if (rating === 1) return '<10m';
  if (rating === 2) return '1d';
  const s = card.stability || 1;
  if (rating === 3) {
    const days = Math.max(1, Math.round(s));
    return days >= 30 ? `${(days/30).toFixed(1)}mo` : `${days}d`;
  }
  if (rating === 4) {
    const days = Math.max(2, Math.round(s * 1.8));
    return days >= 30 ? `${(days/30).toFixed(1)}mo` : `${days}d`;
  }
  return '';
}

function getDueTimeStr(dueIso) {
  if (!dueIso) return 'Now';
  const due = new Date(dueIso);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return 'Due now';
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(diffMs / 3600000);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(diffMs / 86400000);
  if (days < 30) return `in ${days}d`;
  const months = Math.round(days / 30);
  return `in ${months}mo`;
}

// =========================================================
// AYAH FSRS GRADING MODAL LOGIC
// =========================================================

let currentGradingVerseIndex = 0;

function openAyahGradingModal(surahNum, verseNum) {
  if (!surahData || !surahData.verses) return;
  const vIdx = surahData.verses.findIndex(v => v.verseNumber === verseNum);
  if (vIdx === -1) return;

  currentGradingVerseIndex = vIdx;
  renderGradingModal();
  ayahGradingOverlay.classList.add('show');
}

function closeAyahGradingModal() {
  ayahGradingOverlay.classList.remove('show');
}

function renderGradingModal() {
  if (!surahData || !surahData.verses[currentGradingVerseIndex]) return;
  const verse = surahData.verses[currentGradingVerseIndex];
  const meta = surahData.meta;

  if (gradingSurahBadge) gradingSurahBadge.textContent = `${meta.number}. ${meta.englishName}`;
  if (gradingAyahTitle) gradingAyahTitle.textContent = `Ayah ${verse.verseNumber}`;
  if (gradingAyahCounter) gradingAyahCounter.textContent = `${verse.verseNumber} / ${surahData.verses.length}`;

  if (btnGradingPlayAudio) {
    const isThisVersePlaying = (currentAudioIndex === currentGradingVerseIndex && !audioPlayer.paused);
    btnGradingPlayAudio.textContent = isThisVersePlaying ? '❚❚' : '▶';
    btnGradingPlayAudio.title = isThisVersePlaying ? 'Pause Ayah Audio' : 'Play Ayah Audio';
    btnGradingPlayAudio.classList.toggle('playing', isThisVersePlaying);
  }

  let arabicVerseText = verse.words.map(w => isHarakatVisible ? w.arabic : w.plain).join(' ');
  if (gradingArabicVerse) gradingArabicVerse.innerHTML = `${arabicVerseText} ${getRosetteSvg(verse.verseNumber)}`;
  if (gradingVerseTrans) gradingVerseTrans.textContent = verse.translationEn || '';

  const card = getOrCreateAyahCard(meta.number, verse.verseNumber, verse);

  if (gradingAyahStatus) {
    gradingAyahStatus.className = 'compact-status-badge';
    if (card.state === FSRS_STATE.NEW) {
      gradingAyahStatus.classList.add('state-new');
      gradingAyahStatus.textContent = 'New';
    } else if (card.state === FSRS_STATE.LEARNING) {
      gradingAyahStatus.classList.add('state-learning');
      gradingAyahStatus.textContent = `Learning • Due ${getDueTimeStr(card.due)}`;
    } else if (card.state === FSRS_STATE.REVIEW) {
      gradingAyahStatus.classList.add('state-review');
      gradingAyahStatus.textContent = `Review • S:${card.stability}d • Due ${getDueTimeStr(card.due)}`;
    } else if (card.state === FSRS_STATE.RELEARNING) {
      gradingAyahStatus.classList.add('state-relearning');
      gradingAyahStatus.textContent = `Lapsed • Due ${getDueTimeStr(card.due)}`;
    }
  }

  if (gradeIntAgain) gradeIntAgain.textContent = getIntervalLabel(card, 1);
  if (gradeIntHard) gradeIntHard.textContent = getIntervalLabel(card, 2);
  if (gradeIntGood) gradeIntGood.textContent = getIntervalLabel(card, 3);
  if (gradeIntEasy) gradeIntEasy.textContent = getIntervalLabel(card, 4);
}

function gradeCurrentAyah(rating) {
  if (!surahData || !surahData.verses[currentGradingVerseIndex]) return;
  const verse = surahData.verses[currentGradingVerseIndex];
  const card = getOrCreateAyahCard(surahData.meta.number, verse.verseNumber, verse);
  scheduleFsrsReview(card, rating);
  updateFsrsBadgeAndNotifications();
  updateTopSurahDueBadge();
  renderSurahDropdown();
  if (isReviewMode) {
    applyMemorizeState(false);
  }

  const ratingNames = ['Again', 'Hard', 'Good', 'Easy'];
  showToastNotification(`Ayah ${verse.verseNumber} graded: ${ratingNames[rating - 1]}`);

  // Advance to next Ayah automatically if available, otherwise refresh
  if (currentGradingVerseIndex < surahData.verses.length - 1) {
    currentGradingVerseIndex++;
    renderGradingModal();
  } else {
    renderGradingModal();
  }
}

if (btnGradeAyahAgain) btnGradeAyahAgain.addEventListener('click', () => gradeCurrentAyah(1));
if (btnGradeAyahHard) btnGradeAyahHard.addEventListener('click', () => gradeCurrentAyah(2));
if (btnGradeAyahGood) btnGradeAyahGood.addEventListener('click', () => gradeCurrentAyah(3));
if (btnGradeAyahEasy) btnGradeAyahEasy.addEventListener('click', () => gradeCurrentAyah(4));

if (gradingPrevAyahBtn) {
  gradingPrevAyahBtn.addEventListener('click', () => {
    if (currentGradingVerseIndex > 0) {
      currentGradingVerseIndex--;
      renderGradingModal();
    }
  });
}

if (gradingNextAyahBtn) {
  gradingNextAyahBtn.addEventListener('click', () => {
    if (surahData && currentGradingVerseIndex < surahData.verses.length - 1) {
      currentGradingVerseIndex++;
      renderGradingModal();
    }
  });
}

if (btnGradingPlayAudio) {
  btnGradingPlayAudio.addEventListener('click', () => {
    if (!surahData || !surahData.verses[currentGradingVerseIndex]) return;
    if (currentAudioIndex === currentGradingVerseIndex && !audioPlayer.paused) {
      audioPlayer.pause();
      btnGradingPlayAudio.textContent = '▶';
      btnGradingPlayAudio.title = 'Play Ayah Audio';
      btnGradingPlayAudio.classList.remove('playing');
    } else {
      playAyah(currentGradingVerseIndex);
      btnGradingPlayAudio.textContent = '❚❚';
      btnGradingPlayAudio.title = 'Pause Ayah Audio';
      btnGradingPlayAudio.classList.add('playing');
    }
  });
}

if (gradingCloseBtn) gradingCloseBtn.addEventListener('click', closeAyahGradingModal);
if (ayahGradingOverlay) {
  ayahGradingOverlay.addEventListener('click', (e) => {
    if (e.target === ayahGradingOverlay) closeAyahGradingModal();
  });
}

if (btnOpenFsrsFromGrade) {
  btnOpenFsrsFromGrade.addEventListener('click', () => {
    closeAyahGradingModal();
    openFsrsBrowser();
  });
}

// Grade Mode Toggle Listener
if (memToggleGradeBtn) {
  memToggleGradeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isGradeMode = !isGradeMode;
    memToggleGradeBtn.classList.toggle('active', isGradeMode);
    document.body.classList.toggle('grade-mode-active', isGradeMode);
    if (isGradeMode) {
      if (gradeModeToast) {
        gradeModeToast.classList.add('show');
        setTimeout(() => { if (gradeModeToast) gradeModeToast.classList.remove('show'); }, 4000);
      }
    } else {
      if (gradeModeToast) gradeModeToast.classList.remove('show');
    }
  });
}

if (gradeToastCloseBtn) {
  gradeToastCloseBtn.addEventListener('click', () => {
    if (gradeModeToast) gradeModeToast.classList.remove('show');
  });
}

// =========================================================
// COMPREHENSIVE FSRS BROWSER & STATISTICS CONTROLLER
// =========================================================

function openFsrsBrowser() {
  renderFsrsBrowser();
  if (fsrsBrowserModal) fsrsBrowserModal.classList.add('show');
}

function closeFsrsBrowser() {
  if (fsrsBrowserModal) fsrsBrowserModal.classList.remove('show');
}

function renderFsrsBrowser() {
  const allCards = Object.values(fsrsCardStore);
  const now = new Date();

  // Synthesize unstudied Ayahs for current Surah if not already tracked
  if (surahData && surahData.verses) {
    surahData.verses.forEach(v => {
      const k = `${currentSurahNumber}:${v.verseNumber}`;
      if (!fsrsCardStore[k]) {
        allCards.push({
          id: k,
          surahNumber: currentSurahNumber,
          verseNumber: v.verseNumber,
          state: FSRS_STATE.NEW,
          stability: 0,
          difficulty: 0,
          reps: 0,
          lapses: 0,
          due: new Date().toISOString(),
          arabic: v.words.map(w => w.arabic).join(' '),
          plain: v.words.map(w => w.plain).join(' '),
          translation: v.translation || '',
          transliteration: v.transliteration || ''
        });
      }
    });
  }

  // Surah filter & Stage filter values
  const surahFilter = fsrsFilterSurah ? fsrsFilterSurah.value : 'current';
  const stageFilter = fsrsFilterStage ? fsrsFilterStage.value : 'all';

  // Scope cards based on Surah filter
  const scopeCards = surahFilter === 'current'
    ? allCards.filter(c => c.surahNumber === currentSurahNumber)
    : allCards;

  let dueCount = 0;
  let newCount = 0;
  let learningCount = 0;
  let youngCount = 0;
  let matureCount = 0;
  let lapsedCount = 0;
  let totalStability = 0;
  let totalDifficulty = 0;
  let totalReps = 0;
  let goodOrEasyCount = 0;

  scopeCards.forEach(c => {
    const isNew = c.state === FSRS_STATE.NEW || (!c.reps && !c.last_review);
    const isDue = !isNew && new Date(c.due) <= now;
    const isMature = !isNew && c.state === FSRS_STATE.REVIEW && (c.stability || 0) >= 21;
    const isYoung = !isNew && c.state === FSRS_STATE.REVIEW && (c.stability || 0) < 21;
    const isLearning = !isNew && (c.state === FSRS_STATE.LEARNING || c.state === FSRS_STATE.RELEARNING);

    if (isNew) {
      newCount++;
    } else {
      if (isDue) dueCount++;
      if (isLearning && !isDue) learningCount++;
      if (isYoung && !isDue) youngCount++;
      if (isMature) matureCount++;
    }

    if ((c.lapses || 0) > 0) lapsedCount++;

    if (c.stability) totalStability += c.stability;
    if (c.difficulty) totalDifficulty += c.difficulty;
    if (c.reps) totalReps += c.reps;
    if (c.last_rating === 3 || c.last_rating === 4) goodOrEasyCount++;
  });

  const accuracy = totalReps > 0 ? ((goodOrEasyCount / totalReps) * 100) : 90.0;
  const studiedCardsCount = scopeCards.filter(c => c.state !== FSRS_STATE.NEW && (c.reps || 0) > 0).length;
  const avgStability = studiedCardsCount > 0 ? (totalStability / studiedCardsCount) : 0;
  const avgDifficulty = studiedCardsCount > 0 ? (totalDifficulty / studiedCardsCount) : 0;

  // KPI UI
  if (kpiRetentionRate) kpiRetentionRate.textContent = `${accuracy.toFixed(1)}%`;
  if (kpiDueCount) kpiDueCount.textContent = dueCount;
  if (kpiNewCount) kpiNewCount.textContent = newCount;
  if (kpiTrackedWords) kpiTrackedWords.textContent = studiedCardsCount;
  if (kpiTrackedPercent) {
    if (surahFilter === 'current') {
      kpiTrackedPercent.textContent = `${studiedCardsCount} of ${scopeCards.length} Ayahs studied in Surah ${currentSurahNumber}`;
    } else {
      kpiTrackedPercent.textContent = `${studiedCardsCount} Ayahs studied Quran-wide`;
    }
  }
  if (kpiMatureWords) kpiMatureWords.textContent = matureCount;

  // Stacked Distribution Bar UI
  const totalForBar = Math.max(1, newCount + dueCount + learningCount + youngCount + matureCount);
  const pNew = (newCount / totalForBar) * 100;
  const pDue = (dueCount / totalForBar) * 100;
  const pLearning = (learningCount / totalForBar) * 100;
  const pYoung = (youngCount / totalForBar) * 100;
  const pMature = (matureCount / totalForBar) * 100;

  if (segNew) segNew.style.width = `${pNew}%`;
  if (segDue) segDue.style.width = `${pDue}%`;
  if (segLearning) segLearning.style.width = `${pLearning}%`;
  if (segYoung) segYoung.style.width = `${pYoung}%`;
  if (segMature) segMature.style.width = `${pMature}%`;

  if (legNewCount) legNewCount.textContent = newCount;
  if (legDueCount) legDueCount.textContent = dueCount;
  if (legLearningCount) legLearningCount.textContent = learningCount;
  if (legYoungCount) legYoungCount.textContent = youngCount;
  if (legMatureCount) legMatureCount.textContent = matureCount;

  if (distMetaSummary) {
    distMetaSummary.textContent = `Avg Stability: ${avgStability.toFixed(1)}d • Avg Difficulty: ${avgDifficulty.toFixed(1)}/10`;
  }

  // Filter & Search Logic
  const query = fsrsSearchInput ? fsrsSearchInput.value.trim().toLowerCase() : '';
  const sortBy = fsrsSortBy ? fsrsSortBy.value : 'due_asc';

  let filtered = scopeCards.filter(c => {
    const isNew = c.state === FSRS_STATE.NEW || (!c.reps && !c.last_review);
    const isDue = !isNew && new Date(c.due) <= now;

    // Stage filter
    if (stageFilter === 'new' && !isNew) return false;
    if (stageFilter === 'due' && !isDue) return false;
    if (stageFilter === 'learning' && (isNew || (c.state !== FSRS_STATE.LEARNING && c.state !== FSRS_STATE.RELEARNING))) return false;
    if (stageFilter === 'young' && (isNew || c.state !== FSRS_STATE.REVIEW || (c.stability || 0) >= 21)) return false;
    if (stageFilter === 'mature' && (isNew || c.state !== FSRS_STATE.REVIEW || (c.stability || 0) < 21)) return false;
    if (stageFilter === 'lapsed' && (isNew || !c.lapses || c.lapses === 0)) return false;

    // Search query
    if (query) {
      const loc = `${c.surahNumber}:${c.verseNumber}`;
      const ar = (c.arabic || '').toLowerCase();
      const pl = (c.plain || '').toLowerCase();
      const tr = (c.translation || '').toLowerCase();
      const tl = (c.transliteration || '').toLowerCase();
      if (!loc.includes(query) && !ar.includes(query) && !pl.includes(query) && !tr.includes(query) && !tl.includes(query)) {
        return false;
      }
    }
    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'due_asc') return new Date(a.due) - new Date(b.due);
    if (sortBy === 'stability_desc') return (b.stability || 0) - (a.stability || 0);
    if (sortBy === 'difficulty_desc') return (b.difficulty || 0) - (a.difficulty || 0);
    if (sortBy === 'lapses_desc') return (b.lapses || 0) - (a.lapses || 0);
    if (sortBy === 'verse_order') {
      return (a.surahNumber - b.surahNumber) || (a.verseNumber - b.verseNumber);
    }
    return 0;
  });

  // Render Table Rows
  if (fsrsTableBody) {
    if (filtered.length === 0) {
      fsrsTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding: 2.5rem; color: #94a3b8;">
            No cards found matching the criteria. Start memorizing and grading verses!
          </td>
        </tr>
      `;
    } else {
      let rowsHtml = '';
      filtered.forEach(c => {
        const isNew = c.state === FSRS_STATE.NEW || (!c.reps && !c.last_review);
        const isDue = !isNew && new Date(c.due) <= now;
        let badgeHtml = '<span class="compact-status-badge state-new">✨ New</span>';
        if (isDue) {
          badgeHtml = '<span class="compact-status-badge state-relearning">⚡ Due</span>';
        } else if (!isNew && (c.state === FSRS_STATE.LEARNING || c.state === FSRS_STATE.RELEARNING)) {
          badgeHtml = '<span class="compact-status-badge state-learning">Learning</span>';
        } else if (!isNew && c.state === FSRS_STATE.REVIEW && (c.stability || 0) >= 21) {
          badgeHtml = '<span class="compact-status-badge state-review" style="background:#dbeafe; color:#1e40af;">Mature</span>';
        } else if (!isNew && c.state === FSRS_STATE.REVIEW) {
          badgeHtml = '<span class="compact-status-badge state-review">Young</span>';
        }

        rowsHtml += `
          <tr>
            <td><span class="table-arabic-word">${c.arabic || c.plain || '—'}</span></td>
            <td><span class="table-loc-badge">Surah ${c.surahNumber}:${c.verseNumber}</span></td>
            <td><span title="${c.translation || ''}">${c.translation || '—'}</span></td>
            <td>${badgeHtml}</td>
            <td>${c.stability ? `${c.stability}d` : '—'}</td>
            <td>${c.difficulty ? `${c.difficulty}` : '—'}</td>
            <td>${isNew ? 'Ready to study' : getDueTimeStr(c.due)}</td>
            <td>${c.reps || 0}</td>
            <td>
              <div style="display:flex; gap:4px;">
                <button type="button" class="table-action-btn" onclick="navigateToGradeWord(${c.surahNumber}, ${c.verseNumber})" title="Grade this Ayah">Grade</button>
                <button type="button" class="table-action-btn" onclick="resetWordCard('${c.id}')" title="Reset Card" style="color:#ef4444;">↺</button>
              </div>
            </td>
          </tr>
        `;
      });
      fsrsTableBody.innerHTML = rowsHtml;
    }
  }
}

window.navigateToGradeWord = function(surahNum, verseNum) {
  closeFsrsBrowser();
  if (surahNum === currentSurahNumber) {
    openAyahGradingModal(surahNum, verseNum);
  } else {
    loadSurah(surahNum).then(() => {
      openAyahGradingModal(surahNum, verseNum);
    });
  }
};

window.resetWordCard = function(cardId) {
  if (fsrsCardStore[cardId]) {
    fsrsCardStore[cardId].state = FSRS_STATE.NEW;
    fsrsCardStore[cardId].stability = 0;
    fsrsCardStore[cardId].difficulty = 0;
    fsrsCardStore[cardId].reps = 0;
    fsrsCardStore[cardId].lapses = 0;
    fsrsCardStore[cardId].due = new Date().toISOString();
    fsrsCardStore[cardId].last_review = null;
    fsrsCardStore[cardId].last_rating = null;
    saveFsrsCards();
    renderFsrsBrowser();
    updateTopSurahBadges();
    renderSurahDropdown();
    updateFsrsBadgeAndNotifications();
    showToastNotification('Ayah card reset to New');
  }
};

// Wire FSRS Browser Modal Triggers
if (btnOpenFsrsBrowser) btnOpenFsrsBrowser.addEventListener('click', openFsrsBrowser);
if (closeFsrsBrowserBtn) closeFsrsBrowserBtn.addEventListener('click', closeFsrsBrowser);
if (btnOpenFsrsFromSettings) {
  btnOpenFsrsFromSettings.addEventListener('click', () => {
    closeSettings();
    openFsrsBrowser();
  });
}
if (fsrsBrowserModal) {
  fsrsBrowserModal.addEventListener('click', (e) => {
    if (e.target === fsrsBrowserModal) closeFsrsBrowser();
  });
}

// Wire Filter & Search Listeners
if (fsrsSearchInput) fsrsSearchInput.addEventListener('input', renderFsrsBrowser);
if (fsrsFilterStage) fsrsFilterStage.addEventListener('change', renderFsrsBrowser);
if (fsrsFilterSurah) fsrsFilterSurah.addEventListener('change', renderFsrsBrowser);
if (fsrsSortBy) fsrsSortBy.addEventListener('change', renderFsrsBrowser);

// Study New Now Button
if (btnStudyNewNow) {
  btnStudyNewNow.addEventListener('click', () => {
    if (surahData && surahData.verses) {
      const newV = surahData.verses.find(v => {
        const k = `${currentSurahNumber}:${v.verseNumber}`;
        const card = fsrsCardStore[k];
        return !card || (card.state === 0 && (card.reps || 0) === 0);
      });
      if (newV) {
        closeFsrsBrowser();
        navigateToGradeWord(currentSurahNumber, newV.verseNumber);
        return;
      }
    }
    const anyNew = Object.values(fsrsCardStore).find(c => c.state === 0 && (c.reps || 0) === 0);
    if (anyNew) {
      closeFsrsBrowser();
      navigateToGradeWord(anyNew.surahNumber, anyNew.verseNumber);
      return;
    }
    showToastNotification('Alhamdulillah! All Ayahs in this Surah have been studied at least once.');
  });
}

// Review Due Now Button
if (btnReviewDueNow) {
  btnReviewDueNow.addEventListener('click', () => {
    const allCards = Object.values(fsrsCardStore);
    const now = new Date();
    const dueCards = allCards.filter(c => c.state !== FSRS_STATE.NEW && new Date(c.due) <= now);
    if (dueCards.length > 0) {
      const curDue = dueCards.find(c => c.surahNumber === currentSurahNumber) || dueCards[0];
      closeFsrsBrowser();
      navigateToGradeWord(curDue.surahNumber, curDue.verseNumber);
    } else {
      showToastNotification('Alhamdulillah! No Ayahs are currently due for review.');
    }
  });
}

// =========================================================
// RESET FSRS CONTROLLER & CONFIRMATION MODAL
// =========================================================

function openFsrsResetModal() {
  if (resetSurahNameDesc && surahData && surahData.meta) {
    resetSurahNameDesc.textContent = `${surahData.meta.number}. Surah ${surahData.meta.englishName}`;
  }
  if (fsrsResetModal) fsrsResetModal.classList.add('show');
}

function closeFsrsResetModal() {
  if (fsrsResetModal) fsrsResetModal.classList.remove('show');
}

function resetCurrentSurahFsrs() {
  if (!currentSurahNumber || !fsrsCardStore) return;
  const prefix = `${currentSurahNumber}:`;
  let count = 0;
  Object.keys(fsrsCardStore).forEach(k => {
    if (k.startsWith(prefix)) {
      fsrsCardStore[k].state = FSRS_STATE.NEW;
      fsrsCardStore[k].stability = 0;
      fsrsCardStore[k].difficulty = 0;
      fsrsCardStore[k].reps = 0;
      fsrsCardStore[k].lapses = 0;
      fsrsCardStore[k].due = new Date().toISOString();
      fsrsCardStore[k].last_review = null;
      fsrsCardStore[k].last_rating = null;
      count++;
    }
  });
  saveFsrsCards();
  updateTopSurahBadges();
  renderSurahDropdown();
  updateFsrsBadgeAndNotifications();
  renderFsrsBrowser();
  closeFsrsResetModal();
  showToastNotification(`Reset FSRS for Surah ${currentSurahNumber} (${count} cards reset to New)`);
}

function resetAllFsrs() {
  if (!fsrsCardStore) return;
  const total = Object.keys(fsrsCardStore).length;
  if (!confirm('Are you absolutely sure you want to reset all FSRS spaced repetition progress across the entire Quran? This cannot be undone.')) {
    return;
  }
  Object.keys(fsrsCardStore).forEach(k => {
    fsrsCardStore[k].state = FSRS_STATE.NEW;
    fsrsCardStore[k].stability = 0;
    fsrsCardStore[k].difficulty = 0;
    fsrsCardStore[k].reps = 0;
    fsrsCardStore[k].lapses = 0;
    fsrsCardStore[k].due = new Date().toISOString();
    fsrsCardStore[k].last_review = null;
    fsrsCardStore[k].last_rating = null;
  });
  saveFsrsCards();
  updateTopSurahBadges();
  renderSurahDropdown();
  updateFsrsBadgeAndNotifications();
  renderFsrsBrowser();
  closeFsrsResetModal();
  showToastNotification(`Reset all Quran FSRS progress to New (${total} cards reset)`);
}

if (btnResetFsrsModal) btnResetFsrsModal.addEventListener('click', openFsrsResetModal);
if (btnResetFsrsSettings) {
  btnResetFsrsSettings.addEventListener('click', () => {
    closeSettings();
    openFsrsResetModal();
  });
}
if (closeResetFsrsModalBtn) closeResetFsrsModalBtn.addEventListener('click', closeFsrsResetModal);
if (btnCancelResetFsrs) btnCancelResetFsrs.addEventListener('click', closeFsrsResetModal);
if (btnConfirmResetSurah) btnConfirmResetSurah.addEventListener('click', resetCurrentSurahFsrs);
if (btnConfirmResetAll) btnConfirmResetAll.addEventListener('click', resetAllFsrs);
if (fsrsResetModal) {
  fsrsResetModal.addEventListener('click', (e) => {
    if (e.target === fsrsResetModal) closeFsrsResetModal();
  });
}

// =========================================================
// WHOLE SURAH RECALL MODE CONTROLLER & HUD
// =========================================================

let isRecallMode = false;
let currentRecallVerseIdx = 0;
let recallRevealedVerses = new Set();

function toggleWholeSurahRecallMode(forceState) {
  const nextState = (typeof forceState === 'boolean') ? forceState : !isRecallMode;
  if (nextState === isRecallMode) return;

  isRecallMode = nextState;
  document.body.classList.toggle('recall-active', isRecallMode);

  if (toggleWholeSurahRecall) toggleWholeSurahRecall.checked = isRecallMode;
  if (memToggleRecallBtn) memToggleRecallBtn.classList.toggle('active', isRecallMode);

  if (isRecallMode) {
    if (currentView !== 'reading') switchView('reading');
    currentRecallVerseIdx = 0;
    recallRevealedVerses.clear();
    if (recallHudContainer) recallHudContainer.style.display = 'block';
    applyRecallVersesState();
    updateRecallHud();
    scrollRecallCurrentVerseIntoView();
    showToastNotification('📖 Whole Surah Recall Mode started. Recite from memory and tap Space to reveal.');
  } else {
    if (recallHudContainer) recallHudContainer.style.display = 'none';
    clearRecallVersesClasses();
    if (isMemorizeMode) {
      applyMemorizeState(false);
    }
    showToastNotification('Exited Whole Surah Recall Mode');
  }
}

function updateRecallHud() {
  if (!surahData || !surahData.verses) return;
  const totalVerses = surahData.verses.length;
  const currentNum = currentRecallVerseIdx + 1;
  const verse = surahData.verses[currentRecallVerseIdx];

  const revealedCount = recallRevealedVerses.size;
  const percent = totalVerses > 0 ? Math.round((revealedCount / totalVerses) * 100) : 0;

  if (recallStatsCounter) {
    recallStatsCounter.textContent = `Ayah ${currentNum} of ${totalVerses} • ${percent}% revealed`;
  }
  if (recallProgressBarFill) {
    const prog = totalVerses > 0 ? ((currentNum) / totalVerses) * 100 : 0;
    recallProgressBarFill.style.width = `${prog}%`;
  }

  if (recallAyahTitle && verse) {
    const firstWords = verse.words.slice(0, 4).map(w => w.arabic).join(' ');
    recallAyahTitle.textContent = `Ayah ${currentNum} : "${firstWords}..."`;
  }

  const isRevealed = recallRevealedVerses.has(currentRecallVerseIdx);
  if (btnRecallToggleAyah) {
    btnRecallToggleAyah.innerHTML = isRevealed
      ? `🙈 Hide Ayah <span class="recall-key-hint">Space</span>`
      : `👁 Reveal Ayah <span class="recall-key-hint">Space</span>`;
  }

  const mistakeKey = `${currentSurahNumber}:${currentNum}`;
  const hasMistake = memorizeMistakes && !!memorizeMistakes[mistakeKey];
  if (btnRecallFlagMistake) {
    btnRecallFlagMistake.classList.toggle('active', hasMistake);
  }
}

function applyRecallVersesState() {
  if (!surahData || !surahData.verses) return;
  const spans = document.querySelectorAll('.reading-verse-span, .mushaf-verse-span');
  spans.forEach(span => {
    const vIdx = parseInt(span.getAttribute('data-verse-idx'));
    if (isNaN(vIdx)) return;

    const isCurrent = (vIdx === currentRecallVerseIdx);
    const isRevealed = recallRevealedVerses.has(vIdx);
    const vNum = vIdx + 1;
    const mistakeKey = `${currentSurahNumber}:${vNum}`;
    const hasMistake = memorizeMistakes && !!memorizeMistakes[mistakeKey];

    span.classList.remove('recall-hidden', 'recall-revealed', 'recall-current', 'recall-mistake');

    if (isRevealed) {
      span.classList.add('recall-revealed');
    } else {
      span.classList.add('recall-hidden');
    }

    if (isCurrent) {
      span.classList.add('recall-current');
    }

    if (hasMistake) {
      span.classList.add('recall-mistake');
    }
  });
}

function clearRecallVersesClasses() {
  const spans = document.querySelectorAll('.reading-verse-span, .mushaf-verse-span');
  spans.forEach(span => {
    span.classList.remove('recall-hidden', 'recall-revealed', 'recall-current', 'recall-mistake');
  });
}

function scrollRecallCurrentVerseIntoView() {
  const currentSpan = document.getElementById(`reading-verse-span-${currentRecallVerseIdx}`);
  if (currentSpan) {
    currentSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function setRecallVerseIndex(idx) {
  if (!surahData || !surahData.verses) return;
  const maxIdx = surahData.verses.length - 1;
  const clamped = Math.max(0, Math.min(idx, maxIdx));
  currentRecallVerseIdx = clamped;
  applyRecallVersesState();
  updateRecallHud();
  scrollRecallCurrentVerseIntoView();
}

function toggleCurrentRecallVerse() {
  if (recallRevealedVerses.has(currentRecallVerseIdx)) {
    recallRevealedVerses.delete(currentRecallVerseIdx);
  } else {
    recallRevealedVerses.add(currentRecallVerseIdx);
  }
  applyRecallVersesState();
  updateRecallHud();
}

function nextRecallVerse() {
  if (!surahData || !surahData.verses) return;
  if (currentRecallVerseIdx < surahData.verses.length - 1) {
    setRecallVerseIndex(currentRecallVerseIdx + 1);
  } else {
    showToastNotification('MashaAllah! You reached the end of Surah recitation recall.');
  }
}

function prevRecallVerse() {
  if (currentRecallVerseIdx > 0) {
    setRecallVerseIndex(currentRecallVerseIdx - 1);
  }
}

function flagRecallMistake() {
  if (!surahData || !surahData.verses) return;
  const vNum = currentRecallVerseIdx + 1;
  const mistakeKey = `${currentSurahNumber}:${vNum}`;
  if (memorizeMistakes[mistakeKey]) {
    delete memorizeMistakes[mistakeKey];
    showToastNotification(`✓ Cleared mistake flag on Ayah ${vNum}`);
  } else {
    memorizeMistakes[mistakeKey] = {
      timestamp: Date.now(),
      surah: currentSurahNumber,
      verse: vNum
    };
    showToastNotification(`🚩 Flagged mistake on Ayah ${vNum}`);
  }
  saveMistakes(memorizeMistakes);
  applyRecallVersesState();
  updateRecallHud();
}

function gradeRecallVerse() {
  if (!surahData || !surahData.verses) return;
  const vNum = currentRecallVerseIdx + 1;
  openAyahGradingModal(currentSurahNumber, vNum);
}

// Wire Recall Mode Buttons
if (memToggleRecallBtn) memToggleRecallBtn.addEventListener('click', () => toggleWholeSurahRecallMode());
if (toggleWholeSurahRecall) toggleWholeSurahRecall.addEventListener('change', (e) => toggleWholeSurahRecallMode(e.target.checked));

if (btnRecallPrevAyah) btnRecallPrevAyah.addEventListener('click', prevRecallVerse);
if (btnRecallToggleAyah) btnRecallToggleAyah.addEventListener('click', toggleCurrentRecallVerse);
if (btnRecallNextAyah) btnRecallNextAyah.addEventListener('click', nextRecallVerse);
if (btnRecallFlagMistake) btnRecallFlagMistake.addEventListener('click', flagRecallMistake);
if (btnRecallGradeAyah) btnRecallGradeAyah.addEventListener('click', gradeRecallVerse);
if (btnRecallExit) btnRecallExit.addEventListener('click', () => toggleWholeSurahRecallMode(false));

// =========================================================
// FSRS NOTIFICATIONS & REAL-TIME BADGE ENGINE
// =========================================================

const FSRS_NOTIF_STORAGE_KEY = 'quran_fsrs_notifications_enabled';

function isFsrsNotificationsEnabled() {
  return localStorage.getItem(FSRS_NOTIF_STORAGE_KEY) === 'true';
}

function setFsrsNotificationsEnabled(val) {
  localStorage.setItem(FSRS_NOTIF_STORAGE_KEY, val ? 'true' : 'false');
}

function updateFsrsBadgeAndNotifications(isManualTest = false) {
  const allCards = Object.values(fsrsCardStore);
  const now = new Date();
  const dueCards = allCards.filter(c => new Date(c.due) <= now);
  const dueCount = dueCards.length;

  // 1. Header Due Badge
  if (fsrsDueBadge) {
    if (dueCount > 0) {
      fsrsDueBadge.textContent = dueCount > 99 ? '99+' : dueCount;
      fsrsDueBadge.style.display = 'inline-block';
    } else {
      fsrsDueBadge.style.display = 'none';
    }
  }

  // 2. In-App Notification Toast & Browser Notification
  if ((dueCount > 0 && isFsrsNotificationsEnabled()) || isManualTest) {
    if (fsrsNotificationToast) {
      if (fsrsNotifTitle) {
        fsrsNotifTitle.textContent = isManualTest ? '🔔 Test Review Notification' : '🔔 Words Due for Review';
      }
      if (fsrsNotifMsg) {
        fsrsNotifMsg.textContent = isManualTest 
          ? 'FSRS spaced repetition notifications are active.' 
          : `${dueCount} word${dueCount > 1 ? 's are' : ' is'} ready for memory review!`;
      }
      fsrsNotificationToast.classList.add('show');
      setTimeout(() => {
        if (fsrsNotificationToast) fsrsNotificationToast.classList.remove('show');
      }, 7000);
    }

    // Web Notifications API
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(isManualTest ? 'Quran FSRS Alert Test' : 'Quran Words Due for Review', {
          body: isManualTest 
            ? 'Spaced repetition notifications are working!' 
            : `You have ${dueCount} words due for spaced repetition review.`,
          icon: 'https://alquran.cloud/favicon.ico'
        });
      } catch (err) {
        console.warn('Browser notification failed:', err);
      }
    }
  }
}

if (toggleFsrsNotifications) {
  toggleFsrsNotifications.checked = isFsrsNotificationsEnabled();
  toggleFsrsNotifications.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    setFsrsNotificationsEnabled(enabled);

    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          updateFsrsBadgeAndNotifications(true);
        }
      });
    } else if (enabled) {
      updateFsrsBadgeAndNotifications(true);
    }
  });
}

if (btnTestFsrsNotification) {
  btnTestFsrsNotification.addEventListener('click', () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(() => updateFsrsBadgeAndNotifications(true));
    } else {
      updateFsrsBadgeAndNotifications(true);
    }
  });
}

if (fsrsNotifReviewBtn) {
  fsrsNotifReviewBtn.addEventListener('click', () => {
    if (fsrsNotificationToast) fsrsNotificationToast.classList.remove('show');
    openFsrsBrowser();
  });
}

if (fsrsNotifCloseBtn) {
  fsrsNotifCloseBtn.addEventListener('click', () => {
    if (fsrsNotificationToast) fsrsNotificationToast.classList.remove('show');
  });
}

// Periodic check every 5 minutes and when tab becomes visible
setInterval(() => updateFsrsBadgeAndNotifications(false), 300000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    updateFsrsBadgeAndNotifications(false);
  }
});

// =========================================================
// PROGRESS SYNC & BACKUP CONTROLLER (Desktop ⇄ Android)
// =========================================================

function showSyncStatus(msg, type = 'info') {
  if (!syncStatusMsg) return;
  syncStatusMsg.textContent = msg;
  syncStatusMsg.style.color = (type === 'success') ? '#10b981' : (type === 'error' ? '#ef4444' : '#64748b');
  setTimeout(() => {
    if (syncStatusMsg) syncStatusMsg.textContent = '';
  }, 5000);
}

function generateSyncPayload() {
  return {
    app: 'QuranMemFSRS',
    version: '1.0',
    exportDate: new Date().toISOString(),
    fsrsCards: fsrsCardStore || {},
    mistakes: memorizeMistakes || {},
    wordVisOverrides: wordVisOverrides || {},
    ayahVisOverrides: ayahVisOverrides || {},
    wordPopupTrigger: wordPopupTrigger || 'hover',
    fsrsNotifications: isFsrsNotificationsEnabled(),
    fontFamily: fontStyleSelect ? fontStyleSelect.value : 'KFGQPC-Hafs',
    fontScale: fontScaleLevel || 1,
    lineHeight: currentLineHeight || 2.4
  };
}

function exportSyncData() {
  try {
    const payload = generateSyncPayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quran_progress_sync_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSyncStatus('✓ Exported progress file successfully! Transfer to Android and click Import.', 'success');
  } catch (err) {
    console.error('Export error:', err);
    showSyncStatus('✕ Failed to export progress file.', 'error');
  }
}

function generateCompactSyncPayload() {
  const compactCards = {};
  if (fsrsCardStore) {
    Object.keys(fsrsCardStore).forEach(k => {
      const c = fsrsCardStore[k];
      if (c && (c.reps > 0 || c.state > 0 || c.lapses > 0)) {
        const dueSec = c.due ? Math.round(new Date(c.due).getTime() / 1000) : 0;
        compactCards[k] = [c.state, c.stability, c.difficulty, c.reps, c.lapses || 0, dueSec, c.last_rating];
      }
    });
  }

  return {
    q: 1,
    c: compactCards,
    m: Object.keys(memorizeMistakes || {}),
    wv: wordVisOverrides || {},
    av: ayahVisOverrides || {},
    s: {
      pt: wordPopupTrigger,
      fs: fontScaleLevel || 1,
      lh: currentLineHeight || 2.4,
      ff: fontStyleSelect ? fontStyleSelect.value : 'KFGQPC-Hafs'
    }
  };
}

function importSyncData(inputData) {
  try {
    let data = inputData;
    if (typeof inputData === 'string') {
      let str = inputData.trim();
      if (str.includes('#sync=')) {
        str = decodeURIComponent(str.split('#sync=')[1]);
      }
      data = JSON.parse(str);
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid JSON structure');
    }

    let cardCount = 0;

    // Mode 1: Compact QR Code payload (q === 1)
    if (data.q === 1 && data.c && typeof data.c === 'object') {
      Object.keys(data.c).forEach(key => {
        const [state, stability, difficulty, reps, lapses, dueSec, lastRating] = data.c[key];
        const parts = key.split(':');
        const sNum = parseInt(parts[0]);
        const vNum = parseInt(parts[1]);
        const wPos = parseInt(parts[2]);
        const card = getOrCreateWordCard(sNum, vNum, wPos);
        card.state = state;
        card.stability = stability;
        card.difficulty = difficulty;
        card.reps = reps;
        card.lapses = lapses || 0;
        if (dueSec) card.due = new Date(dueSec * 1000).toISOString();
        card.last_rating = lastRating;
        fsrsCardStore[key] = card;
        cardCount++;
      });
      saveFsrsCards();

      if (Array.isArray(data.m)) {
        data.m.forEach(k => { memorizeMistakes[k] = true; });
        saveMistakes(memorizeMistakes);
      }
      if (data.wv && typeof data.wv === 'object') {
        Object.assign(wordVisOverrides, data.wv);
        saveWordVisOverrides(wordVisOverrides);
      }
      if (data.av && typeof data.av === 'object') {
        Object.assign(ayahVisOverrides, data.av);
        saveAyahVisOverrides(ayahVisOverrides);
      }
      if (data.s && typeof data.s === 'object') {
        if (data.s.pt) {
          wordPopupTrigger = data.s.pt;
          localStorage.setItem(POPUP_TRIGGER_KEY, wordPopupTrigger);
          if (togglePopupTap) togglePopupTap.checked = (wordPopupTrigger === 'tap');
        }
      }
    } else if (data.fsrsCards && typeof data.fsrsCards === 'object') {
      // Mode 2: Standard full JSON backup
      Object.keys(data.fsrsCards).forEach(key => {
        const incoming = data.fsrsCards[key];
        const existing = fsrsCardStore[key];
        if (!existing) {
          fsrsCardStore[key] = incoming;
          cardCount++;
        } else {
          const incTime = incoming.last_review ? new Date(incoming.last_review).getTime() : 0;
          const existTime = existing.last_review ? new Date(existing.last_review).getTime() : 0;
          if (incTime >= existTime || (incoming.reps || 0) >= (existing.reps || 0)) {
            fsrsCardStore[key] = incoming;
          }
          cardCount++;
        }
      });
      saveFsrsCards();

      if (data.mistakes && typeof data.mistakes === 'object') {
        Object.assign(memorizeMistakes, data.mistakes);
        saveMistakes(memorizeMistakes);
      }
      if (data.wordVisOverrides && typeof data.wordVisOverrides === 'object') {
        Object.assign(wordVisOverrides, data.wordVisOverrides);
        saveWordVisOverrides(wordVisOverrides);
      }
      if (data.ayahVisOverrides && typeof data.ayahVisOverrides === 'object') {
        Object.assign(ayahVisOverrides, data.ayahVisOverrides);
        saveAyahVisOverrides(ayahVisOverrides);
      }
      if (data.wordPopupTrigger) {
        wordPopupTrigger = data.wordPopupTrigger;
        localStorage.setItem(POPUP_TRIGGER_KEY, wordPopupTrigger);
        if (togglePopupTap) togglePopupTap.checked = (wordPopupTrigger === 'tap');
      }
      if (typeof data.fsrsNotifications === 'boolean') {
        setFsrsNotificationsEnabled(data.fsrsNotifications);
        if (toggleFsrsNotifications) toggleFsrsNotifications.checked = data.fsrsNotifications;
      }
    }

    let mistakeCount = Object.keys(memorizeMistakes).length;
    updateWordElementsMistakeClasses();
    updateActiveMistakeButtonState();
    updateMemorizeOverridesStats();
    updateFsrsBadgeAndNotifications(false);
    if (isMemorizeMode) {
      applyMemorizeState(true);
    }

    showSyncStatus(`✓ Imported successfully! (${cardCount} cards, ${mistakeCount} mistakes)`, 'success');
    showToastNotification(`✓ Progress synced: ${cardCount} cards updated`);
    return true;
  } catch (err) {
    console.error('Import error:', err);
    showSyncStatus('✕ Error importing data. Invalid sync format.', 'error');
    showToastNotification('✕ Import failed: Invalid sync data');
    return false;
  }
}

function copySyncToClipboard() {
  try {
    const payload = generateSyncPayload();
    const jsonStr = JSON.stringify(payload);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        showSyncStatus('✓ Sync code copied to clipboard! Paste it on your other device.', 'success');
        showToastNotification('✓ Sync code copied to clipboard');
      }).catch(() => {
        fallbackCopyText(jsonStr);
      });
    } else {
      fallbackCopyText(jsonStr);
    }
  } catch (err) {
    console.error('Clipboard copy error:', err);
    showSyncStatus('✕ Failed to copy sync code.', 'error');
  }
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showSyncStatus('✓ Sync code copied to clipboard! Paste it on your other device.', 'success');
    showToastNotification('✓ Sync code copied to clipboard');
  } catch (e) {
    showSyncStatus('✕ Could not copy to clipboard. Try Export File instead.', 'error');
  }
  document.body.removeChild(ta);
}

function pasteSyncFromClipboard() {
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(text => {
      if (text && text.trim().startsWith('{')) {
        importSyncData(text);
      } else {
        promptForSyncPaste();
      }
    }).catch(() => {
      promptForSyncPaste();
    });
  } else {
    promptForSyncPaste();
  }
}

function promptForSyncPaste() {
  const text = prompt('Paste your sync JSON code here:');
  if (text) {
    importSyncData(text);
  }
}

if (btnExportSyncData) btnExportSyncData.addEventListener('click', exportSyncData);
if (btnImportSyncTrigger && fileSyncInput) {
  btnImportSyncTrigger.addEventListener('click', () => fileSyncInput.click());
  fileSyncInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      importSyncData(evt.target.result);
      fileSyncInput.value = '';
    };
    reader.onerror = () => {
      showSyncStatus('✕ Failed to read file.', 'error');
      fileSyncInput.value = '';
    };
    reader.readAsText(file);
  });
}
if (btnCopySyncClipboard) btnCopySyncClipboard.addEventListener('click', copySyncToClipboard);
if (btnPasteSyncClipboard) btnPasteSyncClipboard.addEventListener('click', pasteSyncFromClipboard);

function checkUrlHashSync() {
  if (window.location.hash && window.location.hash.startsWith('#sync=')) {
    const raw = window.location.hash.substring(6);
    try {
      const decoded = decodeURIComponent(raw);
      importSyncData(decoded);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (e) {
      console.warn('Failed to parse URL sync hash:', e);
    }
  }
}

if (topSurahDueBadge) {
  topSurahDueBadge.addEventListener('click', () => {
    openFsrsBrowser();
  });
}

// Boot
if (audioBarWrapper) {
  showAudioBar();
}
initChapters();
checkUrlHashSync();
loadSurah(76).then(() => {
  updateFsrsBadgeAndNotifications(false);
  updateOfflineStorageStatus();
});



