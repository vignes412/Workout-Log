import React, { useState, useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Checkbox, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { Todo } from '../types';
import { useAppContext } from '../context/AppContext';
import { appendTodo, updateTodo, deleteTodo } from '../utils/sheetsApi';

const TodoList: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { todos } = state;
  const isLoading = state.loading.todos;
  const [newTodoText, setNewTodoText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const handleAddTodo = useCallback(async () => {
    if (!newTodoText.trim()) return;
    
    const newTodo: Todo = {
      text: newTodoText,
      completed: false
    };
    
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'todos', value: true } });
      await appendTodo(newTodo);
      dispatch({ type: 'ADD_TODO', payload: newTodo });
      setNewTodoText('');
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'todos', value: false } });
    }
  }, [newTodoText, dispatch]);

  const handleToggleTodo = useCallback(async (index: number, completed: boolean) => {
    try {
      const updatedTodo = { ...todos[index], completed };
      await updateTodo(index, updatedTodo);
      dispatch({ 
        type: 'TOGGLE_TODO', 
        payload: { index, completed } 
      });
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  }, [todos, dispatch]);

  const handleDeleteTodo = useCallback(async (index: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'todos', value: true } });
      await deleteTodo(index);
      // Refetch todos after deletion to ensure correct ordering
      const updatedTodos = todos.filter((_, i) => i !== index);
      dispatch({ type: 'SET_TODOS', payload: updatedTodos });
    } catch (error) {
      console.error('Error deleting todo:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'todos', value: false } });
    }
  }, [todos, dispatch]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  }, [handleAddTodo]);

  const pendingTodos = useMemo(() => 
    todos.filter(todo => !todo.completed),
    [todos]
  );

  const completedTodos = useMemo(() => 
    todos.filter(todo => todo.completed),
    [todos]
  );

  const renderTodoItem = useCallback((todo: Todo, index: number) => (
    <ListItem key={index} divider>
      <ListItemIcon>
        <Checkbox
          edge="start"
          checked={todo.completed}
          onChange={() => handleToggleTodo(index, !todo.completed)}
          disableRipple
        />
      </ListItemIcon>
      <ListItemText 
        primary={todo.text}
        sx={{
          textDecoration: todo.completed ? 'line-through' : 'none',
          color: todo.completed ? 'text.secondary' : 'text.primary'
        }}
      />
      <ListItemSecondaryAction>
        <IconButton edge="end" onClick={() => handleDeleteTodo(index)}>
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  ), [handleToggleTodo, handleDeleteTodo]);

  return (
    <Box 
      sx={{ 
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h4" gutterBottom>
        Todo List
      </Typography>
      
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 3, 
          display: 'flex', 
          gap: 1 
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Add a new task"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTodo}
          disabled={!newTodoText.trim() || isLoading}
        >
          Add
        </Button>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper 
            elevation={2} 
            sx={{ 
              mb: 3,
              flexGrow: 1,
              maxHeight: pendingTodos.length > 0 ? '60%' : 'auto',
              overflow: 'auto'
            }}
          >
            <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
              Active Tasks
            </Typography>
            {pendingTodos.length > 0 ? (
              <List>
                {pendingTodos.map((todo, index) => renderTodoItem(todo, todos.indexOf(todo)))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No active tasks - great job!
                </Typography>
              </Box>
            )}
          </Paper>

          <Button
            variant="outlined"
            onClick={() => setShowCompleted(!showCompleted)}
            sx={{ mb: 2, alignSelf: 'flex-start' }}
          >
            {showCompleted ? 'Hide Completed Tasks' : 'Show Completed Tasks'}
          </Button>

          {showCompleted && (
            <Paper 
              elevation={2} 
              sx={{ 
                flex: 1,
                maxHeight: '40%',
                overflow: 'auto'
              }}
            >
              <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
                Completed Tasks
              </Typography>
              {completedTodos.length > 0 ? (
                <List>
                  {completedTodos.map((todo, index) => renderTodoItem(todo, todos.indexOf(todo)))}
                </List>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No completed tasks yet
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default React.memo(TodoList);