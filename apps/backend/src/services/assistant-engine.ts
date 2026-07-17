/**
 * AERISYN Smart Weather Assistant Engine
 * Genuinely conversational, context-aware responses using real live weather data.
 * No external API needed — all logic is derived from the weather context.
 */

export interface WeatherContext {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  precipitation: number;
  weather_code: number;
  cloud_cover: number;
  uv_index: number;
  is_day: number;
  rain_probability: number;
  rain_prob_tomorrow?: number;
  peak_rain_prob_12h?: number;
  temp_max: number;
  temp_min: number;
  aqi: number;
  wind_direction?: string;
  wind_max?: number;
  uv_max?: number;
  visibility_km?: number;
  pm2_5?: number;
  sunrise?: string;
  sunset?: string;
}

// ─── Intent Detection ──────────────────────────────────────────────────────

type Intent =
  | "umbrella"
  | "outdoor_exercise"
  | "clothing"
  | "farming"
  | "trekking"
  | "wash_vehicle"
  | "sports"
  | "travel"
  | "air_quality"
  | "uv_sunscreen"
  | "sleep"
  | "general";

function detectIntent(q: string): Intent {
  const t = q.toLowerCase();
  if (/umbrella|raincoat|rain|drizzle|wet|downpour/.test(t)) return "umbrella";
  if (/exercise|jog|run|walk|workout|outdoor.*(activity|activit)|outside.*fit/.test(t)) return "outdoor_exercise";
  if (/wear|cloth|dress|outfit|jacket|t.shirt|layer/.test(t)) return "clothing";
  if (/farm|crop|harvest|irrigat|agricult|plant|soil|sow/.test(t)) return "farming";
  if (/trek|hike|mountain|trail|camp|climb/.test(t)) return "trekking";
  if (/wash.*car|car.*wash|wash.*bike|vehicle.*wash|clean.*car/.test(t)) return "wash_vehicle";
  if (/cricket|football|badminton|sport|match|game|play|tennis|golf/.test(t)) return "sports";
  if (/travel|drive|road|trip|journey|fly|commute|traffic/.test(t)) return "travel";
  if (/air.*quality|pollution|aqi|pm2|smog|breathe|lung/.test(t)) return "air_quality";
  if (/uv|sunscreen|sunburn|sun.*protect|spf/.test(t)) return "uv_sunscreen";
  if (/sleep|night|rest|bedroom|window.*open/.test(t)) return "sleep";
  return "general";
}

// ─── Weather Condition Helpers ────────────────────────────────────────────

function isRainy(ctx: WeatherContext): boolean {
  return ctx.precipitation > 0.5 ||
    ctx.rain_probability > 50 ||
    (ctx.weather_code >= 51 && ctx.weather_code <= 82) ||
    ctx.weather_code >= 95;
}

function isLightRain(ctx: WeatherContext): boolean {
  return (ctx.rain_probability > 30 && ctx.rain_probability <= 60) ||
    (ctx.precipitation > 0 && ctx.precipitation <= 2);
}

function isHeavyRain(ctx: WeatherContext): boolean {
  return ctx.precipitation > 10 ||
    ctx.rain_probability > 75 ||
    ctx.weather_code >= 63 ||
    ctx.weather_code >= 95;
}

function isThunderstorm(ctx: WeatherContext): boolean {
  return ctx.weather_code >= 95;
}

function isFoggy(ctx: WeatherContext): boolean {
  return ctx.weather_code === 45 || ctx.weather_code === 48 ||
    (ctx.visibility_km !== undefined && ctx.visibility_km < 1);
}

function isExtremeheat(ctx: WeatherContext): boolean {
  return ctx.temperature >= 40 || ctx.feels_like >= 42;
}

function isHot(ctx: WeatherContext): boolean {
  return ctx.temperature >= 35 || ctx.feels_like >= 37;
}

function isWarm(ctx: WeatherContext): boolean {
  return ctx.temperature >= 25 && ctx.temperature < 35;
}

function isMild(ctx: WeatherContext): boolean {
  return ctx.temperature >= 18 && ctx.temperature < 25;
}

function isCool(ctx: WeatherContext): boolean {
  return ctx.temperature >= 10 && ctx.temperature < 18;
}

function isCold(ctx: WeatherContext): boolean {
  return ctx.temperature < 10;
}

function isWindy(ctx: WeatherContext): boolean {
  return ctx.wind_speed >= 40;
}

function isStrongWind(ctx: WeatherContext): boolean {
  return ctx.wind_speed >= 60;
}

function isHighUV(ctx: WeatherContext): boolean {
  return (ctx.uv_max ?? ctx.uv_index) >= 8;
}

function isModerateUV(ctx: WeatherContext): boolean {
  return (ctx.uv_max ?? ctx.uv_index) >= 5 && (ctx.uv_max ?? ctx.uv_index) < 8;
}

function poorAir(ctx: WeatherContext): boolean {
  return ctx.aqi > 100;
}

function unhealthyAir(ctx: WeatherContext): boolean {
  return ctx.aqi > 150;
}

function tempLabel(ctx: WeatherContext): string {
  if (isExtremeheat(ctx)) return "dangerously hot";
  if (isHot(ctx)) return "quite hot";
  if (isWarm(ctx)) return "warm";
  if (isMild(ctx)) return "mild and pleasant";
  if (isCool(ctx)) return "cool";
  if (isCold(ctx)) return "cold";
  return "moderate";
}

