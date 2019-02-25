import { Request, Response, NextFunction } from "express";
import config from "../config";

export default function (req: Request, res: Response, next: NextFunction) {
    if (req.secure)
        return next();

    if (config.host.port.https !== 443)
        res.redirect(`https://${req.hostname}:${config.host.port.https}${req.url}`);
    else
        res.redirect(`https://${req.hostname}${req.url}`);
}
