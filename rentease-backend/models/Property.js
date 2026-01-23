import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      required: true 
    }, // NEW field for category

    title: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: String, required: true }, // This will store formatted price like "₹12,000/month"
    deposit: { type: String },
    description: { type: String },

    // Flattened Homestay Details
    bhk1_price: { type: String },
    bhk1_beds: { type: Number, default: 0 },
    bhk1_baths: { type: Number, default: 0 },
    bhk1_kitchen: { type: String },
    bhk1_area: { type: String },
    bhk1_guests: { type: Number, default: 0 },

    bhk2_price: { type: String },
    bhk2_beds: { type: Number, default: 0 },
    bhk2_baths: { type: Number, default: 0 },
    bhk2_kitchen: { type: String },
    bhk2_area: { type: String },
    bhk2_guests: { type: Number, default: 0 },

    bhk3_price: { type: String },
    bhk3_beds: { type: Number, default: 0 },
    bhk3_baths: { type: Number, default: 0 },
    bhk3_kitchen: { type: String },
    bhk3_area: { type: String },
    bhk3_guests: { type: Number, default: 0 },

    // Property details (General)
    gender: { type: String, enum: ["Male", "Female", "Any", "Family"], default: "Any" },
    furnishing: { type: String },
   // availability: { type: String, default: "Available" },

    // Contact info
    phone: { type: String },
    whatsapp: { type: String },
    gmapLink: { type: String },

    // Availability
    maxGuests: { type: Number, default: 0 },
    availability: { type: String, default: "Available Now" },
    availableFrom: { type: Date },
    availableTo: { type: Date },

    // Media and features
    amenities: [{ type: String }],
    images: [{ type: String }],

    // Metadata
    verified: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    details: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Add a virtual for the raw price number (optional)
propertySchema.virtual('priceNumber').get(function() {
  const match = this.price.match(/₹?([\d,]+)/);
  return match ? parseInt(match[1].replace(/,/g, '')) : 0;
});

const Property = mongoose.model("Property", propertySchema);

export default Property;