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

    // Property details
    beds: { type: Number, default: 0 },
    baths: { type: Number, default: 0 },
    sqFt: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Any", "Family"], default: "Any" },
    furnishing: { type: String },
   // availability: { type: String, default: "Available" },

    // Contact info
    phone: { type: String },
    whatsapp: { type: String },
    gmapLink: { type: String },

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