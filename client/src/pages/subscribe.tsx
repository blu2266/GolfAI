import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, Star, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useSearch } from "wouter";

// Stripe price IDs - these should be created in your Stripe dashboard
const PRICE_IDS = {
  weekly: import.meta.env.VITE_STRIPE_PRICE_ID_WEEKLY || "price_weekly_placeholder",
  monthly: import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY || "price_monthly_placeholder",
  yearly: import.meta.env.VITE_STRIPE_PRICE_ID_YEARLY || "price_yearly_placeholder"
};

interface SubscriptionStatus {
  freeAnalysesUsed: number;
  freeAnalysesRemaining: number;
  hasActiveSubscription: boolean;
  subscriptionStatus?: string;
  subscriptionTier?: string;
  subscriptionEndDate?: string;
}

export default function Subscribe() {
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);
  
  const { data: status, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription-status"],
  });
  
  const createCheckout = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/create-subscription-checkout", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  useEffect(() => {
    if (params.get('canceled') === 'true') {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription checkout was canceled.",
        variant: "destructive",
      });
    }
  }, [params, toast]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  const plans = [
    {
      name: "Weekly",
      price: "$5",
      period: "per week",
      priceId: PRICE_IDS.weekly,
      icon: <Zap className="w-8 h-8 text-blue-500" />,
      features: [
        "Unlimited swing analyses",
        "Full analysis history",
        "Performance tracking",
        "All premium features"
      ],
      recommended: false
    },
    {
      name: "Monthly",
      price: "$10",
      period: "per month",
      priceId: PRICE_IDS.monthly,
      icon: <Star className="w-8 h-8 text-golf-green" />,
      features: [
        "Unlimited swing analyses",
        "Full analysis history",
        "Performance tracking",
        "All premium features",
        "Save 50% vs weekly"
      ],
      recommended: true
    },
    {
      name: "Yearly",
      price: "$80",
      period: "per year",
      priceId: PRICE_IDS.yearly,
      icon: <Crown className="w-8 h-8 text-golden" />,
      features: [
        "Unlimited swing analyses",
        "Full analysis history",
        "Performance tracking",
        "All premium features",
        "Save 33% vs monthly",
        "Best value!"
      ],
      recommended: false
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-golf-green/5 to-white pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-8 text-center">
        <h1 className="text-3xl font-bold text-deep-navy mb-2">Choose Your Plan</h1>
        <p className="text-slate-600">
          Get unlimited swing analyses with our premium membership
        </p>
      </div>
      
      {/* Current Status */}
      {status && !status.hasActiveSubscription && (
        <div className="px-4 mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-deep-navy mb-2">
                  Free Analyses Used: {status.freeAnalysesUsed} / 3
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-golf-green h-2 rounded-full transition-all"
                    style={{ width: `${(status.freeAnalysesUsed / 3) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600">
                  {status.freeAnalysesRemaining > 0 
                    ? `${status.freeAnalysesRemaining} free analyses remaining`
                    : "All free analyses used - subscribe for unlimited access!"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Active Subscription */}
      {status?.hasActiveSubscription && (
        <div className="px-4 mb-6">
          <Card className="bg-golf-green/10 border-golf-green/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-golf-green mx-auto mb-3" />
                <p className="text-lg font-semibold text-deep-navy mb-2">
                  Active {status.subscriptionTier} Subscription
                </p>
                <p className="text-sm text-slate-600">
                  Enjoy unlimited swing analyses!
                </p>
                {status.subscriptionEndDate && (
                  <p className="text-xs text-slate-500 mt-2">
                    Next billing date: {new Date(status.subscriptionEndDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Subscription Plans */}
      {!status?.hasActiveSubscription && (
        <div className="px-4 space-y-4">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.recommended ? 'ring-2 ring-golf-green' : ''}`}
            >
              {plan.recommended && (
                <Badge className="absolute -top-3 right-4 bg-golf-green text-white">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {plan.icon}
                    <div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>
                        <span className="text-2xl font-bold text-deep-navy">{plan.price}</span>
                        <span className="text-slate-600 ml-1">{plan.period}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => createCheckout.mutate(plan.priceId)}
                    disabled={createCheckout.isPending}
                    variant={plan.recommended ? "default" : "outline"}
                    className="min-w-[100px]"
                  >
                    {createCheckout.isPending ? "Loading..." : "Subscribe"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-golf-green mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Benefits */}
      <div className="px-4 mt-8">
        <Card className="bg-gradient-to-r from-deep-navy to-deep-navy/90 text-white">
          <CardHeader>
            <CardTitle className="text-xl text-white">Why Subscribe?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-golf-green mt-0.5" />
              <div>
                <p className="font-semibold">Unlimited Analyses</p>
                <p className="text-sm text-gray-300">Analyze as many swings as you want</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-golf-green mt-0.5" />
              <div>
                <p className="font-semibold">Track Progress</p>
                <p className="text-sm text-gray-300">See your improvement over time</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-golf-green mt-0.5" />
              <div>
                <p className="font-semibold">Cancel Anytime</p>
                <p className="text-sm text-gray-300">No commitment, cancel whenever you want</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}