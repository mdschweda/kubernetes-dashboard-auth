import "@babel/polyfill";
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

    dom.classIf(!user, "user", "invalid");
    dom.classIf(!pwd, "pwd", "invalid");
    dom.classIf(requireOtp && !otp, "otp", "invalid");

    if (!user || !pwd || requireOtp && !otp)
        return;

    try {
        let result = await xhr("POST", "/login", { user, pwd, otp });
        if (result.status === 200)
            location.reload();
        else if (result.status === 401) {
            if (result.headers.has("x-otp")) {
                setError("Please, enter your security code.");
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
