import { Request, Response, NextFunction } from "express";
import status from "http-status-codes";
import sendStatic from "../static";
import config from "../config";
import { ValidationResult, AuthenticationProviderFactory } from "../authentication/provider";

// const sendStatic = express.static("static");

export function logout(req: Request, res: Response) {
    if (req.session && req.session.authenticated)
        req.session.destroy(() => console.log("Session ended"));

    res.redirect("/");
}

export async function login(req: Request, res: Response) {
    var user = req.body && req.body.user as string || undefined;
    var pwd = req.body && req.body.pwd as string || undefined;
    var otp = req.body && req.body.otp as string || undefined;

    if (!(user && pwd))
        return res.sendStatus(status.BAD_REQUEST);

    let provider = await AuthenticationProviderFactory.getProvider(config.authentication.provider);
    if (!provider)
        return res.status(status.INTERNAL_SERVER_ERROR).json(ValidationResult.Error);

    let result = await provider.authenticate(user, pwd, otp);
    let code = ({
        [ValidationResult.Success]: status.OK,
        [ValidationResult.BadCredentials]: status.UNAUTHORIZED,
        [ValidationResult.OtpChallenge]: status.UNAUTHORIZED,
        [ValidationResult.BadOtp]: status.UNAUTHORIZED,
        [ValidationResult.Forbidden]: status.FORBIDDEN,
        [ValidationResult.Error]: status.INTERNAL_SERVER_ERROR
    })[result];

    if (req.session && result === ValidationResult.Success)
        req.session.authenticated = true;
    else if (result === ValidationResult.OtpChallenge || result === ValidationResult.BadOtp)
        res.setHeader("x-otp", "required");

    return res.status(code).json(result);
}

export async function guard(req: Request, res: Response, next: NextFunction) {
    if (!(req.session && req.session.authenticated)) {
        await sendStatic(res, req.path);
        // res.redirect("/");
    } else {
        req.headers.authorization = `Bearer ${config.authentication.token}`
        next();
    }
}
