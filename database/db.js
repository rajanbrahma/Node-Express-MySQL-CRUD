const mysql = require('mysql');
const conf = require('config');

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: conf.get('DBPassword'),
    database : "sakila"
});
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to MySQL Database!");
});

module.exports = con;