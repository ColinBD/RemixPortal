// global variables
var theToken = "noToken"; //must be global
var ourUser = {}; //we will fill this later when we have a user signed in

//firebase setup configuration
var config = {
  apiKey: "AIzaSyAFRJrL278UqHOmrIhg1omQYc0AGnCVCtA",
  authDomain: "remixportal-b508f.firebaseapp.com",
  databaseURL: "https://remixportal-b508f.firebaseio.com",
  projectId: "remixportal-b508f",
  storageBucket: "remixportal-b508f.appspot.com",
  messagingSenderId: "977860284703"
};

// Initialize Firebase
firebase.initializeApp(config);

//this is how we sign users in
function signInWithGoogle() {
  var googleAuthProvider = new firebase.auth.GoogleAuthProvider();
  googleAuthProvider.addScope(
    "https://www.googleapis.com/auth/contacts.readonly"
  );
  firebase
    .auth()
    .signInWithPopup(googleAuthProvider)
    .then(function(result) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      console.log(result);
      //check if this is the first log in for the user and if so redirect them to the sign in form
      checkUserInDB(result.user);
      theToken = result.user.ie;
      // The signed-in user info.
      user = result.user; //no var keyword as already defined the object globally
    })
    .catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
    });
}

function signInWithFacebook() {
  var provider = new firebase.auth.FacebookAuthProvider();
  firebase
    .auth()
    .signInWithPopup(provider)
    .then(function(result) {
      // This gives you a Facebook Access Token. You can use it to access the Facebook API.
      console.log(result);
      //check if this is the first log in for the user and if so redirect them to the sign in form
      checkUserInDB(result.user);
      theToken = result.credential.accessToken;
      // The signed-in user info.
      user = result.user;
    })
    .catch(function(error) {
      // Handle Errors here.
      console.log("problem signing in user with FB");
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
    });
}

function signInWithEmail() {
  //alert('you tried to sign in with email');
  //show the sign un with email modal
  $("#myModal_email").css({ display: "block" });
}

function checkUserInDB(user) {
  //check if this is the first log in for the user and if so redirect them to the sign in form
  $.ajax({
    type: "GET",
    url: "/checkUser/" + user.uid,
    success: function(result) {
      //console.log(result.userData.length);
      if (result.userData.length == 0) {
        //fill out the signUp form with details held in the user object
        $('input[name="user_name"]').val(user.displayName); //user.displayName
        $('input[name="email_add"]').val(user.email); //user.email
        $('input[name="userId"]').val(user.uid); //set the save path
        //console.log(user);
        launchSignUpModal();
      } else {
        //we have this user so set them up
        ourUser = result.userData[0];
        //console.log(ourUser);
        //hide the signIn label
        $("#dropLoginLabel").hide();
        //show the signOut label
        $("#dropLogoutLabel").show();
        var theNames = ourUser.display_name.split(" ");
        if (theNames[0].length > 12) {
          theNames[0] = theNames[0].substring(0, 12);
        }
        document.getElementById("dropLogoutA").innerHTML = "Hi " + theNames[0];
        //if user is a teacher add teacher zone link to main menu
        if (ourUser.teacher == true) {
          //it was possible to get multiple 'teacher zone' tabs being drawn...
          //workaround - only draw teachLink tab if there is not already one
          if ($("#teachLink").length == 0) {
            $("#mainMenu li:eq(2)").after(
              "<li id='teachLink'><a href='/teacherzone/" +
                theToken +
                "'>TEACHER ZONE</a></li>"
            );
          }
        }

        //set the href of our profile link
        $("#prof").attr("href", "/profile/" + user.ie);

        //check if we are on the MIXER PAGE and if so fill out the hidden form fields
        if (theWin.indexOf("/mixer/") >= 0) {
          //set the hidden fields on our stem upload form
          $('input[name="author"]').val(ourUser.display_name); //set the author hidden field
          $('input[name="UID"]').val(ourUser.UID); //set the UID hidden field
        }
        //check if this is being called from the PROFILE PAGE and if so setup the profile page
        if (theWin.indexOf("/profile/") >= 0) {
          setUpProfilePage(user.uid);
        }
        //check if this is being called from the EDITPROF PAGE and if so setup the edit profile page
        if (theWin.indexOf("/editProf/") >= 0) {
          setUpEditProfPage();
        }
        //check if this is being called from the createArtistPage and if so setup the page using the UID or token data
        if (theWin.indexOf("/createArtistPage/") >= 0) {
          //create a 'cancel' button in the div at the bottom of the form
          $("#formCancel").html(
            "<button onclick='cancelCreateEditPage()'>cancel</button>"
          );
        }
        //check if this is being called from the editArtistPage and if so setup the page using the UID or token data
        if (theWin.indexOf("/editArtistPage/") >= 0) {
          //create a 'cancel' button in the div at the bottom of the form
          $("#formCancel").html(
            "<button onclick='cancelCreateEditPage()'>cancel</button>"
          );
        }
        //check if this is being called from the AUTHOR SONG Page and if so setup the page using the UID
        if (theWin.indexOf("/authorSong") >= 0) {
          $('input[name="UID"]').val(ourUser.UID); //set the UID hidden field
          //create a 'cancel' button in the div at the bottom of the form
          $("#formCancel").html(
            "<button id='cancelAuthSong' onclick='cancelCreateEditPage()'>cancel</button>"
          );
          //update the forms action to include the token (for authentication)
          $("#uploadForm").attr("action", "/uploadNewSong/" + theToken);
        }
        //check if this is being called from the EXPLORER PAGE
        if (theWin.indexOf("/explorer") >= 0) {
          //if the user is a teacher show the 'use in class'
          if (ourUser.teacher == 1) {
            $(".forTeacherBtn").css("display", "inline");
          }
        }
      }
    },
    error: function() {
      console.log("DB error detected");
      document.getElementById("dropLogoutA").innerHTML = "Database error";
    }
  });
}

