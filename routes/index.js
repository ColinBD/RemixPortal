var express = require("express");
var router = express.Router();
var fs = require("fs");
var mysql = require("mysql");
var path = require("path");
var aws = require("aws-sdk");
var multer = require("multer");
var multerS3 = require("multer-s3");
var admin = require("firebase-admin");
var keys = require("../config/keys");

var serviceAccount = require("../remixportal-b508f-firebase-adminsdk-81vx1-dce33adc22.json");

var firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://remixportal-b508f.firebaseio.com"
});

aws.config.update({
  secretAccessKey: keys.aws_secretAccessKey,
  accessKeyId: keys.aws_accessKeyId
});

var s3 = new aws.S3();

aws.update;

//ONLINE HOST CONNECTION
// var connection = mysql.createPool({
//   connectionLimit : 5,
//   host     : keys.db_host,
//   user     : keys.db_user,
//   password : keys.db_password,
//   database:  keys.db_database,
//   port: '3306',
//   multipleStatements: true
// });

//LOCAL HOST CONNECTION
var connection = mysql.createPool({
  connectionLimit: 5,
  host: keys.local_host,
  user: keys.local_user,
  password: keys.local_password,
  database: keys.local_database,
  port: "8889",
  multipleStatements: true
});

/******** For uploading to S3 *****************/
var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "remixportal",
    acl: "public-read",
    cacheControl: "max-age=604800", //tells the clients browser to cache the file for a week
    key: function(req, file, cb) {
      // console.log(req.body.savePath);
      //fullPath = "http://s3.amazonaws.com/remixportal/music/userSubmissions/" + Date.now().toString() + file.originalname;
      req.fullPath =
        "music/userSubmissions/" + Date.now().toString() + file.originalname;
      cb(null, req.fullPath); //use Date.now().toString() if you want an original file key
    }
  })
});

var uploadSong = multer({
  storage: multerS3({
    s3: s3,
    bucket: "remixportal",
    acl: "public-read",
    cacheControl: "max-age=604800", //tells the clients browser to cache the file for a week
    key: function(req, file, cb) {
      req.fullPath =
        "music/" +
        req.body.artistName.replace(/[^a-z0-9]/gi, "_") +
        "/" +
        req.body.songTitle.replace(/[^a-z0-9]/gi, "_") +
        "/" +
        file.originalname.replace(/[^a-z0-9]/gi, "_");
      //console.log("going to use the path: " + req.fullPath);
      cb(null, req.fullPath); //use Date.now().toString() if you want an original file key
    }
  })
});

var uploadPic = multer({
  storage: multerS3({
    s3: s3,
    bucket: "remixportal",
    acl: "public-read",
    cacheControl: "max-age=604800", //tells the clients browser to cache the file for a week
    key: function(req, file, cb) {
      // console.log(req.body.savePath);
      req.picPath = "pics/" + Date.now().toString() + file.originalname;
      cb(null, req.picPath); //use Date.now().toString() if you want an original file key
    }
  })
});

/* handle single stem upload */
router.post("/uploadStem", upload.array("theMP3", 1), function(req, res, next) {
  //now push the parameters to the database
  console.log(req.files[0].originalname);
  var songId = req.body.songId,
    trackNumber = req.body.trackNumber,
    label = req.body.stem_label,
    path = "//remixportal.s3.amazonaws.com/" + req.fullPath,
    origTrack = 0,
    Approved = 1,
    license = "unknown",
    author = req.body.author,
    uid = req.body.UID;

  var sql =
    "insert into song_setup (songId, track, label, path, origTrack, Approved, license, uid) values (" +
    connection.escape(songId) +
    ", " +
    connection.escape(trackNumber) +
    ", " +
    connection.escape(label) +
    ", " +
    connection.escape(path) +
    ", " +
    connection.escape(origTrack) +
    ", " +
    connection.escape(Approved) +
    ", " +
    connection.escape(license) +
    ", " +
    connection.escape(uid) +
    ")";
  console.log("the SQL is: " + sql);
  useDB(sql, function(err, data) {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
  });
  //now send the user back to the mixer
  res.redirect("back");
});

/* handle user sign up form data */
router.post("/newUserForm", upload.fields([]), function(req, res) {
  //get the parameters we need;
  var displayName = req.body.user_name, //display name
    UID = req.body.userId, //SORT THIS IN A HIDDEN FIELD
    yearOfBirth = req.body.DOB, //year of birth
    email = req.body.email_add; //email
  if (req.body.teacher_check == "y") {
    var teacher = 1;
  } else {
    var teacher = 0;
  }
  console.log("experience check coming...");
  console.log(req.body.experience_check);

  var sql =
    "insert into users (UID, display_name, DOB, email, teacher, experience, motivation) values (" +
    connection.escape(UID) +
    ", " +
    connection.escape(displayName) +
    ", " +
    connection.escape(yearOfBirth) +
    ", " +
    connection.escape(email) +
    ", '" +
    teacher +
    "', " +
    connection.escape(req.body.experience_check) +
    ", " +
    connection.escape(req.body.motivation_check) +
    ")";
  console.log(sql);
  useDB(sql, function(err, data) {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
  });
  res.redirect("back");
});

/* handle user sign up via email and password form data */
router.post("/newUserWithEmailForm", upload.fields([]), function(req, res) {
  //get the parameters we need;
  var displayName = req.body.user_nameE, //display name
    UID = req.body.userIdE, //SORT THIS IN A HIDDEN FIELD
    yearOfBirth = req.body.DOBE, //year of birth
    email = req.body.email_addE; //email
  if (req.body.teacher_checkE == "y") {
    var teacher = 1;
  } else {
    var teacher = 0;
  }
  console.log("experience check coming...");
  console.log(req.body.experience_checkE);

  var sql =
    "insert into users (UID, display_name, DOB, email, teacher, experience, motivation) values (" +
    connection.escape(UID) +
    ", " +
    connection.escape(displayName) +
    ", " +
    connection.escape(yearOfBirth) +
    ", " +
    connection.escape(email) +
    ", '" +
    teacher +
    "', " +
    connection.escape(req.body.experience_checkE) +
    ", " +
    connection.escape(req.body.motivation_checkE) +
    ")";
  console.log(sql);
  useDB(sql, function(err, data) {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
  });
  //don't redirect the user because this may cause them to loose their remix
  //res.redirect('/');
  res.redirect("back");
});

