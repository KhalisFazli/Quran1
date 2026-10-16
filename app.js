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

const RECITERS_LIST = [
  { id: 'Abdullah_Basfar_192kbps', name: 'Abdullah Basfar' },
  { id: 'Abu_Bakr_Ash-Shaatree_128kbps', name: 'Abu Bakr Ash-Shaatree' },
  { id: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net', name: 'Ahmed ibn Ali al-Ajamy' },
  { id: 'Alafasy_128kbps', name: 'Alafasy' },
  { id: 'Ghamadi_40kbps', name: 'Ghamadi' },
  { id: 'Hani_Rifai_192kbps', name: 'Hani Rifai' },
  { id: 'Husary_128kbps', name: 'Husary' },
  { id: 'Husary_Muallim_128kbps', name: 'Husary (Muallim)' },
  { id: 'Nabil_Rifa3i_48kbps', name: 'Nabil_Rifa3i' },
  { id: 'Yasser_Ad-Dussary_128kbps', name: 'Yasser_Ad-Dussary' }
];

let selectedReciter = localStorage.getItem('quran_selected_reciter') || 'Alafasy_128kbps';
if (selectedReciter === 'ar.alafasy') selectedReciter = 'Alafasy_128kbps';
if (selectedReciter === 'ar.husary') selectedReciter = 'Husary_128kbps';
if (selectedReciter.startsWith('ar.')) selectedReciter = 'Alafasy_128kbps';

function getReciterDisplayName(id = selectedReciter) {
  const found = RECITERS_LIST.find(r => r.id === id);
  return found ? found.name : 'Reciter';
}

function getAyahAudioUrl(surahNum, verseNum, reciter = selectedReciter) {
  const s = String(surahNum).padStart(3, '0');
  const v = String(verseNum).padStart(3, '0');
  return `https://everyayah.com/data/${reciter}/${s}${v}.mp3`;
}

let currentActiveSpan = null;
let activeHoveredWordEl = null;

// Precompiled Regex
const HARAKAT_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g;

// Memorize State
let isMemorizeMode = false;
let revealedWordCount = 0;
let currentMemorizeAyah = 1;
let totalWordElements = [];
let totalAyahMarkers = [];
let isHarakatVisible = true;
let isAyahNumberAlwaysVisible = false;
let isAutoRevealing = false;
let autoRevealInterval = null;
let autoRevealSpeed = 1.0;
let isGradeMode = false;
let isGradeModalFromReveal = false;
let promptedGradeAyahs = new Set();
let isMistakeMode = false;
let isReviewMode = false;
let activeAyahContextVerse = 1;
let wordPopupTrigger = localStorage.getItem('quran_word_popup_trigger') || 'hover'; // 'hover' | 'tap'

// Quran Surah Library & Ayah Notes State
let isLibraryView = true;
let currentLibraryFilter = 'all';
let currentLibrarySearch = '';
const AYAH_NOTES_STORAGE_KEY = 'quran_ayah_notes';
let ayahNotesStore = {};
let activeAyahNoteTarget = null; // { surahNum, verseNum }

// Hold/Press State
let holdInterval = null;
let holdTimeout = null;

// Repeat Logic (Default off: do not auto-advance unless specified in repeat setting)
let isRepeatActive = false;
let repeatMode = 'off';
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
const btnHomeLibrary = document.getElementById('btnHomeLibrary');
const surahLibraryView = document.getElementById('surahLibraryView');
const libStatsSummary = document.getElementById('libStatsSummary');
const libSearchInput = document.getElementById('libSearchInput');
const libClearSearchBtn = document.getElementById('libClearSearchBtn');
const libFilterChips = document.getElementById('libFilterChips');
const librarySurahGrid = document.getElementById('librarySurahGrid');
const customTextsGrid = document.getElementById('customTextsGrid');
const tabQuranSurahs = document.getElementById('tabQuranSurahs');
const tabCustomTexts = document.getElementById('tabCustomTexts');
const customTextsCountBadge = document.getElementById('customTextsCountBadge');
const btnNewCustomText = document.getElementById('btnNewCustomText');
const customTextModal = document.getElementById('customTextModal');
const customTextEditId = document.getElementById('customTextEditId');
const customTextTitleInput = document.getElementById('customTextTitleInput');
const customTextCategoryInput = document.getElementById('customTextCategoryInput');
const customTextContentInput = document.getElementById('customTextContentInput');
const btnDeleteCustomTextModal = document.getElementById('btnDeleteCustomTextModal');
const customModalHeading = document.getElementById('customModalHeading');
const customTextSentenceCount = document.getElementById('customTextSentenceCount');
const customTextWordCount = document.getElementById('customTextWordCount');
const customTextLangSummary = document.getElementById('customTextLangSummary');

const CUSTOM_TEXTS_STORAGE_KEY = 'quran_custom_texts_store';
let customTextsStore = [];
let activeLibraryTab = 'quran'; // 'quran' | 'custom'

const ayahCtxNote = document.getElementById('ayahCtxNote');
const ayahNoteModal = document.getElementById('ayahNoteModal');
const ayahNoteTitle = document.getElementById('ayahNoteTitle');
const ayahNoteSub = document.getElementById('ayahNoteSub');
const btnCloseAyahNoteModal = document.getElementById('btnCloseAyahNoteModal');
const ayahNoteVersePreview = document.getElementById('ayahNoteVersePreview');
const ayahNoteTextarea = document.getElementById('ayahNoteTextarea');
const btnDeleteAyahNote = document.getElementById('btnDeleteAyahNote');
const btnCancelAyahNote = document.getElementById('btnCancelAyahNote');
const btnSaveAyahNote = document.getElementById('btnSaveAyahNote');

// Mistake History Elements
const mistakeHistoryModal = document.getElementById('mistakeHistoryModal');
const btnCloseMistakeHistoryModal = document.getElementById('btnCloseMistakeHistoryModal');
const btnCloseMistakeHistoryFooter = document.getElementById('btnCloseMistakeHistoryFooter');
const kpiTotalMistakesRecorded = document.getElementById('kpiTotalMistakesRecorded');
const kpiActiveMistakesCount = document.getElementById('kpiActiveMistakesCount');
const kpiCurrentSurahMistakesCount = document.getElementById('kpiCurrentSurahMistakesCount');
const kpiCurrentSurahLabel = document.getElementById('kpiCurrentSurahLabel');
const kpiUniqueWordsCount = document.getElementById('kpiUniqueWordsCount');
const mistakeSearchInput = document.getElementById('mistakeSearchInput');
const btnClearMistakeSearch = document.getElementById('btnClearMistakeSearch');
const mistakeFilterChips = document.getElementById('mistakeFilterChips');
const mistakeSortSelect = document.getElementById('mistakeSortSelect');
const mistakeHistoryList = document.getElementById('mistakeHistoryList');
const btnClearMistakeHistoryLog = document.getElementById('btnClearMistakeHistoryLog');
const btnPracticeMistakes = document.getElementById('btnPracticeMistakes');
const btnLibOpenMistakeHistory = document.getElementById('btnLibOpenMistakeHistory');
const btnOpenMistakeHistoryDrawer = document.getElementById('btnOpenMistakeHistoryDrawer');
const ctxItemMistakeHistory = document.getElementById('ctxItemMistakeHistory');
const ayahCtxMistakeHistory = document.getElementById('ayahCtxMistakeHistory');

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
const bannerCollapseBtn = document.getElementById('bannerCollapseBtn');
const bannerCollapsedBar = document.getElementById('bannerCollapsedBar');

// Memorize Bar Elements
const memorizeBar = document.getElementById('memorizeBar');
const memUnrevealZoneBtn = document.getElementById('memUnrevealZoneBtn');
const memRevealZoneBtn = document.getElementById('memRevealZoneBtn');
const memPrevAyahBtn = document.getElementById('memPrevAyahBtn');
const memNextAyahBtn = document.getElementById('memNextAyahBtn');
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
const ctxItemClearMistake = document.getElementById('ctxItemClearMistake');
const ctxItemPinVisible = document.getElementById('ctxItemPinVisible');
const ctxItemPinHidden = document.getElementById('ctxItemPinHidden');
const ctxItemResetVisibility = document.getElementById('ctxItemResetVisibility');
const ctxItemMultiSelect = document.getElementById('ctxItemMultiSelect');
const ctxPinVisLabel = document.getElementById('ctxPinVisLabel');
const ctxPinHiddenLabel = document.getElementById('ctxPinHiddenLabel');

// Floating Multi-Select Toolbar Elements
const multiSelectToolbar = document.getElementById('multiSelectToolbar');
const multiSelectStatus = document.getElementById('multiSelectStatus');
const multiSelectCountBadge = document.getElementById('multiSelectCountBadge');
const msSelectAyahBtn = document.getElementById('msSelectAyahBtn');
const msClearBtn = document.getElementById('msClearBtn');
const msCloseBtn = document.getElementById('msCloseBtn');
const msModeSelect = document.getElementById('msModeSelect');
const msModeMistake = document.getElementById('msModeMistake');
const msModeVisible = document.getElementById('msModeVisible');
const msModeHidden = document.getElementById('msModeHidden');
const msApplyMistakeBtn = document.getElementById('msApplyMistakeBtn');
const msApplyVisibleBtn = document.getElementById('msApplyVisibleBtn');
const msApplyHiddenBtn = document.getElementById('msApplyHiddenBtn');
const msApplyResetBtn = document.getElementById('msApplyResetBtn');

// Multi-Select State
let isMultiSelectMode = false;
let multiSelectActionType = 'select'; // 'select' | 'mistake' | 'visible' | 'hidden'
const multiSelectedWordKeys = new Set();

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

// Voice Recorder & Playback Elements (Memorize Mode)
const memVoiceRecBtn = document.getElementById('memVoiceRecBtn');
const voiceRecorderHud = document.getElementById('voiceRecorderHud');
const voiceRecDot = document.getElementById('voiceRecDot');
const voiceRecStatus = document.getElementById('voiceRecStatus');
const voiceRecTimer = document.getElementById('voiceRecTimer');
const voiceRecVerseBadge = document.getElementById('voiceRecVerseBadge');
const closeVoiceRecorderBtn = document.getElementById('closeVoiceRecorderBtn');
const voiceRecQariRow = document.getElementById('voiceRecQariRow');
const voiceRecQariLabel = document.getElementById('voiceRecQariLabel');
const voiceQariTimeDisplay = document.getElementById('voiceQariTimeDisplay');
const btnCloseAyahAudioBar = document.getElementById('btnCloseAyahAudioBar');
const btnVoiceQariPlayMini = document.getElementById('btnVoiceQariPlayMini');
const voiceRecQariTrack = document.getElementById('voiceRecQariTrack');
const voiceRecQariProgress = document.getElementById('voiceRecQariProgress');
const voiceRecUserRow = document.getElementById('voiceRecUserRow');
const voiceRecUserHeader = document.getElementById('voiceRecUserHeader');
const btnVoiceUserPlayMini = document.getElementById('btnVoiceUserPlayMini');
const voiceUserTimeDisplay = document.getElementById('voiceUserTimeDisplay');
const voiceRecPlaybackTrack = document.getElementById('voiceRecPlaybackTrack');
const voiceRecProgress = document.getElementById('voiceRecProgress');
const btnVoiceToggleRecord = document.getElementById('btnVoiceToggleRecord');
const voiceRecIcon = document.getElementById('voiceRecIcon');
const voiceRecBtnText = document.getElementById('voiceRecBtnText');
const btnVoiceTogglePlay = document.getElementById('btnVoiceTogglePlay');
const voicePlayIcon = document.getElementById('voicePlayIcon');
const voicePlayBtnText = document.getElementById('voicePlayBtnText');
const btnVoiceCompareQari = document.getElementById('btnVoiceCompareQari');
const voiceQariBtnIcon = document.getElementById('voiceQariBtnIcon');
const voiceQariBtnText = document.getElementById('voiceQariBtnText');
const btnVoicePlayBoth = document.getElementById('btnVoicePlayBoth');
const voicePlayBothIcon = document.getElementById('voicePlayBothIcon');
const voicePlayBothText = document.getElementById('voicePlayBothText');
const reciterVolSlider = document.getElementById('reciterVolSlider');
const reciterVolVal = document.getElementById('reciterVolVal');
const voiceVolSlider = document.getElementById('voiceVolSlider');
const voiceVolVal = document.getElementById('voiceVolVal');
const btnVoiceDiscard = document.getElementById('btnVoiceDiscard');
const btnGradingVoiceRec = document.getElementById('btnGradingVoiceRec');

// FSRS Notifications Elements
const fsrsNotificationToast = document.getElementById('fsrsNotificationToast');
const fsrsNotifTitle = document.getElementById('fsrsNotifTitle');
const fsrsNotifMsg = document.getElementById('fsrsNotifMsg');
const fsrsNotifReviewBtn = document.getElementById('fsrsNotifReviewBtn');
const fsrsNotifCloseBtn = document.getElementById('fsrsNotifCloseBtn');
const toggleFsrsNotifications = document.getElementById('toggleFsrsNotifications');
const toggleGradeRevealMode = document.getElementById('toggleGradeRevealMode');
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
const MISTAKE_HISTORY_STORAGE_KEY = 'quran_mistake_history';
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
let mistakeHistoryStore = [];
let currentMistakeFilter = 'all';
let currentMistakeSearch = '';
let currentMistakeSort = 'newest';

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
    if (typeof markSyncPending === 'function') markSyncPending(1);
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
    if (typeof markSyncPending === 'function') markSyncPending(1);
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getLastGradedTimeStr(lastReviewIso, compact = false) {
  if (!lastReviewIso) return '';
  const revTime = new Date(lastReviewIso).getTime();
  if (isNaN(revTime)) return '';
  const diffMs = Math.max(0, Date.now() - revTime);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return compact ? '1m' : 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(diffMs / 86400000);
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 mo' : `${months} mos`;
}

function getRosetteSvg(number) {
  const arabicNum = toArabicDigits(number);
  const ayahKey = `${currentSurahNumber}:${number}`;
  const ayahOverride = ayahVisOverrides[ayahKey];
  let overrideClass = '';
  if (ayahOverride === 'visible') overrideClass = 'ayah-persist-visible';
  else if (ayahOverride === 'hidden') overrideClass = 'ayah-persist-hidden';

  let isLastWordRevealed = false;
  if (surahData && surahData.verses && surahData.verses[number - 1]) {
    const v = surahData.verses[number - 1];
    if (totalWordElements && totalWordElements[v.endWordIdx]) {
      isLastWordRevealed = !totalWordElements[v.endWordIdx].classList.contains('memorize-hidden');
    } else {
      isLastWordRevealed = (revealedWordCount > v.endWordIdx);
    }
  }

  const isHidden = (ayahOverride === 'hidden') || 
    (!ayahOverride && !isAyahNumberAlwaysVisible && isMemorizeMode && !isLastWordRevealed);
  const lenClass = number >= 100 ? 'digits-3' : '';
  const hasNote = Boolean(ayahNotesStore && ayahNotesStore[ayahKey] && ayahNotesStore[ayahKey].trim());
  const noteIndicator = hasNote ? `<span class="ayah-note-indicator" title="Has Reflection / Note">📝</span>` : '';

  if (surahData && surahData.isCustom) {
    return `
      <span class="ayah-marker custom-dot-marker ${isHidden ? 'hidden-ayah' : ''} ${overrideClass}" 
            data-verse="${number}" 
            id="ayah-marker-${number}"
            title="Sentence ${number} (Click for options)">
        <span class="custom-dot-symbol">•</span>
        ${noteIndicator}
      </span>
    `;
  }

  return `
    <span class="ayah-marker ${isHidden ? 'hidden-ayah' : ''} ${overrideClass}" 
          data-verse="${number}" 
          id="ayah-marker-${number}"
          title="Ayah ${number} (Click for options)">
      <svg class="ayah-rosette-svg" viewBox="0 0 60 60">
        <use href="#ayah-rosette-sym" />
      </svg>
      <span class="ayah-number-text ${lenClass}">${arabicNum}</span>
      ${noteIndicator}
    </span>
  `;
}

function updateAyahGradedBadges() {
  // No-op: last graded time is displayed only inside the Grade window
}

// =========================================================
// AYAH NOTES & REFLECTIONS SYSTEM
// =========================================================

function initAyahNotes() {
  try {
    const raw = localStorage.getItem(AYAH_NOTES_STORAGE_KEY);
    if (raw) {
      ayahNotesStore = JSON.parse(raw) || {};
    } else {
      ayahNotesStore = {};
    }
  } catch (err) {
    console.warn('Failed to parse ayah notes from storage:', err);
    ayahNotesStore = {};
  }
}

function saveAyahNotesStore() {
  try {
    localStorage.setItem(AYAH_NOTES_STORAGE_KEY, JSON.stringify(ayahNotesStore));
  } catch (err) {
    console.error('Failed to save ayah notes:', err);
  }
}

function openAyahNoteModal(surahNum, verseNum) {
  activeAyahNoteTarget = { surahNum, verseNum };
  const ayahKey = `${surahNum}:${verseNum}`;
  const existing = (ayahNotesStore && ayahNotesStore[ayahKey]) ? ayahNotesStore[ayahKey] : '';

  if (ayahNoteTitle) ayahNoteTitle.textContent = 'Ayah Reflection & Notes';
  if (ayahNoteSub) {
    let surahTitle = `Surah ${surahNum}`;
    if (surahData && surahData.meta && surahData.meta.number === surahNum) {
      surahTitle += ` (${surahData.meta.englishName})`;
    } else if (chaptersList) {
      const ch = chaptersList.find(c => c.number === surahNum);
      if (ch) surahTitle += ` (${ch.englishName})`;
    }
    ayahNoteSub.textContent = `${surahTitle}:${verseNum}`;
  }

  // Populate verse preview
  if (ayahNoteVersePreview) {
    let arabicText = '';
    let transText = '';
    if (surahData && surahData.meta && surahData.meta.number === surahNum) {
      const v = surahData.verses.find(x => x.verseNumber === verseNum);
      if (v) {
        arabicText = v.words ? v.words.map(w => w.arabic).join(' ') : '';
        transText = v.translationEn || '';
      }
    }
    if (arabicText) {
      ayahNoteVersePreview.innerHTML = `
        <div style="font-family: var(--font-arabic); font-size: 1.35rem; color: #23272f; text-align: right; line-height: 1.8; margin-bottom: 6px;">${arabicText}</div>
        <div style="font-size: 0.85rem; color: #665239; line-height: 1.45;">${escapeHtml(transText)}</div>
      `;
      ayahNoteVersePreview.style.display = 'block';
    } else {
      ayahNoteVersePreview.innerHTML = `<div style="font-size: 0.85rem; color: #887258;">Ayah ${surahNum}:${verseNum}</div>`;
      ayahNoteVersePreview.style.display = 'block';
    }
  }

  if (ayahNoteTextarea) {
    ayahNoteTextarea.value = existing;
  }

  if (btnDeleteAyahNote) {
    btnDeleteAyahNote.style.display = existing.trim() ? 'inline-flex' : 'none';
  }

  if (ayahNoteModal) {
    ayahNoteModal.style.display = 'flex';
  }

  if (ayahNoteTextarea) {
    setTimeout(() => ayahNoteTextarea.focus(), 50);
  }
}

function closeAyahNoteModal() {
  if (ayahNoteModal) {
    ayahNoteModal.style.display = 'none';
  }
  activeAyahNoteTarget = null;
}

function saveCurrentAyahNote() {
  if (!activeAyahNoteTarget) return;
  const { surahNum, verseNum } = activeAyahNoteTarget;
  const text = ayahNoteTextarea ? ayahNoteTextarea.value.trim() : '';
  const key = `${surahNum}:${verseNum}`;
  if (!text) {
    delete ayahNotesStore[key];
  } else {
    ayahNotesStore[key] = text;
  }
  saveAyahNotesStore();
  if (typeof markSyncPending === 'function') markSyncPending(1);
  closeAyahNoteModal();
  refreshAyahNotesUi(surahNum, verseNum);
  showToastNotification(text ? `📝 Note saved for ${surahNum}:${verseNum}` : `🗑️ Note cleared for ${surahNum}:${verseNum}`);
}

function deleteCurrentAyahNote() {
  if (!activeAyahNoteTarget) return;
  const { surahNum, verseNum } = activeAyahNoteTarget;
  const key = `${surahNum}:${verseNum}`;
  delete ayahNotesStore[key];
  saveAyahNotesStore();
  if (typeof markSyncPending === 'function') markSyncPending(1);
  closeAyahNoteModal();
  refreshAyahNotesUi(surahNum, verseNum);
  showToastNotification(`🗑️ Note deleted for ${surahNum}:${verseNum}`);
}

function refreshAyahNotesUi(surahNum, verseNum) {
  // 1. Update Rosette indicator in reading and VBV views
  const markers = document.querySelectorAll(`.ayah-marker[data-verse="${verseNum}"]`);
  const hasNote = Boolean(ayahNotesStore && ayahNotesStore[`${surahNum}:${verseNum}`] && ayahNotesStore[`${surahNum}:${verseNum}`].trim());
  markers.forEach(m => {
    let ind = m.querySelector('.ayah-note-indicator');
    if (hasNote && !ind) {
      ind = document.createElement('span');
      ind.className = 'ayah-note-indicator';
      ind.title = 'Has Reflection / Note';
      ind.textContent = '📝';
      m.appendChild(ind);
    } else if (!hasNote && ind) {
      ind.remove();
    }
  });

  // 2. Update VBV card note box & button
  if (surahData && surahData.meta && surahData.meta.number === surahNum) {
    const card = document.getElementById(`vbv-card-${verseNum - 1}`);
    if (card) {
      const btnNote = card.querySelector('.vbv-btn-note');
      if (btnNote) {
        btnNote.classList.toggle('has-note', hasNote);
        btnNote.title = hasNote ? 'Edit Reflection' : 'Add Note';
      }
      let box = card.querySelector('.vbv-note-box');
      if (hasNote) {
        const noteContent = escapeHtml(ayahNotesStore[`${surahNum}:${verseNum}`]);
        if (!box) {
          box = document.createElement('div');
          box.className = 'vbv-note-box';
          box.id = `vbv-note-${verseNum}`;
          card.appendChild(box);
        }
        box.innerHTML = `
          <div class="vbv-note-header">
            <span>📝 Reflection / Note</span>
            <button type="button" class="vbv-btn-edit-note" onclick="openAyahNoteModal(${surahNum}, ${verseNum})">Edit</button>
          </div>
          <div class="vbv-note-content">${noteContent}</div>
        `;
        box.style.display = 'block';
      } else if (box) {
        box.remove();
      }
    }
  }

  // 3. Update library view cards if library is visible
  if (isLibraryView) {
    renderSurahLibrary();
  }
}

// =========================================================
// MISTAKE HISTORY & PRACTICE LOG SYSTEM
// =========================================================

function loadMistakeHistory() {
  try {
    const raw = localStorage.getItem(MISTAKE_HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load mistake history:', e);
  }
  return [];
}

function saveMistakeHistory(data) {
  try {
    localStorage.setItem(MISTAKE_HISTORY_STORAGE_KEY, JSON.stringify(data || mistakeHistoryStore));
  } catch (e) {
    console.warn('Failed to save mistake history:', e);
  }
}

function getSurahNameFallback(sNum) {
  if (chaptersList && chaptersList.length > 0) {
    const ch = chaptersList.find(c => c.number === sNum);
    if (ch) return ch.englishName || ch.name;
  }
  if (surahData && surahData.meta && surahData.meta.number === sNum) {
    return surahData.meta.englishName || `Surah ${sNum}`;
  }
  try {
    const cached = localStorage.getItem('quran_chapters_cache');
    if (cached) {
      const list = JSON.parse(cached);
      const ch = list.find(c => c.number === sNum);
      if (ch) return ch.englishName || ch.name;
    }
  } catch (e) {}
  return `Surah ${sNum}`;
}

function reconcileMistakesFromHistory() {
  if (!mistakeHistoryStore || mistakeHistoryStore.length === 0) return;
  const latestByWord = new Map();
  const markCountByWord = new Map();

  mistakeHistoryStore.forEach(entry => {
    if (!entry || !entry.wordKey) return;
    if (entry.action === 'marked') {
      markCountByWord.set(entry.wordKey, (markCountByWord.get(entry.wordKey) || 0) + 1);
    }
    const existing = latestByWord.get(entry.wordKey);
    if (!existing || (entry.timestamp || 0) >= (existing.timestamp || 0)) {
      latestByWord.set(entry.wordKey, entry);
    }
  });

  latestByWord.forEach((latestEntry, wordKey) => {
    if (latestEntry.action === 'cleared') {
      delete memorizeMistakes[wordKey];
    } else if (latestEntry.action === 'marked') {
      memorizeMistakes[wordKey] = {
        timestamp: latestEntry.timestamp || Date.now(),
        surah: latestEntry.surah,
        verse: latestEntry.verse,
        wordPos: latestEntry.wordPos,
        count: markCountByWord.get(wordKey) || 1
      };
    }
  });
  saveMistakes(memorizeMistakes);
}

function initMistakeHistory() {
  mistakeHistoryStore = loadMistakeHistory();
  // Backfill if history is empty but active mistakes exist
  if (mistakeHistoryStore.length === 0 && memorizeMistakes && Object.keys(memorizeMistakes).length > 0) {
    Object.keys(memorizeMistakes).forEach(key => {
      const item = memorizeMistakes[key];
      const parts = key.split(':');
      if (parts.length >= 3) {
        const s = parseInt(parts[0]);
        const v = parseInt(parts[1]);
        const w = parseInt(parts[2]);
        const ts = (item && item.timestamp) ? item.timestamp : Date.now();
        recordMistakeHistoryEntry(s, v, w, 'marked', ts, false);
      }
    });
    saveMistakeHistory();
  } else {
    reconcileMistakesFromHistory();
  }
  // Immediately enrich any missing words or translations
  enrichMistakeHistory().catch(err => console.warn('Init enrichment error:', err));
}

function recordMistakeHistoryEntry(surahNum, verseNum, wordPos, action = 'marked', customTimestamp = null, autoSave = true) {
  const sNum = parseInt(surahNum);
  const vNum = parseInt(verseNum);
  const wPos = parseInt(wordPos);
  const wordKey = `${sNum}:${vNum}:${wPos}`;
  const timestamp = customTimestamp || Date.now();

  let wordArabic = '';
  let wordPlain = '';
  let wordTrans = '';
  let wordTranslit = '';
  let surahName = getSurahNameFallback(sNum);

  // 1. Try to get word details from surahData
  if (surahData && surahData.meta && surahData.meta.number === sNum && surahData.verses) {
    const v = surahData.verses.find(x => x.verseNumber === vNum);
    if (v && v.words && v.words[wPos - 1]) {
      const w = v.words[wPos - 1];
      wordArabic = w.arabic || '';
      wordPlain = w.plain || '';
      wordTrans = w.translation || '';
      wordTranslit = w.transliteration || '';
    }
  }

  // 2. Fallback: query DOM if currently loaded
  if (!wordArabic) {
    const el = document.querySelector(`.mushaf-word[data-verse-num="${vNum}"][data-word-idx="${wPos - 1}"]`);
    if (el) {
      wordArabic = el.getAttribute('data-orig-arabic') || el.textContent.trim();
      wordPlain = el.getAttribute('data-plain-arabic') || '';
      wordTrans = el.getAttribute('data-trans') || '';
      wordTranslit = el.getAttribute('data-translit') || '';
    }
  }

  // 3. Fallback: search in-memory cache
  if (!wordArabic && surahCache) {
    for (const [k, cData] of surahCache.entries()) {
      if (cData && cData.meta && cData.meta.number === sNum && cData.verses) {
        const v = cData.verses.find(x => x.verseNumber === vNum);
        if (v && v.words && v.words[wPos - 1]) {
          const w = v.words[wPos - 1];
          wordArabic = w.arabic || '';
          wordPlain = w.plain || '';
          wordTrans = w.translation || '';
          wordTranslit = w.transliteration || '';
          break;
        }
      }
    }
  }

  const isWordPlaceholder = !wordArabic || wordArabic.startsWith('Word #');
  const entry = {
    id: 'mh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    timestamp,
    surah: sNum,
    verse: vNum,
    wordPos: wPos,
    wordKey,
    wordArabic: wordArabic || `Word #${wPos}`,
    wordPlain: wordPlain || '',
    wordTrans: wordTrans || '',
    wordTranslit: wordTranslit || '',
    surahName,
    action: action
  };

  mistakeHistoryStore.unshift(entry);
  if (mistakeHistoryStore.length > 500) {
    mistakeHistoryStore = mistakeHistoryStore.slice(0, 500);
  }

  if (autoSave) {
    saveMistakeHistory();
    if (typeof markSyncPending === 'function') markSyncPending(1);
    const modal = document.getElementById('mistakeHistoryModal');
    if (modal && (modal.classList.contains('show') || modal.style.display === 'flex')) {
      renderMistakeHistoryModal();
    }
  }

  if (isWordPlaceholder) {
    enrichMistakeHistory().catch(() => {});
  }

  return entry;
}

let isEnrichingMistakes = false;
async function enrichMistakeHistory() {
  if (isEnrichingMistakes || !mistakeHistoryStore || mistakeHistoryStore.length === 0) return;
  isEnrichingMistakes = true;

  try {
    let needsSave = false;
    const toEnrich = mistakeHistoryStore.filter(e => 
      !e.wordArabic || 
      e.wordArabic.startsWith('Word #') || 
      !e.wordTrans || 
      !e.surahName || 
      e.surahName.startsWith('Surah ')
    );

    if (toEnrich.length === 0) return;

    // 1. Resolve surah names
    toEnrich.forEach(entry => {
      if (!entry.surahName || entry.surahName.startsWith('Surah ')) {
        const sName = getSurahNameFallback(entry.surah);
        if (sName && !sName.startsWith('Surah ')) {
          entry.surahName = sName;
          needsSave = true;
        }
      }
    });

    // 2. Resolve missing words
    for (const entry of toEnrich) {
      if (entry.wordArabic && !entry.wordArabic.startsWith('Word #') && entry.wordTrans) {
        continue;
      }

      const sNum = parseInt(entry.surah);
      const vNum = parseInt(entry.verse);
      const wPos = parseInt(entry.wordPos);

      let foundWord = null;

      // Check surahData
      if (surahData && surahData.meta && surahData.meta.number === sNum && surahData.verses) {
        const v = surahData.verses.find(x => x.verseNumber === vNum);
        if (v && v.words && v.words[wPos - 1]) {
          foundWord = v.words[wPos - 1];
          if (surahData.meta.englishName) entry.surahName = surahData.meta.englishName;
        }
      }

      // Check surahCache
      if (!foundWord && surahCache) {
        for (const [k, cData] of surahCache.entries()) {
          if (cData && cData.meta && cData.meta.number === sNum && cData.verses) {
            const v = cData.verses.find(x => x.verseNumber === vNum);
            if (v && v.words && v.words[wPos - 1]) {
              foundWord = v.words[wPos - 1];
              if (cData.meta.englishName) entry.surahName = cData.meta.englishName;
              break;
            }
          }
        }
      }

      // Check offline local storage
      if (!foundWord && typeof getSurahFromLocalOffline === 'function') {
        try {
          const offData = await getSurahFromLocalOffline(sNum);
          if (offData && offData.verses) {
            const v = offData.verses.find(x => x.verseNumber === vNum);
            if (v && v.words && v.words[wPos - 1]) {
              foundWord = v.words[wPos - 1];
              if (offData.meta && offData.meta.englishName) entry.surahName = offData.meta.englishName;
            }
          }
        } catch (e) {}
      }

      // Fallback: Fetch verse from Quran.com API
      if (!foundWord) {
        try {
          const res = await fetch(`https://api.quran.com/api/v4/verses/by_key/${sNum}:${vNum}?language=en&words=true&word_fields=text_uthmani`);
          if (res.ok) {
            const json = await res.json();
            if (json && json.verse && json.verse.words) {
              const rawWords = json.verse.words.filter(w => w.char_type_name === 'word');
              const bismillahWords = ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَـٰنِ", "ٱلرَّحِيمِ", "اللَّهِ", "الرَّحْمٰنِ", "الرَّحِيمِ"];
              if (vNum === 1 && sNum !== 1 && sNum !== 9) {
                while (rawWords.length > 0 && bismillahWords.includes(rawWords[0].text_uthmani)) {
                  rawWords.shift();
                }
              }
              const targetW = rawWords[wPos - 1] || rawWords.find(w => w.position === wPos);
              if (targetW) {
                foundWord = {
                  arabic: targetW.text_uthmani,
                  plain: typeof stripHarakat === 'function' ? stripHarakat(targetW.text_uthmani) : targetW.text_uthmani,
                  translation: targetW.translation ? targetW.translation.text : '',
                  transliteration: targetW.transliteration ? targetW.transliteration.text : ''
                };
              }
            }
          }
        } catch (err) {
          console.warn(`Could not enrich word ${sNum}:${vNum}#${wPos}:`, err);
        }
      }

      if (foundWord) {
        entry.wordArabic = foundWord.arabic || entry.wordArabic;
        entry.wordPlain = foundWord.plain || entry.wordPlain;
        entry.wordTrans = foundWord.translation || entry.wordTrans;
        entry.wordTranslit = foundWord.transliteration || entry.wordTranslit;
        needsSave = true;
      }
    }

    if (needsSave) {
      saveMistakeHistory();
      const modal = document.getElementById('mistakeHistoryModal');
      if (modal && (modal.classList.contains('show') || modal.style.display === 'flex')) {
        renderMistakeHistoryModal();
      }
    }
  } finally {
    isEnrichingMistakes = false;
  }
}

function formatMistakeTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today, ${timeStr}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

function openMistakeHistoryModal(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  const modal = document.getElementById('mistakeHistoryModal');
  if (modal) {
    modal.classList.add('show');
    modal.style.setProperty('display', 'flex', 'important');
  }
  try {
    renderMistakeHistoryModal();
  } catch (err) {
    console.error('Error rendering mistake history:', err);
  }
  // Automatically fetch and enrich any missing Arabic words, translations or Surah names
  enrichMistakeHistory().catch(err => console.warn('Enrichment error:', err));
}

function closeMistakeHistoryModal(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  const modal = document.getElementById('mistakeHistoryModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.setProperty('display', 'none', 'important');
  }
}

function renderMistakeHistoryModal() {
  const modal = document.getElementById('mistakeHistoryModal');
  if (!modal) return;

  const listEl = document.getElementById('mistakeHistoryList');
  if (!listEl) return;

  // 1. Recurrence frequency map
  const mistakeFreqMap = {};
  (mistakeHistoryStore || []).forEach(e => {
    if (e && e.action === 'marked' && e.wordKey) {
      mistakeFreqMap[e.wordKey] = (mistakeFreqMap[e.wordKey] || 0) + 1;
    }
  });

  // 2. KPI metrics
  const activeKeys = Object.keys(memorizeMistakes || {});
  const currentSurahMistakes = activeKeys.filter(k => k && k.startsWith(`${currentSurahNumber}:`)).length;
  const uniqueWordsSet = new Set((mistakeHistoryStore || []).filter(e => e && e.wordKey).map(e => e.wordKey));

  const kpiTotal = document.getElementById('kpiTotalMistakesRecorded');
  const kpiActive = document.getElementById('kpiActiveMistakesCount');
  const kpiCurSurah = document.getElementById('kpiCurrentSurahMistakesCount');
  const kpiCurLabel = document.getElementById('kpiCurrentSurahLabel');
  const kpiUnique = document.getElementById('kpiUniqueWordsCount');

  if (kpiTotal) kpiTotal.textContent = (mistakeHistoryStore || []).length;
  if (kpiActive) kpiActive.textContent = activeKeys.length;
  if (kpiCurSurah) kpiCurSurah.textContent = currentSurahMistakes;
  if (kpiCurLabel) kpiCurLabel.textContent = `In Surah ${currentSurahNumber}`;
  if (kpiUnique) kpiUnique.textContent = uniqueWordsSet.size;

  // 3. Filter entries
  const query = (currentMistakeSearch || '').trim().toLowerCase();
  let list = (mistakeHistoryStore || []).filter(entry => {
    if (!entry) return false;
    const isActive = Boolean(memorizeMistakes && entry.wordKey && memorizeMistakes[entry.wordKey]);
    if (currentMistakeFilter === 'active' && !isActive) return false;
    if (currentMistakeFilter === 'current' && entry.surah !== currentSurahNumber) return false;
    if (currentMistakeFilter === 'cleared' && isActive && entry.action !== 'cleared') return false;

    if (query) {
      const refStr = `${entry.surah || ''}:${entry.verse || ''}`;
      const surahNameMatch = (entry.surahName || '').toLowerCase().includes(query);
      const refMatch = refStr.includes(query) || String(entry.surah || '') === query;
      const transMatch = (entry.wordTrans || '').toLowerCase().includes(query);
      const translitMatch = (entry.wordTranslit || '').toLowerCase().includes(query);
      const arabicMatch = (entry.wordArabic || '').includes(query) || (entry.wordPlain || '').includes(query);
      if (!refMatch && !surahNameMatch && !transMatch && !translitMatch && !arabicMatch) {
        return false;
      }
    }

    return true;
  });

  // 4. Sort entries
  if (currentMistakeSort === 'oldest') {
    list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  } else if (currentMistakeSort === 'frequent') {
    list.sort((a, b) => {
      const fa = (a && a.wordKey) ? (mistakeFreqMap[a.wordKey] || 0) : 0;
      const fb = (b && b.wordKey) ? (mistakeFreqMap[b.wordKey] || 0) : 0;
      if (fb !== fa) return fb - fa;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  } else {
    // 'newest'
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  // 5. Render to list
  if (list.length === 0) {
    listEl.innerHTML = `
      <div class="mistake-empty-state">
        <div class="mistake-empty-icon">🎉</div>
        <div class="mistake-empty-title">No Mistakes Found</div>
        <div class="mistake-empty-desc">
          ${query || currentMistakeFilter !== 'all' 
            ? 'No records match your active search or filter criteria.' 
            : 'You have not recorded any mistakes yet. Keep up the great memorization!'}
        </div>
      </div>
    `;
    return;
  }

  let html = '';
  list.forEach(entry => {
    if (!entry) return;
    const isActive = Boolean(memorizeMistakes && entry.wordKey && memorizeMistakes[entry.wordKey]);
    const actionBadge = entry.action === 'marked'
      ? `<span class="m-badge badge-action-marked">🚩 Marked</span>`
      : `<span class="m-badge badge-action-cleared">✓ Cleared</span>`;

    const recurCount = (entry.wordKey && mistakeFreqMap[entry.wordKey]) || 0;
    const recurBadge = recurCount > 1
      ? `<span class="m-badge badge-recurrent" title="Marked as mistake ${recurCount} times">⚠️ Repeated ${recurCount}×</span>`
      : '';

    const isPlaceholder = !entry.wordArabic || entry.wordArabic.startsWith('Word #');

    html += `
      <div class="mistake-item-card ${isActive ? 'is-active-mistake' : ''}">
        <div class="mistake-item-top">
          <div class="mistake-meta-left">
            ${actionBadge}
            ${recurBadge}
            <span class="mistake-ref-tag">${escapeHtml(entry.surahName || ('Surah ' + entry.surah))} ${entry.surah}:${entry.verse} (Word #${entry.wordPos})</span>
          </div>
          <span class="mistake-time-tag">${formatMistakeTimestamp(entry.timestamp)}</span>
        </div>

        <div class="mistake-item-main">
          <div class="mistake-word-trans-block">
            <span class="mistake-word-trans" ${isPlaceholder && !entry.wordTrans ? 'style="font-style:italic; color:#8c7860;"' : ''}>
              ${escapeHtml(entry.wordTrans || (isPlaceholder ? 'Fetching word details...' : '—'))}
            </span>
            ${entry.wordTranslit ? `<span class="mistake-word-translit">${escapeHtml(entry.wordTranslit)}</span>` : ''}
          </div>
          <div class="mistake-arabic-word ${isActive ? 'highlight-mistake' : ''}" ${isPlaceholder ? 'style="font-size:1.15rem; opacity:0.85;"' : ''}>
            ${escapeHtml((isPlaceholder ? '⏳ ' : '') + (entry.wordArabic || entry.wordPlain || '—'))}
          </div>
        </div>

        <div class="mistake-item-actions">
          <button type="button" class="btn-item-jump" onclick="jumpToMistakeAyah(${entry.surah}, ${entry.verse}, ${entry.wordPos})" title="Go to this verse in reader">
            ▷ Jump to Ayah
          </button>
          <button type="button" class="btn-item-log-again" onclick="markMistakeFromHistory(${entry.surah}, ${entry.verse}, ${entry.wordPos})" title="Record this mistake again without removing the mark">
            ${isActive ? '🚩 Log Again (+1)' : '🚩 Re-flag Mistake'}
          </button>
          ${isActive ? `
          <button type="button" class="btn-item-toggle-mistake is-marked" onclick="clearMistakeFromHistory(${entry.surah}, ${entry.verse}, ${entry.wordPos})" title="Clear / resolve mistake flag">
            ✓ Clear Flag
          </button>
          ` : ''}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

function jumpToMistakeAyah(surahNum, verseNum, wordPos) {
  closeMistakeHistoryModal();
  if (isLibraryView) {
    hideLibraryView();
  }

  const navigateToTarget = () => {
    if (typeof window.switchToAyah === 'function') {
      window.switchToAyah(verseNum, false);
    }
    setTimeout(() => {
      let targetEl = null;
      if (wordPos) {
        targetEl = document.querySelector(`.mushaf-word[data-verse-num="${verseNum}"][data-word-idx="${wordPos - 1}"]`);
      }
      if (!targetEl) {
        targetEl = document.querySelector(`.reading-verse-span[data-verse-num="${verseNum}"], .vbv-verse-span[data-verse-num="${verseNum}"]`);
      }
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.add('word-highlight-pulse');
        setTimeout(() => targetEl.classList.remove('word-highlight-pulse'), 2500);
      }
    }, 200);
  };

  if (currentSurahNumber !== surahNum) {
    loadSurah(surahNum).then(() => {
      setTimeout(navigateToTarget, 150);
    });
  } else {
    navigateToTarget();
  }
}

function markMistakeFromHistory(surahNum, verseNum, wordPos) {
  markWordMistake(surahNum, verseNum, wordPos);
  renderMistakeHistoryModal();
}

function clearMistakeFromHistory(surahNum, verseNum, wordPos) {
  clearWordMistake(surahNum, verseNum, wordPos);
  renderMistakeHistoryModal();
}

function toggleMistakeFromHistory(surahNum, verseNum, wordPos) {
  const key = `${surahNum}:${verseNum}:${wordPos}`;
  if (memorizeMistakes && memorizeMistakes[key]) {
    clearWordMistake(surahNum, verseNum, wordPos);
  } else {
    markWordMistake(surahNum, verseNum, wordPos);
  }
  renderMistakeHistoryModal();
}

function clearMistakeHistoryLog(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  if (confirm('Are you sure you want to clear your entire mistake history log?')) {
    mistakeHistoryStore = [];
    saveMistakeHistory();
    renderMistakeHistoryModal();
    showToastNotification('🗑️ Mistake history log cleared');
  }
}

function practiceMistakesFromHistory(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  const activeKeys = Object.keys(memorizeMistakes || {});
  if (activeKeys.length === 0) {
    showToastNotification('No active mistakes flagged to practice!');
    return;
  }
  closeMistakeHistoryModal();
  if (isLibraryView) hideLibraryView();
  if (!isMemorizeMode) toggleMemorizeMode();
  setReviewMode(true);

  let targetKey = activeKeys.find(k => k && k.startsWith(`${currentSurahNumber}:`)) || activeKeys[0];
  const parts = targetKey.split(':');
  const s = parseInt(parts[0]);
  const v = parseInt(parts[1]);
  const w = parseInt(parts[2]);

  jumpToMistakeAyah(s, v, w);
  showToastNotification(`⚡ Practice mode active: focusing troubled verse ${s}:${v}`);
}

window.openMistakeHistoryModal = openMistakeHistoryModal;
window.closeMistakeHistoryModal = closeMistakeHistoryModal;
window.clearMistakeHistoryLog = clearMistakeHistoryLog;
window.practiceMistakesFromHistory = practiceMistakesFromHistory;
window.jumpToMistakeAyah = jumpToMistakeAyah;
window.toggleMistakeFromHistory = toggleMistakeFromHistory;

// =========================================================
// QURAN SURAH LIBRARY (HOME VIEW)
// =========================================================

function showLibraryView() {
  isLibraryView = true;
  document.body.classList.add('library-active');
  if (surahLibraryView) surahLibraryView.style.display = 'block';
  const surahBanner = document.getElementById('surahBanner');
  if (surahBanner) surahBanner.style.display = 'none';
  if (bismillahBlock) bismillahBlock.style.display = 'none';
  if (readingView) readingView.style.display = 'none';
  if (vbvView) vbvView.style.display = 'none';
  if (memorizeBar) memorizeBar.classList.remove('show');
  if (btnHomeLibrary) btnHomeLibrary.classList.add('active');
  if (headerSurahTitle) headerSurahTitle.textContent = 'Memorize Quran';
  if (pageMetaText) {
    pageMetaText.textContent = activeLibraryTab === 'custom' 
      ? `${customTextsStore.length} Custom Texts • Library` 
      : '114 Surahs • Library';
  }
  if (activeLibraryTab === 'custom') {
    renderCustomTextsLibrary();
  } else {
    renderSurahLibrary();
  }
}

function hideLibraryView() {
  isLibraryView = false;
  document.body.classList.remove('library-active');
  if (surahLibraryView) surahLibraryView.style.display = 'none';
  const surahBanner = document.getElementById('surahBanner');
  if (surahBanner) surahBanner.style.display = 'flex';
  if (btnHomeLibrary) btnHomeLibrary.classList.remove('active');
  if (surahData) {
    if (bismillahBlock) {
      bismillahBlock.style.display = (surahData.isCustom || surahData.meta.number === 9 || surahData.meta.number === 1) ? 'none' : 'block';
    }
    if (headerSurahTitle) {
      headerSurahTitle.textContent = surahData.isCustom ? (surahData.meta.englishName || 'Custom Text') : `${surahData.meta.number}. ${surahData.meta.englishName}`;
    }
    if (pageMetaText && surahData.verses && surahData.verses[0]) {
      pageMetaText.textContent = surahData.isCustom 
        ? `${surahData.meta.numberOfAyahs} Sentences • ${surahData.meta.englishNameTranslation || 'Custom'}` 
        : `${surahData.verses[0].pageNumber} • ${surahData.verses[0].juzNumber}`;
    }
    if (currentView === 'vbv') {
      if (vbvView) vbvView.style.display = 'block';
      if (readingView) readingView.style.display = 'none';
    } else {
      if (readingView) readingView.style.display = 'block';
      if (vbvView) vbvView.style.display = 'none';
    }
    if (isMemorizeMode && memorizeBar) {
      memorizeBar.classList.add('show');
    }
  }
}

window.openSurahFromLibrary = function(surahNum) {
  hideLibraryView();
  loadSurah(surahNum);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function renderSurahLibrary() {
  if (!surahLibraryView || !librarySurahGrid) return;
  if (!chaptersList || !chaptersList.length) {
    librarySurahGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: #887258;">Loading Surah Library...</div>';
    return;
  }

  // 1. Calculate overall summary statistics
  let totalDue = 0;
  let totalNew = 0;
  let matureAyahs = 0;
  const totalQuranAyahs = 6236;

  chaptersList.forEach(ch => {
    totalDue += getDueAyahsCountForSurah(ch.number);
    totalNew += getNewAyahsCountForSurah(ch.number, ch.numberOfAyahs);
  });

  if (fsrsCardStore) {
    Object.keys(fsrsCardStore).forEach(k => {
      const parts = k.split(':');
      if (parts.length === 2) {
        const card = fsrsCardStore[k];
        if (card && card.state === 2 && (card.stability >= 21 || card.reps >= 2)) {
          matureAyahs++;
        }
      }
    });
  }

  const overallMastery = Math.min(100, Math.round((matureAyahs / totalQuranAyahs) * 100));
  const totalMistakes = Object.keys(memorizeMistakes || {}).length;
  const totalNotes = Object.values(ayahNotesStore || {}).filter(n => n && n.trim()).length;

  if (libStatsSummary) {
    libStatsSummary.innerHTML = `
      <span class="lib-stat-pill">📖 114 Surahs</span>
      ${totalDue > 0 ? `<span class="lib-stat-pill stat-due">⚡ ${totalDue} Due</span>` : `<span class="lib-stat-pill">⚡ 0 Due</span>`}
      <span class="lib-stat-pill stat-new">✨ ${totalNew} New</span>
      <span class="lib-stat-pill stat-mastery">🎯 ${overallMastery}% Mastered (${matureAyahs}/${totalQuranAyahs})</span>
      ${totalMistakes > 0 ? `<span class="lib-stat-pill stat-mistakes" style="cursor:pointer;" onclick="openMistakeHistoryModal()" title="View Mistake History">🚩 ${totalMistakes} Mistakes</span>` : ''}
      ${totalNotes > 0 ? `<span class="lib-stat-pill stat-notes">📝 ${totalNotes} Notes</span>` : ''}
    `;
  }

  // 2. Filter chapters list
  const query = (currentLibrarySearch || '').trim().toLowerCase();
  const filter = currentLibraryFilter || 'all';

  const filtered = chaptersList.filter(ch => {
    // Search match
    if (query) {
      const matchNum = ch.number.toString() === query || ch.number.toString().startsWith(query);
      const matchEng = ch.englishName.toLowerCase().includes(query);
      const matchTrans = ch.englishNameTranslation && ch.englishNameTranslation.toLowerCase().includes(query);
      const matchAr = ch.name && ch.name.includes(query);
      if (!matchNum && !matchEng && !matchTrans && !matchAr) return false;
    }

    // Filter chip match
    if (filter === 'due') {
      return getDueAyahsCountForSurah(ch.number) > 0;
    }
    if (filter === 'new') {
      return getNewAyahsCountForSurah(ch.number, ch.numberOfAyahs) > 0;
    }
    if (filter === 'mistakes') {
      return getSurahMistakesCount(ch.number) > 0;
    }
    if (filter === 'notes') {
      return getSurahNotesCount(ch.number) > 0;
    }
    if (filter === 'meccan') {
      return ch.revelationType && ch.revelationType.toLowerCase() === 'meccan';
    }
    if (filter === 'medinan') {
      return ch.revelationType && ch.revelationType.toLowerCase() === 'medinan';
    }

    return true;
  });

  if (filtered.length === 0) {
    librarySurahGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 4rem 1rem; color: #8c7860;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🔍</div>
        <div style="font-size: 1.05rem; font-weight:600;">No Surahs match your filter</div>
        <div style="font-size: 0.85rem; margin-top: 4px;">Try searching for a different keyword or resetting your filter.</div>
      </div>
    `;
    return;
  }

  // 3. Render Surah Cards
  librarySurahGrid.innerHTML = filtered.map(ch => {
    const dueCount = getDueAyahsCountForSurah(ch.number);
    const newCount = getNewAyahsCountForSurah(ch.number, ch.numberOfAyahs);
    const masteryPercent = getSurahMasteryPercent(ch.number, ch.numberOfAyahs);
    const mistakesCount = getSurahMistakesCount(ch.number);
    const notesCount = getSurahNotesCount(ch.number);
    const arabicShort = (ch.name || '').replace('سُورَةُ ', '');

    return `
      <div class="lib-surah-card" onclick="openSurahFromLibrary(${ch.number})">
        <div class="lib-card-top">
          <div class="lib-card-left">
            <div class="lib-surah-num">${ch.number}</div>
            <div class="lib-card-info">
              <span class="lib-english-name">${ch.englishName}</span>
              <span class="lib-translation-sub">${ch.englishNameTranslation || ''}</span>
              <span class="lib-type-meta">${ch.revelationType} • ${ch.numberOfAyahs} Ayahs</span>
            </div>
          </div>
          <div class="lib-arabic-name">${arabicShort}</div>
        </div>

        <div class="lib-kpi-row">
          ${dueCount > 0 ? `<span class="lib-kpi-badge badge-due">⚡ ${dueCount} Due</span>` : ''}
          ${newCount > 0 ? `<span class="lib-kpi-badge badge-new">✨ ${newCount} New</span>` : ''}
          ${mistakesCount > 0 ? `<span class="lib-kpi-badge badge-mistake">🚩 ${mistakesCount} Mistakes</span>` : ''}
          ${notesCount > 0 ? `<span class="lib-kpi-badge badge-notes">📝 ${notesCount} Notes</span>` : ''}
        </div>

        <div class="lib-mastery-wrap">
          <div class="lib-mastery-label-row">
            <span>Mastery</span>
            <span>${masteryPercent}%</span>
          </div>
          <div class="lib-mastery-track">
            <div class="lib-mastery-fill" style="width: ${masteryPercent}%;"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
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

function getSurahMistakesCount(surahNum) {
  if (!memorizeMistakes) return 0;
  let count = 0;
  const prefix = `${surahNum}:`;
  for (const k in memorizeMistakes) {
    if (k.startsWith(prefix)) count++;
  }
  return count;
}

function getSurahNotesCount(surahNum) {
  if (!ayahNotesStore) return 0;
  let count = 0;
  const prefix = `${surahNum}:`;
  for (const k in ayahNotesStore) {
    if (k.startsWith(prefix) && ayahNotesStore[k] && ayahNotesStore[k].trim()) count++;
  }
  return count;
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

let isDropdownCustomCollapsed = false;
let isDropdownQuranCollapsed = false;

window.toggleDropdownSection = function(section, e) {
  if (e) e.stopPropagation();
  if (section === 'custom') {
    isDropdownCustomCollapsed = !isDropdownCustomCollapsed;
    const list = document.getElementById('dropdownCustomList');
    const arrow = document.getElementById('dropdownCustomArrow');
    if (list) list.style.display = isDropdownCustomCollapsed ? 'none' : 'block';
    if (arrow) arrow.textContent = isDropdownCustomCollapsed ? '▼' : '▲';
  } else if (section === 'quran') {
    isDropdownQuranCollapsed = !isDropdownQuranCollapsed;
    const list = document.getElementById('dropdownQuranList');
    const arrow = document.getElementById('dropdownQuranArrow');
    const text = document.getElementById('dropdownQuranCollapseText');
    if (list) list.style.display = isDropdownQuranCollapsed ? 'none' : 'block';
    if (arrow) arrow.textContent = isDropdownQuranCollapsed ? '▼' : '▲';
    if (text) text.textContent = isDropdownQuranCollapsed ? 'Expand' : 'Collapse';
  }
};

function renderSurahDropdown() {
  if (!surahDropdown) return;
  let customHtml = '';
  if (customTextsStore && customTextsStore.length > 0) {
    const customItemsHtml = customTextsStore.map(ct => {
      const isActive = surahData && surahData.isCustom && surahData.customId === ct.id;
      const sCount = countCustomSentences(ct.rawText);
      return `
        <div class="dropdown-item ${isActive ? 'active' : ''}" onclick="selectCustomText('${ct.id}')">
          <div class="dropdown-item-left">
            <span class="dropdown-surah-name">📝 ${escapeHtml(ct.title)}</span>
            <span class="dropdown-new-pill" style="background:#e0f2fe; color:#0369a1;">${escapeHtml(ct.category || 'Custom')}</span>
          </div>
          <div class="dropdown-item-right">
            <span class="dropdown-arabic-name" style="font-size:0.8rem;">${sCount} ayahs</span>
          </div>
        </div>
      `;
    }).join('');

    customHtml = `
      <div class="dropdown-section-header collapsible-dropdown-header" onclick="toggleDropdownSection('custom', event)" style="padding: 7px 12px; font-size: 0.75rem; font-weight: 700; color: #8c7860; text-transform: uppercase; background: #fdfaf5; border-bottom: 1px solid #ebdcc4; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span id="dropdownCustomArrow" class="dropdown-sec-arrow">${isDropdownCustomCollapsed ? '▼' : '▲'}</span>
          <span>📝 Custom Texts (${customTextsStore.length})</span>
        </div>
        <button type="button" onclick="event.stopPropagation(); openCustomTextModal();" style="border:none; background:transparent; color:#10b981; font-weight:700; cursor:pointer; font-size:0.75rem;">+ New</button>
      </div>
      <div id="dropdownCustomList" style="display: ${isDropdownCustomCollapsed ? 'none' : 'block'};">
        ${customItemsHtml}
      </div>
    `;
  }

  if (!chaptersList || !chaptersList.length) {
    surahDropdown.innerHTML = customHtml || '<div style="padding: 1rem; color: #8c7860;">Loading chapters...</div>';
    return;
  }

  const quranItemsHtml = chaptersList.map(ch => {
    const dueCount = getDueAyahsCountForSurah(ch.number);
    const newCount = getNewAyahsCountForSurah(ch.number, ch.numberOfAyahs);
    const masteryPercent = getSurahMasteryPercent(ch.number, ch.numberOfAyahs);
    const isActive = (!surahData || !surahData.isCustom) && ch.number === currentSurahNumber;
    return `
      <div class="dropdown-item ${isActive ? 'active' : ''}" onclick="selectSurah(${ch.number})">
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

  const quranHeaderHtml = `
    <div class="dropdown-section-header collapsible-dropdown-header" onclick="toggleDropdownSection('quran', event)" style="padding: 7px 12px; font-size: 0.75rem; font-weight: 700; color: #8c7860; text-transform: uppercase; background: #fdfaf5; border-top: 1px solid #ebdcc4; border-bottom: 1px solid #ebdcc4; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span id="dropdownQuranArrow" class="dropdown-sec-arrow">${isDropdownQuranCollapsed ? '▼' : '▲'}</span>
        <span>📖 Quran Surahs (114)</span>
      </div>
      <span id="dropdownQuranCollapseText" style="font-size:0.68rem; font-weight:600; color:#a8947c;">${isDropdownQuranCollapsed ? 'Expand' : 'Collapse'}</span>
    </div>
    <div id="dropdownQuranList" style="display: ${isDropdownQuranCollapsed ? 'none' : 'block'};">
      ${quranItemsHtml}
    </div>
  `;

  surahDropdown.innerHTML = customHtml + quranHeaderHtml;
}

async function initChapters() {
  const cached = localStorage.getItem('quran_chapters_cache');
  if (cached) {
    try {
      chaptersList = JSON.parse(cached);
      renderSurahDropdown();
      if (isLibraryView) renderSurahLibrary();
    } catch (e) {}
  }
  try {
    const res = await fetch('https://api.alquran.cloud/v1/surah');
    const json = await res.json();
    chaptersList = json.data;
    localStorage.setItem('quran_chapters_cache', JSON.stringify(chaptersList));
    renderSurahDropdown();
    if (isLibraryView) renderSurahLibrary();
    enrichMistakeHistory().catch(() => {});
  } catch (e) {
    console.error('Failed to load chapters from network:', e);
    if (!chaptersList || !chaptersList.length) {
      try {
        const localRes = await fetch('chapters_fallback.json');
        chaptersList = await localRes.json();
        renderSurahDropdown();
        if (isLibraryView) renderSurahLibrary();
        enrichMistakeHistory().catch(() => {});
      } catch (err2) {
        console.error('Failed to load fallback chapters:', err2);
      }
    }
  }
}

async function loadSurah(num) {
  currentSurahNumber = num;
  isVbvRenderedForCurrentSurah = false;
  promptedGradeAyahs.clear();
  revealedWordCount = 0;
  currentMemorizeAyah = 1;
  stopAutoReveal();
  isAyahNumberAlwaysVisible = false;
  if (memToggleAyahNumBtn) {
    memToggleAyahNumBtn.classList.remove('active');
  }
  if (currentActiveSpan) {
    currentActiveSpan.classList.remove('ayah-active-span');
    currentActiveSpan = null;
  }
  if (audioPlayer && !audioPlayer.paused) {
    audioPlayer.pause();
  }
  currentAudioIndex = 0;

  const cacheKey = `${num}_${selectedReciter}`;

  if (surahCache.has(cacheKey)) {
    surahData = surahCache.get(cacheKey);
    rangeStart = 1;
    rangeEnd = surahData.verses.length;
    repeatFromVerse.value = `${num}:1`;
    repeatToVerse.value = `${num}:${surahData.verses.length}`;
    updateBanner();
    renderViews();
    if (isLibraryView) {
      showLibraryView();
    } else if (isMemorizeMode && totalWordElements.length > 0) {
      scrollWordIntoFocus(totalWordElements[0], false);
    }
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
    if (isLibraryView) {
      showLibraryView();
    } else if (isMemorizeMode && totalWordElements.length > 0) {
      scrollWordIntoFocus(totalWordElements[0], false);
    }
    return;
  }

  readingView.innerHTML = '<p style="text-align:center;padding:3rem;">Loading Mushaf Madinah Text & Words...</p>';
  vbvView.innerHTML = '<p style="text-align:center;padding:3rem;">Loading Verse by Verse...</p>';

  try {
    // per_page=300 fetches complete chapters (Surah 2 has max 286 verses)
    const qdcRes = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${num}?language=en&words=true&word_fields=text_uthmani&translations=20,33&per_page=300`);
    const json = await qdcRes.json();

    let metaInfo = chaptersList && chaptersList.find(c => c.number === num);
    if (!metaInfo) {
      try {
        const metaRes = await fetch(`https://api.alquran.cloud/v1/surah/${num}`);
        const metaJson = await metaRes.json();
        metaInfo = metaJson.data;
      } catch (e) {
        metaInfo = { number: num, englishName: `Surah ${num}`, name: '', numberOfAyahs: json.verses.length };
      }
    }

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
        audioUrl: getAyahAudioUrl(num, v.verse_number, selectedReciter)
      };
    });

    surahData = {
      meta: metaInfo,
      verses: verses
    };

    surahCache.set(cacheKey, surahData);
    enrichMistakeHistory().catch(() => {});

    rangeStart = 1;
    rangeEnd = surahData.verses.length;
    isRepeatActive = false;
    repeatFromVerse.value = `${num}:1`;
    repeatToVerse.value = `${num}:${surahData.verses.length}`;

    updateBanner();
    renderViews();
    if (isLibraryView) {
      showLibraryView();
    } else if (isMemorizeMode && totalWordElements.length > 0) {
      scrollWordIntoFocus(totalWordElements[0], false);
    }

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
      isRepeatActive = false;
      repeatFromVerse.value = `${num}:1`;
      repeatToVerse.value = `${num}:${surahData.verses.length}`;
      updateBanner();
      renderViews();
      if (isLibraryView) {
        showLibraryView();
      } else if (isMemorizeMode && totalWordElements.length > 0) {
        scrollWordIntoFocus(totalWordElements[0], false);
      }
      return;
    }
    readingView.innerHTML = '<p style="text-align:center;padding:3rem;color:red;">Failed to load Mushaf words. Check network or saved offline text.</p>';
  }
}

function updateBanner() {
  const { meta, verses } = surahData;
  const first = verses[0] || {};
  const bannerMiniTitle = document.getElementById('bannerMiniTitle');
  const bannerMiniSub = document.getElementById('bannerMiniSub');
  const bannerControls = document.getElementById('bannerControls');

  if (surahData && surahData.isCustom) {
    if (!isLibraryView) {
      headerSurahTitle.textContent = meta.englishName || 'Custom Text';
      pageMetaText.textContent = `${meta.numberOfAyahs} Sentences • ${meta.englishNameTranslation || 'Custom'}`;
    }
    updateTopSurahDueBadge();
    renderSurahDropdown();
    document.getElementById('bannerTitle').textContent = meta.englishName || 'Custom Text';
    document.getElementById('bannerSubName').textContent = `${meta.numberOfAyahs} Sentences • ${meta.englishNameTranslation || 'Custom'}`;
    document.getElementById('bannerArabicCalligraphy').textContent = '📝';
    bismillahBlock.style.display = 'none';
    if (bannerMiniTitle) bannerMiniTitle.textContent = meta.englishName || 'Custom Text';
    if (bannerMiniSub) bannerMiniSub.textContent = `• ${meta.numberOfAyahs} Sentences (${meta.englishNameTranslation || 'Custom'})`;
    if (bannerControls) bannerControls.style.display = 'none';

    const surahBanner = document.getElementById('surahBanner');
    if (surahBanner) {
      surahBanner.style.display = isLibraryView ? 'none' : 'flex';
    }
    return;
  }

  if (!isLibraryView) {
    headerSurahTitle.textContent = `${meta.number}. ${meta.englishName}`;
    pageMetaText.textContent = `${first.pageNumber} • ${first.juzNumber}`;
  }
  updateTopSurahDueBadge();
  renderSurahDropdown();
  document.getElementById('bannerTitle').textContent = `${meta.number}. Surah ${meta.englishName}`;
  document.getElementById('bannerSubName').textContent = meta.englishNameTranslation;
  document.getElementById('bannerArabicCalligraphy').textContent = meta.name.replace('سُورَةُ ', '');
  bismillahBlock.style.display = (meta.number === 9 || meta.number === 1 || isLibraryView) ? 'none' : 'block';
  if (bannerMiniTitle) bannerMiniTitle.textContent = `${meta.number}. Surah ${meta.englishName}`;
  if (bannerMiniSub) bannerMiniSub.textContent = `• ${meta.englishNameTranslation}`;
  if (bannerControls) bannerControls.style.display = 'flex';

  const surahBanner = document.getElementById('surahBanner');
  if (surahBanner) {
    surahBanner.style.display = isLibraryView ? 'none' : 'flex';
  }
}

function isVerseArabic(verse) {
  const fullText = (verse.words || []).map(w => w.arabic || '').join(' ');
  const arCount = (fullText.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const ltCount = (fullText.match(/[a-zA-Z]/g) || []).length;
  return arCount >= ltCount;
}

function renderCustomReadingView() {
  const { verses } = surahData;
  const arVerses = verses.filter(v => isVerseArabic(v));
  const ltVerses = verses.filter(v => !isVerseArabic(v));
  const hasBothLanguages = arVerses.length > 0 && ltVerses.length > 0;

  const renderVerseBlock = (verse) => {
    const vIdx = verse.vIdx !== undefined ? verse.vIdx : (verse.verseNumber - 1);
    const isAr = isVerseArabic(verse);
    let wordsHtml = '';
    verse.words.forEach((w, wIdx) => {
      const gIdx = verse.startWordIdx + wIdx;
      const wordDisplay = isHarakatVisible ? w.arabic : w.plain;
      const wordKey = `${surahData.meta.number}:${verse.verseNumber}:${wIdx + 1}`;
      const isMistake = !!memorizeMistakes[wordKey];

      const wordIsAr = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(w.arabic);
      let scriptClass = '';
      if (isAr && !wordIsAr) scriptClass = 'word-latin';
      else if (!isAr && wordIsAr) scriptClass = 'word-arabic';

      wordsHtml += `
        <span class="mushaf-word ${scriptClass} ${isMistake ? 'word-mistake' : ''}" 
              id="m-word-${gIdx}"
              data-global-idx="${gIdx}"
              data-verse-idx="${vIdx}" 
              data-verse-num="${verse.verseNumber}"
              data-word-idx="${wIdx}"
              data-orig-arabic="${escapeHtml(w.arabic)}"
              data-plain-arabic="${escapeHtml(w.plain)}"
              data-trans="" 
              data-translit="">
          ${escapeHtml(wordDisplay)}
        </span> `;
    });

    return `
      <div class="mushaf-verse-span reading-verse-span custom-verse-block ${isAr ? 'sentence-arabic' : 'sentence-latin'}" 
           id="reading-verse-span-${vIdx}" 
           data-verse-idx="${vIdx}" 
           data-verse-num="${verse.verseNumber}" 
           dir="${isAr ? 'rtl' : 'ltr'}">
        ${wordsHtml}
        ${getRosetteSvg(verse.verseNumber)}
      </div>
    `;
  };

  let contentHtml = '';
  if (hasBothLanguages) {
    contentHtml = `
      <div class="custom-section-wrapper" id="customSection_ar">
        <div class="custom-section-header" onclick="toggleCustomSection('ar')">
          <span class="custom-sec-pill">🇸🇦 Arabic Sentences (${arVerses.length} ayahs)</span>
          <button type="button" class="custom-sec-btn" id="btnCustomSec_ar">▲</button>
        </div>
        <div class="custom-section-content" id="customSecContent_ar">
          ${arVerses.map(v => renderVerseBlock(v)).join('')}
        </div>
      </div>

      <div class="custom-section-wrapper" id="customSection_en">
        <div class="custom-section-header" onclick="toggleCustomSection('en')">
          <span class="custom-sec-pill">🇬🇧 English Translation (${ltVerses.length} ayahs)</span>
          <button type="button" class="custom-sec-btn" id="btnCustomSec_en">▲</button>
        </div>
        <div class="custom-section-content" id="customSecContent_en">
          ${ltVerses.map(v => renderVerseBlock(v)).join('')}
        </div>
      </div>
    `;
  } else {
    contentHtml = `
      <div class="custom-section-wrapper" id="customSection_all">
        <div class="custom-section-header" onclick="toggleCustomSection('all')">
          <span class="custom-sec-pill">📝 Sentences (${verses.length} ayahs)</span>
          <button type="button" class="custom-sec-btn" id="btnCustomSec_all">▲</button>
        </div>
        <div class="custom-section-content" id="customSecContent_all">
          ${verses.map(v => renderVerseBlock(v)).join('')}
        </div>
      </div>
    `;
  }

  readingView.innerHTML = `
    <div class="mushaf-page">
      <div class="mushaf-page-content custom-content">
        ${contentHtml}
      </div>
      <div class="page-footer-number">${escapeHtml(surahData.meta.englishName || 'Custom Text')}</div>
    </div>
  `;

  totalWordElements = Array.from(readingView.querySelectorAll('.mushaf-word'));
  totalWordElements.sort((a, b) => parseInt(a.getAttribute('data-global-idx')) - parseInt(b.getAttribute('data-global-idx')));
  totalAyahMarkers = Array.from(readingView.querySelectorAll('.ayah-marker'));

  if (isMemorizeMode) {
    applyMemorizeState(true);
  }
  if (isMultiSelectMode && multiSelectedWordKeys.size > 0) {
    totalWordElements.forEach(el => {
      const vNum = parseInt(el.getAttribute('data-verse-num'));
      const wIdx = parseInt(el.getAttribute('data-word-idx'));
      const key = `${currentSurahNumber}:${vNum}:${wIdx + 1}`;
      if (multiSelectedWordKeys.has(key)) {
        el.classList.add('word-multiselected');
      }
    });
  }
  updateActiveMistakeButtonState();
  updateMemorizeOverridesStats();
}

function toggleBannerCollapse() {
  const surahBanner = document.getElementById('surahBanner');
  const bannerCollapseBtn = document.getElementById('bannerCollapseBtn');
  if (!surahBanner) return;

  const isMin = surahBanner.classList.toggle('minimized');
  if (bannerCollapseBtn) {
    bannerCollapseBtn.textContent = isMin ? '▼' : '▲';
    bannerCollapseBtn.title = isMin ? 'Expand Banner' : 'Collapse Banner';
  }
}

window.toggleCustomSection = function(secKey) {
  const content = document.getElementById(`customSecContent_${secKey}`);
  const btn = document.getElementById(`btnCustomSec_${secKey}`);
  if (!content) return;
  const isHidden = content.style.display === 'none';
  content.style.display = isHidden ? 'block' : 'none';
  if (btn) {
    btn.textContent = isHidden ? '▲' : '▼';
  }
};

function renderViews() {
  // Lazy render: only render the active view to avoid unnecessary DOM operations
  if (currentView === 'reading') {
    renderReadingView();
  } else {
    renderVbvView();
  }
}

function renderReadingView() {
  if (surahData && surahData.isCustom) {
    renderCustomReadingView();
    return;
  }
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
        const langClass = (surahData && surahData.isCustom && typeof w.isArabic === 'boolean')
          ? (w.isArabic ? 'word-arabic' : 'word-latin')
          : '';
        const wordDir = (surahData && surahData.isCustom && typeof w.isArabic === 'boolean')
          ? (w.isArabic ? 'rtl' : 'ltr')
          : '';
        wordsHtml += `
          <span class="mushaf-word ${langClass} ${isMistake ? 'word-mistake' : ''}" 
                id="m-word-${globalWordIndex}"
                data-global-idx="${globalWordIndex}"
                data-verse-idx="${verse.vIdx}" 
                data-verse-num="${verse.verseNumber}"
                data-word-idx="${wIdx}"
                data-orig-arabic="${w.arabic}"
                data-plain-arabic="${w.plain}"
                data-trans="${w.translation || ''}" 
                data-translit="${w.transliteration || ''}"
                ${wordDir ? `dir="${wordDir}"` : ''}>
            ${wordDisplay}
          </span> 
        `;
        globalWordIndex++;
      });

      contentHtml += `
        <span class="mushaf-verse-span reading-verse-span ${surahData && surahData.isCustom ? 'custom-verse-span' : ''}" id="reading-verse-span-${verse.vIdx}" data-verse-idx="${verse.vIdx}" data-verse-num="${verse.verseNumber}" ${surahData && surahData.isCustom ? 'dir="auto"' : ''}>
          ${wordsHtml}
          ${getRosetteSvg(verse.verseNumber)}
        </span>
      `;
    });

    html += `
      <div class="mushaf-page">
        <div class="mushaf-page-content ${surahData && surahData.isCustom ? 'custom-content' : ''}">${contentHtml}</div>
        <div class="page-footer-number">${surahData && surahData.isCustom ? (surahData.meta.englishName || 'Custom Text') : pageNumber}</div>
        ${pIndex < pageKeys.length - 1 ? '<hr class="page-divider" />' : ''}
      </div>
    `;
  });

  readingView.innerHTML = html;
  totalWordElements = Array.from(readingView.querySelectorAll('.mushaf-word'));
  totalAyahMarkers = Array.from(readingView.querySelectorAll('.ayah-marker'));

  if (isMemorizeMode) {
    applyMemorizeState(true);
  }
  if (isMultiSelectMode && multiSelectedWordKeys.size > 0) {
    totalWordElements.forEach(el => {
      const vNum = parseInt(el.getAttribute('data-verse-num'));
      const wIdx = parseInt(el.getAttribute('data-word-idx'));
      const key = `${currentSurahNumber}:${vNum}:${wIdx + 1}`;
      if (multiSelectedWordKeys.has(key)) {
        el.classList.add('word-multiselected');
      }
    });
  }
  updateActiveMistakeButtonState();
  updateMemorizeOverridesStats();
}

