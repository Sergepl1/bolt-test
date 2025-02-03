import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import { addToFavorites, removeFromFavorites, checkIsFavorite } from '@/lib/favorites';

export function useFavorite(listingId: string, onAuthRequired?: () => void) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const [authCallback, setAuthCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    async function checkFavorite() {
      try {
        const favorite = await checkIsFavorite(listingId);
        setIsFavorite(favorite);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkFavorite();
  }, [listingId]);

  const toggleFavorite = async (onAuthRequired?: () => void) => {
    if (!user) {
      setAuthCallback(() => () => {
        toggleFavorite();
      });
      onAuthRequired?.();
      return;
    }

    // Clear any stored callback
    setAuthCallback(null);

    try {
      if (isFavorite) {
        await removeFromFavorites(listingId);
        toast({
          title: 'Von Favoriten entfernt',
          description: 'Das Inserat wurde von Ihren Favoriten entfernt.',
        });
      } else {
        await addToFavorites(listingId);
        toast({
          title: 'Zu Favoriten hinzugefügt',
          description: 'Das Inserat wurde zu Ihren Favoriten hinzugefügt.',
        });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Fehler',
        description: 'Die Aktion konnte nicht ausgeführt werden.',
        variant: 'destructive',
      });
    }
  };

  return {
    isFavorite,
    isLoading,
    toggleFavorite
  };
}