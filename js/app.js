/* Version #15 Mar 20, 2026 7:45 pm (ET) */
const state = {
  currency: "€",
  days: 40,
  dayNumber: "D1",
  foodTotal: 1500,
  accomTotal: 1500,
  foodEntries: [],
  accomJournal: ""
};

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

function compareEntriesByCaminoDayThenTime(a, b) {
  const dayA = parseDayInfo(a.day);
  const dayB = parseDayInfo(b.day);

  if (dayA.prefix === dayB.prefix && dayA.num !== -1 && dayB.num !== -1) {
    if (dayB.num !== dayA.num) {
      return dayB.num - dayA.num;
    }
  } else {
    const dayTextCompare = String(b.day || "").localeCompare(String(a.day || ""));
    if (dayTextCompare !== 0) {
      return dayTextCompare;
    }
  }

  const aTs = typeof a.timestamp === "number" ? a.timestamp : 0;
  const bTs = typeof b.timestamp === "number" ? b.timestamp : 0;
  return bTs - aTs;
}

function loadAll() {
  try {
    state.currency = localStorage.getItem("currency") || "€";
    state.days = parseInt(localStorage.getItem("days"), 10) || 40;
    state.dayNumber = (localStorage.getItem("dayNumber") || "D1").trim().toUpperCase();
    state.foodTotal = parseFloat(localStorage.getItem("foodTotal")) || 1500;
    state.accomTotal = parseFloat(localStorage.getItem("accomTotal")) || 1500;
    state.accomJournal = localStorage.getItem("accomJournal") || "";

    const storedFood = localStorage.getItem("foodEntries");
    if (storedFood) {
      const parsed = JSON.parse(storedFood);
      state.foodEntries = normalizeFoodEntries(parsed);
    } else {
      state.foodEntries = [];
    }
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
  if (getEl("foodType")) getEl("foodType").value = "Breakfast";
}

function syncInputsToState() {
  if (getEl("currency")) state.currency = getEl("currency").value || "€";
  if (getEl("days")) state.days = parseInt(getEl("days").value, 10) || 1;
  if (getEl("dayNumber")) state.dayNumber = (getEl("dayNumber").value || "D1").trim().toUpperCase();
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
  const foodList = getEl("foodList");
  if (!foodList) return;

  foodList.innerHTML = "";

  if (!state.foodEntries.length) {
    foodList.innerHTML = "<div class='muted'>No food entries yet.</div>";
    return;
  }

  const sortedEntries = [...state.foodEntries].sort(compareEntriesByCaminoDayThenTime);

  sortedEntries.forEach((entry) => {
    const originalIndex = state.foodEntries.indexOf(entry);

    const row = document.createElement("div");
    row.className = "list-row";

    const dayInfo = parseDayInfo(entry.day);
    if (dayInfo.num !== -1) {
      if (dayInfo.num % 2 === 0) {
        row.classList.add("day-even");
      } else {
        row.classList.add("day-odd");
      }
    }

    const text = document.createElement("div");
    text.className = "entry-text";

    const amount = parseFloat(entry.amount) || 0;
    const dateLabel = formatEntryDate(entry.timestamp);

    const mainPart = document.createElement("span");
    mainPart.className = "entry-main";
    mainPart.textContent = `${entry.day} ${entry.text}`;

    const amountPart = document.createElement("span");
    amountPart.className = "entry-amount";
    amountPart.textContent = `${state.currency}${amount.toFixed(2)}`;

    const datePart = document.createElement("span");
    datePart.className = "entry-date";
    datePart.textContent = dateLabel;

    text.appendChild(mainPart);
    text.appendChild(amountPart);
    text.appendChild(datePart);

    const btnWrap = document.createElement("div");
    btnWrap.className = "mini-buttons";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.onclick = function () {
      editFoodEntry(originalIndex);
    };

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "Delete";
    delBtn.onclick = function () {
      deleteFoodEntry(originalIndex);
    };

    btnWrap.appendChild(editBtn);
    btnWrap.appendChild(delBtn);

    row.appendChild(text);
    row.appendChild(btnWrap);
    foodList.appendChild(row);
  });
}

function renderAll() {
  syncInputsToState();

  const addLabel = getEl("foodAddLabel");
  if (addLabel) {
    addLabel.textContent = `Add Food Entry for ${state.dayNumber}:`;
  }

  const days = state.days || 1;

  const foodStartingDaily = state.foodTotal / days;
  const totalFoodSpent = sumFoodEntries(state.foodEntries);
  const foodRemaining = Math.max(0, state.foodTotal - totalFoodSpent);
  const todayFoodSpent = sumFoodEntriesForDay(state.foodEntries, state.dayNumber);
  const foodRemainingDaily = Math.max(0, foodStartingDaily - todayFoodSpent);

  const accomStartingDaily = state.accomTotal / days;
  const accomSpent = sumJournal(state.accomJournal);
  const accomRemaining = Math.max(0, state.accomTotal - accomSpent);
  const accomRemainingDaily = Math.max(0, accomStartingDaily - accomSpent);

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
      "Spent Today:\n" + formatMoney(todayFoodSpent);
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
  const amtEl = getEl("foodAmount");

  if (!typeEl || !amtEl) {
    alert("Food entry controls were not found on the page.");
    return;
  }

  const day = state.dayNumber;
  const text = (typeEl.value || "Other").trim();
  const amount = parseFloat(amtEl.value);

  if (!day) {
    alert("Enter a valid Day Number first.");
    return;
  }

  if (!text) {
    alert("Choose a food type.");
    return;
  }

  if (isNaN(amount)) {
    alert("Enter a valid food amount.");
    return;
  }

  state.foodEntries.push({
    day: day,
    text: text,
    amount: Math.max(0, amount),
    timestamp: Date.now()
  });

  typeEl.value = "Breakfast";
  amtEl.value = "";

  persistAll(false);
  renderAll();
}

function editFoodEntry(index) {
  const entry = state.foodEntries[index];
  if (!entry) return;

  const currentTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Drink(s)", "Other"];
  const choiceText =
    "Edit type by number:\n1. Breakfast\n2. Lunch\n3. Dinner\n4. Snack\n5. Drink(s)\n6. Other";

  let currentTypeIndex = currentTypes.indexOf(entry.text);
  if (currentTypeIndex < 0) currentTypeIndex = 5;

  const newTypeRaw = prompt(choiceText, String(currentTypeIndex + 1));
  if (newTypeRaw === null) return;

  const choiceNum = parseInt(newTypeRaw, 10);
  if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > 6) {
    alert("Choose a number from 1 to 6.");
    return;
  }

  const newAmountRaw = prompt("Edit amount:", String(entry.amount));
  if (newAmountRaw === null) return;

  const newAmount = parseFloat(newAmountRaw);
  if (isNaN(newAmount)) {
    alert("Amount must be a number.");
    return;
  }

  entry.text = currentTypes[choiceNum - 1];
  entry.amount = Math.max(0, newAmount);

  persistAll(false);
  renderAll();
}

