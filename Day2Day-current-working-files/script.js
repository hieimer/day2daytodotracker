const appShell = document.querySelector(".app-shell");
const sidebarToggle = document.querySelector("#sidebarToggle");
const brandInitial = document.querySelector("#brandInitial");
const brandName = document.querySelector("#brandName");
const greetingText = document.querySelector("#greetingText");
const nameModal = document.querySelector("#nameModal");
const nameForm = document.querySelector("#nameForm");
const userNameInput = document.querySelector("#userNameInput");
const emptyState = document.querySelector("#emptyState");
const emptyAddButton = document.querySelector("#emptyAddButton");
const taskList = document.querySelector("#taskList");
const sidebarTaskCount = document.querySelector("#sidebarTaskCount");
const statusScreenTabs = document.querySelector("#statusScreenTabs");
const pendingCount = document.querySelector("#pendingCount");
const completedStatusCount = document.querySelector("#completedStatusCount");
const overdueCount = document.querySelector("#overdueCount");
const navItems = document.querySelectorAll(".nav-item[data-view]");
const statusTabs = document.querySelectorAll(".status-tab[data-status]");
const taskHeading = document.querySelector("#taskHeading");
const showAddFormButton = document.querySelector("#showAddForm");
const addPrompt = document.querySelector("#addPrompt");
const addForm = document.querySelector("#addForm");
const cancelAddTask = document.querySelector("#cancelAddTask");
const taskTitleInput = document.querySelector("#taskTitleInput");
const taskDescriptionInput = document.querySelector("#taskDescriptionInput");
const taskDueDateInput = document.querySelector("#taskDueDateInput");
const detailMetaRow = document.querySelector("#detailMetaRow");
const createdDateDetail = document.querySelector("#createdDateDetail");
const dueDateText = document.querySelector("#dueDateText");
const dateField = document.querySelector("#dateField");
const priorityButton = document.querySelector("#priorityButton");
const priorityText = document.querySelector("#priorityText");
const priorityOptions = document.querySelector("#priorityOptions");

const storageKey = "day2day-tasks";
const nameStorageKey = "day2day-user-name";
const priorityLabels = {
  none: "Priority",
  high: "High",
  medium: "Medium",
  low: "Low",
};

let tasks = loadTasks();
let currentView = "tasks";
let currentStatus = "pending";
let selectedPriority = "none";
let editingTaskId = null;
let userName = localStorage.getItem(nameStorageKey) || "";

if (window.matchMedia("(max-width: 720px)").matches) {
  appShell.classList.add("sidebar-collapsed");
  sidebarToggle.setAttribute("aria-expanded", "false");
}

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(storageKey)) || [];
    const now = new Date().toISOString();

    return savedTasks.map((task) => ({
      ...task,
      description: task.description || "",
      dueDate: task.dueDate || "",
      priority: task.priority || "none",
      createdAt: task.createdAt || now,
    }));
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function applyUserName() {
  const firstName = getFirstName(userName);

  greetingText.textContent = firstName ? `Hello, ${firstName} 👋` : "Hello 👋";
  brandName.textContent = firstName || "Day2Day";
  brandInitial.textContent = firstName ? firstName.charAt(0).toUpperCase() : "D";
}

function getFirstName(name) {
  return name.trim().split(/\s+/)[0] || "";
}

function showNameModalIfNeeded() {
  if (getFirstName(userName)) {
    nameModal.classList.add("hidden");
    return;
  }

  nameModal.classList.remove("hidden");
  userNameInput.focus();
}

