import OpenAI from "openai";

const interestActivityMap = {
  Food: ["Try a neighborhood food walk", "Book a cooking class", "Visit a local market"],
  Culture: ["Tour a historic district", "Visit a landmark museum", "Attend a cultural performance"],
  Adventure: ["Plan a scenic hike", "Try a guided outdoor activity", "Explore a viewpoint"],
  Shopping: ["Browse a local shopping street", "Visit artisan stores", "Explore a design market"],
  Nature: ["Relax in a public garden", "Take a waterfront walk", "Visit a nature reserve"],
  Nightlife: ["Enjoy a rooftop view", "Try a live music venue", "Explore an evening food scene"]
};

const budgetMultipliers = {
  Low: 0.75,
  Medium: 1,
  High: 1.55
};

const paceCounts = {
  Relaxed: 2,
  Balanced: 3,
  Packed: 4
};

function parseJson(text) {
  const cleaned = text.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

function normalizeInterests(interests = []) {
  const normalized = interests.filter(Boolean);
  return normalized.length ? normalized : ["Food", "Culture"];
}

function buildFallbackTrip({ destination, days, budgetType, interests, pace = "Balanced" }) {
  const safeInterests = normalizeInterests(interests);
  const activityCount = paceCounts[pace] || 3;
  const itinerary = Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const primaryInterest = safeInterests[index % safeInterests.length];
    const pool = interestActivityMap[primaryInterest] || interestActivityMap.Culture;
    const activities = Array.from({ length: activityCount }, (__, activityIndex) => ({
      title: `${pool[activityIndex % pool.length]} in ${destination}`,
      note: activityIndex === 0 ? `Start near a central area of ${destination} to reduce transit time.` : "Keep this flexible based on weather and opening hours.",
      category: primaryInterest
    }));

    return {
      day,
      theme: `${primaryInterest} focused day`,
      activities
    };
  });

  const multiplier = budgetMultipliers[budgetType] || 1;
  const base = {
    flights: Math.round(420 * multiplier),
    accommodation: Math.round(days * 95 * multiplier),
    food: Math.round(days * 45 * multiplier),
    activities: Math.round(days * 35 * multiplier),
    transport: Math.round(days * 22 * multiplier)
  };

  return {
    itinerary,
    budget: {
      ...base,
      total: Object.values(base).reduce((sum, value) => sum + value, 0),
      currency: "USD"
    },
    hotels: [
      { name: `${destination} Central Stay`, tier: "Budget Friendly", reason: "Good for keeping daily transport costs low." },
      { name: `${destination} Grand House`, tier: "Mid Range", reason: "Balanced comfort, location, and traveler ratings." },
      { name: `${destination} Heritage Palace`, tier: "Luxury", reason: "Premium service for a higher budget trip." }
    ],
    localTips: [
      `Cluster activities by neighborhood in ${destination} to avoid losing time in transit.`,
      "Keep one backup indoor activity for weather changes.",
      "Reserve popular restaurants and tours at least a few days ahead."
    ],
    source: "fallback"
  };
}

function systemPrompt() {
  return `You are a practical travel planning agent. Return only valid JSON with this shape:
{
  "itinerary": [{"day": 1, "theme": "short theme", "activities": [{"title": "activity", "note": "why or timing note", "category": "Food"}]}],
  "budget": {"flights": 400, "accommodation": 300, "food": 150, "activities": 100, "transport": 80, "total": 1030, "currency": "USD"},
  "hotels": [{"name": "Hotel name", "tier": "Budget Friendly", "reason": "short reason"}],
  "localTips": ["short useful tip"],
  "source": "openai"
}
Use realistic but clearly estimated costs. Never invent booking availability.`;
}

export async function generateTripPlan(input) {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackTrip(input);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt() },
      {
        role: "user",
        content: `Create a ${input.days}-day itinerary for ${input.destination}. Budget: ${input.budgetType}. Interests: ${normalizeInterests(input.interests).join(", ")}. Pace: ${input.pace || "Balanced"}.`
      }
    ],
    response_format: { type: "json_object" }
  });

  return parseJson(completion.choices[0].message.content);
}

export async function regenerateDay({ trip, day, prompt }) {
  if (!process.env.OPENAI_API_KEY) {
    const fallback = buildFallbackTrip({
      destination: trip.destination,
      days: 1,
      budgetType: trip.budgetType,
      interests: trip.interests,
      pace: trip.pace
    });
    return {
      ...fallback.itinerary[0],
      day,
      theme: prompt ? `Regenerated: ${prompt}` : fallback.itinerary[0].theme
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.75,
    messages: [
      { role: "system", content: "Return only JSON for one itinerary day: {\"day\": number, \"theme\": string, \"activities\": [{\"title\": string, \"note\": string, \"category\": string}]}" },
      { role: "user", content: `Regenerate day ${day} for ${trip.destination}. Trip interests: ${trip.interests.join(", ")}. Budget: ${trip.budgetType}. User request: ${prompt || "Make it better."}` }
    ],
    response_format: { type: "json_object" }
  });

  return { ...parseJson(completion.choices[0].message.content), day };
}
