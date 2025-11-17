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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, LogOut, Plus, Tag, X, Book, FileText, Video, Link as LinkIcon, File, StickyNote, Filter, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Bibliotheca = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Form states
  const [itemTitle, setItemTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemContent, setItemContent] = useState('');
  const [itemType, setItemType] = useState<'book' | 'article' | 'video' | 'document' | 'link' | 'note'>('book');
  const [itemVisibility, setItemVisibility] = useState<'personal' | 'group'>('personal');
  const [itemGroupId, setItemGroupId] = useState('');
  const [itemTags, setItemTags] = useState<string[]>([]);
  
  const [tagName, setTagName] = useState('');
  const [tagType, setTagType] = useState<'subject' | 'course' | 'custom'>('subject');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchItems();
      fetchTags();
      fetchGroups();
      
      // Real-time subscriptions
      const itemsChannel = supabase
        .channel('library-items')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'library_items'
          },
          () => {
            fetchItems();
          }
        )
        .subscribe();

      const tagsChannel = supabase
        .channel('library-tags')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'library_tags'
          },
          () => {
            fetchTags();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(itemsChannel);
        supabase.removeChannel(tagsChannel);
      };
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('library_items')
        .select('*, library_item_tags(tag_id)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error('Failed to load library items');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('library_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      console.error('Failed to load tags:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user?.id);

      if (membersError) throw membersError;

      const groupIds = membersData?.map(m => m.group_id) || [];
      
      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }

      const { data: groupsData, error: groupsError } = await supabase
        .from('study_groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);
    } catch (error: any) {
      console.error('Failed to load groups:', error);
    }
  };

  const createTag = async () => {
    if (!tagName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('library_tags')
        .insert({
          name: tagName.toLowerCase(),
          tag_type: tagType,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success('Tag created!');
      setTagName('');
      setTagType('subject');
      setAddTagOpen(false);
      fetchTags();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Tag already exists');
      } else {
        toast.error('Failed to create tag');
      }
    }
  };

  const createItem = async () => {
    if (!itemTitle.trim() || !itemContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    if (itemVisibility === 'group' && !itemGroupId) {
      toast.error('Please select a group');
      return;
    }

    try {
      const { data: itemData, error: itemError } = await supabase
        .from('library_items')
        .insert({
          user_id: user?.id,
          title: itemTitle,
          description: itemDescription,
          content: itemContent,
          item_type: itemType,
          visibility: itemVisibility,
          group_id: itemVisibility === 'group' ? itemGroupId : null
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Add tags
      if (itemTags.length > 0) {
        const tagInserts = itemTags.map(tagId => ({
          item_id: itemData.id,
          tag_id: tagId
        }));

        const { error: tagError } = await supabase
          .from('library_item_tags')
          .insert(tagInserts);

        if (tagError) console.error('Failed to add tags:', tagError);
      }

      toast.success('Item added to library!');
      setItemTitle('');
      setItemDescription('');
      setItemContent('');
      setItemType('book');
      setItemVisibility('personal');
      setItemGroupId('');
      setItemTags([]);
      setAddItemOpen(false);
      fetchItems();
    } catch (error: any) {
      toast.error('Failed to add item');
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('library_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Item deleted');
      fetchItems();
    } catch (error: any) {
      toast.error('Failed to delete item');
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

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'book': return <Book className="w-5 h-5" />;
      case 'article': return <FileText className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'document': return <File className="w-5 h-5" />;
      case 'link': return <LinkIcon className="w-5 h-5" />;
      case 'note': return <StickyNote className="w-5 h-5" />;
      default: return <Book className="w-5 h-5" />;
    }
  };

  const getTagColor = (type: string) => {
    switch (type) {
      case 'subject': return 'bg-primary/10 text-primary border-primary/20';
      case 'course': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'custom': return 'bg-accent/10 text-accent-foreground border-accent/20';
      default: return 'bg-muted';
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab === 'personal' && item.visibility !== 'personal') return false;
    if (activeTab === 'group' && item.visibility !== 'group') return false;
    
    if (selectedTags.length === 0) return true;
    
    const itemTagIds = item.library_item_tags?.map((t: any) => t.tag_id) || [];
    return selectedTags.some(tagId => itemTagIds.includes(tagId));
  });

  const toggleTagFilter = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
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
              Bibliotheca 📚
            </h1>
            <p className="text-lg text-muted-foreground">
              Your personal and group resource library
            </p>
          </div>

          <div className="flex gap-2">
            <Dialog open={addTagOpen} onOpenChange={setAddTagOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Tag className="w-4 h-4" />
                  New Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Tag</DialogTitle>
                  <DialogDescription>Add a new tag to organize your library</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="tagName">Tag Name</Label>
                    <Input
                      id="tagName"
                      value={tagName}
                      onChange={(e) => setTagName(e.target.value)}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tagType">Tag Type</Label>
                    <Select value={tagType} onValueChange={(v: any) => setTagType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subject">Subject</SelectItem>
                        <SelectItem value="course">Course</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createTag} className="w-full">Create Tag</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-warm text-white gap-2">
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add to Library</DialogTitle>
                  <DialogDescription>Save a resource to your library</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="itemType">Type</Label>
                      <Select value={itemType} onValueChange={(v: any) => setItemType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="book">Book</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="itemVisibility">Visibility</Label>
                      <Select value={itemVisibility} onValueChange={(v: any) => setItemVisibility(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="group">Group</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {itemVisibility === 'group' && (
                    <div>
                      <Label htmlFor="itemGroup">Select Group</Label>
                      <Select value={itemGroupId} onValueChange={setItemGroupId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a group" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="itemTitle">Title</Label>
                    <Input
                      id="itemTitle"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      placeholder="Resource title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="itemDescription">Description (Optional)</Label>
                    <Input
                      id="itemDescription"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      placeholder="Brief description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="itemContent">Content/URL</Label>
                    <Textarea
                      id="itemContent"
                      value={itemContent}
                      onChange={(e) => setItemContent(e.target.value)}
                      placeholder="Add content, notes, or paste a URL..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={itemTags.includes(tag.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            setItemTags(prev =>
                              prev.includes(tag.id)
                                ? prev.filter(t => t !== tag.id)
                                : [...prev, tag.id]
                            );
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button onClick={createItem} className="w-full">Add to Library</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tags Filter */}
        {tags.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="w-4 h-4" />
                Filter by Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                    className={`cursor-pointer ${getTagColor(tag.tag_type)}`}
                    onClick={() => toggleTagFilter(tag.id)}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Library Items */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="personal">Personal Library</TabsTrigger>
            <TabsTrigger value="group">
              <Users className="w-4 h-4 mr-2" />
              Group Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-6">
            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No items in your personal library yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => {
                  const itemTagList = tags.filter(tag =>
                    item.library_item_tags?.some((it: any) => it.tag_id === tag.id)
                  );

                  return (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                              {getItemIcon(item.item_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">{item.title}</CardTitle>
                              {item.description && (
                                <CardDescription className="text-sm mt-1 line-clamp-2">
                                  {item.description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          {item.user_id === user?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem(item.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words line-clamp-3 mb-3">
                          {item.content}
                        </p>
                        
                        {itemTagList.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {itemTagList.map(tag => (
                              <Badge key={tag.id} variant="outline" className={`text-xs ${getTagColor(tag.tag_type)}`}>
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), 'MMM dd, yyyy')}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="group" className="mt-6">
            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No items in group libraries yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => {
                  const itemTagList = tags.filter(tag =>
                    item.library_item_tags?.some((it: any) => it.tag_id === tag.id)
                  );

                  return (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                              {getItemIcon(item.item_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">{item.title}</CardTitle>
                              {item.description && (
                                <CardDescription className="text-sm mt-1 line-clamp-2">
                                  {item.description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          {item.user_id === user?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem(item.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words line-clamp-3 mb-3">
                          {item.content}
                        </p>
                        
                        {itemTagList.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {itemTagList.map(tag => (
                              <Badge key={tag.id} variant="outline" className={`text-xs ${getTagColor(tag.tag_type)}`}>
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), 'MMM dd, yyyy')}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Bibliotheca;
