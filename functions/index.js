'use strict';
const requestify = require('requestify');
const getLectureOrLab = require('./intents/next_lecture')
const getAttendanceDetails = require('./intents/attendance')
const {
  dialogflow,
  SignIn,
  BasicCard,
  Button,
  Image,
  BrowseCarousel,
} = require('actions-on-google'); // Import the firebase-functions package for deployment.
const functions = require('firebase-functions'); // Instantiate the Dialogflow client.
const app = dialogflow({
  debug: true
});

app.intent('WELCOME', (conv) => {

  conv.ask(new SignIn());

});

app.intent('Get Signin', getEmailFromPayload)

function getEmailFromPayload(conv, params, signin) {

  return new Promise(function (resolve, reject) {

    if (signin.status === 'OK') {

      conv.ask(`Welcome to Everyday Simplifier. How can we assist you ?`);
      conv.ask(new BasicCard({
        text: `List of Operations Supported:  \n Just Say 
        **Next Lecture** to know your timetable !  \n Say
        **Recent Seminars** to know seminars/events !  \n Just Say
        **My attendance**  to know attendance !  \n Just Say
        **Mess Menu** to know Canteen's Menu  \n Why wait? Tap the mic & give us a try!`,
        subtitle: 'Let your Voice command your actions!',
        title: 'Welcome to Everyday Simplifier',
        buttons: new Button({
          title: 'Need Help? Or Request a function!',
          url: 'pict.assistant@gmail.com',
        }),
        image: new Image({
          url: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Pict_logo.png?1534483016863',
          alt: 'PICT Logo',
        }),
      }));
      resolve()

    } else {
      conv.ask(`I won't be able to save your data, but what do you want to next?`)
      reject()
    }

  });
}

app.intent('lecture', showNextLecture)

function showNextLecture(conv, params, signin) {

  return new Promise(function (resolve, reject) {
    const access_token = conv.user.access.token;
    let email;
    const link = `https://www.googleapis.com/oauth2/v1/userinfo?access_token=` + access_token;
    requestify.get(link)
      .then(function (response) {
        email = response.getBody()["email"];
      })
      .then(() => {
        let lecture_details = {};
        getLectureOrLab.getLectureOrLab(email)
          .then(function (details) {
            lecture_details = details;
            // getAttendanceDetails.getAttendanceDetails('C2K17207252', '$airaj111')
            // .then(function (attendanceDetails) {
            //   conv.ask(` Your average attendance is ${attendanceDetails[1]}`);
            // })
            conv.ask(` Your next lecture/lab is ${lecture_details['subjectname']} in ${lecture_details['location']}`);
            resolve();
          })
          .catch(function (errormsg) {
            conv.ask('College Done for today, ' + errormsg);
            resolve();
          })

      })
  });

}

app.intent('sessions', showRecentSessions)

function showRecentSessions(conv) {

  return new Promise(function (resolve, reject) {

    getLectureOrLab.getEvents().then((items_from_db) => {

      conv.ask("Here are some upcoming Sessions and Events!")
      conv.ask(new BrowseCarousel({
        items: items_from_db,
      }));
      resolve();
    })

  });
}



app.intent('canteen_menu', showCanteenMenu)

function showCanteenMenu(conv, params, signin) {

  return new Promise(function (resolve, reject) {

    // Simple table
    // conv.ask('Simple Response')
    // conv.ask(new Table({
    //   dividers: true,
    //   columns: ['header 1', 'header 2', 'header 3'],
    //   rows: [
    //     ['row 1 item 1', 'row 1 item 2', 'row 1 item 3'],
    //     ['row 2 item 1', 'row 2 item 2', 'row 2 item 3'],
    //   ],
    // }))

    conv.ask(`Here is today's Canteen Menu !`);
    conv.ask(new BasicCard({
      text: `1. Matki Bhaji  \n2. Patwadi Rassa  \n3. Plain Rice  \n4. Tomato Waran  \n5. Chapati  \n6. Cabbage Salad `,
      title: 'PICT Canteen Menu',
      image: new Image({
        url: 'https://image.ibb.co/i45WiK/Whats_App_Image_2018_08_16_at_23_08_13.jpg',
        alt: 'PICT Thali',
      }),
      buttons: new Button({
        title: 'Enlarge image',
        url: 'https://image.ibb.co/i45WiK/Whats_App_Image_2018_08_16_at_23_08_13.jpg',
      }),
    }));
    resolve();

  });

}

app.intent('attendance', showAttendance)

function showAttendance(conv, params, signin) {

  return new Promise(function (resolve, reject) {
    getAttendanceDetails.getAttendanceDetails('C2K17207252', '$airaj111')
      .then(function (attendanceDetails) {
        conv.ask(" Here are your attendance details ");
        conv.ask(new BasicCard({
          text: `Your Average attendance is ${attendanceDetails[1]} % `,
          title: 'Your Attendance Details',
          buttons: new Button({
            title: 'View in ETH Portal',
            url: 'http://pict.ethdigitalcampus.com/PICT/',
          }),
        }));
        resolve();

      })

  });
}
// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);