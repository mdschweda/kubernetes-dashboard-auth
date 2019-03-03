import https from "https";
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { decode } from "./base64";
import config from "./config";
import validate from "./config-validation";
import session from "./middleware/session";
import * as authentication from "./middleware/authentication";
import proxy from "./middleware/reverse-proxy";

import "./debug";

let app = express()
    // logging
    .use(morgan("combined"))
    // sessions (cookie authentication)
    .use(session)
    // Terminating sessions
    .get("/logout", authentication.logout)
    // Initiating sessions
    .post("/login", bodyParser.json(), authentication.login)
    // Not authenticated: Serve local content
    .all("*", authentication.guard)
    // Authenticated: Forward requests to dashboard
    .all("*", proxy);

if (process.env.NODE_ENV !== "production")
    console.warn(`Environment is ${process.env.NODE_ENV}`);

validate(config).then(({ errors, warnings }) => {
    if (errors.length) {
        console.error("⛔\0 Please, revise your configuration:")
    
        for (let e of errors)
            console.error(`• ${e}`);
    
        console.error("See https://github.com/mdschweda/kubernetes-dashboard-auth for details.");
        process.exit(1);
    } else if (warnings.length) {
        console.warn("⚠\0 Configuration warnings:")

        for (let e of warnings)
            console.warn(`• ${e}`);

        console.warn("See https://github.com/mdschweda/kubernetes-dashboard-auth for details.");
    }

    const port = process.env.NODE_ENV === "production" ? 443 : 8081;

    https.createServer({
        cert: decode(config.tls.cert),
        key: decode(config.tls.key)
    }, app).listen(port);
    
    console.log(`Listening on https://0.0.0.0:${port}`);
});
