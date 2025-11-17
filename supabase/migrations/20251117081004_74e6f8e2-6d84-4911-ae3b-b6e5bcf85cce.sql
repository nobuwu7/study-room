-- Create mental_health_articles table
CREATE TABLE public.mental_health_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  age_group TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  author TEXT,
  source_url TEXT,
  image_url TEXT,
  read_time_minutes INTEGER,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mental_health_articles ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (articles are public)
CREATE POLICY "Anyone can view mental health articles" 
ON public.mental_health_articles 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mental_health_articles_updated_at
BEFORE UPDATE ON public.mental_health_articles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for faster queries
CREATE INDEX idx_mental_health_articles_category ON public.mental_health_articles(category);
CREATE INDEX idx_mental_health_articles_age_group ON public.mental_health_articles(age_group);
CREATE INDEX idx_mental_health_articles_published_at ON public.mental_health_articles(published_at DESC);

-- Insert initial helpful articles
INSERT INTO public.mental_health_articles (title, description, content, category, age_group, tags, read_time_minutes) VALUES
(
  'Understanding Stress and How to Manage It',
  'Learn about the science of stress and evidence-based techniques to reduce its impact on your life.',
  '# Understanding Stress

## What is Stress?
Stress is your body''s natural response to challenges and demands. While some stress can be motivating, chronic stress can negatively impact your mental and physical health.

## Signs of Stress
- Physical: headaches, muscle tension, fatigue
- Emotional: anxiety, irritability, feeling overwhelmed
- Behavioral: changes in sleep, appetite, or social habits

## Science-Backed Coping Strategies

### 1. Deep Breathing Exercises
The 4-7-8 technique: Breathe in for 4 counts, hold for 7, exhale for 8. This activates your parasympathetic nervous system.

### 2. Regular Physical Activity
Exercise releases endorphins and reduces cortisol levels. Even a 20-minute walk can help.

### 3. Adequate Sleep
Aim for 7-9 hours per night. Sleep deprivation amplifies stress responses.

### 4. Mindfulness and Meditation
Studies show 10-15 minutes daily can reduce anxiety and improve focus.

### 5. Social Connection
Talking to friends, family, or counselors provides emotional support and perspective.

## When to Seek Help
If stress interferes with daily activities for more than 2 weeks, consider reaching out to a mental health professional.',
  'coping_mechanisms',
  'all',
  ARRAY['stress', 'coping', 'mental-health-basics'],
  8
),
(
  'Creating a Healthy Study Environment',
  'Tips for designing your study space to support both productivity and mental wellbeing.',
  '# Creating a Healthy Study Environment

A well-designed study space can significantly impact your mental health and academic performance.

## Physical Environment

### Lighting
- Use natural light when possible
- Avoid harsh overhead lighting
- Consider a desk lamp with warm, adjustable brightness

### Organization
- Keep your space clutter-free (reduces cortical arousal)
- Use organizers for materials
- Have only current work visible

### Ergonomics
- Chair at proper height
- Screen at eye level
- Take posture breaks every 30 minutes

## Mental Environment

### Minimize Distractions
- Use website blockers during study time
- Keep phone out of reach
- Use noise-cancelling headphones if needed

### Create Boundaries
- Designate specific study hours
- Communicate boundaries to others
- Have a non-study relaxation space

### Positive Atmosphere
- Add plants (shown to reduce stress)
- Display motivational items
- Keep it personal but not overwhelming

## Toxic Environment Red Flags
- Constant criticism from others
- Perfectionist pressure
- Comparison culture
- Lack of breaks or self-care

## Building a Non-Toxic Mindset
1. Practice self-compassion
2. Set realistic expectations
3. Celebrate small wins
4. Know when to ask for help',
  'environment',
  'all',
  ARRAY['study-space', 'productivity', 'wellbeing'],
  6
),
(
  'Recognizing and Managing Anxiety',
  'Understanding anxiety disorders and learning practical techniques to manage anxious thoughts.',
  '# Understanding Anxiety

## What is Anxiety?
Anxiety is more than temporary worry—it''s persistent excessive fear about everyday situations.

## Common Signs
- Restlessness or feeling on edge
- Difficulty concentrating
- Rapid heartbeat
- Sleep problems
- Intrusive thoughts

## Evidence-Based Techniques

### Cognitive Restructuring
Challenge anxious thoughts:
1. Identify the thought
2. Examine the evidence
3. Consider alternatives
4. Choose a balanced perspective

### Grounding Techniques
**5-4-3-2-1 Method:**
- 5 things you can see
- 4 things you can touch
- 3 things you can hear
- 2 things you can smell
- 1 thing you can taste

### Progressive Muscle Relaxation
Tense and release muscle groups systematically to reduce physical tension.

### Exposure Hierarchy
Gradually face feared situations in a controlled way with professional guidance.

## When Anxiety Becomes a Problem
Seek help if anxiety:
- Persists for 6+ months
- Interferes with daily life
- Causes significant distress
- Includes panic attacks

## Professional Resources
- School counseling services
- Cognitive Behavioral Therapy (CBT)
- Acceptance and Commitment Therapy (ACT)
- Medication when appropriate',
  'mental_health',
  'high_school,college',
  ARRAY['anxiety', 'mental-health', 'coping'],
  10
),
(
  'The Importance of Sleep for Mental Health',
  'Discover how sleep affects your mental health and learn strategies for better sleep hygiene.',
  '# Sleep and Mental Health

## The Science of Sleep
Sleep isn''t just rest—it''s when your brain consolidates memories, processes emotions, and repairs itself.

## How Sleep Affects Mental Health
- **Mood Regulation**: Sleep deprivation increases emotional reactivity
- **Cognitive Function**: 7-9 hours needed for optimal memory and focus
- **Stress Response**: Poor sleep elevates cortisol levels
- **Mental Health Risks**: Chronic sleep loss linked to depression and anxiety

## Sleep Hygiene Basics

### Consistent Schedule
- Same bedtime and wake time (even weekends)
- This reinforces your circadian rhythm

### Pre-Sleep Routine (Wind Down)
- 30-60 minutes before bed
- Dim lights (reduces blue light exposure)
- Calming activities: reading, gentle stretching, meditation

### Environment Optimization
- Cool temperature (65-68°F / 18-20°C)
- Complete darkness (or eye mask)
- Quiet (or white noise)
- Comfortable bedding

### What to Avoid
- Caffeine after 2 PM
- Heavy meals 3 hours before bed
- Screens 1 hour before sleep
- Alcohol (disrupts REM sleep)
- Intense exercise 3 hours before bed

## Common Sleep Issues

### Can''t Fall Asleep?
If awake for 20+ minutes, get up and do a quiet activity until sleepy.

### Racing Thoughts?
- Write them down to "park" them
- Practice 4-7-8 breathing
- Progressive muscle relaxation

### Wake Up Tired?
May indicate sleep apnea or other disorders—consult a doctor.

## Emergency Sleep Tips for Students
- Power naps: 20 minutes max (longer causes grogginess)
- Strategic caffeine: Morning and early afternoon only
- Prioritize sleep over late-night cramming (better retention)',
  'wellbeing',
  'all',
  ARRAY['sleep', 'health', 'productivity'],
  7
),
(
  'Building Healthy Social Connections',
  'Learn how to foster positive relationships and recognize toxic dynamics.',
  '# Healthy Social Connections

## Why Relationships Matter
Strong social connections are one of the most significant factors in mental wellbeing and longevity.

## Signs of Healthy Friendships
- Mutual respect and trust
- Open, honest communication
- Support during difficulties
- Celebrate each other''s successes
- Healthy boundaries
- You feel energized after interactions

## Toxic Relationship Red Flags
- Constant criticism or putdowns
- One-sided effort
- Drama and manipulation
- Feeling drained after interactions
- Pressure to change yourself
- Violation of boundaries

## Building Better Connections

### For Introverts
- Quality over quantity
- One-on-one interactions
- Shared activities (less pressure to talk)
- Online communities with shared interests

### For Everyone
1. **Be authentic** - Genuine connections start with being yourself
2. **Active listening** - Give full attention, ask questions
3. **Initiate** - Don''t wait for others to reach out
4. **Join groups** - Clubs, study groups, volunteer work
5. **Be vulnerable** - Share appropriately to deepen bonds

## Setting Boundaries

### What Are Boundaries?
Limits you set to protect your wellbeing.

### How to Set Them
1. Identify your limits
2. Communicate clearly and directly
3. Be consistent
4. Don''t over-explain or apologize
5. Follow through with consequences

### Example Phrases
- "I need some alone time to recharge"
- "I can''t help with that right now"
- "I''m not comfortable discussing this"

## Dealing with Loneliness
Loneliness is common among students. If feeling isolated:
- Reach out to campus resources
- Join interest-based groups
- Volunteer (helps others and you)
- Consider counseling
- Remember: feeling lonely doesn''t mean you''re alone',
  'relationships',
  'all',
  ARRAY['relationships', 'boundaries', 'social-health'],
  9
),
(
  'Managing Academic Pressure and Perfectionism',
  'Strategies for handling academic stress and overcoming perfectionist tendencies.',
  '# Academic Pressure and Perfectionism

## The Perfectionism Trap
Perfectionism isn''t about high standards—it''s fear of failure disguised as ambition.

## Types of Perfectionism

### Self-Oriented
Setting unrealistically high standards for yourself.

### Socially Prescribed
Believing others expect perfection from you.

### Other-Oriented
Demanding perfection from others.

## Negative Impacts
- Procrastination (fear of imperfection)
- Anxiety and depression
- Burnout
- Imposter syndrome
- Relationship issues

## Breaking Free from Perfectionism

### Reframe Your Mindset
- **Growth vs. Fixed**: Focus on learning, not just results
- **Progress over Perfection**: Done is better than perfect
- **Self-compassion**: Treat yourself as you would a friend

### Practical Strategies

1. **Set Realistic Goals**
   - Use SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)
   - Break big goals into smaller steps

