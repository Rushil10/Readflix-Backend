const {connection} = require('../util/connect');

exports.post = (req,res) => {
    var username = req.user.username;
    var name = req.body.name;
    var review = req.body.review;
    var type = req.body.type;
    var INSERT_POST = ''
    var image_name = ''
    connection.query(`SELECT image_name FROM users WHERE username='${username}'`,(err,result) => {
        if(err){
            image_name='';
        } else {
            image_name = result[0].image_name;
            if(req.body.start_date){
                var start_date=req.body.start_date;
                INSERT_POST = `INSERT INTO posts (username,name,review,start_date,type,image_name) VALUES('${username}','${name}','${review}','${start_date}','${type}','${image_name}')`
            } else {
                INSERT_POST = `INSERT INTO posts (username,name,review,type,image_name) VALUES('${username}','${name}','${review}','${type}','${image_name}')`
            }
            connection.query(INSERT_POST,(err,result) => {
                if(err) {
                    return res.json({error : "Request Not Sent"})
                } else {
                    const post = {
                        username,
                        name,
                        review,
                        type,
                        image_name
                    }
                    return res.json({posted : post})
                }
            })
        }
    })
}

exports.updatePost = (req,res) => {
    var post_id=parseInt(req.params.post_id);
    var username = req.user.username;
    var name = req.body.name;
    var review = req.body.review;
    var type = req.body.type;
    var UPDATE_POST=''
    if(req.body.start_date){
        var start_date = req.body.start_date;
        UPDATE_POST=`UPDATE posts SET name='${name}',review='${review}',type='${type}',start_date='${start_date}' WHERE post_id=${post_id}`
    } else {
        UPDATE_POST=`UPDATE posts SET name='${name}',review='${review}',type='${type}' WHERE post_id=${post_id}`
    }
    const CHECK_POST=`SELECT * FROM posts WHERE post_id=${post_id} AND username='${username}'`
    connection.query(CHECK_POST,(err,result) => {
        console.log(err)
        if(err){
            return res.json({error : "Connection Not Established"})
        } else {
            if(result.length>0){
                connection.query(UPDATE_POST,(err,result) => {
                    if(err){
                        return res.json({error : "Connection Not Established"})
                    } else {
                        return res.json({post : "Post Updated"})
                    }
                })
            } else {
                return res.json({post : "No Post Found"})
            }
        }
    })
}

exports.deletePost = (req,res) => {
    var post_id=parseInt(req.params.post_id);
    var username = req.user.username;
    const CHECK_POST = `SELECT * FROM posts WHERE post_id=${post_id} AND username='${username}'`
    const DELETE_POST = `DELETE FROM posts WHERE post_id=${post_id} AND username='${username}'`
    const DELETE_COMMENTS = `DELETE FROM comments WHERE post_id=${post_id}`
    connection.query(CHECK_POST,(err,result) => {
        console.log(result.length)
        if(result.length==0){
            return res.json({error : "No Post Found"})
        } else {
            if(result.length>0){
                connection.query(DELETE_COMMENTS,(err,result) => {
                    if(err){
                        return res.json({error : "Connection Not Established"})
                    } else {
                        connection.query(DELETE_POST)
                        return res.json({post : "Deleted"})
                    }
                })
            }
        }
    })
}

exports.getMainPosts = (req,res) => {
    var username = req.user.username;
    const GET_POSTS = `SELECT p.post_id,p.username, p.name,p.review,p.postedAt,p.start_date,p.commentcount,p.type,p.image_name FROM new_schema.posts p WHERE p.username = '${username}' OR   p.username IN (SELECT username FROM new_schema.friends WHERE username = '${username}' UNION ALL SELECT friend FROM new_schema.friends WHERE username = '${username}') ORDER BY p.postedAt DESC`
    connection.query(GET_POSTS,(err,result) => {
        if(err){
            return res.json({error : "Connection Not Established"})
        } else {
            if(result.length == 0){
                return res.json({error : "No Posts from You/Friends"})
            } else {
                var series=[]
                var books=[]
                var n = result.length;
                for (var i=0;i<n;i++) {
                    if(result[i].type=="series"){
                      series.push({username:result[i].username,post_id:result[i].post_id,name:result[i].name , review: result[i].review ,start_date:result[i].start_date , postedAt:result[i].postedAt , commentcount:result[i].commentcount,image_name:result[i].image_name})
                    } else {
                      books.push({username:result[i].username,post_id:result[i].post_id,name:result[i].name , review: result[i].review ,start_date:result[i].start_date , postedAt:result[i].postedAt , commentcount:result[i].commentcount,image_name:result[i].image_name})
                    }
                }
                return res.json({series,books})
            }
        }
    })
}

