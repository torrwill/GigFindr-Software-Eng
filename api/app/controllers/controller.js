const { json, QueryTypes } = require("sequelize/dist");
const db = require("../models");
const userModels = require("../models/userModels");
const postModels = require("../models/postModels");
const { sequelize, users, Sequelize, musicians } = require("../models");
const Users = db.users;
const Posts = db.posts;
const FR = db.followingRelationship;
const PF = db.postFavorites;
const Musicians = db.musicians;
const Venues = db.venues;
const Op = db.Sequelize.Op;

// ==== USER STUFF ====//

// Validate a user to login
exports.login = (req, res) => {
  try {
    // Collect the username and password from the form
    var jsonObj = req.body; 
    var userName = jsonObj.username;
    var pass = jsonObj.password;
    //res.send("Username: " + userName + "; Password: " + pass);

    // Validate if user's in the database (SELECT id, firstName FROM USERS WHERE username = 'userName' AND password = 'pass')
    Users.findOne({
        where: {
          [Op.and]: [
            {username: userName}, 
            {password: pass}
          ]
        }, 
          attributes: ['id', 'firstName']
      }
    )
      .then(data => {
        if(data) {
          // Send results back to front-end
          res.send(data);
        }
        else {
          res.status(404).send({
            message: `Cannot find user with the username=${userName}.`
          })
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error retrieving a user with the username=" + userName
        })
      })

  }
  catch(e) {
    res.send(e)
  }
}

// Send a login token
exports.token = (req, res) => {
  res.send({
    token: 'tokin420'
  });
};

// Create and Save a new user
exports.create = (req, res) => {
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Check if a user exists with that userName
  Users.findOne({
    where: {
      [Op.or]: [
        {username: req.body.userName}
      ]
    }, 
      attributes: ['id']
  })
    .then(data => {
      if(data) {
        // Send messgae back to front-end
        res.send({message: "That username is already taken!"});
      }
      else {
        // Create the user
        const user = {
          username: req.body.userName,
          password: req.body.password,
          profilePic: null,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          type: req.body.userType,
          address: "",
          city: "",
          state: "",
          zip: 00000
        };

        // Save user to db
        Users.create(user)
        .then(data => {
          // Send confirmation message
          res.send({message: "Account Created! Login to continue."});
        })
        .catch(err => {
          res.status(500).send({
            message:
              err.message || "Some error occurred while creating the User."
          });
        });

      }//end else

    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving a user with the username=" + userName
      })
    })
};

// Retrieve all users from the database
exports.findAll = (req, res) => {
    const title = req.query.title;
    var condition = title ? { title: { [Op.like]: `%${title}%` } } : null;

    // SELECT id, userName FROM users
    Users.findAll({attributes: ['id', 'userName']},{ where: condition })
      .then(data => {
          res.send(data);
      })

      .catch(err => {
        res.status(500).send({
            message:
            err.message || "Some error occurred while retrieving users."
        });
      });
};

// Get a list of musicians
exports.getMusicians = (req, res) => {
  const userID = req.params.id;

  Users.findAll({
    attributes: ['firstName', 'lastName'],
    include: [{
      model: Musicians,
      attributes: ['talentList', 'yearOfExperience', 'age']
    }],
    where: {
      type: "Musician"
    }
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
          message:
          err.message || "Some error occurred while retrieving users."
      });
    });
}

// Get a list of venues
exports.getVenues = (req, res) => {
  const userID = req.params.id;

  Users.findAll({
    attributes: ['firstName', 'lastName', 'userName'],
    include: [{
      model: Venues,
      attributes: ['vibe'],
    }],
    where: {
      type: "Venue"
    }
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
          message:
          err.message || "Some error occurred while retrieving users."
      });
    });
}

