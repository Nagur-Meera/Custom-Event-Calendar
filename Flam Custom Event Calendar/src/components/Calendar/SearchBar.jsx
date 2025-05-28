import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  styled,
  Typography,
} from '@mui/material';
import { 
  Search as SearchIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';

// Styled TextField component with custom styles
const SearchTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '50px',
    backgroundColor: '#fff',
    transition: 'all 0.3s ease',
    height: '40px',
    width: '100%',
    '&:hover': {
      backgroundColor: '#f8f9ff',
    },
    '&.Mui-focused': {
      backgroundColor: '#f8f9ff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: '2px',
      },
    },
  },
  '& .MuiInputAdornment-root': {
    marginRight: '8px',
    '& .MuiSvgIcon-root': {
      color: theme.palette.primary.main,
      fontSize: '1.3rem',
    },
  },
  width: '100%'
}));

const SearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  selectedCategories, 
  onCategoryChange, 
  categories,
  filteredCount,
  currentEventIndex,
  onNavigateNext,
  onNavigatePrev,
}) => {
  const handleClose = () => {
    onSearchChange('');
  };

  const handleDeleteCategory = (categoryToDelete) => {
    const newCategories = selectedCategories.filter(
      (category) => category !== categoryToDelete
    );
    onCategoryChange(newCategories);
  };

  const isNavigationDisabled = !searchTerm && selectedCategories.length === 0;

  return (
    <Box className="search-container">
      <Box className="search-controls">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <TextField
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            size="small"
            className="search-field"
            autoFocus
            fullWidth
            InputProps={{
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onSearchChange('')}
                    className="search-close-button"
                  >
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <IconButton
            size="small"
            onClick={handleClose}
            className="search-close-button"
            sx={{ flexShrink: 0 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <FormControl size="small" className="category-select" fullWidth>
          <InputLabel id="category-filter-label">Categories</InputLabel>
          <Select
            labelId="category-filter-label"
            multiple
            value={selectedCategories}
            onChange={(e) => onCategoryChange(e.target.value)}
            label="Categories"
            fullWidth
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip 
                    key={value} 
                    label={value}
                    size="small"
                    color="primary"
                    onDelete={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(value);
                    }}
                    deleteIcon={
                      <CancelIcon 
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    }
                  />
                ))}
              </Box>
            )}
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {filteredCount > 0 && (
        <Box className="search-navigation">
          <Tooltip title="Previous event">
            <span>
              <IconButton 
                size="small" 
                onClick={onNavigatePrev}
                disabled={isNavigationDisabled}
                className="nav-button"
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Typography className="search-results-count">
            {currentEventIndex + 1}/{filteredCount}
          </Typography>
          <Tooltip title="Next event">
            <span>
              <IconButton 
                size="small" 
                onClick={onNavigateNext}
                disabled={isNavigationDisabled}
                className="nav-button"
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default SearchBar; 