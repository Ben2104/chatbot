import ReactMarkdown from "react-markdown";
import { MessageSquare } from "lucide-react";

export function ChatBubble({ role, content }) {
  const isAssistant = role === "assistant";
  return (
    <div className={`flex max-w-2xl p-4 rounded-lg shadow ${isAssistant ? "bg-white text-gray-800 self-start" : "bg-blue-600 text-white self-end flex-row-reverse"}`}>
      {isAssistant && <MessageSquare size={20} className="mr-3 mt-1" />}
      <div className="whitespace-pre-wrap">
        {isAssistant ? <ReactMarkdown>{content}</ReactMarkdown> : <span>{content}</span>}
      </div>
    </div>
  );
}