function renderTasks() {
  taskList.innerHTML = "";

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  const overdueTasks = pendingTasks.filter(isOverdue);
  const visibleTasks = getVisibleTasks(pendingTasks, completedTasks, overdueTasks);
  const isStatusView = currentView === "status";
  const canAddTasks = currentView === "tasks";

  visibleTasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;
    item.tabIndex = 0;
    item.addEventListener("click", () => showEditForm(task.id, item));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        showEditForm(task.id, item);
      }
    });

    const checkbox = document.createElement("input");
    checkbox.className = "task-check";
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", task.completed ? `Move ${task.title} back to My List` : `Mark ${task.title} complete`);
    checkbox.addEventListener("click", (event) => event.stopPropagation());
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const content = document.createElement("div");
    content.className = "task-content";

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    content.append(title);

    if (task.description) {
      const description = document.createElement("p");
      description.className = "task-description";
      description.textContent = task.description;
      content.append(description);
    }

    const metaRow = document.createElement("div");
    metaRow.className = "task-meta-row";

    if (task.dueDate) {
      const dueDate = document.createElement("span");
      dueDate.className = "task-due";
      dueDate.innerHTML = `<span aria-hidden="true"></span>${formatDate(task.dueDate)}`;
      metaRow.append(dueDate);
    }

    if (task.priority && task.priority !== "none") {
      const priority = document.createElement("span");
      priority.className = `task-priority priority-${task.priority}`;
      priority.innerHTML = `<span class="flag-icon priority-${task.priority}" aria-hidden="true"></span>${priorityLabels[task.priority]}`;
      metaRow.append(priority);
    }
    content.append(metaRow);

    const rowStatus = document.createElement("div");
    rowStatus.className = "task-row-status";

    if (isOverdue(task)) {
      const overdueBadge = document.createElement("span");
      overdueBadge.className = "overdue-badge";
      overdueBadge.textContent = "Overdue";
      rowStatus.append(overdueBadge);
    }

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.innerHTML = `<span class="trash-icon" aria-hidden="true"></span>`;
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      tasks = tasks.filter((candidate) => candidate.id !== task.id);
      saveTasks();
      renderTasks();
    });

    item.append(checkbox, content, rowStatus, deleteButton);
    taskList.append(item);
  });

  taskHeading.textContent = getHeading();
  statusScreenTabs.classList.toggle("hidden", !isStatusView);
  emptyState.classList.toggle("hidden", !canAddTasks || visibleTasks.length > 0);
  taskList.classList.toggle("hidden", visibleTasks.length === 0);
  addPrompt.classList.toggle("hidden", !canAddTasks || pendingTasks.length === 0);
  sidebarTaskCount.textContent = pendingTasks.length;
  sidebarTaskCount.setAttribute("aria-label", `${pendingTasks.length} pending ${pendingTasks.length === 1 ? "task" : "tasks"}`);
  pendingCount.textContent = pendingTasks.length;
  completedStatusCount.textContent = completedTasks.length;
  overdueCount.textContent = overdueTasks.length;

  navItems.forEach((item) => {
    const isActive = item.dataset.view === currentView;
    item.classList.toggle("active", isActive);
    if (isActive) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  statusTabs.forEach((tab) => {
    const isActive = tab.dataset.status === currentStatus;
    tab.classList.toggle("active", isActive);
  });
}

function getVisibleTasks(pendingTasks, completedTasks, overdueTasks) {
  if (currentView === "tasks") {
    return pendingTasks;
  }

  if (currentStatus === "completed") {
    return completedTasks;
  }

  if (currentStatus === "overdue") {
    return overdueTasks;
  }

  return pendingTasks;
}

function getHeading() {
  if (currentView === "status") {
    return "Status";
  }

  return "My List";
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) {
    return false;
  }

  return task.dueDate < getTodayValue();
}

function getTaskStatus(task) {
  if (task.completed) {
    return "Completed";
  }

  if (isOverdue(task)) {
    return "Overdue";
  }

  return "Pending";
}

