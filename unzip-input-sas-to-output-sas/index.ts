// import appInsights = require("applicationinsights");
// appInsights.setup("<instrumentation_key>");
// appInsights.start();

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { ZipService } from "../common/ZipHelper";
import SasService from "../common/sasService";

const handleZipRequest = async (context: Context, body: Readonly<ZipToBlobsBody>): Promise<void> => {
    const sasService = new SasService(context);
    const zipService = new ZipService(context);

    const zipBuffer = await sasService.download(body.inputZipSas);
    const zipContent = await zipService.read(zipBuffer);

    if (zipContent.Error) {
        context.res.statusCode = 400;
    }

    body.outputZipItemSasMap.forEach(async ({ Name, SAS }) => {
        const zipObject = zipContent.ZipObjects.find(f => f.Name === Name);

        if (!zipObject){
            context.res.statusCode = 400;
            context.done(new Error("File does not exist in zip"));
        }

        await sasService.upload(SAS, zipObject.Contents);
    });

    context.done();
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("HTTP trigger function processed a request.");

    return handleZipRequest(context, req.body);
};

type ZipToBlobsBody = {
    inputZipSas: string;
    outputZipItemSasMap: Array<{
        Name: string;
        SAS: string;
    }>;
};

export default httpTrigger;