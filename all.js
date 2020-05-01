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

MongoClient.connect(url, {
  useUnifiedTopology: true,
}, (err, client) => {
  console.log(err);
  fs.readdir(testFolder, (err, files) => {
    files.map(fileName => {
      if ((regMp4.test(fileName) || regMkv.test(fileName)) && (/\(\d+\)/g).test(fileName)) {
        console.log('fileName', fileName);
        const kpId = fileName.match(/\(\d+\)/g)[0].match(/\d+/g)[0];
        const options = {
          uri: `${kpInfoUrl}/api/v2.1/films/${kpId}?append_to_response=RATING,EXTERNAL_ID`,
          headers: {
            [kpHeaderName]: kpHeaderValue
          },
          json: true,
        };
        rp(options).then((repos) => {
          const dataBase = client.db(dbName);
          dataBase.collection('films').insertOne({
            ...repos.data,
            fileName,
            kp_rating: repos.rating.rating,
            imdb_rating: repos.rating.ratingImdb,
          }, (err, result) => {
            console.log('add');
            if (err) {
              console.log('SUCCESS');
            } else {
              console.log('ERROR', err);
            }
            // client.close();
          });
        })
        .catch(function (err) {
          console.log(err);
          client.close();
        });
      }
    });
  });
  // client.close();
});
