import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { Mic, Volume2, VolumeX, ChevronRight, RotateCcw, Check, ArrowRight } from "lucide-react";
import { type StyleProfile } from "@shared/schema";
import { useAurraTTS } from "@/hooks/useAurraTTS";

// ─── Question Data ────────────────────────────────────────────────────────────

const PHASES = [
  { id: 1, name: "Who You Are" },
  { id: 2, name: "How You Show Up" },
  { id: 3, name: "The Decision" },
] as const;

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
  // ───── PHASE 1: WHO YOU ARE (5 questions) ─────
  {
    id: "identityWord",
    phase: 1,
    novaText: "When you walk into a room feeling completely yourself, what one word describes that version of you?",
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
    id: "emotionalGoal",
    phase: 1,
    novaText: "When you walk out the door dressed right, what do you want to feel?",
    type: "single",
    options: [
      { value: "Powerful and in command", label: "Powerful and in command", desc: "Unstoppable, undeniable" },
      { value: "Calm and composed", label: "Calm and composed", desc: "Nothing rattles you" },
      { value: "Warm and approachable", label: "Warm and approachable", desc: "People feel safe with you" },
      { value: "Playful and expressive", label: "Playful and expressive", desc: "You show up with energy" },
      { value: "Grounded and steady", label: "Grounded and steady", desc: "Rooted, present, clear" },
      { value: "Creative and distinctive", label: "Creative and distinctive", desc: "Your style signals your vision" },
    ],
    field: "emotionalGoal",
  },

  // ───── PHASE 2: HOW YOU SHOW UP (14 questions) ─────
  {
    id: "presenceArchetype",
    phase: 2,
    novaText: "When you're operating at your best, which of these is closest to how you actually show up?",
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
    novaText: "Your frame, this helps me recommend silhouettes that work with you, not against you.",
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
    id: "gender",
    phase: 2,
    novaText: "How would you like your outfits styled, this shapes the silhouettes I choose for you.",
    type: "single",
    options: [
      { value: "Feminine", label: "Feminine", desc: "Fluid drapes, defined waist, curved silhouettes" },
      { value: "Masculine", label: "Masculine", desc: "Structured shoulders, straight lines, clean volume" },
      { value: "Androgynous", label: "Androgynous & fluid", desc: "Clean geometry, non-gendered proportion" },
      { value: "Classic tailored", label: "Classic tailored", desc: "Sharp, precise lines, gender-neutral" },
      { value: "No preference", label: "No preference", desc: "Let body type and occasion guide it" },
    ],
    field: "appearance",
    subfield: "gender",
  },
  {
    id: "height",
    phase: 2,
    novaText: "Your height, this lets me balance proportions and recommend the right silhouette length.",
    type: "single",
    options: [
      { value: "Under 5'3\"", label: "Under 5'3\"", desc: "Petite proportions" },
      { value: "5'3\"–5'6\"", label: "5'3\"–5'6\"", desc: "Versatile range" },
      { value: "5'7\"–5'10\"", label: "5'7\"–5'10\"", desc: "Balanced proportions" },
      { value: "5'11\" and above", label: "5'11\" and above", desc: "Tall proportions" },
      { value: "Prefer not to say", label: "Prefer not to say" },
    ],
    field: "appearance",
    subfield: "height",
  },
  {
    id: "skinUndertone",
    phase: 2,
    novaText: "One more thing about you, what best describes your natural coloring?",
    type: "single",
    options: [
      { value: "Fair & cool-toned", label: "Fair & cool-toned", desc: "Light skin, pink or blue undertones" },
      { value: "Fair & warm-toned", label: "Fair & warm-toned", desc: "Light skin, golden or peach undertones" },
      { value: "Medium & cool-toned", label: "Medium & cool-toned", desc: "Olive or medium skin, cool base" },
      { value: "Medium & warm-toned", label: "Medium & warm-toned", desc: "Golden or tan skin, warm base" },
      { value: "Deep & cool-toned", label: "Deep & cool-toned", desc: "Deep skin, cool or neutral base" },
      { value: "Deep & warm-toned", label: "Deep & warm-toned", desc: "Deep skin, warm or golden base" },
      { value: "Skip", label: "Skip this" },
    ],
    field: "appearance",
    subfield: "skinUndertone",
  },
  {
    id: "hairColor",
    phase: 2,
    novaText: "Your hair color, I use this to find colors that make you look your most vibrant.",
    type: "single",
    options: [
      { value: "Blonde", label: "Blonde", desc: "Light golden to platinum" },
      { value: "Light brown", label: "Light brown", desc: "Sandy to medium brown" },
      { value: "Dark brown", label: "Dark brown", desc: "Deep brunette" },
      { value: "Black", label: "Black", desc: "Deep black" },
      { value: "Red", label: "Red", desc: "Fiery red to copper" },
      { value: "Auburn", label: "Auburn", desc: "Red-brown tones" },
      { value: "Silver / Grey", label: "Silver / Grey", desc: "Natural or dyed grey tones" },
      { value: "Platinum / White", label: "Platinum / White", desc: "Very light or white" },
    ],
    field: "appearance",
    subfield: "hairColor",
  },
  {
    id: "eyeColor",
    phase: 2,
    novaText: "Your eye color, some palettes make eyes pop, others mute them. I'll use this to your advantage.",
    type: "single",
    options: [
      { value: "Brown", label: "Brown", desc: "Warm medium brown" },
      { value: "Dark brown", label: "Dark brown", desc: "Deep, rich brown" },
      { value: "Hazel", label: "Hazel", desc: "Brown-green blend" },
      { value: "Green", label: "Green", desc: "Light to deep green" },
      { value: "Blue", label: "Blue", desc: "Light to deep blue" },
      { value: "Grey", label: "Grey", desc: "Cool grey tones" },
      { value: "Skip", label: "Skip this" },
    ],
    field: "appearance",
    subfield: "eyeColor",
  },
  {
    id: "faceShape",
    phase: 2,
    novaText: "Your face shape, this guides necklines, collars, and accessories.",
    type: "single",
    options: [
      { value: "Oval", label: "Oval", desc: "Balanced, slightly longer than wide" },
      { value: "Round", label: "Round", desc: "Equal width and length, soft jaw" },
      { value: "Square", label: "Square", desc: "Strong jaw, equal width top and bottom" },
      { value: "Heart", label: "Heart", desc: "Wider forehead, narrower chin" },
      { value: "Diamond", label: "Diamond", desc: "Narrow forehead and chin, wide cheekbones" },
      { value: "Oblong", label: "Oblong", desc: "Long and narrow" },
      { value: "Not sure", label: "Not sure" },
      { value: "Skip", label: "Skip this" },
    ],
    field: "appearance",
    subfield: "faceShape",
  },
  {
    id: "colorPalette",
    phase: 2,
    novaText: "Which color world feels most natural to you, or what you want to project?",
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
    id: "colorComfort",
    phase: 2,
    novaText: "How far do you go with color, honestly?",
    type: "single",
    options: [
      { value: "Neutrals only", label: "Neutrals only", desc: "Black, white, grey, navy, nothing else" },
      { value: "Neutrals with one accent", label: "Neutrals with one accent", desc: "I'll add one color piece when it matters" },
      { value: "Open to color", label: "Open to color", desc: "Color is part of how I express myself" },
      { value: "Color is my signature", label: "Color is my signature", desc: "I use color intentionally and boldly" },
    ],
    field: "styleDetails",
    subfield: "colorComfort",
  },
  {
    id: "accessories",
    phase: 2,
    novaText: "What's your relationship with accessories?",
    type: "single",
    options: [
      { value: "Minimal, one or none", label: "Minimal, one or none", desc: "Less is more" },
      { value: "Functional only", label: "Functional only", desc: "Watch, bag, practical pieces" },
      { value: "Intentional statement", label: "Intentional statement", desc: "One piece that does the work" },
      { value: "Layered and expressive", label: "Layered and expressive", desc: "Accessories are part of the look" },
    ],
    field: "styleDetails",
    subfield: "accessories",
  },
  {
    id: "fabric",
    phase: 2,
    novaText: "Last detail, how do you feel about texture and fabric?",
    type: "single",
    options: [
      { value: "Clean & structured", label: "Clean & structured", desc: "Tailored, crisp, minimal texture" },
      { value: "Soft & relaxed", label: "Soft & relaxed", desc: "Cashmere, jersey, fluid drapes" },
      { value: "Rich & textured", label: "Rich & textured", desc: "Bouclé, tweed, knit, velvet" },
      { value: "Mix it up", label: "Mix it up", desc: "Depends on the occasion" },
    ],
    field: "styleDetails",
    subfield: "fabric",
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
      { value: "Mix of meetings and field work", label: "Mix, meetings and field work" },
      { value: "Client-facing all day", label: "Client-facing all day" },
      { value: "Remote / flexible", label: "Remote / flexible" },
      { value: "Travel-heavy", label: "Travel-heavy" },
    ],
    field: "lifestyle",
    subfield: "dailyRoutine",
  },

  // ───── PHASE 3: THE DECISION (3 questions) ─────
  {
    id: "budget",
    phase: 3,
    novaText: "What's your investment range per piece?",
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
    id: "sustainability",
    phase: 3,
    novaText: "How important is sustainability to you when it comes to fashion?",
    type: "single",
    options: [
      { value: "Very important", label: "Very important", desc: "I prioritize sustainable and ethical brands" },
      { value: "Somewhat important", label: "Somewhat important", desc: "I'll choose sustainable when available" },
      { value: "Not a priority", label: "Not a priority right now", desc: "I focus on fit, quality, and price" },
    ],
    field: "sustainability",
  },
  {
    id: "occasions",
    phase: 3,
    novaText: "What are you dressing for right now? I'll build everything around this.",
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
  // Phase 1
  identityWord: string;
  dressingRelationship: string;
  impressionGoals: string[];
  confidenceTrigger: string;
  emotionalGoal: string;
  // Phase 2
  presenceArchetype: string;
  bodyType: string;
  appearance: {
    gender?: string;
    height?: string;
    skinUndertone?: string;
    hairColor?: string;
    eyeColor?: string;
    faceShape?: string;
  };
  colorPalette: string;
  styleDetails: {
    colorComfort?: string;
    accessories?: string;
    fabric?: string;
  };
  lifestyle: { industry?: string; dailyRoutine?: string };
  // Phase 3
  budget: string;
  sustainability: string;
  occasions: string[];
}