function renderVbvView() {
  const { meta, verses } = surahData;
  let html = '';
  let globalWordIndex = 0;

  verses.forEach((verse, idx) => {
    let wordsHtml = '';
    verse.words.forEach((w, wIdx) => {
      const wordDisplay = isHarakatVisible ? w.arabic : w.plain;
      const wordKey = `${meta.number}:${verse.verseNumber}:${wIdx + 1}`;
      const isMistake = !!memorizeMistakes[wordKey];
      wordsHtml += `
        <span class="mushaf-word ${isMistake ? 'word-mistake' : ''}" 
              id="vbv-m-word-${globalWordIndex}"
              data-global-idx="${globalWordIndex}"
              data-verse-idx="${idx}" 
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

    const ayahKey = `${meta.number}:${verse.verseNumber}`;
    const hasNote = Boolean(ayahNotesStore && ayahNotesStore[ayahKey] && ayahNotesStore[ayahKey].trim());
    const noteText = hasNote ? ayahNotesStore[ayahKey] : '';

    html += `
      <div class="vbv-card" id="vbv-card-${idx}">
        <div class="vbv-header">
          <div class="vbv-left">
            <span>${meta.number}:${verse.verseNumber}</span>
            <button class="vbv-btn" onclick="playAyah(${idx})" title="Play Verse">▷</button>
            <button class="vbv-btn vbv-btn-note ${hasNote ? 'has-note' : ''}" onclick="openAyahNoteModal(${meta.number}, ${verse.verseNumber})" title="${hasNote ? 'Edit Reflection' : 'Add Note'}">📝</button>
          </div>
        </div>

        <div class="vbv-arabic">
          <span class="mushaf-verse-span reading-verse-span vbv-verse-span" id="vbv-verse-span-${idx}" data-verse-idx="${idx}" data-verse-num="${verse.verseNumber}">
            ${wordsHtml}
            ${getRosetteSvg(verse.verseNumber)}
          </span>
        </div>

        <div class="vbv-translation-block vbv-trans-en">
          <div class="vbv-trans-text">${verse.translationEn || ''}</div>
          <div class="vbv-trans-source">— Saheeh International</div>
        </div>

        <div class="vbv-translation-block vbv-trans-id">
          <div class="vbv-trans-text">${verse.translationId || ''}</div>
          <div class="vbv-trans-source">— Indonesian Islamic affairs ministry</div>
        </div>

        ${hasNote ? `
          <div class="vbv-note-box" id="vbv-note-${verse.verseNumber}">
            <div class="vbv-note-header">
              <span>📝 Reflection / Note</span>
              <button type="button" class="vbv-btn-edit-note" onclick="openAyahNoteModal(${meta.number}, ${verse.verseNumber})">Edit</button>
            </div>
            <div class="vbv-note-content">${escapeHtml(noteText)}</div>
          </div>
        ` : ''}
      </div>
    `;
  });

  vbvView.innerHTML = html;
  isVbvRenderedForCurrentSurah = true;

  if (currentView === 'vbv') {
    totalWordElements = Array.from(vbvView.querySelectorAll('.mushaf-word'));
    totalAyahMarkers = Array.from(vbvView.querySelectorAll('.ayah-marker'));

    if (isMemorizeMode) {
      applyMemorizeState(true);
    }
    if (isMultiSelectMode && multiSelectedWordKeys.size > 0) {
      totalWordElements.forEach(el => {
        const vNum = parseInt(el.getAttribute('data-verse-num'));
        const wIdx = parseInt(el.getAttribute('data-word-idx'));
        const key = `${currentSurahNumber}:${vNum}:${wIdx + 1}`;
        if (multiSelectedWordKeys.has(key)) {
          el.classList.add('word-multiselected');
        }
      });
    }
    updateActiveMistakeButtonState();
    updateMemorizeOverridesStats();
  }
}

// =========================================================
// HIGH-PERFORMANCE MEMORIZE MODE ENGINE (O(1) INCREMENTAL)
// =========================================================

function toggleMemorizeMode() {
  isMemorizeMode = !isMemorizeMode;

  if (isMemorizeMode) {
    document.body.classList.add('memorize-active');
    viewBtnMemorize.classList.add('active');

    if (currentView === 'vbv') {
      viewBtnVbv.classList.add('active');
      viewBtnReading.classList.remove('active');
      readingView.style.display = 'none';
      vbvView.style.display = 'block';
      if (!isVbvRenderedForCurrentSurah) renderVbvView();
      totalWordElements = Array.from(vbvView.querySelectorAll('.mushaf-word'));
      totalAyahMarkers = Array.from(vbvView.querySelectorAll('.ayah-marker'));
    } else {
      viewBtnReading.classList.add('active');
      viewBtnVbv.classList.remove('active');
      readingView.style.display = 'block';
      vbvView.style.display = 'none';
      totalWordElements = Array.from(readingView.querySelectorAll('.mushaf-word'));
      totalAyahMarkers = Array.from(readingView.querySelectorAll('.ayah-marker'));
    }

    revealedWordCount = 0;
    currentMemorizeAyah = 1;
    isAyahNumberAlwaysVisible = false;
    if (memToggleAyahNumBtn) {
      memToggleAyahNumBtn.classList.remove('active');
    }
    memorizeBar.classList.add('show');
    minimizeAudioBar();
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

if (viewBtnMemorize) viewBtnMemorize.addEventListener('click', toggleMemorizeMode);

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
  if (revealedWordCount > 0 && totalWordElements[revealedWordCount - 1]) {
    const vNum = parseInt(totalWordElements[revealedWordCount - 1].getAttribute('data-verse-num'));
    if (!isNaN(vNum) && vNum > 0) {
      currentMemorizeAyah = vNum;
    }
  }
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

  if (promptedGradeAyahs.size > 0 && newCount < oldCount) {
    promptedGradeAyahs.forEach(vNum => {
      if (!isAyahFullyRevealed(vNum)) promptedGradeAyahs.delete(vNum);
    });
  }
}

function applyMemorizeState(fullReset = false) {
  if (!isMemorizeMode) return;
  if (fullReset) {
    promptedGradeAyahs.clear();
  }
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
    const markers = document.querySelectorAll(`.ayah-marker[data-verse="${v.verseNumber}"]`);
    if (!markers || !markers.length) return;

    const ayahKey = `${currentSurahNumber}:${v.verseNumber}`;
    const override = ayahVisOverrides[ayahKey];

    markers.forEach(marker => {
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
        if (alwaysVis) {
          marker.classList.remove('hidden-ayah');
          return;
        }

        // When in memorize mode and toggle ayah number is set to hidden:
        let isLastWordRevealed = false;
        if (totalWordElements && totalWordElements[v.endWordIdx]) {
          isLastWordRevealed = !totalWordElements[v.endWordIdx].classList.contains('memorize-hidden');
        } else {
          isLastWordRevealed = (revealedWordCount > v.endWordIdx);
        }

        if (isLastWordRevealed) {
          marker.classList.remove('hidden-ayah');
        } else {
          marker.classList.add('hidden-ayah');
        }
      }
    });
  });
}

function isAyahFullyRevealed(verseNum) {
  if (!surahData || !surahData.verses) return false;
  const verse = surahData.verses[verseNum - 1];
  if (!verse) return false;

  if (!totalWordElements || totalWordElements.length === 0) {
    return revealedWordCount > verse.endWordIdx;
  }

  for (let i = verse.startWordIdx; i <= verse.endWordIdx; i++) {
    const el = totalWordElements[i];
    if (el && el.classList.contains('memorize-hidden')) {
      return false;
    }
  }
  return true;
}

function triggerGradeRevealForAyah(verseNum) {
  if (!isMemorizeMode || !isGradeMode) return;
  if (!surahData || !surahData.verses || !surahData.verses[verseNum - 1]) return;
  if (promptedGradeAyahs.has(verseNum)) return;
  if (ayahGradingOverlay && ayahGradingOverlay.classList.contains('show')) return;

  promptedGradeAyahs.add(verseNum);
  if (isAutoRevealing) {
    stopAutoReveal();
  }

  setTimeout(() => {
    if (isMemorizeMode && isGradeMode && isAyahFullyRevealed(verseNum)) {
      isGradeModalFromReveal = true;
      openAyahGradingModal(currentSurahNumber, verseNum);
    }
  }, 180);
}

function revealWordAt(idx, isRapid = false) {
  const wordEl = totalWordElements[idx];
  if (!wordEl) return;
  const override = getWordVisibilityState(wordEl);
  if (override !== 'hidden') {
    wordEl.classList.remove('memorize-hidden');
  }

  totalWordElements.forEach(w => w.classList.remove('mem-active-focus'));
  wordEl.classList.add('mem-active-focus');
  scrollWordIntoFocus(wordEl, isRapid);

  revealedWordCount = Math.max(revealedWordCount, idx + 1);
  updateAyahMarkersVisibility();
  updateActiveMistakeButtonState();

  if (isGradeMode) {
    const vNum = parseInt(wordEl.getAttribute('data-verse-num'));
    if (!isNaN(vNum) && isAyahFullyRevealed(vNum)) {
      triggerGradeRevealForAyah(vNum);
    }
  }
}

function hideWordAt(idx, isRapid = false) {
  const wordEl = totalWordElements[idx];
  if (!wordEl) return;
  const override = getWordVisibilityState(wordEl);
  if (override !== 'visible') {
    wordEl.classList.add('memorize-hidden');
  }
  wordEl.classList.remove('mem-active-focus');

  const vNum = parseInt(wordEl.getAttribute('data-verse-num'));
  if (!isNaN(vNum) && promptedGradeAyahs.has(vNum)) {
    promptedGradeAyahs.delete(vNum);
  }

  let prevRevealedEl = null;
  for (let i = idx - 1; i >= 0; i--) {
    const el = totalWordElements[i];
    if (el && !el.classList.contains('memorize-hidden')) {
      prevRevealedEl = el;
      break;
    }
  }
  if (prevRevealedEl) {
    prevRevealedEl.classList.add('mem-active-focus');
    scrollWordIntoFocus(prevRevealedEl, isRapid);
  } else {
    scrollWordIntoFocus(wordEl, isRapid);
  }

  updateAyahMarkersVisibility();
  updateActiveMistakeButtonState();
}

function revealNextWord(isRapid = false) {
  if (!surahData || !surahData.verses || surahData.verses.length === 0) return;

  const curAyahNum = getActiveMemorizeVerseNum();
  const curVerseIdx = Math.max(0, Math.min(surahData.verses.length - 1, curAyahNum - 1));
  const targetVerse = surahData.verses[curVerseIdx];

  // 1. Search for the first hidden word in the active Ayah
  let nextHiddenIdx = -1;
  for (let i = targetVerse.startWordIdx; i <= targetVerse.endWordIdx; i++) {
    const el = totalWordElements[i];
    if (el && el.classList.contains('memorize-hidden')) {
      nextHiddenIdx = i;
      break;
    }
  }

  // 2. If a hidden word is found in the active Ayah, reveal it
  if (nextHiddenIdx !== -1) {
    revealWordAt(nextHiddenIdx, isRapid);
    return;
  }

  // 3. If all words in the active Ayah are already revealed, advance to next Ayah
  if (curVerseIdx < surahData.verses.length - 1) {
    const nextVerseNum = curAyahNum + 1;
    switchToAyah(nextVerseNum);
    const nextVerse = surahData.verses[curVerseIdx + 1];
    if (nextVerse) {
      for (let i = nextVerse.startWordIdx; i <= nextVerse.endWordIdx; i++) {
        const el = totalWordElements[i];
        if (el && el.classList.contains('memorize-hidden')) {
          revealWordAt(i, isRapid);
          break;
        }
      }
    }
  } else {
    stopAutoReveal();
    showToastNotification('All Ayahs revealed in this Surah');
  }
}

function unrevealPreviousWord(isRapid = false) {
  if (!surahData || !surahData.verses || surahData.verses.length === 0) return;

  const curAyahNum = getActiveMemorizeVerseNum();
  const curVerseIdx = Math.max(0, Math.min(surahData.verses.length - 1, curAyahNum - 1));
  const targetVerse = surahData.verses[curVerseIdx];

  // 1. Search backwards for the last revealed word in the active Ayah
  let lastRevealedIdx = -1;
  for (let i = targetVerse.endWordIdx; i >= targetVerse.startWordIdx; i--) {
    const el = totalWordElements[i];
    if (el && !el.classList.contains('memorize-hidden')) {
      lastRevealedIdx = i;
      break;
    }
  }

  // 2. If a revealed word is found in the active Ayah, hide it
  if (lastRevealedIdx !== -1) {
    hideWordAt(lastRevealedIdx, isRapid);
    return;
  }

  // 3. If all words in the active Ayah are already hidden, switch to previous Ayah
  if (curVerseIdx > 0) {
    const prevVerseNum = curAyahNum - 1;
    switchToAyah(prevVerseNum);
    const prevVerse = surahData.verses[curVerseIdx - 1];
    if (prevVerse) {
      for (let i = prevVerse.endWordIdx; i >= prevVerse.startWordIdx; i--) {
        const el = totalWordElements[i];
        if (el && !el.classList.contains('memorize-hidden')) {
          hideWordAt(i, isRapid);
          break;
        }
      }
    }
  } else {
    showToastNotification('Already at start of Ayah 1');
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

// Ayah Switch Buttons in Memorize Mode (Image 2)
if (memPrevAyahBtn) {
  memPrevAyahBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cur = getActiveMemorizeVerseNum();
    switchToAyah(cur - 1);
  });
}

if (memNextAyahBtn) {
  memNextAyahBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cur = getActiveMemorizeVerseNum();
    switchToAyah(cur + 1);
  });
}

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

// Mark Mistake Button Logic (Click: flag/log mistake on active word • Hold/Shift-click: Mistake Mode)
if (memMarkMistakeBtn) {
  let mistakeHoldTimer = null;
  let mistakeHoldTriggered = false;

  memMarkMistakeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mistakeHoldTriggered) {
      mistakeHoldTriggered = false;
      return;
    }
    if (e.shiftKey) {
      toggleMistakeMode();
      return;
    }
    if (revealedWordCount > 0 && totalWordElements[revealedWordCount - 1]) {
      const activeEl = totalWordElements[revealedWordCount - 1];
      const vNum = parseInt(activeEl.getAttribute('data-verse-num'));
      const wIdx = parseInt(activeEl.getAttribute('data-word-idx'));
      markWordMistake(currentSurahNumber, vNum, wIdx + 1);
    } else if (totalWordElements.length > 0) {
      const activeEl = totalWordElements[0];
      const vNum = parseInt(activeEl.getAttribute('data-verse-num'));
      const wIdx = parseInt(activeEl.getAttribute('data-word-idx'));
      markWordMistake(currentSurahNumber, vNum, wIdx + 1);
    } else {
      toggleMistakeMode();
    }
  });

  memMarkMistakeBtn.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    mistakeHoldTriggered = false;
    mistakeHoldTimer = setTimeout(() => {
      mistakeHoldTriggered = true;
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
    showToastNotification('🚩 Mistake Mode ON: Click any word to log a mistake');
  } else {
    showToastNotification('✓ Mistake Mode OFF');
  }
}

function markWordMistake(surahNum, verseNum, wordPos) {
  const key = `${surahNum}:${verseNum}:${wordPos}`;
  const wasAlreadyMarked = Boolean(memorizeMistakes[key]);
  const prevCount = (memorizeMistakes[key] && memorizeMistakes[key].count) ? memorizeMistakes[key].count : (wasAlreadyMarked ? 1 : 0);
  const newCount = prevCount + 1;

  memorizeMistakes[key] = {
    timestamp: Date.now(),
    surah: surahNum,
    verse: verseNum,
    wordPos: wordPos,
    count: newCount
  };
  recordMistakeHistoryEntry(surahNum, verseNum, wordPos, 'marked');
  saveMistakes(memorizeMistakes);
  updateWordElementsMistakeClasses();
  updateActiveMistakeButtonState();
  updateMemorizeOverridesStats();

  // Count total times marked in history
  const histCount = (mistakeHistoryStore || []).filter(e => e && e.wordKey === key && e.action === 'marked').length || newCount;
  if (wasAlreadyMarked || histCount > 1) {
    showToastNotification(`🚩 Mistake recorded again on ${surahNum}:${verseNum} #${wordPos} (${histCount}×)`);
  } else {
    showToastNotification(`🚩 Marked mistake on ${surahNum}:${verseNum} #${wordPos}`);
  }

  if (typeof scheduleGdriveAutoSync === 'function') {
    scheduleGdriveAutoSync();
  }
}

function clearWordMistake(surahNum, verseNum, wordPos) {
  const key = `${surahNum}:${verseNum}:${wordPos}`;
  if (memorizeMistakes[key]) {
    delete memorizeMistakes[key];
  }
  recordMistakeHistoryEntry(surahNum, verseNum, wordPos, 'cleared');
  saveMistakes(memorizeMistakes);
  updateWordElementsMistakeClasses();
  updateActiveMistakeButtonState();
  updateMemorizeOverridesStats();
  showToastNotification(`✓ Cleared mistake on ${surahNum}:${verseNum} #${wordPos}`);

  if (typeof scheduleGdriveAutoSync === 'function') {
    scheduleGdriveAutoSync();
  }
}

function resolveAyahMistakes(surahNum, verseNum) {
  if (!memorizeMistakes) return 0;
  const prefix = `${surahNum}:${verseNum}:`;
  const ayahKey = `${surahNum}:${verseNum}`;
  let resolvedCount = 0;

  Object.keys(memorizeMistakes).forEach(key => {
    if (key === ayahKey || key.startsWith(prefix)) {
      const parts = key.split(':');
      const s = parseInt(parts[0]);
      const v = parseInt(parts[1]);
      const w = parseInt(parts[2]) || 1;
      delete memorizeMistakes[key];
      recordMistakeHistoryEntry(s, v, w, 'cleared', null, false);
      resolvedCount++;
    }
  });

  if (resolvedCount > 0) {
    saveMistakes(memorizeMistakes);
    saveMistakeHistory();
    updateWordElementsMistakeClasses();
    updateActiveMistakeButtonState();
    updateMemorizeOverridesStats();
    const modal = document.getElementById('mistakeHistoryModal');
    if (modal && (modal.classList.contains('show') || modal.style.display === 'flex')) {
      renderMistakeHistoryModal();
    }
    if (typeof scheduleGdriveAutoSync === 'function') {
      scheduleGdriveAutoSync();
    }
  }
  return resolvedCount;
}

function toggleWordMistake(surahNum, verseNum, wordPos) {
  // Always mark / log repeat mistake without removing the existing mark
  markWordMistake(surahNum, verseNum, wordPos);
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
  const ayahKey = `${currentSurahNumber}:${verseNum}`;
  if (ayahCtxHeader) {
    ayahCtxHeader.textContent = (surahData && surahData.isCustom) 
      ? `Sentence ${verseNum}` 
      : `Ayah ${currentSurahNumber}:${verseNum}`;
  }

  const override = ayahVisOverrides[ayahKey];
  if (ayahCtxPinVisible) ayahCtxPinVisible.classList.toggle('active', override === 'visible');
  if (ayahCtxPinHidden) ayahCtxPinHidden.classList.toggle('active', override === 'hidden');

  if (x === undefined || y === undefined || (x === 0 && y === 0)) {
    const marker = document.querySelector(`.ayah-marker[data-verse="${verseNum}"]`);
    if (marker) {
      const rect = marker.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.bottom + 6;
    } else {
      x = window.innerWidth / 2;
      y = 120;
    }
  }

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

[readingView, vbvView].forEach(container => {
  if (!container) return;

  container.addEventListener('mouseover', (e) => {
    if (wordPopupTrigger === 'tap') return; // Tap mode active: ignore hover
    const wordEl = e.target.closest('.mushaf-word');
    if (!wordEl) return;
    if (isMemorizeMode && wordEl.classList.contains('memorize-hidden')) return;
    clearTimeout(hoverTimeout);
    showWordTooltip(wordEl);
  });

  container.addEventListener('mouseout', (e) => {
    if (wordPopupTrigger === 'tap') return;
    const wordEl = e.target.closest('.mushaf-word');
    if (!wordEl) return;
    hoverTimeout = setTimeout(() => {
      if (!wordHoverTooltip.matches(':hover') && !wordContextMenu.classList.contains('show')) {
        hideWordTooltip();
      }
    }, 250);
  });

  container.addEventListener('click', (e) => {
    const wordEl = e.target.closest('.mushaf-word');
    if (wordEl) {
      const vNum = parseInt(wordEl.getAttribute('data-verse-num'));
      const wIdx = parseInt(wordEl.getAttribute('data-word-idx'));
      const wordKey = `${currentSurahNumber}:${vNum}:${wIdx + 1}`;
      const isAlwaysHidden = wordEl.classList.contains('persist-hidden') || (wordVisOverrides && wordVisOverrides[wordKey] === 'hidden');

      // 0. Multi-select mode active: tap word to toggle selection or execute active direct action
      if (isMultiSelectMode) {
        e.stopPropagation();
        handleMultiSelectWordClick(wordEl, wordKey, currentSurahNumber, vNum, wIdx + 1);
        return;
      }

      // 1. Mistake mode active: tapping any word marks/unmarks mistake
      if (isMistakeMode) {
        e.stopPropagation();
        toggleWordMistake(currentSurahNumber, vNum, wIdx + 1);
        return;
      }

      // 2. Always Hidden word: tapping on the empty space MUST show pop up window!
      if (isAlwaysHidden) {
        e.stopPropagation();
        showWordTooltip(wordEl, true);
        return;
      }

      // 3. Memorize mode active
      if (isMemorizeMode) {
        const clickedIdx = parseInt(wordEl.getAttribute('data-global-idx'));
        const isCurrentlyHidden = wordEl.classList.contains('memorize-hidden');

        if (!isNaN(clickedIdx) && isCurrentlyHidden) {
          if (currentMemorizeAyah !== vNum) {
            switchToAyah(vNum, false);
          }
          const verse = surahData.verses[vNum - 1];
          if (verse) {
            for (let i = verse.startWordIdx; i <= clickedIdx; i++) {
              const el = totalWordElements[i];
              if (el) {
                const override = getWordVisibilityState(el);
                if (override !== 'hidden') {
                  el.classList.remove('memorize-hidden');
                }
              }
            }
            totalWordElements.forEach(w => w.classList.remove('mem-active-focus'));
            wordEl.classList.add('mem-active-focus');
            scrollWordIntoFocus(wordEl, false);
            revealedWordCount = Math.max(revealedWordCount, clickedIdx + 1);
            updateAyahMarkersVisibility();
            updateActiveMistakeButtonState();

            if (isGradeMode && isAyahFullyRevealed(vNum)) {
              triggerGradeRevealForAyah(vNum);
            }
          }
        } else {
          // Word is already revealed or pinned visible: tap on word to show menu!
          e.stopPropagation();
          if (wordHoverTooltip && wordHoverTooltip.classList.contains('show') && activeHoveredWordEl === wordEl && wordContextMenu.classList.contains('show')) {
            hideWordTooltip();
          } else {
            showWordTooltip(wordEl, true);
          }
        }
        return;
      }

      // 4. Normal view (Reading View / VBV View): tap on word to show menu!
      e.stopPropagation();
      if (wordHoverTooltip && wordHoverTooltip.classList.contains('show') && activeHoveredWordEl === wordEl && wordContextMenu.classList.contains('show')) {
        hideWordTooltip();
      } else {
        showWordTooltip(wordEl, true);
      }
      return;
    }

    const marker = e.target.closest('.ayah-marker');
    if (marker) {
      e.stopPropagation();
      const verseNum = parseInt(marker.getAttribute('data-verse'));
      if (isMemorizeMode && isGradeMode) {
        openAyahGradingModal(currentSurahNumber, verseNum);
        return;
      }
      if (!isNaN(verseNum)) {
        showAyahContextMenu(verseNum, e.clientX, e.clientY);
      }
      return;
    }
  });

  container.addEventListener('contextmenu', (e) => {
    const wordEl = e.target.closest('.mushaf-word');
    if (wordEl) {
      e.preventDefault();
      e.stopPropagation();
      showWordTooltip(wordEl, true);
      return;
    }
    const marker = e.target.closest('.ayah-marker');
    if (marker) {
      e.preventDefault();
      e.stopPropagation();
      const verseNum = parseInt(marker.getAttribute('data-verse'));
      showAyahContextMenu(verseNum, e.clientX, e.clientY);
    }
  });
});

// =========================================================
// AUDIO BAR & AUTOPLAY WITH REPEAT CONTROLS
// =========================================================

function expandAudioBar() {
  if (!audioBarWrapper) return;
  isMinimized = false;
  audioBarWrapper.classList.remove('minimized');
  audioBarWrapper.classList.add('open');
  if (audioCollapseBtn) {
    audioCollapseBtn.textContent = '▼';
    audioCollapseBtn.title = 'Minimize audio bar';
    audioCollapseBtn.setAttribute('aria-label', 'Minimize audio bar');
  }
  audioBarWrapper.removeAttribute('title');
}

function minimizeAudioBar() {
  if (!audioBarWrapper) return;
  isMinimized = true;
  audioBarWrapper.classList.add('open', 'minimized');
  if (audioCollapseBtn) {
    audioCollapseBtn.textContent = '▲';
    audioCollapseBtn.title = 'Show audio player';
    audioCollapseBtn.setAttribute('aria-label', 'Show audio player');
  }
  audioBarWrapper.setAttribute('title', 'Click to show audio player');
}

function toggleAudioBar() {
  if (isMinimized) {
    expandAudioBar();
  } else {
    minimizeAudioBar();
  }
}

function showAudioBar() {
  expandAudioBar();
}

function openAudioBar(forceUnminimize = false) {
  if (!audioBarWrapper) return;
  audioBarWrapper.classList.add('open');
  if (forceUnminimize) {
    expandAudioBar();
  } else if (isMinimized) {
    minimizeAudioBar();
  } else {
    expandAudioBar();
  }
}

function closeAudioBar() {
  audioPlayer.pause();
  currentAudioIndex = -1;
  isRepeatActive = false;
  mainPlayPauseBtn.textContent = '▶';
  btnListen.textContent = '▶';
  if (currentActiveSpan) {
    currentActiveSpan.classList.remove('ayah-active-span');
    currentActiveSpan = null;
  }
  minimizeAudioBar();
}

window.switchToAyah = function(targetAyah, autoPlayIfPlaying = false) {
  if (!surahData || !surahData.verses || !surahData.verses.length) return;
  const totalVerses = surahData.verses.length;
  if (targetAyah < 1) {
    showToastNotification('Already at Ayah 1');
    return;
  }
  if (targetAyah > totalVerses) {
    showToastNotification(`Already at Ayah ${totalVerses}`);
    return;
  }

  const targetIndex = targetAyah - 1;
  const targetVerse = surahData.verses[targetIndex];

  currentMemorizeAyah = targetAyah;
  if (isMemorizeMode) {
    updateAyahMarkersVisibility();
  }

  // 1. Memorize mode scroll into focus without revealing words
  if (isMemorizeMode) {
    const wordEl = totalWordElements[targetVerse.startWordIdx];
    if (wordEl) {
      scrollWordIntoFocus(wordEl, false);
    } else {
      const span = document.getElementById(`reading-verse-span-${targetIndex}`);
      if (span) span.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // 2. Highlight active span in Mushaf
  if (currentActiveSpan) {
    currentActiveSpan.classList.remove('ayah-active-span');
  }
  currentActiveSpan = document.getElementById(`reading-verse-span-${targetIndex}`);
  if (currentActiveSpan) {
    currentActiveSpan.classList.add('ayah-active-span');
    if (!isMemorizeMode) {
      currentActiveSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // 3. Audio follow selection (do not auto-play next Ayah unless repeat is active & requested)
  const wasPlaying = audioPlayer && !audioPlayer.paused;
  currentAudioIndex = targetIndex;
  audioPlayer.src = targetVerse.audioUrl;
  if (wasPlaying && isRepeatActive && autoPlayIfPlaying) {
    safePlay(audioPlayer);
    if (mainPlayPauseBtn) mainPlayPauseBtn.textContent = '❚❚';
    if (btnListen) btnListen.textContent = '❚❚';
  } else {
    if (wasPlaying) audioPlayer.pause();
    if (mainPlayPauseBtn) mainPlayPauseBtn.textContent = '▶';
    if (btnListen) btnListen.textContent = '▶';
    if (currentTimeDisplay) currentTimeDisplay.textContent = '00:00';
    if (progressFill) progressFill.style.width = '0%';
    if (progressHandle) progressHandle.style.left = '0%';
  }
  syncAyahAudioBar();

  // 4. Voice recorder HUD sync if active
  if (voiceRecorderHud && voiceRecorderHud.style.display !== 'none') {
    updateVoiceRecorderAyah(targetAyah);
  }

  // 5. VBV view scroll if in VBV view
  if (currentView === 'vbv') {
    if (!isVbvRenderedForCurrentSurah) renderVbvView();
    document.querySelectorAll('.vbv-card').forEach(c => c.classList.remove('vbv-active-card'));
    const activeCard = document.getElementById(`vbv-card-${targetIndex}`);
    if (activeCard) {
      activeCard.classList.add('vbv-active-card');
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  showToastNotification(`Ayah ${targetAyah}`);
};

window.playAyahByNumber = function(verseNum) {
  playAyah(verseNum - 1);
};

window.playAyah = function(index) {
  if (!surahData || !surahData.verses[index]) return;
  currentAudioIndex = index;
  if (isMemorizeMode && surahData.verses[index]) {
    currentMemorizeAyah = surahData.verses[index].verseNumber;
    updateAyahMarkersVisibility();
  }
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
    if (currentView === 'reading') {
      currentActiveSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  if (currentView === 'vbv') {
    if (!isVbvRenderedForCurrentSurah) renderVbvView();
    document.querySelectorAll('.vbv-card').forEach(c => c.classList.remove('vbv-active-card'));
    const activeCard = document.getElementById(`vbv-card-${index}`);
    if (activeCard) {
      activeCard.classList.add('vbv-active-card');
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

audioPlayer.addEventListener('ended', () => {
  // Do not auto-advance or loop unless repeat setting was explicitly started
  if (!isRepeatActive || repeatMode === 'off') {
    mainPlayPauseBtn.textContent = '▶';
    btnListen.textContent = '▶';
    if (typeof syncAyahAudioBar === 'function') syncAyahAudioBar();
    return;
  }

  if (currentVersePlayIteration < repeatVerseCount) {
    currentVersePlayIteration++;
    setTimeout(() => safePlay(audioPlayer), delaySeconds * 1000);
    return;
  }
  currentVersePlayIteration = 1;

  // In single-Ayah repeat mode, never auto-advance to the next Ayah
  if (repeatMode === 'single') {
    if (playRangeCount === Infinity || currentRangeIteration < playRangeCount) {
      currentRangeIteration++;
      setTimeout(() => playAyah(currentAudioIndex >= 0 ? currentAudioIndex : rangeStart - 1), delaySeconds * 1000);
    } else {
      isRepeatActive = false;
      mainPlayPauseBtn.textContent = '▶';
      btnListen.textContent = '▶';
      if (typeof syncAyahAudioBar === 'function') syncAyahAudioBar();
    }
    return;
  }

  const nextIdx = currentAudioIndex + 1;
  const rangeEndIdx = rangeEnd - 1;

  if (nextIdx <= rangeEndIdx && nextIdx < surahData.verses.length) {
    setTimeout(() => playAyah(nextIdx), delaySeconds * 1000);
  } else {
    if (playRangeCount === Infinity || currentRangeIteration < playRangeCount) {
      currentRangeIteration++;
      setTimeout(() => playAyah(rangeStart - 1), delaySeconds * 1000);
    } else {
      isRepeatActive = false;
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

if (bannerCollapseBtn) {
  bannerCollapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBannerCollapse();
  });
}
if (bannerCollapsedBar) {
  bannerCollapsedBar.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBannerCollapse();
  });
}

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
if (audioBarWrapper) {
  audioBarWrapper.addEventListener('click', (e) => {
    if (isMinimized) {
      expandAudioBar();
    }
  });
}

if (audioCollapseBtn) {
  audioCollapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAudioBar();
  });
}

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

function setReciter(reciterId) {
  if (!reciterId) return;
  selectedReciter = reciterId;
  localStorage.setItem('quran_selected_reciter', selectedReciter);

  // Sync submenu options
  document.querySelectorAll('#submenuReciter .submenu-option').forEach(opt => {
    opt.classList.toggle('active', opt.getAttribute('data-reciter') === selectedReciter);
  });

  // Sync settings drawer select
  const settingsReciterSelect = document.getElementById('settingsReciterSelect');
  if (settingsReciterSelect) {
    settingsReciterSelect.value = selectedReciter;
  }

  // Update audio URLs for current surah
  if (surahData && surahData.verses) {
    surahData.verses.forEach(v => {
      v.audioUrl = getAyahAudioUrl(currentSurahNumber, v.verseNumber, selectedReciter);
    });

    if (currentAudioIndex >= 0 && surahData.verses[currentAudioIndex]) {
      const isPlaying = audioPlayer && !audioPlayer.paused;
      const curTime = audioPlayer.currentTime;
      audioPlayer.src = surahData.verses[currentAudioIndex].audioUrl;
      audioPlayer.currentTime = curTime;
      if (isPlaying) safePlay(audioPlayer);
    }
  }

  if (voiceRecQariLabel) {
    voiceRecQariLabel.textContent = `Ayah ${voiceActiveVerse} (${getReciterDisplayName()})`;
  }

  showToastNotification(`🎙️ Reciter changed to ${getReciterDisplayName()}`);
}

document.querySelectorAll('#submenuReciter .submenu-option').forEach(opt => {
  opt.addEventListener('click', (e) => {
    e.stopPropagation();
    const reciterId = opt.getAttribute('data-reciter');
    setReciter(reciterId);
    if (menuItemReciter) menuItemReciter.classList.remove('open-sub');
    if (threeDotsPopup) threeDotsPopup.classList.remove('show');
  });
});

const settingsReciterSelect = document.getElementById('settingsReciterSelect');
if (settingsReciterSelect) {
  settingsReciterSelect.value = selectedReciter;
  settingsReciterSelect.addEventListener('change', (e) => {
    setReciter(e.target.value);
  });
}

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
  if (repeatMode === 'off') {
    isRepeatActive = false;
    repeatModalOverlay.classList.remove('show');
    showToastNotification('Audio repeat & auto-next turned OFF');
    return;
  }

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

  isRepeatActive = true;
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

function showWordTooltip(wordEl, autoShowContextMenu = false) {
  const vIdx = parseInt(wordEl.getAttribute('data-verse-idx'));
  const wIdx = parseInt(wordEl.getAttribute('data-word-idx'));
  const trans = wordEl.getAttribute('data-trans') || '';

  // For custom texts or any word without translation:
  // Suppress hover tooltip unless explicitly opening context menu (right-click / tap)
  if (!trans && !autoShowContextMenu) {
    return;
  }

  activeHoveredWordData = { verseIndex: vIdx, wordIndex: wIdx, element: wordEl };

  if (activeHoveredWordEl && activeHoveredWordEl !== wordEl) {
    activeHoveredWordEl.classList.remove('active-word');
  }
  activeHoveredWordEl = wordEl;
  wordEl.classList.add('active-word');

  const isCustom = !!(surahData && surahData.isCustom);
  if (!trans && autoShowContextMenu) {
    wordHoverTooltip.classList.add('no-trans-pill');
    if (wordTooltipDotsBtn) wordTooltipDotsBtn.style.display = 'none';
  } else {
    wordHoverTooltip.classList.remove('no-trans-pill');
    if (wordTooltipDotsBtn) wordTooltipDotsBtn.style.display = 'block';
  }

  wordTooltipTransText.textContent = trans;
  if (wordTooltipTransBtn) {
    wordTooltipTransBtn.style.display = trans ? 'inline-flex' : 'none';
  }
  const rect = wordEl.getBoundingClientRect();
  wordHoverTooltip.style.left = `${rect.left + rect.width / 2}px`;
  wordHoverTooltip.style.top = `${rect.top + window.scrollY}px`;
  wordHoverTooltip.classList.add('show');

  if (autoShowContextMenu) {
    wordContextMenu.classList.add('show');
    // Ensure menu does not overflow viewport right edge
    const menuRect = wordContextMenu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth - 12) {
      wordContextMenu.style.left = 'auto';
      wordContextMenu.style.right = '0';
    } else {
      wordContextMenu.style.left = '0';
      wordContextMenu.style.right = 'auto';
    }
  } else {
    wordContextMenu.classList.remove('show');
  }

  // Update context menu labels for this word
  const verse = surahData && surahData.verses ? surahData.verses[vIdx] : null;
  if (!verse) return;
  const wordPos = wIdx + 1;
  const wordKey = `${currentSurahNumber}:${verse.verseNumber}:${wordPos}`;

  if (ctxItemMore) ctxItemMore.style.display = isCustom ? 'none' : 'flex';
  const ctxItemPlayWord = document.getElementById('ctxItemPlayWord');
  if (ctxItemPlayWord) ctxItemPlayWord.style.display = isCustom ? 'none' : 'flex';

  if (ctxMistakeLabel) {
    ctxMistakeLabel.textContent = memorizeMistakes[wordKey] ? 'Mark Mistake Again (+1)' : 'Mark as Mistake';
  }
  if (ctxItemClearMistake) {
    ctxItemClearMistake.style.display = memorizeMistakes[wordKey] ? 'flex' : 'none';
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
  wordHoverTooltip.classList.remove('no-trans-pill');
  if (wordTooltipDotsBtn) wordTooltipDotsBtn.style.display = 'block';
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
      markWordMistake(currentSurahNumber, verse.verseNumber, activeHoveredWordData.wordIndex + 1);
      hideWordTooltip();
    }
  });
}

if (ctxItemClearMistake) {
  ctxItemClearMistake.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeHoveredWordData) {
      const verse = surahData.verses[activeHoveredWordData.verseIndex];
      clearWordMistake(currentSurahNumber, verse.verseNumber, activeHoveredWordData.wordIndex + 1);
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

if (ctxItemMultiSelect) {
  ctxItemMultiSelect.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeHoveredWordData) {
      const verse = surahData.verses[activeHoveredWordData.verseIndex];
      const wordPos = activeHoveredWordData.wordIndex + 1;
      const wordKey = `${currentSurahNumber}:${verse.verseNumber}:${wordPos}`;
      startMultiSelectMode(activeHoveredWordData.element, wordKey);
    } else {
      startMultiSelectMode();
    }
  });
}

if (ctxItemMistakeHistory) {
  ctxItemMistakeHistory.addEventListener('click', (e) => {
    e.stopPropagation();
    hideWordTooltip();
    openMistakeHistoryModal();
  });
}

// Multi-Select Mode Functions & Action Handlers
function startMultiSelectMode(initialWordEl = null, initialWordKey = null) {
  isMultiSelectMode = true;
  document.body.classList.add('multi-select-active');
  hideWordTooltip();

  if (initialWordKey) {
    multiSelectedWordKeys.add(initialWordKey);
    if (initialWordEl) initialWordEl.classList.add('word-multiselected');
  }

  if (multiSelectToolbar) {
    multiSelectToolbar.style.display = 'block';
  }
  updateMultiSelectBarUi();
  showToastNotification('☑️ Multi-Select Mode ON: Tap words to select');
}

function exitMultiSelectMode() {
  isMultiSelectMode = false;
  document.body.classList.remove('multi-select-active');
  multiSelectedWordKeys.clear();

  if (totalWordElements) {
    totalWordElements.forEach(el => el.classList.remove('word-multiselected'));
  }

  if (multiSelectToolbar) {
    multiSelectToolbar.style.display = 'none';
  }
  showToastNotification('Multi-Select Mode closed');
}

function updateMultiSelectBarUi() {
  if (!multiSelectToolbar) return;
  const count = multiSelectedWordKeys.size;
  if (multiSelectCountBadge) {
    multiSelectCountBadge.textContent = `${count} selected`;
  }
  if (multiSelectStatus) {
    if (multiSelectActionType === 'select') {
      multiSelectStatus.textContent = 'Multi-Select Words';
    } else if (multiSelectActionType === 'mistake') {
      multiSelectStatus.textContent = 'Direct: Mark Mistake';
    } else if (multiSelectActionType === 'visible') {
      multiSelectStatus.textContent = 'Direct: Always Visible';
    } else if (multiSelectActionType === 'hidden') {
      multiSelectStatus.textContent = 'Direct: Always Hidden';
    }
  }

  [msModeSelect, msModeMistake, msModeVisible, msModeHidden].forEach(pill => {
    if (pill) {
      pill.classList.toggle('active', pill.getAttribute('data-mode') === multiSelectActionType);
    }
  });
}

function handleMultiSelectWordClick(wordEl, wordKey, surahNum, verseNum, wordPos) {
  if (multiSelectActionType === 'select') {
    if (multiSelectedWordKeys.has(wordKey)) {
      multiSelectedWordKeys.delete(wordKey);
      wordEl.classList.remove('word-multiselected');
    } else {
      multiSelectedWordKeys.add(wordKey);
      wordEl.classList.add('word-multiselected');
    }
    updateMultiSelectBarUi();
  } else if (multiSelectActionType === 'mistake') {
    toggleWordMistake(surahNum, verseNum, wordPos);
  } else if (multiSelectActionType === 'visible') {
    const cur = wordVisOverrides[wordKey];
    setWordVisibilityOverride(surahNum, verseNum, wordPos, cur === 'visible' ? null : 'visible');
  } else if (multiSelectActionType === 'hidden') {
    const cur = wordVisOverrides[wordKey];
    setWordVisibilityOverride(surahNum, verseNum, wordPos, cur === 'hidden' ? null : 'hidden');
  }
}

// Mode Pills Listeners
[msModeSelect, msModeMistake, msModeVisible, msModeHidden].forEach(pill => {
  if (pill) {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      multiSelectActionType = pill.getAttribute('data-mode') || 'select';
      updateMultiSelectBarUi();
    });
  }
});

// Top Action Buttons
if (msSelectAyahBtn) {
  msSelectAyahBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const curVerseNum = getActiveMemorizeVerseNum();
    if (!surahData || !surahData.verses) return;
    const verse = surahData.verses.find(v => v.verseNumber === curVerseNum);
    if (!verse) return;
    verse.words.forEach((w, wIdx) => {
      const key = `${currentSurahNumber}:${verse.verseNumber}:${wIdx + 1}`;
      multiSelectedWordKeys.add(key);
      const globalIdx = verse.startWordIdx + wIdx;
      if (totalWordElements[globalIdx]) {
        totalWordElements[globalIdx].classList.add('word-multiselected');
      }
    });
    updateMultiSelectBarUi();
    showToastNotification(`Selected all words in Ayah ${currentSurahNumber}:${curVerseNum}`);
  });
}

if (msClearBtn) {
  msClearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    multiSelectedWordKeys.clear();
    if (totalWordElements) {
      totalWordElements.forEach(el => el.classList.remove('word-multiselected'));
    }
    updateMultiSelectBarUi();
  });
}

if (msCloseBtn) {
  msCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exitMultiSelectMode();
  });
}

