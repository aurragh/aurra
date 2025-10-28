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
    id: "personality",
    title: "Your Personality",
    description: "Tell us about your style personality",
  },
  {
    id: "bodyType",
    title: "Body Type",
    description: "Help us recommend flattering silhouettes",
  },
  {
    id: "preferences",
    title: "Style Preferences",
    description: "What styles speak to you?",
  },
  {
    id: "lifestyle",
    title: "Lifestyle",
    description: "How do you live and work?",
  },
  {
    id: "budget",
    title: "Budget & Shopping",
    description: "What's your fashion budget?",
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
      await apiRequest("POST", "/api/style-profile", profileData);
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Style Profile Updated!" : "Style Profile Saved!",
        description: "Your personalized recommendations are ready.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/style-profile"] });
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
            {/* Step 1: Personality */}
            {currentStep === 0 && (
              <div className="space-y-6" data-testid="step-personality">
                <div>
                  <Label className="text-white text-lg mb-4 block">How would you describe your style?</Label>
                  <RadioGroup 
                    value={answers.personality.style} 
                    onValueChange={(value) => updatePersonality('style', value)}
                  >
                    {['Classic & Timeless', 'Trendy & Fashion-Forward', 'Bohemian & Free-Spirited', 'Minimalist & Clean', 'Edgy & Bold'].map((option) => (
                      <div key={option} className="flex items-center space-x-2" data-testid={`radio-style-${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="text-gray-200">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-white text-lg mb-4 block">What's your confidence level with fashion?</Label>
                  <RadioGroup 
                    value={answers.personality.confidence} 
                    onValueChange={(value) => updatePersonality('confidence', value)}
                  >
                    {['I love experimenting with new styles', 'I prefer safe, classic choices', 'I need guidance to feel confident', 'I enjoy mixing classic with trendy'].map((option) => (
                      <div key={option} className="flex items-center space-x-2" data-testid={`radio-confidence-${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="text-gray-200">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 2: Body Type */}
            {currentStep === 1 && (
              <div data-testid="step-body-type">
                <Label className="text-white text-lg mb-6 block">What's your body type?</Label>
                <RadioGroup value={answers.bodyType} onValueChange={(value) => updateAnswer('bodyType', value)}>
                  {['Apple', 'Pear', 'Hourglass', 'Rectangle', 'Inverted Triangle', 'Prefer not to specify'].map((type) => (
                    <div key={type} className="flex items-center space-x-2" data-testid={`radio-body-type-${type.toLowerCase().replace(/\s/g, '-')}`}>
                      <RadioGroupItem value={type} id={type} />
                      <Label htmlFor={type} className="text-gray-200">{type}</Label>
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-gray-400 text-sm mt-4">
                  This helps us recommend the most flattering silhouettes for you.
                </p>
              </div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 2 && (
              <div className="space-y-6" data-testid="step-preferences">
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

                <div>
                  <Label className="text-white text-lg mb-4 block">What's your primary style preference?</Label>
                  <RadioGroup value={answers.stylePreference} onValueChange={(value) => updateAnswer('stylePreference', value)}>
                    {['Casual & Comfortable', 'Professional & Polished', 'Feminine & Romantic', 'Sporty & Active', 'Vintage & Retro', 'Streetwear & Urban', 'Formal & Elegant', 'Artistic & Creative'].map((style) => (
                      <div key={style} className="flex items-center space-x-2" data-testid={`radio-style-${style.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        <RadioGroupItem value={style} id={style} />
                        <Label htmlFor={style} className="text-gray-200">{style}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 4: Lifestyle */}
            {currentStep === 3 && (
              <div className="space-y-6" data-testid="step-lifestyle">
                <div>
                  <Label className="text-white text-lg mb-4 block">What's your work environment?</Label>
                  <RadioGroup 
                    value={answers.lifestyle.work} 
                    onValueChange={(value) => updateLifestyle('work', value)}
                  >
                    {['Corporate/Office', 'Creative/Casual', 'Work from Home', 'Customer-Facing', 'Outdoor/Physical', 'Freelance/Flexible'].map((option) => (
                      <div key={option} className="flex items-center space-x-2" data-testid={`radio-work-${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="text-gray-200">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-white text-lg mb-4 block">How active is your lifestyle?</Label>
                  <RadioGroup 
                    value={answers.lifestyle.activity} 
                    onValueChange={(value) => updateLifestyle('activity', value)}
                  >
                    {['Very Active (Daily workouts)', 'Moderately Active (Few times/week)', 'Occasionally Active', 'Prefer Low-Impact Activities', 'Mostly Sedentary'].map((option) => (
                      <div key={option} className="flex items-center space-x-2" data-testid={`radio-activity-${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="text-gray-200">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 5: Budget & Occasions */}
            {currentStep === 4 && (
              <div className="space-y-6" data-testid="step-budget">
                <div>
                  <Label className="text-white text-lg mb-4 block">What's your typical budget for clothing?</Label>
                  <RadioGroup value={answers.budget} onValueChange={(value) => updateAnswer('budget', value)}>
                    {['Under $50 per item', '$50-$100 per item', '$100-$200 per item', '$200-$500 per item', '$500+ per item', 'Budget varies by item'].map((option) => (
                      <div key={option} className="flex items-center space-x-2" data-testid={`radio-budget-${option.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="text-gray-200">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-white text-lg mb-4 block">What occasion do you want your first outfit for?</Label>
                  <RadioGroup value={answers.occasion} onValueChange={(value) => updateAnswer('occasion', value)}>
                    {[
                      { value: 'work', label: 'Work/Professional' },
                      { value: 'casual', label: 'Casual Daily Wear' },
                      { value: 'date-night', label: 'Date Night' },
                      { value: 'social-events', label: 'Social Events' },
                      { value: 'travel', label: 'Travel' },
                      { value: 'workout', label: 'Workout/Active' },
                      { value: 'formal', label: 'Formal Events' },
                      { value: 'weekend', label: 'Weekend Outings' }
                    ].map((occasion) => (
                      <div key={occasion.value} className="flex items-center space-x-2" data-testid={`radio-occasion-${occasion.value}`}>
                        <RadioGroupItem value={occasion.value} id={occasion.value} />
                        <Label htmlFor={occasion.value} className="text-gray-200">{occasion.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <p className="text-gray-400 text-sm mt-4">
                    Don't worry - you can generate outfits for other occasions later!
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
