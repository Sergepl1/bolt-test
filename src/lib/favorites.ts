import { supabase } from './supabase';

export async function addToFavorites(listingId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('listing_favorites')
    .insert({
      listing_id: listingId,
      user_id: user.user.id,
    });

  if (error) throw error;
}

export async function removeFromFavorites(listingId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('listing_favorites')
    .delete()
    .eq('listing_id', listingId)
    .eq('user_id', user.user.id);

  if (error) throw error;
}

export async function checkIsFavorite(listingId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  const { data, error } = await supabase
    .from('listing_favorites')
    .select()
    .eq('listing_id', listingId)
    .eq('user_id', user.user.id)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function getFavorites() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('listing_favorites')
    .select(`
      listing_id,
      listings (
        id,
        title,
        price,
        type,
        auction_start_price,
        auction_end_time,
        location,
        category,
        listing_images (
          url,
          is_featured
        )
      )
    `)
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}