function conditionLabel(code: number): string {
  if (code === 0) return "clear skies";
  if (code <= 2) return "mostly clear with some cloud";
  if (code === 3) return "completely overcast";
  if (code <= 48) return "foggy";
  if (code <= 55) return "drizzling";
  if (code <= 65) return "raining";
  if (code <= 67) return "freezing rain";
  if (code <= 77) return "snowing";
  if (code <= 82) return "rain showers";
  if (code >= 95) return "thunderstorm";
  return "mixed conditions";
}

function aqiLabel(aqi: number): { label: string; detail: string } {
  if (aqi <= 20)  return { label: "excellent",    detail: "virtually no pollution" };
  if (aqi <= 50)  return { label: "good",          detail: "safe for all groups" };
  if (aqi <= 100) return { label: "moderate",      detail: "acceptable for most people" };
  if (aqi <= 150) return { label: "unhealthy for sensitive groups", detail: "children, elderly and those with respiratory issues should limit exposure" };
  if (aqi <= 200) return { label: "unhealthy",     detail: "everyone may start to experience health effects" };
  return            { label: "very unhealthy",     detail: "health alert — avoid outdoor exposure" };
}

// ─── Pick from variants to avoid repetition ───────────────────────────────

function pick<T>(arr: T[]): T {
  // Deterministic: based on current minute, so same minute returns same variant
  const idx = Math.floor(Date.now() / 60000) % arr.length;
  return arr[idx];
}

// ─── Response Generators ──────────────────────────────────────────────────

function umbrellaResponse(ctx: WeatherContext, city: string): {
  answer: string; recommendations: string[];
} {
  const recs: string[] = [];

  if (isThunderstorm(ctx)) {
    const answer = pick([
      `Absolutely take an umbrella — there's a thunderstorm in ${city} right now (${ctx.weather_code >= 96 ? "with hail" : "with lightning risk"}). More importantly, try to stay indoors if possible. ${ctx.rain_probability}% rain probability and ${ctx.precipitation}mm already falling.`,
      `Yes, and more than just an umbrella — a full raincoat is better. Active thunderstorm in ${city}, ${ctx.precipitation}mm precipitation, and ${ctx.rain_probability}% chance of continued rain. Stay off open ground.`,
    ]);
    recs.push("Carry a sturdy windproof umbrella or full raincoat");
    recs.push("Avoid open areas, tall trees and metal structures during lightning");
    recs.push("Check if your plans can be moved indoors — conditions are severe");
    return { answer, recommendations: recs };
  }

  if (isHeavyRain(ctx)) {
    const answer = pick([
      `Yes, definitely carry an umbrella in ${city}. Heavy rain is either falling now or very likely — ${ctx.precipitation}mm precipitation, ${ctx.rain_probability}% rain probability. The sky is ${ctx.cloud_cover}% clouded over and conditions are ${conditionLabel(ctx.weather_code)}.`,
      `Take an umbrella — no question. ${city} is seeing ${conditionLabel(ctx.weather_code)} with ${ctx.precipitation}mm already fallen and a ${ctx.rain_probability}% chance of more. The feels-like temperature is ${ctx.feels_like}°C, which will drop further if you're soaked.`,
    ]);
    recs.push("Use a windproof umbrella — winds are " + ctx.wind_speed + " km/h");
    recs.push("Wear waterproof footwear if walking any distance");
    recs.push(ctx.rain_prob_tomorrow && ctx.rain_prob_tomorrow > 50
      ? `Rain continues tomorrow (${ctx.rain_prob_tomorrow}% probability) — plan accordingly`
      : "Tomorrow looks clearer (" + (ctx.rain_prob_tomorrow ?? "unknown") + "% rain chance)");
    return { answer, recommendations: recs };
  }

  if (isRainy(ctx) && !isHeavyRain(ctx)) {
    const answer = pick([
      `Yes, carry an umbrella in ${city}. It's ${conditionLabel(ctx.weather_code)} with ${ctx.rain_probability}% rain probability. Light but real — ${ctx.precipitation}mm has already fallen. Better to have it and not need it.`,
      `Umbrella recommended for ${city} today. Conditions are ${conditionLabel(ctx.weather_code)}, rain probability is ${ctx.rain_probability}%, and there's a ${ctx.peak_rain_prob_12h ?? ctx.rain_probability}% peak chance in the next 12 hours.`,
    ]);
    recs.push("A compact foldable umbrella will do fine");
    if (ctx.wind_speed > 25) recs.push("Winds at " + ctx.wind_speed + " km/h may flip a flimsy umbrella — get a sturdy one");
    recs.push("Morning looks wetter — afternoon may ease slightly based on cloud patterns");
    return { answer, recommendations: recs };
  }

  if (isLightRain(ctx)) {
    const answer = pick([
      `It's borderline in ${city} — ${ctx.rain_probability}% rain probability isn't high, but with ${ctx.cloud_cover}% cloud cover, it could tip either way. I'd pack a foldable umbrella just in case, especially if you're out for a few hours.`,
      `Maybe. In ${city} right now: ${conditionLabel(ctx.weather_code)}, ${ctx.rain_probability}% chance of rain. It's not certain but not zero either. A compact umbrella in your bag costs nothing.`,
    ]);
    recs.push("Pack a small foldable umbrella as backup");
    recs.push("Watch the sky — afternoon clouds can build quickly");
    return { answer, recommendations: recs };
  }

  // Clear/no rain
  const answer = pick([
    `No umbrella needed in ${city} today. Skies are ${conditionLabel(ctx.weather_code)}, only ${ctx.rain_probability}% chance of rain, and the temperature is a ${tempLabel(ctx)} ${ctx.temperature}°C. Leave it at home.`,
    `You're safe without an umbrella in ${city}. Rain probability is just ${ctx.rain_probability}%, skies are ${conditionLabel(ctx.weather_code)}, and no precipitation is expected. Enjoy the ${ctx.temperature}°C day.`,
  ]);
  if (ctx.uv_max && ctx.uv_max >= 6) recs.push(`UV index peaks at ${ctx.uv_max} today — sunglasses and sunscreen are more important than an umbrella`);
  recs.push("No rain gear needed — light clothing is fine");
  return { answer, recommendations: recs };
}

