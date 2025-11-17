import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, ArrowLeft, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  completed: boolean;
  due_date: string | null;
  completed_at: string | null;
}

const TopTasks = () => {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 1,
    due_date: '',
  });

  useEffect(() => {
    if (activeProfile) {
      loadTasks();
    }
  }, [activeProfile]);

  const loadTasks = async () => {
    if (!activeProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('profile_id', activeProfile.id)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Check if we already have 3 tasks at this priority
    const tasksAtPriority = tasks.filter(t => t.priority === formData.priority && !t.completed);
    if (tasksAtPriority.length >= 3 && !editingTask) {
      toast.error(`You already have 3 tasks at priority ${formData.priority}. Complete or delete one first.`);
      return;
    }

    try {
      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update({
            title: formData.title,
            description: formData.description || null,
            priority: formData.priority,
            due_date: formData.due_date || null,
          })
          .eq('id', editingTask);

        if (error) throw error;
        toast.success('Task updated!');
        setEditingTask(null);
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: activeProfile.user_id,
            profile_id: activeProfile.id,
            title: formData.title,
            description: formData.description || null,
            priority: formData.priority,
            due_date: formData.due_date || null,
          });

        if (error) throw error;
        toast.success('Task added!');
      }

      setFormData({ title: '', description: '', priority: 1, due_date: '' });
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    }
  };

  const toggleComplete = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null,
        })
        .eq('id', task.id);

      if (error) throw error;
      loadTasks();
      toast.success(task.completed ? 'Task reopened!' : 'Task completed! 🎉');
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Task deleted');
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const startEdit = (task: Task) => {
    setEditingTask(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date || '',
    });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '', priority: 1, due_date: '' });
  };

  const getPriorityLabel = (priority: number) => {
    const labels = ['🥇 Top Priority', '🥈 Second Priority', '🥉 Third Priority'];
    return labels[priority - 1];
  };

  const getPriorityColor = (priority: number) => {
    const colors = ['bg-red-50 border-red-200', 'bg-orange-50 border-orange-200', 'bg-yellow-50 border-yellow-200'];
    return colors[priority - 1];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const groupedTasks = {
    1: tasks.filter(t => t.priority === 1 && !t.completed),
    2: tasks.filter(t => t.priority === 2 && !t.completed),
    3: tasks.filter(t => t.priority === 3 && !t.completed),
  };

  const completedTasks = tasks.filter(t => t.completed);

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
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Top 3 Tasks
          </h1>
          <p className="text-muted-foreground">
            Focus on what matters most. Set your top 3 priorities for today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Add/Edit Task Form */}
          <Card className="lg:col-span-1 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingTask ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </CardTitle>
              <CardDescription>
                {editingTask ? 'Update your task details' : 'Create a new task'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Study for exam..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add details..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value={1}>🥇 Top Priority</option>
                    <option value={2}>🥈 Second Priority</option>
                    <option value={3}>🥉 Third Priority</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-gradient-warm">
                    {editingTask ? 'Update' : 'Add'} Task
                  </Button>
                  {editingTask && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((priority) => (
              <Card key={priority} className={`border ${getPriorityColor(priority)}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{getPriorityLabel(priority)}</CardTitle>
                  <CardDescription>
                    {groupedTasks[priority as keyof typeof groupedTasks].length} of 3 tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {groupedTasks[priority as keyof typeof groupedTasks].length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tasks yet. Add one to get started!
                    </p>
                  ) : (
                    groupedTasks[priority as keyof typeof groupedTasks].map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/50"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleComplete(task)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          {task.due_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(task)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <Card className="border-border/50 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Completed Tasks
                  </CardTitle>
                  <CardDescription>{completedTasks.length} tasks completed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/50 opacity-60"
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleComplete(task)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground line-through">{task.title}</h4>
                        {task.completed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed: {new Date(task.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TopTasks;
