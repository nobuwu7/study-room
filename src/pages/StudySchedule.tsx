import { useState, useEffect } from 'react';
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
import { BookOpen, ArrowLeft, Calendar, Loader2, Sparkles, Clock, Coffee, Brain, Lightbulb, Moon, Sun, Sunrise, Save, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const StudySchedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<string | null>(null);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);
  const [savedSchedules, setSavedSchedules] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    sleepTime: '23:00',
    wakeTime: '07:00',
    energyPeaks: '',
    studyGoals: '',
  });

  // Load saved schedules on mount
  useEffect(() => {
    if (user) {
      loadSavedSchedules();
    }
  }, [user]);

  const loadSavedSchedules = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('study_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const saveSchedule = async () => {
    if (!user || !schedule) return;

    setSaving(true);
    try {
      if (currentScheduleId) {
        // Update existing schedule
        const { error } = await supabase
          .from('study_schedules')
          .update({
            sleep_time: formData.sleepTime,
            wake_time: formData.wakeTime,
            energy_peaks: formData.energyPeaks,
            study_goals: formData.studyGoals,
            generated_schedule: schedule,
          })
          .eq('id', currentScheduleId);

        if (error) throw error;
        toast.success('Schedule updated!');
      } else {
        // Create new schedule
        const { data, error } = await supabase
          .from('study_schedules')
          .insert({
            user_id: user.id,
            sleep_time: formData.sleepTime,
            wake_time: formData.wakeTime,
            energy_peaks: formData.energyPeaks,
            study_goals: formData.studyGoals,
            generated_schedule: schedule,
          })
          .select()
          .single();

        if (error) throw error;
        setCurrentScheduleId(data.id);
        toast.success('Schedule saved!');
      }

      await loadSavedSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const loadSchedule = (scheduleData: any) => {
    setFormData({
      sleepTime: scheduleData.sleep_time,
      wakeTime: scheduleData.wake_time,
      energyPeaks: scheduleData.energy_peaks,
      studyGoals: scheduleData.study_goals,
    });
    setSchedule(scheduleData.generated_schedule);
    setCurrentScheduleId(scheduleData.id);
    toast.success('Schedule loaded!');
  };

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
        setCurrentScheduleId(null); // Reset ID for new schedule
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
    setCurrentScheduleId(null);
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
          <div className="space-y-6">
            {/* Saved Schedules */}
            {savedSchedules.length > 0 && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Saved Schedules
                  </CardTitle>
                  <CardDescription>
                    Load a previously saved schedule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {savedSchedules.map((sched) => (
                        <Card
                          key={sched.id}
                          className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => loadSchedule(sched)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-sm mb-1">
                                {sched.wake_time} - {sched.sleep_time}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {sched.study_goals}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {new Date(sched.created_at).toLocaleDateString()}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

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
          </div>
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
                      
                      <div className="space-y-3">
                        {schedule.split('\n').filter(line => line.trim()).map((line, index) => {
                          const lowerLine = line.toLowerCase();
                          
                          // Parse time patterns
                          const timeMatch = line.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[-–—]\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/);
                          const singleTimeMatch = line.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/);
                          
                          // Section headers (numbered or all caps)
                          if (line.match(/^\d+\./) || (line === line.toUpperCase() && line.length > 5 && !timeMatch)) {
                            return (
                              <div key={index} className="pt-6 first:pt-0">
                                <h4 className="text-base font-bold text-primary flex items-center gap-2 mb-3">
                                  <Sparkles className="w-4 h-4" />
                                  {line.replace(/^\d+\.\s*/, '')}
                                </h4>
                              </div>
                            );
                          }
                          
                          // Time blocks with range
                          if (timeMatch) {
                            const [, startTime, endTime] = timeMatch;
                            const restOfLine = line.replace(timeMatch[0], '').replace(/^[\s:-]+/, '');
                            
                            // Determine activity type and color
                            let bgColor = 'bg-background';
                            let borderColor = 'border-border/50';
                            let icon = <Clock className="w-4 h-4" />;
                            
                            if (lowerLine.includes('study') || lowerLine.includes('focus') || lowerLine.includes('work')) {
                              bgColor = 'bg-blue-50/50 dark:bg-blue-950/20';
                              borderColor = 'border-blue-200/50';
                              icon = <Brain className="w-4 h-4 text-blue-600" />;
                            } else if (lowerLine.includes('break') || lowerLine.includes('rest') || lowerLine.includes('lunch') || lowerLine.includes('snack')) {
                              bgColor = 'bg-orange-50/50 dark:bg-orange-950/20';
                              borderColor = 'border-orange-200/50';
                              icon = <Coffee className="w-4 h-4 text-orange-600" />;
                            } else if (lowerLine.includes('wake') || lowerLine.includes('morning')) {
                              bgColor = 'bg-yellow-50/50 dark:bg-yellow-950/20';
                              borderColor = 'border-yellow-200/50';
                              icon = <Sunrise className="w-4 h-4 text-yellow-600" />;
                            } else if (lowerLine.includes('sleep') || lowerLine.includes('wind down')) {
                              bgColor = 'bg-purple-50/50 dark:bg-purple-950/20';
                              borderColor = 'border-purple-200/50';
                              icon = <Moon className="w-4 h-4 text-purple-600" />;
                            } else if (lowerLine.includes('exercise') || lowerLine.includes('workout')) {
                              bgColor = 'bg-green-50/50 dark:bg-green-950/20';
                              borderColor = 'border-green-200/50';
                              icon = <Sun className="w-4 h-4 text-green-600" />;
                            }
                            
                            return (
                              <Card key={index} className={`${bgColor} border ${borderColor} shadow-sm`}>
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                      {icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="font-mono text-xs">
                                          {startTime} - {endTime}
                                        </Badge>
                                      </div>
                                      <p className="text-sm font-medium leading-relaxed">
                                        {restOfLine || 'Activity'}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          }
                          
                          // Regular text or tips
                          if (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*')) {
                            return (
                              <div key={index} className="flex items-start gap-2 pl-7 text-sm text-muted-foreground">
                                <span className="text-primary mt-1">•</span>
                                <span className="flex-1">{line.replace(/^[\s\-•*]+/, '')}</span>
                              </div>
                            );
                          }
                          
                          // Other descriptive text
                          if (line.trim() && !timeMatch && !singleTimeMatch) {
                            return (
                              <p key={index} className="text-sm text-muted-foreground leading-relaxed pl-7">
                                {line}
                              </p>
                            );
                          }
                          
                          return null;
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
                onClick={saveSchedule}
                variant="default"
                className="flex-1 bg-gradient-warm"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {currentScheduleId ? 'Update' : 'Save'} Schedule
                  </>
                )}
              </Button>
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudySchedule;