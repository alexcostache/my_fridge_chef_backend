﻿const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('config/db/db');
const User = db.User;
const Like = db.Like;

const axios = require("axios");
const { response } = require('express');

module.exports = {
    authenticate,
    getAll,
    getById,
    create,
    update,
    addLike,
    findRecipe,
    addToFavorites,
    delete: _delete
};

async function authenticate({ username, password }) {
    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.hash)) {
        const { hash, ...userWithoutHash } = user.toObject();
        const token = jwt.sign({ sub: user.id }, config.secret);
        return {
            ...userWithoutHash,
            token
        };
    }
}

async function getAll() {
    return await User.find().select('-hash');
}

async function getById(id) {
    return await User.findById(id).select('-hash');
}

async function create(userParam) {
    // validate
    if (await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    const user = new User(userParam);

    // hash password
    if (userParam.password) {
        user.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // save user
    await user.save();
}

async function update(id, userParam) {
    const user = await User.findById(id);

    // validate
    if (!user) throw 'User not found';
    if (user.username !== userParam.username && await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // copy userParam properties to user
    Object.assign(user, userParam);

    await user.save();
}


//delete user ?
async function _delete(id) {
    await User.findByIdAndRemove(id);
}

async function addLike(data) {

    if (await Like.findOne({ username: data.username, recipe: data.recipe })) {
        throw 'Username "' + data.username + '" already liked' + data.recipe + "recipe";
    }
    const like = new Like(data);
    console.log(" ")
    console.log(`user.service-- user: ${data.username} liked recipe ${data.recipe.name}`);

    // save user
    await like.save();
    
}

async function findRecipe(data){
  const Q = data.ingredientsQ.toString().replace(/,/g, ' ');
  console.log("")      
  console.log("recipes reuqest -- ingredients: ", data.ingredientsQ);

    var recipes = [];

    await axios({
        "method":"GET",
        "url":"https://yummly2.p.rapidapi.com/feeds/search",
        "headers":{
        "content-type":"application/json",
        "x-rapidapi-host":"yummly2.p.rapidapi.com",
        "x-rapidapi-key":"dLmz0VpeZomshQhaJzHOoD1VCO6bp1y16Esjsn4xkEIGRbwwlO",
        "useQueryString":true
        },"params":{
        "allowedAttribute":"",
        "q":Q,
        "start":"0",
        "maxResult":"20"
        }
        })
        .then((res)=>{
            
            for (let i = 0; i < res.data.feed.length; i++) {
                var _result =  res.data.feed[i];
                var recipe = {
                    name : _result.display.displayName,
                    images : _result.display.images,
                    description : _result.content.description.text.split("The recipe is a Yummly original created by")[0],
                    preparationSteps : _result.content.preparationSteps,
                    ingredientLines : _result.content.ingredientLines,
                    nutritionEstimates : _result.content.nutrition.nutritionEstimates,
                    technique : _result.content.tags.technique,
                    dish : _result.content.tags.dish,
                    course: _result.content.tags.course,
                    contentOwner : "Yummly.com"
                }
                recipes.push(recipe)
            }
            
            console.log("response -- found: ", recipes.length ," recipe(s)");
            // toDO: increase searcher counter on DB 
        })
        .catch((error)=>{
          console.log(error)
        })

    return JSON.stringify(recipes);

}


async function addToFavorites(id, userParam, data) {

    console.log(data);
    

    // const user = await User.findById(id);

    // // validate
    // if (!user) throw 'User not found';
    // if (user.username !== userParam.username && await User.findOne({ username: userParam.username })) {
    //     throw 'Username "' + userParam.username + '" is already taken';
    // }

    // // hash password if it was entered
    // if (userParam.password) {
    //     userParam.hash = bcrypt.hashSync(userParam.password, 10);
    // }

    // // copy userParam properties to user
    // Object.assign(user, userParam);

    // await user.save();

}