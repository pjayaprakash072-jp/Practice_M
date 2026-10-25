
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => "Notification" in window && Notification.permission === "granted"
  );
  const [notificationLoading, setNotificationLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  async function enableNotifications() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Push notifications are not supported in this browser.");
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      alert("VAPID public key is missing from your frontend .env file.");
      return;
    }

    setNotificationLoading(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        alert("Please allow notifications in your browser settings.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const response = await fetch(`${API_URL}/api/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error(`Subscription request failed (${response.status})`);
      }

      setNotificationsEnabled(true);
      alert("Push notifications enabled successfully!");
    } catch (error) {
      console.error("Could not enable push notifications:", error);
      alert(
        "Could not enable push notifications. Check that your backend is running and its subscription route is correct."
      );
    } finally {
      setNotificationLoading(false);
    }
  }

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

  function removeTask(id) {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setTasks((previous) => previous.filter((task) => task.id !== id));
  }

  // Fallback reminders work only while this page is open.
  // Background reminders require backend scheduling and Web Push.
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

      const registration = await navigator.serviceWorker
        .getRegistration()
        .catch(() => null);

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

        <button
          type="button"
          onClick={enableNotifications}
          disabled={notificationLoading}
        >
          {notificationLoading
            ? "Enabling..."
            : notificationsEnabled
              ? "Enable Notifications Again"
              : "Enable Notifications"}
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
