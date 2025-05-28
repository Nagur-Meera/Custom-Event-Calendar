import {
  addDays,
  addWeeks,
  addMonths,
  isSameDay,
  isBefore,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  getDay,
  setDay,
  startOfDay,
  endOfDay,
  isAfter,
  isSameMonth,
  differenceInCalendarDays,
  getDate,
  parseISO,
} from 'date-fns';

/**
 * Generate recurring event instances for a given month
 * @param {Object} event - The event object with recurrence pattern
 * @param {Date} monthStart - Start of the month to generate instances for
 * @param {Date} monthEnd - End of the month to generate instances for
 * @returns {Array} Array of event instances
 */
export const generateRecurringInstances = (event, monthStart, monthEnd) => {
  if (!event.recurrence || event.recurrence === 'none') {
    // For non-recurring events, only return if they fall within the month
    if (isWithinInterval(new Date(event.date), { start: monthStart, end: monthEnd })) {
      return [event];
    }
    return [];
  }

  const instances = [];
  const startDate = new Date(event.date);
  let currentDate = new Date(startDate);
  let totalOccurrences = 0; // Track total occurrences regardless of month

  // If the event starts after the month end, no instances to generate
  if (isAfter(startDate, monthEnd)) {
    return [];
  }

  // Function to check if we should continue generating instances
  const shouldContinue = (date) => {
    if (event.recurrence.endType === 'date' && event.recurrence.endDate) {
      return isBefore(date, new Date(event.recurrence.endDate));
    }
    if (event.recurrence.endType === 'occurrences') {
      return totalOccurrences < event.recurrence.endAfter;
    }
    // Continue until we're past the month end
    return !isAfter(startOfDay(date), endOfDay(monthEnd));
  };

  // Function to add instance if it falls within the month
  const addInstanceIfInMonth = (date) => {
    const instanceDate = new Date(date);
    totalOccurrences++; // Increment total occurrences regardless of month
    
    if (isWithinInterval(instanceDate, { 
      start: startOfDay(monthStart), 
      end: endOfDay(monthEnd) 
    })) {
      // Preserve the original time
      instanceDate.setHours(startDate.getHours());
      instanceDate.setMinutes(startDate.getMinutes());
      
      instances.push({
        ...event,
        date: instanceDate.toISOString(),
        isRecurringInstance: true,
        originalEventId: event.id,
        instanceId: `${event.id}_${instanceDate.toISOString()}`,
      });
    }
  };

  if (typeof event.recurrence === 'object' && event.recurrence.type === 'custom') {
    const { unit, interval, daysOfWeek, daysOfMonth } = event.recurrence;

    while (shouldContinue(currentDate)) {
      let shouldAdd = false;

      if (unit === 'day') {
        shouldAdd = true;
      } else if (unit === 'week' && daysOfWeek && daysOfWeek.length > 0) {
        shouldAdd = daysOfWeek.includes(getDay(currentDate));
      } else if (unit === 'month' && daysOfMonth && daysOfMonth.length > 0) {
        shouldAdd = daysOfMonth.includes(getDate(currentDate));
      }

      if (shouldAdd) {
        addInstanceIfInMonth(currentDate);
      }

      // Advance to next date based on recurrence pattern
      if (unit === 'day') {
        currentDate = addDays(currentDate, interval || 1);
      } else if (unit === 'week') {
        currentDate = addDays(currentDate, 1);
        // If we've completed a week, jump to the next interval
        if (getDay(currentDate) === 0) {
          currentDate = addWeeks(currentDate, (interval || 1) - 1);
        }
      } else if (unit === 'month') {
        // If we've checked all days in the current month, move to next interval
        if (getDate(currentDate) === getDate(addDays(currentDate, 1))) {
          currentDate = addMonths(currentDate, interval || 1);
          currentDate.setDate(1); // Reset to start of month
        } else {
          currentDate = addDays(currentDate, 1);
        }
      }
    }
    return instances;
  }

  // Handle standard recurrence patterns
  switch (event.recurrence) {
    case 'daily':
      while (shouldContinue(currentDate)) {
        addInstanceIfInMonth(currentDate);
        currentDate = addDays(currentDate, 1);
      }
      break;

    case 'weekly':
      while (shouldContinue(currentDate)) {
        if (getDay(currentDate) === getDay(startDate)) {
          addInstanceIfInMonth(currentDate);
        }
        currentDate = addDays(currentDate, 1);
      }
      break;

    case 'monthly':
      while (shouldContinue(currentDate)) {
        if (getDate(currentDate) === getDate(startDate)) {
          addInstanceIfInMonth(currentDate);
        }
        currentDate = addDays(currentDate, 1);
      }
      break;
  }

  return instances;
};

