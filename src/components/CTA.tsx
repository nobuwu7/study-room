import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 px-6 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,150,100,0.1),transparent_70%)]" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
          Ready to Transform Your
          <span className="block bg-gradient-warm bg-clip-text text-transparent">
            Study Experience?
          </span>
        </h2>
        
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Join thousands of students who are studying smarter, not harder. Your cozy virtual study room awaits.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-gradient-warm hover:shadow-warm transition-all duration-300 hover:scale-105 group"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6 border-2 hover:bg-muted/50 transition-all duration-300"
          >
            Watch Demo
          </Button>
        </div>
        
        <p className="mt-8 text-sm text-muted-foreground">
          No credit card required • Free forever • Start in seconds
        </p>
      </div>
    </section>
  );
};

export default CTA;
