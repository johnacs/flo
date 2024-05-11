const express = require('express');
require('dotenv').config();

const cors = require('cors');
const axios = require('axios');
const Papa = require('papaparse');
const { Pool } = require('pg');
const { roundToFixed } = require('./utils/utilities');

const app = express();
app.use(cors());
app.listen(3001, () => {});

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
});

const parseCsvData = async (data) => {
  try {
    let consumptionByNMIAndTimeStamp = {}; // Store total consumption for each NMI

    return Papa.parse(data, {
      header: false,
      chunk: async (results) => {
        let nmi, intervalLength;
        for (const record of results.data) {
          const recordType = record[0];
          if (recordType === '200') {
            nmi = record[1];
            intervalLength = record[8];
          } else if (recordType === '300') {
            const timestamp = record[1];
            const numberOfIntervalValues = parseInt(
              1440 / parseInt(intervalLength)
            );
            const totalConsumption = record
              .slice(2, numberOfIntervalValues + 3)
              .map((value) => parseFloat(value))
              .reduce((sum, value) => sum + value, 0)
              .toFixed(4);

            // Check if NMI entry exists in the consumptionByNMIAndTimeStamp object
            if (!consumptionByNMIAndTimeStamp[nmi]) {
              consumptionByNMIAndTimeStamp[nmi] = {};
            }

            // Store total consumption for the timestamp under the corresponding NMI
            if (!consumptionByNMIAndTimeStamp[nmi][timestamp]) {
              consumptionByNMIAndTimeStamp[nmi][timestamp] = 0;
            }

            consumptionByNMIAndTimeStamp[nmi][timestamp] +=
              parseFloat(totalConsumption);
          }
        }

        for (const nmi in consumptionByNMIAndTimeStamp) {
          for (const timestamp in consumptionByNMIAndTimeStamp[nmi]) {
            const consumption = roundToFixed(
              consumptionByNMIAndTimeStamp[nmi][timestamp],
              4
            );
            await insertDataIntoDatabase(nmi, timestamp, consumption);
          }
        }
      },
    });
  } catch (error) {
    throw error;
  }
};

const insertDataIntoDatabase = async (nmi, timestamp, consumption) => {
  const client = await pool.connect();
  try {
    const existingDataQuery =
      'SELECT id FROM meter_readings WHERE "nmi" = $1 AND "timestamp" = $2';

    const existingData = await client.query(existingDataQuery, [
      nmi,
      timestamp,
    ]);
    if (existingData.rows.length === 0) {
      const query =
        'INSERT INTO meter_readings (id, "nmi", "timestamp", consumption) VALUES (gen_random_uuid(), $1, $2, $3)';
      await client.query(query, [nmi, timestamp, consumption]);
      return {};
    }
  } finally {
    client.release();
  }
};

app.get('/fetch-csv-data', async (req, res) => {
  try {
    // The csv file should be obtained from the server, below commented is an example.
    // const param = req.query.file;
    // const { data } = await axios.get(
    //   `https://example.com/retrieve-csv-file/?file=${param}.csv`
    // );

    // I hardcoded the below to retrieve sample data
    const { data } = await axios.get(
      'https://mediamechanics.com.sg/clients/flo/sample-data.csv'
    );

    await parseCsvData(data);
    res.status(200).send('CSV data processing complete.');
  } catch (error) {
    res.status(500).send('Error fetching CSV data.');
  }
});

module.exports = { app, insertDataIntoDatabase };
