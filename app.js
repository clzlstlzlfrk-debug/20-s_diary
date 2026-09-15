/**
 * 몽글몽글 웹 다이어리 - Main JS Engine (Slim Layout & Custom Profile Trigger)
 */

(function () {
  // ==========================================================================
  // 상태 (State) 관리
  // ==========================================================================
  let currentDate = new Date();
  let selectedDateStr = formatDate(new Date());
  let diaryData = {};
  let activeImageObj = null;
  let draggedInlineImage = null;
  let isEditingEntry = false;
  let hasUnsavedChanges = false;

  // 로컬 diary_data.json 파일 자동 저장 연결 상태
  let fileHandle = null;
  let fileConnected = false;

  const MOOD_LABEL_MAP = {
    '😆': '즐거움',
    '😄': '기쁨',
    '😐': '보통',
    '😢': '슬픔',
    '😠': '짜증'
  };

  // 감정 통계에서 사용하는 감정 순서 & 그래프 색상
  const MOOD_ORDER = ['😆', '😄', '😐', '😢', '😠'];
  const MOOD_COLOR_MAP = {
    '😆': '#FDE68A',
    '😄': '#FED7AA',
    '😐': '#E5E7EB',
    '😢': '#BFDBFE',
    '😠': '#FCA5A5'
  };

  let profileSettings = JSON.parse(localStorage.getItem('diary_profile_settings') || JSON.stringify({
    diaryName: '몽글몽글 다이어리',
    iconType: 'emoji',
    iconValue: '🌸',
    cursorUrl: '',
    subtitle: '오늘 하루도 고생 많았어요, 나만의 속도로 쉬어가요.',
    faviconUrl: ''
  }));


  let repoConfig = {
    token: localStorage.getItem('diary_repo_token') || '',
    owner: localStorage.getItem('diary_repo_owner') || '',
    repo: localStorage.getItem('diary_repo_name') || '',
    branch: localStorage.getItem('diary_repo_branch') || 'main',
    path: localStorage.getItem('diary_repo_path') || 'diary_data.json',
    sha: ''  // 현재 파일의 SHA (업데이트 시 필요)
  };

  // ==========================================================================
  // DOM 요소 참조
  // ==========================================================================
  const calendarTitle = document.getElementById('calendarTitle');
  const calendarGrid = document.getElementById('calendarGrid');
  const btnPrevMonth = document.getElementById('btnPrevMonth');
  const btnNextMonth = document.getElementById('btnNextMonth');
  const btnToday = document.getElementById('btnToday');

  // 감정 통계 (주간/월간)
  const weekMoodSummary = document.getElementById('weekMoodSummary');
  const weekMoodChart = document.getElementById('weekMoodChart');
  const btnToggleMonthMood = document.getElementById('btnToggleMonthMood');
  const monthMoodPanel = document.getElementById('monthMoodPanel');
  const monthMoodSummary = document.getElementById('monthMoodSummary');
  const monthMoodChart = document.getElementById('monthMoodChart');

  const selectedDateText = document.getElementById('selectedDateText');
  const diaryTitleInput = document.getElementById('diaryTitleInput');
  const diaryContentEditor = document.getElementById('diaryContentEditor');
  const paperBodyWrapper = document.getElementById('paperBodyWrapper');
  const freeCanvas = document.getElementById('freeCanvas');
  const saveStatusIndicator = document.getElementById('saveStatusIndicator');
  const btnSaveDiary = document.getElementById('btnSaveDiary');
  const btnEditToggle = document.getElementById('btnEditToggle');
  const btnDeleteDiary = document.getElementById('btnDeleteDiary');
  const editorCard = document.querySelector('.editor-card');

  const weatherOptions = document.getElementById('weatherOptions');
  const moodOptions = document.getElementById('moodOptions');
  const imageFileInput = document.getElementById('imageFileInput');
  const btnClearDiary = document.getElementById('btnClearDiary');

  const chkToggleTasks = document.getElementById('chkToggleTasks');
  const chkTogglePraise = document.getElementById('chkTogglePraise');
  const tasksCard = document.getElementById('tasksCard');
  const praiseCard = document.getElementById('praiseCard');
  const bodyTasksCard = document.getElementById('bodyTasksCard');
  const bodyPraiseCard = document.getElementById('bodyPraiseCard');
  const btnFoldTasks = document.getElementById('btnFoldTasks');
  const btnFoldPraise = document.getElementById('btnFoldPraise');

  const taskInput1 = document.getElementById('taskInput1');
  const taskInput2 = document.getElementById('taskInput2');
  const taskInput3 = document.getElementById('taskInput3');

  const praiseInput1 = document.getElementById('praiseInput1');
  const praiseInput2 = document.getElementById('praiseInput2');
  const praiseInput3 = document.getElementById('praiseInput3');

  const brandIconDisplay = document.getElementById('brandIconDisplay');
  const diaryNameText = document.getElementById('diaryNameText');
  const diarySubtitleText = document.getElementById('diarySubtitleText');

  const profileSettingsModal = document.getElementById('profileSettingsModal');
  const settingDiaryName = document.getElementById('settingDiaryName');
  const settingProfileImageInput = document.getElementById('settingProfileImageInput');
  const settingFaviconInput = document.getElementById('settingFaviconInput');
  const faviconPreviewRow = document.getElementById('faviconPreviewRow');
  const faviconPreviewImg = document.getElementById('faviconPreviewImg');
  const btnRemoveFavicon = document.getElementById('btnRemoveFavicon');
  const faviconLink = document.getElementById('faviconLink');
  const settingCursorUrl = document.getElementById('settingCursorUrl');
  const settingSubtitle = document.getElementById('settingSubtitle');
  const btnSaveProfileSettings = document.getElementById('btnSaveProfileSettings');
  const profileEmojiSelector = document.getElementById('profileEmojiSelector');
  const customCursorStyle = document.getElementById('customCursorStyle');

  const imageControlPopup = document.getElementById('imageControlPopup');
  const btnModeInline = document.getElementById('btnModeInline');
  const btnModeFree = document.getElementById('btnModeFree');
  const btnToggleClip = document.getElementById('btnToggleClip');
  const btnRotateLeft = document.getElementById('btnRotateLeft');
  const btnRotateRight = document.getElementById('btnRotateRight');
  const btnTogglePolaroid = document.getElementById('btnTogglePolaroid');
  const btnDeleteImage = document.getElementById('btnDeleteImage');

  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const fileImport = document.getElementById('fileImport');
  const btnConnectFile = document.getElementById('btnConnectFile');
  const fileConnStatusEl = document.getElementById('fileConnStatus');

  // 햄버거 메뉴
  const btnHamburger = document.getElementById('btnHamburger');
  const hamburgerDropdown = document.getElementById('hamburgerDropdown');
  const hamburgerMenuWrap = document.getElementById('hamburgerMenuWrap');



  // GitHub 일반 저장소 동기화 모달
  const repoModal = document.getElementById('repoModal');
  const repoTokenInput = document.getElementById('repoTokenInput');
  const repoOwnerInput = document.getElementById('repoOwnerInput');
  const repoNameInput = document.getElementById('repoNameInput');
  const repoBranchInput = document.getElementById('repoBranchInput');
  const repoPathInput = document.getElementById('repoPathInput');
  const btnSaveRepoConfig = document.getElementById('btnSaveRepoConfig');
  const btnManualRepoPull = document.getElementById('btnManualRepoPull');
  const repoStatusMessage = document.getElementById('repoStatusMessage');
  const btnRepoSync = document.getElementById('btnRepoSync');

  // ==========================================================================
  // 초기화 (Initialization)
  // ==========================================================================
  async function init() {
    setupEventListeners();
    initCalendarTooltip();
    window.addEventListener('scroll', hideCalendarTooltip, { passive: true });
    window.addEventListener('resize', hideCalendarTooltip, { passive: true });
    window.addEventListener('blur', hideCalendarTooltip);
    await tryAutoReconnectFile();
    await loadDiaryData();
    applyProfileSettings();
    renderCalendar();
    loadEntryForDate(selectedDateStr);
    updateFileConnStatusUI();
  }

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getKoreanFullDateStr(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[dateObj.getDay()];
    return `${y}년 ${String(m).padStart(2, '0')}월 ${String(d).padStart(2, '0')}일 (${dayName})`;
  }

  // ==========================================================================
  // 프로필 & 마우스 커서 적용 로직
  // ==========================================================================
  function applyProfileSettings() {
    diaryNameText.textContent = profileSettings.diaryName || '몽글몽글 다이어리';
    diarySubtitleText.textContent = profileSettings.subtitle || '오늘 하루도 고생 많았어요, 나만의 속도로 쉬어가요.';
    document.title = `${profileSettings.diaryName || '몽글몽글 다이어리'} 🌸`;

    if (profileSettings.iconType === 'image' && profileSettings.iconValue) {
      brandIconDisplay.innerHTML = `<img src="${profileSettings.iconValue}" alt="프로필">`;
      brandIconDisplay.classList.add('has-profile-image');
    } else {
      brandIconDisplay.textContent = profileSettings.iconValue || '🌸';
      brandIconDisplay.classList.remove('has-profile-image');
    }

    if (profileSettings.cursorUrl) {
      customCursorStyle.innerHTML = `
        * { cursor: url('${profileSettings.cursorUrl}'), auto !important; }
        button, a, input, select { cursor: url('${profileSettings.cursorUrl}'), pointer !important; }
      `;
    } else {
      customCursorStyle.innerHTML = '';
    }

    if (faviconLink) {
      faviconLink.href = profileSettings.faviconUrl || 'data:,';
    }
  }

  // 프로필 설정 모달 안의 파비콘 미리보기 영역을 현재 profileSettings.faviconUrl 기준으로 갱신
  function updateFaviconPreviewUI() {
    if (!faviconPreviewRow) return;
    if (profileSettings.faviconUrl) {
      faviconPreviewImg.src = profileSettings.faviconUrl;
      faviconPreviewRow.classList.remove('hidden');
    } else {
      faviconPreviewImg.src = '';
      faviconPreviewRow.classList.add('hidden');
    }
  }

  // ==========================================================================
  // 캘린더 호버 말풍선 툴팁 (1초 호버 시 일기 제목 표시)
  // ==========================================================================
  let calTooltipEl = null;
  let calHoverTimer = null;

  function initCalendarTooltip() {
    if (calTooltipEl) return;
    const calendarCard = document.querySelector('.calendar-card');
    if (!calendarCard) return;

    calTooltipEl = document.createElement('div');
    calTooltipEl.id = 'calendarDayTooltip';
    calTooltipEl.className = 'cal-day-tooltip hidden';
    calTooltipEl.innerHTML = `
      <div class="tooltip-content" id="calTooltipContent"></div>
      <div class="tooltip-tail" id="calTooltipTail"></div>
    `;
    calendarCard.appendChild(calTooltipEl);
  }

  function hideCalendarTooltip() {
    if (calHoverTimer) {
      clearTimeout(calHoverTimer);
      calHoverTimer = null;
    }
    if (calTooltipEl) {
      calTooltipEl.classList.remove('visible');
      calTooltipEl.classList.add('hidden');
    }
  }

  function showCalendarTooltip(cell, dateStr) {
    const entry = diaryData[dateStr];
    if (!entry) return;
    const hasAnyContent = (entry.title && entry.title.trim()) ||
                          (entry.content && entry.content.trim()) ||
                          (entry.freeImages && entry.freeImages.length > 0);
    if (!hasAnyContent) return;

    const titleText = (entry.title && entry.title.trim()) ? entry.title.trim() : '(제목 없음)';
    const calendarCard = document.querySelector('.calendar-card');
    if (!calendarCard) return;

    if (!calTooltipEl) {
      initCalendarTooltip();
    }
    if (!calTooltipEl) return;

    const contentEl = document.getElementById('calTooltipContent');
    const tailEl = document.getElementById('calTooltipTail');
    if (!contentEl || !tailEl) return;

    contentEl.innerHTML = '';
    if (entry.mood) {
      const emojiOnly = (entry.mood.match(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/u) || [entry.mood])[0];
      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'cal-tip-emoji';
      emojiSpan.textContent = emojiOnly;
      contentEl.appendChild(emojiSpan);
    }
    const titleSpan = document.createElement('span');
    titleSpan.className = 'cal-tip-title';
    titleSpan.textContent = titleText;
    contentEl.appendChild(titleSpan);

    // 크기 측정을 위해 일시 표시
    calTooltipEl.classList.remove('hidden');
    calTooltipEl.classList.remove('visible');
    calTooltipEl.style.left = '0px';
    calTooltipEl.style.top = '0px';

    const cardRect = calendarCard.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    const tipWidth = calTooltipEl.offsetWidth;
    const tipHeight = calTooltipEl.offsetHeight;

    // 날짜 칸 가로 중앙 정렬
    const cellCenterX = (cellRect.left + cellRect.width / 2) - cardRect.left;
    const cellTop = cellRect.top - cardRect.top;

    let targetLeft = cellCenterX - (tipWidth / 2);
    const padding = 8;
    const minLeft = padding;
    const maxLeft = Math.max(minLeft, cardRect.width - tipWidth - padding);
    const clampedLeft = Math.max(minLeft, Math.min(maxLeft, targetLeft));

    // 말풍선 꼬리가 날짜 칸 중앙을 가리키도록 설정
    const arrowX = cellCenterX - clampedLeft;
    const clampedArrowX = Math.max(12, Math.min(tipWidth - 12, arrowX));
    tailEl.style.left = `${clampedArrowX}px`;

    // 날짜 칸 상단에 배치
    const targetTop = cellTop - tipHeight - 7;
    calTooltipEl.style.left = `${clampedLeft}px`;
    calTooltipEl.style.top = `${Math.max(6, targetTop)}px`;

    requestAnimationFrame(() => {
      calTooltipEl.classList.add('visible');
    });
  }

  // ==========================================================================
  // 캘린더 렌더링
  // ==========================================================================
  function renderCalendar() {
    hideCalendarTooltip();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    calendarTitle.textContent = `${year}년 ${month + 1}월`;
    calendarGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    // 6주(6행) 구성 여부 확인하여 클래스 토글 (세로 칸 밀림 방지)
    const totalCells = firstDay + lastDate;
    calendarGrid.classList.toggle('six-rows', totalCells > 35);

    for (let i = firstDay - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell other-month';
      cell.innerHTML = `<span class="day-num">${prevMonthLastDate - i}</span>`;
      calendarGrid.appendChild(cell);
    }

    const todayStr = formatDate(new Date());

    for (let d = 1; d <= lastDate; d++) {
      const cell = document.createElement('div');
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).getDay();

      const isFutureDate = dateStr > todayStr;

      let classes = ['cal-day-cell'];
      if (dayOfWeek === 0) classes.push('sun');
      if (dayOfWeek === 6) classes.push('sat');
      if (dateStr === todayStr) classes.push('today');
      if (dateStr === selectedDateStr) classes.push('selected');
      if (isFutureDate) classes.push('future-disabled');

      const entry = diaryData[dateStr];
      if (entry && (entry.title || entry.content || (entry.freeImages && entry.freeImages.length > 0))) {
        classes.push('has-entry');
      }

      cell.className = classes.join(' ');

      let badgeHtml = '';
      if (entry && entry.mood) {
        // 달력에는 글씨 없이 이모지만 표시
        const emojiOnly = (entry.mood.match(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/u) || [entry.mood])[0];
        const shortLabel = MOOD_LABEL_MAP[emojiOnly] || MOOD_LABEL_MAP[entry.mood] || '';
        const titleAttr = shortLabel ? `${emojiOnly} ${shortLabel}` : emojiOnly;
        badgeHtml = `<div class="cal-mood-badge" title="${titleAttr}"><span class="b-emoji">${emojiOnly}</span></div>`;
      }

      cell.innerHTML = `
        <span class="day-num">${d}</span>
        ${badgeHtml}
      `;

      if (!isFutureDate) {
        cell.addEventListener('click', () => {
          hideCalendarTooltip();
          selectedDateStr = dateStr;
          renderCalendar();
          loadEntryForDate(selectedDateStr);
        });

        // 1초 호버 시 일기 제목 말풍선 툴팁 표시
        cell.addEventListener('mouseenter', () => {
          hideCalendarTooltip();
          const ent = diaryData[dateStr];
          if (!ent) return;
          const hasAny = (ent.title && ent.title.trim()) ||
                         (ent.content && ent.content.trim()) ||
                         (ent.freeImages && ent.freeImages.length > 0);
          if (!hasAny) return;

          calHoverTimer = setTimeout(() => {
            showCalendarTooltip(cell, dateStr);
          }, 1000);
        });

        cell.addEventListener('mouseleave', () => {
          hideCalendarTooltip();
        });
      }

      calendarGrid.appendChild(cell);
    }

    renderMoodStatsPanel();
  }

  // ==========================================================================
  // 감정 통계 (주간 / 월간) - 감정 관리 목적
  // ==========================================================================
  function getWeekDates(dateStr) {
    // dateStr이 속한 주(일~토)의 날짜 문자열 7개를 반환
    const [y, m, d] = dateStr.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d);
    const dow = baseDate.getDay();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(y, m - 1, d - dow + i);
      dates.push(formatDate(dt));
    }
    return dates;
  }

  function getMonthDates(year, month) {
    // 해당 연/월(0-indexed month)의 모든 날짜 문자열 반환
    const lastDate = new Date(year, month + 1, 0).getDate();
    const dates = [];
    for (let d = 1; d <= lastDate; d++) {
      dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return dates;
  }

  function computeMoodTotals(dateStrList) {
    const totals = {};
    dateStrList.forEach(dateStr => {
      const entry = diaryData[dateStr];
      if (!entry || !entry.mood) return;
      totals[entry.mood] = (totals[entry.mood] || 0) + 1;
    });
    return totals;
  }

  function computeMoodByWeekday(dateStrList) {
    // 요일(0=일 ~ 6=토)별 감정 수 집계
    const buckets = Array.from({ length: 7 }, () => ({}));
    dateStrList.forEach(dateStr => {
      const entry = diaryData[dateStr];
      if (!entry || !entry.mood) return;
      const [y, m, d] = dateStr.split('-').map(Number);
      const dow = new Date(y, m - 1, d).getDay();
      buckets[dow][entry.mood] = (buckets[dow][entry.mood] || 0) + 1;
    });
    return buckets;
  }

  function renderMoodEmojiSummary(container, totals) {
    if (!container) return;
    const hasAny = MOOD_ORDER.some(mood => totals[mood]);
    if (!hasAny) {
      container.innerHTML = `<span class="mood-stats-empty">아직 기록된 감정이 없어요</span>`;
      return;
    }
    container.innerHTML = MOOD_ORDER
      .filter(mood => totals[mood])
      .map(mood => `
        <span class="mood-summary-chip" style="border-color:${MOOD_COLOR_MAP[mood]}">
          <span class="ms-emoji">${mood}</span><span class="ms-count">${totals[mood]}건</span>
        </span>
      `).join('');
  }

  function renderMoodWeekdayChart(container, buckets) {
    if (!container) return;
    const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];
    const maxBarHeight = 36; // 최대 그래프 바 영역 높이 (px)

    // 전체 요일 중 가장 감정 기록이 많은 요일의 총 건수 계산
    const maxWeekdayTotal = Math.max(1, ...buckets.map(b =>
      MOOD_ORDER.reduce((acc, m) => acc + (b[m] || 0), 0)
    ));

    // 주간(보통 1건)은 12px, 월간(최대 4~6건)은 36px 내에 꼭 맞도록 unit 자동 계산
    const unit = Math.max(3, Math.min(12, Math.floor(maxBarHeight / maxWeekdayTotal)));

    container.innerHTML = buckets.map((bucket, i) => {
      const segments = MOOD_ORDER
        .filter(mood => bucket[mood])
        .map(mood => {
          const segHeight = Math.max(3, bucket[mood] * unit);
          return `<div class="chart-bar-seg" style="height:${segHeight}px; background:${MOOD_COLOR_MAP[mood]};" title="${MOOD_LABEL_MAP[mood]} ${bucket[mood]}건"></div>`;
        })
        .join('');

      let dayClass = '';
      if (i === 0) dayClass = 'sun';
      if (i === 6) dayClass = 'sat';

      return `
        <div class="chart-col">
          <div class="chart-bar-stack">${segments}</div>
          <span class="chart-day-label ${dayClass}">${weekdayLabels[i]}</span>
        </div>
      `;
    }).join('');
  }

  function renderMoodStatsPanel() {
    // 주간: 현재 선택된 날짜가 속한 주
    const weekDates = getWeekDates(selectedDateStr);
    renderMoodEmojiSummary(weekMoodSummary, computeMoodTotals(weekDates));
    renderMoodWeekdayChart(weekMoodChart, computeMoodByWeekday(weekDates));

    // 월간: 현재 캘린더에 표시된 달
    const monthDates = getMonthDates(currentDate.getFullYear(), currentDate.getMonth());
    renderMoodEmojiSummary(monthMoodSummary, computeMoodTotals(monthDates));
    renderMoodWeekdayChart(monthMoodChart, computeMoodByWeekday(monthDates));
  }

  // ==========================================================================
  // 일기 데이터 로드 & 에디터 바인딩
  // ==========================================================================
  function loadEntryForDate(dateStr) {
    selectedDateText.textContent = getKoreanFullDateStr(dateStr);
    hideImageControlPopup();

    const entry = diaryData[dateStr] || {
      title: '',
      content: '',
      weather: '☀️',
      mood: '😐',
      tasksDone: ['', '', ''],
      selfPraise: ['', '', ''],
      showTasks: false,
      showPraise: false,
      freeImages: []
    };

    diaryTitleInput.value = entry.title || '';
    diaryContentEditor.innerHTML = entry.content || '';

    document.querySelectorAll('#weatherOptions .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.weather === (entry.weather || '☀️'));
    });

    document.querySelectorAll('#moodOptions .pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mood === (entry.mood || '😐'));
    });

    const tasks = entry.tasksDone || ['', '', ''];
    taskInput1.value = tasks[0] || '';
    taskInput2.value = tasks[1] || '';
    taskInput3.value = tasks[2] || '';

    const praises = entry.selfPraise || ['', '', ''];
    praiseInput1.value = praises[0] || '';
    praiseInput2.value = praises[1] || '';
    praiseInput3.value = praises[2] || '';

    chkToggleTasks.checked = !!entry.showTasks;
    chkTogglePraise.checked = !!entry.showPraise;

    tasksCard.classList.toggle('hidden', !entry.showTasks);
    praiseCard.classList.toggle('hidden', !entry.showPraise);

    renderFreeCanvasImages(entry.freeImages || []);
    attachInlineImageEvents();

    const hasEntry = !!diaryData[dateStr];

    if (hasEntry) {
      setSaveStatus('✨ 로드 완료', false);
    } else {
      setSaveStatus('📝 작성된 일기가 없어요', false);
    }

    // 날짜를 이동할 때마다 항상 보기(잠금) 상태로 초기화하고,
    // 수정 버튼을 눌러야만 편집이 가능하도록 함
    setEditMode(false);
  }

  // ==========================================================================
  // 수정/작성 모드 잠금 & 해제
  // ==========================================================================
  function setEditMode(editable) {
    isEditingEntry = editable;
    hasUnsavedChanges = false;

    diaryContentEditor.contentEditable = editable ? 'true' : 'false';
    diaryTitleInput.readOnly = !editable;
    taskInput1.readOnly = !editable;
    taskInput2.readOnly = !editable;
    taskInput3.readOnly = !editable;
    praiseInput1.readOnly = !editable;
    praiseInput2.readOnly = !editable;
    praiseInput3.readOnly = !editable;

    if (editorCard) {
      editorCard.classList.toggle('view-mode', !editable);
    }

    if (!editable) {
      hideImageControlPopup();
    }

    updateEditToggleUI();
    updateSaveButtonState();
  }

  function updateSaveButtonState() {
    if (!btnSaveDiary) return;
    // 읽기 모드에서는 저장 버튼을 아예 숨김
    btnSaveDiary.style.display = isEditingEntry ? 'flex' : 'none';
    // 수정/작성 모드에서 실제로 뭔가 바뀌었을 때만 주황불이 켜짐
    btnSaveDiary.classList.toggle('has-changes', isEditingEntry && hasUnsavedChanges);
  }

  function updateEditToggleUI() {
    if (!btnEditToggle) return;
    const hasEntry = !!diaryData[selectedDateStr];

    if (isEditingEntry) {
      btnEditToggle.textContent = '✅ 작성 중';
      btnEditToggle.classList.add('is-editing');
      btnEditToggle.title = '작성 중에는 이 버튼이 동작하지 않아요. 저장하려면 💾 버튼을 눌러주세요.';
    } else {
      btnEditToggle.textContent = hasEntry ? '✏️ 수정' : '📝 일기 작성';
      btnEditToggle.classList.remove('is-editing');
      btnEditToggle.title = '눌러야 일기를 수정할 수 있어요';
    }

    if (btnDeleteDiary) {
      btnDeleteDiary.style.display = hasEntry ? '' : 'none';
    }
  }

  function deleteCurrentEntry() {
    if (!diaryData[selectedDateStr]) return;

    const confirmed = confirm('이 날짜의 일기를 삭제하시겠습니까? 삭제하면 되돌릴 수 없어요.');
    if (!confirmed) return;

    delete diaryData[selectedDateStr];
    persistAll();

    renderCalendar();
    loadEntryForDate(selectedDateStr);
    setSaveStatus('🗑️ 일기가 삭제되었어요', false);
  }

  // ==========================================================================
  // 수동 저장 전용 시스템
  // ==========================================================================
  async function saveCurrentEntry() {
    const title = diaryTitleInput.value.trim();
    const content = (() => {
      const clone = diaryContentEditor.cloneNode(true);
      clone.querySelectorAll('.resize-handle').forEach(h => h.remove());
      return clone.innerHTML;
    })();

    const activeWeather = document.querySelector('#weatherOptions .pill-btn.active');
    const weather = activeWeather ? activeWeather.dataset.weather : '☀️';

    const activeMood = document.querySelector('#moodOptions .pill-btn.active');
    const mood = activeMood ? activeMood.dataset.mood : '😐';

    const freeImages = [];
    freeCanvas.querySelectorAll('.free-image-wrapper').forEach(wrapper => {
      const img = wrapper.querySelector('img');
      if (img) {
        freeImages.push({
          id: wrapper.id,
          url: img.src,
          x: wrapper.offsetLeft,
          y: wrapper.offsetTop,
          width: wrapper.offsetWidth,
          height: wrapper.offsetHeight,
          rotation: parseFloat(wrapper.dataset.rotation || '0'),
          polaroid: wrapper.classList.contains('polaroid-style'),
          clipped: wrapper.classList.contains('clip-edge')
        });
      }
    });

    diaryData[selectedDateStr] = {
      title,
      content,
      weather,
      mood,
      tasksDone: [taskInput1.value, taskInput2.value, taskInput3.value],
      selfPraise: [praiseInput1.value, praiseInput2.value, praiseInput3.value],
      showTasks: chkToggleTasks.checked,
      showPraise: chkTogglePraise.checked,
      freeImages,
      updatedAt: new Date().toISOString()
    };

    setEditMode(false);
    renderCalendar();
    setSaveStatus('✨ 로컬 저장 완료...', false);

    await persistAll();
  }

  function markAsUnsaved() {
    if (!isEditingEntry) return;
    hasUnsavedChanges = true;
    updateSaveButtonState();
    setSaveStatus('⚠️ 작성 중 (저장 필요)', true);
  }

  function setSaveStatus(msg, isUnsaved) {
    saveStatusIndicator.textContent = msg;
    saveStatusIndicator.classList.toggle('unsaved', isUnsaved);
  }

  // ==========================================================================
  // 자유 모드 (📌) 스티커 렌더링 & 드래그/리사이즈
  // ==========================================================================
  function adjustCanvasHeight() {
    let maxBottom = 0;
    // 끼우기(clip-edge) 모드가 아닌 이미지에 대해서만 캔버스 하단 자동 확장을 적용합니다.
    freeCanvas.querySelectorAll('.free-image-wrapper:not(.clip-edge)').forEach(wrapper => {
      const top = wrapper.offsetTop;
      const height = wrapper.offsetHeight || parseFloat(wrapper.style.height) || 150;
      if (top + height > maxBottom) {
        maxBottom = top + height;
      }
    });

    const defaultMin = 360;
    if (maxBottom > 0) {
      diaryContentEditor.style.minHeight = `${Math.max(defaultMin, maxBottom + 20)}px`;
    } else {
      diaryContentEditor.style.minHeight = `${defaultMin}px`;
    }
  }

  function renderFreeCanvasImages(freeImages) {
    freeCanvas.innerHTML = '';
    freeImages.forEach(imgData => createFreeImageElement(imgData));
    adjustCanvasHeight();
  }

  function createFreeImageElement(imgData) {
    const wrapper = document.createElement('div');
    wrapper.className = `free-image-wrapper ${imgData.polaroid ? 'polaroid-style' : ''} ${imgData.clipped ? 'clip-edge' : ''}`;
    wrapper.id = imgData.id || `free_img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    wrapper.style.left = (typeof imgData.x === 'number' ? imgData.x : 20) + 'px';
    wrapper.style.top = (typeof imgData.y === 'number' ? imgData.y : 20) + 'px';
    wrapper.style.width = (imgData.width || 180) + 'px';
    wrapper.style.height = 'auto';

    const rotation = imgData.rotation || 0;
    wrapper.style.transform = `rotate(${rotation}deg)`;
    wrapper.dataset.rotation = rotation;
    wrapper.dataset.mode = 'free';
    wrapper.setAttribute('draggable', 'false');

    const img = document.createElement('img');
    img.src = imgData.url;
    img.setAttribute('draggable', 'false');

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';

    wrapper.appendChild(img);
    wrapper.appendChild(resizeHandle);
    freeCanvas.appendChild(wrapper);

    makeElementDraggableAndResizable(wrapper, resizeHandle);
    adjustCanvasHeight();

    wrapper.addEventListener('click', (e) => {
      if (!isEditingEntry) return;
      e.stopPropagation();
      selectImageElement(wrapper, 'free');
    });
  }

  function makeElementDraggableAndResizable(wrapper, resizeHandle) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startW, startLeft, startTop;

    function onDragStart(e) {
      if (!isEditingEntry) return;
      if (e.target === resizeHandle) return;
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;
      startLeft = wrapper.offsetLeft;
      startTop = wrapper.offsetTop;

      selectImageElement(wrapper, 'free');

      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragEnd);
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('touchend', onDragEnd);
    }

    function onDragMove(e) {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const canvasW = freeCanvas.offsetWidth;
      const canvasH = freeCanvas.offsetHeight;
      const imgW = wrapper.offsetWidth;
      const imgH = wrapper.offsetHeight;

      let newLeft = startLeft + (clientX - startX);
      let newTop  = startTop  + (clientY - startY);

      const isClipped = wrapper.classList.contains('clip-edge');

      if (isClipped) {
        // 끼우기 모드: 상/하/좌/우 모든 가장자리 밖(글 끝부분 포함)으로 넘쳐서 끼워질 수 있게 허용 (최소 30px 걸침)
        const minVisible = 30;
        newLeft = Math.max(-imgW + minVisible, Math.min(newLeft, canvasW - minVisible));
        newTop  = Math.max(-imgH + minVisible, Math.min(newTop, canvasH - minVisible));
      } else {
        // 일반 자유 모드: 캔버스 경계 내로 클램핑 (하단 자동 확장)
        newLeft = Math.max(0, Math.min(newLeft, Math.max(0, canvasW - imgW)));
        newTop  = Math.max(0, newTop);
      }

      wrapper.style.left = `${newLeft}px`;
      wrapper.style.top  = `${newTop}px`;

      adjustCanvasHeight();
      updateControlPopupPosition();
    }

    function onDragEnd() {
      if (isDragging) {
        isDragging = false;
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);
        markAsUnsaved();
      }
    }

    wrapper.addEventListener('mousedown', onDragStart);
    wrapper.addEventListener('touchstart', onDragStart, { passive: false });

    function onResizeStart(e) {
      if (!isEditingEntry) return;
      e.stopPropagation();
      isResizing = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      startX = clientX;
      startY = clientY;
      startW = wrapper.offsetWidth;

      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeEnd);
      document.addEventListener('touchmove', onResizeMove, { passive: false });
      document.addEventListener('touchend', onResizeEnd);
    }

    function onResizeMove(e) {
      if (!isResizing) return;
      if (e.cancelable) e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dx = clientX - startX;
      const dy = clientY - startY;

      // 회전 각도(rotation)를 고려하여 로컬 좌표계 상의 delta 계산
      const rotation = parseFloat(wrapper.dataset.rotation || '0');
      const rad = rotation * (Math.PI / 180);

      const localDx = dx * Math.cos(rad) + dy * Math.sin(rad);
      const localDy = -dx * Math.sin(rad) + dy * Math.cos(rad);

      const delta = Math.abs(localDx) > Math.abs(localDy) ? localDx : localDy;

      const newW = Math.max(70, startW + delta);
      wrapper.style.width = `${newW}px`;
      wrapper.style.height = 'auto'; // 원본 비율 자동 유지

      adjustCanvasHeight();
      updateControlPopupPosition();
    }

    function onResizeEnd() {
      if (isResizing) {
        isResizing = false;
        document.removeEventListener('mousemove', onResizeMove);
        document.removeEventListener('mouseup', onResizeEnd);
        document.removeEventListener('touchmove', onResizeMove);
        document.removeEventListener('touchend', onResizeEnd);
        markAsUnsaved();
      }
    }

    resizeHandle.addEventListener('mousedown', onResizeStart);
    resizeHandle.addEventListener('touchstart', onResizeStart, { passive: false });
  }

  // ==========================================================================
  // 글 속에 쏙 (Inline Mode 📝)
  // ==========================================================================
  function getDropRange(e) {
    if (document.caretRangeFromPoint) {
      return document.caretRangeFromPoint(e.clientX, e.clientY);
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        const range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
        return range;
      }
    }
    return null;
  }

  // 이미지 압축 (최대 너비 1600px, WebP 0.85 고화질 압축)
  function compressImage(file, maxWidth = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('Not an image file'));
      }
      // GIF 애니메이션은 압축 시 정지화면이 되므로 원본 그대로 로딩
      if (file.type === 'image/gif') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // WebP 포맷 사용 (0.85 고화질), 미지원 브라우저는 JPEG 폴백
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          // 압축 결과 데이터의 크기가 원본보다 크다면 원본 base64(e.target.result)를 씁니다.
          if (dataUrl.length >= e.target.result.length) {
            resolve(e.target.result);
          } else {
            resolve(dataUrl);
          }
        };
        img.onerror = () => reject(new Error('Image load error'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }

  function insertInlineImage(url, targetRange = null) {
    const wrap = document.createElement('span');
    wrap.className = 'diary-inline-image-wrap';
    wrap.contentEditable = 'false';
    wrap.dataset.mode = 'inline';
    wrap.setAttribute('draggable', 'true');

    const img = document.createElement('img');
    img.src = url;
    img.setAttribute('draggable', 'false');

    wrap.appendChild(img);

    diaryContentEditor.focus();
    const sel = window.getSelection();
    if (targetRange && diaryContentEditor.contains(targetRange.startContainer)) {
      targetRange.insertNode(wrap);
      targetRange.collapse(false);
    } else if (sel.rangeCount > 0 && diaryContentEditor.contains(sel.getRangeAt(0).startContainer)) {
      const range = sel.getRangeAt(0);
      range.insertNode(wrap);
      range.collapse(false);
    } else {
      diaryContentEditor.appendChild(wrap);
    }

    attachInlineImageEvents();
    selectImageElement(wrap, 'inline');
    markAsUnsaved();
  }

  function attachInlineImageEvents() {
    diaryContentEditor.querySelectorAll('.diary-inline-image-wrap').forEach(wrap => {
      wrap.setAttribute('draggable', 'true');
      const img = wrap.querySelector('img');
      if (img) img.setAttribute('draggable', 'false');

      wrap.onclick = (e) => {
        if (!isEditingEntry) return;
        e.stopPropagation();
        selectImageElement(wrap, 'inline');
      };

      wrap.ondragstart = (e) => {
        if (!isEditingEntry) {
          e.preventDefault();
          return;
        }
        draggedInlineImage = wrap;
        e.dataTransfer.effectAllowed = 'move';
        try {
          e.dataTransfer.setData('text/plain', 'internal-inline-image');
        } catch (err) {}
        e.stopPropagation();
      };

      wrap.ondragend = () => {
        draggedInlineImage = null;
      };

      addResizeHandleToInline(wrap);
    });
  }

  // 인라인 이미지에 리사이즈 핸들 추가
  function addResizeHandleToInline(wrap) {
    if (wrap.querySelector('.resize-handle')) return; // 이미 있으면 스킵

    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    wrap.appendChild(handle);

    let isResizing = false;
    let startX, startW;

    function onResizeStart(e) {
      if (!isEditingEntry) return;
      e.stopPropagation();
      e.preventDefault();
      isResizing = true;
      startX = e.touches ? e.touches[0].clientX : e.clientX;
      startW = wrap.offsetWidth;
      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeEnd);
      document.addEventListener('touchmove', onResizeMove, { passive: false });
      document.addEventListener('touchend', onResizeEnd);
    }

    function onResizeMove(e) {
      if (!isResizing) return;
      if (e.cancelable) e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const newW = Math.max(60, startW + (clientX - startX));
      wrap.style.width = newW + 'px';
      updateControlPopupPosition();
    }

    function onResizeEnd() {
      if (!isResizing) return;
      isResizing = false;
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('mouseup', onResizeEnd);
      document.removeEventListener('touchmove', onResizeMove);
      document.removeEventListener('touchend', onResizeEnd);
      markAsUnsaved();
    }

    handle.addEventListener('mousedown', onResizeStart);
    handle.addEventListener('touchstart', onResizeStart, { passive: false });
  }

  // ==========================================================================
  // 이미지 조작 팝업 바 (#imageControlPopup)
  // ==========================================================================
  function selectImageElement(el, mode) {
    if (!isEditingEntry) return;
    document.querySelectorAll('.active-selected').forEach(elem => elem.classList.remove('active-selected'));

    activeImageObj = { element: el, mode: mode };
    el.classList.add('active-selected');

    btnModeInline.classList.toggle('active', mode === 'inline');
    btnModeFree.classList.toggle('active', mode === 'free');

    if (btnToggleClip) {
      btnToggleClip.style.display = (mode === 'free') ? 'inline-flex' : 'none';
      btnToggleClip.classList.toggle('active', el.classList.contains('clip-edge'));
    }

    updateControlPopupPosition();
  }

  function updateControlPopupPosition() {
    if (!activeImageObj || !activeImageObj.element) return;

    const rect = activeImageObj.element.getBoundingClientRect();
    imageControlPopup.classList.remove('hidden');

    const popupWidth = imageControlPopup.offsetWidth || 260;
    let top = rect.top - 45;
    let left = rect.left + (rect.width / 2) - (popupWidth / 2);

    if (top < 10) top = rect.bottom + 10;
    if (left < 10) left = 10;
    if (left + popupWidth > window.innerWidth - 10) left = window.innerWidth - popupWidth - 10;

    imageControlPopup.style.top = `${top}px`;
    imageControlPopup.style.left = `${left}px`;
  }

  function hideImageControlPopup() {
    imageControlPopup.classList.add('hidden');
    document.querySelectorAll('.active-selected').forEach(elem => elem.classList.remove('active-selected'));
    activeImageObj = null;
  }

  function switchImageMode(targetMode) {
    if (!activeImageObj || activeImageObj.mode === targetMode) return;

    const el = activeImageObj.element;
    const img = el.querySelector('img');
    const imgSrc = img ? img.src : '';
    const rotation = parseFloat(el.dataset.rotation || '0');
    const polaroid = el.classList.contains('polaroid-style');

    if (targetMode === 'free') {
      const containerRect = freeCanvas.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      const width = el.offsetWidth || 180;
      const height = el.offsetHeight || null;

      let calcX = elRect.left - containerRect.left;
      let calcY = elRect.top - containerRect.top;

      calcX = Math.max(0, calcX);
      calcY = Math.max(0, calcY);

      el.remove();

      const freeData = {
        id: `free_${Date.now()}`,
        url: imgSrc,
        x: calcX,
        y: calcY,
        width: width,
        height: height,
        rotation: rotation,
        polaroid: polaroid
      };
      createFreeImageElement(freeData);
      adjustCanvasHeight();
      const newEl = document.getElementById(freeData.id);
      if (newEl) selectImageElement(newEl, 'free');
    } else {
      const elRect = el.getBoundingClientRect();
      const clickX = elRect.left + elRect.width / 2;
      const clickY = elRect.top + elRect.height / 2;

      let targetRange = null;
      if (document.caretRangeFromPoint) {
        targetRange = document.caretRangeFromPoint(clickX, clickY);
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(clickX, clickY);
        if (pos) {
          targetRange = document.createRange();
          targetRange.setStart(pos.offsetNode, pos.offset);
          targetRange.collapse(true);
        }
      }

      el.remove();
      insertInlineImage(imgSrc, targetRange);
      adjustCanvasHeight();
    }

    markAsUnsaved();
  }

  // ==========================================================================
  // 로컬 diary_data.json 파일 자동 저장 (File System Access API)
  //   - 브라우저가 지원하면(Chrome/Edge 등) 사용자가 diary_data.json을 한 번 선택해
  //     연결해두면, 이후 프로필/일기 저장 시 자동으로 그 파일에 기록됩니다.
  //   - IndexedDB에 파일 핸들을 저장해두어 다음 방문 때도 재연결을 시도합니다.
  //   - 미지원 브라우저(Safari/Firefox 등)에서는 지금처럼 브라우저 저장소(localStorage)만
  //     사용하고, 상단 [💾 백업] 버튼으로 diary_data.json을 직접 내려받아 관리합니다.
  // ==========================================================================
  const IDB_NAME = 'mongle_diary_fs';
  const IDB_STORE = 'handles';
  const IDB_KEY = 'diaryFileHandle';

  function idbGet(key) {
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(null);
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => {
        try {
          const tx = req.result.transaction(IDB_STORE, 'readonly');
          const getReq = tx.objectStore(IDB_STORE).get(key);
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      };
      req.onerror = () => resolve(null);
    });
  }

  function idbSet(key, value) {
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(false);
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => {
        try {
          const tx = req.result.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).put(value, key);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (e) { resolve(false); }
      };
      req.onerror = () => resolve(false);
    });
  }

  // 프로필 + 모든 일기 데이터를 하나의 JSON 구조로 합칩니다.
  function buildFullExportData() {
    return {
      profile: profileSettings,
      entries: diaryData,
      exportedAt: new Date().toISOString()
    };
  }

  function parseDiaryJson(text) {
    if (!text || typeof text !== 'string') return null;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return null;
    }
    if (!parsed || typeof parsed !== 'object') return null;

    let loadedEntries = null;
    let loadedProfile = null;

    if (parsed.entries && typeof parsed.entries === 'object') {
      loadedEntries = parsed.entries;
      if (parsed.profile && typeof parsed.profile === 'object') {
        loadedProfile = parsed.profile;
      }
    } else if (parsed.data && typeof parsed.data === 'object') {
      loadedEntries = parsed.data;
      if (parsed.profile) loadedProfile = parsed.profile;
    } else {
      const keys = Object.keys(parsed);
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      const hasDateKey = keys.some(k => datePattern.test(k));
      if (hasDateKey) {
        loadedEntries = parsed;
      }
    }

    if (!loadedEntries) return null;
    return { entries: loadedEntries, profile: loadedProfile };
  }

  // diary_data.json 파일 내용을 읽어와 프로필/일기 데이터에 반영합니다.
  async function loadFromFileHandle() {
    try {
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (!text || !text.trim()) return false;

      const result = parseDiaryJson(text);
      if (!result || !result.entries) {
        console.warn('유효한 일기 데이터 형식이 아닙니다.');
        return false;
      }

      diaryData = { ...diaryData, ...result.entries };
      if (result.profile) {
        profileSettings = { ...profileSettings, ...result.profile };
      }

      try {
        localStorage.setItem('cute_web_diary_data', JSON.stringify(diaryData));
      } catch (e) {
        console.warn('localStorage 캐시 용량 초과:', e);
      }
      try {
        localStorage.setItem('diary_profile_settings', JSON.stringify(profileSettings));
      } catch (e) {
        console.warn('localStorage 프로필 캐시 용량 초과:', e);
      }
      return true;
    } catch (e) {
      console.error('diary_data.json 읽기 실패:', e);
      return false;
    }
  }

  async function writeToFileHandle(dataObj) {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(dataObj, null, 2));
    await writable.close();
  }

  async function verifyFileHandlePermission(readWrite) {
    const opts = readWrite ? { mode: 'readwrite' } : {};
    if ((await fileHandle.queryPermission(opts)) === 'granted') return true;
    if ((await fileHandle.requestPermission(opts)) === 'granted') return true;
    return false;
  }

  // 이전에 연결했던 파일 핸들이 있으면 조용히(사용자 클릭 없이) 재연결을 시도합니다.
  // 브라우저를 껐다 켜면 File System Access API 권한이 만료되므로,
  // queryPermission()으로 권한 상태를 먼저 확인하고 'granted'일 때만 재연결합니다.
  async function tryAutoReconnectFile() {
    if (!window.showOpenFilePicker) return;
    try {
      const handle = await idbGet(IDB_KEY);
      if (!handle) return;

      // 사용자 상호작용 없이 조용히 권한 상태 확인 (requestPermission은 호출하지 않음)
      let permission = 'prompt';
      try {
        permission = await handle.queryPermission({ mode: 'readwrite' });
      } catch (e) {
        // 핸들이 만료되었거나 queryPermission을 지원하지 않는 경우
        console.warn('파일 핸들 권한 확인 실패:', e);
        fileConnected = false;
        return;
      }

      if (permission !== 'granted') {
        // 권한이 없음 — fileConnected = false 유지, 사용자가 직접 연결해야 함
        console.info('자동 재연결: 파일 권한 없음 (직접 연결 필요)');
        fileConnected = false;
        return;
      }

      fileHandle = handle;
      const loaded = await loadFromFileHandle();
      if (loaded) {
        fileConnected = true;
      } else {
        // 읽기는 성공했지만 파일 내용이 비어있거나 형식이 잘못된 경우
        fileConnected = true; // 핸들은 유효하므로 연결 상태 유지
        console.warn('자동 재연결: 파일을 읽었지만 유효한 데이터가 없음');
      }
    } catch (e) {
      console.warn('자동 재연결 시도 오류:', e);
      fileConnected = false;
    }
  }

  // 상단 [📁 diary_data.json 연결] 클릭 시: 사용자가 직접 diary_data.json을 선택하거나 기존 핸들을 재인증합니다.
  async function connectDiaryFile() {
    if (!window.showOpenFilePicker) {
      alert('이 브라우저는 로컬 파일 자동 저장 기능을 지원하지 않아요.\nChrome, Edge 같은 브라우저 최신 버전에서 이용해주세요.\n대신 [💾 백업] 버튼으로 diary_data.json 파일을 직접 저장/불러올 수 있어요.');
      return;
    }
    try {
      if (fileHandle) {
        try {
          const granted = await verifyFileHandlePermission(true);
          if (granted) {
            fileConnected = true;
            await idbSet(IDB_KEY, fileHandle);
            const loaded = await loadFromFileHandle();
            applyProfileSettings();
            renderCalendar();
            loadEntryForDate(selectedDateStr);
            updateFileConnStatusUI();
            alert(`'${fileHandle.name}' 파일에 성공적으로 연결되었습니다! 🌸`);
            return;
          }
        } catch (e) {}
      }

      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Diary Data JSON', accept: { 'application/json': ['.json'] } }],
        excludeAcceptAllOption: false,
        multiple: false
      });

      const granted = (await handle.queryPermission({ mode: 'readwrite' })) === 'granted'
        || (await handle.requestPermission({ mode: 'readwrite' })) === 'granted';
      if (!granted) {
        alert('파일 쓰기 권한이 필요해요. 다시 시도해주세요.');
        return;
      }

      fileHandle = handle;
      fileConnected = true;
      await idbSet(IDB_KEY, handle);

      const loaded = await loadFromFileHandle();

      applyProfileSettings();
      renderCalendar();
      loadEntryForDate(selectedDateStr);

      updateFileConnStatusUI();

      if (loaded) {
        alert(`'${handle.name}' 파일에 성공적으로 연결되었으며, 일기 데이터를 불러왔습니다! 🌸\n이후 작성하는 일기는 이 파일에 자동으로 동기화 저장됩니다.`);
      } else {
        alert(`'${handle.name}' 파일에 연결됐어요! 이제부터 작성하는 일기가 이 파일에 저장됩니다. 🌸`);
      }
    } catch (err) {
      if (err && err.name !== 'AbortError') {
        console.error(err);
        alert('파일 연결 중 문제가 발생했어요.');
      }
    }
  }

  function updateFileConnStatusUI(errorFlag) {
    if (!fileConnStatusEl) return;
    if (isRepoConfigured()) {
      fileConnStatusEl.textContent = '🐙 저장소 연결됨';
      fileConnStatusEl.className = 'file-conn-status connected';
      fileConnStatusEl.title = 'GitHub 저장소에 일기가 클라우드 동기화되고 있어요. (클릭해서 설정 열기)';
    } else if (fileConnected) {
      fileConnStatusEl.textContent = '📁 파일 연결됨';
      fileConnStatusEl.className = 'file-conn-status connected';
      fileConnStatusEl.title = 'diary_data.json 파일에 자동 저장되고 있어요.';
    } else {
      fileConnStatusEl.textContent = errorFlag ? '⚠️ 파일 연결 끊김' : '📁 파일 미연결';
      fileConnStatusEl.className = 'file-conn-status' + (errorFlag ? ' error' : '');
      fileConnStatusEl.title = '클릭해서 diary_data.json 파일 또는 GitHub 저장소에 동기화해요.';
    }
  }



  // 프로필 설정 + 모든 일기 데이터를 저장하는 단일 진입점.
  // localStorage에는 항상 캐시하고, diary_data.json에 연결돼 있으면 그 파일에도 씁니다.
  async function persistAll() {
    try {
      localStorage.setItem('cute_web_diary_data', JSON.stringify(diaryData));
    } catch (e) {
      console.warn('localStorage 저장 용량 제한 (대용량 일기 데이터):', e);
    }
    try {
      localStorage.setItem('diary_profile_settings', JSON.stringify(profileSettings));
    } catch (e) {
      console.warn('localStorage 프로필 저장 용량 제한:', e);
    }

    if (fileConnected && fileHandle) {
      try {
        const ok = await verifyFileHandlePermission(true);
        if (!ok) throw new Error('permission denied');
        await writeToFileHandle(buildFullExportData());
        updateFileConnStatusUI();
      } catch (e) {
        console.error('diary_data.json 저장 실패:', e);
        fileConnected = false;
        updateFileConnStatusUI(true);
      }
    }

    saveToServerApi();

    // GitHub 저장소 연동이 설정되어 있으면 자동으로 Push
    if (isRepoConfigured()) {
      setSaveStatus('✨ 저장 완료 (📤 GitHub 동기화 중...)', false);
      try {
        await pushToRepo(false);
        setSaveStatus('✨ 저장 완료 (🐙 GitHub 동기화 완료!)', false);
      } catch (err) {
        setSaveStatus('✨ 저장 완료 (⚠️ GitHub 동기화 실패)', true);
      }
    } else {
      setSaveStatus('✨ 일기 저장 완료!', false);
    }
  }

  // ==========================================================================
  // 서버 & Gist 동기화 (추후 서버 연동을 위해 남겨둠 — 서버가 없으면 조용히 무시됨)
  // ==========================================================================
  async function loadDiaryData() {
    // fileConnected 여부와 무관하게 localStorage를 항상 먼저 불러옵니다.
    // (파일 연결이 됐어도 localStorage에 더 최신 작성 내용이 있을 수 있으므로)

    // 1. localStorage 캐시 우선 로드
    const localProfile = localStorage.getItem('diary_profile_settings');
    if (localProfile) {
      try { profileSettings = { ...profileSettings, ...JSON.parse(localProfile) }; } catch (e) {}
    }
    const local = localStorage.getItem('cute_web_diary_data');
    if (local) {
      try {
        const localEntries = JSON.parse(local);
        diaryData = { ...diaryData, ...localEntries };
      } catch (e) {}
    }

    if (!fileConnected) {
      // 2. static diary_data.json 파일 읽기 시도 (웹 서버 환경, fetch)
      try {
        const res = await fetch('./diary_data.json');
        if (res.ok) {
          const parsed = await res.json();
          if (parsed && (parsed.entries || parsed.profile)) {
            diaryData = { ...diaryData, ...(parsed.entries || {}) };
            if (parsed.profile) profileSettings = { ...profileSettings, ...parsed.profile };
          } else if (parsed && typeof parsed === 'object') {
            diaryData = { ...diaryData, ...parsed };
          }
        }
      } catch (e) {}

      // 3. 병합 결과 저장
      try {
        localStorage.setItem('cute_web_diary_data', JSON.stringify(diaryData));
      } catch (e) {}
    }
    // fileConnected === true인 경우 loadFromFileHandle()은 이미 tryAutoReconnectFile()에서 완료됨

    try {
      const res = await fetch('/api/diary');
      if (res.ok) {
        const serverData = await res.json();
        if (serverData && Object.keys(serverData).length > 0) {
          diaryData = { ...diaryData, ...serverData };
          try {
            localStorage.setItem('cute_web_diary_data', JSON.stringify(diaryData));
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  async function saveToServerApi() {
    try {
      await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diaryData)
      });
    } catch (e) {}
  }



  // ==========================================================================
  // GitHub 일반 저장소(Repository) 동기화
  //   - Gist의 10MB 제한을 넘어 최대 100MB까지 지원
  //   - 비공개 저장소(Private Repo)에 diary_data.json을 커밋/푸시
  //   - 수정 이력(Commit History)이 남아 과거 데이터 복구 가능
  // ==========================================================================
  function showRepoStatus(msg, type) {
    if (!repoStatusMessage) return;
    repoStatusMessage.textContent = msg;
    repoStatusMessage.className = `gist-status ${type}`;
  }

  function isRepoConfigured() {
    return repoConfig.token && repoConfig.owner && repoConfig.repo;
  }

  function getRepoFilePath(targetYear) {
    const y = targetYear || (selectedDateStr ? selectedDateStr.split('-')[0] : new Date().getFullYear().toString());
    let path = repoConfig.path || 'diary_{year}.json';
    if (path.includes('{year}')) {
      return path.replace(/{year}/g, y);
    }
    if (path === 'diary_data.json') {
      return `diary_${y}.json`;
    }
    return path;
  }

  // 저장소에 파일 Push (Create or Update)
  async function pushToRepo(showFeedback = true) {
    if (!isRepoConfigured()) return;

    // UI 비활성화 및 로딩 표시
    if (btnSaveRepoConfig) {
      btnSaveRepoConfig.disabled = true;
      btnSaveRepoConfig.textContent = '업로드 중...';
    }
    if (btnManualRepoPull) btnManualRepoPull.disabled = true;

    if (showFeedback) showRepoStatus('📤 저장소에 업로드 중...', 'loading');

    try {
      const targetPath = getRepoFilePath();
      const apiUrl = `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${targetPath}`;
      const headers = {
        'Authorization': `token ${repoConfig.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      // 1. 현재 파일의 SHA 가져오기 (Conflict 방지를 위해 항상 실시간으로 깃허브에서 가져옴 - 브라우저 캐싱 방지 포함)
      let currentSha = '';
      try {
        const getRes = await fetch(`${apiUrl}?ref=${repoConfig.branch}&t=${Date.now()}`, { 
          headers,
          cache: 'no-store'
        });
        if (getRes.ok) {
          const fileData = await getRes.json();
          currentSha = fileData.sha || '';
        }
      } catch (e) {
        // 파일이 아직 없는 경우 (첫 Push) — 무시
      }

      // 2. 파일 내용을 Base64로 인코딩
      const jsonContent = JSON.stringify(buildFullExportData(), null, 2);
      const contentBase64 = btoa(unescape(encodeURIComponent(jsonContent)));

      // 3. PUT 요청으로 파일 생성 또는 업데이트
      const now = new Date();
      const commitMsg = `📝 일기 동기화 (${targetPath}) — ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const body = {
        message: commitMsg,
        content: contentBase64,
        branch: repoConfig.branch
      };
      if (currentSha) {
        body.sha = currentSha;
      }

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });

      if (!putRes.ok) {
        const errBody = await putRes.json().catch(() => ({}));
        throw new Error(`HTTP ${putRes.status}: ${errBody.message || '알 수 없는 오류'}`);
      }

      const result = await putRes.json();
      repoConfig.sha = result.content?.sha || '';

      if (showFeedback) showRepoStatus('🐙 저장소 업로드 완료!', 'success');
      updateFileConnStatusUI();
    } catch (err) {
      console.error('GitHub Repo push 실패:', err);
      if (showFeedback) showRepoStatus(`실패: ${err.message}`, 'error');
      updateFileConnStatusUI(true);
    } finally {
      // UI 복구
      if (btnSaveRepoConfig) {
        btnSaveRepoConfig.disabled = false;
        btnSaveRepoConfig.textContent = '설정 저장 및 업로드 (Push)';
      }
      if (btnManualRepoPull) btnManualRepoPull.disabled = false;
    }
  }

  // 저장소에서 파일 Pull (불러오기)
  async function pullFromRepo() {
    if (!isRepoConfigured()) return;

    // UI 비활성화 및 로딩 표시
    if (btnManualRepoPull) {
      btnManualRepoPull.disabled = true;
      btnManualRepoPull.textContent = '불러오는 중...';
    }
    if (btnSaveRepoConfig) btnSaveRepoConfig.disabled = true;

    showRepoStatus('📥 저장소에서 불러오는 중...', 'loading');

    const tryFetchFile = async (pathStr) => {
      const apiUrl = `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${pathStr}?ref=${repoConfig.branch}&t=${Date.now()}`;
      return await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${repoConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        cache: 'no-store'
      });
    };

    try {
      let targetPath = getRepoFilePath();
      let res = await tryFetchFile(targetPath);

      // 만약 년도별 파일(예: diary_2026.json)이 저장소에 없으면 기존 diary_data.json 폴백 시도
      if (!res.ok && res.status === 404 && targetPath !== 'diary_data.json') {
        res = await tryFetchFile('diary_data.json');
      }

      if (!res.ok) {
        if (res.status === 404) {
          showRepoStatus('저장소에 아직 일기 파일이 없어요. 먼저 Push(업로드)를 해주세요.', 'error');
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const fileData = await res.json();
      repoConfig.sha = fileData.sha || '';

      // 파일 크기가 1MB 이상인 경우 content 필드가 누락되므로 Git Blobs API를 사용하여 다운로드 (CORS 회피)
      let decoded = '';
      if (fileData.content) {
        decoded = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
      } else if (fileData.sha) {
        // Blobs API는 최대 100MB까지 지원하며 api.github.com 내에 있어 CORS 오류가 없습니다.
        const blobUrl = `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/git/blobs/${fileData.sha}`;
        const rawRes = await fetch(blobUrl, {
          headers: {
            'Authorization': `token ${repoConfig.token}`,
            'Accept': 'application/vnd.github.v3.raw' // raw 텍스트로 바로 요청
          }
        });
        if (!rawRes.ok) throw new Error('파일 다이렉트 다운로드 실패');
        decoded = await rawRes.text();
      } else {
        throw new Error('파일 내용이 비어있습니다.');
      }

      const result = parseDiaryJson(decoded);

      if (!result || !result.entries) {
        showRepoStatus('파일 형식이 올바르지 않습니다.', 'error');
        return;
      }

      diaryData = { ...diaryData, ...result.entries };
      if (result.profile) {
        profileSettings = { ...profileSettings, ...result.profile };
      }

      await persistAll();
      applyProfileSettings();
      renderCalendar();
      loadEntryForDate(selectedDateStr);
      showRepoStatus('🐙 저장소에서 불러오기 성공!', 'success');
      updateFileConnStatusUI();
    } catch (err) {
      console.error('GitHub Repo pull 실패:', err);
      showRepoStatus(`실패: ${err.message}`, 'error');
      updateFileConnStatusUI(true);
    } finally {
      // UI 복구
      if (btnManualRepoPull) {
        btnManualRepoPull.disabled = false;
        btnManualRepoPull.textContent = '저장소에서 불러오기 (Pull)';
      }
      if (btnSaveRepoConfig) btnSaveRepoConfig.disabled = false;
    }
  }

  function setupEventListeners() {
    // 수동 저장 버튼 (💾 이모지)
    btnSaveDiary.addEventListener('click', saveCurrentEntry);

    // 수정/일기 작성 토글 버튼 - 눌러야만 편집 가능
    // 주의: '작성 중' 상태(편집 모드)에서는 이 버튼을 눌러도 아무 동작도 하지 않는다.
    // 저장은 반드시 💾 저장 버튼으로만 이루어져야 하며, 편집을 끝내는 것도 저장 버튼을 통해서만 가능하다.
    btnEditToggle.addEventListener('click', () => {
      if (isEditingEntry) {
        return; // 작성 중 상태에서는 클릭해도 아무 일도 일어나지 않음
      }
      setEditMode(true);
      diaryTitleInput.focus();
    });

    // 일기 삭제 버튼
    btnDeleteDiary.addEventListener('click', deleteCurrentEntry);

    // 프로필 아이콘 클릭 시에만 프로필 설정 모달 팝업 오픈!
    brandIconDisplay.addEventListener('click', () => {
      settingDiaryName.value = profileSettings.diaryName || '몽글몽글 다이어리';
      settingCursorUrl.value = profileSettings.cursorUrl || '';
      settingSubtitle.value = profileSettings.subtitle || '';

      document.querySelectorAll('.profile-emoji-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.emoji === profileSettings.iconValue);
      });

      updateFaviconPreviewUI();

      profileSettingsModal.classList.remove('hidden');
    });

    btnPrevMonth.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });

    btnNextMonth.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });

    btnToday.addEventListener('click', () => {
      currentDate = new Date();
      selectedDateStr = formatDate(new Date());
      renderCalendar();
      loadEntryForDate(selectedDateStr);
    });

    diaryTitleInput.addEventListener('input', markAsUnsaved);
    diaryContentEditor.addEventListener('input', markAsUnsaved);
    taskInput1.addEventListener('input', markAsUnsaved);
    taskInput2.addEventListener('input', markAsUnsaved);
    taskInput3.addEventListener('input', markAsUnsaved);
    praiseInput1.addEventListener('input', markAsUnsaved);
    praiseInput2.addEventListener('input', markAsUnsaved);
    praiseInput3.addEventListener('input', markAsUnsaved);

    weatherOptions.addEventListener('click', (e) => {
      if (!isEditingEntry) return;
      const btn = e.target.closest('.pill-btn');
      if (btn) {
        weatherOptions.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        markAsUnsaved();
      }
    });

    moodOptions.addEventListener('click', (e) => {
      if (!isEditingEntry) return;
      const btn = e.target.closest('.pill-btn');
      if (btn) {
        moodOptions.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        markAsUnsaved();
      }
    });

    chkToggleTasks.addEventListener('change', () => {
      if (!isEditingEntry) { chkToggleTasks.checked = !chkToggleTasks.checked; return; }
      tasksCard.classList.toggle('hidden', !chkToggleTasks.checked);
      markAsUnsaved();
    });

    chkTogglePraise.addEventListener('change', () => {
      if (!isEditingEntry) { chkTogglePraise.checked = !chkTogglePraise.checked; return; }
      praiseCard.classList.toggle('hidden', !chkTogglePraise.checked);
      markAsUnsaved();
    });

    btnFoldTasks.addEventListener('click', () => {
      const isCollapsed = bodyTasksCard.classList.toggle('collapsed');
      btnFoldTasks.textContent = isCollapsed ? '▼ 펼치기' : '▲ 접기';
    });

    btnFoldPraise.addEventListener('click', () => {
      const isCollapsed = bodyPraiseCard.classList.toggle('collapsed');
      btnFoldPraise.textContent = isCollapsed ? '▼ 펼치기' : '▲ 접기';
    });

    // 월간 감정 통계 접기/펼치기 (평소엔 접혀있음)
    btnToggleMonthMood.addEventListener('click', () => {
      const isHidden = monthMoodPanel.classList.toggle('hidden');
      btnToggleMonthMood.textContent = isHidden ? '📅 이번 달 감정 통계 보기 ▾' : '📅 이번 달 감정 통계 접기 ▴';
    });

    profileEmojiSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.profile-emoji-btn');
      if (btn) {
        document.querySelectorAll('.profile-emoji-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        profileSettings.iconType = 'emoji';
        profileSettings.iconValue = btn.dataset.emoji;
      }
    });

    settingProfileImageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // 프로필 이미지이므로 크기는 최대 256px로 압축
          const compressedDataUrl = await compressImage(file, 256, 0.7);
          profileSettings.iconType = 'image';
          profileSettings.iconValue = compressedDataUrl;
          document.querySelectorAll('.profile-emoji-btn').forEach(b => b.classList.remove('active'));
        } catch (err) {
          console.error('Profile image compression failed:', err);
          const reader = new FileReader();
          reader.onload = (evt) => {
            profileSettings.iconType = 'image';
            profileSettings.iconValue = evt.target.result;
            document.querySelectorAll('.profile-emoji-btn').forEach(b => b.classList.remove('active'));
          };
          reader.readAsDataURL(file);
        }
      }
    });

    // 파비콘(PNG/ICO) 업로드: 브라우저 탭 아이콘으로 쓸 이미지를 파일 그대로 data URL로 읽어들인다.
    settingFaviconInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const isPng = file.type === 'image/png' || /\.png$/i.test(file.name);
      const isIco = file.type === 'image/x-icon' || file.type === 'image/vnd.microsoft.icon' || /\.ico$/i.test(file.name);
      if (!isPng && !isIco) {
        alert('PNG 또는 ICO 파일만 업로드할 수 있어요.');
        settingFaviconInput.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('파비콘 파일은 2MB 이하로 올려주세요.');
        settingFaviconInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        profileSettings.faviconUrl = evt.target.result;
        updateFaviconPreviewUI();
      };
      reader.onerror = () => {
        alert('파비콘 파일을 읽는 중 문제가 발생했어요.');
      };
      reader.readAsDataURL(file);
    });

    btnRemoveFavicon.addEventListener('click', () => {
      profileSettings.faviconUrl = '';
      settingFaviconInput.value = '';
      updateFaviconPreviewUI();
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.cursor;
        if (type === 'cat') {
          settingCursorUrl.value = 'http://cur.cursors-4u.net/animals/ani-11/ani1085.cur';
        } else if (type === 'heart') {
          settingCursorUrl.value = 'http://cur.cursors-4u.net/symbols/sym-1/sym2.cur';
        } else if (type === 'star') {
          settingCursorUrl.value = 'http://cur.cursors-4u.net/symbols/sym-7/sym654.cur';
        } else {
          settingCursorUrl.value = '';
        }
      });
    });

    btnSaveProfileSettings.addEventListener('click', () => {
      profileSettings.diaryName = settingDiaryName.value.trim() || '몽글몽글 다이어리';
      profileSettings.cursorUrl = settingCursorUrl.value.trim();
      profileSettings.subtitle = settingSubtitle.value.trim() || '오늘 하루도 고생 많았어요, 나만의 속도로 쉬어가요.';

      localStorage.setItem('diary_profile_settings', JSON.stringify(profileSettings));
      persistAll();
      applyProfileSettings();
      profileSettingsModal.classList.add('hidden');
      alert('다이어리 설정이 저장되었습니다! 🌸');
    });

    imageFileInput.addEventListener('change', async (e) => {
      if (!isEditingEntry) { imageFileInput.value = ''; return; }
      const files = Array.from(e.target.files);
      for (const file of files) {
        try {
          const compressedDataUrl = await compressImage(file);
          insertInlineImage(compressedDataUrl);
        } catch (err) {
          console.error('Image compression failed:', err);
          const reader = new FileReader();
          reader.onload = (evt) => insertInlineImage(evt.target.result);
          reader.readAsDataURL(file);
        }
      }
      imageFileInput.value = '';
    });

    diaryContentEditor.addEventListener('paste', async (e) => {
      if (!isEditingEntry) return;
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            try {
              const compressedDataUrl = await compressImage(file);
              insertInlineImage(compressedDataUrl);
            } catch (err) {
              console.error('Paste image compression failed:', err);
              const reader = new FileReader();
              reader.onload = (evt) => insertInlineImage(evt.target.result);
              reader.readAsDataURL(file);
            }
          }
        }
      }
    });

    // 창 전체 및 캔버스 영역 드래그 앤 드롭 제어 (외부 파일 삽입 & 내부 이미지 이동)
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());

    if (paperBodyWrapper) {
      paperBodyWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!isEditingEntry) {
          e.dataTransfer.dropEffect = 'none';
          return;
        }
        e.dataTransfer.dropEffect = draggedInlineImage ? 'move' : 'copy';
        paperBodyWrapper.classList.add('drag-over-active');
      });

      paperBodyWrapper.addEventListener('dragleave', (e) => {
        if (!paperBodyWrapper.contains(e.relatedTarget)) {
          paperBodyWrapper.classList.remove('drag-over-active');
        }
      });

      paperBodyWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        paperBodyWrapper.classList.remove('drag-over-active');

        // 일기 쓰기 모드가 아닌 경우에는 작동하지 않음
        if (!isEditingEntry) return;

        // 1. 이미 삽입된 이미지 위치 이동 처리
        if (draggedInlineImage) {
          const range = getDropRange(e);
          if (range && diaryContentEditor.contains(range.startContainer)) {
            if (!draggedInlineImage.contains(range.startContainer)) {
              range.insertNode(draggedInlineImage);
              selectImageElement(draggedInlineImage, 'inline');
              markAsUnsaved();
            }
          }
          draggedInlineImage = null;
          return;
        }

        // 2. 외부 이미지 파일 드래그 삽입 처리 (글쓰기 모드에서만 작동)
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length > 0) {
          const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
          if (imageFiles.length === 0) return;

          const range = getDropRange(e);

          (async () => {
            for (const file of imageFiles) {
              try {
                const compressedDataUrl = await compressImage(file);
                insertInlineImage(compressedDataUrl, range);
              } catch (err) {
                console.error('Drop image compression failed:', err);
                const reader = new FileReader();
                reader.onload = (evt) => {
                  insertInlineImage(evt.target.result, range);
                };
                reader.readAsDataURL(file);
              }
            }
          })();
        }
      });
    }

    btnClearDiary.addEventListener('click', () => {
      if (!isEditingEntry) return;
      if (confirm('현재 일기를 초기화하시겠습니까? (저장 버튼을 눌러야 확정됩니다)')) {
        diaryTitleInput.value = '';
        diaryContentEditor.innerHTML = '';
        taskInput1.value = ''; taskInput2.value = ''; taskInput3.value = '';
        praiseInput1.value = ''; praiseInput2.value = ''; praiseInput3.value = '';
        freeCanvas.innerHTML = '';
        hideImageControlPopup();
        adjustCanvasHeight();
        markAsUnsaved();
      }
    });

    btnModeInline.addEventListener('click', () => switchImageMode('inline'));
    btnModeFree.addEventListener('click', () => switchImageMode('free'));

    if (btnToggleClip) {
      btnToggleClip.addEventListener('click', () => {
        if (!activeImageObj || activeImageObj.mode !== 'free') return;
        const isClipped = activeImageObj.element.classList.toggle('clip-edge');
        btnToggleClip.classList.toggle('active', isClipped);

        if (!isClipped) {
          // 끼우기 해제 시 캔버스 영역 밖으로 벗어난 이미지를 캔버스 내부로 튕겨넣기
          const wrapper = activeImageObj.element;
          const canvasW = freeCanvas.offsetWidth;
          const imgW = wrapper.offsetWidth;
          let curLeft = wrapper.offsetLeft;
          let curTop = wrapper.offsetTop;

          let clampLeft = Math.max(0, Math.min(curLeft, Math.max(0, canvasW - imgW)));
          let clampTop = Math.max(0, curTop);

          wrapper.style.left = `${clampLeft}px`;
          wrapper.style.top = `${clampTop}px`;
          adjustCanvasHeight();
        }

        markAsUnsaved();
      });
    }

    btnRotateLeft.addEventListener('click', () => {
      if (!activeImageObj) return;
      let curr = parseFloat(activeImageObj.element.dataset.rotation || '0') - 15;
      activeImageObj.element.dataset.rotation = curr;
      activeImageObj.element.style.transform = `rotate(${curr}deg)`;
      updateControlPopupPosition();
      markAsUnsaved();
    });

    btnRotateRight.addEventListener('click', () => {
      if (!activeImageObj) return;
      let curr = parseFloat(activeImageObj.element.dataset.rotation || '0') + 15;
      activeImageObj.element.dataset.rotation = curr;
      activeImageObj.element.style.transform = `rotate(${curr}deg)`;
      updateControlPopupPosition();
      markAsUnsaved();
    });

    btnTogglePolaroid.addEventListener('click', () => {
      if (!activeImageObj) return;
      activeImageObj.element.classList.toggle('polaroid-style');
      markAsUnsaved();
    });

    btnDeleteImage.addEventListener('click', () => {
      if (!activeImageObj) return;
      activeImageObj.element.remove();
      hideImageControlPopup();
      adjustCanvasHeight();
      markAsUnsaved();
    });

    document.addEventListener('click', (e) => {
      if (
        activeImageObj &&
        !imageControlPopup.contains(e.target) &&
        !activeImageObj.element.contains(e.target)
      ) {
        hideImageControlPopup();
      }
    });

    // 햄버거 메뉴 토글
    btnHamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !hamburgerDropdown.classList.contains('hidden');
      hamburgerDropdown.classList.toggle('hidden', isOpen);
      btnHamburger.classList.toggle('is-open', !isOpen);
    });

    // 드롭다운 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!hamburgerMenuWrap.contains(e.target)) {
        hamburgerDropdown.classList.add('hidden');
        btnHamburger.classList.remove('is-open');
      }
    });

    btnConnectFile.addEventListener('click', () => {
      hamburgerDropdown.classList.add('hidden');
      btnHamburger.classList.remove('is-open');
      connectDiaryFile();
    });

    if (fileConnStatusEl) {
      fileConnStatusEl.addEventListener('click', () => {
        if (isRepoConfigured()) {
          repoTokenInput.value = repoConfig.token;
          repoOwnerInput.value = repoConfig.owner;
          repoNameInput.value = repoConfig.repo;
          repoBranchInput.value = repoConfig.branch || 'main';
          repoPathInput.value = repoConfig.path || 'diary_{year}.json';
          repoModal.classList.remove('hidden');
        } else {
          connectDiaryFile();
        }
      });
    }

    // GitHub 저장소 동기화 모달 열기
    btnRepoSync.addEventListener('click', () => {
      repoTokenInput.value = repoConfig.token;
      repoOwnerInput.value = repoConfig.owner;
      repoNameInput.value = repoConfig.repo;
      repoBranchInput.value = repoConfig.branch || 'main';
      repoPathInput.value = repoConfig.path || 'diary_{year}.json';
      repoModal.classList.remove('hidden');
      hamburgerDropdown.classList.add('hidden');
      btnHamburger.classList.remove('is-open');
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.target.dataset.close;
        if (modalId) document.getElementById(modalId).classList.add('hidden');
      });
    });

    // GitHub 저장소 설정 저장 및 Push
    btnSaveRepoConfig.addEventListener('click', () => {
      repoConfig.token = repoTokenInput.value.trim();
      repoConfig.owner = repoOwnerInput.value.trim();
      repoConfig.repo = repoNameInput.value.trim();
      repoConfig.branch = repoBranchInput.value.trim() || 'main';
      repoConfig.path = repoPathInput.value.trim() || 'diary_{year}.json';

      localStorage.setItem('diary_repo_token', repoConfig.token);
      localStorage.setItem('diary_repo_owner', repoConfig.owner);
      localStorage.setItem('diary_repo_name', repoConfig.repo);
      localStorage.setItem('diary_repo_branch', repoConfig.branch);
      localStorage.setItem('diary_repo_path', repoConfig.path);

      updateFileConnStatusUI();
      pushToRepo(true);
    });

    btnManualRepoPull.addEventListener('click', () => {
      // Pull할 때도 입력 폼의 최신 설정값을 변수 및 로컬스토리지에 저장합니다.
      repoConfig.token = repoTokenInput.value.trim();
      repoConfig.owner = repoOwnerInput.value.trim();
      repoConfig.repo = repoNameInput.value.trim();
      repoConfig.branch = repoBranchInput.value.trim() || 'main';
      repoConfig.path = repoPathInput.value.trim() || 'diary_data.json';

      localStorage.setItem('diary_repo_token', repoConfig.token);
      localStorage.setItem('diary_repo_owner', repoConfig.owner);
      localStorage.setItem('diary_repo_name', repoConfig.repo);
      localStorage.setItem('diary_repo_branch', repoConfig.branch);
      localStorage.setItem('diary_repo_path', repoConfig.path);

      pullFromRepo();
    });

    btnExport.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(buildFullExportData(), null, 2));
      const anchor = document.createElement('a');
      anchor.setAttribute("href", dataStr);
      anchor.setAttribute("download", `diary_backup_${formatDate(new Date())}.json`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      hamburgerDropdown.classList.add('hidden');
      btnHamburger.classList.remove('is-open');
    });

    btnImport.addEventListener('click', () => {
      fileImport.click();
      hamburgerDropdown.classList.add('hidden');
      btnHamburger.classList.remove('is-open');
    });

    fileImport.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const result = parseDiaryJson(evt.target.result);
          if (!result || !result.entries) {
            alert('JSON 파일 형식이 올바르지 않습니다.');
            return;
          }
          diaryData = { ...diaryData, ...result.entries };
          if (result.profile) {
            profileSettings = { ...profileSettings, ...result.profile };
          }
          persistAll();
          applyProfileSettings();
          renderCalendar();
          loadEntryForDate(selectedDateStr);
          alert('데이터를 성공적으로 불러왔습니다!');
        } catch (err) {
          alert('JSON 파일 형식이 올바르지 않습니다.');
        }
      };
      reader.readAsText(file);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
