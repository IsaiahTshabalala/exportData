/**
 * File: ./index2.js
 * Description:
 * Dump the South African places into Firestore.
 * Hierachy: province/local-or-metro-municipality/main-place/sub-place.
 * 
 * Date         Dev  Version  Description
 * 2024/01/20   ITA  1.00     The beginning.
 * 2024/07/11   ITA  1.01     Install and use dotenv to access the environment variables.
 * 2024/07/12   ITA  1.02     Add env variable LOCAL and option as to whether to export to the local emulator or Firestore.
 * 2024/08/27   ITA  1.03     The dump file changed to ./data/firestoreImport.json
*/
const { initializeFirebaseApp, restore } = require('firestore-export-import');
require('dotenv').config();
const serviceAccount = require(process.env.SERVICE_ACCOUNT_FILE);

// If you want to pass settings for firestore, you can add to the options parameters
let options = null;
if (process.env.LOCAL.toUpperCase() === 'TRUE') { // Use the local emulator.
    options = {
            firestore: {
                host: 'localhost:8080',
                ssl: false,
            },
        };
}

// Initiate Firebase App
const appName = '[DEFAULT]';

let firestore;
if (options === null)
    firestore = initializeFirebaseApp(serviceAccount, appName);
else
    firestore = initializeFirebaseApp(serviceAccount, appName, options);

restore(firestore, './data/firestoreImport.json')
    .then(result=> {
        console.log('Successfully loaded provinces data.');
        console.log(result);
    },
    error=> {
        console.log(error);
    });