import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, LogOut, Users, Plus, Mail, FileText, Link as LinkIcon, CheckSquare, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Collaboration = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [createResourceOpen, setCreateResourceOpen] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceContent, setResourceContent] = useState('');
  const [resourceType, setResourceType] = useState<'note' | 'link' | 'file' | 'task'>('note');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchGroups();
      fetchInvitations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchResources();
      fetchMembers();
      
      // Set up real-time subscriptions
      const resourcesChannel = supabase
        .channel(`resources-${selectedGroup.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shared_resources',
            filter: `group_id=eq.${selectedGroup.id}`
          },
          () => {
            fetchResources();
          }
        )
        .subscribe();

      const membersChannel = supabase
        .channel(`members-${selectedGroup.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_members',
            filter: `group_id=eq.${selectedGroup.id}`
          },
          () => {
            fetchMembers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(resourcesChannel);
        supabase.removeChannel(membersChannel);
      };
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const { data: groupMembersData, error: membersError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user?.id);

      if (membersError) throw membersError;

      const groupIds = groupMembersData?.map(m => m.group_id) || [];
      
      if (groupIds.length === 0) {
        setGroups([]);
        setLoadingData(false);
        return;
      }

      const { data: groupsData, error: groupsError } = await supabase
        .from('study_groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);
    } catch (error: any) {
      toast.error('Failed to load groups');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('group_invitations')
        .select('*, study_groups(name)')
        .eq('invited_email', user?.email)
        .eq('status', 'pending');

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Failed to load invitations:', error);
    }
  };

  const fetchResources = async () => {
    if (!selectedGroup) return;
    
    try {
      const { data, error } = await supabase
        .from('shared_resources')
        .select('*')
        .eq('group_id', selectedGroup.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      toast.error('Failed to load resources');
    }
  };

  const fetchMembers = async () => {
    if (!selectedGroup) return;
    
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', selectedGroup.id);

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      toast.error('Failed to load members');
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name: groupName,
          description: groupDescription,
          created_by: user?.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user?.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      toast.success('Group created successfully!');
      setGroupName('');
      setGroupDescription('');
      setCreateGroupOpen(false);
      fetchGroups();
    } catch (error: any) {
      toast.error('Failed to create group');
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !selectedGroup) {
      toast.error('Email is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('group_invitations')
        .insert({
          group_id: selectedGroup.id,
          invited_by: user?.id,
          invited_email: inviteEmail
        });

      if (error) throw error;

      toast.success('Invitation sent!');
      setInviteEmail('');
      setInviteMemberOpen(false);
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('User already invited');
      } else {
        toast.error('Failed to send invitation');
      }
    }
  };

  const acceptInvitation = async (invitationId: string, groupId: string) => {
    try {
      // Update invitation status
      const { error: inviteError } = await supabase
        .from('group_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (inviteError) throw inviteError;

      // Add user to group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user?.id,
          role: 'member'
        });

      if (memberError) throw memberError;

      toast.success('Invitation accepted!');
      fetchGroups();
      fetchInvitations();
    } catch (error: any) {
      toast.error('Failed to accept invitation');
    }
  };

  const createResource = async () => {
    if (!resourceTitle.trim() || !resourceContent.trim() || !selectedGroup) {
      toast.error('All fields are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('shared_resources')
        .insert({
          group_id: selectedGroup.id,
          title: resourceTitle,
          content: resourceContent,
          resource_type: resourceType,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success('Resource shared!');
      setResourceTitle('');
      setResourceContent('');
      setResourceType('note');
      setCreateResourceOpen(false);
      fetchResources();
    } catch (error: any) {
      toast.error('Failed to share resource');
    }
  };

  const deleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('shared_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;
      toast.success('Resource deleted');
      fetchResources();
    } catch (error: any) {
      toast.error('Failed to delete resource');
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

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'link': return <LinkIcon className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Study Groups 👥
            </h1>
            <p className="text-lg text-muted-foreground">
              Collaborate and share resources in real-time
            </p>
          </div>

          <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-warm text-white gap-2">
                <Plus className="w-4 h-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Study Group</DialogTitle>
                <DialogDescription>Start a new group to collaborate with others</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., CS101 Study Group"
                  />
                </div>
                <div>
                  <Label htmlFor="groupDescription">Description</Label>
                  <Textarea
                    id="groupDescription"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="What's this group about?"
                  />
                </div>
                <Button onClick={createGroup} className="w-full">Create Group</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <span className="font-medium">{invite.study_groups?.name}</span>
                    <Button size="sm" onClick={() => acceptInvitation(invite.id, invite.group_id)}>
                      Accept
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Your Groups</CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No groups yet. Create one to get started!
                </p>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedGroup?.id === group.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{group.name}</p>
                          {group.description && (
                            <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Group Content */}
          {selectedGroup ? (
            <div className="lg:col-span-2 space-y-6">
              {/* Members */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>{members.length} member(s)</CardDescription>
                  </div>
                  <Dialog open={inviteMemberOpen} onOpenChange={setInviteMemberOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Member</DialogTitle>
                        <DialogDescription>Send an invitation to join this group</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="inviteEmail">Email Address</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="friend@example.com"
                          />
                        </div>
                        <Button onClick={inviteMember} className="w-full">Send Invitation</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => (
                      <div key={member.id} className="px-3 py-1 bg-muted rounded-full text-sm">
                        {member.role === 'owner' && '👑 '}
                        {member.role === 'admin' && '⭐ '}
                        Member
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Share */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Quick Share</CardTitle>
                    <CardDescription>Updates in real-time</CardDescription>
                  </div>
                  <Dialog open={createResourceOpen} onOpenChange={setCreateResourceOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Share
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share Resource</DialogTitle>
                        <DialogDescription>Add a resource for the group</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="resourceType">Type</Label>
                          <Select value={resourceType} onValueChange={(v: any) => setResourceType(v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="note">Note</SelectItem>
                              <SelectItem value="link">Link</SelectItem>
                              <SelectItem value="task">Task</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="resourceTitle">Title</Label>
                          <Input
                            id="resourceTitle"
                            value={resourceTitle}
                            onChange={(e) => setResourceTitle(e.target.value)}
                            placeholder="e.g., Chapter 5 Notes"
                          />
                        </div>
                        <div>
                          <Label htmlFor="resourceContent">Content</Label>
                          <Textarea
                            id="resourceContent"
                            value={resourceContent}
                            onChange={(e) => setResourceContent(e.target.value)}
                            placeholder="Add your notes, links, or details here..."
                            rows={4}
                          />
                        </div>
                        <Button onClick={createResource} className="w-full">Share Resource</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {resources.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No resources yet. Share something to get started!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {resources.map((resource) => (
                        <div key={resource.id} className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {getResourceIcon(resource.resource_type)}
                                <h4 className="font-medium">{resource.title}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                {resource.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {format(new Date(resource.created_at), 'MMM dd, yyyy HH:mm')}
                              </p>
                            </div>
                            {resource.created_by === user?.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteResource(resource.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a group to view resources and members</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Collaboration;
