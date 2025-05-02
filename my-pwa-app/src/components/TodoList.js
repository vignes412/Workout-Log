import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchTodos, appendTodo, updateTodo } from "../utils/sheetsApi";

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchAndSyncTodos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTodos();
      // Sync both completed and not completed todos
      setTodos(data.filter((todo) => !todo.completed));
      setCompletedTodos(data.filter((todo) => todo.completed));
      setError(null);
    } catch (error) {
      console.error("Error fetching todos:", error);
      setError("Failed to load todos. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize add todo function
  const addTodo = useCallback(async () => {
    if (!newTodo.trim()) return;
    
    const newEntry = { text: newTodo, completed: false };
    setNewTodo(""); // Clear input immediately for better UX
    
    try {
      await appendTodo(newEntry);
      setTodos(prevTodos => [...prevTodos, newEntry]);
    } catch (error) {
      console.error("Error adding todo:", error);
      setError("Failed to add todo. Please try again.");
      // Restore the input value in case of error
      setNewTodo(newEntry.text);
    }
  }, [newTodo]);

  // Memoize toggle todo function
  const toggleTodo = useCallback(async (todo, isCompleted) => {
    const updatedTodo = { ...todo, completed: isCompleted };
    
    // Optimistically update UI first for better UX
    if (isCompleted) {
      setTodos(prevTodos => prevTodos.filter((t) => t !== todo));
      setCompletedTodos(prevCompletedTodos => [...prevCompletedTodos, updatedTodo]);
    } else {
      setCompletedTodos(prevCompletedTodos => prevCompletedTodos.filter((t) => t !== todo));
      setTodos(prevTodos => [...prevTodos, updatedTodo]);
    }
    
    try {
      // Find the index in the combined list of todos
      const allTodos = [...todos, ...completedTodos];
      const todoIndex = allTodos.findIndex(t => 
        t.text === todo.text && t.completed === todo.completed
      );
      
      if (todoIndex !== -1) {
        // Update the specific todo in the spreadsheet
        await updateTodo(todoIndex, updatedTodo);
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
      setError("Failed to update todo. The changes will be reverted.");
      
      // Revert the UI change in case of error
      if (isCompleted) {
        setTodos(prevTodos => [...prevTodos, todo]);
        setCompletedTodos(prevCompletedTodos => 
          prevCompletedTodos.filter(t => t !== updatedTodo)
        );
      } else {
        setCompletedTodos(prevCompletedTodos => [...prevCompletedTodos, todo]);
        setTodos(prevTodos => prevTodos.filter(t => t !== updatedTodo));
      }
    }
  }, [todos, completedTodos]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    addTodo();
  }, [addTodo]);

  // Fetch todos on component mount
  useEffect(() => {
    fetchAndSyncTodos();
  }, [fetchAndSyncTodos]);

  // Memoize the completed todos list for better performance
  const renderedCompletedTodos = useMemo(() => {
    if (!showCompleted) return null;
    
    return (
      <div className="todo-completed-list">
        <h3>Completed Tasks</h3>
        {completedTodos.length === 0 ? (
          <p className="todo-empty-message">No completed tasks</p>
        ) : (
          completedTodos.map((todo, index) => (
            <div key={`completed-${index}`} className="todo-item completed">
              <input
                type="checkbox"
                checked={true} // Ensure checked for completed todos
                onChange={() => toggleTodo(todo, false)}
                className="todo-checkbox"
                id={`completed-todo-${index}`}
              />
              <label htmlFor={`completed-todo-${index}`} className="todo-text">
                {todo.text}
              </label>
            </div>
          ))
        )}
      </div>
    );
  }, [showCompleted, completedTodos, toggleTodo]);

  return (
    <div className="todo-container">
      {error && <div className="todo-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="todo-input-container">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo"
          className="todo-input"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="todo-add-button"
          disabled={isLoading || !newTodo.trim()}
        >
          Add
        </button>
      </form>
      
      <div className="todo-list">
        <h3>Tasks</h3>
        {isLoading ? (
          <p className="todo-loading">Loading tasks...</p>
        ) : todos.length === 0 ? (
          <p className="todo-empty-message">No tasks to display</p>
        ) : (
          todos.map((todo, index) => (
            <div key={`todo-${index}`} className="todo-item">
              <input
                type="checkbox"
                checked={false} // Ensure unchecked for not completed todos
                onChange={() => toggleTodo(todo, true)}
                className="todo-checkbox"
                id={`todo-${index}`}
              />
              <label htmlFor={`todo-${index}`} className="todo-text">
                {todo.text}
              </label>
            </div>
          ))
        )}
      </div>
      
      <button
        onClick={() => setShowCompleted(!showCompleted)}
        className="todo-toggle-completed-button"
        disabled={isLoading}
      >
        {showCompleted ? "Hide Completed Tasks" : "Show Completed Tasks"}
      </button>
      
      {renderedCompletedTodos}
    </div>
  );
};

export default React.memo(TodoList);
