import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingTodo, setEditingTodo] = useState(null);
  const [apiUrl] = useState('YOUR_API_GATEWAY_URL'); // Replace with your API URL from Terraform output

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${apiUrl}/todos`);
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const addTodo = async () => {
    if (!title.trim()) return;

    try {
      const response = await fetch(`${apiUrl}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      const newTodo = await response.json();
      setTodos([...todos, newTodo]);
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const updateTodo = async (todoId, updatedData) => {
    try {
      const response = await fetch(`${apiUrl}/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const updatedTodo = await response.json();
      setTodos(todos.map(todo => todo.todoId === todoId ? updatedTodo : todo));
      setEditingTodo(null);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (todoId) => {
    try {
      await fetch(`${apiUrl}/todos/${todoId}`, {
        method: 'DELETE',
      });
      setTodos(todos.filter(todo => todo.todoId !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const toggleComplete = (todo) => {
    updateTodo(todo.todoId, { completed: !todo.completed });
  };

  const startEditing = (todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description || '');
  };

  const cancelEditing = () => {
    setEditingTodo(null);
    setTitle('');
    setDescription('');
  };

  const saveEdit = () => {
    updateTodo(editingTodo.todoId, { title, description });
  };

  return (
    <div className="App">
      <h1>Todo App</h1>
      <div className="todo-form">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
        />
        {editingTodo ? (
          <>
            <button onClick={saveEdit}>Save</button>
            <button onClick={cancelEditing}>Cancel</button>
          </>
        ) : (
          <button onClick={addTodo}>Add Todo</button>
        )}
      </div>
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.todoId} className={todo.completed ? 'completed' : ''}>
            <div className="todo-content">
              <h3>{todo.title}</h3>
              {todo.description && <p>{todo.description}</p>}
              <small>{new Date(todo.createdAt).toLocaleString()}</small>
            </div>
            <div className="todo-actions">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleComplete(todo)}
              />
              <button onClick={() => startEditing(todo)}>Edit</button>
              <button onClick={() => deleteTodo(todo.todoId)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
