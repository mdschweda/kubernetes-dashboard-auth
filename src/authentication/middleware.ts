import { Request, Response, NextFunction } from "express";
import status from "http-status-codes";
import sendStatic from "../static";
import config from "../config";
import { AuthenticationProviderFactory } from "./provider";
import { AuthenticationError } from "./authentication";
import tokenCache from "./token-cache";

/**
 * Logs out an authenticated user.
 * 
 * GET `/logout/`
 * @param req The request object.
 * @param res The response object.
 */
export function logout(req: Request, res: Response) {
    if (req.session && req.session.token) {
        let username = req.session.username;
        req.session.destroy(() => console.log(`[Session] Session for ${username} terminated.`));
    }

    res.redirect("/");
}

/**
 * Authenticates an user.
 * 
 * POST `/login/`
 * @param req The request object.
 * @param res The response object.
 */
export async function login(req: Request, res: Response) {
    let user = req.body && req.body.user as string || undefined;
    let pwd = req.body && req.body.pwd as string || undefined;
    let otp = req.body && req.body.otp as string || undefined;

    if (!(user && pwd))
        return res.sendStatus(status.BAD_REQUEST);

    let provider = await AuthenticationProviderFactory.getProvider(config.auth.provider);
    if (!provider)
        return res.status(status.INTERNAL_SERVER_ERROR).json(AuthenticationError.Other);

    let auth = await provider.authenticate(user, pwd, otp);
    let code = auth.error && ({
        [AuthenticationError.BadCredentials]: status.UNAUTHORIZED,
        [AuthenticationError.OtpChallenge]: status.UNAUTHORIZED,
        [AuthenticationError.BadOtp]: status.UNAUTHORIZED,
        [AuthenticationError.Forbidden]: status.FORBIDDEN,
        [AuthenticationError.Other]: status.INTERNAL_SERVER_ERROR
    })[auth.error] || status.OK;

    if (req.session && !auth.error) {
        let sa = auth.getServiceAccount();
        if (!sa)
            return res.status(status.FORBIDDEN).json(AuthenticationError.Forbidden);
        else {
            let token = await tokenCache.getToken(sa);
            if (!token) {
                console.error(`[Auth] Couldn't retrieve access token for service account ${sa.fqn}`);
                return res.status(status.INTERNAL_SERVER_ERROR).json(AuthenticationError.Other);
            } else {
                req.session.token = token;
                req.session.username = auth.username;
                console.log(`[Auth] Authenticated ${auth.username} as ${sa.fqn}.`);
                console.log("[Session] Session started.");
            }
        }
    } else if (auth.error === AuthenticationError.OtpChallenge || auth.error === AuthenticationError.BadOtp) {
        res.setHeader("x-otp", "required");
        console.log("[Auth] Two factor authentication challenge.")
    }

    return res.status(code).json(auth.error);
}

/**
 * A middleware that serves local content for unauthenticated requests.
 * @param req The request object.
 * @param res The response object.
 * @param next The next middleware in the pipeline.
 */
export async function guard(req: Request, res: Response, next: NextFunction) {
    if (!(req.session && req.session.token))
        await sendStatic(res, req.path);
    else {
        req.headers.authorization = `Bearer ${req.session.token}`;
        next();
    }
}
