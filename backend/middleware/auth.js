const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, 'PIERRE_FASCE_DEV_WEB_13');
        const userId = decodedToken.userId;
        req.auth = { userId };

        if(req.body.userId && req.body.userId !== userId) {
            throw 'User Id non valable'
        } else {
            next();
        }
    } catch(error) {
        res.status(401).json({ error: error | 'Requête non authentifiée'})
    }
};