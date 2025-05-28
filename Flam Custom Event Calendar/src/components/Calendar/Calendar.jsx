import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  startOfWeek,
  endOfWeek,
  addDays,
  parseISO,
  isWithinInterval,
  set,
} from 'date-fns';
import { Box, Typography, IconButton, Grid, Button, Tooltip, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';
import { ChevronLeft, ChevronRight, Today as TodayIcon, DeleteForever as DeleteForeverIcon, Event as EventIcon, Search as SearchIcon } from '@mui/icons-material';
import { useCalendarStore } from '../../store/calendarStore';
import EventForm from '../EventForm/EventForm';
import CalendarDay from './CalendarDay';
import SearchBar from './SearchBar';
import { DndContext, DragOverlay, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { getAllEventInstancesForMonth } from '../../utils/recurrence';
import './Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [error, setError] = useState(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const [highlightedEventId, setHighlightedEventId] = useState(null);
  
  const { events, updateEvent, deleteAllEvents } = useCalendarStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ 
    start: calendarStart, 
    end: calendarEnd 
  });

  // Get unique categories from events
  const categories = useMemo(() => {
    const categorySet = new Set();
    events.forEach(event => {
      if (event.category) {
        categorySet.add(event.category);
      }
    });
    return Array.from(categorySet);
  }, [events]);

  // Filter events based on search term and categories
  const filteredEvents = useMemo(() => {
    const filtered = events.filter(event => {
      const matchesSearch = searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategories.length === 0 || 
        (event.category && selectedCategories.includes(event.category));

      return matchesSearch && matchesCategory;
    });

    // Reset current event index when filters change
    if (filtered.length === 0) {
      setCurrentEventIndex(-1);
      setHighlightedEventId(null);
    } else if (currentEventIndex >= filtered.length) {
      setCurrentEventIndex(0);
      setHighlightedEventId(filtered[0].id);
    }

    return filtered;
  }, [events, searchTerm, selectedCategories]);

  // Update visibleEvents to use filteredEvents
  const visibleEvents = useMemo(() => {
    return getAllEventInstancesForMonth(filteredEvents, monthStart, monthEnd);
  }, [filteredEvents, monthStart, monthEnd]);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setIsEventFormOpen(true);
  };

  const handleEventClick = (event) => {
    // If it's a recurring instance, find the original event
    const eventToEdit = event.isRecurringInstance
      ? events.find(e => e.id === event.originalEventId)
      : event;

    setSelectedDate(new Date(event.date));
    setEditingEvent(eventToEdit);
    setIsEventFormOpen(true);
  };

  const handleCloseEventForm = () => {
    setIsEventFormOpen(false);
    setSelectedDate(null);
    setEditingEvent(null);
  };

  const checkForTimeConflicts = (event, targetDate) => {
    if (!event) return false;

    const eventStart = new Date(event.date);
    const eventTime = { hours: eventStart.getHours(), minutes: eventStart.getMinutes() };
    const newEventDate = set(targetDate, eventTime);

    return visibleEvents.some(existingEvent => {
      if (existingEvent.id === event.id) return false;
      if (existingEvent.originalEventId === event.originalEventId) return false;

      const existingDate = new Date(existingEvent.date);
      if (!isSameDay(existingDate, newEventDate)) return false;

      return existingDate.getHours() === newEventDate.getHours() &&
             existingDate.getMinutes() === newEventDate.getMinutes();
    });
  };

  const findEventById = (eventId) => {
    // First try to find the event in visible events
    const visibleEvent = visibleEvents.find(e => e.id === eventId || e.instanceId === eventId);
    if (visibleEvent) return visibleEvent;

    // If not found, try to find in original events
    return events.find(e => e.id === eventId);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    if (!active || active.data.current?.type !== 'event') return;

    const draggedEvent = active.data.current.event;
    if (draggedEvent) {
      setDraggedEvent(draggedEvent);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setDraggedEvent(null);
    
    if (!active || !over || active.data.current?.type !== 'event') return;

    const draggedEvent = active.data.current.event;
    if (!draggedEvent) {
      console.error('Could not find dragged event');
      return;
    }

    const targetDate = parseISO(over.id);

    // Check if it's a recurring event or instance
    if (draggedEvent.recurrence !== 'none' || draggedEvent.isRecurringInstance) {
      setError('Recurring events cannot be rescheduled. Edit the event to change its schedule.');
      return;
    }

    // Check for time conflicts
    if (checkForTimeConflicts(draggedEvent, targetDate)) {
      setError('Another event already exists at this time. Please choose a different time or day.');
      return;
    }

    try {
      // Update the event with the new date while preserving the time
      const originalDate = new Date(draggedEvent.date);
      const newDate = set(targetDate, {
        hours: originalDate.getHours(),
        minutes: originalDate.getMinutes(),
      });

      // If it's an instance, update the original event
      const eventToUpdate = draggedEvent.isRecurringInstance
        ? events.find(e => e.id === draggedEvent.originalEventId)
        : draggedEvent;

      if (!eventToUpdate) {
        setError('Could not find event to update');
        return;
      }

      updateEvent({
        ...eventToUpdate,
        date: newDate.toISOString(),
      });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDragOver = (event) => {
    // You can add visual feedback for valid/invalid drop targets here
  };

  const handleErrorClose = () => {
    setError(null);
  };

  const handleDeleteAllEvents = () => {
    deleteAllEvents();
    setIsDeleteAllDialogOpen(false);
    setError('All events have been deleted');
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (value === '') {
      setCurrentEventIndex(-1);
      setHighlightedEventId(null);
      setIsSearchVisible(false);
    } else if (filteredEvents.length > 0) {
      setCurrentEventIndex(0);
      setHighlightedEventId(filteredEvents[0].id);
    }
  };

  const handleCategoryChange = (categories) => {
    setSelectedCategories(categories);
    if (categories.length === 0) {
      setCurrentEventIndex(-1);
      setHighlightedEventId(null);
    } else if (filteredEvents.length > 0) {
      setCurrentEventIndex(0);
      setHighlightedEventId(filteredEvents[0].id);
    }
  };

  const navigateToEvent = (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      const eventDate = new Date(event.date);
      setCurrentDate(eventDate);
      setHighlightedEventId(eventId);
    }
  };

  const handleNavigateNext = () => {
    if (filteredEvents.length === 0) return;
    
    const nextIndex = (currentEventIndex + 1) % filteredEvents.length;
    setCurrentEventIndex(nextIndex);
    navigateToEvent(filteredEvents[nextIndex].id);
  };

  const handleNavigatePrev = () => {
    if (filteredEvents.length === 0) return;
    
    const prevIndex = currentEventIndex <= 0 ? filteredEvents.length - 1 : currentEventIndex - 1;
    setCurrentEventIndex(prevIndex);
    navigateToEvent(filteredEvents[prevIndex].id);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Box className="calendar-container">
      <Box className="calendar-layout">
        <Box className="calendar-main">
          <Box className="calendar-header">
            <Box className={`calendar-navigation ${isSearchVisible ? 'is-searching' : ''}`}>
              <Box className="calendar-controls">
                <Tooltip title="Previous month">
                  <IconButton onClick={handlePreviousMonth} size="large">
                    <ChevronLeft />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Next month">
                  <IconButton onClick={handleNextMonth} size="large">
                    <ChevronRight />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Go to today">
                  <Button
                    variant="outlined"
                    startIcon={<TodayIcon />}
                    onClick={handleTodayClick}
                    className="today-button"
                  >
                    Today
                  </Button>
                </Tooltip>
                <Tooltip title="Search events">
                  <IconButton 
                    className="search-toggle-button"
                    onClick={() => {
                      setIsSearchVisible(true);
                      setSearchTerm('');
                    }}
                    size="large"
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
                categories={categories}
                filteredCount={filteredEvents.length}
                currentEventIndex={currentEventIndex}
                onNavigateNext={handleNavigateNext}
                onNavigatePrev={handleNavigatePrev}
              />
            </Box>
            <Typography variant="h5" className="current-month">
              {format(currentDate, 'MMMM yyyy')}
            </Typography>
          </Box>

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            modifiers={[restrictToWindowEdges]}
          >
            <Grid container className="calendar-grid">
              {weekDays.map((day) => (
                <Grid key={day} className="calendar-weekday">
                  <Typography>{day}</Typography>
                </Grid>
              ))}

              {calendarDays.map((day) => (
                <CalendarDay
                  key={day.toISOString()}
                  date={day}
                  events={visibleEvents.filter(event => isSameDay(new Date(event.date), day))}
                  isCurrentMonth={isSameMonth(day, currentDate)}
                  onClick={() => handleDateClick(day)}
                  onEventClick={handleEventClick}
                  highlightedEventId={highlightedEventId}
                />
              ))}
            </Grid>

            <DragOverlay>
              {draggedEvent ? (
                <Box
                  className="event-pill dragging"
                  style={{ backgroundColor: draggedEvent.color || '#1976d2' }}
                >
                  <Typography noWrap className="event-title">
                    {format(new Date(draggedEvent.date), 'HH:mm')} {draggedEvent.title}
                    {draggedEvent.isRecurringInstance && ' (recurring)'}
                  </Typography>
                </Box>
              ) : null}
            </DragOverlay>
          </DndContext>
        </Box>

        <Box className="monthly-events-list">
          <Box className="monthly-events-header">
            <Typography className="monthly-events-title">
              <EventIcon sx={{ fontSize: 20 }} />
              Events for {format(currentDate, 'MMMM yyyy')}
            </Typography>
          </Box>
          <Box className="monthly-events-content">
            {visibleEvents
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((event) => (
                <Box
                  key={event.instanceId || event.id}
                  className="monthly-event-item"
                  onClick={() => handleEventClick(event)}
                >
                  <Typography className="monthly-event-date">
                    {format(new Date(event.date), 'EEE, MMM d • HH:mm')}
                  </Typography>
                  <Typography className="monthly-event-title">
                    {event.title}
                  </Typography>
                  {event.category && (
                    <Typography className="monthly-event-category">
                      {event.category}
                    </Typography>
                  )}
                </Box>
              ))}
          </Box>
          <Typography className="signature">NM</Typography>
        </Box>
      </Box>

      {isEventFormOpen && (
        <EventForm
          selectedDate={selectedDate}
          editEvent={editingEvent}
          onClose={handleCloseEventForm}
        />
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleErrorClose} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>

      <Dialog
        open={isDeleteAllDialogOpen}
        onClose={() => setIsDeleteAllDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="delete-all-dialog-title"
        disablePortal={false}
        keepMounted={false}
      >
        <DialogTitle id="delete-all-dialog-title">Delete All Events</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography color="error">
              Are you sure you want to delete all events? This action cannot be undone.
            </Typography>
            <Typography sx={{ mt: 2 }} color="text.secondary">
              This will delete {events.length} event{events.length !== 1 ? 's' : ''}.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsDeleteAllDialogOpen(false)}
            autoFocus
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAllEvents} 
            color="error" 
            variant="contained"
          >
            Delete All Events
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar; 