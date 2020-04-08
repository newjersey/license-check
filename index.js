const http = require('http');
const checkLicenseStatus = require('./license');

const requestListener = function (req, res) {
    let data = [];
    req.on('data', chunk => {
        data.push(chunk.toString());
    });
    req.on('end', () => {
        let fields;
        // I am very much cheating here... None of the multi-part form libraries were working, and this is
        // TODO: we should not do this.
        data.join('').split(/\n/).filter((line) => {
            try {
                fields = JSON.parse(line);
                return true;
            } catch (e) {
                return false;
            }
        });

        checkLicenseStatus({
            first: fields.q3_name.first,
            last: fields.q3_name.last,
            state: fields.q7_state,
            dob: `${fields.q6_theDate.year}-${fields.q6_theDate.month}-${fields.q6_theDate.day}`,
            license: fields.q5_stateLicense
        })
            .then((result) => {
                // TODO: create Airtable record

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
}

const server = http.createServer(requestListener);
server.listen(3000, () =>{
    console.log('Server running on port 3000');
});
