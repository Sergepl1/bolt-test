import { LogOut, Settings, User, MessageSquare, Bell } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { DEFAULT_AVATAR_URL } from '@/lib/auth';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface UserMenuProps {
  username: string;
  avatarUrl?: string;
}

export function UserMenu({ username, avatarUrl }: UserMenuProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const subscription = useRef<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: count, error } = await supabase
        .rpc('get_unread_message_count', { user_id_param: user.id });

      if (error) throw error;

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const setupSubscription = async () => {
      setIsLoading(true);
      
      // Initial fetch
      await fetchUnreadCount();

      // Subscribe to all message changes
      subscription.current = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          fetchUnreadCount
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription.current) {
        subscription.current.unsubscribe();
      }
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      
      if (subscription.current) {
        subscription.current.unsubscribe();
      }
      
      // Navigate to home page if on profile page
      if (location.pathname === '/profile') {
        navigate('/');
      }
      
      toast({
        title: 'Erfolgreich abgemeldet',
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Fehler beim Abmelden',
        description: 'Bitte versuche es später erneut.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  const img = e.target as HTMLImageElement;
                  img.src = DEFAULT_AVATAR_URL;
                }}
              />
            ) : (
              <img
                src={DEFAULT_AVATAR_URL}
                alt={username}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/messages" className="cursor-pointer">
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Meine Nachrichten</span>
            {!isLoading && unreadCount > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile?tab=security" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Sicherheit</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Abmelden</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}