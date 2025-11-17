import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, ArrowLeft, Calendar, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const StudySchedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sleepTime: '23:00',
    wakeTime: '07:00',
    energyPeaks: '',
    studyGoals: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to generate a schedule');
      navigate('/auth');
      return;
    }

    if (!formData.energyPeaks || !formData.studyGoals) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: formData,
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message.includes('402')) {
          toast.error('AI credits depleted. Please add credits in Settings.');
        } else {
          throw error;
        }
        return;
      }

      if (data?.schedule) {
        setSchedule(data.schedule);
        toast.success('Your personalized schedule is ready!');
      } else {
        throw new Error('No schedule received');
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast.error('Failed to generate schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSchedule(null);
    setFormData({
      sleepTime: '23:00',
      wakeTime: '07:00',
      energyPeaks: '',
      studyGoals: '',
    });
  };

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
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-warm rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Personalized Study Schedule
              </h1>
              <p className="text-muted-foreground mt-2">
                Get a custom study plan that adapts to your natural rhythms
              </p>
            </div>
          </div>
        </div>

        {!schedule ? (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Tell us about your routine</CardTitle>
              <CardDescription>
                We'll create a biologically optimized schedule based on your habits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sleepTime">What time do you usually sleep?</Label>
                    <Input
                      id="sleepTime"
                      type="time"
                      value={formData.sleepTime}
                      onChange={(e) => setFormData({ ...formData, sleepTime: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wakeTime">What time do you wake up?</Label>
                    <Input
                      id="wakeTime"
                      type="time"
                      value={formData.wakeTime}
                      onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="energyPeaks">
                    When do you feel most energetic during the day?
                  </Label>
                  <Textarea
                    id="energyPeaks"
                    placeholder="e.g., I'm most alert in the morning around 9-11 AM, and have a second wind around 3-5 PM..."
                    value={formData.energyPeaks}
                    onChange={(e) => setFormData({ ...formData, energyPeaks: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studyGoals">
                    What are your study goals and subjects?
                  </Label>
                  <Textarea
                    id="studyGoals"
                    placeholder="e.g., I need to study mathematics and biology for 4-5 hours per day, preparing for final exams..."
                    value={formData.studyGoals}
                    onChange={(e) => setFormData({ ...formData, studyGoals: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-warm hover:shadow-warm transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Your Schedule...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate My Schedule
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Your Personalized Schedule
                </CardTitle>
                <CardDescription>
                  Based on your sleep habits and energy patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-foreground">
                    {schedule}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                Generate New Schedule
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gradient-warm"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudySchedule;