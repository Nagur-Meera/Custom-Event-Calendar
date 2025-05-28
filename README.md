# Custom Event Calendar

A modern, feature-rich event calendar application built with React and Material-UI. View the live demo at [https://custom-event-calendar-one.vercel.app/](https://custom-event-calendar-one.vercel.app/)

## Features

### Core Functionality
- 📅 Modern monthly calendar view with intuitive navigation
- 🎯 Current day highlighting and "Today" quick navigation
- ✨ Beautiful UI with Material Design components
- 🌓 Automatic dark mode support based on system preferences

### Event Management
- ➕ Add events by clicking on any day
- 📝 Edit existing events with full details
- 🗑️ Quick delete functionality with confirmation
- 🔄 Support for recurring events (daily, weekly, monthly, custom intervals)
- 🎨 Event categorization with color coding

### Advanced Features
- 🔍 Event search functionality with real-time filtering
- 🎯 Category-based event filtering
- 🖱️ Drag-and-drop event rescheduling
- ⚠️ Event conflict detection and prevention
- 💾 Persistent storage using Zustand
- 📱 Fully responsive design for all devices

## Tech Stack

- **Frontend Framework**: React with Vite
- **UI Components**: Material-UI (@mui/material)
- **State Management**: Zustand
- **Date Handling**: date-fns
- **Drag & Drop**: @dnd-kit/core
- **Styling**: CSS Modules with modern features

## Dependencies

```json
{
  "@dnd-kit/core": "^6.1.0",
  "@mui/material": "^5.15.11",
  "@mui/icons-material": "^5.15.11",
  "date-fns": "^3.3.1",
  "zustand": "^4.5.1"
}
```

## Getting Started

1. Clone the repository:
```bash
git clone [https://github.com/Nagur-Meera/Custom-Event-Calendar.git](https://github.com/Nagur-Meera/Custom-Event-Calendar.git)
cd custom-event-calendar
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── assets/
├── components/
│   ├── Calendar/
│   │   ├── Calendar.css
│   │   ├── Calendar.jsx
│   │   ├── CalendarDay.jsx
│   │   └── SearchBar.jsx
│   └── EventForm/
│       ├── EventForm.css
│       └── EventForm.jsx
├── store/
│   └── calendarStore.js
├── utils/
│   └── recurrence.js
├── App.css
├── App.jsx
├── index.css
└── main.jsx

Configuration files:
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
└── vite.config.js
```

## Key Features in Detail

### Event Management
- Create events with title, description, date/time, and category
- Edit existing events with full modification support
- Delete events with confirmation dialog
- Recurring event patterns with custom intervals

### Calendar Navigation
- Month-to-month navigation
- Quick jump to current date
- Visual indicators for current day and events

### Search and Filter
- Real-time event search functionality
- Category-based filtering
- Combined search results view

### Responsive Design
- Adapts to all screen sizes
- Mobile-optimized touch interactions
- Landscape and portrait mode support

### State Management
- Centralized state using Zustand
- Persistent storage across sessions
- Efficient updates and renders

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS/Android)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## Deployment

The project is deployed on Vercel and can be accessed at [https://custom-event-calendar-one.vercel.app/](https://custom-event-calendar-one.vercel.app/)

## Acknowledgments

- Material-UI team for the excellent component library
- The React community for inspiration and support
- All contributors who helped improve this project
