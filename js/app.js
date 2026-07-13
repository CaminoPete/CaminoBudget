// Version #53 July 13, 2026

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
    foodBudget: 0,
    accommodationBudget: 0,
    miscBudget: 0,
    fundAmount: 0,
    foodEntries: [],
    accommodationEntries: [],
    miscEntries: [],
    fundTransfers: [],
    trips: []
  };

  const els = {
    tripNameDisplay: document.getElementById("tripNameDisplay"),
    updateAppBtn: document.getElementById("updateAppBtn"),
    currencySelect: document.getElementById("currencySelect"),
    daysInput: document.getElementById("daysInput"),
    confirmDaysBtn: document.getElementById("confirmDaysBtn"),
    dayNumberInput: document.getElementById("dayNumberInput"),
    confirmDayNumberBtn: document.getElementById("confirmDayNumberBtn"),
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
    confirmFoodAmountBtn: document.getElementById("confirmFoodAmountBtn"),
    foodPaymentSelect: document.getElementById("foodPaymentSelect"),
    foodNoteInput: document.getElementById("foodNoteInput"),
    confirmFoodNoteBtn: document.getElementById("confirmFoodNoteBtn"),
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
    confirmAccommodationAmountBtn: document.getElementById("confirmAccommodationAmountBtn"),
    accommodationPaymentSelect: document.getElementById("accommodationPaymentSelect"),
    accommodationNoteInput: document.getElementById("accommodationNoteInput"),
    confirmAccommodationNoteBtn: document.getElementById("confirmAccommodationNoteBtn"),
    addAccommodationBtn: document.getElementById("addAccommodationBtn"),
    cancelAccommodationEditBtn: document.getElementById("cancelAccommodationEditBtn"),
    accommodationEntriesList: document.getElementById("accommodationEntriesList"),

    miscHeading: document.getElementById("miscHeading"),
    miscHeadingDate: document.getElementById("miscHeadingDate"),
    miscBudgetInput: document.getElementById("miscBudgetInput"),
    miscBalance: document.getElementById("miscBalance"),
    miscEntryHeading: document.getElementById("miscEntryHeading"),
    miscEditStatus: document.getElementById("miscEditStatus"),
    miscItemInput: document.getElementById("miscItemInput"),
    miscCostInput: document.getElementById("miscCostInput"),
    confirmMiscCostBtn: document.getElementById("confirmMiscCostBtn"),
    miscPaymentSelect: document.getElementById("miscPaymentSelect"),
    miscNoteInput: document.getElementById("miscNoteInput"),
    confirmMiscNoteBtn: document.getElementById("confirmMiscNoteBtn"),
    addMiscBtn: document.getElementById("addMiscBtn"),
    cancelMiscEditBtn: document.getElementById("cancelMiscEditBtn"),
    miscEntriesList: document.getElementById("miscEntriesList"),

    fundAmountInput: document.getElementById("fundAmountInput"),
    confirmFundAmountBtn: document.getElementById("confirmFundAmountBtn"),
    fundBalance: document.getElementById("fundBalance"),
    fundTransferAmountInput: document.getElementById("fundTransferAmountInput"),
    confirmFundTransferAmountBtn: document.getElementById("confirmFundTransferAmountBtn"),
    fundTransferFromSelect: document.getElementById("fundTransferFromSelect"),
    fundTransferToSelect: document.getElementById("fundTransferToSelect"),
    updateFundTransferBtn: document.getElementById("updateFundTransferBtn"),
    fundTransfersList: document.getElementById("fundTransfersList"),

    modalOverlay: document.getElementById("appModalOverlay"),
    modalTitle: document.getElementById("appModalTitle"),
    modalBody: document.getElementById("appModalBody"),
    modalOk: document.getElementById("appModalOk"),
    modalCancel: document.getElementById("appModalCancel"),
    clearFoodBtn: document.getElementById("clearFoodBtn"),
    clearAccommodationBtn: document.getElementById("clearAccommodationBtn"),
    clearMiscBtn: document.getElementById("clearMiscBtn"),
    tripSelect: document.getElementById("tripSelect"),
    tripNameInput: document.getElementById("tripNameInput"),
    confirmTripNameBtn: document.getElementById("confirmTripNameBtn"),
    addTripBtn: document.getElementById("addTripBtn"),
    renameTripBtn: document.getElementById("renameTripBtn"),
    deleteTripBtn: document.getElementById("deleteTripBtn")
  };

  const layoutEls = {
    foodEntryRow: els.addFoodBtn.parentElement,
    foodActionRow: els.cancelFoodEditBtn.parentElement,
    accommodationEntryRow: els.addAccommodationBtn.parentElement,
    accommodationActionRow: els.cancelAccommodationEditBtn.parentElement,
    miscEntryRow: els.addMiscBtn.parentElement,
    miscActionRow: els.cancelMiscEditBtn.parentElement
  };

  let modalResolver = null;
  let currentEditFoodId = null;
  let currentEditAccommodationId = null;
  let currentEditMiscId = null;
  let pendingUpdateWorker = null;
  let refreshingForUpdate = false;

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

    bindCurrencyInput(els.fundAmountInput, function (value) {
      appState.fundAmount = value;
      saveState();
      renderAll();
    });

    bindCurrencyInput(els.foodAmountInput, function () {});
    bindCurrencyInput(els.accommodationAmountInput, function () {});
    bindCurrencyInput(els.miscCostInput, function () {});
    bindCurrencyInput(els.fundTransferAmountInput, function () {});

    bindConfirmButton(els.confirmDaysBtn, els.daysInput, true);
    bindConfirmButton(els.confirmDayNumberBtn, els.dayNumberInput, true);
    bindConfirmButton(els.confirmFundAmountBtn, els.fundAmountInput, false);
    bindConfirmButton(els.confirmFoodAmountBtn, els.foodAmountInput, false);
    bindConfirmButton(els.confirmAccommodationAmountBtn, els.accommodationAmountInput, false);
    bindConfirmButton(els.confirmMiscCostBtn, els.miscCostInput, false);
    bindConfirmButton(els.confirmFundTransferAmountBtn, els.fundTransferAmountInput, false);
    bindConfirmButton(els.confirmFoodNoteBtn, els.foodNoteInput, false);
    bindConfirmButton(els.confirmAccommodationNoteBtn, els.accommodationNoteInput, false);
    bindConfirmButton(els.confirmMiscNoteBtn, els.miscNoteInput, false);
    bindConfirmButton(els.confirmTripNameBtn, els.tripNameInput, false);

    els.addFoodBtn.addEventListener("click", onAddOrUpdateFood);
    els.addAccommodationBtn.addEventListener("click", onAddOrUpdateAccommodation);
    els.addMiscBtn.addEventListener("click", onAddOrUpdateMisc);
    els.updateFundTransferBtn.addEventListener("click", onUpdateFundTransfer);

    els.cancelFoodEditBtn.addEventListener("click", function () {
      cancelFoodEdit(true);
      renderAll();
    });

    els.cancelAccommodationEditBtn.addEventListener("click", function () {
      cancelAccommodationEdit(true);
      renderAll();
    });

    els.cancelMiscEditBtn.addEventListener("click", function () {
      cancelMiscEdit(true);
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

    els.clearMiscBtn.addEventListener("click", async function () {
      if (!appState.miscEntries.length) {
        await showInfo("There are no Misc. & Other entries to clear.");
        return;
      }

      const confirmed = await showConfirm(
        "Clear all Misc. & Other entries?\n\nThis cannot be undone. Your Misc. & Other budget will stay the same."
      );
      if (!confirmed) return;

      clearMiscEntries();
      await showInfo("Misc. & Other entries cleared.");
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
      inputEl.value = numericValue === 0 && !isPersistentCurrencyInput(inputEl)
        ? ""
        : formatCurrency(numericValue);
      onValueCommit(numericValue);
    });
  }

  function isPersistentCurrencyInput(inputEl) {
    return inputEl === els.foodBudgetInput ||
      inputEl === els.accommodationBudgetInput ||
      inputEl === els.miscBudgetInput ||
      inputEl === els.fundAmountInput;
  }

  function bindConfirmButton(buttonEl, inputEl, dispatchChange) {
    if (!buttonEl || !inputEl) {
      return;
    }

    buttonEl.addEventListener("click", function () {
      if (dispatchChange) {
        inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      }

      inputEl.blur();
      buttonEl.focus();
    });
  }

  function syncInputsFromState() {
    els.tripNameDisplay.textContent = appState.tripName;
    els.currencySelect.value = appState.currency;
    els.daysInput.value = appState.numberOfDays;
    els.dayNumberInput.value = appState.dayNumber;
    els.foodBudgetInput.value = formatCurrency(appState.foodBudget);
    els.accommodationBudgetInput.value = formatCurrency(appState.accommodationBudget);
    els.miscBudgetInput.value = formatCurrency(appState.miscBudget);
    els.fundAmountInput.value = formatCurrency(appState.fundAmount);
    els.tripNameInput.value = appState.tripName;
  }

  function formatAllCurrencyInputs() {
    if (document.activeElement !== els.foodBudgetInput) {
      els.foodBudgetInput.value = formatCurrency(appState.foodBudget);
    }
    if (document.activeElement !== els.accommodationBudgetInput) {
      els.accommodationBudgetInput.value = formatCurrency(appState.accommodationBudget);
    }
    if (document.activeElement !== els.miscBudgetInput) {
      els.miscBudgetInput.value = formatCurrency(appState.miscBudget);
    }
    if (document.activeElement !== els.fundAmountInput) {
      els.fundAmountInput.value = formatCurrency(appState.fundAmount);
    }

    const foodAmountValue = parseCurrencyInputValue(els.foodAmountInput.value);
    const accommodationAmountValue = parseCurrencyInputValue(els.accommodationAmountInput.value);
    const miscCostValue = parseCurrencyInputValue(els.miscCostInput.value);
    const fundTransferAmountValue = parseCurrencyInputValue(els.fundTransferAmountInput.value);

    if (document.activeElement !== els.foodAmountInput) {
      els.foodAmountInput.value = foodAmountValue ? formatCurrency(foodAmountValue) : "";
    }
    if (document.activeElement !== els.accommodationAmountInput) {
      els.accommodationAmountInput.value = accommodationAmountValue ? formatCurrency(accommodationAmountValue) : "";
    }
    if (document.activeElement !== els.miscCostInput) {
      els.miscCostInput.value = miscCostValue ? formatCurrency(miscCostValue) : "";
    }
    if (document.activeElement !== els.fundTransferAmountInput) {
      els.fundTransferAmountInput.value = fundTransferAmountValue ? formatCurrency(fundTransferAmountValue) : "";
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

    els.miscHeading.querySelector(".section-main").textContent = "Misc. & Other - for " + dayLabel;
    els.miscHeadingDate.textContent = headingDate;
    els.miscEntryHeading.innerHTML = (currentEditMiscId ? 'Edit Misc. & Other Entry <span>- for ' : 'Add Misc. & Other Entry <span>- for ') + escapeHtml(dayLabel) + '</span>';

    renderFoodSummary();
    renderAccommodationSummary();
    renderMiscSummary();
    renderFundsSummary();
    renderFoodEntries();
    renderAccommodationEntries();
    renderMiscEntries();
    renderFundTransfers();
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

  function renderMiscSummary() {
    const totalBudget = Number(appState.miscBudget) || 0;
    const totalSpent = sumEntries(appState.miscEntries);
    const remainingBudget = totalBudget - totalSpent;

    els.miscBalance.textContent = formatCurrency(remainingBudget);
  }

  function renderFundsSummary() {
    els.fundBalance.textContent = formatCurrency(calculateFundBalance());
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
      const paymentText = "Paid: " + escapeHtml(getEntryPaymentMethod(entry));

      const noteText = entry.note ? " • Note: " + escapeHtml(entry.note) : "";

      item.innerHTML = [
        '<div class="entry-top">',
        '<div class="entry-main">',
        '<div class="entry-line-1">' + escapeHtml(entry.type) + " - " + escapeHtml(entry.dayNumber) + "</div>",
        '<div class="entry-line-2">Date: ' + escapeHtml(formatEntryDate(entry.createdAt)) + " - " + paymentText + noteText + "</div>",
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
      const paymentText = "Paid: " + escapeHtml(getEntryPaymentMethod(entry));

      const noteText = entry.note ? " • Note: " + escapeHtml(entry.note) : "";

      item.innerHTML = [
        '<div class="entry-top">',
        '<div class="entry-main">',
        '<div class="entry-line-1">' + escapeHtml(entry.type) + " - " + escapeHtml(entry.dayNumber) + "</div>",
        '<div class="entry-line-2">Date: ' + escapeHtml(formatEntryDate(entry.createdAt)) + " - " + paymentText + noteText + "</div>",
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

  function renderMiscEntries() {
    els.miscEntriesList.innerHTML = "";

    const sorted = getSortedEntries(appState.miscEntries);
    if (!sorted.length) {
      els.miscEntriesList.innerHTML = '<div class="empty-state">No misc. & other entries yet.</div>';
      return;
    }

    const dayClassMap = buildDayAlternatingMap(sorted, "misc");

    sorted.forEach(function (entry) {
      const item = document.createElement("div");
      item.className = "entry-item " + dayClassMap[entry.dayKey];

      const noteText = entry.note ? " - Note: " + escapeHtml(entry.note) : "";

      item.innerHTML = [
        '<div class="entry-top">',
        '<div class="entry-main">',
        '<div class="entry-line-1">' + escapeHtml(entry.item) + " - " + escapeHtml(entry.dayNumber) + "</div>",
        '<div class="entry-line-2">Date: ' + escapeHtml(formatEntryDate(entry.createdAt)) + noteText + "</div>",
        "</div>",
        '<div class="entry-amount">' + escapeHtml(formatCurrency(entry.amount)) + "</div>",
        "</div>",
        '<div class="entry-actions">',
        '<button type="button" class="small-action-btn edit-misc-btn" data-id="' + escapeHtml(entry.id) + '">Edit</button>',
        '<button type="button" class="small-action-btn delete-btn delete-misc-btn" data-id="' + escapeHtml(entry.id) + '">Delete</button>',
        "</div>"
      ].join("");

      els.miscEntriesList.appendChild(item);
    });

    els.miscEntriesList.querySelectorAll(".edit-misc-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        startEditMisc(btn.getAttribute("data-id"));
      });
    });

    els.miscEntriesList.querySelectorAll(".delete-misc-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteMiscEntry(btn.getAttribute("data-id"));
      });
    });
  }

  function renderFundTransfers() {
    els.fundTransfersList.innerHTML = "";

    const sorted = appState.fundTransfers.slice().sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (!sorted.length) {
      els.fundTransfersList.innerHTML = '<div class="empty-state">No fund transfers yet.</div>';
      return;
    }

    sorted.forEach(function (transfer) {
      const item = document.createElement("div");
      item.className = "entry-item";
      const fromAccount = getTransferFromAccount(transfer);
      const toAccount = getTransferToAccount(transfer);

      item.innerHTML = [
        '<div class="entry-top">',
        '<div class="entry-main">',
        '<div class="entry-line-1">' + escapeHtml(fromAccount) + " -> " + escapeHtml(toAccount) + "</div>",
        '<div class="entry-line-2">Date: ' + escapeHtml(formatEntryDate(transfer.createdAt)) + "</div>",
        "</div>",
        '<div class="entry-amount">' + escapeHtml(formatCurrency(transfer.amount)) + "</div>",
        "</div>",
        '<div class="entry-actions">',
        '<button type="button" class="small-action-btn delete-btn delete-fund-transfer-btn" data-id="' + escapeHtml(transfer.id) + '">Delete</button>',
        "</div>"
      ].join("");

      els.fundTransfersList.appendChild(item);
    });

    els.fundTransfersList.querySelectorAll(".delete-fund-transfer-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteFundTransfer(btn.getAttribute("data-id"));
      });
    });
  }

  async function onAddOrUpdateFood() {
    const type = els.foodTypeSelect.value;
    const amount = sanitiseMoney(parseCurrencyInputValue(els.foodAmountInput.value));
    const paymentMethod = els.foodPaymentSelect.value;
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
      entry.paymentMethod = paymentMethod;
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
      paymentMethod: paymentMethod,
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
    const paymentMethod = els.accommodationPaymentSelect.value;
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
      entry.paymentMethod = paymentMethod;
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
      existingForDay.paymentMethod = paymentMethod;
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
      paymentMethod: paymentMethod,
      note: note,
      dayNumber: appState.dayNumber,
      dayKey: buildDaySortKey(appState.dayNumber),
      createdAt: new Date().toISOString()
    });

    clearAccommodationEntryInputs();
    saveState();
    renderAll();
  }

  async function onAddOrUpdateMisc() {
    const itemName = sanitizeEntryText(els.miscItemInput.value);
    const amount = sanitiseMoney(parseCurrencyInputValue(els.miscCostInput.value));
    const paymentMethod = els.miscPaymentSelect.value;
    const note = els.miscNoteInput.value.trim();

    if (!itemName) {
      await showInfo("Please enter or select a Misc. & Other item.");
      return;
    }

    if (amount <= 0) {
      await showInfo("Please enter a valid Misc. & Other cost greater than 0.");
      return;
    }

    if (currentEditMiscId) {
      const entry = appState.miscEntries.find(function (existingEntry) {
        return existingEntry.id === currentEditMiscId;
      });

      if (!entry) {
        cancelMiscEdit();
        renderAll();
        await showInfo("That Misc. & Other entry could not be found.");
        return;
      }

      entry.item = itemName;
      entry.type = itemName;
      entry.amount = amount;
      entry.paymentMethod = paymentMethod;
      entry.note = note;
      entry.dayNumber = appState.dayNumber;
      entry.dayKey = buildDaySortKey(appState.dayNumber);

      cancelMiscEdit(false);
      clearMiscEntryInputs();
      saveState();
      renderAll();
      await showInfo("Misc. & Other entry updated.");
      return;
    }

    appState.miscEntries.push({
      id: createId(),
      item: itemName,
      type: itemName,
      amount: amount,
      paymentMethod: paymentMethod,
      note: note,
      dayNumber: appState.dayNumber,
      dayKey: buildDaySortKey(appState.dayNumber),
      createdAt: new Date().toISOString()
    });

    clearMiscEntryInputs();
    saveState();
    renderAll();
  }

  async function onUpdateFundTransfer() {
    const amount = sanitiseMoney(parseCurrencyInputValue(els.fundTransferAmountInput.value));
    const fromAccount = els.fundTransferFromSelect.value;
    const toAccount = els.fundTransferToSelect.value;

    if (!fromAccount || !toAccount) {
      await showInfo("Please choose both Transfer FROM and Transfer TO accounts.");
      return;
    }

    if (amount <= 0) {
      await showInfo("Please enter a transfer amount greater than 0.");
      return;
    }

    if (fromAccount === toAccount) {
      await showInfo("Please choose two different accounts for the transfer.");
      return;
    }

    if (amount > getAccountBalance(fromAccount)) {
      const confirmed = await showConfirm(
        "This transfer is greater than the current " + fromAccount + " balance.\n\nContinue anyway?"
      );

      if (!confirmed) {
        resetFundTransferInputs();
        return;
      }
    }

    const confirmed = await showConfirm(
      "Transfer " + formatCurrency(amount) + " from " + fromAccount + " to " + toAccount + "?\n\n" +
      "Press OK to complete the transfer or Cancel to change your mind."
    );

    if (!confirmed) {
      resetFundTransferInputs();
      return;
    }

    applyAccountTransfer(fromAccount, toAccount, amount);

    appState.fundTransfers.push({
      id: createId(),
      from: fromAccount,
      to: toAccount,
      amount: amount,
      createdAt: new Date().toISOString()
    });

    resetFundTransferInputs();
    saveState();
    syncInputsFromState();
    renderAll();
  }

  async function deleteFundTransfer(id) {
    const transfer = appState.fundTransfers.find(function (item) {
      return item.id === id;
    });

    if (!transfer) {
      await showInfo("That Fund transfer could not be found.");
      return;
    }

    const confirmed = await showConfirm(
      "Delete this Fund transfer?\n\n" +
      "From: " + getTransferFromAccount(transfer) + "\n" +
      "To: " + getTransferToAccount(transfer) + "\n" +
      "Amount: " + formatCurrency(transfer.amount) + "\n" +
      "Date: " + formatEntryDate(transfer.createdAt) + "\n\n" +
      "This will reverse the transfer."
    );

    if (!confirmed) {
      return;
    }

    applyAccountTransfer(getTransferToAccount(transfer), getTransferFromAccount(transfer), transfer.amount);
    appState.fundTransfers = appState.fundTransfers.filter(function (item) {
      return item.id !== id;
    });

    saveState();
    syncInputsFromState();
    renderAll();
  }

  function applyAccountTransfer(fromAccount, toAccount, amount) {
    setAccountBalance(fromAccount, getAccountBalance(fromAccount) - amount);
    setAccountBalance(toAccount, getAccountBalance(toAccount) + amount);
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
    cancelMiscEdit(false);
    currentEditFoodId = id;
    appState.dayNumber = entry.dayNumber;

    syncInputsFromState();
    renderAll();

    setTimeout(function () {
      els.foodTypeSelect.value = entry.type;
      els.foodAmountInput.value = Number(entry.amount).toFixed(2);
      els.foodPaymentSelect.value = getEntryPaymentMethod(entry);
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
    cancelMiscEdit(false);
    currentEditAccommodationId = id;
    appState.dayNumber = entry.dayNumber;

    syncInputsFromState();
    renderAll();

    setTimeout(function () {
      els.accommodationTypeSelect.value = entry.type;
      els.accommodationAmountInput.value = Number(entry.amount).toFixed(2);
      els.accommodationPaymentSelect.value = getEntryPaymentMethod(entry);
      els.accommodationNoteInput.value = entry.note || "";
      updateFormButtonStates();
    }, 0);
  }

  function startEditMisc(id) {
    const entry = appState.miscEntries.find(function (item) {
      return item.id === id;
    });

    if (!entry) {
      showInfo("That Misc. & Other entry could not be found.");
      return;
    }

    cancelFoodEdit(false);
    cancelAccommodationEdit(false);
    currentEditMiscId = id;
    appState.dayNumber = entry.dayNumber;

    syncInputsFromState();
    renderAll();

    setTimeout(function () {
      setMiscItemSelectValue(entry.item || entry.type || "");
      els.miscCostInput.value = Number(entry.amount).toFixed(2);
      els.miscPaymentSelect.value = getEntryPaymentMethod(entry);
      els.miscNoteInput.value = entry.note || "";
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

  async function deleteMiscEntry(id) {
    const entry = appState.miscEntries.find(function (item) {
      return item.id === id;
    });

    if (!entry) {
      await showInfo("That Misc. & Other entry could not be found.");
      return;
    }

    const confirmed = await showConfirm(
      "Delete this Misc. & Other entry?\n\n" +
      "Day: " + entry.dayNumber + "\n" +
      "Item: " + (entry.item || entry.type) + "\n" +
      "Cost: " + formatCurrency(entry.amount) + "\n" +
      "Date: " + formatEntryDate(entry.createdAt) +
      (entry.note ? "\nNote: " + entry.note : "")
    );

    if (!confirmed) {
      return;
    }

    appState.miscEntries = appState.miscEntries.filter(function (item) {
      return item.id !== id;
    });

    if (currentEditMiscId === id) {
      cancelMiscEdit(false);
      clearMiscEntryInputs();
    }

    saveState();
    renderAll();
  }

  function clearFoodEntryInputs() {
    els.foodTypeSelect.value = "Breakfast";
    els.foodAmountInput.value = "";
    els.foodPaymentSelect.value = "Cash";
    els.foodNoteInput.value = "";
  }

  function clearAccommodationEntryInputs() {
    els.accommodationTypeSelect.value = "Albergue";
    els.accommodationAmountInput.value = "";
    els.accommodationPaymentSelect.value = "Cash";
    els.accommodationNoteInput.value = "";
  }

  function clearMiscEntryInputs() {
    removeCustomMiscItemOption();
    els.miscItemInput.value = "";
    els.miscCostInput.value = "";
    els.miscPaymentSelect.value = "Cash";
    els.miscNoteInput.value = "";
  }

  function setMiscItemSelectValue(value) {
    const cleanValue = sanitizeEntryText(value);

    if (!cleanValue) {
      els.miscItemInput.value = "";
      return;
    }

    const existingOption = Array.from(els.miscItemInput.options).find(function (option) {
      return option.value === cleanValue;
    });

    if (!existingOption) {
      removeCustomMiscItemOption();
      const option = document.createElement("option");
      option.value = cleanValue;
      option.textContent = cleanValue;
      option.setAttribute("data-custom", "true");
      els.miscItemInput.appendChild(option);
    }

    els.miscItemInput.value = cleanValue;
  }

  function removeCustomMiscItemOption() {
    Array.from(els.miscItemInput.querySelectorAll("option[data-custom='true']")).forEach(function (option) {
      option.remove();
    });
  }

  function resetFundTransferInputs() {
    els.fundTransferFromSelect.value = "";
    els.fundTransferToSelect.value = "";
    els.fundTransferAmountInput.value = "0.00";
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

  function cancelMiscEdit(clearFields = true) {
    currentEditMiscId = null;
    if (clearFields) {
      clearMiscEntryInputs();
    }
    updateFormButtonStates();
  }

  function updateFormButtonStates() {
    els.addFoodBtn.textContent = currentEditFoodId ? "Update Entry" : "Add Entry";
    els.addAccommodationBtn.textContent = currentEditAccommodationId ? "Update Entry" : "Add Entry";
    els.addMiscBtn.textContent = currentEditMiscId ? "Update Entry" : "Add Entry";

    els.cancelFoodEditBtn.classList.toggle("hidden", !currentEditFoodId);
    els.cancelAccommodationEditBtn.classList.toggle("hidden", !currentEditAccommodationId);
    els.cancelMiscEditBtn.classList.toggle("hidden", !currentEditMiscId);

    els.foodEditStatus.classList.toggle("hidden", !currentEditFoodId);
    els.accommodationEditStatus.classList.toggle("hidden", !currentEditAccommodationId);
    els.miscEditStatus.classList.toggle("hidden", !currentEditMiscId);

    els.foodTypeSelect.classList.toggle("editing-active", Boolean(currentEditFoodId));
    els.foodAmountInput.classList.toggle("editing-active", Boolean(currentEditFoodId));
    els.foodPaymentSelect.classList.toggle("editing-active", Boolean(currentEditFoodId));
    els.foodNoteInput.classList.toggle("editing-active", Boolean(currentEditFoodId));

    els.accommodationTypeSelect.classList.toggle("editing-active", Boolean(currentEditAccommodationId));
    els.accommodationAmountInput.classList.toggle("editing-active", Boolean(currentEditAccommodationId));
    els.accommodationPaymentSelect.classList.toggle("editing-active", Boolean(currentEditAccommodationId));
    els.accommodationNoteInput.classList.toggle("editing-active", Boolean(currentEditAccommodationId));

    els.miscItemInput.classList.toggle("editing-active", Boolean(currentEditMiscId));
    els.miscCostInput.classList.toggle("editing-active", Boolean(currentEditMiscId));
    els.miscPaymentSelect.classList.toggle("editing-active", Boolean(currentEditMiscId));
    els.miscNoteInput.classList.toggle("editing-active", Boolean(currentEditMiscId));

    positionFoodActionButtons();
    positionAccommodationActionButtons();
    positionMiscActionButtons();
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

  function positionMiscActionButtons() {
    if (currentEditMiscId) {
      if (els.addMiscBtn.parentElement !== layoutEls.miscActionRow) {
        layoutEls.miscActionRow.appendChild(els.addMiscBtn);
      }
    } else {
      if (els.addMiscBtn.parentElement !== layoutEls.miscEntryRow) {
        layoutEls.miscEntryRow.appendChild(els.addMiscBtn);
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
      } else if (type === "acc") {
        result[entry.dayKey] = toggle ? "acc-day-a" : "acc-day-b";
      } else {
        result[entry.dayKey] = toggle ? "misc-day-a" : "misc-day-b";
      }
    });

    return result;
  }

  function calculateFundBalance() {
    return Number(appState.fundAmount) || 0;
  }

  function getAccountBalance(accountName) {
    if (accountName === "Funds") {
      return Number(appState.fundAmount) || 0;
    }

    if (accountName === "Food") {
      return Number(appState.foodBudget) || 0;
    }

    if (accountName === "Accommodation") {
      return Number(appState.accommodationBudget) || 0;
    }

    return Number(appState.miscBudget) || 0;
  }

  function setAccountBalance(accountName, amount) {
    const cleanAmount = sanitiseBudget(amount);

    if (accountName === "Funds") {
      appState.fundAmount = cleanAmount;
    } else if (accountName === "Food") {
      appState.foodBudget = cleanAmount;
    } else if (accountName === "Accommodation") {
      appState.accommodationBudget = cleanAmount;
    } else {
      appState.miscBudget = cleanAmount;
    }
  }

  function getTransferFromAccount(transfer) {
    return transfer && transfer.from ? transfer.from : "Funds";
  }

  function getTransferToAccount(transfer) {
    return transfer && transfer.to ? transfer.to : (transfer && transfer.destination ? transfer.destination : "Food");
  }

  function getEntryPaymentMethod(entry) {
    const method = entry && entry.paymentMethod ? String(entry.paymentMethod) : "Cash";
    const allowedMethods = ["Cash", "WISE", "VISA", "Mastercard", "Other"];

    return allowedMethods.indexOf(method) === -1 ? "Cash" : method;
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

  function sanitiseBudget(value) {
    return sanitiseMoney(Math.max(0, Number(value) || 0));
  }

  function parseCurrencyInputValue(value) {
    const cleaned = String(value || "").replace(/[^0-9.\-]/g, "");
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  }

  function sanitizeEntryText(value) {
    return String(value || "").trim().replace(/\s+/g, " ").slice(0, 60);
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
      miscBudget: sanitiseMoney(appState.miscBudget),
      fundAmount: sanitiseMoney(appState.fundAmount),
      foodEntries: cloneEntries(appState.foodEntries),
      accommodationEntries: cloneEntries(appState.accommodationEntries),
      miscEntries: cloneEntries(appState.miscEntries),
      fundTransfers: normalizeFundTransfers(appState.fundTransfers)
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
      miscBudget: 0,
      fundAmount: 0,
      foodEntries: [],
      accommodationEntries: [],
      miscEntries: [],
      fundTransfers: []
    };
  }

  function normalizeTrip(trip, fallbackName) {
    const cleanTrip = trip && typeof trip === "object" ? trip : {};
    const cleanFundTransfers = normalizeFundTransfers(cleanTrip.fundTransfers);
    const legacyFundTransferTotal = getLegacyFundTransferTotal(cleanTrip.fundTransfers);

    return {
      id: cleanTrip.id || createId(),
      name: sanitizeTripName(cleanTrip.name) || fallbackName || DEFAULT_TRIP_NAME,
      currency: cleanTrip.currency || "EUR",
      numberOfDays: Number.isFinite(cleanTrip.numberOfDays) ? cleanTrip.numberOfDays : 40,
      dayNumber: sanitizeDayNumber(cleanTrip.dayNumber || "D1"),
      foodBudget: sanitiseMoney(cleanTrip.foodBudget),
      accommodationBudget: sanitiseMoney(cleanTrip.accommodationBudget),
      miscBudget: sanitiseMoney(cleanTrip.miscBudget),
      fundAmount: sanitiseBudget(sanitiseMoney(cleanTrip.fundAmount) - legacyFundTransferTotal),
      foodEntries: Array.isArray(cleanTrip.foodEntries) ? cloneEntries(cleanTrip.foodEntries) : [],
      accommodationEntries: Array.isArray(cleanTrip.accommodationEntries) ? cloneEntries(cleanTrip.accommodationEntries) : [],
      miscEntries: Array.isArray(cleanTrip.miscEntries) ? cloneEntries(cleanTrip.miscEntries) : [],
      fundTransfers: cleanFundTransfers
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
    appState.miscBudget = sanitiseMoney(trip.miscBudget);
    appState.fundAmount = sanitiseMoney(trip.fundAmount);
    appState.foodEntries = Array.isArray(trip.foodEntries) ? cloneEntries(trip.foodEntries) : [];
    appState.accommodationEntries = Array.isArray(trip.accommodationEntries) ? cloneEntries(trip.accommodationEntries) : [];
    appState.miscEntries = Array.isArray(trip.miscEntries) ? cloneEntries(trip.miscEntries) : [];
    appState.fundTransfers = Array.isArray(trip.fundTransfers) ? normalizeFundTransfers(trip.fundTransfers) : [];
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

  function normalizeFundTransfers(transfers) {
    if (!Array.isArray(transfers)) {
      return [];
    }

    return transfers.map(function (transfer) {
      const cleanTransfer = transfer && typeof transfer === "object" ? transfer : {};

      return {
        id: cleanTransfer.id || createId(),
        from: cleanTransfer.from || "Funds",
        to: cleanTransfer.to || cleanTransfer.destination || "Food",
        amount: sanitiseMoney(cleanTransfer.amount),
        createdAt: cleanTransfer.createdAt || new Date().toISOString()
      };
    });
  }

  function getLegacyFundTransferTotal(transfers) {
    if (!Array.isArray(transfers)) {
      return 0;
    }

    return transfers.reduce(function (sum, transfer) {
      if (transfer && transfer.destination && !transfer.from && !transfer.to) {
        return sum + (Number(transfer.amount) || 0);
      }

      return sum;
    }, 0);
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
    cancelMiscEdit(false);
    clearFoodEntryInputs();
    clearAccommodationEntryInputs();
    clearMiscEntryInputs();
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
    cancelMiscEdit(false);
    clearFoodEntryInputs();
    clearAccommodationEntryInputs();
    clearMiscEntryInputs();
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
      "This will delete its budgets, entries, and fund transfers. This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    appState.trips = appState.trips.filter(function (trip) {
      return trip.id !== activeTrip.id;
    });

    cancelFoodEdit(false);
    cancelAccommodationEdit(false);
    cancelMiscEdit(false);
    clearFoodEntryInputs();
    clearAccommodationEntryInputs();
    clearMiscEntryInputs();
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

  function clearMiscEntries() {
    appState.miscEntries = [];

    currentEditMiscId = null;

    clearMiscEntryInputs();
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
      appState.miscBudget = Number.isFinite(parsed.miscBudget) ? parsed.miscBudget : appState.miscBudget;
      appState.fundAmount = Number.isFinite(parsed.fundAmount) ? parsed.fundAmount : appState.fundAmount;
      appState.foodEntries = Array.isArray(parsed.foodEntries) ? parsed.foodEntries : [];
      appState.accommodationEntries = Array.isArray(parsed.accommodationEntries) ? parsed.accommodationEntries : [];
      appState.miscEntries = Array.isArray(parsed.miscEntries) ? parsed.miscEntries : [];
      appState.fundAmount = sanitiseBudget(appState.fundAmount - getLegacyFundTransferTotal(parsed.fundTransfers));
      appState.fundTransfers = Array.isArray(parsed.fundTransfers) ? normalizeFundTransfers(parsed.fundTransfers) : [];
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

    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (refreshingForUpdate) {
        window.location.reload();
      }
    });

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").then(function (registration) {
        if (registration.waiting) {
          showUpdateButton(registration.waiting);
        }

        registration.addEventListener("updatefound", function () {
          const newWorker = registration.installing;

          if (!newWorker) {
            return;
          }

          newWorker.addEventListener("statechange", function () {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateButton(newWorker);
            }
          });
        });

        registration.update();
      }).catch(function (error) {
        console.error("Offline support could not be enabled.", error);
      });
    });
  }

  function showUpdateButton(worker) {
    pendingUpdateWorker = worker;
    els.updateAppBtn.disabled = false;
    els.updateAppBtn.classList.remove("hidden");
  }

  function hideUpdateButton() {
    pendingUpdateWorker = null;
    els.updateAppBtn.disabled = true;
    els.updateAppBtn.classList.add("hidden");
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

          const updateWorker = pendingUpdateWorker || registration.waiting;

          if (updateWorker) {
            refreshingForUpdate = true;
            hideUpdateButton();
            updateWorker.postMessage({ type: "SKIP_WAITING" });
            setTimeout(function () {
              window.location.reload();
            }, 1200);
            return;
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
