// based on: https://gist.github.com/kjb/9c792f90a923b87978bf4e90cd2f6556/revisions

import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

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
    const assets = json.assets;
    return Promise.all(
        assets.map((item, i) => {
            const fileName = item.file_name;
            const userId = item.user_id;
            const imageUrl = `https://imgproxy.pushd.com/${userId}/${fileName}`;

            return new Promise(resolve => setTimeout(resolve, i * 1000))
            .then(() => {
                console.log(`Downloading image ${i+1}/${assets.length}`);
                return fetch(imageUrl);
            })
            .then(res => {
                console.log(`Saving image ${i+1}/${assets.length}`);
                const destination = path.join('images', `${userId}__${fileName}`);
                const fileStream = fs.createWriteStream(destination, { flags: 'w' });
                return res.body.pipe(fileStream);
            });
        })
    );
});
