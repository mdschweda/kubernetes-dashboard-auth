import https from "https";
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { decode } from "./base64";
import config from "./config";
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

const port = process.env.NODE_ENV === "production" ? 443 : 8081;

https.createServer({
    cert: decode(config.tls.cert),
    key: decode(config.tls.key)
}, app).listen(port);

if (config.tls.generated)
    console.warn("Using a generated certificate.");

console.log(`Listening on https://0.0.0.0:${port}`);

if (process.env.NODE_ENV !== "production")
    console.warn(`Environment is ${process.env.NODE_ENV}`);
