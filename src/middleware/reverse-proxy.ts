import proxy from "http-proxy-middleware";
import config from "../config";

const options = {
    target: config.upstream,
    changeOrigin: true,
    followRedirects: true,
    secure: false,
};

/**
 * A reverse proxy middleware that retrieves resources from an upstream server.
 */
export default proxy(options);
