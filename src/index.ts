import http from "http";
import https from "https";
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { decode } from "./base64";
import config from "./config";
import session from "./middleware/session";
import upgradeHttp from "./middleware/upgrade-http";
import * as authentication from "./middleware/authentication";
import proxy from "./middleware/reverse-proxy";

import "./debug";

const app = express()
    // logging
    .use(morgan("combined"))
    // sessions (cookie authentication)
    .use(session)
    // http -> https
    .all("*", upgradeHttp)
    // Terminating sessions
    .get("/logout", authentication.logout)
    // Initiating sessions
    .post("/login", bodyParser.json(), authentication.login)
    // Not authenticated: Serve local content
    .all("*", authentication.guard)
    // Authenticated: Forward requests to dashboard
    .all("*", proxy);

http.createServer(app).listen(config.host.port.http);
https.createServer({
    key: decode(config.tls.key),
    cert: decode(config.tls.cert)
}, app).listen(config.host.port.https);

console.log("Listening on:");
console.log(`- http://0.0.0.0:${config.host.port.http}`);
console.log(`- https://0.0.0.0:${config.host.port.https}`);

if (process.env.NODE_ENV !== "production")
    console.warn(`Environment is ${process.env.NODE_ENV}`);
