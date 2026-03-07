import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { type StyleProfile } from "@shared/schema";

interface StyleDNACardProps {
  profile: StyleProfile;
}

function buildSummary(identityWord: string, presenceArchetype: string): string {
  let dressPart = "You dress with intention.";
  if (["Powerful", "Sharp", "Grounded"].includes(identityWord)) {
    dressPart = "You dress for authority.";
  } else if (["Warm", "Bold"].includes(identityWord)) {
    dressPart = "You dress for connection.";
  } else if (identityWord === "Quiet") {
    dressPart = "You dress for restraint.";
  }

  let presencePart = "";
  if (presenceArchetype.includes("Commands silence")) {
    presencePart = "Structure is your language.";
  } else if (presenceArchetype.includes("Draws people in")) {
    presencePart = "Warmth is your tool.";
  } else if (presenceArchetype.includes("Reads the room")) {
    presencePart = "Context is everything.";
  } else if (presenceArchetype.includes("Gets things done")) {
    presencePart = "Function over performance.";
  }

  return [dressPart, presencePart].filter(Boolean).join(" ");
}

const PALETTE_LABELS: Record<string, string> = {
  neutral: "Neutrals & Earth",
  classic: "Classic & Structured",
  warm: "Warm & Approachable",
  bold: "Bold & Intentional",
  minimal: "Minimal & Monochrome",
  soft: "Soft & Understated",
};

export function StyleDNACard({ profile }: StyleDNACardProps) {
  const [expanded, setExpanded] = useState(true);

  const personality = (() => {
    try { return JSON.parse(profile.personality || "{}"); } catch { return {}; }
  })();
  const lifestyle = (() => {
    try { return JSON.parse(profile.lifestyle || "{}"); } catch { return {}; }
  })();
  const colorPrefs = (() => {
    try { return JSON.parse(profile.colorPreferences || "[]"); } catch { return []; }
  })();

  const identityWord = personality.identityWord || "";
  const presenceArchetype = personality.presenceArchetype || personality.presenceGoal || "";
  const colorPalette = colorPrefs[0] || "";
  const industry = lifestyle.industry || "";

  const chips = [
    { label: "Identity", value: identityWord },
    { label: "Presence", value: presenceArchetype.replace(/^The person who /, "") },
    { label: "Palette", value: PALETTE_LABELS[colorPalette] || colorPalette },
    { label: "World", value: industry },
  ].filter((c) => c.value);

  const summary = buildSummary(identityWord, presenceArchetype);

  return (
    <div
      className="rounded-2xl mb-6 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,8,18,0.9) 100%)",
        border: "1px solid rgba(139,92,246,0.2)",
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            N
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-sm">Your Style DNA</p>
            {!expanded && identityWord && (
              <p className="text-purple-400/70 text-xs">{identityWord} · {presenceArchetype.replace(/^The person who /, "")}</p>
            )}
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-purple-400/60" />
          : <ChevronDown className="w-4 h-4 text-purple-400/60" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5">
          {/* Chips grid */}
          {chips.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {chips.map((chip) => (
                <div
                  key={chip.label}
                  className="px-3 py-2.5 rounded-xl"
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    border: "1px solid rgba(139,92,246,0.18)",
                  }}
                >
                  <p className="text-purple-400/60 text-xs mb-0.5">{chip.label}</p>
                  <p className="text-purple-100 text-sm font-medium leading-tight">{chip.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Summary sentence */}
          {summary && (
            <p className="text-gray-400 text-sm italic mb-4 leading-relaxed">
              "{summary}"
            </p>
          )}

          {/* Edit link */}
          <div className="flex justify-end">
            <Link href="/quiz">
              <button className="flex items-center gap-1.5 text-xs text-purple-400/70 hover:text-purple-300 transition-colors">
                <Pencil className="w-3 h-3" />
                Edit Profile
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
