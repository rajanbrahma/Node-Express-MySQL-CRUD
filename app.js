const express = require('express');
const app = express();
const conf = require('config');
const usersRouter = require('./routes/users');

// checking for environemnt variables.
if(!conf.get('SuperSecret') || !conf.get('DBPassword')){
    console.log('FATAL ERROR : One or more environment variables are not set. Please read the documentation before running the app.');
    process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use('/api/users', usersRouter);


app.listen(3000, () => console.log('Listening on port 3000'));