import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { BookOpen, LogOut, Users, Plus, Mail, FileText, Link as LinkIcon, CheckSquare, Trash2, Edit, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AccessLevel = 'viewer' | 'editor' | 'admin';
type ResourceType = 'note' | 'link' | 'task';

interface Group {
  id: string;
  name: string;
  description: string;
}

interface Member {
  id: string;
  user_id: string;
  role: AccessLevel;
  email: string;
}

interface Resource {
  id: string;
  title: string;
  content: string;
  resource_type: ResourceType;
  created_by: string;
  created_at: string;
}

const Collaboration = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<AccessLevel | null>(null);
  
  // Resources
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    content: '',
    type: 'note' as ResourceType
  });
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  
  // Members
  const [members, setMembers] = useState<Member[]>([]);
  
  // Invitations
  const [inviteForm, setInviteForm] = useState({
    email: '',
    accessLevel: 'viewer' as AccessLevel
  });
  
  // Group creation
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: ''
  });
  
  const [showGroupForm, setShowGroupForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup && user) {
      fetchGroupData();
      setupRealtimeSubscriptions();
      
      return () => {
        supabase.removeAllChannels();
      };
    }
  }, [selectedGroup, user]);

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('study_groups')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load groups');
      return;
    }
    
    setGroups(data || []);
  };

  const fetchGroupData = async () => {
    if (!selectedGroup) return;
    
    // Fetch user role
    const { data: roleData } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', selectedGroup.id)
      .eq('user_id', user?.id)
      .single();
    
    setCurrentUserRole((roleData?.role as AccessLevel) || null);
    
    // Fetch resources
    const { data: resourcesData } = await supabase
      .from('shared_resources')
      .select('*')
      .eq('group_id', selectedGroup.id)
      .order('created_at', { ascending: false });
    
    setResources((resourcesData || []) as Resource[]);
    
    // Fetch members with emails
    const { data: membersData } = await supabase
      .from('group_members')
      .select('id, user_id, role')
      .eq('group_id', selectedGroup.id);
    
    if (membersData) {
      const membersWithEmails = await Promise.all(
        membersData.map(async (member) => {
          const { data: userData } = await supabase.rpc('get_user_email', {
            _user_id: member.user_id
          });
          return { ...member, email: userData || 'Unknown', role: member.role as AccessLevel };
        })
      );
      setMembers(membersWithEmails);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!selectedGroup) return;
    
    const channel = supabase
      .channel(`group-${selectedGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_resources',
          filter: `group_id=eq.${selectedGroup.id}`
        },
        () => fetchGroupData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${selectedGroup.id}`
        },
        () => fetchGroupData()
      )
      .subscribe();
  };

  const createGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    
    const { data, error } = await supabase
      .from('study_groups')
      .insert({
        name: groupForm.name,
        description: groupForm.description,
        created_by: user?.id
      })
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to create group');
      return;
    }
    
    toast.success('Group created successfully');
    setGroupForm({ name: '', description: '' });
    setShowGroupForm(false);
    fetchGroups();
    setSelectedGroup(data);
  };

  const inviteMember = async () => {
    if (!selectedGroup || !inviteForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    
    if (currentUserRole !== 'admin') {
      toast.error('Only admins can invite members');
      return;
    }
    
    const { error } = await supabase
      .from('group_invitations')
      .insert({
        group_id: selectedGroup.id,
        invited_email: inviteForm.email,
        invited_by: user?.id,
        role: inviteForm.accessLevel
      });
    
    if (error) {
      toast.error('Failed to send invitation');
      return;
    }
    
    toast.success('Invitation sent successfully');
    setInviteForm({ email: '', accessLevel: 'viewer' });
  };

  const createOrUpdateResource = async () => {
    if (!selectedGroup || !resourceForm.title.trim() || !resourceForm.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    
    if (currentUserRole === 'viewer') {
      toast.error('Viewers cannot create or edit resources');
      return;
    }
    
    if (editingResourceId) {
      const { error } = await supabase
        .from('shared_resources')
        .update({
          title: resourceForm.title,
          content: resourceForm.content,
          resource_type: resourceForm.type
        })
        .eq('id', editingResourceId);
      
      if (error) {
        toast.error('Failed to update resource');
        return;
      }
      
      toast.success('Resource updated successfully');
    } else {
      const { error } = await supabase
        .from('shared_resources')
        .insert({
          group_id: selectedGroup.id,
          title: resourceForm.title,
          content: resourceForm.content,
          resource_type: resourceForm.type,
          created_by: user?.id
        });
      
      if (error) {
        toast.error('Failed to create resource');
        return;
      }
      
      toast.success('Resource created successfully');
    }
    
    setResourceForm({ title: '', content: '', type: 'note' });
    setEditingResourceId(null);
  };

  const editResource = (resource: Resource) => {
    if (currentUserRole === 'viewer') {
      toast.error('Viewers cannot edit resources');
      return;
    }
    
    setResourceForm({
      title: resource.title,
      content: resource.content,
      type: resource.resource_type
    });
    setEditingResourceId(resource.id);
  };

  const deleteResource = async (id: string) => {
    if (currentUserRole === 'viewer') {
      toast.error('Viewers cannot delete resources');
      return;
    }
    
    const { error } = await supabase
      .from('shared_resources')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete resource');
      return;
    }
    
    toast.success('Resource deleted successfully');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold text-foreground">StudyTracker</span>
            </Link>
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Collaboration</h1>
          <p className="text-muted-foreground mb-8">Share and collaborate on study resources with your groups</p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Groups Sidebar */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">My Groups</CardTitle>
                  <CardDescription>Select a group to manage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {groups.map((group) => (
                    <Button
                      key={group.id}
                      variant={selectedGroup?.id === group.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedGroup(group)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {group.name}
                    </Button>
                  ))}
                  
                  <Separator />
                  
                  {!showGroupForm ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowGroupForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Group
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        placeholder="Group name"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={groupForm.description}
                        onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button onClick={createGroup} size="sm" className="flex-1">
                          Create
                        </Button>
                        <Button
                          onClick={() => {
                            setShowGroupForm(false);
                            setGroupForm({ name: '', description: '' });
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {selectedGroup ? (
                <>
                  {/* Group Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedGroup.name}</CardTitle>
                      <CardDescription>{selectedGroup.description || 'No description'}</CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Invite Section */}
                  {currentUserRole === 'admin' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UserPlus className="h-5 w-5" />
                          Invite Collaborators
                        </CardTitle>
                        <CardDescription>Add people to your group with specific access levels</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="invite-email">Email Address</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              placeholder="colleague@example.com"
                              value={inviteForm.email}
                              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="access-level">Access Level</Label>
                            <Select
                              value={inviteForm.accessLevel}
                              onValueChange={(value) => setInviteForm({ ...inviteForm, accessLevel: value as AccessLevel })}
                            >
                              <SelectTrigger id="access-level">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer - Can only view resources</SelectItem>
                                <SelectItem value="editor">Editor - Can view and edit resources</SelectItem>
                                <SelectItem value="admin">Admin - Full control including invites</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={inviteMember}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Invitation
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Members List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Members ({members.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                            <span className="text-sm">{member.email}</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">
                              {member.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resource Form */}
                  {currentUserRole !== 'viewer' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {editingResourceId ? 'Edit Resource' : 'Share New Resource'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="resource-type">Type</Label>
                            <Select
                              value={resourceForm.type}
                              onValueChange={(value) => setResourceForm({ ...resourceForm, type: value as ResourceType })}
                            >
                              <SelectTrigger id="resource-type">
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
                            <Label htmlFor="resource-title">Title</Label>
                            <Input
                              id="resource-title"
                              placeholder="Resource title"
                              value={resourceForm.title}
                              onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="resource-content">Content</Label>
                            <Textarea
                              id="resource-content"
                              placeholder="Resource content or URL"
                              value={resourceForm.content}
                              onChange={(e) => setResourceForm({ ...resourceForm, content: e.target.value })}
                              rows={4}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={createOrUpdateResource} className="flex-1">
                              {editingResourceId ? 'Update' : 'Share'} Resource
                            </Button>
                            {editingResourceId && (
                              <Button
                                onClick={() => {
                                  setResourceForm({ title: '', content: '', type: 'note' });
                                  setEditingResourceId(null);
                                }}
                                variant="outline"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Resources List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Shared Resources ({resources.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {resources.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No resources shared yet
                          </p>
                        ) : (
                          resources.map((resource) => (
                            <div key={resource.id} className="p-4 rounded-lg border border-border">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {getResourceIcon(resource.resource_type)}
                                  <h3 className="font-semibold text-foreground">{resource.title}</h3>
                                </div>
                                {currentUserRole !== 'viewer' && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => editResource(resource)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteResource(resource.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{resource.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a group to view and manage resources</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collaboration;
