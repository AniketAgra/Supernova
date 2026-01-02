const app = require('./src/app');
const connectDB = require('./db/db');

// Connect to the database
connectDB();

app.listen(3000, () => {
  console.log('Auth server is running on port 3000');
});