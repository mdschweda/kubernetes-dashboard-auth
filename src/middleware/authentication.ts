import { Request, Response, NextFunction } from "express";
import status from "http-status-codes";
import sendStatic from "../static";
import config from "../config";
import { AuthenticationResult, AuthenticationProviderFactory } from "../authentication/provider";

/**
 * Logs out an authenticated user.
 * 
 * GET `/logout/`
 * @param req The request object.
 * @param res The response object.
 */
export function logout(req: Request, res: Response) {
    if (req.session && req.session.authenticated)
        req.session.destroy(() => console.log("Session ended"));

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
    var user = req.body && req.body.user as string || undefined;
    var pwd = req.body && req.body.pwd as string || undefined;
    var otp = req.body && req.body.otp as string || undefined;

    if (!(user && pwd))
        return res.sendStatus(status.BAD_REQUEST);

    let provider = await AuthenticationProviderFactory.getProvider(config.auth.provider);
    if (!provider)
        return res.status(status.INTERNAL_SERVER_ERROR).json(AuthenticationResult.Error);

    let result = await provider.authenticate(user, pwd, otp);
    let code = ({
        [AuthenticationResult.Success]: status.OK,
        [AuthenticationResult.BadCredentials]: status.UNAUTHORIZED,
        [AuthenticationResult.OtpChallenge]: status.UNAUTHORIZED,
        [AuthenticationResult.BadOtp]: status.UNAUTHORIZED,
        [AuthenticationResult.Forbidden]: status.FORBIDDEN,
        [AuthenticationResult.Error]: status.INTERNAL_SERVER_ERROR
    })[result];

    if (req.session && result === AuthenticationResult.Success)
        req.session.authenticated = true;
    else if (result === AuthenticationResult.OtpChallenge || result === AuthenticationResult.BadOtp)
        res.setHeader("x-otp", "required");

    return res.status(code).json(result);
}

/**
 * A middleware that retrieves resources from the upstream server when the request is authenticated
 * and blocks access otherwise.
 * @param req The request object.
 * @param res The response object.
 * @param next The next middleware in the pipeline.
 */
export async function guard(req: Request, res: Response, next: NextFunction) {
    if (!(req.session && req.session.authenticated))
        await sendStatic(res, req.path);
    else {
        req.headers.authorization = `Bearer ${config.auth.token}`
        next();
    }
}
