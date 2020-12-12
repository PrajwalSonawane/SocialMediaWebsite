const express = require("express");
const router = express.Router();
const db = require("../connection");
const bcrypt = require("bcryptjs");
const saltRounds = 10;
const passport = require("passport");

router.get("/", isLoggedIn, (req, res) =>{

  []


  let map_comment = new Map();
  db.query("SELECT comments.post_id, comments.user_id, comments.comment_string, users.image_url, users.username FROM comments inner join users on comments.user_id = users.id", function(err, comment_results) {
      comment_results.forEach(function(element) {
      if (map_comment.get(element.post_id) == undefined) {
        map_comment.set(element.post_id, []);
      }
      var my_newarray = map_comment.get(element.post_id);
      my_newarray.push(element);
      map_comment.set(element.post_id, my_newarray);
    });

    let map = new Map();
    db.query("SELECT * FROM likes", function(err, results) {
      results.forEach(function(element) {
        if (map.get(element.post_id) == undefined) {
          map.set(element.post_id, []);
        }
        var new_id_array = map.get(element.post_id);
        new_id_array.push(element);
        map.set(element.post_id, new_id_array);
      });
      const query1 = "SELECT * FROM requests WHERE (sendby = ? or sendto = ?) and status = 'A'";
      let friend_count = 0;
      db.query(query1, [req.user.id, req.user.id], (err, results)=> {
          if (results != undefined)
            friend_count = results.length;
      });

      var friends_ids = [];
      friends_ids.push(req.user.id);
      db.query("SELECT * FROM requests WHERE (sendby = ? or sendto = ?) and status = 'A'", [req.user.id, req.user.id], function(err, result) {
        result.forEach(function(element) {
            if (element.sendby == req.user.id) {
              friends_ids.push(element.sendto);
            }
            if (element.sendto == req.user.id) {
              friends_ids.push(element.sendby);
            }
          });
          console.log(friends_ids);
          var asstring = friends_ids.join();
          console.log(asstring);
          db.query("SELECT * from posts inner join users on posts.user_id = users.id where posts.user_id IN(" + asstring + ")",  function(err, result) {

            result.forEach(function(element) {
              if (map.get(element.post_id) == undefined) {
                map.set(element.post_id, 0);
              }
            });

            res.render("../views/home", {allposts : result, friend_count: friend_count, map: map, map_comment: map_comment});
          });
        });
    });
  });
});

// LOGIN ROUTES

router.get("/login", (req, res)=>{
    res.render("../views/login");
})

router.post("/login", passport.authenticate(
    'local', {
        failureFlash:"Invalid Username or Password",
        successFlash: 'Welcome ',
        successRedirect:'/',
        failureRedirect:'/login'
}), (req, res)=>{});

// REGISTER ROUTES

router.get("/register", (req, res)=>{
    res.render("../views/register");

})

router.post("/register", (req, res)=> {
    let {email, username, password, passwordConfirm} = req.body;
    let query = 'SELECT email FROM users WHERE email = ?';
    db.query(query, [email], (error, results)=>{
        if(results.length > 0){
            req.flash("error","E-mail Already Registered");
            res.redirect("/register");
        }else{
            if(password !== passwordConfirm){
                req.flash("error","Passwords must match");
                res.redirect("/register");
            }
            else{
                bcrypt.genSalt(saltRounds, function (err, salt) {
                    if (err) {
                      throw err
                    } else {
                      bcrypt.hash(password, salt, function(err, hash) {
                        if (err) {
                          throw err
                        } else {
                          let query = 'INSERT INTO users ( username, password, email) VALUES ( ?, ?, ? ) ';
                          db.query(query, [username, hash, email], (err, results) => {
                              if(err)
                              {
                                  console.log(err);
                              }else{
                                req.flash("success", "Registered Successfully");
                                  db.query("SELECT * FROM users WHERE email = ?", email, (err, results)=>{
                                   if(err) throw err;
                                    console.log(results[0]);
                                    req.flash("success", "Please Update your Profile");
                                    req.login(results[0], (err)=>{
                                        res.redirect("/profile/"+results[0].id + "/edit");
                                    })
                                });
                            }
                          })
                        }
                      })
                    }
                  });
            }
        }
    });
});

