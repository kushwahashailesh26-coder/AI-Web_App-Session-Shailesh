require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "complaints.json");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: "v1" });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../Frontend")));

// In-memory store (initialized from file)
let complaints = [];

// Helper to load data
const loadData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8");
      complaints = JSON.parse(data);
      console.log("📂 Complaints loaded from file.");
    } else {
      complaints = [];
      saveData(); // Create empty file
    }
  } catch (err) {
    console.error("❌ Error loading data:", err);
    complaints = [];
  }
};

// Helper to save data
const saveData = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(complaints, null, 2), "utf8");
    console.log("💾 Complaints saved to file.");
  } catch (err) {
    console.error("❌ Error saving data:", err);
  }
};

// Initial load
loadData();

/**
 * POST /api/generate-question
 * Generates a follow-up question based on the complaint details.
 */
app.post("/api/generate-question", async (req, res) => {
  const { name, city, complaint } = req.body;

  if (!complaint) {
    return res.status(400).json({ success: false, message: "Complaint text is required." });
  }

  try {
    const prompt = `You are a professional assistant for a city complaint portal. 
    A citizen named ${name} from ${city} has submitted the following complaint:
    "${complaint}"
    
    Ask exactly one specific, polite, and helpful follow-up question to clarify the issue or gather more relevant details. 
    Do not include any other text or greetings. Just the question.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const question = response.text().trim();

    res.json({
      success: true,
      question: question
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate AI question. Please try again later.",
      error: error.message
    });
  }
});

// POST /api/complaints — Submit a new complaint
app.post("/api/complaints", (req, res) => {
  const { name, city, mobile, complaint, aiQuestion, userAnswer } = req.body;

  // Basic validation
  if (!name || !city || !mobile || !complaint) {
    return res.status(400).json({
      success: false,
      message: "All fields are required (name, city, mobile, complaint).",
    });
  }

  const newComplaint = {
    id: complaints.length > 0 ? Math.max(...complaints.map(c => c.id)) + 1 : 1,
    name,
    city,
    mobile,
    complaint,
    aiQuestion: aiQuestion || "N/A",
    userAnswer: userAnswer || "N/A",
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  complaints.push(newComplaint);
  saveData(); // Persist to file

  console.log(`✅ New complaint received from ${name} (${city})`);

  res.status(201).json({
    success: true,
    message: "Complaint submitted successfully!",
    data: newComplaint,
  });
});

// GET /api/complaints — Retrieve all complaints
app.get("/api/complaints", (req, res) => {
  res.json({
    success: true,
    count: complaints.length,
    data: complaints,
  });
});

// PATCH /api/complaints/:id — Update complaint status (Resolve / Reject)
app.patch("/api/complaints/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status, adminComment } = req.body;

  const validStatuses = ["Pending", "Resolved", "Rejected"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  const complaint = complaints.find((c) => c.id === id);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: `Complaint with ID ${id} not found.`,
    });
  }

  complaint.status = status;
  complaint.adminComment = adminComment || "";
  complaint.updatedAt = new Date().toISOString();
  saveData(); // Persist to file

  console.log(`📝 Complaint #${id} status changed to "${status}"`);

  res.json({
    success: true,
    message: `Complaint #${id} marked as ${status}.`,
    data: complaint,
  });
});

// GET /api/complaints/track/:mobile — Track complaints by mobile number
app.get("/api/complaints/track/:mobile", (req, res) => {
  const { mobile } = req.params;
  const userComplaints = complaints.filter(c => c.mobile === mobile);
  
  res.json({
    success: true,
    data: userComplaints
  });
});

// PATCH /api/complaints/:id/concern — Raise a concern for an existing complaint
app.patch("/api/complaints/:id/concern", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { concern } = req.body;

  if (!concern) {
    return res.status(400).json({ success: false, message: "Concern text is required." });
  }

  const complaint = complaints.find((c) => c.id === id);
  if (!complaint) {
    return res.status(404).json({ success: false, message: "Complaint not found." });
  }

  complaint.userConcern = concern;
  complaint.concernRaisedAt = new Date().toISOString();
  saveData();

  res.json({
    success: true,
    message: "Concern raised successfully!",
    data: complaint
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
});
