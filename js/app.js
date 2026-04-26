// Version 33

const state = {
  days: 40,
  day: 1,
  foodBudget: 1500,
  accBudget: 900,
  food: [],
  acc: []
};

function getDaily(budget) {
  return budget / state.days;
}

function getStatus(entries, budget) {
  const total = entries.reduce((a, b) => a + b.amount, 0);
  const expected = getDaily(budget) * state.day;
  return expected - total;
}

function render() {

  // FOOD
  let foodTotal = state.food.reduce((a,b)=>a+b.amount,0);
  let foodToday = state.food.filter(e=>e.day===state.day).reduce((a,b)=>a+b.amount,0);

  document.getElementById("foodStartingDaily").innerText = getDaily(state.foodBudget).toFixed(2);
  document.getElementById("foodRemainingBudget").innerText = (state.foodBudget - foodTotal).toFixed(2);
  document.getElementById("foodRemainingDaily").innerText = (getDaily(state.foodBudget) - foodToday).toFixed(2);
  document.getElementById("foodSpentToday").innerText = foodToday.toFixed(2);

  let fs = getStatus(state.food, state.foodBudget);
  document.getElementById("foodBudgetStatus").innerText = (fs>=0?"+":"")+fs.toFixed(2);

  // ACC
  let accTotal = state.acc.reduce((a,b)=>a+b.amount,0);
  let accToday = state.acc.filter(e=>e.day===state.day).reduce((a,b)=>a+b.amount,0);

  document.getElementById("accStartingDaily").innerText = getDaily(state.accBudget).toFixed(2);
  document.getElementById("accRemainingBudget").innerText = (state.accBudget - accTotal).toFixed(2);
  document.getElementById("accRemainingDaily").innerText = (getDaily(state.accBudget) - accToday).toFixed(2);
  document.getElementById("accSpentToday").innerText = accToday.toFixed(2);

  let as = getStatus(state.acc, state.accBudget);
  document.getElementById("accBudgetStatus").innerText = (as>=0?"+":"")+as.toFixed(2);
}

document.getElementById("addFoodBtn").onclick = () => {
  let val = parseFloat(document.getElementById("foodAmountInput").value);
  if(!val) return;
  state.food.push({day: state.day, amount: val});
  render();
};

document.getElementById("addAccBtn").onclick = () => {
  let val = parseFloat(document.getElementById("accAmountInput").value);
  if(!val) return;
  state.acc.push({day: state.day, amount: val});
  render();
};

document.getElementById("daysInput").onchange = (e)=>{
  state.days = parseInt(e.target.value);
  render();
};

document.getElementById("nextDayBtn").onclick = ()=>{
  state.day++;
  document.getElementById("dayNumberInput").value = "D"+state.day;
  render();
};

document.getElementById("prevDayBtn").onclick = ()=>{
  state.day = Math.max(1,state.day-1);
  document.getElementById("dayNumberInput").value = "D"+state.day;
  render();
};

render();