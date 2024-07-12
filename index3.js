/**
 * File: ./index2.js
 * Description:
 * Dump the South African places into Firestore.
 * Hierachy: province/local-or-metro-municipality/main-place/sub-place.
 * 
 * Date         Dev  Version  Description
 * 2024/01/20   ITA  1.00     Dump the provinces3.json file to Firestore.
 * 2024/07/11   ITA  1.01     Install and use dotenv to access the environment variables.
*/
const { initializeFirebaseApp, restore } = require('firestore-export-import');
require('dotenv').config();
const serviceAccount = require(process.env.SERVICE_ACCOUNT_FILE);

// If you want to pass settings for firestore, you can add to the options parameters
const options = {
    firestore: {
        host: 'localhost:8080',
        ssl: false,
    },
}

// Initiate Firebase App
const appName = '[DEFAULT]';

const firestore = initializeFirebaseApp(serviceAccount, appName, options);

restore(firestore, './provinces3.json')
    .then(result=> {
        console.log('Successfully loaded provinces data.');
        console.log(result);
    },
    error=> {
        console.log(error);
    });