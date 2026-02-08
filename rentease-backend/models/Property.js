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

    // PG specific fields
    pgTypes: { type: String },
    totalBathrooms: { type: Number },
    single_price: { type: String },
    single_deposit: { type: String },
    single_beds: { type: Number },
    single_bathType: { type: String },
    double_price: { type: String },
    double_deposit: { type: String },
    double_beds: { type: Number },
    double_bathType: { type: String },
    triple_price: { type: String },
    triple_deposit: { type: String },
    triple_beds: { type: Number },
    triple_bathType: { type: String },

    // Rent House specific fields
    rentHouseTypes: { type: String },
    commonKitchens: { type: Number },
    single_kitchenType: { type: String },
    double_kitchenType: { type: String },
    triple_kitchenType: { type: String },

    // Flat specific fields
    flatTypes: { type: String },
    flat_1rk_price: { type: String },
    flat_1rk_deposit: { type: String },
    flat_1rk_beds: { type: Number },
    flat_1rk_baths: { type: Number },
    flat_1rk_kitchens: { type: Number },

    flat_2rk_price: { type: String },
    flat_2rk_deposit: { type: String },
    flat_2rk_beds: { type: Number },
    flat_2rk_baths: { type: Number },
    flat_2rk_kitchens: { type: Number },

    flat_3rk_price: { type: String },
    flat_3rk_deposit: { type: String },
    flat_3rk_beds: { type: Number },
    flat_3rk_baths: { type: Number },
    flat_3rk_kitchens: { type: Number },

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