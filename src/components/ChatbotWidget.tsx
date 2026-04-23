import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { isTextUIPart } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AgentDataChunk =
  | { type: "step"; text: string }
  | { type: "action"; action: "add_to_cart" | "highlight" | "none"; product_id?: number | null; quantity?: number };

interface ChatbotWidgetProps {
  onAgentAction: (action: string, productId: number | null, quantity: number) => void;
}

const ChatbotWidget = ({ onAgentAction }: ChatbotWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const latestStepRef = useRef<string | undefined>(undefined);
  const onAgentActionRef = useRef(onAgentAction);
  onAgentActionRef.current = onAgentAction;

  const { messages, sendMessage, status } = useChat({
    onData(dataPart) {
      const chunk = dataPart.data as unknown as AgentDataChunk;
      if (chunk.type === "step") {
        latestStepRef.current = chunk.text;
      } else if (chunk.type === "action" && chunk.action !== "none") {
        onAgentActionRef.current(chunk.action, chunk.product_id ?? null, chunk.quantity ?? 1);
      }
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isStreaming = status === "streaming" || status === "submitted";
  const latestStep = isStreaming ? latestStepRef.current : undefined;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 w-80 rounded-xl border bg-card shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200 flex flex-col" style={{ height: "420px" }}>
          {/* Header */}
          <div className="bg-primary p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-primary-foreground">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">FreshMart Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary/80"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {messages.length === 0 && (
              <p className="text-muted-foreground text-center mt-6 text-xs">
                Hi! Ask me to find or add products to your cart.
              </p>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.parts.filter(isTextUIPart).map((p, i) => <span key={i}>{p.text}</span>)}
                </div>
              </div>
            ))}

            {/* Agent step indicator while streaming */}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2 text-muted-foreground text-xs">
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  <span>{latestStep ?? "Thinking..."}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;
              sendMessage({ text: input });
              setInput("");
            }}
            className="border-t p-3 flex gap-2 shrink-0"
          >
            <Input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products..."
              disabled={isStreaming}
              className="text-sm"
            />
            <Button size="icon" type="submit" disabled={isStreaming || !input.trim()}>
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}

      <Button
        onClick={() => setIsOpen((v) => !v)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
};

export default ChatbotWidget;
