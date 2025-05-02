import React, { useState, useEffect } from "react";
import { fetchTodos, appendTodo, updateTodo } from "../utils/sheetsApi";

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchAndSyncTodos = async () => {
    try {
      const data = await fetchTodos();
      // Sync both completed and not completed todos
      setTodos(data.filter((todo) => !todo.completed));
      setCompletedTodos(data.filter((todo) => todo.completed));
    } catch (error) {
      console.error("Error fetching todos:", error);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    const newEntry = { text: newTodo, completed: false };
    try {
      await appendTodo(newEntry);
      setTodos([...todos, newEntry]);
      setNewTodo("");
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  const toggleTodo = async (todo, isCompleted, index) => {
    const updatedTodo = { ...todo, completed: isCompleted };
    
    try {
      // Find the index in the combined list of todos
      const allTodos = [...todos, ...completedTodos];
      const todoIndex = allTodos.findIndex(t => t.text === todo.text && t.completed === todo.completed);
      
      if (todoIndex !== -1) {
        // Update the specific todo in the spreadsheet
        await updateTodo(todoIndex, updatedTodo);
      }
      
      if (isCompleted) {
        setTodos(todos.filter((t) => t !== todo));
        setCompletedTodos([...completedTodos, updatedTodo]);
      } else {
        setCompletedTodos(completedTodos.filter((t) => t !== todo));
        setTodos([...todos, updatedTodo]);
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  useEffect(() => {
    fetchAndSyncTodos(); // Fetch and sync todos on component mount
  }, []);

  return (
    <div className="todo-container">
      <div className="todo-input-container">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo"
          className="todo-input"
        />
        <button onClick={addTodo} className="todo-add-button">
          Add
        </button>
      </div>
      <div className="todo-list">
        {todos.map((todo, index) => (
          <div key={index} className="todo-item">
            <input
              type="checkbox"
              checked={false} // Ensure unchecked for not completed todos
              onChange={() => toggleTodo(todo, true, index)}
              className="todo-checkbox"
            />
            <span className="todo-text">{todo.text}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => setShowCompleted(!showCompleted)}
        className="todo-toggle-completed-button"
      >
        {showCompleted ? "Hide Completed List" : "Show Completed List"}
      </button>
      {showCompleted && (
        <div className="todo-completed-list">
          {completedTodos.map((todo, index) => (
            <div key={index} className="todo-item completed">
              <input
                type="checkbox"
                checked={true} // Ensure checked for completed todos
                onChange={() => toggleTodo(todo, false, todos.length + index)}
                className="todo-checkbox"
              />
              <span className="todo-text">{todo.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoList;
