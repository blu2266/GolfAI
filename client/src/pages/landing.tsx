import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Target, TrendingUp, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            AI-Powered Golf Analysis
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Perfect Your Golf Swing with
            <span className="text-green-600 dark:text-green-400"> SwingAI</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Upload your golf swing videos and get instant, professional-level analysis. 
            Track your progress, manage your clubs, and improve your game with AI-powered insights.
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Play className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Video Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload swing videos and get detailed AI analysis of your technique
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <CardTitle>Personalized Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Receive customized recommendations to improve your swing mechanics
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-2" />
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor your improvement over time with detailed analytics
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-orange-600 mx-auto mb-2" />
              <CardTitle>Club Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organize your golf bag and track performance by club type
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Video</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Record your golf swing and upload the video to our platform
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI analyzes your swing mechanics in real-time
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Insights</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Receive detailed feedback and personalized improvement tips
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Improve Your Game?</CardTitle>
              <CardDescription>
                Join thousands of golfers who are already using SwingAI to perfect their technique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.href = "/api/login"}
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Start Your Free Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}