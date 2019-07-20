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
const WP_PROSR = 'WP_PROSR';
const WP_NEAR = 'WP_NEAR';

require('dotenv').config();

const winston = require('winston');
const toYAML = require('winston-console-formatter');
const ngrok = require('./get_public_url');

var all_users = ngrok.users;
var request = require('request');
var sync_request = require('sync-request');

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
    say(response, `Здравствуйте, ${response.userProfile.name}. Начните работу, отправив мне любое сообщение!`);
});

bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
    //This sample bot can answer only text messages, let's make sure the user is aware of that.
    if (message instanceof LocationMessage){
        bot.onLocationMessage(message, response);
    }else {
        if (!(message instanceof TextMessage)) {
            say(response, `Извините, я вас не понимаю`);
        }
    }
});

bot.onTextMessage(/./, (message, response) => {
    try {
        logger.log(response.userProfile.name + " : " + response.userProfile.id);
        all_users.add(response.userProfile.name + " : " + response.userProfile.id);
        const mtext = message.text;
        if (mtext != undefined) {
            let splitted = mtext.split(',')
            if (splitted[0] === VIEW_PROJECT) {
                let project_id = splitted[1];

                var buttons = [];
                buttons.push(build_button('Просроченные КТ', WP_PROSR + ',' + project_id));
                buttons.push(build_button('В ближайшие 2 недели', WP_NEAR + ',' + project_id));
                buttons.push(build_button('Главное меню', ''));
                var keyboard = build_keyboard(buttons);

                let msg = new TextMessage("Информация по мероприятиям и КТ", keyboard);
                response.send(msg);
             } else if (splitted[0] === WP_PROSR) {
                let project_id = splitted[1];

                request(head_url +apikey +'@' + projects_url + '/' + project_id + '/' + wp_url, { json: true }, (err, res, body) => {
                    if (err) { return console.log(err); }
                    //console.log(body);
                    let wps = body._embedded.elements;
                    var text = '';
                    for(var w in wps) {
                        let due_date = new Date(wps[w].dueDate);
                        if (due_date < Date.now()){
                            text += "\ud83d\udd34"
                                + " "+ wps[w].subject + ' Просрочено \n'
                                + " Ответственный: " + wps[w]._links.assignee.title + '\n'
                                + ' Cрок исполнения: ' + wps[w].dueDate + '\n';
                        }
                    }
                    if (text === ''){
                        text = '\u2705' + 'Просроченные КТ и мероприятия отсутствуют';
                    }

                    var buttons = [];
                    buttons.push(build_button('Просроченные КТ', WP_PROSR + ',' + project_id), '#DC143C');
                    buttons.push(build_button('В ближайшие 2 недели', WP_NEAR + ',' + project_id), '#FFA500');
                    buttons.push(build_button('Главное меню', ''));
                    var keyboard = build_keyboard(buttons);

                    let msg = new TextMessage(text, keyboard);
                    response.send(msg);
                });

            } else if (splitted[0] === WP_NEAR) {
                let project_id = splitted[1];

                request(head_url +apikey +'@' + projects_url + '/' + project_id + '/' + wp_url, { json: true }, (err, res, body) => {
                    if (err) { return console.log(err); }
                    //console.log(body);
                    let wps = body._embedded.elements;
                    var text = '';
                    for(var w in wps) {
                        let due_date = new Date(wps[w].dueDate);
                        let now = new Date(Date.now());
                        const diffTime = Math.abs(due_date.getTime() - now.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays <= 14){
                            text += "\u23f3"
                                + " "+ wps[w].subject + '. Осталось ' + diffDays + ' дней\n'
                                + " Ответственный: " + wps[w]._links.assignee.title + '\n'
                                + ' Cрок исполнения: ' + wps[w].dueDate + '\n';
                        }
                    }
                    if (text === ''){
                        text = '\u2705' + 'В ближайшее время сроков исполнения мероприятий и КТ нет';
                    }

                    var buttons = [];
                    buttons.push(build_button('Просроченные КТ', WP_PROSR + ',' + project_id), '#DC143C');
                    buttons.push(build_button('В ближайшие 2 недели', WP_NEAR + ',' + project_id), '#FFA500');
                    buttons.push(build_button('Главное меню', ''));
                    var keyboard = build_keyboard(buttons);

                    let msg = new TextMessage(text, keyboard);
                    response.send(msg);
                });
            } else{
                 logger.log('request projects');
                 request(head_url +apikey +'@' + projects_url , { json: true }, (err, res, body) => {
                     if (err) { return console.log(err); }
                     let projects = body._embedded.elements;

                     var buttons = []
                     for(var p in projects) {
                         let res = sync_request('GET', head_url +apikey +'@' + projects_url + '/' + projects[p].id + '/' + wp_url, { json: true });
                         let result =JSON.parse(res.getBody('utf8'));
                         var bgColor = '#228B22';

                         let wps = result._embedded.elements;
                         var text = '';
                         for(var w in wps) {
                             let due_date = new Date(wps[w].dueDate);
                             let now = new Date(Date.now());
                             const diffTime = Math.abs(due_date.getTime() - now.getTime());
                             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                             if (due_date < Date.now()){
                                 bgColor = '#DC143C';
                                 break;
                             }
                             if (diffDays <= 14){
                                 bgColor = '#FFA500';
                                 break;
                             }
                         }

                         buttons.push(build_button(projects[p].name, VIEW_PROJECT + ',' + projects[p].i, bgColor));
                         logger.log(projects[p].name + ' ' + bgColor);
                     }

                     var keyboard = build_keyboard(buttons);

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
                    let res = sync_request('GET', head_url +apikey +'@' + projects_url + '/' + projects[p].id + '/' + wp_url, { json: true });
                    let result =JSON.parse(res.getBody('utf8'));
                    var bgColor = '#40E0D0';

                    let wps = result._embedded.elements;
                    var text = '';
                    for(var w in wps) {
                        let due_date = new Date(wps[w].dueDate);
                        let now = new Date(Date.now());
                        const diffTime = Math.abs(due_date.getTime() - now.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (due_date < Date.now()){
                            bgColor = '#DC143C';
                            break;
                        }
                        if (diffDays <= 14){
                            bgColor = '#FFA500';
                            break;
                        }
                    }

                    buttons.push(build_button(projects[p].name, VIEW_PROJECT, bgColor));
                    logger.log(projects[p].name + ' ' + bgColor);
                }

                var keyboard = build_keyboard(buttons);

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
    new TextMessage(`Чтобы начать работу, отправьте мне любое сообщение`), {
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

function build_button(text, action_body, bg_color, text_size, action_type) {
    return {
        BgColor: bg_color || '#40E0D0',
        Text: text,
        ActionType: action_type || 'reply',
        ActionBody: action_body,
        TextSize: text_size || 'regular'
    }
}

function build_keyboard (buttons, bg_color, default_height){
    return {
        Type: "keyboard",
        Revision: 1,
        DefaultHeight: default_height || true,
        BgColor: bg_color ||'#F0FFFF',
        Buttons: buttons
    }
}

//new Date(wps[w].dueDate) > Date.now()