/* handle edit user form data */
router.post(
  "/editUserForm/:token?",
  isAuthenticated,
  upload.fields([]),
  function(req, res) {
    //now push the parameters to the database
    //console.log(req.body.user_name);
    var displayName = req.body.user_name, //display name
      UID = req.uid, //SORT THIS IN A HIDDEN FIELD
      yearOfBirth = req.body.DOB, //year of birth
      email = req.body.email_add; //email
    if (req.body.teacher_check == "y") {
      var teacher = 1;
    } else {
      var teacher = 0;
    }

    var sql =
      "UPDATE users SET display_name = " +
      connection.escape(displayName) +
      ", DOB = " +
      connection.escape(yearOfBirth) +
      ", email = " +
      connection.escape(email) +
      ", teacher = '" +
      teacher +
      "' WHERE UID = " +
      connection.escape(UID) +
      "; ";
    console.log(sql);
    useDB(sql, function(err, data) {
      if (err) {
        console.error(err);
        return res.status(500).send();
      }
    });
    //now send the user back to the profile page
    res.redirect("/profile/" + req.params.token);
  }
);

/* handle create artist form data */
router.post(
  "/createArtistForm/:token?",
  isAuthenticated,
  uploadPic.array("pic", 1),
  function(req, res) {
    //we need to upload: name of band/musician; blurb; links 1..6; picture
    var path = "//remixportal.s3.amazonaws.com/" + req.picPath;
    if (path.indexOf("/undefined") >= 0) {
      //if no pic was uploaded set the pic path string empty
      console.log("NO PICTURE ADDED");
      path = "";
    }

    var sql =
      "insert into artists (artist, link1, link2, link3, link4, link5, link6, about, owner, banner, approved) values (" +
      connection.escape(req.body.artist_name) +
      ", " +
      connection.escape(req.body.link1) +
      ", " +
      connection.escape(req.body.link2) +
      ", " +
      connection.escape(req.body.link3) +
      ", " +
      connection.escape(req.body.link4) +
      ", " +
      connection.escape(req.body.link5) +
      ", " +
      connection.escape(req.body.link6) +
      ", " +
      connection.escape(req.body.bio) +
      ", " +
      connection.escape(req.uid) +
      ", " +
      connection.escape(path) +
      ", 1)";
    console.log(sql);
    useDB(sql, function(err, data) {
      if (err) {
        console.error(err);
        return res.status(500).send();
      }
    });
    //now send the user back to the mixer
    res.redirect("/profile/" + req.params.token); //token is a hidden field in the upload form
  }
);

/* handle edit artist form data */
router.post(
  "/editArtistForm/:token?",
  isAuthenticated,
  uploadPic.array("e_pic", 1),
  function(req, res) {
    var path = "//remixportal.s3.amazonaws.com/" + req.picPath;
    if (path.indexOf("/undefined") >= 0) {
      console.log("NO PICTURE ADDED");
      path = "";
      var sql =
        "UPDATE artists SET artist = " +
        connection.escape(req.body.e_artist_name) +
        ", link1 = " +
        connection.escape(req.body.e_link1) +
        ", link2 = " +
        connection.escape(req.body.e_link2) +
        ", link3 = " +
        connection.escape(req.body.e_link3) +
        ", link4 = " +
        connection.escape(req.body.e_link4) +
        ", link5 = " +
        connection.escape(req.body.e_link5) +
        ", link6 = " +
        connection.escape(req.body.e_link6) +
        ", about = " +
        connection.escape(req.body.e_bio) +
        " WHERE Id = " +
        connection.escape(req.body.e_Id) +
        " AND `owner` = " +
        connection.escape(req.uid);
    } else {
      //we have a picture uploaded so include the path in the sql statement
      var sql =
        "UPDATE artists SET artist = " +
        connection.escape(req.body.e_artist_name) +
        ", link1 = " +
        connection.escape(req.body.e_link1) +
        ", link2 = " +
        connection.escape(req.body.e_link2) +
        ", link3 = " +
        connection.escape(req.body.e_link3) +
        ", link4 = " +
        connection.escape(req.body.e_link4) +
        ", link5 = " +
        connection.escape(req.body.e_link5) +
        ", link6 = " +
        connection.escape(req.body.e_link6) +
        ", about = " +
        connection.escape(req.body.e_bio) +
        ", banner = " +
        connection.escape(path) +
        " WHERE Id = " +
        connection.escape(req.body.e_Id) +
        " AND `owner` = " +
        connection.escape(req.uid);
    }
    //now push the parameters to the database

    console.log(sql);
    useDB(sql, function(err, data) {
      if (err) {
        console.error(err);
        return res.status(500).send();
      }
    });
    //now send the user back to the mixer
    res.redirect("/profile/" + req.params.token); //token is a hidden field in the upload form
  }
);

/* handle delete artists page call */
router.get("/removeArtistsPage/:songId?/:token?", function(req, res) {
  var songId = req.params.songId;
  var token = req.params.token;
  //make this artist unapproved within the artists table (this way it won't show on a users profile page)
  var sql =
    "UPDATE artists SET approved = '0' WHERE `ID` = " +
    connection.escape(songId);
  useDB(sql, function(err, data) {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
  });
  //make this artist unapproved within the song_choices table (this way it won't be available for remixing)
  var sql =
    "UPDATE song_choices SET SongApproved = '0' WHERE `artistId` = " +
    connection.escape(songId);
  useDB(sql, function(err, data) {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
  });
  res.redirect("/profile/" + token);
});

/***** FUNCTIONS *************************/

//create authentication middleware
function isAuthenticated(req, res, next) {
  var idToken = req.params.token;
  //check if user is logged in - idToken comes from the client app (see above)
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(function(decodedToken) {
      req.uid = decodedToken.uid;
      console.log("succesfully decoded the ID token user can proceed");
      //if they are attach them (via the UID) to the request object and call next
      next();
    })
    .catch(function(error) {
      // Handle error
      console.log("could not decode ID token");
      res.redirect("/");
    });
}

function useDB(sql, callback) {
  //use these params to get details of this song from the database
  connection.query(sql, function(err, rows) {
    // connection.release();
    callback(err, rows);
    // connection.end();
  });
}

function setupExplorerPage(req, res) {
  //create sql based on the UI filters - we'll get all for now
  var sql =
    "SELECT * FROM `song_choices` WHERE `SongApproved` = 1 ORDER BY `artist` ASC";
  //use the sql to get the info from the database
  useDB(sql, function(err, data) {
    //callback function declaration
    //if an error occurs print the message to screen
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
    //when the data is returned pass it to the template to be rendered
    res.render("explorer", {
      theData: data
    });
  });
}

//how hot a song is - makes popular tracks more visible to users
function setHeat(songId) {
  var heatSQL = "UPDATE song_choices SET heat = heat * 0.9";
  useDB(heatSQL, function(err, data) {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
  });
  var heatSQL =
    "UPDATE song_choices SET heat = heat + 1 WHERE songId='" + songId + "'";
  useDB(heatSQL, function(err, data) {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
  });
}

