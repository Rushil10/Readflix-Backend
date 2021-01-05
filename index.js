const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload')
var mysql = require('mysql');
const jwt = require('jsonwebtoken')

const { signup, login, getUserDetails, makeFriend, unFriend, addUserDetails, addUserImage } = require('./handlers/users');
const Auth = require('./util/Auth');
const { post, getMainPosts, commentOnPost, getPostDetails, deleteComment, deletePost,getMyPosts, updatePost } = require('./handlers/posts');

const app = express();
app.use(cors())
app.use(express.json())
app.use(fileUpload())

const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'password',
    database:'new_schema',
    charset:'utf8mb4'
})

connection.connect(err => {
    if(err) {
        throw err
    } else {
        console.log('Connected to database')
    }
})

//console.log(connection)

var port = process.env.PORT || 3000

app.listen(port,() => {
    console.log(`Listening on Port ${port}`);
})

//LOGIN ROUTES
app.post('/signup',signup);
app.post('/login',login);

//POST ROUTES
app.post('/post',Auth,post);//To post a series,book,movie

app.get('/user/:username',Auth,getUserDetails)//Get Details Of  Any User

app.get('/user/:username/friend',Auth,makeFriend)//Make A Friend
app.get('/user/:username/unfriend',Auth,unFriend)//Unfriend A friend

app.get('/posts',Auth,getMainPosts)//Feed 

app.post('/user/:post_id/comment',Auth,commentOnPost)//Comment On A Post
app.get('/user/comment/:comment_id/delete',Auth,deleteComment)//Delete A Comment

app.get('/post/:post_id',Auth,getPostDetails)//Get Post Details
app.get('/user/post/:post_id',Auth,deletePost)//Delete a Post

app.get('/user',Auth,getMyPosts)//All My Posts
app.post('/post/:post_id/update',Auth,updatePost)//Edit A Post

app.post('/user/details',Auth,addUserDetails)//Add Additional Details

app.post('/user/uploadImage',Auth,addUserImage)//Upload Profile Photo