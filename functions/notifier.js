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
    let notif = {
      userNotification: {
        title: 'Sairaj, You have new notifications !',
      },
      target: {
        userId: 'ABwppHEEoc3odHhzJzuOYoJfPp0TymFyZEU1B_zwahJ_1_5oTydmI5URp_n65gEprh_sxMuONCtAX9Ff7xk',
        intent: 'tnp',
        locale: 'en-US'
      },
    };
  
    request.post('https://actions.googleapis.com/v2/conversations:send', {
      'auth': {
        'bearer': tokens.access_token,
       },
      'json': true,
      'body': {'customPushMessage': notif},
    }, (err, httpResponse, body) => {
       console.log(httpResponse.statusCode + ': ' + httpResponse.statusMessage);
    });
  });
  
  