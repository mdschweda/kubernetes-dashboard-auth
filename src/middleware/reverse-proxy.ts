import proxy from "http-proxy-middleware";
import config from "../config";

/**
 * A reverse proxy middleware that retrieves resources from an upstream server.
 */
export default proxy({
    target: config.upstream,
    changeOrigin: true,
    followRedirects: true,
    secure: false,
});
