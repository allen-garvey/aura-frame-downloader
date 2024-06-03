import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { doesFileExist, formatUserName, timestampToDate } from './util.js';

/**
 * @typedef {Object} ImageItem
 * @property {string} destination
 * @property {string} url
 */

export const DESTINATION_DIR = 'images';

/**
 * @param {Array.<Object>} items
 * @returns {Promise<ImageItem>}
 */
export const filterOutExistingImages = (items) =>
    Promise.all(
        items.map((item) => {
            const fileName = item.file_name;
            const userId = item.user_id;
            const userName = item.user.name
                ? formatUserName(item.user.name)
                : userId;
            const date = timestampToDate(item.uploaded_at);
            const imageItem = {
                destination: path.join(
                    DESTINATION_DIR,
                    `${date}__${userName}__${fileName}`
                ),
                url: `https://imgproxy.pushd.com/${userId}/${fileName}`,
            };
            return doesFileExist(imageItem.destination).then((res) =>
                res ? null : imageItem
            );
        })
    )
        .then((items) => items.filter((item) => item !== null))
        .then((filteredItems) => {
            console.log(
                `Total images: ${
                    items.length
                }. Images skipped since they already exist: ${
                    items.length - filteredItems.length
                }. Images to download: ${filteredItems.length}`
            );
            return filteredItems;
        });

/**
 * @param {ImageItem} item
 * @param {number} i
 * @param {Array.<ImageItem>} items
 */
export const downloadAndSaveImages = (item, i, items) => {
    const destination = item.destination;
    const progressCounter = `${i + 1}/${items.length}`;

    return fs.promises.stat(destination).catch(() => {
        console.log(`Downloading image ${progressCounter}`);
        return fetch(item.url).then((res) => {
            console.log(`Saving image ${progressCounter}`);
            const fileStream = fs.createWriteStream(destination, {
                flags: 'w',
            });
            return Readable.fromWeb(res.body).pipe(fileStream);
        });
    });
};
