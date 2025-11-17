import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-hero px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,150,100,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(100,200,200,0.08),transparent_50%)]" />
      
      <div className="relative z-10 max-w-5xl mx-auto text-center animate-fade-in">
        <div className="inline-flex items-center justify-center p-2 mb-6 bg-primary/10 rounded-full animate-float">
          <BookOpen className="w-16 h-16 text-primary" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
          Your Cozy Space to
          <span className="block bg-gradient-warm bg-clip-text text-transparent">
            Study Smarter
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
          Track your habits, stay focused, and ace your goals—all in one warm, welcoming virtual study room designed just for students like you.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-gradient-warm hover:shadow-warm transition-all duration-300 hover:scale-105"
          >
            Start Tracking
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6 border-2 hover:bg-muted/50 transition-all duration-300"
          >
            Explore Features
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
