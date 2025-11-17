import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Users, User, Battery, Coffee, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StudySession {
  id: string;
  session_type: 'solo' | 'with_friends';
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  break_type: 'none' | 'light' | 'heavy';
  energy_level: 'none' | 'low' | 'high';
  notes: string | null;
  created_at: string;
}

export const ActivityHistory = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load activity history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getEnergyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'low': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getBreakColor = (type: string) => {
    switch (type) {
      case 'heavy': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      case 'light': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div>
        <h4 className="text-md font-semibold mb-4">Activity History</h4>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div>
        <h4 className="text-md font-semibold mb-4">Activity History</h4>
        <p className="text-center text-muted-foreground py-8">
          No study sessions logged yet. Start tracking to see your history!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-md font-semibold mb-4">Activity History</h4>
      <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id} className="p-4 border-border/50">
                <div className="space-y-3">
                  {/* Header with date and session type */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatDate(session.start_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.session_type === 'solo' ? (
                        <>
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Solo</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">With Friends</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Time and duration */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{formatTime(session.start_time)}</span>
                      {session.end_time && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <span>{formatTime(session.end_time)}</span>
                        </>
                      )}
                    </div>
                    {session.duration_minutes && (
                      <Badge variant="outline" className="font-normal">
                        {session.duration_minutes} min
                      </Badge>
                    )}
                  </div>

                  {/* Energy and Break badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Battery className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline" className={getEnergyColor(session.energy_level)}>
                        {session.energy_level} energy
                      </Badge>
                    </div>
                    {session.break_type !== 'none' && (
                      <div className="flex items-center gap-1">
                        <Coffee className="w-4 h-4 text-muted-foreground" />
                        <Badge variant="outline" className={getBreakColor(session.break_type)}>
                          {session.break_type} break
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {session.notes && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      {session.notes}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
    </div>
  );
};
