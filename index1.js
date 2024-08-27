/**
 * File: ./index1.js
 * Description:
 * Obtain province data (municipality->mainPlace->subPlace) from the Adrian Fritz Census API and
 * write a to a JSON file.
 * The first script file to be run.
 * The aim is to create a JSON file with provinces, with all their respective local/metro municipalities, and their respective main places and subplaces,
 * that is to be converted to a Firestore importable file.
 * Fetching place data from the Adrian Frith Census API.
 * 
 * Connection time-outs do happen while fetching this data.
 * When this happens while fetching data for a province, the program dumps that province data to the output provinces file, while carrying on fetching
 * for the provinces where this connection time-out has not happened.
 * On re-run, it uses the most recent provinces JSON file, dumping data to a new provinces file. The aim is to incrementally obtain complete place data.
 * The script is to be run until all the place data is fetched. 
 * Re-run the script until until there is no console log that indicates fetch errors.
 * When you have determined that the last script re-run has fetched complete data, copy ./data/provinces_CCYY-MM-DDTmm_ss.mss.json file and rename it to provincesComplete.json.
 * It is to be used to create the place data Firestore importable file. When the script ./index2.js is run.
 * ------------------------------------------------------------------------------------------------
 * Date         Dev  Version  Description
 * 2024/01/20   ITA  1.00     Genesis.
 * 2024/07/24   ITA  2.00     Fetch place data starting from the province level. This is so as to ensure the municipalities are exactly named as per Census data,
 *                            and no municipalities are missed when fetching main place and sub-place data.
 */

const fs = require('fs');

const path = require('path');
require('dotenv').config();
const JSONStream = require('JSONStream');
const axios = require("axios");

/**Object for fetching API data. */
const axiosInstance = axios.create({
    baseURL: process.env.CENSUS_API_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/JSON"
    }
});

