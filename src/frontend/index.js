import "@babel/polyfill";
import "material-design-lite/src/mdlComponentHandler";
import "material-design-lite/src/textfield/textfield";
import "material-design-lite/src/button/button";
import "material-design-lite/src/ripple/ripple";

import xhr from "./xhr";
import * as dom from  "./dom";

import "./style.scss";

function ready(fn) {
    if (document.readyState != "loading")
        fn();
    else if (document.addEventListener)
        document.addEventListener("DOMContentLoaded", fn);
    else
        document.attachEvent("onreadystatechange", function() {
            if (document.readyState != "loading")
                fn();
        });
}

const ValidationResult = {
    success: 0,
    badCredentials: 1,
    otpChallenge: 2,
    badOtp: 3,
    forbidden: 4,
    error: 5
}

/**
 * 
 * @param {*} s 
 * @param {boolean} err 
 */
function setStatus(s, err = false) {
    dom.id("status").textContent = s;
    dom.classIf(err, "status", "error");
}

async function onSignIn() {
    let requireOtp = !dom.hasClass(dom.id("otp").parentNode, "hidden");
    let user = dom.value("user");
    let pwd = dom.value("pwd");
    let otp = requireOtp && dom.value("otp");

    dom.classIf(!user, dom.id("user").parentNode, "is-invalid");
    dom.classIf(!pwd, dom.id("pwd").parentNode, "is-invalid");
    dom.classIf(requireOtp && !otp, dom.id("otp").parentNode, "is-invalid");

    if (requireOtp && !otp) console.log("OTP eingeben!!")

    if (!user || !pwd || requireOtp && !otp)
        return;

    try {
        let result = await xhr("POST", "/login", { user, pwd, otp });
        if (result.status === 200)
            location.reload();
        else if (result.status === 401) {
            if (result.headers.has("x-otp")) {
                if (result.content === ValidationResult.badOtp)
                    setStatus("The security code is invalid.", true);
                else {
                    dom.removeClass(dom.id("otp").parentNode, "hidden");
                    setStatus("Enter the verification code generated on your device or in your app.");
                }
            } else
                setStatus("The provided credentials are invalid.", true);
        } else if (result.status === 403) {
            setStatus("You are not allowed to enter the Kubernetes Dashboard.", true);
        } else
            throw `Unexpected response: ${result.status}`
    } catch {
        setStatus("Can't login right now. Contact the administrator if this problem persists.", true)
    }
}

ready(function() {
    const submitOnEnter = e => e.keyCode == 13 && onSignIn();
    [ "user", "pwd", "otp" ].forEach(t => dom.id(t).addEventListener("keypress", submitOnEnter));
    dom.id("user").addEventListener("input", () => {
        dom.addClass(dom.id("otp").parentNode, "hidden");
    });
    dom.id("signin").addEventListener("click", onSignIn);
});
