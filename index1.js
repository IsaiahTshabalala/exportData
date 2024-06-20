/**
 * File: ./index1.js
 * Description: obtain main and sub places of the municipalities.
 * The first script file to be run.
 * Date         Dev  Version  Description
 * 2024/01/20   ITA  1.00     Genesis.
 */

const { open } = require('node:fs/promises');
const fs = require('fs');

const path = require('path');

const provinces = [
    { // The Eastern Cape Province object. ZA_EC will be the document ID in Firestore
        "code": "ZA_EC",
        "name": "EASTERN CAPE",
    },
    { // The Free State Province object
        "code": "ZA_FS",
        "name": "FREE STATE"
    },
    {
        "code": "ZA_GP",
        "name": "GAUTENG"
    },
    {
        "code": "ZA_NL",
        "name": "KWAZULU-NATAL"
    },
    {
        "code": "ZA_LP",
        "name": "LIMPOPO"
    },
    {
        "code": "ZA_MP",
        "name": "MPUMALANGA"			
    },
    {
        "code": "ZA_NC",
        "name": "NORTHERN CAPE"			
    },
    {
        "code": "ZA_NW",
        "name": "NORTH WEST"
    },
    {
        "code": "ZA_WC",
        "name": "WESTERN CAPE"
    }
]; // const provinces = {

// Open the localMunicipalities.csv file. It contains the list of metropolitan and local municipalities.
const filePath = path.join(__dirname, 'localMunicipalities.csv');

// Check if the file exists. If it does not, write an error message.
if (!fs.existsSync(filePath)) {
    console.error(filePath + ' does not exist!');
    return;
} // if (!fs.existsSync(filePath)) {

(async()=> {
    try {
        await readMunicipalities();        
        await addMainPlacesAndSubPlaces();
        writeToJsonFile();
    } catch (error) {
        console.log({error});
    }
})();

function getProvincialCode(provinceName) {
    for (const provincialCode in provinces) {
        if (provinces[provincialCode]['name'] === provinceName.toUpperCase())
            return provinces[provincialCode]['code'];
    }
    return null;
} // function getProvincialCode(provinceName) {

async function readMunicipalities() {
// Populate each province object with municipalities and their respective main places and sub-places.
    const file = await open(filePath);
    console.log('Reading the file ' + filePath + ' ...');
    const promiseObject = new Promise(async (resolve, reject)=> {
        let count = 0;
        for await (const line of file.readLines()) {
            // For each line read from the localMunicipalities.csv file (provinceName;municipalityName;municipalityCode)
            // Add the municipality to its respective province object in the local municipalities field.
            const fields = line.split(';'); // provinceName;municipalityName;municipalityCode
            const provincialCode = getProvincialCode(fields[0].trim().toUpperCase());
            
            /* "municipalityCode" will be the document ID of each municipality doc in 
                the municipalities sub-collection of each province doc in the provinces collection in Firestore.
                */
            //

            const index = provinces.findIndex(item=> {
                return item.code === provincialCode;
            });
            
            if (index >= 0) {
                if ('subCollection' in provinces[index] === false)
                    provinces[index].subCollection = {
                    municipalities:[]  // Add the municipalities sub-collection to the province document.
                };
                
                const municipality = {
                    name: fields[1],
                    code: fields[2]
                };
                
                provinces[index].subCollection.municipalities.push(municipality);
                ++count;
                console.log('Record ' + count + ' done ...');
            }
        } // for await (const line of file.readLines()) {
        console.log('Done...');
        resolve('success');
    });
    return promiseObject;
} // async function readMunicipalities() {