/* create teaching session end point */
router.get("/createTeachingSession/:songId?/:token?", isAuthenticated, function(
  req,
  res
) {
  //create access code
  var code = "";
  var possible = "abcdefghijkmnpqrstuvwxyz23456789";
  function makeCode() {
    code = "";
    for (var i = 0; i < 5; i++) {
      code += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    console.log("you created the code: " + code);
  }
  //now run the function to make the code
  makeCode();
  //now check that the code is not in the DB
  var checkCodeSQL =
    "SELECT `accessCode` from teachingSessions WHERE `accessCode` = '" +
    code +
    "'";
  useDB(checkCodeSQL, function(err, data) {
    if (err) {
      console.log(err);
    }
    //now check the length of the data returned - if our code is unique the length should be zero
    if (data.length > 0) {
      //console.log("oh no!!!! we've hit a duplicate code of: " + code);
      //make a new code
      var oldCode = code;
      while (oldCode == code) {
        makeCode();
      }
      //console.log("we had to make a new code, it's: " + code);
    }
    //do the insert

    var mixLink = "/trainingmixer/" + req.params.songId + "/" + code;
    //get the song info from the database
    var getSongSQL =
      "SELECT `artist`, `songTitle`, `previewPath` FROM `song_choices` WHERE `songId` = " +
      connection.escape(req.params.songId);

    useDB(getSongSQL, function(err, data) {
      if (err) {
        console.error(err);
        return res.status(500).send();
      }
      //do the rest here
      var sql =
        "insert into `teachingSessions` (songId, owner, webLink, approved, artistName, songTitle, previewPath, accessCode) values (" +
        connection.escape(req.params.songId) +
        ", " +
        connection.escape(req.uid) +
        ", '" +
        mixLink +
        "', '1', '" +
        data[0].artist +
        "', '" +
        data[0].songTitle +
        "', '" +
        data[0].previewPath +
        "', '" +
        code +
        "')";
      useDB(sql, function(err, data2) {
        if (err) {
          console.error(err);
          //return res.status(500).send();
          return res
            .status(500)
            .send(
              "Wow, you hit a duplicate room key - there's about a 1 in 45,000 chance of that happening! - please go back and try again"
            );
        }
        res.redirect("/teacherzone/" + req.params.token);
      });
    });
  });
});

/* delete analytics session end point */
router.get("/deleteAnalytics/:id?/:token?", isAuthenticated, function(
  req,
  res
) {
  var sql =
    "UPDATE `teachingSessions` SET `approved` = '0' WHERE `owner` = " +
    connection.escape(req.uid) +
    " AND `Id` = " +
    connection.escape(req.params.id);
  useDB(sql, function(err, data2) {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
    res.redirect("/teacherzone/" + req.params.token);
  });
});

//classSession end point (used when form is submitted with an access code)
router.post("/classSession", upload.fields([]), function(req, res) {
  //get the code from the form and ensure it is lower case
  var code = req.body.gotCodeInput.toLowerCase();
  //console.log("We got the code: " + code);
  //check the code is in the database
  var codeInDBSQL =
    "SELECT `songId` from teachingSessions WHERE `accessCode` = '" + code + "'";
  useDB(codeInDBSQL, function(err, data) {
    //if it is then use the info to set up the mixer page
    if (data.length < 1) {
      //code was not in DB as we have no data
      //send user back with a message - code not found!
      console.log("code does not match");
      res.render("index", {
        msg: "codeNotFound"
      });
    } else {
      //we found the code so use it to set up the teaching session
      console.log(
        "we have that code so we will set up the mixer using songId: " +
          data[0].songId
      );
      var songID2 = data[0].songId;
      var sql =
        "SELECT `track`, `label`, `path`, `origTrack`, `Approved`, `license`, `featuring`, `songTitle`, `artist`, `artistId` FROM `song_setup` LEFT JOIN song_choices ON song_choices.songId = song_setup.songId WHERE song_choices.songId = " +
        connection.escape(songID2);

      //use the sql to get the info from the database
      useDB(sql, function(err, data2) {
        //callback function declaration
        //if an error occurs print the message to screen
        if (err) {
          return res.status(404);
          console.error(err);
        }
        //when the data is returned pass it to the template to be rendered
        res.render("trainingmixer", {
          theData: data2,
          theSong: songID2,
          theCode: code
        });
      });
    }
  });
});

/********* ROUTES *************************/

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index", { title: "RemixPortal", msg: "" });
});

/* GET explorer page */
router.get("/explorer", setupExplorerPage);

/* GET learning zone page */
router.get("/learningzone/:selection?", function(req, res) {
  res.render("learningzone", {
    theSelection: req.params.selection
  });
});

/* GET teacher zone */
router.get("/teacherzone/:token?", isAuthenticated, function(req, res, next) {
  //use req.uid to get this teachers info
  var sql =
    "SELECT `webLink`, `songTitle`, `artistName`, `previewPath`, `Id`, `created`, `accessCode` FROM `teachingSessions` WHERE `owner` = '" +
    req.uid +
    "' AND `approved` = '1'";
  useDB(sql, function(err, data) {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
    res.render("teacherzone", {
      theData: data
    });
  });
});

/* GET about page */
router.get("/about", function(req, res, next) {
  res.render("about");
});

/* GET userDashboard */
router.get("/dashboard", function(req, res, next) {
  res.render("dashboard");
});

/* GET competitions */
router.get("/competitions", function(req, res, next) {
  res.render("competitions");
});

/* GET unsupported browser page */
router.get("/unsupportedbrowser", function(req, res, next) {
  res.render("unsupportedbrowser");
});

/* GET licenses */
router.get("/licenses/:song?", function(req, res) {
  var song = req.params.song;
  var sql =
    "SELECT label, license FROM song_setup WHERE songId = " +
    connection.escape(song);
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    //when the data is returned pass it to the template to be rendered
    res.render("licenses", {
      theStuff: data
    });
  });
});

/* GET mixer page */

router.get("/mixer/:songID?/:mixID?", function(req, res) {
  var theSongID = req.params.songID;
  var mixID = req.params.mixID;
  var sql =
    "SELECT `track`, `label`, `path`, `origTrack`, `Approved`, `license`, `featuring`, `songTitle`, `artist`, `artistId` FROM song_setup LEFT JOIN song_choices ON song_choices.songId = song_setup.songId WHERE song_choices.songId = " +
    connection.escape(theSongID);

  //use the sql to get the info from the database
  useDB(sql, function(err, data) {
    //if an error occurs print the message to screen
    if (err) {
      return res.status(404);
      console.error(err);
    }
    var sql2 =
      "SELECT `downloadPath` FROM song_choices WHERE songId = " +
      connection.escape(theSongID);
    useDB(sql2, function(err, data2) {
      //when the data is returned pass it to the template to be rendered
      res.render("mixer", {
        theData: data,
        theDownloadPath: data2,
        theSong: theSongID,
        theMixID: mixID
      });
    });
  });
  setHeat(theSongID); //every time a song is loaded into the mixer the 'heat' properties of all songs are adjusted
});

/* GET trainingmixer page */

