// require('node-fetch') is not needed for this standalone test.
// Actually, let's just use the server code logic inside a standalone script since I already have @google/generative-ai installed.

require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function debug() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: "v1" });

  const name = "Debug User";
  const city = "Mumbai";
  const complaint = "The street lights are broken and it's dangerous at night.";

  const prompt = `You are a professional assistant for a city complaint portal. 
    A citizen named ${name} from ${city} has submitted the following complaint:
    "${complaint}"
    
    Ask exactly one specific, polite, and helpful follow-up question to clarify the issue or gather more relevant details. 
    Do not include any other text or greetings. Just the question.`;

  try {
    console.log("Generating content...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log("Response Text:", response.text());
  } catch (error) {
    console.error("DEBUG ERROR:", error);
  }
}

debug();
