import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ArrowLeft, Calendar, Loader2, Sparkles, Clock, Coffee, Brain, Lightbulb, Moon, Sun, Sunrise } from 'lucide-react';
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
                Study Schedule
              </h1>
              <p className="text-muted-foreground mt-2">
                AI-powered schedule based on your rhythms
              </p>
            </div>
          </div>
        </div>

        {!schedule ? (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Your Routine</CardTitle>
              <CardDescription>
                Tell us about your sleep and energy patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sleepTime">Sleep time</Label>
                    <Input
                      id="sleepTime"
                      type="time"
                      value={formData.sleepTime}
                      onChange={(e) => setFormData({ ...formData, sleepTime: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wakeTime">Wake time</Label>
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
                    When are you most energetic?
                  </Label>
                  <Textarea
                    id="energyPeaks"
                    placeholder="e.g., Most alert 9-11 AM, second wind 3-5 PM"
                    value={formData.energyPeaks}
                    onChange={(e) => setFormData({ ...formData, energyPeaks: e.target.value })}
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studyGoals">
                    Study goals and subjects
                  </Label>
                  <Textarea
                    id="studyGoals"
                    placeholder="e.g., Math and biology, 4-5 hours daily for finals"
                    value={formData.studyGoals}
                    onChange={(e) => setFormData({ ...formData, studyGoals: e.target.value })}
                    rows={2}
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
            <Card className="border-border/50 bg-gradient-to-br from-background to-accent/5">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Sparkles className="w-6 h-6 text-primary" />
                      Your Schedule
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Wake {formData.wakeTime} • Sleep {formData.sleepTime}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/10">
                    AI Generated
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {/* Key Highlights Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="bg-gradient-warm/10 border-orange-200/50">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-warm rounded-lg">
                              <Brain className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Peak</p>
                              <p className="text-lg font-semibold">Morning</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-calm/10 border-blue-200/50">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-calm rounded-lg">
                              <Coffee className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Breaks</p>
                              <p className="text-lg font-semibold">Every 90 min</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-100/50 border-purple-200/50">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500 rounded-lg">
                              <Lightbulb className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Study Time</p>
                              <p className="text-lg font-semibold">6-8 hours</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Separator />

                    {/* Schedule Content - Formatted with better structure */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Daily Breakdown</h3>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                        {schedule.split('\n').map((line, index) => {
                          // Skip empty lines
                          if (!line.trim()) return null;
                          
                          // Check if line contains time patterns (HH:MM or similar)
                          const timePattern = /(\d{1,2}:\d{2}|\d{1,2}\s*[AaPp][Mm])/;
                          const isTimeBlock = timePattern.test(line);
                          
                          // Check for section headers (lines with colons or all caps)
                          const isSectionHeader = (line.includes(':') && !isTimeBlock) || 
                                                 (line === line.toUpperCase() && line.length > 5);
                          
                          // Identify activity types for icons
                          const getIcon = () => {
                            const lowerLine = line.toLowerCase();
                            if (lowerLine.includes('wake') || lowerLine.includes('morning')) return <Sunrise className="w-4 h-4" />;
                            if (lowerLine.includes('study') || lowerLine.includes('focus')) return <Brain className="w-4 h-4" />;
                            if (lowerLine.includes('break') || lowerLine.includes('rest')) return <Coffee className="w-4 h-4" />;
                            if (lowerLine.includes('sleep') || lowerLine.includes('night')) return <Moon className="w-4 h-4" />;
                            if (lowerLine.includes('energy') || lowerLine.includes('peak')) return <Sun className="w-4 h-4" />;
                            return <Clock className="w-4 h-4" />;
                          };
                          
                          if (isSectionHeader) {
                            return (
                              <div key={index} className="pt-4 first:pt-0">
                                <h4 className="text-base font-semibold text-primary flex items-center gap-2">
                                  <Lightbulb className="w-4 h-4" />
                                  {line.replace(':', '')}
                                </h4>
                              </div>
                            );
                          }
                          
                          if (isTimeBlock) {
                            return (
                              <div 
                                key={index} 
                                className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                              >
                                <div className="mt-1 text-primary">
                                  {getIcon()}
                                </div>
                                <p className="flex-1 text-sm leading-relaxed">{line}</p>
                              </div>
                            );
                          }
                          
                          return (
                            <p key={index} className="text-sm text-muted-foreground leading-relaxed pl-7">
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tips Section */}
                    <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-blue-600" />
                          Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>Keep consistent wake/sleep times</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>Study hard subjects during peak energy</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>Take breaks to maintain focus</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                New Schedule
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(schedule);
                  toast.success("Copied to clipboard!");
                }}
                variant="outline"
                className="flex-1"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                className="flex-1 bg-gradient-warm"
              >
                Dashboard
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudySchedule;