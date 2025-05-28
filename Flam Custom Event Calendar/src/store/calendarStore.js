import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { hasTimeConflict } from '../utils/recurrence';

// Load events from localStorage on store initialization
const loadEvents = () => {
  try {
    const savedEvents = localStorage.getItem('calendarEvents');
    return savedEvents ? JSON.parse(savedEvents) : [];
  } catch (error) {
    console.error('Error loading events from localStorage:', error);
    return [];
  }
};

export const useCalendarStore = create(
  persist(
    (set, get) => ({
      events: loadEvents(),

      addEvent: (event) => {
        const events = get().events;
        
        // Check for time conflicts
        if (hasTimeConflict(event, events)) {
          throw new Error('Another event already exists at this time.');
        }

        set((state) => {
          const newEvents = [...state.events, { ...event, id: crypto.randomUUID() }];
          localStorage.setItem('calendarEvents', JSON.stringify(newEvents));
          return { events: newEvents };
        });
      },

      updateEvent: (updatedEvent) => {
        const events = get().events;
        
        // For recurring events, we need to handle all instances
        if (updatedEvent.originalEventId) {
          const originalEvent = events.find(e => e.id === updatedEvent.originalEventId);
          if (originalEvent) {
            // Update the original recurring event
            set((state) => {
              const newEvents = state.events.map(event =>
                event.id === originalEvent.id ? { ...updatedEvent, id: event.id } : event
              );
              localStorage.setItem('calendarEvents', JSON.stringify(newEvents));
              return { events: newEvents };
            });
            return;
          }
        }

        // Check for time conflicts with other events
        const otherEvents = events.filter(e => e.id !== updatedEvent.id);
        if (hasTimeConflict(updatedEvent, otherEvents)) {
          throw new Error('Another event already exists at this time.');
        }

        set((state) => {
          const newEvents = state.events.map(event =>
            event.id === updatedEvent.id ? updatedEvent : event
          );
          localStorage.setItem('calendarEvents', JSON.stringify(newEvents));
          return { events: newEvents };
        });
      },

      deleteEvent: (eventId) => {
        set((state) => {
          const event = state.events.find(e => e.id === eventId);
          let newEvents;

          if (event && event.recurrence !== 'none') {
            // For recurring events, delete all future instances
            const eventDate = new Date(event.date);
            newEvents = state.events.filter(e => {
              if (e.id === eventId) return false;
              if (e.originalEventId === eventId) {
                const instanceDate = new Date(e.date);
                return instanceDate < eventDate;
              }
              return true;
            });
          } else {
            // For non-recurring events, just delete the single event
            newEvents = state.events.filter(e => e.id !== eventId);
          }

          localStorage.setItem('calendarEvents', JSON.stringify(newEvents));
          return { events: newEvents };
        });
      },

      // Helper function to check for conflicts
      checkConflicts: (event) => {
        const events = get().events;
        return hasTimeConflict(event, events);
      },

      deleteAllEvents: () => {
        set({ events: [] });
      },
    }),
    {
      name: 'calendar-store',
      storage: window.localStorage,
    }
  )
); 