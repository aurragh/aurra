import { useState, useRef, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Send, Volume2, VolumeX, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAurraTTS } from "@/hooks/useAurraTTS";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "What to wear to a board meeting?",
  "Best colors for my palette?",
  "Help me dress for travel",
];

function NovaOrbDot({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      {speaking && <div className="absolute w-8 h-8 rounded-full bg-purple-500/30 animate-ping" />}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold z-10"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          boxShadow: speaking ? "0 0 16px rgba(168,85,247,0.7)" : "0 0 6px rgba(168,85,247,0.3)",
        }}
      >
        N
      </div>
    </div>
  );
}

export function NovaDrawer() {
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tts = useAurraTTS();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    if (open && messages.length === 0 && user) {
      const welcome = "I'm NOVA. Ask me anything about what to wear.";
      setMessages([{ role: "assistant", content: welcome }]);
      setTimeout(() => speak(welcome), 400);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, user]);

  const speak = useCallback(
    (text: string) => {
      tts.cancel();
      tts.speak(text, {
        muted: isMuted,
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
      });
    },
    [tts, isMuted],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;
      const userMsg: Message = { role: "user", content: trimmed };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setInput("");
      setIsThinking(true);

      try {
        const res = await apiRequest("POST", "/api/nova/chat", {
          message: trimmed,
          history: updated.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        });
        const data = await res.json();
        const reply: Message = { role: "assistant", content: data.reply || "I'm not sure — try again." };
        setMessages((prev) => [...prev, reply]);
        speak(reply.content);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I'm unavailable right now. Try again in a moment." },
        ]);
      } finally {
        setIsThinking(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [messages, isThinking, speak],
  );

  // Hide the launcher entirely until user is authenticated
  if (isLoading || !user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Chat with NOVA"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-white text-sm font-semibold shadow-2xl transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            boxShadow: "0 8px 32px rgba(124,58,237,0.4), 0 0 24px rgba(168,85,247,0.2)",
          }}
        >
          <MessageCircle className="w-4 h-4" />
          Chat with NOVA
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 border-l flex flex-col"
        style={{
          background: "linear-gradient(180deg, #15101e 0%, #0F0E14 100%)",
          borderColor: "rgba(168,85,247,0.15)",
        }}
      >
        <SheetHeader className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NovaOrbDot speaking={speaking} />
              <div className="text-left">
                <SheetTitle className="text-white text-sm font-semibold leading-none m-0">NOVA</SheetTitle>
                <p className="text-purple-400/70 text-[11px] mt-1">
                  {isThinking ? "Thinking…" : speaking ? "Speaking…" : "Chat Stylist"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsMuted((v) => !v);
                  if (!isMuted) tts.cancel();
                }}
                className="p-2 rounded-full hover:bg-white/5"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
              </button>
              <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-white/5" aria-label="Close">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={{
                  background:
                    m.role === "user"
                      ? "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(168,85,247,0.18))"
                      : "rgba(255,255,255,0.04)",
                  border: m.role === "user" ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  color: m.role === "user" ? "#F5F3FF" : "#E5E7EB",
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start gap-1.5 pl-1">
              <div className="thinking-dot" />
              <div className="thinking-dot" />
              <div className="thinking-dot" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Starter prompts (only show when fresh) */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 rounded-full border text-gray-300 hover:text-white hover:border-purple-400/40 transition"
                style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div
            className="flex items-center gap-2 rounded-2xl px-3 py-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask NOVA…"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              disabled={isThinking}
            />
            <button
              onClick={() => send(input)}
              disabled={isThinking || !input.trim()}
              className="p-2 rounded-xl text-white disabled:opacity-40 transition"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              aria-label="Send"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <style>{`
          .thinking-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(168,85,247,0.6); animation: thinkingPulse 1s ease-in-out infinite; }
          .thinking-dot:nth-child(2) { animation-delay: 0.15s; }
          .thinking-dot:nth-child(3) { animation-delay: 0.3s; }
          @keyframes thinkingPulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        `}</style>
      </SheetContent>
    </Sheet>
  );
}