function outdoorExerciseResponse(ctx: WeatherContext, city: string): {
  answer: string; recommendations: string[];
} {
  const recs: string[] = [];

  // Score conditions
  let score = 10;
  let concerns: string[] = [];
  if (isThunderstorm(ctx)) { score -= 6; concerns.push("active thunderstorm"); }
  if (isHeavyRain(ctx))    { score -= 4; concerns.push(`heavy rain (${ctx.precipitation}mm)`); }
  else if (isRainy(ctx))   { score -= 2; concerns.push(`${ctx.rain_probability}% rain chance`); }
  if (isExtremeheat(ctx))  { score -= 4; concerns.push(`extreme heat (${ctx.temperature}°C, feels like ${ctx.feels_like}°C)`); }
  else if (isHot(ctx))     { score -= 2; concerns.push(`high heat (${ctx.temperature}°C)`); }
  if (isStrongWind(ctx))   { score -= 2; concerns.push(`strong winds (${ctx.wind_speed} km/h)`); }
  if (unhealthyAir(ctx))   { score -= 3; concerns.push(`unhealthy air quality (AQI ${ctx.aqi})`); }
  else if (poorAir(ctx))   { score -= 1; concerns.push(`moderate air quality (AQI ${ctx.aqi})`); }
  if (isHighUV(ctx))       { score -= 1; concerns.push(`high UV index (${ctx.uv_max ?? ctx.uv_index})`); }

  if (score <= 4) {
    const answer = `Not a good day for outdoor exercise in ${city}. The conditions are working against you: ${concerns.join(", ")}. If you must, exercise indoors today.`;
    if (isThunderstorm(ctx)) recs.push("Lightning risk — never exercise outside during a thunderstorm");
    if (isExtremeheat(ctx)) recs.push("Heat exhaustion risk above 40°C — stay cool and hydrated indoors");
    if (unhealthyAir(ctx)) recs.push("Air quality is unhealthy — outdoor exertion makes it worse for your lungs");
    recs.push("Today is a good day for an indoor gym, yoga, or home workout");
    return { answer, recommendations: recs };
  }

  if (score <= 7) {
    const answer = pick([
      `Exercise is possible in ${city} but plan around the conditions. Main concerns: ${concerns.join(", ")}. Choose your timing and intensity wisely.`,
      `Doable, but not ideal in ${city}. With ${concerns.join(" and ")}, you'll want to be strategic about when and how you exercise.`,
    ]);
    if (isHot(ctx)) recs.push(`Go before 8am or after 6pm — current ${ctx.temperature}°C drops significantly in the evening`);
    if (isRainy(ctx)) recs.push("Exercise in covered areas like a park with shelters, or a track");
    if (poorAir(ctx)) recs.push(`AQI is ${ctx.aqi} — keep intensity moderate, breathe through your nose`);
    if (isHighUV(ctx)) recs.push(`UV peaks at ${ctx.uv_max ?? ctx.uv_index} — apply SPF 50+ and wear a hat`);
    recs.push("Carry extra water — hydration is key in these conditions");
    return { answer, recommendations: recs };
  }

  // Great conditions
  const answer = pick([
    `${city} conditions are great for outdoor exercise right now — ${conditionLabel(ctx.weather_code)}, ${ctx.temperature}°C (feels like ${ctx.feels_like}°C), ${ctx.wind_speed} km/h breeze. Go for it.`,
    `Good to go for outdoor exercise in ${city}. Temperature is a ${tempLabel(ctx)} ${ctx.temperature}°C, air quality is ${aqiLabel(ctx.aqi).label} (AQI ${ctx.aqi}), and the sky is ${conditionLabel(ctx.weather_code)}.`,
  ]);
  if (isModerateUV(ctx) || isHighUV(ctx)) recs.push(`UV index is ${ctx.uv_max ?? ctx.uv_index} — apply sunscreen before heading out`);
  recs.push(isWarm(ctx) || isHot(ctx) ? "Hydrate every 20–25 minutes" : "Ideal conditions — enjoy your full session");
  if (ctx.wind_speed > 15) recs.push(`${ctx.wind_speed} km/h wind — run into the wind on the way out so it's at your back on the return`);
  return { answer, recommendations: recs };
}

