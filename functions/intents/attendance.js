const cheerio = require('cheerio'),
    cheerioTableparser = require('cheerio-tableparser');


const SECRET_KEY = '310a7b2cd0e52dd19c9bbe4c78f1eb6778af88a67a5990969273711054584e037c3bee2f22ea5ebfe7cb6b3d151f54b87c0b232f5424fb54ebdf64f590e9e913' // this is SHA of mySuperPassword

function passwordToSHAPasskey(plainPassword) {
    var encryption = require('./encryption');
    var encryptedString = encryption.crypto.encrypt(plainPassword, SECRET_KEY, 256)
    return encryptedString
}

function getAttendanceOf(regNumber, plainPassword, dealWithAttendance) {
    var request = require('request');
    var fs = require('fs')

    var request = request.defaults({
        jar: true
    }) // Enable Session On this requests library
    passKey = passwordToSHAPasskey(plainPassword)

    var authenticatePayload = {
        'loginid': regNumber,
        'password': passKey,
        'dbConnVar': 'PICT',
        'hiddenfield': SECRET_KEY,
        'service_id': ''
    }
    request.post({
      //  url: 'https://pict.ethdigitalcampus.com/DCWeb/authenticate.do',
        rejectUnauthorized: false,
        url: 'https://pict.ethdigitalcampus.com:443/DCWeb/authenticate.do',
        formData: authenticatePayload
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
            return console.error('upload failed:', err);
        }
        request({rejectUnauthorized: false,url:'https://pict.ethdigitalcampus.com/DCWeb/form/jsp_sms/StudentsPersonalFolder_pict.jsp?dashboard=1'}, function (error, response, body) {
            if (error == null) {
                dealWithAttendance(body)
            } else {
                console.log('Some Error loading data with credential', error)
            } 
        });
    });
}

var getAttendanceDetails = (enrollmentno, password) => {

    return new Promise(function (resolve, reject) {

        getAttendanceOf(enrollmentno, password, function (html_content) {
            
            const $ = cheerio.load(html_content)
            var main_table = $('#table10')
            var attendance_table =
                `<table border="0" align="center"  cellpadding="0" style="width:100%" class="maintable"  id="table1">` + main_table.html() + `</table>`
            $2 = cheerio.load(attendance_table);
            cheerioTableparser($2);
            var data = $2("#table1").parsetable(false, false, true);
            let data_array = [];
            for (let index = 2; index < data[0].length - 1; index++) {
                for (let index2 = 0; index2 < data.length; index2 += 3) {
                    data_array.push(data[index2][index]);
                }
            }
            let arrayOfAttendanceDetailsObject = []
            for (let index = 0; index < data_array.length; index += 4) {

                arrayOfAttendanceDetailsObject.push({

                    lecture_name: data_array[index],
                    total_lectures: data_array[index + 1],
                    attended: data_array[index + 2],
                    percent_attended: data_array[index + 3]

                });
            }
            resolve([arrayOfAttendanceDetailsObject, data[2][data[2].length - 1]]);

        })

    })

}
module.exports.getAttendanceDetails = getAttendanceDetails