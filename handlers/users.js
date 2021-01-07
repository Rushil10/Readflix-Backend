require('dotenv').config()

const {connection} = require('../util/connect');
const jwt = require('jsonwebtoken')

const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
  }
  
  const isEmail = (email) => {
    const regEx=/^(([^<>()[]\.,;:s@"]+(.[^<>()[]\.,;:s@"]+)*)|(".+"))@(([[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}])|(([a-zA-Z-0-9]+.)+[a-zA-Z]{2,}))$/
    if(email.match(regEx)) return true;
    else return false;
  }

exports.signup = (req,res) => {
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var contact = req.body.contact;
  var email = req.body.email;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  var username = req.body.username;
    let errors={};
    if(isEmpty(email)) {
      errors.email='Must not be empty'
    } else if(isEmail(email)) {
      errors.email='Must be valid email address'
    }
    if(isEmpty(password)) errors.password='Must not be Empty';
    if(password !== confirmPassword) errors.confirmPassword='Passwords must match';
    if(isEmpty(username)) errors.username='Must not be empty';
  
    if(Object.keys(errors).length > 0) return res.status(400).json(errors);

    const INSERT_USER = `INSERT INTO users (username,email,password,contactNumber,firstname,lastname) VALUES('${username}','${email}','${password}','${contact}','${firstname}','${lastname}')`
    connection.query(INSERT_USER, (err,results) => {
        if(err){
            return res.send(err)
        } else {
            const user = {username: username}
            const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET)
            return res.json({Token : token})
        }
    })
}

