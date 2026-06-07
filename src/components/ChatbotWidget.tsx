import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, ShoppingCart, Check } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { isTextUIPart } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RecipeItem {
  product_id: number;  // -1 = not in store
  name: string;
  cooking_amount: string;
  quantity: number;    // 0 = out of stock (when product_id >= 0) or N/A (when product_id == -1)
}

interface PendingProposal {
  items: RecipeItem[];
  steps: string[];
  isRecipe: boolean;
}

type AgentDataChunk =
  | { type: "step"; text: string }
  | { type: "action"; action: "none" }
  | {
      type: "action";
      action: "propose";
      recipe_items: RecipeItem[];
      steps: string[];
      is_recipe: boolean;
    };

interface ChatbotWidgetProps {
  onAddBatchToCart: (items: RecipeItem[]) => Promise<{ product_id: number; quantity: number; success: boolean }[]>;
}

const itemStatus = (item: RecipeItem) => {
  if (item.product_id >= 0 && item.quantity > 0) return "available";
  if (item.product_id >= 0 && item.quantity === 0) return "out_of_stock";
  return "unavailable";
};

const ChatbotWidget = ({ onAddBatchToCart }: ChatbotWidgetProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState("");
  const [proposal, setProposal] = useState<PendingProposal | null>(null);
  const [batchStatus, setBatchStatus] = useState<"idle" | "loading" | "done">("idle");
  const latestStepRef = useRef<string | undefined>(undefined);

  const { messages, sendMessage, status } = useChat({
    onData(dataPart) {
      const chunk = dataPart.data as unknown as AgentDataChunk;
      if (chunk.type === "step") {
        latestStepRef.current = chunk.text;
      } else if (chunk.type === "action" && chunk.action === "propose") {
        setProposal({
          items: chunk.recipe_items ?? [],
          steps: chunk.steps ?? [],
          isRecipe: chunk.is_recipe ?? false,
        });
        setBatchStatus("idle");
      }
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, proposal]);

  const isStreaming = status === "streaming" || status === "submitted";

  const addableItems = proposal?.items.filter(i => itemStatus(i) === "available") ?? [];

  const handleConfirm = async () => {
    if (!proposal) return;
    setBatchStatus("loading");
    await onAddBatchToCart(addableItems);
    setBatchStatus("done");
  };

  const handleDecline = () => { setProposal(null); setBatchStatus("idle"); };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setProposal(null);
    setBatchStatus("idle");
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 w-96 rounded-xl border bg-card shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200 flex flex-col" style={{ height: "520px" }}>
          {/* Header */}
          <div className="bg-primary p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-primary-foreground">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">FreshMart Assistant</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary/80" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {messages.length === 0 && (
              <div className="text-center mt-6 space-y-2">
                <p className="text-muted-foreground text-xs">Hi! Ask me to find products, add them to your cart, or suggest a recipe.</p>
                <p className="text-xs text-muted-foreground/60 italic">e.g. Ask for a tomato pasta recipe</p>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {m.parts.filter(isTextUIPart).map((p, i) => <span key={i}>{p.text}</span>)}
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2 text-muted-foreground text-xs">
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  <span>{latestStepRef.current ?? "Thinking..."}</span>
                </div>
              </div>
            )}

            {/* Proposal card */}
            {proposal && !isStreaming && (
              <div className="rounded-lg border bg-background p-3 space-y-3">

                {/* Ingredient list */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    {proposal.isRecipe ? "Ingredients" : "Found in store"}
                  </p>
                  <ul className="space-y-1">
                    {proposal.items.map((item, idx) => {
                      const status = itemStatus(item);
                      return (
                        <li key={`${item.product_id}-${idx}`} className="flex items-center gap-2 text-xs">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${
                            status === "available"    ? "bg-green-500"  :
                            status === "out_of_stock" ? "bg-yellow-400" : "bg-red-400"
                          }`} />
                          <span className={`font-medium ${
                            status === "available"    ? "text-green-700"             :
                            status === "out_of_stock" ? "text-yellow-600"            :
                                                        "text-red-500 line-through"
                          }`}>{item.name}</span>
                          {proposal.isRecipe && item.cooking_amount && status === "available" && (
                            <span className="text-muted-foreground">— {item.cooking_amount}</span>
                          )}
                          <span className="text-muted-foreground ml-auto">
                            {status === "available"    ? `×${item.quantity}`  :
                             status === "out_of_stock" ? "out of stock"       : "not available"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Preparation steps */}
                {proposal.isRecipe && proposal.steps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Preparation</p>
                    <ol className="space-y-1">
                      {proposal.steps.map((step, i) => (
                        <li key={i} className="text-xs flex gap-2">
                          <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Actions */}
                {batchStatus === "done" ? (
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <Check className="h-3 w-3" />
                    Added to cart!
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={handleConfirm}
                      disabled={batchStatus === "loading" || addableItems.length === 0}
                    >
                      {batchStatus === "loading" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add {addableItems.length} item{addableItems.length !== 1 ? "s" : ""} to cart
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={handleDecline} disabled={batchStatus === "loading"}>
                      No thanks
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t p-3 flex gap-2 shrink-0">
            <Input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products or recipes..."
              disabled={isStreaming}
              className="text-sm"
            />
            <Button size="icon" type="submit" disabled={isStreaming || !input.trim()}>
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}

      <Button onClick={() => setIsOpen((v) => !v)} size="icon" className="h-14 w-14 rounded-full shadow-lg">
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
};

export default ChatbotWidget;