// Find a single user with an id
exports.findOne = (req, res) => {
    const id = req.params.id;

    // Select id, userName, firstName, lastName FROM users WHERE userID = id
    Users.findByPk(id, {
      attributes: ["id", "userName", "firstName", "lastName", "type", "profilePic"]
    })
      .then(data => {
        if (data) {
          if(data.type == "Musician") {
            res.send(data);
/*
            Users.findAll({
              attributes: ["id", "userName", "firstName", "lastName", "type", "profilePic"],
              include: [{
                model: Musicians,
                attributes: ["talentList"],
                on:{
                  userID: sequelize.where(sequelize.col("users.id"), "=", sequelize.col("musicians.userID")),
                }
              }],
              where: {
                id: id
              }
            })
              .then(data => {
                res.send(data);
              })
              .catch(err => {
                res.status(500).send({
                  message: "Error retrieving a user with id=" + id
               });
              });
*/            
          }
          else if(data.type == "Venue") {
            res.send(data);
          }
          
        } 
        else {
          res.status(404).send({
            message: `Cannot find a user with id=${id}.`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error retrieving a user with id=" + id
       });
      });
};

// Find the friends of a specific user
exports.findFriends = (req, res) => {
  const theID = req.params.id;

  // SELECT firstName, lastName FROM users INNER JOIN followingRelationship
  //  WHERE followingRelationship.followerID = users.userID
  //  AND followingRelationship.uesrID = :id;
  Users.findAll({
    attributes: ['firstName', 'lastName'],
    include: [{
      model: FR,
      attributes: [],
      on: {
        followerID: sequelize.where(sequelize.col("users.id"), "=", sequelize.col("followingRelationships.followerID")),
      },
      where: {
        userID: theID
      }
    }],
  })
    .then(data => {
      if (data) {
        res.send(data);
      } 
      else {
        res.status(404).send({
          message: `Cannot find a user with id=${theID}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send(
        err
      );
    });
}

// Add a friend
exports.addFriend = (req, res) => {
  var userID = req.params.id;
  var followerID = req.params.otherID;

  // Add friend to the user first, then add to the other user
  // Create the first friend obj
  const userSide = {
    userID: userID,
    followerID: followerID
  };

  // Save to DB
  FR.create(userSide)
    .then(data => {
      // Create the second friend obj
      const friendSide = {
        userID: followerID,
        followerID: userID
      };

      // Save to DB
      FR.create(friendSide)
        .then(data => {
          // Successful, send back to server
          res.send({added: true});
        })
        .catch(err => {
          res.status(500).send({
            message:
              err.message || "Some error occurred while creating the User."
          });
        });

    })
    .catch(err => {
      res.status(500).send({
        message:
              err.message || "Some error occurred while creating the User."
      });
    });
}

// Retrieve people who aren't friends with user (Update to filter type of user)
exports.getPeople = (req, res) => {
  // Gather data from url
  const userID = req.params.id;
  const type = req.params.type; // Distinguish Musicians from Venues
  
  // SELECT DISTINCT firstName, lastNam FROM users WHERE users.id != :id 
  //  AND users.id NOT IN (
  //    SELECT user.id FROM users join followingRelationship
  //    WHERE followingRelationship.followerID = users.id
  //    AND followingRelationship.userID = 2
  //  );
  Users.findAll({
    attributes: [
      [Sequelize.fn('DISTINCT', Sequelize.col('firstName')) ,'firstName'],
      'lastName', 'id'
    ],
    distinct: true,
    where: {
      [Op.and]: [
        {id: {[Op.not]: userID}},
        {id: {
          [Op.notIn]: sequelize.literal(
            '(SELECT users.id FROM users JOIN followingRelationship ' +
            ' WHERE followingRelationship.followerID = users.id ' +
            ' AND followingRelationship.userID = ' + userID + 
            ')'
          )
        }
      }]
    },
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send(
        err
      );
    });
}

// Update a user by id 
exports.update = (req, res) => {
  
};

// Delete a user with id
exports.delete = (req, res) => {
  
};

// ==== POST STUFF ====//

// Create a new post <= Update to handle photos, audio, etc.
exports.newPost = (req, res) => {
  var postContent = req.body;
  var post = null;

  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Determine what to post (pic, audio, text, etc.)
  // Text only <= add more conditions
  if(postContent.content != null && postContent.content != "") {
    // Get the date
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();

    var date = yyyy + '/' + mm + '/' + dd;

    // Create the post
    post = {
      title: null,
      content: postContent.content,
      audio: null,
      postDate: date,
      userID: postContent.id
    }

    // Save post to the database
    Posts.create(post)
    .then(data => {
      // Send confirmation message
      res.send({sent: true});
    })
    .catch(err => {
      res.status(500).send(/*{sent: false}*/{
        message:
          err.message || "Some error occurred while creating the Tutorial."
          
      });
    });

  }
  else {
    res.send({sent: false});
  }

}

// Retrieve all posts (Friends vs. Strangers) <= Complete the stranger part
exports.getAllPosts = (req, res) => {
  var postType = req.params.type;
  var userID = req.params.id;

  // Find posts based on type given
  if(postType == "friends"){
    // SELECT users.firstName, users.lastName, users.profilePic, posts.postDate, posts.content, posts.image, posts.audio, posts.id
    // FROM users INNER JOIN posts
    // WHERE users.id = posts.userID
    // AND posts.userID = 2
    // AND posts.userID IN (
    //    SELECT users.id FROM users join followingRelationship
    //    WHERE followingRelationship.followerID = users.id
    //    AND followingRelationship.userID = 2
    // )
    Posts.findAll({
      attributes: ["postDate", "content", "image", "audio", "id"],
      include: [{
        model: Users,
        attributes: ["firstName", "lastName", "profilePic"],
        on: {
          id: sequelize.where(sequelize.col("user.id"), "=", sequelize.col("posts.userID"))
        },
      }],
      where: {
        userID: {
          [Op.in]: sequelize.literal(
            '(SELECT users.id FROM users INNER JOIN followingRelationship ' +
            'WHERE followingRelationship.followerID = users.id ' +
            'AND followingRelationship.userID = ' + userID + 
            ')'
          )
        }
      },
      order: [
        ["postDate", "DESC"]
      ]
    })
      .then(data => {
        //console.log(data);
        res.send(data);
      })
      .catch(err => {
        res.status(500).send(
          err
        );
      });
  }
  else if(postType == "strangers") {
    // SELECT users.firstName, users.lastName, users.profilePic, posts.postDate, posts.content, posts.image, posts.audio, posts.id
    // FROM users INNER JOIN posts
    // WHERE users.id = posts.userID
    // AND posts.userID != 2
    // AND posts.userID NOT IN (
    //    SELECT users.id FROM users join followingRelationship
    //    WHERE followingRelationship.followerID = users.id
    //    AND followingRelationship.userID = 2
    // )
  }
  else 
    res.send({message: "An error occurred while loading posts."})

}

// Retrieve all posts made by a specific user
exports.getUserPosts =  (req, res) => {
  var userID = req.params.id;

  // SELECT users.firstName, users.lastName, users.profilePic, posts.postDate, posts.content, posts.image, posts.audio, posts.id
  // FROM users INNER JOIN posts
  // WHERE users.id = posts.userID
  // AND posts.userID = :id
  Users.findAll({
    attributes: ["firstName", "lastName", "profilePic", "posts.id"],
    include: [{
      model: Posts,
      attributes: ["postDate", "content", "image", "audio", "id"],
      on: {
        userID: sequelize.where(sequelize.col("users.id"), "=", sequelize.col("posts.userID"))
      },
      where: {
        userID: userID 
      }
    }],
  })
    .then(data => {
      //console.log(data);
      res.send(data);
    })
    .catch(err => {
      res.status(500).send(
        err
      );
    });
}

// Retrieve the number of likes based on a postID 
exports.getLikes = (req, res) => {
  var postID = req.params.id;

  // SELECT postID
  // FROM posts INNER JOIN postFavorites
  // WHERE postFavorites.postID = posts.id
  // AND posts.id = 1
  PF.findAll({
    attributes: ["postID"],
    include: [{
      model: Posts,
      attributes: [],
      require: true,
      on: {
        [Op.and]: [
          {id: postID},
          {id: sequelize.where(sequelize.col("postFavorites.postID"), "=", sequelize.col("post.id"))}
        ]
      }
    }]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send(
        err
      );
    });
}

// Retrieve the comments based on a postID <= Implement
exports.getComments = (req, res) => {
  var postID = req.params.id;

  res.send({id: postID});
}
