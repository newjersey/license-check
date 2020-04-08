
const { Client } = require('pg');

/**
 * @param Object personData The data about the person in the format: { first, last, dob, license }
 * @returns Promise Will resolve with an Object that has the current license info for the given person
 */
async function checkLicenseStatus(personData) {
    return new Promise(async (resolve, reject) => {
        try {
            resolve(await getLicenseData(personData));
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = {
    checkLicenseStatus
};


/* ------------------------- Helpers ---------------------- */

function getLicenseData(personData) {    
    return new Promise(async (resolve, reject) => {
        try {
            if (!personData.license) { resolve(false); }

            const licenseData = await findLicenseByNumber(personData.state, personData.license);

            if (licenseData && 
                licenseData.date_of_birth === personData.dob && 
                licenseData.first_name === personData.first &&
                licenseData.last_name === personData.last &&
                licenseData.status === 'Active') {
                
                licenseData.valid = true;
                
            } else if (licenseData) {
                licenseData.valid = false;
            }

            resolve(licenseData);

        } catch (err) {
            reject(err);
        }
    });
}

function findLicenseByNumber(state, licenseNumber) {
    return new Promise(async (resolve, reject) => {
        try {
            const client = new Client({
                connectionString: process.env.PG_CONNECTION
            });
            await client.connect();

            const query = {
                name: 'fetch-license',
                text: 'select * from licenses WHERE state = $1 and license_number = $2',
                values: [state, licenseNumber],
            }

            const res = await client.query(query);
            await client.end();

            if (res.rows.length) {
                resolve(res.rows[0]);
            } else {
                resolve(null);
            }

        } catch(err) {
            reject(err);
        }
    });
}
