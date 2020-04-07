/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import https = require("https");
import { Context } from "@azure/functions";
import { IncomingMessage } from "http";
import HttpHelper from "./httpHelper";

/**
 * A Service that provides functionality around SAS URL's.
 */
class SasService {
    context: Context;

    /**
     * Constructs an instance of the SasService
     * @param context The function context this service is running under
     */
    constructor(context: Context) {
        this.context = context;
    }

    /**
     * Constructs a URL with the provided details. The Signature determines what we can do with it.
     * @param sig The SAS Signature, this is typically the Query parameters appended to the resource
     * @param account Name of the account the resource is contained in
     * @param container Name of the container the resource is contained in
     * @param blob The name of the resource itself
     */
    constructUrl(sig: string, account: string, container: string, blob: string) {
        return `https://${account}.blob.core.windows.net/${container}/${blob}${sig}`;
    }

    /**
     * Performs a PUT operation on the specified SAS URL
     * @param sasUrl The Complete SAS url including signature and resource.
     * @param contents A buffer containing the raw contents to put
     */
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

    /**
     * Performs a GET operation on the specified SAS URL.
     * @param sasUrl The Complete SAS url including signature and resource.
     */
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

    /**
     * Extracts the name of the resource from the SAS URL
     * @param sasUrl The Complete SAS url including signature and resource.
     */
    getFileName(sasUrl: string): string {
        return sasUrl.split("/").pop().split("?")[0];
    }
}

export default SasService;