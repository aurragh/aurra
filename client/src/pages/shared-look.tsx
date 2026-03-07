import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Sparkles, Share2, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function SkeletonSharedLook() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8" style={{ background: "linear-gradient(135deg, #0d0a1a 0%, #130d2e 50%, #0d0a1a 100%)" }}>
      <div className="w-full max-w-md animate-pulse">
        <div className="h-6 w-24 rounded bg-white/10 mb-6" />
        <div className="aspect-[9/16] max-h-[500px] rounded-2xl bg-white/10 mb-6" />
        <div className="h-5 w-3/4 rounded bg-white/10 mb-3" />
        <div className="h-4 w-full rounded bg-white/10 mb-2" />
        <div className="h-4 w-5/6 rounded bg-white/10" />
      </div>
    </div>
  );
}

export default function SharedLook() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [showWhy, setShowWhy] = useState(false);

  const { data: outfit, isLoading, isError } = useQuery({
    queryKey: ["/api/share", token],
    queryFn: async () => {
      const res = await fetch(`/api/share/${token}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    retry: false,
  });

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!", description: "Share your look anywhere." });
    } catch {
      toast({ title: "Copy failed", description: "Please copy the URL manually.", variant: "destructive" });
    }
  };

  const handleInstagram = () => {
    window.open(`https://www.instagram.com/`, "_blank");
    handleCopy();
    toast({ title: "Link copied!", description: "Paste it in your Instagram bio or story." });
  };

  const handleTikTok = () => {
    window.open(`https://www.tiktok.com/`, "_blank");
    handleCopy();
    toast({ title: "Link copied!", description: "Paste it in your TikTok bio or post." });
  };

  if (isLoading) return <SkeletonSharedLook />;

  if (isError || !outfit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ background: "linear-gradient(135deg, #0d0a1a 0%, #130d2e 50%, #0d0a1a 100%)" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
          <Share2 className="w-7 h-7 text-purple-400" />
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">This look is no longer available</h2>
        <p className="text-gray-400 text-sm mb-8">The link may have expired or been removed.</p>
        <Link href="/">
          <button className="px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
            Create your own AI looks — Try Aurra free
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 pb-16" style={{ background: "linear-gradient(135deg, #0d0a1a 0%, #130d2e 50%, #0d0a1a 100%)" }}>
      <div className="w-full max-w-md">

        {/* Brand header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-semibold text-sm tracking-wide">Aurra AI</span>
          </div>
          {outfit.occasion && (
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.35)", color: "#c4b5fd" }}>
              {outfit.occasion}
            </span>
          )}
        </div>

        {/* Image */}
        {outfit.imageUrl ? (
          <div className="relative rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <img
              src={outfit.imageUrl}
              alt={outfit.name}
              className="w-full object-cover"
              style={{ maxHeight: "520px" }}
            />
            {/* AI Exclusive badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.9), rgba(168,85,247,0.9))", backdropFilter: "blur(8px)" }}>
              <Sparkles className="w-3 h-3 text-white" />
              <span className="text-white">AI Exclusive</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl flex items-center justify-center mb-5 aspect-[3/4]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Sparkles className="w-12 h-12 text-purple-500/40" />
          </div>
        )}

        {/* Primary recommendation */}
        {outfit.primaryRecommendation && (
          <p className="text-white/90 text-base font-serif italic leading-relaxed mb-5">
            {outfit.primaryRecommendation}
          </p>
        )}

        {/* Why this works */}
        {outfit.whyRecommendation && (
          <button
            onClick={() => setShowWhy(!showWhy)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-5 text-left"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}
          >
            <span className="text-purple-300 text-sm font-medium">Why this works</span>
            {showWhy ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
          </button>
        )}
        {showWhy && outfit.whyRecommendation && (
          <div className="px-4 py-3 rounded-xl mb-5" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <p className="text-gray-300 text-sm leading-relaxed">{outfit.whyRecommendation}</p>
          </div>
        )}

        {/* Share actions */}
        <div className="flex flex-col gap-3 mb-8">
          <p className="text-gray-400 text-xs text-center mb-1">Share this look</p>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
            <button
              onClick={handleInstagram}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)", color: "#fff" }}
            >
              <ExternalLink className="w-4 h-4" />
              Instagram
            </button>
            <button
              onClick={handleTikTok}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-80"
              style={{ background: "#010101", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <ExternalLink className="w-4 h-4" />
              TikTok
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center text-center px-4 py-6 rounded-2xl" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <p className="text-white font-semibold text-sm mb-1">Want AI-generated looks like this?</p>
          <p className="text-gray-400 text-xs mb-4">Create your personalized style profile in 2 minutes — it's completely free.</p>
          <Link href="/">
            <button className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              Try Aurra free
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
