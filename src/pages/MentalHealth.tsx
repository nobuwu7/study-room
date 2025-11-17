import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, ArrowLeft, Heart, Clock, Bookmark, BookmarkCheck, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  age_group: string;
  tags: string[];
  read_time_minutes: number;
  published_at: string;
}

const MentalHealth = () => {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All Topics', color: 'bg-purple-100 text-purple-700' },
    { value: 'mental_health', label: 'Mental Health', color: 'bg-blue-100 text-blue-700' },
    { value: 'coping_mechanisms', label: 'Coping Strategies', color: 'bg-green-100 text-green-700' },
    { value: 'wellbeing', label: 'Wellbeing', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'environment', label: 'Environment', color: 'bg-orange-100 text-orange-700' },
    { value: 'relationships', label: 'Relationships', color: 'bg-pink-100 text-pink-700' },
    { value: 'academic', label: 'Academic', color: 'bg-indigo-100 text-indigo-700' },
  ];

  const ageGroups = [
    { value: 'all', label: 'All Ages' },
    { value: 'middle_school', label: 'Middle School' },
    { value: 'high_school', label: 'High School' },
    { value: 'college', label: 'College' },
  ];

  useEffect(() => {
    loadArticles();
    if (activeProfile) {
      loadBookmarks();
    }
  }, [activeProfile]);

  useEffect(() => {
    filterArticles();
  }, [articles, searchQuery, selectedCategory, selectedAgeGroup]);

  const loadArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('mental_health_articles')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!activeProfile) return;

    try {
      const { data, error } = await supabase
        .from('mental_health_bookmarks')
        .select('article_id')
        .eq('profile_id', activeProfile.id);

      if (error) throw error;
      setBookmarkedIds(new Set(data?.map(b => b.article_id) || []));
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const toggleBookmark = async (articleId: string) => {
    if (!activeProfile) {
      toast.error('Please select a profile');
      return;
    }

    try {
      if (bookmarkedIds.has(articleId)) {
        const { error } = await supabase
          .from('mental_health_bookmarks')
          .delete()
          .eq('profile_id', activeProfile.id)
          .eq('article_id', articleId);

        if (error) throw error;
        setBookmarkedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(articleId);
          return newSet;
        });
        toast.success('Bookmark removed');
      } else {
        const { error } = await supabase
          .from('mental_health_bookmarks')
          .insert({
            user_id: activeProfile.user_id,
            profile_id: activeProfile.id,
            article_id: articleId,
          });

        if (error) throw error;
        setBookmarkedIds(prev => new Set([...prev, articleId]));
        toast.success('Article bookmarked!');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const filterArticles = () => {
    let filtered = [...articles];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        article =>
          article.title.toLowerCase().includes(query) ||
          article.description.toLowerCase().includes(query) ||
          article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by age group
    if (selectedAgeGroup !== 'all') {
      filtered = filtered.filter(
        article =>
          article.age_group === 'all' ||
          article.age_group.includes(selectedAgeGroup)
      );
    }

    setFilteredArticles(filtered);
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8 animate-fade-in text-center">
          <div className="inline-flex items-center justify-center p-3 bg-pink-100 rounded-full mb-4">
            <Heart className="w-8 h-8 text-pink-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Mental Health & Wellness
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Science-backed articles, coping strategies, and guides to support your mental wellbeing
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-border/50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search articles, topics, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge
                      key={cat.value}
                      variant={selectedCategory === cat.value ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        selectedCategory === cat.value ? 'bg-primary' : ''
                      }`}
                      onClick={() => setSelectedCategory(cat.value)}
                    >
                      {cat.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Age Group Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Age Group</label>
                <div className="flex flex-wrap gap-2">
                  {ageGroups.map((group) => (
                    <Badge
                      key={group.value}
                      variant={selectedAgeGroup === group.value ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        selectedAgeGroup === group.value ? 'bg-primary' : ''
                      }`}
                      onClick={() => setSelectedAgeGroup(group.value)}
                    >
                      {group.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No articles found matching your filters. Try adjusting your search.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="border-border/50 hover:shadow-lg transition-all cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className={getCategoryColor(article.category)}>
                      {categories.find(c => c.value === article.category)?.label || article.category}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(article.id);
                      }}
                      className="h-8 w-8 p-0 hover:scale-110 transition-transform"
                    >
                      {bookmarkedIds.has(article.id) ? (
                        <BookmarkCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <CardTitle 
                    className="text-lg group-hover:text-primary transition-colors"
                    onClick={() => setSelectedArticle(article)}
                  >
                    {article.title}
                  </CardTitle>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{article.read_time_minutes} min read</span>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setSelectedArticle(article)}
                      className="p-0 h-auto"
                    >
                      Read more →
                    </Button>
                  </div>
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {article.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Crisis Resources Banner */}
        <Card className="mt-8 bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-red-900 mb-2">Need Immediate Help?</h3>
            <div className="text-sm text-red-800 space-y-1">
              <p><strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988 (US)</p>
              <p><strong>Crisis Text Line:</strong> Text "HELLO" to 741741</p>
              <p><strong>International:</strong> Visit findahelpline.com</p>
              <p className="mt-2">If you're in immediate danger, call emergency services (911 in US)</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Article Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Badge className={`${getCategoryColor(selectedArticle.category)} mb-2`}>
                      {categories.find(c => c.value === selectedArticle.category)?.label}
                    </Badge>
                    <DialogTitle className="text-2xl">{selectedArticle.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{selectedArticle.read_time_minutes} min read</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleBookmark(selectedArticle.id)}
                    className="hover:scale-110 transition-transform"
                  >
                    {bookmarkedIds.has(selectedArticle.id) ? (
                      <BookmarkCheck className="w-5 h-5 text-primary" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
                </div>
                {selectedArticle.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
                    {selectedArticle.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentalHealth;
