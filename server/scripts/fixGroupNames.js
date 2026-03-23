/**
 * fixGroupNames.js — One-time repair: rename plain "Announcements" groups
 * to include the org's name, e.g. "Bhumik Gianani — Announcements".
 *
 * Usage (from /server directory):
 *   node scripts/fixGroupNames.js
 */

require("dotenv").config({ path: __dirname + "/../src/.env" });
const mongoose = require("mongoose");
const Group = require("../src/models/Group");
const User = require("../src/models/User");

async function fix() {
  console.log("🔌 Connecting to MongoDB…");
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ Connected.\n");

  // Find all announcement groups that don't already have the org name embedded
  const groups = await Group.find({
    type: "announcements",
    eventId: null,
  });

  console.log(`Found ${groups.length} announcement group(s) to check.\n`);

  let updated = 0;

  for (const group of groups) {
    const orgUser = await User.findById(group.orgId).select("name");
    const orgName = orgUser?.name || "Organization";
    const expectedName = `${orgName} — Announcements`;

    if (group.name !== expectedName) {
      group.name = expectedName;
      group.description = `General announcements and updates from ${orgName}`;
      await group.save();
      console.log(`  ✅ Renamed to: "${expectedName}"`);
      updated++;
    } else {
      console.log(`  ✓  Already correct: "${group.name}"`);
    }
  }

  console.log(`\n🎉 Done! Updated ${updated} group(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

fix().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
