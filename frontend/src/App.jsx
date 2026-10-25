
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // Load saved tasks from localStorage when React initializes
  const [tasks, setTasks] = useState(() => {
    try {
      const savedTasks = localStorage.getItem("tasks");
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch {
      return [];
    }
  });

  // Store the input field value
  const [taskInput, setTaskInput] = useState("");

  // Save tasks whenever the tasks state changes
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Add a new task
  function addTask(e) {
    e.preventDefault();

    const trimmedTask = taskInput.trim();

    if (!trimmedTask) return;

    const newTask = {
      id: crypto.randomUUID(),
      title: trimmedTask,
    };

    setTasks((previousTasks) => [...previousTasks, newTask]);
    setTaskInput("");
  }

  // Remove a task by its ID
  function removeTask(id) {
    setTasks((previousTasks) =>
      previousTasks.filter((task) => task.id !== id)
    );
  }

  return (
    <div className="app">
      <h1>My To-Do List</h1>

      <form onSubmit={addTask} className="task-form">
        <input
          type="text"
          placeholder="Enter a task..."
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
        />

        <button type="submit">Add Task</button>
      </form>

      {tasks.length === 0 ? (
        <p className="empty-message">No tasks yet. Add one!</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className="task-item">
              <span>{task.title}</span>

              <button
                type="button"
                className="delete-button"
                onClick={() => removeTask(task.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="task-count">
        Total tasks: {tasks.length}
      </p>
    </div>
  );
}

export default App;
