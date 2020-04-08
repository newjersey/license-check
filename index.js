
const express = require('express');
const { checkLicenseStatus } = require('./license');

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

    // 'Name:Jane Doe, Email:jane@doe.com, The Date:04 17 2008, State License Number:4525128, State:NJ'
    let prettyData = {};
    req.body.pretty.split(/, /g).forEach((field) => {
        prettyData[field.split(/:/)[0]] = field.split(/:/)[1];
    });
    prettyData['Date of Birth'] = `${data.q6_dateOfBirth.year}-${data.q6_dateOfBirth.month}-${data.q6_dateOfBirth.day}`;

    console.log('FORM DATA (PRETTY)', prettyData);

    checkLicenseStatus({
        first: data.q3_name.first,
        last: data.q3_name.last,
        state: data.q7_state,
        dob: `${data.q6_dateOfBirth.year}-${data.q6_dateOfBirth.month}-${data.q6_dateOfBirth.day}`,
        license: data.q5_stateLicense
    })
        .then((result) => {
            // TODO: create Airtable record
            console.log('License Check:', result);
            

            res.writeHead(200);
            res.end('Success!');
        })
        .catch((err) => {
            // TODO: how do we handle errors???
            //       I think we still need to create the Airtable record

            console.error(err);
            res.writeHead(500);
            res.end('Woops');
            return;
        });

});

app.listen(app.get('port'), () => {
    console.log(`App listening at http://localhost:${app.get('port')}`);
});
