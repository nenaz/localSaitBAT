require("@babel/register")({
  presets: ["@babel/preset-env"]
});

var myArgs = process.argv.slice(2);
console.log('myArgs', myArgs);

// Import the rest of our application.
module.exports = require('./one.js')