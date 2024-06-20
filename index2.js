/**
 * File: ./index2.js
 * Description:
 * Code fields are monotonously increasing in many instances of this data, per municpality, per main-place and per sub-place. 
 * When used as document IDs, they will create hotspots impacting latency. 
 * Read the json from ./provinces2.json, add random 3 characters and underscore (e.g a3Z_) to the
 * beginning of the codes to create Document IDs that are not monotonously sequential. Write output to provinces3.json.
 * 
 * Date         Dev   Version   Description
 * 2024/01/28   ITA   1.00      Genesis.
 */
const fs = require('fs');

const readFilePromise = new Promise((reject, resolve)=> {
    
    // Specify the path to your JSON file
    const filePath = './provinces2.json';

    // Read the content of the JSON file
    let error = null, 
        jsonData = null;
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.log(err);
            return;
        }

        // Parse the JSON data
        try {            
            jsonData = JSON.parse(data);
            updateData(jsonData);
        } catch (parseError) {
            console.log(parseError);
        }
    }); // fs.readFile(filePath, 'utf8', (err, data) => {
    
});

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

function updateData(jsonData) {
    const provinces = jsonData.provinces;

    jsonData.provinces = {};
    provinces.forEach(province=> {

        jsonData.provinces[province.code] = {
            code: province.code, 
            name: province.name,
            subCollection: {
                [`provinces/${province.code}/municipalities`]: {}
            }
        };
    
        province.subCollection.municipalities.forEach(municipality=> {

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
    
            municipality.subCollection.mainPlaces.forEach(mainPlace=> {
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
                
                mainPlace.subCollection.subPlaces.forEach(subPlace=> {
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
    const outputPath = './provinces3.json';
        const fileStream = fs.createWriteStream(outputPath);
        fileStream.write(JSON.stringify(jsonData), error=> {
            if (error !== null && error !== undefined)
                console.error('Error writing to file:', error);
            else
                console.log('Successfully written to file ' + outputPath);
        });
} // updateData(jsonData) {