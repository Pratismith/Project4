document.addEventListener("DOMContentLoaded", () => {
  // ✅ Dynamic API base URL
  const API_BASE = window.location.origin; // e.g. https://mynest-sr8f.onrender.com

  const form = document.getElementById("homestayForm");
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginLink = document.getElementById("loginLink");
  const userInfo = document.getElementById("user-info");

  // 1️⃣ Authentication Check
  if (!token) {
    localStorage.setItem("redirectAfterLogin", "add-homestay.html");
    alert("⚠️ Please log in to add a homestay.");
    window.location.href = "login.html";
    return;
  }

  // 2️⃣ Show username bottom-right and logout button
  if (userName) {
    userInfo.textContent = `👋 Hello, ${userName}`;
  }
  if (loginLink) loginLink.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "inline-block";

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.location.href = "login.html";
  });

  // 3️⃣ Handle form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    // Manual append to ensure no nulls/undefined
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
      } else if (input.name && input.value !== undefined && input.value !== null) {
        formData.append(input.name, input.value);
      }
    });

    // Default gender
    if (!formData.has("gender")) formData.set("gender", "Any");

    try {
      // ✅ Use dynamic backend URL
      console.log("Submitting to:", `${API_BASE}/api/properties/add-property`);
      
      // LOG THE DATA BEING SENT
      for (let pair of formData.entries()) {
        console.log("Sending field:", pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
      }

      const res = await fetch(`${API_BASE}/api/properties/add-property`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const text = await res.text();
      console.log("Raw response status:", res.status);
      console.log("Raw response text:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      if (res.ok) {
        alert("✅ Homestay added successfully!");
        sessionStorage.removeItem("rentease_properties_cache");
        window.location.href = "my-properties.html";
      } else {
        alert(`❌ Failed: ${data.message || "Error adding homestay"}`);
      }
    } catch (err) {
      console.error("Full Error Object:", err);
      alert(`⚠️ Server error: ${err.message}`);
    }
  });

  // 4️⃣ Image validation
  const imageInput = document.getElementById("images");
  imageInput?.addEventListener("change", (e) => {
    const files = e.target.files;
    if (files.length > 5) {
      alert("⚠️ Maximum 5 images allowed");
      imageInput.value = "";
    } else {
      const helpText = imageInput.nextElementSibling;
      if (helpText) {
        helpText.textContent = `${files.length} image(s) selected`;
        helpText.style.color = "green";
      }
    }
  });
});
