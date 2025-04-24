import { Send } from "lucide-react";

export function InputBox({ input, setInput, onSend, placeholder = "Type your message..." }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4">
      <div className="relative">
        <textarea
          className="w-full p-4 bg-gray-50 rounded-lg shadow-sm resize-none focus:outline-none"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
        />
        <button
          onClick={onSend}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-500 hover:text-blue-600"
        >
          <Send size={24} />
        </button>
      </div>
    </div>
  );
}