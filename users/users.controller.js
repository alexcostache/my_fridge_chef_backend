const express = require('express');
const router = express.Router();
const userService = require('./user.service');

// routes
router.post('/authenticate', authenticate);
router.get('/tranding', getAllLikes);
router.get('/recomandations', getRecomandations);
router.post('/register', register);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);
//app route
router.post('/addLike', addLike);
router.post('/addToFavorites', addToFavorites);
router.post('/findRecipe', findRecipe);
module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}

function register(req, res, next) {
    userService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    userService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    delete req.body.__v;  // prevent version overwrite
    userService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}
function addLike(req, res, next) {
    userService.addLike(req.body)
    .then(like => res.json(like))
    .catch(err => next(err));
}

function addToFavorites(req, res, next) {
    userService.addToFavorites(req.body)
    .then(() => res.json({}))
    .catch(err => next(err));
}

function findRecipe(req, res, next) {
    userService.findRecipe(req.body)
    .then(recipes => res.json(recipes))
    .catch(err => next(err));
}

function getAllLikes(req, res, next) {
    userService.getAllLikes()
        .then(likes => res.json(likes))
        .catch(err => next(err));
}

function getRecomandations(req, res, next) {
    userService.getRecomandations()
        .then(recipes => res.json(recipes))
        .catch(err => next(err));
}
