import { useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Plus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ProfileSwitcher = () => {
  const { profiles, activeProfile, switchProfile, createProfile, deleteProfile } = useProfile();
  const { toast } = useToast();
  const [newProfileName, setNewProfileName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast({
        title: 'Profile name required',
        description: 'Please enter a name for your profile',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createProfile(newProfileName);
      setNewProfileName('');
      setDialogOpen(false);
      toast({
        title: 'Profile created',
        description: `${newProfileName} has been created successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create profile',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <User className="h-4 w-4" />
            {activeProfile?.profile_name || 'Select Profile'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-background z-50">
          <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {profiles.map((profile) => (
            <DropdownMenuItem
              key={profile.id}
              onClick={() => switchProfile(profile.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <span>{profile.profile_name}</span>
                {activeProfile?.id === profile.id && <Check className="h-4 w-4" />}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Create New Profile
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle>Create New Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="profile-name">Profile Name</Label>
            <Input
              id="profile-name"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Enter profile name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateProfile();
                }
              }}
            />
          </div>
          <Button onClick={handleCreateProfile} className="w-full">
            Create Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
