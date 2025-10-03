import express from "express";

const app = express();
const PORT = process.env.PORT || 5000;

// Simple API route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