// Batch Action Buttons
if (msApplyMistakeBtn) {
  msApplyMistakeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (multiSelectedWordKeys.size === 0) {
      showToastNotification('No words selected');
      return;
    }
    let anyUnmarked = false;
    multiSelectedWordKeys.forEach(key => {
      if (!memorizeMistakes[key]) anyUnmarked = true;
    });

    multiSelectedWordKeys.forEach(key => {
      const parts = key.split(':');
      const s = parseInt(parts[0]);
      const v = parseInt(parts[1]);
      const w = parseInt(parts[2]);
      if (anyUnmarked) {
        memorizeMistakes[key] = { timestamp: Date.now(), surah: s, verse: v, wordPos: w };
        recordMistakeHistoryEntry(s, v, w, 'marked', null, false);
      } else {
        delete memorizeMistakes[key];
        recordMistakeHistoryEntry(s, v, w, 'cleared', null, false);
      }
    });

    saveMistakes(memorizeMistakes);
    saveMistakeHistory();
    updateWordElementsMistakeClasses();
    updateActiveMistakeButtonState();
    updateMemorizeOverridesStats();
    showToastNotification(anyUnmarked 
      ? `🚩 Marked ${multiSelectedWordKeys.size} words as mistakes` 
      : `✓ Cleared mistakes on ${multiSelectedWordKeys.size} words`);
  });
}

