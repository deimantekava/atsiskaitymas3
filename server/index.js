const express = require('express');
const mysql = require('mysql2');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { authenticate } = require('./middleware');
require('dotenv').config();

const server = express();
server.use(express.json());
server.use(cors());

const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Labas.01',
  database: 'atsiskaitymas3',
};

const loginUserSchema = Joi.object({
  // eslint-disable-next-line newline-per-chained-call
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required(),
});

const registerUserSchema = Joi.object({
  // full_name: Joi.string().required(),
  // eslint-disable-next-line newline-per-chained-call
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required(),
});

const dbPool = mysql.createPool(mysqlConfig).promise();

server.get('/', authenticate, (req, res) => {
  console.log(req.user);
  res.status(200).send({ message: 'Authorized' });
});

// POST/register - gauname vartotojo duomenis,
// juos validuojame ir išsaugome į duomenų bazę.
server.post('/register', async (req, res) => {
  let payload = req.body;

  try {
    payload = await registerUserSchema.validateAsync(payload);
  } catch (error) {
    console.error(error);

    return res.status(400).send({ error: 'All fields are required' });
  }

  try {
    const encryptedPassword = await bcrypt.hash(payload.password, 10);
    await dbPool.execute(
      `
            INSERT INTO users (full_name, email, password)
            VALUES (?, ?, ?)
        `,
      [payload.full_name, payload.email, encryptedPassword],
    );

    return res.status(201).end();
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
});

// POST/login - gauname vartotojo duomenis, validuojame
// ir patikriname ar toks vartotojas egzistuoja pagal email ir password.
// Jei egzistuoja, sugeneruojame token su user_id ir jį grąžiname.
// Jei ne, grąžiname klaidą su žinute, kas buvo negerai.
server.post('/login', async (req, res) => {
  let payload = req.body;

  try {
    payload = await loginUserSchema.validateAsync(payload);
  } catch (error) {
    console.error(error);

    return res.status(400).send({ error: 'All fields are required' });
  }

  try {
    const [data] = await dbPool.execute(
      `
        SELECT * FROM users
        WHERE email = ?
    `,
      [payload.email],
    );

    if (!data.length) {
      return res.status(400).send({ error: 'Email or password did not match' });
    }

    const isPasswordMatching = await bcrypt.compare(
      payload.password,
      data[0].password,
    );

    if (isPasswordMatching) {
      const token = jwt.sign(
        {
          email: data[0].email,
          id: data[0].id,
        },
        process.env.JWT_SECRET,
      );
      return res.status(200).send({ token });
    }

    return res.status(400).send({ error: 'Email or password did not match' });
  } catch (error) {
    console.error(error);
    return res.status(500).end();
  }
});

// GET /groups - grąžina groups lentelės informaciją
// (bus naudinga groups.html select laukui generuoti)
server.get('/groups', async (_, res) => {
  try {
    const [groups] = await dbPool.execute('SELECT * FROM bill_groups');
    res.json(groups);
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

// POST /groups - tik prisijungusiems vartotojams sukuriama nauja grupė groups lentelėje.
server.post('/groups', async (req, res) => {
  try {
    const payload = {
      name: req.body.name,
    };
    const [response] = await dbPool.query('INSERT INTO bill_groups SET ?', [
      payload,
    ]);
    return res.status(201).json(response);
  } catch (err) {
    console.log(err);
    return res.status(500).end();
  }
});

server.listen(8080, () => console.log('Server is running on port 8080'));
