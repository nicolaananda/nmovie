import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { providerService } from '../services/providerService';

export function useStreams(contentId: string, type: 'movie' | 'series', season?: number, episode?: number) {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOthers, setLoadingOthers] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStreams = async () => {
      setLoading(true);
      setError(null);
      setStreams([]); // Clear cache - always fresh data

      try {
        // Step 1: Fetch Vidlink (fast)
        const vidlinkData = await providerService.getStreams(contentId, type, season, episode, 'vidlink');
        if (mounted) {
          setStreams(vidlinkData || []);
          setLoading(false);
          setLoadingOthers(true); // Show loading for others
        }

        // Step 2: Fetch others (additional scrapers)
        const otherData = await providerService.getStreams(contentId, type, season, episode, 'others');
        if (mounted) {
          setStreams(prev => {
            return [...prev, ...(otherData || [])];
          });
        }
      } catch (err) {
        if (mounted) setError(err);
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingOthers(false);
        }
      }
    };

    if (contentId) {
      fetchStreams(); // Always fetch fresh - no cache
    }

    return () => { mounted = false; };
  }, [contentId, type, season, episode]); // Refetch on any param change

  return {
    data: streams,
    isLoading: loading,
    isLoadingMore: loadingOthers, // New state for UI
    error,
    refetch: () => setStreams([]) // Simplified refetch trigger
  };
}

export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: () => providerService.loadProviders(),
    staleTime: 0, // No cache - always fresh
  });
}

