/* Version #24 Mar 21, 2026 1:20 pm (ET) */

const state = {
  currency: "€",
  days: 40,
  dayNumber: "D1",
  foodTotal: 1500,
  accomTotal: 1500,
  foodEntries: [],
  accomJournal: ""
};

const FOOD_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Drinks", "Other"];

function getEl(id) {
  return document.getElementById(id);
}

function formatMoney(value) {
  return state.currency + Number(value || 0).toFixed(2);
}

function formatEntryDate(timestamp) {
  try {
    const d = new Date(timestamp);
    const weekday = d.toLocaleDateString("en-CA", { weekday: "short" });
    const month = d.toLocaleDateString("en-CA", { month: "short" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${weekday} ${month} ${day}, ${year}`;
  } catch (err) {
    return "";
  }
}

function formatDeleteDate(timestamp) {
  try {
    const d = new Date(timestamp);
    return d.toDateString();
  } catch (err) {
    return "";
  }
}

function parseAmountFromLine(line) {
  if (!line) return 0;

  const cleaned = String(line)
    .replace(/€/g, "")
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .trim();

  const matches = cleaned.match(/-?\d+(\.\d+)?/g);
  if (!matches || !matches.length) return 0;

  const num = parseFloat(matches[matches.length - 1]);
  return isNaN(num) ? 0 : num;
}

function sumJournal(text) {
  if (!text) return 0;

  return text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line !== "")
    .reduce((sum, line) => sum + parseAmountFromLine(line), 0);
}

function sumFoodEntries(entries) {
  if (!Array.isArray(entries)) return 0;

  return entries.reduce((sum, entry) => {
    return sum + (parseFloat(entry.amount) || 0);
  }, 0);
}

function sumFoodEntriesForDay(entries, day) {
  if (!Array.isArray(entries)) return 0;

  const target = String(day || "").trim().toUpperCase();

  return entries.reduce((sum, entry) => {
    const entryDay = String(entry.day || "").trim().toUpperCase();
    if (entryDay === target) {
      return sum + (parseFloat(entry.amount) || 0);
    }
    return sum;
  }, 0);
}

function normalizeFoodEntries(entries) {
  if (!Array.isArray(entries)) return [];

  return entries.map((entry) => {
    const normalizedTimestamp =
      typeof entry.timestamp === "number" && !isNaN(entry.timestamp)
        ? entry.timestamp
        : Date.now();

    const normalizedText =
      (entry.text || entry.type || "Other").toString().trim() || "Other";

    return {
      day: (entry.day || "").toString().trim().toUpperCase(),
      text: normalizedText,
      amount: parseFloat(entry.amount) || 0,
      timestamp: normalizedTimestamp
    };
  });
}

function parseDayInfo(dayValue) {
  const raw = String(dayValue || "").trim().toUpperCase();
  const match = raw.match(/^([A-Z]+)(\d+)$/);

  if (!match) {
    return {
      prefix: raw,
      num: -1
    };
  }

  return {
    prefix: match[1],
    num: parseInt(match[2], 10)
  };
}

function compareEntries(a, b) {
  const da = parseDayInfo(a.day);
  const db = parseDayInfo(b.day);

  if (da.prefix === db.prefix && da.num !== -1 && db.num !== -1) {
    if (db.num !== da.num) {
      return db.num - da.num;
    }
  } else {
    const textCompare = String(b.day || "").localeCompare(String(a.day || ""));
    if (textCompare !== 0) {
      return textCompare;
    }
  }

  return (b.timestamp || 0) - (a.timestamp || 0);
}

function normaliseDayNumberInput(value) {
  const raw = String(value || "").trim().toUpperCase();

  if (!raw) return "D1";

  const match = raw.match(/^([A-Z]+)\s*(\d+)$/);
  if (match) {
    return match[1] + String(parseInt(match[2], 10));
  }

  return raw.replace(/\s+/g, "");
}

function changeDayNumber(step) {
  syncInputsToState();

  const info = parseDayInfo(state.dayNumber);

  if (info.num === -1 || !info.prefix) {
    state.dayNumber = "D1";
  } else {
    const nextNum = Math.max(1, info.num + step);
    state.dayNumber = info.prefix + nextNum;
  }

  if (getEl("dayNumber")) {
    getEl("dayNumber").value = state.dayNumber;
  }

  persistAll(false);
  renderAll();
}

function setFoodAmount(value) {
  const el = getEl("foodAmount");
  if (!el) return;

  const formatted = Number(value).toFixed(2);
  el.value = formatted;
  el.focus();

  const dotIndex = formatted.indexOf(".");
  if (dotIndex !== -1) {
    const start = dotIndex + 1;
    const end = formatted.length;

    setTimeout(() => {
      try {
        el.setSelectionRange(start, end);
      } catch (err) {
        // Some browsers may not support selection on this input type.
      }
    }, 0);
  } else {
    el.select();
  }
}

function clearFoodAmount() {
  const el = getEl("foodAmount");
  if (!el) return;

  el.value = "";
  el.focus();
}

function loadAll() {
  try {
    state.currency = localStorage.getItem("currency") || "€";
    state.days = parseInt(localStorage.getItem("days"), 10) || 40;
    state.dayNumber = normaliseDayNumberInput(localStorage.getItem("dayNumber") || "D1");
    state.foodTotal = parseFloat(localStorage.getItem("foodTotal")) || 1500;
    state.accomTotal = parseFloat(localStorage.getItem("accomTotal")) || 1500;
    state.accomJournal = localStorage.getItem("accomJournal") || "";

    const stored = localStorage.getItem("foodEntries");
    state.foodEntries = stored ? normalizeFoodEntries(JSON.parse(stored)) : [];
  } catch (err) {
    console.error("loadAll error:", err);
    state.foodEntries = [];
  }
}

function syncStateToInputs() {
  if (getEl("currency")) getEl("currency").value = state.currency;
  if (getEl("days")) getEl("days").value = state.days;
  if (getEl("dayNumber")) getEl("dayNumber").value = state.dayNumber;
  if (getEl("foodTotal")) getEl("foodTotal").value = state.foodTotal;
  if (getEl("accomTotal")) getEl("accomTotal").value = state.accomTotal;
  if (getEl("accomJournal")) getEl("accomJournal").value = state.accomJournal;
}

function syncInputsToState() {
  if (getEl("currency")) state.currency = getEl("currency").value || "€";
  if (getEl("days")) state.days = parseInt(getEl("days").value, 10) || 1;
  if (getEl("dayNumber")) state.dayNumber = normaliseDayNumberInput(getEl("dayNumber").value || "D1");
  if (getEl("foodTotal")) state.foodTotal = parseFloat(getEl("foodTotal").value) || 0;
  if (getEl("accomTotal")) state.accomTotal = parseFloat(getEl("accomTotal").value) || 0;
  if (getEl("accomJournal")) state.accomJournal = getEl("accomJournal").value || "";
}

function persistAll(showAlert = false) {
  syncInputsToState();

  localStorage.setItem("currency", state.currency);
  localStorage.setItem("days", String(state.days));
  localStorage.setItem("dayNumber", state.dayNumber);
  localStorage.setItem("foodTotal", String(state.foodTotal));
  localStorage.setItem("accomTotal", String(state.accomTotal));
  localStorage.setItem("foodEntries", JSON.stringify(state.foodEntries));
  localStorage.setItem("accomJournal", state.accomJournal);

  if (showAlert) {
    alert("Saved.");
  }
}

function renderFoodList() {
  const list = getEl("foodList");
  if (!list) return;

  list.innerHTML = "";

  if (!state.foodEntries.length) {
    list.innerHTML = "<div class='muted'>No food entries yet.</div>";
    return;
  }

  [...state.foodEntries].sort(compareEntries).forEach(entry => {
    const row = document.createElement("div");
    row.className = "list-row";

    const info = parseDayInfo(entry.day);
    if (info.num !== -1) {
      row.classList.add(info.num % 2 ? "day-odd" : "day-even");
    }

    const entryText = document.createElement("div");
    entryText.className = "entry-text";

    const main = document.createElement("span");
    main.className = "entry-main";
    main.textContent = `${entry.day} ${entry.text}`;

    const amount = document.createElement("span");
    amount.className = "entry-amount";
    amount.textContent = formatMoney(entry.amount);

    const date = document.createElement("span");
    date.className = "entry-date";
    date.textContent = formatEntryDate(entry.timestamp);

    entryText.appendChild(main);
    entryText.appendChild(amount);
    entryText.appendChild(date);

    const btnWrap = document.createElement("div");
    btnWrap.className = "mini-buttons";

    const index = state.foodEntries.indexOf(entry);

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.onclick = () => editFoodEntry(index);

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "Delete";
    del.onclick = () => deleteFoodEntry(index);

    btnWrap.appendChild(edit);
    btnWrap.appendChild(del);

    row.appendChild(entryText);
    row.appendChild(btnWrap);
    list.appendChild(row);
  });
}

function renderAll() {
  syncInputsToState();

  const foodHeading = getEl("foodHeading");
  if (foodHeading) {
    foodHeading.innerHTML = `Food <span class="add-day-subtitle">- for ${state.dayNumber}</span>`;
  }

  const addLabel = getEl("foodAddLabel");
  if (addLabel) {
    addLabel.innerHTML = `Add Food Entry <span class="add-day-subtitle">- for ${state.dayNumber}</span>`;
  }

  const days = state.days || 1;

  const foodStartingDaily = state.foodTotal / days;
  const totalFoodSpent = sumFoodEntries(state.foodEntries);
  const foodRemaining = state.foodTotal - totalFoodSpent;
  const todayFoodSpent = sumFoodEntriesForDay(state.foodEntries, state.dayNumber);
  const foodRemainingDaily = foodStartingDaily - todayFoodSpent;

  const accomStartingDaily = state.accomTotal / days;
  const accomSpent = sumJournal(state.accomJournal);
  const accomRemaining = state.accomTotal - accomSpent;
  const accomRemainingDaily = accomStartingDaily - accomSpent;

  if (getEl("foodStartingDaily")) {
    getEl("foodStartingDaily").innerText =
      "Starting Daily Food Budget:\n" + formatMoney(foodStartingDaily);
  }

  if (getEl("foodRemaining")) {
    getEl("foodRemaining").innerText =
      "Remaining Food Budget:\n" + formatMoney(foodRemaining);
  }

  if (getEl("foodRemainingDaily")) {
    getEl("foodRemainingDaily").innerText =
      "Remaining Daily Food Budget:\n" + formatMoney(foodRemainingDaily);
  }

  if (getEl("foodSpentToday")) {
    getEl("foodSpentToday").innerText =
      `Spent Today - ${state.dayNumber}:\n` + formatMoney(todayFoodSpent);
  }

  if (getEl("accomStartingDaily")) {
    getEl("accomStartingDaily").innerText =
      "Starting Daily Accommodation Budget:\n" + formatMoney(accomStartingDaily);
  }

  if (getEl("accomRemaining")) {
    getEl("accomRemaining").innerText =
      "Remaining Accommodation Budget:\n" + formatMoney(accomRemaining);
  }

  if (getEl("accomRemainingDaily")) {
    getEl("accomRemainingDaily").innerText =
      "Remaining Daily Accommodation Budget:\n" + formatMoney(accomRemainingDaily);
  }

  renderFoodList();
}

function addFoodEntry() {
  syncInputsToState();

  const typeEl = getEl("foodType");
  const amountEl = getEl("foodAmount");

  if (!typeEl || !amountEl) {
    alert("Food entry controls were not found.");
    return;
  }

  const type = typeEl.value;
  const amount = parseFloat(amountEl.value);

  if (isNaN(amount)) {
    alert("Enter amount.");
    return;
  }

  state.foodEntries.push({
    day: state.dayNumber,
    text: type,
    amount: Math.max(0, amount),
    timestamp: Date.now()
  });

  amountEl.value = "";
  persistAll(false);
  renderAll();
  amountEl.focus();
}

function editFoodEntry(index) {
  const entry = state.foodEntries[index];
  if (!entry) return;

  const typePrompt =
    "Edit type by number:\n1. Breakfast\n2. Lunch\n3. Dinner\n4. Snack\n5. Drinks\n6. Other";

  let currentTypeIndex = FOOD_TYPES.indexOf(entry.text);
  if (currentTypeIndex < 0) currentTypeIndex = FOOD_TYPES.length - 1;

  const typeChoice = prompt(typePrompt, String(currentTypeIndex + 1));
  if (typeChoice === null) return;

  const amountChoice = prompt("Amount:", String(entry.amount));
  if (amountChoice === null) return;

  const typeIndex = parseInt(typeChoice, 10);
  const newAmount = parseFloat(amountChoice);

  if (isNaN(typeIndex) || typeIndex < 1 || typeIndex > FOOD_TYPES.length) {
    alert("Choose a number from 1 to 6.");
    return;
  }

  if (isNaN(newAmount)) {
    alert("Amount must be a number.");
    return;
  }

  entry.text = FOOD_TYPES[typeIndex - 1];
  entry.amount = Math.max(0, newAmount);

  persistAll(false);
  renderAll();
}

function deleteFoodEntry(index) {
  const entry = state.foodEntries[index];
  if (!entry) return;

  const details = `${entry.day} ${entry.text} ${formatMoney(entry.amount)} ${formatDeleteDate(entry.timestamp)}`;
  const confirmed = confirm(`Delete this food entry?\n\n${details}`);

  if (!confirmed) return;

  state.foodEntries.splice(index, 1);
  persistAll(false);
  renderAll();
}

function wireQuickAmountButtons() {
  const buttons = document.querySelectorAll(".quick-amount-btn[data-amount]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const amount = parseFloat(btn.getAttribute("data-amount"));
      if (!isNaN(amount)) {
        setFoodAmount(amount);
      }
    });
  });

  const clearBtn = getEl("clearFoodAmountBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", clearFoodAmount);
  }
}

function wireEvents() {
  if (getEl("currency")) {
    getEl("currency").addEventListener("change", () => {
      persistAll(false);
      renderAll();
    });
  }

  if (getEl("days")) {
    getEl("days").addEventListener("input", () => {
      persistAll(false);
      renderAll();
    });
  }

  if (getEl("dayNumber")) {
    getEl("dayNumber").addEventListener("input", () => {
      persistAll(false);
      renderAll();
    });
  }

  if (getEl("prevDayBtn")) {
    getEl("prevDayBtn").addEventListener("click", () => changeDayNumber(-1));
  }

  if (getEl("nextDayBtn")) {
    getEl("nextDayBtn").addEventListener("click", () => changeDayNumber(1));
  }

  if (getEl("foodTotal")) {
    getEl("foodTotal").addEventListener("input", () => {
      persistAll(false);
      renderAll();
    });
  }

  if (getEl("accomTotal")) {
    getEl("accomTotal").addEventListener("input", () => {
      persistAll(false);
      renderAll();
    });
  }

  if (getEl("accomJournal")) {
    getEl("accomJournal").addEventListener("input", () => {
      persistAll(false);
      renderAll();
    });
  }

  if (getEl("foodAmount")) {
    getEl("foodAmount").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addFoodEntry();
      }
    });
  }

  if (getEl("addFoodBtn")) {
    getEl("addFoodBtn").addEventListener("click", addFoodEntry);
  }

  if (getEl("saveBtn")) {
    getEl("saveBtn").addEventListener("click", () => persistAll(true));
  }

  if (getEl("exportJsonBtn")) {
    getEl("exportJsonBtn").addEventListener("click", () => {
      syncInputsToState();

      const exportData = {
        currency: state.currency,
        days: state.days,
        dayNumber: state.dayNumber,
        foodTotal: state.foodTotal,
        accomTotal: state.accomTotal,
        foodEntries: state.foodEntries,
        accomJournal: state.accomJournal
      };

      prompt("Copy JSON:", JSON.stringify(exportData));
    });
  }

  if (getEl("importJsonBtn")) {
    getEl("importJsonBtn").addEventListener("click", () => {
      const json = prompt("Paste JSON:");
      if (!json) return;

      try {
        const obj = JSON.parse(json);

        state.currency = obj.currency === "$" ? "$" : "€";
        state.days = parseInt(obj.days, 10) || 1;
        state.dayNumber = normaliseDayNumberInput(obj.dayNumber || "D1");
        state.foodTotal = parseFloat(obj.foodTotal) || 0;
        state.accomTotal = parseFloat(obj.accomTotal) || 0;
        state.accomJournal = String(obj.accomJournal || "");
        state.foodEntries = normalizeFoodEntries(obj.foodEntries);

        syncStateToInputs();
        persistAll(false);
        renderAll();
        alert("Imported.");
      } catch (err) {
        alert("Invalid JSON");
      }
    });
  }

  if (getEl("resetBtn")) {
    getEl("resetBtn").addEventListener("click", () => {
      if (!confirm("This will clear all data. Continue?")) return;

      localStorage.removeItem("currency");
      localStorage.removeItem("days");
      localStorage.removeItem("dayNumber");
      localStorage.removeItem("foodTotal");
      localStorage.removeItem("accomTotal");
      localStorage.removeItem("foodEntries");
      localStorage.removeItem("accomJournal");
      location.reload();
    });
  }

  wireQuickAmountButtons();
}

function setFooterTimestamp() {
  const el = getEl("ts");
  if (!el) return;

  try {
    const d = new Date();
    const opts = {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    };
    el.textContent = new Intl.DateTimeFormat("en-CA", opts).format(d);
  } catch (err) {
    el.textContent = new Date().toLocaleString();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAll();
  syncStateToInputs();
  wireEvents();
  setFooterTimestamp();
  renderAll();
});