function clothingResponse(ctx: WeatherContext, city: string): {
  answer: string; recommendations: string[];
} {
  const recs: string[] = [];
  let outfit = "";
  let extras = "";

  if (isExtremeheat(ctx)) {
    outfit = "the lightest breathable clothing you own — loose-fit cotton or moisture-wicking fabrics, shorts and a loose shirt";
    recs.push(`It's ${ctx.temperature}°C (feels like ${ctx.feels_like}°C) — avoid dark colours, they absorb heat`);
    recs.push("Light-coloured, loose-weave fabrics are your best bet");
    recs.push("A wide-brimmed hat and sunglasses are essential, not optional");
  } else if (isHot(ctx)) {
    outfit = "light, breathable clothing — a t-shirt, shorts or light trousers";
    recs.push(`UV index peaks at ${ctx.uv_max ?? ctx.uv_index} today — apply sunscreen even if it feels cloudy`);
    recs.push("Sandals or breathable footwear to keep cool");
  } else if (isWarm(ctx)) {
    outfit = "comfortable casuals — a t-shirt or light shirt is enough, maybe a thin layer for the evening";
    recs.push("Perfect layering weather — a light jacket in your bag for later");
  } else if (isMild(ctx)) {
    outfit = "a light jacket or long-sleeve shirt over a tee — mild today";
    recs.push("You may want a layer you can remove mid-day as it warms up");
  } else if (isCool(ctx)) {
    outfit = "a proper jacket or hoodie with jeans or trousers — it's cool out";
    recs.push("Light thermal inner layer helps if you're out for long");
    recs.push("Closed-toe shoes — sandals will leave your feet cold");
  } else if (isCold(ctx)) {
    outfit = "warm layers — thermals, a fleece or thick sweater, a winter coat";
    recs.push("Layer up: thermals underneath, insulating mid-layer, windproof outer");
    recs.push("Gloves, scarf and a hat will make a big difference below 10°C");
  }

  if (isRainy(ctx) || isHeavyRain(ctx)) {
    extras += ", plus a waterproof outer layer or rain jacket";
    recs.push("Waterproof footwear — your feet will be wet otherwise");
  }
  if (isWindy(ctx)) {
    extras += " — wind at " + ctx.wind_speed + " km/h means a windproof layer matters";
  }

  const answer = pick([
    `For ${city} today (${ctx.temperature}°C, feels like ${ctx.feels_like}°C, ${conditionLabel(ctx.weather_code)}), wear ${outfit}${extras}.`,
    `${city} is ${tempLabel(ctx)} at ${ctx.temperature}°C right now (feels like ${ctx.feels_like}°C). Go with ${outfit}${extras}.`,
  ]);
  return { answer, recommendations: recs };
}

function farmingResponse(ctx: WeatherContext, city: string): {
  answer: string; recommendations: string[];
} {
  const recs: string[] = [];

  if (isThunderstorm(ctx)) {
    const answer = `Thunderstorm in ${city} — keep all farm workers off the field. Lightning risk, heavy rain and wind make field work dangerous and counterproductive today.`;
    recs.push("Shelter livestock and cover harvested produce");
    recs.push("Inspect drainage channels before and after the storm");
    recs.push("Do not operate machinery in wet, lightning-prone conditions");
    return { answer, recommendations: recs };
  }

  if (isHeavyRain(ctx)) {
    const answer = `Heavy rainfall in ${city} (${ctx.precipitation}mm, ${ctx.rain_probability}% probability) means most field work should be paused. Soil saturation and machinery-ruts are the main risks.`;
    recs.push("Excellent time for rain-fed crops — skip irrigation today");
    recs.push("Delay harvesting of sensitive crops like fruits and grains");
    recs.push("Check for waterlogging or runoff in low-lying plots");
    recs.push("Avoid pesticide/fungicide application — rain washes it away");
    return { answer, recommendations: recs };
  }

  if (isRainy(ctx)) {
    const answer = `Light to moderate rain in ${city} (${conditionLabel(ctx.weather_code)}, ${ctx.precipitation}mm, ${ctx.rain_probability}% probability). Good for some farming tasks, not ideal for others.`;
    recs.push("Good day for transplanting seedlings — soil moisture is ideal");
    recs.push("Avoid pesticide, herbicide or fertiliser spraying — will be washed away");
    recs.push("Monitor for fungal disease risk — humidity is " + ctx.humidity + "%, which encourages it");
    return { answer, recommendations: recs };
  }

  if (isExtremeheat(ctx) || isHot(ctx)) {
    const answer = `Hot and dry in ${city} (${ctx.temperature}°C, humidity ${ctx.humidity}%). Irrigation is the priority today — evaporation rates are high and crops need support.`;
    recs.push("Irrigate in early morning (before 8am) or late evening (after 6pm)");
    recs.push("Mulch soil surfaces to reduce moisture loss by up to 50%");
    recs.push("Field workers should avoid peak heat (11am–4pm) — rest in shade");
    recs.push("Monitor young plants and seedlings for wilting");
    return { answer, recommendations: recs };
  }

  // Favourable
  const answer = pick([
    `Favourable farming conditions in ${city} today — ${conditionLabel(ctx.weather_code)}, ${ctx.temperature}°C, humidity at ${ctx.humidity}%. Good for a wide range of agricultural work.`,
    `${city} weather is cooperative for farming today. ${ctx.temperature}°C, ${conditionLabel(ctx.weather_code)}, ${ctx.humidity}% humidity — conditions suit sowing, transplanting, harvesting and general field maintenance.`,
  ]);
  recs.push("Ideal conditions for sowing, transplanting or harvesting");
  if ((ctx.uv_max ?? ctx.uv_index) >= 6) recs.push(`UV index reaches ${ctx.uv_max ?? ctx.uv_index} — field workers should wear hats and use sunscreen`);
  recs.push("Good window to apply fertilisers or pesticides if needed — low rain risk");
  return { answer, recommendations: recs };
}

