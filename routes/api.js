/*
*       Complete the API routing below
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;

var library = {};

MongoClient.connect(MONGODB_CONNECTION_STRING, {useNewUrlParser:true, useUnifiedTopology:true}, (err, client)=> {
  const books = client.db('test').collection('books');
  
  library.postBook = (title, done) => {
    if(!title){
      done("No title provided");
      return;
    }
    books.insertOne({_id: new ObjectId(), title: title}, (err, doc)=>{
      if(err){
        done(err);
      } else {
        done(null, doc.ops);
      }
    });
    // return: title, _id
  }
  
  library.postComment = (_id, comment, done) => {
    if(!_id){
      done("No _id provided");
      return;
    }
    if(!comment){
      done("No comment provided");
      return;
    }
    books.findOneAndUpdate({_id: new ObjectId(_id)}, {$push: {comment: comment}}, {returnOriginal:false}, (err, doc)=>{
      if(err){
        done(err);
      } else {
        if(!doc){
          done("no book exists");
        } else {
          done(null, doc.value);
        }
      }
    });
    // return: book object w/ title, _id, & array of comments (or empty array)
  }
  
  library.getAll = (done) => {
    let allBooks = [];
    books.find({}).forEach((doc)=>{
      let commentCount;
      if(doc.comment !== undefined){
        commentCount = doc.comment.length;
      } else {
        commentCount = 0;
      }
      allBooks.push({
        _id: doc._id,
        title: doc.title,
        commentcount: commentCount
      });
    },(err)=>{
      if(err){
        done(err);
      } else {
        done(null, allBooks);
      }
    });
    // return: array of all books w/ title, _id, commentCount
  }
  
  library.getOne = (_id, done) => {
    books.findOne({_id: new ObjectId(_id)}, (err,doc)=>{
      if(err){
        console.error(err);
        done(err);
      } else {
        if(!doc){
          done("no book exists");
        } else {
          if(!doc.comment){
            doc.comment = [];
          }
          done(null, doc);
        }
      }
    });
    // return: book object w/ title, _id, & array of comments (or empty array)
  }
  
  library.deleteOne = (_id, done) => {
    books.deleteOne({_id: new ObjectId(_id)}, (err,doc)=>{
      if(err){
        done(err);
      } else {
        done(null,'delete successful');
      }
    });
    // return: 'delete successful'
  }
  
  library.deleteAll = (done) => {
    books.deleteMany({}, (err,doc)=>{
      if(err){
        done(err);
      } else {
        done(null,'complete delete successful');
      }
    })
    // return: 'complete delete successful'
  }
});

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      library.getAll((err,data)=>{
        if(err){
          console.error("Error retrieving library.");
          res.send(err);
        } else {
          res.send(data);
        }
      });
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
    })
    
    .post(function (req, res){
      var title = req.body.title;
      //response will contain new book object including atleast _id and title
      library.postBook(title, (err,data)=>{
        if(err){
          res.send(err);
        } else {
          res.send(data);
        }
      });
    })
    
    .delete(function(req, res){
      library.deleteAll((err,data)=>{
        if(err){
          res.send(err);
        } else {
          res.send(data);
        }
      });
      //if successful response will be 'complete delete successful'
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;
      library.getOne(bookid, (err,data)=>{
        if(err){
          res.send(err);
        } else {
          res.send(data);
        }
      });
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    })
    
    .post(function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
      library.postComment(bookid, comment, (err,data)=>{
        if(err){
          res.send(err);
        } else {
          res.send(data);
        }
      });
      //json res format same as .get
    })
    
    .delete(function(req, res){
      var bookid = req.params.id;
      library.deleteOne(bookid, (err,data)=>{
        if(err){
          res.send(err);
        } else {
          res.send(data);
        }
      });
      //if successful response will be 'delete successful'
    });
  
};
