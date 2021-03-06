﻿// user service 
const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('config/db/db');
const User = db.User;
const Like = db.Like;
const Search = db.Search;
const isodate = require("isodate");


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
    getAllLikes,
    getRecomandations,
    analytics,
    promoteToAdmin,
    delete: _delete
};

// Function to authenticate users 
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

// Function to get all users
async function getAll() {
    return await User.find().select('-hash');
}
// Function to get user by id
async function getById(id) {
    return await User.findById(id).select('-hash');
}

// Function to create a new user
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

// Function to update user
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


// Function to delete user
async function _delete(id) {
    await User.findByIdAndRemove(id);
}

// Function to save likes data on database
async function addLike(data) {
    var likeStatus
    if (await Like.findOne({ username: data.username, recipe: data.recipe })) {
        await Like.remove({ username: data.username, recipe: data.recipe });
        likeStatus =  {"status":"false"};
         
    }else{
        const like = new Like(data);
        console.log(" ")
        console.log(`user.service-- user: ${data.username} liked recipe ${data.recipe.name}`);
    
        // save user
        await like.save();
    
        likeStatus = {"status":"true"};
    }
   
    return likeStatus
}

// Function to find recipes: this function posts reipces ingredients to external API
// and create a new recipe object based on the respond form API
// sends data back to client
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
                // data validation 
                if (_result.display.displayName == null) {name = "Recipe name not available"}else{name = _result.display.displayName}
                if (_result.display.images == null) {images = ["No Images"]} else {images = _result.display.images}
                if (_result.content.description == null) {description = "Description not available for this recipe." } else {description = _result.content.description.text}
                if (_result.content.preparationSteps == null) {preparationSteps = ["Preparation Steps not available for this recipe."]}else{preparationSteps = _result.content.preparationSteps}
                if (_result.content.ingredientLines == null) {ingredientLines = "Not available"}else{ ingredientLines = _result.content.ingredientLines}
                if (_result.content.nutrition.nutritionEstimates == null) {nutritionEstimates}else{nutritionEstimates = _result.content.nutrition.nutritionEstimates}
                if (_result.content.tags.technique == null) {technique = [{"display-name":"Technique not available"}]}else{technique = _result.content.tags.technique}
                if (_result.content.tags.nutrition == null) {nutrition = [{"display-name":"Nutrition not available"}]}else{nutrition = _result.content.tags.nutrition}
                if (_result.content.tags.dish == null) {dish = [{"display-name":"Dish not available"}]}else{dish = _result.content.tags.dish}
                if (_result.content.tags.course == null) {course = [{"display-name":"Course not available"}]}else{course = _result.content.tags.course}
                if (_result.content.details.totalTime == null) {totalTime = "Estimated time not available"}else{totalTime = _result.content.details.totalTime}

                var recipe = {
                    name : name,
                    images : images,
                    description : description.split("The recipe is a Yummly original created by")[0],
                    preparationSteps : preparationSteps,
                    ingredientLines : ingredientLines,
                    nutritionEstimates : nutritionEstimates,
                    technique : technique,
                    nutrition : nutrition,
                    dish : dish,
                    course: course,
                    totalTime:totalTime,
                    contentOwner : "Yummly.com"
                }
                recipes.push(recipe)
            }
            
            console.log("response -- found: ", recipes.length ," recipe(s)");
        })
        .catch((error)=>{
          console.log(error)
        })
    
    // save search on db 
    const search = new Search({"searchArray" : data.ingredientsQ});
    await search.save()

    return JSON.stringify(recipes);

}
// Function to get all the links from DB
async function getAllLikes() {
    var likes =  await Like.find();
    var likedRecipes = [];
    var counts = {};
    var likesResult = [];
    for (let i = 0; i < likes.length; i++) {
        likedRecipes.push(likes[i].recipe)
    }

    likedRecipes.forEach(function(x) {counts[JSON.stringify(x)] = (counts[JSON.stringify(x)] || 0)+1;});

    for (let key in counts) {
        likesResult.push({"recipe":JSON.parse(key), "likes": counts[key]})
        
    }

    
    //  return sorted 
    return likesResult.sort((a, b) => (a.likes < b.likes) ? 1 : -1);
}

// Function to get recomandations from the API 
async function getRecomandations(){
      var recipes = [];
    console.log("get recomandations");
      await axios({
          "method":"GET",
          "url":"https://yummly2.p.rapidapi.com/feeds/list?tag=list.recipe.popular&limit=5&start=0",
          "headers":{
          "content-type":"application/json",
          "x-rapidapi-host":"yummly2.p.rapidapi.com",
          "x-rapidapi-key":"dLmz0VpeZomshQhaJzHOoD1VCO6bp1y16Esjsn4xkEIGRbwwlO"}
          })
          .then((res)=>{
              for (let i = 0; i < res.data.feed.length; i++) {
                  var _result =  res.data.feed[i];
                  var recipe = {
                      name : _result.display.displayName,
                      images : _result.display.images,
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
              console.log("response -- recomandations: ", recipes.length ," recipe(s)");
              // toDO: increase searcher counter on DB 
          })
          .catch((error)=>{
            console.log(error)
          })
  
      return JSON.stringify(recipes);
  
  }

// Function to retrive the analytics form the DB
  async function analytics() {

    var curr = isodate(new Date) 
    var first = curr.getDate() - curr.getDay(); 
    var last = first + 6; 6

    // get current week range 
    var weekFirstday = new Date(curr.setDate(first)).toISOString();
    var weekLastday = new Date(curr.setDate(last)).toISOString();

    // get current month range 
    var date = new Date(), y = date.getFullYear(), m = date.getMonth();
    var monthFirstDay = new Date(y, m, 1).toISOString();
    var monthLastDay = new Date(y, m + 1, 0).toISOString();

    var weaklySearches =  await Search.find(
        { createdDate: {
            $gte: weekFirstday,
            $lt: weekLastday
        }}
    );
    var monthlySearches =  await Search.find(
        { createdDate: {
            $gte: monthFirstDay,
            $lt: monthLastDay
        }}
    );

    var allSearches =  await Search.find();


    var analytics = {
        "totalSearches":allSearches.length,
        "weaklySearches":weaklySearches,
        "weekRange":{"firstDay":weekFirstday,"lastDay":weekLastday},
        "monthlySearches":monthlySearches,
        "monthRange":{"firstDay":monthFirstDay,"lastDay":monthLastDay},
        "allSearches":allSearches
    }

    // console.log(analytics);
    


    return analytics
}


// Function to update userType admin|basic
async function promoteToAdmin(data) {

    if(data.user.userType == "Admin"){
        const user = await User.findById(data.userID);

        if(user.userType == "Basic"){
           user.userType = "Admin"
        }
        else if(user.userType == "Admin"){
            // update it basic 
            user.userType = "Basic"
        }
    
        await user.save();
    }else{
        return {"message":"Access Denied"}
    }

    
}
