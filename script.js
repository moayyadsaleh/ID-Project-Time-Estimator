const taskBenchmarks = {
  contentAnalysis: { simple: 3, moderate: 5, complex: 7 }, // 2-3, 4-6, 6-8
  storyboarding: { simple: 4, moderate: 7, complex: 10 }, // 3-5, 5-8, 8-12
  slideDevBasic: { simple: 3, moderate: 5, complex: 7 }, // 2-4, 4-6, 6-8
  slideDevInteractive: { simple: 5, moderate: 8, complex: 12 }, // 4-6, 6-10, 10-15
  videoProduction: { simple: 15, moderate: 30, complex: 50 }, // 10-20, 20-40, 40-60
  qualityAssurance: { simple: 2, moderate: 3, complex: 5 }, // 1-2, 2-4, 4-6
  projectManagement: { simple: 2, moderate: 3, complex: 5 }, // 1-2, 2-4, 4-6
  scriptwriting: { simple: 3, moderate: 5, complex: 7 }, // 2-4, 4-6, 6-8
  gamificationDevelopment: { simple: 10, moderate: 16, complex: 30 }, // 8-12, 12-20, 20-40
  accessibilityCompliance: { simple: 4, moderate: 6, complex: 8 }, // 3-5, 5-7, 7-10
  audioEditing: { simple: 3, moderate: 5, complex: 7 }, // 2-3, 3-5, 5-8
};

const taskList = [];
const taskListElement = document.getElementById("taskList");
const totalTimeElement = document.getElementById("totalTime");
const taskDropdown = document.getElementById("task");
const unitLabel = document.getElementById("unitLabel");

document.getElementById("addTaskBtn").addEventListener("click", addTask);
document
  .getElementById("calculateBtn")
  .addEventListener("click", calculateTotalTime);
document.getElementById("exportBtn").addEventListener("click", exportToPDF);
taskDropdown.addEventListener("change", updateUnitLabel);

function addTask() {
  const taskDropdown = document.getElementById("task");
  const numUnitsInput = document.getElementById("numUnits");
  const complexityDropdown = document.getElementById("complexity");
  const customTaskNameInput = document.getElementById("customTask");
  const customTaskTimeInput = document.getElementById("customTime");

  const task = taskDropdown.value;
  let numUnits = parseInt(numUnitsInput.value) || 0;
  const complexity = complexityDropdown.value;
  const customTaskName = customTaskNameInput.value;
  const customTaskTime = parseInt(customTaskTimeInput.value) || 0;

  if (customTaskName && customTaskTime > 0) {
    taskList.push({
      task: customTaskName,
      numUnits: 1,
      complexity: "custom",
      totalTaskTime: customTaskTime,
    });
  } else if (numUnits > 0) {
    const hoursPerUnit = taskBenchmarks[task][complexity];
    const totalTaskTime = numUnits * hoursPerUnit;

    taskList.push({ task, numUnits, complexity, totalTaskTime });
  }

  // Reset the form fields after adding a task
  taskDropdown.selectedIndex = 0;
  numUnitsInput.value = 0;
  complexityDropdown.selectedIndex = 0;
  customTaskNameInput.value = "";
  customTaskTimeInput.value = "";

  displayTaskList();
}

// Update the displayTaskList function to include chart rendering
function displayTaskList() {
  taskListElement.innerHTML = "";
  taskList.forEach((task, index) => {
    const li = document.createElement("li");
    li.textContent = `${formatTaskName(task.task)} – ${
      task.numUnits
    } units (${capitalizeFirstLetter(task.complexity)}) – ${
      task.totalTaskTime
    } hours`;

    // Add a delete button for each task
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => deleteTask(index));

    li.appendChild(deleteBtn);
    taskListElement.appendChild(li);
  });

  // Render the pie chart whenever the task list is updated
  renderPieChart();
}

function deleteTask(index) {
  taskList.splice(index, 1);
  displayTaskList();
  calculateTotalTime();
}

