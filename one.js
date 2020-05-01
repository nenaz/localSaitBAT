import { MongoClient } from "mongodb";
import { url } from "./config/db";
import rp from 'request-promise';
import convert  from 'xml-js';
require('dotenv').config();
const fs = require('fs');

const myArgs = process.argv.slice(2);
const kpInfoUrl = process.env.KP_INFO_URL;
const kpRatingUrl = process.env.KP_RATING_URL;
const kpHeaderName = process.env.KP_HEADER_NAME;
const kpHeaderValue = process.env.KP_HEADER_VALUE;
const dbName = process.env.DB_NAME;

MongoClient.connect(url, {
  useUnifiedTopology: true,
}, (err, client) => {
  console.log(err);
  const fileName = myArgs[0];
  const kpId = fileName.match(/\(\d+\)/g)[0].match(/\d+/g)[0];
  const options = {
    uri: `${kpInfoUrl}/api/v2.1/films/${kpId}`,
    headers: {
      [kpHeaderName]: kpHeaderValue
    },
    json: true,
  };

  rp(options)
    .then(function (repos) {
      rp(`${kpRatingUrl}/${kpId}.xml`).then((ratingXML) => {
        const result = JSON.parse(convert.xml2json(ratingXML, {compact: true, spaces: 4}));
        const kp_rating = result.rating.kp_rating._text;
        const imdb_rating = result.rating.imdb_rating._text;
        const dataBase = client.db(dbName);
        dataBase.collection('films').insertOne({
          ...repos.data,
          fileName,
          kp_rating,
          imdb_rating,
        }, (err, result) => {
          if (err) {
            console.log('SUCCESS');
          } else {
            console.log('ERROR', err);
          }
          client.close();
        });
      });
    })
    .catch(function (err) {
      console.log(err);
      client.close();
    });
});
