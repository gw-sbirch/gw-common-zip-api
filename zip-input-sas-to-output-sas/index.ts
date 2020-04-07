// import appInsights = require("applicationinsights");
// appInsights.setup("<instrumentation_key>");
// appInsights.start();

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { ZipService, ZipObject } from "../common/ZipHelper";
import SasService from "../common/sasService";

const handleZipRequest = (context: Context, body: Readonly<BlobsToZipBody>): Promise<void> => {
    return new Promise((resolve, reject) => {
        const sasService = new SasService(context);
        const zipService = new ZipService(context);

        const downloadTasks = body.inputObjectsToZipSas.map((inputSas: string): Promise<ZipObject> => {
            return sasService.download(inputSas).then(fileBuffer => {
                const fileName = sasService.getFileName(inputSas);
                return new ZipObject(fileName, fileBuffer);
            });
        });

        return Promise.all(downloadTasks).then((zipObjects: Array<ZipObject>) => {
            context.log("Downloading input files has finished. Zipping files.");

            return zipService.write(zipObjects)
                .then(zip => {
                    sasService.upload(body.outputZipSas, zip);
                    context.res = {
                        body: "Successfully Zipped requested files"
                    };
                    resolve();
                });
        })
            .catch(reason => {
                context.log(reason);
                reject(reason);
            });
    });
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("HTTP trigger function processed a request.");

    return handleZipRequest(context, req.body);
};

type BlobsToZipBody = {
    inputObjectsToZipSas: Array<string>;
    outputZipSas: string;
};

export default httpTrigger;