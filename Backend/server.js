const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory store for complaints (dummy database)
const complaints = [];

// POST /api/complaints — Submit a new complaint
app.post("/api/complaints", (req, res) => {
  const { name, city, mobile, complaint } = req.body;

  // Basic validation
  if (!name || !city || !mobile || !complaint) {
    return res.status(400).json({
      success: false,
      message: "All fields are required (name, city, mobile, complaint).",
    });
  }

  const newComplaint = {
    id: complaints.length + 1,
    name,
    city,
    mobile,
    complaint,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  complaints.push(newComplaint);

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
  const { status } = req.body;

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
  complaint.updatedAt = new Date().toISOString();

  console.log(`📝 Complaint #${id} status changed to "${status}"`);

  res.json({
    success: true,
    message: `Complaint #${id} marked as ${status}.`,
    data: complaint,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
});