function getTodayValue() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function formatDate(value) {
  const datePart = String(value).slice(0, 10);
  const date = new Date(`${datePart}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function showAddForm() {
  editingTaskId = null;
  resetForm();
  addPrompt.after(addForm);
  emptyState.classList.add("hidden");
  addPrompt.classList.add("hidden");
  addForm.classList.remove("hidden");
  detailMetaRow.classList.add("hidden");
  addForm.querySelector(".create-task-button").textContent = "Create Task";
  taskTitleInput.focus();
}

function showEditForm(taskId, row) {
  const task = tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    return;
  }

  editingTaskId = taskId;
  taskTitleInput.value = task.title;
  taskDescriptionInput.value = task.description || "";
  taskDueDateInput.value = task.dueDate || "";
  setPriority(task.priority || "none");
  createdDateDetail.textContent = `Created ${formatDate(task.createdAt)}`;
  updateDueDateText();
  row.after(addForm);
  emptyState.classList.add("hidden");
  addPrompt.classList.add("hidden");
  addForm.classList.remove("hidden");
  detailMetaRow.classList.remove("hidden");
  addForm.querySelector(".create-task-button").textContent = "Save Task";
  taskTitleInput.focus();
}

function hideAddForm() {
  addForm.classList.add("hidden");
  addForm.querySelector(".create-task-button").textContent = "Create Task";
  editingTaskId = null;
  resetForm();
  const pendingTasks = tasks.filter((task) => !task.completed);
  addPrompt.classList.toggle("hidden", currentView !== "tasks" || pendingTasks.length === 0);
}

function resetForm() {
  taskTitleInput.value = "";
  taskDescriptionInput.value = "";
  taskDueDateInput.value = "";
  detailMetaRow.classList.add("hidden");
  createdDateDetail.textContent = "Created";
  setPriority("none");
  updateDueDateText();
  closePriorityOptions();
}

function setPriority(priority) {
  selectedPriority = priority;
  priorityText.textContent = priorityLabels[priority];
  priorityButton.classList.remove("priority-none", "priority-high", "priority-medium", "priority-low");
  priorityButton.classList.add(`priority-${priority}`);
}

function closePriorityOptions() {
  priorityOptions.classList.add("hidden");
  priorityButton.setAttribute("aria-expanded", "false");
}

sidebarToggle.addEventListener("click", () => {
  const isCollapsed = appShell.classList.toggle("sidebar-collapsed");
  sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    currentView = item.dataset.view;
    currentStatus = currentView === "status" ? currentStatus : "pending";
    hideAddForm();
    renderTasks();
  });
});

statusTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentStatus = tab.dataset.status;
    currentView = "status";
    hideAddForm();
    renderTasks();
  });
});

emptyAddButton.addEventListener("click", showAddForm);
showAddFormButton.addEventListener("click", showAddForm);
taskDueDateInput.addEventListener("change", updateDueDateText);
dateField.addEventListener("click", () => {
  if (typeof taskDueDateInput.showPicker === "function") {
    taskDueDateInput.showPicker();
  } else {
    taskDueDateInput.focus();
  }
});
priorityButton.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = !priorityOptions.classList.contains("hidden");
  priorityOptions.classList.toggle("hidden", isOpen);
  priorityButton.setAttribute("aria-expanded", String(!isOpen));
});
priorityOptions.querySelectorAll("[data-priority]").forEach((option) => {
  option.addEventListener("click", (event) => {
    event.stopPropagation();
    setPriority(option.dataset.priority);
    closePriorityOptions();
  });
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".priority-menu")) {
    closePriorityOptions();
  }
});
nameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextName = userNameInput.value.trim();

  if (!nextName) {
    userNameInput.focus();
    return;
  }

  userName = nextName;
  localStorage.setItem(nameStorageKey, userName);
  applyUserName();
  nameModal.classList.add("hidden");
});
cancelAddTask.addEventListener("click", () => {
  hideAddForm();
  renderTasks();
});

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskTitleInput.value.trim();
  const description = taskDescriptionInput.value.trim();
  const dueDate = taskDueDateInput.value;

  if (!title) {
    taskTitleInput.focus();
    return;
  }

  if (editingTaskId) {
    tasks = tasks.map((task) =>
      task.id === editingTaskId
        ? {
            ...task,
            title,
            description,
            dueDate,
            priority: selectedPriority,
          }
        : task
    );
  } else {
    tasks.push({
      id: crypto.randomUUID(),
      title,
      description,
      dueDate,
      priority: selectedPriority,
      createdAt: new Date().toISOString(),
      completed: false,
    });
  }

  saveTasks();
  hideAddForm();
  renderTasks();
});

applyUserName();
renderTasks();
updateDueDateText();
showNameModalIfNeeded();

function updateDueDateText() {
  dueDateText.textContent = taskDueDateInput.value ? formatDate(taskDueDateInput.value) : "Due Date";
}
