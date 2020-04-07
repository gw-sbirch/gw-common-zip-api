// import appInsights = require("applicationinsights");
// appInsights.setup("<instrumentation_key>");
// appInsights.start();

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { ZipService } from "../common/ZipHelper";
import SasService from "../common/sasService";

const handleZipRequest = async (context: Context, body: Readonly<ZipToBlobsBody>): Promise<void> => {
    const sasService = new SasService(context);
    const zipService = new ZipService(context);

    const inputSasUrl = sasService.constructUrl(body.inputServiceSasSig, body.inputAccountName, body.inputContainer, body.inputBlob);
    const zipBuffer = await sasService.download(inputSasUrl);
    const zipContent = await zipService.read(zipBuffer);

    if (zipContent.Error) {
        context.res.statusCode = 400;
    }

    Promise.all(zipContent.ZipObjects.map(zipObject => {
        const SAS = sasService.constructUrl(
            body.outputServiceSasSig,
            body.outputAccountName,
            body.outputContainer,
            zipObject.Name
        );

        return sasService.upload(SAS, zipObject.Contents);
    })).then(() => {
        context.done();
    }, (err) => {
        context.log.error(err);
        context.done();
    });
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("HTTP trigger function processed a request.");

    return handleZipRequest(context, req.body);
};

type ZipToBlobsBody = {
    inputServiceSasSig: string;
    inputAccountName: string;
    inputContainer: string;
    inputBlob: string;
    outputServiceSasSig: string;
    outputAccountName: string;
    outputContainer: string;
};

export default httpTrigger;