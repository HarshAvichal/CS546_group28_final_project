document
  .getElementById("login-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent the form from refreshing the page

    // Get email and password values
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      // Make a POST request to the backend login API
      const response = await fetch("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Handle the response
      if (response.ok) {
        const data = await response.json();
        alert(data.message); // Show success message (optional)

        // Store the token in localStorage or cookies for authentication
        localStorage.setItem("token", data.token);

        // Redirect the user to the dashboard
        window.location.href = "/OrganizerDashboard/organizer.html";
      } else {
        const error = await response.json();
        alert(error.message); // Show error message
      }
    } catch (err) {
      console.error("Error logging in:", err);
      alert("Something went wrong. Please try again later.");
    }
  });

document
  .getElementById("signup-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent the form from refreshing the page

    // Get email and password values
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const role = document.getElementById("role").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      // Make a POST request to the backend login API
      const response = await fetch("http://localhost:3000/api/v1/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName,email, password }),
      });

      // Handle the response
      if (response.ok) {
        const data = await response.json();
        alert(data.message); // Show success message (optional)

        // Store the token in localStorage or cookies for authentication
        localStorage.setItem("token", data.token);

        // Redirect the user to the dashboard
        window.location.href = "/OrganizerDashboard/organizer.html";
      } else {
        const error = await response.json();
        alert(error.message); // Show error message
      }
    } catch (err) {
      console.error("Error logging in:", err);
      alert("Something went wrong. Please try again later.");
    }
  });
