import JSZip = require("jszip");
import { Context } from "@azure/functions";

class ZipContents {
    Size: number;
    Error: string;
    ZipObjects: Array<ZipObject>;
}

class ZipObject {
    constructor(name: string, contents: Buffer) {
        this.Name = name;
        this.Contents = contents;
    }

    Name: string;
    Contents: Buffer;
    
    getBase64(): string {
        return this.Contents.toString("base64");
    }
}

class ZipDetails {
    Size: number;
    UnzipSize: number;
    Error: string;
    Version: string;
    ZipItems: Array<ZipListItem>;
}

class ZipListItem {
    constructor(name: string, isDirectory: boolean) {
        this.Name = name;
        this.IsDirectory = isDirectory;
    }

    Name: string;
    IsDirectory: boolean;
}

class ZipService {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async readFile(zipFile: JSZip.JSZipObject): Promise<ZipObject> {
        const fileData = await zipFile.async("nodebuffer");
        return new ZipObject(zipFile.name, fileData);
    }

    async read(buffer: Buffer): Promise<ZipContents> {
        this.context.log("Listing Zip Contents.");

        const result = new ZipContents();
        result.Size =  buffer.length;

        try {
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(buffer);

            result.ZipObjects = await Promise.all(Object.values(loadedZip.files).map((zipFile) => {
                this.context.log("Found file: " + zipFile.name);
                return this.readFile(zipFile);
            }));
        }
        catch (ex) {
            this.context.log.error(ex);
            
            result.Error = "Could not read zip. Please check this is a valid zip.";
        }

        return result;
    }

    async list(buffer: Buffer): Promise<ZipDetails> {
        this.context.log("Listing Zip Contents.");

        const result = new ZipDetails();
        result.Size =  buffer.length;

        try {
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(buffer);
            result.Version = loadedZip.version;
            result.UnzipSize = loadedZip.length;
            result.ZipItems = Object.values(loadedZip.files).map(zipFile => {
                this.context.log("Found file: " + zipFile.name);
                return new ZipListItem(zipFile.name, zipFile.dir);
            });
        }
        catch (ex) {
            this.context.log.error(ex);

            result.Error = "Could not read zip. Please check this is a valid zip.";
        }
        
        return result;
    }

    async write(zipObjects: Array<ZipObject>): Promise<Buffer> {
        this.context.log("Writing Zip Contents.");
        const zip = new JSZip();

        zipObjects.forEach(s => {
            zip.file(s.Name, s.Contents);
        });

        const buffer = await zip.generateAsync({
            type: "nodebuffer"
        });

        this.context.log("Writing Zip Contents complete. Length " + buffer.length);
        return buffer;
    }
}

export { ZipService, ZipContents, ZipDetails, ZipObject, ZipListItem };