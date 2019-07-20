'use strict';

const ViberBot = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;
const LocationMessage = require('viber-bot').Message.Location;

const apikey = '6ed35a6ba7f37cfa58524ab99a4df244b71ce6c63d7d3ac5fcb04aa5d8a895a7';
const projects_url = 'opsd3.herokuapp.com/api/v3/projects';
const head_url = 'https://apikey:';
const wp_url = 'work_packages';

const VIEW_PROJECT = 'VIEW_PROJECT';

require('dotenv').config();

const winston = require('winston');
const toYAML = require('winston-console-formatter');
const ngrok = require('./get_public_url');

var all_users = ngrok.users;
var request = require('request');

function createLogger() {
    const logger = new winston.Logger({
        level: "debug" // We recommend using the debug level for development
    });

    logger.add(winston.transports.Console, toYAML.config());
    return logger;
}

const logger = createLogger();

if (!process.env.VIBER_PUBLIC_ACCOUNT_ACCESS_TOKEN_KEY) {
    logger.debug('Could not find the Viber account access token key in your environment variable. Please make sure you followed readme guide.');
    return;
}

// Creating the bot with access token, name and avatar
var bot = new ViberBot(logger, {
    authToken: process.env.VIBER_PUBLIC_ACCOUNT_ACCESS_TOKEN_KEY, // Learn how to get your access token at developers.viber.com
    name: "ИСУП РБ",
    avatar: 'https://share.cdn.viber.com/pg_download?id=0-04-01-987db9f24a1a2b95028f694982877b0023d055cfd9ff52c31dfdfcd79f6c7392&filetype=jpg&type=icon'
    //"https://raw.githubusercontent.com/devrelv/drop/master/151-icon.png" // Just a placeholder avatar to display the user
});

// The user will get those messages on first registration
bot.onSubscribe(response => {
    say(response, `Hi there ${response.userProfile.name}. I am ${bot.name}! Feel free to ask me if a web site is down for everyone or just you. Just send me a name of a website and I'll do the rest!`);
});

bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
    //This sample bot can answer only text messages, let's make sure the user is aware of that.
    if (message instanceof LocationMessage){
        bot.onLocationMessage(message, response);
    }else {
        if (!(message instanceof TextMessage)) {
            say(response, `Sorry. I can only understand text messages.`);
        }
    }
});

// bot.onLocationMessage = function (message, response){
//     try {
//         logger.log(response.userProfile.name + " : " + response.userProfile.id + " - " + message.latitude + " : " + message.longitude);
//         all_users.add(response.userProfile.name + " : " + response.userProfile.id + " - " + message.latitude + " : " + message.longitude);
//         const simgr = new SheduleInfoManager();
//         const shed = simgr.nearest(message.latitude, message.longitude);
//         const shedInfo = simgr.asString(shed);
//         let msg = new TextMessage('Ближайшая к вам клиентская служба: \n'+ shedInfo, main_keyboard.MAIN_KEYBOARD);
//         response.send(msg);
//
//         let loc = new LocationMessage(shed.Adress.latitude, shed.Adress.longitude, main_keyboard.MAIN_KEYBOARD);
//         response.send(loc);
//     }catch (e) {
//         logger.debug(e);
//     }
// }

