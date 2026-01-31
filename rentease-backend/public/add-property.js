document.addEventListener("DOMContentLoaded", () => {
  const pgTypeSection = document.getElementById("pg-type-section");
  const rentHouseTypeSection = document.getElementById("rent-house-type-section");
  const propertyType = document.getElementById("propertyType");
  const form = document.getElementById("propertyForm");
  const pgPricingDetails = document.getElementById("pg-pricing-details");
  const pgMultiToggle = document.getElementById("pg-multi-toggle");
  const pgMultiDropdown = document.getElementById("pg-multi-dropdown");
  const pgMultiLabel = document.getElementById("pg-multi-label");
  const pgOptionCheckboxes = document.querySelectorAll(".pg-option-checkbox");

  const rentHousePricingDetails = document.getElementById("rent-house-pricing-details");
  const rentHouseMultiToggle = document.getElementById("rent-house-multi-toggle");
  const rentHouseMultiDropdown = document.getElementById("rent-house-multi-dropdown");
  const rentHouseMultiLabel = document.getElementById("rent-house-multi-label");
  const rentHouseOptionCheckboxes = document.querySelectorAll(".rent-house-option-checkbox");

  const flatTypeSection = document.getElementById("flat-type-section");
  const flatPricingDetails = document.getElementById("flat-pricing-details");
  const flatMultiToggle = document.getElementById("flat-multi-toggle");
  const flatMultiDropdown = document.getElementById("flat-multi-dropdown");
  const flatMultiLabel = document.getElementById("flat-multi-label");
  const flatOptionCheckboxes = document.querySelectorAll(".flat-option-checkbox");

  // Toggle custom multi-select dropdown for PG
  if (pgMultiToggle) {
    pgMultiToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      pgMultiDropdown.classList.toggle("hidden");
      if (rentHouseMultiDropdown) rentHouseMultiDropdown.classList.add("hidden");
      if (flatMultiDropdown) flatMultiDropdown.classList.add("hidden");
    });
  }

  // Toggle custom multi-select dropdown for Rent House
  if (rentHouseMultiToggle) {
    rentHouseMultiToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      rentHouseMultiDropdown.classList.toggle("hidden");
      if (pgMultiDropdown) pgMultiDropdown.classList.add("hidden");
      if (flatMultiDropdown) flatMultiDropdown.classList.add("hidden");
    });
  }

  // Toggle custom multi-select dropdown for Flat
  if (flatMultiToggle) {
    flatMultiToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      flatMultiDropdown.classList.toggle("hidden");
      if (pgMultiDropdown) pgMultiDropdown.classList.add("hidden");
      if (rentHouseMultiDropdown) rentHouseMultiDropdown.classList.add("hidden");
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (pgMultiDropdown && !pgMultiDropdown.contains(e.target) && !pgMultiToggle.contains(e.target)) {
      pgMultiDropdown.classList.add("hidden");
    }
    if (rentHouseMultiDropdown && !rentHouseMultiDropdown.contains(e.target) && !rentHouseMultiToggle.contains(e.target)) {
      rentHouseMultiDropdown.classList.add("hidden");
    }
    if (flatMultiDropdown && !flatMultiDropdown.contains(e.target) && !flatMultiToggle.contains(e.target)) {
      flatMultiDropdown.classList.add("hidden");
    }
  });

  // Update PG label and pricing sections
  pgOptionCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const selected = Array.from(pgOptionCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
      
      if (selected.length > 0) {
        pgMultiLabel.textContent = selected.join(", ");
        pgMultiLabel.classList.remove("text-gray-500");
        pgMultiLabel.classList.add("text-gray-900");
      } else {
        pgMultiLabel.textContent = "Select Bed Types";
        pgMultiLabel.classList.remove("text-gray-900");
        pgMultiLabel.classList.add("text-gray-500");
      }
      
      updatePgPricingSections(selected);
    });
  });

  // Update Rent House label and pricing sections
  rentHouseOptionCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const selected = Array.from(rentHouseOptionCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
      
      if (selected.length > 0) {
        rentHouseMultiLabel.textContent = selected.join(", ");
        rentHouseMultiLabel.classList.remove("text-gray-500");
        rentHouseMultiLabel.classList.add("text-gray-900");
      } else {
        rentHouseMultiLabel.textContent = "Select Room Types";
        rentHouseMultiLabel.classList.remove("text-gray-900");
        rentHouseMultiLabel.classList.add("text-gray-500");
      }
      
      updateRentHousePricingSections(selected);
    });
  });

  // Update Flat label and pricing sections
  flatOptionCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const selected = Array.from(flatOptionCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
      
      if (selected.length > 0) {
        flatMultiLabel.textContent = selected.join(", ");
        flatMultiLabel.classList.remove("text-gray-500");
        flatMultiLabel.classList.add("text-gray-900");
      } else {
        flatMultiLabel.textContent = "Select Flat Types";
        flatMultiLabel.classList.remove("text-gray-900");
        flatMultiLabel.classList.add("text-gray-500");
      }
      
      updateFlatPricingSections(selected);
    });
  });

  function updatePgPricingSections(selectedOptions) {
    pgPricingDetails.innerHTML = "";
    selectedOptions.forEach(type => {
      const section = document.createElement("div");
      section.className = "p-6 bg-blue-50 rounded-xl border border-blue-100 space-y-4";
      section.innerHTML = `
        <h3 class="text-xl font-bold text-blue-700 border-b border-blue-200 pb-2">${type}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Monthly Rent per Bed (₹) *</label>
            <input type="number" name="price_${type}" placeholder="e.g. 8000" class="input" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Security Deposit (₹)</label>
            <input type="number" name="deposit_${type}" placeholder="e.g. 15000" class="input">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">No of Bed</label>
            <input type="number" name="beds_${type}" placeholder="e.g. 10" class="input">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
            <select name="bathType_${type}" class="input">
              <option value="Attached">Attached</option>
              <option value="Common">Common</option>
            </select>
          </div>
        </div>
      `;
      pgPricingDetails.appendChild(section);
    });
  }

  function updateRentHousePricingSections(selectedOptions) {
    rentHousePricingDetails.innerHTML = "";
    selectedOptions.forEach(type => {
      const section = document.createElement("div");
      section.className = "p-6 bg-green-50 rounded-xl border border-green-100 space-y-4";
      section.innerHTML = `
        <h3 class="text-xl font-bold text-green-700 border-b border-green-200 pb-2">${type}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Monthly Rent of ${type} (₹) *</label>
            <input type="number" name="price_${type}" placeholder="e.g. 10000" class="input" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Security Deposit (₹)</label>
            <input type="number" name="deposit_${type}" placeholder="e.g. 20000" class="input">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">No of Bedroom</label>
            <input type="number" name="beds_${type}" placeholder="e.g. 1" class="input">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
            <select name="bathType_${type}" class="input">
              <option value="Attached">Attached</option>
              <option value="Common">Common</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Kitchen</label>
            <select name="kitchenType_${type}" class="input">
              <option value="Attached">Attached</option>
              <option value="Common">Common</option>
            </select>
          </div>
        </div>
      `;
      rentHousePricingDetails.appendChild(section);
    });
  }

  function updateFlatPricingSections(selectedOptions) {
    flatPricingDetails.innerHTML = "";
    selectedOptions.forEach(type => {
      const section = document.createElement("div");
      section.className = "p-6 bg-purple-50 rounded-xl border border-purple-100 space-y-4";
      section.innerHTML = `
        <h3 class="text-xl font-bold text-purple-700 border-b border-purple-200 pb-2">${type}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Monthly Rent of ${type} (₹) *</label>
            <input type="number" name="price_${type}" placeholder="e.g. 15000" class="input" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Security Deposit (₹)</label>
            <input type="number" name="deposit_${type}" placeholder="e.g. 30000" class="input">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">No of Bedroom</label>
            <input type="number" name="beds_${type}" placeholder="e.g. 2" class="input">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">No of Bathrooms</label>
            <input type="number" name="baths_${type}" placeholder="e.g. 1" class="input">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">No of Kitchen</label>
            <input type="number" name="kitchens_${type}" placeholder="e.g. 1" class="input">
          </div>
        </div>
      `;
      flatPricingDetails.appendChild(section);
    });
  }

  const standardPricingDetails = document.getElementById("standard-pricing-details");
  const pgBathroomsSection = document.getElementById("pg-bathrooms-section");
  const rentHouseKitchenSection = document.getElementById("rent-house-kitchen-section");
  const furnishingSection = document.getElementById("furnishing-status-section");
  const standardDeposit = document.getElementById("standard-deposit-section");
  const standardArea = document.getElementById("standard-area-section");
  const standardBeds = document.getElementById("standard-beds-section");
  const standardBaths = document.getElementById("standard-baths-section");

  // Toggle sections based on property type
  propertyType.addEventListener("change", () => {
    const type = propertyType.value;
    
    // Default: Hide all specific sections
    pgTypeSection.classList.add("hidden");
    rentHouseTypeSection.classList.add("hidden");
    flatTypeSection.classList.add("hidden");
    pgPricingDetails.classList.add("hidden");
    rentHousePricingDetails.classList.add("hidden");
    flatPricingDetails.classList.add("hidden");
    pgBathroomsSection.classList.add("hidden");
    rentHouseKitchenSection.classList.add("hidden");
    furnishingSection.classList.remove("hidden");
    
    // Reset redundancy toggle
    [standardDeposit, standardArea, standardBeds, standardBaths].forEach(el => {
      if (el) el.classList.remove("hidden");
    });

    if (type === "PG") {
      pgTypeSection.classList.remove("hidden");
      pgPricingDetails.classList.remove("hidden");
      pgBathroomsSection.classList.remove("hidden");
      furnishingSection.classList.add("hidden");
      // Hide redundant fields for PG
      [standardDeposit, standardArea, standardBeds, standardBaths].forEach(el => {
        if (el) el.classList.add("hidden");
      });
    } else if (type === "Rent House") {
      rentHouseTypeSection.classList.remove("hidden");
      rentHousePricingDetails.classList.remove("hidden");
      rentHouseKitchenSection.classList.remove("hidden");
      // Requirement 3: keep furnishing status if selected Rent House (already handled by default remove hidden)
      // Requirement 2: hide redundant fields for Rent House since they are inside the boxes
      [standardDeposit, standardArea, standardBeds, standardBaths].forEach(el => {
        if (el) el.classList.add("hidden");
      });
    } else if (type === "Flat") {
      flatTypeSection.classList.remove("hidden");
      flatPricingDetails.classList.remove("hidden");
      // Keep furnishing status for Flat (handled by default remove hidden)
      // Hide redundant fields for Flat
      [standardDeposit, standardArea, standardBeds, standardBaths].forEach(el => {
        if (el) el.classList.add("hidden");
      });
    }
  });

  // Re-run the toggle logic immediately in case type is already selected (e.g. after validation error)
  if (propertyType.value) {
    propertyType.dispatchEvent(new Event('change'));
  }

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
    
    // Capture selected PG types
    const pgTypes = Array.from(pgOptionCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    if (pgTypes.length > 0) {
      formData.append("pgTypes", pgTypes.join(", "));
    }

    // Capture selected Rent House types
    const rentHouseTypes = Array.from(rentHouseOptionCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    if (rentHouseTypes.length > 0) {
      formData.append("rentHouseTypes", rentHouseTypes.join(", "));
    }

    // Capture selected Flat types
    const flatTypes = Array.from(flatOptionCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    if (flatTypes.length > 0) {
      formData.append("flatTypes", flatTypes.join(", "));
    }

    inputs.forEach(input => {
      // Skip the dynamic checkboxes as they are handled above
      if (input.classList.contains('pg-option-checkbox') || 
          input.classList.contains('rent-house-option-checkbox') || 
          input.classList.contains('flat-option-checkbox')) {
        return;
      }

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