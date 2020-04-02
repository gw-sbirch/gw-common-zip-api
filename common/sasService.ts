/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import https = require("https");
import { Context } from "@azure/functions";
import { IncomingMessage } from "http";
import HttpHelper from "./httpHelper";

class SasService {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    upload(sasUrl: string, contents: Buffer): Promise<string> {
        this.context.log("Uploading to SAS url: " + sasUrl);
        return new Promise<string>((resolve, reject) => {
            const putRebuiltFileRequestOption = {
                method: "PUT",
                port: 443,
                headers: {
                    "x-ms-blob-type": "BlockBlob",
                    "Content-Type": "text/plain",
                    "Content-Length": Buffer.byteLength(contents)
                }
            };

            const putRebuiltFileRequest = https.request(sasUrl, putRebuiltFileRequestOption, (message: IncomingMessage) => {
                if (!HttpHelper.IsSuccessStatusCode(message.statusCode)) {
                    this.context.log("Upload to SAS URL failed, status code: " + message.statusCode);
                    reject("Upload to SAS URL failed, status code: " + message.statusCode);
                }
                else {
                    this.context.log("Upload to SAS URL succeeded, status code: " + message.statusCode);
                    resolve("Upload to SAS URL succeeded, status code: " + message.statusCode);
                }
            });

            putRebuiltFileRequest.on("error", err => { reject(err.message); });
            putRebuiltFileRequest.write(contents);
            putRebuiltFileRequest.end();
        });
    }

    download(sasUrl: string): Promise<Buffer> {
        this.context.log("Downloading from SAS url: " + sasUrl);

        return new Promise<Buffer>((resolve, reject) => {
            const getSasRequest = https.get(sasUrl, (message: IncomingMessage) => {
                HttpHelper.DownloadBody(message)
                    .then(buffer => {
                        this.context.log("Downloaded from SAS url: " + sasUrl);
                        resolve(buffer);
                    })
                    .catch(reason => {
                        this.context.log("Failed to download from SAS url: " + sasUrl);
                        reject(reason);
                    });
            });

            getSasRequest.on("error", err => { reject(err.message); });
        });
    }

    getFileName(sas: string): string {
        return sas.split("/").pop().split("?")[0];
    }
}

export default SasService;