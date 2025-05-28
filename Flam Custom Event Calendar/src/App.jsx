import { DndContext } from '@dnd-kit/core';
import { Container, CssBaseline, ThemeProvider, createTheme, Box } from '@mui/material';
import Calendar from './components/Calendar/Calendar';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Handle event rescheduling logic here
      console.log('Dragged from:', active.id);
      console.log('Dropped on:', over.id);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.default',
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            py: 2,
            px: { xs: 1, sm: 2, md: 3 },
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <DndContext onDragEnd={handleDragEnd}>
            <Calendar />
          </DndContext>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
