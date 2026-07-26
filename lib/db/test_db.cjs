const mongoose = require('mongoose');

const uri = "mongodb+srv://adarshdeepsachan_db_user:zHAaBaNj80pNWiGo@ac-nf1ozia.md130dm.mongodb.net/Socialautomation?retryWrites=true&w=majority";

async function run() {
  console.log("Testing SRV with cluster ID...");
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("SUCCESSFULLY CONNECTED!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("CONNECTION FAILED:", err.message);
  }
}

run();
