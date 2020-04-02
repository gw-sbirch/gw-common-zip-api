import JSZip = require("jszip");
import { Context } from "@azure/functions";
 
class ZipService {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    read(buffer: Buffer): Promise<Array<ZipObject>> {
        this.context.log("Reading Zip.");
        const zip = new JSZip();

        return new Promise((resolve, reject) => {
            zip.loadAsync(buffer).then(loadedZip => {
                const fileRefs = Object.values(loadedZip.files);
                const zipFileReaders = [];
                Array.from(fileRefs)
                    .forEach(async (zf) => {
                        if (!zf.dir) {
                            zipFileReaders.push(zf.async("blob").then((blob: Blob) => {
                                blob["name"] = zf.name;
                                return { Name: zf.name, Contents: blob };
                            }));
                        }
                    });

                return Promise.all(zipFileReaders).then(() => {
                    this.context.log("Zip Read.");
                    resolve();
                });
            }, reject);
        });
    }

    list(buffer: Buffer): Promise<Array<string>> {
        this.context.log("Listing Zip Contents.");

        const zip = new JSZip();

        return new Promise((resolve, reject) => {
            zip.loadAsync(buffer).then(loadedZip => {
                const fileRefs = Object.values(loadedZip.files);
                const zipFileReaders = [];
                Array.from(fileRefs)
                    .forEach(async (zf: JSZip.JSZipObject) => {
                        if (!zf.dir) {
                            return zf.name;
                        }
                    });

                return Promise.all(zipFileReaders).then(() => {
                    this.context.log("Listing Zip Contents.");

                    resolve();
                });
            }, reject);
        });
    }

    write(zipObjects: Array<ZipObject>): Promise<Buffer> {
        this.context.log("Writing Zip Contents.");
        const zip = new JSZip();

        zipObjects.forEach(s => { 
            zip.file(s.Name, s.Contents);
        });

        return zip.generateAsync({
            type: "nodebuffer"
        }).then(buffer => {
            this.context.log("Writing Zip Contents complete. Length " + buffer.length);
            return buffer;
        });
    }
}

class ZipObject {
    constructor(name: string, contents: Buffer) {
        this.Name = name;
        this.Contents = contents;
    }

    Name: string
    Contents: Buffer
}

export { ZipService, ZipObject };