// LOGOUT ROUTE
router.get("/logout", (req, res) => {
    req.flash("success", "logged out Successfully ");
    req.session.destroy(function() {
        req.logout();
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

router.post("/message/:userId", (req, res)=>{
  const message = req.body.message;
  db.query("insert into messages values(?, ?, ?, ?);", [req.user.id, req.params.userId, message, req.user.username]);
  console.log("messaging");
  req.flash("success", "Message Sent");
  res.redirect("/profile/"+req.params.userId);
});

// router.get("/profile/:userId", (req, res)=>{
//   var k = 0;
//   const query = 'SELECT * FROM users WHERE users.id = ?';
//   const query1 = "SELECT * FROM requests WHERE (sendby = ? or sendto = ?) and status = 'A'";
//   let friend_count = 0;
//   db.query(query1, [req.params.userId, req.params.userId], (err, results)=> {
//       if (results != undefined)
//         friend_count = results.length;
//   });
//   db.query(query, req.params.userId, (err, results)=> {
//     db.query("select * from requests where (sendby = ? and sendto = ?) or (sendto = ? and sendby = ?)", [req.user.id, req.params.id, req.params.id, req.user.id], function(err, result) {
//       console.log(result);
//       //if(result == 'A') {
//         k = 1;
//       //}
//       res.render("../views/users/show", {user:results[0], friend_count: friend_count, k: k});
//     });
//       //res.render("../views/users/show", {user:results[0], friend_count: friend_count});
//   });
//
// });

router.get("/search", isLoggedIn, (req, res)=>{
  const query1 = "SELECT * FROM requests WHERE (sendby = ? or sendto = ?) and status = 'A'";
  let friend_count = 0;
  db.query(query1, [req.user.id, req.user.id], (err, results)=> {
      if (results != undefined)
        friend_count = results.length;
  });
  res.render("../views/search", {data:[], friend_count: friend_count});
});

router.post("/search",isLoggedIn, (req, res)=>{
    const query1 = "SELECT * FROM requests WHERE (sendby = ? or sendto = ?) and status = 'A'";
    let friend_count = 0;
    db.query(query1, [req.user.id, req.user.id], (err, results)=> {
      if (results != undefined)
        friend_count = results.length;
    });

    const username = req.body.username;
    const query = "SELECT * FROM users WHERE username like '%" + username + "%'";
    db.query(query,(err, results)=>{
        if(err) throw err;
        if(results.length) {
          db.query("select * from requests where (sendby = ? and sendto = ?) or (sendby = ? and sendto = ?)", [req.user.id, results[0].id, results[0].id, req.user.id], function(err, result) {
              var isfriend;
              if (result.length == 0) {
                if (req.user.id == results[0].id) {
                  isfriend = "himself";
                } else {
                  isfriend = "add friend";
                }
              } else {
                if (result[0].status == "A") {
                  isfriend = "message";
                } else if (result[0].status == "P") {
                  isfriend = "request sent";
                }
              }

            res.render("../views/search", {data:results, isfriend: isfriend, friend_count: friend_count});
          });
        } else {
            req.flash("error", "Username not Found");
            res.render("../views/search", {data:[], friend_count: friend_count});
        }
    })
})

router.post("/", isLoggedIn, (req, res)=>{
  var currentuser = req.user;
  var created = new Date();
  db.query("INSERT INTO posts (user_id, title, post_string, created, post_image) values (?, null, ?, ?, ?)", [currentuser.id, req.body.newspost, created, req.body.postImage]);
  res.redirect("/");
});

router.get("/addfriend/:newFriendId",isLoggedIn, (req, res)=>{
    console.log(req.params.newFriendId);
    db.query("select * from requests where sendby = ? and sendto = ?", [req.params.newFriendId, req.user.id], function(err, result) {
      console.log(result);
      console.log(typeof result);
      if (result.length == 0) {
        db.query("insert into requests values(?, ?, ?)", [req.user.id, req.params.newFriendId, "P"]);
        req.flash("success", "Friend Request Sent");
        res.redirect("/profile/" + req.params.newFriendId);
      } else {
        if (result[0].status == 'P') {
          console.log("inside");
          db.query("update requests set status = 'A' where sendby = ? and sendto = ?", [req.params.newFriendId, req.user.id], function(err, result) {
            if (err) {
              console.log(err);
            }
          });
          req.flash("success", "Friend request accepted");
          res.redirect("/profile/" + req.params.newFriendId);
        }
      }
    });
});

router.get("/notifications", (req, res)=>{

  db.query("select * from users where id in (select sendby from requests where sendto = ? and status = 'P')", [req.user.id], function(err, result) {
    var msgs_rcvd, users_who_send_request;
    if (result == undefined) {
      users_who_send_request = [];
    } else {
      users_who_send_request = result;
    }

    db.query("select * from messages where friend = ?" , [req.user.id], function(err, result_msg){
      console.log(msgs_rcvd);
      if(result_msg == undefined) {
        msgs_rcvd = [];
      } else {
        msgs_rcvd = result_msg;
      }
      console.log(msgs_rcvd);
      res.render("../views/notifications", {users_who_send_request: users_who_send_request, msgs_rcvd: msgs_rcvd});
    });

  });

});

router.get("/accept/:userid", (req, res)=>{
  db.query("update requests set status = 'A' where sendby = ? and sendto = ?", [req.params.userid, req.user.id]);
  req.flash("success", "friend request was accepted");
  res.redirect("/notifications");
});

router.get("/reject/:userId/:frndId", (req, res)=>{
  db.query("delete from requests where sendto = ? and sendby = ?", [req.params.userId, req.params.frndId]);
  req.flash("error", "Friend Request Removed");
  res.redirect("/notifications");
});

router.get("/posts/:postId", (req, res)=>{
  db.query("SELECT * FROM posts inner join users on posts.user_id = users.id WHERE post_id = ? ", [req.params.postId], (err, results)=>{
    if(err) throw err;
    res.render("../views/posts", {element: results[0]});
  })
});

router.post("/editpost/:postid", (req, res)=> {
    db.query("update posts set post_string=?, post_image=? where post_id=?", [req.body.newspost, req.body.postImage, req.params.postid]);
    req.flash("success", "Post was successfully updated");
    res.redirect("/");
});

router.get("/deletepost/:postid", (req, res)=> {
  db.query("delete from posts where post_id = ?", [req.params.postid]);
  req.flash("success", "Post was deleted successfully");
  res.redirect("/");
});

router.get("/contact", (req, res)=> {
  res.render("contact");
});

router.post("/contact", (req, res)=> {
  db.query("INSERT INTO contact VALUES(?, ?, ?, ?)", [req.body.name, req.body.email, req.body.subject, req.body.message]);
  req.flash("success", "Thank you for contacting us!");
  res.redirect("/");
});

router.get("/likedpost/:postid", (req, res) => {
  db.query("SELECT * FROM likes WHERE user_id = ? and post_id = ?", [req.user.id, req.params.postid], function(err, results) {
    if (results.length > 0) {
      db.query("DELETE FROM likes WHERE user_id = ? and post_id = ?", [req.user.id, req.params.postid]);
    } else {
      db.query("INSERT INTO likes (user_id, post_id) values(?, ?)", [req.user.id, req.params.postid]);
    }
    res.redirect("/");
  });
});

router.post("/makecomment/:postid", (req, res) => {
  db.query("INSERT INTO comments (user_id, post_id, comment_string) values(?, ?, ?)", [req.user.id, req.params.postid, req.body.newcomment],function(err, results) {
  });
  res.redirect("/");
});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "Please login first");
	res.redirect("/login");
};

module.exports = router;
