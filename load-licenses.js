
const { once } = require('events');
const fs = require('fs');
const readline = require('readline');
const { Client } = require('pg');

let DEBUG = false;
let START_TIME = 0;
const PREPARED_STATEMENT = `PREPARE upsert (character varying, character varying, character varying, character varying, character varying, character varying) AS 
    INSERT INTO njcovid.licenses (license_number, first_name, last_name, state, status, date_of_birth) VALUES ($1, $2, $3, $4, $5, $6) 
        ON CONFLICT (license_number) DO UPDATE SET status = EXCLUDED.status;`;

(async function main() {
    START_TIME = Date.now();

    if (process.argv.length < 4 || process.argv[2] == '-h' || process.argv[2] == '--help' || process.argv[2] == 'help') {
        printHelp();
        process.exit(128);
    }

    console.log(process.argv);
    if (process.argv.length > 4 && process.argv[4] === 'DEBUG') {
        DEBUG = true;
        log('Set DEBUG to true', false);
    }

    const fileInput = process.argv[2];
    const dbConnect = process.argv[3];
    
    log(`${(new Date()).toISOString()} Starting license-data load...`, false);

    await checkInputs(fileInput, dbConnect);
    const fileData = await readFile(fileInput);
    const sql = buildQuery(fileData.headers, fileData.rows);
    const dbResults = await executeQuery(dbConnect, sql);
    
    log(`Script complete. Upserted ${dbResults.rowCount} license records with ${dbResults.issues.length} issues.\nTotal run time: ${Date.now() - START_TIME}ms\n`, false);
})();

function checkInputs(fileInput, dbConnect) {
    return new Promise(async (resolve) => {
        log('Checking input file extension');
        const ext = getFileExtension(fileInput);
        if (ext !== 'csv' && ext !== 'txt') {
            error('Only files with .csv or .txt (tab-delimited) extensions are accepted.');
        }

        try {
            log(`Checking read access to input file: ${fileInput}`);
            fs.accessSync(fileInput, fs.constants.R_OK);
            log('Input file access OK');
        } catch(err) {
            error(err);
        }

        if (dbConnect !== '-') {
            try {
                log(`Checking database connection`);
                const client = new Client({ connectionString: dbConnect });
                await client.connect();
                await client.end();
                log('DB connection made, closing for now');
            } catch(err) {
                error(err);
            }
        } else {
            log('Skipping DB access check');
        }

        resolve();
    });
}

function readFile(fileInput) {
    return new Promise(async (resolve) => {
        try {
            log('Starting file read', false);
            const fileStream = fs.createReadStream(fileInput);
            const reader = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            const rows = [];
            const issues = [];
            let headers = null;
            reader.on('line', (line) => {
                if (headers === null) {
                    headers = processHeaders(line, fileInput);
                } else if (!line.length) {
                    log('Ignoring empty line');
                } else {
                    log(`Reading line: ${line} and normalizing`);
                    const ext = getFileExtension(fileInput);
                    if (ext === 'txt') {
                        rows.push(line.split(/\t/g));
                    } else if (ext === 'csv') {
                        rows.push(line.split(/,/g));
                    }

                    if (rows[rows.length-1].length !== headers.length) {
                        log(`** ISSUE: Row does not match header length!`, false);
                        issues.push(`Row does not match header length: ${line}`);
                    }
                }
            });
            await once(reader, 'close');

            log(`Read ${rows.length} rows in the file plus the headers. There were ${issues.length} issues`, false);
            resolve({rows, headers, issues});

        } catch(err) {
            error(err);
        }
    });
}

function processHeaders(headerLine, fileInput) {
    if (!headerLine || !headerLine.length) {
        error('Looks like the headerLine is empty!');
    }

    log('Checking header row format');
    const ext = getFileExtension(fileInput);
    if (ext === 'txt' && !/\t/.test(headerLine)) {
        error('The "txt" file extension must be tab-delimited!');
    }
    if (ext === 'csv' && !/,/.test(headerLine)) {
        error('The "csv" file extension must be comma-separated values!');
    }

    log('Normalizing headerline for parsing');
    headerLine = headerLine
        .toLowerCase()
        .replace('license_no', 'license_number')
        .replace('license status', 'status');

    log('Extract headers from header line');
    let headers = null;
    if (ext === 'txt') {
        headers = headerLine.split(/\t/g);
    } else if (ext === 'csv') {
        headers = headerLine.split(/,/g);
    }
    headers = headers.map((h) => { return h.trim().replace(/[\-\s]+/g, '_') });

    log(`Input file headers: ${JSON.stringify(headers)}`);
    return headers;
}

