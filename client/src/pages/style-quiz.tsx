import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { type StyleProfile } from "@shared/schema";

const QUIZ_STEPS = [
  {
    id: "frame",
    title: "Decisions shape presence.",
    description: "Aurra helps you choose. Not a stylist. Not a trend engine. A thinking partner for what to wear when it matters.",
  },
  {
    id: "intent",
    title: "When do you need Aurra?",
    description: "Select all the moments where what you wear matters most.",
  },
  {
    id: "presence",
    title: "Your Presence Goal",
    description: "What is the primary intent when you walk into a room?",
  },
  {
    id: "bodyType",
    title: "Your Frame",
    description: "This helps Aurra recommend silhouettes and proportions that work for you.",
  },
  {
    id: "colorPreference",
    title: "Color Direction",
    description: "What palette feels most like you?",
  },
  {
    id: "lifestyle",
    title: "Your World",
    description: "Help Aurra understand where you operate.",
  },
  {
    id: "budget",
    title: "Investment Level",
    description: "What range feels right for building your presence?",
  },
  {
    id: "firstDecision",
    title: "Your First Decision",
    description: "What are you choosing for right now? Aurra will provide your direction immediately.",
  },
];

export default function StyleQuiz() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [answers, setAnswers] = useState({
    personality: {} as Record<string, string>,
    bodyType: "",
    colorPreference: "",
    stylePreference: "",
    clothingItems: [] as string[],
    lifestyle: {} as Record<string, string>,
    budget: "",
    occasions: [] as string[],
    intentMoments: [] as string[],
  });

  const { data: existingProfile } = useQuery<StyleProfile>({
    queryKey: ["/api/style-profile"],
    enabled: !!user,
  });

  useEffect(() => {
    if (existingProfile && !isEditing) {
      const colorPrefs = JSON.parse(existingProfile.colorPreferences || '[]');
      const stylePrefs = JSON.parse(existingProfile.stylePreferences || '[]');
      const occasions = JSON.parse(existingProfile.occasions || '[]');
      const clothingItems = JSON.parse(existingProfile.clothingItems || '[]');
      const personality = JSON.parse(existingProfile.personality || '{}');
      const intentMoments = personality.intentMoments ? JSON.parse(personality.intentMoments) : [];
      
      setAnswers({
        personality: personality,
        bodyType: existingProfile.bodyType || "",
        colorPreference: colorPrefs[0] || "",
        stylePreference: stylePrefs[0] || "",
        clothingItems: clothingItems,
        lifestyle: JSON.parse(existingProfile.lifestyle || '{}'),
        budget: existingProfile.budget || "",
        occasions: occasions,
        intentMoments: intentMoments,
      });
      setIsEditing(true);
    }
  }, [existingProfile, isEditing]);

  const handleResetQuiz = () => {
    setAnswers({
      personality: {},
      bodyType: "",
      colorPreference: "",
      stylePreference: "",
      clothingItems: [],
      lifestyle: {},
      budget: "",
      occasions: [],
      intentMoments: [],
    });
    setCurrentStep(0);
    setIsEditing(false);
    toast({
      title: "Quiz Reset",
      description: "Start fresh with your style preferences!",
    });
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      await apiRequest("POST", "/api/style-profile", profileData);
      
      if (!isEditing && answers.occasions.length > 0) {
        await apiRequest("POST", "/api/generate-outfits", {
          occasion: answers.occasions[0],
          count: 1
        });
      }
    },
    onSuccess: () => {
      if (isEditing) {
        toast({
          title: "Style Profile Updated!",
          description: "Your preferences have been saved.",
        });
      } else {
        toast({
          title: "Profile Saved!",
          description: answers.occasions.length > 0 ? "Generating your first outfit..." : "Your style profile is ready.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/style-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outfits"] });
      setLocation("/dashboard");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1410]">
        <div className="animate-spin w-8 h-8 border-4 border-[#c4a882] border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep < QUIZ_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const personalityData = {
      ...answers.personality,
      presenceGoal: answers.stylePreference,
      intentMoments: JSON.stringify(answers.intentMoments),
    };
    const profileData = {
      personality: JSON.stringify(personalityData),
      bodyType: answers.bodyType,
      colorPreferences: JSON.stringify([answers.colorPreference].filter(Boolean)),
      stylePreferences: JSON.stringify([answers.stylePreference].filter(Boolean)),
      clothingItems: JSON.stringify(answers.clothingItems),
      lifestyle: JSON.stringify(answers.lifestyle),
      budget: answers.budget,
      occasions: JSON.stringify(answers.occasions),
      completed: true,
    };

    saveProfileMutation.mutate(profileData);
  };

  const updateAnswer = (field: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateLifestyle = (aspect: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      lifestyle: {
        ...prev.lifestyle,
        [aspect]: value,
      },
    }));
  };

  const toggleArrayItem = (field: 'clothingItems' | 'occasions' | 'intentMoments', value: string) => {
    setAnswers(prev => {
      const currentArray = prev[field];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item: string) => item !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [field]: newArray,
      };
    });
  };

  const progress = ((currentStep + 1) / QUIZ_STEPS.length) * 100;
  const currentStepData = QUIZ_STEPS[currentStep];

  const SelectionCard = ({ 
    selected, 
    onClick, 
    children,
    type = "radio"
  }: { 
    selected: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
    type?: "radio" | "checkbox";
  }) => (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? "border-[#c4a882] bg-[#c4a882]/10 text-[#f5f0eb]"
          : "border-[#3d3530] bg-[#2a231f] text-[#b8a898] hover:border-[#6b5f54] hover:bg-[#332c26]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 flex-shrink-0 ${type === "radio" ? "rounded-full" : "rounded-md"} border-2 flex items-center justify-center ${
          selected ? "border-[#c4a882]" : "border-[#6b5f54]"
        }`}>
          {selected && (
            type === "radio" 
              ? <div className="w-2.5 h-2.5 rounded-full bg-[#c4a882]" />
              : <svg className="w-3 h-3 text-[#c4a882]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          )}
        </div>
        <span className="text-sm font-medium">{children}</span>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#1a1410]">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#f5f0eb] mb-2 font-serif" data-testid="heading-quiz-title">
            {isEditing ? "Edit Your Style Profile" : "Aurra"}
          </h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[#8a7e74] text-sm">Step {currentStep + 1} of {QUIZ_STEPS.length}</span>
          </div>
          <div className="max-w-xs mx-auto">
            <Progress value={progress} className="h-1 bg-[#2a231f]" data-testid="progress-quiz" />
          </div>
          
          {existingProfile && (
            <Button 
              variant="ghost"
              onClick={handleResetQuiz}
              className="mt-4 text-[#8a7e74] hover:text-[#c4a882] hover:bg-[#2a231f]"
              data-testid="button-reset-quiz"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Quiz
            </Button>
          )}
        </div>

        <div className="bg-[#231d18] rounded-2xl border border-[#3d3530] p-6 md:p-8" data-testid="card-quiz-step">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[#f5f0eb] mb-2 font-serif">
              {currentStepData.title}
            </h2>
            <p className="text-[#8a7e74] text-sm" data-testid="text-step-description">
              {currentStepData.description}
            </p>
          </div>

          <div className="space-y-3">
            {currentStep === 0 && (
              <div className="text-center space-y-6 py-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#2a231f] border border-[#3d3530] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#c4a882]" />
                </div>
                <p className="text-lg text-[#d4c4b4] font-serif italic">
                  Decisions shape presence. Aurra helps you choose.
                </p>
                <p className="text-[#8a7e74] text-sm leading-relaxed max-w-md mx-auto">
                  Not a stylist. Not a trend engine. A thinking partner for what to wear when it matters.
                </p>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-3">
                {[
                  "High-stakes meetings or rooms",
                  "Public appearances or speaking",
                  "Events where I don't want to disappear",
                  "Travel / unfamiliar environments",
                  "Daily leadership presence",
                  "I just want fewer wrong decisions"
                ].map((option) => (
                  <SelectionCard
                    key={option}
                    type="checkbox"
                    selected={answers.intentMoments.includes(option)}
                    onClick={() => toggleArrayItem('intentMoments', option)}
                  >
                    {option}
                  </SelectionCard>
                ))}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-3">
                {[
                  "To command and lead",
                  "To be remembered with clarity",
                  "To build trust and connection",
                  "To signal restraint and focus",
                  "To disappear into the work"
                ].map((option) => (
                  <SelectionCard
                    key={option}
                    type="radio"
                    selected={answers.stylePreference === option}
                    onClick={() => updateAnswer('stylePreference', option)}
                  >
                    {option}
                  </SelectionCard>
                ))}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-3">
                {[
                  { value: "slim", label: "Slim / Lean" },
                  { value: "athletic", label: "Athletic / Fit" },
                  { value: "average", label: "Average / Medium" },
                  { value: "broad", label: "Broad / Muscular" },
                  { value: "curvy", label: "Curvy / Full" },
                  { value: "petite", label: "Petite / Compact" },
                  { value: "tall", label: "Tall / Elongated" },
                  { value: "prefer_not", label: "Prefer not to say" },
                ].map((option) => (
                  <SelectionCard
                    key={option.value}
                    type="radio"
                    selected={answers.bodyType === option.value}
                    onClick={() => updateAnswer('bodyType', option.value)}
                  >
                    {option.label}
                  </SelectionCard>
                ))}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-3">
                {[
                  { value: "neutral", label: "Neutrals & Earth Tones", desc: "Black, navy, charcoal, camel, olive" },
                  { value: "classic", label: "Classic & Structured", desc: "Black, white, navy, burgundy, forest green" },
                  { value: "warm", label: "Warm & Approachable", desc: "Tan, cream, rust, soft blue, sage" },
                  { value: "bold", label: "Bold & Intentional", desc: "Deep red, cobalt, emerald, violet" },
                  { value: "minimal", label: "Minimal & Monochrome", desc: "Black, white, gray tones" },
                  { value: "soft", label: "Soft & Understated", desc: "Muted pastels, lavender, dusty rose" },
                ].map((option) => (
                  <SelectionCard
                    key={option.value}
                    type="radio"
                    selected={answers.colorPreference === option.value}
                    onClick={() => updateAnswer('colorPreference', option.value)}
                  >
                    <div>
                      <div>{option.label}</div>
                      <div className="text-xs text-[#8a7e74] mt-0.5">{option.desc}</div>
                    </div>
                  </SelectionCard>
                ))}
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <p className="text-[#d4c4b4] text-sm font-medium mb-3">What industry are you in?</p>
                  <div className="space-y-2">
                    {[
                      "Corporate / Finance",
                      "Tech / Startup",
                      "Creative / Media",
                      "Law / Government",
                      "Healthcare",
                      "Education",
                      "Entrepreneurship",
                      "Other"
                    ].map((option) => (
                      <SelectionCard
                        key={option}
                        type="radio"
                        selected={answers.lifestyle.industry === option}
                        onClick={() => updateLifestyle('industry', option)}
                      >
                        {option}
                      </SelectionCard>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[#d4c4b4] text-sm font-medium mb-3">Your typical day involves...</p>
                  <div className="space-y-2">
                    {[
                      "Mostly office / boardroom",
                      "Mix of meetings and field work",
                      "Client-facing all day",
                      "Remote / flexible",
                      "Travel-heavy",
                    ].map((option) => (
                      <SelectionCard
                        key={option}
                        type="radio"
                        selected={answers.lifestyle.dailyRoutine === option}
                        onClick={() => updateLifestyle('dailyRoutine', option)}
                      >
                        {option}
                      </SelectionCard>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-3">
                {[
                  { value: "budget", label: "Under $100 per piece", desc: "Smart, accessible choices" },
                  { value: "mid", label: "$100 - $300 per piece", desc: "Quality mid-range investment" },
                  { value: "premium", label: "$300 - $700 per piece", desc: "Premium quality pieces" },
                  { value: "luxury", label: "$700+ per piece", desc: "Luxury and designer level" },
                  { value: "mixed", label: "Mix of ranges", desc: "Strategic spending across tiers" },
                ].map((option) => (
                  <SelectionCard
                    key={option.value}
                    type="radio"
                    selected={answers.budget === option.value}
                    onClick={() => updateAnswer('budget', option.value)}
                  >
                    <div>
                      <div>{option.label}</div>
                      <div className="text-xs text-[#8a7e74] mt-0.5">{option.desc}</div>
                    </div>
                  </SelectionCard>
                ))}
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-3">
                {[
                  "A room with power (High-stakes meeting)",
                  "A stage or podium (Public speaking)",
                  "A first impression (Key meeting)",
                  "Travel (High visibility / unknown)",
                  "Daily leadership (The routine that matters)"
                ].map((option) => (
                  <SelectionCard
                    key={option}
                    type="checkbox"
                    selected={answers.occasions.includes(option)}
                    onClick={() => toggleArrayItem('occasions', option)}
                  >
                    {option}
                  </SelectionCard>
                ))}
                <div className="mt-4 p-4 bg-[#c4a882]/10 rounded-xl border border-[#c4a882]/20">
                  <p className="text-[#c4a882] text-sm font-medium">
                    Aurra will provide your first decision immediately after completing this quiz.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button 
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="text-[#8a7e74] hover:text-[#c4a882] hover:bg-[#2a231f] rounded-full px-6"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={saveProfileMutation.isPending}
            className="bg-[#c4a882] hover:bg-[#b39672] text-[#1a1410] rounded-full px-6 font-medium"
            data-testid="button-next"
          >
            {saveProfileMutation.isPending ? (
              "Saving..."
            ) : currentStep === QUIZ_STEPS.length - 1 ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get My First Decision
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
