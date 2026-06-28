import { z } from "zod";
import { Trip } from "../models/Trip.js";
import { generateTripPlan, regenerateDay } from "../services/itineraryService.js";

const tripInputSchema = z.object({
  destination: z.string().min(2).max(120),
  days: z.coerce.number().int().min(1).max(21),
  budgetType: z.enum(["Low", "Medium", "High"]),
  interests: z.array(z.string().min(1)).min(1).max(8),
  pace: z.enum(["Relaxed", "Balanced", "Packed"]).default("Balanced")
});

const activitySchema = z.object({
  title: z.string().min(2).max(160),
  note: z.string().max(300).optional().default("Added by traveler."),
  category: z.string().max(80).optional().default("Custom")
});

async function findOwnedTrip(req, res) {
  const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
  if (!trip) {
    res.status(404).json({ message: "Trip not found" });
    return null;
  }
  return trip;
}

export async function listTrips(req, res, next) {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ trips });
  } catch (error) {
    next(error);
  }
}

export async function createTrip(req, res, next) {
  try {
    const input = tripInputSchema.parse(req.body);
    const generated = await generateTripPlan(input);
    const trip = await Trip.create({
      user: req.user._id,
      ...input,
      ...generated
    });
    res.status(201).json({ trip });
  } catch (error) {
    next(error);
  }
}

export async function getTrip(req, res, next) {
  try {
    const trip = await findOwnedTrip(req, res);
    if (trip) res.json({ trip });
  } catch (error) {
    next(error);
  }
}

export async function addActivity(req, res, next) {
  try {
    const input = activitySchema.parse(req.body);
    const day = z.coerce.number().int().min(1).parse(req.params.day);
    const trip = await findOwnedTrip(req, res);
    if (!trip) return;

    const targetDay = trip.itinerary.find((item) => item.day === day);
    if (!targetDay) return res.status(404).json({ message: "Day not found" });

    targetDay.activities.push(input);
    await trip.save();
    res.json({ trip });
  } catch (error) {
    next(error);
  }
}

export async function removeActivity(req, res, next) {
  try {
    const day = z.coerce.number().int().min(1).parse(req.params.day);
    const trip = await findOwnedTrip(req, res);
    if (!trip) return;

    const targetDay = trip.itinerary.find((item) => item.day === day);
    if (!targetDay) return res.status(404).json({ message: "Day not found" });

    targetDay.activities = targetDay.activities.filter((activity) => activity._id.toString() !== req.params.activityId);
    await trip.save();
    res.json({ trip });
  } catch (error) {
    next(error);
  }
}

export async function regenerateTripDay(req, res, next) {
  try {
    const day = z.coerce.number().int().min(1).parse(req.params.day);
    const prompt = z.object({ prompt: z.string().max(300).optional() }).parse(req.body).prompt;
    const trip = await findOwnedTrip(req, res);
    if (!trip) return;

    const index = trip.itinerary.findIndex((item) => item.day === day);
    if (index === -1) return res.status(404).json({ message: "Day not found" });

    trip.itinerary[index] = await regenerateDay({ trip, day, prompt });
    await trip.save();
    res.json({ trip });
  } catch (error) {
    next(error);
  }
}

export async function deleteTrip(req, res, next) {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
