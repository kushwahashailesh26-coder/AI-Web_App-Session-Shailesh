const API_BASE = "http://localhost:3000/api/complaints";
const btnTrack = document.getElementById("btn-track");
const mobileInput = document.getElementById("track-mobile");
const resultsContainer = document.getElementById("results-container");
const successToast = document.getElementById("success-toast");

btnTrack.addEventListener("click", async () => {
  const mobile = mobileInput.value.trim();
  if (!mobile || mobile.length !== 10) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  btnTrack.disabled = true;
  btnTrack.textContent = "Searching...";

  try {
    const res = await fetch(`${API_BASE}/track/${mobile}`);
    const result = await res.json();

    if (result.success) {
      renderResults(result.data);
    } else {
      resultsContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">Something went wrong. Try again.</p>`;
    }
  } catch (err) {
    console.error(err);
    resultsContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">Could not connect to server.</p>`;
  } finally {
    btnTrack.disabled = false;
    btnTrack.textContent = "Search";
  }
});

function renderResults(complaints) {
  if (complaints.length === 0) {
    resultsContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">No complaints found for this mobile number.</p>`;
    return;
  }

  resultsContainer.innerHTML = complaints.map(c => `
    <div class="complaint-item">
      <div class="item-header">
        <span class="item-id">Complaint #${c.id}</span>
        <span class="status-pill status-${c.status}">${c.status}</span>
      </div>
      <div class="item-body">
        <p>${escapeHtml(c.complaint)}</p>
        ${c.adminComment ? `
          <div class="concern-section" style="background: rgba(99, 102, 241, 0.05); border-color: rgba(99, 102, 241, 0.2); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
            <span class="item-id">Admin Response:</span>
            <p style="margin-top: 0.5rem; color: var(--text-primary); font-weight: 500;">${escapeHtml(c.adminComment)}</p>
          </div>
        ` : ''}
        ${c.userConcern ? `
          <div class="concern-section">
            <span class="item-id" style="color: var(--success);">Your Concern:</span>
            <p style="margin-top: 0.5rem;">${escapeHtml(c.userConcern)}</p>
          </div>
        ` : `
          <div class="concern-section" id="concern-box-${c.id}">
            <button class="btn-concern" onclick="showConcernInput(${c.id})">Raise a Concern</button>
            <div class="concern-input" id="input-container-${c.id}">
              <textarea id="concern-text-${c.id}" class="form-group" style="width: 100%; min-height: 80px; margin-bottom: 0.5rem;" placeholder="Describe your concern..."></textarea>
              <button class="btn-submit" style="width: auto; padding: 0.5rem 1rem;" onclick="submitConcern(${c.id})">Submit Concern</button>
            </div>
          </div>
        `}
      </div>
    </div>
  `).join("");
}

window.showConcernInput = (id) => {
  document.getElementById(`input-container-${id}`).style.display = "block";
  document.querySelector(`#concern-box-${id} .btn-concern`).style.display = "none";
};

window.submitConcern = async (id) => {
  const concernText = document.getElementById(`concern-text-${id}`).value.trim();
  if (!concernText) return;

  try {
    const res = await fetch(`${API_BASE}/${id}/concern`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concern: concernText })
    });
    const result = await res.json();

    if (result.success) {
      showToast();
      btnTrack.click(); // Refresh list
    }
  } catch (err) {
    console.error(err);
  }
};

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showToast() {
  successToast.classList.add("show");
  setTimeout(() => successToast.classList.remove("show"), 3000);
}
