import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, LogOut, Clock, Moon, Coffee, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, startOfDay, subDays } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;
    
    try {
      const { data, error} = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  // Calculate stats
  const totalStudyMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const totalStudyHours = Math.round(totalStudyMinutes / 60 * 10) / 10;
  
  const lateNightSessions = sessions.filter(s => {
    const hour = new Date(s.start_time).getHours();
    return hour >= 22 || hour < 6;
  }).length;

  const breaksData = sessions.filter(s => s.break_type !== 'none');
  const heavyBreaks = breaksData.filter(s => s.break_type === 'heavy').length;
  const lightBreaks = breaksData.filter(s => s.break_type === 'light').length;

  // Study time per day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const dayStr = format(date, 'MMM dd');
    const daySessions = sessions.filter(s => {
      const sessionDate = startOfDay(parseISO(s.start_time));
      return sessionDate.getTime() === date.getTime();
    });
    const minutes = daySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    return { date: dayStr, hours: Math.round(minutes / 60 * 10) / 10 };
  });

  // Break frequency pie chart
  const breakChartData = [
    { name: 'Heavy Breaks', value: heavyBreaks, color: 'hsl(var(--primary))' },
    { name: 'Light Breaks', value: lightBreaks, color: 'hsl(var(--secondary))' },
    { name: 'No Break', value: sessions.length - breaksData.length, color: 'hsl(var(--muted))' }
  ];

  // Energy levels distribution
  const energyData = [
    { name: 'High Energy', value: sessions.filter(s => s.energy_level === 'high').length, color: 'hsl(var(--accent))' },
    { name: 'Low Energy', value: sessions.filter(s => s.energy_level === 'low').length, color: 'hsl(var(--secondary))' },
    { name: 'None', value: sessions.filter(s => s.energy_level === 'none').length, color: 'hsl(var(--muted))' }
  ];

  // Session types
  const sessionTypeData = [
    { type: 'Solo', count: sessions.filter(s => s.session_type === 'solo').length },
    { type: 'With Friends', count: sessions.filter(s => s.session_type === 'with_friends').length }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-gradient-warm rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">StudyRoom</span>
          </Link>
          
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
            Study Analytics 📊
          </h1>
          <p className="text-lg text-muted-foreground">
            Understand your study patterns and improve your habits
          </p>
        </div>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No study data yet. Start tracking your sessions!</p>
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-warm text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Total Study Time</CardTitle>
                    <Clock className="w-5 h-5 opacity-80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalStudyHours}h</p>
                  <p className="text-sm opacity-80 mt-1">{sessions.length} sessions</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-calm text-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Late Night Sessions</CardTitle>
                    <Moon className="w-5 h-5 opacity-80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{lateNightSessions}</p>
                  <p className="text-sm opacity-80 mt-1">After 10 PM</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Total Breaks</CardTitle>
                    <Coffee className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{breaksData.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">{heavyBreaks} heavy, {lightBreaks} light</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Avg Session</CardTitle>
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">
                    {sessions.length > 0 ? Math.round(totalStudyMinutes / sessions.length) : 0}m
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Per session</p>
                </CardContent>
              </Card>
            </div>

            {/* Study Time Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Study Time (Last 7 Days)</CardTitle>
                <CardDescription>Track your daily study hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Study Hours"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Break Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Break Distribution</CardTitle>
                  <CardDescription>How you take breaks during study</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={breakChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : null}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {breakChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Energy Levels */}
              <Card>
                <CardHeader>
                  <CardTitle>Energy Level Patterns</CardTitle>
                  <CardDescription>Your energy during study sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={energyData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : null}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {energyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Session Types */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Study Session Types</CardTitle>
                  <CardDescription>Solo vs. collaborative study sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={sessionTypeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="count" fill="hsl(var(--secondary))" name="Sessions" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