const defaultAnswers: Answers = {
  identityWord: "",
  dressingRelationship: "",
  impressionGoals: [],
  confidenceTrigger: "",
  emotionalGoal: "",
  presenceArchetype: "",
  bodyType: "",
  appearance: {},
  colorPalette: "",
  styleDetails: {},
  lifestyle: {},
  budget: "",
  sustainability: "",
  occasions: [],
};

// ─── Build rich occasion context string (T002) ────────────────────────────────

function buildOccasionContext(answers: Answers): string {
  const primaryOccasion = answers.occasions[0] || "General styling";
  const parts: string[] = [];
  if (answers.identityWord) parts.push(`Identity: ${answers.identityWord}`);
  if (answers.emotionalGoal) parts.push(`Goal: ${answers.emotionalGoal}`);
  if (answers.presenceArchetype) parts.push(`Presence: ${answers.presenceArchetype}`);
  if (answers.confidenceTrigger) parts.push(`Confidence trigger: ${answers.confidenceTrigger}`);
  if (answers.lifestyle.industry) parts.push(`Environment: ${answers.lifestyle.industry}`);
  if (answers.impressionGoals.length > 0) parts.push(`Impression goal: ${answers.impressionGoals.join(", ")}`);
  if (parts.length === 0) return primaryOccasion;
  return `${primaryOccasion}, ${parts.join(", ")}`;
}

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

