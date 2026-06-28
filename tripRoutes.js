import { Router } from "express";
import {
  addActivity,
  createTrip,
  deleteTrip,
  getTrip,
  listTrips,
  regenerateTripDay,
  removeActivity
} from "../controllers/tripController.js";
import { requireAuth } from "../middleware/auth.js";

export const tripRouter = Router();

tripRouter.use(requireAuth);
tripRouter.get("/", listTrips);
tripRouter.post("/", createTrip);
tripRouter.get("/:id", getTrip);
tripRouter.delete("/:id", deleteTrip);
tripRouter.post("/:id/days/:day/activities", addActivity);
tripRouter.delete("/:id/days/:day/activities/:activityId", removeActivity);
tripRouter.post("/:id/days/:day/regenerate", regenerateTripDay);