async function addMainPlacesAndSubPlaces() {
    console.log('Fetching municipality main places...');
    for (const provincialCode in provinces) {
        const aProvince = provinces[provincialCode];
        console.log('Fetching for province: ' + aProvince.name + ' ...');
        
        for (const municipalityCode in aProvince.subCollection.municipalities) {
            const municipality = aProvince.subCollection.municipalities[municipalityCode];
            console.log('  Fetching for municipality ' + municipality.name + ', ' + aProvince.name);
            
            /**
                "subCollection": {
                    "municipalities": [
                        {
                            "code": "municipalityCode1", 
                            "name": "municipalityName2",
                            "subCollection": {
                                "mainPlaces": [ // mainPlaces will be a sub-collection of the municipality doc in Firestore.
                                    { // mainPlaceCodeX to be the document ID of the mainPlace doc
                                        "code": "mainPlaceCode1",
                                        "name": "mainPlaceName1",
                                        "subCollection": {
                                            "subPlaces": [ // subPlaces to be the sub-collection of the mainPlace doc in Firestore.
                                                { "code": "subPlaceCode11", "name": "subPlaceName11" },
                                                { "code": "subPlaceCode12", "name": "subPlaceName12" }
                                            ]
                                        }
                                    },
                                    {
                                        "code": "mainPlaceCode2",
                                        "name": "mainPlaceName2",
                                        "subCollection": {
                                            "subPlaces": [
                                                "subPlaceCode21": { "code": "subPlaceCode21", "name": "subPlaceName21" },
                                                "subPlaceCode22": { "code": "subPlaceCode22", "name": "subPlaceName22"}
                                            ]
                                        }
                                    }
                                ]
                            }
        
                        },
                        {
                            "code": "municipalityCode2",
                            "name": "municipalityName",
                            "subCollection": {
                                "mainPlaces": [
                                    { // mainPlaceCodeX to be the document ID of the mainPlace doc
                                        "code": "mainPlaceCode1",
                                        "name": "mainPlaceName1",
                                        "subCollection": {
                                            "subPlaces": [ // subPlaces to be the sub-collection of the mainPlace doc in Firestore.
                                                { "code": "subPlaceCode11", "name": "subPlaceName11" },
                                                { "code": "subPlaceCode12", "name": "subPlaceName12" }
                                            ]
                                        }
                                    },
                                    {
                                        "code": "mainPlaceCode2",
                                        "name": "mainPlaceName2",
                                        "subCollection": {
                                            "subPlaces": [
                                                { "code": "subPlaceCode21", "name": "subPlaceName21" },
                                                { "code": "subPlaceCode22", "name": "subPlaceName22"}
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
             */

            /* Strip the municipality name of 'Local Municipality' or 'Metropolitan Municipality' at the end
               Also remove 'Çity of ' in the beginning */
            let removeFromIdx = municipality.name.indexOf('Local Municipality');
            let municipalityType = 'local';
            if (removeFromIdx < 0) {
                removeFromIdx = municipality.name.indexOf('Metropolitan Municipality');
                municipalityType = 'metro';
            }

            let searchWord;
            if (removeFromIdx < 0)
                searchWord = municipality.name;
            else
                searchWord = municipality.name.substring(0, removeFromIdx).trim();

            removeFromIdx = searchWord.indexOf('City of ');
            if (removeFromIdx === 0) {
                removeFromIdx = ('City of ').length;
                searchWord = searchWord.substring(removeFromIdx);
            }
            /**END of removing 'City of ', 'Local municipality' and 'Metropolitan Municipality' */

            try {
                const municipalityPlaces = await getPlaces(searchWord, municipalityType, null, false);
                municipality.subCollection = { // Add the mainPlaces Firestore to be sub-collection.
                    mainPlaces: []
                };

                // municipalityPlaces is likely a size 1 array. Given that municipalities do not share names.
                municipalityPlaces.forEach(municipalityPlace=> {
                    municipalityPlace.children.forEach(child=> {
                        municipality.subCollection.mainPlaces.push({code: child.code, name: child.name});
                    });
                }); // -------------------END OF Get the main places of the municipality.                
            } catch (error) {
                return Promise.reject(error);
            } // catch (error) {

            // Obtain the sub-places of each munipality main place
            for (const mainPlaceCode in municipality.subCollection.mainPlaces) {
                const mainPlace = municipality.subCollection.mainPlaces[mainPlaceCode];
                console.log('    Fetching data for mainPlace ' + mainPlace.name + '  ' + mainPlace.code + ' ...');
                try {
                    const mainPlacesArray = await getPlaces(mainPlace.name, 'mainplace', mainPlace.code);
                    mainPlace.subCollection = { // Add the subPlaces Firestore to be sub-collection.
                        subPlaces: []
                    };

                    console.log('      SubPlaces...');
                    mainPlacesArray.forEach(mainPlaceItem=> { // mainPlacesArray has length of 1
                        mainPlaceItem.children.forEach(child=> {                        
                            console.log('        SubPlace ' + child.name + ' ' + child.code + ' done...');
                            mainPlace.subCollection.subPlaces.push({ code: child.code, name: child.name });
                        }); // mainPlaceData.children.forEach(child=> {
                    }); // mainPlaceData.forEach(mainPlace=> {
                    console.log('      SubPlaces done...');
                    municipality.subCollection.mainPlaces[mainPlaceCode] = mainPlace;

                    console.log('    MainPlace ' + mainPlace.name + '  ' + mainPlace.code + ' done...');
                } catch (error) {
                    return Promise.reject(error);
                } // catch (error) {
            } // for (const municipalityCode in municipality.subCollection.mainPlaces)) {
            aProvince.subCollection.municipalities[municipalityCode] = municipality; // re-assign the municipality back to the municipalities object.
                                                                        // to ensure that the munipalities object is correctly populated.
            console.log('  Municipality ' + municipality.name + ', ' + aProvince.name + ' done...');
        } // for (const municipalityCode in aProvince.subCollection.municipalities) {
        provinces[provincialCode] = aProvince; // re-assign the province object back to the provinces object.
        console.log(aProvince.name + ' province done...');
    } // for (const provincialCode in Provinces) {   
    return Promise.resolve('success');
} // async function addMainPlacesAndSubPlaces() {