function NovaOrb({ state, size = "sm" }: { state: "idle" | "speaking" | "listening" | "processing"; size?: "sm" | "lg" }) {
  const isLg = size === "lg";
  const outerSize = isLg ? "w-36 h-36" : "w-20 h-20";
  const innerSize = isLg ? "w-24 h-24" : "w-14 h-14";
  const fontSize = isLg ? "text-xl" : "text-sm";

  return (
    <div className={`relative flex items-center justify-center ${outerSize}`}>
      {state === "listening" && (
        <>
          <div className={`absolute ${outerSize} rounded-full bg-purple-500/20 animate-ping`} />
          <div className={`absolute ${isLg ? "w-28 h-28" : "w-16 h-16"} rounded-full bg-purple-500/20 animate-ping`} style={{ animationDelay: "0.2s" }} />
        </>
      )}
      {state === "processing" && (
        <>
          <div className={`absolute ${outerSize} rounded-full border border-purple-500/30 animate-spin`} style={{ animationDuration: "3s" }} />
          <div className={`absolute ${isLg ? "w-28 h-28" : "w-16 h-16"} rounded-full border border-purple-400/20 animate-spin`} style={{ animationDuration: "2s", animationDirection: "reverse" }} />
        </>
      )}
      {(state === "speaking" || state === "idle") && (
        <div
          className={`absolute ${outerSize} rounded-full`}
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
            animation: state === "speaking" ? "novaGlow 0.8s ease-in-out infinite alternate" : "novaGlow 2s ease-in-out infinite alternate",
          }}
        />
      )}
      <div
        className={`${innerSize} rounded-full flex items-center justify-center text-white font-bold tracking-widest z-10 ${fontSize}`}
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6d28d9 100%)",
          boxShadow:
            state === "listening"
              ? "0 0 30px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.4)"
              : state === "speaking"
              ? "0 0 20px rgba(168,85,247,0.6), 0 0 40px rgba(168,85,247,0.3)"
              : state === "processing"
              ? "0 0 40px rgba(168,85,247,0.7), 0 0 80px rgba(168,85,247,0.3)"
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