function trekkingResponse(ctx: WeatherContext, city: string): {
  answer: string; recommendations: string[];
} {
  const recs: string[] = [];

  if (isThunderstorm(ctx)) {
    const answer = `Do not trek today. ${city} has an active thunderstorm — lightning on elevated terrain is life-threatening. This is a hard no.`;
    recs.push("NEVER hike during a thunderstorm — lightning strikes elevated terrain preferentially");
    recs.push("If already on trail, descend immediately and shelter in a low-lying area away from trees");
    recs.push("Postpone to a day with clear or partly cloudy skies");
    return { answer, recommendations: recs };
  }

  if (isHeavyRain(ctx)) {
    const answer = `Trek not recommended today in ${city}. Heavy rain (${ctx.precipitation}mm, ${ctx.rain_probability}% probability) makes trails slippery and dangerous, with risk of flash flooding in valleys.`;
    recs.push("Wet trails significantly increase ankle sprain and fall risk");
    recs.push("Flash flood risk in narrow valleys and stream crossings");
    recs.push("Postpone if possible — one good day is worth waiting for");
    return { answer, recommendations: recs };
  }

  if (isRainy(ctx)) {
    const answer = pick([
      `Trekking in ${city} today is possible but you should go prepared. ${conditionLabel(ctx.weather_code)} with ${ctx.rain_probability}% rain probability — trails will be slippery and visibility reduced.`,
      `Proceed cautiously for trekking in ${city}. Rain probability is ${ctx.rain_probability}%, currently ${conditionLabel(ctx.weather_code)}. Not the best day but manageable with the right gear.`,
    ]);
    recs.push("Wear waterproof boots with good grip — trails will be muddy/slippery");
    recs.push("Take a rain cover for your backpack and a light waterproof jacket");
    recs.push("Avoid stream crossings — water levels can rise rapidly in rain");
    recs.push("Stick to well-marked trails — visibility may be reduced");
    return { answer, recommendations: recs };
  }

  const uvLevel = ctx.uv_max ?? ctx.uv_index;
  const answer = pick([
    `${city} conditions look good for trekking today — ${conditionLabel(ctx.weather_code)}, ${ctx.temperature}°C, wind at ${ctx.wind_speed} km/h. ${isHot(ctx) ? "It's warm though, so plan around the heat." : "Comfortable conditions overall."}`,
    `Good to go for a trek in ${city}. ${conditionLabel(ctx.weather_code)} skies, ${ctx.temperature}°C with ${ctx.humidity}% humidity. ${uvLevel >= 6 ? "UV is " + uvLevel + " — sun protection is essential." : "Pleasant conditions all round."}`,
  ]);
  recs.push("Start early — before 8am is ideal to beat the midday heat and UV");
  recs.push(`Pack ${isHot(ctx) ? "at least 3L of water per person" : "2L of water per person"}`);
  if (uvLevel >= 6) recs.push(`UV index peaks at ${uvLevel} — apply SPF 50+ and wear a hat`);
  recs.push("Tell someone your route and expected return time");
  return { answer, recommendations: recs };
}

function washVehicleResponse(ctx: WeatherContext, city: string): {
  answer: string; recommendations: string[];
} {
  const recs: string[] = [];
  const tomorrowRain = ctx.rain_prob_tomorrow ?? 30;

  if (isRainy(ctx) || ctx.rain_probability > 65) {
    const answer = pick([
      `Skip the car wash today in ${city}. It's ${conditionLabel(ctx.weather_code)} with ${ctx.rain_probability}% rain probability — you'd be washing your car only for the rain to undo it.`,
      `Not the day for it in ${city}. ${ctx.precipitation}mm already falling and ${ctx.rain_probability}% chance of more. Wait for a clear window.`,
    ]);
    recs.push("Rain probability is " + ctx.rain_probability + "% today — not worth the effort");
    recs.push(tomorrowRain < 30 ? "Tomorrow looks clearer (" + tomorrowRain + "% rain chance) — better day for it" : "Check the forecast for the next dry window");
    return { answer, recommendations: recs };
  }

  if (ctx.rain_probability > 35) {
    const answer = `It's 50/50 for a car wash in ${city}. Rain probability is ${ctx.rain_probability}% — your car might stay clean, or might not. If you go ahead, wash early morning so it dries before any afternoon showers.`;
    recs.push("Wash before 9am and let the car dry thoroughly");
    recs.push("Avoid waxing today — it needs at least 24h dry to cure");
    return { answer, recommendations: recs };
  }

  // Good wash day
  const answer = pick([
    `Perfect time for a car wash in ${city}. Only ${ctx.rain_probability}% rain probability, ${conditionLabel(ctx.weather_code)} sky, and ${ctx.temperature}°C — your car will air-dry quickly.`,
    `Good day for it in ${city}. ${ctx.rain_probability}% chance of rain, skies are ${conditionLabel(ctx.weather_code)}, and at ${ctx.temperature}°C the car will dry fast.`,
  ]);
  recs.push(isHot(ctx)
    ? "Wash in the shade — direct sun above 35°C causes water spots on paint"
    : "Wash in the morning or evening for best results");
  recs.push("Good day for waxing after wash — clean, dry conditions are ideal");
  return { answer, recommendations: recs };
}