function writeToJsonFile() {
    const outputPath = path.join(__dirname, 'provinces2.json');
    const fileStream = fs.createWriteStream(outputPath);
    fileStream.write(JSON.stringify({provinces}), error=> {
        if (error !== null && error !== undefined)
            console.error('Error writing to file:', error);
        else
            console.log('Successfully written to file ' + outputPath);
    });

}        

async function getPlaces(name, placeType, code = null, matchNameExactly = true) {
// Return a place and its immediate children.
/* Input: name -- search word. 
          placeType -- any of: 'province', 'metro', 'district', 'local', 'mainplace', 'subplace', 'smallarea'.
          code -- when set to a non-null value, return only the place whose code matches this value.
          matchNameExactly -- when set to true, and code is null, return only the places that exactly match the search keyword.
   We are interested only in 'province', 'metro', 'district', 'local', 'mainplace', 'subplace'.
   e.g. Children of placeType 'metro' will be type 'mainplace'. 
        Children of placeType 'province' will be type 'metro' and 'district'
*/
    const apiUrl = 'https://census-api.frith.dev/graphql';
    const query = `
    query ($name: String!) {
        placesByName: places(name: $name) {
            code
            name
            type { name }
            children {
                code
                name
            }
        }
    }`;
    
    const variables = {
        name
    };

    const aPromise = new Promise((resolve, reject)=> {
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                query,
                variables
            })
        }).then(results=> results.json())
            .then(data=> {
                const places = data.data.placesByName.filter(aPlace=> {
                                    if (aPlace.type.name === placeType === false)
                                        return false;

                                    if (code !== null)
                                        return aPlace.code === code;
                                    else if (matchNameExactly)
                                        return aPlace.name === name;
                                    else
                                        return true;
                                });
                resolve(places);
            })
            .catch(error=> reject(error));
    });
    
    return aPromise;
} // async function getPlaces(name, placeType) {



