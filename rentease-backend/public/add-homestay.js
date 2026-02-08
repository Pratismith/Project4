document.addEventListener("DOMContentLoaded", () => {
  // ✅ Dynamic API base URL
  const API_BASE = window.location.origin; // e.g. https://mynest-sr8f.onrender.com

  const form = document.getElementById("homestayForm");
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");
  const logoutBtn = document.getElementById("logout-link");
  const loginLink = document.getElementById("loginLink");
  const userInfo = document.getElementById("welcome-username");

  // 1️⃣ Authentication Check
  if (!token) {
    localStorage.setItem("redirectAfterLogin", "add-homestay.html");
    alert("⚠️ Please log in to add a homestay.");
    window.location.href = "login.html";
    return;
  }

  // 2️⃣ Show username bottom-right and logout button
  if (userName && userInfo) {
    userInfo.textContent = `👋 Hello, ${userName}`;
  }
  if (loginLink) loginLink.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "flex";

  logoutBtn?.addEventListener("click", (e) => {
    e.preventDefault();
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
      // Special handling for date inputs
      else if (input.type === 'date') {
        if (input.value) {
          formData.append(input.name, input.value);
          console.log(`DEBUG [Field Capture]: Capturing date field ${input.name} with value ${input.value}`);
        }
      }
      // All other named inputs with values
      else if (input.name && input.value !== undefined && input.value !== null && input.value.toString().trim() !== "") {
        // Check if it's a dynamic field (e.g., price_1BHK)
        const dynamicMatch = input.name.match(/^(beds|baths|kitchen|sqFt|maxGuests|price|deposit)_(.+)$/);
        if (dynamicMatch) {
          const [_, field, type] = dynamicMatch;
          const cleanType = type.trim();
          if (!propertyDetails[cleanType]) propertyDetails[cleanType] = {};
          propertyDetails[cleanType][field] = input.value;
          console.log(`DEBUG [Field Capture]: Capturing dynamic field ${field} for type ${cleanType} with value ${input.value}`);
        } else if (input.name !== "homestay_type") {
          formData.append(input.name, input.value);
          console.log(`DEBUG [Field Capture]: Capturing static field ${input.name} with value ${input.value}`);
        }
      }
    });

    // Reconstruct selected types from checkboxes
    const selectedTypes = Array.from(form.querySelectorAll('input[name="homestay_type"]:checked')).map(cb => cb.value.trim());
    formData.set("type", selectedTypes.join(", "));
    console.log("DEBUG [Field Capture]: Selected types (trimmed):", selectedTypes);
    
    // Set base price from common pricing section
    const commonPrice = document.getElementById("price")?.value;
    const commonDeposit = document.getElementById("deposit")?.value;

    if (commonPrice) {
      formData.set("price", commonPrice);
    }
    if (commonDeposit) {
      formData.set("deposit", commonDeposit);
    }

    // Capture dynamic room-specific details from containers
    const sectionsContainer = document.getElementById('sections-container');
    const pricingContainer = document.getElementById('pricing-container');

    if (selectedTypes.length > 0) {
      for (const cleanType of selectedTypes) {
        if (!propertyDetails[cleanType]) propertyDetails[cleanType] = {};
        
        if (sectionsContainer) {
          const section = sectionsContainer.querySelector(`.type-section[data-type="${cleanType}"]`);
          if (section) {
            propertyDetails[cleanType].beds = section.querySelector(`[name="beds_${cleanType}"]`)?.value;
            propertyDetails[cleanType].baths = section.querySelector(`[name="baths_${cleanType}"]`)?.value;
            propertyDetails[cleanType].kitchen = section.querySelector(`[name="kitchen_${cleanType}"]`)?.value;
            propertyDetails[cleanType].sqFt = section.querySelector(`[name="sqFt_${cleanType}"]`)?.value;
            propertyDetails[cleanType].maxGuests = section.querySelector(`[name="maxGuests_${cleanType}"]`)?.value;
          }
        }
        
        if (pricingContainer) {
          const section = pricingContainer.querySelector(`.price-section[data-type="${cleanType}"]`);
          if (section) {
            propertyDetails[cleanType].price = section.querySelector(`[name="price_${cleanType}"]`)?.value;
            propertyDetails[cleanType].deposit = section.querySelector(`[name="deposit_${cleanType}"]`)?.value;
          }
        }
        
        console.log(`DEBUG [Final Capture]: Details for ${cleanType}:`, propertyDetails[cleanType]);
      }
    }
    
    // Add nested details as a stringified JSON
    formData.set("details", JSON.stringify(propertyDetails));

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

  // 5️⃣ Property Type Multi-select logic
  const typeDisplay = document.getElementById('type-display');
  const typeDropdown = document.getElementById('type-dropdown');
  const selectedText = document.getElementById('selected-types-text');
  const typeCheckboxes = document.querySelectorAll('input[name="homestay_type"]');
  const dynamicDetails = document.getElementById('dynamic-property-details');
  const dynamicPricing = document.getElementById('dynamic-pricing');
  const sectionsContainer = document.getElementById('sections-container');
  const pricingContainer = document.getElementById('pricing-container');
  const commonPricing = document.getElementById('common-pricing');
  const descriptionTitle = document.getElementById('description-section-title');

  if (typeDisplay && typeDropdown) {
    typeDisplay.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = typeDropdown.style.display === 'block';
      typeDropdown.style.display = isOpen ? 'none' : 'block';
      typeDisplay.style.borderColor = isOpen ? '#ddd' : '#2563eb';
      typeDisplay.style.boxShadow = isOpen ? 'none' : '0 0 0 3px rgba(37, 99, 235, 0.1)';
    });

    document.addEventListener('click', () => {
      typeDropdown.style.display = 'none';
      typeDisplay.style.borderColor = '#ddd';
      typeDisplay.style.boxShadow = 'none';
    });

    typeDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  function updateSelectedTypes() {
    const selected = Array.from(typeCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    if (selected.length > 0) {
      selectedText.textContent = selected.join(', ');
      selectedText.style.color = '#374151';
      if (dynamicDetails) dynamicDetails.style.display = 'block';
      if (dynamicPricing) dynamicPricing.style.display = 'block';
      if (descriptionTitle) descriptionTitle.style.display = 'none';
      if (commonPricing) commonPricing.style.display = 'block';
      document.getElementById('price')?.setAttribute('required', '');
      renderDetailSections(selected);
      renderPricingSections(selected);
    } else {
      selectedText.textContent = 'Select Type';
      selectedText.style.color = '#6b7280';
      if (dynamicDetails) dynamicDetails.style.display = 'none';
      if (dynamicPricing) dynamicPricing.style.display = 'none';
      if (descriptionTitle) descriptionTitle.style.display = 'flex';
      if (commonPricing) commonPricing.style.display = 'block';
      document.getElementById('price')?.setAttribute('required', '');
      if (sectionsContainer) sectionsContainer.innerHTML = '';
      if (pricingContainer) pricingContainer.innerHTML = '';
    }
  }

  function renderPricingSections(selectedTypes) {
    if (!pricingContainer) return;
    const existingData = {};
    pricingContainer.querySelectorAll('.price-section').forEach(section => {
      const type = section.dataset.type;
      existingData[type] = {
        price: section.querySelector(`[name="price_${type}"]`)?.value,
        deposit: section.querySelector(`[name="deposit_${type}"]`)?.value
      };
    });

    pricingContainer.innerHTML = '';
    selectedTypes.forEach(type => {
      const data = existingData[type] || {};
      const section = document.createElement('div');
      section.className = 'price-section';
      section.dataset.type = type;
      section.style.marginBottom = '20px';
      section.style.padding = '15px';
      section.style.border = '1px solid #f0f0f0';
      section.style.borderRadius = '8px';
      section.style.background = '#fafafa';

      section.innerHTML = `
        <h4 style="margin-bottom: 12px; color: #16a34a; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-tag"></i> ${type} Pricing
        </h4>
        <div class="form-row">
          <div class="form-group">
            <label class="required">Price per Night (₹)</label>
            <input type="number" name="price_${type}" value="${data.price || ''}" required placeholder="Price for ${type}">
          </div>
          <div class="form-group">
            <label>Security Deposit (₹)</label>
            <input type="number" name="deposit_${type}" value="${data.deposit || ''}" placeholder="Deposit for ${type}">
          </div>
        </div>
      `;
      pricingContainer.appendChild(section);
    });
  }

  function renderDetailSections(selectedTypes) {
    if (!sectionsContainer) return;
    const existingData = {};
    sectionsContainer.querySelectorAll('.type-section').forEach(section => {
      const type = section.dataset.type;
      existingData[type] = {
        beds: section.querySelector(`[name="beds_${type}"]`)?.value,
        baths: section.querySelector(`[name="baths_${type}"]`)?.value,
        kitchen: section.querySelector(`[name="kitchen_${type}"]`)?.value,
        sqFt: section.querySelector(`[name="sqFt_${type}"]`)?.value,
        maxGuests: section.querySelector(`[name="maxGuests_${type}"]`)?.value
      };
    });

    sectionsContainer.innerHTML = '';
    selectedTypes.forEach(type => {
      const data = existingData[type] || {};
      const section = document.createElement('div');
      section.className = 'type-section';
      section.dataset.type = type;
      section.style.marginBottom = '25px';
      section.style.padding = '15px';
      section.style.border = '1px solid #f0f0f0';
      section.style.borderRadius = '8px';
      section.style.background = '#fafafa';

      section.innerHTML = `
        <h4 style="margin-bottom: 15px; color: #2563eb; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-door-open"></i> ${type} Details
        </h4>
        <div class="form-row">
          <div class="form-group">
            <label class="required">Bedrooms</label>
            <input type="number" name="beds_${type}" value="${data.beds || ''}" required placeholder="No. of Bedrooms">
          </div>
          <div class="form-group">
            <label class="required">Bathrooms</label>
            <input type="number" name="baths_${type}" value="${data.baths || ''}" required placeholder="No. of Bathrooms">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="required">Kitchen Type</label>
            <select name="kitchen_${type}" required>
              <option value="" disabled ${!data.kitchen ? 'selected' : ''}>Select Kitchen</option>
              <option value="Attached" ${data.kitchen === 'Attached' ? 'selected' : ''}>Attached</option>
              <option value="Common" ${data.kitchen === 'Common' ? 'selected' : ''}>Common</option>
            </select>
          </div>
          <div class="form-group">
            <label class="required">Area (sq ft)</label>
            <input type="text" name="sqFt_${type}" value="${data.sqFt || ''}" required placeholder="e.g. 500">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="required">Maximum Guests</label>
            <input type="number" name="maxGuests_${type}" value="${data.maxGuests || ''}" required placeholder="No. of Guests">
          </div>
        </div>
      `;
      sectionsContainer.appendChild(section);
    });
  }

  typeCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateSelectedTypes);
  });
});