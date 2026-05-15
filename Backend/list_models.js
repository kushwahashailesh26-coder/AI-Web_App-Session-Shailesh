require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function list() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // In newer versions of the SDK, you might need to use a different way to list models
    // but let's try the direct fetch to the models endpoint.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Models available:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error listing models:", e);
  }
}

list();
