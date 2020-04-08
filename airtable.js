
const Airtable = require('airtable');


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