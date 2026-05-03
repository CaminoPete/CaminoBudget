// Version #41 May 3, 2026

(function () {
  "use strict";

  const STORAGE_KEY = "tripBudgetTrackerData_v25";
  const APP_CACHE_PREFIX = "trip-budget-tracker-";
  const DEFAULT_TRIP_NAME = "Camino 2026";

  const appState = {
    activeTripId: "",
    tripName: DEFAULT_TRIP_NAME,
    currency: "EUR",
    numberOfDays: 40,
    dayNumber: "D1",
    foodBudget: 1500,
    accommodationBudget: 900,
    foodEntries: [],
    accommodationEntries: [],
    trips: []
  };

  const els = {
    tripNameDisplay: document.getElementById("tripNameDisplay"),
    updateAppBtn: document.getElementById("updateAppBtn"),
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
    foodBudgetStatus: document.getElementById("foodBudgetStatus"),
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
    accommodationBudgetStatus: document.getElementById("accommodationBudgetStatus"),
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
    modalCancel: document.getElementById("appModalCancel"),
    clearFoodBtn: document.getElementById("clearFoodBtn"),
    clearAccommodationBtn: document.getElementById("clearAccommodationBtn"),
    tripSelect: document.getElementById("tripSelect"),
    tripNameInput: document.getElementById("tripNameInput"),
    addTripBtn: document.getElementById("addTripBtn"),
    renameTripBtn: document.getElementById("renameTripBtn"),
    deleteTripBtn: document.getElementById("deleteTripBtn")
  };

  const layoutEls = {
    foodEntryRow: els.addFoodBtn.parentElement,
    foodActionRow: els.cancelFoodEditBtn.parentElement,
    accommodationEntryRow: els.addAccommodationBtn.parentElement,
    accommodationActionRow: els.cancelAccommodationEditBtn.parentElement
  };

  let modalResolver = null;
  let currentEditFoodId = null;
  let currentEditAccommodationId = null;

  init();

  function init() {
    loadState();
    ensureTripState();
    saveState();
    bindEvents();
    syncInputsFromState();
    renderAll();
    registerServiceWorker();
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

    els.clearFoodBtn.addEventListener("click", async function () {
      if (!appState.foodEntries.length) {
        await showInfo("There are no Food entries to clear.");
        return;
      }

      const confirmed = await showConfirm(
        "Clear all Food entries?\n\nThis cannot be undone. Your Food budget will stay the same."
      );
      if (!confirmed) return;

      clearFoodEntries();
      await showInfo("Food entries cleared.");
    });

    els.clearAccommodationBtn.addEventListener("click", async function () {
      if (!appState.accommodationEntries.length) {
        await showInfo("There are no Accommodation entries to clear.");
        return;
      }

      const confirmed = await showConfirm(
        "Clear all Accommodation entries?\n\nThis cannot be undone. Your Accommodation budget will stay the same."
      );
      if (!confirmed) return;

      clearAccommodationEntries();
      await showInfo("Accommodation entries cleared.");
    });

    els.tripSelect.addEventListener("change", function () {
      switchTrip(els.tripSelect.value);
    });

    els.addTripBtn.addEventListener("click", async function () {
      await addTrip();
    });

    els.renameTripBtn.addEventListener("click", async function () {
      await renameTrip();
    });

    els.deleteTripBtn.addEventListener("click", async function () {
      await deleteCurrentTrip();
    });

    els.updateAppBtn.addEventListener("click", async function () {
      await updateAppCache();
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
    els.tripNameDisplay.textContent = appState.tripName;
    els.currencySelect.value = appState.currency;
    els.daysInput.value = appState.numberOfDays;
    els.dayNumberInput.value = appState.dayNumber;
    els.foodBudgetInput.value = formatCurrency(appState.foodBudget);
    els.accommodationBudgetInput.value = formatCurrency(appState.accommodationBudget);
    els.tripNameInput.value = appState.tripName;
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
    els.foodSpentTodayLabel.textContent = "Spent Today - " + dayLabel + ":";

    els.accommodationHeading.querySelector(".section-main").textContent = "Accommodation - for " + dayLabel;
    els.accommodationHeadingDate.textContent = headingDate;
    els.accommodationEntryHeading.innerHTML = (currentEditAccommodationId ? 'Edit Accommodation Entry <span>- for ' : 'Add Accommodation Entry <span>- for ') + escapeHtml(dayLabel) + '</span>';
    els.accommodationSpentTodayLabel.textContent = "Spent Today - " + dayLabel + ":";

    renderFoodSummary();
    renderAccommodationSummary();
    renderFoodEntries();
    renderAccommodationEntries();
    renderTripControls();
    updateFormButtonStates();
  }

  function renderTripControls() {
    const currentValue = els.tripSelect.value || appState.activeTripId;

    els.tripSelect.innerHTML = "";

    appState.trips.forEach(function (trip) {
      const option = document.createElement("option");
      option.value = trip.id;
      option.textContent = trip.name || DEFAULT_TRIP_NAME;
      els.tripSelect.appendChild(option);
    });

    els.tripSelect.value = appState.activeTripId || currentValue;
    els.deleteTripBtn.disabled = appState.trips.length <= 1;
  }

  function renderFoodSummary() {
    const totalBudget = Number(appState.foodBudget) || 0;
    const totalSpent = sumEntries(appState.foodEntries);
    const spentToday = sumEntriesByDay(appState.foodEntries, appState.dayNumber);
    const startingDaily = appState.numberOfDays > 0 ? totalBudget / appState.numberOfDays : 0;
    const remainingBudget = totalBudget - totalSpent;
    const remainingDaily = startingDaily - spentToday;
    const budgetStatus = calculateBudgetStatus(totalBudget, totalSpent, appState.foodEntries);

    els.foodStartingDaily.textContent = formatCurrency(startingDaily);
    els.foodRemainingBudget.textContent = formatCurrency(remainingBudget);
    els.foodRemainingDaily.textContent = formatCurrency(remainingDaily);
    els.foodSpentToday.textContent = formatCurrency(spentToday);
    setBudgetStatus(els.foodBudgetStatus, budgetStatus);
  }

  function renderAccommodationSummary() {
    const totalBudget = Number(appState.accommodationBudget) || 0;
    const totalSpent = sumEntries(appState.accommodationEntries);
    const spentToday = sumEntriesByDay(appState.accommodationEntries, appState.dayNumber);
    const startingDaily = appState.numberOfDays > 0 ? totalBudget / appState.numberOfDays : 0;
    const remainingBudget = totalBudget - totalSpent;
    const remainingDaily = startingDaily - spentToday;
    const budgetStatus = calculateBudgetStatus(totalBudget, totalSpent, appState.accommodationEntries);

    els.accommodationStartingDaily.textContent = formatCurrency(startingDaily);
    els.accommodationRemainingBudget.textContent = formatCurrency(remainingBudget);
    els.accommodationRemainingDaily.textContent = formatCurrency(remainingDaily);
    els.accommodationSpentToday.textContent = formatCurrency(spentToday);
    setBudgetStatus(els.accommodationBudgetStatus, budgetStatus);
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
        '<div class="entry-line-1">' + escapeHtml(entry.type) + " - " + escapeHtml(entry.dayNumber) + "</div>",
        '<div class="entry-line-2">Date: ' + escapeHtml(formatEntryDate(entry.createdAt)) + noteText + "</div>",
        "</div>",
        '<div class="entry-amount">' + escapeHtml(formatCurrency(entry.amount)) + "</div>",
        "</div>",
        '<div class="entry-actions">',
        '<button type="button" class="small-action-btn edit-food-btn" data-id="' + escapeHtml(entry.id) + '">Edit</button>',
        '<button type="button" class="small-action-btn delete-btn delete-food-btn" data-id="' + escapeHtml(entry.id) + '">Delete</button>',
        "</div>"
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
        '<div class="entry-line-1">' + escapeHtml(entry.type) + " - " + escapeHtml(entry.dayNumber) + "</div>",
        '<div class="entry-line-2">Date: ' + escapeHtml(formatEntryDate(entry.createdAt)) + noteText + "</div>",
        "</div>",
        '<div class="entry-amount">' + escapeHtml(formatCurrency(entry.amount)) + "</div>",
        "</div>",
        '<div class="entry-actions">',
        '<button type="button" class="small-action-btn edit-acc-btn" data-id="' + escapeHtml(entry.id) + '">Edit</button>',
        '<button type="button" class="small-action-btn delete-btn delete-acc-btn" data-id="' + escapeHtml(entry.id) + '">Delete</button>',
        "</div>"
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

    positionFoodActionButtons();
    positionAccommodationActionButtons();
  }

  function positionFoodActionButtons() {
    if (currentEditFoodId) {
      if (els.addFoodBtn.parentElement !== layoutEls.foodActionRow) {
        layoutEls.foodActionRow.appendChild(els.addFoodBtn);
      }
    } else {
      if (els.addFoodBtn.parentElement !== layoutEls.foodEntryRow) {
        layoutEls.foodEntryRow.appendChild(els.addFoodBtn);
      }
    }
  }

  function positionAccommodationActionButtons() {
    if (currentEditAccommodationId) {
      if (els.addAccommodationBtn.parentElement !== layoutEls.accommodationActionRow) {
        layoutEls.accommodationActionRow.appendChild(els.addAccommodationBtn);
      }
    } else {
      if (els.addAccommodationBtn.parentElement !== layoutEls.accommodationEntryRow) {
        layoutEls.accommodationEntryRow.appendChild(els.addAccommodationBtn);
      }
    }
  }

  function calculateBudgetStatus(totalBudget, totalSpent, entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return 0;
    }

    const dailyBudget = appState.numberOfDays > 0 ? totalBudget / appState.numberOfDays : 0;
    const uniqueEntryDays = countUniqueEntryDays(entries);
    const expectedSpendForEnteredDays = dailyBudget * uniqueEntryDays;

    return expectedSpendForEnteredDays - totalSpent;
  }

  function countUniqueEntryDays(entries) {
    const days = new Set();

    entries.forEach(function (entry) {
      if (entry && entry.dayNumber) {
        days.add(sanitizeDayNumber(entry.dayNumber));
      }
    });

    return days.size;
  }

  function setBudgetStatus(element, amount) {
    if (!element) {
      return;
    }

    const rounded = Math.round(amount * 100) / 100;

    element.classList.remove("budget-status-plus", "budget-status-minus", "budget-status-zero");

    if (rounded > 0) {
      element.textContent = "+" + formatCurrency(rounded);
      element.classList.add("budget-status-plus");
    } else if (rounded < 0) {
      element.textContent = "-" + formatCurrency(Math.abs(rounded));
      element.classList.add("budget-status-minus");
    } else {
      element.textContent = formatCurrency(0);
      element.classList.add("budget-status-zero");
    }
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

    if (appState.currency === "GBP") {
      return "£" + num.toFixed(2);
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

  function ensureTripState() {
    if (!Array.isArray(appState.trips) || appState.trips.length === 0) {
      const tripId = appState.activeTripId || createId();
      appState.activeTripId = tripId;
      appState.tripName = sanitizeTripName(appState.tripName) || DEFAULT_TRIP_NAME;
      appState.trips = [buildTripFromState(tripId, appState.tripName)];
      return;
    }

    appState.trips = appState.trips.map(function (trip, index) {
      return normalizeTrip(trip, "Trip " + (index + 1));
    });

    const activeTrip = findActiveTrip() || appState.trips[0];
    applyTripToState(activeTrip);
  }

  function buildTripFromState(id, name) {
    return {
      id: id || createId(),
      name: sanitizeTripName(name) || DEFAULT_TRIP_NAME,
      currency: appState.currency || "EUR",
      numberOfDays: Number.isFinite(appState.numberOfDays) ? appState.numberOfDays : 40,
      dayNumber: sanitizeDayNumber(appState.dayNumber),
      foodBudget: sanitiseMoney(appState.foodBudget),
      accommodationBudget: sanitiseMoney(appState.accommodationBudget),
      foodEntries: cloneEntries(appState.foodEntries),
      accommodationEntries: cloneEntries(appState.accommodationEntries)
    };
  }

  function createBlankTrip(name) {
    return {
      id: createId(),
      name: sanitizeTripName(name) || getNextTripName(),
      currency: appState.currency || "EUR",
      numberOfDays: Number.isFinite(appState.numberOfDays) ? appState.numberOfDays : 40,
      dayNumber: "D1",
      foodBudget: 0,
      accommodationBudget: 0,
      foodEntries: [],
      accommodationEntries: []
    };
  }

  function normalizeTrip(trip, fallbackName) {
    const cleanTrip = trip && typeof trip === "object" ? trip : {};

    return {
      id: cleanTrip.id || createId(),
      name: sanitizeTripName(cleanTrip.name) || fallbackName || DEFAULT_TRIP_NAME,
      currency: cleanTrip.currency || "EUR",
      numberOfDays: Number.isFinite(cleanTrip.numberOfDays) ? cleanTrip.numberOfDays : 40,
      dayNumber: sanitizeDayNumber(cleanTrip.dayNumber || "D1"),
      foodBudget: sanitiseMoney(cleanTrip.foodBudget),
      accommodationBudget: sanitiseMoney(cleanTrip.accommodationBudget),
      foodEntries: Array.isArray(cleanTrip.foodEntries) ? cloneEntries(cleanTrip.foodEntries) : [],
      accommodationEntries: Array.isArray(cleanTrip.accommodationEntries) ? cloneEntries(cleanTrip.accommodationEntries) : []
    };
  }

  function findActiveTrip() {
    return appState.trips.find(function (trip) {
      return trip.id === appState.activeTripId;
    });
  }

  function applyTripToState(trip) {
    appState.activeTripId = trip.id;
    appState.tripName = sanitizeTripName(trip.name) || DEFAULT_TRIP_NAME;
    appState.currency = trip.currency || "EUR";
    appState.numberOfDays = Number.isFinite(trip.numberOfDays) ? trip.numberOfDays : 40;
    appState.dayNumber = sanitizeDayNumber(trip.dayNumber || "D1");
    appState.foodBudget = sanitiseMoney(trip.foodBudget);
    appState.accommodationBudget = sanitiseMoney(trip.accommodationBudget);
    appState.foodEntries = Array.isArray(trip.foodEntries) ? cloneEntries(trip.foodEntries) : [];
    appState.accommodationEntries = Array.isArray(trip.accommodationEntries) ? cloneEntries(trip.accommodationEntries) : [];
  }

  function updateActiveTripFromState() {
    const activeTrip = findActiveTrip();

    if (!activeTrip) {
      return;
    }

    const updatedTrip = buildTripFromState(appState.activeTripId, appState.tripName);

    Object.keys(updatedTrip).forEach(function (key) {
      activeTrip[key] = updatedTrip[key];
    });
  }

  function cloneEntries(entries) {
    return entries.map(function (entry) {
      return Object.assign({}, entry);
    });
  }

  function sanitizeTripName(name) {
    return String(name || "").trim().replace(/\s+/g, " ").slice(0, 48);
  }

  function getNextTripName() {
    let index = appState.trips.length + 1;
    let name = "Trip " + index;

    while (appState.trips.some(function (trip) { return trip.name === name; })) {
      index += 1;
      name = "Trip " + index;
    }

    return name;
  }

  function switchTrip(tripId) {
    if (!tripId || tripId === appState.activeTripId) {
      return;
    }

    updateActiveTripFromState();

    const nextTrip = appState.trips.find(function (trip) {
      return trip.id === tripId;
    });

    if (!nextTrip) {
      renderTripControls();
      return;
    }

    cancelFoodEdit(false);
    cancelAccommodationEdit(false);
    clearFoodEntryInputs();
    clearAccommodationEntryInputs();
    applyTripToState(nextTrip);
    saveState();
    syncInputsFromState();
    renderAll();
  }

  async function addTrip() {
    updateActiveTripFromState();

    const requestedName = sanitizeTripName(els.tripNameInput.value);
    const activeName = sanitizeTripName(appState.tripName);
    const tripName = requestedName && requestedName !== activeName ? requestedName : getNextTripName();

    if (isTripNameTaken(tripName)) {
      await showInfo("A trip with that name already exists.");
      return;
    }

    const newTrip = createBlankTrip(tripName);

    appState.trips.push(newTrip);
    cancelFoodEdit(false);
    cancelAccommodationEdit(false);
    clearFoodEntryInputs();
    clearAccommodationEntryInputs();
    applyTripToState(newTrip);
    saveState();
    syncInputsFromState();
    renderAll();
    await showInfo("Trip added: " + newTrip.name);
  }

  async function renameTrip() {
    const activeTrip = findActiveTrip();
    const requestedName = sanitizeTripName(els.tripNameInput.value);

    if (!activeTrip) {
      await showInfo("The current trip could not be found.");
      return;
    }

    if (!requestedName) {
      await showInfo("Please enter a trip name.");
      return;
    }

    if (isTripNameTaken(requestedName, activeTrip.id)) {
      await showInfo("A trip with that name already exists.");
      return;
    }

    appState.tripName = requestedName;
    activeTrip.name = requestedName;
    saveState();
    syncInputsFromState();
    renderAll();
    await showInfo("Trip renamed.");
  }

  function isTripNameTaken(name, excludedTripId) {
    return appState.trips.some(function (trip) {
      return trip.id !== excludedTripId && trip.name.toLowerCase() === name.toLowerCase();
    });
  }

  async function deleteCurrentTrip() {
    const activeTrip = findActiveTrip();

    if (!activeTrip) {
      await showInfo("The current trip could not be found.");
      return;
    }

    if (appState.trips.length <= 1) {
      await showInfo("You need at least one trip.");
      return;
    }

    const confirmed = await showConfirm(
      "Delete trip \"" + activeTrip.name + "\"?\n\n" +
      "This will delete its budgets, Food entries, and Accommodation entries. This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    appState.trips = appState.trips.filter(function (trip) {
      return trip.id !== activeTrip.id;
    });

    cancelFoodEdit(false);
    cancelAccommodationEdit(false);
    clearFoodEntryInputs();
    clearAccommodationEntryInputs();
    applyTripToState(appState.trips[0]);
    saveState();
    syncInputsFromState();
    renderAll();
    await showInfo("Trip deleted.");
  }

  function clearFoodEntries() {
    appState.foodEntries = [];

    currentEditFoodId = null;

    clearFoodEntryInputs();
    saveState();
    syncInputsFromState();
    renderAll();
  }

  function clearAccommodationEntries() {
    appState.accommodationEntries = [];

    currentEditAccommodationId = null;

    clearAccommodationEntryInputs();
    saveState();
    syncInputsFromState();
    renderAll();
  }

  function saveState() {
    updateActiveTripFromState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);

      appState.activeTripId = parsed.activeTripId || appState.activeTripId;
      appState.tripName = sanitizeTripName(parsed.tripName) || appState.tripName;
      appState.currency = parsed.currency || appState.currency;
      appState.numberOfDays = Number.isFinite(parsed.numberOfDays) ? parsed.numberOfDays : appState.numberOfDays;
      appState.dayNumber = parsed.dayNumber || appState.dayNumber;
      appState.foodBudget = Number.isFinite(parsed.foodBudget) ? parsed.foodBudget : appState.foodBudget;
      appState.accommodationBudget = Number.isFinite(parsed.accommodationBudget) ? parsed.accommodationBudget : appState.accommodationBudget;
      appState.foodEntries = Array.isArray(parsed.foodEntries) ? parsed.foodEntries : [];
      appState.accommodationEntries = Array.isArray(parsed.accommodationEntries) ? parsed.accommodationEntries : [];
      appState.trips = Array.isArray(parsed.trips) ? parsed.trips : [];
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

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(window.location.protocol)) {
      return;
    }

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").then(function (registration) {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", function () {
          const newWorker = registration.installing;

          if (!newWorker) {
            return;
          }

          newWorker.addEventListener("statechange", function () {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      }).catch(function (error) {
        console.error("Offline support could not be enabled.", error);
      });
    });
  }

  async function updateAppCache() {
    if (!navigator.onLine) {
      await showInfo("You are offline. Connect to the internet before updating the app.");
      return;
    }

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration) {
          await registration.update();

          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        }
      }

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(function (cacheName) {
              return cacheName.indexOf(APP_CACHE_PREFIX) === 0;
            })
            .map(function (cacheName) {
              return caches.delete(cacheName);
            })
        );
      }

      window.location.reload();
    } catch (error) {
      console.error("App update failed.", error);
      await showInfo("The app could not update right now. Please try again while online.");
    }
  }
})();
