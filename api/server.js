const express = require('express');
const cors = require('cors');
const createVpay = require('./api/create-vpay-account');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/create-vpay-account', createVpay);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