function sportsResponse(ctx: WeatherContext, city: string, question: string): {
  answer: string; recommendations: string[];
} {
  const recs: string[] = [];
  const q = question.toLowerCase();
  const sport = q.includes("cricket") ? "cricket"
    : q.includes("football") ? "football"
    : q.includes("tennis")   ? "tennis"
    : q.includes("golf")     ? "golf"
    : q.includes("badminton")? "badminton"
    : "outdoor sports";

  if (sport === "badminton") {
    const answer = `Badminton is played indoors so ${city}'s weather doesn't directly affect the game. Head to the court — just make sure the venue's temperature is comfortable given it's ${ctx.temperature}°C outside.`;
    recs.push("Check the court's cooling/ventilation — especially important in hot weather");
    recs.push("Hydrate well before playing — outdoor heat carries into indoor spaces");
    return { answer, recommendations: recs };
  }

  if (isThunderstorm(ctx)) {
    const answer = `${sport} is off today — active thunderstorm in ${city}. Lightning and outdoor sports are a dangerous combination. Postpone.`;
    recs.push("Never play outdoor sports during active lightning");
    recs.push("Indoor alternatives: gym, swimming pool, indoor courts");
    return { answer, recommendations: recs };
  }

  if (isHeavyRain(ctx)) {
    const answer = `Heavy rain in ${city} (${ctx.precipitation}mm, ${ctx.rain_probability}% probability) makes ${sport} very difficult. Ground conditions will be waterlogged and visibility reduced.`;
    recs.push(sport === "cricket" ? "Pitch will be wet — playing could damage the surface and increase injury risk" : "Slippery surface increases fall and injury risk");
    recs.push("Check if the venue has drainage — some venues manage light rain but not heavy");
    recs.push("Best to reschedule for a dry day");
    return { answer, recommendations: recs };
  }

  if (isRainy(ctx)) {
    const answer = `${city} has ${conditionLabel(ctx.weather_code)} with ${ctx.rain_probability}% rain probability — ${sport} might be playable but conditions aren't ideal. Your call depending on how the rain progresses.`;
    recs.push("Light rain may clear — monitor for an hour before deciding");
    if (sport === "cricket") recs.push("Cover the pitch and protect the ball from moisture");
    recs.push("Surface grip is reduced — take extra care with footing");
    return { answer, recommendations: recs };
  }

  if (isExtremeheat(ctx)) {
    const answer = `Extreme heat in ${city} (${ctx.temperature}°C, feels like ${ctx.feels_like}°C) makes ${sport} physically risky. Heat exhaustion can set in quickly during intense play.`;
    recs.push("Play before 9am or after 6pm — avoid the 11am–5pm heat window entirely");
    recs.push("Mandatory water breaks every 20 minutes minimum");
    recs.push("Have cold towels and ice packs at the sideline");
    recs.push("Watch for heat exhaustion signs: dizziness, nausea, confusion — stop immediately");
    return { answer, recommendations: recs };
  }

  // Good conditions
  const wind = ctx.wind_speed;
  let windNote = "";
  if (sport === "cricket" && wind > 20) windNote = ` Wind at ${wind} km/h will affect swing bowling and catching — adjust accordingly.`;
  if (sport === "tennis" && wind > 25) windNote = ` ${wind} km/h wind will make ball control tricky.`;
  if (sport === "golf" && wind > 20) windNote = ` Wind at ${wind} km/h will affect shot distance — play one club up into the wind.`;

  const answer = pick([
    `Good day for ${sport} in ${city} — ${conditionLabel(ctx.weather_code)}, ${ctx.temperature}°C, ${ctx.wind_speed} km/h wind.${windNote} Enjoy the game.`,
    `${city} weather is in your favour for ${sport} today. ${ctx.temperature}°C with ${conditionLabel(ctx.weather_code)} skies and only ${ctx.rain_probability}% rain chance.${windNote}`,
  ]);
  recs.push(`UV index peaks at ${ctx.uv_max ?? ctx.uv_index} — apply sunscreen before you start`);
  recs.push("Carry extra water — " + (isWarm(ctx) ? "warm conditions mean higher sweat rate" : "stay topped up even in milder weather"));
  return { answer, recommendations: recs };
}

