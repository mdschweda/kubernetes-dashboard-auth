/**
 * @typedef {Object} XhrResponse
 * @property {number} status The status code of the response.
 * @property {any} content The content of the response.
 * @property {Map<string, string>} headers Tge headers of the response.
 */

/**
 * Make an AJAX request.
 * @param {string} method The http method of the request.
 * @param {string} path The server path of the request.
 * @param {any} body The content of the request.
 * @returns {Promise.<XhrResponse>} The server response.
 */
export default function xhr(method, path, body = undefined) {
    return new Promise((resolve, reject) => {
        var req = new XMLHttpRequest();

        req.addEventListener("load", () => {
            let headers = new Map();
            let allHeaders = req.getAllResponseHeaders();
            if (allHeaders) {
                for (var h of allHeaders.split(/\r?\n/).filter(s => s)) {
                    h = h.split(":", 2);
                    headers.set(h[0], h[1] && h[1].trim() || "");
                }
            }

            resolve({
                status: req.status,
                content: req.response,
                headers: headers
            });
        });
        req.addEventListener("timeout", reject);
        req.addEventListener("error", reject);
        req.addEventListener("abort", reject);

        req.open(method, path);

        if (body)
            req.setRequestHeader("Content-Type", "application/json");

        req.send(body !== undefined && JSON.stringify(body));
    });
}
