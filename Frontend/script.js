// ===== Configuration =====
const API_URL = "http://localhost:3000/api/complaints";

// ===== DOM Elements =====
const form = document.getElementById("complaint-form");
const submitBtn = document.getElementById("submit-btn");
const btnText = submitBtn.querySelector(".btn-text");
const successToast = document.getElementById("success-toast");
const errorToast = document.getElementById("error-toast");

// AI Section Elements
const aiSection = document.getElementById("ai-section");
const aiQuestionText = document.getElementById("ai-question-text");
const answerInput = document.getElementById("answer");
const errorAnswer = document.getElementById("error-answer");

const fields = ["name", "city", "mobile", "complaint"];
let isAiQuestionGenerated = false;
let currentAiQuestion = "";

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

  if (fieldName === "answer" && value.trim().length < 3) {
    return "Please provide a more detailed answer.";
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
  if (input) input.classList.add("input-error");
  if (errorSpan) errorSpan.textContent = message;
}

function clearFieldError(fieldName) {
  const input = document.getElementById(fieldName);
  const errorSpan = document.getElementById(`error-${fieldName}`);
  if (input) input.classList.remove("input-error");
  if (errorSpan) errorSpan.textContent = "";
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

answerInput.addEventListener("blur", () => {
  const error = validate("answer", answerInput.value);
  if (error && isAiQuestionGenerated) {
    showFieldError("answer", error);
  } else {
    clearFieldError("answer");
  }
});

answerInput.addEventListener("input", () => clearFieldError("answer"));

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

  // Validate initial fields
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

  // STEP 1: Generate AI Question
  if (!isAiQuestionGenerated) {
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;
    btnText.textContent = "Processing...";

    try {
      const response = await fetch("http://localhost:3000/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          city: formData.city,
          complaint: formData.complaint
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        currentAiQuestion = result.question;
        aiQuestionText.textContent = currentAiQuestion;
        aiSection.classList.remove("hidden");
        isAiQuestionGenerated = true;
        btnText.textContent = "Finalize Submission";

        // Scroll to AI section
        aiSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        answerInput.focus();
      } else {
        showToast(errorToast, result.message || "AI failed to generate a question. Try again.");
      }
    } catch (err) {
      console.error("Network error:", err);
      showToast(errorToast, "Cannot connect to server. Is the backend running?");
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
      if (!isAiQuestionGenerated) btnText.textContent = "Submit Complaint";
    }
    return;
  }

  // STEP 2: Final Submission
  const userAnswer = answerInput.value;
  const answerError = validate("answer", userAnswer);

  if (answerError) {
    showFieldError("answer", answerError);
    return;
  }

  submitBtn.classList.add("loading");
  submitBtn.disabled = true;
  btnText.textContent = "Submitting...";

  try {
    const finalData = {
      ...formData,
      aiQuestion: currentAiQuestion,
      userAnswer: userAnswer.trim()
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showToast(successToast, "Complaint submitted successfully!");
      form.reset();
      aiSection.classList.add("hidden");
      isAiQuestionGenerated = false;
      currentAiQuestion = "";
      btnText.textContent = "Submit Complaint";
    } else {
      showToast(errorToast, result.message || "Submission failed. Please try again.");
    }
  } catch (err) {
    console.error("Network error:", err);
    showToast(errorToast, "Cannot connect to server.");
  } finally {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
    if (isAiQuestionGenerated) btnText.textContent = "Finalize Submission";
  }
});