router.get("/trainingmixer/:songID?/:code?", function(req, res) {
  var songID2 = req.params.songID;
  var sql =
    "SELECT `track`, `label`, `path`, `origTrack`, `Approved`, `license`, `featuring`, `songTitle`, `artist`, `artistId` FROM `song_setup` LEFT JOIN song_choices ON song_choices.songId = song_setup.songId WHERE song_choices.songId = " +
    connection.escape(songID2);

  //use the sql to get the info from the database
  useDB(sql, function(err, data) {
    //if an error occurs print the message to screen
    if (err) {
      return res.status(404);
      console.error(err);
    }
    //when the data is returned pass it to the template to be rendered
    res.render("trainingmixer", {
      theData: data,
      theSong: songID2,
      theCode: req.params.code
    });
  });
});

/* GET profile page */
router.get("/profile/:token?", isAuthenticated, function(req, res) {
  //the UID should be available on req.uid
  //do a DB query to get all of this user's mixes
  var sql =
    "SELECT `songId`, `id` FROM `song_mixes` WHERE `uid` = " +
    connection.escape(req.uid);
  var sql2 = "";
  useDB(sql, function(err, data) {
    //if an error occurs print the message to screen
    if (err) return console.error(err);
    //if we got some data returned continue
    if (data.length > 0) {
      sql2 =
        "SELECT `songId`, `artist`, `songTitle`, `previewPath` FROM `song_choices` WHERE";
      for (var i = 0; i < data.length; i++) {
        if (i == 0) {
          sql2 += " `songId` = '" + data[i].songId + "'";
        } else {
          sql2 += " OR `songId` = '" + data[i].songId + "'";
        }
        sql2 += " AND `SongApproved` = '1'";
      }
      var idData = data;

      //attach the data when setting up the profile page
      /* NESTED DB CALL */
      useDB(sql2, function(err, data) {
        //if an error occurs print the message to screen
        if (err) return console.error(err);
        res.render("profile", {
          mixData: idData,
          songData: data
        });
      });
    } else {
      console.log("THERE WERE NO REMIXES TO BE FOUND");
      res.render("profile", {
        mixData: {},
        songData: {}
      });
    }
  });
});

/* get data to put in the artist page ownership div */
router.get("/artistPageOwnership/:UID?", function(req, res) {
  var uid = req.params.UID;
  var sql =
    "SELECT `Id`, `artist` FROM `artists` WHERE `owner` = " +
    connection.escape(uid) +
    " AND `approved` = '1'";
  useDB(sql, function(err, data) {
    //callback function declaration
    //if an error occurs print the message to screen
    if (err) return console.error(err);
    //if we have data - i.e. if the user has create an artists page we'll check if they have uploaded any tracks by this artist
    if (data.length > 0) {
      var tracksSQL =
        "SELECT * FROM `song_choices` WHERE `SongApproved` = '1' AND (`artistId` = '" +
        data[0].Id +
        "'";
      for (var i = 1; i < data.length; i++) {
        //add the other artist id's to the SQL statement
        tracksSQL += " OR `artistId` = '" + data[i].Id + "'";
      }
      tracksSQL += ")";
      console.log("tracksSQL is " + tracksSQL);
      useDB(tracksSQL, function(err, data2) {
        //if an error occurs print the message to screen
        if (err) return console.error(err);
        //if no data was returned (because UID did not match the owners UID) send the cheeky user to the not found page
        res.json({
          tracksData: data2,
          pagesData: data
        });
      });
    } else {
      //we don't have data to use to look for authored tracks
      res.json({
        pagesData: data
      });
    }
  });
});

/* GET edit artists page */
router.get("/editArtistPage/:id?/:token?", isAuthenticated, function(req, res) {
  var ID = req.params.id;
  //adding the "owner = UID" line creates some protection
  var sql =
    "SELECT * FROM `artists` WHERE `Id` = " +
    connection.escape(ID) +
    " AND `owner` = " +
    connection.escape(req.uid);
  //get the details for this artists page and pass them through the page render
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    //if no data was returned (because UID did not match the owners UID) send the cheeky user to the not found page
    res.json({
      artistData: data
    });
  });
});

/* GET create artist page */
router.get("/createArtistPage/:token?", isAuthenticated, function(req, res) {
  //console.log(req.uid);
  res.render("createArtistPage");
});

//push interaction
router.post("/pushInteraction", function(req, res) {
  var sql =
    "insert into song_interactions (user, uid, song, channel, element, value) values (" +
    connection.escape(req.body.user) +
    ", " +
    connection.escape(req.body.uid) +
    ", " +
    connection.escape(req.body.song) +
    ", " +
    connection.escape(req.body.channel) +
    ", " +
    connection.escape(req.body.element) +
    ", " +
    connection.escape(req.body.value) +
    ")";
  useDB(sql, function(err, data) {
    //callback function declaration
    //if an error occurs print the message to screen
    if (err) return console.error(err);
    res.json({
      msg: "ok"
    });
  });
});

//push saved state
router.post("/pushSavedVersion", function(req, res) {
  //console.log('about to try saving the song settings to the database');
  var uid = req.body.uid;
  req.body.uid = "1234"; //so our dataJSON object will not contain a real UID
  var sql =
    "insert into song_mixes (songId, user_Id, uid, dataJSON) values (" +
    connection.escape(req.body.songId) +
    ", " +
    connection.escape(req.body.userId) +
    ", " +
    connection.escape(uid) +
    ", '" +
    JSON.stringify(req.body) +
    "')";

  useDB(sql, function(err, data) {
    console.log(data);
    //callback function declaration
    //if an error occurs print the message to screen
    if (err) return console.error(err);
    res.json({
      data: data.insertId
    });
  });
});

//push the training mixer saves
router.post("/pushTrainingSavedVersion", function(req, res) {
  var sql =
    "insert into teachingMixes (songId, sessionCode, studentId, dataJSON) values (" +
    connection.escape(req.body.songId) +
    ", " +
    connection.escape(req.body.sessionCode) +
    ", " +
    connection.escape(req.body.userId) +
    ", '" +
    JSON.stringify(req.body) +
    "')";

  useDB(sql, function(err, data) {
    console.log(data);
    //callback function declaration
    //if an error occurs print the message to screen
    if (err) return console.error(err);
    res.json({
      data: data.insertId
    });
  });
});

//retrieve saved set of mix settings
router.get("/pullSavedVersion/:songID?/:mixID?", function(req, res) {
  var theSong = req.params.songID;
  var theMix = req.params.mixID;
  var sql = "";
  if (theMix == 0) {
    //SELECT * is okay because all that is passsed is the dataJSON key/value pair not the uid
    sql =
      "SELECT * FROM song_mixes WHERE songId = " +
      connection.escape(theSong) +
      " ORDER BY id ASC LIMIT 1";
  } else {
    //SELECT * is okay because all that is passsed is the dataJSON key/value pair not the uid
    sql = "SELECT * FROM song_mixes WHERE id = " + connection.escape(theMix);
  }

  useDB(sql, function(err, data) {
    //callback function declaration
    //if an error occurs print the message to screen
    if (err || data.length != 1) return console.error(err);
    res.json({
      data: data[0].dataJSON
    });
  });
});

