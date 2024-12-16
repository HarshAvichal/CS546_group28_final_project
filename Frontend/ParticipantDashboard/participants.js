if (window.location.pathname.includes("participant.html")) {
  const eventsGrid = document.getElementById("upcoming-events");
  const baseURL = "http://localhost:3000/api/v1/events";

  async function fetchUpcomingEvents(category = "") {
    const baseURL = "http://localhost:3000/api/v1/events";
    try {
        const query = category ? `?type=${category}` : "";
        console.log(`${baseURL}/participant/upcoming${query}`)
        const response = await fetch(`${baseURL}/participant/upcoming${query}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`, // Ensure token is present
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        renderEvents(data.events || data); // Adjust based on response structure
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        eventsGrid.innerHTML = `<p class="error-message">Failed to load upcoming events. Please try again later.</p>`;
    }
}


  function renderEvents(events) {
      eventsGrid.innerHTML = "";
      events.forEach(event => createEventRow(event));
  }

  function createEventRow(event) {
      const eventRow = document.createElement("div");
      eventRow.classList.add("event-row");

      eventRow.innerHTML = `
          <div class="event-image"><img src="${event.thumbnail || 'placeholder.jpg'}" class="event-thumbnail"/></div>
          <div class="event-title">${event.title}</div>
          <div class="event-date"><strong>Date:</strong> ${formatDate(event.date)}</div>
          <div class="event-time"><strong>Time:</strong> ${formatTime(event.startTime)} - ${formatTime(event.endTime)}</div>
          <div class="event-type"><strong>Type:</strong> ${event.type}</div>
          <div class="event-location"><strong>Location:</strong> ${event.location || "N/A"}</div>
          <button class="rsvp-button" data-id="${event._id}">RSVP</button>
      `;
      eventsGrid.appendChild(eventRow);
  }

  document.getElementById("category-filter").addEventListener("change", function () {
      fetchUpcomingEvents(this.value);
  });

  document.getElementById("search-btn").addEventListener("click", function () {
      const category = document.getElementById("category-filter").value;
      fetchUpcomingEvents(category);
  });

  fetchUpcomingEvents();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatTime(timeString) {
  const [hour, minute] = timeString.split(":");
  const date = new Date();
  date.setHours(hour, minute);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
