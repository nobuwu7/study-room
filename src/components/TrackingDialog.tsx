import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';

const formSchema = z.object({
  sessionType: z.enum(['solo', 'with_friends'], {
    required_error: 'Please select a session type',
  }),
  startTime: z.string().nonempty('Start time is required'),
  endTime: z.string().optional(),
  breakType: z.enum(['none', 'light', 'heavy'], {
    required_error: 'Please select a break type',
  }),
  energyLevel: z.enum(['none', 'low', 'high'], {
    required_error: 'Please select an energy level',
  }),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StudySession {
  id: string;
  session_type: 'solo' | 'with_friends';
  start_time: string;
  end_time: string | null;
  break_type: 'none' | 'light' | 'heavy';
  energy_level: 'none' | 'low' | 'high';
  notes: string | null;
}

interface TrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSession?: StudySession | null;
  onSessionUpdated?: () => void;
}

export const TrackingDialog = ({ open, onOpenChange, editSession, onSessionUpdated }: TrackingDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activeProfile } = useProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sessionType: editSession?.session_type || 'solo',
      startTime: editSession?.start_time ? new Date(editSession.start_time).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      endTime: editSession?.end_time ? new Date(editSession.end_time).toISOString().slice(0, 16) : '',
      breakType: editSession?.break_type || 'none',
      energyLevel: editSession?.energy_level || 'none',
      notes: editSession?.notes || '',
    },
  });

  // Reset form when editSession changes
  useState(() => {
    if (editSession) {
      form.reset({
        sessionType: editSession.session_type,
        startTime: new Date(editSession.start_time).toISOString().slice(0, 16),
        endTime: editSession.end_time ? new Date(editSession.end_time).toISOString().slice(0, 16) : '',
        breakType: editSession.break_type,
        energyLevel: editSession.energy_level,
        notes: editSession.notes || '',
      });
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (!activeProfile) {
        toast.error('No active profile selected');
        return;
      }

      // Calculate duration if end time is provided
      let durationMinutes = null;
      if (data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      }

      const sessionData = {
        user_id: activeProfile.user_id,
        profile_id: activeProfile.id,
        session_type: data.sessionType,
        start_time: data.startTime,
        end_time: data.endTime || null,
        duration_minutes: durationMinutes,
        break_type: data.breakType,
        energy_level: data.energyLevel,
        notes: data.notes || null,
      };

      if (editSession) {
        // Update existing session
        const { error } = await supabase
          .from('study_sessions')
          .update(sessionData)
          .eq('id', editSession.id);

        if (error) throw error;
        toast.success('Study session updated successfully!');
      } else {
        // Insert new session
        const { error } = await supabase.from('study_sessions').insert(sessionData);

        if (error) throw error;
        toast.success('Study session logged successfully!');
      }

      form.reset();
      onOpenChange(false);
      onSessionUpdated?.();
    } catch (error) {
      console.error('Error logging session:', error);
      toast.error(`Failed to ${editSession ? 'update' : 'log'} session. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {editSession ? 'Edit Study Session' : 'Track Study Session'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Session Type */}
            <FormField
              control={form.control}
              name="sessionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="solo" id="solo" />
                        <Label htmlFor="solo" className="cursor-pointer">Solo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="with_friends" id="with_friends" />
                        <Label htmlFor="with_friends" className="cursor-pointer">With Friends</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Time */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Time */}
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time (Optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Break Type */}
            <FormField
              control={form.control}
              name="breakType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Break Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="none" />
                        <Label htmlFor="none" className="cursor-pointer">None</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="light" />
                        <Label htmlFor="light" className="cursor-pointer">Light</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="heavy" id="heavy" />
                        <Label htmlFor="heavy" className="cursor-pointer">Heavy</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Energy Level */}
            <FormField
              control={form.control}
              name="energyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Energy Level</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="energy-none" />
                        <Label htmlFor="energy-none" className="cursor-pointer">None</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="low" />
                        <Label htmlFor="low" className="cursor-pointer">Low</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="high" />
                        <Label htmlFor="high" className="cursor-pointer">High</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes / Additional Activities (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Project discussions, consultations, etc."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-warm">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Session
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