if (msApplyVisibleBtn) {
  msApplyVisibleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (multiSelectedWordKeys.size === 0) {
      showToastNotification('No words selected');
      return;
    }
    multiSelectedWordKeys.forEach(key => {
      wordVisOverrides[key] = 'visible';
    });
    saveWordVisOverrides(wordVisOverrides);
    if (isMemorizeMode) applyMemorizeState(true);
    updateMemorizeOverridesStats();
    showToastNotification(`📌 Pinned ${multiSelectedWordKeys.size} words as Always Visible`);
  });
}

if (msApplyHiddenBtn) {
  msApplyHiddenBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (multiSelectedWordKeys.size === 0) {
      showToastNotification('No words selected');
      return;
    }
    multiSelectedWordKeys.forEach(key => {
      wordVisOverrides[key] = 'hidden';
    });
    saveWordVisOverrides(wordVisOverrides);
    if (isMemorizeMode) applyMemorizeState(true);
    updateMemorizeOverridesStats();
    showToastNotification(`🙈 Pinned ${multiSelectedWordKeys.size} words as Always Hidden`);
  });
}

if (msApplyResetBtn) {
  msApplyResetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (multiSelectedWordKeys.size === 0) {
      showToastNotification('No words selected');
      return;
    }
    multiSelectedWordKeys.forEach(key => {
      delete wordVisOverrides[key];
    });
    saveWordVisOverrides(wordVisOverrides);
    if (isMemorizeMode) applyMemorizeState(true);
    updateMemorizeOverridesStats();
    showToastNotification(`↺ Reset visibility for ${multiSelectedWordKeys.size} words`);
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

if (ayahCtxNote) {
  ayahCtxNote.addEventListener('click', () => {
    hideAyahContextMenu();
    openAyahNoteModal(currentSurahNumber, activeAyahContextVerse);
  });
}

if (ayahCtxMistakeHistory) {
  ayahCtxMistakeHistory.addEventListener('click', () => {
    hideAyahContextMenu();
    openMistakeHistoryModal();
  });
}

// Ayah Note Modal Event Listeners
if (btnCloseAyahNoteModal) btnCloseAyahNoteModal.addEventListener('click', closeAyahNoteModal);
if (btnCancelAyahNote) btnCancelAyahNote.addEventListener('click', closeAyahNoteModal);
if (btnSaveAyahNote) btnSaveAyahNote.addEventListener('click', saveCurrentAyahNote);
if (btnDeleteAyahNote) btnDeleteAyahNote.addEventListener('click', deleteCurrentAyahNote);
if (ayahNoteModal) {
  ayahNoteModal.addEventListener('click', (e) => {
    if (e.target === ayahNoteModal) closeAyahNoteModal();
  });
}

// Mistake History Modal Event Listeners
if (btnCloseMistakeHistoryModal) btnCloseMistakeHistoryModal.addEventListener('click', closeMistakeHistoryModal);
if (btnCloseMistakeHistoryFooter) btnCloseMistakeHistoryFooter.addEventListener('click', closeMistakeHistoryModal);
if (mistakeHistoryModal) {
  mistakeHistoryModal.addEventListener('click', (e) => {
    if (e.target === mistakeHistoryModal) closeMistakeHistoryModal();
  });
}

if (mistakeFilterChips) {
  mistakeFilterChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.m-chip');
    if (!chip) return;
    mistakeFilterChips.querySelectorAll('.m-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentMistakeFilter = chip.getAttribute('data-filter') || 'all';
    renderMistakeHistoryModal();
  });
}

