import { inspect } from "util";
import config from "./config";

// node /app/index.js -sc

let args = process.argv.slice(2);
if (args.includes("--show-config") || args.includes("-sc")) {
    console.log(inspect(config, {
        colors: true,
        depth: Infinity,
        compact: false
    }));
    process.exit(0);
}
