const config = require('config.json');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || config.connectionString, { useCreateIndex: true, useNewUrlParser: true }).then(() => {
    console.log("Connected to Database");
    }).catch((err) => {
        console.log("Not Connected to Database ERROR! ", err);
    });
    
mongoose.Promise = global.Promise;

module.exports = {
    User: require('../../users/user.model'),
    Like: require('../../users/like.model'),
    Search: require('../../users/search.model'),

};