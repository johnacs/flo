- install module dependencies
  `npm install`

- edit .env.example, fill in the required details, rename to .env. Configuration detail provided in email

- run server
  `npm start`

- call the server endpoint
  `curl http://localhost:3001/fetch-csv-data`

### notes

- [Assessment requirement](https://docs.google.com/document/d/1a3cySsySkKSfgkP9VtdvFnGWGU-VkjCV7QD0XLHAz1I/edit)
- code written in node, using express framework
- in the example data, for the same NMI (NEM1201999), there are 2 records with different measurement points (4th item in the 200 row), namely 1 and 2
- each 200 row are accompanied by sets of 300 rows
- for each date, the total consumption is computed by summing up the consumption of the 300 rows with the same date for all measurement points
