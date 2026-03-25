// Version #33 Mar 24, 2026 2:05 PM

(function () {
  "use strict";

  const STORAGE_KEY = "tripBudgetTrackerData_v25";

  const appState = {
    currency: "EUR",
    numberOfDays: 40,
    dayNumber: "D1",
    foodBudget: 1500,
    accommodationBudget: 900,
    foodEntries: [],
    accommodationEntries: []
  };

  const els = {
    currencySelect: document.getElementById("currencySelect"),
    daysInput: document.getElementById("daysInput"),
    dayNumberInput: document.getElementById("dayNumberInput"),
    prevDayBtn: document.getElementById("prevDayBtn"),
    nextDayBtn: document.getElementById("nextDayBtn"),

    foodHeadingText: document.getElementById("foodHeadingText"),
    foodHeadingDate: document.getElementById("foodHeadingDate"),
    foodBudgetInput: document.getElementById("foodBudgetInput"),
    foodStartingDaily: document.getElementById("foodStartingDaily"),
    foodRemainingBudget: document.getElementById("foodRemainingBudget"),
    foodRemainingDaily: document.getElementById("foodRemainingDaily"),
    foodSpentTodayLabel: document.getElementById("foodSpentTodayLabel"),
    foodSpentToday: document.getElementById("foodSpentToday"),
    foodEntryHeading: document.getElementById("foodEntryHeading"),
    foodEditStatus: document.getElementById("foodEditStatus"),
    foodTypeSelect: document.getElementById("foodTypeSelect"),
    foodAmountInput: document.getElementById("foodAmountInput"),
    foodNoteInput: document.getElementById("foodNoteInput"),
    addFoodBtn: document.getElementById("addFoodBtn"),
    cancelFoodEditBtn: document.getElementById("cancelFoodEditBtn"),
    foodEntriesList: document.getElementById("foodEntriesList"),

    accommodationHeadingText: document.getElementById("accommodationHeadingText"),
    accommodationHeadingDate: document.getElementById("accommodationHeadingDate"),
    accommodationBudgetInput: document.getElementById("accommodationBudgetInput"),
    accommodationStartingDaily: document.getElementById("accommodationStartingDaily"),
    accommodationRemainingBudget: document.getElementById("accommodationRemainingBudget"),
    accommodationRemainingDaily: document.getElementById("accommodationRemainingDaily"),
    accommodationSpentTodayLabel: document.getElementById("accommodationSpentTodayLabel"),
    accommodationSpentToday: document.getElementById("accommodationSpentToday"),
    accommodationEntryHeading: document.getElementById("accommodationEntryHeading"),
    accommodationEditStatus: document.getElementById("accommodationEditStatus"),
    accommodationTypeSelect: document.getElementById("accommodationTypeSelect"),
    accommodationAmountInput: document.getElementById("accommodationAmountInput"),
    accommodationNoteInput: document.getElementById("accommodationNoteInput"),
    addAccommodationBtn: document.getElementById("addAccommodationBtn"),
    cancelAccommodationEditBtn: document.getElementById("cancelAccommodationEditBtn"),
    accommodationEntriesList: document.getElementById("accommodationEntriesList"),

    modalOverlay: document.getElementById("appModalOverlay"),
    modalTitle: document.getElementById("appModalTitle"),
    modalBody: document.getElementById("appModalBody"),
    modalOk: document.getElementById("appModalOk"),
    modalCancel: document.getElementById("appModalCancel")
  };

  let modalResolver = null;
  let currentEditFoodId = null;
  let currentEditAccommodationId = null;

  init();

  function init() {
    loadState();
    bindEvents();
    renderAll();
  }

  function bindEvents() {
    els.currencySelect.addEventListener("change", function () {
      appState.currency = els.currencySelect.value;
      formatBudgetInputs();
      formatAmountInputs();
      saveState();
      renderAll();
    });

    els.daysInput.addEventListener("change", function () {
      const val = parseInt(els.daysInput.value, 10);
      appState.numberOfDays = Number.isFinite(val) && val > 0 ? val : 1;
      saveState();
      renderAll();
    });

    els.dayNumberInput.addEventListener("change", function () {
      appState.dayNumber = sanitizeDayNumber(els.dayNumberInput.value);
      saveState();
      renderAll();
    });

    els.prevDayBtn.addEventListener("click", function () {
      appState.dayNumber = shiftDayNumber(appState.dayNumber, -1);
      saveState();
      renderAll();
    });

    els.nextDayBtn.addEventListener("click", function () {
      appState.dayNumber = shiftDayNumber(appState.dayNumber, 1);
      saveState();
      renderAll();
    });

    bindBudgetInput(els.foodBudgetInput, function (num) {
      appState.foodBudget = num;
      saveState();
      renderAll();
    });

    bindBudgetInput(els.accommodationBudgetInput, function (num) {
      appState.accommodationBudget = num;
      saveState();
      renderAll();
    });

    bindAmountInput(els.foodAmountInput);
    bindAmountInput(els.accommodationAmountInput);

    els.addFoodBtn.addEventListener("click", onAddOrUpdateFood);
    els.addAccommodationBtn.addEventListener("click", onAddOrUpdateAccommodation);

    els.cancelFoodEditBtn.addEventListener("click", function () {
      currentEditFoodId = null;
      clearFoodEntryInputs();
      renderAll();
    });

    els.cancelAccommodationEditBtn.addEventListener("click", function () {
      currentEditAccommodationId = null;
      clearAccommodationEntryInputs();
      renderAll();
    });

    document.querySelectorAll(".quick-amount-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const target = document.getElementById(btn.getAttribute("data-target"));
        const currentValue = parseCurrencyInputValue(target.value);
        const addValue = parseFloat(btn.getAttribute("data-value")) || 0;
        target.value = (currentValue + addValue).toFixed(2);
      });
    });

    document.querySelectorAll(".quick-clear-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const target = document.getElementById(btn.getAttribute("data-target"));
        target.value = "";
      });
    });

    els.modalOk.addEventListener("click", function () {
      closeModal(true);
    });

    els.modalCancel.addEventListener("click", function () {
      closeModal(false);
    });

    els.modalOverlay.addEventListener("click", function (event) {
      if (event.target === els.modalOverlay) {
        closeModal(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!els.modalOverlay.classList.contains("hidden") && event.key === "Escape") {
        closeModal(false);
      }
    });
  }

  function bindBudgetInput(input, onCommit) {
    input.addEventListener("focus", function () {
      const num = parseCurrencyInputValue(input.value);
      input.value = num ? stripTrailingZeros(num) : "";
    });

    input.addEventListener("blur", function () {
      const num = sanitiseMoney(parseCurrencyInputValue(input.value));
      input.value = formatCurrency(num);
      onCommit(num);
    });
  }

  function bindAmountInput(input) {
    input.addEventListener("focus", function () {
      const num = parseCurrencyInputValue(input.value);
      input.value = num ? stripTrailingZeros(num) : "";
    });

    input.addEventListener("blur", function () {
      const num = sanitiseMoney(parseCurrencyInputValue(input.value));
      input.value = num ? formatCurrency(num) : "";
    });
  }

  function renderAll() {
    syncTopInputs();
    renderHeadings();
    renderFoodSummary();
    renderAccommodationSummary();
    renderFoodEntries();
    renderAccommodationEntries();
    updateEditStateUi();
    formatBudgetInputs();
  }

  function syncTopInputs() {
    els.currencySelect.value = appState.currency;
    els.daysInput.value = appState.numberOfDays;
    els.dayNumberInput.value = appState.dayNumber;
  }

  function renderHeadings() {
    const dayLabel = appState.dayNumber;
    const dayDate = formatDayNumberAsDate(dayLabel);

    els.foodHeadingText.textContent = "Food - for " + dayLabel;
    els.foodHeadingDate.textContent = dayDate;
    els.foodEntryHeading.innerHTML = (currentEditFoodId ? 'Edit Food Entry <span>- for ' : 'Add Food Entry <span>- for ') + escapeHtml(dayLabel) + '</span>';
    els.foodSpentTodayLabel.textContent = "Spent Today - " + dayLabel + ":";

    els.accommodationHeadingText.textContent = "Accommodation - for " + dayLabel;
    els.accommodationHeadingDate.textContent = dayDate;
    els.accommodationEntryHeading.innerHTML = (currentEditAccommodationId ? 'Edit Accommodation Entry <span>- for ' : 'Add Accommodation Entry <span>- for ') + escapeHtml(dayLabel) + '</span>';
    els.accommodationSpentTodayLabel.textContent = "Spent Today - " + dayLabel + ":";
  }

  function renderFoodSummary() {
    const totalBudget = numberOrZero(appState.foodBudget);
    const totalSpent = sumEntries(appState.foodEntries);
    const spentToday = sumEntriesByDay(appState.foodEntries, appState.dayNumber);
    const startingDaily = appState.numberOfDays > 0 ? totalBudget / appState.numberOfDays : 0;
    const remainingBudget = totalBudget - totalSpent;
    const remainingDaily = startingDaily - spentToday;

    els.foodStartingDaily.textContent = formatCurrency(startingDaily);
    els.foodRemainingBudget.textContent = formatCurrency(remainingBudget);
    els.foodRemainingDaily.textContent = formatCurrency(remainingDaily);
    els.foodSpentToday.textContent = formatCurrency(spentToday);
  }

  function renderAccommodationSummary() {
    const totalBudget = numberOrZero(appState.accommodationBudget);
    const totalSpent = sumEntries(appState.accommodationEntries);
    const spentToday = sumEntriesByDay(appState.accommodationEntries, appState.dayNumber);
    const startingDaily = appState.numberOfDays > 0 ? totalBudget / appState.numberOfDays : 0;
    const remainingBudget = totalBudget - totalSpent;
    const remainingDaily = startingDaily - spentToday;

    els.accommodationStartingDaily.textContent = formatCurrency(startingDaily);
    els.accommodationRemainingBudget.textContent = formatCurrency(remainingBudget);
    els.accommodationRemainingDaily.textContent = formatCurrency(remainingDaily);
    els.accommodationSpentToday.textContent = formatCurrency(spentToday);
  }

  function renderFoodEntries() {
    els.foodEntriesList.innerHTML = "";

    const sorted = getSortedEntries(appState.foodEntries);
    if (!sorted.length) {
      els.foodEntriesList.innerHTML = '<div class="empty-state">No food entries yet.</div>';
      return;
    }

    const dayClassMap = buildDayAlternatingMap(sorted, "food");

    sorted.forEach(function (entry) {
      const item = document.createElement("div");
      item.className = "entry-item " + dayClassMap[entry.dayKey];

      const line2 = "Date: " + formatEntryDate(entry.createdAt) + (entry.note ? " • Note: " + entry.note : "");

      item.innerHTML =
        '<div class="entry-top">' +
          '<div class="entry-main">' +
            '<div class="entry-line-1">' + escapeHtml(entry.type) + ' - ' + escapeHtml(entry.dayNumber) + '</div>' +
            '<div class="entry-line-2">' + escapeHtml(line2) + '</div>' +
          '</div>' +
          '<div class="entry-amount">' + escapeHtml(formatCurrency(entry.amount)) + '</div>' +
        '</div>' +
        '<div class="entry-actions">' +
          '<button type="button" class="small-action-btn edit-food-btn" data-id="' + escapeHtml(entry.id) + '">Edit</button>' +
          '<button type="button" class="small-action-btn delete-btn delete-food-btn" data-id="' + escapeHtml(entry.id) + '">Delete</button>' +
        '</div>';

      els.foodEntriesList.appendChild(item);
    });

    els.foodEntriesList.querySelectorAll(".edit-food-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        startEditFood(btn.getAttribute("data-id"));
      });
    });

    els.foodEntriesList.querySelectorAll(".delete-food-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteFoodEntry(btn.getAttribute("data-id"));
      });
    });
  }

  function renderAccommodationEntries() {
    els.accommodationEntriesList.innerHTML = "";

    const sorted = getSortedEntries(appState.accommodationEntries);
    if (!sorted.length) {
      els.accommodationEntriesList.innerHTML = '<div class="empty-state">No accommodation entries yet.</div>';
      return;
    }

    const dayClassMap = buildDayAlternatingMap(sorted, "acc");

    sorted.forEach(function (entry) {
      const item = document.createElement("div");
      item.className = "entry-item " + dayClassMap[entry.dayKey];

      const line2 = "Date: " + formatEntryDate(entry.createdAt) + (entry.note ? " • Note: " + entry.note : "");

      item.innerHTML =
        '<div class="entry-top">' +
          '<div class="entry-main">' +
            '<div class="entry-line-1">' + escapeHtml(entry.type) + ' - ' + escapeHtml(entry.dayNumber) + '</div>' +
            '<div class="entry-line-2">' + escapeHtml(line2) + '</div>' +
          '</div>' +
          '<div class="entry-amount">' + escapeHtml(formatCurrency(entry.amount)) + '</div>' +
        '</div>' +
        '<div class="entry-actions">' +
          '<button type="button" class="small-action-btn edit-acc-btn" data-id="' + escapeHtml(entry.id) + '">Edit</button>' +
          '<button type="button" class="small-action-btn delete-btn delete-acc-btn" data-id="' + escapeHtml(entry.id) + '">Delete</button>' +
        '</div>';

      els.accommodationEntriesList.appendChild(item);
    });

    els.accommodationEntriesList.querySelectorAll(".edit-acc-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        startEditAccommodation(btn.getAttribute("data-id"));
      });
    });

    els.accommodationEntriesList.querySelectorAll(".delete-acc-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteAccommodationEntry(btn.getAttribute("data-id"));
      });
    });
  }

  async function onAddOrUpdateFood() {
    const type = els.foodTypeSelect.value;
    const amount = sanitiseMoney(parseCurrencyInputValue(els.foodAmountInput.value));
    const note = els.foodNoteInput.value.trim();

    if (amount <= 0) {
      await showInfo("Please enter a valid Food amount greater than 0.");
      return;
    }

    if (currentEditFoodId) {
      const entry = findById(appState.foodEntries, currentEditFoodId);
      if (!entry) {
        currentEditFoodId = null;
        renderAll();
        await showInfo("That Food entry could not be found.");
        return;
      }

      entry.type = type;
      entry.amount = amount;
      entry.note = note;
      entry.dayNumber = appState.dayNumber;
      entry.dayKey = buildDaySortKey(appState.dayNumber);

      currentEditFoodId = null;
      clearFoodEntryInputs();
      saveState();
      renderAll();
      await showInfo("Food entry updated.");
      return;
    }

    appState.foodEntries.push({
      id: createId(),
      type: type,
      amount: amount,
      note: note,
      dayNumber: appState.dayNumber,
      dayKey: buildDaySortKey(appState.dayNumber),
      createdAt: new Date().toISOString()
    });

    clearFoodEntryInputs();
    saveState();
    renderAll();
  }

  async function onAddOrUpdateAccommodation() {
    const type = els.accommodationTypeSelect.value;
    const amount = sanitiseMoney(parseCurrencyInputValue(els.accommodationAmountInput.value));
    const note = els.accommodationNoteInput.value.trim();

    if (amount <= 0) {
      await showInfo("Please enter a valid Accommodation amount greater than 0.");
      return;
    }

    if (currentEditAccommodationId) {
      const entry = findById(appState.accommodationEntries, currentEditAccommodationId);
      if (!entry) {
        currentEditAccommodationId = null;
        renderAll();
        await showInfo("That Accommodation entry could not be found.");
        return;
      }

      entry.type = type;
      entry.amount = amount;
      entry.note = note;
      entry.dayNumber = appState.dayNumber;
      entry.dayKey = buildDaySortKey(appState.dayNumber);

      currentEditAccommodationId = null;
      clearAccommodationEntryInputs();
      saveState();
      renderAll();
      await showInfo("Accommodation entry updated.");
      return;
    }

    const existingForDay = appState.accommodationEntries.find(function (item) {
      return item.dayNumber === appState.dayNumber;
    });

    if (existingForDay) {
      const confirmed = await showConfirm(
        "There is already an Accommodation entry for " + appState.dayNumber + ".\n\n" +
        "Existing entry:\n" +
        "Type: " + existingForDay.type + "\n" +
        "Amount: " + formatCurrency(existingForDay.amount) +
        (existingForDay.note ? "\nNote: " + existingForDay.note : "") +
        "\n\nReplace it?"
      );

      if (!confirmed) {
        return;
      }

      existingForDay.type = type;
      existingForDay.amount = amount;
      existingForDay.note = note;
      existingForDay.dayKey = buildDaySortKey(appState.dayNumber);
      existingForDay.createdAt = new Date().toISOString();

      clearAccommodationEntryInputs();
      saveState();
      renderAll();
      return;
    }

    appState.accommodationEntries.push({
      id: createId(),
      type: type,
      amount: amount,
      note: note,
      dayNumber: appState.dayNumber,
      dayKey: buildDaySortKey(appState.dayNumber),
      createdAt: new Date().toISOString()
    });

    clearAccommodationEntryInputs();
    saveState();
    renderAll();
  }

  function startEditFood(id) {
    const entry = findById(appState.foodEntries, id);
    if (!entry) {
      showInfo("That Food entry could not be found.");
      return;
    }

    currentEditAccommodationId = null;
    currentEditFoodId = id;
    appState.dayNumber = entry.dayNumber;

    renderAll();

    els.foodTypeSelect.value = entry.type;
    els.foodAmountInput.value = stripTrailingZeros(entry.amount);
    els.foodNoteInput.value = entry.note || "";
  }

  function startEditAccommodation(id) {
    const entry = findById(appState.accommodationEntries, id);
    if (!entry) {
      showInfo("That Accommodation entry could not be found.");
      return;
    }

    currentEditFoodId = null;
    currentEditAccommodationId = id;
    appState.dayNumber = entry.dayNumber;

    renderAll();

    els.accommodationTypeSelect.value = entry.type;
    els.accommodationAmountInput.value = stripTrailingZeros(entry.amount);
    els.accommodationNoteInput.value = entry.note || "";
  }

  async function deleteFoodEntry(id) {
    const entry = findById(appState.foodEntries, id);
    if (!entry) {
      await showInfo("That Food entry could not be found.");
      return;
    }

    const confirmed = await showConfirm(
      "Delete this Food entry?\n\n" +
      "Day: " + entry.dayNumber + "\n" +
      "Type: " + entry.type + "\n" +
      "Amount: " + formatCurrency(entry.amount) + "\n" +
      "Date: " + formatEntryDate(entry.createdAt) +
      (entry.note ? "\nNote: " + entry.note : "")
    );

    if (!confirmed) {
      return;
    }

    appState.foodEntries = appState.foodEntries.filter(function (item) {
      return item.id !== id;
    });

    if (currentEditFoodId === id) {
      currentEditFoodId = null;
      clearFoodEntryInputs();
    }

    saveState();
    renderAll();
  }

  async function deleteAccommodationEntry(id) {
    const entry = findById(appState.accommodationEntries, id);
    if (!entry) {
      await showInfo("That Accommodation entry could not be found.");
      return;
    }

    const confirmed = await showConfirm(
      "Delete this Accommodation entry?\n\n" +
      "Day: " + entry.dayNumber + "\n" +
      "Type: " + entry.type + "\n" +
      "Amount: " + formatCurrency(entry.amount) + "\n" +
      "Date: " + formatEntryDate(entry.createdAt) +
      (entry.note ? "\nNote: " + entry.note : "")
    );

    if (!confirmed) {
      return;
    }

    appState.accommodationEntries = appState.accommodationEntries.filter(function (item) {
      return item.id !== id;
    });

    if (currentEditAccommodationId === id) {
      currentEditAccommodationId = null;
      clearAccommodationEntryInputs();
    }

    saveState();
    renderAll();
  }

  function updateEditStateUi() {
    els.addFoodBtn.textContent = currentEditFoodId ? "Update Entry" : "Add Entry";
    els.addAccommodationBtn.textContent = currentEditAccommodationId ? "Update Entry" : "Add Entry";

    toggleHidden(els.cancelFoodEditBtn, !currentEditFoodId);
    toggleHidden(els.cancelAccommodationEditBtn, !currentEditAccommodationId);
    toggleHidden(els.foodEditStatus, !currentEditFoodId);
    toggleHidden(els.accommodationEditStatus, !currentEditAccommodationId);

    toggleClass(els.foodTypeSelect, "editing-active", !!currentEditFoodId);
    toggleClass(els.foodAmountInput, "editing-active", !!currentEditFoodId);
    toggleClass(els.foodNoteInput, "editing-active", !!currentEditFoodId);

    toggleClass(els.accommodationTypeSelect, "editing-active", !!currentEditAccommodationId);
    toggleClass(els.accommodationAmountInput, "editing-active", !!currentEditAccommodationId);
    toggleClass(els.accommodationNoteInput, "editing-active", !!currentEditAccommodationId);
  }

  function formatBudgetInputs() {
    if (document.activeElement !== els.foodBudgetInput) {
      els.foodBudgetInput.value = formatCurrency(appState.foodBudget);
    }
    if (document.activeElement !== els.accommodationBudgetInput) {
      els.accommodationBudgetInput.value = formatCurrency(appState.accommodationBudget);
    }
  }

  function formatAmountInputs() {
    if (document.activeElement !== els.foodAmountInput) {
      const v1 = parseCurrencyInputValue(els.foodAmountInput.value);
      els.foodAmountInput.value = v1 ? formatCurrency(v1) : "";
    }
    if (document.activeElement !== els.accommodationAmountInput) {
      const v2 = parseCurrencyInputValue(els.accommodationAmountInput.value);
      els.accommodationAmountInput.value = v2 ? formatCurrency(v2) : "";
    }
  }

  function clearFoodEntryInputs() {
    els.foodTypeSelect.value = "Breakfast";
    els.foodAmountInput.value = "";
    els.foodNoteInput.value = "";
  }

  function clearAccommodationEntryInputs() {
    els.accommodationTypeSelect.value = "Albergue";
    els.accommodationAmountInput.value = "";
    els.accommodationNoteInput.value = "";
  }

  function sumEntries(entries) {
    let total = 0;
    for (let i = 0; i < entries.length; i++) {
      total += numberOrZero(entries[i].amount);
    }
    return total;
  }

  function sumEntriesByDay(entries, dayNumber) {
    let total = 0;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].dayNumber === dayNumber) {
        total += numberOrZero(entries[i].amount);
      }
    }
    return total;
  }

  function getSortedEntries(entries) {
    return entries.slice().sort(function (a, b) {
      if (b.dayKey !== a.dayKey) {
        return b.dayKey - a.dayKey;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  function buildDayAlternatingMap(entries, kind) {
    const map = {};
    let toggle = false;
    let lastKey = null;

    for (let i = 0; i < entries.length; i++) {
      const key = entries[i].dayKey;
      if (key !== lastKey) {
        toggle = !toggle;
        lastKey = key;
      }
      map[key] = kind === "food" ? (toggle ? "food-day-a" : "food-day-b") : (toggle ? "acc-day-a" : "acc-day-b");
    }

    return map;
  }

  function buildDaySortKey(dayNumber) {
    const clean = sanitizeDayNumber(dayNumber);
    const match = clean.match(/^([SDF])(\d{1,3})$/);
    if (!match) {
      return 2001;
    }

    const prefix = match[1];
    const num = parseInt(match[2], 10) || 1;
    const bases = { S: 1000, D: 2000, F: 3000 };
    return bases[prefix] + num;
  }

  function sanitizeDayNumber(value) {
    const raw = String(value || "").trim().toUpperCase();
    const match = raw.match(/^([SDF])\s*(\d{1,3})$/);
    if (!match) {
      return "D1";
    }

    const prefix = match[1];
    const num = Math.max(1, parseInt(match[2], 10) || 1);
    return prefix + num;
  }

  function shiftDayNumber(current, delta) {
    const clean = sanitizeDayNumber(current);
    const match = clean.match(/^([SDF])(\d{1,3})$/);
    if (!match) {
      return "D1";
    }

    const prefix = match[1];
    let num = parseInt(match[2], 10) || 1;
    num += delta;
    if (num < 1) {
      num = 1;
    }
    return prefix + num;
  }

  function formatDayNumberAsDate(dayNumber) {
    const clean = sanitizeDayNumber(dayNumber);
    const match = clean.match(/^([SDF])(\d{1,3})$/);
    if (!match) {
      return "";
    }

    const prefix = match[1];
    const num = parseInt(match[2], 10) || 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let offset = 0;
    if (prefix === "D") {
      offset = num - 1;
    } else if (prefix === "S") {
      offset = -num;
    } else if (prefix === "F") {
      offset = appState.numberOfDays + (num - 1);
    }

    const target = new Date(today);
    target.setDate(today.getDate() + offset);

    return formatDateObject(target);
  }

  function formatEntryDate(isoString) {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return "";
    }
    return formatDateObject(d);
  }

  function formatDateObject(dateObj) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[dateObj.getMonth()] + " " + dateObj.getDate() + ", " + dateObj.getFullYear();
  }

  function formatCurrency(amount) {
    const num = numberOrZero(amount);
    if (appState.currency === "EUR") {
      return "€" + num.toFixed(2);
    }
    if (appState.currency === "CAD") {
      return "$" + num.toFixed(2);
    }
    return "US$" + num.toFixed(2);
  }

  function parseCurrencyInputValue(value) {
    const cleaned = String(value || "").replace(/[^0-9.\-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  function sanitiseMoney(value) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return 0;
    }
    return Math.round(num * 100) / 100;
  }

  function stripTrailingZeros(value) {
    return Number(value).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  }

  function numberOrZero(value) {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  function findById(entries, id) {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].id === id) {
        return entries[i];
      }
    }
    return null;
  }

  function toggleHidden(el, shouldHide) {
    if (!el) return;
    if (shouldHide) {
      el.classList.add("hidden");
    } else {
      el.classList.remove("hidden");
    }
  }

  function toggleClass(el, className, on) {
    if (!el) return;
    if (on) {
      el.classList.add(className);
    } else {
      el.classList.remove(className);
    }
  }

  function createId() {
    return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      appState.currency = parsed.currency || appState.currency;
      appState.numberOfDays = numberOrZero(parsed.numberOfDays) > 0 ? numberOrZero(parsed.numberOfDays) : appState.numberOfDays;
      appState.dayNumber = parsed.dayNumber || appState.dayNumber;
      appState.foodBudget = numberOrZero(parsed.foodBudget);
      appState.accommodationBudget = numberOrZero(parsed.accommodationBudget);
      appState.foodEntries = Array.isArray(parsed.foodEntries) ? parsed.foodEntries : [];
      appState.accommodationEntries = Array.isArray(parsed.accommodationEntries) ? parsed.accommodationEntries : [];
    } catch (error) {
      console.error("Could not load saved app data.", error);
    }
  }

  function showInfo(message) {
    return showModal({
      title: "Trip Budget Tracker",
      body: message,
      showCancel: false,
      okText: "OK"
    });
  }

  function showConfirm(message) {
    return showModal({
      title: "Trip Budget Tracker",
      body: message,
      showCancel: true,
      okText: "OK",
      cancelText: "Cancel"
    });
  }

  function showModal(config) {
    els.modalTitle.textContent = config.title || "Trip Budget Tracker";
    els.modalBody.textContent = config.body || "";
    els.modalOk.textContent = config.okText || "OK";
    els.modalCancel.textContent = config.cancelText || "Cancel";

    if (config.showCancel) {
      els.modalCancel.classList.remove("hidden");
    } else {
      els.modalCancel.classList.add("hidden");
    }

    els.modalOverlay.classList.remove("hidden");
    els.modalOverlay.setAttribute("aria-hidden", "false");

    return new Promise(function (resolve) {
      modalResolver = resolve;
      setTimeout(function () {
        els.modalOk.focus();
      }, 10);
    });
  }

  function closeModal(result) {
    if (els.modalOverlay.classList.contains("hidden")) {
      return;
    }

    els.modalOverlay.classList.add("hidden");
    els.modalOverlay.setAttribute("aria-hidden", "true");

    if (typeof modalResolver === "function") {
      const fn = modalResolver;
      modalResolver = null;
      fn(Boolean(result));
    }
  }
})();