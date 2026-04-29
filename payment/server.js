require('dotenv').config();
const connectDB = require('./src/db/db');
const app = require('./src/app');


connectDB();


app.listen(3004, () => {
  console.log('Payment service is running on port 3004');
});