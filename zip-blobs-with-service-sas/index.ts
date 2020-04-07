// import appInsights = require("applicationinsights");
// appInsights.setup("<instrumentation_key>");
// appInsights.start();

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { ZipService, ZipObject } from "../common/ZipHelper";
import SasService from "../common/sasService";

const handleZipRequest = async (context: Context, body: Readonly<BlobsToZipBody>): Promise<void> => {
    const sasService = new SasService(context);
    const zipService = new ZipService(context);
    
    const outputSasUrl = sasService.constructUrl(body.outputServiceSasSig, body.outputAccountName, body.outputContainer, body.outputBlob);

    const zipObjects = await Promise.all(body.inputObjects.map(async (inputObject: ContainerBlob): Promise<ZipObject> => {
        const sasUrl = sasService.constructUrl(body.inputServiceSasSig, body.inputAccountName, inputObject.container, inputObject.blob);
        const fileBuffer = await sasService.download(sasUrl);
        const fileName = sasService.getFileName(sasUrl);
        return new ZipObject(fileName, fileBuffer);
    }));

    const zipFileBuffer = await zipService.write(zipObjects);
    await sasService.upload(outputSasUrl, zipFileBuffer);
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("HTTP trigger function processed a request.");

    return handleZipRequest(context, req.body);
};

type BlobsToZipBody = {
    inputServiceSasSig: string;
    inputAccountName: string;
    inputObjects: Array<ContainerBlob>;
    outputServiceSasSig: string;
    outputAccountName: string;
    outputContainer: string;
    outputBlob: string;
};

type ContainerBlob = {
    container: string;
    blob: string;
}

export default httpTrigger;