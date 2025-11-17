import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  BookOpen, 
  LogOut, 
  LineChart, 
  ListChecks, 
  Calendar, 
  Timer,
  Users,
  Heart,
  BarChart3,
  Share2 
} from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const features = [
    { icon: LineChart, title: 'Track Everything', color: 'bg-gradient-warm' },
    { icon: ListChecks, title: 'Top 3 Tasks', color: 'bg-gradient-calm' },
    { icon: Calendar, title: 'Study Schedules', color: 'bg-gradient-warm' },
    { icon: Share2, title: 'Share Resources', color: 'bg-gradient-calm' },
    { icon: Users, title: 'Collaboration', color: 'bg-gradient-warm' },
    { icon: Timer, title: 'Focus Timers', color: 'bg-gradient-calm' },
    { icon: Heart, title: 'Mental Health', color: 'bg-gradient-warm' },
    { icon: BarChart3, title: 'Analytics', color: 'bg-gradient-calm' },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-warm rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">StudyRoom</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Welcome back! 👋
          </h1>
          <p className="text-xl text-muted-foreground">
            Ready to make today productive? Let's get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-warm transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Coming soon
              </p>
            </Card>
          ))}
        </div>

        <Card className="mt-12 p-8 bg-gradient-hero border-border/50">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              🚀 Your Study Space is Ready!
            </h2>
            <p className="text-muted-foreground mb-6">
              We're building an amazing experience for you. Start exploring the features above, and more tools will be available soon to help you study smarter.
            </p>
            <Button 
              className="bg-gradient-warm hover:shadow-warm transition-all"
              onClick={() => toast.info('Feature coming soon! Stay tuned.')}
            >
              Get Started
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
