import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { Mic, MicOff, Volume2, VolumeX, ChevronRight, RotateCcw, Check } from "lucide-react";
import { type StyleProfile } from "@shared/schema";

// ─── Question Data ────────────────────────────────────────────────────────────

const PHASES = [
  { id: 1, name: "Who You Are" },
  { id: 2, name: "How You Show Up" },
  { id: 3, name: "The Decision" },
];

interface Option {
  value: string;
  label: string;
  desc?: string;
}

interface Question {
  id: string;
  phase: number;
  novaText: string;
  type: "single" | "multi";
  options: Option[];
  field: string;
  subfield?: string;
}

const QUESTIONS: Question[] = [
  {
    id: "identityWord",
    phase: 1,
    novaText: "When you walk into a room feeling completely yourself — what one word describes that version of you?",
    type: "single",
    options: [
      { value: "Powerful", label: "Powerful", desc: "You own the space" },
      { value: "Warm", label: "Warm", desc: "People feel at ease with you" },
      { value: "Sharp", label: "Sharp", desc: "Every detail is intentional" },
      { value: "Quiet", label: "Quiet", desc: "Your presence speaks without noise" },
      { value: "Bold", label: "Bold", desc: "You're impossible to miss" },
      { value: "Grounded", label: "Grounded", desc: "You're the steady force" },
    ],
    field: "identityWord",
  },
  {
    id: "dressingRelationship",
    phase: 1,
    novaText: "What's your honest relationship with getting dressed in the morning?",
    type: "single",
    options: [
      { value: "Strategy", label: "It's strategy", desc: "I dress for the outcome I want" },
      { value: "Ritual", label: "It's a ritual", desc: "It sets the tone for my day" },
      { value: "Stress", label: "It's stress", desc: "I never know if I've got it right" },
      { value: "Expression", label: "It's expression", desc: "I use it to show who I am" },
      { value: "Necessity", label: "It's just necessity", desc: "I just need to not look wrong" },
    ],
    field: "dressingRelationship",
  },
  {
    id: "impressionGoals",
    phase: 1,
    novaText: "What do you most want people to feel when they first encounter you? Pick all that apply.",
    type: "multi",
    options: [
      { value: "Trust", label: "Trust" },
      { value: "Respect", label: "Respect" },
      { value: "Ease", label: "Ease" },
      { value: "Curiosity", label: "Curiosity" },
      { value: "Authority", label: "Authority" },
      { value: "Warmth", label: "Warmth" },
    ],
    field: "impressionGoals",
  },
  {
    id: "confidenceTrigger",
    phase: 1,
    novaText: "When you feel most confident, what are you typically wearing?",
    type: "single",
    options: [
      { value: "Dark tones", label: "Dark tones", desc: "Black, navy, charcoal" },
      { value: "Structured pieces", label: "Structured pieces", desc: "Blazers, tailored fits" },
      { value: "Color", label: "Color", desc: "Something that stands out" },
      { value: "Minimal", label: "Minimal", desc: "Clean, simple, nothing extra" },
      { value: "Inner confidence", label: "Confidence comes from within", desc: "What I wear doesn't change it" },
    ],
    field: "confidenceTrigger",
  },
  {
    id: "presenceArchetype",
    phase: 2,
    novaText: "When you're at your best — which of these is closest to how you show up?",
    type: "single",
    options: [
      { value: "Commands silence", label: "The person who commands silence", desc: "Rooms adjust when you enter" },
      { value: "Draws people in", label: "The person who draws people in", desc: "Magnetic, approachable, trusted" },
      { value: "Reads the room", label: "The person who reads the room", desc: "You observe before you act" },
      { value: "Gets things done", label: "The person who gets things done", desc: "Focus over impression" },
    ],
    field: "presenceArchetype",
  },
  {
    id: "bodyType",
    phase: 2,
    novaText: "Your frame — this helps me recommend silhouettes that work with you, not against you.",
    type: "single",
    options: [
      { value: "slim", label: "Slim / Lean" },
      { value: "athletic", label: "Athletic / Fit" },
      { value: "average", label: "Average / Medium" },
      { value: "broad", label: "Broad / Muscular" },
      { value: "curvy", label: "Curvy / Full" },
      { value: "petite", label: "Petite / Compact" },
      { value: "tall", label: "Tall / Elongated" },
      { value: "prefer_not", label: "Prefer not to say" },
    ],
    field: "bodyType",
  },
  {
    id: "colorPalette",
    phase: 2,
    novaText: "What color palette feels most like you — or what you want to project?",
    type: "single",
    options: [
      { value: "neutral", label: "Neutrals & Earth Tones", desc: "Black, navy, charcoal, camel, olive" },
      { value: "classic", label: "Classic & Structured", desc: "Black, white, navy, burgundy, forest" },
      { value: "warm", label: "Warm & Approachable", desc: "Tan, cream, rust, soft blue, sage" },
      { value: "bold", label: "Bold & Intentional", desc: "Deep red, cobalt, emerald, violet" },
      { value: "minimal", label: "Minimal & Monochrome", desc: "Black, white, gray tones only" },
      { value: "soft", label: "Soft & Understated", desc: "Muted pastels, lavender, dusty rose" },
    ],
    field: "colorPalette",
  },
  {
    id: "industry",
    phase: 2,
    novaText: "What world do you operate in?",
    type: "single",
    options: [
      { value: "Corporate / Finance", label: "Corporate / Finance" },
      { value: "Tech / Startup", label: "Tech / Startup" },
      { value: "Creative / Media", label: "Creative / Media" },
      { value: "Law / Government", label: "Law / Government" },
      { value: "Healthcare", label: "Healthcare" },
      { value: "Education", label: "Education" },
      { value: "Entrepreneurship", label: "Entrepreneurship" },
      { value: "Other", label: "Other" },
    ],
    field: "lifestyle",
    subfield: "industry",
  },
  {
    id: "dailyRoutine",
    phase: 2,
    novaText: "And your typical day looks like...",
    type: "single",
    options: [
      { value: "Mostly office / boardroom", label: "Mostly office / boardroom" },
      { value: "Mix of meetings and field work", label: "Mix — meetings and field work" },
      { value: "Client-facing all day", label: "Client-facing all day" },
      { value: "Remote / flexible", label: "Remote / flexible" },
      { value: "Travel-heavy", label: "Travel-heavy" },
    ],
    field: "lifestyle",
    subfield: "dailyRoutine",
  },
  {
    id: "budget",
    phase: 3,
    novaText: "What's your investment range per piece? There's no wrong answer — this is about what feels right for you.",
    type: "single",
    options: [
      { value: "budget", label: "Under $100", desc: "Smart, accessible choices" },
      { value: "mid", label: "$100 – $300", desc: "Quality mid-range investment" },
      { value: "premium", label: "$300 – $700", desc: "Premium quality" },
      { value: "luxury", label: "$700+", desc: "Luxury and designer level" },
      { value: "mixed", label: "Mixed", desc: "Strategic spending across tiers" },
    ],
    field: "budget",
  },
  {
    id: "occasions",
    phase: 3,
    novaText: "Last one — what are you actually dressing for right now? I'll build your first recommendation around this.",
    type: "multi",
    options: [
      { value: "A room with power (High-stakes meeting)", label: "A room with power", desc: "High-stakes meeting" },
      { value: "A stage or podium (Public speaking)", label: "A stage or podium", desc: "Public speaking" },
      { value: "A first impression (Key meeting)", label: "A first impression", desc: "Key meeting" },
      { value: "Travel (High visibility / unknown)", label: "Visibility travel", desc: "High visibility / unknown" },
      { value: "Daily leadership (The routine that matters)", label: "Daily leadership", desc: "The routine that matters" },
    ],
    field: "occasions",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Answers {
  identityWord: string;
  dressingRelationship: string;
  impressionGoals: string[];
  confidenceTrigger: string;
  presenceArchetype: string;
  bodyType: string;
  colorPalette: string;
  lifestyle: { industry?: string; dailyRoutine?: string };
  budget: string;
  occasions: string[];
}

const defaultAnswers: Answers = {
  identityWord: "",
  dressingRelationship: "",
  impressionGoals: [],
  confidenceTrigger: "",
  presenceArchetype: "",
  bodyType: "",
  colorPalette: "",
  lifestyle: {},
  budget: "",
  occasions: [],
};

// ─── Typewriter Hook ──────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 22, onDone?: () => void) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text]);

  return { displayed, done };
}

// ─── NOVA Orb Component ───────────────────────────────────────────────────────

function NovaOrb({ state }: { state: "idle" | "speaking" | "listening" }) {
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      {state === "listening" && (
        <>
          <div className="absolute w-20 h-20 rounded-full bg-purple-500/20 animate-ping" />
          <div className="absolute w-16 h-16 rounded-full bg-purple-500/20 animate-ping" style={{ animationDelay: "0.2s" }} />
        </>
      )}
      {(state === "speaking" || state === "idle") && (
        <div
          className="absolute w-20 h-20 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
            animation: state === "speaking" ? "novaGlow 0.8s ease-in-out infinite alternate" : "novaGlow 2s ease-in-out infinite alternate",
          }}
        />
      )}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm tracking-widest z-10"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6d28d9 100%)",
          boxShadow: state === "listening"
            ? "0 0 30px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.4)"
            : state === "speaking"
            ? "0 0 20px rgba(168,85,247,0.6), 0 0 40px rgba(168,85,247,0.3)"
            : "0 0 12px rgba(168,85,247,0.4)",
          animation: state !== "idle" ? "novaOrb 1.5s ease-in-out infinite" : "novaOrb 3s ease-in-out infinite",
        }}
      >
        NOVA
      </div>
    </div>
  );
}

