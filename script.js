const STORAGE_KEY = "month-at-a-glance-state";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const priorityOrder = { High: 3, Medium: 2, Low: 1 };

const defaultState = {
  viewDate: new Date(),
  selectedDate: new Date(),
  events: [
    {
      id: crypto.randomUUID(),
      name: "Math project due",
      date: isoDate(offsetDate(new Date(), 2)),
      folderId: "school",
      priority: "High",
    },
    {
      id: crypto.randomUUID(),
      name: "Soccer practice",
      date: isoDate(offsetDate(new Date(), 5)),
      folderId: "sports",
      priority: "Medium",
    },
    {
      id: crypto.randomUUID(),
      name: "Robotics club",
      date: isoDate(offsetDate(new Date(), 1)),
      folderId: "school",
      priority: "Medium",
      recurrence: {
        type: "weekly",
        days: [1, 3, 5],
      },
    },
    {
      id: crypto.randomUUID(),
      name: "Grandma's birthday",
      date: isoDate(offsetDate(new Date(), 8)),
      folderId: "birthdays",
      priority: "High",
    },
    {
      id: crypto.randomUUID(),
      name: "Team meeting",
      date: isoDate(offsetDate(new Date(), 11)),
      folderId: "meetings",
      priority: "Low",
    },
  ],
  folders: [
    { id: "school", name: "School Clubs", color: "#5b8cff" },
    { id: "sports", name: "Sports", color: "#2dbd7e" },
    { id: "birthdays", name: "Birthdays", color: "#ff7a59" },
    { id: "meetings", name: "Meetings", color: "#f2b84b" },
  ],
};

