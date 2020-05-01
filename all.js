import { MongoClient } from "mongodb";
import { url } from "./config/db";
import rp from 'request-promise';
const fs = require('fs');
import convert  from 'xml-js';
require('dotenv').config();

// const testFolder = process.env.ROOT_FILMS_FOLDER;
const testFolder = 'C:/Users/mr444/Downloads/';
const kpInfoUrl = process.env.KP_INFO_URL;
const kpRatingUrl = process.env.KP_RATING_URL;
const kpHeaderName = process.env.KP_HEADER_NAME;
const kpHeaderValue = process.env.KP_HEADER_VALUE;
const dbName = process.env.DB_NAME;
const extMp4 = process.env.FILM_EXT_MP4;
const extMkv = process.env.FILM_EXT_MKV;

const regMp4 = new RegExp(`\\${extMp4}`, 'g');
const regMkv = new RegExp(`\\${extMkv}`, 'g');

function throttle(callback, delay) {
  let isWaiting = false;
  return function() {
    if (!isWaiting) {
      callback.apply(this, arguments);
      isWaiting = true;
      setTimeout(() => {
        isWaiting = false;
      }, delay);
    }
  }
}

function Queue() {
  let collection = []

  this.print = function() {
      console.log(collection)
  }

  this.enqueue = function(element) {
      collection.push(element)
  }

  this.dequeue = function() {
      return collection.shift()
  }

  this.front = function() {
      return collection[0]
  }

  this.isEmpty = function() {
      return collection.length === 0
  }

  this.size = function() {
    return collection.length
  }
}
// const fileName = 'Грань будущего(505851).mkv';
// const kpId = fileName.match(/\(\d+\)/g)[0].match(/\d+/g)[0];
// const options = {
//   uri: `${kpRatingUrl}/${kpId}.xml`,
//   // headers: {
//   //   [kpHeaderName]: kpHeaderValue
//   // },
//   json: true,
// };
const array = [326,435,448,329,535341,447301,389];
const testQueue = new Queue();
array.map((item) => {
  const kpId = item;
  const options = {
    uri: `${kpRatingUrl}/${kpId}.xml`,
    // headers: {
    //   [kpHeaderName]: kpHeaderValue
    // },
    json: true,
  };
  const promise = new Promise((resolve, reject) => {
    rp(options).then((response) => {
      resolve(response);
    });
  })
  testQueue.enqueue(promise);
  return false;
});

console.log(testQueue.size());

// MongoClient.connect(url, {
//   useUnifiedTopology: true,
// }, (err, client) => {
//   console.log(err);
//   fs.readdir(testFolder, (err, files) => {
//     files.map(fileName => {
//       if ((regMp4.test(fileName) || regMkv.test(fileName)) && (/\(\d+\)/g).test(fileName)) {
//         console.log('fileName', fileName);
//         const kpId = fileName.match(/\(\d+\)/g)[0].match(/\d+/g)[0];
//         const options = {
//           uri: `${kpInfoUrl}/api/v2.1/films/${kpId}?append_to_response=RATING,EXTERNAL_ID`,
//           headers: {
//             [kpHeaderName]: kpHeaderValue
//           },
//           json: true,
//         };
//         rp(options).then((repos) => {
//           const dataBase = client.db(dbName);
//           dataBase.collection('films').insertOne({
//             ...repos.data,
//             fileName,
//             kp_rating: repos.rating.rating,
//             imdb_rating: repos.rating.ratingImdb,
//           }, (err, result) => {
//             console.log('add');
//             if (err) {
//               console.log('SUCCESS');
//             } else {
//               console.log('ERROR', err);
//             }
//             // client.close();
//           });
//         })
//         .catch(function (err) {
//           console.log(err);
//           client.close();
//         });
//       }
//     });
//   });
//   // client.close();
// });

const intervalId = setInterval(() => {
  const request = testQueue.front();
  request.then((response) => {
    console.log('response', response);
  });
  testQueue.dequeue();
  if (testQueue.isEmpty()) {
    clearInterval(intervalId);
  }
}, 150);