//retrieve saved training mix settings
router.get("/pullSavedTrainingVersion/:mixID?", function(req, res) {
  var sql =
    "SELECT * FROM teachingMixes WHERE `id` = " +
    connection.escape(req.params.mixID);

  useDB(sql, function(err, data) {
    //callback function declaration
    //if an error occurs print the message to screen
    if (err || data.length != 1) return console.error(err);
    res.json({
      data: data[0].dataJSON
    });
  });
});

//get all the mix id's for a song //BUT ONLY ONE FOR EACH REMIXER
router.get("/getMixIDs/:songID?", function(req, res) {
  var theSong = req.params.songID;
  var sql =
    "SELECT MAX(id) as id FROM song_mixes WHERE songId = " +
    connection.escape(theSong) +
    " GROUP BY user_id";
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    res.json({
      data: data
    });
  });
});

//get all the mix id's for a teaching session //BUT ONLY ONE FOR EACH REMIXER
router.get("/getTeachingMixIDs/:sessionCode?", function(req, res) {
  var sessionCode = req.params.sessionCode;
  var sql =
    "SELECT `id` FROM `teachingMixes` WHERE `sessionCode` = " +
    connection.escape(sessionCode);
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    if (data.length > 0) {
      res.json({
        data: data
      });
    } else {
      //pass through the id of the default mix which is '1' - is this the same format as 'data'
      res.json({
        data: [{ id: 1 }]
      });
    }
  });
});

//get the artist page
router.get("/artist/:theArtist?", function(req, res) {
  var theArtist = req.params.theArtist;
  var sql =
    "SELECT artist, banner, about, link1, link2, link3, link4, link5, link6 FROM artists WHERE Id = " +
    connection.escape(theArtist);
  //useDB line here to pull out the relevent artist info
  //render is done in the DB callback so long as we got data from the DB
  useDB(sql, function(err, data) {
    if (err) {
      return res.status(404);
      console.error(err);
    }
    //when the data is returned pass it to the template to be rendered
    res.render("artist", {
      theData: data
    });
  });
});

/********* SONG CHOICE FILTERING SQL STUFF ************/

//get content for song choices div on explorer page
router.get("/genreChoices/:genre?", function(req, res) {
  var genre = req.params.genre;
  if (genre == "*") {
    var sql = "SELECT * FROM `song_choices` WHERE `SongApproved` = 1";
  } else var sql = "SELECT * FROM `song_choices` WHERE `SongApproved` = 1 AND `genre` = " + connection.escape(genre);
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    res.json({
      newData: data
    });
  });
});

//get content for song choices div on explorer page
router.get("/latestChoices", function(req, res) {
  var sql =
    "SELECT * FROM `song_choices` WHERE `SongApproved` = 1 ORDER BY `songId` DESC";
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    res.json({
      newData: data
    });
  });
});

//get content for song choices div on explorer page
router.get("/hotestChoices", function(req, res) {
  var sql =
    "SELECT * FROM `song_choices` WHERE `SongApproved` = 1 ORDER BY `heat` DESC";
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    res.json({
      newData: data
    });
  });
});

//get content for song choices div on explorer page
router.get("/randomChoices", function(req, res) {
  var sql =
    "SELECT * FROM `song_choices` WHERE `SongApproved` = 1 ORDER BY RAND()";
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    res.json({
      newData: data
    });
  });
});

//get content for artists div on explorer page
router.get("/fillArtistsDiv", function(req, res) {
  var sql =
    "SELECT `artist` FROM `song_choices` WHERE `SongApproved` = 1 ORDER BY `artist` ASC";
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    res.json({
      newData: data
    });
  });
});

//get content for song choices div on explorer page
router.get("/artistChoices/:theArtist?", function(req, res) {
  var theArtist = req.params.theArtist;
  var sql =
    "SELECT * FROM `song_choices` WHERE `SongApproved` = 1 && `artist` = " +
    connection.escape(theArtist);
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    res.json({
      newData: data
    });
  });
});

//get content for song choices div on explorer page
router.get("/distanceChoices", function(req, res) {
  var sql = "SELECT * FROM `song_choices` WHERE `SongApproved` = 1";
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    res.json({
      newData: data
    });
  });
});

/* GET ajax request to check a if a user is in the user table */
router.get("/checkUser/:UID?", function(req, res) {
  var UID = req.params.UID;
  var sql = "SELECT * FROM `users` WHERE `UID` = " + connection.escape(UID);
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    console.log(data);
    res.json({
      userData: data
    });
  });
});

/* GET signUp page */
router.get("/signUp", function(req, res) {
  res.render("signUp");
});

/* GET terms and conditions page */
router.get("/terms", function(req, res) {
  res.render("terms");
});

/* GET author song page */
router.get("/authorSong/:artist?/:token?", function(req, res) {
  var artist = req.params.artist;
  var sql =
    "SELECT Id, artist FROM `artists` WHERE `Id` = " +
    connection.escape(artist) +
    " AND `approved` = '1'";
  console.log(sql);
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    console.log(data);
    res.render("authorSong", {
      theData: data
    });
  });
});

