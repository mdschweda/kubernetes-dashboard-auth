import http from "http";
import https from "https";
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import config from "./config";
import session from "./session";
import upgradeHttp from "./middleware/upgrade-http";
import * as authentication from "./middleware/authentication";
import proxy from "./middleware/reverse-proxy";

const app = express()
    .use(morgan("combined"))
    .use(session)
    .all("*", upgradeHttp)
    .get("/logout", authentication.logout)
    .post("/login", bodyParser.json(), authentication.login)
    .all("*", authentication.guard)
    .all("*", proxy);

http.createServer(app).listen(config.host.port.http);
https.createServer({
    key: config.tls.key,
    cert: config.tls.crt
}, app).listen(config.host.port.https);

console.log("Listening on:");
console.log(`- http://0.0.0.0:${config.host.port.http}`);
console.log(`- https://0.0.0.0:${config.host.port.https}`);
