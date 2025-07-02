 const dateElement = document.getElementById("date");
    const taskInput = document.getElementById("taskInput");
    const taskList = document.getElementById("taskList");
    const priorityInput = document.getElementById("priority");
    const tagsInput = document.getElementById("tags");

    function formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function updateDate() {
      const today = new Date();
      dateElement.textContent = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

   function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    renderTask(task, index);
  });

  const todayKey = getDateKey();
  const todayHistory = JSON.parse(localStorage.getItem(`history-${todayKey}`) || "[]");

  const completedCount = todayHistory.filter(t => t.status === "✅ Completed").length;
  const unfinishedCount = todayHistory.filter(t => t.status === "❌ Unfinished").length;
  const pendingCount = tasks.filter(t => !t.completed).length;

  // Update dashboard text
  document.getElementById("todayTasks").textContent = tasks.length;
  document.getElementById("completedToday").textContent = completedCount;
  document.getElementById("unfinishedToday").textContent = unfinishedCount;

  // Show chart if there’s any data
  const hasChartData = completedCount + unfinishedCount + pendingCount > 0;
  document.getElementById("pieChart").style.display = hasChartData ? "block" : "none";

  if (hasChartData) {
    drawPieChart(completedCount, unfinishedCount, pendingCount);
  }
  updateProgressBar();

}




    function saveTasks(tasks) {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function addTask() {
      const value = taskInput.value.trim();
      const priority = priorityInput.value;
      const tags = tagsInput.value.trim();
      if (!value) return;
      const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
      tasks.push({ text: value, completed: false, priority, tags });
      saveTasks(tasks);
      taskInput.value = "";
      tagsInput.value = "";
      loadTasks();
    }

   function toggleComplete(index) {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  tasks[index].completed = !tasks[index].completed;
  saveTasks(tasks);

  const todayKey = getDateKey();
  const task = tasks[index];
  const history = JSON.parse(localStorage.getItem(`history-${todayKey}`) || "[]");

  const alreadyLogged = history.some(t => t.text === task.text && t.status === (task.completed ? "✅ Completed" : "❌ Unfinished"));
  if (!alreadyLogged) {
    history.push({ ...task, status: task.completed ? "✅ Completed" : "❌ Unfinished" });
    localStorage.setItem(`history-${todayKey}`, JSON.stringify(history));
  }

  loadTasks();
  loadHistory();
  updateStreakTracker();
}


    function deleteTask(index) {
      const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
      tasks.splice(index, 1);
      saveTasks(tasks);
      loadTasks();
    }

function renderTask(task, index) {
  const li = document.createElement("li");
  if (task.completed) li.classList.add("completed");

  li.innerHTML = `
    <div>
      <span>${task.text}</span>
      <div class="task-meta">
        <span class="priority-${task.priority}">${task.priority}</span>
        ${task.dueDate ? `<span>Due: ${formatDate(task.dueDate)}</span>` : ""}
      </div>
    </div>
    <div class="task-actions">
      <button onclick="markDone(${index})" title="Mark as Done">
        <i class='bx bx-check-circle'></i>
      </button>
      <button onclick="markNotDone(${index})" title="Mark as Not Done">
        <i class='bx bx-x-circle'></i>
      </button>
      <button onclick="deleteTask(${index})" title="Delete Task">
        <i class='bx bx-trash'></i>
      </button>
    </div>
  `;

  taskList.appendChild(li);
}

function markDone(index) {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const task = tasks[index];
  task.completed = true;
  saveTasks(tasks);

  const todayKey = getDateKey();
  const history = JSON.parse(localStorage.getItem(`history-${todayKey}`) || "[]");

  const exists = history.some(t => t.text === task.text && t.status === "✅ Completed");
  if (!exists) {
    history.push({ ...task, status: "✅ Completed" });
    localStorage.setItem(`history-${todayKey}`, JSON.stringify(history));
  }

  loadTasks();
  loadHistory();
  updateStreakTracker();
}


function markNotDone(index) {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const task = tasks[index];

  const todayKey = getDateKey();
  const history = JSON.parse(localStorage.getItem(`history-${todayKey}`) || "[]");

  const exists = history.some(t => t.text === task.text && t.status === "❌ Unfinished");
  if (!exists) {
    history.push({ ...task, status: "❌ Unfinished" });
    localStorage.setItem(`history-${todayKey}`, JSON.stringify(history));
  }

  tasks.splice(index, 1); // Remove from active task list
  saveTasks(tasks);
  loadTasks();
  loadHistory();
}


    function getDateKey() {
      const today = new Date();
      return today.toISOString().split("T")[0];
    }

function loadHistory() {
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";
  let total = 0;

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("history-")) {
      const date = key.replace("history-", "");
      const tasks = JSON.parse(localStorage.getItem(key));

      if (tasks.length) {
        total += tasks.length;

       const card = document.createElement("div");
      card.className = "history-card";
      card.style.cursor = "pointer";
      card.onclick = () => showHistoryGraph(date);


        card.innerHTML = `
          <div style="display:flex;  justify-content:space-between; align-items:center;">
            <h4>${formatDate(date)}</h4>
            <button style="background:transparent;" onclick="deleteHistoryDay('${date}')" title="Delete Entire History">
              <i class='bx bx-trash' style="color:#ef4444; font-size:1.2rem;"></i>
            </button>
          </div>
          <ul>
            ${tasks.map(t => `<li class="historyli">${t.text}
  ${t.status === "✅ Completed" ? "<i class='bx bx-check-circle' style='color:#22c55e'></i>" : "<i class='bx bx-x-circle' style='color:#ef4444'></i>"}
  
</li>
`).join("")}
          </ul>
        `;

        historyList.appendChild(card);
      }
    }
  });

  document.getElementById("totalHistory").textContent = total;
}
function showHistoryGraph(date) {
  const history = JSON.parse(localStorage.getItem(`history-${date}`) || "[]");

  const completed = history.filter(t => t.status === "✅ Completed").length;
  const unfinished = history.filter(t => t.status === "❌ Unfinished").length;
  const pending = 0; // 🔒 NO more auto-pending

  if (completed + unfinished > 0) {
    document.getElementById("pieChart").style.display = "block";
    drawPieChart(completed, unfinished, pending, `Task Stats for ${formatDate(date)}`);
  }
}



