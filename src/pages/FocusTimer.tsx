import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { BookOpen, ArrowLeft, Play, Pause, RotateCcw, Settings, Coffee, Brain, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

const FocusTimer = () => {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio for notifications
    audioRef.current = new Audio('data:audio/wav;base64,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'); 
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    if (mode === 'work') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      
      // Save completed session to database
      if (activeProfile) {
        try {
          await supabase.from('study_sessions').insert({
            user_id: activeProfile.user_id,
            profile_id: activeProfile.id,
            start_time: new Date(Date.now() - settings.workDuration * 60 * 1000).toISOString(),
            end_time: new Date().toISOString(),
            duration_minutes: settings.workDuration,
            session_type: 'solo',
            energy_level: 'high',
            break_type: 'none',
            notes: `Pomodoro session ${newSessionsCompleted}`,
          });
        } catch (error) {
          console.error('Error saving session:', error);
        }
      }

      // Switch to break
      if (newSessionsCompleted % settings.sessionsUntilLongBreak === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
        toast.success(`Work session complete! Time for a long break. 🎉`, {
          description: `${newSessionsCompleted} sessions completed today!`,
        });
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreakDuration * 60);
        toast.success('Work session complete! Take a short break. ☕');
      }
    } else {
      // Break complete, back to work
      setMode('work');
      setTimeLeft(settings.workDuration * 60);
      toast.success('Break over! Ready to focus? 💪');
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const duration = mode === 'work' 
      ? settings.workDuration 
      : mode === 'shortBreak' 
      ? settings.shortBreakDuration 
      : settings.longBreakDuration;
    setTimeLeft(duration * 60);
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    const duration = newMode === 'work' 
      ? settings.workDuration 
      : newMode === 'shortBreak' 
      ? settings.shortBreakDuration 
      : settings.longBreakDuration;
    setTimeLeft(duration * 60);
  };

  const applySettings = () => {
    resetTimer();
    setShowSettings(false);
    toast.success('Settings updated!');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalDuration = mode === 'work' 
      ? settings.workDuration * 60
      : mode === 'shortBreak' 
      ? settings.shortBreakDuration * 60
      : settings.longBreakDuration * 60;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  const getModeColor = () => {
    switch (mode) {
      case 'work': return 'text-red-600';
      case 'shortBreak': return 'text-blue-600';
      case 'longBreak': return 'text-green-600';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'work': return <Brain className="w-8 h-8" />;
      case 'shortBreak': return <Coffee className="w-8 h-8" />;
      case 'longBreak': return <Coffee className="w-8 h-8" />;
    }
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
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 animate-fade-in text-center">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Focus Timer
          </h1>
          <p className="text-muted-foreground">
            Stay productive with the Pomodoro Technique
          </p>
        </div>

        {showSettings ? (
          <Card className="border-border/50 animate-fade-in">
            <CardHeader>
              <CardTitle>Timer Settings</CardTitle>
              <CardDescription>Customize your focus and break durations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workDuration">Work Duration (minutes)</Label>
                  <Input
                    id="workDuration"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.workDuration}
                    onChange={(e) => setSettings({ ...settings, workDuration: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortBreak">Short Break (minutes)</Label>
                  <Input
                    id="shortBreak"
                    type="number"
                    min="1"
                    max="30"
                    value={settings.shortBreakDuration}
                    onChange={(e) => setSettings({ ...settings, shortBreakDuration: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longBreak">Long Break (minutes)</Label>
                  <Input
                    id="longBreak"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreakDuration}
                    onChange={(e) => setSettings({ ...settings, longBreakDuration: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionsUntilLongBreak">Sessions Until Long Break</Label>
                  <Input
                    id="sessionsUntilLongBreak"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.sessionsUntilLongBreak}
                    onChange={(e) => setSettings({ ...settings, sessionsUntilLongBreak: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={applySettings} className="flex-1 bg-gradient-warm">
                  Apply Settings
                </Button>
                <Button onClick={() => setShowSettings(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Mode Selector */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex gap-2 justify-center">
                  <Button
                    variant={mode === 'work' ? 'default' : 'outline'}
                    onClick={() => switchMode('work')}
                    disabled={isRunning}
                    className={mode === 'work' ? 'bg-red-500 hover:bg-red-600' : ''}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Work
                  </Button>
                  <Button
                    variant={mode === 'shortBreak' ? 'default' : 'outline'}
                    onClick={() => switchMode('shortBreak')}
                    disabled={isRunning}
                    className={mode === 'shortBreak' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                  >
                    <Coffee className="w-4 h-4 mr-2" />
                    Short Break
                  </Button>
                  <Button
                    variant={mode === 'longBreak' ? 'default' : 'outline'}
                    onClick={() => switchMode('longBreak')}
                    disabled={isRunning}
                    className={mode === 'longBreak' ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    <Coffee className="w-4 h-4 mr-2" />
                    Long Break
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timer Display */}
            <Card className="border-border/50 bg-gradient-to-br from-background to-accent/5">
              <CardContent className="pt-12 pb-12">
                <div className="text-center space-y-8">
                  <div className={`flex justify-center ${getModeColor()}`}>
                    {getModeIcon()}
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className={`text-8xl font-bold ${getModeColor()} font-mono`}>
                      {formatTime(timeLeft)}
                    </h2>
                    <p className="text-lg text-muted-foreground capitalize">
                      {mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : 'Focus Time'}
                    </p>
                  </div>

                  <Progress value={getProgress()} className="h-2" />

                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={toggleTimer}
                      size="lg"
                      className="bg-gradient-warm hover:shadow-warm transition-all w-32"
                    >
                      {isRunning ? (
                        <>
                          <Pause className="w-5 h-5 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={resetTimer}
                      size="lg"
                      variant="outline"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Today's Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-accent/10 rounded-lg">
                    <p className="text-3xl font-bold text-foreground">{sessionsCompleted}</p>
                    <p className="text-sm text-muted-foreground">Sessions Completed</p>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-lg">
                    <p className="text-3xl font-bold text-foreground">{sessionsCompleted * settings.workDuration}</p>
                    <p className="text-sm text-muted-foreground">Minutes Focused</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default FocusTimer;
