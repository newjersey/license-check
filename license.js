const Airtable = require('airtable');

const API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE;

/**
 * @param Object personData The data about the person in the format: { first, last, dob, license }
 * @param Boolean update Whether or not we should update the person's record with the result (DEFAULT: TRUE)
 * @returns Promise Will resolve with a boolean telling whether the license is valid or not
 */
function updateLicenseStatus(personData, update) {
    const willUpdate = (update === false) ? false : true;

    return new Promise(async (resolve, reject) => {
        try {
            const validLicense = await checkLicenseData(personData);
            if (willUpdate) {
                await updateVolunteer(personData, validLicense);
            }
            resolve(validLicense);
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = updateLicenseStatus;


/* ------------------------- Helpers ---------------------- */

async function checkLicenseData(data) {    
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.license) { resolve(false); }

            const licenseData = await findLicenseByNumber(data.license);

            if (licenseData && 
                licenseData.dob == data.dob && 
                licenseData.first == data.first &&
                licenseData.last == data.last &&
                licenseData.status == 'Active') {
                
                resolve(true);
            } else {
                // Invalid license number (or other data)
                resolve(false);
            }

        } catch (err) {
            reject(err);
        }
    });
}

function findLicenseByNumber(licenseNumber) {
    return new Promise((resolve, reject) => {
        // TODO: read DB looking for that license number
        
        resolve({ number: licenseNumber, status: 'Active', first: 'John', last: 'Doe', dob: '1976-08-14' });
    });
}


function updateVolunteer(data, validLicense) {    
    return new Promise((resolve, reject) => {
        const base = new Airtable({apiKey: API_KEY}).base(AIRTABLE_BASE);

        // find airtable record...
        base('People').select({
            maxRecords: 2,
            filterByFormula: `AND({First Name} = '${data.first}', {Last Name} = '${data.last}', {License Number} = '${data.license}')`
        }).firstPage((err, records) => {
            if (err) {
                console.error(err);
                return reject(err);
            }

            if (records.length < 1) {
                console.error('No records for person', data);
                return reject(new Error(`Could not find Airtable record for ${data.first} ${data.last} (license: ${data.license})`));
            }
            if (records.length > 1) {
                console.error('Multiple records for person', data);
                return reject(new Error(`Found multiple records in Airtable for ${data.first} ${data.last} (license: ${data.license})`));
            }

            // TODO: update the record...

            console.log('Updating record:', records[0].getId());
            resolve();
        });
    });
}