function cancelCreateEditPage() {
  var a = document.createElement("a");
  a.href = "/profile/" + theToken;
  document.body.appendChild(a);
  a.click();
}

function launchSignUpModal() {
  //show the signUp modal

  $("#myModal_signUp").css({ display: "block" });
  //on this modals form submit do an ajax push then
  //switch the login/sign up vs logout labels
  //now launch another modal telling the user they are now registered and can now save and share their mixes. Alnd they should check their 'profile' page accessed by clicking their name in the top right corner.
}

//set up the profile page
function setUpProfilePage(uid) {
  //console.log(ourUser.display_name);
  var html =
    "<strong>Your information: </strong><button id='EditProfPageBtn' onclick='editUserInfo()'>Edit your info</button><br><br>";
  if (ourUser.teacher == "1") {
    html +=
      "<div id='yourInfo'>Your display name is " +
      ourUser.display_name +
      ", your year of birth is " +
      ourUser.DOB +
      ", your contact email address is " +
      ourUser.email +
      ", and your are registered as a teacher</div>";
  } else {
    html +=
      "<div id='yourInfo'>Your display name is " +
      ourUser.display_name +
      ", your year of birth is " +
      ourUser.DOB +
      ", your contact email address is " +
      ourUser.email +
      ", and your are not registered as a teacher</div>";
  }
  $("#yourDetails").html(html);

  //EDIT PROFILE MODAL
  //populate all the modal's form text fields with the users data
  $('input[name="user_name"]').val(ourUser.display_name); //set the author field
  $('input[name="DOB"]').val(ourUser.DOB); //set the year of birth field
  $('input[name="email_add"]').val(ourUser.email); //set the email field
  //set the teacher radio buttons
  if (ourUser.teacher == "1") {
    //set the Y radio button and uncheck the N button
    $("#radioYes").prop("checked", true);
    $("#radioNo").prop("checked", false);
  } else {
    //set the N radio button and uncheck the Y radio button
    $("#radioNo").prop("checked", true);
    $("#radioYes").prop("checked", false);
  }
  //set the teacher? field
  if (ourUser.teacher == "1") {
    $('input[name="teacher_check[0]"]').checked == true;
  }
  //change the edit user forms action to include the token
  $("#editUserForm").attr("action", "/editUserForm/" + theToken);

  //EDIT ARTIST
  //change the edit artist page form's action to include the token
  $("#editArtistForm").attr("action", "/editArtistForm/" + theToken);

  //CREATE ARTIST
  //change the create artist page forms action to include the token
  $("#createArtistForm").attr("action", "/createArtistForm/" + theToken);

  //write the link to create a new artist page
  $("#createPageLink").html(
    "<strong>Create a new musician/band page? </strong><button id='createArtistPage' onclick='createArtistPage()'>Create page</button>"
  );

  var getSongsHTML = "";
  //do an ajax request to get artist page ownership
  $.ajax({
    type: "GET",
    url: "/artistPageOwnership/" + uid,
    success: function(result) {
      var html =
        "<strong>You have created the following musician/band pages:</strong><br><br><ul class='remixedSongList'>";
      for (var i = 0; i < result.pagesData.length; i++) {
        html +=
          "<li><a href='/artist/" +
          result.pagesData[i].Id +
          "'>" +
          result.pagesData[i].artist +
          "</a> <div id='btns'><button class='uploadBtn' onclick='createSong(" +
          result.pagesData[i].Id +
          ")'>Upload a track</button> <button class='modifyBtn' onclick='modifyArtistsPage(" +
          result.pagesData[i].Id +
          ")'>Edit page</button> <button class='deleteBtn' onclick='deleteArtistPage(" +
          result.pagesData[i].Id +
          ")'>Delete page</button> </div><br></li>";
      }
      html += "</ul>";
      $("#yourArtists").html(html);
      //now check we have authored tracks and if so add them to the 'yourTracks' div
      html =
        "<strong>You have uploaded the following tracks:</strong><br><br><ul class='remixedSongList'>";
      //now loop through all the tracksData and add tyhe info to the html
      for (var i = 0; i < result.tracksData.length; i++) {
        html +=
          "<li><a href='" +
          result.tracksData[i].mixPath +
          "'>" +
          result.tracksData[i].songTitle +
          " by " +
          result.tracksData[i].artist +
          "</a> <div id='btns'><button class='deleteBtn' onclick='removeTrack(" +
          result.tracksData[i].songId +
          ")'>Remove</button> </div><br></li>";
      }
      $("#yourTracks").html(html);
    },
    error: function() {
      console.log("error trying to get artist page ownership");
    }
  });
}

