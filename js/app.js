/*
Trip Budget Tracker
Version: v12
Date: Mar 26, 2026
File: js/app.js
*/

(function () {
  "use strict";

  const STORAGE_KEY = "tripBudgetTracker_v12";

  const state = {
    currency: "EUR",
    numDays: 40,
    dayNumber: "D1",
    foodBudget: 1500,
    accommodationBudget: 1500,
    foodEntries: [],
    accommodationEntries: [],
    editingFoodId: null,
    editingAccommodationId: null
  };

  const els = {
    currency: document.getElementById("currency"),
    numDays: document.getElementById("numDays"),
    dayNumber: document.getElementById("dayNumber"),
    prevDayBtn: document.getElementById("prevDayBtn"),
    nextDayBtn: document.getElementById("nextDayBtn"),

    foodBudget: document.getElementById("foodBudget"),
    foodSectionTitle: document.getElementById("foodSectionTitle"),
    foodEntryTitle: document.getElementById("foodEntryTitle"),
    foodStartingDaily: document.getElementById("foodStartingDaily"),
    foodRemainingBudget: document.getElementById("foodRemainingBudget"),
    foodRemainingDaily: document.getElementById("foodRemainingDaily"),
    foodSpentTodayLabel: document.getElementById("foodSpentTodayLabel"),
    foodSpentToday: document.getElementById("foodSpentToday"),
    foodType: document.getElementById("foodType"),
    foodAmount: document.getElementById("foodAmount"),
    foodNote: document.getElementById("foodNote"),
    addFoodBtn: document.getElementById("addFoodBtn"),
    cancelFoodEditBtn: document.getElementById("cancelFoodEditBtn"),
    foodEntriesList: document.getElementById("foodEntriesList"),

    accommodationBudget: document.getElementById("accommodationBudget"),
    accommodationSectionTitle: document.getElementById("accommodationSectionTitle"),
    accommodationEntryTitle: document.getElementById("accommodationEntryTitle"),
    accStartingDaily: document.getElementById("accStartingDaily"),
    accRemainingBudget: document.getElementById("accRemainingBudget"),
    accRemainingDaily: document.getElementById("accRemainingDaily"),
    accSpentTodayLabel: document.getElementById("accSpentTodayLabel"),
    accSpentToday: document.getElementById("accSpentToday"),
    accommodationType: document.getElementById("accommodationType"),
    accommodationAmount: document.getElementById("accommodationAmount"),
    accommodationNote: document.getElementById("accommodationNote"),
    addAccommodationBtn: document.getElementById("addAccommodationBtn"),
    cancelAccommodationEditBtn: document.getElementById("cancelAccommodationEditBtn"),
    accommodationEntriesList: document.getElementById("accommodationEntriesList")
  };

  function init() {
    loadState();
    bindEvents();
    syncInputsFromState();
    renderAll();
  }

  function bindEvents() {
    els.currency.addEventListener("change", function () {
      state.currency = els.currency.value;
      saveState();
      renderAll();
    });

    els.numDays.addEventListener("change", function () {
      const value = parseInt(els.numDays.value, 10);
      state.numDays = isFinite(value) && value > 0 ? value : 1;
      els.numDays.value = state.numDays;
      saveState();
      renderAll();
    });

    els.dayNumber.addEventListener("change", function () {
      state.dayNumber = sanitizeDayNumber(els.dayNumber.value);
      els.dayNumber.value = state.dayNumber;
      saveState();
      renderAll();
    });

    els.prevDayBtn.addEventListener("click", function () {
      state.dayNumber = shiftDayNumber(state.dayNumber, -1);
      els.dayNumber.value = state.dayNumber;
      saveState();
      renderAll();
    });

    els.nextDayBtn.addEventListener("click", function () {
      state.dayNumber = shiftDayNumber(state.dayNumber, 1);
      els.dayNumber.value = state.dayNumber;
      saveState();
      renderAll();
    });

    els.foodBudget.addEventListener("change", function () {
      state.foodBudget = sanitizeMoney(els.foodBudget.value);
      els.foodBudget.value = state.foodBudget.toFixed(2);
      saveState();
      renderAll();
    });

    els.accommodationBudget.addEventListener("change", function () {
      state.accommodationBudget = sanitizeMoney(els.accommodationBudget.value);
      els.accommodationBudget.value = state.accommodationBudget.toFixed(2);
      saveState();
      renderAll();
    });

    document.querySelectorAll(".quick-amount-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const targetId = btn.getAttribute("data-target");
        const value = btn.getAttribute("data-value");
        const target = document.getElementById(targetId);
        if (target) {
          target.value = value;
        }
      });
    });

    els.addFoodBtn.addEventListener("click", handleAddOrUpdateFood);
    els.cancelFoodEditBtn.addEventListener("click", resetFoodForm);

    els.addAccommodationBtn.addEventListener("click", handleAddOrUpdateAccommodation);
    els.cancelAccommodationEditBtn.addEventListener("click", resetAccommodationForm);
  }

  function syncInputsFromState() {
    els.currency.value = state.currency;
    els.numDays.value = state.numDays;
    els.dayNumber.value = state.dayNumber;
    els.foodBudget.value = Number(state.foodBudget).toFixed(2);
    els.accommodationBudget.value = Number(state.accommodationBudget).toFixed(2);
  }

  function renderAll() {
    updateTitles();
    renderSummaries();
    renderFoodEntries();
    renderAccommodationEntries();
  }

  function updateTitles() {
    const day = state.dayNumber;

    els.foodSectionTitle.textContent = "Food - for " + day;
    els.foodEntryTitle.textContent = "Add Food Entry - for " + day;
    els.foodSpentTodayLabel.textContent = "Spent Today - " + day;

    els.accommodationSectionTitle.textContent = "Accommodation - for " + day;
    els.accommodationEntryTitle.textContent = "Add Accommodation Entry - for " + day;
    els.accSpentTodayLabel.textContent = "Spent Today - " + day;
  }

  function renderSummaries() {
    const numDays = Math.max(1, state.numDays);

    const foodStartingDaily = state.foodBudget / numDays;
    const totalFoodSpent = sumAmounts(state.foodEntries);
    const foodSpentToday = sumAmounts(filterByDay(state.foodEntries, state.dayNumber));
    const foodRemainingBudget = state.foodBudget - totalFoodSpent;
    const foodRemainingDaily = foodStartingDaily - foodSpentToday;

    els.foodStartingDaily.textContent = formatCurrency(foodStartingDaily);
    els.foodRemainingBudget.textContent = formatCurrency(foodRemainingBudget);
    els.foodRemainingDaily.textContent = formatCurrency(foodRemainingDaily);
    els.foodSpentToday.textContent = formatCurrency(foodSpentToday);

    const accStartingDaily = state.accommodationBudget / numDays;
    const totalAccSpent = sumAmounts(state.accommodationEntries);
    const accSpentToday = sumAmounts(filterByDay(state.accommodationEntries, state.dayNumber));
    const accRemainingBudget = state.accommodationBudget - totalAccSpent;
    const accRemainingDaily = accStartingDaily - accSpentToday;

    els.accStartingDaily.textContent = formatCurrency(accStartingDaily);
    els.accRemainingBudget.textContent = formatCurrency(accRemainingBudget);
    els.accRemainingDaily.textContent = formatCurrency(accRemainingDaily);
    els.accSpentToday.textContent = formatCurrency(accSpentToday);
  }

  function handleAddOrUpdateFood() {
    const amount = sanitizeMoney(els.foodAmount.value);
    const type = (els.foodType.value || "Other").trim();
    const note = (els.foodNote.value || "").trim();

    if (amount <= 0) {
      alert("Please enter a valid Food amount.");
      return;
    }

    if (state.editingFoodId) {
      const entry = state.foodEntries.find(function (item) {
        return item.id === state.editingFoodId;
      });

      if (!entry) {
        resetFoodForm();
        return;
      }

      entry.type = type;
      entry.amount = amount;
      entry.note = note;
      entry.dayNumber = state.dayNumber;
      entry.dateStamp = getTodayDisplayDate();
      entry.updatedAt = Date.now();
    } else {
      state.foodEntries.push({
        id: generateId(),
        type: type,
        amount: amount,
        note: note,
        dayNumber: state.dayNumber,
        dateStamp: getTodayDisplayDate(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    saveState();
    resetFoodForm();
    renderAll();
  }

  function handleAddOrUpdateAccommodation() {
    const amount = sanitizeMoney(els.accommodationAmount.value);
    const type = (els.accommodationType.value || "Albergue").trim();
    const note = (els.accommodationNote.value || "").trim();

    if (amount <= 0) {
      alert("Please enter a valid Accommodation amount.");
      return;
    }

    if (state.editingAccommodationId) {
      const entry = state.accommodationEntries.find(function (item) {
        return item.id === state.editingAccommodationId;
      });

      if (!entry) {
        resetAccommodationForm();
        return;
      }

      entry.type = type;
      entry.amount = amount;
      entry.note = note;
      entry.dayNumber = state.dayNumber;
      entry.dateStamp = getTodayDisplayDate();
      entry.updatedAt = Date.now();
    } else {
      state.accommodationEntries.push({
        id: generateId(),
        type: type,
        amount: amount,
        note: note,
        dayNumber: state.dayNumber,
        dateStamp: getTodayDisplayDate(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    saveState();
    resetAccommodationForm();
    renderAll();
  }

  function resetFoodForm() {
    state.editingFoodId = null;
    els.foodType.value = "Breakfast";
    els.foodAmount.value = "";
    els.foodNote.value = "";
    els.addFoodBtn.textContent = "Add Food Entry";
    els.cancelFoodEditBtn.classList.add("hidden");
  }

  function resetAccommodationForm() {
    state.editingAccommodationId = null;
    els.accommodationType.value = "Albergue";
    els.accommodationAmount.value = "";
    els.accommodationNote.value = "";
    els.addAccommodationBtn.textContent = "Add Accommodation Entry";
    els.cancelAccommodationEditBtn.classList.add("hidden");
  }

  function renderFoodEntries() {
    const list = sortEntriesForDisplay(state.foodEntries);
    els.foodEntriesList.innerHTML = "";

    if (!list.length) {
      els.foodEntriesList.innerHTML = '<div class="empty-state">No Food entries yet.</div>';
      return;
    }

    list.forEach(function (entry) {
      const card = document.createElement("div");
      card.className = "entry-card " + getAlternatingDayClass(entry.dayNumber, list, "food");

      const topRow = document.createElement("div");
      topRow.className = "entry-top-row";

      const main = document.createElement("div");
      main.className = "entry-main";

      const title = document.createElement("div");
      title.className = "entry-title";
      title.textContent = entry.type + " - " + formatCurrency(entry.amount);

      const meta = document.createElement("div");
      meta.className = "entry-meta";
      meta.textContent = entry.dayNumber + " • " + entry.dateStamp;

      main.appendChild(title);
      main.appendChild(meta);

      if (entry.note) {
        const note = document.createElement("div");
        note.className = "entry-note";
        note.textContent = entry.note;
        main.appendChild(note);
      }

      const actions = document.createElement("div");
      actions.className = "entry-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "action-btn";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function () {
        startFoodEdit(entry.id);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "action-btn delete-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () {
        deleteFoodEntry(entry.id);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      topRow.appendChild(main);
      topRow.appendChild(actions);
      card.appendChild(topRow);

      els.foodEntriesList.appendChild(card);
    });
  }

  function renderAccommodationEntries() {
    const list = sortEntriesForDisplay(state.accommodationEntries);
    els.accommodationEntriesList.innerHTML = "";

    if (!list.length) {
      els.accommodationEntriesList.innerHTML = '<div class="empty-state">No Accommodation entries yet.</div>';
      return;
    }

    list.forEach(function (entry) {
      const card = document.createElement("div");
      card.className = "entry-card " + getAlternatingDayClass(entry.dayNumber, list, "acc");

      const topRow = document.createElement("div");
      topRow.className = "entry-top-row";

      const main = document.createElement("div");
      main.className = "entry-main";

      const title = document.createElement("div");
      title.className = "entry-title";
      title.textContent = entry.type + " - " + formatCurrency(entry.amount);

      const meta = document.createElement("div");
      meta.className = "entry-meta";
      meta.textContent = entry.dayNumber + " • " + entry.dateStamp;

      main.appendChild(title);
      main.appendChild(meta);

      if (entry.note) {
        const note = document.createElement("div");
        note.className = "entry-note";
        note.textContent = entry.note;
        main.appendChild(note);
      }

      const actions = document.createElement("div");
      actions.className = "entry-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "action-btn";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function () {
        startAccommodationEdit(entry.id);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "action-btn delete-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () {
        deleteAccommodationEntry(entry.id);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      topRow.appendChild(main);
      topRow.appendChild(actions);
      card.appendChild(topRow);

      els.accommodationEntriesList.appendChild(card);
    });
  }

  function startFoodEdit(id) {
    const entry = state.foodEntries.find(function (item) {
      return item.id === id;
    });

    if (!entry) {
      return;
    }

    state.editingFoodId = id;
    state.dayNumber = sanitizeDayNumber(entry.dayNumber);
    els.dayNumber.value = state.dayNumber;

    els.foodType.value = entry.type;
    els.foodAmount.value = Number(entry.amount).toFixed(2);
    els.foodNote.value = entry.note || "";
    els.addFoodBtn.textContent = "Update Food Entry";
    els.cancelFoodEditBtn.classList.remove("hidden");

    saveState();
    renderAll();
  }

  function startAccommodationEdit(id) {
    const entry = state.accommodationEntries.find(function (item) {
      return item.id === id;
    });

    if (!entry) {
      return;
    }

    state.editingAccommodationId = id;
    state.dayNumber = sanitizeDayNumber(entry.dayNumber);
    els.dayNumber.value = state.dayNumber;

    els.accommodationType.value = entry.type;
    els.accommodationAmount.value = Number(entry.amount).toFixed(2);
    els.accommodationNote.value = entry.note || "";
    els.addAccommodationBtn.textContent = "Update Accommodation Entry";
    els.cancelAccommodationEditBtn.classList.remove("hidden");

    saveState();
    renderAll();
  }

  function deleteFoodEntry(id) {
    const entry = state.foodEntries.find(function (item) {
      return item.id === id;
    });

    if (!entry) {
      return;
    }

    const confirmed = confirm(
      "Delete this Food entry?\n\n" +
      "Day: " + entry.dayNumber + "\n" +
      "Date: " + entry.dateStamp + "\n" +
      "Type: " + entry.type + "\n" +
      "Amount: " + formatCurrency(entry.amount) + "\n" +
      "Note: " + (entry.note || "(none)")
    );

    if (!confirmed) {
      return;
    }

    state.foodEntries = state.foodEntries.filter(function (item) {
      return item.id !== id;
    });

    if (state.editingFoodId === id) {
      resetFoodForm();
    }

    saveState();
    renderAll();
  }

  function deleteAccommodationEntry(id) {
    const entry = state.accommodationEntries.find(function (item) {
      return item.id === id;
    });

    if (!entry) {
      return;
    }

    const confirmed = confirm(
      "Delete this Accommodation entry?\n\n" +
      "Day: " + entry.dayNumber + "\n" +
      "Date: " + entry.dateStamp + "\n" +
      "Type: " + entry.type + "\n" +
      "Amount: " + formatCurrency(entry.amount) + "\n" +
      "Note: " + (entry.note || "(none)")
    );

    if (!confirmed) {
      return;
    }

    state.accommodationEntries = state.accommodationEntries.filter(function (item) {
      return item.id !== id;
    });

    if (state.editingAccommodationId === id) {
      resetAccommodationForm();
    }

    saveState();
    renderAll();
  }

  function sortEntriesForDisplay(entries) {
    return entries.slice().sort(function (a, b) {
      const dayDiff = getDaySortValue(b.dayNumber) - getDaySortValue(a.dayNumber);
      if (dayDiff !== 0) {
        return dayDiff;
      }
      return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
    });
  }

  function getDaySortValue(dayNumber) {
    const parsed = parseDayNumber(dayNumber);
    const prefixWeight = parsed.prefix === "S" ? 0 : parsed.prefix === "D" ? 10000 : 20000;
    return prefixWeight + parsed.number;
  }

  function parseDayNumber(dayNumber) {
    const clean = sanitizeDayNumber(dayNumber);
    const match = clean.match(/^([SDF])(\d+)$/);
    if (!match) {
      return { prefix: "D", number: 1 };
    }

    return {
      prefix: match[1],
      number: parseInt(match[2], 10)
    };
  }

  function shiftDayNumber(dayNumber, delta) {
    const parsed = parseDayNumber(dayNumber);
    const next = Math.max(1, parsed.number + delta);
    return parsed.prefix + next;
  }

  function sanitizeDayNumber(value) {
    const raw = String(value || "").trim().toUpperCase();
    const match = raw.match(/^([SDF])\s*(\d+)$/);
    if (!match) {
      return "D1";
    }

    const prefix = match[1];
    const number = Math.max(1, parseInt(match[2], 10));
    return prefix + number;
  }

  function sanitizeMoney(value) {
    const num = parseFloat(value);
    if (!isFinite(num) || num < 0) {
      return 0;
    }
    return Math.round(num * 100) / 100;
  }

  function formatCurrency(amount) {
    const num = isFinite(amount) ? amount : 0;
    const abs = Math.abs(num).toFixed(2);
    const sign = num < 0 ? "-" : "";

    if (state.currency === "EUR") {
      return sign + "€" + abs;
    }

    if (state.currency === "USD") {
      return sign + "US$" + abs;
    }

    return sign + "$" + abs;
  }

  function sumAmounts(entries) {
    return entries.reduce(function (sum, item) {
      return sum + sanitizeMoney(item.amount);
    }, 0);
  }

  function filterByDay(entries, dayNumber) {
    return entries.filter(function (item) {
      return sanitizeDayNumber(item.dayNumber) === sanitizeDayNumber(dayNumber);
    });
  }

  function generateId() {
    return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function getTodayDisplayDate() {
    const today = new Date();
    return today.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function getAlternatingDayClass(dayNumber, list, type) {
    const days = [];
    list.forEach(function (entry) {
      const day = sanitizeDayNumber(entry.dayNumber);
      if (days.indexOf(day) === -1) {
        days.push(day);
      }
    });

    const index = days.indexOf(sanitizeDayNumber(dayNumber));
    if (type === "food") {
      return index % 2 === 0 ? "food-day-a" : "food-day-b";
    }
    return index % 2 === 0 ? "acc-day-a" : "acc-day-b";
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currency: state.currency,
        numDays: state.numDays,
        dayNumber: state.dayNumber,
        foodBudget: state.foodBudget,
        accommodationBudget: state.accommodationBudget,
        foodEntries: state.foodEntries,
        accommodationEntries: state.accommodationEntries
      })
    );
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const saved = JSON.parse(raw);

      state.currency = saved.currency || "EUR";
      state.numDays = isFinite(saved.numDays) ? Number(saved.numDays) : 40;
      state.dayNumber = sanitizeDayNumber(saved.dayNumber || "D1");
      state.foodBudget = isFinite(saved.foodBudget) ? Number(saved.foodBudget) : 1500;
      state.accommodationBudget = isFinite(saved.accommodationBudget) ? Number(saved.accommodationBudget) : 1500;
      state.foodEntries = Array.isArray(saved.foodEntries) ? saved.foodEntries : [];
      state.accommodationEntries = Array.isArray(saved.accommodationEntries) ? saved.accommodationEntries : [];
    } catch (error) {
      console.warn("Could not load saved data.", error);
    }
  }

  init();
})();