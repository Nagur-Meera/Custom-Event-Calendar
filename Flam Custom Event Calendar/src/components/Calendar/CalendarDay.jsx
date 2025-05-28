import React, { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { Grid, Typography, Box, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, DialogContentText, Alert } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useCalendarStore } from '../../store/calendarStore';
import './Calendar.css';

const EventItem = ({ 
  event, 
  onEventClick, 
  onDeleteClick, 
  isHovered, 
  onHover, 
  onLeaveHover,
  isHighlighted 
}) => {
  const { attributes, listeners, setNodeRef } = useSortable({
    id: event.instanceId || event.id,
    data: {
      type: 'event',
      event: event
    }
  });

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      className="event-wrapper"
      onMouseEnter={() => onHover(event.id)}
      onMouseLeave={() => onLeaveHover()}
    >
      <Tooltip 
        title={`${event.title}${event.description ? ` - ${event.description}` : ''}${
          event.recurrence !== 'none' ? ` (${event.recurrence})` : ''
        }`}
        arrow
        placement="top"
      >
        <Box
          className={`event-pill ${isHighlighted ? 'highlighted' : ''}`}
          style={{ 
            backgroundColor: event.color || '#1976d2',
            transform: isHighlighted ? 'scale(1.05)' : undefined,
            boxShadow: isHighlighted ? '0 2px 8px rgba(0,0,0,0.2)' : undefined,
          }}
          onClick={(e) => onEventClick(event, e)}
          {...listeners}
        >
          <Typography noWrap className="event-title">
            {format(new Date(event.date), 'HH:mm')} {event.title}
            {event.isRecurringInstance && ' (recurring)'}
          </Typography>
        </Box>
      </Tooltip>
      {isHovered && (
        <IconButton
          size="small"
          className="event-delete-button"
          onClick={(e) => onDeleteClick(event, e)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

const CalendarDay = ({ 
  date, 
  events, 
  isCurrentMonth, 
  onClick, 
  onEventClick,
  highlightedEventId 
}) => {
  const [hoveredEventId, setHoveredEventId] = useState(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState(null);
  const { deleteEvent } = useCalendarStore();
  const [hasConflict, setHasConflict] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    isOver,
  } = useSortable({
    id: date.toISOString(),
    data: {
      type: 'day',
      date: date
    }
  });

  const dayClasses = `calendar-day ${
    !isCurrentMonth ? 'other-month' : ''
  } ${isToday(date) ? 'today' : ''} ${isOver ? 'drag-over' : ''} ${
    isOver && hasConflict ? 'conflict' : ''
  }`;

  // Check for conflicts when an event is dragged over
  useEffect(() => {
    if (!isOver) {
      setHasConflict(false);
      return;
    }

    const draggedEvent = document.querySelector('.event-pill.dragging');
    if (!draggedEvent) return;

    const eventTime = draggedEvent.textContent.split(' ')[0];
    const [hours, minutes] = eventTime.split(':').map(Number);
    const targetDate = new Date(date);
    targetDate.setHours(hours);
    targetDate.setMinutes(minutes);

    const hasTimeConflict = events.some(existing => {
      const existingDate = new Date(existing.date);
      return (
        existingDate.getHours() === targetDate.getHours() &&
        existingDate.getMinutes() === targetDate.getMinutes()
      );
    });

    setHasConflict(hasTimeConflict);
  }, [isOver, date, events]);

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    onEventClick(event);
  };

  const handleDeleteClick = (event, e) => {
    e.stopPropagation();
    setDeleteConfirmEvent(event);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmEvent) {
      deleteEvent(deleteConfirmEvent.id);
      setDeleteConfirmEvent(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmEvent(null);
  };

  return (
    <>
      <Grid ref={setNodeRef} {...attributes}>
        <Box 
          className={dayClasses}
          onClick={() => onClick(date)}
          {...listeners}
        >
          <Typography className="day-number">
            {format(date, 'd')}
          </Typography>
          <Box className="events-container">
            {events.map((event) => (
              <EventItem
                key={event.instanceId || event.id}
                event={event}
                onEventClick={handleEventClick}
                onDeleteClick={handleDeleteClick}
                isHovered={hoveredEventId === event.id}
                onHover={setHoveredEventId}
                onLeaveHover={() => setHoveredEventId(null)}
                isHighlighted={highlightedEventId === event.id}
              />
            ))}
          </Box>
        </Box>
      </Grid>

      <Dialog
        open={!!deleteConfirmEvent}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography>
              Are you sure you want to delete "{deleteConfirmEvent?.title}"?
            </Typography>
            {deleteConfirmEvent?.recurrence !== 'none' && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="warning">
                  This will delete all instances of this recurring event.
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CalendarDay; 