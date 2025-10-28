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
    id: "style",
    title: "Your Style",
    description: "Tell us about your fashion personality",
  },
  {
    id: "bodyType",
    title: "Body & Colors",
    description: "Help us find your perfect fit and palette",
  },
  {
    id: "lifestyle",
    title: "Lifestyle & Budget",
    description: "Match your wardrobe to your life",
  },
  {
    id: "firstOutfit",
    title: "First Outfit",
    description: "Choose what to generate first",
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
    colorPreference: "", // Changed to single selection
    stylePreference: "", // Changed to single selection
    lifestyle: {} as Record<string, string>,
    budget: "",
    occasion: "", // Changed to single selection for initial outfit
  });

  // Fetch existing style profile
  const { data: existingProfile } = useQuery<StyleProfile>({
    queryKey: ["/api/style-profile"],
    enabled: !!user,
  });

  // Pre-fill form with existing profile data
  useEffect(() => {
    if (existingProfile && !isEditing) {
      // Parse arrays and get first element for single selections
      const colorPrefs = JSON.parse(existingProfile.colorPreferences || '[]');
      const stylePrefs = JSON.parse(existingProfile.stylePreferences || '[]');
      const occasions = JSON.parse(existingProfile.occasions || '[]');
      
      setAnswers({
        personality: JSON.parse(existingProfile.personality || '{}'),
        bodyType: existingProfile.bodyType || "",
        colorPreference: colorPrefs[0] || "", // Take first if array
        stylePreference: stylePrefs[0] || "", // Take first if array  
        lifestyle: JSON.parse(existingProfile.lifestyle || '{}'),
        budget: existingProfile.budget || "",
        occasion: occasions[0] || "", // Take first if array
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
      lifestyle: {},
      budget: "",
      occasion: "",
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
      
      // If this is a new profile (not editing) and an occasion is selected, generate the first outfit
      if (!isEditing && answers.occasion) {
        await apiRequest("POST", "/api/generate-outfits", {
          occasion: answers.occasion,
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
          description: answers.occasion ? "Generating your first outfit..." : "Your style profile is ready.",
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
    // Convert single selections to arrays for backward compatibility  
    const profileData = {
      personality: JSON.stringify(answers.personality),
      bodyType: answers.bodyType,
      colorPreferences: JSON.stringify([answers.colorPreference].filter(Boolean)),
      stylePreferences: JSON.stringify([answers.stylePreference].filter(Boolean)),
      lifestyle: JSON.stringify(answers.lifestyle),
      budget: answers.budget,
      occasions: JSON.stringify([answers.occasion].filter(Boolean)),
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

  // Removed toggleArrayItem function since we're using single selections now

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
            {/* Step 1: Style & Preference */}
            {currentStep === 0 && (
              <div className="space-y-6" data-testid="step-style">
                <div>
                  <Label className="text-white text-lg mb-4 block">How would you describe your style personality?</Label>
                  <RadioGroup 
                    value={answers.stylePreference} 
                    onValueChange={(value) => updateAnswer('stylePreference', value)}
                  >
                    {['Classic & Timeless', 'Trendy & Fashion-Forward', 'Bohemian & Free-Spirited', 'Minimalist & Clean', 'Edgy & Bold', 'Casual & Comfortable', 'Professional & Polished', 'Artistic & Creative'].map((option) => (
                      <div key={option} className="flex items-center space-x-2" data-testid={`radio-style-${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="text-gray-200">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 2: Body Type & Colors */}
            {currentStep === 1 && (
              <div className="space-y-6" data-testid="step-body-colors">
                <div>
                  <Label className="text-white text-lg mb-4 block">What's your body type?</Label>
                  <RadioGroup value={answers.bodyType} onValueChange={(value) => updateAnswer('bodyType', value)}>
                    {['Apple', 'Pear', 'Hourglass', 'Rectangle', 'Inverted Triangle', 'Prefer not to specify'].map((type) => (
                      <div key={type} className="flex items-center space-x-2" data-testid={`radio-body-type-${type.toLowerCase().replace(/\s/g, '-')}`}>
                        <RadioGroupItem value={type} id={type} />
                        <Label htmlFor={type} className="text-gray-200">{type}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-white text-lg mb-4 block">What's your favorite color palette?</Label>
                  <RadioGroup value={answers.colorPreference} onValueChange={(value) => updateAnswer('colorPreference', value)}>
                    {['Neutral (Black, White, Gray)', 'Earth Tones (Brown, Beige, Tan)', 'Classic (Navy, White, Khaki)', 'Bold & Bright (Red, Yellow, Orange)', 'Cool Tones (Blue, Green, Purple)', 'Soft & Pastel (Pink, Lavender, Mint)'].map((color) => (
                      <div key={color} className="flex items-center space-x-2" data-testid={`radio-color-${color.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        <RadioGroupItem value={color} id={color} />
                        <Label htmlFor={color} className="text-gray-200">{color}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 3: Lifestyle & Budget */}
            {currentStep === 2 && (
              <div className="space-y-6" data-testid="step-lifestyle-budget">
                <div>
                  <Label className="text-white text-lg mb-4 block">What's your primary lifestyle?</Label>
                  <RadioGroup 
                    value={answers.lifestyle.work} 
                    onValueChange={(value) => updateLifestyle('work', value)}
                  >
                    {['Corporate Professional', 'Creative Professional', 'Student', 'Stay-at-home Parent', 'Active/Outdoors', 'Social Butterfly'].map((option) => (
                      <div key={option} className="flex items-center space-x-2" data-testid={`radio-work-${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="text-gray-200">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-white text-lg mb-4 block">What's your typical clothing budget?</Label>
                  <RadioGroup value={answers.budget} onValueChange={(value) => updateAnswer('budget', value)}>
                    {['Under $50 per item', '$50-$100 per item', '$100-$200 per item', '$200-$500 per item', '$500+ per item'].map((option) => (
                      <div key={option} className="flex items-center space-x-2" data-testid={`radio-budget-${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="text-gray-200">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 4: First Outfit Selection */}
            {currentStep === 3 && (
              <div className="space-y-6" data-testid="step-first-outfit">
                <div>
                  <Label className="text-white text-lg mb-4 block">Choose an occasion for your first AI-generated outfit</Label>
                  <RadioGroup value={answers.occasion} onValueChange={(value) => updateAnswer('occasion', value)}>
                    {[
                      { value: 'work', label: 'Work/Professional', icon: '💼' },
                      { value: 'casual', label: 'Casual Daily', icon: '👕' },
                      { value: 'date-night', label: 'Date Night', icon: '💕' },
                      { value: 'social-events', label: 'Social Events', icon: '🎉' },
                      { value: 'travel', label: 'Travel', icon: '✈️' },
                      { value: 'formal', label: 'Formal Events', icon: '🤵' },
                      { value: 'weekend', label: 'Weekend', icon: '🌞' },
                      { value: 'workout', label: 'Workout', icon: '💪' }
                    ].map((occasion) => (
                      <div key={occasion.value} className="flex items-center space-x-3" data-testid={`radio-occasion-${occasion.value}`}>
                        <RadioGroupItem value={occasion.value} id={occasion.value} />
                        <Label htmlFor={occasion.value} className="text-gray-200 flex items-center">
                          <span className="mr-2">{occasion.icon}</span>
                          {occasion.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-400/20">
                    <p className="text-purple-200 text-sm">
                      💡 <strong>Your first outfit will be generated automatically!</strong> After that, you can create outfits for any occasion from your dashboard.
                    </p>
                  </div>
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