exports.commentOnPost = (req,res) => {
    var username = req.user.username;
    var comment = req.body.comment;
    var post_id = parseInt(req.params.post_id);
    var image_name='';
    const IF_POST = `SELECT * FROM posts WHERE post_id=${post_id}`
    const INCREASE_COMMENT_COUNT = `UPDATE posts SET commentcount=commentcount+1 where post_id=${post_id}`
    const GET_USER_IMAGE = `SELECT image_name FROM users WHERE username='${username}'`
    connection.query(GET_USER_IMAGE,(err,result) => {
        if(err){
            image_name=''
        } else {
            image_name=result[0].image_name;
            connection.query(IF_POST, (err,result) => {
                if(err){
                    return res.json({error : "Connection Not Established "})
                } else {
                    if(result.length > 0){
                        const INSERT_COMMENT = `INSERT INTO comments (username,post_id,comment,image_name) VALUES('${username}',${post_id},'${comment}','${image_name}')`
                        connection.query(INSERT_COMMENT,(err,result) => {
                            if(err){
                                return res.json({error : "Connection Not Established "})
                            } else {
                                console.log(result)
                                connection.query(INCREASE_COMMENT_COUNT)
                                return res.json({username,post_id,comment,image_name})
                            }
                        })
                    } else {
                        return res.json({error : "No Post Found"})
                    }
                }
            })
        }
    })
}

exports.deleteComment = (req,res) => {
    var comment_id = parseInt(req.params.comment_id);
    var username = req.user.username;
    const IF_COMMENT = `SELECT * FROM comments WHERE comment_id=${comment_id} AND username='${username}'`
    const DELETE_COMMENT = `DELETE FROM comments WHERE comment_id=${comment_id} AND username='${username}'`
    connection.query(IF_COMMENT,(err,result) => {
        if(err){
            return res.json({error : "Connection Not Established"})
        } else {
            if(result.length > 0){
                var post_id=result[0].post_id;
                const DECREASE_COMMENT_COUNT = `UPDATE posts SET commentcount=commentcount-1 where post_id=${post_id}`
                connection.query(DELETE_COMMENT,(err,result) => {
                    if(err){
                        return res.json({error : "Connection Not Established"})
                    } else {
                        connection.query(DECREASE_COMMENT_COUNT)
                        return res.json({done : "Comment Deleted "})
                    }
                })
            } else {
                return res.json({error : "No Comment Found"})
            }
        }
    })
}

exports.getPostDetails = (req,res) => {
    var post_id = parseInt(req.params.post_id);
    const IF_POST = `SELECT * FROM posts WHERE post_id=${post_id}`;
    const GET_COMMENTS = `SELECT * FROM comments WHERE post_id=${post_id} ORDER BY comments.postedAt DESC`
    connection.query(IF_POST,(err,result) => {
        if(err){
            return res.json({error : "Connection Not Established"})
        } else {
            if(result.length > 0){
                console.log(result[0])
                var posts = []
                posts.push({post_id:result[0].post_id,name:result[0].name,review:result[0].review,start_date:result[0].start_date,postedAt:result[0].postedAt,commentcount:result[0].commentcount,type:result[0].type,image_name:result[0].image_name})
                connection.query(GET_COMMENTS,(err,result) => {
                    if(err){
                        return res.json({error : "COnnection Not Established"})
                    } else {
                        var comments=[]
                        if(result.length > 0){
                            var n = result.length;
                            for(var i=0;i<n;i++){
                                comments.push({comment_id:result[i].comment_id,username:result[i].username,comment:result[i].comment,postedAt:result[i].postedAt,image_name:result[0].image_name})
                            }
                        }
                        return res.json({posts,comments})
                    }
                })
            }else {
                return res.json({error : "No Post Found"})
            }
        }
    })
}

exports.getMyPosts = (req,res) => {
    var username = req.user.username;
    const GET_POSTS = `SELECT * FROM posts WHERE username='${username}' ORDER BY posts.postedAt DESC`
    connection.query(GET_POSTS,(err,result) => {
        if(err){
            return res.json({error : "Connection Not Established"})
        } else {
            if(result.length==0){
                return res.json({post:"No Posts Posted"})
            } else {
                var series=[]
                var books=[]
                var n = result.length;
                for (var i=0;i<n;i++) {
                    if(result[i].type=="series"){
                      series.push({username:result[i].username,post_id:result[i].post_id,name:result[i].name , review: result[i].review ,start_date:result[i].start_date , postedAt:result[i].postedAt , commentcount:result[i].commentcount,image_name:result[i].image_name})
                    } else {
                      books.push({username:result[i].username,post_id:result[i].post_id,name:result[i].name , review: result[i].review ,start_date:result[i].start_date , postedAt:result[i].postedAt , commentcount:result[i].commentcount,image_name:result[i].image_name})
                    }
                }
                return res.json({series,books})
            }
        }
    })
}