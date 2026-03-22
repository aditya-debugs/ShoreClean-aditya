/**
 * seedEvents.js — Seed realistic coastal cleanup events into the database.
 *
 * Usage (from the /server directory):
 *   node scripts/seedEvents.js
 *
 * It will:
 *  1. Connect to MongoDB
 *  2. Find the first org-role user to use as the organizer
 *  3. Insert 12 rich, realistic events (upcoming + recently past)
 *  4. Auto-create an event-specific chat group for each event
 */

require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const Event = require("../src/models/Event");
const Group = require("../src/models/Group");
const User = require("../src/models/User");

// ─── Helpers ───────────────────────────────────────────────────────────────

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

// Unsplash images depicting beach cleanups, volunteers, and ocean conservation
const BANNERS = [
  // Volunteers picking up trash on a beach
  "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80",
  // Group of people doing a coastal cleanup
  "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80",
  // Volunteers with garbage bags on the shore
  "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=1200&q=80",
  // Person collecting plastic waste near the ocean
  "https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=1200&q=80",
  // Hands sorting collected plastic on a beach
  "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=1200&q=80",
  // Community volunteers working together on shoreline
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80",
  // Ocean plastic pollution and cleanup effort
  "https://images.unsplash.com/photo-1567606404787-11ca6ef07360?auto=format&fit=crop&w=1200&q=80",
  // Volunteers in high-visibility vests cleaning beach
  "https://images.unsplash.com/photo-1509099652299-30938b0aeb63?auto=format&fit=crop&w=1200&q=80",
  // Kids and adults volunteering on sandy shore
  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
  // Early morning cleanup crew on the coast
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
  // Filled trash bags lined up after a cleanup
  "https://images.unsplash.com/photo-1604682769580-b2c51aaeb9f8?auto=format&fit=crop&w=1200&q=80",
  // Wide shot of cleanup volunteers spread across beach
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80",
];

