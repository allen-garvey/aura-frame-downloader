import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { doesFileExist } from './util.js';

/**
 * @typedef {Object} ImageItem
 * @property {string} fileName
 * @property {string} userId
 * @property {string} destination
 * @property {string} url
 */

export const DESTINATION_DIR = 'images';

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
).then(items => items.filter(item => item !== null))
.then(filteredItems => {
    console.log(`Total images: ${items.length}. Images skipped since they already exist: ${items.length - filteredItems.length}. Images to download: ${filteredItems.length}`);
    return filteredItems;
});

/**
 * @param {ImageItem} item
 * @param {number} i
 * @param {Array.<ImageItem>} items
 */
export const downloadAndSaveImages = (item, i, items) => {
    const destination = item.destination;
    const progressCounter = `${i+1}/${items.length}`;

    return fs.promises.stat(destination).catch(() => {
        console.log(`Downloading image ${progressCounter}`);
        return fetch(item.url)
        .then(res => {
            console.log(`Saving image ${progressCounter}`);
            const fileStream = fs.createWriteStream(destination, { flags: 'w' });
            return res.body.pipe(fileStream);
        })
    });
};