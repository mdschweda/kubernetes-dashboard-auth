import { encode } from "../base64";
import session from "express-session";
import config from "../config";

/**
 * A middleware that establishes and ends cookie based sessions.
 * @param req The request object.
 * @param res The response object.
 * @param next The next middleware in the pipeline.
 */
export default session({
    secret: encode(config.tls.key),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
});