router.post(
  "/uploadNewSong/:token?",
  isAuthenticated,
  uploadSong.array("MP3", 8),
  function(req, res) {
    var token = req.params.token;
    //check we have files before we start messing with the database
    if (req.files.length > 0) {
      //the the UID of this artist's owner so we can do a security check
      var sql =
        "SELECT `owner` FROM `artists` WHERE `Id` = " + req.body.artistId + ";";
      useDB(sql, function(err, data) {
        if (err) {
          console.error(err);
          return res.status(500).send();
        }
        //now check that this matches
        console.log(data[0].owner);
        if (data[0].owner == req.uid) {
          console.log("this guy/gal can proceed");
          //put the new song into song_choices table
          //from: //s3.amazonaws.com/remixportal/music/userSubmissions/noPreview.mp3
          //to: //remixportal.s3.amazonaws.com/music/userSubmissions/noPreview.mp3

          var sql1 =
            "INSERT INTO `song_choices` (artist, artistId, songTitle, previewPath, genre, heat, SongApproved, latitude, longitude) values (" +
            connection.escape(req.body.artistName) +
            ", " +
            connection.escape(req.body.artistId) +
            ", " +
            connection.escape(req.body.songTitle) +
            ", '//remixportal.s3.amazonaws.com/music/userSubmissions/noPreview.mp3', " +
            connection.escape(req.body.genre) +
            ", '0', '1', " +
            connection.escape(req.body.lat) +
            ", " +
            connection.escape(req.body.long) +
            "); ";
          var sql2 = "SET @var = LAST_INSERT_ID(); ";
          var sql3 =
            "UPDATE `song_choices` SET `mixPath` = concat( '/mixer/', @var, '/1') WHERE `songId` = @var; ";
          //now put this new song into the song_setup table
          if (req.files[0] != undefined) {
            var aPath =
              "//remixportal.s3-eu-west-1.amazonaws.com/" + req.files[0].key;
            var sql4 =
              "INSERT INTO `song_setup` (songId, track, label, path, origTrack, Approved, uid) values (@var, '1', " +
              connection.escape(req.body.stem1Title) +
              ", " +
              connection.escape(aPath) +
              ", '1', '1', " +
              connection.escape(req.uid) +
              "); ";
          } else {
            var sql4 = "";
          }
          if (req.files[1] != undefined) {
            var aPath =
              "//remixportal.s3-eu-west-1.amazonaws.com/" + req.files[1].key;
            var sql5 =
              "INSERT INTO `song_setup` (songId, track, label, path, origTrack, Approved, uid) values (@var, '2', " +
              connection.escape(req.body.stem2Title) +
              ", " +
              connection.escape(aPath) +
              ", '1', '1', " +
              connection.escape(req.uid) +
              "); ";
          } else {
            var sql5 = "";
          }
          if (req.files[2] != undefined) {
            var aPath =
              "//remixportal.s3-eu-west-1.amazonaws.com/" + req.files[2].key;
            var sql6 =
              "INSERT INTO `song_setup` (songId, track, label, path, origTrack, Approved, uid) values (@var, '3', " +
              connection.escape(req.body.stem3Title) +
              ", " +
              connection.escape(aPath) +
              ", '1', '1', " +
              connection.escape(req.uid) +
              "); ";
          } else {
            var sql6 = "";
          }
          if (req.files[3] != undefined) {
            var aPath =
              "//remixportal.s3-eu-west-1.amazonaws.com/" + req.files[3].key;
            var sql7 =
              "INSERT INTO `song_setup` (songId, track, label, path, origTrack, Approved, uid) values (@var, '4', " +
              connection.escape(req.body.stem4Title) +
              ", " +
              connection.escape(aPath) +
              ", '1', '1', " +
              connection.escape(req.uid) +
              "); ";
          } else {
            var sql7 = "";
          }
          if (req.files[4] != undefined) {
            var aPath =
              "//remixportal.s3-eu-west-1.amazonaws.com/" + req.files[4].key;
            var sql8 =
              "INSERT INTO `song_setup` (songId, track, label, path, origTrack, Approved, uid) values (@var, '5', " +
              connection.escape(req.body.stem5Title) +
              ", " +
              connection.escape(aPath) +
              ", '1', '1', " +
              connection.escape(req.uid) +
              "); ";
          } else {
            var sql8 = "";
          }
          if (req.files[5] != undefined) {
            var aPath =
              "//remixportal.s3-eu-west-1.amazonaws.com/" + req.files[5].key;
            var sql9 =
              "INSERT INTO `song_setup` (songId, track, label, path, origTrack, Approved, uid) values (@var, '6', " +
              connection.escape(req.body.stem6Title) +
              ", " +
              connection.escape(aPath) +
              ", '1', '1', " +
              connection.escape(req.uid) +
              "); ";
          } else {
            var sql9 = "";
          }
          if (req.files[6] != undefined) {
            var aPath =
              "//remixportal.s3-eu-west-1.amazonaws.com/" + req.files[6].key;
            var sql10 =
              "INSERT INTO `song_setup` (songId, track, label, path, origTrack, Approved, uid) values (@var, '7', " +
              connection.escape(req.body.stem7Title) +
              ", " +
              connection.escape(aPath) +
              ", '1', '1', " +
              connection.escape(req.uid) +
              "); ";
          } else {
            var sql10 = "";
          }
          if (req.files[7] != undefined) {
            var aPath =
              "//remixportal.s3-eu-west-1.amazonaws.com/" + req.files[7].key;
            var sql11 =
              "INSERT INTO `song_setup` (songId, track, label, path, origTrack, Approved, uid) values (@var, '8', " +
              connection.escape(req.body.stem8Title) +
              ", " +
              connection.escape(aPath) +
              ", '1', '1', " +
              connection.escape(req.uid) +
              "); ";
          } else {
            var sql11 = "";
          }
          //Now also save a mix which will replace the default mix
          //make up a dateJSON variable
          var flatMixJSON = JSON.stringify({
            songId: "1067",
            userId: "FlatMix",
            uid: "1234",
            T1Stem: "0",
            M0vol: "0.7",
            M0mute: "false",
            M0solo: "false",
            M0eqActive: "true",
            M0HF: "0.5",
            M0HG: "0.5",
            M0HQ: "0.8",
            M0HType: "peaking",
            M0HMF: "0.5",
            M0HMG: "0.5",
            M0HMQ: "0.8",
            M0HMType: "peaking",
            M0LMF: "0.5",
            M0LMG: "0.5",
            M0LMQ: "0.8",
            M0LMType: "peaking",
            M0LType: "peaking",
            M0LG: "0.5",
            M0LF: "0.5",
            M0LQ: "0.8",
            M0compActive: "true",
            M0ratio: "0.6",
            M0threshold: "0",
            M0knee: "0.75",
            M0attack: "0.003",
            M0release: "0.25",
            M0compMakeup: "0",
            M0driveActive: "true",
            M0drive: "0",
            M0driveTrim: "1",
            M0pan: "0.5",
            M0reverbActive: "true",
            M0reverb: "0",
            M0delayActive: "true",
            M0delay: "0",
            T2Stem: "0",
            M1vol: "0.7",
            M1mute: "false",
            M1solo: "false",
            M1eqActive: "true",
            M1HF: "0.5",
            M1HG: "0.5",
            M1HQ: "0.8",
            M1HType: "peaking",
            M1HMF: "0.5",
            M1HMG: "0.5",
            M1HMQ: "0.8",
            M1HMType: "peaking",
            M1LMF: "0.5",
            M1LMG: "0.5",
            M1LMQ: "0.8",
            M1LMType: "peaking",
            M1LType: "peaking",
            M1LG: "0.5",
            M1LF: "0.5",
            M1LQ: "0.8",
            M1compActive: "true",
            M1ratio: "0.6",
            M1threshold: "0",
            M1knee: "0.75",
            M1attack: "0.003",
            M1release: "0.25",
            M1compMakeup: "0",
            M1driveActive: "true",
            M1drive: "0",
            M1driveTrim: "1",
            M1pan: "0.5",
            M1reverbActive: "true",
            M1reverb: "0",
            M1delayActive: "true",
            M1delay: "0",
            T3Stem: "0",
            M2vol: "0.7",
            M2mute: "false",
            M2solo: "false",
            M2eqActive: "true",
            M2HF: "0.5",
            M2HG: "0.5",
            M2HQ: "0.8",
            M2HType: "peaking",
            M2HMF: "0.5",
            M2HMG: "0.5",
            M2HMQ: "0.8",
            M2HMType: "peaking",
            M2LMF: "0.5",
            M2LMG: "0.5",
            M2LMQ: "0.8",
            M2LMType: "peaking",
            M2LType: "peaking",
            M2LG: "0.5",
            M2LF: "0.5",
            M2LQ: "0.8",
            M2compActive: "true",
            M2ratio: "0.6",
            M2threshold: "0",
            M2knee: "0.75",
            M2attack: "0.003",
            M2release: "0.25",
            M2compMakeup: "0",
            M2driveActive: "true",
            M2drive: "0",
            M2driveTrim: "1",
            M2pan: "0.5",
            M2reverbActive: "true",
            M2reverb: "0",
            M2delayActive: "true",
            M2delay: "0",
            T4Stem: "0",
            M3vol: "0.7",
            M3mute: "false",
            M3solo: "false",
            M3eqActive: "true",
            M3HF: "0.5",
            M3HG: "0.5",
            M3HQ: "0.8",
            M3HType: "peaking",
            M3HMF: "0.5",
            M3HMG: "0.5",
            M3HMQ: "0.8",
            M3HMType: "peaking",
            M3LMF: "0.5",
            M3LMG: "0.5",
            M3LMQ: "0.8",
            M3LMType: "peaking",
            M3LType: "peaking",
            M3LG: "0.5",
            M3LF: "0.5",
            M3LQ: "0.8",
            M3compActive: "true",
            M3ratio: "0.6",
            M3threshold: "0",
            M3knee: "0.75",
            M3attack: "0.003",
            M3release: "0.25",
            M3compMakeup: "0",
            M3driveActive: "true",
            M3drive: "0",
            M3driveTrim: "1",
            M3pan: "0.5",
            M3reverbActive: "true",
            M3reverb: "0",
            M3delayActive: "true",
            M3delay: "0",
            T5Stem: "0",
            M4vol: "0.7",
            M4mute: "false",
            M4solo: "false",
            M4eqActive: "true",
            M4HF: "0.5",
            M4HG: "0.5",
            M4HQ: "0.8",
            M4HType: "peaking",
            M4HMF: "0.5",
            M4HMG: "0.5",
            M4HMQ: "0.8",
            M4HMType: "peaking",
            M4LMF: "0.5",
            M4LMG: "0.5",
            M4LMQ: "0.8",
            M4LMType: "peaking",
            M4LType: "peaking",
            M4LG: "0.5",
            M4LF: "0.5",
            M4LQ: "0.8",
            M4compActive: "true",
            M4ratio: "0.6",
            M4threshold: "0",
            M4knee: "0.75",
            M4attack: "0.003",
            M4release: "0.25",
            M4compMakeup: "0",
            M4driveActive: "true",
            M4drive: "0",
            M4driveTrim: "1",
            M4pan: "0.5",
            M4reverbActive: "true",
            M4reverb: "0",
            M4delayActive: "true",
            M4delay: "0",
            T6Stem: "0",
            M5vol: "0.7",
            M5mute: "false",
            M5solo: "false",
            M5eqActive: "true",
            M5HF: "0.5",
            M5HG: "0.5",
            M5HQ: "0.8",
            M5HType: "peaking",
            M5HMF: "0.5",
            M5HMG: "0.5",
            M5HMQ: "0.8",
            M5HMType: "peaking",
            M5LMF: "0.5",
            M5LMG: "0.5",
            M5LMQ: "0.8",
            M5LMType: "peaking",
            M5LType: "peaking",
            M5LG: "0.5",
            M5LF: "0.5",
            M5LQ: "0.8",
            M5compActive: "true",
            M5ratio: "0.6",
            M5threshold: "0",
            M5knee: "0.75",
            M5attack: "0.003",
            M5release: "0.25",
            M5compMakeup: "0",
            M5driveActive: "true",
            M5drive: "0",
            M5driveTrim: "1",
            M5pan: "0.5",
            M5reverbActive: "true",
            M5reverb: "0",
            M5delayActive: "true",
            M5delay: "0",
            T7Stem: "0",
            M6vol: "0.7",
            M6mute: "false",
            M6solo: "false",
            M6eqActive: "true",
            M6HF: "0.5",
            M6HG: "0.5",
            M6HQ: "0.8",
            M6HType: "highshelf",
            M6HMF: "0.5",
            M6HMG: "0.5",
            M6HMQ: "0.8",
            M6HMType: "peaking",
            M6LMF: "0.5",
            M6LMG: "0.5",
            M6LMQ: "0.8",
            M6LMType: "peaking",
            M6LType: "lowshelf",
            M6LG: "0.5",
            M6LF: "0.5",
            M6LQ: "0.8",
            M6compActive: "true",
            M6ratio: "0.6",
            M6threshold: "0",
            M6knee: "0.75",
            M6attack: "0.003",
            M6release: "0.25",
            M6compMakeup: "0",
            M6driveActive: "true",
            M6drive: "0",
            M6driveTrim: "1",
            M6pan: "0.5",
            M6reverbActive: "true",
            M6reverb: "0",
            M6delayActive: "true",
            M6delay: "0",
            T8Stem: "0",
            M7vol: "0.7",
            M7mute: "false",
            M7solo: "false",
            M7eqActive: "true",
            M7HF: "0.5",
            M7HG: "0.5",
            M7HQ: "0.8",
            M7HType: "highshelf",
            M7HMF: "0.5",
            M7HMG: "0.5",
            M7HMQ: "0.8",
            M7HMType: "peaking",
            M7LMF: "0.5",
            M7LMG: "0.5",
            M7LMQ: "0.8",
            M7LMType: "peaking",
            M7LType: "lowshelf",
            M7LG: "0.5",
            M7LF: "0.5",
            M7LQ: "0.8",
            M7compActive: "true",
            M7ratio: "0.6",
            M7threshold: "0",
            M7knee: "0.75",
            M7attack: "0.003",
            M7release: "0.25",
            M7compMakeup: "0",
            M7driveActive: "true",
            M7drive: "0",
            M7driveTrim: "1",
            M7pan: "0.5",
            M7reverbActive: "true",
            M7reverb: "0",
            M7delayActive: "true",
            M7delay: "0",
            M8revType: "0.6",
            M8reverbHP: "0",
            M8reverbLP: "1",
            M8delayT: "0.5",
            M8delayFB: "0",
            M8delayHP: "0",
            M8delayLP: "1",
            M8speed: "1",
            M8EQproView: "false",
            M8compProView: "false",
            M8otherProView: "false",
            M8masterProView: "false"
          });
          var sql12 =
            "insert into song_mixes (songId, user_Id, uid, dataJSON) values (@var, 'FlatMix'" +
            ", '1234'" +
            ", '" +
            flatMixJSON +
            "')";

          var sqlAll =
            sql1 +
            sql2 +
            sql3 +
            sql4 +
            sql5 +
            sql6 +
            sql7 +
            sql8 +
            sql9 +
            sql10 +
            sql11 +
            sql12;
          console.log("writing to song_choices with sql: " + sqlAll);
          useDB(sqlAll, function(err, data) {
            if (err) {
              console.error(err);
              return res.status(500).send();
            }
            //now send the user to the songs mixer
            res.redirect("/profile/" + req.params.token);
          });
        } else {
          //this user is not the owner of this artists page so should not be allowed to upload a song to it
          res.redirect("/");
        }
      });
    } else {
      //we don't have any files
      //send the user back home
      res.redirect("/");
    }
  }
);

