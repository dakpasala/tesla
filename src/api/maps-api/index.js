import { getAllTransportOptions } from "./directions.js";

const origin = "123 Main St, San Jose, CA";
const destination = "3500 Deer Creek Rd, Palo Alto, CA"; 

(async () => {
  const routes = await getAllTransportOptions(origin, destination);

  for (const [mode, options] of Object.entries(routes)) {
    console.log(`\n=== ${mode.toUpperCase()} ROUTES ===`);
    for (const r of options) {
      console.log(`Summary: ${r.summary}`);
      console.log(`Distance: ${r.distance}`);
      console.log(`Duration: ${r.duration}`);
      console.log();
    }
  }
})();