//delete artist page function
function deleteArtistPage(songId) {
  var remove = confirm("Do you really want to delete this muscian/band page?");
  if (remove == true) {
    var a = document.createElement("a");
    a.href = "/removeArtistsPage/" + songId + "/" + theToken;
    document.body.appendChild(a);
    a.click();
  }
}

//create a song page link
function createSong(theArtist) {
  var a = document.createElement("a");
  a.href = "/authorSong/" + theArtist + "/" + theToken;
  document.body.appendChild(a);
  a.click();
}

//remove track function
function removeTrack(theId) {
  var remove = confirm("Do you really want to delete this track?");
  if (remove == true) {
    var a = document.createElement("a");
    a.href = "/removeTrack/" + theId + "/" + theToken;
    document.body.appendChild(a);
    a.click();
  }
}

//this is how we sign users out
function signOut() {
  if (ourUser.teacher == true) {
    $("#teachLink").remove();
  }
  firebase.auth().signOut();
  theToken = "noToken";
  checkIfLoggedIn();
  //remove the 'profile' menu option
  //$('a#prof').remove();
  //if the user was on a page that is only accessible to logged in users rediret them home
  //profile or teacher zone,
  if (
    theWin.indexOf("/profile/") >= 0 ||
    theWin.indexOf("/teacherzone/") >= 0
  ) {
    var a = document.createElement("a");
    a.href = "/";
    document.body.appendChild(a);
    a.click();
  }
}

//when the page loads check if a user is logged in (local storeage will hold a user object if so)
function checkIfLoggedIn() {
  user = firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      //we are logged in
      console.log("here is the USER!");
      console.log(user);
      //check if the sign up with email form is visible
      //if so we need to add the UID to the form and push the form to the DB
      if ($("#myModal_signUpWithEmail").css("display") == "block") {
        //alert("you are showing the SUWE form so I will get the UID, add it to the form and push the form to the DB");
        $('input[name="userIdE"]').val(user.uid); //set the author field
        //now I push this form to the DB
        var frm = $("#newUserWithEmailForm");
        $.ajax({
          type: frm.attr("method"),
          url: frm.attr("action"),
          data: frm.serialize(),
          success: function(data) {
            console.log("Submission was successful.");
            //now run the checkIfLoggedIn() function to set up the login menu
            checkIfLoggedIn();
          },
          error: function(data) {
            console.log("An error occurred.");
            //console.log(data);
          }
        });
        //now I close this form
        $(".modal").css({ display: "none" });
      } else {
        //retreive the user info from our database
        checkUserInDB(user);
        //console.log(user);
        //console.log('token is ' + user.ie);
        theToken = user.ie;
        //console.log('logged in as ' + user.displayName);
        //update userName variables
        loggedIn = true;
        //userName = user.displayName;
        userID = user.uid;
      }
    } else {
      //we are not logged in
      //hide the signOut label
      $("#dropLogoutLabel").hide();
      //show the signIn label
      $("#dropLoginLabel").show();
    }
  });
}