function deleteFoodEntry(index) {
  const entry = state.foodEntries[index];
  if (!entry) return;

  const confirmed = confirm(
    `Delete this entry?\n\n${entry.day} ${entry.text} ${state.currency}${(parseFloat(entry.amount) || 0).toFixed(2)}`
  );

  if (!confirmed) return;

  state.foodEntries.splice(index, 1);
  persistAll(false);
  renderAll();
}

function exportJSON() {
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
}

function importJSON() {
  const json = prompt("Paste JSON:");
  if (!json) return;

  try {
    const obj = JSON.parse(json);

    state.currency = obj.currency === "$" ? "$" : "€";
    state.days = parseInt(obj.days, 10) || 1;
    state.dayNumber = (obj.dayNumber || "D1").toString().trim().toUpperCase();
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
}

function resetAll() {
  if (confirm("This will clear all data. Continue?")) {
    localStorage.removeItem("currency");
    localStorage.removeItem("days");
    localStorage.removeItem("dayNumber");
    localStorage.removeItem("foodTotal");
    localStorage.removeItem("accomTotal");
    localStorage.removeItem("foodEntries");
    localStorage.removeItem("accomJournal");
    location.reload();
  }
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

function wireEvents() {
  if (getEl("currency")) {
    getEl("currency").addEventListener("change", function () {
      persistAll(false);
      renderAll();
    });
  }

  if (getEl("days")) {
    getEl("days").addEventListener("input", function () {
      persistAll(false);
      renderAll();
    });
  }

  if (getEl("dayNumber")) {
    getEl("dayNumber").addEventListener("input", function () {
      persistAll(false);
      renderAll();
    });
  }

  if (getEl("foodTotal")) {
    getEl("foodTotal").addEventListener("input", function () {
      persistAll(false);
      renderAll();
    });
  }

  if (getEl("accomTotal")) {
    getEl("accomTotal").addEventListener("input", function () {
      persistAll(false);
      renderAll();
    });
  }

  if (getEl("accomJournal")) {
    getEl("accomJournal").addEventListener("input", function () {
      persistAll(false);
      renderAll();
    });
  }

  if (getEl("addFoodBtn")) {
    getEl("addFoodBtn").addEventListener("click", addFoodEntry);
  }

  if (getEl("saveBtn")) {
    getEl("saveBtn").addEventListener("click", function () {
      persistAll(true);
    });
  }

  if (getEl("exportJsonBtn")) {
    getEl("exportJsonBtn").addEventListener("click", exportJSON);
  }

  if (getEl("importJsonBtn")) {
    getEl("importJsonBtn").addEventListener("click", importJSON);
  }

  if (getEl("resetBtn")) {
    getEl("resetBtn").addEventListener("click", resetAll);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  try {
    loadAll();
    syncStateToInputs();
    wireEvents();
    setFooterTimestamp();
    renderAll();
  } catch (err) {
    console.error("Startup error:", err);
    alert("There is a JavaScript startup error. Open the browser console to see details.");
  }
});