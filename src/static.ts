import { promises as fs } from "fs";
import { join } from "path";
import { Response } from "express";
import status from "http-status-codes";

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
