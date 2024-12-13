if (window.location.pathname.includes("organizer.html")) {
  const eventsGrid = document.getElementById("my-events-grid");

  async function fetchUpcomingEvents() {
    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/events/organizer/upcoming",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP Error: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("API Response:", data);

      eventsGrid.innerHTML = "";

      const events = Array.isArray(data) ? data : data.events;
      if (Array.isArray(events)) {
        events.slice(0, 5).forEach((event) => createEventRow(event));
      } else {
        console.error("Data is not an array:", data);
      }
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      if (eventsGrid) {
        eventsGrid.innerHTML = `<p class="error-message">Failed to load events. Please try again later.</p>`;
      }
    }
  }

  function createEventRow(event) {
    const eventRow = document.createElement("div");
    eventRow.classList.add("event-row");

    eventRow.innerHTML = `
      <div class="event-image"><img src=${
        event.thumbnail
      } class="event-thumbnail"/> </div>
      <div class="event-title">${event.title || "No Title Available"}</div>
      <div class="event-date"><strong>Date:</strong> ${formatDate(
        event.date
      )}</div>
      <div class="event-time"><strong>Time:</strong> ${formatTime(
        event.startTime
      )} - ${formatTime(event.endTime)}</div>
      <div class="event-type"><strong>Type:</strong> ${
        event.type || "N/A"
      }</div>
      <div class="event-status"><strong>Status:</strong> ${
        event.status || "N/A"
      }</div>
      <div class="event-location"><strong>Location:</strong> ${
        event.location || "N/A"
      }</div>
    `;

    eventsGrid.appendChild(eventRow);
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(timeString) {
    if (!timeString) return "N/A";
    const [hour, minute] = timeString.split(":");
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  fetchUpcomingEvents();
}

if (window.location.pathname.includes("completed-events.html")) {
  const eventsGrid = document.getElementById("completed-events-grid");

  async function fetchUpcomingEvents() {
    try {
      const response = await fetch(
        "http://localhost:3000/api/v1/events/organizer/completed",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP Error: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("API Response:", data);

      eventsGrid.innerHTML = "";

      const events = Array.isArray(data) ? data : data.events;
      if (Array.isArray(events)) {
        events.slice(0, 5).forEach((event) => createEventRow(event));
      } else {
        console.error("Data is not an array:", data);
      }
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      if (eventsGrid) {
        eventsGrid.innerHTML = `<p class="error-message">Failed to load events. Please try again later.</p>`;
      }
    }
  }

  function createEventRow(event) {
    const eventRow = document.createElement("div");
    eventRow.classList.add("event-row");

    eventRow.innerHTML = `
      <div class="event-image"><img src=${
        event.thumbnail
      } class="event-thumbnail"/> </div>
      <div class="event-title">${event.title || "No Title Available"}</div>
      <div class="event-date"><strong>Date:</strong> ${formatDate(
        event.date
      )}</div>
      <div class="event-time"><strong>Time:</strong> ${formatTime(
        event.startTime
      )} - ${formatTime(event.endTime)}</div>
      <div class="event-type"><strong>Type:</strong> ${
        event.type || "N/A"
      }</div>
      <div class="event-status"><strong>Status:</strong> ${
        event.status || "N/A"
      }</div>
      <div class="event-location"><strong>Location:</strong> ${
        event.location || "N/A"
      }</div>
    `;

    eventsGrid.appendChild(eventRow);
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(timeString) {
    if (!timeString) return "N/A";
    const [hour, minute] = timeString.split(":");
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  fetchUpcomingEvents();
}

// Create Event Form
const createEventForm = document.getElementById("create-event-form");
const eventType = document.getElementById("eventType");
const eventLocation = document.getElementById("eventLocation");

eventType.addEventListener("change", () => {
  if (eventType.value === "online") {
    eventLocation.placeholder = "https://meet.jit.si/<your room name>";
  } else {
    eventLocation.placeholder = "Enter event location";
  }
});

createEventForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(createEventForm);

  if (!isValidDate(formData.get("date"))) {
    alert("Invalid date format. Use YYYY-MM-DD.");
    return;
  }

  if (formData.get("startTime") >= formData.get("endTime")) {
    alert("End time must be after start time.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/v1/events/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      alert("Event created successfully!");
      createEventForm.reset();
      window.location.href = "organizer.html";
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error("Error creating event:", error);
    alert("Something went wrong. Please try again later.");
  }
});

function isValidDate(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(dateString);
}

document.getElementById("logout").addEventListener("click", async (e) => {
  e.preventDefault(); // Prevent default link behavior
  try {
    const response = await fetch("/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    if (response.ok) {
      alert("Successfully logged out");
      localStorage.removeItem("token"); // Remove token from local storage
      window.location.href = "/login.html"; // Redirect to login page
    } else {
      alert("Error logging out");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error logging out");
  }
});
