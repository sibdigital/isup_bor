
const apikey = '6ed35a6ba7f37cfa58524ab99a4df244b71ce6c63d7d3ac5fcb04aa5d8a895a7';
const projects_url = 'opsd3.herokuapp.com/api/v3/projects';
const head_url = 'https://apikey:';
const wp_url = 'work_packages';

const VIEW_PROJECT = 'VIEW_PROJECT';

const request = require('request');

request(head_url +apikey +'@' + projects_url , { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    let projects = body._embedded.elements;

    var buttons = []
    for(var p in projects) {
        buttons.push(button(projects[p].name, VIEW_PROJECT));
        console.log(projects[p].name);
    }

    console.log(keyboard (buttons));

    // for(var p in projects) {
    //     console.log(projects[p].name);
    // }
    //
    // for(var p in projects) {
    //     request(head_url +apikey +'@' + projects_url + '/' + projects[p].id + '/' + wp_url, { json: true }, (err, res, body) => {
    //         if (err) { return console.log(err); }
    //         //console.log(body);
    //         let wps = body._embedded.elements;
    //         for(var w in wps) {
    //             console.log(wps[w].subject);
    //         }
    //     });
    // }

    //console.log(body);
});

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

// const https = require('https');
//
// https.get('https://apikey:6ed35a6ba7f37cfa58524ab99a4df244b71ce6c63d7d3ac5fcb04aa5d8a895a7@opsd3.herokuapp.com/api/v3/projects/1', (resp) => {
//     let data = '';
//
//     resp.on('data', (chunk) => {
//         data += chunk;
//     });
//
//     // The whole response has been received. Print out the result.
//     resp.on('end', () => {
//         console.log(JSON.parse(data));
//     });
//
// }).on("error", (err) => {
//     console.log("Error: " + err.message);
// });