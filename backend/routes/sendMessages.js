import express from "express";
import { chatHelper, summarizeURL } from "../utils/OpenAiHelpers.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const userInput = req.body.userInput;
    const message = { role: "user", content: userInput };
    const result = await chatHelper(message);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Error processing request" });
  }
});

// Route for summarizing a URL
router.post("/summarize", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    
    const result = await summarizeURL(url);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error summarizing URL:", error);
    res.status(500).json({ error: "Error summarizing URL", message: error.message });
  }
});

// Route for searching the latest events
router.post("/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    const result = await searchLatestEvents(query);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error searching for events:", error);
    res.status(500).json({ error: "Error searching for events", message: error.message });
  }
});

export default router;