require('dotenv').config();
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'lokoforyou-super-secret-key';

const token = jwt.sign({ userId: 1, email: 'testadmin@test.com' }, SECRET_KEY, { expiresIn: '24h' });
console.log('Generated Token:', token);