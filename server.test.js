// app.test.js
const request = require('supertest');
const { app, insertDataIntoDatabase } = require('./server');
const { Pool } = require('pg');

describe('Check route', () => {
  it('should return 200 OK on GET /fetch-csv-data', async () => {
    const res = await request(app).get('/fetch-csv-data');
    expect(res.status).toBe(200);
    expect(res.text).toBe('CSV data processing complete.');
  });
});

describe('Insert Data Into Database', () => {
  let pool;

  beforeAll(() => {
    pool = new Pool({
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE meter_readings');
  });

  it('should insert data into the database', async () => {
    const nmi = 'NEM2201009';
    const timestamp = '20211231';
    const consumption = 100.5;

    await insertDataIntoDatabase(nmi, timestamp, consumption);

    const result = await pool.query(
      'SELECT * FROM meter_readings WHERE nmi = $1 AND timestamp = $2',
      [nmi, timestamp]
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].nmi).toBe(nmi);
    const expectedTimestamp = new Date(
      '2021-12-30T16:00:00.000Z'
    ).toISOString();
    expect(result.rows[0].timestamp.toISOString()).toBe(expectedTimestamp);
    expect(parseFloat(result.rows[0].consumption)).toBeCloseTo(100.5);
  });

  it('should not insert data if it already exists in the database', async () => {
    const nmi = 'NEM2201009';
    const timestamp = '20211231';
    const consumption = 100.5;

    await pool.query(
      'INSERT INTO meter_readings (nmi, timestamp, consumption) VALUES ($1, $2, $3)',
      [nmi, timestamp, consumption]
    );

    await insertDataIntoDatabase(nmi, timestamp, consumption);

    const result = await pool.query(
      'SELECT * FROM meter_readings WHERE nmi = $1 AND timestamp = $2',
      [nmi, timestamp]
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].nmi).toBe(nmi);
    const expectedTimestamp = new Date(
      '2021-12-30T16:00:00.000Z'
    ).toISOString();
    expect(result.rows[0].timestamp.toISOString()).toBe(expectedTimestamp);
    expect(parseFloat(result.rows[0].consumption)).toBeCloseTo(100.5);
  });
});
