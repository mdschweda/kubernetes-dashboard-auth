/**
 * @typedef {Object} XhrResponse
 * @property {number} status
 * @property {any} content
 * @property {Map<string, string>} headers
 */

/**
 * 
 * @param {string} method 
 * @param {string} path 
 * @param {any} body
 * @returns {Promise.<XhrResponse>} path 
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
