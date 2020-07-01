const jwt = require('jsonwebtoken');
const conf = require('config');

function auth_chk(req, res, next){
    const token = req.header('x-auth-token');
    if(!token) return res.status(401).send('Access denied');

    try{
        const decoded_jwt = jwt.verify(token, conf.get('SuperSecret'));
        req.user = decoded_jwt;
        next();
    }
    catch(ex){
        return res.status(401).send('Invalid token! Please login again.');
    }
}

module.exports = {
    auth_chk
}