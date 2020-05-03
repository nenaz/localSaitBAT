import { MongoClient } from "mongodb";
import { url } from "./config/db";
import rp from 'request-promise';
const fs = require('fs');
import request from 'request';
// import convert  from 'xml-js';
require('dotenv').config();

const testFolder = process.env.ROOT_FILMS_FOLDER;
const imageFolder = process.env.ROOT_IMAGE_FOLDER;
// const testFolder = 'C:/Users/mr444/Downloads/';
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

function responseToDB(dataBase, data) {
  const { fileName, response } = data;
  dataBase.collection('films').insertOne({
    ...response.data,
    fileName,
    kp_rating: response.rating.rating,
    imdb_rating: response.rating.ratingImdb,
  }, (err, result) => {
    console.log('add');
    if (err) {
      console.log('SUCCESS');
    } else {
      console.log('ERROR', err);
    }
  });
};

function requestsDB() {
  MongoClient.connect(url, {
    useUnifiedTopology: true,
  }, (err, client) => {
    console.log(err);
    const dataBase = client.db(dbName);

    const requesInterval = 200;
    const intervalId = setInterval(() => {
      const element = currentQueue.front();
      const{ options, fileName } = element;
      rp(options).then((response) => {
        console.log('response', response);
        const { data } = response;
        const { posterUrl, filmId } = data;
        download(
          // `https://st.kp.yandex.net/images/film_big/${kpId}.jpg`,
          posterUrl,
          `${imageFolder}${filmId}.webp`,
          () => {});
        responseToDB(dataBase, {
          response,
          fileName,
        });
      });
      currentQueue.dequeue();
      if (currentQueue.isEmpty()) {
        clearInterval(intervalId);
        client.close();
      }
    }, requesInterval);
  });
};

function download(uri, filename, callback) {
  request.head(uri, (err, res, body) => {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

const currentQueue = new Queue();
fs.readdir(testFolder, (err, files) => {
  const currentFiles = files.filter((fileName) => {
    return (regMp4.test(fileName) || regMkv.test(fileName)) && (/\(\d+\)/g).test(fileName);
  });
  currentFiles.map((file) => {
    const kpId = file.match(/\(\d+\)/g)[0].match(/\d+/g)[0];
    const options = {
      uri: `${kpInfoUrl}/api/v2.1/films/${kpId}?append_to_response=RATING,EXTERNAL_ID`,
      // uri: `${kpRatingUrl}/${kpId}.xml`,
      headers: {
        [kpHeaderName]: kpHeaderValue
      },
      json: true,
    };
    currentQueue.enqueue({
      options,
      fileName: file,
    });
    return false;
  });
  currentQueue.print();

  requestsDB();
});
