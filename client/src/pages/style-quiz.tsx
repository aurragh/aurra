import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { RotatingBackground } from "@/components/RotatingBackground";
import { type StyleProfile } from "@shared/schema";

const QUIZ_STEPS = [
  {
    id: "frame",
    title: "Decisions shape presence.",
    description: "Aurra helps you choose. Not a stylist. Not a trend engine. A thinking partner for what to wear when it matters.",
  },
  {
    id: "intent",
    title: "Why Are You Here?",
    description: "When do you usually need help deciding what to wear?",
  },
  {
    id: "presence",
    title: "Presence Goals",
    description: "What is the primary intent when you walk into a room?",
  },
  {
    id: "firstDecision",
    title: "First Decision",
    description: "What are you choosing for right now?",
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
    stylePreference: "", // Single selection for style preference
    clothingItems: [] as string[], // Keep for backward compatibility with database
    lifestyle: {} as Record<string, string>,
    budget: "",
    occasions: [] as string[], // Multi-select for occasions
  });

  // Fetch existing style profile
  const { data: existingProfile } = useQuery<StyleProfile>({
    queryKey: ["/api/style-profile"],
    enabled: !!user,
  });

  // Pre-fill form with existing profile data
  useEffect(() => {
    if (existingProfile && !isEditing) {
      // Parse arrays
      const colorPrefs = JSON.parse(existingProfile.colorPreferences || '[]');
      const stylePrefs = JSON.parse(existingProfile.stylePreferences || '[]');
      const occasions = JSON.parse(existingProfile.occasions || '[]');
      const clothingItems = JSON.parse(existingProfile.clothingItems || '[]');
      
      setAnswers({
        personality: JSON.parse(existingProfile.personality || '{}'),
        bodyType: existingProfile.bodyType || "",
        colorPreference: colorPrefs[0] || "",
        stylePreference: stylePrefs[0] || "", // Single selection
        clothingItems: clothingItems,
        lifestyle: JSON.parse(existingProfile.lifestyle || '{}'),
        budget: existingProfile.budget || "",
        occasions: occasions,
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
      // First save the profile
      await apiRequest("POST", "/api/style-profile", profileData);
      
      // If this is a new profile (not editing) and occasions are selected, generate the first outfit
      if (!isEditing && answers.occasions.length > 0) {
        await apiRequest("POST", "/api/generate-outfits", {
          occasion: answers.occasions[0], // Use first selected occasion
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
      <RotatingBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      </RotatingBackground>
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
    // Prepare profile data with multi-select arrays
    const profileData = {
      personality: JSON.stringify(answers.personality),
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

  const updatePersonality = (trait: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        [trait]: value,
      },
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

  // Toggle multi-select array items (for checkboxes)
  const toggleArrayItem = (field: 'clothingItems' | 'occasions', value: string) => {
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

  return (
    <RotatingBackground className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4" data-testid="heading-quiz-title">
            {isEditing ? "Edit Your Style Profile" : "Style Discovery Quiz"}
          </h1>
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="w-6 h-6 text-purple-400 mr-2" />
            <span className="text-gray-300">Step {currentStep + 1} of {QUIZ_STEPS.length}</span>
          </div>
          <Progress value={progress} className="max-w-md mx-auto" data-testid="progress-quiz" />
          
          {/* Reset Button for users with existing profiles */}
          {existingProfile && (
            <Button 
              variant="outline"
              onClick={handleResetQuiz}
              className="mt-4 border-white/20 text-white hover:bg-white/10"
              data-testid="button-reset-quiz"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Quiz
            </Button>
          )}
        </div>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-quiz-step">
          <CardHeader>
            <CardTitle className="text-white text-2xl text-center">
              {currentStepData.title}
            </CardTitle>
            <p className="text-gray-300 text-center" data-testid="text-step-description">
              {currentStepData.description}
            </p>
          </CardHeader>
          <CardContent className="p-8">
            {/* Step 1: Frame Screen */}
            {currentStep === 0 && (
              <div className="text-center space-y-6 py-8">
                <p className="text-xl text-white/90">
                  Decisions shape presence. Aurra helps you choose.
                </p>
                <p className="text-gray-400">
                  Not a stylist. Not a trend engine. A thinking partner for what to wear when it matters.
                </p>
              </div>
            )}

            {/* Step 2: Why Are You Here? */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Label className="text-white text-lg mb-4 block">When do you usually need help deciding what to wear?</Label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "High-stakes meetings or rooms",
                    "Public appearances or speaking",
                    "Events where I don't want to disappear",
                    "Travel / unfamiliar environments",
                    "Daily leadership presence",
                    "I just want fewer wrong decisions"
                  ].map((option) => (
                    <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                      <Checkbox 
                        id={option}
                        checked={answers.occasions.includes(option)}
                        onCheckedChange={() => toggleArrayItem('occasions', option)}
                      />
                      <Label htmlFor={option} className="text-gray-200 cursor-pointer flex-1">{option}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Presence Goals */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Label className="text-white text-lg mb-4 block">What is the primary intent when you walk into a room?</Label>
                <RadioGroup value={answers.stylePreference} onValueChange={(value) => updateAnswer('stylePreference', value)}>
                  {[
                    "To command and lead",
                    "To be remembered with clarity",
                    "To build trust and connection",
                    "To signal restraint and focus",
                    "To disappear into the work"
                  ].map((option) => (
                    <div key={option} className="flex items-center space-x-2 p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="text-gray-200 cursor-pointer flex-1">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 4: First Decision */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Label className="text-white text-lg mb-4 block">What are you choosing for right now?</Label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "A room with power (High-stakes meeting)",
                    "A stage or podium (Public speaking)",
                    "A first impression (Key meeting)",
                    "Travel (High visibility / unknown)",
                    "Daily leadership (The routine that matters)"
                  ].map((option) => (
                    <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                      <Checkbox 
                        id={option}
                        checked={answers.occasions.includes(option)}
                        onCheckedChange={() => toggleArrayItem('occasions', option)}
                      />
                      <Label htmlFor={option} className="text-gray-200 cursor-pointer flex-1">{option}</Label>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-400/20">
                  <p className="text-purple-200 text-sm">
                    💡 <strong>Aurra will provide your first decision immediately.</strong>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 0}
            className="border-white/20 text-white hover:bg-white/10"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={saveProfileMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            data-testid="button-next"
          >
            {saveProfileMutation.isPending ? (
              "Saving..."
            ) : currentStep === QUIZ_STEPS.length - 1 ? (
              "Complete Quiz"
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </RotatingBackground>
  );
}
