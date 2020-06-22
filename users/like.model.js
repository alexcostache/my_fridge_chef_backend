const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    username: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    recipe:{type: Object, required: true}
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Like', schema);