function deleteHistoryDay(date) {
  const confirmDelete = confirm(`Are you sure you want to delete all history for ${formatDate(date)}?`);
  if (!confirmDelete) return;

  localStorage.removeItem(`history-${date}`);
  loadHistory();
}




    function filterHistoryByDate() {
      const date = document.getElementById("searchDate").value;
      if (!date) return;
      const historyList = document.getElementById("historyList");
      historyList.innerHTML = "";
      const tasks = JSON.parse(localStorage.getItem(`history-${date}`) || "[]");
      if (tasks.length) {
        const card = document.createElement("div");
        card.className = "history-card";
        card.innerHTML = `
          <h4>${formatDate(date)}</h4>
          <ul>
            ${tasks.map(t => `<li>✅ ${t.text}</li>`).join("")}
          </ul>
        `;
        historyList.appendChild(card);
        document.getElementById("totalHistory").textContent = tasks.length;
      }
    }

function drawPieChart(completed, unfinished, pending = 0, title = "Tasks") {
  const ctx = document.getElementById('pieChart').getContext('2d');
  if (window.pieInstance) window.pieInstance.destroy();

  const data = [];
  const labels = [];
  const colors = [];

  if (completed > 0) {
    data.push(completed);
    labels.push("✅ Completed");
    colors.push("#86efac");
  }

  if (unfinished > 0) {
    data.push(unfinished);
    labels.push("❌ Unfinished");
    colors.push("#fca5a5");
  }

  if (pending > 0) {
    data.push(pending);
    labels.push("🕗 Pending");
    colors.push("#fde68a"); // Light yellow
  }

  window.pieInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: title,
        data,
        backgroundColor: colors
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: title,
          color: '#f5f5f5',
          font: { size: 18 }
        },
        legend: {
          labels: { color: '#f5f5f5' }
        }
      }
    }
  });
}


   async function fetchQuote() {
  try {
    const res = await fetch("https://api.quotable.io/random");

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    document.getElementById("quoteText").textContent = `“${data.content}”`;
    document.getElementById("quoteAuthor").textContent = `— ${data.author}`;
  } catch (err) {
    console.error("Failed to fetch quote:", err);
    document.getElementById("quoteText").textContent = "Keep pushing forward.";
    document.getElementById("quoteAuthor").textContent = "";
  }
}

function isNewDay() {
  const lastDate = localStorage.getItem("lastActiveDate");
  const today = new Date().toISOString().split("T")[0];
  if (lastDate !== today) {
    localStorage.setItem("lastActiveDate", today);
    return true;
  }
  return false;
}
function archiveUnfinishedTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const unfinished = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  const todayKey = getDateKey();
  const archived = [...completed.map(t => ({ ...t, status: "✅ Completed" })), 
                    ...unfinished.map(t => ({ ...t, status: "❌ Unfinished" }))];

  localStorage.setItem(`history-${todayKey}`, JSON.stringify(archived));
  localStorage.setItem("tasks", "[]"); // clear active tasks
}
function showYesterdaySummary() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().split("T")[0];

  const history = JSON.parse(localStorage.getItem(`history-${yKey}`) || "[]");
  const completed = history.filter(t => t.status === "✅ Completed").length;
  const unfinished = history.filter(t => t.status === "❌ Unfinished").length;

  const content = `
    ✅ ${completed} task${completed !== 1 ? 's' : ''} completed<br>
    ❌ ${unfinished} unfinished<br><br>
    🔥 Keep the momentum going!
  `;
  document.getElementById("summaryContent").innerHTML = content;
  document.getElementById("dailySummaryModal").style.display = "flex";
}

function closeSummaryModal() {
  document.getElementById("dailySummaryModal").style.display = "none";
}

   updateDate();
if (isNewDay()) {
  alert("New day detected");

  showYesterdaySummary();  // ✅ make sure this line is added
 
}
function scheduleEndOfDayArchive() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(23, 59, 0, 0); // 11:59 PM today

  const timeUntilArchive = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    archiveUnfinishedTasks();
    console.log("Auto-archived tasks at end of day.");
  }, timeUntilArchive);
}
function updateProgressBar() {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const todayKey = getDateKey();
  const history = JSON.parse(localStorage.getItem(`history-${todayKey}`) || "[]");

  const completed = history.filter(t => t.status === "✅ Completed").length;
  const total = tasks.length + completed;

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  document.getElementById("progressBar").style.width = `${percent}%`;
  document.getElementById("progressPercent").textContent = `${percent}% completed`;
}

function updateStreakTracker() {
  let streak = 0;
  let date = new Date();
  const todayKey = getDateKey();

  while (true) {
    const key = date.toISOString().split("T")[0];
    const history = JSON.parse(localStorage.getItem(`history-${key}`) || "[]");

    const completed = history.some(t => t.status === "✅ Completed");
    if (completed) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  // Store in localStorage so streak persists
  localStorage.setItem("taskStreak", streak);
  localStorage.setItem("lastStreakDate", todayKey);
  document.getElementById("streakCount").textContent = streak;
}


scheduleEndOfDayArchive(); // Call it once when app loads

loadTasks();
loadHistory();
fetchQuote();
updateProgressBar();
updateStreakTracker();