const EVENTS = [
  {
    title: "Juhu Beach Grand Cleanup Drive",
    description:
      "Join hundreds of volunteers for Mumbai's largest annual beach cleanup at Juhu! We'll be collecting plastic waste, fishing nets, and debris across a 2 km stretch. Gloves, bags, and refreshments provided. Let's make Mumbai's most iconic beach shine again. Every piece of trash you pick up is a step toward a cleaner ocean.",
    location: "Juhu Beach, Mumbai, Maharashtra",
    startOffset: 5,
    durationHours: 4,
    capacity: 200,
    tags: ["plastic-free", "mumbai", "community", "beach"],
    bannerIdx: 0,
  },
  {
    title: "Versova Beach Micro-Plastics Mission",
    description:
      "Micro-plastics are the invisible threat in our oceans. This focused cleanup at Versova targets fine plastic particles along the shoreline. Participants will use specialized sieves and tools to collect micro-plastics. Scientific data collected during this event will be submitted to MPCB. A post-cleanup briefing on ocean health will be conducted.",
    location: "Versova Beach, Andheri West, Mumbai",
    startOffset: 12,
    durationHours: 3,
    capacity: 80,
    tags: ["micro-plastics", "science", "research", "mumbai"],
    bannerIdx: 1,
  },
  {
    title: "Goa Calangute Shoreline Sweep",
    description:
      "Goa's busiest tourist beach needs our help. After the peak tourist season, Calangute is littered with bottles, wrappers, and single-use plastics. This mega-sweep will cover the full 7 km of Calangute-Baga coastline. We partner with local shacks and the Goa Tourism Board to ensure a thorough cleanup. T-shirts and certificates for all participants!",
    location: "Calangute Beach, North Goa",
    startOffset: 18,
    durationHours: 5,
    capacity: 300,
    tags: ["goa", "tourism", "mega-event", "certificate"],
    bannerIdx: 2,
  },
  {
    title: "Marina Beach Dawn Patrol",
    description:
      "The world's second longest beach deserves the best care. We start at sunrise before the crowds arrive. Teams will be spread across 10 km of Marina Beach collecting waste and logging pollution data. This is a recurring monthly initiative by Chennai Clean Coasts. Breakfast for all volunteers after the cleanup!",
    location: "Marina Beach, Chennai, Tamil Nadu",
    startOffset: 8,
    durationHours: 3,
    capacity: 150,
    tags: ["chennai", "dawn-patrol", "monthly", "data-collection"],
    bannerIdx: 3,
  },
  {
    title: "Kovalam Fishing Community Cleanup",
    description:
      "This unique event brings together local fishing communities and environmental volunteers. We'll clean the beach and the fishing harbor, separate biodegradable waste from plastics, and conduct a workshop on sustainable fishing practices. Organized in partnership with the Kerala Fishermen's Welfare Board. Lunch provided by the local panchayat.",
    location: "Kovalam Beach, Thiruvananthapuram, Kerala",
    startOffset: 25,
    durationHours: 6,
    capacity: 120,
    tags: ["kerala", "fishing-community", "workshop", "partnership"],
    bannerIdx: 4,
  },
  {
    title: "Puri Beach Heritage Cleanup",
    description:
      "Puri is both a religious site and an ecological treasure. This cleanup focuses on the areas around the Jagannath Temple beach, where festival waste accumulates. We work with the temple administration and Odisha Tourism to restore the beach to its natural state. A cultural program celebrating the ocean will follow the cleanup.",
    location: "Puri Beach, Odisha",
    startOffset: 30,
    durationHours: 5,
    capacity: 250,
    tags: ["odisha", "heritage", "religious-site", "cultural"],
    bannerIdx: 5,
  },
  {
    title: "Andaman Radhanagar Beach Deep Clean",
    description:
      "Radhanagar is Asia's best beach — let's keep it that way. This exclusive cleanup is limited to 50 volunteers due to protected forest regulations. We'll snorkel to collect underwater debris as well as surface cleaning. A marine biologist will guide participants through coral reef health observation. Apply early — spots fill up fast!",
    location: "Radhanagar Beach, Havelock Island, Andaman & Nicobar",
    startOffset: 45,
    durationHours: 8,
    capacity: 50,
    tags: ["andaman", "snorkeling", "protected-area", "premium"],
    bannerIdx: 6,
  },
  {
    title: "Vizag RK Beach Volunteer Sprint",
    description:
      "A fast-paced 2-hour blitz cleanup at Visakhapatnam's most popular beach. Perfect for first-time volunteers and school groups. Teams of 10 compete to collect the most waste in the shortest time. Winners get special ShoreClean medals. All collected waste is weighed and data submitted to the AP Coastal Management Authority.",
    location: "RK Beach, Visakhapatnam, Andhra Pradesh",
    startOffset: 14,
    durationHours: 2,
    capacity: 100,
    tags: ["vizag", "sprint", "competition", "students"],
    bannerIdx: 7,
  },
  {
    title: "Pondicherry French Quarter Beach Cleanup",
    description:
      "The tranquil beaches of Pondicherry face growing pressure from tourism. This cleanup focuses on the promenade beach and rocky shores near the French Quarter. We collaborate with the Alliance Française and local eco-hotels. A guided heritage walk through the French Quarter follows the cleanup for all participants.",
    location: "Promenade Beach, Puducherry",
    startOffset: 22,
    durationHours: 3,
    capacity: 90,
    tags: ["pondicherry", "heritage-walk", "tourism", "eco"],
    bannerIdx: 8,
  },
  {
    title: "Lakshadweep Coral Coast Rescue",
    description:
      "One of India's most pristine marine ecosystems needs urgent protection. This special expedition cleanup combines beach clearing with coral reef monitoring. Participants must be certified snorkelers or divers. Limited to 30 people. Accommodation at the island eco-resort is included. A rare chance to contribute to conservation at the edge of the Indian Ocean.",
    location: "Agatti Island Beach, Lakshadweep",
    startOffset: 60,
    durationHours: 10,
    capacity: 30,
    tags: ["lakshadweep", "coral", "diving", "expedition"],
    bannerIdx: 9,
  },
  {
    title: "Diu Nagoa Beach Sunset Cleanup",
    description:
      "Diu's cleanest beach deserves to stay that way. An evening cleanup timed to end at sunset, making it a beautiful and rewarding experience. Families and children are especially welcome. Local artists will paint murals on collected plastic bottles, turning waste into art. A bonfire and folk music session closes the evening.",
    location: "Nagoa Beach, Diu, Dadra & Nagar Haveli and Daman & Diu",
    startOffset: 16,
    durationHours: 3,
    capacity: 100,
    tags: ["diu", "family-friendly", "art", "sunset"],
    bannerIdx: 10,
  },
  {
    title: "Mahabalipuram Shore Temple Beach Restoration",
    description:
      "The ancient Shore Temple at Mahabalipuram sits on a beach that has seen centuries of history — and recent decades of pollution. This restoration cleanup targets the heritage shoreline, working carefully around the UNESCO World Heritage Site. Archaeological Survey of India officials will brief participants on the site's significance. Certificates issued by ASI.",
    location: "Shore Temple Beach, Mahabalipuram, Tamil Nadu",
    startOffset: 35,
    durationHours: 4,
    capacity: 75,
    tags: ["mahabalipuram", "UNESCO", "heritage", "certificate"],
    bannerIdx: 11,
  },
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🔌 Connecting to MongoDB…");
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ Connected.\n");

  // Find the first org user to be the organizer
  const organizer = await User.findOne({ role: "org" });
  if (!organizer) {
    console.error("❌ No org-role user found. Please create an organizer account first, then re-run this script.");
    process.exit(1);
  }
  console.log(`👤 Using organizer: ${organizer.name} (${organizer.email})\n`);

  // Remove previously seeded events (identified by the [SEEDED] tag)
  const removed = await Event.deleteMany({ tags: "__seeded__" });
  if (removed.deletedCount > 0) {
    console.log(`🗑  Removed ${removed.deletedCount} previously seeded event(s).`);
  }

  let created = 0;

  for (const e of EVENTS) {
    const startDate = daysFromNow(e.startOffset);
    const endDate = new Date(startDate.getTime() + e.durationHours * 60 * 60 * 1000);

    const event = await Event.create({
      title: e.title,
      description: e.description,
      location: e.location,
      startDate,
      endDate,
      capacity: e.capacity,
      organizer: organizer._id,
      bannerUrl: BANNERS[e.bannerIdx],
      tags: [...e.tags, "__seeded__"],
      status: "published",
    });

    // Create the event's chat group
    await Group.create({
      name: `${e.title} — Chat`,
      description: `Event discussion group for ${e.title}`,
      type: "event",
      icon: "🏖️",
      color: "#0891B2",
      settings: { isPublic: false, allowFileUploads: false, allowMentions: true },
      orgId: organizer._id,
      eventId: event._id,
      createdBy: organizer._id,
      members: [{ userId: organizer._id, role: "admin", joinedAt: new Date() }],
      isActive: true,
    });

    console.log(`  ✅ Created: "${e.title}" (${startDate.toDateString()})`);
    created++;
  }

  console.log(`\n🎉 Done! Seeded ${created} events with their chat groups.`);
  console.log(`   Organizer: ${organizer.name}`);
  console.log(`   To remove seeded data, re-run this script (it auto-cleans on each run).\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
