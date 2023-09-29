// based on: https://gist.github.com/kjb/9c792f90a923b87978bf4e90cd2f6556/revisions

import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

import { pipeline, itemPromiseBuilder, filterOutExistingImages } from './async.js';

dotenv.config();

const body = {
    //   identifier_for_vendor: "does-not-matter",
    //   client_device_id: "does-not-matter",
    app_identifier: 'com.pushd.Framelord',
    locale: 'en',
    user: {
        email: process.env.AURA_EMAIL,
        password: process.env.AURA_PASSWORD,
    },
};

const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
};

fetch('https://api.pushd.com/v5/login.json', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
}).then(r => r.json())
.then(json => {
    // console.log(JSON.stringify(json));

    headers['X-User-Id'] = json.result.current_user.id;
    headers['X-Token-Auth'] = json.result.current_user.auth_token;

    const frameUrl = `https://api.pushd.com/v5/frames/${process.env.FRAME_ID}/assets.json?limit=1000&side_load_users=false`;

    return fetch(frameUrl, {
        method: 'POST',
        headers,
    });
})
.then(r => r.json())
.then(json => {
    // console.log(JSON.stringify(json));
    return filterOutExistingImages(json.assets);
})
.then(items => {
    if(items.length === 0){
        console.log('No images to download');
        return;
    }
    return pipeline(items, itemPromiseBuilder);
});