exports.login = (req,res) => {
  var username = req.body.username;
  var password = req.body.password;
  const GET_PASSWORD = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`
  connection.query(GET_PASSWORD,(err,results) => {
    if(err){
      return res.json("Account does not exists! Signup")
    } 
    if(results.length > 0) {
      console.log(results)
      const GET_IMAGE_NAME = `SELECT image_name FROM users WHERE username='${username}'`
      connection.query(GET_IMAGE_NAME,(err,result) => {
        const image_name=result[0].image_name
      })
      const user = {username: username}
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET)
      return res.json({Token : token})
    } else {
      return res.json({error : "Invalid username/password"})
    }
  })
}

exports.checkUsername = (req,res) => {
  var username = req.params.username;
  const CHECK_USERNAME = `SELECT * FROM users WHERE username='${username}'`
  connection.query(CHECK_USERNAME,(err,results) => {
    if(err){
      return res.json({error : "Connection Not Established"})
    } else {
      if(results.length > 0){
        return res.json({error : 'Username Not Available'})
      } else {
        return res.json({done : 'Username Available'})
      }
    }
  })
}

exports.getUserDetails = (req,res) => {
  var username = req.params.username;
  const IF_USER = `SELECT * FROM users WHERE username='${username}'`
  const GET_USER = `SELECT new_schema.users.userid,new_schema.users.email,new_schema.users.firstname,new_schema.users.lastname,new_schema.users.image_name,new_schema.users.bio,new_schema.users.location,new_schema.posts.post_id,new_schema.posts.name,new_schema.posts.review,new_schema.posts.start_date,new_schema.posts.postedAt,new_schema.posts.commentcount,new_schema.posts.type FROM new_schema.users,new_schema.posts WHERE users.username='${username}' AND posts.username='${username}' ORDER BY posts.postedAt DESC;`
  connection.query(GET_USER,(err,result) => {
    if(err){
      return res.json({Error : "Connection Not Established"})
    }
    if(result.length > 0) {
      var firstname = result[0].firstname;
      var lastname = result[0].lastname;
      var userid = result[0].userid;
      var email = result[0].email;
      var image_name = result[0].image_name;
      var bio = result[0].bio;
      var location = result[0].location;
      const user = {
        userid,
        username,
        email,
        firstname,
        lastname,
        image_name,
        bio,
        location
      }
      var series = []
      var books = []
      var n = result.length;
      console.log(typeof(result[0].type))
      if(result[0].type=="book"){
        console.log("True")
      }
      for (var i=0;i<n;i++) {
        if(result[i].type=="series"){
          series.push({post_id:result[i].post_id,name:result[i].name , review: result[i].review ,start_date:result[i].start_date , postedAt:result[i].postedAt , commentcount:result[i].commentcount, type:result[i].type})
        } else {
          books.push({post_id:result[i].post_id,name:result[i].name , review: result[i].review ,start_date:result[i].start_date , postedAt:result[i].postedAt , commentcount:result[i].commentcount, type:result[i].type})
        }
      }
      return res.json({user ,series,books})
    } else {
      connection.query(IF_USER,(err,result) => {
        if(err){
          return res.json({error : "Connection not established"})
        } else {
          if(result.length>0){
            var firstname = result[0].firstname;
            var lastname = result[0].lastname;
            var userid = result[0].userid;
            var email = result[0].email;
            var image_name = result[0].image_name;
            var bio = result[0].bio;
            var location = result[0].location;
            const user = {
              userid,
              username,
              email,
              firstname,
              lastname,
              image_name,
              bio,
              location
            }
            return res.json({user})
          } else {
            return res.json({error : "User does Not Exists !"})
          }
        }
      })
    }
  })
}

exports.makeFriend = (req,res) => {
  var friend = req.params.username;
  var user = req.user.username;
  const CHECK = `SELECT * FROM friends WHERE username='${user}' AND friend='${friend}'`
  const MAKE_FRIEND = `INSERT INTO friends (username,friend) VALUES ('${user}','${friend}')`
  connection.query(CHECK,(err,result) => {
    if(err){
      return res.json({error : "Connection not established"})
    } else {
      console.log(result)
      if(result.length>0){
        return res.json({friend : "Already a Friend"})
      } else {
        connection.query(MAKE_FRIEND,(err,result) => {
          if(err){
            return res.json({error : "Connection not established"})
          } else {
            return res.json({friend : "Made Friend"})
          }
        })
      }
    }
  })
}

exports.unFriend = (req,res) => {
  var friend = req.params.username;
  var user = req.user.username;
  const CHECKK = `SELECT * FROM friends WHERE username='${user}' AND friend='${friend}'`
  const UNFRIEND = `DELETE FROM friends WHERE username='${user}' AND friend='${friend}'`
  connection.query(CHECKK,(err,result) => {
    if(err){
      return res.json({error : "Connection not established"})
    } else {
      console.log(result)
      if(result.length > 0){
        connection.query(UNFRIEND,(err,result) => {
          if(err){
            return res.json({error : "Connection not established"})
          } else {
            return res.json({unfriend: "UnFriended"})
          }
        })
      } else {
        return res.json({unfriend : "Already Not Friends"})
      }
    }
  })
}

exports.addUserDetails = (req,res) => {
  var username = req.user.username;
  var bio = req.body.bio;
  var location = req.body.location;
  const ADD_BIO = `UPDATE users SET bio='${bio}',location='${location}' WHERE username='${username}'`
  connection.query(ADD_BIO,(err,result) => {
    if(err){
      return res.json({error : "Connection Not Established"})
    } else {
      return res.json({profile : "Updated"})
    }
  })
}

exports.addUserImage = (req,res) => {
  var username = req.user.username;
  var file = req.files.image;
  console.log(file)
  var image_name = file.name;
  console.log(image_name)
  if(file.mimetype == "image/jpeg" ||file.mimetype == "image/png"||file.mimetype == "image/gif" ){
    file.mv('public/images/profile_photo/'+file.name, function(err) {
                             
      if (err)
        return res.status(500).send(err);
      var UPLOAD_IMAGE = `UPDATE users SET image_name='${image_name}' WHERE username='${username}'`;
      var UPDATE_IMAGE_IN_POSTS = `UPDATE posts SET image_name='${image_name}' WHERE username='${username}'`
      var UPDATE_IMAGE_IN_COMMENTS = `UPDATE comments SET image_name='${image_name}' WHERE username='${username}'`

      connection.query(UPLOAD_IMAGE,(err, result) => {
        console.log(err)
         if(err){
           return res.json({error : "Connection Not Established"})
         } else {
           connection.query(UPDATE_IMAGE_IN_POSTS)
           connection.query(UPDATE_IMAGE_IN_COMMENTS)
           return res.json({image : "Image Uploaded"})
         }
      });
   });
  } else {
    return res.json({error : "File Format Not Supported"})
  }
}