# NJ Healthcare Volunteer Coordination

This code supports the New Jersey [Office of Innovation](https://innovation.nj.gov/)'s efforts to help coordinate [healthcare volunteers](https://covid19.nj.gov/volunteer) in [New Jersey's response to COVID-19](https://covid19.nj.gov).


## What's in here?

There are two different pieces of code in here:

1. [A CLI tool](#1-the-license-loader) for loading license data from flat files into the license database.

2. [A web application](#2-the-webhook-web-app) intended to be a webhook from an online form (like Jotform) which will perform a license check against a database and then create an Airtable record.


## 1. The License Loader

This is a self-contained NOde module called `load-licenses.js` that will take data from either a csv or tab-delimited file, check and format the data, and then store it in a PostgreSQL database. The intent is that this database would then be used to validate volunteer form entries.

### Running the CLI Tool

You can do a test run of this tool on your own system by setting up a local PostgreSQL database and then using the files in `./data/test` in this repo. The Postgres database will need a table called `njcovid.licenses`, and you can find the SQL for creating that table in `./data/licences.sql`.

To run the script, execute this command in yoru terminal from the repo root directory:

`node load-licenses.js ./data/test/nj-license-test.txt $PG_CONNECTION`

Obviously in the case above you need to have a Postgres connection string in an environment variable called `PG_CONNECTION`. You can see the results in the terminal, and then new records in the license database.

### Running This Script Regularly

The idea is that this script can pick up new and updated license information from a flat file on a regular basis. This can be accomplished by using a cron job on a server. You can set up the file drops any way you want, but here's one way:

1. Have new files dropped in a folder with a date in the name, like: `./data.drops/licenses_2020-04-20.txt`
2. Create a nightly cron job that reads that file and runs the script in here:  
```
0 23 * * * /usr/bin/node /opt/covid/license-check/load-licenses.js ./data/drops/licenses_`date +\%Y-\%m-\%d`.txt $PG_CONNECTION >> /var/log/covid/license-load_`date +\%Y-\%m-\%d`.log 2>&1
```
3. Be sure to check the logs (especially at the beginning) to see results.
    * Note that you will need to make the `/var/log/covid/` directory writeable by the user that runs this script!

Of course, there is a lot of other things to get this set up, but those are the basics.

### Things don't look right...

Yeah, that'll happen. There is a `DEBUG` switch you can tack onto the end of this CLI tool to see more information and errors:

`node load-licenses.js ./data/test/nj-license-test.txt $PG_CONNECTION DEBUG`


## 2. The Webhook Web App

This portion of the code includes three files:
* `index.js`: a very simple Express app for listening to webhooks and coordinating actions
* `license.js`: a module to check license information from the form with a Postgres Database
* `airtable.js`: a module to create new records in an Airtable Base from the form data

### How do I run this code and test it?

1. Create an Airtable with the correct fields (see `VALID_FIELDS` constant in the `airtable.js` file)
2. Create a license database (PostgreSQL is what is currently used), see the table schema in `licenses.sql`
    * Note that you probably need some data in that table to test with...
3. Create some Environment variables:
    * `AIRTABLE_API_KEY="keyXXXXXXXXXXXXXX"`
    * `AIRTABLE_BASE="appXXXXXXXXXXXXXX"`
    * `PG_CONNECTION="postgresql://postgres:foobar@1.2.3.4:5432/license-db"`
    * `AIRTABLE_TABLE="People"`
    * `PORT=3000`  (or whatever you want)
4. Install [Postman](https://www.postman.com/), then import the postman_API_example.json file into Postman.
5. Install Node and then the application dependencies with: `npm install`
6. Start the Node server: `node .`
7. Run a Postman API request and observe the results in the console and in Airtable

### Deploying This Code

When you're ready to deploy this portion of the code, you need to have those three files above, the Node dependencies, and some server (or serverless function environment) that can listen to HTTP POST requests.

Some other things...
* Be sure to set the appropriate environment variables!
* This isn't set up to do any certificate checking, so it's only listening on HTTP (not HTTPS)
