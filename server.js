'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const axios = require('axios')
const app = express()
const token = 'EAAQ7MwzNNKUBAKvsan60ka73hfc4SouF9c0anDWeJam00GLZBXdT5Yf40JtbymZBeo0ZAsIu9JgkL7ZA0BTPs9Y4PXvRrczibXIE36hWC33j0JURNwntBmj9hspFEibgAVDdzvK7WdRyvdxMkuYscUKLMvZAaHWDUWKpAHiasMgZDZD'
app.set('port', (process.env.PORT || 5000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.get('/', function (req, res) {
  res.send('test test')
})
app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'weather') {
    res.send(req.query['hub.challenge'])
  }
  res.send('Error, wrong token')
})
app.post('/webhook/', function (req, res) {
  let messaging_events = req.body.entry[0].messaging
  for (let i = 0; i < messaging_events.length; i++) {
    let event = req.body.entry[0].messaging[i]
    let sender = event.sender.id
    if (event.message && event.message.text) {
       var location = event.message.text
      var weatherEndpoint = 'http://api.openweathermap.org/data/2.5/weather?q=' +location+ '&appid=6fb894d64865ba56e58e91e67eaade93'
      request({
        url: weatherEndpoint,
        json: true
      }, function(error, response, body) {
        try {
          var condition = body.main;
          var city = body;
          sendTextMessage(sender, "วันนี้ อุณหภูมิ " + condition.temp + " °C  " + "ความชื้น " + condition.humidity + " % ที่ " + city.name);
        } catch(err) {
          console.error('error caught', err);
          sendTextMessage(sender, "โปรดใส่ชื่อเมืองให้ถูกต้อง(ยกตัวอย่างเช่น ฺBangkok )");
        }
      })

      let text = event.message.text
      if (text === 'Generic') {
        sendGenericMessage(sender)
        continue
      }
      // sendTextMessage(sender, 'Text received, echo: ' + text.substring(0, 200))
        axios.get('http://api.openweathermap.org/data/2.5/weather?q=' + text + '&APPID=7fee5476cbd1705fb181c28e20c473b7').then(function (res) {
          console.log(res.data.main.temp)
          sendTextMessage(sender, res.data.main.temp - 273)
        })
    }
    if (event.postback) {
      let text = JSON.stringify(event.postback)
      sendTextMessage(sender, 'Postback received: ' + text.substring(0, 200), token)
      continue
    }
  }
  res.sendStatus(200)
})

function sendTextMessage (sender, text) {
  let messageData = { text: text }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: token},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: messageData
    }
  }, function (error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

function sendGenericMessage (sender) {
  let messageData = {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'generic',
        'elements': [{
          'title': 'First card',
          'subtitle': 'Element #1 of an hscroll',
          'image_url': 'http://messengerdemo.parseapp.com/img/rift.png',
          'buttons': [{
            'type': 'web_url',
            'url': 'https://www.messenger.com',
            'title': 'web url'
          }, {
            'type': 'postback',
            'title': 'Postback',
            'payload': 'Payload for first element in a generic bubble'
          }]
        }, {
          'title': 'Second card',
          'subtitle': 'Element #2 of an hscroll',
          'image_url': 'http://messengerdemo.parseapp.com/img/gearvr.png',
          'buttons': [{
            'type': 'postback',
            'title': 'Postback',
            'payload': 'Payload for second element in a generic bubble'
          }]
        }]
      }
    }
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: token},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: messageData
    }
  }, function (error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

app.listen(app.get('port'), function () {
  console.log('running on port', app.get('port'))
})
