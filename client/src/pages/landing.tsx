import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Target, TrendingUp, Users, Zap, Brain, Activity } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen relative cyber-grid overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-neon-green/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-electric-blue/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyber-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 glass border-neon-green/30 bg-neon-green/10 text-neon-green animate-pulse-neon">
            <Zap className="w-3 h-3 mr-1 inline" />
            QUANTUM GOLF ANALYSIS
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="block neon-green mb-2">SWING</span>
            <span className="block text-8xl md:text-9xl gradient-primary bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto neon-blue">
            Neural Network Golf Intelligence • Real-Time Motion Analysis
          </p>
          <p className="text-lg text-foreground/70 mb-12 max-w-2xl mx-auto">
            Transform your game with advanced biomechanical analysis powered by cutting-edge artificial intelligence
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            size="lg" 
            className="gradient-primary text-deep-space px-10 py-6 text-lg font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(0,255,127,0.4)] hover:shadow-[0_0_60px_rgba(0,255,127,0.6)]"
          >
            <span className="flex items-center gap-3">
              <Brain className="w-5 h-5" />
              INITIALIZE SYSTEM
              <Activity className="w-5 h-5 animate-pulse" />
            </span>
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center glass glass-hover gradient-border group">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,255,127,0.3)] group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-deep-space" />
              </div>
              <CardTitle className="neon-green">Motion Capture</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-foreground/70">
                Quantum-precision video analysis with frame-by-frame biomechanical tracking
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center glass glass-hover gradient-border group">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 gradient-accent rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform">
                <Target className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="neon-blue">Neural Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-foreground/70">
                AI-generated recommendations adapted to your unique biomechanics
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center glass glass-hover gradient-border group">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 bg-cyber-purple rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="neon-purple">Data Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-foreground/70">
                Real-time performance metrics with predictive improvement modeling
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center glass glass-hover gradient-border group">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 holographic rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-foreground">Equipment Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-foreground/70">
                Advanced club telemetry and performance optimization algorithms
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 neon-green">
            SYSTEM PROTOCOL
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center glass p-8 rounded-2xl tech-border">
              <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(0,255,127,0.4)] animate-pulse-neon">
                <span className="text-3xl font-bold text-deep-space">01</span>
              </div>
              <h3 className="text-xl font-bold mb-4 neon-green">CAPTURE</h3>
              <p className="text-foreground/70">
                Initialize video capture sequence and upload biomechanical data stream
              </p>
            </div>
            <div className="text-center glass p-8 rounded-2xl tech-border">
              <div className="w-20 h-20 gradient-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(59,130,246,0.4)] animate-pulse-neon" style={{ animationDelay: '0.5s' }}>
                <span className="text-3xl font-bold text-white">02</span>
              </div>
              <h3 className="text-xl font-bold mb-4 neon-blue">PROCESS</h3>
              <p className="text-foreground/70">
                Neural network analyzes motion vectors with quantum precision algorithms
              </p>
            </div>
            <div className="text-center glass p-8 rounded-2xl tech-border">
              <div className="w-20 h-20 bg-cyber-purple rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(168,85,247,0.4)] animate-pulse-neon" style={{ animationDelay: '1s' }}>
                <span className="text-3xl font-bold text-white">03</span>
              </div>
              <h3 className="text-xl font-bold mb-4 neon-purple">OPTIMIZE</h3>
              <p className="text-foreground/70">
                Receive quantum-computed recommendations for maximum performance gain
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto glass gradient-border relative overflow-hidden">
            <div className="absolute inset-0 holographic opacity-10" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-3xl mb-4">
                <span className="gradient-primary bg-clip-text text-transparent">READY TO TRANSCEND?</span>
              </CardTitle>
              <CardDescription className="text-lg text-foreground/80">
                Join the quantum revolution in golf performance optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <Button 
                onClick={() => window.location.href = "/api/login"}
                size="lg" 
                className="gradient-accent text-white px-12 py-6 text-lg font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:shadow-[0_0_70px_rgba(59,130,246,0.7)]"
              >
                <span className="flex items-center gap-3">
                  ENGAGE NEURAL INTERFACE
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Scan line effect */}
      <div className="scan-line" />
    </div>
  );
}