import proxy from "http-proxy-middleware";
import config from "../config";

const options = {
    target: config.upstream,
    changeOrigin: true,
    followRedirects: true,
    secure: false,
};

export default proxy(options);
