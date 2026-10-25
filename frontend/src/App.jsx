import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tasks")) || [];
    } catch {
      return [];
    }
  });

  const [taskInput, setTaskInput] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Save tasks whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Request permission only after the user taps the button
  async function enableNotifications() {
    if (!("Notification" in window)) {
      alert("Notifications are not supported in this browser.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      alert("Notifications enabled!");
    } else {
      alert("Notifications were not enabled. Check your browser settings.");
    }
  }

  // Add a task with an optional reminder date and time
  function addTask(e) {
    e.preventDefault();

    const title = taskInput.trim();

    if (!title) return;

    if (dueDate && new Date(dueDate).getTime() <= Date.now()) {
      alert("Please choose a future date and time.");
      return;
    }

    const newTask = {
      id: crypto.randomUUID(),
      title,
      dueDate: dueDate || null,
      notified: false,
    };

    setTasks((previous) => [...previous, newTask]);
    setTaskInput("");
    setDueDate("");
  }

  // Confirm before removing a task
  function removeTask(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (confirmed) {
      setTasks((previous) => previous.filter((task) => task.id !== id));
    }
  }

  // Check for reminders while the app is open
  useEffect(() => {
    async function checkReminders() {
      if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      const now = Date.now();

      const dueTasks = tasks.filter(
        (task) =>
          task.dueDate &&
          !task.notified &&
          new Date(task.dueDate).getTime() <= now
      );

      if (dueTasks.length === 0) return;

      let registration = null;

      if ("serviceWorker" in navigator) {
        registration = await navigator.serviceWorker.getRegistration();
      }

      for (const task of dueTasks) {
        try {
          if (registration) {
            await registration.showNotification("Task reminder", {
              body: task.title,
              icon: "/pwa-192x192.png",
              tag: task.id,
            });
          } else {
            new Notification("Task reminder", {
              body: task.title,
            });
          }

          setTasks((previous) =>
            previous.map((item) =>
              item.id === task.id ? { ...item, notified: true } : item
            )
          );
        } catch (error) {
          console.error("Could not show notification:", error);
        }
      }
    }

    checkReminders();

    const interval = setInterval(checkReminders, 15000);

    return () => clearInterval(interval);
  }, [tasks]);

  return (
    <main className="app">
      <header className="app-header">
        <h1>My To-Do List</h1>

        <button type="button" onClick={enableNotifications}>
          Enable Notifications
        </button>
      </header>

      <form onSubmit={addTask} className="task-form">
        <input
          type="text"
          placeholder="Enter a task..."
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          required
        />

        <label htmlFor="dueDate">Reminder date and time (optional)</label>

        <input
          id="dueDate"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <button type="submit">Add Task</button>
      </form>

      {tasks.length === 0 ? (
        <p className="empty-message">No tasks yet. Add one!</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className="task-item">
              <div className="task-details">
                <span>{task.title}</span>

                {task.dueDate && (
                  <small>
                    Reminder: {new Date(task.dueDate).toLocaleString()}
                  </small>
                )}
              </div>

              <button
                type="button"
                className="delete-button"
                onClick={() => removeTask(task.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="task-count">Total tasks: {tasks.length}</p>
    </main>
  );
}

export default App;

// import { useEffect, useState } from "react";
// import "./App.css";

// function App() {
//   // Load saved tasks from localStorage when React initializes
//   const [tasks, setTasks] = useState(() => {
//     try {
//       const savedTasks = localStorage.getItem("tasks");
//       return savedTasks ? JSON.parse(savedTasks) : [];
//     } catch {
//       return [];
//     }
//   });

//   // Store the input field value
//   const [taskInput, setTaskInput] = useState("");

//   // Save tasks whenever the tasks state changes
//   useEffect(() => {
//     localStorage.setItem("tasks", JSON.stringify(tasks));
//   }, [tasks]);

//   // Add a new task
//   function addTask(e) {
//     e.preventDefault();

//     const trimmedTask = taskInput.trim();

//     if (!trimmedTask) return;

//     const newTask = {
//       id: crypto.randomUUID(),
//       title: trimmedTask,
//     };

//     setTasks((previousTasks) => [...previousTasks, newTask]);
//     setTaskInput("");
//   }

//   // Remove a task by its ID
//   function removeTask(id) {
//     setTasks((previousTasks) =>
//       previousTasks.filter((task) => task.id !== id)
//     );
//   }

//   return (
//     <div className="app">
//       <h1>My To-Do List</h1>

//       <form onSubmit={addTask} className="task-form">
//         <input
//           type="text"
//           placeholder="Enter a task..."
//           value={taskInput}
//           onChange={(e) => setTaskInput(e.target.value)}
//         />

//         <button type="submit">Add Task</button>
//       </form>

//       {tasks.length === 0 ? (
//         <p className="empty-message">No tasks yet. Add one!</p>
//       ) : (
//         <ul className="task-list">
//           {tasks.map((task) => (
//             <li key={task.id} className="task-item">
//               <span>{task.title}</span>

//               <button
//                 type="button"
//                 className="delete-button"
//                 onClick={() => removeTask(task.id)}
//               >
//                 Remove
//               </button>
//             </li>
//           ))}
//         </ul>
//       )}

//       <p className="task-count">
//         Total tasks: {tasks.length}
//       </p>
//     </div>
//   );
// }

// export default App;
