import FeatureCard from "./FeatureCard";
import { 
  LineChart, 
  ListChecks, 
  Calendar, 
  Share2, 
  Users, 
  Timer, 
  Heart, 
  BarChart3 
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: LineChart,
      title: "Track Everything",
      description: "Monitor your study sessions, homework, and habits effortlessly. See your progress at a glance with beautiful, easy-to-read charts.",
      gradient: "warm" as const,
    },
    {
      icon: ListChecks,
      title: "Top 3 Tasks",
      description: "Focus on what matters most. Prioritize your daily top 3 tasks and tackle them one by one without feeling overwhelmed.",
      gradient: "calm" as const,
    },
    {
      icon: Calendar,
      title: "Personalized Study Schedules",
      description: "Get custom study plans that adapt to your learning style and busy schedule. We'll help you find the perfect balance.",
      gradient: "warm" as const,
    },
    {
      icon: Share2,
      title: "Quick Share Study Resources",
      description: "Organize and manage your study materials with Bibliotheca. Keep your notes, links, and resources in one place.",
      gradient: "calm" as const,
    },
    {
      icon: Timer,
      title: "Set Focus Timers",
      description: "Use Pomodoro or custom timers to maintain focus. Work in sprints, take breaks, and maximize your productivity.",
      gradient: "warm" as const,
    },
    {
      icon: Heart,
      title: "Mental Health Support",
      description: "Take care of your wellbeing with mindfulness reminders, break suggestions, and stress management tips.",
      gradient: "warm" as const,
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Understand your study patterns with detailed insights. Discover when you're most productive and optimize your routine.",
      gradient: "calm" as const,
    },
  ];

  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Everything You Need to
            <span className="block bg-gradient-warm bg-clip-text text-transparent">
              Succeed in Your Studies
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From tracking to analytics, we've got all the tools to make studying easier, smarter, and more enjoyable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
