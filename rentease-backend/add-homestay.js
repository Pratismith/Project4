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
    
    // Capture all form fields first
    const inputs = form.querySelectorAll('input, select, textarea');
    const propertyDetails = {};

    inputs.forEach(input => {
      // Special handling for file inputs (images)
      if (input.type === 'file') {
        if (input.files.length > 0) {
          for (let i = 0; i < input.files.length; i++) {
            formData.append('images', input.files[i]);
          }
        }
      } 
      // Special handling for checkboxes
      else if (input.type === 'checkbox') {
        if (input.name === 'amenities' && input.checked) {
          formData.append('amenities', input.value);
        }
        // homestay_type is handled separately later
      } 
      // All other named inputs with values
      else if (input.name && input.value !== undefined && input.value !== null && input.value.trim() !== "") {
        // Check if it's a dynamic field (e.g., beds_1BHK or price_1BHK)
        const dynamicMatch = input.name.match(/^(beds|baths|kitchen|sqFt|maxGuests|price|deposit)_(.+)$/);
        if (dynamicMatch) {
          const [_, field, type] = dynamicMatch;
          if (!propertyDetails[type]) propertyDetails[type] = {};
          propertyDetails[type][field] = input.value;
          console.log(`DEBUG [Field Capture]: Capturing dynamic field ${field} for type ${type} with value ${input.value}`);
        } else {
          formData.append(input.name, input.value);
          console.log(`DEBUG [Field Capture]: Capturing static field ${input.name} with value ${input.value}`);
        }
      }
    });

    // Reconstruct selected types from checkboxes
    const selectedTypes = Array.from(form.querySelectorAll('input[name="homestay_type"]:checked')).map(cb => cb.value);
    formData.set("type", selectedTypes.join(", "));
    console.log("DEBUG [Field Capture]: Selected types:", selectedTypes);
    
    // Add nested details as a stringified JSON
    formData.append("details", JSON.stringify(propertyDetails));

    // CRITICAL: Ensure 'price' is set at the top level for backend validation
    let foundPrice = null;
    if (selectedTypes.length > 0) {
      for (const type of selectedTypes) {
        if (propertyDetails[type] && propertyDetails[type].price) {
          foundPrice = propertyDetails[type].price;
          formData.set("price", foundPrice);
          formData.set("deposit", propertyDetails[type].deposit || "0");
          formData.set("beds", propertyDetails[type].beds || "0");
          formData.set("baths", propertyDetails[type].baths || "0");
          formData.set("sqFt", propertyDetails[type].sqFt || "0");
          formData.set("maxGuests", propertyDetails[type].maxGuests || "0");
          console.log(`DEBUG [Price Setup]: Found price ${foundPrice} in room type ${type}`);
          break;
        }
      }
    }
    
    // Fallback if no room type price found
    if (!foundPrice) {
      const commonPrice = document.getElementById("price")?.value;
      if (commonPrice) {
        formData.set("price", commonPrice);
        const commonDeposit = document.getElementById("deposit")?.value;
        if (commonDeposit) formData.set("deposit", commonDeposit);
        console.log("DEBUG [Price Setup]: Using common price:", commonPrice);
      }
    }

    console.log("DEBUG [Final FormData]: Sending Title:", formData.get("title"), "Location:", formData.get("location"), "Price:", formData.get("price"));

    // Default gender
    if (!formData.has("gender")) formData.set("gender", "Any");

    try {
      const API_BASE = window.location.origin;
      console.log("Submitting to:", `${API_BASE}/api/properties/add-property`);
      
      const res = await fetch(`${API_BASE}/api/properties/add-property`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      console.log("Response:", data);

      if (res.ok) {
        alert("✅ Homestay added successfully!");
        window.location.href = "my-properties.html";
      } else {
        alert(`❌ Error: ${data.message}\n${data.error || ""}`);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert(`⚠️ Connection Error: ${err.message}`);
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