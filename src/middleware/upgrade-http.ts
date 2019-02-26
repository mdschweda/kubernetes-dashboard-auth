import { Request, Response, NextFunction } from "express";
import config from "../config";

/**
 * A middleware that redirects http to https requests.
 * @param req The request object.
 * @param res The response object.
 * @param next The next middleware in the pipeline.
 */
export default function (req: Request, res: Response, next: NextFunction) {
    if (req.secure)
        return next();

    if (config.host.port.https !== 443)
        res.redirect(`https://${req.hostname}:${config.host.port.https}${req.url}`);
    else
        res.redirect(`https://${req.hostname}${req.url}`);
}