if (mistakeSearchInput) {
  mistakeSearchInput.addEventListener('input', (e) => {
    currentMistakeSearch = e.target.value;
    if (btnClearMistakeSearch) {
      btnClearMistakeSearch.style.display = currentMistakeSearch ? 'inline-flex' : 'none';
    }
    renderMistakeHistoryModal();
  });
}

if (btnClearMistakeSearch) {
  btnClearMistakeSearch.addEventListener('click', () => {
    if (mistakeSearchInput) mistakeSearchInput.value = '';
    currentMistakeSearch = '';
    btnClearMistakeSearch.style.display = 'none';
    renderMistakeHistoryModal();
  });
}

if (mistakeSortSelect) {
  mistakeSortSelect.addEventListener('change', (e) => {
    currentMistakeSort = e.target.value;
    renderMistakeHistoryModal();
  });
}

if (btnClearMistakeHistoryLog) {
  btnClearMistakeHistoryLog.addEventListener('click', clearMistakeHistoryLog);
}

if (btnPracticeMistakes) {
  btnPracticeMistakes.addEventListener('click', practiceMistakesFromHistory);
}

if (btnLibOpenMistakeHistory) {
  btnLibOpenMistakeHistory.addEventListener('click', (e) => {
    e.preventDefault();
    openMistakeHistoryModal();
  });
}

if (btnOpenMistakeHistoryDrawer) {
  btnOpenMistakeHistoryDrawer.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof closeSettings === 'function') closeSettings();
    openMistakeHistoryModal();
  });
}

// Home / Surah Library Toolbar Controls
if (btnHomeLibrary) {
  btnHomeLibrary.addEventListener('click', () => {
    if (isLibraryView) {
      if (surahData) {
        hideLibraryView();
      } else {
        openSurahFromLibrary(currentSurahNumber || 76);
      }
    } else {
      showLibraryView();
    }
  });
}

if (libSearchInput) {
  libSearchInput.addEventListener('input', (e) => {
    currentLibrarySearch = e.target.value;
    if (libClearSearchBtn) {
      libClearSearchBtn.style.display = currentLibrarySearch ? 'block' : 'none';
    }
    if (activeLibraryTab === 'custom') {
      renderCustomTextsLibrary();
    } else {
      renderSurahLibrary();
    }
  });
}

if (libClearSearchBtn) {
  libClearSearchBtn.addEventListener('click', () => {
    libSearchInput.value = '';
    currentLibrarySearch = '';
    libClearSearchBtn.style.display = 'none';
    if (activeLibraryTab === 'custom') {
      renderCustomTextsLibrary();
    } else {
      renderSurahLibrary();
    }
    libSearchInput.focus();
  });
}

if (libFilterChips) {
  libFilterChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.lib-chip');
    if (!chip) return;
    if (chip.id === 'btnLibOpenMistakeHistory') {
      openMistakeHistoryModal();
      return;
    }
    libFilterChips.querySelectorAll('.lib-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentLibraryFilter = chip.getAttribute('data-filter') || 'all';
    renderSurahLibrary();
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
  if (!verse) return;
  const word = verse.words ? verse.words[modalSelectedWord.wordIndex] : null;

  wdSurahPill.textContent = `${meta.englishName} ▾`;
  wdAyahPill.textContent = `${verse.verseNumber} ▾`;
  wdVerseKeyText.textContent = `${verse.verseKey || (meta.number + ':' + verse.verseNumber)}`;
  wdBannerTranslation.textContent = word && word.translation ? word.translation : '';
  wdBannerTransliteration.textContent = word && word.transliteration ? word.transliteration : '';

  let arabicVerseHtml = '';
  if (verse.words) {
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
  }
  arabicVerseHtml += getRosetteSvg(verse.verseNumber);
  wdArabicVerseContainer.innerHTML = arabicVerseHtml;
  wdTransEnText.textContent = verse.translationEn || '';
  wdTransIdText.textContent = verse.translationId || '';
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
  viewBtnReading.classList.add('active');
  viewBtnVbv.classList.remove('active');
  readingView.style.display = 'block';
  vbvView.style.display = 'none';
  if (isMemorizeMode) {
    totalWordElements = Array.from(readingView.querySelectorAll('.mushaf-word'));
    totalAyahMarkers = Array.from(readingView.querySelectorAll('.ayah-marker'));
    applyMemorizeState(true);
  }
  if (isMinimized) {
    minimizeAudioBar();
  }
});

viewBtnVbv.addEventListener('click', () => {
  currentView = 'vbv';
  viewBtnVbv.classList.add('active');
  viewBtnReading.classList.remove('active');
  if (!isVbvRenderedForCurrentSurah) {
    renderVbvView();
  }
  vbvView.style.display = 'block';
  readingView.style.display = 'none';
  if (isMemorizeMode) {
    totalWordElements = Array.from(vbvView.querySelectorAll('.mushaf-word'));
    totalAyahMarkers = Array.from(vbvView.querySelectorAll('.ayah-marker'));
    applyMemorizeState(true);
  }
  if (isMinimized) {
    minimizeAudioBar();
  }
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
        const parts = key.split(':');
        const s = parseInt(parts[0]);
        const v = parseInt(parts[1]);
        const w = parseInt(parts[2]);
        recordMistakeHistoryEntry(s, v, w, 'cleared', null, false);
        delete memorizeMistakes[key];
        count++;
      }
    });
    saveMistakes(memorizeMistakes);
    saveMistakeHistory();
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
  if (wordHoverTooltip && !wordHoverTooltip.contains(e.target) && !e.target.closest('.mushaf-word')) {
    hideWordTooltip();
  }
});

window.selectSurah = function(id) {
  surahDropdown.classList.remove('show');
  if (isLibraryView) {
    hideLibraryView();
  }
  loadSurah(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// =========================================================
// CUSTOM TEXTS, OBSIDIAN MARKDOWN & MIXED LANGUAGE SYSTEM
// =========================================================

function parseObsidianFrontmatter(rawText) {
  if (!rawText) return { text: '', title: '', category: '', tags: [] };
  let title = '';
  let category = '';
  let tags = [];
  let body = rawText;

  const fmMatch = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fmMatch) {
    const yaml = fmMatch[1];
    body = rawText.slice(fmMatch[0].length);

    const titleMatch = yaml.match(/^title:\s*(.*)$/im);
    if (titleMatch) title = titleMatch[1].trim().replace(/^['"]|['"]$/g, '');

    const catMatch = yaml.match(/^category:\s*(.*)$/im);
    if (catMatch) category = catMatch[1].trim().replace(/^['"]|['"]$/g, '');

    const tagsMatch = yaml.match(/^tags:\s*(?:\[(.*?)\]|(.*))$/im);
    if (tagsMatch) {
      const rawTags = tagsMatch[1] || tagsMatch[2] || '';
      tags = rawTags.split(/[, ]+/).map(t => t.trim().replace(/^#/, '')).filter(Boolean);
      if (!category && tags.length > 0) {
        category = tags[0];
      }
    }
  }

  return { text: body, title, category, tags };
}

function cleanMarkdownLine(line) {
  if (!line) return '';
  let l = line.trim();

  // Strip horizontal rules (---, ***, ___)
  if (/^(\*{3,}|-{3,}|_{3,})$/.test(l)) return '';

  // Strip markdown headings (# Title, ## Subtitle)
  l = l.replace(/^#{1,6}\s+/, '');

  // Strip Obsidian callouts (> [!note], > [!info], etc.)
  l = l.replace(/^>\s*\[![\w-]+\]\s*/i, '');

  // Strip blockquote markers (> )
  l = l.replace(/^>\s*/, '');

  // Strip task list checkboxes (- [ ] , - [x] )
  l = l.replace(/^[-*+]\s+\[[ xX]\]\s+/, '');

  // Strip bullet list markers (- , * , + )
  l = l.replace(/^[-*+]\s+/, '');

  // Strip numbered list markers (1. , 2) , etc.) so "1." doesn't cause a false sentence split
  l = l.replace(/^\d+[\.\)]\s+/, '');

  // Obsidian wiki-links: [[Page Title|Display Text]] -> Display Text, [[Page Title]] -> Page Title
  l = l.replace(/\[\[([^|\]\n]+)\|([^\]\n]+)\]\]/g, '$2');
  l = l.replace(/\[\[([^\]\n]+)\]\]/g, '$1');

  // Strip image embeds: ![[image.png]] or ![alt](url)
  l = l.replace(/!\[\[[^\]\n]+\]\]/g, '');
  l = l.replace(/!\[[^\]\n]*\]\([^)\n]*\)/g, '');

  // Standard markdown links: [Display Text](url) -> Display Text
  l = l.replace(/\[([^\]\n]+)\]\([^)\n]*\)/g, '$1');

  // Obsidian highlights: ==text== -> text
  l = l.replace(/==([^=\n]+)==/g, '$1');

  // Bold / italics: ***text***, **text**, *text*, ___text___, __text__, _text_
  l = l.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  l = l.replace(/\*\*([^*]+)\*\*/g, '$1');
  l = l.replace(/\*([^*]+)\*/g, '$1');
  l = l.replace(/___([^_]+)___/g, '$1');
  l = l.replace(/__([^_]+)__/g, '$1');

  // Strikethrough: ~~text~~ -> text
  l = l.replace(/~~([^~]+)~~/g, '$1');

  // Inline code: `code` -> code
  l = l.replace(/`([^`]+)`/g, '$1');

  // Clean HTML tags (<br>, <span>, etc.)
  l = l.replace(/<br\s*\/?>/gi, ' ');
  l = l.replace(/<[^>]+>/g, '');

  return l.trim();
}

function extractCustomSegments(rawText) {
  if (!rawText) return [];

  // 1. Separate YAML frontmatter if present (Obsidian notes)
  const { text: bodyText } = parseObsidianFrontmatter(rawText);

  // 2. Normalize line breaks
  const normalized = bodyText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. Process line by line: each non-empty line is an ayah, and dots (.) within a line also divide ayahs
  const lines = normalized.split('\n');
  const segments = [];

  lines.forEach(rawLine => {
    const cleanedLine = cleanMarkdownLine(rawLine);
    if (!cleanedLine) return;

    // Within each non-empty line, check if there are sub-sentences divided by dots (., ۔)
    const subParts = cleanedLine.split(/[.۔]+/).map(s => s.trim()).filter(s => s.length > 0);
    if (subParts.length > 0) {
      subParts.forEach(part => segments.push(part));
    }
  });

  return segments;
}

function countCustomSentences(rawText) {
  return extractCustomSegments(rawText).length;
}

function parseCustomTextToSurahData(customText) {
  const text = customText.rawText || '';
  const { title: fmTitle, category: fmCategory } = parseObsidianFrontmatter(text);
  const rawSegments = extractCustomSegments(text);

  let globalWordCounter = 0;
  const verses = rawSegments.map((sentence, idx) => {
    const vNum = idx + 1;
    const rawWords = sentence.split(/\s+/).filter(w => w.trim().length > 0);
    const wordList = rawWords.map((w, wIdx) => {
      const isArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(w);
      return {
        arabic: w,
        plain: w.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, ''),
        translation: '',
        transliteration: '',
        isArabic: isArabic
      };
    });

    const startIdx = globalWordCounter;
    globalWordCounter += wordList.length;
    const endIdx = globalWordCounter > 0 ? (globalWordCounter - 1) : 0;

    return {
      vIdx: idx,
      verseNumber: vNum,
      verseKey: `${customText.id}:${vNum}`,
      pageNumber: 1,
      juzNumber: 1,
      hizbNumber: 1,
      words: wordList,
      startWordIdx: startIdx,
      endWordIdx: endIdx,
      translationEn: '',
      translationId: '',
      audioUrl: null
    };
  });

  const finalTitle = customText.title || fmTitle || 'Custom Text';
  const finalCategory = customText.category || fmCategory || 'Custom Text';

  return {
    isCustom: true,
    customId: customText.id,
    meta: {
      number: customText.id,
      name: finalTitle,
      englishName: finalTitle,
      englishNameTranslation: finalCategory,
      numberOfAyahs: verses.length
    },
    verses: verses
  };
}

function loadCustomTextsStore() {
  try {
    const raw = localStorage.getItem(CUSTOM_TEXTS_STORAGE_KEY);
    if (raw) {
      customTextsStore = JSON.parse(raw) || [];
    } else {
      customTextsStore = [];
    }
  } catch (e) {
    console.warn('Failed to parse custom texts store:', e);
    customTextsStore = [];
  }
}

function saveCustomTextsStore() {
  try {
    localStorage.setItem(CUSTOM_TEXTS_STORAGE_KEY, JSON.stringify(customTextsStore));
    if (typeof markUnsyncedChanges === 'function') markUnsyncedChanges();
  } catch (e) {
    console.warn('Failed to save custom texts store:', e);
  }
}

function seedSampleCustomTextsIfEmpty() {
  if (!customTextsStore || customTextsStore.length === 0) {
    const sample = {
      id: 'custom_sample_intentions',
      title: 'Hadith of Intentions • حديث النيات',
      category: 'Hadith',
      rawText: `عَنْ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ ﷺ يَقُولُ.
