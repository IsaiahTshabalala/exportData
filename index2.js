/**
 * File: ./index2.js
 * Description:
 * Convert the place JSON data into a Firestore importable file.
 * Code fields are monotonously increasing in many instances of this data, per municpality, per main-place and per sub-place. 
 * When used as document IDs, they will create hotspots impacting latency. 
 * Add random 3 characters and underscore (e.g a3Z_) to the beginning of the place codes to create Document IDs that are not monotonously sequential.
 * Input File: ./data/provincesComplete.json
 * Output file: ./data/firestoreImport.json
 * Date         Dev   Version   Description
 * 2024/01/28   ITA   1.00      Genesis.
 * 2024/08/26   ITA   1.01      From the provinces file, read each province as a separate chunk.
 */
const fs = require('fs');
const path = require('path');
const JSONStream = require('JSONStream');

let inProcess = 0; // Number of data chunks in process.
let readingComplete = false;

/* Read the latest provinces JSON file. This is the file that stores each province */
let inputFile = 'provincesComplete.json';   // A copy of the complete provinces json file, with all the API fetched place data.
const theProvinces = [];
const folderPath = path.join(__dirname, 'data');

// Create a read stream
const readStream = fs.createReadStream(path.join(folderPath, inputFile), { encoding: 'utf8' });

// Create a write stream
const outputFile = `firestoreImport.json`;
console.log(outputFile);

// Create a JSON parser.
const parser = JSONStream.parse('*');

// Handle each chunk of data
parser.on('data', async (chunk)=> {
    theProvinces.push(chunk);
    
    if (theProvinces.length === 9) {
        toFirestoreImportJsonFile(theProvinces);
        console.log('Processing complete...');
    }
});

parser.on('end', () => {
    readingComplete = true;
    console.log('File reading complete...');
});


// Pipe the read stream to the parser
readStream.pipe(parser);

/**
 * Get a random string of alphanumeric characters.
 * @param {*} numChars - Required length of the string.
 * @returns a random string of alphanumeric characters.
 */
function getRandomChars(numChars = 1) {
    const chars = '01234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (numChars < 1)
        throw('Parameter numChars must be equal or greater than 1.');
    let randomChars = '';
    for (let idx = 0; idx < numChars; idx++) {
        const randNum = Math.trunc(Math.random() * 10000000000) % chars.length; // A random number from 0 to chars.length - 1
        randomChars += chars[randNum];
    }
    return randomChars;
}

function toFirestoreImportJsonFile(pProvinces) {
    const jsonData = {
        provinces: {}
    };

    pProvinces.forEach(province=> {

        jsonData.provinces[province.code] = {
            code: province.code, 
            name: province.name,
            subCollection: {
                [`provinces/${province.code}/municipalities`]: {}
            }
        };
    
        if (province.municipalities === undefined)
            return;

        province.municipalities.forEach(municipality=> {

            /* Code fields are monotonously increasing in many instances of this data, per municpality, per main-place and per sub-place. 
            When used as document IDs, they will create hotspots impacting latency. Add random 3 characters and underscore (e.g a3Z_) to the
            beginning of the code to create Document IDs that are not monotonously sequential.*/
            municipality.code = getRandomChars(3) + '_' + municipality.code;
            
            jsonData.provinces[province.code]
            .subCollection[`provinces/${province.code}/municipalities`] = {
                ...jsonData.provinces[province.code]
                .subCollection[`provinces/${province.code}/municipalities`],
                [municipality.code]: {
                    code: municipality.code,
                    name: municipality.name,
                    subCollection: {
                        [`provinces/${province.code}/municipalities/${municipality.code}/mainPlaces`]: {}
                    }
                }            
            };
    
            if (municipality.mainPlaces === undefined)
                return;

            municipality.mainPlaces.forEach(mainPlace=> {
                mainPlace.code = getRandomChars(3) + '_' + mainPlace.code;
                jsonData.provinces[province.code]
                .subCollection[`provinces/${province.code}/municipalities`][municipality.code]
                .subCollection[`provinces/${province.code}/municipalities/${municipality.code}/mainPlaces`] = {

                    ...jsonData.provinces[province.code]
                    .subCollection[`provinces/${province.code}/municipalities`][municipality.code]
                    .subCollection[`provinces/${province.code}/municipalities/${municipality.code}/mainPlaces`],
                    [mainPlace.code]: {
                        code: mainPlace.code,
                        name: mainPlace.name,
                        subCollection: {
                            [`provinces/${province.code}/municipalities/${municipality.code}/mainPlaces/${mainPlace.code}/subPlaces`]: {}
                        }
                    }
                };
                
                if (mainPlace.subPlaces === undefined)
                    return;

                mainPlace.subPlaces.forEach(subPlace=> {
                    subPlace.code = getRandomChars(3) + '_' + subPlace.code;
                    jsonData.provinces[province.code]
                    .subCollection[`provinces/${province.code}/municipalities`][municipality.code]
                    .subCollection[`provinces/${province.code}/municipalities/${municipality.code}/mainPlaces`][mainPlace.code]
                    .subCollection[`provinces/${province.code}/municipalities/${municipality.code}/mainPlaces/${mainPlace.code}/subPlaces`] = {
                        ...jsonData.provinces[province.code]
                        .subCollection[`provinces/${province.code}/municipalities`][municipality.code]
                        .subCollection[`provinces/${province.code}/municipalities/${municipality.code}/mainPlaces`][mainPlace.code]
                        .subCollection[`provinces/${province.code}/municipalities/${municipality.code}/mainPlaces/${mainPlace.code}/subPlaces`],
                        [subPlace.code]: {
                            code: subPlace.code,
                            name: subPlace.name
                        } 
                    };
                }); // mainPlace.subCollection.subPlaces.forEach(subPlace=> {
            });
        });
    });
    
    console.log('Writing to file...');
    const outputPath = path.join(folderPath, outputFile);
    const fileStream = fs.createWriteStream(outputPath);
    fileStream.write(JSON.stringify(jsonData), error=> {
        if (error !== null && error !== undefined)
            console.error('Error writing to file:', error);
        else
            console.log('Successfully written to file ' + outputPath);
    });
} // updateData(jsonData) {