import "@babel/polyfill";
import "material-design-lite/src/mdlComponentHandler";
import "material-design-lite/src/textfield/textfield";
import "material-design-lite/src/button/button";
import "material-design-lite/src/ripple/ripple";

import xhr from "./xhr";
import * as dom from  "./dom";

import "./style.scss";

function ready(fn) {
    if (document.readyState !== "loading")
        fn();
    else if (document.addEventListener)
        document.addEventListener("DOMContentLoaded", fn);
    else
        document.attachEvent("onreadystatechange", function() {
            if (document.readyState !== "loading")
                fn();
        });
}

/**
 * Possible errors during an user authentication.
 */
const AuthenticationError = {
    /** The provided credentials were invalid. */
    badCredentials: "BadCredentials",
    /** The user has been asked to enter an validation code. */
    otpChallenge: "OtpChallenge",
    /** The provided validation code was invalid. */
    badOtp: "BadOtp",
    /** The authenticated user is not allowed to use the resource. */
    forbidden: "Forbidden",
    /** An error occured while validating the user credentials. */
    other: "Other"
}

/**
 * Sets the status label text and style.
 * @param {*} s The status to display.
 * @param {boolean} err `true` if the status is an error. Otherwise `false`.
 */
function setStatus(s, err = false) {
    dom.id("status").textContent = s;
    dom.classIf(err, "status", "error");
}

/** Event handler for the "Sign in" button */
async function onSignIn() {
    let requireOtp = !dom.hasClass(dom.id("otp").parentNode, "hidden");
    let user = dom.value("user");
    let pwd = dom.value("pwd");
    let otp = requireOtp && dom.value("otp");

    dom.classIf(!user, dom.id("user").parentNode, "is-invalid");
    dom.classIf(!pwd, dom.id("pwd").parentNode, "is-invalid");
    dom.classIf(requireOtp && !otp, dom.id("otp").parentNode, "is-invalid");

    if (!user || !pwd || requireOtp && !otp)
        return;

    try {
        let result = await xhr("POST", "/login", { user, pwd, otp });
        if (result.status === 200)
            location.reload();
        else if (result.status === 401) {
            if (result.headers.has("x-otp")) {
                if (result.content === AuthenticationError.badOtp)
                    setStatus("The security code is invalid.", true);
                else {
                    setStatus("Enter the verification code generated on your device or in your app.");
                    dom.removeClass(dom.id("otp").parentNode, "hidden");
                    dom.id("otp").focus();
                }
            } else
                setStatus("The provided credentials are invalid.", true);
        } else if (result.status === 403) {
            setStatus("You are not allowed to enter the Kubernetes Dashboard.", true);
        } else
            throw `Unexpected response: ${result.status}`;
    } catch {
        setStatus("Cannot login right now. Contact the administrator if this problem persists.", true);
    }
}

ready(function() {
    const submitOnEnter = e => e.keyCode === 13 && onSignIn();
    [ "user", "pwd", "otp" ].forEach(t => dom.id(t).addEventListener("keypress", submitOnEnter));
    dom.id("user").addEventListener("input", () => {
        dom.addClass(dom.id("otp").parentNode, "hidden");
    });
    dom.id("signin").addEventListener("click", onSignIn);
});