إنَّمَا الأَعْمَالُ بِالنِّيَّاتِ.
وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى.
فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ.
وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوْ امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.
Narrated by Umar ibn Al-Khattab may Allah be pleased with him: I heard the Messenger of Allah ﷺ say.
Actions are judged solely by intentions.
And every person will have only what they intended.
So whoever emigrated for Allah and His Messenger, his emigration is for Allah and His Messenger.
And whoever emigrated for worldly benefit or to marry a woman, his emigration is for what he emigrated for.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    customTextsStore = [sample];
    saveCustomTextsStore();
  }
}

function triggerCustomFileImport() {
  const fileInput = document.getElementById('customFileInput');
  if (fileInput) {
    fileInput.value = '';
    fileInput.click();
  }
}

function handleCustomFileImport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const rawContent = e.target.result || '';
    const { text: cleanBody, title: fmTitle, category: fmCategory } = parseObsidianFrontmatter(rawContent);

    if (!customTextModal || customTextModal.style.display === 'none') {
      openCustomTextModal();
    }

    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (customTextTitleInput) {
      if (!customTextTitleInput.value || customTextTitleInput.value === 'New Custom Text' || customTextTitleInput.value === 'Custom Text') {
        customTextTitleInput.value = fmTitle || fileNameWithoutExt;
      }
    }
    if (customTextCategoryInput && !customTextCategoryInput.value && fmCategory) {
      customTextCategoryInput.value = fmCategory;
    }
    if (customTextContentInput) {
      customTextContentInput.value = cleanBody || rawContent;
      updateCustomTextStatsBar();
    }
    showToastNotification(`Imported "${file.name}"`);
  };
  reader.readAsText(file);
}

window.triggerCustomFileImport = triggerCustomFileImport;
window.handleCustomFileImport = handleCustomFileImport;

function initCustomTexts() {
  loadCustomTextsStore();
  seedSampleCustomTextsIfEmpty();
  if (customTextsCountBadge) {
    customTextsCountBadge.textContent = customTextsStore.length;
  }
  if (customTextContentInput) {
    customTextContentInput.addEventListener('input', updateCustomTextStatsBar);

    // Drag-and-drop Obsidian .md and .txt files
    customTextContentInput.addEventListener('dragover', (e) => {
      e.preventDefault();
      customTextContentInput.classList.add('drag-over');
    });
    customTextContentInput.addEventListener('dragleave', () => {
      customTextContentInput.classList.remove('drag-over');
    });
    customTextContentInput.addEventListener('drop', (e) => {
      e.preventDefault();
      customTextContentInput.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleCustomFileImport(e.dataTransfer.files[0]);
      }
    });
  }

  const customFileInput = document.getElementById('customFileInput');
  if (customFileInput) {
    customFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleCustomFileImport(e.target.files[0]);
      }
    });
  }

  if (customTextModal) {
    customTextModal.addEventListener('click', (e) => {
      if (e.target === customTextModal) closeCustomTextModal();
    });
  }
}

function switchLibraryTab(tab) {
  activeLibraryTab = tab;
  if (tabQuranSurahs) tabQuranSurahs.classList.toggle('active', tab === 'quran');
  if (tabCustomTexts) tabCustomTexts.classList.toggle('active', tab === 'custom');

  if (tab === 'quran') {
    if (librarySurahGrid) librarySurahGrid.style.display = 'grid';
    if (customTextsGrid) customTextsGrid.style.display = 'none';
    if (libFilterChips) libFilterChips.style.display = 'flex';
    if (libSearchInput) libSearchInput.placeholder = 'Search Surah by name, number, or translation...';
    if (pageMetaText) pageMetaText.textContent = '114 Surahs • Library';
    renderSurahLibrary();
  } else {
    if (librarySurahGrid) librarySurahGrid.style.display = 'none';
    if (customTextsGrid) customTextsGrid.style.display = 'grid';
    if (libFilterChips) libFilterChips.style.display = 'none';
    if (libSearchInput) libSearchInput.placeholder = 'Search custom texts by title, tag, or content...';
    if (pageMetaText) pageMetaText.textContent = `${customTextsStore.length} Custom Texts • Library`;
    renderCustomTextsLibrary();
  }
}

