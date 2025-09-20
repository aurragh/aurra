import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { 
  Sparkles, 
  Heart, 
  Trash2, 
  Plus, 
  Star, 
  Award, 
  TrendingUp,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Info
} from "lucide-react";
import { type Outfit, type StyleCollection, type UserPoints, type StyleProfile } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOccasion, setSelectedOccasion] = useState("");
  const [generatingOutfits, setGeneratingOutfits] = useState(false);
  const [showStyleQuiz, setShowStyleQuiz] = useState(false);
  const [currentQuizStep, setCurrentQuizStep] = useState(0);

  // Check for quiz URL parameter to auto-open quiz
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('quiz') === 'true') {
      setShowStyleQuiz(true);
      // Clear the URL parameter without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
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

  const generateOutfitsMutation = useMutation({
    mutationFn: async (data: { occasion: string; count?: number }) => {
      const response = await apiRequest("POST", "/api/generate-outfits", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Outfits Generated!",
        description: "Check out your new AI-styled looks.",
      });
      refetchOutfits();
      queryClient.invalidateQueries({ queryKey: ["/api/user/points"] });
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
        description: "Failed to generate outfits. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (outfitId: string) => {
      const response = await apiRequest("PATCH", `/api/outfits/${outfitId}/favorite`, {});
      return response.json();
    },
    onSuccess: () => {
      refetchOutfits();
      toast({
        title: "Favorite Updated",
        description: "Outfit favorite status updated.",
      });
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
        description: "Failed to update favorite. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleGenerateOutfits = () => {
    // Check if style profile is completed
    if (!styleProfile || !styleProfile.completed) {
      setShowStyleQuiz(true);
      return;
    }

    if (!selectedOccasion) {
      toast({
        title: "Select Occasion",
        description: "Please select an occasion to generate outfits for.",
        variant: "destructive",
      });
      return;
    }

    generateOutfitsMutation.mutate({ occasion: selectedOccasion, count: 3 });
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      await apiRequest("POST", "/api/style-profile", profileData);
    },
    onSuccess: () => {
      toast({
        title: "Style Profile Saved!",
        description: "Your personalized recommendations are ready.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/style-profile"] });
      setShowStyleQuiz(false);
      // Auto-generate outfits after completing quiz if occasion is selected
      if (selectedOccasion) {
        setTimeout(() => {
          generateOutfitsMutation.mutate({ occasion: selectedOccasion, count: 3 });
        }, 1000);
      }
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

  const favoriteOutfits = outfits.filter((outfit) => outfit.isFavorite);

  const QUIZ_STEPS = [
    { id: "personality", title: "Your Personality", description: "Tell us about your style personality" },
    { id: "bodyType", title: "Body Type", description: "Help us recommend flattering silhouettes" },
    { id: "preferences", title: "Style Preferences", description: "What styles speak to you?" },
    { id: "lifestyle", title: "Lifestyle", description: "How do you live and work?" },
    { id: "budget", title: "Budget & Shopping", description: "What's your fashion budget?" },
  ];

  const handleQuizNext = () => {
    if (currentQuizStep < QUIZ_STEPS.length - 1) {
      setCurrentQuizStep(currentQuizStep + 1);
    } else {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="heading-dashboard">
                Style Dashboard
              </h1>
            </div>
            
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => window.location.href = "/api/logout"}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Header */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                  <div className="mt-2">
                    <div className="flex items-start">
                      <Info className="w-3 h-3 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-400">
                        Earn points by generating outfits, completing your profile, and using premium features
                      </p>
                    </div>
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

        {/* Inline Style Quiz - shown when needed */}
        {showStyleQuiz && (
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
                  data-testid="progress-inline-quiz" 
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
                  <div className="space-y-6" data-testid="inline-step-personality">
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
                  <div data-testid="inline-step-body-type">
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
                  <div className="space-y-8" data-testid="inline-step-preferences">
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
                  <div className="space-y-6" data-testid="inline-step-lifestyle">
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
                  <div className="space-y-6" data-testid="inline-step-budget">
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
              </div>
            </CardContent>
            
            {/* Quiz Navigation */}
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
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost"
                  onClick={() => setShowStyleQuiz(false)}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                  data-testid="button-skip-quiz"
                >
                  Skip for now
                </Button>
                <Button 
                  onClick={handleQuizNext}
                  disabled={saveProfileMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  data-testid="button-quiz-next"
                >
                  {saveProfileMutation.isPending ? (
                    "Saving..."
                  ) : currentQuizStep === QUIZ_STEPS.length - 1 ? (
                    "Complete Profile"
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* AI Outfit Generator */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8" data-testid="card-outfit-generator">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
              AI Outfit Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="occasion" className="text-gray-300">Select Occasion</Label>
                <Select value={selectedOccasion} onValueChange={setSelectedOccasion}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white" data-testid="select-occasion">
                    <SelectValue placeholder="Choose an occasion..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work/Professional</SelectItem>
                    <SelectItem value="casual">Casual Daily Wear</SelectItem>
                    <SelectItem value="date-night">Date Night</SelectItem>
                    <SelectItem value="social-events">Social Events</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="formal">Formal Events</SelectItem>
                    <SelectItem value="weekend">Weekend Outings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleGenerateOutfits}
                disabled={generateOutfitsMutation.isPending || !selectedOccasion}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                data-testid="button-generate-outfits"
              >
                {generateOutfitsMutation.isPending ? (
                  "Generating..."
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Outfits
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="outfits" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20" data-testid="tabs-dashboard">
            <TabsTrigger value="outfits" className="data-[state=active]:bg-purple-600">
              My Outfits
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-purple-600">
              Favorites
            </TabsTrigger>
            <TabsTrigger value="collections" className="data-[state=active]:bg-purple-600">
              Collections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="outfits" data-testid="tab-content-outfits">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outfits.length === 0 ? (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 col-span-full" data-testid="card-no-outfits">
                  <CardContent className="p-12 text-center">
                    <ShoppingBag className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Outfits Yet</h3>
                    <p className="text-gray-300 mb-6">Generate your first AI-styled outfit to get started!</p>
                    <Button 
                      onClick={() => setShowStyleQuiz(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      Complete Style Quiz
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                outfits.map((outfit: any) => (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavoriteMutation.mutate(outfit.id)}
                            className="text-white hover:bg-white/10"
                            data-testid={`button-favorite-${outfit.id}`}
                          >
                            <Heart 
                              className={`w-5 h-5 ${outfit.isFavorite ? 'fill-red-400 text-red-400' : 'text-gray-400'}`} 
                            />
                          </Button>
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
                ))
              )}
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

          <TabsContent value="collections" data-testid="tab-content-collections">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.length === 0 ? (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 col-span-full" data-testid="card-no-collections">
                  <CardContent className="p-12 text-center">
                    <Star className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Collections Yet</h3>
                    <p className="text-gray-300 mb-6">Create collections to organize your favorite outfit combinations!</p>
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      data-testid="button-create-collection"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Collection
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                collections.map((collection: any) => (
                  <Card key={collection.id} className="bg-white/10 backdrop-blur-sm border-white/20" data-testid={`card-collection-${collection.id}`}>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-2">{collection.name}</h3>
                      <p className="text-gray-300 text-sm mb-4">{collection.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200 text-sm">
                          {JSON.parse(collection.outfitIds || '[]').length} outfits
                        </span>
                        {collection.nftMinted && (
                          <Badge variant="secondary" className="bg-green-600/20 text-green-200">
                            NFT Minted
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
