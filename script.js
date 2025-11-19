const form = document.getElementById('entry-form');
const entriesList = document.getElementById('entries');
const alertBox = document.getElementById('alert');
const chartType = document.getElementById('chart-type');
const undoBtn = document.getElementById('undo');

const balanceInput = document.getElementById('set-balance');
const saveBalanceBtn = document.getElementById('save-balance');
const currentBalanceBox = document.getElementById('current-balance');

const themeSwitcher = document.getElementById("themeSwitcher");
const themeLabel = document.getElementById("themeLabel");

const refreshBtn = document.getElementById("refreshApp");

let entries = JSON.parse(localStorage.getItem('budgetEntries') || '[]');
let budget = Number(localStorage.getItem('userBudget')) || 0;

function updateThemeLabel() {
  themeLabel.textContent =
    document.body.classList.contains("dark") ? "Dark Mode" : "Light Mode";
}

function updateBalanceDisplay() {
  currentBalanceBox.textContent = budget > 0 ? `Your Budget: ₹${budget}` : "";
}


function saveEntries() {
  localStorage.setItem('budgetEntries', JSON.stringify(entries));
}


saveBalanceBtn.addEventListener('click', () => {
  if (balanceInput.value <= 0) return;

  budget = Number(balanceInput.value);
  localStorage.setItem('userBudget', budget);

  updateBalanceDisplay();
  showAlertIfOverBudget();

  balanceInput.value = "";
});

updateBalanceDisplay();

function renderEntries() {
  entriesList.innerHTML = '';
  entries.slice().reverse().forEach(entry => {
    const li = document.createElement('li');
    li.classList.add(entry.type);

    li.innerHTML = `
      <span class="${entry.type}">
        ${entry.type === 'income' ? '+' : '-'}₹${entry.amount} (${entry.category})
      </span>
      <span>${new Date(entry.date).toLocaleDateString()}</span>
    `;
    entriesList.appendChild(li);
  });
}

function getTotalExpense() {
  return entries
    .filter(e => e.type === 'expense')
    .reduce((t, e) => t + Number(e.amount), 0);
}

function showAlertIfOverBudget() {
  if (budget === 0) return;

  const expense = getTotalExpense();
  if (expense > budget) {
    alertBox.textContent = `⚠️ You are over budget! (₹${expense} > ₹${budget})`;
  } else {
    alertBox.textContent = "";
  }
}

function addEntry(amount, category, type) {
  entries.push({
    amount: Number(amount),
    category,
    type,
    date: new Date().toISOString()
  });

  saveEntries();
  renderEntries();
  showAlertIfOverBudget();
  renderChart();
}

form.addEventListener('submit', e => {
  e.preventDefault();

  const amount = form.amount.value;
  const category = form.category.value;
  const type = form.type.value;

  if (amount <= 0 || !category) return;

  addEntry(amount, category, type);

  form.amount.value = '';
  form.category.value = '';
});

/* UNDO */
undoBtn.addEventListener('click', () => {
  if (entries.length === 0) return;

  entries.pop();
  saveEntries();
  renderEntries();
  showAlertIfOverBudget();
  renderChart();
});

let chart;
function renderChart() {
  const type = chartType.value;
  const now = new Date();
  let labels = [], dataIncome = [], dataExpense = [];

  if (type === 'weekly') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      labels.push(d.toLocaleDateString().slice(0,5));

      let income = 0, expense = 0;
      entries.forEach(e => {
        const ed = new Date(e.date);
        if (ed.toDateString() === d.toDateString()) {
          if (e.type === 'income') income += Number(e.amount);
          else expense += Number(e.amount);
        }
      });

      dataIncome.push(income);
      dataExpense.push(expense);
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleString('default', { month: 'short' }));

      let income = 0, expense = 0;
      entries.forEach(e => {
        const ed = new Date(e.date);
        if (ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth()) {
          if (e.type === 'income') income += Number(e.amount);
          else expense += Number(e.amount);
        }
      });

      dataIncome.push(income);
      dataExpense.push(expense);
    }
  }

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById('chart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Income', data: dataIncome, backgroundColor: 'rgba(0,200,0,0.3)' },
        { label: 'Expense', data: dataExpense, backgroundColor: 'rgba(200,0,0,0.3)' }
      ]
    },
    options: {
      scales: { y: { beginAtZero: true } }
    }
  });
}

chartType.addEventListener('change', renderChart);

refreshBtn.addEventListener("click", () => {
  const confirmDelete = confirm("Are you sure you want to reset the entire app? All data will be deleted!");

  if (!confirmDelete) return;

  localStorage.removeItem("budgetEntries");
  localStorage.removeItem("userBudget");

  entries = [];
  budget = 0;

  entriesList.innerHTML = "";
  currentBalanceBox.textContent = "";
  alertBox.textContent = "";

  if (chart) chart.destroy();

  renderChart();

  alert("App has been refreshed!");
});

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeSwitcher.checked = true;
}

updateThemeLabel();

themeSwitcher.addEventListener("change", () => {
  if (themeSwitcher.checked) {
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
  updateThemeLabel();
});

renderEntries();
showAlertIfOverBudget();
renderChart();
