const mongoose = require('mongoose');

const uri1 = "mongodb://adarshdeepsachan_db_user:zHAaBaNj80pNWiGo@ac-nf1ozia-shard-00-00.md130dm.mongodb.net:27017,ac-nf1ozia-shard-00-01.md130dm.mongodb.net:27017,ac-nf1ozia-shard-00-02.md130dm.mongodb.net:27017/Socialautomation?ssl=true&authSource=admin";
const uri2 = "mongodb+srv://adarshdeepsachan_db_user:zHAaBaNj80pNWiGo@socialautomation.md130dm.mongodb.net/Socialautomation?retryWrites=true&w=majority";

async function testUri(name, uri) {
  console.log(`\nTesting connection for: ${name}...`);
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`${name} - CONNECTED SUCCESSFULLY!`);
    await mongoose.disconnect();
  } catch (err) {
    console.error(`${name} - CONNECTION FAILED:`, err.message);
  }
}

async function run() {
  await testUri("Replica Set URI", uri1);
  await testUri("SRV DNS URI", uri2);
}

run();
