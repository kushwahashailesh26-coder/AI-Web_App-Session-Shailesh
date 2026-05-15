require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function list() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyAv0-9kzBQvy8eHWU4bhwYwRJeWsIU1Slc");
  try {
     // Note: listModels is not on the genAI object directly in some versions, 
     // but we can try to fetch the models list via the v1 endpoint.
     // However, let's just try several model names.
     const names = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.5-flash-latest"];
     for (const name of names) {
       console.log(`Testing ${name}...`);
       try {
         const model = genAI.getGenerativeModel({ model: name });
         const result = await model.generateContent("Hi");
         console.log(`✅ ${name} works!`);
         return;
       } catch (e) {
         console.log(`❌ ${name} failed: ${e.message}`);
       }
     }
  } catch (e) {
    console.error("Critical Error:", e);
  }
}

list();