/* remove track endpoint */
router.get("/removeTrack/:theId?/:token?", isAuthenticated, function(req, res) {
  //security: we need to check that the user is the owner of the artist behind this song Id
  //GET artistId > from song_choices get the artistId where songId = req.params.theId
  var getArtistId =
    "SELECT `artistId` FROM song_choices WHERE `songId` = '" +
    req.params.theId +
    "'";
  useDB(getArtistId, function(err, data) {
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
    var getOwnersUID =
      "SELECT `owner` FROM `artists` WHERE `Id` = '" + data[0].artistId + "'";
    useDB(getOwnersUID, function(err, data2) {
      if (err) {
        console.error(err);
        return res.status(500).send();
      }
      if (data2[0].owner == req.uid) {
        //this user has permission to remove the track
        //if owners UID matches req.uid proceed
        var sql =
          "UPDATE `song_choices` SET `SongApproved` = '0' WHERE `songId` = '" +
          req.params.theId +
          "'";
        useDB(sql, function(err, data) {
          if (err) {
            console.error(err);
            return res.status(500).send();
          }
          console.log("track succesfully removed");
          //now send the user back to the mixer
          res.redirect("/profile/" + req.params.token);
        });
      } else {
        //the user does not have permission (this will only occur during an attempted hack)
        console.log("you do not have permission to remove this track");
        res.redirect("/profile/" + req.params.token);
      }
    });
  });
});

