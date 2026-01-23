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

      // Render Homestay Details
      const homestaySection = document.getElementById("homestay-details-section");
      const roomContainer = document.getElementById("room-configs-container");
      
      if (homestaySection && roomContainer) {
        let hasRooms = false;
        roomContainer.innerHTML = "";

        // Check for 1BHK, 2BHK, 3BHK
        const types = ["1BHK", "2BHK", "3BHK"];
        types.forEach(type => {
          const prefix = type.toLowerCase().replace("bhk", "bhk"); // bhk1, bhk2, bhk3
          const bhkNum = type[0]; // 1, 2, 3
          const dbPrefix = `bhk${bhkNum}`;
          
          if (property[`${dbPrefix}_price`]) {
            hasRooms = true;
            const card = document.createElement("div");
            card.className = "room-card";
            card.innerHTML = `
              <h4><i class="fas fa-home"></i> ${type} Details</h4>
              <div class="room-info-item">
                <span class="room-info-label">Bedrooms:</span>
                <span>${property[`${dbPrefix}_beds`] || 0}</span>
              </div>
              <div class="room-info-item">
                <span class="room-info-label">Bathrooms:</span>
                <span>${property[`${dbPrefix}_baths`] || 0}</span>
              </div>
              <div class="room-info-item">
                <span class="room-info-label">Kitchen:</span>
                <span>${property[`${dbPrefix}_kitchen`] || "N/A"}</span>
              </div>
              <div class="room-info-item">
                <span class="room-info-label">Area:</span>
                <span>${property[`${dbPrefix}_area`] || 0} sq ft</span>
              </div>
              <div class="room-info-item">
                <span class="room-info-label">Max Guests:</span>
                <span>${property[`${dbPrefix}_guests`] || 0}</span>
              </div>
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