// ─── Answer Bubble ────────────────────────────────────────────────────────────

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end mb-4 animate-fadeIn">
      <div
        className="max-w-xs px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm font-medium"
        style={{
          background: "linear-gradient(135deg, #7c3aed22, #a855f722)",
          border: "1px solid rgba(168,85,247,0.3)",
          color: "#e2d9f3",
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ─── Option Card ──────────────────────────────────────────────────────────────

function OptionCard({
  option,
  selected,
  type,
  onClick,
}: {
  option: Option;
  selected: boolean;
  type: "single" | "multi";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center gap-3 group ${
        selected
          ? "border-purple-500 bg-purple-500/10"
          : "border-white/10 bg-white/5 hover:border-purple-500/40 hover:bg-purple-500/5"
      }`}
    >
      <div
        className={`w-5 h-5 flex-shrink-0 flex items-center justify-center transition-all ${
          type === "single" ? "rounded-full" : "rounded-md"
        } border-2 ${selected ? "border-purple-400 bg-purple-400" : "border-white/30 group-hover:border-purple-400/60"}`}
      >
        {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${selected ? "text-purple-200" : "text-gray-200"}`}>
          {option.label}
        </span>
        {option.desc && (
          <p className={`text-xs mt-0.5 ${selected ? "text-purple-300/70" : "text-gray-500"}`}>
            {option.desc}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Phase Badge ──────────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: number }) {
  const p = PHASES.find((x) => x.id === phase);
  if (!p) return null;
  return (
    <div className="flex items-center gap-2 mb-4 animate-fadeIn">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-500/30" />
      <span className="text-xs font-medium tracking-widest text-purple-400/70 uppercase px-3">
        Phase {phase}: {p.name}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-500/30" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StyleQuiz() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ ...defaultAnswers });
  const [isEditing, setIsEditing] = useState(false);
  const [orbState, setOrbState] = useState<"idle" | "speaking" | "listening">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [confirmedAnswers, setConfirmedAnswers] = useState<number[]>([]);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const question = QUESTIONS[currentQ];
  const totalQ = QUESTIONS.length;

  // ── Typewriter for current question
  const { displayed: novaText, done: typingDone } = useTypewriter(
    question.novaText,
    20,
    () => setShowOptions(true)
  );

  // Show options immediately when question changes (also set by typewriter done)
  useEffect(() => {
    setShowOptions(false);
    const t = setTimeout(() => setShowOptions(true), question.novaText.length * 20 + 100);
    return () => clearTimeout(t);
  }, [currentQ]);

  // ── Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentQ, confirmedAnswers]);

  // ── Voice support detection
  useEffect(() => {
    const hasSpeech = "speechSynthesis" in window;
    const hasRec = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    setVoiceSupported(hasSpeech && hasRec);
  }, []);

  // ── Speak NOVA question
  const speakText = useCallback(
    (text: string) => {
      if (!window.speechSynthesis || isMuted) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88;
      utterance.pitch = 1.05;
      utterance.volume = 0.95;

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(
          (v) =>
            v.name.includes("Samantha") ||
            v.name.includes("Victoria") ||
            v.name.includes("Karen") ||
            v.name.includes("Google UK English Female") ||
            (v.lang === "en-US" && v.name.toLowerCase().includes("female"))
        );
        if (preferred) utterance.voice = preferred;
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      utterance.onstart = () => setOrbState("speaking");
      utterance.onend = () => setOrbState("idle");
      utterance.onerror = () => setOrbState("idle");
      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isMuted]
  );

  // ── Speak question when it changes
  useEffect(() => {
    if (!isLoading && user) {
      const delay = setTimeout(() => speakText(question.novaText), 400);
      return () => clearTimeout(delay);
    }
  }, [currentQ, user, isLoading]);

  // ── NOVA intro on load
  useEffect(() => {
    if (!isLoading && user && !isMuted) {
      const delay = setTimeout(() => {
        speakText(
          "Hi, I'm NOVA. I'll help you build your style profile. Let's start with a few questions about you."
        );
      }, 600);
      return () => clearTimeout(delay);
    }
  }, [isLoading, user]);

  // ── Existing profile load
  const { data: existingProfile } = useQuery<StyleProfile>({
    queryKey: ["/api/style-profile"],
    enabled: !!user,
  });

  useEffect(() => {
    if (existingProfile && !isEditing) {
      const personality = JSON.parse(existingProfile.personality || "{}");
      const colorPrefs = JSON.parse(existingProfile.colorPreferences || "[]");
      const occasions = JSON.parse(existingProfile.occasions || "[]");
      const lifestyle = JSON.parse(existingProfile.lifestyle || "{}");
      const intentMoments = personality.intentMoments ? JSON.parse(personality.intentMoments) : [];

      setAnswers({
        identityWord: personality.identityWord || "",
        dressingRelationship: personality.dressingRelationship || "",
        impressionGoals: personality.impressionGoals ? JSON.parse(personality.impressionGoals) : [],
        confidenceTrigger: personality.confidenceTrigger || "",
        presenceArchetype: personality.presenceArchetype || personality.presenceGoal || "",
        bodyType: existingProfile.bodyType || "",
        colorPalette: colorPrefs[0] || "",
        lifestyle,
        budget: existingProfile.budget || "",
        occasions,
      });
      setIsEditing(true);
    }
  }, [existingProfile, isEditing]);

  // ── Save mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      await apiRequest("POST", "/api/style-profile", profileData);
      if (!isEditing && answers.occasions.length > 0) {
        await apiRequest("POST", "/api/generate-outfits", {
          occasion: answers.occasions[0],
          count: 1,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Profile Updated!" : "Profile Saved!",
        description: answers.occasions.length > 0
          ? "Building your first recommendation..."
          : "Your style profile is ready.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/style-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outfits"] });
      setLocation("/dashboard");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
    },
  });

  // ── Get current answer value
  const getCurrentValue = (): string | string[] => {
    const q = question;
    if (q.field === "lifestyle" && q.subfield) {
      return (answers.lifestyle as any)[q.subfield] || "";
    }
    return (answers as any)[q.field] ?? (q.type === "multi" ? [] : "");
  };

  // ── Select an answer
  const selectAnswer = useCallback(
    (value: string) => {
      const q = question;

      if (q.type === "single") {
        if (q.field === "lifestyle" && q.subfield) {
          setAnswers((prev) => ({
            ...prev,
            lifestyle: { ...prev.lifestyle, [q.subfield!]: value },
          }));
        } else {
          setAnswers((prev) => ({ ...prev, [q.field]: value }));
        }

        // Auto-advance after short delay
        if (!autoAdvancing) {
          setAutoAdvancing(true);
          setTimeout(() => {
            setConfirmedAnswers((prev) => [...prev, currentQ]);
            if (currentQ < totalQ - 1) {
              setCurrentQ((prev) => prev + 1);
            }
            setAutoAdvancing(false);
          }, 700);
        }
      } else {
        // Multi-select: toggle
        const current = (answers as any)[q.field] as string[];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        setAnswers((prev) => ({ ...prev, [q.field]: updated }));
      }
    },
    [question, answers, currentQ, totalQ, autoAdvancing]
  );

  // ── Multi-select continue
  const handleMultiContinue = () => {
    setConfirmedAnswers((prev) => [...prev, currentQ]);
    if (currentQ < totalQ - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  // ── Submit
  const handleSubmit = () => {
    window.speechSynthesis?.cancel();
    const personalityData = {
      identityWord: answers.identityWord,
      dressingRelationship: answers.dressingRelationship,
      impressionGoals: JSON.stringify(answers.impressionGoals),
      confidenceTrigger: answers.confidenceTrigger,
      presenceArchetype: answers.presenceArchetype,
      presenceGoal: answers.presenceArchetype,
      intentMoments: JSON.stringify(answers.occasions),
    };
    const profileData = {
      personality: JSON.stringify(personalityData),
      bodyType: answers.bodyType,
      colorPreferences: JSON.stringify([answers.colorPalette].filter(Boolean)),
      stylePreferences: JSON.stringify([answers.presenceArchetype].filter(Boolean)),
      clothingItems: JSON.stringify([]),
      lifestyle: JSON.stringify(answers.lifestyle),
      budget: answers.budget,
      occasions: JSON.stringify(answers.occasions),
      completed: true,
    };
    saveProfileMutation.mutate(profileData);
  };

  // ── Voice: start listening
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    window.speechSynthesis?.cancel();
    setIsListening(true);
    setOrbState("listening");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      const transcripts: string[] = [];
      for (let i = 0; i < event.results[0].length; i++) {
        transcripts.push(event.results[0][i].transcript.toLowerCase());
      }
      handleVoiceMatch(transcripts);
      setIsListening(false);
      setOrbState("idle");
    };

    recognition.onend = () => {
      setIsListening(false);
      setOrbState("idle");
    };

    recognition.onerror = () => {
      setIsListening(false);
      setOrbState("idle");
      toast({ title: "Didn't catch that", description: "Try again or select manually.", variant: "destructive" });
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [question, answers]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setOrbState("idle");
  };

  const handleVoiceMatch = (transcripts: string[]) => {
    const options = question.options;
    for (const transcript of transcripts) {
      const matched = options.find((opt) => {
        const lbl = opt.label.toLowerCase();
        const val = opt.value.toLowerCase();
        return (
          transcript.includes(lbl) ||
          transcript.includes(val) ||
          lbl.split(" ").filter((w) => w.length > 3).some((w) => transcript.includes(w))
        );
      });
      if (matched) {
        selectAnswer(matched.value);
        toast({ title: "Got it", description: matched.label });
        return;
      }
    }
    toast({
      title: "Didn't match",
      description: `I heard: "${transcripts[0]}" — try tapping your answer instead.`,
      variant: "destructive",
    });
  };

  // ── Reset
  const handleReset = () => {
    window.speechSynthesis?.cancel();
    setAnswers({ ...defaultAnswers });
    setCurrentQ(0);
    setConfirmedAnswers([]);
    setIsEditing(false);
    toast({ title: "Reset", description: "Starting fresh." });
  };

  // ── Current selection display label
  const getConfirmedLabel = (qIndex: number): string => {
    const q = QUESTIONS[qIndex];
    if (q.type === "multi") {
      const arr = (answers as any)[q.field] as string[];
      if (!arr || arr.length === 0) return "—";
      const labels = arr.map((v) => q.options.find((o) => o.value === v)?.label || v);
      return labels.slice(0, 2).join(", ") + (labels.length > 2 ? ` +${labels.length - 2}` : "");
    }
    if (q.field === "lifestyle" && q.subfield) {
      const val = (answers.lifestyle as any)[q.subfield];
      return q.options.find((o) => o.value === val)?.label || val || "—";
    }
    const val = (answers as any)[q.field];
    return q.options.find((o) => o.value === val)?.label || val || "—";
  };

  // ── Phase change detection
  const prevPhase = currentQ > 0 ? QUESTIONS[currentQ - 1].phase : null;
  const showPhaseHeader = question.phase !== prevPhase;

  const currentValue = getCurrentValue();
  const isMultiSelected = question.type === "multi" && Array.isArray(currentValue) && currentValue.length > 0;
  const isLastQuestion = currentQ === totalQ - 1;

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
        @keyframes novaOrb {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes novaGlow {
          from { opacity: 0.4; transform: scale(0.9); }
          to { opacity: 0.9; transform: scale(1.15); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes waveBar {
          0%, 100% { height: 4px; }
          50% { height: 20px; }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease forwards; }
        .wave-bar { width: 3px; border-radius: 2px; background: rgb(168,85,247); animation: waveBar 0.6s ease-in-out infinite; }
        .wave-bar:nth-child(2) { animation-delay: 0.1s; }
        .wave-bar:nth-child(3) { animation-delay: 0.2s; }
        .wave-bar:nth-child(4) { animation-delay: 0.3s; }
        .wave-bar:nth-child(5) { animation-delay: 0.1s; }
      `}</style>

      <div
        className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(160deg, #0d0812 0%, #130d1a 50%, #0d0812 100%)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
          style={{ background: "rgba(13,8,18,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(168,85,247,0.1)" }}
        >
          <div className="flex items-center gap-3">
            <NovaOrb state={orbState} />
            <div>
              <p className="text-white font-semibold text-sm">NOVA</p>
              <p className="text-purple-400/70 text-xs">
                {isListening ? "Listening..." : orbState === "speaking" ? "Speaking..." : "Style AI"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">{currentQ + 1} / {totalQ}</span>

            {voiceSupported && (
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (!isMuted) window.speechSynthesis?.cancel();
                }}
                className="p-2 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
                title={isMuted ? "Unmute NOVA" : "Mute NOVA"}
              >
                {isMuted
                  ? <VolumeX className="w-4 h-4 text-gray-500" />
                  : <Volume2 className="w-4 h-4 text-purple-400" />}
              </button>
            )}

            {existingProfile && (
              <button
                onClick={handleReset}
                className="p-2 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
                title="Reset quiz"
              >
                <RotateCcw className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-28 max-w-lg mx-auto w-full">

          {/* Confirmed previous questions */}
          {confirmedAnswers.map((qIdx) => (
            <div key={qIdx} className="mb-6 animate-fadeIn">
              {qIdx > 0 && QUESTIONS[qIdx].phase !== QUESTIONS[qIdx - 1].phase && (
                <PhaseBadge phase={QUESTIONS[qIdx].phase} />
              )}
              {qIdx === 0 && <PhaseBadge phase={QUESTIONS[0].phase} />}

              {/* NOVA question (compact) */}
              <div className="flex items-start gap-3 mb-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                >
                  N
                </div>
                <div
                  className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-400 max-w-xs"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {QUESTIONS[qIdx].novaText}
                </div>
              </div>

              {/* User answer */}
              <UserBubble text={getConfirmedLabel(qIdx)} />
            </div>
          ))}

          {/* Current question */}
          <div className="animate-fadeIn">
            {showPhaseHeader && <PhaseBadge phase={question.phase} />}
            {confirmedAnswers.length === 0 && currentQ === 0 && <PhaseBadge phase={1} />}

            {/* NOVA message */}
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                N
              </div>
              <div
                className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed max-w-xs"
                style={{
                  background: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  color: "#e2d9f3",
                }}
              >
                {novaText}
                {!showOptions && (
                  <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse align-middle" />
                )}
              </div>
            </div>

            {/* Options */}
            {showOptions && (
              <div className="space-y-2 ml-10 animate-fadeIn">
                {question.options.map((opt) => {
                  const val = getCurrentValue();
                  const selected = Array.isArray(val) ? val.includes(opt.value) : val === opt.value;
                  return (
                    <OptionCard
                      key={opt.value}
                      option={opt}
                      selected={selected}
                      type={question.type}
                      onClick={() => selectAnswer(opt.value)}
                    />
                  );
                })}

                {question.type === "multi" && (
                  <div className="pt-2">
                    {isLastQuestion ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={!isMultiSelected || saveProfileMutation.isPending}
                        className="w-full rounded-xl font-medium h-11"
                        style={{
                          background: isMultiSelected ? "linear-gradient(135deg, #7c3aed, #a855f7)" : undefined,
                          opacity: isMultiSelected ? 1 : 0.5,
                        }}
                      >
                        {saveProfileMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Building your profile...
                          </div>
                        ) : (
                          <>Build My Profile</>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleMultiContinue}
                        disabled={!isMultiSelected}
                        className="w-full rounded-xl font-medium h-11"
                        style={{
                          background: isMultiSelected ? "linear-gradient(135deg, #7c3aed, #a855f7)" : undefined,
                          opacity: isMultiSelected ? 1 : 0.5,
                        }}
                      >
                        Continue
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div ref={chatBottomRef} />
        </div>

        {/* Bottom voice controls */}
        {voiceSupported && (
          <div
            className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 pt-4 z-20"
            style={{ background: "linear-gradient(to top, rgba(13,8,18,1) 60%, transparent)" }}
          >
            <button
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onTouchStart={startListening}
              onTouchEnd={stopListening}
              className="flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-200 active:scale-95"
              style={{
                background: isListening
                  ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                  : "rgba(255,255,255,0.07)",
                border: isListening ? "none" : "1px solid rgba(255,255,255,0.1)",
                boxShadow: isListening ? "0 0 30px rgba(168,85,247,0.5)" : "none",
              }}
            >
              {isListening ? (
                <>
                  <div className="flex items-end gap-0.5 h-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="wave-bar" />
                    ))}
                  </div>
                  <span className="text-white text-sm font-medium">Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-400 text-sm">Hold to speak</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
