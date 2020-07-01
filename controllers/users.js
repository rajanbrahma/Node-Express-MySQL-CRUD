const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const conf = require('config');
const connection = require('../database/db');


// validate an user object with the help of Joi module
// Input - user object
// Output - boolean (valid or not)
function validateUser(user){
    const userSchema = {
        first_name: Joi.string().min(3).required(),
        middle_name: Joi.optional(),
        last_name: Joi.string().min(3),
        email: Joi.string().email().required(),
        password: Joi.string().regex(/^[a-zA-Z0-9]{8,16}$/).required(),
        mobile: Joi.string().min(10).required(),
        gender: Joi.string().valid(['male', 'female']).required(),
        dob: Joi.date().max('1-1-2020').iso().required(),
        address: Joi.string(),
        pic_url: Joi.string()
    }
    const result = Joi.validate(user, userSchema);
    return result;
}

// generates a salt string - to be used in bcrypt.
// Input - none.
// Output - salt string
async function getSalt(){
    let s = await bcrypt.genSalt(10);
    return s;
}

// fetches all the user details from database. except password.
// Input - none. (request should contain x-auth-token key)
// Output - an array of objects (represents a user)
const GetUserList = async (req, res) => {
    let sql = `select * from users;`;
    connection.query(sql, (err, rows) => {
        if (err) throw err
        return res.status(200).send(rows);
    });
}

// updates the user details in database. except password and email.
// Input - full user object along with email and password. (request should contain x-auth-token key)
// Output - an object - which indicates an user is successfully updated or not.
const EditUser = async (req, res) => {
    let result = validateUser(req.body);
    if(result.error) return res.status(400).send(result.error.details[0].message);

    let data = req.body;

    connection.query(`select * from users where id = ${req.params.id}`, (err, rows) => {
        if(err) return res.status(404).send('Server side error');
        if(rows.length === 0) return res.status(404).send('User not found');

        let edit_user_sql = `UPDATE sakila.users
                            SET first_name='${data.first_name}', middle_name='${data.middle_name}', last_name='${data.last_name}', mobile='${data.mobile}', gender='${data.gender}', dob='${data.dob}', address='${data.address}', picture_url='${data.pic_url}', updated_at=CURRENT_TIMESTAMP
                            WHERE id='${req.params.id}';`;

        connection.query(edit_user_sql, (err, rows) => {
            if (err) return res.status(500).send(err);
            if (rows) return res.status(200).send(rows);
        })
    })
}

// deletes a user details in database.
// Input - user id as request param. (request should contain x-auth-token key)
// Output - an object - which indicates an user is successfully deleted or not.
const DeleteUser = async (req, res) => {

    connection.query(`select * from users where id = ${req.params.id}`, (err, rows) => {
        if(err) return res.status(500).send('Server side error');
        if(rows.length === 0) return res.status(404).send('User not found');

        let delete_user_sql = `delete from users WHERE id='${req.params.id}';`;

        connection.query(delete_user_sql, (err, rows) => {
            if (err) return res.status(500).send(err);
            if (rows) return res.status(200).send(rows);
        })
    })
}

// creates a user details in database.
// Input - full user object along with email and password.
// Output - an object - which indicates an user is successfully created or not.
const CreateUser = async (req, res) => {

    let result = validateUser(req.body);
    if(result.error) return res.status(400).send(result.error.details[0].message);

    let data = req.body;

    let create_user_sql = `INSERT INTO sakila.users
                            (first_name, middle_name, last_name, email, mobile, gender, dob, address, picture_url)
                            VALUES('${data.first_name}', '${data.middle_name}', '${data.last_name}', '${data.email}', '${data.mobile}', '${data.gender}', '${data.dob}', '${data.address}', '${data.pic_url}');`;

    connection.query(create_user_sql, async (err, newUser) => {
        if (err) return res.status(500).send(err);

        let hashed_password = await bcrypt.hash(`${data.password}`, await getSalt());
        let create_password_sql = `INSERT INTO sakila.user_password
                                (user_id, hashed_password)
                                VALUES(${newUser.insertId}, '${hashed_password}');`;
        connection.query(create_password_sql, (err, newPassword) => {
            if (newUser && newPassword) return res.status(200).send(newUser);
        });
        
    });
}

// creates a new session for the loggedin user.
// Input - email and password.
// Output - logged in user details. (along with auth token - jwt)
const Login = async (req, res) => {

    if(!req.body.email || !req.body.password) return res.status(400).send('Bad request');

    let data = req.body;

    connection.query(`select * from users where email = '${req.body.email}'`, async (err, users) => {
        if (err) throw err;
        if(users.length === 0) return res.status(404).send('Not registered.');

        connection.query(`select hashed_password from user_password where user_id = ${users[0].id}`, async (err, rows) => {
            if(rows.length === 0) return res.status(404).send('Corrupted user profile. Contact admin.');

            let password_match = await bcrypt.compare(data.password, rows[0].hashed_password);
            
            if(password_match) {
                const token = jwt.sign({email:data.email}, conf.get('SuperSecret'));
                return res.header('x-auth-token', token).status(200).send(users[0]);
            }
            else return res.status(400).send('Incorrect password');
        })
    })
}

module.exports = {
    GetUserList,
    EditUser,
    DeleteUser,
    CreateUser,
    Login
}