/* ajax end point to put comments into database */
router.post("/pushComment", function(req, res) {
  var sql =
    "insert into mixComments (comment, mixId, songId, userUID, userName, question) values (" +
    connection.escape(req.body.comment) +
    ", " +
    connection.escape(req.body.mixId) +
    ", " +
    connection.escape(req.body.songId) +
    ", " +
    connection.escape(req.body.uid) +
    ", " +
    connection.escape(req.body.userName) +
    ", 0)";

  useDB(sql, function(err, data) {
    //callback function declaration
    //if an error occurs print the message to screen
    if (err) return console.error(err);
    res.json({
      msg: "ok"
    });
  });
});

/* ajax end point to put comments WITH suggestions into database */
router.post("/pushCommentWithSuggestion", function(req, res) {
  //var sql = "insert into mixComments (comment, mixId, songId, userUID, userName, question, suggestion) values (" + connection.escape(req.body.comment) + ", " + connection.escape(req.body.mixId) + ", " + connection.escape(req.body.songId) + ", " + connection.escape(req.body.uid) + ", " + connection.escape(req.body.userName) + ", 0, " + JSON.stringify(req.body) + ")";
  var sql =
    "insert into mixComments (comment, mixId, songId, userUID, userName, question, suggestion) values (" +
    connection.escape(req.body.comment) +
    ", " +
    connection.escape(req.body.mixId) +
    ", " +
    connection.escape(req.body.songId) +
    ", " +
    connection.escape(req.body.uid) +
    ", " +
    connection.escape(req.body.userName) +
    ", 0, " +
    connection.escape(JSON.stringify(req.body)) +
    ")";

  useDB(sql, function(err, data) {
    //callback function declaration
    //if an error occurs print the message to screen
    if (err) return console.error(err);
    res.json({
      msg: "ok"
    });
  });
});

/* ajax end point to put question into database */
router.post("/pushQuestion", function(req, res) {
  var sql =
    "insert into mixComments (comment, mixId, songId, userUID, userName, question) values (" +
    connection.escape(req.body.comment) +
    ", " +
    connection.escape(req.body.mixId) +
    ", " +
    connection.escape(req.body.songId) +
    ", " +
    connection.escape(req.body.uid) +
    ", " +
    connection.escape(req.body.userName) +
    ", 1)";

  useDB(sql, function(err, data) {
    //callback function declaration
    //if an error occurs print the message to screen
    if (err) return console.error(err);
    res.json({
      msg: "ok"
    });
  });
});

/* ajax end point to put question into database */
router.post("/pushFeedback", function(req, res) {
  var sql =
    "UPDATE `mixComments` SET clarityRating = " +
    connection.escape(req.body.clarity) +
    ", helpfulnessRating = " +
    connection.escape(req.body.helpfulness) +
    " WHERE `id` = " +
    connection.escape(req.body.commentId);
  useDB(sql, function(err, data) {
    //callback function declaration
    //if an error occurs print the message to screen
    if (err) return console.error(err);
    res.json({
      msg: "ok"
    });
  });
});

/* ajax end point to get comments from the database */
router.get("/getCommentIDs/:songId?/:userId?", function(req, res) {
  var thesql =
    "select `id` from `song_mixes` where `songId` = '" +
    req.params.songId +
    "' and `user_Id` = '" +
    req.params.userId +
    "';";
  useDB(thesql, function(err, data) {
    if (err) return console.error(err);
    res.json({
      mixIDs: data
    });
  });
});

/* ajax end point to get comments from the database */
router.get("/getComments/:mixId?", function(req, res) {
  if (isNaN(req.params.mixId) == false) {
    var sql =
      "SELECT `id`, `comment`, `userName`, `clarityRating`, `helpfulnessRating`, `timestamp`, `suggestion` from `mixComments` WHERE `question` = '0' AND `mixId` = " +
      connection.escape(req.params.mixId);
  } else {
    //mixID did not contain a number (maybe it said 'undefined') so we give it a dummy number
    var sql =
      "SELECT `id`, `comment`, `userName`, `clarityRating`, `helpfulnessRating`, `timestamp`, `suggestion` from `mixComments` WHERE `question` = '0' AND `mixId` = '0'";
  }
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    res.json({
      theComments: data
    });
  });
});

/* ajax end point to get question from the database */
router.get("/getQuestion/:mixID?", function(req, res) {
  var sql =
    "SELECT `comment`, `userName` from `mixComments` WHERE `question` = '1' AND `mixId` = " +
    connection.escape(req.params.mixID);
  useDB(sql, function(err, data) {
    if (err) return console.error(err);
    res.json({
      theQuestion: data
    });
  });
});

/* GET not found page */
router.get("/*", function(req, res, next) {
  res.render("notfound");
});

module.exports = router;