function renderCustomTextsLibrary() {
  if (!customTextsGrid) return;
  if (customTextsCountBadge) {
    customTextsCountBadge.textContent = customTextsStore.length;
  }

  // Update banner stats for custom texts
  if (libStatsSummary && activeLibraryTab === 'custom') {
    const totalCount = customTextsStore.length;
    let totalSentences = 0;
    let totalWords = 0;
    customTextsStore.forEach(ct => {
      totalSentences += countCustomSentences(ct.rawText);
      totalWords += (ct.rawText || '').split(/\s+/).filter(Boolean).length;
    });
    libStatsSummary.innerHTML = `
      <span class="lib-stat-pill">📝 ${totalCount} Custom ${totalCount === 1 ? 'Text' : 'Texts'}</span>
      <span class="lib-stat-pill stat-due">⚡ ${totalSentences} Total Sentences (Ayahs)</span>
      <span class="lib-stat-pill stat-mastery">📚 ${totalWords} Words</span>
    `;
  }

  const query = (currentLibrarySearch || '').trim().toLowerCase();
  const list = customTextsStore.filter(ct => {
    if (!query) return true;
    const matchTitle = (ct.title || '').toLowerCase().includes(query);
    const matchCat = (ct.category || '').toLowerCase().includes(query);
    const matchContent = (ct.rawText || '').toLowerCase().includes(query);
    return matchTitle || matchCat || matchContent;
  });

  if (list.length === 0) {
    if (customTextsStore.length === 0) {
      customTextsGrid.innerHTML = `
        <div class="lib-custom-empty-state">
          <div class="lib-custom-empty-icon">📝</div>
          <div class="lib-custom-empty-title">Your Custom Texts Library is Empty</div>
          <div class="lib-custom-empty-desc">
            Save any text here to memorize it sentence-by-sentence! Every sentence up to a dot (.) becomes an Ayah with a simple dot button. Full mixed Arabic & English support.
          </div>
          <button type="button" class="lib-btn-new-custom" onclick="openCustomTextModal()" style="margin-top: 8px;">
            <span>➕ Create Your First Custom Text</span>
          </button>
        </div>
      `;
    } else {
      customTextsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 4rem 1rem; color: #8c7860;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🔍</div>
          <div style="font-size: 1.05rem; font-weight:600;">No custom texts match "${escapeHtml(query)}"</div>
          <div style="font-size: 0.85rem; margin-top: 4px;">Try a different keyword or create a new custom text.</div>
        </div>
      `;
    }
    return;
  }

  customTextsGrid.innerHTML = list.map(ct => {
    const sCount = countCustomSentences(ct.rawText);
    const wCount = (ct.rawText || '').split(/\s+/).filter(Boolean).length;
    const cleanPreview = (ct.rawText || '').replace(/\s+/g, ' ').slice(0, 150);
    return `
      <div class="lib-custom-card" onclick="selectCustomText('${ct.id}')">
        <div class="lib-custom-card-top">
          <div class="lib-custom-title-row">
            <div class="lib-custom-icon-badge">📝</div>
            <div class="lib-custom-title-info">
              <span class="lib-custom-title">${escapeHtml(ct.title)}</span>
              <span class="lib-custom-category-tag">${escapeHtml(ct.category || 'Custom')}</span>
            </div>
          </div>
        </div>

        <div class="lib-custom-preview-text" dir="auto">${escapeHtml(cleanPreview)}...</div>

        <div class="lib-custom-meta-row">
          <div class="lib-custom-stats">
            <span>⚡ ${sCount} sentences</span>
            <span>•</span>
            <span>${wCount} words</span>
          </div>
          <div class="lib-custom-actions" onclick="event.stopPropagation()">
            <button type="button" class="lib-custom-btn btn-memorize-direct" onclick="memorizeCustomTextDirect('${ct.id}', event)" title="Open in Memorize Mode">
              🧠 Memorize
            </button>
            <button type="button" class="lib-custom-btn" onclick="openCustomTextModal('${ct.id}')" title="Edit Text">
              ✏️
            </button>
            <button type="button" class="lib-custom-btn" onclick="deleteCustomText('${ct.id}')" title="Delete Text" style="color:#b91c1c;">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openCustomTextModal(customTextId = null) {
  if (customTextId) {
    const ct = customTextsStore.find(c => c.id === customTextId);
    if (!ct) return;
    if (customModalHeading) customModalHeading.textContent = 'Edit Custom Text';
    if (customTextEditId) customTextEditId.value = ct.id;
    if (customTextTitleInput) customTextTitleInput.value = ct.title || '';
    if (customTextCategoryInput) customTextCategoryInput.value = ct.category || '';
    if (customTextContentInput) customTextContentInput.value = ct.rawText || '';
    if (btnDeleteCustomTextModal) btnDeleteCustomTextModal.style.display = 'inline-flex';
  } else {
    if (customModalHeading) customModalHeading.textContent = 'New Custom Text';
    if (customTextEditId) customTextEditId.value = '';
    if (customTextTitleInput) customTextTitleInput.value = '';
    if (customTextCategoryInput) customTextCategoryInput.value = '';
    if (customTextContentInput) customTextContentInput.value = '';
    if (btnDeleteCustomTextModal) btnDeleteCustomTextModal.style.display = 'none';
  }
  updateCustomTextStatsBar();
  if (customTextModal) customTextModal.style.display = 'flex';
  setTimeout(() => {
    if (customTextTitleInput) customTextTitleInput.focus();
  }, 50);
}

function closeCustomTextModal() {
  if (customTextModal) customTextModal.style.display = 'none';
}

function updateCustomTextStatsBar() {
  if (!customTextContentInput) return;
  const text = customTextContentInput.value || '';
  const sCount = countCustomSentences(text);
  const wCount = text.split(/\s+/).filter(Boolean).length;
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  const hasLatin = /[a-zA-Z]/.test(text);

  let langDesc = 'Mixed / Auto';
  if (hasArabic && hasLatin) langDesc = '🌐 Mixed Arabic & English';
  else if (hasArabic) langDesc = '🇸🇦 Arabic Text';
  else if (hasLatin) langDesc = '🇬🇧 English / Latin';

  if (customTextSentenceCount) customTextSentenceCount.textContent = `${sCount} ${sCount === 1 ? 'sentence' : 'sentences'} (ayahs)`;
  if (customTextWordCount) customTextWordCount.textContent = `${wCount} words`;
  if (customTextLangSummary) customTextLangSummary.textContent = langDesc;
}

function insertSampleCustomText() {
  if (!customTextContentInput) return;
  if (!customTextTitleInput.value) {
    customTextTitleInput.value = 'Hadith of Intentions • حديث النيات';
  }
  if (!customTextCategoryInput.value) {
    customTextCategoryInput.value = 'Hadith';
  }
  customTextContentInput.value = `عَنْ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ ﷺ يَقُولُ.
إنَّمَا الأَعْمَالُ بِالنِّيَّاتِ.
وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى.
فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ.
وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوْ امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.
Narrated by Umar ibn Al-Khattab may Allah be pleased with him: I heard the Messenger of Allah ﷺ say.
Actions are judged solely by intentions.
And every person will have only what they intended.
So whoever emigrated for Allah and His Messenger, his emigration is for Allah and His Messenger.
And whoever emigrated for worldly benefit or to marry a woman, his emigration is for what he emigrated for.`;
  updateCustomTextStatsBar();
}

function saveCustomTextFromModal(andMemorize = false) {
  const title = (customTextTitleInput ? customTextTitleInput.value : '').trim() || 'Custom Text';
  const category = (customTextCategoryInput ? customTextCategoryInput.value : '').trim() || 'General';
  const rawText = (customTextContentInput ? customTextContentInput.value : '').trim();

  if (!rawText) {
    alert('Please enter some text for your custom entry.');
    if (customTextContentInput) customTextContentInput.focus();
    return;
  }

  const editId = customTextEditId ? customTextEditId.value : '';
  let targetId = editId;

  if (editId) {
    const idx = customTextsStore.findIndex(c => c.id === editId);
    if (idx !== -1) {
      customTextsStore[idx].title = title;
      customTextsStore[idx].category = category;
      customTextsStore[idx].rawText = rawText;
      customTextsStore[idx].updatedAt = new Date().toISOString();
    }
  } else {
    targetId = 'custom_' + Date.now();
    const newItem = {
      id: targetId,
      title: title,
      category: category,
      rawText: rawText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    customTextsStore.unshift(newItem);
  }

  saveCustomTextsStore();
  closeCustomTextModal();

  if (customTextsCountBadge) {
    customTextsCountBadge.textContent = customTextsStore.length;
  }
  if (activeLibraryTab === 'custom') {
    renderCustomTextsLibrary();
  }
  renderSurahDropdown();

  if (andMemorize) {
    loadCustomText(targetId, true);
  } else {
    showToastNotification('Custom text saved to library');
  }
}

function deleteCustomText(id) {
  const item = customTextsStore.find(c => c.id === id);
  const name = item ? item.title : 'this item';
  if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

  customTextsStore = customTextsStore.filter(c => c.id !== id);
  saveCustomTextsStore();

  if (customTextsCountBadge) {
    customTextsCountBadge.textContent = customTextsStore.length;
  }
  if (activeLibraryTab === 'custom') {
    renderCustomTextsLibrary();
  }
  renderSurahDropdown();

  // If the deleted text was active, revert to Surah 76
  if (surahData && surahData.isCustom && surahData.customId === id) {
    loadSurah(76);
  }

  showToastNotification('Custom text deleted');
}

function deleteCustomTextFromModal() {
  const editId = customTextEditId ? customTextEditId.value : '';
  if (editId) {
    deleteCustomText(editId);
    closeCustomTextModal();
  }
}

function loadCustomText(id, autoMemorize = false) {
  const customText = customTextsStore.find(c => c.id === id);
  if (!customText) {
    showToastNotification('Custom text not found');
    return;
  }

  surahData = parseCustomTextToSurahData(customText);
  currentSurahNumber = customText.id;
  isVbvRenderedForCurrentSurah = false;
  promptedGradeAyahs.clear();
  revealedWordCount = 0;
  currentMemorizeAyah = 1;
  stopAutoReveal();
  isAyahNumberAlwaysVisible = false;
  if (memToggleAyahNumBtn) memToggleAyahNumBtn.classList.remove('active');
  if (currentActiveSpan) {
    currentActiveSpan.classList.remove('ayah-active-span');
    currentActiveSpan = null;
  }
  if (audioPlayer && !audioPlayer.paused) {
    audioPlayer.pause();
  }
  currentAudioIndex = 0;

  rangeStart = 1;
  rangeEnd = surahData.verses.length;
  if (repeatFromVerse) repeatFromVerse.value = `${customText.id}:1`;
  if (repeatToVerse) repeatToVerse.value = `${customText.id}:${surahData.verses.length}`;

  updateBanner();
  renderViews();

  if (isLibraryView) {
    hideLibraryView();
  }

  if (autoMemorize && !isMemorizeMode) {
    toggleMemorizeMode();
  }

  if (isMemorizeMode && totalWordElements.length > 0) {
    scrollWordIntoFocus(totalWordElements[0], false);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.selectCustomText = function(id) {
  if (surahDropdown) surahDropdown.classList.remove('show');
  loadCustomText(id, false);
};

window.memorizeCustomTextDirect = function(id, e) {
  if (e) e.stopPropagation();
  loadCustomText(id, true);
};

window.switchLibraryTab = switchLibraryTab;
window.renderCustomTextsLibrary = renderCustomTextsLibrary;
window.openCustomTextModal = openCustomTextModal;
window.closeCustomTextModal = closeCustomTextModal;
window.insertSampleCustomText = insertSampleCustomText;
window.saveCustomTextFromModal = saveCustomTextFromModal;
window.deleteCustomText = deleteCustomText;
window.deleteCustomTextFromModal = deleteCustomTextFromModal;

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
  const qdcRes = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${num}?language=en&words=true&word_fields=text_uthmani&translations=20,33&per_page=300`);
  const json = await qdcRes.json();

  let metaInfo = chaptersList && chaptersList.find(c => c.number === num);
  if (!metaInfo) {
    try {
      const metaRes = await fetch(`https://api.alquran.cloud/v1/surah/${num}`);
      const metaJson = await metaRes.json();
      metaInfo = metaJson.data;
    } catch (e) {
      metaInfo = { number: num, englishName: `Surah ${num}`, name: '', numberOfAyahs: json.verses.length };
    }
  }

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
      audioUrl: getAyahAudioUrl(num, v.verse_number, selectedReciter)
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

  // 1. Ayah Grading Modal Shortcuts: 1, 2, 3, 4 to Grade & Escape to Close
  const isGradingModalOpen = ayahGradingOverlay && ayahGradingOverlay.classList.contains('show');
  if (isGradingModalOpen) {
    if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
      e.preventDefault();
      gradeCurrentAyah(1);
      return;
    }
    if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
      e.preventDefault();
      gradeCurrentAyah(2);
      return;
    }
    if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
      e.preventDefault();
      gradeCurrentAyah(3);
      return;
    }
    if (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4') {
      e.preventDefault();
      gradeCurrentAyah(4);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeAyahGradingModal();
      return;
    }
    if (['ArrowLeft', 'ArrowRight', ' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      return;
    }
    return;
  }

  // Arrow Down: switch to Next Ayah
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const cur = getActiveMemorizeVerseNum();
    switchToAyah(cur + 1);
    return;
  }

  // Arrow Up: switch to Previous Ayah
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    const cur = getActiveMemorizeVerseNum();
    switchToAyah(cur - 1);
    return;
  }

  if (isMemorizeMode) {
    // ArrowRight, Space: reveal next word in active ayah
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      revealNextWord(false);
    }
    // ArrowLeft, Backspace: unreveal previous word in active ayah
    else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
      e.preventDefault();
      unrevealPreviousWord(false);
    }
    // 'r': Toggle Voice Recorder
    else if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      toggleVoiceRecorder();
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
    // 'g': Toggle Grade Reveal Mode
    else if (e.key.toLowerCase() === 'g') {
      e.preventDefault();
      if (memToggleGradeBtn) memToggleGradeBtn.click();
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

// Anki-Style Append-Only Review Log (revlog) Storage
const FSRS_REVLOG_STORAGE_KEY = 'quran_fsrs_revlog_store';

function loadFsrsRevlog() {
  try {
    const raw = localStorage.getItem(FSRS_REVLOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveFsrsRevlog() {
  try {
    localStorage.setItem(FSRS_REVLOG_STORAGE_KEY, JSON.stringify(fsrsRevlogStore));
  } catch (e) {
    console.warn('Failed to save FSRS revlog:', e);
  }
}

let fsrsRevlogStore = loadFsrsRevlog();

function appendFsrsRevlog(card, rating, scheduledDays, now = new Date()) {
  if (!card) return null;
  const revId = `${now.getTime()}-${Math.random().toString(36).substring(2, 8)}`;
  const entry = {
    id: revId,
    cid: `${card.surahNumber}:${card.verseNumber}`,
    surah: card.surahNumber,
    verse: card.verseNumber,
    rating: rating,
    state: card.state,
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: scheduledDays,
    elapsedDays: card.elapsed_days || 0,
    due: card.due,
    timestamp: now.toISOString()
  };
  fsrsRevlogStore.push(entry);
  saveFsrsRevlog();
  if (typeof markSyncPending === 'function') markSyncPending(1);
  return entry;
}

function bootstrapRevlogFromExistingCards() {
  if (fsrsRevlogStore.length === 0 && fsrsCardStore) {
    Object.values(fsrsCardStore).forEach(c => {
      if (c && c.reps > 0 && c.last_review) {
        fsrsRevlogStore.push({
          id: `init-${c.surahNumber}:${c.verseNumber}-${new Date(c.last_review).getTime()}`,
          cid: `${c.surahNumber}:${c.verseNumber}`,
          surah: c.surahNumber,
          verse: c.verseNumber,
          rating: c.last_rating || 3,
          state: c.state,
          stability: c.stability,
          difficulty: c.difficulty,
          scheduledDays: c.scheduled_days || 1,
          elapsedDays: c.elapsed_days || 0,
          due: c.due,
          timestamp: c.last_review
        });
      }
    });
    if (fsrsRevlogStore.length > 0) {
      saveFsrsRevlog();
    }
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

  // Auto-resolve active word mistakes in this Ayah when graded Good (3) or Easy (4)
  if (rating === FSRS_RATING.GOOD || rating === FSRS_RATING.EASY) {
    card._lastResolvedMistakes = resolveAyahMistakes(card.surahNumber, card.verseNumber);
  } else {
    card._lastResolvedMistakes = 0;
  }

  saveFsrsCards();
  appendFsrsRevlog(card, rating, scheduledDays, now);
  updateAyahGradedBadges();
  if (typeof scheduleGdriveAutoSync === 'function') {
    scheduleGdriveAutoSync();
  }
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
  isGradeModalFromReveal = false;
  ayahGradingOverlay.classList.remove('show');
}

function renderGradingModal() {
  if (!surahData || !surahData.verses[currentGradingVerseIndex]) return;
  const verse = surahData.verses[currentGradingVerseIndex];
  const meta = surahData.meta;

  if (gradingSurahBadge) {
    gradingSurahBadge.textContent = (surahData && surahData.isCustom) 
      ? (meta.englishName || 'Custom Text') 
      : `${meta.number}. ${meta.englishName}`;
  }
  if (gradingAyahTitle) {
    gradingAyahTitle.textContent = (surahData && surahData.isCustom) 
      ? `Sentence ${verse.verseNumber}` 
      : `Ayah ${verse.verseNumber}`;
  }
  if (gradingAyahCounter) {
    gradingAyahCounter.textContent = `${verse.verseNumber} / ${surahData.verses.length}`;
  }

  if (btnGradingPlayAudio) {
    if (!verse.audioUrl) {
      btnGradingPlayAudio.style.display = 'none';
    } else {
      btnGradingPlayAudio.style.display = 'inline-flex';
      const isThisVersePlaying = (currentAudioIndex === currentGradingVerseIndex && !audioPlayer.paused);
      btnGradingPlayAudio.textContent = isThisVersePlaying ? '❚❚' : '▶';
      btnGradingPlayAudio.title = isThisVersePlaying ? 'Pause Ayah Audio' : 'Play Ayah Audio';
      btnGradingPlayAudio.classList.toggle('playing', isThisVersePlaying);
    }
  }

  let arabicVerseText = verse.words.map(w => {
    const disp = isHarakatVisible ? w.arabic : w.plain;
    const lClass = (surahData && surahData.isCustom && typeof w.isArabic === 'boolean') 
      ? (w.isArabic ? 'word-arabic' : 'word-latin') 
      : '';
    return `<span class="${lClass}">${disp}</span>`;
  }).join(' ');
  if (gradingArabicVerse) gradingArabicVerse.innerHTML = `${arabicVerseText} ${getRosetteSvg(verse.verseNumber)}`;
  if (gradingVerseTrans) gradingVerseTrans.textContent = verse.translationEn || '';

  const card = getOrCreateAyahCard(meta.number, verse.verseNumber, verse);

  if (gradingAyahStatus) {
    gradingAyahStatus.className = 'compact-status-badge';
    const lastGradedStr = card.last_review ? getLastGradedTimeStr(card.last_review, false) : '';
    if (card.state === FSRS_STATE.NEW || !lastGradedStr) {
      gradingAyahStatus.classList.add('state-new');
      gradingAyahStatus.textContent = 'New';
    } else if (card.state === FSRS_STATE.LEARNING) {
      gradingAyahStatus.classList.add('state-learning');
      gradingAyahStatus.textContent = `Graded ${lastGradedStr} ago`;
    } else if (card.state === FSRS_STATE.REVIEW) {
      gradingAyahStatus.classList.add('state-review');
      gradingAyahStatus.textContent = `Graded ${lastGradedStr} ago`;
    } else if (card.state === FSRS_STATE.RELEARNING) {
      gradingAyahStatus.classList.add('state-relearning');
      gradingAyahStatus.textContent = `Graded ${lastGradedStr} ago`;
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
  if (currentView === 'vbv') {
    renderVbvView();
  }
  if (isReviewMode) {
    applyMemorizeState(false);
  }

  const ratingNames = ['Again', 'Hard', 'Good', 'Easy'];
  const resolvedSuffix = card._lastResolvedMistakes > 0
    ? ` • ✓ ${card._lastResolvedMistakes} mistake${card._lastResolvedMistakes > 1 ? 's' : ''} resolved`
    : '';
  showToastNotification(`Ayah ${verse.verseNumber} graded: ${ratingNames[rating - 1]}${resolvedSuffix}`);

  if (isGradeModalFromReveal) {
    isGradeModalFromReveal = false;
    closeAyahGradingModal();
    if (verse.verseNumber < surahData.verses.length) {
      switchToAyah(verse.verseNumber + 1);
    } else {
      showToastNotification(`Ayah ${verse.verseNumber} graded! Surah completed 🎉`);
    }
    return;
  }

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

// Grade Reveal Mode Toggle Listener
if (memToggleGradeBtn) {
  memToggleGradeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isGradeMode = !isGradeMode;
    memToggleGradeBtn.classList.toggle('active', isGradeMode);
    document.body.classList.toggle('grade-mode-active', isGradeMode);
    if (toggleGradeRevealMode) toggleGradeRevealMode.checked = isGradeMode;
    if (isGradeMode) {
      showToastNotification('🎓 Grade Reveal Mode ON: Pop-up appears on Ayah reveal (keys 1-4)');
      if (gradeModeToast) {
        gradeModeToast.classList.add('show');
        setTimeout(() => { if (gradeModeToast) gradeModeToast.classList.remove('show'); }, 4000);
      }
      const curAyah = getActiveMemorizeVerseNum();
      if (isAyahFullyRevealed(curAyah)) {
        triggerGradeRevealForAyah(curAyah);
      }
    } else {
      showToastNotification('Grade Reveal Mode OFF');
      if (gradeModeToast) gradeModeToast.classList.remove('show');
    }
  });
}

if (toggleGradeRevealMode) {
  toggleGradeRevealMode.addEventListener('change', () => {
    isGradeMode = toggleGradeRevealMode.checked;
    if (memToggleGradeBtn) memToggleGradeBtn.classList.toggle('active', isGradeMode);
    document.body.classList.toggle('grade-mode-active', isGradeMode);
    if (isGradeMode) {
      showToastNotification('🎓 Grade Reveal Mode ON');
      const curAyah = getActiveMemorizeVerseNum();
      if (isAyahFullyRevealed(curAyah)) {
        triggerGradeRevealForAyah(curAyah);
      }
    } else {
      showToastNotification('Grade Reveal Mode OFF');
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
    updateAyahGradedBadges();
    if (currentView === 'vbv') renderVbvView();
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
  updateAyahGradedBadges();
  if (currentView === 'vbv') renderVbvView();
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
  updateAyahGradedBadges();
  if (currentView === 'vbv') renderVbvView();
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

// Anki-Style Append-Only Revlog Conflict-Free Merge Engine
function mergeAnkiRevlogs(remotePayload) {
  if (!remotePayload) return { newReviewsAdded: 0 };

  // 1. Merge Revlog (Append-only by unique entry id)
  const remoteRevlog = Array.isArray(remotePayload.revlog) ? remotePayload.revlog : [];
  const logMap = new Map();
  (fsrsRevlogStore || []).forEach(r => {
    if (r && r.id) logMap.set(r.id, r);
  });
  let newReviewsAdded = 0;
  remoteRevlog.forEach(r => {
    if (r && r.id && !logMap.has(r.id)) {
      logMap.set(r.id, r);
      newReviewsAdded++;
    }
  });
  // Sort chronologically ascending
  fsrsRevlogStore = Array.from(logMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  saveFsrsRevlog();

  // 2. Reconcile Card Store based on latest reviews from merged revlog
  const cardLatestReview = new Map();
  const cardRepCounts = new Map();
  fsrsRevlogStore.forEach(r => {
    const key = r.cid || `${r.surah}:${r.verse}`;
    cardRepCounts.set(key, (cardRepCounts.get(key) || 0) + 1);
    const existing = cardLatestReview.get(key);
    if (!existing || new Date(r.timestamp) >= new Date(existing.timestamp)) {
      cardLatestReview.set(key, r);
    }
  });

  // Also import any remote cards if not present locally
  if (remotePayload.fsrsCards && typeof remotePayload.fsrsCards === 'object') {
    Object.keys(remotePayload.fsrsCards).forEach(key => {
      if (!fsrsCardStore[key]) {
        fsrsCardStore[key] = remotePayload.fsrsCards[key];
      }
    });
  }

  // Update cards according to latest review
  cardLatestReview.forEach((latestRev, key) => {
    const parts = key.split(':');
    const sNum = parseInt(parts[0]);
    const vNum = parseInt(parts[1]);
    const card = fsrsCardStore[key] || getOrCreateAyahCard(sNum, vNum);
    const cardLastTime = card.last_review ? new Date(card.last_review).getTime() : 0;
    const revTime = new Date(latestRev.timestamp).getTime();
    if (revTime >= cardLastTime) {
      card.state = latestRev.state;
      card.stability = latestRev.stability;
      card.difficulty = latestRev.difficulty;
      card.scheduled_days = latestRev.scheduledDays;
      card.last_review = latestRev.timestamp;
      card.last_rating = latestRev.rating;
      card.due = latestRev.due;
    }
    card.reps = Math.max(card.reps || 0, cardRepCounts.get(key) || 0);
    fsrsCardStore[key] = card;
  });
  saveFsrsCards();

  // 3. Merge Mistakes & Reconcile from Chronological History
  if (remotePayload.mistakes && typeof remotePayload.mistakes === 'object') {
    Object.assign(memorizeMistakes, remotePayload.mistakes);
    saveMistakes(memorizeMistakes);
  }
  if (Array.isArray(remotePayload.mistakeHistory)) {
    const histMap = new Map();
    mistakeHistoryStore.forEach(h => histMap.set(h.id || (h.wordKey + '-' + h.timestamp), h));
    remotePayload.mistakeHistory.forEach(h => {
      const hId = h.id || (h.wordKey + '-' + h.timestamp);
      if (!histMap.has(hId)) histMap.set(hId, h);
    });
    mistakeHistoryStore = Array.from(histMap.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 500);
    saveMistakeHistory();
  }
  reconcileMistakesFromHistory();

  // 4. Merge Notes (Last-write-wins based on updatedAt timestamp)
  if (remotePayload.notes && typeof remotePayload.notes === 'object') {
    Object.keys(remotePayload.notes).forEach(k => {
      const remoteNote = remotePayload.notes[k];
      const localNote = ayahNotesStore[k];
      if (!localNote) {
        ayahNotesStore[k] = remoteNote;
      } else if (typeof remoteNote === 'object' && remoteNote.updatedAt) {
        const remoteTime = new Date(remoteNote.updatedAt).getTime();
        const localTime = (typeof localNote === 'object' && localNote.updatedAt) ? new Date(localNote.updatedAt).getTime() : 0;
        if (remoteTime > localTime) {
          ayahNotesStore[k] = remoteNote;
        }
      } else if (!localNote) {
        ayahNotesStore[k] = remoteNote;
      }
    });
    saveAyahNotesStore();
  }

  // 5. Merge Overrides
  if (remotePayload.wordVisOverrides) {
    Object.assign(wordVisOverrides, remotePayload.wordVisOverrides);
    saveWordVisOverrides(wordVisOverrides);
  }
  if (remotePayload.ayahVisOverrides) {
    Object.assign(ayahVisOverrides, remotePayload.ayahVisOverrides);
    saveAyahVisOverrides(ayahVisOverrides);
  }

  // 6. Settings
  if (remotePayload.wordPopupTrigger) {
    wordPopupTrigger = remotePayload.wordPopupTrigger;
    localStorage.setItem(POPUP_TRIGGER_KEY, wordPopupTrigger);
    if (togglePopupTap) togglePopupTap.checked = (wordPopupTrigger === 'tap');
  }
  if (typeof remotePayload.fsrsNotifications === 'boolean') {
    setFsrsNotificationsEnabled(remotePayload.fsrsNotifications);
    if (toggleFsrsNotifications) toggleFsrsNotifications.checked = remotePayload.fsrsNotifications;
  }

  // 7. Custom Texts
  if (Array.isArray(remotePayload.customTexts)) {
    remotePayload.customTexts.forEach(incoming => {
      const existingIdx = customTextsStore.findIndex(c => c.id === incoming.id);
      if (existingIdx !== -1) {
        if (new Date(incoming.updatedAt || 0) > new Date(customTextsStore[existingIdx].updatedAt || 0)) {
          customTextsStore[existingIdx] = incoming;
        }
      } else {
        customTextsStore.push(incoming);
      }
    });
    saveCustomTextsStore();
    if (activeLibraryTab === 'custom') renderCustomTextsLibrary();
  }

  // Update UI components
  updateWordElementsMistakeClasses();
  updateActiveMistakeButtonState();
  updateMemorizeOverridesStats();
  updateAyahGradedBadges();
  if (currentView === 'vbv') renderVbvView();
  updateFsrsBadgeAndNotifications(false);
  updateTopSurahDueBadge();
  renderSurahDropdown();
  if (isMemorizeMode) {
    applyMemorizeState(true);
  }
  return { newReviewsAdded };
}

function generateSyncPayload() {
  return {
    app: 'QuranMemFSRS',
    version: '2.0',
    exportDate: new Date().toISOString(),
    revlog: fsrsRevlogStore || [],
    fsrsCards: fsrsCardStore || {},
    mistakes: memorizeMistakes || {},
    mistakeHistory: mistakeHistoryStore || [],
    notes: ayahNotesStore || {},
    wordVisOverrides: wordVisOverrides || {},
    ayahVisOverrides: ayahVisOverrides || {},
    customTexts: customTextsStore || [],
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
    if (typeof clearUnsyncedChanges === 'function') clearUnsyncedChanges();
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

    // Mode 0: Anki Append-Only Revlog (Conflict-Free Merge)
    if (data.revlog && Array.isArray(data.revlog)) {
      mergeAnkiRevlogs(data);
      cardCount = Object.keys(fsrsCardStore).length;
    } else if (data.q === 1 && data.c && typeof data.c === 'object') {
      // Mode 1: Compact QR Code payload (q === 1)
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
      if (Array.isArray(data.mistakeHistory)) {
        mistakeHistoryStore = data.mistakeHistory;
        saveMistakeHistory();
      }
      reconcileMistakesFromHistory();
      if (data.notes && typeof data.notes === 'object') {
        Object.assign(ayahNotesStore, data.notes);
        saveAyahNotesStore();
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
      if (Array.isArray(data.customTexts)) {
        data.customTexts.forEach(incoming => {
          const existingIdx = customTextsStore.findIndex(c => c.id === incoming.id);
          if (existingIdx !== -1) {
            if (new Date(incoming.updatedAt || 0) > new Date(customTextsStore[existingIdx].updatedAt || 0)) {
              customTextsStore[existingIdx] = incoming;
            }
          } else {
            customTextsStore.push(incoming);
          }
        });
        saveCustomTextsStore();
        if (activeLibraryTab === 'custom') renderCustomTextsLibrary();
        renderSurahDropdown();
      }
    }

    let mistakeCount = Object.keys(memorizeMistakes).length;
    updateWordElementsMistakeClasses();
    updateActiveMistakeButtonState();
    updateMemorizeOverridesStats();
    updateAyahGradedBadges();
    if (currentView === 'vbv') renderVbvView();
    updateFsrsBadgeAndNotifications(false);
    if (isMemorizeMode) {
      applyMemorizeState(true);
    }
    if (typeof clearUnsyncedChanges === 'function') clearUnsyncedChanges();

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
        if (typeof clearUnsyncedChanges === 'function') clearUnsyncedChanges();
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
    if (typeof clearUnsyncedChanges === 'function') clearUnsyncedChanges();
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

// =========================================================
// GOOGLE DRIVE SYNC ENGINE (AppData Folder & Anki Revlog)
// =========================================================

const GDRIVE_CLIENT_ID_KEY = 'quran_gdrive_client_id';
const GDRIVE_ACCESS_TOKEN_KEY = 'quran_gdrive_access_token';
const GDRIVE_TOKEN_EXP_KEY = 'quran_gdrive_token_exp';
const GDRIVE_LAST_SYNC_KEY = 'quran_gdrive_last_sync';
const GDRIVE_AUTHORIZED_KEY = 'quran_gdrive_authorized';
const GDRIVE_UNSYNCED_COUNT_KEY = 'quran_gdrive_unsynced_count';
const GDRIVE_FILE_NAME = 'quran_mem_sync_revlog.json';

let gdriveTokenClient = null;
let isGdriveSyncing = false;
let gdriveAutoSyncTimer = null;
let gdriveTokenRefreshTimer = null;

function getGdriveClientId() {
  return localStorage.getItem(GDRIVE_CLIENT_ID_KEY) || '';
}

function setGdriveClientId(id) {
  if (id) {
    localStorage.setItem(GDRIVE_CLIENT_ID_KEY, id.trim());
  } else {
    localStorage.removeItem(GDRIVE_CLIENT_ID_KEY);
  }
  updateTopSyncButtonUi();
}

function hasGdrivePreviousAuth() {
  return localStorage.getItem(GDRIVE_AUTHORIZED_KEY) === 'true';
}

function getUnsyncedChangesCount() {
  return parseInt(localStorage.getItem(GDRIVE_UNSYNCED_COUNT_KEY) || '0') || 0;
}

function markSyncPending(increment = 1) {
  const nextCount = getUnsyncedChangesCount() + increment;
  localStorage.setItem(GDRIVE_UNSYNCED_COUNT_KEY, nextCount.toString());
  updateTopSyncButtonUi(isGdriveSyncing, false);
  scheduleGdriveAutoSync();
}

function clearUnsyncedChanges() {
  localStorage.setItem(GDRIVE_UNSYNCED_COUNT_KEY, '0');
  updateTopSyncButtonUi(false, false);
}

function getGdriveAccessToken() {
  const token = localStorage.getItem(GDRIVE_ACCESS_TOKEN_KEY);
  const exp = parseInt(localStorage.getItem(GDRIVE_TOKEN_EXP_KEY) || '0');
  if (!token) return null;
  if (Date.now() >= exp - 60000) {
    return null;
  }
  return token;
}

function scheduleGdriveTokenRefresh() {
  if (gdriveTokenRefreshTimer) clearTimeout(gdriveTokenRefreshTimer);
  const exp = parseInt(localStorage.getItem(GDRIVE_TOKEN_EXP_KEY) || '0');
  if (!exp) return;
  // Refresh 5 minutes before token expires while app is open
  const msUntilRefresh = Math.max(10000, exp - Date.now() - 5 * 60 * 1000);
  gdriveTokenRefreshTimer = setTimeout(() => {
    if (document.visibilityState === 'visible' && hasGdrivePreviousAuth()) {
      requestGdriveAuth(false, true);
    } else {
      updateTopSyncButtonUi();
    }
  }, msUntilRefresh);
}

function saveGdriveToken(token, expiresInSec = 3600) {
  localStorage.setItem(GDRIVE_ACCESS_TOKEN_KEY, token);
  localStorage.setItem(GDRIVE_TOKEN_EXP_KEY, (Date.now() + expiresInSec * 1000).toString());
  localStorage.setItem(GDRIVE_AUTHORIZED_KEY, 'true');
  scheduleGdriveTokenRefresh();
}

function clearGdriveToken(fullDisconnect = false) {
  localStorage.removeItem(GDRIVE_ACCESS_TOKEN_KEY);
  localStorage.removeItem(GDRIVE_TOKEN_EXP_KEY);
  if (gdriveTokenRefreshTimer) clearTimeout(gdriveTokenRefreshTimer);
  if (fullDisconnect) {
    localStorage.removeItem(GDRIVE_AUTHORIZED_KEY);
  }
}

function isGdriveConnected() {
  return !!getGdriveAccessToken() || hasGdrivePreviousAuth();
}

function formatGdriveRelativeTime(isoString) {
  if (!isoString) return 'Never';
  const diffSec = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 15) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.round(diffHr / 24);
  return `${diffDays}d ago`;
}

function updateTopSyncButtonUi(syncing = false, hasError = false) {
  const topSyncBtn = document.getElementById('topSyncBtn');
  const topSyncBadge = document.getElementById('topSyncBadge');
  if (!topSyncBtn || !topSyncBadge) return;

  topSyncBtn.classList.remove(
    'sync-state-syncing',
    'sync-state-synced',
    'sync-state-pending',
    'sync-state-expired'
  );

  if (syncing) {
    topSyncBtn.classList.add('sync-state-syncing');
    topSyncBadge.style.display = 'none';
    topSyncBtn.title = '🔄 Syncing with Google Drive...';
    return;
  }

  const unsyncedCount = getUnsyncedChangesCount();
  const hasValidToken = !!getGdriveAccessToken();
  const isLinked = hasGdrivePreviousAuth() || !!getGdriveClientId();
  const lastSyncIso = localStorage.getItem(GDRIVE_LAST_SYNC_KEY);
  const hoursSinceLastSync = lastSyncIso
    ? (Date.now() - new Date(lastSyncIso).getTime()) / 3600000
    : Infinity;

  // 1. Error or session expired while changes are waiting
  if (hasError || (isLinked && !hasValidToken && unsyncedCount > 0)) {
    topSyncBtn.classList.add('sync-state-expired');
    topSyncBadge.style.display = 'inline-flex';
    topSyncBadge.textContent = unsyncedCount > 0 ? (unsyncedCount > 99 ? '99+' : `${unsyncedCount}`) : '!';
    topSyncBtn.title = unsyncedCount > 0
      ? `🔴 ${unsyncedCount} unsynced change${unsyncedCount === 1 ? '' : 's'} (Session expired) • Click to sync now`
      : '🔴 Sync attention needed • Click to reconnect & sync';
    return;
  }

  // 2. Unsynced local changes OR stale sync (>12h) -> Anki Amber/Orange Highlight
  if (unsyncedCount > 0 || (isLinked && hoursSinceLastSync >= 12)) {
    topSyncBtn.classList.add('sync-state-pending');
    topSyncBadge.style.display = 'inline-flex';
    topSyncBadge.textContent = unsyncedCount > 0 ? (unsyncedCount > 99 ? '99+' : `${unsyncedCount}`) : '●';
    topSyncBtn.title = unsyncedCount > 0
      ? `🟠 ${unsyncedCount} unsynced change${unsyncedCount === 1 ? '' : 's'} • Click to sync now`
      : `🟠 Last synced ${formatGdriveRelativeTime(lastSyncIso)} • Click to sync`;
    return;
  }

  // 3. Connected or synced cleanly -> Anki Green Highlight
  if (hasValidToken || (isLinked && lastSyncIso)) {
    topSyncBtn.classList.add('sync-state-synced');
    topSyncBadge.style.display = 'inline-flex';
    topSyncBadge.textContent = '✓';
    topSyncBtn.title = `✓ Synced with Google Drive • Last synced: ${formatGdriveRelativeTime(lastSyncIso)} (Click to sync)`;
    return;
  }

  // 4. Default unconfigured state
  topSyncBadge.style.display = 'none';
  topSyncBtn.title = 'Cloud Sync (Click to configure Google Drive or Backup)';
}

function updateGdriveUi(isConnected, syncing = false, message = null) {
  const statusDot = document.getElementById('gdriveStatusDot');
  const statusText = document.getElementById('gdriveStatusText');
  const authBtn = document.getElementById('btnGdriveAuth');
  const authLabel = document.getElementById('btnGdriveAuthLabel');
  const syncActions = document.getElementById('gdriveSyncActions');
  const syncMeta = document.getElementById('gdriveSyncMeta');
  const inputClientId = document.getElementById('inputGdriveClientId');

  if (inputClientId && !inputClientId.value) {
    inputClientId.value = getGdriveClientId();
  }

  updateTopSyncButtonUi(syncing, false);

  if (syncing) {
    if (statusDot) statusDot.className = 'gdrive-status-dot syncing';
    if (statusText) statusText.textContent = message || 'Syncing with Google Drive...';
    return;
  }

  const lastSyncIso = localStorage.getItem(GDRIVE_LAST_SYNC_KEY);
  const logCount = fsrsRevlogStore ? fsrsRevlogStore.length : 0;
  const hasValidToken = !!getGdriveAccessToken();
  const unsyncedCount = getUnsyncedChangesCount();

  if (isConnected) {
    if (statusDot) statusDot.className = 'gdrive-status-dot connected';
    if (statusText) {
      statusText.textContent = hasValidToken
        ? (unsyncedCount > 0 ? `Connected (${unsyncedCount} unsynced)` : 'Connected to Google Drive')
        : 'Google Drive Linked (Tap Sync to refresh)';
    }
    if (authBtn) authBtn.classList.add('connected');
    if (authLabel) authLabel.textContent = hasValidToken ? 'Connected ✓' : 'Sync Drive';
    if (syncActions) syncActions.style.display = 'block';
    if (syncMeta) {
      syncMeta.textContent = `Last synced: ${formatGdriveRelativeTime(lastSyncIso)} • ${logCount} review(s) in Anki log`;
    }
  } else {
    if (statusDot) statusDot.className = 'gdrive-status-dot';
    if (statusText) statusText.textContent = message || 'Disconnected';
    if (authBtn) authBtn.classList.remove('connected');
    if (authLabel) authLabel.textContent = 'Connect Drive';
    if (syncActions) syncActions.style.display = 'none';
  }
}

function initGdriveSync() {
  const inputClientId = document.getElementById('inputGdriveClientId');
  const btnSaveClientId = document.getElementById('btnSaveGdriveClientId');
  const btnHelp = document.getElementById('btnGdriveHelp');
  const helpBox = document.getElementById('gdriveHelpBox');
  const authBtn = document.getElementById('btnGdriveAuth');
  const btnSyncNow = document.getElementById('btnGdriveSyncNow');
  const btnDisconnect = document.getElementById('btnGdriveDisconnect');
  const topSyncBtn = document.getElementById('topSyncBtn');

  if (inputClientId) inputClientId.value = getGdriveClientId();

  if (btnSaveClientId && inputClientId) {
    btnSaveClientId.addEventListener('click', () => {
      const val = inputClientId.value.trim();
      setGdriveClientId(val);
      showSyncStatus(val ? '✓ Saved Google Client ID' : 'Client ID cleared', 'success');
      showToastNotification('Google OAuth Client ID saved');
    });
  }

  if (btnHelp && helpBox) {
    btnHelp.addEventListener('click', () => {
      helpBox.style.display = (helpBox.style.display === 'none' || !helpBox.style.display) ? 'block' : 'none';
    });
  }

  if (authBtn) {
    authBtn.addEventListener('click', () => {
      if (getGdriveAccessToken()) {
        syncWithGoogleDrive(false);
      } else {
        requestGdriveAuth(false, false);
      }
    });
  }

  if (btnSyncNow) {
    btnSyncNow.addEventListener('click', () => syncWithGoogleDrive(false));
  }

  if (btnDisconnect) {
    btnDisconnect.addEventListener('click', disconnectGdrive);
  }

  if (topSyncBtn) {
    topSyncBtn.addEventListener('click', () => {
      if (getGdriveClientId()) {
        syncWithGoogleDrive(false);
      } else {
        if (typeof openSettings === 'function') openSettings();
        const gdriveCard = document.getElementById('gdriveSyncCard');
        const details = document.getElementById('gdriveConfigDetails');
        if (details) details.open = true;
        if (gdriveCard) {
          setTimeout(() => gdriveCard.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
        }
        showToastNotification('☁️ Configure Google Drive Client ID or use Backup/Sync below');
      }
    });
  }

  if (getGdriveAccessToken()) {
    localStorage.setItem(GDRIVE_AUTHORIZED_KEY, 'true');
    scheduleGdriveTokenRefresh();
  }

  updateGdriveUi(isGdriveConnected());

  if (getGdriveAccessToken()) {
    setTimeout(() => syncWithGoogleDrive(true), 3000);
  }
}

function requestGdriveAuth(forceConsent = false, isBackgroundRefresh = false) {
  const clientId = getGdriveClientId();
  if (!clientId) {
    const details = document.getElementById('gdriveConfigDetails');
    const input = document.getElementById('inputGdriveClientId');
    if (details) details.open = true;
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showToastNotification('Please paste your Google OAuth Client ID in settings');
    return;
  }

  if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
    if (!isBackgroundRefresh) {
      showToastNotification('Google Identity Service is loading, please try again in a moment...');
    }
    return;
  }

  const useSilentPrompt = !forceConsent && hasGdrivePreviousAuth();

  try {
    gdriveTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      callback: (resp) => {
        if (resp.error) {
          console.warn('Google Auth Response:', resp);
          // If silent prompt failed because consent or account selection is needed, retry with select_account
          if (useSilentPrompt && !isBackgroundRefresh && (resp.error === 'interaction_required' || resp.error === 'consent_required' || resp.error === 'login_required')) {
            requestGdriveAuth(true, false);
            return;
          }
          if (!isBackgroundRefresh) {
            showToastNotification(`Google Auth Error: ${resp.error}`);
            updateGdriveUi(isGdriveConnected(), false, 'Auth cancelled');
            updateTopSyncButtonUi(false, true);
          }
          return;
        }
        if (resp.access_token) {
          saveGdriveToken(resp.access_token, resp.expires_in || 3600);
          updateGdriveUi(true);
          if (!isBackgroundRefresh) {
            showToastNotification('✓ Connected to Google Drive!');
          }
          syncWithGoogleDrive(isBackgroundRefresh);
        }
      }
    });

    // Use empty prompt ('') when already authorized so Google skips the consent screen!
    gdriveTokenClient.requestAccessToken({ prompt: useSilentPrompt ? '' : 'select_account' });
  } catch (err) {
    console.error('Error starting Google Auth:', err);
    if (!isBackgroundRefresh) {
      showToastNotification('Failed to open Google Sign-In prompt. Check Client ID.');
    }
  }
}

function disconnectGdrive() {
  const token = getGdriveAccessToken();
  if (token && typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
    try {
      google.accounts.oauth2.revoke(token, () => {});
    } catch (e) {}
  }
  clearGdriveToken(true);
  updateGdriveUi(false);
  showToastNotification('Disconnected from Google Drive');
  showSyncStatus('Disconnected from Google Drive', 'info');
}

async function syncWithGoogleDrive(isSilent = false) {
  if (isGdriveSyncing) return;
  const token = getGdriveAccessToken();
  if (!token) {
    updateTopSyncButtonUi(false, false);
    if (!isSilent) {
      requestGdriveAuth(false, false);
    }
    return;
  }

  isGdriveSyncing = true;
  updateGdriveUi(true, true);
  if (!isSilent) showToastNotification('🔄 Syncing with Google Drive...');

  try {
    const searchUrl = 'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name=%27' + encodeURIComponent(GDRIVE_FILE_NAME) + '%27+and+trashed=false&fields=files(id,name,modifiedTime)';
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (searchRes.status === 401) {
      clearGdriveToken(false);
      updateGdriveUi(isGdriveConnected(), false, 'Session expired. Tap Sync to refresh.');
      updateTopSyncButtonUi(false, true);
      isGdriveSyncing = false;
      if (!isSilent) {
        requestGdriveAuth(false, false);
      }
      return;
    }

    const searchData = await searchRes.json();
    let fileId = null;
    let remotePayload = null;

    if (searchData.files && searchData.files.length > 0) {
      fileId = searchData.files[0].id;
      const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (downloadRes.ok) {
        remotePayload = await downloadRes.json();
      }
    }

    let mergeStats = { newReviewsAdded: 0 };
    if (remotePayload) {
      mergeStats = mergeAnkiRevlogs(remotePayload);
    }

    const unifiedPayload = {
      ...generateSyncPayload(),
      revlog: fsrsRevlogStore,
      syncClient: 'web',
      syncTimestamp: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(unifiedPayload);

    if (fileId) {
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: jsonStr
      });
    } else {
      const metadata = {
        name: GDRIVE_FILE_NAME,
        parents: ['appDataFolder']
      };
      const boundary = 'foo_bar_baz_quran';
      const multipartBody =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${jsonStr}\r\n` +
        `--${boundary}--`;

      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      });
    }

    const nowIso = new Date().toISOString();
    localStorage.setItem(GDRIVE_LAST_SYNC_KEY, nowIso);
    clearUnsyncedChanges();
    updateGdriveUi(true, false);

    const logCount = fsrsRevlogStore.length;
    const msg = `✓ Google Drive synced! (${logCount} revlog entries${mergeStats.newReviewsAdded > 0 ? `, +${mergeStats.newReviewsAdded} new` : ''})`;
    showSyncStatus(msg, 'success');
    if (!isSilent) showToastNotification(msg);

  } catch (err) {
    console.error('Google Drive sync error:', err);
    updateGdriveUi(true, false);
    updateTopSyncButtonUi(false, true);
    showSyncStatus('✕ Google Drive sync error', 'error');
    if (!isSilent) showToastNotification('✕ Google Drive sync failed. Check connection.');
  } finally {
    isGdriveSyncing = false;
  }
}

function scheduleGdriveAutoSync() {
  if (!getGdriveAccessToken()) {
    updateTopSyncButtonUi(false, false);
    return;
  }
  if (gdriveAutoSyncTimer) clearTimeout(gdriveAutoSyncTimer);
  gdriveAutoSyncTimer = setTimeout(() => {
    syncWithGoogleDrive(true);
  }, 10000);
}

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

// =========================================================
// VOICE RECORDER & PLAYBACK ENGINE (MEMORIZE MODE)
// =========================================================

let mediaRecorder = null;
let mediaStream = null;
let recordedAudioChunks = [];
let currentVoiceBlob = null;
let currentVoiceUrl = null;
let voicePlaybackAudio = new Audio();
let isVoiceRecording = false;
let isVoicePlaying = false;
let voiceTimerInterval = null;
let voiceRecordDuration = 0;
let voiceActiveSurah = 0;
let voiceActiveVerse = 0;
const recordedClipsStore = {}; // map `${surah}:${verse}` -> { blob, url, duration }

function getActiveMemorizeVerseNum() {
  if (ayahGradingOverlay && ayahGradingOverlay.classList.contains('show')) {
    if (surahData && surahData.verses[currentGradingVerseIndex]) {
      return surahData.verses[currentGradingVerseIndex].verseNumber;
    }
  }
  if (isMemorizeMode) {
    if (currentMemorizeAyah && currentMemorizeAyah > 0) {
      return currentMemorizeAyah;
    }
    if (revealedWordCount > 0 && totalWordElements[revealedWordCount - 1]) {
      const vNum = parseInt(totalWordElements[revealedWordCount - 1].getAttribute('data-verse-num'));
      if (!isNaN(vNum) && vNum > 0) return vNum;
    }
  }
  if (currentAudioIndex >= 0 && surahData && surahData.verses[currentAudioIndex]) {
    return surahData.verses[currentAudioIndex].verseNumber;
  }
  return 1;
}

function getVoiceCurrentDuration() {
  const clipKey = `${voiceActiveSurah}:${voiceActiveVerse}`;
  const clip = recordedClipsStore[clipKey];
  if (voicePlaybackAudio && isFinite(voicePlaybackAudio.duration) && !isNaN(voicePlaybackAudio.duration) && voicePlaybackAudio.duration > 0) {
    return voicePlaybackAudio.duration;
  }
  if (clip && isFinite(clip.duration) && clip.duration > 0) {
    return clip.duration;
  }
  if (voiceRecordDuration && isFinite(voiceRecordDuration) && voiceRecordDuration > 0) {
    return voiceRecordDuration;
  }
  return 0;
}

function formatVoiceTime(seconds) {
  if (!seconds || !isFinite(seconds) || isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

function getSupportedVoiceMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/wav'
  ];
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
  }
  return '';
}

let isAyahAudioOn = false;

function syncAyahAudioBar() {
  if (!voiceRecQariRow || voiceRecQariRow.style.display === 'none') return;
  const cur = (audioPlayer && audioPlayer.currentTime) || 0;
  const dur = (audioPlayer && audioPlayer.duration) || 0;
  if (dur && !isNaN(dur)) {
    const pct = Math.min(100, (cur / dur) * 100);
    if (voiceRecQariProgress) voiceRecQariProgress.style.width = `${pct}%`;
    if (voiceQariTimeDisplay) voiceQariTimeDisplay.textContent = `${formatVoiceTime(cur)} / ${formatVoiceTime(dur)}`;
  } else {
    if (voiceRecQariProgress) voiceRecQariProgress.style.width = '0%';
    if (voiceQariTimeDisplay) voiceQariTimeDisplay.textContent = `${formatVoiceTime(cur)} / --:--`;
  }
}

function setAyahAudioInHud(enable, autoStartPlay = true) {
  isAyahAudioOn = enable;
  if (isAyahAudioOn) {
    if (voiceRecQariRow) voiceRecQariRow.style.display = 'flex';
    if (voiceRecUserHeader) voiceRecUserHeader.style.display = 'flex';
    if (btnVoiceCompareQari) {
      btnVoiceCompareQari.classList.add('active');
      if (voiceQariBtnText) voiceQariBtnText.textContent = 'Ayah Audio: ON';
    }
    if (voiceRecQariLabel) {
      voiceRecQariLabel.textContent = `Ayah ${voiceActiveVerse} (${getReciterDisplayName()})`;
    }
    if (autoStartPlay) {
      if (isVoicePlaying) stopVoicePlayback();
      const verseIdx = Math.max(0, voiceActiveVerse - 1);
      if (!audioPlayer.src || currentAudioIndex !== verseIdx) {
        playAyah(verseIdx);
      } else if (audioPlayer.paused) {
        safePlay(audioPlayer);
      }
    }
    syncAyahAudioBar();
  } else {
    if (voiceRecQariRow) voiceRecQariRow.style.display = 'none';
    if (voiceRecUserHeader) voiceRecUserHeader.style.display = 'none';
    if (btnVoiceCompareQari) {
      btnVoiceCompareQari.classList.remove('active', 'playing');
      if (voiceQariBtnText) voiceQariBtnText.textContent = 'Ayah Audio';
    }
    if (btnVoiceQariPlayMini) {
      btnVoiceQariPlayMini.textContent = '▶';
      btnVoiceQariPlayMini.title = 'Play Ayah Audio';
    }
    if (audioPlayer && !audioPlayer.paused) {
      audioPlayer.pause();
      updatePlayPauseButton(false);
    }
  }
}

function toggleAyahAudioInHud() {
  setAyahAudioInHud(!isAyahAudioOn, true);
}

function updateVoiceRecorderAyah(verseNum) {
  voiceActiveSurah = currentSurahNumber || 1;
  voiceActiveVerse = verseNum || getActiveMemorizeVerseNum();

  if (voiceRecVerseBadge) {
    voiceRecVerseBadge.textContent = `Surah ${voiceActiveSurah}:${voiceActiveVerse}`;
  }
  if (voiceRecQariLabel) {
    voiceRecQariLabel.textContent = `Ayah ${voiceActiveVerse} (${getReciterDisplayName()})`;
  }

  // Check if clip exists for this verse
  const clipKey = `${voiceActiveSurah}:${voiceActiveVerse}`;
  const clip = recordedClipsStore[clipKey];

  if (clip) {
    currentVoiceBlob = clip.blob;
    currentVoiceUrl = clip.url;
    voicePlaybackAudio.src = currentVoiceUrl;
    if (btnVoiceTogglePlay) btnVoiceTogglePlay.disabled = false;
    if (btnVoiceUserPlayMini) btnVoiceUserPlayMini.disabled = false;
    if (btnVoiceDiscard) btnVoiceDiscard.disabled = false;
    if (btnVoicePlayBoth) btnVoicePlayBoth.disabled = false;
    if (voiceRecStatus) voiceRecStatus.textContent = `Recitation ready`;
    const durStr = formatVoiceTime(clip.duration || 0);
    if (voiceRecTimer) voiceRecTimer.textContent = durStr;
    if (voiceUserTimeDisplay) voiceUserTimeDisplay.textContent = durStr;
    if (memVoiceRecBtn) memVoiceRecBtn.classList.add('has-voice');
  } else {
    if (!isVoiceRecording && !isVoicePlaying) {
      currentVoiceBlob = null;
      currentVoiceUrl = null;
      voicePlaybackAudio.removeAttribute('src');
      if (btnVoiceTogglePlay) {
        btnVoiceTogglePlay.disabled = true;
        btnVoiceTogglePlay.classList.remove('playing');
      }
      if (btnVoiceUserPlayMini) {
        btnVoiceUserPlayMini.disabled = true;
        btnVoiceUserPlayMini.textContent = '▶';
      }
      if (btnVoicePlayBoth) {
        btnVoicePlayBoth.disabled = true;
        btnVoicePlayBoth.classList.remove('playing');
      }
      if (btnVoiceDiscard) btnVoiceDiscard.disabled = true;
      if (voiceRecStatus) voiceRecStatus.textContent = 'Voice Recitation';
      if (voiceRecTimer) voiceRecTimer.textContent = '00:00';
      if (voiceUserTimeDisplay) voiceUserTimeDisplay.textContent = '00:00';
      if (voiceRecProgress) voiceRecProgress.style.width = '0%';
      if (memVoiceRecBtn) memVoiceRecBtn.classList.remove('has-voice');
    }
  }
  syncAyahAudioBar();
  updatePlayBothUi();
}

function openVoiceRecorder(verseNum) {
  if (!isMemorizeMode && (!ayahGradingOverlay || !ayahGradingOverlay.classList.contains('show'))) {
    toggleMemorizeMode();
  }
  updateVoiceRecorderAyah(verseNum);
  if (voiceRecorderHud) {
    voiceRecorderHud.style.display = 'block';
  }
  // If Ayah audio is currently playing or previously set to ON, display two audio bars
  if (audioPlayer && !audioPlayer.paused) {
    setAyahAudioInHud(true, false);
  } else if (isAyahAudioOn) {
    setAyahAudioInHud(true, false);
  } else {
    setAyahAudioInHud(false, false);
  }
}

function closeVoiceRecorder() {
  if (isVoiceRecording) {
    stopVoiceRecording();
  }
  if (isVoicePlaying) {
    stopVoicePlayback();
  }
  if (voiceRecorderHud) {
    voiceRecorderHud.style.display = 'none';
  }
}

function toggleVoiceRecorder(verseNum) {
  if (voiceRecorderHud && voiceRecorderHud.style.display !== 'none') {
    closeVoiceRecorder();
  } else {
    openVoiceRecorder(verseNum);
  }
}

async function startVoiceRecording() {
  if (isVoiceRecording) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Audio recording is not supported in this browser. Please use Chrome, Safari, or Edge.');
    return;
  }

  if (isVoicePlaying) {
    stopVoicePlayback();
  }
  // If Ayah audio is NOT on, ensure audioPlayer is stopped.
  // If Ayah audio is ON, user can recite along or pause via the mini button.
  if (!isAyahAudioOn && audioPlayer && !audioPlayer.paused) {
    audioPlayer.pause();
    updatePlayPauseButton(false);
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedVoiceMimeType();
    const options = mimeType ? { mimeType } : undefined;

    recordedAudioChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream, options);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedAudioChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const finalMime = mimeType || 'audio/webm';
      currentVoiceBlob = new Blob(recordedAudioChunks, { type: finalMime });
      if (currentVoiceUrl) URL.revokeObjectURL(currentVoiceUrl);
      currentVoiceUrl = URL.createObjectURL(currentVoiceBlob);

      voicePlaybackAudio.src = currentVoiceUrl;

      // Save clip for active Ayah
      const clipKey = `${voiceActiveSurah}:${voiceActiveVerse}`;
      recordedClipsStore[clipKey] = {
        blob: currentVoiceBlob,
        url: currentVoiceUrl,
        duration: voiceRecordDuration
      };

      if (btnVoiceTogglePlay) btnVoiceTogglePlay.disabled = false;
      if (btnVoiceUserPlayMini) btnVoiceUserPlayMini.disabled = false;
      if (btnVoicePlayBoth) btnVoicePlayBoth.disabled = false;
      if (btnVoiceDiscard) btnVoiceDiscard.disabled = false;
      if (memVoiceRecBtn) memVoiceRecBtn.classList.add('has-voice');

      if (voiceRecStatus) voiceRecStatus.textContent = `Recorded • Ready to play`;
      if (voiceUserTimeDisplay) voiceUserTimeDisplay.textContent = formatVoiceTime(voiceRecordDuration);
      showToastNotification(`🎙️ Recitation recorded for Ayah ${voiceActiveVerse}! Tap Play to listen.`);
      updatePlayBothUi();

      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
        mediaStream = null;
      }
    };

    mediaRecorder.start(200);
    isVoiceRecording = true;
    voiceRecordDuration = 0;

    if (voiceRecDot) voiceRecDot.className = 'voice-rec-dot recording';
    if (btnVoiceToggleRecord) {
      btnVoiceToggleRecord.classList.add('recording');
      if (voiceRecIcon) voiceRecIcon.textContent = '⏹';
      if (voiceRecBtnText) voiceRecBtnText.textContent = 'Stop';
    }
    if (memVoiceRecBtn) memVoiceRecBtn.classList.add('recording');
    if (btnGradingVoiceRec) btnGradingVoiceRec.classList.add('recording');
    if (voiceRecStatus) voiceRecStatus.textContent = 'Recording recitation...';
    if (voiceRecTimer) voiceRecTimer.textContent = '00:00';
    if (voiceRecProgress) voiceRecProgress.style.width = '0%';
    if (btnVoiceTogglePlay) btnVoiceTogglePlay.disabled = true;
    if (btnVoiceUserPlayMini) btnVoiceUserPlayMini.disabled = true;
    if (btnVoicePlayBoth) btnVoicePlayBoth.disabled = true;
    if (btnVoiceDiscard) btnVoiceDiscard.disabled = true;

    recordingStartTime = Date.now();
    clearInterval(voiceTimerInterval);
    voiceTimerInterval = setInterval(() => {
      voiceRecordDuration = (Date.now() - recordingStartTime) / 1000;
      if (voiceRecTimer) {
        voiceRecTimer.textContent = formatVoiceTime(voiceRecordDuration);
      }
      if (voiceUserTimeDisplay) {
        voiceUserTimeDisplay.textContent = formatVoiceTime(voiceRecordDuration);
      }
    }, 250);

  } catch (err) {
    console.error('Failed to access microphone:', err);
    alert('Microphone access was denied or is not available. Please allow microphone permission in your browser to record recitation.');
  }
}

function stopVoiceRecording() {
  if (!isVoiceRecording) return;
  isVoiceRecording = false;
  clearInterval(voiceTimerInterval);

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }

  if (voiceRecDot) voiceRecDot.className = 'voice-rec-dot';
  if (btnVoiceToggleRecord) {
    btnVoiceToggleRecord.classList.remove('recording');
    if (voiceRecIcon) voiceRecIcon.textContent = '🎙️';
    if (voiceRecBtnText) voiceRecBtnText.textContent = 'Record';
  }
  if (memVoiceRecBtn) memVoiceRecBtn.classList.remove('recording');
  if (btnGradingVoiceRec) btnGradingVoiceRec.classList.remove('recording');
}

function toggleVoiceRecording() {
  if (isVoiceRecording) {
    stopVoiceRecording();
  } else {
    startVoiceRecording();
  }
}

function updatePlayBothUi() {
  if (!btnVoicePlayBoth) return;
  const hasRecording = !!currentVoiceUrl;
  btnVoicePlayBoth.disabled = !hasRecording;
  const isReciterPlaying = audioPlayer && !audioPlayer.paused;
  const isBothPlaying = isVoicePlaying && isReciterPlaying;
  if (isBothPlaying) {
    btnVoicePlayBoth.classList.add('playing');
    if (voicePlayBothIcon) voicePlayBothIcon.textContent = '❚❚';
    if (voicePlayBothText) voicePlayBothText.textContent = 'Pause Both';
  } else {
    btnVoicePlayBoth.classList.remove('playing');
    if (voicePlayBothIcon) voicePlayBothIcon.textContent = '▶▶';
    if (voicePlayBothText) voicePlayBothText.textContent = 'Play Both';
  }
}

function startVoicePlayback() {
  if (!currentVoiceUrl) return;

  voicePlaybackAudio.src = currentVoiceUrl;
  voicePlaybackAudio.play().then(() => {
    isVoicePlaying = true;
    if (voiceRecDot) voiceRecDot.className = 'voice-rec-dot playing';
    if (btnVoiceTogglePlay) {
      btnVoiceTogglePlay.classList.add('playing');
      if (voicePlayIcon) voicePlayIcon.textContent = '⏸';
      if (voicePlayBtnText) voicePlayBtnText.textContent = 'Pause';
    }
    if (btnVoiceUserPlayMini) {
      btnVoiceUserPlayMini.textContent = '❚❚';
    }
    if (voiceRecStatus) voiceRecStatus.textContent = 'Playing your recitation...';
    updatePlayBothUi();
  }).catch(err => {
    console.warn('Voice playback failed:', err);
  });
}

function stopVoicePlayback() {
  if (!isVoicePlaying) return;
  voicePlaybackAudio.pause();
  isVoicePlaying = false;
  if (voiceRecDot) voiceRecDot.className = 'voice-rec-dot';
  if (btnVoiceTogglePlay) {
    btnVoiceTogglePlay.classList.remove('playing');
    if (voicePlayIcon) voicePlayIcon.textContent = '▶';
    if (voicePlayBtnText) voicePlayBtnText.textContent = 'Play Voice';
  }
  if (btnVoiceUserPlayMini) {
    btnVoiceUserPlayMini.textContent = '▶';
  }
  if (voiceRecStatus) voiceRecStatus.textContent = 'Paused';
  const cur = voicePlaybackAudio.currentTime || 0;
  const dur = getVoiceCurrentDuration();
  if (dur > 0) {
    const timeStr = `${formatVoiceTime(cur)} / ${formatVoiceTime(dur)}`;
    if (voiceRecTimer) voiceRecTimer.textContent = timeStr;
    if (voiceUserTimeDisplay) voiceUserTimeDisplay.textContent = timeStr;
  }
  updatePlayBothUi();
}

function toggleVoicePlayback() {
  if (isVoicePlaying) {
    stopVoicePlayback();
  } else {
    startVoicePlayback();
  }
}

function togglePlayBoth() {
  if (!currentVoiceUrl) return;
  const isReciterPlaying = audioPlayer && !audioPlayer.paused;
  const isBothPlaying = isVoicePlaying && isReciterPlaying;

  if (isBothPlaying) {
    stopVoicePlayback();
    if (audioPlayer && !audioPlayer.paused) {
      audioPlayer.pause();
    }
  } else {
    if (!isVoicePlaying) {
      startVoicePlayback();
    }
    if (!isAyahAudioOn) {
      setAyahAudioInHud(true, false);
    }
    const verseIdx = Math.max(0, voiceActiveVerse - 1);
    if (!audioPlayer.src || currentAudioIndex !== verseIdx) {
      playAyah(verseIdx);
    } else if (audioPlayer.paused) {
      safePlay(audioPlayer);
    }
  }
  updatePlayBothUi();
}

function discardVoiceRecording() {
  if (isVoiceRecording) stopVoiceRecording();
  if (isVoicePlaying) stopVoicePlayback();

  const clipKey = `${voiceActiveSurah}:${voiceActiveVerse}`;
  if (currentVoiceUrl) URL.revokeObjectURL(currentVoiceUrl);
  delete recordedClipsStore[clipKey];

  currentVoiceBlob = null;
  currentVoiceUrl = null;
  voicePlaybackAudio.removeAttribute('src');

  if (btnVoiceTogglePlay) {
    btnVoiceTogglePlay.disabled = true;
    btnVoiceTogglePlay.classList.remove('playing');
    if (voicePlayIcon) voicePlayIcon.textContent = '▶';
    if (voicePlayBtnText) voicePlayBtnText.textContent = 'Play Voice';
  }
  if (btnVoiceUserPlayMini) {
    btnVoiceUserPlayMini.disabled = true;
    btnVoiceUserPlayMini.textContent = '▶';
  }
  if (btnVoicePlayBoth) {
    btnVoicePlayBoth.disabled = true;
    btnVoicePlayBoth.classList.remove('playing');
  }
  if (btnVoiceDiscard) btnVoiceDiscard.disabled = true;
  if (memVoiceRecBtn) memVoiceRecBtn.classList.remove('has-voice');
  if (voiceRecTimer) voiceRecTimer.textContent = '00:00';
  if (voiceUserTimeDisplay) voiceUserTimeDisplay.textContent = '00:00';
  if (voiceRecProgress) voiceRecProgress.style.width = '0%';
  if (voiceRecStatus) voiceRecStatus.textContent = 'Voice Recitation';

  updatePlayBothUi();
  showToastNotification('Recording cleared');
}

// Hook playback audio events
voicePlaybackAudio.ontimeupdate = () => {
  const cur = voicePlaybackAudio.currentTime || 0;
  const dur = getVoiceCurrentDuration();
  if (dur > 0) {
    const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
    if (voiceRecProgress) voiceRecProgress.style.width = `${pct}%`;
    const timeStr = `${formatVoiceTime(cur)} / ${formatVoiceTime(dur)}`;
    if (voiceRecTimer) voiceRecTimer.textContent = timeStr;
    if (voiceUserTimeDisplay) voiceUserTimeDisplay.textContent = timeStr;
  } else {
    if (voiceRecProgress) voiceRecProgress.style.width = '0%';
    const timeStr = formatVoiceTime(cur);
    if (voiceRecTimer) voiceRecTimer.textContent = timeStr;
    if (voiceUserTimeDisplay) voiceUserTimeDisplay.textContent = timeStr;
  }
};

voicePlaybackAudio.onended = () => {
  isVoicePlaying = false;
  if (voiceRecDot) voiceRecDot.className = 'voice-rec-dot';
  if (btnVoiceTogglePlay) {
    btnVoiceTogglePlay.classList.remove('playing');
    if (voicePlayIcon) voicePlayIcon.textContent = '▶';
    if (voicePlayBtnText) voicePlayBtnText.textContent = 'Play Voice';
  }
  if (btnVoiceUserPlayMini) {
    btnVoiceUserPlayMini.textContent = '▶';
  }
  if (voiceRecProgress) voiceRecProgress.style.width = '0%';
  if (voiceRecStatus) voiceRecStatus.textContent = 'Recitation ready';
  const dur = getVoiceCurrentDuration();
  if (voiceUserTimeDisplay) {
    voiceUserTimeDisplay.textContent = formatVoiceTime(dur);
  }
  if (voiceRecTimer) {
    voiceRecTimer.textContent = formatVoiceTime(dur);
  }
  updatePlayBothUi();
};

// Seek user recording track click
if (voiceRecPlaybackTrack) {
  voiceRecPlaybackTrack.addEventListener('click', (e) => {
    const dur = getVoiceCurrentDuration();
    if (!voicePlaybackAudio || !dur || dur <= 0) return;
    const rect = voiceRecPlaybackTrack.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    voicePlaybackAudio.currentTime = ratio * dur;
    const pct = ratio * 100;
    if (voiceRecProgress) voiceRecProgress.style.width = `${pct}%`;
  });
}

// Seek Ayah audio (Qari) track click
if (voiceRecQariTrack) {
  voiceRecQariTrack.addEventListener('click', (e) => {
    if (!audioPlayer || !audioPlayer.duration || isNaN(audioPlayer.duration)) return;
    const rect = voiceRecQariTrack.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioPlayer.currentTime = ratio * audioPlayer.duration;
    syncAyahAudioBar();
  });
}

// Mini Play Button for Ayah Audio
if (btnVoiceQariPlayMini) {
  btnVoiceQariPlayMini.addEventListener('click', () => {
    if (!audioPlayer) return;
    if (audioPlayer.paused) {
      const verseIdx = Math.max(0, voiceActiveVerse - 1);
      if (!audioPlayer.src || currentAudioIndex !== verseIdx) {
        playAyah(verseIdx);
      } else {
        safePlay(audioPlayer);
      }
    } else {
      audioPlayer.pause();
    }
  });
}

// Close Ayah Audio Row
if (btnCloseAyahAudioBar) {
  btnCloseAyahAudioBar.addEventListener('click', () => setAyahAudioInHud(false));
}

// Mini Play Button for My Voice
if (btnVoiceUserPlayMini) {
  btnVoiceUserPlayMini.addEventListener('click', toggleVoicePlayback);
}

// Sync audioPlayer events with Ayah Audio bar in HUD
audioPlayer.addEventListener('timeupdate', syncAyahAudioBar);
audioPlayer.addEventListener('loadedmetadata', syncAyahAudioBar);
audioPlayer.addEventListener('play', () => {
  if (btnVoiceQariPlayMini) {
    btnVoiceQariPlayMini.textContent = '❚❚';
    btnVoiceQariPlayMini.title = 'Pause Ayah Audio';
  }
  if (btnVoiceCompareQari) btnVoiceCompareQari.classList.add('playing');
  updatePlayBothUi();
});
audioPlayer.addEventListener('pause', () => {
  if (btnVoiceQariPlayMini) {
    btnVoiceQariPlayMini.textContent = '▶';
    btnVoiceQariPlayMini.title = 'Play Ayah Audio';
  }
  if (btnVoiceCompareQari) btnVoiceCompareQari.classList.remove('playing');
  updatePlayBothUi();
});
audioPlayer.addEventListener('ended', () => {
  if (btnVoiceQariPlayMini) {
    btnVoiceQariPlayMini.textContent = '▶';
    btnVoiceQariPlayMini.title = 'Play Ayah Audio';
  }
  if (btnVoiceCompareQari) btnVoiceCompareQari.classList.remove('playing');
  updatePlayBothUi();
});

// Reciter Volume Control
if (reciterVolSlider) {
  reciterVolSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (audioPlayer) audioPlayer.volume = val;
    if (reciterVolVal) reciterVolVal.textContent = `${Math.round(val * 100)}%`;
  });
  if (audioPlayer) audioPlayer.volume = parseFloat(reciterVolSlider.value) || 0.8;
}

// Recorded Voice Volume Control
if (voiceVolSlider) {
  voiceVolSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (voicePlaybackAudio) voicePlaybackAudio.volume = val;
    if (voiceVolVal) voiceVolVal.textContent = `${Math.round(val * 100)}%`;
  });
  if (voicePlaybackAudio) voicePlaybackAudio.volume = parseFloat(voiceVolSlider.value) || 1.0;
}

// Wire buttons
if (memVoiceRecBtn) memVoiceRecBtn.addEventListener('click', () => toggleVoiceRecorder());
if (btnGradingVoiceRec) btnGradingVoiceRec.addEventListener('click', () => {
  const vNum = surahData && surahData.verses[currentGradingVerseIndex] ? surahData.verses[currentGradingVerseIndex].verseNumber : 1;
  toggleVoiceRecorder(vNum);
});
if (closeVoiceRecorderBtn) closeVoiceRecorderBtn.addEventListener('click', closeVoiceRecorder);
if (btnVoiceToggleRecord) btnVoiceToggleRecord.addEventListener('click', toggleVoiceRecording);
if (btnVoiceTogglePlay) btnVoiceTogglePlay.addEventListener('click', toggleVoicePlayback);
if (btnVoicePlayBoth) btnVoicePlayBoth.addEventListener('click', togglePlayBoth);
if (btnVoiceCompareQari) btnVoiceCompareQari.addEventListener('click', toggleAyahAudioInHud);
if (btnVoiceDiscard) btnVoiceDiscard.addEventListener('click', discardVoiceRecording);

// Boot: minimize audio bar everywhere by default
if (audioBarWrapper) {
  minimizeAudioBar();
}

// Sync reciter UI on boot
document.querySelectorAll('#submenuReciter .submenu-option').forEach(opt => {
  opt.classList.toggle('active', opt.getAttribute('data-reciter') === selectedReciter);
});
const initReciterSelect = document.getElementById('settingsReciterSelect');
if (initReciterSelect) {
  initReciterSelect.value = selectedReciter;
}

initCustomTexts();
initChapters();
initMistakeHistory();
initAyahNotes();
bootstrapRevlogFromExistingCards();
initGdriveSync();
checkUrlHashSync();
showLibraryView();
loadSurah(76).then(() => {
  updateFsrsBadgeAndNotifications(false);
  updateOfflineStorageStatus();
  if (isLibraryView) {
    showLibraryView();
  }
});



