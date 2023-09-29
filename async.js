import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

const createTimeoutPromise = (delay) => new Promise(resolve => setTimeout(resolve, delay));

// takes array of items and runs a string of promises one after another, one at a time separated by the delay
export const pipeline = (items, promiseBuilder, delay=1000) => 
    items.reduce((promise, item, index) => 
        promise.then(() => createTimeoutPromise(delay))
        .then(() => promiseBuilder(item, index, items)), 
Promise.resolve());

export const itemPromiseBuilder = (item, i, items) => {
    const fileName = item.file_name;
    const userId = item.user_id;
    const destination = path.join('images', `${userId}__${fileName}`);
    const imageUrl = `https://imgproxy.pushd.com/${userId}/${fileName}`;
    const counter = `${i+1}/${items.length}`;
    const IMAGE_DOWNLOADED = true;

    return fs.promises.stat(destination).catch(() => {
        console.log(`Downloading image ${counter}`);
        return fetch(imageUrl)
        .then(res => {
            console.log(`Saving image ${counter}`);
            const fileStream = fs.createWriteStream(destination, { flags: 'w' });
            return res.body.pipe(fileStream);
        }).then(() => IMAGE_DOWNLOADED);
    }).then((res) => {
        if(res !== IMAGE_DOWNLOADED){
            console.log(`Skipping image ${counter} as it already exists`);
        }
    });
};