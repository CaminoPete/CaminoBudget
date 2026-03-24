// Version #30 Mar 24, 2026 12:30 PM

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

    foodHeading: document.getElementById("foodHeading"),
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

    accommodationHeading: document.getElementById("accommodationHeading"),
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
    syncInputsFromState();
    renderAll();
  }

  function bindEvents() {
    els.currencySelect.addEventListener("change", function () {
      appState.currency = els.currencySelect.value;
      formatAllCurrencyInputs();
      saveState();
      renderAll();
    });

    els.daysInput.addEventListener("change", function () {
      const val = parseInt(els.daysInput.value, 10);
      appState.numberOfDays = Number.isFinite(val) && val > 0 ? val : 1;
      syncInputsFromState();
      saveState();
      renderAll();
    });

    els.dayNumberInput.addEventListener("change", function () {
      appState.dayNumber = sanitizeDayNumber(els.dayNumberInput.value);
      syncInputsFromState();
      saveState();
      renderAll();
    });

    els.prevDayBtn.addEventListener("click", function () {
      appState.dayNumber = shiftDayNumber(appState.dayNumber, -1);
      syncInputsFromState();
      saveState();
      renderAll();
    });

    els.nextDayBtn.addEventListener("click", function () {
      appState.dayNumber = shiftDayNumber(appState.dayNumber, 1);
      syncInputsFromState();
      saveState();
      renderAll();
    });

    bindCurrencyInput(els.foodBudgetInput, function (value) {
      appState.foodBudget = value;
      saveState();
      renderAll();
    });

    bindCurrencyInput(els.accommodationBudgetInput, function (value) {
      appState.accommodationBudget = value;
      saveState();
      renderAll();
    });

    bindCurrencyInput(els.foodAmountInput, function () {});
    bindCurrencyInput(els.accommodationAmountInput, function () {});

    els.addFoodBtn.addEventListener("click", onAddOrUpdateFood);
    els.addAccommodationBtn.addEventListener("click", onAddOrUpdateAccommodation);

    els.cancelFoodEditBtn.addEventListener("click", function () {
      cancelFoodEdit(true);
      renderAll();
    });

    els.cancelAccommodationEditBtn.addEventListener("click", function () {
      cancelAccommodationEdit(true);
      renderAll();
    });

    document.querySelectorAll(".quick-amount-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const targetId = btn.getAttribute("data-target");
        const target = document.getElementById(targetId);
        const valueToAdd = parseFloat(btn.getAttribute("data-value")) || 0;
        const currentValue = parseCurrencyInputValue(target.value);
        target.value = (currentValue + valueToAdd).toFixed(2);
      });
    });

    document.querySelectorAll(".quick-clear-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const targetId = btn.getAttribute("data-target");
        const target = document.getElementById(targetId);
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

  function bindCurrencyInput(inputEl, onValueCommit) {
    inputEl.addEventListener("focus", function () {
      const numericValue = parseCurrencyInputValue(inputEl.value);
      inputEl.value = numericValue ? numericValue.toFixed(2).replace(/\.00$/, "") : "";
    });

    inputEl.addEventListener("blur", function () {
      const numericValue = sanitiseMoney(parseCurrencyInputValue(inputEl.value));
      inputEl.value = numericValue === 0 && inputEl !== els.foodBudgetInput && inputEl !== els.accommodationBudgetInput
        ? ""
        : formatCurrency(numericValue);
      onValueCommit(numericValue);
    });
  }

  function syncInputsFromState() {
    els.currencySelect.value = appState.currency;
    els.daysInput.value = appState.numberOfDays;
    els.dayNumberInput.value = appState.dayNumber;
    els.foodBudgetInput.value = formatCurrency(appState.foodBudget);
    els.accommodationBudgetInput.value = formatCurrency(appState.accommodationBudget);
  }

  function formatAllCurrencyInputs() {
    if (document.activeElement !== els.foodBudgetInput) {
      els.foodBudgetInput.value = formatCurrency(appState.foodBudget);
    }
    if (document.activeElement !== els.accommodationBudgetInput) {
      els.accommodationBudgetInput.value = formatCurrency(appState.accommodationBudget);
    }

    const foodAmountValue = parseCurrencyInputValue(els.foodAmountInput.value);
    const accommodationAmountValue = parseCurrencyInputValue(els.accommodationAmountInput.value);

    if (document.activeElement !== els.foodAmountInput) {
      els.foodAmountInput.value = foodAmountValue ? formatCurrency(foodAmountValue) : "";
    }
    if (document.activeElement !== els.accommodationAmountInput) {
      els.accommodationAmountInput.value = accommodationAmountValue ? formatCurrency(accommodationAmountValue) : "";
    }
  }

  function renderAll() {
    const dayLabel = appState.dayNumber;
    const headingDate = formatDayNumberAsDate(appState.dayNumber);

    els.foodHeading.querySelector(".section-main").textContent = "Food - for " + dayLabel;
    els.foodHeadingDate.textContent = headingDate;
    els.foodEntryHeading.innerHTML = (currentEditFoodId ? 'Edit Food Entry <span>- for ' : 'Add Food Entry <span>- for ') + escapeHtml(dayLabel) + '</span>';
    els.foodSpentTodayLabel.textContent = 'Spent Today - ' + dayLabel + ':';

    els.accommodationHeading.querySelector(".section-main").textContent = "Accommodation - for " + dayLabel;
    els.accommodationHeadingDate.textContent = headingDate;
    els.accommodationEntryHeading.innerHTML = (currentEditAccommodationId ? 'Edit Accommodation Entry <span>- for ' : 'Add Accommodation Entry <span>- for ') + escapeHtml(dayLabel) + '</span>';
    els.accommodationSpentTodayLabel.textContent = 'Spent Today - ' + dayLabel + ':';

    renderFoodSummary();
    renderAccommodationSummary();
    renderFoodEntries();
    renderAccommodationEntries();
    updateFormButtonStates();
  }

  function renderFoodSummary() {
    const totalBudget = Number(appState.foodBudget) || 0;
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
    const totalBudget = Number(appState.accommodationBudget) || 0;
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

      const noteText = entry.note ? " • Note: " + escapeHtml(entry.note) : "";

      item.innerHTML = [
        '<div class="entry-top">',
        '<div class="entry-main">',
        '<div class="entry-line-1">' + escapeHtml(entry.type) + ' - ' + escapeHtml(entry.dayNumber) + '</div>',
        '<div class="entry-line-2">Date: ' + escapeHtml(formatEntryDate(entry.createdAt)) + noteText + '</div>',
        '</div>',
        '<div class="entry-amount">' + escapeHtml(formatCurrency(entry.amount)) + '</div>',
        '</div>',
        '<div class="entry-actions">',
        '<button type="button" class="small-action-btn edit-food-btn" data-id="' + escapeHtml(entry.id) + '">Edit</button>',
        '<button type="button" class="small-action-btn delete-btn delete-food-btn" data-id="' + escapeHtml(entry.id) + '">Delete</button>',
        '</div>'
      ].join("");

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

      const noteText = entry.note ? " • Note: " + escapeHtml(entry.note) : "";

      item.innerHTML = [
        '<div class="entry-top">',
        '<div class="entry-main">',
        '<div class="entry-line-1">' + escapeHtml(entry.type) + ' - ' + escapeHtml(entry.dayNumber) + '</div>',
        '<div class="entry-line-2">Date: ' + escapeHtml(formatEntryDate(entry.createdAt)) + noteText + '</div>',
        '</div>',
        '<div class="entry-amount">' + escapeHtml(formatCurrency(entry.amount)) + '</div>',
        '</div>',
        '<div class="entry-actions">',
        '<button type="button" class="small-action-btn edit-acc-btn" data-id="' + escapeHtml(entry.id) + '">Edit</button>',
        '<button type="button" class="small-action-btn delete-btn delete-acc-btn" data-id="' + escapeHtml(entry.id) + '">Delete</button>',
        '</div>'
      ].join("");

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
      const entry = appState.foodEntries.find(function (item) {
        return item.id === currentEditFoodId;
      });

      if (!entry) {
        cancelFoodEdit();
        renderAll();
        await showInfo("That Food entry could not be found.");
        return;
      }

      entry.type = type;
      entry.amount = amount;
      entry.note = note;
      entry.dayNumber = appState.dayNumber;
      entry.dayKey = buildDaySortKey(appState.dayNumber);

      cancelFoodEdit(false);
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
      const entry = appState.accommodationEntries.find(function (item) {
        return item.id === currentEditAccommodationId;
      });

      if (!entry) {
        cancelAccommodationEdit();
        renderAll();
        await showInfo("That Accommodation entry could not be found.");
        return;
      }

      entry.type = type;
      entry.amount = amount;
      entry.note = note;
      entry.dayNumber = appState.dayNumber;
      entry.dayKey = buildDaySortKey(appState.dayNumber);

      cancelAccommodationEdit(false);
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
    const entry = appState.foodEntries.find(function (item) {
      return item.id === id;
    });

    if (!entry) {
      showInfo("That Food entry could not be found.");
      return;
    }

    cancelAccommodationEdit(false);
    currentEditFoodId = id;
    appState.dayNumber = entry.dayNumber;

    syncInputsFromState();
    renderAll();

    setTimeout(function () {
      els.foodTypeSelect.value = entry.type;
      els.foodAmountInput.value = Number(entry.amount).toFixed(2);
      els.foodNoteInput.value = entry.note || "";
      updateFormButtonStates();
    }, 0);
  }

  function startEditAccommodation(id) {
    const entry = appState.accommodationEntries.find(function (item) {
      return item.id === id;
    });

    if (!entry) {
      showInfo("That Accommodation entry could not be found.");
      return;
    }

    cancelFoodEdit(false);
    currentEditAccommodationId = id;
    appState.dayNumber = entry.dayNumber;

    syncInputsFromState();
    renderAll();

    setTimeout(function () {
      els.accommodationTypeSelect.value = entry.type;
      els.accommodationAmountInput.value = Number(entry.amount).toFixed(2);
      els.accommodationNoteInput.value = entry.note || "";
      updateFormButtonStates();
    }, 0);
  }

  async function deleteFoodEntry(id) {
    const entry = appState.foodEntries.find(function (item) {
      return item.id === id;
    });

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
      cancelFoodEdit(false);
      clearFoodEntryInputs();
    }

    saveState();
    renderAll();
  }

  async function deleteAccommodationEntry(id) {
    const entry = appState.accommodationEntries.find(function (item) {
      return item.id === id;
    });

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
      cancelAccommodationEdit(false);
      clearAccommodationEntryInputs();
    }

    saveState();
    renderAll();
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

  function cancelFoodEdit(clearFields = true) {
    currentEditFoodId = null;
    if (clearFields) {
      clearFoodEntryInputs();
    }
    updateFormButtonStates();
  }

  function cancelAccommodationEdit(clearFields = true) {
    currentEditAccommodationId = null;
    if (clearFields) {
      clearAccommodationEntryInputs();
    }
    updateFormButtonStates();
  }

  function updateFormButtonStates() {
    els.addFoodBtn.textContent = currentEditFoodId ? "Update Entry" : "Add Entry";
    els.addAccommodationBtn.textContent = currentEditAccommodationId ? "Update Entry" : "Add Entry";

    els.cancelFoodEditBtn.classList.toggle("hidden", !currentEditFoodId);
    els.cancelAccommodationEditBtn.classList.toggle("hidden", !currentEditAccommodationId);

    els.foodEditStatus.classList.toggle("hidden", !currentEditFoodId);
    els.accommodationEditStatus.classList.toggle("hidden", !currentEditAccommodationId);

    els.foodTypeSelect.classList.toggle("editing-active", Boolean(currentEditFoodId));
    els.foodAmountInput.classList.toggle("editing-active", Boolean(currentEditFoodId));
    els.foodNoteInput.classList.toggle("editing-active", Boolean(currentEditFoodId));

    els.accommodationTypeSelect.classList.toggle("editing-active", Boolean(currentEditAccommodationId));
    els.accommodationAmountInput.classList.toggle("editing-active", Boolean(currentEditAccommodationId));
    els.accommodationNoteInput.classList.toggle("editing-active", Boolean(currentEditAccommodationId));
  }

  function getSortedEntries(entries) {
    return entries.slice().sort(function (a, b) {
      if (b.dayKey !== a.dayKey) {
        return b.dayKey - a.dayKey;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  function buildDayAlternatingMap(sortedEntries, type) {
    const result = {};
    let toggle = false;
    let lastDayKey = null;

    sortedEntries.forEach(function (entry) {
      if (entry.dayKey !== lastDayKey) {
        toggle = !toggle;
        lastDayKey = entry.dayKey;
      }

      if (type === "food") {
        result[entry.dayKey] = toggle ? "food-day-a" : "food-day-b";
      } else {
        result[entry.dayKey] = toggle ? "acc-day-a" : "acc-day-b";
      }
    });

    return result;
  }

  function sumEntries(entries) {
    return entries.reduce(function (sum, entry) {
      return sum + (Number(entry.amount) || 0);
    }, 0);
  }

  function sumEntriesByDay(entries, dayNumber) {
    return entries.reduce(function (sum, entry) {
      return entry.dayNumber === dayNumber ? sum + (Number(entry.amount) || 0) : sum;
    }, 0);
  }

  function sanitiseMoney(value) {
    const num = parseFloat(value);
    if (!Number.isFinite(num) || num < 0) {
      return 0;
    }
    return Math.round(num * 100) / 100;
  }

  function parseCurrencyInputValue(value) {
    const cleaned = String(value || "").replace(/[^0-9.\-]/g, "");
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
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
    const match = String(current || "D1").trim().toUpperCase().match(/^([SDF])(\d{1,3})$/);

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

  function buildDaySortKey(dayNumber) {
    const clean = sanitizeDayNumber(dayNumber);
    const match = clean.match(/^([SDF])(\d{1,3})$/);

    if (!match) {
      return 2001;
    }

    const prefix = match[1];
    const num = parseInt(match[2], 10) || 1;
    const prefixBase = { S: 1000, D: 2000, F: 3000 };

    return prefixBase[prefix] + num;
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

    let offsetDays = 0;

    if (prefix === "D") {
      offsetDays = num - 1;
    } else if (prefix === "S") {
      offsetDays = -num;
    } else if (prefix === "F") {
      offsetDays = appState.numberOfDays + (num - 1);
    }

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + offsetDays);

    return targetDate.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatCurrency(amount) {
    const num = Number(amount) || 0;

    if (appState.currency === "EUR") {
      return "€" + num.toFixed(2);
    }

    if (appState.currency === "CAD") {
      return "$" + num.toFixed(2);
    }

    return "US$" + num.toFixed(2);
  }

  function formatEntryDate(isoString) {
    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
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

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);

      appState.currency = parsed.currency || appState.currency;
      appState.numberOfDays = Number.isFinite(parsed.numberOfDays) ? parsed.numberOfDays : appState.numberOfDays;
      appState.dayNumber = parsed.dayNumber || appState.dayNumber;
      appState.foodBudget = Number.isFinite(parsed.foodBudget) ? parsed.foodBudget : appState.foodBudget;
      appState.accommodationBudget = Number.isFinite(parsed.accommodationBudget) ? parsed.accommodationBudget : appState.accommodationBudget;
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
      const resolver = modalResolver;
      modalResolver = null;
      resolver(Boolean(result));
    }
  }
})();