const initData =  [
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

processData();

/**
 * Read latest provinces place JSON file. Fetch and fill in outstanding place data, and write the output to a new file.
*/
async function processData() {
    /* Read the latest provinces JSON file. This is the file that stores each province */
    let turnOn = false;
    let recentInputFile = null;
    const folderPath = path.join(__dirname, 'data');
    try {
        const files = fs.readdirSync(folderPath);
        
        // Filter out JSON files.
        let fileNames = files
                        .filter(file => fs.lstatSync(path.join(folderPath, file)).isFile())
                        .filter(fileName=> {
                            if (['firestoreImport.json','provincesComplete.json'].includes(fileName))
                                return false;

                            const splits = fileName.split('.');
                            return splits[0].includes('provinces')
                                   && splits[splits.length - 1] === 'json';
                        })
                        .toSorted(); // Get the JSON file names in ascending order.
        
        if (fileNames.length > 0)
            recentInputFile = fileNames[fileNames.length - 1]; 
        /* The subsequent provinces file names will the timestamp appended to them. e.g. provinces_2024-07-31T15:27.247.json.
        *  So the recent file provinces file will be last in the fileNames array. */
    }
    catch (err) {
        console.error('Error reading the directory:', err);
        return Promise.reject('Error reading the directory.');
    }
    
    // Create a read stream
    let readStream = null;
    if (recentInputFile !== null) {
        readStream = fs.createReadStream(path.join(folderPath, recentInputFile), { encoding: 'utf8' });
    }
    
    let aPromise = null;
    if (readStream !== null) {
        aPromise = new Promise((resolve, reject)=> {
            const theProvinces = [];
                    
            // Create a JSON parser.
            const parser = JSONStream.parse('*');
            // Pipe the read stream to the parser.
            readStream.pipe(parser);

            // Handle each chunk of data.
            parser.on('data', async (chunk)=> {
                theProvinces.push((chunk));
            });

            // End the stringifier and write stream when the read stream ends.
            parser.on('end', () => {
                readingComplete = true;
                console.log('File reading complete...');
                resolve(theProvinces);
            });
        });
    } // if (recentInputFile !== null)
    
    // Create a write stream
    const outputFile = `provinces_${(new Date()).toISOString().replace(/:/g, '_')}.json`;
    const writeStream = fs.createWriteStream(path.join(folderPath, outputFile), { flags: 'wx', mode: 0o644  });
    // Create a JSON stringifier to write province JSON objects to provinces file.
    const stringifier = JSONStream.stringify();

    // Pipe the stringifier to the write stream
    stringifier.pipe(writeStream);
    
    let provinces = aPromise? await aPromise : initData;
    let fetchErrors = [];
    for (let idx = 0; idx < provinces.length; idx++) {
        let province = provinces[idx];
        try {            
            await fetchPlaceData(province);
        } catch (error) {
            console.log(`Data outstanding for ${province.name}`); 
            fetchErrors.push(province.name);
        } finally {
            console.log('Writing province ' + province.name);        
            if (idx === provinces.length - 1)
                stringifier.end(province);
            else
                stringifier.write(province);
        }
    } // for (let idx = 0; idx < provinces.length; idx++) {
    
    if (fetchErrors.length > 0)
        console.log(`Done. Fetch errors occurred with these provinces: ${fetchErrors}. Please re-run the script.`);
    else
        console.log('Writing of place data complete...');
}


/*
    The subsequent contents of the later provinces JSON files have the form:
    [
        {
            name,
            code,
            municipalities: [
                {
                    name,
                    code,
                    mainPlaces: [
                        {
                            name,
                            code,
                            subPlaces: [
                                {
                                    name,
                                    code
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        ...
    ]
*/

// fetchPlaceData algorithm
// For each province read from JSON file.
    // If there are no municipalities in the province:
        // Fetch the municipalities of this province from the API.
            // If the fetch is successful:
                // Create a new municipalities array.
                // Create a new district municipalities array.
                // For each fetched municipality:
                    // If the municipality is a district:
                        // Add to the district municipalities array.
                    // Else:
                        // Add to the municipalities array.

                // For each district municipality in the district municipalities array:
                    // Fetch local municipalities of the district municipality.
                    // If the fetch is successful:
                        // For each fetched local municipality:
                            // Add to the municipalities array.
                    // Else if the fetch is unsuccessful.
                        // Return the province
                // Assign the municipalities array to the municipalities field of the read province.

            // Else if the fetch is unsuccesful.
                // Return the province.

    // If there municipalities in the province:
        // For each municipality of the province.
            // If there are no main places in the municipality:
                // Create a new main places array.
                // Fetch the main places of the municipality from the API.
                // If the fetch is successful:
                    // For each fetched main place:
                        // Add to the main places array.
                // Else if the fetch was unsuccessful:
                    // Return the province.

                // Assign the main places array to the main places field of the municipality.
            
            // If there are main places in the municipality:
                // For each main place of the municipality.
                    // If there are no sub-places in the main place:
                        // Create a new sub-places array.
                        // Fetch the sub-places of the main place from the API.
                        // If the fetch is successful:
                            // For each fetched sub-place.
                                // Add to the sub-places array.
                        // Else if the fetch is unsuccessful:
                            // Return the province.
                    
                        // Add the sub-places array to the sub-places field of the main place.
    // Write the province to the new provinces JSON file.
// 
/**
 * fetch place data, new or outstanding for the province
 * @param {*} province province object
 * @returns a province
 */
async function fetchPlaceData(province) {
    
    console.log(`Processing ${province.name}...`);
    const errorOccurred = false;

    if (province.municipalities === undefined) { // province.municipalities is null or undefined.
        const distrMunicipalities = [];
        const municipalities = [];
        try {
            const provinceData = await getPlaces(province.name, 'province', null);
            for (const municipalityIndex in provinceData[0].children) {
                const municipality = provinceData[0].children[municipalityIndex];
                const {name, code} = municipality;
                if (municipality.type.name === 'district')
                    distrMunicipalities.push({name, code});
                else
                    municipalities.push({name, code});
            } // for (const municipalityIndex in provinceData.children) {
            for (const distrMunicipalityIndex in distrMunicipalities) {
                const distrMunicipality = distrMunicipalities[distrMunicipalityIndex];
                const distrMunicipalityData = await getPlaces(distrMunicipality.name, 'district', distrMunicipality.code);
                municipalities.push(...distrMunicipalityData[0].children.map(child=> ({name: child.name, code: child.code})));
            } // for (const distrMunicipalityIndex in distrMunicipalities) {
            municipalities.sort((place1, place2)=> {
                return place1.name.localeCompare(place2.name);
            });
            province.municipalities = municipalities;
        } catch(error) {
            console.log(error);
            return Promise.reject('Fetch error.');
        }
    }
    for (const municipalityIndex in province.municipalities) {
        const municipality = province.municipalities[municipalityIndex];
        console.log(`   Processing ${municipality.name} municipality...`);
        if (municipality.mainPlaces === undefined) { // municipality.mainPlaces is null or undefined.
            try {
                const municipalityData = await getPlaces(municipality.name, null, municipality.code);
                const mainPlaces = municipalityData[0].children.map(child=> ({name: child.name, code: child.code}));
                municipality.mainPlaces = mainPlaces; 
            } catch (error) {
                errorOccurred = true;
            }                    
        }
        for (const mainPlaceIndex in municipality.mainPlaces) {
            const mainPlace = municipality.mainPlaces[mainPlaceIndex];
            console.log(`       Processing ${mainPlace.name} main place...`);
            if (mainPlace.subPlaces === undefined) { // mainPlaces.subPlaces is null or undefined.
                try {
                    const mainPlaceData = await getPlaces(mainPlace.name, 'mainplace', mainPlace.code);
                    const subPlaces = mainPlaceData[0].children.map(child=> ({name: child.name, code: child.code}));
                    mainPlace.subPlaces = subPlaces;
                } catch (error) {
                    errorOccurred = true;
                }
            }
        } // for (const mainPlaceIndex in municipality.mainPlaces) {
    } // for (const municipalitiesIndex in municipalities) {
    if (errorOccurred)
        return Promise.reject('Fetch error.');

    return Promise.resolve('Success.');
} // async function fetchPlaceData(province) {

/** Return a place and its immediate children.
 * @param {string} name - search word.
 * @param {string} placeType - any of: 'province', 'metro', 'district', 'local', 'mainplace', 'subplace', 'smallarea'.
 * @param {string} code - when set to a non-null value, return only the place whose code matches this value.
 * @param {boolean} [matchNameExactly=true] - when set to true, and code is null, return only the places that exactly match the search keyword.
 * 
 * We are interested only in 'province', 'metro', 'district', 'local', 'mainplace', 'subplace'.
 * Children of placeType 'province' will be type 'metro' and 'district'
 * Children of placeType 'district' will be type 'local'
 * Children of placeType 'metro' and 'local' will be type 'mainplace'
 * Children of placeType 'mainplace' will be type 'subplace'
*/
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
    const query = `
    query ($name: String!) {
        placesByName: places(name: $name) {
            code
            name
            type { name }
            children {
                code
                name
                type { name }
            }
        }
    }`;
    
    const variables = {
        name
    };

    const aPromise = new Promise((resolve, reject)=> {
        axiosInstance.post(
            '',
            {
                query,
                variables
            }
        )
        .then(response=> {
                
                const places = response.data.data.placesByName.filter(aPlace=> {
                                    let matches = true;
                                    if (placeType !==  null)
                                        matches = matches && (aPlace.type.name === placeType);
                                    if (matches === false)
                                        return false;

                                    if (code !== null)
                                        matches = matches && (aPlace.code === code);
                                    if (matchNameExactly)
                                        matches = matches && (aPlace.name.toUpperCase() === name.toUpperCase());

                                    return matches;
                                });
                resolve(places);
            })
            .catch(error=> reject(error));
    });
    
    return aPromise;
} // async function getPlaces(name, placeType) {




