# NJ Healthcare Volunteer Coordination

This code supports the New Jersey [Office of Innovation](https://innovation.nj.gov/)'s efforts to help coordinate [healthcare volunteers](https://covid19.nj.gov/volunteer) in [New Jersey's response to COVID-19](https://covid19.nj.gov).


## What is this?

This code is intended to be used as a webhook from a form tool like Jotform. It performs two actions currently:

1. Validate the license information from the form entry with State of New Jersey healthcare license information
2. Create the healthcare volunteer record in the coordination system (currently Airtable)

## How do I run this code locally and test it?

1. Create an Airtable with the correct fields (see `VALID_FIELDS` constant in the `airtable.js` file)
2. Create a license database (PostgreSQL is what is currently used), see the table schema in `licenses.sql`
    * Note that you probably need some data in that table to test with...
3. Create some Environment variables:
    * `AIRTABLE_API_KEY="keyXXXXXXXXXXXXXX"`
    * `AIRTABLE_BASE="appXXXXXXXXXXXXXX"`
    * `PG_CONNECTION="postgresql://postgres:foobar@1.2.3.4:5432/license-db"`
    * `AIRTABLE_TABLE="People"`
4. Install [Postman](https://www.postman.com/), then import the postman_API_example.json file into Postman.
5. Install Node and then the application dependencies with: `npm install`
6. Start the Node server: `node .`
7. Run a Postman API request and observe the results in the console and in Airtable


