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

function setError(s) {
    let err = dom.q("p.err");
    err.textContent = s;
    (s ? dom.removeClass : dom.addClass)(err, "hidden");
}

async function onSignIn() {
    let requireOtp = !dom.id("otp").disabled;
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
                if (result.content === ValidationResult.badOtp)
                    setError("Invalid security code.");
                else {
                    dom.id("otp").removeAttribute("disabled");
                    dom.removeClass(dom.id("otp").parentNode, "hidden");
                    setError("Please, enter your security code.");
                }
            } else
                setError("Invalid credentials.");
        } else if (result.status === 403) {
            setError("You are not allowed to enter the Kubernetes Dashboard");
        } else
            throw `Unexpected response: ${result.status}`
    } catch {
        setError("Can't login right now.")
    }
}

ready(function() {
    dom.id("signin").addEventListener("click", onSignIn);
});
