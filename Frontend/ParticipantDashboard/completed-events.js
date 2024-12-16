if (window.location.pathname.includes("completed-events.html")) {
    const eventsGrid = document.getElementById("completed-events-grid");
    const baseURL = "http://localhost:3000/api/v1/events";

    async function fetchCompletedEvents(category = "") {
        try {
            const query = category ? `?type=${category}` : "";
            const response = await fetch(`${baseURL}/participant/completed${query}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            renderEvents(data.events || data);
        } catch (error) {
            console.error("Error fetching completed events:", error);
            eventsGrid.innerHTML = `<p class="error-message">Failed to load events. Please try again later.</p>`;
        }
    }

    function renderEvents(events) {
        eventsGrid.innerHTML = "";
        if (events.length === 0) {
            eventsGrid.innerHTML = `<p>No completed events available.</p>`;
            return;
        }

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
            <button class="feedback-button" data-id="${event._id}">Submit Feedback</button>
        `;
        eventsGrid.appendChild(eventRow);
    }

    eventsGrid.addEventListener("click", (e) => {
        if (e.target.classList.contains("feedback-button")) {
            const eventId = e.target.dataset.id;
            window.location.href = `/feedback.html?eventId=${eventId}`;
        }
    });

    document.getElementById("category-filter").addEventListener("change", function () {
        fetchCompletedEvents(this.value);
    });

    document.getElementById("search-btn").addEventListener("click", function () {
        const category = document.getElementById("category-filter").value;
        fetchCompletedEvents(category);
    });

    fetchCompletedEvents();
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