2. **Accept "Good Enough"**
   - Identify tasks where 80% is sufficient
   - Save perfection for truly critical work

3. **Challenge All-or-Nothing Thinking**
   - One bad grade ≠ failure
   - Look for shades of gray

4. **Learn from Mistakes**
   - View errors as learning opportunities
   - Ask: "What can I learn from this?"

5. **Practice Self-Compassion**
   - Acknowledge your feelings
   - Recognize common humanity
   - Be kind to yourself

## Managing Academic Pressure

### Time Management
- Use a planner
- Prioritize tasks (urgent vs. important)
- Schedule breaks and fun

### Study Strategies
- Active recall over passive review
- Spaced repetition
- Study groups for accountability
- Ask for help early

### When to Seek Help
If academic stress causes:
- Panic attacks
- Thoughts of self-harm
- Inability to function daily
- Substance use for coping

Contact your school''s counseling center immediately.',
  'academic',
  'high_school,college',
  ARRAY['perfectionism', 'academic-stress', 'pressure'],
  11
);

-- Create user bookmarks table for saving favorite articles
CREATE TABLE public.mental_health_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID NOT NULL REFERENCES public.mental_health_articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Enable Row Level Security
ALTER TABLE public.mental_health_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for bookmarks
CREATE POLICY "Users can view their own bookmarks" 
ON public.mental_health_bookmarks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" 
ON public.mental_health_bookmarks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON public.mental_health_bookmarks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for bookmarks
CREATE INDEX idx_mental_health_bookmarks_user_id ON public.mental_health_bookmarks(user_id);