const generateCustomRecurringInstances = (event, startDate, endDate) => {
  const instances = [];
  const eventStart = new Date(event.date);
  const eventTime = {
    hours: eventStart.getHours(),
    minutes: eventStart.getMinutes(),
  };

  const recurrence = event.recurrence;
  let currentDate = startOfDay(eventStart);
  let totalOccurrences = 0;

  // Calculate the end date based on recurrence settings
  let recurrenceEndDate = endDate;
  if (recurrence.endType === 'date' && recurrence.endDate) {
    recurrenceEndDate = endOfDay(parseISO(recurrence.endDate));
  }

  // Function to check if we should continue generating instances
  const shouldContinue = (date) => {
    if (recurrence.endType === 'date') {
      return isBefore(date, recurrenceEndDate);
    }
    if (recurrence.endType === 'occurrences') {
      return totalOccurrences < recurrence.endAfter;
    }
    return !isAfter(date, endDate);
  };

  while (shouldContinue(currentDate)) {
    let shouldAdd = false;

    if (recurrence.unit === 'day') {
      shouldAdd = true;
    } else if (recurrence.unit === 'week' && recurrence.daysOfWeek) {
      shouldAdd = recurrence.daysOfWeek.includes(getDay(currentDate));
    } else if (recurrence.unit === 'month' && recurrence.daysOfMonth) {
      shouldAdd = recurrence.daysOfMonth.includes(getDate(currentDate));
    }

    if (shouldAdd) {
      if (!isBefore(currentDate, startDate)) {
        instances.push(createEventInstance(event, currentDate, eventTime));
      }
      totalOccurrences++;
    }

    // Advance to the next date based on the interval and unit
    if (recurrence.unit === 'day') {
      currentDate = addDays(currentDate, recurrence.interval || 1);
    } else if (recurrence.unit === 'week') {
      if (getDay(currentDate) === 6) { // If it's Saturday, advance by the interval
        currentDate = addWeeks(currentDate, (recurrence.interval || 1) - 1);
        currentDate = addDays(currentDate, 1); // Move to Sunday
      } else {
        currentDate = addDays(currentDate, 1);
      }
    } else if (recurrence.unit === 'month') {
      if (getDate(currentDate) === getDate(addDays(currentDate, 1))) {
        currentDate = addMonths(currentDate, recurrence.interval || 1);
      } else {
        currentDate = addDays(currentDate, 1);
      }
    }
  }

  return instances;
};

const createEventInstance = (originalEvent, date, time) => {
  const instanceDate = new Date(date);
  instanceDate.setHours(time.hours);
  instanceDate.setMinutes(time.minutes);

  return {
    ...originalEvent,
    id: `${originalEvent.id}_${instanceDate.toISOString()}`,
    date: instanceDate.toISOString(),
    originalEventId: originalEvent.id,
    isRecurringInstance: true,
  };
};

/**
 * Check for time conflicts between events
 * @param {Object} event - The event to check
 * @param {Array} existingEvents - Array of existing events
 * @returns {boolean} True if there is a conflict
 */
export const hasTimeConflict = (event, existingEvents) => {
  const eventDate = new Date(event.date);
  const eventDay = startOfDay(eventDate);
  
  return existingEvents.some(existing => {
    // Skip comparing with itself or its instances
    if (existing.id === event.id) return false;
    if (existing.originalEventId === event.id) return false;
    if (event.originalEventId === existing.id) return false;
    
    const existingDate = new Date(existing.date);
    if (!isSameDay(existingDate, eventDate)) return false;

    // Check for exact time conflict
    return existingDate.getHours() === eventDate.getHours() &&
           existingDate.getMinutes() === eventDate.getMinutes();
  });
};

/**
 * Get all event instances for a given month
 * @param {Array} events - Array of all events
 * @param {Date} monthStart - Start of the month
 * @param {Date} monthEnd - End of the month
 * @returns {Array} Array of all event instances for the month
 */
export const getAllEventInstancesForMonth = (events, monthStart, monthEnd) => {
  return events.flatMap(event => generateRecurringInstances(event, monthStart, monthEnd));
};

export const isEventInRange = (event, startDate, endDate) => {
  const eventDate = new Date(event.date);
  return !isBefore(eventDate, startDate) && !isBefore(endDate, eventDate);
}; 