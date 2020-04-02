import { IncomingMessage } from "http";

const isSuccessStatusCode = (statusCode: number): boolean => {
    return statusCode >= 200 && statusCode < 300;
};

const HttpHelper = {
    DownloadBody: (message: IncomingMessage): Promise<Buffer> => {
        return new Promise<Buffer>((resolve, reject) => {
            if (!isSuccessStatusCode(message.statusCode)) {
                reject("Unexpected response: " + JSON.stringify(message));
            }

            const chunks = [];

            message
                .on("data", (chunk: Buffer) => { chunks.push(chunk); })
                .on("end", () => { resolve(Buffer.concat(chunks)); })
                .on("error", (err: { message: string }) => { reject(err.message); });
        });
    },

    IsSuccessStatusCode: isSuccessStatusCode
};

export default HttpHelper;