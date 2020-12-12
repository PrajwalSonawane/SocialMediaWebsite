const mysql = require('mysql');
const express = require('express');
const db = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'lawjarp',  // root password
    database:'socialmedia'
});

db.connect((error)=>{
    if(error){
        console.log(error);
        console.log("Database connection Failed");
    }else{
        console.log("Database Connected successfully");
    }
});
module.exports = db;


// steps to run
// step 1) npm install
// step 2) create database socialmedia
// step 3)
// CREATE TABLE `users` (
//     `id` int NOT NULL AUTO_INCREMENT,
//     `username` varchar(255) DEFAULT NULL,
//     `password` varchar(255) NOT NULL,
//     `email` varchar(255) NOT NULL,
//     `college` varchar(45) DEFAULT NULL,
//     `hometown` varchar(45) DEFAULT NULL,
//     `state` varchar(45) DEFAULT NULL,
//     `dob` varchar(45) DEFAULT NULL,
//     `image_url` varchar(255) DEFAULT NULL,
//     PRIMARY KEY (`id`),
//     UNIQUE KEY `email_UNIQUE` (`email`),
//     UNIQUE KEY `id_UNIQUE` (`id`)
//   )

// step 4) npm start
