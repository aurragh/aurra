import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { 
  Sparkles, 
  Heart, 
  Star, 
  Award, 
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Info,
  RefreshCw,
  Trash2,
  Menu,
  Home,
  LogOut,
  User
} from "lucide-react";
import { type Outfit, type StyleCollection, type UserPoints, type StyleProfile } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentQuizStep, setCurrentQuizStep] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [generatingOutfits, setGeneratingOutfits] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({
    personality: {} as Record<string, string>,
    bodyType: "",
    colorPreferences: [] as string[],
    stylePreferences: [] as string[],
    lifestyle: {} as Record<string, string>,
    budget: "",
    occasions: [] as string[],
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
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
  }, [user, isLoading, toast]);

  const { data: outfits = [], refetch: refetchOutfits } = useQuery<Outfit[]>({
    queryKey: ["/api/outfits"],
    enabled: !!user,
  });

  const { data: collections = [] } = useQuery<StyleCollection[]>({
    queryKey: ["/api/collections"],
    enabled: !!user,
  });

  const { data: userPoints } = useQuery<UserPoints>({
    queryKey: ["/api/user/points"],
    enabled: !!user,
  });

  const { data: styleProfile } = useQuery<StyleProfile>({
    queryKey: ["/api/style-profile"],
    enabled: !!user,
  });

  // Show quiz if no completed profile OR if we're on the final generation step
  const showQuiz = (!styleProfile || !styleProfile.completed) || (currentQuizStep === 5 && !quizCompleted);

  const generateOutfitsMutation = useMutation({
    mutationFn: async (data: { occasion: string; count?: number }) => {
      const response = await apiRequest("POST", "/api/generate-outfits", data);
      return response.json();
    },
    onSuccess: () => {
      setGeneratingOutfits(false);
      toast({
        title: "Outfits Generated!",
        description: "Your personalized outfits are ready!",
      });
      refetchOutfits();
      queryClient.invalidateQueries({ queryKey: ["/api/user/points"] });
      setQuizCompleted(true);
    },
    onError: (error) => {
      setGeneratingOutfits(false);
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
        description: "Failed to generate outfits. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateOutfitsFromQuiz = (occasion: string) => {
    setGeneratingOutfits(true);
    generateOutfitsMutation.mutate({ occasion, count: 1 });
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      await apiRequest("POST", "/api/style-profile", profileData);
    },
    onSuccess: () => {
      toast({
        title: "Style Profile Saved!",
        description: "Choose an occasion to generate your first outfits!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/style-profile"] });
      setCurrentQuizStep(5); // Move to final step with occasion selection
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

  const deleteOutfitMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/outfits/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Outfit Deleted",
        description: "Outfit moved to trash. You can restore it within 30 days.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/outfits"] });
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
        description: "Failed to delete outfit",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/outfits/${id}/favorite`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Favorite Updated",
        description: "Outfit favorite status changed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/outfits"] });
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
        description: "Failed to update favorite",
        variant: "destructive",
      });
    },
  });

  const QUIZ_STEPS = [
    { id: "personality", title: "Your Personality", description: "Tell us about your style personality" },
    { id: "bodyType", title: "Body Type", description: "Help us recommend flattering silhouettes" },
    { id: "preferences", title: "Style Preferences", description: "What styles speak to you?" },
    { id: "lifestyle", title: "Lifestyle", description: "How do you live and work?" },
    { id: "budget", title: "Budget & Shopping", description: "What's your fashion budget?" },
    { id: "generate", title: "Generate Outfits", description: "Choose an occasion and create your personalized outfits" },
  ];

  const handleQuizNext = () => {
    if (currentQuizStep < 4) {
      setCurrentQuizStep(currentQuizStep + 1);
    } else if (currentQuizStep === 4) {
      handleQuizSubmit();
    }
  };

  const handleQuizBack = () => {
    if (currentQuizStep > 0) {
      setCurrentQuizStep(currentQuizStep - 1);
    }
  };

  const handleQuizSubmit = () => {
    const profileData = {
      personality: JSON.stringify(quizAnswers.personality),
      bodyType: quizAnswers.bodyType,
      colorPreferences: JSON.stringify(quizAnswers.colorPreferences),
      stylePreferences: JSON.stringify(quizAnswers.stylePreferences),
      lifestyle: JSON.stringify(quizAnswers.lifestyle),
      budget: quizAnswers.budget,
      occasions: JSON.stringify(quizAnswers.occasions),
      completed: true,
    };

    saveProfileMutation.mutate(profileData);
  };

  const updateQuizAnswer = (field: string, value: any) => {
    setQuizAnswers(prev => ({ ...prev, [field]: value }));
  };

  const updateQuizPersonality = (trait: string, value: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      personality: { ...prev.personality, [trait]: value },
    }));
  };

  const updateQuizLifestyle = (aspect: string, value: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, [aspect]: value },
    }));
  };

  const toggleQuizArrayItem = (field: 'colorPreferences' | 'stylePreferences' | 'occasions', item: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [field]: prev[field].includes(item) 
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  };

  const favoriteOutfits = outfits.filter((outfit) => outfit.isFavorite);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-black">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-black">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="heading-dashboard">
                Aurra AI
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="button-menu">
                    <Menu className="w-5 h-5 mr-2" />
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900 text-white border-gray-700">
                  <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <Link href="/landing">
                    <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer" data-testid="menu-item-landing">
                      <Home className="mr-2 h-4 w-4" />
                      <span>View Landing Page</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/dashboard">
                    <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer" data-testid="menu-item-dashboard">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/trash">
                    <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer" data-testid="menu-item-trash">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Trash</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = "/api/logout"}
                    className="hover:bg-gray-800 cursor-pointer text-red-400"
                    data-testid="menu-item-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Style Quiz - primary interface when no completed profile */}
        {showQuiz && (
          <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border-purple-400/30 mb-8" data-testid="card-style-quiz">
            <CardHeader className="text-center">
              <CardTitle className="text-white text-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 mr-3 text-purple-400" />
                Complete Your Style Profile
              </CardTitle>
              <p className="text-gray-300">{QUIZ_STEPS[currentQuizStep].description}</p>
              <div className="mt-4">
                <Progress 
                  value={((currentQuizStep + 1) / QUIZ_STEPS.length) * 100} 
                  className="max-w-md mx-auto" 
                  data-testid="progress-quiz" 
                />
                <p className="text-gray-400 text-sm mt-2">
                  Step {currentQuizStep + 1} of {QUIZ_STEPS.length}: {QUIZ_STEPS[currentQuizStep].title}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="max-w-2xl mx-auto">
                {/* Step 1: Personality */}
                {currentQuizStep === 0 && (
                  <div className="space-y-6" data-testid="step-personality">
                    <div>
                      <Label className="text-white text-lg mb-4 block">How would you describe your style?</Label>
                      <RadioGroup 
                        value={quizAnswers.personality.style} 
                        onValueChange={(value) => updateQuizPersonality('style', value)}
                      >
                        {['Classic & Timeless', 'Trendy & Fashion-Forward', 'Bohemian & Free-Spirited', 'Minimalist & Clean', 'Edgy & Bold'].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={option} />
                            <Label htmlFor={option} className="text-gray-200">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="text-white text-lg mb-4 block">What's your confidence level with fashion?</Label>
                      <RadioGroup 
                        value={quizAnswers.personality.confidence} 
                        onValueChange={(value) => updateQuizPersonality('confidence', value)}
                      >
                        {['I love experimenting with new styles', 'I prefer safe, classic choices', 'I need guidance to feel confident', 'I enjoy mixing classic with trendy'].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={option} />
                            <Label htmlFor={option} className="text-gray-200">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Step 2: Body Type */}
                {currentQuizStep === 1 && (
                  <div data-testid="step-body-type">
                    <Label className="text-white text-lg mb-6 block">What's your body type?</Label>
                    <RadioGroup value={quizAnswers.bodyType} onValueChange={(value) => updateQuizAnswer('bodyType', value)}>
                      {['Apple', 'Pear', 'Hourglass', 'Rectangle', 'Inverted Triangle', 'Prefer not to specify'].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <RadioGroupItem value={type} id={type} />
                          <Label htmlFor={type} className="text-gray-200">{type}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <div className="flex items-start mt-4 p-4 bg-blue-600/20 rounded-lg">
                      <Info className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-blue-200 text-sm">
                        This helps us recommend the most flattering silhouettes for you.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Preferences */}
                {currentQuizStep === 2 && (
                  <div className="space-y-8" data-testid="step-preferences">
                    <div>
                      <Label className="text-white text-lg mb-4 block">What colors do you love? (Select all that apply)</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['Black', 'White', 'Navy', 'Gray', 'Beige', 'Brown', 'Red', 'Pink', 'Blue', 'Green', 'Yellow', 'Purple'].map((color) => (
                          <div key={color} className="flex items-center space-x-2">
                            <Checkbox 
                              checked={quizAnswers.colorPreferences.includes(color)}
                              onCheckedChange={() => toggleQuizArrayItem('colorPreferences', color)}
                              id={color}
                            />
                            <Label htmlFor={color} className="text-gray-200">{color}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-white text-lg mb-4 block">Style preferences (Select all that apply)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['Casual & Comfortable', 'Professional & Polished', 'Feminine & Romantic', 'Sporty & Active', 'Vintage & Retro', 'Streetwear & Urban', 'Formal & Elegant', 'Artistic & Creative'].map((style) => (
                          <div key={style} className="flex items-center space-x-2">
                            <Checkbox 
                              checked={quizAnswers.stylePreferences.includes(style)}
                              onCheckedChange={() => toggleQuizArrayItem('stylePreferences', style)}
                              id={style}
                            />
                            <Label htmlFor={style} className="text-gray-200">{style}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Lifestyle */}
                {currentQuizStep === 3 && (
                  <div className="space-y-6" data-testid="step-lifestyle">
                    <div>
                      <Label className="text-white text-lg mb-4 block">What's your work environment?</Label>
                      <RadioGroup 
                        value={quizAnswers.lifestyle.work} 
                        onValueChange={(value) => updateQuizLifestyle('work', value)}
                      >
                        {['Corporate/Office', 'Creative/Casual', 'Work from Home', 'Customer-Facing', 'Outdoor/Physical', 'Freelance/Flexible'].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={option} />
                            <Label htmlFor={option} className="text-gray-200">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="text-white text-lg mb-4 block">How active is your lifestyle?</Label>
                      <RadioGroup 
                        value={quizAnswers.lifestyle.activity} 
                        onValueChange={(value) => updateQuizLifestyle('activity', value)}
                      >
                        {['Very Active (Daily workouts)', 'Moderately Active (Few times/week)', 'Occasionally Active', 'Prefer Low-Impact Activities', 'Mostly Sedentary'].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={option} />
                            <Label htmlFor={option} className="text-gray-200">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Step 5: Budget & Occasions */}
                {currentQuizStep === 4 && (
                  <div className="space-y-6" data-testid="step-budget">
                    <div>
                      <Label className="text-white text-lg mb-4 block">What's your typical budget for clothing?</Label>
                      <RadioGroup value={quizAnswers.budget} onValueChange={(value) => updateQuizAnswer('budget', value)}>
                        {['Under $50 per item', '$50-$100 per item', '$100-$200 per item', '$200-$500 per item', '$500+ per item', 'Budget varies by item'].map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={option} />
                            <Label htmlFor={option} className="text-gray-200">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="text-white text-lg mb-4 block">What occasions do you need outfits for? (Select all that apply)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['Work/Professional', 'Casual Daily Wear', 'Date Night', 'Social Events', 'Travel', 'Workout/Active', 'Formal Events', 'Weekend Outings'].map((occasion) => (
                          <div key={occasion} className="flex items-center space-x-2">
                            <Checkbox 
                              checked={quizAnswers.occasions.includes(occasion)}
                              onCheckedChange={() => toggleQuizArrayItem('occasions', occasion)}
                              id={occasion}
                            />
                            <Label htmlFor={occasion} className="text-gray-200">{occasion}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Generate Outfits */}
                {currentQuizStep === 5 && (
                  <div className="text-center space-y-6" data-testid="step-generate">
                    <div className="flex items-center justify-center mb-6">
                      <Sparkles className="w-12 h-12 text-purple-400 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Ready to Generate Your Outfits!</h3>
                    <p className="text-gray-300 mb-6">Choose an occasion below and we'll create personalized outfits based on your style profile.</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      {[
                        { value: 'work', label: 'Work', icon: '💼' },
                        { value: 'casual', label: 'Casual', icon: '👕' },
                        { value: 'date-night', label: 'Date Night', icon: '💕' },
                        { value: 'social-events', label: 'Social', icon: '🎉' },
                        { value: 'travel', label: 'Travel', icon: '✈️' },
                        { value: 'formal', label: 'Formal', icon: '🤵' },
                        { value: 'weekend', label: 'Weekend', icon: '🌞' },
                        { value: 'workout', label: 'Workout', icon: '💪' },
                      ].map((occasion) => (
                        <Card 
                          key={occasion.value}
                          className={`cursor-pointer transition-all duration-200 hover:scale-105 bg-white/5 border-white/20 hover:border-purple-400 ${generatingOutfits ? 'opacity-50 pointer-events-none' : ''}`}
                          onClick={() => {
                            if (!generatingOutfits) {
                              handleGenerateOutfitsFromQuiz(occasion.value);
                            }
                          }}
                          data-testid={`occasion-${occasion.value}`}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl mb-2">{occasion.icon}</div>
                            <p className="text-white text-sm font-medium">{occasion.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {generatingOutfits && (
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-purple-200">Creating your personalized outfits...</p>
                        <p className="text-gray-400 text-sm mt-2">This may take 30-45 seconds</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            
            {/* Quiz Navigation */}
            {currentQuizStep < 5 && (
              <div className="flex justify-between px-8 pb-8">
                <Button 
                  variant="outline" 
                  onClick={handleQuizBack}
                  disabled={currentQuizStep === 0}
                  className="border-white/20 text-white hover:bg-white/10"
                  data-testid="button-quiz-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <Button 
                  onClick={handleQuizNext}
                  disabled={saveProfileMutation.isPending || (currentQuizStep === 4 && !quizAnswers.budget)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  data-testid="button-quiz-next"
                >
                  {saveProfileMutation.isPending ? (
                    "Saving..."
                  ) : currentQuizStep === 4 ? (
                    "Save Profile & Generate Outfits"
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Generated Outfits - shown after quiz completion */}
        {quizCompleted && outfits.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8" data-testid="card-generated-outfits">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
                Your Personalized Outfits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {outfits.slice(-3).map((outfit: any) => (
                  <Card key={outfit.id} className="bg-white/10 backdrop-blur-sm border-white/20 border-green-400/30" data-testid={`card-new-outfit-${outfit.id}`}>
                    <CardContent className="p-0">
                      {outfit.imageUrl && (
                        <div className="relative w-full h-48 mb-4">
                          <img 
                            src={outfit.imageUrl} 
                            alt={outfit.name}
                            className="w-full h-full object-cover rounded-t-lg"
                            data-testid={`img-new-outfit-${outfit.id}`}
                          />
                          <Badge className="absolute top-2 right-2 bg-green-600 text-white">New!</Badge>
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-1">{outfit.name}</h3>
                        <Badge 
                          variant="secondary" 
                          className="bg-purple-600/20 text-purple-200 mb-4"
                        >
                          {outfit.occasion}
                        </Badge>
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{outfit.description}</p>
                        
                        <div className="space-y-2">
                          <p className="text-gray-400 text-xs font-medium">Items:</p>
                          {JSON.parse(outfit.items || '[]').slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="text-xs text-gray-300">
                              <span className="font-medium">{item.category}:</span> {item.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Header - shown when quiz is completed */}
        {(quizCompleted || (!showQuiz && styleProfile?.completed)) && (
          <div className="mb-8">
            {/* Edit Profile Button */}
            <div className="flex justify-end mb-6">
              <Link href="/quiz">
                <Button 
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  data-testid="button-edit-profile"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Edit Style Profile
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-level">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Style Level</p>
                    <p className="text-2xl font-bold text-white">{userPoints?.level || 'Beginner'}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-purple-200 text-sm">{userPoints?.points || 0} points</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">Total: {userPoints?.totalEarned || 0}</span>
                    </div>
                  </div>
                  <Award className="w-10 h-10 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-outfits">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Total Outfits</p>
                    <p className="text-2xl font-bold text-white">{outfits.length}</p>
                    <p className="text-purple-200 text-sm">{favoriteOutfits.length} favorites</p>
                  </div>
                  <ShoppingBag className="w-10 h-10 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-stat-collections">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Collections</p>
                    <p className="text-2xl font-bold text-white">{collections.length}</p>
                    <p className="text-purple-200 text-sm">Style sets</p>
                  </div>
                  <Star className="w-10 h-10 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        )}

        {/* Generate More Outfits CTA for returning users */}
        {!showQuiz && styleProfile?.completed && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8" data-testid="card-generate-more">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
                Generate More Outfits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: 'work', label: 'Work', icon: '💼' },
                  { value: 'casual', label: 'Casual', icon: '👕' },
                  { value: 'date-night', label: 'Date Night', icon: '💕' },
                  { value: 'social-events', label: 'Social', icon: '🎉' },
                  { value: 'travel', label: 'Travel', icon: '✈️' },
                  { value: 'formal', label: 'Formal', icon: '🤵' },
                  { value: 'weekend', label: 'Weekend', icon: '🌞' },
                  { value: 'workout', label: 'Workout', icon: '💪' },
                ].map((occasion) => (
                  <Card 
                    key={occasion.value}
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 bg-white/5 border-white/20 hover:border-purple-400 ${generateOutfitsMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => {
                      if (!generateOutfitsMutation.isPending) {
                        generateOutfitsMutation.mutate({ occasion: occasion.value, count: 1 });
                      }
                    }}
                    data-testid={`generate-more-${occasion.value}`}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{occasion.icon}</div>
                      <p className="text-white text-sm font-medium">{occasion.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {generateOutfitsMutation.isPending && (
                <div className="text-center mt-6">
                  <div className="animate-spin w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-purple-200 text-sm">Generating new outfits...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional tabs for managing outfits */}
        {(quizCompleted || (!showQuiz && styleProfile?.completed)) && outfits.length > 0 && (
          <Tabs defaultValue="outfits" className="space-y-6">
            <TabsList className="bg-white/10 border-white/20" data-testid="tabs-dashboard">
              <TabsTrigger value="outfits" className="data-[state=active]:bg-purple-600">
                All Outfits
              </TabsTrigger>
              <TabsTrigger value="favorites" className="data-[state=active]:bg-purple-600">
                Favorites
              </TabsTrigger>
            </TabsList>

            <TabsContent value="outfits" data-testid="tab-content-outfits">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {outfits.map((outfit: any) => (
                  <Card key={outfit.id} className="bg-white/10 backdrop-blur-sm border-white/20" data-testid={`card-outfit-${outfit.id}`}>
                    <CardContent className="p-0">
                      {outfit.imageUrl && (
                        <div className="relative w-full h-48 mb-4">
                          <img 
                            src={outfit.imageUrl} 
                            alt={outfit.name}
                            className="w-full h-full object-cover rounded-t-lg"
                            data-testid={`img-outfit-${outfit.id}`}
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">{outfit.name}</h3>
                            <Badge 
                              variant="secondary" 
                              className="bg-purple-600/20 text-purple-200"
                              data-testid={`badge-occasion-${outfit.id}`}
                            >
                              {outfit.occasion}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/10"
                              onClick={() => toggleFavoriteMutation.mutate(outfit.id)}
                              disabled={toggleFavoriteMutation.isPending}
                              data-testid={`button-favorite-${outfit.id}`}
                            >
                              <Heart 
                                className={`w-5 h-5 ${outfit.isFavorite ? 'fill-red-400 text-red-400' : 'text-gray-400'}`} 
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/10"
                              onClick={() => deleteOutfitMutation.mutate(outfit.id)}
                              disabled={deleteOutfitMutation.isPending}
                              data-testid={`button-delete-${outfit.id}`}
                            >
                              <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-400" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{outfit.description}</p>
                        
                        <div className="space-y-2">
                          <p className="text-gray-400 text-xs font-medium">Items:</p>
                          {JSON.parse(outfit.items || '[]').slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="text-xs text-gray-300" data-testid={`item-${outfit.id}-${index}`}>
                              <span className="font-medium">{item.category}:</span> {item.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="favorites" data-testid="tab-content-favorites">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteOutfits.length === 0 ? (
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 col-span-full" data-testid="card-no-favorites">
                    <CardContent className="p-12 text-center">
                      <Heart className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Favorites Yet</h3>
                      <p className="text-gray-300">Heart your favorite outfits to see them here!</p>
                    </CardContent>
                  </Card>
                ) : (
                  favoriteOutfits.map((outfit: any) => (
                    <Card key={outfit.id} className="bg-white/10 backdrop-blur-sm border-white/20 border-red-400/30" data-testid={`card-favorite-${outfit.id}`}>
                      <CardContent className="p-0">
                        {outfit.imageUrl && (
                          <div className="relative w-full h-48 mb-4">
                            <img 
                              src={outfit.imageUrl} 
                              alt={outfit.name}
                              className="w-full h-full object-cover rounded-t-lg"
                              data-testid={`img-favorite-${outfit.id}`}
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-1">{outfit.name}</h3>
                              <Badge 
                                variant="secondary" 
                                className="bg-purple-600/20 text-purple-200"
                                data-testid={`badge-favorite-occasion-${outfit.id}`}
                              >
                                {outfit.occasion}
                              </Badge>
                            </div>
                            <Heart className="w-5 h-5 fill-red-400 text-red-400" />
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-4 line-clamp-3">{outfit.description}</p>
                          
                          <div className="space-y-2">
                            <p className="text-gray-400 text-xs font-medium">Items:</p>
                            {JSON.parse(outfit.items || '[]').slice(0, 3).map((item: any, index: number) => (
                              <div key={index} className="text-xs text-gray-300" data-testid={`favorite-item-${outfit.id}-${index}`}>
                                <span className="font-medium">{item.category}:</span> {item.description}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}