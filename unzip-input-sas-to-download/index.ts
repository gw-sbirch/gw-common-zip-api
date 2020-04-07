// import appInsights = require("applicationinsights");
// appInsights.setup("<instrumentation_key>");
// appInsights.start();

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { ZipService } from "../common/ZipHelper";
import SasService from "../common/sasService";

const handleZipRequest = async (context: Context, { inputZipSas }: { inputZipSas: string }): Promise<void> => {
    const sasService = new SasService(context);
    const zipService = new ZipService(context);

    const zipBuffer = await sasService.download(inputZipSas);
    const zipContent = await zipService.read(zipBuffer);

    if (zipContent.Error) {
        context.res.statusCode = 400;
    }

    context.res.setHeader("content-type", "application/json");
    context.res.body = JSON.stringify({
        files: zipContent.ZipObjects.map(s => {
            return {
                Name: s.Name,
                Value: s.getBase64()
            };
        })
    });
    context.done();
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("HTTP trigger function processed a request.");

    return handleZipRequest(context, req.body);
};

export default httpTrigger;