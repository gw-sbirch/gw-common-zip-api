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
    const zipObjects = await zipService.list(zipBuffer);
    if (zipObjects.Error) {
        context.res.statusCode = 400;
    }
    context.res.setHeader("content-type", "application/json");
    context.res.body = JSON.stringify(zipObjects);
    context.done();
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("HTTP trigger function processed a request.");

    return handleZipRequest(context, req.body);
};

type ZipToBlobsBody = {
    inputZipSas: string;
};

export default httpTrigger;