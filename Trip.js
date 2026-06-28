import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    note: { type: String, default: "", trim: true },
    category: { type: String, default: "General", trim: true }
  },
  { _id: true }
);

const daySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    theme: { type: String, required: true, trim: true },
    activities: [activitySchema]
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    flights: { type: Number, required: true },
    accommodation: { type: Number, required: true },
    food: { type: Number, required: true },
    activities: { type: Number, required: true },
    transport: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, default: "USD" }
  },
  { _id: false }
);

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    tier: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    destination: { type: String, required: true, trim: true },
    days: { type: Number, required: true, min: 1, max: 21 },
    budgetType: { type: String, enum: ["Low", "Medium", "High"], required: true },
    interests: [{ type: String, trim: true }],
    pace: { type: String, enum: ["Relaxed", "Balanced", "Packed"], default: "Balanced" },
    itinerary: [daySchema],
    budget: budgetSchema,
    hotels: [hotelSchema],
    localTips: [{ type: String, trim: true }],
    source: { type: String, enum: ["openai", "fallback"], default: "fallback" }
  },
  { timestamps: true }
);

export const Trip = mongoose.model("Trip", tripSchema);