function buildQuery(headers, rows) {
    log('Building SQL prepared statements');

    const prepare = [];

    for (let i=0; i<rows.length; ++i) {
        const license = rows[i][headers.indexOf('license_number')];
        const first_name = rows[i][headers.indexOf('first_name')].toLowerCase().replace(/\'/g, `''`);
        const last_name = rows[i][headers.indexOf('last_name')].toLowerCase().replace(/\'/g, `''`);
        let state = rows[i][headers.indexOf('state')];
        if (!state) {
            state = /NJDCATEMP/.test(rows[i][headers.indexOf('license_number')]) ? '??' : 'NJ';
        }
        const status = rows[i][headers.indexOf('status')];

        let date_of_birth = rows[i][headers.indexOf('date_of_birth')];
        if (date_of_birth) {
            const d = new Date(date_of_birth);
            if (d.getTime()) {
                date_of_birth = d.toISOString().split(/T/)[0];
            }
        }

        prepare.push(`EXECUTE upsert('${license}', '${first_name}', '${last_name}', '${state}', '${status}', '${date_of_birth}');`);
    }
    
    log(`Built ${prepare.length} prepared statements`);
    return prepare;
}

function executeQuery(dbConnect, sql) {
    return new Promise(async (resolve) => {
        if (dbConnect === '-') {
            log('** SKIPPING database UPSERT', false);
            return resolve({ rowCount: sql.length, issues: [] });
        }

        log('Executing database query');
        let client = null;
        try {
            log(`Connecting to database`);
            client = new Client({ connectionString: dbConnect });
            await client.connect();

            log('Creating Prepared Statement');
            await client.query(PREPARED_STATEMENT);

        } catch (err) {
            error(err);
        }

        let rowCount = 0;
        const issues = [];
        log('Performing database UPSERTs', false);
            
        for (let i=0; i<sql.length; ++i) {
            try {
                const result = await client.query(sql[i]);

                if (result.rowCount === 1) {
                    log(`UPSERTed record: ${sql[i]}`);
                    rowCount++;
                } else if (result.rowCount === 0) {
                    log(`** ISSUE with query (no rows affected): ${sql[i]}`, false);
                }
            } catch (err) {
                issues.push(`ISSUE with query ${sql[i]}: ${err.message}`);
                log(`** ISSUE with query ${sql[i]}: ${err.message}`, false);
                if (DEBUG) { console.error(err); }
            }
        }
        
        try {
            await client.end();
            log('DB connection closed');
        } catch(err) {
            error(err);
        }

        resolve({ rowCount, issues });
    });
}


/* ************************************************************ *
                        HELPER FUNCTIONS
 * ************************************************************ */

function printHelp() {
    console.log(`\nNJ healthcare license data loader
This script reads flat-files and loads the data into a license 
database as specified in a connection string in the CLI arguments.
This script will INSERT any previously non-existent licenses and 
it will UPDATE any licenses that already exist.

Script usage:
    node load-licenses.js input-file.ext (db-connection | -) [DEBUG]

INPUTS:
input-file-ext    Must be a flat-file of license data, either as 
                  comma-separated-values (csv) or in tab-delimited format. 
                  The first row MUST be headers. Note that the extenstion 
                  (.ext) of the input file will inform this script how to 
                  process the input!

db-connection     The db-connection must be a database connection string 
                  for example: "postgresql://user:pass@1.2.3.4:5432/db-name"
                  *** Currently, this script only works with PostgreSQL!
                      That said, the DB connection and querying is in a 
                      separate function and isolated so that switching DBMS
                      should be straight forward.
                  
                  If you pass in "-" as the database connection, everything 
                  will run as normal, but no database query will be executed.

DEBUG             Add this option will print a LOT of messages about what's 
                  happening. Only use this if you are debugging this script.

OUTPUTS:
There are no direct outputs from this script other than the node console log.
It is highly advised that that output be piped to a file for each run so as
to retain any issues:
    node load-licenses.js example.csv db-connect-string &> output.txt\n`);
}

function getFileExtension(filename) {
    const filenamePieces = filename.split(/\./g);
    return filenamePieces[filenamePieces.length-1];
}

function log(msg, debugOnly=true) {
    if (debugOnly && DEBUG) {
        console.log(msg);
    } else if (!debugOnly) {
        console.log(msg);
    }
}

function error(err) {
    if (typeof(err) === 'string') {
        err = new Error(err);
    }
    if (DEBUG) {
        console.error(err);
    } else {
        console.error(err.message);
    }
    process.exit(128);
}
