import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  logo_url: string | null;
  hero_image_url: string | null;
  theme_color: string;
  location: string | null;
  settings: {
    allow_orders: boolean;
    require_collection_point: boolean;
    enable_notifications: boolean;
    currency: string;
    timezone: string;
  };
}

interface EventContextType {
  currentEvent: Event | null;
  activeEvents: Event[];
  allEvents: Event[];
  isLoading: boolean;
  setCurrentEvent: (eventId: string) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentEvent, setCurrentEventState] = useState<Event | null>(null);
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      
      // Fetch active events for public
      const { data: active, error: activeError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: false });

      if (activeError) throw activeError;
      setActiveEvents((active || []) as unknown as Event[]);

      // Try to fetch all events (admin only)
      const { data: all, error: allError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (!allError) {
        setAllEvents((all || []) as unknown as Event[]);
      }

      // Set current event from localStorage or default to first active
      const storedEventId = localStorage.getItem('currentEventId');
      if (storedEventId && active) {
        const stored = active.find(e => e.id === storedEventId);
        if (stored) {
          setCurrentEventState(stored as unknown as Event);
        } else if (active.length > 0) {
          setCurrentEventState(active[0] as unknown as Event);
          localStorage.setItem('currentEventId', active[0].id);
        }
      } else if (active && active.length > 0) {
        setCurrentEventState(active[0] as unknown as Event);
        localStorage.setItem('currentEventId', active[0].id);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentEvent = async (eventId: string) => {
    const event = activeEvents.find(e => e.id === eventId) || allEvents.find(e => e.id === eventId);
    if (event) {
      setCurrentEventState(event);
      localStorage.setItem('currentEventId', eventId);
    }
  };

  const refreshEvents = async () => {
    await loadEvents();
  };

  return (
    <EventContext.Provider
      value={{
        currentEvent,
        activeEvents,
        allEvents,
        isLoading,
        setCurrentEvent,
        refreshEvents,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
