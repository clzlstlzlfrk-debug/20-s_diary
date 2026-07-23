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

  let gistConfig = {
    token: localStorage.getItem('diary_gist_token') || '',
    id: localStorage.getItem('diary_gist_id') || ''
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
  const btnRotateLeft = document.getElementById('btnRotateLeft');
  const btnRotateRight = document.getElementById('btnRotateRight');
  const btnTogglePolaroid = document.getElementById('btnTogglePolaroid');
  const btnDeleteImage = document.getElementById('btnDeleteImage');

  const btnGistSync = document.getElementById('btnGistSync');
  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const fileImport = document.getElementById('fileImport');
  const btnConnectFile = document.getElementById('btnConnectFile');
  const fileConnStatusEl = document.getElementById('fileConnStatus');

  // 햄버거 메뉴
  const btnHamburger = document.getElementById('btnHamburger');
  const hamburgerDropdown = document.getElementById('hamburgerDropdown');
  const hamburgerMenuWrap = document.getElementById('hamburgerMenuWrap');

  const gistModal = document.getElementById('gistModal');
  const gistTokenInput = document.getElementById('gistTokenInput');
  const gistIdInput = document.getElementById('gistIdInput');
  const btnSaveGistConfig = document.getElementById('btnSaveGistConfig');
  const btnManualGistPull = document.getElementById('btnManualGistPull');
  const gistStatusMessage = document.getElementById('gistStatusMessage');

  // ==========================================================================
  // 초기화 (Initialization)
  // ==========================================================================
  async function init() {
    setupEventListeners();
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
  // 캘린더 렌더링
  // ==========================================================================
  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    calendarTitle.textContent = `${year}년 ${month + 1}월`;
    calendarGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0).getDate();

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
        const shortLabel = MOOD_LABEL_MAP[entry.mood] || '일기';
        badgeHtml = `<div class="cal-mood-badge"><span class="b-emoji">${entry.mood}</span><span class="b-label">${shortLabel}</span></div>`;
      }

      cell.innerHTML = `
        <span class="day-num">${d}</span>
        ${badgeHtml}
      `;

      if (!isFutureDate) {
        cell.addEventListener('click', () => {
          selectedDateStr = dateStr;
          renderCalendar();
          loadEntryForDate(selectedDateStr);
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
    const unit = 12; // 1건당 픽셀 높이

    container.innerHTML = buckets.map((bucket, i) => {
      const segments = MOOD_ORDER
        .filter(mood => bucket[mood])
        .map(mood => `<div class="chart-bar-seg" style="height:${bucket[mood] * unit}px; background:${MOOD_COLOR_MAP[mood]};" title="${MOOD_LABEL_MAP[mood]} ${bucket[mood]}건"></div>`)
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

    if (gistConfig.token && gistConfig.id) {
      pushToGist(false);
    }

    renderCalendar();
    loadEntryForDate(selectedDateStr);
    setSaveStatus('🗑️ 일기가 삭제되었어요', false);
  }

  // ==========================================================================
  // 수동 저장 전용 시스템
  // ==========================================================================
  function saveCurrentEntry() {
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
          polaroid: wrapper.classList.contains('polaroid-style')
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

    persistAll();

    if (gistConfig.token && gistConfig.id) {
      pushToGist(false);
    }

    renderCalendar();
    setSaveStatus('✨ 일기 저장 완료!', false);
    setEditMode(false);
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
  function renderFreeCanvasImages(freeImages) {
    freeCanvas.innerHTML = '';
    freeImages.forEach(imgData => createFreeImageElement(imgData));
  }

  function createFreeImageElement(imgData) {
    const wrapper = document.createElement('div');
    wrapper.className = `free-image-wrapper ${imgData.polaroid ? 'polaroid-style' : ''}`;
    wrapper.id = imgData.id || `free_img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    wrapper.style.left = (imgData.x || 20) + 'px';
    wrapper.style.top = (imgData.y || 20) + 'px';
    wrapper.style.width = (imgData.width || 180) + 'px';
    wrapper.style.height = imgData.height ? (imgData.height + 'px') : 'auto';

    const rotation = imgData.rotation || 0;
    wrapper.style.transform = `rotate(${rotation}deg)`;
    wrapper.dataset.rotation = rotation;
    wrapper.dataset.mode = 'free';

    const img = document.createElement('img');
    img.src = imgData.url;

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';

    wrapper.appendChild(img);
    wrapper.appendChild(resizeHandle);
    freeCanvas.appendChild(wrapper);

    makeElementDraggableAndResizable(wrapper, resizeHandle);

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

      // 캔버스 범위 내로 클램핑
      newLeft = Math.max(0, Math.min(newLeft, Math.max(0, canvasW - imgW)));
      newTop  = Math.max(0, Math.min(newTop,  Math.max(0, canvasH - imgH)));

      wrapper.style.left = `${newLeft}px`;
      wrapper.style.top  = `${newTop}px`;

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
      startX = clientX;
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
      const newW = Math.max(70, startW + (clientX - startX));
      wrapper.style.width = `${newW}px`;

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
  function insertInlineImage(url) {
    const wrap = document.createElement('span');
    wrap.className = 'diary-inline-image-wrap';
    wrap.contentEditable = 'false';
    wrap.dataset.mode = 'inline';

    const img = document.createElement('img');
    img.src = url;

    wrap.appendChild(img);

    diaryContentEditor.focus();
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
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
      wrap.onclick = (e) => {
        if (!isEditingEntry) return;
        e.stopPropagation();
        selectImageElement(wrap, 'inline');
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

    el.remove();

    if (targetMode === 'free') {
      const freeData = {
        id: `free_${Date.now()}`,
        url: imgSrc,
        x: 30,
        y: 30,
        width: 180,
        rotation: 0,
        polaroid: el.classList.contains('polaroid-style')
      };
      createFreeImageElement(freeData);
      const newEl = document.getElementById(freeData.id);
      if (newEl) selectImageElement(newEl, 'free');
    } else {
      insertInlineImage(imgSrc);
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

  // diary_data.json 파일 내용을 읽어와 프로필/일기 데이터에 반영합니다.
  async function loadFromFileHandle() {
    try {
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (!text || !text.trim()) return; // 빈 파일이면 다음 저장 때 채워짐
      const parsed = JSON.parse(text);
      if (parsed && (parsed.entries || parsed.profile)) {
        diaryData = parsed.entries || {};
        if (parsed.profile) profileSettings = { ...profileSettings, ...parsed.profile };
      } else if (parsed && typeof parsed === 'object') {
        // 예전 형식(날짜:내용 맵)과의 호환
        diaryData = parsed;
      }
      localStorage.setItem('cute_web_diary_data', JSON.stringify(diaryData));
      localStorage.setItem('diary_profile_settings', JSON.stringify(profileSettings));
    } catch (e) {
      console.error('diary_data.json 읽기 실패:', e);
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
  async function tryAutoReconnectFile() {
    if (!window.showOpenFilePicker) return;
    try {
      const handle = await idbGet(IDB_KEY);
      if (!handle) return;
      const granted = (await handle.queryPermission({ mode: 'readwrite' })) === 'granted';
      if (!granted) return; // 재확인 팝업은 사용자 클릭(파일 연결 버튼) 시에만 띄움
      fileHandle = handle;
      fileConnected = true;
      await loadFromFileHandle();
    } catch (e) {
      fileConnected = false;
    }
  }

  // 상단 [📁 diary_data.json 연결] 클릭 시: 사용자가 직접 diary_data.json을 선택합니다.
  async function connectDiaryFile() {
    if (!window.showOpenFilePicker) {
      alert('이 브라우저는 로컬 파일 자동 저장 기능을 지원하지 않아요.\nChrome, Edge 같은 브라우저 최신 버전에서 이용해주세요.\n대신 [💾 백업] 버튼으로 diary_data.json 파일을 직접 저장/불러올 수 있어요.');
      return;
    }
    try {
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
      await loadFromFileHandle();

      applyProfileSettings();
      renderCalendar();
      loadEntryForDate(selectedDateStr);

      await persistAll();
      updateFileConnStatusUI();
      alert(`'${handle.name}' 파일에 연결됐어요! 이제부터 프로필과 일기가 이 파일에 자동으로 저장됩니다. 🌸`);
    } catch (err) {
      if (err && err.name !== 'AbortError') {
        console.error(err);
        alert('파일 연결 중 문제가 발생했어요.');
      }
    }
  }

  function updateFileConnStatusUI(errorFlag) {
    if (!fileConnStatusEl) return;
    if (fileConnected) {
      fileConnStatusEl.textContent = '📁 파일 연결됨';
      fileConnStatusEl.className = 'file-conn-status connected';
      fileConnStatusEl.title = 'diary_data.json 파일에 자동 저장되고 있어요.';
    } else {
      fileConnStatusEl.textContent = errorFlag ? '⚠️ 파일 연결 끊김' : '📁 파일 미연결';
      fileConnStatusEl.className = 'file-conn-status' + (errorFlag ? ' error' : '');
      fileConnStatusEl.title = '클릭해서 diary_data.json 파일에 연결하면, 프로필과 일기가 이 파일에 자동으로 저장돼요. (현재는 브라우저에만 저장 중)';
    }
  }

  // 프로필 설정 + 모든 일기 데이터를 저장하는 단일 진입점.
  // localStorage에는 항상 캐시하고, diary_data.json에 연결돼 있으면 그 파일에도 씁니다.
  async function persistAll() {
    localStorage.setItem('cute_web_diary_data', JSON.stringify(diaryData));
    localStorage.setItem('diary_profile_settings', JSON.stringify(profileSettings));

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
  }

  // ==========================================================================
  // 서버 & Gist 동기화 (추후 서버 연동을 위해 남겨둠 — 서버가 없으면 조용히 무시됨)
  // ==========================================================================
  async function loadDiaryData() {
    if (!fileConnected) {
      const local = localStorage.getItem('cute_web_diary_data');
      if (local) {
        try { diaryData = JSON.parse(local); } catch (e) {}
      }
      const localProfile = localStorage.getItem('diary_profile_settings');
      if (localProfile) {
        try { profileSettings = { ...profileSettings, ...JSON.parse(localProfile) }; } catch (e) {}
      }
    }

    try {
      const res = await fetch('/api/diary');
      if (res.ok) {
        const serverData = await res.json();
        if (serverData && Object.keys(serverData).length > 0) {
          diaryData = { ...diaryData, ...serverData };
          localStorage.setItem('cute_web_diary_data', JSON.stringify(diaryData));
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

  async function pushToGist(showFeedback = true) {
    if (!gistConfig.token) return;
    if (showFeedback) showGistStatus('Gist 저장 중...', '');

    try {
      const payload = {
        description: '웹 다이어리 백업',
        files: { 'diary_data.json': { content: JSON.stringify(buildFullExportData(), null, 2) } }
      };

      let url = 'https://api.github.com/gists';
      let method = 'POST';
      if (gistConfig.id) {
        url += `/${gistConfig.id}`;
        method = 'PATCH';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `token ${gistConfig.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!gistConfig.id && data.id) {
        gistConfig.id = data.id;
        localStorage.setItem('diary_gist_id', data.id);
        gistIdInput.value = data.id;
      }

      if (showFeedback) showGistStatus('☁️ Gist 동기화 완료!', 'success');
    } catch (err) {
      if (showFeedback) showGistStatus(`실패: ${err.message}`, 'error');
    }
  }

  async function pullFromGist() {
    if (!gistConfig.token || !gistConfig.id) return;
    showGistStatus('Gist 불러오는 중...', '');

    try {
      const res = await fetch(`https://api.github.com/gists/${gistConfig.id}`, {
        headers: {
          'Authorization': `token ${gistConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const file = data.files['diary_data.json'];
      if (file && file.content) {
        const parsed = JSON.parse(file.content);
        if (parsed && (parsed.entries || parsed.profile)) {
          diaryData = { ...diaryData, ...(parsed.entries || {}) };
          if (parsed.profile) profileSettings = { ...profileSettings, ...parsed.profile };
        } else {
          diaryData = { ...diaryData, ...parsed };
        }
        await persistAll();
        applyProfileSettings();
        renderCalendar();
        loadEntryForDate(selectedDateStr);
        showGistStatus('☁️ Gist 불러오기 성공!', 'success');
      }
    } catch (err) {
      showGistStatus(`실패: ${err.message}`, 'error');
    }
  }

  function showGistStatus(msg, type) {
    gistStatusMessage.textContent = msg;
    gistStatusMessage.className = `gist-status ${type}`;
  }

  // ==========================================================================
  // 이벤트 바인딩 (Event Listeners Setup)
  // ==========================================================================
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

    settingProfileImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          profileSettings.iconType = 'image';
          profileSettings.iconValue = evt.target.result;
          document.querySelectorAll('.profile-emoji-btn').forEach(b => b.classList.remove('active'));
        };
        reader.readAsDataURL(file);
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

    imageFileInput.addEventListener('change', (e) => {
      if (!isEditingEntry) { imageFileInput.value = ''; return; }
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (evt) => insertInlineImage(evt.target.result);
        reader.readAsDataURL(file);
      });
      imageFileInput.value = '';
    });

    diaryContentEditor.addEventListener('paste', (e) => {
      if (!isEditingEntry) return;
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (evt) => insertInlineImage(evt.target.result);
          reader.readAsDataURL(item.getAsFile());
        }
      }
    });

    btnClearDiary.addEventListener('click', () => {
      if (!isEditingEntry) return;
      if (confirm('현재 일기를 초기화하시겠습니까? (저장 버튼을 눌러야 확정됩니다)')) {
        diaryTitleInput.value = '';
        diaryContentEditor.innerHTML = '';
        taskInput1.value = ''; taskInput2.value = ''; taskInput3.value = '';
        praiseInput1.value = ''; praiseInput2.value = ''; praiseInput3.value = '';
        freeCanvas.innerHTML = '';
        hideImageControlPopup();
        markAsUnsaved();
      }
    });

    btnModeInline.addEventListener('click', () => switchImageMode('inline'));
    btnModeFree.addEventListener('click', () => switchImageMode('free'));

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
        if (!fileConnected) connectDiaryFile();
      });
    }

    btnGistSync.addEventListener('click', () => {
      gistTokenInput.value = gistConfig.token;
      gistIdInput.value = gistConfig.id;
      gistModal.classList.remove('hidden');
      hamburgerDropdown.classList.add('hidden');
      btnHamburger.classList.remove('is-open');
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.target.dataset.close;
        if (modalId) document.getElementById(modalId).classList.add('hidden');
      });
    });

    btnSaveGistConfig.addEventListener('click', () => {
      gistConfig.token = gistTokenInput.value.trim();
      gistConfig.id = gistIdInput.value.trim();
      localStorage.setItem('diary_gist_token', gistConfig.token);
      localStorage.setItem('diary_gist_id', gistConfig.id);
      pushToGist(true);
    });

    btnManualGistPull.addEventListener('click', () => pullFromGist());

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
          const parsed = JSON.parse(evt.target.result);
          if (parsed && (parsed.entries || parsed.profile)) {
            diaryData = { ...diaryData, ...(parsed.entries || {}) };
            if (parsed.profile) profileSettings = { ...profileSettings, ...parsed.profile };
          } else {
            diaryData = { ...diaryData, ...parsed };
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
