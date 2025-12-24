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
      setStreams([]);

      try {
        // Step 1: Fetch Vidlink (fast)
        const vidlinkData = await providerService.getStreams(contentId, type, season, episode, 'vidlink');
        if (mounted) {
          setStreams(vidlinkData || []);
          // If we got Vidlink streams, we can stop "main" loading, but show "background" loading
          setLoading(false);
          setLoadingOthers(true);
        }

        // Step 2: Fetch others (slow) - regardless of Vidlink success, as per user request to "fetch others below"
        const otherData = await providerService.getStreams(contentId, type, season, episode, 'others');

        if (mounted) {
          setStreams(prev => {
            // Avoid duplicates if any overlap occurs (though backend separates them)
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
      fetchStreams();
    }

    return () => { mounted = false; };
  }, [contentId, type, season, episode]);

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
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

