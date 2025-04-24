import { useState, useRef, useEffect } from "react";
import { InputBox } from "../components/InputBox";
import { ChatBubble } from "../components/ChatBubble";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { Banner } from "../components/Banner";

export function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // Each message: { role, content }
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  useEffect(() => {
    if (messages.length > 0) {
      setShowBanner(false);
    }
  }, [messages]);

  const parseAndHandleInput = async (trimmedInput) => {
    // Check if it's a summarize URL command (starts with /summarize or /sum)
    if (trimmedInput.match(/^\/sum(marize)?\s+https?:\/\/.+/i)) {
      const url = trimmedInput.replace(/^\/sum(marize)?\s+/i, '').trim();
      return handleSummarizeURL(url);
    } 
    // Check if it's a search command (starts with /search)
    else if (trimmedInput.match(/^\/search\s+.+/i)) {
      const query = trimmedInput.replace(/^\/search\s+/i, '').trim();
      return handleSearch(query);
    } 
    // Regular chat message
    else {
      return handleRegularChat(trimmedInput);
    }
  };

  const handleRegularChat = async (trimmedInput) => {
    try {
      const res = await fetch("http://localhost:8000/sendText", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: trimmedInput }),
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error sending message:", error);
      return { 
        role: "assistant", 
        content: "An error occurred while sending your message." 
      };
    }
  };

  const handleSummarizeURL = async (url) => {
    try {
      const res = await fetch("http://localhost:8000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      return {
        role: "assistant",
        content: `**Summary of [${url}](${url})**\n\n${data.content}`
      };
    } catch (error) {
      console.error("Error summarizing URL:", error);
      return { 
        role: "assistant", 
        content: `Failed to summarize the URL: ${url}. Please check if the URL is valid and try again.` 
      };
    }
  };

  const handleSearch = async (query) => {
    try {
      const res = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      
      if (data.searchResults) {
        const resultsMarkdown = data.searchResults.map(result => 
          `### [${result.title}](${result.url})\n**Source:** ${result.source} | **Published:** ${result.publishedAt}\n\n${result.description}`
        ).join('\n\n---\n\n');
        
        return {
          role: "assistant",
          content: `**Search Results for "${query}"**\n\n${resultsMarkdown}\n\n**Analysis:**\n${data.content}`
        };
      } else {
        return {
          role: "assistant",
          content: data.content
        };
      }
    } catch (error) {
      console.error("Error searching:", error);
      return { 
        role: "assistant", 
        content: `Failed to search for "${query}". Please try again later.` 
      };
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
  
    if (showBanner) setShowBanner(false);
  
    const userMessage = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
  
    try {
      // Parse the input and handle accordingly
      const response = await parseAndHandleInput(trimmed);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error("Error processing message:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "An error occurred while processing your message." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {showBanner && (
          <Banner 
            title="Chat Interaction" 
            description={`Interact with the AI in real-time. Simply type your message and receive an immediate response.
            
Special commands:
- /summarize [url] - Summarize content from a URL
- /search [query] - Search for the latest information on a topic`}
          />
        )}
  
        {messages.map((msg, index) => (
          <ChatBubble key={index} {...msg} />
        ))}
  
        {loading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>
  
      <InputBox
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        placeholder="Type your message, or use /summarize [url]"
      />
    </div>
  );
}