import { encode } from "./base64";
import session from "express-session";
import config from "./config";

export default session({
    secret: encode(config.tls.key),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
});
