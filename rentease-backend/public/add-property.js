document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("propertyForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Please login first to add a property.");
      window.location.href = "login.html";
      return;
    }

    const API_BASE = window.location.origin; 

    const formData = new FormData();
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input.type === 'file') {
        if (input.files.length > 0) {
          for (let i = 0; i < input.files.length; i++) {
            formData.append('images', input.files[i]);
          }
        }
      } else if (input.type === 'checkbox') {
        if (input.checked) {
          formData.append('amenities', input.value);
        }
      } else if (input.name) {
        formData.append(input.name, input.value);
      }
    });

    try {
      const response = await fetch(`${API_BASE}/api/properties/add-property`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // ❌ Don’t add Content-Type manually — browser handles it
        },
        body: formData,
      });

      const text = await response.text(); // safer than .json() if server sends HTML on error
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non-JSON response:", text);
        throw new Error("Server returned unexpected data");
      }

      console.log("Backend response:", data);

      if (response.ok) {
        alert("✅ Property added successfully!");
        window.location.href = "my-properties.html";
      } else {
        alert(`❌ Failed: ${data.message || "Something went wrong"}`);
      }
    } catch (error) {
      console.error("Error adding property:", error);
      alert("⚠️ Server error. Please try again.");
    }
  });
});
