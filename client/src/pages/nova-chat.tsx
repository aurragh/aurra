import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Send, Volume2, VolumeX } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "What to wear to a board meeting?",
  "What suits my presence style?",
  "Best colors for my palette?",
  "Help me dress for travel",
];

function NovaOrbSmall({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-10 h-10 flex-shrink-0">
      {speaking && (
        <div className="absolute w-10 h-10 rounded-full bg-purple-500/25 animate-ping" />
      )}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold z-10"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          boxShadow: speaking
            ? "0 0 16px rgba(168,85,247,0.7)"
            : "0 0 8px rgba(168,85,247,0.3)",
          animation: "novaOrbChat 3s ease-in-out infinite",
        }}
      >
        N
      </div>
    </div>
  );
}

export default function NovaChat() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [novaSpeaking, setNovaSpeaking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [user, isLoading]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Speak NOVA reply
  const speakReply = useCallback(
    (text: string) => {
      if (!window.speechSynthesis || isMuted) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.name.includes("Samantha") ||
          v.name.includes("Victoria") ||
          v.name.includes("Google UK English Female") ||
          (v.lang === "en-US" && v.name.toLowerCase().includes("female"))
      );
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setNovaSpeaking(true);
      utterance.onend = () => setNovaSpeaking(false);
      utterance.onerror = () => setNovaSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [isMuted]
  );

  const searchString = useSearch();
  const remixSentRef = useRef(false);

  // Welcome message
  useEffect(() => {
    if (!isLoading && user) {
      const welcome = "I'm NOVA. Ask me anything about what to wear.";
      setMessages([{ role: "assistant", content: welcome }]);
      setTimeout(() => speakReply(welcome), 600);
    }
  }, [isLoading, user]);

  // Remix auto-send — fires once after welcome is set
  useEffect(() => {
    if (remixSentRef.current || messages.length === 0) return;
    const params = new URLSearchParams(searchString);
    const look = params.get("look");
    if (!look) return;
    remixSentRef.current = true;
    const remixMsg = `I love this look: "${decodeURIComponent(look)}". Can you show me 3 variations — one casual, one elevated, and one for the weekend?`;
    setTimeout(() => sendMessage(remixMsg), 400);
  }, [messages.length]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      const userMsg: Message = { role: "user", content: trimmed };
      const updatedHistory = [...messages, userMsg];
      setMessages(updatedHistory);
      setInput("");
      setIsThinking(true);

      try {
        const res = await apiRequest("POST", "/api/nova/chat", {
          message: trimmed,
          history: updatedHistory.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });
        const data = await res.json();
        const reply: Message = { role: "assistant", content: data.reply || "I'm not sure — try again." };
        setMessages((prev) => [...prev, reply]);
        speakReply(reply.content);
      } catch (err) {
        const errorMsg: Message = {
          role: "assistant",
          content: "I'm unavailable right now. Try again in a moment.",
        };
        setMessages((prev) => [...prev, errorMsg]);
        toast({ title: "Connection error", description: "NOVA couldn't respond.", variant: "destructive" });
      } finally {
        setIsThinking(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [messages, isThinking, speakReply, toast]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0812" }}>
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes novaOrbChat { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .msg-in { animation: fadeUp 0.3s ease forwards; }
        .thinking-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(168,85,247,0.7); animation: thinkingPulse 1s ease-in-out infinite; }
        .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes thinkingPulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
      `}</style>

      <div
        className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(160deg, #0d0812 0%, #130d1a 60%, #0d0812 100%)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
          style={{
            background: "rgba(13,8,18,0.92)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(168,85,247,0.1)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/dashboard")}
              className="p-2 rounded-full hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <NovaOrbSmall speaking={novaSpeaking} />
            <div>
              <p className="text-white font-semibold text-sm">NOVA</p>
              <p className="text-purple-400/60 text-xs">
                {isThinking ? "Thinking..." : novaSpeaking ? "Speaking..." : "Chat Stylist"}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsMuted((v) => !v);
              if (!isMuted) window.speechSynthesis?.cancel();
            }}
            className="p-2 rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {isMuted
              ? <VolumeX className="w-4 h-4 text-gray-500" />
              : <Volume2 className="w-4 h-4 text-purple-400" />}
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-32 max-w-lg mx-auto w-full">
          {/* Starter prompts — show when only the welcome message exists */}
          {messages.length <= 1 && (
            <div className="mb-6 msg-in">
              <p className="text-gray-500 text-xs mb-3 text-center">Suggested questions</p>
              <div className="grid grid-cols-2 gap-2">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-left px-3 py-2.5 rounded-xl text-xs transition-all hover:border-purple-400/40 hover:bg-purple-500/5"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#c4b5fd",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex mb-4 msg-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-2 mt-0.5"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                >
                  N
                </div>
              )}
              <div
                className="max-w-xs px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={
                  msg.role === "assistant"
                    ? {
                        background: "rgba(139,92,246,0.09)",
                        border: "1px solid rgba(139,92,246,0.15)",
                        color: "#e2d9f3",
                        borderTopLeftRadius: "4px",
                      }
                    : {
                        background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(168,85,247,0.2))",
                        border: "1px solid rgba(168,85,247,0.3)",
                        color: "#e2d9f3",
                        borderTopRightRadius: "4px",
                      }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex items-start gap-2 mb-4 msg-in">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                N
              </div>
              <div
                className="px-4 py-3 rounded-2xl"
                style={{
                  background: "rgba(139,92,246,0.09)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  borderTopLeftRadius: "4px",
                }}
              >
                <div className="flex gap-1.5 items-center h-4">
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input bar */}
        <div
          className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3 z-20"
          style={{ background: "linear-gradient(to top, rgba(13,8,18,1) 70%, transparent)" }}
        >
          <div className="max-w-lg mx-auto">
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(168,85,247,0.2)",
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask NOVA anything..."
                className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
                disabled={isThinking}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isThinking}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{
                  background:
                    input.trim() && !isThinking
                      ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                      : "rgba(255,255,255,0.05)",
                  opacity: input.trim() && !isThinking ? 1 : 0.4,
                }}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
