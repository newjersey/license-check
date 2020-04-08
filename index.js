
const express = require('express');
const { checkLicenseStatus } = require('./license');
const { createNewVolunteer } = require('./airtable');

const app = express();
const multer  = require('multer')();

app.set('port', process.env.port || 3000);

app.post('/', multer.none(), function (req, res, next) {
    
    let data = null;
    try {
        data = JSON.parse(req.body.rawRequest);
    } catch (err) {
        return next(err);
    }
    const prettyData = getPrettyData(req.body.pretty, data);

    if (!prettyData['New Jersey State License Number'] || !prettyData['New Jersey State License Number'].length) {
        // TODO: we still create the new Airtable record...

        console.log('Creating Airtable record for no license');
        

        return res.end('Success!');
    }

    checkLicenseStatus({
        first: prettyData['First Name'],
        last: prettyData['Last Name'],
        state: prettyData['State'],
        dob: prettyData['Date of Birth'],
        license: prettyData['New Jersey State License Number']
    })
        .then(async (result) => {
            if (result) {
                prettyData['License Status'] = result.status;
                if (result.status === 'Active') {
                    prettyData['Verified Record'] = true;
                }
            }

            try {
                await createNewVolunteer(prettyData);
                res.end('Success!');
            } catch(err) {
                // TODO: not sure what to do if we can't store in airtable...
                console.error('UNABLE TO STORE RECORD IN AIRTABLE:', err);
                res.writeHead(500);
                return res.end('Woops');
            }
        })
        .catch((err) => {
            // TODO: how do we handle errors???
            //       I think we still need to create the Airtable record...

            console.error(err);
            res.writeHead(500);
            res.end('Woops');
            return;
        });

});

function getPrettyData(stringFormat, data) {
    // The "Pretty" data comes in this way, which is what we want in Airtable...
    // 'Name:Jane Doe, Email:jane@doe.com, The Date:04 17 2008, State License Number:4525128, State:NJ'
    let prettyData = {};
    stringFormat.split(/, /g).forEach((field) => {
        prettyData[field.split(/:/)[0]] = field.split(/:/)[1];
    });
    prettyData['License Status'] = '';
    prettyData['First Name'] = data.q3_name.first;
    prettyData['Last Name'] = data.q3_name.last;
    prettyData['Street Address'] = data.q8_address.addr_line1;
    prettyData['Street Address Line 2'] = data.q8_address.addr_line2;
    prettyData['City'] = data.q8_address.city;
    prettyData['State'] = data.q8_address.state;
    prettyData['Zip Code'] = data.q8_address.postal;
    prettyData['Country'] = data.q8_address.country;
    prettyData['Date of Birth'] = `${data.q6_dateOf.year}-${data.q6_dateOf.month}-${data.q6_dateOf.day}`;
    prettyData['Verified Record'] = false;

    return prettyData;
}

app.listen(app.get('port'), () => {
    console.log(`App listening at http://localhost:${app.get('port')}`);
});
