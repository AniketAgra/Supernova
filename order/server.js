require('dotenv').config();
const connectDB = require('./src/db/db');
const app = require('./src/app');
const {connect} = require('./src/broker/broker');

connectDB();
connect();

app.listen(3003, () => {
  console.log('Order service is running on port 3003');
});