// ===== Configuration =====
const API_URL = "http://localhost:3000/api/complaints";

// ===== DOM Elements =====
const form = document.getElementById("complaint-form");
const submitBtn = document.getElementById("submit-btn");
const successToast = document.getElementById("success-toast");
const errorToast = document.getElementById("error-toast");

const fields = ["name", "city", "mobile", "complaint"];

// ===== Validation Rules =====
function validate(fieldName, value) {
  if (!value.trim()) {
    return `${capitalize(fieldName)} is required.`;
  }

  if (fieldName === "mobile") {
    const mobilePattern = /^[6-9]\d{9}$/;
    if (!mobilePattern.test(value.trim())) {
      return "Enter a valid 10-digit mobile number.";
    }
  }

  if (fieldName === "name" && value.trim().length < 2) {
    return "Name must be at least 2 characters.";
  }

  if (fieldName === "complaint" && value.trim().length < 10) {
    return "Complaint must be at least 10 characters.";
  }

  return "";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== Show / Clear Field Errors =====
function showFieldError(fieldName, message) {
  const input = document.getElementById(fieldName);
  const errorSpan = document.getElementById(`error-${fieldName}`);
  input.classList.add("input-error");
  errorSpan.textContent = message;
}

function clearFieldError(fieldName) {
  const input = document.getElementById(fieldName);
  const errorSpan = document.getElementById(`error-${fieldName}`);
  input.classList.remove("input-error");
  errorSpan.textContent = "";
}

// ===== Real-time Validation on Blur =====
fields.forEach((fieldName) => {
  const input = document.getElementById(fieldName);
  input.addEventListener("blur", () => {
    const error = validate(fieldName, input.value);
    if (error) {
      showFieldError(fieldName, error);
    } else {
      clearFieldError(fieldName);
    }
  });

  input.addEventListener("input", () => {
    clearFieldError(fieldName);
  });
});

// ===== Restrict mobile field to digits only =====
const mobileInput = document.getElementById("mobile");
mobileInput.addEventListener("input", () => {
  mobileInput.value = mobileInput.value.replace(/\D/g, "").slice(0, 10);
});

// ===== Toast Helpers =====
function showToast(toastElement, message, duration = 3500) {
  const msgSpan = toastElement.querySelector("span");
  if (message) msgSpan.textContent = message;
  toastElement.classList.add("show");

  setTimeout(() => {
    toastElement.classList.remove("show");
  }, duration);
}

// ===== Form Submission =====
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validate all fields
  let hasError = false;
  const formData = {};

  fields.forEach((fieldName) => {
    const input = document.getElementById(fieldName);
    const value = input.value;
    const error = validate(fieldName, value);

    if (error) {
      showFieldError(fieldName, error);
      hasError = true;
    } else {
      clearFieldError(fieldName);
      formData[fieldName] = value.trim();
    }
  });

  if (hasError) return;

  // Set loading state
  submitBtn.classList.add("loading");
  submitBtn.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showToast(successToast, "Complaint submitted successfully!");
      form.reset();
    } else {
      showToast(errorToast, result.message || "Submission failed. Please try again.");
    }
  } catch (err) {
    console.error("Network error:", err);
    showToast(errorToast, "Cannot connect to server. Is the backend running?");
  } finally {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
});
