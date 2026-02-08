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

      // Add PG specific fields
      pgTypes: req.body.pgTypes,
      totalBathrooms: parseInt(req.body.totalBathrooms) || 0,
      
      // Add Rent House specific fields
      rentHouseTypes: req.body.rentHouseTypes,
      commonKitchens: parseInt(req.body.commonKitchens) || 0,
      
      // Add Flat specific fields
      flatTypes: req.body.flatTypes,

      // Single Bed / Room fields
      single_price: req.body["price_Single Bed"] || req.body["price_Single Room"] ? `₹${parseInt((req.body["price_Single Bed"] || req.body["price_Single Room"]).toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}${type === 'PG' ? '/bed' : ''}` : "",
      single_deposit: req.body["deposit_Single Bed"] || req.body["deposit_Single Room"] ? `₹${parseInt((req.body["deposit_Single Bed"] || req.body["deposit_Single Room"]).toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}` : "",
      single_beds: parseInt(req.body["beds_Single Bed"] || req.body["beds_Single Room"]) || 0,
      single_bathType: req.body["bathType_Single Bed"] || req.body["bathType_Single Room"],
      single_kitchenType: req.body["kitchenType_Single Room"],

      // Double Bed / Room fields
      double_price: req.body["price_Double Bed"] || req.body["price_Double Room"] ? `₹${parseInt((req.body["price_Double Bed"] || req.body["price_Double Room"]).toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}${type === 'PG' ? '/bed' : ''}` : "",
      double_deposit: req.body["deposit_Double Bed"] || req.body["deposit_Double Room"] ? `₹${parseInt((req.body["deposit_Double Bed"] || req.body["deposit_Double Room"]).toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}` : "",
      double_beds: parseInt(req.body["beds_Double Bed"] || req.body["beds_Double Room"]) || 0,
      double_bathType: req.body["bathType_Double Bed"] || req.body["bathType_Double Room"],
      double_kitchenType: req.body["kitchenType_Double Room"],

      // Triple Bed / Room fields
      triple_price: req.body["price_Triple Bed"] || req.body["price_Triple Room"] ? `₹${parseInt((req.body["price_Triple Bed"] || req.body["price_Triple Room"]).toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}${type === 'PG' ? '/bed' : ''}` : "",
      triple_deposit: req.body["deposit_Triple Bed"] || req.body["deposit_Triple Room"] ? `₹${parseInt((req.body["deposit_Triple Bed"] || req.body["deposit_Triple Room"]).toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}` : "",
      triple_beds: parseInt(req.body["beds_Triple Bed"] || req.body["beds_Triple Room"]) || 0,
      triple_bathType: req.body["bathType_Triple Bed"] || req.body["bathType_Triple Room"],
      triple_kitchenType: req.body["kitchenType_Triple Room"],

      // Mapping Flattened Homestay/RentHouse Fields
      bhk1_price: (parsedDetails["1BHK"] || parsedDetails["1BedroomKitchen"] || req.body["price_1BHK"] || req.body["price_1BedroomKitchen"]) ? `₹${parseInt((parsedDetails["1BHK"]?.price || parsedDetails["1BedroomKitchen"]?.price || req.body["price_1BHK"] || req.body["price_1BedroomKitchen"]).toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}${type === 'Homestay' ? '/day' : '/month'}` : "",
      bhk1_beds: parseInt(parsedDetails["1BHK"]?.beds || parsedDetails["1BedroomKitchen"]?.beds || req.body["beds_1BHK"] || req.body["beds_1BedroomKitchen"]) || 0,
      bhk1_baths: parseInt(parsedDetails["1BHK"]?.baths || parsedDetails["1BedroomKitchen"]?.baths || req.body["baths_1BHK"] || req.body["baths_1BedroomKitchen"]) || 0,
      bhk1_kitchen: parsedDetails["1BHK"]?.kitchen || parsedDetails["1BedroomKitchen"]?.kitchen || req.body["kitchenType_1BHK"] || req.body["kitchenType_1BedroomKitchen"] || req.body["kitchens_1BHK"] || req.body["kitchens_1BedroomKitchen"] || "",
      bhk1_area: parsedDetails["1BHK"]?.sqFt || parsedDetails["1BedroomKitchen"]?.sqFt || "",
      bhk1_guests: parseInt(parsedDetails["1BHK"]?.maxGuests || parsedDetails["1BedroomKitchen"]?.maxGuests) || 0,
      bhk1_deposit: (req.body["deposit_1BHK"] || req.body["deposit_1BedroomKitchen"]) ? `₹${parseInt((req.body["deposit_1BHK"] || req.body["deposit_1BedroomKitchen"]).toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}` : "",
      bhk1_bathType: req.body["bathType_1BHK"] || req.body["bathType_1BedroomKitchen"] || "",

      bhk2_price: (parsedDetails["2BHK"] || parsedDetails["2BedroomKitchen"] || req.body["price_2BHK"] || req.body["price_2BedroomKitchen"]) ? `₹${parseInt((parsedDetails["2BHK"]?.price || parsedDetails["2BedroomKitchen"]?.price || req.body["price_2BHK"] || req.body["price_2BedroomKitchen"]).toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}${type === 'Homestay' ? '/day' : '/month'}` : "",
      bhk2_beds: parseInt(parsedDetails["2BHK"]?.beds || parsedDetails["2BedroomKitchen"]?.beds || req.body["beds_2BHK"] || req.body["beds_2BedroomKitchen"]) || 0,
      bhk2_baths: parseInt(parsedDetails["2BHK"]?.baths || parsedDetails["2BedroomKitchen"]?.baths || req.body["baths_2BHK"] || req.body["baths_2BedroomKitchen"]) || 0,
      bhk2_kitchen: parsedDetails["2BHK"]?.kitchen || parsedDetails["2BedroomKitchen"]?.kitchen || req.body["kitchenType_2BHK"] || req.body["kitchenType_2BedroomKitchen"] || req.body["kitchens_2BHK"] || req.body["kitchens_2BedroomKitchen"] || "",
      bhk2_area: parsedDetails["2BHK"]?.sqFt || parsedDetails["2BedroomKitchen"]?.sqFt || "",
      bhk2_guests: parseInt(parsedDetails["2BHK"]?.maxGuests || parsedDetails["2BedroomKitchen"]?.maxGuests) || 0,
      bhk2_deposit: (req.body["deposit_2BHK"] || req.body["deposit_2BedroomKitchen"]) ? `₹${parseInt((req.body["deposit_2BHK"] || req.body["deposit_2BedroomKitchen"]).toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}` : "",
      bhk2_bathType: req.body["bathType_2BHK"] || req.body["bathType_2BedroomKitchen"] || "",

      bhk3_price: (parsedDetails["3BHK"] || parsedDetails["3BedroomKitchen"] || req.body["price_3BHK"] || req.body["price_3BedroomKitchen"]) ? `₹${parseInt((parsedDetails["3BHK"]?.price || parsedDetails["3BedroomKitchen"]?.price || req.body["price_3BHK"] || req.body["price_3BedroomKitchen"]).toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}${type === 'Homestay' ? '/day' : '/month'}` : "",
      bhk3_beds: parseInt(parsedDetails["3BHK"]?.beds || parsedDetails["3BedroomKitchen"]?.beds || req.body["beds_3BHK"] || req.body["beds_3BedroomKitchen"]) || 0,
      bhk3_baths: parseInt(parsedDetails["3BHK"]?.baths || parsedDetails["3BedroomKitchen"]?.baths || req.body["baths_3BHK"] || req.body["baths_3BedroomKitchen"]) || 0,
      bhk3_kitchen: parsedDetails["3BHK"]?.kitchen || parsedDetails["3BedroomKitchen"]?.kitchen || req.body["kitchenType_3BHK"] || req.body["kitchenType_3BedroomKitchen"] || req.body["kitchens_3BHK"] || req.body["kitchens_3BedroomKitchen"] || "",
      bhk3_area: parsedDetails["3BHK"]?.sqFt || parsedDetails["3BedroomKitchen"]?.sqFt || "",
      bhk3_guests: parseInt(parsedDetails["3BHK"]?.maxGuests || parsedDetails["3BedroomKitchen"]?.maxGuests) || 0,
      bhk3_deposit: (req.body["deposit_3BHK"] || req.body["deposit_3BedroomKitchen"]) ? `₹${parseInt((req.body["deposit_3BHK"] || req.body["deposit_3BedroomKitchen"]).toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}` : "",
      bhk3_bathType: req.body["bathType_3BHK"] || req.body["bathType_3BedroomKitchen"] || "",

      // Flat specific rooms (from req.body instead of details for new flow)
      flat_1rk_price: req.body["price_1RK"] ? `₹${parseInt(req.body["price_1RK"].toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}/month` : "",
      flat_1rk_deposit: req.body["deposit_1RK"] ? `₹${parseInt(req.body["deposit_1RK"].toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}` : "",
      flat_1rk_beds: parseInt(req.body["beds_1RK"]) || 0,
      flat_1rk_baths: parseInt(req.body["baths_1RK"]) || 0,
      flat_1rk_kitchens: parseInt(req.body["kitchens_1RK"]) || 0,

      flat_2rk_price: req.body["price_2RK"] ? `₹${parseInt(req.body["price_2RK"].toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}/month` : "",
      flat_2rk_deposit: req.body["deposit_2RK"] ? `₹${parseInt(req.body["deposit_2RK"].toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}` : "",
      flat_2rk_beds: parseInt(req.body["beds_2RK"]) || 0,
      flat_2rk_baths: parseInt(req.body["baths_2RK"]) || 0,
      flat_2rk_kitchens: parseInt(req.body["kitchens_2RK"]) || 0,

      flat_3rk_price: req.body["price_3RK"] ? `₹${parseInt(req.body["price_3RK"].toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}/month` : "",
      flat_3rk_deposit: req.body["deposit_3RK"] ? `₹${parseInt(req.body["deposit_3RK"].toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}` : "",
      flat_3rk_beds: parseInt(req.body["beds_3RK"]) || 0,
      flat_3rk_baths: parseInt(req.body["baths_3RK"]) || 0,
      flat_3rk_kitchens: parseInt(req.body["kitchens_3RK"]) || 0,

      // Flat specific rooms mapped for existing frontend expectations if any
      bhk1_price: req.body["price_1RK"] ? `₹${parseInt(req.body["price_1RK"].toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}/month` : "",
      bhk1_beds: parseInt(req.body["beds_1RK"]) || 0,
      bhk1_baths: parseInt(req.body["baths_1RK"]) || 0,
      bhk1_kitchen: req.body["kitchens_1RK"] || "",

      bhk2_price: req.body["price_2RK"] ? `₹${parseInt(req.body["price_2RK"].toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}/month` : "",
      bhk2_beds: parseInt(req.body["beds_2RK"]) || 0,
      bhk2_baths: parseInt(req.body["baths_2RK"]) || 0,
      bhk2_kitchen: req.body["kitchens_2RK"] || "",

      bhk3_price: req.body["price_3RK"] ? `₹${parseInt(req.body["price_3RK"].toString().replace(/\D/g, '') || 0).toLocaleString('en-IN')}/month` : "",
      bhk3_beds: parseInt(req.body["beds_3RK"]) || 0,
      bhk3_baths: parseInt(req.body["baths_3RK"]) || 0,
      bhk3_kitchen: req.body["kitchens_3RK"] || "",

      bhk1_guests: 0,
      bhk2_guests: 0,
      bhk3_guests: 0,
      bhk1_area: "",
      bhk2_area: "",
      bhk3_area: ""
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