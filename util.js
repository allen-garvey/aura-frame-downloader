import fs from 'fs';

export const jsonHeaders = (opts = {}) => Object.assign({
    Accept: 'application/json',
    'Content-Type': 'application/json',
}, opts);

/**
 * @param {string} fileName
 * @returns {Promise<boolean>}
 */
export const doesFileExist = (fileName) => fs.promises.stat(fileName)
.catch(() => false)
.then(res => res !== false);

/**
 * @param {number} delay
 * @returns {Promise<void>}
 */
const createTimeoutPromise = (delay) => new Promise(resolve => setTimeout(resolve, delay));

// takes array of items and runs a string of promises one after another, one at a time separated by the delay
export const forEachAsyncWithDelay = (items, promiseBuilder, delay=1000) => 
    items.reduce((promise, item, index) => 
        promise.then(() => createTimeoutPromise(delay))
        .then(() => promiseBuilder(item, index, items)), 
Promise.resolve());
