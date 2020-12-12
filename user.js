const express = require("express");
const router = express.Router();
const db = require("../connection");

router.get("/:userId", (req, res)=>{
    const query1 = "SELECT * FROM requests WHERE (sendby = ? or sendto = ?) and status = 'A'";
    let friend_count = 0;
    let k = 0;
    db.query(query1, [req.params.userId, req.params.userId], (err, results)=> {
          if (results != undefined) {
            friend_count = results.length;
          }
          //k = 0 for no button
          //k = 1 for add friend
          //k = 2 for friend
          //k = 3 for request sendby
          db.query("SELECT * FROM requests WHERE (sendby = ? and sendto = ?) or (sendby = ? and sendto = ?)", [req.user.id, req.params.userId, req.params.userId, req.user.id], function(err, result) {
            console.log(result);
            if (result.length == 0) {
              if (req.user.id == req.params.userId) {
                k = 0;
              } else {
                k = 1;
              }
            } else {
              if (result[0].status == 'A') {
                k = 2;
              } else {
                k = 3;
              }
            }
            console.log("value of k is:");
            console.log(k);
            db.query("SELECT * FROM users WHERE users.id = ?", [req.params.userId], (err, ress)=> {
                console.log(ress[0]);
                res.render("../views/users/show", {user:ress[0], friend_count: friend_count, k: k});
            });
        });
    });



});

router.get("/:userId/edit", (req, res)=>{
    const query = 'SELECT * FROM users WHERE users.id = ?';
    db.query(query, req.params.userId, (err, results)=> {
        res.render("../views/users/edit", {user:results[0]});
    });
});

router.put("/:userId", (req, res)=>{
    const { username, college, hometown, state, dob, image_url, cover_image} = req.body;
    const query = 'UPDATE users SET username = ?, college = ?, hometown = ?, state = ?, dob = ?, image_url = ? , cover_image = ? WHERE id = ?';
    db.query(query, [username, college, hometown, state, dob, image_url, cover_image, req.params.userId], (err, results)=>{
        if(!err){
            req.flash("success", "Profile Updated successfully");
            res.redirect("/profile/" + req.params.userId);
        }
    })
});

router.get("/:userId/album", (req, res)=>{
    const query1 = "SELECT * FROM requests WHERE (sendby = ? or sendto = ?) and status = 'A'";
    let friend_count = 0;
    db.query(query1, [req.user.id, req.user.id], (err, results)=> {
      if (results != undefined)
        friend_count = results.length;
    });

    const query = 'SELECT * FROM posts INNER JOIN users on posts.user_id = users.id AND users.id = ?';
    db.query(query, [req.params.userId], (err, results)=>{
        if(err) throw err;
        db.query('SELECT * FROM users WHERE users.id = ?', [req.params.userId], (err, results1)=>{
            console.log(results.length);
            res.render("../views/users/album", {element:results, user:results1[0], friend_count: friend_count});
        })
    })
})


router.get("/:userId/friends", (req, res)=> {

      //get number of friends of user for ejs
      let friend_count = 0;
      db.query("SELECT * FROM requests WHERE (sendby = ? or sendto = ?) and status = 'A'", [req.params.userId, req.params.userId], (err, results)=> {
          if (results != undefined)
            friend_count = results.length;
      });

      //get profile information
      var user_information;
      db.query("SELECt * FROM users where users.id = ?", [req.params.userId], function(err, results) {
        user_information = results[0];
      });

      //To display friends of particular user
      var query1 = "SELECT * from users where id in (0,";
      db.query("SELECT * FROM requests WHERE (sendby = ? or sendto = ?) and status = 'A'", [req.params.userId, req.params.userId], function(err, result) {
        result.forEach(function(element) {
          if (element.sendby == req.params.userId) {
            query1 += element.sendto;
            query1 += ",";
          }
          if (element.sendto == req.params.userId) {
            query1 += element.sendby;
            query1 += ",";
          }
        });
        query1 = query1.substring(0, query1.length - 1);
        query1 += ")";

        db.query(query1, function(errr, results) {
          res.render("../views/users/friends", {friends: results, user: user_information, friend_count: friend_count});
        });
      });
});

module.exports = router;
