const firebase = require("firebase");

// Required for side-effects
require("firebase/firestore");
const {
    BrowseCarouselItem,Image
  } = require('actions-on-google');
//init moment here
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Kolkata");

//const firestore = firebase.firestore();
firebase.initializeApp({
    apiKey: 'AIzaSyBkdOWNcF5Dle8yEi36NifOVL-lPUiRFIg',
    authDomain: 'pict-assistant-1a63c.firebaseapp.com',
    projectId: 'pict-assistant-1a63c'
});

const firestore = firebase.firestore();
// const settings = { /* your settings... */
//     timestampsInSnapshots: true
// };
// firestore.settings(settings);

// Initialize Cloud Firestore through Firebase
var db = firebase.firestore();

var getLectureOrLab = function getLectureOrLab(emailid) {

    return new Promise(function (resolve, reject) {
        //from payload.emailid, get following data
        console.log(emailid);
        
        let class_name = ""; //fetch this from db
        let batch_name = ""; //fetch this aswell
        db.collection("users").doc(emailid)
            .get()
            .then((doc) => {
                // if (doc.exists) {
                    class_name = doc.data()['classname'];
                    batch_name = doc.data()['batchname'];

                })
                .catch( () => {
                   reject("User doesnt exist. Kindly register")
                })
                .then(() => {
                const day_name = moment().subtract(1, 'days').tz("Asia/Kolkata").format('dddd');
                let subject_name_to_return = '';

                const curr_time_key = moment().hour() + '00';
                // console.log(curr_time_key);
                var arrayOfTodaysSchedule = [];
                var docRefTillDayName = db.collection("lectures").doc(class_name).collection(day_name);
                docRefTillDayName.get()
                    .then(snapshot => {
                        snapshot.forEach(doc => {

                            arrayOfTodaysSchedule.push(doc.id);

                        });
                    })
                    .then(() => {

                        const first_doc_key = arrayOfTodaysSchedule[0];
                        const last_doc_key = arrayOfTodaysSchedule[arrayOfTodaysSchedule.length - 1];
                        console.log(arrayOfTodaysSchedule, first_doc_key, last_doc_key, curr_time_key);

                        if (parseInt(curr_time_key) < parseInt(first_doc_key)) {

                            //fetch 1st lect/lab details
                            fetchNextLectureFromDatabase(docRefTillDayName, first_doc_key, batch_name)
                                .then(function (subjectname) {
                                    console.log(subjectname);
                                    subject_name_to_return = subjectname;
                                    resolve(subject_name_to_return)
                                });

                        } else if (parseInt(curr_time_key) > parseInt(last_doc_key)) {

                            //no lect/lab
                            reject("Go Home");

                        } else {
                            //normal case
                            docRefTillDayName.doc(curr_time_key)
                                .get()
                                .then((doc) => {
                                    if (doc.exists) {
                                        var next_lect_starttime = doc.data()['endtime'];
                                        fetchNextLectureFromDatabase(docRefTillDayName, next_lect_starttime, batch_name)
                                            .then(function (subjectname) {
                                                console.log(subjectname);
                                                subject_name_to_return = subjectname;
                                                resolve(subject_name_to_return)
                                            });
                                    } else {
                                        // if checked when during lab/lecture time!
                                        console.log("normal case No such document!");
                                        let key_to_check = moment().hour().toString();
                                        if (parseInt(moment().minutes()) < 10) {
                                            key_to_check += '0';
                                        }
                                        key_to_check += moment().minutes().toString();
                                        console.log(key_to_check);
                                        let next_lect_key = '';

                                        for (let index = 0; index < arrayOfTodaysSchedule.length; index++) {

                                            if (parseInt(arrayOfTodaysSchedule[index]) > parseInt(key_to_check)) {
                                                next_lect_key = arrayOfTodaysSchedule[index];
                                                console.log(next_lect_key);
                                                break;
                                            }

                                        }
                                        fetchNextLectureFromDatabase(docRefTillDayName, next_lect_key, batch_name)
                                            .then(function (subjectname) {
                                                console.log(subjectname);
                                                subject_name_to_return = subjectname;
                                                resolve(subject_name_to_return)
                                            });
                                    }

                                })
                        }


                    })
            })
    });
}

function fetchNextLectureFromDatabase(docRefTillDayName, documentToGetDataFrom, batch_name) {
    return new Promise(function (resolve, reject) {
        docRefTillDayName.doc(documentToGetDataFrom)
            .get()
            .then(function (doc) {
                if (doc.exists) {
                    var details = doc.data();
                    if (details['type'] === 'lecture') {
                        resolve(details)
                    } else if (details['type'] == 'lab') {
                        resolve(details['batches'][batch_name])
                    }
                } else {
                    // doc.data() will be undefined in this case
                    console.log("No such document!");
                    reject("Error")
                }
            })
    });
}
var getEvents = () => {

    return new Promise(function (resolve, reject) {

        // Create a browse carousel
        var items_from_db = [];
        db.collection("events").get().then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                // doc.data() is never undefined for query doc snapshots
                items_from_db.push(new BrowseCarouselItem({
                    title: doc.data()['title'],
                    url: doc.data()['url'],
                    description: ` Resource People : ${doc.data()['people']}  \n Date & Time : ${doc.data()['date_time']} \n Venue : ${doc.data()['venue']}` ,
                    footer: 'Click to know more!',
                    image: new Image({
                      url: doc.data()['img_url'],
                      alt: 'PICT Image',
                    }),
                  }))
            });
        }).then( () => {
          resolve(items_from_db);
        })
    
      });
}

var getCompanies = () => {

    return new Promise(function (resolve, reject) {

        // Create a browse carousel
        var items_from_db = [];
        db.collection("tnpdata").get().then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                // doc.data() is never undefined for query doc snapshots
                items_from_db.push(new BrowseCarouselItem({
                    title:` ${doc.data()['name']} - CTC ${doc.data()['ctc']} LPA`,
                    url: doc.data()['apply_url'],
                    description: `Required CGPA: ${doc.data()['cgpa']} \n  Date & Time : ${doc.data()['dateStr']}, ${doc.data()['reportingtime']} AM \n Venue : ${doc.data()['venue']}` ,
                    footer: 'Click to apply!',
                    image: new Image({
                      url: doc.data()['logolink'],
                      alt: 'PICT Image',
                    }),
                  }))
            });
        }).then( () => {
          resolve(items_from_db);
        })
    
      });
}
module.exports.getCompanies = getCompanies;
module.exports.getEvents = getEvents;
module.exports.getLectureOrLab = getLectureOrLab;