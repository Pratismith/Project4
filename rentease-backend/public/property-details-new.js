function goBack() {
  window.history.back();
}

document.addEventListener("DOMContentLoaded", async () => {
  const selectedId = localStorage.getItem("selectedPropertyId");
  console.log("Selected ID:", selectedId);

  if (!selectedId) {
    document.querySelector(".top-row").innerHTML = `<p>No property selected.</p>`;
    return;
  }

  // Determine backend URL dynamically
  const API_BASE = window.location.origin;  // 🔗 replace with your Render backend URL

  try {
    // Fetch from backend
    const res = await fetch(`${API_BASE}/api/properties/${selectedId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch property");
    }

    const property = data.property; // backend returns { property: {...} }

    if (property) {
      console.log("Images:", property.images);
      // Image Gallery (Scrollable)
      const gallery = document.getElementById("image-gallery");
      gallery.innerHTML = "";
      (property.images || []).forEach(imgSrc => {
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = property.title;
        gallery.appendChild(img);
      });

      document.getElementById('scroll-left').addEventListener('click', () => {
        document.getElementById('image-gallery').scrollBy({ left: -300, behavior: 'smooth' });
      });
      document.getElementById('scroll-right').addEventListener('click', () => {
        document.getElementById('image-gallery').scrollBy({ left: 300, behavior: 'smooth' });
      });

      // Right Details Box
      document.getElementById("property-price").textContent = property.price || "";
      document.getElementById("property-deposit").textContent = property.deposit ? `${property.deposit} deposit` : "";
      document.getElementById("property-furnishing").textContent = property.furnishing || "";
      document.getElementById("property-availability").textContent = `Availability: ${property.availability || "N/A"}`;
      document.getElementById("call-btn").textContent = property.phone ? `📞 Call ${property.phone}` : "📞 Call Owner";
      document.getElementById("whatsapp-btn").textContent = "💬 WhatsApp Owner";

      // PG Name and Other Details Box
      const propertyTitleEl = document.getElementById("property-title");
      const propertyLocationEl = document.getElementById("property-location");
      const propertyDescriptionEl = document.getElementById("property-description");

      if (propertyTitleEl) propertyTitleEl.textContent = property.title || "N/A";
      if (propertyLocationEl) propertyLocationEl.textContent = property.location || "N/A";
      if (propertyDescriptionEl) propertyDescriptionEl.textContent = property.description || "";
      
      // Google Maps Location
      const locationItem = document.querySelector(".location-info");
      if (property.gmapLink && locationItem) {
        const gmapBtn = document.createElement("a");
        gmapBtn.href = property.gmapLink;
        gmapBtn.target = "_blank";
        gmapBtn.className = "status-badge available";
        gmapBtn.style.textDecoration = "none";
        gmapBtn.style.marginTop = "10px";
        gmapBtn.style.display = "inline-flex";
        gmapBtn.style.alignItems = "center";
        gmapBtn.style.gap = "5px";
        gmapBtn.innerHTML = `📍 View on Google Maps`;
        locationItem.appendChild(gmapBtn);
      }

      const bedroomsEl = document.getElementById("bedrooms");
      const bathroomsEl = document.getElementById("bathrooms");
      const areaEl = document.getElementById("area");
      const genderEl = document.getElementById("gender");

      if (bedroomsEl) bedroomsEl.textContent = property.beds || "-";
      if (bathroomsEl) bathroomsEl.textContent = property.baths || "-";
      if (areaEl) areaEl.textContent = property.sqFt || "-";
      if (genderEl) genderEl.textContent = property.gender || "Any";
      document.getElementById("property-description").textContent = property.description || "";

      // Amenities (if available)
      if (property.amenities && Array.isArray(property.amenities)) {
        const amenitiesContainer = document.querySelector(".amenities-grid");
        amenitiesContainer.innerHTML = property.amenities
          .map(a => `<div class="amenity-badge">${a}</div>`)
          .join("");
      }

      // Render Room Configurations (Homestays, PG, Rent House, Flat)
      const homestaySection = document.getElementById("homestay-details-section");
      const roomContainer = document.getElementById("room-configs-container");
      
      if (homestaySection && roomContainer) {
        let hasRooms = false;
        roomContainer.innerHTML = "";

        // 1. Homestay Types (1BHK, 2BHK, 3BHK)
        const homestayTypes = ["1BHK", "2BHK", "3BHK"];
        homestayTypes.forEach(type => {
          const bhkNum = type[0];
          const dbPrefix = `bhk${bhkNum}`;
          
          // Check both flattened fields and the details object (for compatibility)
          const price = property[`${dbPrefix}_price`] || (property.details && property.details[type] && property.details[type].price);
          
          // CRITICAL: Skip Homestay types if the property is a "Flat" to avoid duplication with RK types
          // Rent House can also have BHK types, so allow them for Rent House and Homestay
          if (price && property.type !== "Flat") {
            hasRooms = true;
            const card = document.createElement("div");
            card.className = "room-card";
            
            // Extract details from flattened fields or details object
            const beds = property[`${dbPrefix}_beds`] || (property.details && property.details[type] && property.details[type].beds) || 0;
            const baths = property[`${dbPrefix}_baths`] || (property.details && property.details[type] && property.details[type].baths) || 0;
            const kitchen = property[`${dbPrefix}_kitchen`] || (property.details && property.details[type] && property.details[type].kitchen) || "N/A";
            const area = property[`${dbPrefix}_area`] || (property.details && property.details[type] && property.details[type].sqFt) || 0;
            const guests = property[`${dbPrefix}_guests`] || (property.details && property.details[type] && property.details[type].maxGuests) || 0;
            const displayPrice = price.includes("₹") ? price : `₹${parseInt(price).toLocaleString('en-IN')}/day`;

            card.innerHTML = `
              <h4><i class="fas fa-home"></i> ${type} Details</h4>
              <div class="room-info-item"><span class="room-info-label">Bedrooms:</span><span>${beds}</span></div>
              <div class="room-info-item"><span class="room-info-label">Bathrooms:</span><span>${baths}</span></div>
              <div class="room-info-item"><span class="room-info-label">Kitchen:</span><span>${kitchen}</span></div>
              <div class="room-info-item"><span class="room-info-label">Area:</span><span>${area} sq ft</span></div>
              <div class="room-info-item"><span class="room-info-label">Max Guests:</span><span>${guests}</span></div>
              <div class="room-price">${displayPrice}</div>
            `;
            roomContainer.appendChild(card);
          }
        });

        // 2. PG Types (Single Bed, Double Bed, Triple Bed)
        const pgTypes = ["Single Bed", "Double Bed", "Triple Bed"];
        pgTypes.forEach(type => {
          const dbPrefix = type.split(" ")[0].toLowerCase(); // single, double, triple
          if (property[`${dbPrefix}_price`] && property.type === "PG") {
            hasRooms = true;
            const card = document.createElement("div");
            card.className = "room-card";
            card.innerHTML = `
              <h4><i class="fas fa-bed"></i> ${type}</h4>
              <div class="room-info-item"><span class="room-info-label">Beds:</span><span>${property[`${dbPrefix}_beds`] || 0}</span></div>
              <div class="room-info-item"><span class="room-info-label">Bath:</span><span>${property[`${dbPrefix}_bathType`] || "N/A"}</span></div>
              <div class="room-info-item"><span class="room-info-label">Deposit:</span><span>${property[`${dbPrefix}_deposit`] || "N/A"}</span></div>
              <div class="room-price">${property[`${dbPrefix}_price`]}</div>
            `;
            roomContainer.appendChild(card);
          }
        });

        // 3. Rent House Types (Single Room, Double Room, Triple Room, 1BHK, 2BHK, 3BHK)
        const rentHouseTypes = ["Single Room", "Double Room", "Triple Room", "1BHK", "2BHK", "3BHK", "1BedroomKitchen", "2BedroomKitchen", "3BedroomKitchen"];
        rentHouseTypes.forEach(type => {
          // Check both bhk1_price and price_1BHK (which comes from req.body mapping)
          let dbPrefix = type.includes("BHK") ? `bhk${type[0]}` : type.split(" ")[0].toLowerCase();
          if (type.includes("BedroomKitchen")) {
            dbPrefix = `bhk${type[0]}`;
          }
          
          // Try to find price in multiple possible locations
          const price = property[`${dbPrefix}_price`] || 
                        property[`price_${type}`] || 
                        (property.details && property.details[type] && property.details[type].price);
          
          if (price && property.type === "Rent House") {
            hasRooms = true;
            const card = document.createElement("div");
            card.className = "room-card";
            
            const beds = property[`${dbPrefix}_beds`] || property[`beds_${type}`] || (property.details && property.details[type] && property.details[type].beds) || 0;
            const depositValue = property[`${dbPrefix}_deposit`] || property[`deposit_${type}`] || (property.details && property.details[type] && property.details[type].deposit) || "N/A";
            const bathType = property[`${dbPrefix}_bathType`] || property[`bathType_${type}`] || (property.details && property.details[type] && property.details[type].bathType) || property[`${dbPrefix}_baths`] || "N/A";
            const kitchenType = property[`${dbPrefix}_kitchenType`] || property[`kitchenType_${type}`] || property[`${dbPrefix}_kitchen`] || (property.details && property.details[type] && property.details[type].kitchen) || "N/A";

            const displayType = type.replace("BedroomKitchen", " BHK");

            card.innerHTML = `
              <h4><i class="fas fa-door-open"></i> ${displayType}</h4>
              <div class="room-info-item"><span class="room-info-label">${type.includes("BHK") || type.includes("BedroomKitchen") ? "Bedrooms" : "Rooms"}:</span><span>${beds}</span></div>
              <div class="room-info-item"><span class="room-info-label">Kitchen:</span><span>${kitchenType}</span></div>
              <div class="room-info-item"><span class="room-info-label">Bath:</span><span>${bathType}</span></div>
              <div class="room-info-item"><span class="room-info-label">Deposit:</span><span>${depositValue}</span></div>
              <div class="room-price">${price}</div>
            `;
            roomContainer.appendChild(card);
          }
        });

        // 4. Flat Types (1RK, 2RK, 3RK)
        const flatTypes = ["1RK", "2RK", "3RK"];
        flatTypes.forEach(type => {
          const dbPrefix = `flat_${type.toLowerCase()}`;
          if (property[`${dbPrefix}_price`] && property.type === "Flat") {
            hasRooms = true;
            const card = document.createElement("div");
            card.className = "room-card";
            card.innerHTML = `
              <h4><i class="fas fa-building"></i> ${type} Flat</h4>
              <div class="room-info-item"><span class="room-info-label">Bedrooms:</span><span>${property[`${dbPrefix}_beds`] || 0}</span></div>
              <div class="room-info-item"><span class="room-info-label">Bathrooms:</span><span>${property[`${dbPrefix}_baths`] || 0}</span></div>
              <div class="room-info-item"><span class="room-info-label">Kitchens:</span><span>${property[`${dbPrefix}_kitchens`] || 0}</span></div>
              <div class="room-info-item"><span class="room-info-label">Deposit:</span><span>${property[`${dbPrefix}_deposit`] || "N/A"}</span></div>
              <div class="room-price">${property[`${dbPrefix}_price`]}</div>
            `;
            roomContainer.appendChild(card);
          }
        });

        if (hasRooms) {
          homestaySection.style.display = "block";
        }
      }

      // Button Events
      document.getElementById("call-btn").addEventListener("click", () => {
        if (property.phone) {
          window.location.href = `tel:${property.phone}`;
        }
      });

      document.getElementById("whatsapp-btn").addEventListener("click", () => {
        if (property.whatsapp) {
          window.location.href = `https://wa.me/${property.whatsapp}`;
        }
      });
    }
  } catch (err) {
    console.error("Error loading property details:", err);
    document.querySelector(".top-row").innerHTML = `<p>Error loading property details.</p>`;
  }
});