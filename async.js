import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

/**
 * @typedef {Object} ImageItem
 * @property {string} fileName
 * @property {string} userId
 * @property {string} destination
 * @property {string} url
 */

export const DESTINATION_DIR = 'images';

/**
 * @param {string} fileName
 * @returns {Promise<boolean>}
 */
const doesFileExist = (fileName) => fs.promises.stat(fileName)
.catch(() => false)
.then(res => res !== false);

const createTimeoutPromise = (delay) => new Promise(resolve => setTimeout(resolve, delay));

// takes array of items and runs a string of promises one after another, one at a time separated by the delay
export const pipeline = (items, promiseBuilder, delay=1000) => 
    items.reduce((promise, item, index) => 
        promise.then(() => createTimeoutPromise(delay))
        .then(() => promiseBuilder(item, index, items)), 
Promise.resolve());

/**
 * @param {Array.<Object>} items
 * @returns {Promise<ImageItem>}
 */
export const filterOutExistingImages = (items) => Promise.all(
    items.map(item => {
        const fileName = item.file_name;
        const userId = item.user_id;
        const imageItem = {
            fileName,
            userId,
            destination: path.join(DESTINATION_DIR, `${userId}__${fileName}`),
            url: `https://imgproxy.pushd.com/${userId}/${fileName}`,
        };
        return doesFileExist(imageItem.destination)
        .then(res => res ? null : imageItem);
    })
).then(items => items.filter(item => item !== null));

/**
 * @param {ImageItem} item
 * @param {number} i
 * @param {Array.<ImageItem>} items
 */
export const itemPromiseBuilder = (item, i, items) => {
    const destination = item.destination;
    const counter = `${i+1}/${items.length}`;
    const IMAGE_DOWNLOADED = true;

    return fs.promises.stat(destination).catch(() => {
        console.log(`Downloading image ${counter}`);
        return fetch(item.url)
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