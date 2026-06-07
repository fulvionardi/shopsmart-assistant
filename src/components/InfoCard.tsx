import { useState } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const bullets = [
  {
    text: "Built and maintained by Fulvio Nardi",
  },
  {
    text: "A virtual grocery store with an AI-powered chatbot. Describe what you need and it builds your cart for you.",
  },
  {
    text: 'Ask for any recipe (e.g. "give me a tomato pasta recipe") and get a step-by-step guide with exact quantities, timing, and one-click cart filling for all available ingredients.',
  },
  {
    text: (
      <>
        Source code and documentation on{" "}
        <a
          href="https://github.com/fulvionardi/shopsmart-assistant"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-primary hover:opacity-80"
        >
          GitHub
        </a>
        .
      </>
    ),
  },
  {
    text: "Stack: Turso (database), Vercel (frontend), Render (backend), Qwen 2.5-7B-Instruct (AI agent)",
  },
];

const InfoCard = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="fixed bottom-5 left-5 z-50">
      {isOpen && (
        <div className="mb-3 w-80 rounded-xl border bg-card shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="bg-primary p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-foreground">
              <Info className="h-5 w-5" />
              <span className="font-semibold">About FreshMart</span>
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

          <ul className="p-4 space-y-3">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-2 text-xs text-foreground leading-relaxed">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button
        onClick={() => setIsOpen((v) => !v)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Info className="h-6 w-6" />}
      </Button>
    </div>
  );
};

export default InfoCard;
