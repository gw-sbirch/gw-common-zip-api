/* eslint-disable @typescript-eslint/explicit-function-return-type */
import SasService from "./SasService";
import fetch from "node-fetch";

const sasService = new SasService();
const zipToStorageUrl = "https://glasswall-common-zipapi.azurewebsites.net/api/unzip-sas-zip-to-storage?code=IfKTbS3GJO1FdeDHiDz2Mz0hfRZfz3LT3vr1llpcQxu7FtludOaNAw%3D%3D";
const zipListItemUrl = "https://glasswall-common-zipapi.azurewebsites.net/api/list-sas-zip-files?code=T7pFSjg4gvTmDCyosOjUs9muJM%2FjIUuSTmS6DdKIrdCa%2FNpUQNKHuw%3D%3D";

//const zipToStorageUrl = "http://localhost:7071/api/unzip-sas-zip-to-storage?code=IfKTbS3GJO1FdeDHiDz2Mz0hfRZfz3LT3vr1llpcQxu7FtludOaNAw%3D%3D";
//const zipListItemUrl = "http://localhost:7071/api/list-sas-zip-files?code=T7pFSjg4gvTmDCyosOjUs9muJM%2FjIUuSTmS6DdKIrdCa%2FNpUQNKHuw%3D%3D";

const GenerateZipOutputSASTokens = async (inputZipSas, outputContainer) => {
    const body = JSON.stringify({ inputZipSas });

    return fetch(zipListItemUrl, {
        body: body,
        method: "POST"
    })
        .then(response => {
            return response.json();
        })
        .then(responseJson => {
            return Promise.all(responseJson.ZipItems.map(async zipItem => {
                return sasService.getWriteSas(outputContainer, zipItem.Name).then(writeSas => {
                    return {
                        Name: zipItem.Name,
                        SAS: writeSas
                    };
                });
            }));
        });
};

sasService.getReadSas("rebuild-output", "withSubFolders.zip")
    .then(inputZipSas => {
        GenerateZipOutputSASTokens(
            inputZipSas,
            "rebuild-output"
        )
            .then(outputZipItemSasMap => {
                const body = JSON.stringify({
                    inputZipSas,
                    outputZipItemSasMap
                });

                fetch(zipToStorageUrl, {
                    method: "POST",
                    body: body
                });
            });
    });