function calculateTotalTime() {
  let totalTime = taskList.reduce((sum, task) => sum + task.totalTaskTime, 0);
  const contingency = parseInt(document.getElementById("contingency").value);
  totalTime += (totalTime * contingency) / 100;

  totalTimeElement.textContent = `${totalTime} hours`;
}
function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 15;
  let y = margin;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Training Development Project Time Estimation", margin, y);
  y += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const currentDate = new Date().toLocaleDateString();
  doc.text(`Date: ${currentDate}`, margin, y);
  y += 10;

  // Draw a horizontal line
  doc.setLineWidth(0.5);
  doc.line(margin, y, 210 - margin, y);
  y += 10;

  // Task Table Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Task", margin, y);
  doc.text("Units", margin + 70, y);
  doc.text("Complexity", margin + 110, y);
  doc.text("Time (hours)", margin + 160, y);
  y += 8;

  // Task List
  doc.setFont("helvetica", "normal");
  taskList.forEach((task) => {
    doc.text(formatTaskName(task.task), margin, y);
    doc.text(`${task.numUnits}`, margin + 70, y);
    doc.text(capitalizeFirstLetter(task.complexity), margin + 110, y);
    doc.text(`${task.totalTaskTime}`, margin + 160, y);
    y += 8;

    if (y > 250) {
      doc.addPage();
      y = margin;
    }
  });

  // Total Estimated Time
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text(`Total Estimated Time: ${totalTimeElement.textContent}`, margin, y);
  y += 20;

  // Export Chart to Image and Add to PDF
  if (pieChart) {
    const chartImage = pieChart.toBase64Image(); // Default toBase64Image maintains the aspect ratio
    const imageWidth = 100; // Desired image width in the PDF
    const imageHeight = 100; // Desired image height in the PDF (same as width to keep it a circle)

    doc.addImage(chartImage, "PNG", margin, y, imageWidth, imageHeight);
    y += imageHeight + 10;
  }

  // Footer
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");

  // Save the PDF
  doc.save("Training_Development_Estimator.pdf");
}
function updateUnitLabel() {
  const task = taskDropdown.value;
  let unitText = "Number of Units:";

  switch (task) {
    case "contentAnalysis":
      unitText = "Number of Pages:";
      break;
    case "storyboarding":
    case "slideDevBasic":
    case "slideDevInteractive":
      unitText = "Number of Slides:";
      break;
    case "videoProduction":
      unitText = "Video Length (in Minutes):";
      break;
    case "qualityAssurance":
    case "projectManagement":
      unitText = "Number of Hours:";
      break;
    case "scriptwriting":
      unitText = "Number of Pages:";
      break;
    case "gamificationDevelopment":
      unitText = "Number of Game Elements:";
      break;
    case "accessibilityCompliance":
      unitText = "Number of Checks:";
      break;
    case "audioEditing":
      unitText = "Audio Length (in Minutes):";
      break;
  }

  unitLabel.textContent = unitText;
}

function formatTaskName(task) {
  const formatted = task.replace(/([A-Z])/g, " $1").trim();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
// Initialize the chart instance
Chart.register(ChartDataLabels);
let pieChart = null;

function renderPieChart() {
  const taskNames = taskList.map((task) => formatTaskName(task.task));
  const taskTimes = taskList.map((task) => task.totalTaskTime);

  const ctx = document.getElementById("taskPieChart").getContext("2d");

  if (pieChart) {
    pieChart.destroy();
  }

  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: taskNames,
      datasets: [
        {
          data: taskTimes,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ],
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { size: 14 } },
        },
        datalabels: {
          color: "#fff",
          font: { size: 14, weight: "bold" },
          formatter: (value, context) => {
            const total = context.dataset.data.reduce(
              (sum, val) => sum + val,
              0
            );
            return ((value / total) * 100).toFixed(1) + "%";
          },
        },
      },
    },
  });
}
