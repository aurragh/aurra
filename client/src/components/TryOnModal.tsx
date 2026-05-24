import { useState, useRef } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, Sparkles, X, Upload, Download, RefreshCw, User } from "lucide-react";

interface TryOnModalProps {
  outfitId: string | null;
  onClose: () => void;
}

export function TryOnModal({ outfitId, onClose }: TryOnModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [step, setStep] = useState<"setup" | "generating" | "result">("setup");

  const { data: profilePhoto } = useQuery<{ avatarPhotoUrl: string | null }>({
    queryKey: ["/api/profile/photo"],
    enabled: !!outfitId,
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/photo"] });
      toast({ title: "Photo saved", description: "Ready to generate your try-on look." });
    },
    onError: () => {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const generateTryOnMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/outfits/${outfitId}/try-on`);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      setStep("result");
    },
    onError: (err: any) => {
      setStep("setup");
      toast({
        title: "Generation failed",
        description: err?.message || "Could not generate your try-on. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPhotoMutation.mutate(file);
  };

  const handleGenerate = () => {
    setStep("generating");
    generateTryOnMutation.mutate();
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = "aurra-tryon.png";
    a.target = "_blank";
    a.click();
  };

  const hasPhoto = !!profilePhoto?.avatarPhotoUrl;

  return (
    <Dialog open={!!outfitId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="border-0 p-0 overflow-hidden max-w-sm w-full"
        style={{
          background: "linear-gradient(160deg, #1A1825 0%, #1a0f2e 100%)",
          border: "1px solid rgba(168,85,247,0.2)",
        }}
        data-testid="dialog-tryon-modal"
      >
        <DialogTitle className="sr-only">Try It On</DialogTitle>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-white font-semibold text-sm">Try It On</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full transition-colors hover:bg-white/10"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5">
          {/* Step: setup */}
          {step === "setup" && (
            <div className="space-y-5">
              {/* Selfie section */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
                  Your Photo
                </p>
                <div className="flex items-center gap-4">
                  {/* Avatar preview */}
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {uploadPhotoMutation.isPending ? (
                      <div className="w-5 h-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                    ) : hasPhoto ? (
                      <img
                        src={profilePhoto.avatarPhotoUrl!}
                        alt="Your photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    {hasPhoto ? (
                      <div className="space-y-1.5">
                        <p className="text-xs text-green-400 font-medium">Photo ready</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Aurra will style you in this look. Tap to change.
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-purple-400 underline underline-offset-2"
                          disabled={uploadPhotoMutation.isPending}
                        >
                          Change photo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-sm text-white font-medium">Upload a selfie</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          A clear front-facing photo works best. Saved to your profile.
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadPhotoMutation.isPending}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                          style={{
                            background: "rgba(124,58,237,0.25)",
                            border: "1px solid rgba(168,85,247,0.35)",
                            color: "#c4b5fd",
                          }}
                        >
                          <Upload className="w-3 h-3" />
                          {uploadPhotoMutation.isPending ? "Uploading..." : "Choose photo"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Info note */}
              <div
                className="px-3 py-2.5 rounded-xl"
                style={{
                  background: "rgba(124,58,237,0.08)",
                  border: "1px solid rgba(124,58,237,0.15)",
                }}
              >
                <p className="text-xs text-purple-300/70 leading-relaxed">
                  Aurra uses your selfie to generate an AI image of you wearing this outfit. Results are styled illustrations — not a virtual mirror.
                </p>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={!hasPhoto || uploadPhotoMutation.isPending}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                }}
                data-testid="button-generate-tryon"
              >
                <Sparkles className="w-4 h-4" />
                Generate My Look
              </button>
            </div>
          )}

          {/* Step: generating */}
          {step === "generating" && (
            <div className="py-12 flex flex-col items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-white font-medium text-sm">Aurra is styling you...</p>
                <p className="text-gray-500 text-xs">This takes about 20–30 seconds</p>
              </div>
              <div className="w-full space-y-2 pt-2">
                {["Analyzing your photo", "Composing the outfit", "Rendering your look"].map(
                  (label, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{
                          background: "#a855f7",
                          animationDelay: `${i * 0.3}s`,
                        }}
                      />
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Step: result */}
          {step === "result" && generatedImage && (
            <div className="space-y-4">
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(168,85,247,0.2)" }}
              >
                <img
                  src={generatedImage}
                  alt="Your try-on look"
                  className="w-full object-contain max-h-[420px]"
                  data-testid="img-tryon-result"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setGeneratedImage(null); setStep("setup"); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#9ca3af",
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-white"
                  style={{
                    background: "linear-gradient(135deg, rgba(124,58,237,0.6), rgba(168,85,247,0.5))",
                    border: "1px solid rgba(168,85,247,0.3)",
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Save Image
                </button>
              </div>

              <p className="text-center text-xs text-gray-600">
                AI-generated image — results may vary
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
