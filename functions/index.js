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
  Suggestions,
  UpdatePermission,
  List
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
            getAttendanceDetails.getAttendanceDetails('C2K17207252', '$airaj111')
              .then(function (attendanceDetails) {

                conv.ask(` Your average attendance is ${attendanceDetails[1]}`);
                conv.ask(` Your next lecture/lab is ${lecture_details['subjectname']} in ${lecture_details['location']}`);
                resolve();
              })
          })
          .catch(function (errormsg) {
            conv.ask('College Done for today, ' + errormsg);
            resolve();
          })

      })
  });

}

app.intent('tnp', showRecentCompanies)

function showRecentCompanies(conv) {

  return new Promise(function (resolve, reject) {

    getLectureOrLab.getCompanies().then((items_from_db) => {

      conv.ask("Here are some upcoming Companies visiting for placements!")
      conv.ask(new BrowseCarousel({
        items: items_from_db,
      }));
      conv.ask('Which one do you want more information on?');
      resolve();
    })

  });
}

app.intent('sessions', showRecentSessions)

function showRecentSessions(conv) {

  return new Promise(function (resolve, reject) {

    getLectureOrLab.getEvents().then((items_from_db) => {

      //  if (!conv.user.storage['userID']) {
      conv.ask(new Suggestions('Notify College Events!'));
      //  }
      conv.ask("Here are some upcoming Sessions and Events!")
      conv.ask(new BrowseCarousel({
        items: items_from_db,
      }));
      resolve();
    })

  });
}

app.intent('push_notif_setup', (conv) => {
  conv.ask(new UpdatePermission({
    intent: 'tnp'
  }));
});


app.intent('finish_push_notif_setup', (conv, params) => {
  if (conv.arguments.get('PERMISSION')) {
    //const userID = conv.user.id;
    const userID = conv.arguments.get('UPDATES_USER_ID');
    conv.user.storage.userID = userID;
    console.log('called');
    // code to save intent and userID in your db
    conv.ask(`Ok, I'll start alerting you.`);
  } else {
    conv.ask(`Ok, I won't alert you.`);
  }
});


app.intent('canteen_menu', showCanteenMenu)

function showCanteenMenu(conv, params, signin) {

  return new Promise(function (resolve, reject) {

    // //Simple table
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

const FirestoreNames = {
  CATEGORY: 'category',
  CREATED_AT: 'created_at',
  INTENT: 'intent',
  TIP: 'tip',
  TIPS: 'tips',
  URL: 'url',
  USERS: 'users',
  USER_ID: 'userId',
  EVENTS: 'events',
};

exports.eventNotify = functions.firestore
  .document('events/{eventId}')
  .onCreate((snap, context) => {
    console.log("here hdsjkssjkd " + snap.data());

    const {
      google
    } = require('googleapis');
    const key = require('./keys/service.json');
    const request = require('request');

    let jwtClient = new google.auth.JWT(
      key.client_email, null, key.private_key,
      ['https://www.googleapis.com/auth/actions.fulfillment.conversation'],
      null
    );

    jwtClient.authorize((err, tokens) => {
      // code to retrieve target userId and intent
      if (err) {
        throw new Error(`Auth error: ${err}`);
      }
      let notif = {
        userNotification: {
          title: 'New Events for you!',
        },
        target: {
          userId: 'ABwppHEbpSQ5dPE2JWnHSe4_Zq3QgtLkMVe0XrZP_1z-MgLIctJma2FEteHDVOl6sjeybrQprzosuKCbVQ8',
          intent: 'sessions',
          locale: 'en-US'
        },
      };

      request.post('https://actions.googleapis.com/v2/conversations:send', {
        'auth': {
          'bearer': tokens.access_token,
        },
        'json': true,
        'body': {
          'customPushMessage': notif,
          'isInSandbox': true
        },
      }, (err, httpResponse, body) => {
        if (err) {
          throw new Error(`API request error: ${err}`);
        }
        console.log(`${httpResponse.statusCode}: ` +
          `${httpResponse.statusMessage}`);
        console.log(JSON.stringify(body));
      });
    });
    return 0;
  });


app.intent('tnp - select.number', (conv, params) => {
  // Get the user's selection
  // Compare the user's selections to each of the item's keys
  console.log(params.number);

  if (parseInt(params.number) == 1) {

    if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
      conv.ask('Sorry, try this on a screen device or select the ' +
        'phone surface in the simulator.');
      return;
    }
    // Create a list
    conv.ask(new Suggestions('Show me recommeneded resources!'));
    conv.ask('Here are Skills required for Microsoft');
    conv.ask(new List({
      title: 'Skills required for Microsoft',
      items: {
        // Add the first item to the list
        'one': {
          synonyms: [
            'synonym of title 1',
            'synonym of title 2',
            'synonym of title 3',
          ],
          title: 'C, C++',
        },
        // Add the second item to the list
        'two': {
          synonyms: [
            'Google Home Assistant',
            'Assistant on the Google Home',
          ],
          title: 'Data Structures & Algorithms',
        },
        // Add the third item to the list
        'three': {
          synonyms: [
            'Google Pixel XL',
            'Pixel',
            'Pixel XL',
          ],
          title: 'Networking',
        },

        'four': {
          synonyms: [
            'Google Pixel XL',
            'Pixel',
            'Pixel XL',
          ],
          title: 'Good Communication Skills & Team Player',
        },
      },
    }));
  }
});