bot.onTextMessage(/./, (message, response) => {
    try {
        logger.log(response.userProfile.name + " : " + response.userProfile.id);
        all_users.add(response.userProfile.name + " : " + response.userProfile.id);
        const text = message.text;
        if (text != undefined) {
             if (text === VIEW_PROJECT) {
            //     const simgr = new SheduleInfoManager();
            //     const sik = simgr.keyboard();
            //     let msg = new TextMessage("Узнайте адрес, время работы и контакты клиентской службы", sik);
            //     response.send(msg);
            //
            // } else if (text === main_keyboard.PENS_DOC) {
            //     const pdmgr = new PensionDocInfoManager();
            //     const pdk = pdmgr.keyboard();
            //     let msg = new TextMessage("Узнайте, какие документы необходмы в различных жизненных ситуациях", pdk);
            //     response.send(msg);
            // }else if (text === main_keyboard.NEAREST_KS) {
            //     let msg = new TextMessage("Отправьте мне ваше местоположение и я покажу на карте ближайшую клиентскую службу");
            //     response.send(msg);
            // }else if (text === main_keyboard.PRED_PENS_DOC) {
            //     const ppdmgr = new PredPensionDocInfoManager();
            //     const ppdk = ppdmgr.keyboard();
            //     let msg = new TextMessage("Часто задаваемые вопросы о предпенсионном возрасте", ppdk);
            //     response.send(msg);
            // }else if (text === main_keyboard.MAIN_MENU) {
            //     let msg = new TextMessage("Выберите действие", main_keyboard.MAIN_KEYBOARD);
            //     response.send(msg);
            //
            // } else if (text.startsWith(main_keyboard.KS_PREFIX)) {
            //     const simgr = new SheduleInfoManager();
            //     const shedInfo = simgr.infoAsString(text);
            //     let msg = new TextMessage(shedInfo, main_keyboard.MAIN_KEYBOARD);
            //     response.send(msg);
            //
            // }else if (text.startsWith(main_keyboard.PENSION_DOC_PREFIX)) {
            //     const pdmgr = new PensionDocInfoManager();
            //     const pdInfo = pdmgr.infoAsString(text);
            //     let msg = new TextMessage(pdInfo, main_keyboard.MAIN_KEYBOARD);
            //     response.send(msg);
            //
            // }else if (text.startsWith(main_keyboard.PRED_PENS_PREFIX)) {
            //     const ppdmgr = new PredPensionDocInfoManager();
            //     const ppdInfo = ppdmgr.infoAsString(text);
            //     let msg = new TextMessage(ppdInfo, main_keyboard.MAIN_KEYBOARD);
            //     response.send(msg);
            //
            // } else if (text === 'юзеры') {
            //     var txt = '';
            //     all_users.forEach(function (value) {
            //         txt += value + '\n';
            //     });
            //     let msg = new TextMessage(txt, main_keyboard.MAIN_KEYBOARD);
            //     response.send(msg);
             } else{
                 logger.log('request projects');
                 request(head_url +apikey +'@' + projects_url , { json: true }, (err, res, body) => {
                     if (err) { return console.log(err); }
                     let projects = body._embedded.elements;

                     var buttons = []
                     for(var p in projects) {
                         buttons.push(button(projects[p].name, VIEW_PROJECT));
                         logger.log(projects[p].name);
                     }

                     var keyboard = keyboard(buttons);

                     let msg = new TextMessage("Выберите проект", keyboard);
                     response.send(msg);
                     //console.log(body);
                 });
             }
        }else{
            logger.log('request projects');
            request(head_url +apikey +'@' + projects_url , { json: true }, (err, res, body) => {
                if (err) { return console.log(err); }
                let projects = body._embedded.elements;

                var buttons = []
                for(var p in projects) {
                    buttons.push(button(projects[p].name, VIEW_PROJECT));
                    logger.log(projects[p].name);
                }

                var keyboard = keyboard(buttons);

                let msg = new TextMessage("Выберите проект", keyboard);
                response.send(msg);
                //console.log(body);
            });

        }
    }catch (e) {
        logger.debug(e);
    }
});



bot.onConversationStarted((userProfile, isSubscribed, context, onFinish) => onFinish(
    new TextMessage(`Чтобы начать работу отправьте мне любое сообщение`), {
        saidThanks: true
    }));

if (process.env.NOW_URL || process.env.HEROKU_URL) {
    const http = require('http');
    const port = process.env.PORT || 5000;

    http.createServer(bot.middleware()).listen(port, () => bot.setWebhook(process.env.NOW_URL || process.env.HEROKU_URL));
} else {
    logger.debug('Could not find the now.sh/Heroku environment variables. Trying to use the local ngrok server.');
    return ngrok.getPublicUrl().then(publicUrl => {
        const http = require('http');
        const port = process.env.PORT || 5000;

        http.createServer(bot.middleware()).listen(port, () => bot.setWebhook(publicUrl));

    }).catch(error => {
        console.log('Can not connect to ngrok server. Is it running?');
        console.error(error);
        process.exit(1);
    });
}

function button(text, action_body, action_type, text_size, bg_color) {
    return {
        BgColor: bg_color || '#40E0D0',
        Text: text,
        ActionType: action_type || 'reply',
        ActionBody: action_body,
        TextSize: text_size || 'regular'
    }
}

function keyboard (buttons, bg_color, default_height){
    return {
        Type: "keyboard",
        Revision: 1,
        DefaultHeight: default_height || true,
        BgColor: bg_color ||'#F0FFFF',
        Buttons: buttons
    }
}
