// ===== Configuration =====
const API_URL = "http://localhost:3000/api/complaints";

// ===== DOM Elements =====
const complaintsList = document.getElementById("complaints-list");
const emptyState = document.getElementById("empty-state");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");

// Stats
const countTotal = document.getElementById("count-total");
const countPending = document.getElementById("count-pending");
const countResolved = document.getElementById("count-resolved");
const countRejected = document.getElementById("count-rejected");

// Filter buttons
const filterBtns = document.querySelectorAll(".filter-btn");

// Export buttons
const btnExportExcel = document.getElementById("export-excel");
const btnExportPdf = document.getElementById("export-pdf");

let allComplaints = [];
let currentFilter = "all";

// ===== Export Event Listeners =====
btnExportExcel.addEventListener("click", downloadExcel);
btnExportPdf.addEventListener("click", downloadPDF);

// ===== Export Functions =====
function getFilteredData() {
  return currentFilter === "all"
    ? allComplaints
    : allComplaints.filter((c) => c.status === currentFilter);
}

function downloadExcel() {
  const data = getFilteredData();
  if (data.length === 0) {
    showToast("No complaints to export!");
    return;
  }

  // Define headers
  const headers = ["ID", "Name", "City", "Mobile", "Complaint", "Status", "Created At"];
  
  // Create CSV content
  const rows = data.map(c => [
    c.id,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.city.replace(/"/g, '""')}"`,
    `"${c.mobile}"`,
    `"${c.complaint.replace(/"/g, '""')}"`,
    c.status,
    new Date(c.createdAt).toLocaleString()
  ]);

  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Complaints_${currentFilter}_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast("Excel (CSV) file downloaded!");
}

async function downloadPDF() {
  const data = getFilteredData();
  if (data.length === 0) {
    showToast("No complaints to export!");
    return;
  }

  try {
    // Correct way to access jsPDF in UMD/Browser bundle
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      throw new Error("jsPDF library not loaded. Check your internet connection.");
    }
    
    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(18);
    doc.text("Registered Complaints Report", 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Filter: ${currentFilter.toUpperCase()} | Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Define table data
    const tableColumn = ["ID", "Name", "City", "Mobile", "Status", "Date"];
    const tableRows = data.map(c => [
      c.id,
      c.name,
      c.city,
      c.mobile,
      c.status,
      new Date(c.createdAt).toLocaleDateString()
    ]);

    // Generate table
    const autoTable = doc.autoTable || window.autoTable;
    
    if (typeof autoTable !== 'function') {
      throw new Error("PDF Table plugin (autoTable) not found. Please refresh and try again.");
    }

    autoTable.call(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 40 }
    });

    // Save the PDF
    doc.save(`Complaints_${currentFilter}_${new Date().toISOString().slice(0,10)}.pdf`);
    showToast("PDF report downloaded!");
  } catch (err) {
    console.error("PDF Export Error:", err);
    showToast(err.message || "Error generating PDF.");
  }
}

// ===== Fetch Complaints =====
async function fetchComplaints() {
  try {
    const res = await fetch(API_URL);
    const result = await res.json();

    if (result.success) {
      allComplaints = result.data;
      updateStats();
      renderComplaints();
    }
  } catch (err) {
    console.error("Failed to fetch complaints:", err);
    complaintsList.innerHTML = "";
    emptyState.style.display = "block";
    emptyState.querySelector("h2").textContent = "Connection Error";
    emptyState.querySelector("p").textContent = "Cannot connect to the backend. Make sure the server is running.";
  }
}

// ===== Update Stats =====
function updateStats() {
  const total = allComplaints.length;
  const pending = allComplaints.filter((c) => c.status === "Pending").length;
  const resolved = allComplaints.filter((c) => c.status === "Resolved").length;
  const rejected = allComplaints.filter((c) => c.status === "Rejected").length;

  animateCount(countTotal, total);
  animateCount(countPending, pending);
  animateCount(countResolved, resolved);
  animateCount(countRejected, rejected);
}

function animateCount(el, target) {
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;

  const duration = 400;
  const start = performance.now();

  function step(timestamp) {
    const progress = Math.min((timestamp - start) / duration, 1);
    const value = Math.round(current + (target - current) * progress);
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ===== Render Complaints =====
function renderComplaints() {
  const filtered =
    currentFilter === "all"
      ? allComplaints
      : allComplaints.filter((c) => c.status === currentFilter);

  if (filtered.length === 0) {
    complaintsList.innerHTML = "";
    emptyState.style.display = "block";
    if (currentFilter !== "all") {
      emptyState.querySelector("h2").textContent = `No ${currentFilter} complaints`;
      emptyState.querySelector("p").textContent = `There are no complaints with "${currentFilter}" status.`;
    } else {
      emptyState.querySelector("h2").textContent = "No complaints found";
      emptyState.querySelector("p").textContent = "Complaints submitted through the form will appear here.";
    }
    return;
  }

  emptyState.style.display = "none";

  complaintsList.innerHTML = filtered
    .slice()
    .reverse()
    .map((c, i) => createComplaintCard(c, i))
    .join("");
}

function createComplaintCard(c, index) {
  const initials = c.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const date = new Date(c.createdAt);
  const timeAgo = formatTimeAgo(date);

  const isPending = c.status === "Pending";

  return `
    <div class="complaint-card" style="animation-delay: ${index * 0.06}s" id="card-${c.id}">
      <div class="card-header">
        <div class="card-user-info">
          <div class="user-avatar">${initials}</div>
          <div class="user-details">
            <h3>${escapeHtml(c.name)}</h3>
            <div class="user-meta">
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${escapeHtml(c.city)}
              </span>
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                ${escapeHtml(c.mobile)}
              </span>
            </div>
          </div>
        </div>
        <span class="status-badge status-${c.status}">
          <span class="status-dot"></span>
          ${c.status}
        </span>
      </div>
      <div class="card-body">
        <p class="complaint-text">${escapeHtml(c.complaint)}</p>
      </div>
      <div class="card-footer">
        <span class="card-time">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          ${timeAgo}
        </span>
        <div class="card-actions">
          <button class="action-btn btn-resolve" onclick="updateStatus(${c.id}, 'Resolved')" ${!isPending ? "disabled" : ""}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Resolve
          </button>
          <button class="action-btn btn-reject" onclick="updateStatus(${c.id}, 'Rejected')" ${!isPending ? "disabled" : ""}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            Reject
          </button>
        </div>
      </div>
    </div>
  `;
}

// ===== Update Complaint Status =====
async function updateStatus(id, newStatus) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    const result = await res.json();

    if (result.success) {
      // Update local data
      const complaint = allComplaints.find((c) => c.id === id);
      if (complaint) complaint.status = newStatus;

      updateStats();
      renderComplaints();
      showToast(`Complaint #${id} marked as ${newStatus}`);
    }
  } catch (err) {
    console.error("Failed to update status:", err);
    showToast("Failed to update. Check server connection.");
  }
}

// ===== Filter Handling =====
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderComplaints();
  });
});

// ===== Helpers =====
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function showToast(message, duration = 3000) {
  toastMessage.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

// ===== Auto-refresh every 10 seconds =====
setInterval(fetchComplaints, 10000);

// ===== Initial Load =====
fetchComplaints();