function travelResponse(ctx: WeatherContext, city: string): {
  answer: string; recommendations: string[];
} {
  const recs: string[] = [];
  const vis = ctx.visibility_km;

  if (isThunderstorm(ctx)) {
    const answer = `Significant weather risk for travel in ${city} right now. Active thunderstorm with ${ctx.precipitation}mm precipitation, ${ctx.wind_speed} km/h winds${vis !== undefined ? `, and visibility down to ${vis.toFixed(1)} km` : ""}. Delay if you can.`;
    recs.push("If you must travel: reduce speed significantly, keep headlights on");
    recs.push("Avoid flooded roads — even 15cm of water can sweep a car");
    recs.push("Allow double your normal travel time");
    return { answer, recommendations: recs };
  }

  if (isHeavyRain(ctx)) {
    const answer = `Exercise caution travelling in ${city} — heavy rain (${ctx.precipitation}mm, ${ctx.rain_probability}% probability)${vis !== undefined ? `, visibility reduced to ${vis.toFixed(1)} km` : ""}. Road surfaces will be slippery.`;
    recs.push("Reduce speed and increase following distance by at least 50%");
    recs.push("Keep headlights on — improves your visibility and makes you more visible");
    recs.push("Avoid flooded underpasses and low-lying roads");
    return { answer, recommendations: recs };
  }

  if (isFoggy(ctx)) {
    const answer = `Foggy conditions in ${city}${vis !== undefined ? ` — visibility only ${vis.toFixed(1)} km` : ""}. Drive slowly and use fog lights.`;
    recs.push("Use low-beam headlights and fog lights — NOT high beams (they reflect back)");
    recs.push("Reduce speed to match your visibility distance");
    recs.push("Give extra space to vehicles ahead — stopping distance is greatly increased");
    return { answer, recommendations: recs };
  }

  // Clear travel
  const answer = pick([
    `Travel conditions in ${city} are good today — ${conditionLabel(ctx.weather_code)}, ${ctx.temperature}°C${vis !== undefined ? `, visibility ${vis.toFixed(1)} km` : ""}. Roads should be clear.`,
    `No weather-related travel concerns in ${city}. ${conditionLabel(ctx.weather_code)} with ${ctx.rain_probability}% rain probability and ${ctx.temperature}°C — straightforward conditions.`,
  ]);
  recs.push("Standard safe driving applies — stay within speed limits");
  if (isHot(ctx)) recs.push("Ensure your vehicle's cooling system and tyres are in good condition for the heat");
  if (isHighUV(ctx)) recs.push("Keep sunglasses handy to reduce glare while driving");
  return { answer, recommendations: recs };
}

function airQualityResponse(ctx: WeatherContext, city: string): {
  answer: string; recommendations: string[];
} {
  const recs: string[] = [];
  const { label, detail } = aqiLabel(ctx.aqi);
  const pm = ctx.pm2_5;

  const answer = pick([
    `Air quality in ${city} is currently ${label} (AQI ${ctx.aqi}) — ${detail}. ${pm !== undefined ? `PM2.5 is ${pm} µg/m³ (WHO guideline: 15 µg/m³).` : ""}`,
    `${city} AQI right now: ${ctx.aqi} — classified as ${label}. ${detail}. ${pm !== undefined ? `PM2.5 at ${pm} µg/m³.` : ""}`,
  ]);

  if (unhealthyAir(ctx)) {
    recs.push("Wear an N95/KN95 mask for any outdoor activity");
    recs.push("Keep windows closed, use an air purifier if available");
    recs.push("Vulnerable groups (children, elderly, asthma patients) should stay indoors");
  } else if (poorAir(ctx)) {
    recs.push("Sensitive individuals should limit prolonged outdoor exposure");
    recs.push("Avoid heavy outdoor exercise — limit yourself to light walks");
    recs.push("Good ventilation indoors if wind direction brings pollutants inside");
  } else {
    recs.push("Air quality is acceptable — no special precautions needed");
    recs.push("Good conditions for outdoor activities from an air quality perspective");
  }
  return { answer, recommendations: recs };
}

function uvResponse(ctx: WeatherContext, city: string): {
  answer: string; recommendations: string[];
} {
  const recs: string[] = [];
  const uv = ctx.uv_max ?? ctx.uv_index;

  const uvCategory = uv >= 11 ? "extreme" : uv >= 8 ? "very high" : uv >= 6 ? "high" : uv >= 3 ? "moderate" : "low";
  const burnTime = uv >= 11 ? "under 10 minutes" : uv >= 8 ? "10–20 minutes" : uv >= 6 ? "20–30 minutes" : uv >= 3 ? "30–60 minutes" : "over 60 minutes";

  const answer = `UV index in ${city} peaks at ${uv} today — that's ${uvCategory}. Unprotected skin can burn in ${burnTime}. ${uv < 3 ? "No sunscreen needed for most people." : "Protection is essential."}`;

  if (uv >= 6) {
    recs.push("Apply SPF 50+ sunscreen and reapply every 2 hours");
    recs.push("Wear UV-protective sunglasses (UV400 or higher)");
    recs.push("Peak UV is between 10am–4pm — seek shade during this window");
  }
  if (uv >= 8) {
    recs.push("Wear a wide-brimmed hat and long-sleeve UV-protective clothing");
    recs.push("Even on cloudy days UV penetrates — don't skip protection");
  }
  if (uv < 3) {
    recs.push("Low UV today — no special protection needed for most skin types");
  }
  return { answer, recommendations: recs };
}

