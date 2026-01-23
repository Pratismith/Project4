// rentease-backend/routes/property.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Property from "../models/Property.js";
import upload from "../middleware/upload.js";
import { v2 as cloudinary } from "cloudinary";

import { uploadToCloudinaryArray } from "../middleware/upload.js";

const router = express.Router();

// Get all properties
router.get("/", async (req, res) => {
  try {
    const properties = await Property.find();
    res.json({ properties });
  } catch (err) {
    console.error("❌ Error in GET /:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get user's properties (protected)
router.get("/my-properties", authMiddleware, async (req, res) => {
  try {
    console.log("🔑 Authenticated user:", req.user);
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    const properties = await Property.find({ userId: req.user.id });
    res.json({ properties });
  } catch (err) {
    console.error("❌ Error loading my-properties:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add new property
router.post("/add-property", authMiddleware, uploadToCloudinaryArray("images"), async (req, res) => {
  console.log("DEBUG [Route Entry]: Request arrived at add-property");
  try {
    const {
      title, type, location, price, deposit, description,
      beds, baths, sqFt, gender, furnishing, phone, amenities,
      availability, maxGuests, whatsapp, gmapLink, details
    } = req.body;

    console.log("DEBUG [Body Parsing Full]:", { 
      title: title || "MISSING", 
      type: type || "MISSING", 
      location: location || "MISSING", 
      price: price || "MISSING",
      hasDetails: !!details 
    });

    // If details exist but top-level price is missing, use the first price from details
    let finalPrice = price;
    if ((!finalPrice || finalPrice === "") && details) {
      try {
        const parsed = typeof details === 'string' ? JSON.parse(details) : details;
        console.log("DEBUG [Price Extraction]: Parsed details keys:", Object.keys(parsed));
        for (const type in parsed) {
          if (parsed[type].price) {
            finalPrice = parsed[type].price;
            console.log(`DEBUG [Price Extraction]: Found price ${finalPrice} in type ${type}`);
            break;
          }
        }
      } catch (e) {
        console.error("Error extracting price from details:", e.message);
      }
    }

    if (!title || !finalPrice || finalPrice === "" || !location) {
      console.log("DEBUG [Validation Fail]: Missing required fields", { title, finalPrice, location });
      return res.status(400).json({ message: "Missing required fields: Title, Price, and Location are mandatory." });
    }

    const priceNumber = finalPrice.toString().replace(/\D/g, '');
    let formattedPrice = "";
    
    // If it's a homestay submission (checked via maxGuests or room types)
    if (maxGuests || (type && type.toLowerCase().includes("bhk"))) {
      formattedPrice = `₹${parseInt(priceNumber || 0).toLocaleString('en-IN')}/day`;
    } else {
      formattedPrice = `₹${parseInt(priceNumber || 0).toLocaleString('en-IN')}/month`;
    }

    const imageUrls = (req.files || []).map(f => f.path).filter(p => p);
    console.log("DEBUG [Images to Save]:", imageUrls);

    let amenitiesArray = [];
    if (amenities) {
      amenitiesArray = Array.isArray(amenities) ? amenities : amenities.split(",").map(a => a.trim());
    }

    let parsedDetails = {};
    if (details) {
      try {
        parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
      } catch (e) {
        console.error("Failed to parse nested details:", e.message);
      }
    }

    const property = new Property({
      title,
      type,
      location,
      price: formattedPrice,
      deposit: deposit ? `₹${parseInt(deposit.toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}` : "",
      description,
      beds: parseInt(beds) || 0,
      baths: parseInt(baths) || 0,
      sqFt: sqFt || "0",
      gender: gender || "Any",
      furnishing: furnishing || "Unfurnished",
      phone,
      whatsapp: whatsapp || phone,
      gmapLink,
      amenities: amenitiesArray,
      images: imageUrls,
      userId: req.user.id,
      availability: req.body.availabilityStatus || "Available Now",
      availableFrom: req.body.availableFrom || null,
      availableTo: req.body.availableTo || null,
      verified: false,
      details: parsedDetails,

      // Mapping Flattened Homestay Fields
      bhk1_price: parsedDetails["1BHK"]?.price ? `₹${parseInt(parsedDetails["1BHK"].price.toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}/day` : "",
      bhk1_beds: parseInt(parsedDetails["1BHK"]?.beds) || 0,
      bhk1_baths: parseInt(parsedDetails["1BHK"]?.baths) || 0,
      bhk1_kitchen: parsedDetails["1BHK"]?.kitchen || "",
      bhk1_area: parsedDetails["1BHK"]?.sqFt || "",
      bhk1_guests: parseInt(parsedDetails["1BHK"]?.maxGuests) || 0,

      bhk2_price: parsedDetails["2BHK"]?.price ? `₹${parseInt(parsedDetails["2BHK"].price.toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}/day` : "",
      bhk2_beds: parseInt(parsedDetails["2BHK"]?.beds) || 0,
      bhk2_baths: parseInt(parsedDetails["2BHK"]?.baths) || 0,
      bhk2_kitchen: parsedDetails["2BHK"]?.kitchen || "",
      bhk2_area: parsedDetails["2BHK"]?.sqFt || "",
      bhk2_guests: parseInt(parsedDetails["2BHK"]?.maxGuests) || 0,

      bhk3_price: parsedDetails["3BHK"]?.price ? `₹${parseInt(parsedDetails["3BHK"].price.toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}/day` : "",
      bhk3_beds: parseInt(parsedDetails["3BHK"]?.beds) || 0,
      bhk3_baths: parseInt(parsedDetails["3BHK"]?.baths) || 0,
      bhk3_kitchen: parsedDetails["3BHK"]?.kitchen || "",
      bhk3_area: parsedDetails["3BHK"]?.sqFt || "",
      bhk3_guests: parseInt(parsedDetails["3BHK"]?.maxGuests) || 0
    });

    console.log("DEBUG [DB Save Start]: Saving to MongoDB...");
    await property.save();
    console.log("DEBUG [DB Save Success]: Property created with ID:", property._id);
    res.status(201).json({ message: "Property added successfully", property });
  } catch (err) {
    console.error("DEBUG [Final Catch Route]:", err);
    res.status(500).json({ message: "Server error occurred while saving property.", error: err.message });
  }
});

// Get property by ID
router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.json({ property });
  } catch (err) {
    console.error("❌ Error in GET /:id:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update property
router.put("/:id", authMiddleware, uploadToCloudinaryArray("images"), async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findOne({ _id: id, userId: req.user.id });
    if (!property) return res.status(404).json({ message: "Property not found or not owned by user" });

    const {
      title, type, location, price, deposit, description,
      beds, baths, sqFt, gender, furnishing, phone, whatsapp, maxGuests
    } = req.body;

    const priceNumber = price.toString().replace(/\D/g, '');
    let formattedPrice = "";
    
    // If it's a homestay submission (checked via maxGuests or room types)
    if (maxGuests || type.toLowerCase().includes("bhk")) {
      formattedPrice = `₹${parseInt(priceNumber || 0).toLocaleString('en-IN')}/day`;
    } else {
      formattedPrice = `₹${parseInt(priceNumber || 0).toLocaleString('en-IN')}/month`;
    }

    const updateData = {
      title, type, location,
      price: formattedPrice,
      deposit: deposit ? `₹${parseInt(deposit.toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}` : "",
      description,
      beds: parseInt(beds) || 0,
      baths: parseInt(baths) || 0,
      sqFt: sqFt || "0",
      gender: gender || "Any",
      furnishing: furnishing || "Unfurnished",
      phone,
      whatsapp: whatsapp || phone,
      maxGuests: parseInt(maxGuests) || 0,
      verified: true
    };

    if (req.body.amenities) {
      updateData.amenities = Array.isArray(req.body.amenities) ? req.body.amenities : req.body.amenities.split(",").map(a => a.trim());
    }

    let finalImages = [];
    if (req.body.existingImages) {
      try {
        finalImages = JSON.parse(req.body.existingImages);
      } catch (e) {
        console.error("Failed to parse existingImages:", e.message);
      }
    }

    if (req.files?.length) {
      finalImages = [...finalImages, ...req.files.map(file => file.path)];
    }

    updateData.images = finalImages.filter(img => img);

    const updated = await Property.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      updateData,
      { new: true }
    );

    res.json({ message: "Property updated successfully", property: updated });
  } catch (err) {
    console.error("Update Property Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete property
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!property) return res.status(404).json({ message: "Property not found or not owned by user" });

    for (const url of property.images) {
      try {
        const publicId = url.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("Cloudinary delete error:", err.message);
      }
    }

    res.json({ message: "Property deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Property Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Temporary route to clean existing prices
router.get("/clean-prices", async (req, res) => {
  try {
    const properties = await Property.find();
    let updatedCount = 0;
    
    for (let property of properties) {
      const oldPrice = property.price;
      // Extract only numbers
      const priceNumber = property.price.toString().replace(/\D/g, '');
      
      let formattedPrice = '';
      if (property.type === "Homestay" || property.type === "1BHK" || property.type === "2BHK" || property.type === "3BHK" || property.type === "Bungalow") {
        formattedPrice = `₹${parseInt(priceNumber).toLocaleString('en-IN')}/day`;
      } else {
        formattedPrice = `₹${parseInt(priceNumber).toLocaleString('en-IN')}/month`;
      }
      
      if (oldPrice !== formattedPrice) {
        property.price = formattedPrice;
        await property.save();
        updatedCount++;
        console.log(`🔄 Updated: ${oldPrice} → ${formattedPrice}`);
      }
    }
    
    res.json({ message: `Cleaned ${updatedCount} properties` });
  } catch (err) {
    console.error("Error cleaning prices:", err);
    res.status(500).json({ message: "Error cleaning prices" });
  }
});

export default router;