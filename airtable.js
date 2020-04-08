
const Airtable = require('airtable');

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE = process.env.AIRTABLE_BASE;
const TABLE = process.env.AIRTABLE_TABLE;

const VALID_FIELDS = [
    'Unique Key',
    'Submission Date',
    'First Name',
    'Last Name',
    'Email',
    'Date of Birth',
    'Phone Number',
    'Street Address',
    'Street Address Line 2',
    'City',
    'State',
    'Zip Code',
    'Country',
    'Please select your healthcare practice area.',
    'Please enter your healthcare practice area.',
    'Please select all populations that you have experience or competency working with.',
    'Please list any additional specialties and certifications.',
    'What is the status of your license?',
    'New Jersey State License Number',
    'NPI Number (if applicable)',
    'Please enter license details from other states.',
    'When did you most recently practice?',
    'Please check all that apply to you.',
    'Where in New Jersey would you be willing to work? (select all that apply)',
    'Would you also consider conducting telehealth visits?',
    'Are you a member of the Medical Reserve Corp?',
    'What languages do you speak at an advanced or fluent level? (select all that apply)',
    'Earliest date available (leave blank for immediately)',
    'Describe your interest and ability to be able to provide your services to treat patients if the need should arise in the future.',
    'Verified Record',
    'License Status'
];

function createNewVolunteer(data) {
    return new Promise((resolve, reject) => {
        const base = new Airtable({apiKey: API_KEY}).base(BASE);

        console.log(`Creating Airtable record for license holder: ${data['First Name']} ${data['Last Name']} (${data['New Jersey State License Number']})`);
        data['Unique Key'] = generateID(data);
        if (!data['Submission Date']) {
            data['Submission Date'] = (new Date).toISOString();
        }

        // Sanitize our data before storing it...
        const recordData = {};
        VALID_FIELDS.forEach((field) => {
            if (data[field]) {
                recordData[field] = data[field];
            }
        });

        base(TABLE).create(recordData, function(err, record) {
            if (err) {
              console.error(err);
              return reject(err);
            }
            console.log('Created volunteer record:', record.getId());
            resolve(record);
          });
    });
}

function generateID(data) {
    return (data['First Name'] + '-' + data['Last Name'] + '-' + Date.now()).toLowerCase().replace(/[^a-z0-9\-]/g, '');
}

// function updateVolunteer(data, validLicense) {    
//     return new Promise((resolve, reject) => {
//         const base = new Airtable({apiKey: API_KEY}).base(AIRTABLE_BASE);

//         // find airtable record...
//         base('People').select({
//             maxRecords: 2,
//             filterByFormula: `AND({First Name} = '${data.first}', {Last Name} = '${data.last}', {License Number} = '${data.license}')`
//         }).firstPage((err, records) => {
//             if (err) {
//                 console.error(err);
//                 return reject(err);
//             }

//             if (records.length < 1) {
//                 console.error('No records for person', data);
//                 return reject(new Error(`Could not find Airtable record for ${data.first} ${data.last} (license: ${data.license})`));
//             }
//             if (records.length > 1) {
//                 console.error('Multiple records for person', data);
//                 return reject(new Error(`Found multiple records in Airtable for ${data.first} ${data.last} (license: ${data.license})`));
//             }

//             // TODO: update the record...

//             console.log('Updating record:', records[0].getId());
//             resolve();
//         });
//     });
// }

module.exports = {
    createNewVolunteer
};