function sleepResponse(ctx: WeatherContext, city: string): {
  answer: string; recommendations: string[];
} {
  const recs: string[] = [];
  const nightTemp = ctx.temp_min;
  const humidity = ctx.humidity;

  let sleepQuality = "comfortable";
  if (nightTemp > 27) sleepQuality = "warm and potentially uncomfortable";
  else if (nightTemp > 22) sleepQuality = "slightly warm";
  else if (nightTemp >= 18) sleepQuality = "ideal for sleep";
  else if (nightTemp >= 14) sleepQuality = "pleasantly cool";
  else sleepQuality = "cold — you'll need bedding";

  const answer = `${city} overnight temperature will drop to ${nightTemp}°C — ${sleepQuality}. Humidity is ${humidity}%, which ${humidity > 70 ? "feels sticky and can disrupt sleep" : "is comfortable for sleeping"}.`;

  if (nightTemp > 27) {
    recs.push("Use AC or a fan set to 24–26°C for optimal sleep temperature");
    recs.push("Avoid heavy meals within 2 hours of bedtime — they raise body temperature");
    recs.push("Light cotton bedding only — avoid synthetic materials that trap heat");
  } else if (nightTemp >= 18 && nightTemp <= 22) {
    recs.push("Ideal sleep temperature — a light sheet is probably all you need");
    recs.push(isRainy(ctx) ? "Light rain sounds may help you sleep — keep a window slightly open" : "Comfortable night ahead");
  } else if (nightTemp < 14) {
    recs.push("Layer up with a warm blanket or duvet");
    recs.push("Warm herbal tea before bed helps your body temperature regulate");
  }
  if (humidity > 75) recs.push("High humidity (" + humidity + "%) makes it feel warmer — a dehumidifier or fan improves comfort significantly");
  return { answer, recommendations: recs };
}

function generalResponse(ctx: WeatherContext, city: string): {
  answer: string; recommendations: string[];
} {
  const recs: string[] = [];
  const { label: aqiText } = aqiLabel(ctx.aqi);

  const answer = pick([
    `Current conditions in ${city}: ${conditionLabel(ctx.weather_code)}, ${ctx.temperature}°C (feels like ${ctx.feels_like}°C). Humidity ${ctx.humidity}%, wind ${ctx.wind_speed} km/h${ctx.wind_direction ? " " + ctx.wind_direction : ""}. ${isRainy(ctx) ? `${ctx.rain_probability}% rain probability with ${ctx.precipitation}mm already fallen. ` : "No rain expected. "}Air quality: ${aqiText} (AQI ${ctx.aqi}). Today ranges from ${ctx.temp_min}°C to ${ctx.temp_max}°C.`,
    `${city} right now — ${ctx.temperature}°C, feels like ${ctx.feels_like}°C, ${conditionLabel(ctx.weather_code)}. Wind: ${ctx.wind_speed} km/h. Humidity: ${ctx.humidity}%. Rain: ${ctx.rain_probability}% chance. UV peaks at ${ctx.uv_max ?? ctx.uv_index}. AQI: ${ctx.aqi} (${aqiText}). Temperature range today: ${ctx.temp_min}–${ctx.temp_max}°C.`,
  ]);

  if (isRainy(ctx)) recs.push("Carry an umbrella — rain is likely");
  if (isHot(ctx)) recs.push("Stay hydrated and avoid peak sun hours (11am–4pm)");
  if (isCold(ctx)) recs.push("Layer up before heading out");
  if (isHighUV(ctx)) recs.push(`UV index peaks at ${ctx.uv_max ?? ctx.uv_index} — apply sunscreen`);
  if (poorAir(ctx)) recs.push(`Air quality is ${aqiText} (AQI ${ctx.aqi}) — limit outdoor exposure if sensitive`);
  if (recs.length === 0) recs.push("Comfortable day — no special precautions needed");
  return { answer, recommendations: recs };
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function generateAssistantResponse(
  question: string,
  ctx: WeatherContext,
  cityName: string,
): { answer: string; confidence: string; recommendations: string[] } {
  const intent = detectIntent(question);

  let result: { answer: string; recommendations: string[] };

  switch (intent) {
    case "umbrella":         result = umbrellaResponse(ctx, cityName); break;
    case "outdoor_exercise": result = outdoorExerciseResponse(ctx, cityName); break;
    case "clothing":         result = clothingResponse(ctx, cityName); break;
    case "farming":          result = farmingResponse(ctx, cityName); break;
    case "trekking":         result = trekkingResponse(ctx, cityName); break;
    case "wash_vehicle":     result = washVehicleResponse(ctx, cityName); break;
    case "sports":           result = sportsResponse(ctx, cityName, question); break;
    case "travel":           result = travelResponse(ctx, cityName); break;
    case "air_quality":      result = airQualityResponse(ctx, cityName); break;
    case "uv_sunscreen":     result = uvResponse(ctx, cityName); break;
    case "sleep":            result = sleepResponse(ctx, cityName); break;
    default:                 result = generalResponse(ctx, cityName); break;
  }

  // Confidence: based on how extreme/clear conditions are
  let confidence = "High";
  const rainProb = ctx.rain_probability;
  if (rainProb >= 40 && rainProb <= 60) confidence = "Moderate — rain probability is uncertain";
  if (isThunderstorm(ctx)) confidence = "High — severe conditions are clear";

  return { answer: result.answer, confidence, recommendations: result.recommendations };
}
