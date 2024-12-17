document.addEventListener("click", (e) => {
  const token = localStorage.getItem("token");
  if (token === null) {
    e.preventDefault();
    alert("Your session has expired. Please log in again.");
    localStorage.removeItem("authToken");
    window.location.href = "http://localhost:3000/login.html";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  //LOGOUT FUNCTION
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
          alert("Successfully logout");

          localStorage.clear();
          window.location.href = "/login.html";
        } else {
          alert("Error logging out");
          localStorage.clear();
          window.location.href = "/login.html";
        }
      } catch (error) {
        console.error("Error logging out:", error);
        alert("Error logging out. Please try again.");
      }
    });
  }

  if (window.location.pathname.includes("participant.html")) {
    const eventsGrid = document.getElementById("my-events-grid");

    async function fetchUpcomingEvents() {
      try {
        const response = await fetch(
          "http://localhost:3000/api/v1/events/participant/upcoming",
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
        eventsGrid.innerHTML = "";
        const events = Array.isArray(data) ? data : data.events;
        if (Array.isArray(events)) {
          events.forEach((event) => createEventRow(event, eventsGrid));
        } else {
          eventsGrid.innerHTML = `<p class="no-data-message">No Completed Events.</p>`;
          console.error("Data is not an array:", data);
        }
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        eventsGrid.innerHTML = `<p class="error-message">Failed to load upcoming events. Please try again later.</p>`;
      }
    }

    fetchUpcomingEvents();
  }

  // COMPLETED PAGE LOGIC
  if (window.location.pathname.includes("completed-events.html")) {
    const eventsGrid = document.getElementById("my-events-grid");

    async function fetchCompletedEvents() {
      try {
        const response = await fetch(
          "http://localhost:3000/api/v1/events/participant/completed",
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

  // CREATE EVENT ROW
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
    event.type === "in-person" && event.location
      ? `<a href="${event.location}" target="_blank" rel="noopener noreferrer">${event.location}</a>`
      : "Link will be available after registration"
  }
</div>

    ${
      event.status === "upcoming"
        ? `<button class="register-event-button" data-event='${JSON.stringify(
            event
          )}'>Register Event</button>`
        : ""
    }
       
      </div>
      </div>
    `;

    parentElement.appendChild(eventRow);
  }

  // REGISTER EVENT BTN
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("register-event-button")) {
      event.preventDefault();
      const eventData = JSON.parse(event.target.getAttribute("data-event"));
      window.location.href =
        "http://localhost:3000/ParticipantDashboard/event-details.html";
      localStorage.setItem("eventData", JSON.stringify(eventData));
    }
  });

  // MY EVENT PAGE
  if (window.location.pathname.includes("my-events.html")) {
    async function fetchMyEvents(type = "") {
      try {
        const response = await fetch(
          "http://localhost:3000/api/v1/events/participant/my-events",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }

        const { myEvents } = await response.json();
        renderEvents("upcoming-events", myEvents.upcoming);
        renderEvents("live-events", myEvents.live);
        renderEvents("completed-events", myEvents.completed);
      } catch (error) {
        console.error("Error fetching My Events:", error);
      }
    }

    function renderEvents(sectionId, events) {
      const section = document.getElementById(sectionId);
      section.innerHTML = "";

      if (!events.length) {
        section.innerHTML = "<p>No events available.</p>";
        return;
      }

      events.forEach((event) => {
        const card = document.createElement("div");
        card.classList.add("event-card");
        card.innerHTML = `
        <div class="card">
                <img src="${
                  event.thumbnail || "https://via.placeholder.com/350x150"
                }" alt="Event Thumbnail" class="image-thumbnail"/>
                <div class="event-card-content">
                    <div class="event-card-title">${event.title}</div>
                    <div class="event-card-details">Date: ${event.date}</div>
                    <div class="event-card-details">Time: ${formatTime(
                      event.startTime
                    )} - ${formatTime(event.endTime)}</div>
                    <div class="event-card-details">Type: ${event.type}</div>
                    <div class="event-card-location">Location: 
                    ${
                      event.type === "online"
                        ? (() => {
                            const currentTime = new Date();
                            const eventDateTime = new Date(
                              `${event.date}T${event.startTime}`
                            );
                            const timeDifference = eventDateTime - currentTime;
                            const hoursLeft = timeDifference / (1000 * 60 * 60);
                            return hoursLeft <= 24
                              ? `<a href="${event.location}">${event.location}</a>`
                              : "Link details will be available 24 hours before the event.";
                          })()
                        : event.location
                    }</div>
                    <button class="check-ticket-button" data-event='${JSON.stringify(
                      event
                    )}'>Ticket</button>
                </div>
                </div>
            `;
        section.appendChild(card);
      });
    }
    fetchMyEvents();
  }

  document.addEventListener("click", async function (event) {
    if (event.target.classList.contains("check-ticket-button")) {
      event.preventDefault();
      try {
        const eventData = JSON.parse(event.target.getAttribute("data-event"));
        if (eventData.status === "upcoming") {
          if (eventData.type === "in-person") {
            const ticket = await getTicketUser(eventData.id);
            eventData["ticket"] = ticket;
          } else if (eventData.type === "online") {
            const ticket = eventData.location;
            eventData["ticket"] = ticket;
          }
        }
        localStorage.setItem("eventData", JSON.stringify(eventData));
        window.location.href =
          "http://localhost:3000/ParticipantDashboard/event-details.html";
      } catch (error) {
        console.error("Error fetching ticket:", error);
        alert("Failed to fetch ticket. Please try again.");
      }
    }
  });

  async function getTicketUser(event_id) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/rsvp/${event_id}/ticket`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ticket: ${response.statusText}`);
      }
      const data = await response.json();
      return data.ticket;
    } catch (error) {
      console.error("Error in getTicketUser:", error);
      throw error; // Rethrow the error so it can be handled by the calling function
    }
  }

  //FILTER PROPERTY
  const categoryFilter = document.getElementById("category-filter");
  const searchBtn = document.getElementById("search-btn");
  const eventsGrid = document.getElementById("my-events-grid");
  const baseURL = "http://localhost:3000/api/v1/events";

  const isCompletedPage = window.location.pathname.includes("completed-events");
  const endpoint = `${baseURL}/participant/${
    isCompletedPage ? "completed" : "upcoming"
  }`;

  // Fetch and render filtered events
  const fetchFilteredEvents = async (typeFilter) => {
    try {
      const query = typeFilter ? `?type=${encodeURIComponent(typeFilter)}` : "";
      const response = await fetch(`${endpoint}${query}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      renderEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching filtered events:", error.message);
      eventsGrid.innerHTML = `<p>Error loading events. Please try again later.</p>`;
    }
  };

  // Render events in card format
  const renderEvents = (events) => {
    eventsGrid.innerHTML = ""; // Clear previous events

    if (!events || events.length === 0) {
      eventsGrid.innerHTML = `<p>No events found for the selected filter.</p>`;
      return;
    }

    events.forEach((event) => {
      const eventCard = document.createElement("div");
      eventCard.classList.add("row");

      eventCard.innerHTML = `
        <div>
          <img src="${
            event.thumbnail || "https://via.placeholder.com/350x250"
          }" 
               alt="Event Image" 
               class="event-thumbnail" />
        </div>
        <div class="event-info">
          <div class="event-title"><strong>${event.title}</strong></div>
          <div class="event-description">${
            event.description || "No description available"
          }</div>
          <div class="event-date"><strong>Date:</strong> ${event.date}</div>
          <div class="event-time"><strong>Time:</strong> ${formatTime(
            event.startTime
          )} - ${formatTime(event.endTime)}</div>
          <div class="event-type"><strong>Type:</strong> ${event.type}</div>
          <div class="event-status"><strong>Status:</strong> ${
            event.status || (isCompletedPage ? "Completed" : "Upcoming")
          }</div>
           <div class="event-location">
          <strong>Location:</strong> 
          ${
            event.type === "in-person" && event.location
              ? `<a href="${event.location}" target="_blank" rel="noopener noreferrer">${event.location}</a>`
              : "Link will be available after registration"
          }
          </div>
          ${
            event.status === "upcoming"
              ? `<button class="register-event-button" data-event='${JSON.stringify(
                  event
                )}'>Register Event</button>`
              : ""
          }
        </div>
      `;
      eventsGrid.appendChild(eventCard);
    });
  };

  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const typeFilter = categoryFilter.value;
    fetchFilteredEvents(typeFilter);
  });
});

// FORMAT DATE
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// FORMAT TIME
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
