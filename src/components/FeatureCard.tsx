import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: "warm" | "calm";
}

const FeatureCard = ({ icon: Icon, title, description, gradient = "warm" }: FeatureCardProps) => {
  const gradientClass = gradient === "warm" ? "bg-gradient-warm" : "bg-gradient-calm";
  
  return (
    <Card className="p-8 hover:shadow-warm transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card">
      <div className={`inline-flex p-4 rounded-2xl ${gradientClass} mb-6`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      
      <h3 className="text-2xl font-semibold mb-4 text-foreground">
        {title}
      </h3>
      
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </Card>
  );
};

export default FeatureCard;
