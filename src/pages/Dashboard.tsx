import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
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
import { TrackingDialog } from '@/components/TrackingDialog';
import { ActivityHistory } from '@/components/ActivityHistory';

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const { activeProfile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [activityKey, setActivityKey] = useState(0);

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

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !activeProfile) {
    return null;
  }

  const features = [
    { icon: LineChart, title: 'Track Everything', description: 'Monitor your study sessions and progress', color: 'bg-gradient-warm', onClick: () => setTrackingDialogOpen(true) },
    { icon: ListChecks, title: 'Top 3 Tasks', description: 'Focus on your daily priorities', color: 'bg-gradient-calm', onClick: () => navigate('/top-tasks') },
    { icon: Calendar, title: 'Study Schedules', description: 'AI-powered schedules with calendar sync', color: 'bg-gradient-warm', onClick: () => navigate('/study-schedule') },
    { icon: Share2, title: 'Bibliotheca', description: 'Personal & group resource library', color: 'bg-gradient-calm', onClick: () => navigate('/bibliotheca') },
    { icon: Timer, title: 'Focus Timers', description: 'Pomodoro timer for productivity', color: 'bg-gradient-warm', onClick: () => navigate('/focus-timer') },
    { icon: Heart, title: 'Mental Health', description: 'Wellness articles and resources', color: 'bg-gradient-calm', onClick: () => navigate('/mental-health') },
    { icon: BarChart3, title: 'Analytics', description: 'Visual insights into your study patterns', color: 'bg-gradient-warm', onClick: () => navigate('/analytics') },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-gradient-warm rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">StudyRoom</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <ProfileSwitcher />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Track Everything with embedded Activity History */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-border/50 bg-card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-warm">
                    <LineChart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Track Everything
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor your study sessions and progress
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setTrackingDialogOpen(true)}
                  className="bg-gradient-warm hover:shadow-warm transition-all"
                >
                  Log Session
                </Button>
              </div>

              <ActivityHistory 
                key={activityKey}
                onEditSession={(session) => {
                  setEditingSession(session);
                  setTrackingDialogOpen(true);
                }}
              />
            </Card>
          </div>

          {/* Right column: Other features */}
          <div className="space-y-6">
            {features.slice(1).map((feature, index) => (
              <Card 
                key={index}
                className="p-6 hover:shadow-warm transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                onClick={feature.onClick}
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <TrackingDialog 
          open={trackingDialogOpen} 
          onOpenChange={(open) => {
            setTrackingDialogOpen(open);
            if (!open) {
              setEditingSession(null);
            }
          }}
          editSession={editingSession}
          onSessionUpdated={() => {
            setActivityKey(prev => prev + 1);
            setEditingSession(null);
          }}
        />

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