const sharedState = loadSharedStateFromUrl();
const sharedMode = Boolean(sharedState);
const state = sharedMode ? sharedState : loadState();
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const els = {
  heroEyebrow: document.getElementById("heroEyebrow"),
  heroTitle: document.getElementById("heroTitle"),
  heroLede: document.getElementById("heroLede"),
  heroActions: document.getElementById("heroActions"),
  monthLabel: document.getElementById("monthLabel"),
  monthSubtitle: document.getElementById("monthSubtitle"),
  monthSelect: document.getElementById("monthSelect"),
  yearSelect: document.getElementById("yearSelect"),
  calendarGrid: document.getElementById("calendarGrid"),
  weekdayRow: document.getElementById("weekdayRow"),
  selectedDayCard: document.getElementById("selectedDayCard"),
  selectedDayDetails: document.getElementById("selectedDayDetails"),
  selectedDatePill: document.getElementById("selectedDatePill"),
  folderCard: document.getElementById("folderCard"),
  folderList: document.getElementById("folderList"),
  folderCount: document.getElementById("folderCount"),
  eventModalBackdrop: document.getElementById("eventModalBackdrop"),
  eventForm: document.getElementById("eventForm"),
  eventName: document.getElementById("eventName"),
  eventDate: document.getElementById("eventDate"),
  eventPriority: document.getElementById("eventPriority"),
  repeatWeekly: document.getElementById("repeatWeekly"),
  recurrenceDays: document.getElementById("recurrenceDays"),
  weekdayChipGrid: document.getElementById("weekdayChipGrid"),
  eventFolder: document.getElementById("eventFolder"),
  newFolderName: document.getElementById("newFolderName"),
  newFolderColor: document.getElementById("newFolderColor"),
  addEventBtn: document.getElementById("addEventBtn"),
  shareUrlBtn: document.getElementById("shareUrlBtn"),
  todayBtn: document.getElementById("todayBtn"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  cancelEventBtn: document.getElementById("cancelEventBtn"),
  shareModalBackdrop: document.getElementById("shareModalBackdrop"),
  closeShareModalBtn: document.getElementById("closeShareModalBtn"),
  cancelShareBtn: document.getElementById("cancelShareBtn"),
  copyShareUrlBtn: document.getElementById("copyShareUrlBtn"),
  sharePageName: document.getElementById("sharePageName"),
  shareFolderList: document.getElementById("shareFolderList"),
  shareUrlOutput: document.getElementById("shareUrlOutput"),
  shareStatus: document.getElementById("shareStatus"),
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function init() {
  renderWeekdays();
  populateMonthYearControls();
  syncMonthViewToTodayIfNeeded();
  configureViewMode();
  bindEvents();
  if (sharedMode) {
    renderShareFolderList();
    updateShareOutput();
  }
  renderAll();
}

function bindEvents() {
  if (!sharedMode) {
    on(els.addEventBtn, "click", openModal);
    on(els.shareUrlBtn, "click", openShareModal);
    on(els.eventForm, "submit", handleSubmit);
    on(els.repeatWeekly, "change", handleRepeatWeeklyToggle);
    on(els.eventDate, "change", handleRecurringDateHint);
    on(els.closeShareModalBtn, "click", closeShareModal);
    on(els.cancelShareBtn, "click", closeShareModal);
    on(els.copyShareUrlBtn, "click", handleCopyShareUrl);
    on(els.shareFolderList, "change", updateShareOutput);
    on(els.sharePageName, "input", updateShareOutput);
    on(els.shareModalBackdrop, "click", (event) => {
      if (event.target === els.shareModalBackdrop) closeShareModal();
    });
  }

  on(els.todayBtn, "click", () => {
    state.viewDate = new Date();
    state.selectedDate = new Date();
    renderAll();
    persist();
  });
  on(els.monthSelect, "change", handleMonthYearChange);
  on(els.yearSelect, "change", handleMonthYearChange);
  on(els.prevMonthBtn, "click", () => {
    state.viewDate = addMonths(state.viewDate, -1);
    renderAll();
    persist();
  });
  on(els.nextMonthBtn, "click", () => {
    state.viewDate = addMonths(state.viewDate, 1);
    renderAll();
    persist();
  });
  on(els.closeModalBtn, "click", closeModal);
  on(els.cancelEventBtn, "click", closeModal);
  on(els.eventModalBackdrop, "click", (event) => {
    if (event.target === els.eventModalBackdrop) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
    if (event.key === "Escape" && els.shareModalBackdrop && !els.shareModalBackdrop.classList.contains("hidden")) {
      closeShareModal();
    }
  });
}

function renderAll() {
  renderMonth();
  renderCalendar();
  renderSelectedDay();
  if (!sharedMode) {
    renderFolders();
    fillFolderSelect();
  }
}

function renderWeekdays() {
  els.weekdayRow.innerHTML = weekdayLabels
    .map((day) => `<div class="weekday">${day}</div>`)
    .join("");
}

function renderMonth() {
  const monthStart = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth(), 1);
  const monthName = monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  els.monthLabel.textContent = monthName;
  els.monthSubtitle.textContent = sharedMode
    ? "Hidden events stay out of the link, and disguised ones use simple labels."
    : "Color tabs keep each plan easy to spot.";
  if (els.monthSelect) {
    els.monthSelect.value = String(monthStart.getMonth());
  }
  if (els.yearSelect) {
    els.yearSelect.value = String(monthStart.getFullYear());
  }
}

function renderCalendar() {
  const monthStart = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth(), 1);
  const monthEnd = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 0);
  const firstGridDay = startOfWeek(monthStart);
  const lastGridDay = endOfWeek(monthEnd);
  const today = startOfDay(new Date());
  const selected = startOfDay(state.selectedDate);

  const cells = [];
  for (let day = new Date(firstGridDay); day <= lastGridDay; day = addDays(day, 1)) {
    const iso = isoDate(day);
    const dayEvents = getEventsForDate(day).sort((a, b) => {
      const diff = getPriorityScore(b) - getPriorityScore(a);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
    const isToday = iso === isoDate(today);
    const isSelected = iso === isoDate(selected);
    const isOutside = day.getMonth() !== monthStart.getMonth();
    const preview = dayEvents.slice(0, 3);
    const extraCount = Math.max(0, dayEvents.length - preview.length);

    cells.push(`
      <button
        type="button"
        class="day ${isOutside ? "outside-month" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}"
        data-date="${iso}"
        aria-label="${formatLongDate(day)}"
      >
        <div class="day-number">
          <span>${day.getDate()}</span>
          ${isToday ? '<span class="pill">Today</span>' : ""}
        </div>
        <div class="event-stacks">
          ${preview
            .map((event) => {
              const eventColor = getEventColor(event);
              return `
                <div class="event-pill" title="${escapeHtml(getEventLabel(event))}">
                  <span class="event-dot" style="background:${eventColor}"></span>
                  <span>${escapeHtml(getEventLabel(event))}</span>
                </div>
              `;
            })
            .join("")}
          ${extraCount > 0 ? `<div class="event-more">+${extraCount} more</div>` : ""}
        </div>
      </button>
    `);
  }

  els.calendarGrid.innerHTML = cells.join("");
  els.calendarGrid.querySelectorAll(".day").forEach((button) => {
    button.addEventListener("click", () => {
      const pickedDate = parseDateInput(button.dataset.date);
      state.selectedDate = pickedDate;
      if (pickedDate.getMonth() !== state.viewDate.getMonth()) {
        state.viewDate = pickedDate;
      }
      renderAll();
      persist();
    });
  });
}

function renderSelectedDay() {
  const date = startOfDay(state.selectedDate);
  const dateKey = isoDate(date);
  const dayEvents = getEventsForDate(date).sort((a, b) => {
    const diff = getPriorityScore(b) - getPriorityScore(a);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  els.selectedDatePill.textContent = formatShortDate(date);

  if (!dayEvents.length) {
    els.selectedDayDetails.innerHTML = sharedMode
      ? `<p class="muted">No shared plans on this day.</p>`
      : `
      <p class="muted">No events on this day yet.</p>
      <button class="primary" type="button" id="quickAddBtn">Add an event for this day</button>
    `;
    if (!sharedMode) {
      on(document.getElementById("quickAddBtn"), "click", () => openModal(dateKey));
    }
    return;
  }

  els.selectedDayDetails.innerHTML = dayEvents
    .map((event) => {
      const recurrenceLabel = event.recurrence ? `Repeats ${formatWeekdayList(event.recurrence.days)}` : "One-time event";
      const eventColor = getEventColor(event);
      const eventLabel = getEventLabel(event);
      return `
        <div class="detail-card">
          <div class="detail-top">
            <div>
              <div class="detail-name">${escapeHtml(eventLabel)}</div>
              <div class="detail-meta">${sharedMode ? "Shared plan" : `${escapeHtml(getFolderName(event.folderId))} · ${event.priority}`}</div>
            </div>
            <span class="pill" style="color:${eventColor}; background:${withAlpha(eventColor, 0.12)}">
              ${sharedMode ? "Shared" : event.priority}
            </span>
          </div>
          <div class="detail-meta">${escapeHtml(recurrenceLabel)}</div>
          <div class="detail-actions">
            <div class="detail-meta">${sharedMode ? "Included in the shared schedule" : `Planned for ${formatLongDate(date)}`}</div>
            ${
              sharedMode
                ? ""
                : `<button class="ghost danger" type="button" data-delete-event="${event.id}">
              ${event.recurrence ? "Delete series" : "Delete event"}
            </button>`
            }
          </div>
        </div>
      `;
    })
    .join("");

  if (!sharedMode) {
    els.selectedDayDetails.querySelectorAll("[data-delete-event]").forEach((button) => {
      button.addEventListener("click", () => deleteEvent(button.dataset.deleteEvent));
    });
  }
}

function renderFolders() {
  const counts = countEventsByFolder();
  els.folderCount.textContent = `${state.folders.length} folder${state.folders.length === 1 ? "" : "s"}`;
  els.folderList.innerHTML = state.folders
    .map((folder) => {
      const count = counts.get(folder.id) ?? 0;
      return `
        <div class="folder-row">
          <span class="folder-swatch" style="background:${folder.color}"></span>
          <span class="folder-name">${escapeHtml(folder.name)}</span>
          <span class="folder-count">${count} event${count === 1 ? "" : "s"}</span>
        </div>
      `;
    })
    .join("");
}

function fillFolderSelect() {
  if (sharedMode) return;
  const currentValue = els.eventFolder.value || state.folders[0]?.id || "";
  els.eventFolder.innerHTML = state.folders
    .map((folder) => `<option value="${folder.id}">${escapeHtml(folder.name)}</option>`)
    .join("");
  els.eventFolder.value = state.folders.some((folder) => folder.id === currentValue)
    ? currentValue
    : state.folders[0]?.id ?? "";
}

function handleSubmit(event) {
  event.preventDefault();
  const name = els.eventName.value.trim();
  const date = els.eventDate.value;
  const priority = els.eventPriority.value;
  let folderId = els.eventFolder.value;
  const newFolderName = els.newFolderName.value.trim();
  const newFolderColor = els.newFolderColor.value;
  const repeatWeekly = els.repeatWeekly.checked;
  const recurrenceDays = repeatWeekly
    ? Array.from(els.weekdayChipGrid.querySelectorAll('input[type="checkbox"]:checked')).map((input) => Number(input.value))
    : [];

  if (repeatWeekly && recurrenceDays.length === 0) {
    window.alert("Choose at least one day for the weekly repeat.");
    return;
  }

  if (newFolderName) {
    const folder = {
      id: slugify(`${newFolderName}-${Date.now()}`),
      name: newFolderName,
      color: newFolderColor,
    };
    state.folders.push(folder);
    folderId = folder.id;
  }

  state.events.push({
    id: crypto.randomUUID(),
    name,
    date,
    folderId,
    priority,
    ...(repeatWeekly
      ? {
          recurrence: {
            type: "weekly",
            days: recurrenceDays,
          },
        }
      : {}),
  });

  const pickedDate = parseDateInput(date);
  state.selectedDate = pickedDate;
  state.viewDate = pickedDate;
  els.eventForm.reset();
  els.eventPriority.value = "Medium";
  els.newFolderColor.value = "#5b8cff";
  closeModal();
  renderAll();
  persist();
}

function openModal(prefillDate = isoDate(startOfDay(state.selectedDate))) {
  els.eventDate.value = prefillDate;
  els.eventName.value = "";
  els.eventPriority.value = "Medium";
  els.newFolderName.value = "";
  els.newFolderColor.value = "#5b8cff";
  els.repeatWeekly.checked = false;
  toggleRecurrenceControls(false);
  clearRecurrenceDays();
  fillFolderSelect();
  els.eventModalBackdrop.classList.remove("hidden");
  els.eventModalBackdrop.setAttribute("aria-hidden", "false");
  window.requestAnimationFrame(() => els.eventName.focus());
}

function closeModal() {
  els.eventModalBackdrop.classList.add("hidden");
  els.eventModalBackdrop.setAttribute("aria-hidden", "true");
}

function openShareModal() {
  renderShareFolderList();
  updateShareOutput();
  els.shareModalBackdrop.classList.remove("hidden");
  els.shareModalBackdrop.setAttribute("aria-hidden", "false");
}

function closeShareModal() {
  els.shareModalBackdrop.classList.add("hidden");
  els.shareModalBackdrop.setAttribute("aria-hidden", "true");
  setShareStatus("");
}

function renderShareFolderList() {
  if (!els.shareFolderList) return;

  const eventsByFolder = groupEventsByFolder();
  els.shareFolderList.innerHTML = state.folders
    .map((folder) => {
      const folderEvents = eventsByFolder.get(folder.id) ?? [];
      return `
        <details class="share-folder-card" open data-share-folder-row data-folder-id="${folder.id}">
          <summary class="share-folder-summary">
            <span class="folder-summary-left">
              <span class="folder-swatch" style="background:${folder.color}"></span>
              <span>
                <span class="share-folder-title">${escapeHtml(folder.name)}</span>
                <span class="share-folder-meta">${folderEvents.length} event${folderEvents.length === 1 ? "" : "s"}</span>
              </span>
            </span>
            <select aria-label="Visibility for ${escapeHtml(folder.name)} folder">
              <option value="show" selected>Show</option>
              <option value="hide">Hide</option>
            </select>
          </summary>
          <div class="share-folder-body">
            <p class="share-folder-note">Open this section if you want to override a specific event inside the folder.</p>
            <div class="share-event-list">
              ${folderEvents
                .map((event) => {
                  const recurrenceLabel = event.recurrence ? `Repeats ${formatWeekdayList(event.recurrence.days)}` : "Single event";
                  return `
                    <div class="share-row" data-share-event-row data-event-id="${event.id}">
                      <div>
                        <div class="share-row-title">${escapeHtml(event.name)}</div>
                        <div class="share-row-meta">${escapeHtml(formatLongDate(parseDateInput(event.date)))} · ${escapeHtml(recurrenceLabel)}</div>
                      </div>
                      <select aria-label="Visibility for ${escapeHtml(event.name)}">
                        <option value="inherit" selected>Folder default</option>
                        <option value="show">Show</option>
                        <option value="disguise">Disguise</option>
                        <option value="hide">Hide</option>
                      </select>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        </details>
      `;
    })
    .join("");
}

function updateShareOutput() {
  if (!els.shareUrlOutput) return;
  const url = createShareUrl();
  els.shareUrlOutput.value = url;
  setShareStatus("Pick folder visibility, set any event overrides, then copy the link.");
}

async function handleCopyShareUrl() {
  const url = createShareUrl();
  els.shareUrlOutput.value = url;
  try {
    await navigator.clipboard.writeText(url);
    setShareStatus("Copied share URL to clipboard.");
  } catch {
    els.shareUrlOutput.focus();
    els.shareUrlOutput.select();
    const copied = document.execCommand && document.execCommand("copy");
    if (copied) {
      setShareStatus("Copied share URL to clipboard.");
    } else {
      setShareStatus("Copy failed, but the link is selected for manual copy.");
    }
  }
}

function createShareUrl() {
  const payload = buildSharePayload();
  const url = new URL(window.location.href);
  url.searchParams.set("shared", "1");
  url.searchParams.set("name", payload.pageName);
  url.searchParams.set("schedule", JSON.stringify(payload));
  return `${url.origin}${url.pathname}?${url.searchParams.toString()}`;
}

function buildSharePayload() {
  const folderVisibilityById = new Map(
    Array.from(els.shareFolderList?.querySelectorAll("[data-share-folder-row]") ?? []).map((row) => [
      row.dataset.folderId,
      row.querySelector("select")?.value ?? "show",
    ]),
  );

  const eventVisibilityById = new Map(
    Array.from(els.shareFolderList?.querySelectorAll("[data-share-event-row]") ?? []).map((row) => [
      row.dataset.eventId,
      row.querySelector("select")?.value ?? "inherit",
    ]),
  );

  const pageName = (els.sharePageName?.value || "").trim() || "Shared schedule";

  return {
    version: 1,
    pageName,
    viewDate: isoDate(state.viewDate),
    selectedDate: isoDate(state.selectedDate),
    events: state.events.flatMap((event) => {
      const folderVisibility = folderVisibilityById.get(event.folderId) ?? "show";
      const eventVisibility = eventVisibilityById.get(event.id) ?? "inherit";
      const resolvedVisibility = eventVisibility === "inherit" ? folderVisibility : eventVisibility;
      if (resolvedVisibility === "hide") return [];
      const color = getFolderById(event.folderId)?.color ?? "#5b8cff";
      return [
        {
          date: event.date,
          name: resolvedVisibility === "disguise" ? "Busy" : event.name,
          color,
          recurrence: normalizeRecurrence(event.recurrence),
        },
      ];
    }),
  };
}

function setShareStatus(message) {
  if (els.shareStatus) {
    els.shareStatus.textContent = message;
  }
}

function handleMonthYearChange() {
  const month = Number(els.monthSelect.value);
  const year = Number(els.yearSelect.value);
  state.viewDate = new Date(year, month, 1);
  state.selectedDate = new Date(year, month, 1);
  renderAll();
  persist();
}

function handleRepeatWeeklyToggle() {
  toggleRecurrenceControls(els.repeatWeekly.checked);
  if (els.repeatWeekly.checked) {
    const currentWeekday = parseDateInput(els.eventDate.value || isoDate(startOfDay(state.selectedDate))).getDay();
    const selectedDays = Array.from(els.weekdayChipGrid.querySelectorAll('input[type="checkbox"]:checked'));
    if (selectedDays.length === 0) {
      setWeekdayChecks([currentWeekday]);
    }
  }
}

function handleRecurringDateHint() {
  if (!els.repeatWeekly.checked) return;
  const weekday = parseDateInput(els.eventDate.value).getDay();
  const selectedDays = Array.from(els.weekdayChipGrid.querySelectorAll('input[type="checkbox"]:checked'));
  if (selectedDays.length === 0) {
    setWeekdayChecks([weekday]);
  }
}

function configureViewMode() {
  document.body.classList.toggle("shared-mode", sharedMode);
  if (sharedMode) {
    document.title = `${state.shareName ?? "Shared schedule"} - Month at a Glance`;
    if (els.heroEyebrow) els.heroEyebrow.textContent = "Shared Schedule";
    if (els.heroTitle) els.heroTitle.textContent = state.shareName ?? "Shared schedule";
    if (els.heroLede) {
      els.heroLede.textContent = "Hidden events stay out of the link and disguised events use simple labels so the shared schedule stays private and easy to scan.";
    }
    if (els.selectedDayCard) {
      els.selectedDayCard.classList.add("shared-card");
    }
  } else {
    document.title = "Month at a Glance";
    if (els.heroEyebrow) els.heroEyebrow.textContent = "Month at a Glance";
    if (els.heroTitle) els.heroTitle.textContent = "See the whole month in one quick view.";
    if (els.heroLede) {
      els.heroLede.textContent = "Track school clubs, sports, birthdays, and meetings with color-coded tabs that are easy to scan at a glance.";
    }
  }
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      viewDate: new Date(),
      selectedDate: new Date(),
      events: Array.isArray(parsed.events) ? parsed.events : defaultState.events,
      folders: Array.isArray(parsed.folders) && parsed.folders.length ? parsed.folders : defaultState.folders,
    };
  } catch {
    return defaultState;
  }
}

function loadSharedStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("shared") !== "1") {
    return null;
  }

  const raw = params.get("schedule");
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const viewDate = parseDateInput(parsed.viewDate ?? isoDate(new Date()));
    const selectedDate = parseDateInput(parsed.selectedDate ?? parsed.viewDate ?? isoDate(viewDate));
    const pageName = typeof parsed.pageName === "string" && parsed.pageName.trim()
      ? parsed.pageName.trim()
      : (params.get("name") || "Shared schedule").trim() || "Shared schedule";
    const events = Array.isArray(parsed.events)
      ? parsed.events
          .filter((event) => event && typeof event.date === "string" && typeof event.name === "string")
          .map((event) => ({
            id: crypto.randomUUID(),
            date: event.date,
            name: event.name,
            color: typeof event.color === "string" ? event.color : "#5b8cff",
            recurrence: normalizeRecurrence(event.recurrence),
          }))
      : [];

    return {
      viewDate,
      selectedDate,
      shareName: pageName,
      events,
      folders: [],
    };
  } catch {
    return null;
  }
}

function persist() {
  if (sharedMode) return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      viewDate: state.viewDate.toISOString(),
      selectedDate: state.selectedDate.toISOString(),
      events: state.events,
      folders: state.folders,
    }),
  );
}

function syncMonthViewToTodayIfNeeded() {
  if (!(state.viewDate instanceof Date) || Number.isNaN(state.viewDate.getTime())) {
    state.viewDate = new Date();
  }
  if (!(state.selectedDate instanceof Date) || Number.isNaN(state.selectedDate.getTime())) {
    state.selectedDate = new Date();
  }
}

function populateMonthYearControls() {
  const today = new Date();
  const currentYear = today.getFullYear();

  if (els.monthSelect && els.monthSelect.options.length === 0) {
    els.monthSelect.innerHTML = monthNames
      .map((label, index) => `<option value="${index}">${label}</option>`)
      .join("");
  }

  if (els.yearSelect && els.yearSelect.options.length === 0) {
    const years = [];
    for (let year = currentYear - 50; year <= currentYear + 50; year += 1) {
      years.push(year);
    }
    els.yearSelect.innerHTML = years.map((year) => `<option value="${year}">${year}</option>`).join("");
  }

  if (els.monthSelect) {
    els.monthSelect.value = String(today.getMonth());
  }
  if (els.yearSelect) {
    els.yearSelect.value = String(currentYear);
  }
}

function getEventsForDate(date) {
  const dateKey = isoDate(date);
  return state.events.flatMap((event) => {
    if (!event.recurrence) {
      return event.date === dateKey ? [event] : [];
    }

    if (event.recurrence.type === "weekly" && matchesWeeklyRecurrence(event, date)) {
      return [{ ...event, occurrenceDate: dateKey }];
    }

    return [];
  });
}

function groupEventsByFolder() {
  return state.events.reduce((acc, event) => {
    const list = acc.get(event.folderId) ?? [];
    list.push(event);
    acc.set(event.folderId, list);
    return acc;
  }, new Map());
}

function getEventLabel(event) {
  return event.name;
}

function getEventColor(event) {
  if (sharedMode) {
    return event.color ?? "#5b8cff";
  }

  return getFolderById(event.folderId)?.color ?? "#5b8cff";
}

function getPriorityScore(event) {
  return priorityOrder[event.priority] ?? 0;
}

function getFolderName(folderId) {
  return getFolderById(folderId)?.name ?? "Folder removed";
}

function normalizeRecurrence(recurrence) {
  if (!recurrence || recurrence.type !== "weekly" || !Array.isArray(recurrence.days)) {
    return null;
  }

  const days = recurrence.days
    .map((day) => Number(day))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);

  return days.length ? { type: "weekly", days: [...new Set(days)].sort((a, b) => a - b) } : null;
}

function countEventsByFolder() {
  return state.events.reduce((acc, event) => {
    acc.set(event.folderId, (acc.get(event.folderId) ?? 0) + 1);
    return acc;
  }, new Map());
}

function getFolderById(folderId) {
  return state.folders.find((folder) => folder.id === folderId);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function startOfWeek(date) {
  return addDays(startOfDay(date), -startOfDay(date).getDay());
}

function endOfWeek(date) {
  return addDays(startOfDay(date), 6 - startOfDay(date).getDay());
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function offsetDate(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDateInput(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function matchesWeeklyRecurrence(event, date) {
  const recurrenceDays = event.recurrence?.days ?? [];
  if (!recurrenceDays.length) return false;

  const occurrenceDate = startOfDay(date);
  const startDate = startOfDay(parseDateInput(event.date));
  if (occurrenceDate < startDate) return false;

  return recurrenceDays.includes(occurrenceDate.getDay());
}

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatLongDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatWeekdayList(days) {
  const orderedDays = [...days].sort((a, b) => a - b);
  return orderedDays.map((day) => weekdayLabels[day]).join(", ");
}

function withAlpha(hex, alpha) {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const int = Number.parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `folder-${Date.now()}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function on(element, eventName, handler) {
  if (element) {
    element.addEventListener(eventName, handler);
  }
}

function deleteEvent(eventId) {
  const event = state.events.find((item) => item.id === eventId);
  if (!event) return;

  const message = event.recurrence
    ? `Delete the recurring series "${event.name}"? This removes it from all months.`
    : `Delete "${event.name}" from the calendar?`;

  if (!window.confirm(message)) return;

  state.events = state.events.filter((item) => item.id !== eventId);
  renderAll();
  persist();
}

function toggleRecurrenceControls(enabled) {
  if (!els.recurrenceDays) return;
  els.recurrenceDays.classList.toggle("hidden", !enabled);
}

function clearRecurrenceDays() {
  setWeekdayChecks([]);
}

function setWeekdayChecks(days) {
  const daySet = new Set(days);
  els.weekdayChipGrid.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = daySet.has(Number(input.value));
  });
}
