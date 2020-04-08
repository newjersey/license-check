
const { Client } = require('pg');

const STATES = {
    'Alaska': 'AK', 
    'Alabama': 'AL', 
    'Arkansas': 'AR', 
    'American Samoa': 'AS', 
    'Arizona': 'AZ', 
    'California': 'CA', 
    'Colorado': 'CO', 
    'Connecticut': 'CT', 
    'District of Columbia': 'DC', 
    'Delaware': 'DE', 
    'Florida': 'FL', 
    'Georgia': 'GA', 
    'Guam': 'GU', 
    'Hawaii': 'HI', 
    'Iowa': 'IA', 
    'Idaho': 'ID', 
    'Illinois': 'IL', 
    'Indiana': 'IN', 
    'Kansas': 'KS', 
    'Kentucky': 'KY', 
    'Louisiana': 'LA', 
    'Massachusetts': 'MA', 
    'Maryland': 'MD', 
    'Maine': 'ME', 
    'Michigan': 'MI', 
    'Minnesota': 'MN', 
    'Missouri': 'MO', 
    'Mississippi': 'MS', 
    'Montana': 'MT', 
    'North Carolina': 'NC', 
    'North Dakota': 'ND', 
    'Nebraska': 'NE', 
    'New Hampshire': 'NH', 
    'New Jersey': 'NJ', 
    'New Mexico': 'NM', 
    'Nevada': 'NV', 
    'New York': 'NY', 
    'Ohio': 'OH', 
    'Oklahoma': 'OK', 
    'Oregon': 'OR', 
    'Pennsylvania': 'PA', 
    'Puerto Rico': 'PR', 
    'Rhode Island': 'RI', 
    'South Carolina': 'SC', 
    'South Dakota': 'SD', 
    'Tennessee': 'TN', 
    'Texas': 'TX', 
    'Utah': 'UT', 
    'Virginia': 'VA', 
    'Virgin Islands': 'VI', 
    'Vermont': 'VT', 
    'Washington': 'WA', 
    'Wisconsin': 'WI', 
    'West Virginia': 'WV', 
    'Wyoming': 'WY'
};

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

            const state = convertState(personData.state);

            const licenseData = await findLicenseByNumber(state, personData.license);

            console.log('person data:', personData);
            console.log('license data:', licenseData);
            

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

function convertState(formData) {
    if (formData.length > 2 && STATES[formData]) {
        return STATES[formData];
    } else {
        return formData;
    }
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
