import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 w-80 rounded-xl border bg-card shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="bg-primary p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-foreground">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">FreshMart Assistant</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary/80" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-72 p-4 flex items-center justify-center text-muted-foreground text-sm text-center">
            <p>👋 Hi there! I'm not functional yet, but I'll be able to help you find products and answer questions soon!</p>
          </div>
          <div className="border-t p-3 flex gap-2">
            <Input placeholder="Type a message..." disabled className="text-sm" />
            <Button size="icon" disabled>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
};

export default ChatbotWidget;
