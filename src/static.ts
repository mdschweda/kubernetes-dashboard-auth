import { promises as fs } from "fs";
import { join } from "path";
import { Response } from "express";
import status from "http-status-codes";

/**
 * Serves static content from `/static`
 * @param res The response object.
 * @param paths Path to join.
 * @returns {Promise<boolean>} A promise representing the asynchronous operation. The result contains a value
 * indicating if the requested path could be retrieved.
 */
export default async function (res: Response, ...paths: string[]): Promise<boolean> {
    paths = !paths || paths.length === 1 && (!paths[0] || paths[0] == "/") ?
        [__dirname, "static", "index.html"] : [__dirname, "static", ...paths];

    try {
        let reqFile = join(...paths);
        var stat = await fs.lstat(reqFile);
        if (!stat.isFile())
            throw "Not a file";

        res.sendFile(reqFile)
        return true;
    } catch (e) {
        res.sendStatus(status.NOT_FOUND);
        return false;
    }
}