// ─── NOVA Generation Screen (T001) ───────────────────────────────────────────

const GEN_STEPS = [
  "Mapping your profile...",
  "Analyzing your occasion...",
  "Building your recommendation...",
  "Finalizing your look...",
];

function NovaGeneratingScreen({
  answers,
  isComplete,
  onGoToDashboard,
  isMuted,
}: {
  answers: Answers;
  isComplete: boolean;
  onGoToDashboard: () => void;
  isMuted: boolean;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [slowMessage, setSlowMessage] = useState(false);
  const genTts = useAurraTTS();

  // Profile recap pills
  const pills: { label: string; value: string }[] = [];
  if (answers.identityWord) pills.push({ label: "Identity", value: answers.identityWord });
  if (answers.presenceArchetype) pills.push({ label: "Presence", value: answers.presenceArchetype.replace("The person who ", "") });
  if (answers.lifestyle.industry) pills.push({ label: "World", value: answers.lifestyle.industry });
  if (answers.confidenceTrigger && answers.confidenceTrigger !== "Inner confidence") pills.push({ label: "Style", value: answers.confidenceTrigger });

  // Cycle status text
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < GEN_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // Show slow message after 8s
  useEffect(() => {
    const t = setTimeout(() => setSlowMessage(true), 8000);
    return () => clearTimeout(t);
  }, []);

  // When complete, show CTA
  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => setShowCTA(true), 400);
      return () => clearTimeout(t);
    }
  }, [isComplete]);

  // NOVA voice, via ElevenLabs (consistent across users)
  useEffect(() => {
    genTts.speak("Got everything I need. Building your first recommendation now.", { muted: isMuted });
  }, []);

  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => genTts.speak("Your first look is ready.", { muted: isMuted }), 300);
      return () => clearTimeout(t);
    }
  }, [isComplete]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "linear-gradient(160deg, #0F0E14 0%, #1A1825 50%, #0F0E14 100%)" }}
    >
      {/* Orb */}
      <div className="mb-8">
        <NovaOrb state={isComplete ? "speaking" : "processing"} size="lg" />
      </div>

      {/* Profile recap */}
      {pills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-sm animate-fadeIn">
          {pills.map((p) => (
            <div
              key={p.label}
              className="px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(139,92,246,0.12)",
                border: "1px solid rgba(139,92,246,0.25)",
                color: "#c4b5fd",
              }}
            >
              <span className="text-purple-400/60 mr-1">{p.label}:</span>
              {p.value}
            </div>
          ))}
        </div>
      )}

      {/* Status text */}
      {!isComplete && (
        <div className="space-y-3 animate-fadeIn">
          <p
            className="text-purple-200 text-base font-medium transition-all duration-500"
            key={stepIndex}
            style={{ animation: "fadeIn 0.4s ease forwards" }}
          >
            {GEN_STEPS[stepIndex]}
          </p>
          {slowMessage && (
            <p className="text-gray-500 text-sm animate-fadeIn">
              Still working... this takes a moment.
            </p>
          )}
          <div className="flex gap-1.5 justify-center mt-4">
            {GEN_STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: i === stepIndex ? "24px" : "6px",
                  background: i <= stepIndex ? "#a855f7" : "rgba(168,85,247,0.2)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Complete state */}
      {isComplete && showCTA && (
        <div className="space-y-4 animate-fadeIn">
          <p className="text-white text-lg font-semibold">Your first look is ready.</p>
          <p className="text-purple-300/70 text-sm">Aurra built this from your profile.</p>
          <button
            onClick={onGoToDashboard}
            className="mt-4 flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-base transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              boxShadow: "0 0 30px rgba(168,85,247,0.4), 0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            See Your Look
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Complete state before CTA ready */}
      {isComplete && !showCTA && (
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-purple-400"
              style={{ animation: `waveBar 0.6s ease-in-out ${i * 0.15}s infinite` }}
            />
          ))}
        </div>
      )}
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
  // Generation screen state (T001)
  const [showGenerating, setShowGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const tts = useAurraTTS();

  const question = QUESTIONS[currentQ];
  const totalQ = QUESTIONS.length;

  // ── Typewriter for current question
  const { displayed: novaText } = useTypewriter(
    question.novaText,
    20,
    () => setShowOptions(true)
  );

  // Show options when question changes
  useEffect(() => {
    setShowOptions(false);
    const t = setTimeout(() => setShowOptions(true), question.novaText.length * 20 + 100);
    return () => clearTimeout(t);
  }, [currentQ]);

  // ── Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentQ, confirmedAnswers]);

  // ── Voice support detection (always true for ElevenLabs; mic still needs browser API)
  useEffect(() => {
    const hasRec = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    setVoiceSupported(hasRec);
  }, []);

  // ── Speak NOVA question via ElevenLabs (consistent voice, no browser TTS)
  const speakText = useCallback(
    (text: string) => {
      tts.cancel();
      tts.speak(text, {
        muted: isMuted,
        onStart: () => setOrbState("speaking"),
        onEnd: () => setOrbState("idle"),
      });
    },
    [tts, isMuted]
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
          "Hi, I'm Aurra. I'll help you build your style profile. Let's start with a few questions about you."
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
      const appearance = JSON.parse((existingProfile as any).appearance || "{}");
      const styleDetails = JSON.parse((existingProfile as any).styleDetails || "{}");

      setAnswers({
        identityWord: personality.identityWord || "",
        dressingRelationship: personality.dressingRelationship || "",
        impressionGoals: personality.impressionGoals ? JSON.parse(personality.impressionGoals) : [],
        confidenceTrigger: personality.confidenceTrigger || "",
        emotionalGoal: personality.emotionalGoal || "",
        presenceArchetype: personality.presenceArchetype || personality.presenceGoal || "",
        bodyType: existingProfile.bodyType || "",
        appearance,
        colorPalette: colorPrefs[0] || "",
        styleDetails,
        lifestyle,
        budget: existingProfile.budget || "",
        sustainability: (existingProfile as any).sustainability || "",
        occasions,
      });
      setIsEditing(true);
    }
  }, [existingProfile, isEditing]);

  // ── Save mutation (T001 + T002: shows generation screen, uses rich occasion)
  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      await apiRequest("POST", "/api/style-profile", profileData);
      if (!isEditing && answers.occasions.length > 0) {
        // T002: build rich occasion context string
        const richOccasion = buildOccasionContext(answers);
        await apiRequest("POST", "/api/generate-outfits", {
          occasion: richOccasion,
          count: 1,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/style-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outfits"] });
      if (isEditing) {
        toast({ title: "Profile Updated!" });
        setLocation("/dashboard");
      } else {
        // T001: show completion state in generation screen
        setGenerationComplete(true);
      }
    },
    onError: (error) => {
      setShowGenerating(false);
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
    },
  });

  // Nested field keys (composite JSON answers)
  const NESTED_FIELDS = new Set(["lifestyle", "appearance", "styleDetails"]);

  // ── Get current answer value
  const getCurrentValue = (): string | string[] => {
    const q = question;
    if (NESTED_FIELDS.has(q.field) && q.subfield) {
      return ((answers as any)[q.field] as any)?.[q.subfield] || "";
    }
    return (answers as any)[q.field] ?? (q.type === "multi" ? [] : "");
  };

  // ── Select an answer
  const selectAnswer = useCallback(
    (value: string) => {
      const q = question;

      if (q.type === "single") {
        if (NESTED_FIELDS.has(q.field) && q.subfield) {
          setAnswers((prev) => ({
            ...prev,
            [q.field]: { ...((prev as any)[q.field] || {}), [q.subfield!]: value },
          }));
        } else {
          setAnswers((prev) => ({ ...prev, [q.field]: value }));
        }

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

  // ── Submit, shows generating screen immediately (T001)
  const handleSubmit = (currentAnswers?: Answers) => {
    const finalAnswers = currentAnswers || answers;
    tts.cancel();

    const personalityData = {
      identityWord: finalAnswers.identityWord,
      dressingRelationship: finalAnswers.dressingRelationship,
      impressionGoals: JSON.stringify(finalAnswers.impressionGoals),
      confidenceTrigger: finalAnswers.confidenceTrigger,
      emotionalGoal: finalAnswers.emotionalGoal,
      presenceArchetype: finalAnswers.presenceArchetype,
      presenceGoal: finalAnswers.presenceArchetype,
      intentMoments: JSON.stringify(finalAnswers.occasions),
    };
    const profileData = {
      personality: JSON.stringify(personalityData),
      bodyType: finalAnswers.bodyType,
      colorPreferences: JSON.stringify([finalAnswers.colorPalette].filter(Boolean)),
      stylePreferences: JSON.stringify([finalAnswers.presenceArchetype].filter(Boolean)),
      clothingItems: JSON.stringify([]),
      lifestyle: JSON.stringify(finalAnswers.lifestyle),
      appearance: JSON.stringify(finalAnswers.appearance),
      styleDetails: JSON.stringify(finalAnswers.styleDetails),
      budget: finalAnswers.budget,
      sustainability: finalAnswers.sustainability,
      occasions: JSON.stringify(finalAnswers.occasions),
      completed: true,
    };

    // Show generation screen before API call (T001)
    if (!isEditing && finalAnswers.occasions.length > 0) {
      setShowGenerating(true);
    }

    saveProfileMutation.mutate(profileData);
  };

  // ── Go to dashboard from generation screen (T003: add ?new=1)
  const handleGoToDashboard = () => {
    tts.cancel();
    setLocation("/dashboard?new=1");
  };

  // ── Voice: start listening
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    tts.cancel();
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
      description: `I heard: "${transcripts[0]}", try tapping your answer instead.`,
      variant: "destructive",
    });
  };

  // ── Reset
  const handleReset = () => {
    tts.cancel();
    setAnswers({ ...defaultAnswers });
    setCurrentQ(0);
    setConfirmedAnswers([]);
    setIsEditing(false);
    setShowGenerating(false);
    setGenerationComplete(false);
    toast({ title: "Reset", description: "Starting fresh." });
  };

  // ── Current selection display label
  const getConfirmedLabel = (qIndex: number): string => {
    const q = QUESTIONS[qIndex];
    if (q.type === "multi") {
      const arr = (answers as any)[q.field] as string[];
      if (!arr || arr.length === 0) return "…";
      const labels = arr.map((v) => q.options.find((o) => o.value === v)?.label || v);
      return labels.slice(0, 2).join(", ") + (labels.length > 2 ? ` +${labels.length - 2}` : "");
    }
    if (q.field === "lifestyle" && q.subfield) {
      const val = (answers.lifestyle as any)[q.subfield];
      return q.options.find((o) => o.value === val)?.label || val || "…";
    }
    const val = (answers as any)[q.field];
    return q.options.find((o) => o.value === val)?.label || val || "…";
  };

  const prevPhase = currentQ > 0 ? QUESTIONS[currentQ - 1].phase : null;
  const showPhaseHeader = question.phase !== prevPhase;

  const currentValue = getCurrentValue();
  const isMultiSelected = question.type === "multi" && Array.isArray(currentValue) && currentValue.length > 0;
  const isLastQuestion = currentQ === totalQ - 1;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0E14" }}>
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── T001: Show NOVA generation screen
  if (showGenerating) {
    return (
      <>
        <style>{`
          @keyframes novaOrb { 0% { transform: scale(1); } 50% { transform: scale(1.06); } 100% { transform: scale(1); } }
          @keyframes novaGlow { from { opacity: 0.4; transform: scale(0.9); } to { opacity: 0.9; transform: scale(1.15); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes waveBar { 0%, 100% { height: 4px; } 50% { height: 20px; } }
          .animate-fadeIn { animation: fadeIn 0.4s ease forwards; }
        `}</style>
        <NovaGeneratingScreen
          answers={answers}
          isComplete={generationComplete}
          onGoToDashboard={handleGoToDashboard}
          isMuted={isMuted}
        />
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes novaOrb { 0% { transform: scale(1); } 50% { transform: scale(1.06); } 100% { transform: scale(1); } }
        @keyframes novaGlow { from { opacity: 0.4; transform: scale(0.9); } to { opacity: 0.9; transform: scale(1.15); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes waveBar { 0%, 100% { height: 4px; } 50% { height: 20px; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease forwards; }
        .wave-bar { width: 3px; border-radius: 2px; background: rgb(168,85,247); animation: waveBar 0.6s ease-in-out infinite; }
        .wave-bar:nth-child(2) { animation-delay: 0.1s; }
        .wave-bar:nth-child(3) { animation-delay: 0.2s; }
        .wave-bar:nth-child(4) { animation-delay: 0.3s; }
        .wave-bar:nth-child(5) { animation-delay: 0.1s; }
      `}</style>

      <div
        className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(160deg, #0F0E14 0%, #1A1825 50%, #0F0E14 100%)" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-20"
          style={{ background: "rgba(15,14,20,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(168,85,247,0.08)" }}
        >
          <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <NovaOrb state={orbState} />
            <div>
              <p className="text-white font-semibold text-sm">Aurra</p>
              <p className="text-purple-400/70 text-xs">
                {isListening ? "Listening..." : orbState === "speaking" ? "Speaking..." : `Question ${currentQ + 1} of ${totalQ}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-[10px] tabular-nums">{Math.round(((currentQ + 1) / totalQ) * 100)}%</span>

            {voiceSupported && (
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (!isMuted) tts.cancel();
                }}
                className="p-2 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
                title={isMuted ? "Unmute Aurra" : "Mute Aurra"}
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
          {/* Progress bar */}
          <div className="h-0.5 bg-white/[0.04]">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentQ + 1) / totalQ) * 100}%`,
                background: "linear-gradient(90deg, #7c3aed, #a855f7)",
                boxShadow: "0 0 8px rgba(168,85,247,0.4)",
              }}
            />
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

              <UserBubble text={getConfirmedLabel(qIdx)} />
            </div>
          ))}

          {/* Current question */}
          <div className="animate-fadeIn">
            {showPhaseHeader && <PhaseBadge phase={question.phase} />}

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
                        onClick={() => handleSubmit()}
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
