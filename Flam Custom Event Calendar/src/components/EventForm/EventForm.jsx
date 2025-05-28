import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
  Radio,
  RadioGroup,
  Chip,
  Stack,
} from '@mui/material';
import { format } from 'date-fns';
import { useCalendarStore } from '../../store/calendarStore';
import { Event as EventIcon } from '@mui/icons-material';
import './EventForm.css';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const EventForm = ({ selectedDate, editEvent, onClose }) => {
  const { addEvent, updateEvent, events } = useCalendarStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: selectedDate.toISOString(),
    time: '12:00',
    category: '',
    recurrence: 'none',
    customRecurrence: {
      unit: 'day',
      interval: 1,
      endType: 'occurrences',
      endAfter: 1,
      daysOfWeek: [],
      daysOfMonth: [],
    },
  });
  const [error, setError] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(false);

  useEffect(() => {
    if (editEvent) {
      const eventDate = new Date(editEvent.date);
      setFormData({
        ...editEvent,
        time: `${String(eventDate.getHours()).padStart(2, '0')}:${String(
          eventDate.getMinutes()
        ).padStart(2, '0')}`,
        recurrence: editEvent.recurrence.type || 'none',
        customRecurrence: editEvent.recurrence.type === 'custom' 
          ? editEvent.recurrence
          : {
              unit: 'day',
              interval: 1,
              endType: 'occurrences',
              endAfter: 1,
              daysOfWeek: [],
              daysOfMonth: [],
            },
      });
    }
  }, [editEvent]);

  useEffect(() => {
    // Check for conflicts whenever date or time changes
    const checkConflicts = () => {
      try {
        const [hours, minutes] = formData.time.split(':').map(Number);
        const eventDate = new Date(formData.date);
        eventDate.setHours(hours);
        eventDate.setMinutes(minutes);

        const eventData = {
          ...formData,
          date: eventDate.toISOString(),
        };

        const existingEvents = events.filter(e => e.id !== (editEvent?.id));
        const hasConflict = existingEvents.some(existing => {
          const existingDate = new Date(existing.date);
          return (
            existingDate.getFullYear() === eventDate.getFullYear() &&
            existingDate.getMonth() === eventDate.getMonth() &&
            existingDate.getDate() === eventDate.getDate() &&
            existingDate.getHours() === eventDate.getHours() &&
            existingDate.getMinutes() === eventDate.getMinutes()
          );
        });

        setConflictWarning(hasConflict);
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }
    };

    checkConflicts();
  }, [formData.date, formData.time, events, editEvent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }

      const [hours, minutes] = formData.time.split(':').map(Number);
      const eventDate = new Date(formData.date);
      eventDate.setHours(hours);
      eventDate.setMinutes(minutes);

      const eventData = {
        ...formData,
        date: eventDate.toISOString(),
        recurrence: formData.recurrence === 'custom' 
          ? { type: 'custom', ...formData.customRecurrence }
          : formData.recurrence,
      };

      // Validate custom recurrence settings
      if (formData.recurrence === 'custom') {
        const { customRecurrence } = formData;
        
        if (customRecurrence.unit === 'week' && (!customRecurrence.daysOfWeek || customRecurrence.daysOfWeek.length === 0)) {
          setError('Please select at least one day of the week for weekly recurrence');
          return;
        }

        if (customRecurrence.unit === 'month' && (!customRecurrence.daysOfMonth || customRecurrence.daysOfMonth.length === 0)) {
          setError('Please enter at least one day of the month for monthly recurrence');
          return;
        }

        if (customRecurrence.endType === 'date' && !customRecurrence.endDate) {
          setError('Please select an end date for the recurrence');
          return;
        }
      }

      // Check for time conflicts with existing events
      const existingEvents = events.filter(e => e.id !== (editEvent?.id));
      const hasConflict = existingEvents.some(existing => {
        const existingDate = new Date(existing.date);
        return (
          existingDate.getFullYear() === eventDate.getFullYear() &&
          existingDate.getMonth() === eventDate.getMonth() &&
          existingDate.getDate() === eventDate.getDate() &&
          existingDate.getHours() === eventDate.getHours() &&
          existingDate.getMinutes() === eventDate.getMinutes()
        );
      });

      if (hasConflict) {
        setError('Another event already exists at this time. Please choose a different time.');
        return;
      }

      if (editEvent) {
        updateEvent({ ...eventData, id: editEvent.id });
      } else {
        addEvent({ ...eventData, id: Date.now().toString() });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred while saving the event');
    }
  };

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleCustomRecurrenceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      customRecurrence: {
        ...prev.customRecurrence,
        [field]: value,
      },
    }));
  };

  const handleDayToggle = (dayValue) => {
    const currentDays = formData.customRecurrence.daysOfWeek || [];
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(day => day !== dayValue)
      : [...currentDays, dayValue].sort();
    
    handleCustomRecurrenceChange('daysOfWeek', newDays);
  };

  const renderCustomRecurrenceForm = () => {
    const handleMonthDayClick = (day) => {
      const currentDays = formData.customRecurrence.daysOfMonth || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day].sort((a, b) => a - b);
      
      handleCustomRecurrenceChange('daysOfMonth', newDays);
    };

    const renderMonthDays = () => {
      const days = [];
      for (let i = 1; i <= 31; i++) {
        days.push(
          <Chip
            key={i}
            label={i}
            onClick={() => handleMonthDayClick(i)}
            color={(formData.customRecurrence.daysOfMonth || []).includes(i) ? "primary" : "default"}
            sx={{ 
              m: 0.5,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: (theme) => 
                  (formData.customRecurrence.daysOfMonth || []).includes(i) 
                    ? theme.palette.primary.main 
                    : theme.palette.action.hover,
              }
            }}
          />
        );
      }
      return days;
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography>Repeat every</Typography>
          <TextField
            type="number"
            value={formData.customRecurrence.interval || 1}
            onChange={(e) => handleCustomRecurrenceChange('interval', Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1 }}
            sx={{ width: 80 }}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <Select
              value={formData.customRecurrence.unit || 'day'}
              onChange={(e) => handleCustomRecurrenceChange('unit', e.target.value)}
            >
              <MenuItem value="day">Day(s)</MenuItem>
              <MenuItem value="week">Week(s)</MenuItem>
              <MenuItem value="month">Month(s)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {formData.customRecurrence.unit === 'week' && (
          <FormGroup row sx={{ mb: 2 }}>
            <Typography sx={{ mr: 2, alignSelf: 'center' }}>On:</Typography>
            {DAYS_OF_WEEK.map((day) => (
              <FormControlLabel
                key={day.value}
                control={
                  <Checkbox
                    checked={(formData.customRecurrence.daysOfWeek || []).includes(day.value)}
                    onChange={() => handleDayToggle(day.value)}
                  />
                }
                label={day.label}
              />
            ))}
          </FormGroup>
        )}

        {formData.customRecurrence.unit === 'month' && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ mb: 1 }}>On which days of the month?</Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 0.5,
              maxWidth: '100%',
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}>
              {renderMonthDays()}
            </Box>
            {(formData.customRecurrence.daysOfMonth || []).length > 0 && (
              <Typography sx={{ mt: 1 }} color="text.secondary">
                Selected days: {(formData.customRecurrence.daysOfMonth || [])
                  .sort((a, b) => a - b)
                  .join(', ')}
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography sx={{ mb: 1 }}>End</Typography>
          <RadioGroup
            value={formData.customRecurrence.endType || 'occurrences'}
            onChange={(e) => handleCustomRecurrenceChange('endType', e.target.value)}
          >
            <FormControlLabel
              value="occurrences"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>After</Typography>
                  <TextField
                    type="number"
                    value={formData.customRecurrence.endAfter || 1}
                    onChange={(e) => handleCustomRecurrenceChange('endAfter', Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1 }}
                    sx={{ width: 80 }}
                    disabled={formData.customRecurrence.endType !== 'occurrences'}
                  />
                  <Typography>occurrences</Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="date"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>On date</Typography>
                  <TextField
                    type="date"
                    value={formData.customRecurrence.endDate || ''}
                    onChange={(e) => handleCustomRecurrenceChange('endDate', e.target.value)}
                    sx={{ width: 200 }}
                    disabled={formData.customRecurrence.endType !== 'date'}
                  />
                </Box>
              }
            />
          </RadioGroup>
        </Box>
      </Box>
    );
  };

  return (
    <Dialog 
      open 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      className="event-form-dialog"
      scroll="paper"
    >
      <DialogTitle>
        <EventIcon sx={{ fontSize: 28 }} />
        {editEvent ? 'Edit Event' : 'New Event'}
      </DialogTitle>
      <DialogContent dividers>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert 
                severity="error" 
                onClose={() => setError(null)}
                className="event-form-alert"
              >
                {error}
              </Alert>
            )}
            {conflictWarning && (
              <Alert 
                severity="warning" 
                className="event-form-alert"
              >
                Warning: Another event exists at this time. Creating this event will result in a scheduling conflict.
              </Alert>
            )}
            
            <TextField
              label="Title"
              value={formData.title}
              onChange={handleChange('title')}
              required
              fullWidth
              error={!!error && !formData.title.trim()}
              className="event-form-field"
            />
            
            <TextField
              label="Category"
              value={formData.category}
              onChange={handleChange('category')}
              fullWidth
              placeholder="Enter a category (e.g., Work, Personal, Meeting)"
              className="event-form-field"
            />
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
              fullWidth
              className="event-form-field"
            />
            
            <Box className="datetime-fields">
              <TextField
                type="date"
                label="Date"
                value={formData.date.split('T')[0]}
                onChange={handleChange('date')}
                required
                className="event-form-field"
              />
              <TextField
                type="time"
                label="Time"
                value={formData.time}
                onChange={handleChange('time')}
                required
                className="event-form-field"
              />
            </Box>

            <Box className="recurrence-section">
              <FormControl fullWidth className="event-form-field">
                <InputLabel>Recurrence</InputLabel>
                <Select
                  value={formData.recurrence}
                  onChange={handleChange('recurrence')}
                  label="Recurrence"
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>

              {formData.recurrence === 'custom' && (
                <Box className="custom-recurrence">
                  <Box className="interval-select">
                    <Typography>Repeat every</Typography>
                    <TextField
                      type="number"
                      value={formData.customRecurrence.interval || 1}
                      onChange={(e) => handleCustomRecurrenceChange('interval', Math.max(1, parseInt(e.target.value) || 1))}
                      inputProps={{ min: 1 }}
                      sx={{ width: 80 }}
                      className="event-form-field"
                    />
                    <FormControl sx={{ minWidth: 120 }} className="event-form-field">
                      <Select
                        value={formData.customRecurrence.unit || 'day'}
                        onChange={(e) => handleCustomRecurrenceChange('unit', e.target.value)}
                      >
                        <MenuItem value="day">Day(s)</MenuItem>
                        <MenuItem value="week">Week(s)</MenuItem>
                        <MenuItem value="month">Month(s)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {formData.customRecurrence.unit === 'week' && (
                    <Box className="weekday-select">
                      <Typography sx={{ width: '100%' }}>On:</Typography>
                      {DAYS_OF_WEEK.map((day) => (
                        <FormControlLabel
                          key={day.value}
                          control={
                            <Checkbox
                              checked={(formData.customRecurrence.daysOfWeek || []).includes(day.value)}
                              onChange={() => handleDayToggle(day.value)}
                            />
                          }
                          label={day.label}
                        />
                      ))}
                    </Box>
                  )}

                  {formData.customRecurrence.unit === 'month' && (
                    <Box>
                      <Typography sx={{ mb: 1 }}>On which days of the month?</Typography>
                      <Box className="month-days">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <Chip
                            key={day}
                            label={day}
                            onClick={() => handleMonthDayClick(day)}
                            className={`month-day-chip ${
                              (formData.customRecurrence.daysOfMonth || []).includes(day) ? 'selected' : ''
                            }`}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ mt: 3 }}>
                    <Typography sx={{ mb: 1 }}>End</Typography>
                    <RadioGroup
                      value={formData.customRecurrence.endType || 'occurrences'}
                      onChange={(e) => handleCustomRecurrenceChange('endType', e.target.value)}
                    >
                      <FormControlLabel
                        value="occurrences"
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>After</Typography>
                            <TextField
                              type="number"
                              value={formData.customRecurrence.endAfter || 1}
                              onChange={(e) => handleCustomRecurrenceChange('endAfter', Math.max(1, parseInt(e.target.value) || 1))}
                              inputProps={{ min: 1 }}
                              sx={{ width: 80 }}
                              className="event-form-field"
                              disabled={formData.customRecurrence.endType !== 'occurrences'}
                            />
                            <Typography>occurrences</Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="date"
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>On date</Typography>
                            <TextField
                              type="date"
                              value={formData.customRecurrence.endDate || ''}
                              onChange={(e) => handleCustomRecurrenceChange('endDate', e.target.value)}
                              sx={{ width: 200 }}
                              className="event-form-field"
                              disabled={formData.customRecurrence.endType !== 'date'}
                            />
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </form>
      </DialogContent>
      <DialogActions className="event-form-actions">
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {editEvent ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventForm; 