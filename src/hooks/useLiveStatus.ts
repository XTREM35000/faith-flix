import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchActiveLiveStream, type LiveStream } from "@/lib/supabase/mediaQueries";

export function useLiveStatus() {
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [currentLive, setCurrentLive] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      try {
        const stream = await fetchActiveLiveStream();
        if (cancelled) return;
        setCurrentLive(stream);
        setIsLiveActive(!!stream);
      } catch (e) {
        if (!cancelled) {
          console.error("[useLiveStatus] error loading active stream", e);
          setCurrentLive(null);
          setIsLiveActive(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const subscribeRealtime = () => {
      if (channel) supabase.removeChannel(channel);
      channel = supabase
        .channel("public:live_streams")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "live_streams" },
          () => {
            if (!document.hidden) void load();
          }
        )
        .subscribe();
    };

    const startPoll = () => {
      if (pollTimer != null) window.clearInterval(pollTimer);
      pollTimer = window.setInterval(() => {
        if (!document.hidden) void load();
      }, 30_000);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (pollTimer != null) {
          window.clearInterval(pollTimer);
          pollTimer = null;
        }
        if (channel) {
          supabase.removeChannel(channel);
          channel = null;
        }
      } else {
        void load();
        subscribeRealtime();
        startPoll();
      }
    };

    void load();
    subscribeRealtime();
    startPoll();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (pollTimer != null) window.clearInterval(pollTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return { isLiveActive, currentLive, loading } as const;
}

export default useLiveStatus;