//call the checkIfLoggedIn function so we can sort out the DOM accordingly
var theWin = window.location.href;
if (
  theWin === "http://localhost:3000/signUp" ||
  theWin === "https://remixportal.co.uk/signUp"
) {
} else {
  checkIfLoggedIn();
}

//user interactions

//handle clicks to the log in/sign up span
$("#dropLoginLabel").click(function() {
  document.getElementById("loginDropdown").classList.toggle("show");
});

//cancel button closes the menu
$("#dropCancel").click(function() {
  //it's open so toggling will close it
  document.getElementById("loginDropdown").classList.toggle("show");
});

//sign in button signs the user in then closes the menu
$("#signInWithGoogle").click(function() {
  signInWithGoogle(); //signIn
  //close the drop-down
  document.getElementById("loginDropdown").classList.toggle("show");
  $("#dropLoginLabel").hide(); //hide the signIn label
  $("#dropLogoutLabel").show(); //show the signOut label
});

//sign in button signs the user in then closes the menu
$("#signInWithFacebook").click(function() {
  signInWithFacebook(); //signIn
  //close the drop-down
  document.getElementById("loginDropdown").classList.toggle("show");
  $("#dropLoginLabel").hide(); //hide the signIn label
  $("#dropLogoutLabel").show(); //show the signOut label
});

//sign in button signs the user in then closes the menu
$("#signInWithEmail").click(function() {
  signInWithEmail(); //signIn
  //close the drop-down
  document.getElementById("loginDropdown").classList.toggle("show");
});

//sign in button on the modal that pops up after the sign in menu item is selected
$("#signInWithEmailBtn").click(function() {
  //check we have an email and password
  if ($("input[name='userEmail']").val() != "") {
    if ($("input[name='userPassword']").val() != "") {
      //do the sign in
      firebase
        .auth()
        .signInWithEmailAndPassword(
          $("input[name='userEmail']").val(),
          $("input[name='userPassword']").val()
        )
        .then(function(user) {
          //success code
          //close the login modal
          $(".modal").css({ display: "none" });
          $("#dropLoginLabel").hide(); //hide the signIn label
          $("#dropLogoutLabel").show(); //show the signOut label
        })
        .catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          if (errorCode === "auth/wrong-password") {
            alert("Wrong password.");
          } else {
            alert(errorMessage);
          }
        });
    } else {
      alert("you've not entered a password!");
    }
  } else {
    alert("you've not entered an email address!");
  }
});

//forgot password (for email sign in) button pressed
$("#forgotPasswordBtn").click(function() {
  //check if the user has entered their email in the email box
  if (document.getElementsByName("userEmail")[0].value == "") {
    //tell them to enter their email in the email box
    alert(
      "Please enter your email address into the email box then press the 'forgot password?' button again"
    );
  } else if (
    isValidEmailAddress(document.getElementsByName("userEmail")[0].value) !=
    true
  ) {
    //tell them to enter their email in the email box
    alert(
      "You have not entered a valid email address in the email box. Please correct this then try again"
    );
  } else {
    //valid email so send the reset email
    //send the password reset email
    firebase
      .auth()
      .sendPasswordResetEmail(document.getElementsByName("userEmail")[0].value)
      .then(function() {
        //tell the user a password reset email has been sent
        alert(
          "An email containing a link to reset your password has been sent. You should receive it in the next few minutes"
        );
        //close this join with email modal
        $(".modal").css({ display: "none" });
      })
      .catch(function(error) {
        if (
          error.message ==
          "There is no user record corresponding to this identifier. The user may have been deleted."
        ) {
          alert(
            "Email address not found. Might you have used a different email address?"
          );
        } else {
          alert(error);
        }
      });
  }
});

//sign in button signs the user in then closes the menu
$("#joinWithEmailBtn").click(function() {
  //close this join with email modal
  $(".modal").css({ display: "none" });
  //launch the sign up modal but add the enter password, confirm password section
  $("#myModal_signUpWithEmail").css({ display: "block" });
});

//handle clicks to the log out span
$("#dropLogoutLabel").click(function() {
  document.getElementById("logoutDropdown").classList.toggle("show");
});

//cancel button closes the menu
$("#dropOutCancel").click(function() {
  document.getElementById("logoutDropdown").classList.toggle("show");
});

//sign out button logs the user out then closes the menu
$("#signOut").click(function() {
  signOut(); //sign out using Firebse
  //close the drop-down
  document.getElementById("logoutDropdown").classList.toggle("show");
  $("#dropLogoutLabel").hide(); //show the signOut label
  $("#dropLoginLabel").show(); //hide the signIn label
  //update the variables
  loggedIn = false;
  userName = "guest";
  userID = "1234";
});
