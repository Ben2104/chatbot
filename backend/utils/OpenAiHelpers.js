import OpenAI from "openai";
import { config } from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";
config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatHelper(message, model = "gpt-4", systemConfiguration = "You are a helpful assistant.", messageHistory = []) {
  const completion = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: systemConfiguration },
      ...messageHistory,
      message,
    ],
  });

  // Return a simplified object.
  return { role: "assistant", content: completion.choices[0].message.content };
}

// Function to extract and clean text content from a webpage

async function extractTextFromURL(url) {
  try {
    // Add browser-like headers to avoid being blocked
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.google.com/'
    };

    const response = await axios.get(url, {
      headers,
      // Add longer timeout for international sites
      timeout: 10000,
      // Handle redirects automatically
      maxRedirects: 5
    });
    
    // Make sure we're handling the encoding correctly
    const $ = cheerio.load(response.data, { decodeEntities: true });
    
    // Remove script and style elements
    $('script, style, nav, footer, header, .ads, .banner, .comments').remove();
    
    // Extract text from the main content areas with Vietnamese news sources in mind
    let text = '';
    
    // Try to find the main content container (common patterns in news sites)
    const contentSelectors = [
      'article', 
      'main', 
      '.content', 
      '.post', 
      '.article-content', 
      '.article-body',
      '.article',
      '.detail-content', // Common in Vietnamese news sites
      '.news-detail',    // Common in Vietnamese news sites
      '.detail__content' // Specific to VnExpress
    ];
    
    // Prioritize finding main content containers
    let foundMainContent = false;
    for (const selector of contentSelectors) {
      if ($(selector).length > 0) {
        $(selector).each((_, element) => {
          const elementText = $(element).text().trim();
          if (elementText) {
            text += elementText + '\n\n';
            foundMainContent = true;
          }
        });
        
        // If we found content with this selector, stop searching
        if (foundMainContent) break;
      }
    }
    
    // If no main content was found, get paragraph text
    if (!foundMainContent) {
      $('p').each((_, element) => {
        const elementText = $(element).text().trim();
        if (elementText && elementText.length > 30) { // Only include substantial paragraphs
          text += elementText + '\n\n';
        }
      });
    }
    
    // If still no content, get the body text as fallback
    if (!text.trim()) {
      text = $('body').text().trim();
    }
    
    // Clean up the text (remove excessive whitespace, etc.)
    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error("Error extracting text from URL:", error);
    
    // Provide more detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      throw new Error(`Failed to extract content: Server responded with status ${error.response.status}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error("Failed to extract content: No response received from the server");
    } else {
      // Something happened in setting up the request
      throw new Error(`Failed to extract content: ${error.message}`);
    }
  }
}

// Function to summarize a URL
// Alternative implementation using a web scraping service API
// Add this as a fallback in the summarizeURL function:

// Modify the summarizeURL function to use a more reliable approach for Vietnamese news sites

export async function summarizeURL(url, model = "gpt-4") {
  try {
    // Special handling for VnExpress and Vietnamese news sites
    if (url.includes('vnexpress.net') || url.includes('.vn/')) {
      console.log("Using Vietnamese news site handling for:", url);
      
      // For Vietnamese news sites, we'll use a more direct approach
      // Ask OpenAI to generate a summary based on the URL without extraction
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { 
            role: "system", 
            content: "You are a helpful assistant that can analyze and summarize news articles based on their URLs. You specialize in Vietnamese language content." 
          },
          { 
            role: "user", 
            content: `I'd like a summary of this news article: ${url}. The article is from VnExpress or another Vietnamese news site. Please provide a comprehensive summary based on the URL, discussing what this article likely contains.` 
          },
        ],
      });

      return { 
        role: "assistant", 
        content: completion.choices[0].message.content + "\n\n*(Note: This summary is based on the URL pattern and typical content structure of this news source. For the full article details, please visit the link directly.)*",
        sourceUrl: url 
      };
    }
    
    // For non-Vietnamese sites, try the direct extraction method first
    try {
      const textContent = await extractTextFromURL(url);
      
      // Continue with truncating and summarizing
      const maxLength = 15000;
      const truncatedContent = textContent.length > maxLength 
        ? textContent.substring(0, maxLength) + "..." 
        : textContent;
      
      // Summarize the content using OpenAI
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { 
            role: "system", 
            content: "You are a helpful assistant that summarizes web content concisely and accurately. Focus on the main points and key information." 
          },
          { 
            role: "user", 
            content: `Please summarize the following content from ${url}:\n\n${truncatedContent}` 
          },
        ],
      });

      return { 
        role: "assistant", 
        content: completion.choices[0].message.content,
        sourceUrl: url 
      };
    } catch (extractError) {
      console.log("Direct extraction failed, using general summary approach:", extractError.message);
      
      // If we can't extract the text directly, use OpenAI to provide a general summary
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { 
            role: "system", 
            content: "You are a helpful assistant that can analyze web content based on URLs." 
          },
          { 
            role: "user", 
            content: `I need information about this URL: ${url}. Please provide a summary of what you think this page might contain based on the URL structure and your knowledge.` 
          },
        ],
      });

      return { 
        role: "assistant", 
        content: completion.choices[0].message.content + "\n\n*(Note: This is a general summary as I couldn't access the specific content directly. For the full article, please visit the URL.)*",
        sourceUrl: url 
      };
    }
  } catch (error) {
    console.error("Error summarizing URL:", error);
    throw new Error(`Failed to summarize the provided URL: ${error.message}`);
  }
}
