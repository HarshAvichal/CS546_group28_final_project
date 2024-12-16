document.addEventListener("click", (e) => {
  const token = localStorage.getItem("token");
  if (token === null) {
    e.preventDefault();
    alert("Your session has expired. Please log in again.");
    localStorage.removeItem("authToken");
    window.location.href = "http://localhost:3000/login.html";
  }
});

// LOGOUT FUNCTION
document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.querySelector(".logout-dashboard");
  if (logoutButton) {
    logoutButton.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(
          "http://localhost:3000/api/v1/auth/logout",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          }
        );

        if (response.ok) {
          Toastify({
            text: "Successfully logged out",
            duration: 7000,
            destination: "https://github.com/apvarun/toastify-js",
            newWindow: true,
            close: true,
            gravity: "top", 
            position: "right", 
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
              background: "red",
            },
            onClick: function () {}, 
          }).showToast();

          localStorage.clear();
          window.location.href = "/login.html";
        } else {
          alert("Error logging out");
        }
      } catch (error) {
        console.error("Error logging out:", error);
        alert("Error logging out. Please try again.");
      }
    });
  }

  // ORGANIZER PAGE LOGIC
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

        if (!response.ok)
          throw new Error(
            `HTTP Error: ${response.status} - ${response.statusText}`
          );

        const data = await response.json();
        eventsGrid.innerHTML = "";

        const events = Array.isArray(data) ? data : data.events;
        console.log(events);
        if (Array.isArray(events)) {
          events.forEach((event) => createEventRow(event, eventsGrid));
        } else {
          eventsGrid.innerHTML = `<p class="no-data-message">No Upcoming Events.</p>`;
          console.error("Data is not an array:", data);
        }
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        if (eventsGrid) {
          eventsGrid.innerHTML = `<p class="error-message">Failed to load events. Please try again later.</p>`;
        }
      }
    }

    fetchUpcomingEvents();
  }

  // COMPLETED PAGE LOGIC
  if (window.location.pathname.includes("completed-events.html")) {
    const eventsGrid = document.getElementById("completed-events-grid");

    async function fetchCompletedEvents() {
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

        if (!response.ok)
          throw new Error(
            `HTTP Error: ${response.status} - ${response.statusText}`
          );

        const data = await response.json();
        eventsGrid.innerHTML = "";

        const events = Array.isArray(data) ? data : data.events;
        console.log(events);
        if (Array.isArray(events)) {
          events.forEach((event) => createEventRow(event, eventsGrid));
        } else {
          eventsGrid.innerHTML = `<p class="no-data-message">No Completed Events.</p>`;
          console.error("Data is not an array:", data);
        }
      } catch (error) {
        console.error("Error fetching completed events:", error);
        if (eventsGrid) {
          eventsGrid.innerHTML = `<p class="error-message">Failed to load events. Please try again later.</p>`;
        }
      }
    }

    fetchCompletedEvents();
  }

  // LIVE PAGE LOGIC
  if (window.location.pathname.includes("live-events.html")) {
    const eventsGrid = document.getElementById("live-events-grid");

    async function fetchLiveEvents() {
      try {
        const response = await fetch(
          "http://localhost:3000/api/v1/events/organizer/live",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok)
          throw new Error(
            `HTTP Error: ${response.status} - ${response.statusText}`
          );

        const data = await response.json();
        eventsGrid.innerHTML = "";
        const events = Array.isArray(data) ? data : data.liveEvents;
        console.log(events);
        if (Array.isArray(events)) {
          events.forEach((event) => createEventRow(event, eventsGrid));
        } else {
          eventsGrid.innerHTML = `<p class="no-data-message">No Live Events.</p>`;
          console.error("Data is not an array:", data);
        }
      } catch (error) {
        console.error("Error fetching completed events:", error);
        if (eventsGrid) {
          eventsGrid.innerHTML = `<p class="error-message">Failed to load events. Please try again later.</p>`;
        }
      }
    }

    fetchLiveEvents();
  }

  // CREATE EVENT PAGE LOGIC
  if (window.location.pathname.includes("create-event.html")) {
    const createEventForm = document.getElementById("create-event-form");
    const eventType = document.getElementById("eventType");
    const eventLocation = document.getElementById("eventLocation");

    if (eventType && eventLocation) {
      eventType.addEventListener("change", () => {
        if (eventType.value === "online") {
          eventLocation.placeholder = "https://meet.jit.si/<your room name>";
        } else {
          eventLocation.placeholder = "Enter event location";
        }
      });
    }

    if (createEventForm) {
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
          const response = await fetch(
            "http://localhost:3000/api/v1/events/create",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: formData,
            }
          );

          if (response.ok) {
            alert("Event created successfully!");
            createEventForm.reset();
            window.location.href = "organizer.html";
          } else {
            const result = await response.json();
            alert(`Error: ${result.message}`);
          }
        } catch (error) {
          console.error("Error creating event:", error);
          alert("Something went wrong. Please try again later.");
        }
      });
    }
  }

  function createEventRow(event, parentElement) {
    const eventRow = document.createElement("div");
    eventRow.classList.add("row");

    eventRow.innerHTML = `
    <div class="event-container">
      <div class="event-image"><img src="${
        event.thumbnail
      }" class="event-thumbnail"/></div>
      <div class="event-info">
      <div class="event-title">${event.title || "No Title Available"}</div>
      <div class="event-description">${
        event.description || "No Description Available"
      }</div>
      <div class="event-date"><strong>Date:</strong> ${event.date}</div>
      <div class="event-time"><strong>Time:</strong> ${formatTime(
        event.startTime
      )} - ${formatTime(event.endTime)}</div>
      <div class="event-type"><strong>Type:</strong> ${
        event.type || "N/A"
      }</div>
      <div class="event-status"><strong>Status:</strong> ${
        event.status || "N/A"
      }</div>
      <div class="event-location">
      <strong>Location:</strong> 
      ${
        event.location
          ? `<a href="${event.location}" target="_blank" rel="noopener noreferrer">${event.location}</a>`
          : "N/A"
      }
    </div>
    ${
      event.status === "upcoming"
        ? `<button class="update-event-button" data-event='${JSON.stringify(
            event
          )}'>Update Event</button>`
        : ""
    }
       
      </div>
      </div>
    `;

    parentElement.appendChild(eventRow);
  }

  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("update-event-button")) {
      event.preventDefault();
      const eventData = JSON.parse(event.target.getAttribute("data-event"));
      window.location.href =
        "http://localhost:3000/OrganizerDashboard/update-event.html";
      localStorage.setItem("eventData", JSON.stringify(eventData));
    }
  });

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

  function isValidDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(dateString);
  }
});
