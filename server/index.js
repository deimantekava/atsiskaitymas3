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
  full_name: Joi.string().required(),
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
    const [response] = await dbPool.execute(
      `
            INSERT INTO users (full_name, email, password)
            VALUES (?, ?, ?)
        `,
      [payload.full_name, payload.email, encryptedPassword],
    );
    const token = jwt.sign(
      {
        name: payload.name,
        email: payload.email,
        id: response.insertId,
      },
      process.env.JWT_SECRET,
    );
    return res.status(201).json({ token });
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
      return res.status(200).json({ token });
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

// POST /accounts - endpoint'as skirtas priskirti vartotoją kažkuriai grupei.
// Vartotojas paduoda group_id ir savo token, iš kurio galite pasiimti user_id.
// Sukuriamas įrašas lentelėje accounts.

server.post('/accounts', authenticate, async (req, res) => {
  try {
    // if (req.body.group_id.length > 0) {
    //   return res.status(400).json({
    //     error: 'Group is already created!',
    //   });
    // }
    const [response] = await dbPool.execute(
      'INSERT INTO accounts (group_id, user_id) VALUES (?, ?)',
      [req.body.group_id, req.user.id],
    );
    return res.status(201).json(response);
  } catch (err) {
    console.log(err);
    return res.status(500).end();
  }
});

// GET /accounts - paduoda visas prisijungusio vartotojo grupes
// (reikės JOIN operacijos su groups lentele).
// Vėl, user_id pasiimame iš token.

server.get('/accounts', authenticate, async (req, res) => {
  try {
    const [accounts] = await dbPool.query(
      'SELECT accounts.group_id, bill_groups.id, bill_groups.name  FROM accounts LEFT JOIN bill_groups ON accounts.group_id = bill_groups .id  WHERE user_id=?',
      [req.user.id],
    );
    console.log(authenticate);
    return res.json(accounts);
  } catch (err) {
    return res.status(500).end();
  }
});

// GET /bills/:group_id – endpointas skirtas grąžinti
// visas konkrečiai grupei skirtas sąskaitas/išlaidas.

server.get('/bills/:group_id', async (req, res) => {
  try {
    const [bills] = await dbPool.query(
      'SELECT amount, description FROM bills WHERE group_id=?',
      [req.params.group_id],
    );
    return res.json(bills);
  } catch (err) {
    return res.status(500).end();
  }
});

server.get('/bills', async (req, res) => {
  try {
    const [bills] = await dbPool.query(
      'SELECT amount, description, group_id FROM bills',
    );
    return res.json(bills);
  } catch (err) {
    return res.status(500).end();
  }
});

// POST /bills - įrašo naują sąskaitą specifinei grupei
// (šis endpoint'as turėtų priimti: , amount, description).

server.post('/bills', async (req, res) => {
  try {
    const payload = {
      amount: req.body.amount,
      description: req.body.description,
      group_id: req.body.group_id,
    };
    const [response] = await dbPool.query('INSERT INTO bills SET ?', [payload]);
    return res.status(201).json(response);
  } catch (err) {
    console.log(err);
    return res.status(500).end();
  }
});
server.listen(8080, () => console.log('Server is running on port 8080'));
