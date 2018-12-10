const http = require('http');
const cheerio = require('cheerio');
const request = require('request');
var tshirts = [];
var noTshirts;

// Find or create data folder for csv file

/**
 * Check for 'data' folder
 * If folder exists
  * Begin creation of the t-shirt CSV file
 * If folder does not exist
  * Create 'data' folder
  * Begin creation of the t-shirt CSV file
 */
var fs = require("fs");
if (fs.existsSync("./data")) {
  createTshirtCSV();
} else {
  fs.mkdir("./data", function() {
    createTshirtCSV();
  });
}

/** Scrape content from site using module */

/**
 * Accesses the page which shows all the available t-shirts on the site
 * If connection to page successful
  * Accesses the page for each individual t-shirt
  * Builds array of tshirt JSON objects
 * If connection to page unsuccessful
  * Log error message
  * Write error message to file
 */
function createTshirtCSV() {
  request('http://shirts4mike.com/shirts.php', function(err, resp, html) {
    if (!err) {
      const $ = cheerio.load(html);
      $('.products li a').each(function (index, element) {
        var link = 'http://shirts4mike.com/' + $(element).attr('href');
        getTshirtInfo(link);
      });
    } else {
      var message = "There’s been a 404 error. Cannot connect to http://shirts4mike.com.";
      console.log(message);
      logError(message);
    }
  });
}

/*
 * Extract information about t-shirt (title, price, image URL) from its page
 * Convert extracted info + page URL + time of file creation into JSON object
 * Add JSON object to JSON array of tshirts
 * If all tshirts have had their information extracted
 * Create CSV file containing all tshirt information
 * @param {string} link - The link to a page for a specific t-shirt
 */
function getTshirtInfo(link) {
  request(link, function(err, resp, html) {
    if (!err) {
      const $ = cheerio.load(html);
      var title = $('.breadcrumb').text();
      title = title.substring(9, title.length);
      var price = $('.price').text();
      var imageURL = 'http://shirts4mike.com/' +
                      $('.shirt-picture span img').attr('src');
      var time = new Date().toString();
      var tshirt = {"Title": title,
                    "Price": price,
                    "ImageURL": imageURL,
                    "URL": link,
                    "Time": time};
      tshirts.push(tshirt);
      var date = new Date();
      var year = date.getFullYear();
      var month = (date.getMonth() + 1).toString();
      if (month.length == 1) {
        month = '0' + month;
      }
      var day = date.getDate().toString();
      if (day.length == 1) {
        day = '0' + day;
      }
      var fileName = year + "-" + month + "-" + day + ".csv";
      createCSV(fileName, tshirts);
    }
  });
}

/** Create CSV from JSON array */

const json2csvParser = require('json2csv').Parser;
const fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time'];
const jsonParse = new json2csvParser({ fields });

/* Save info into CSV named after date of creation
 * If the file is not saved
  * Write the error to file
 * @param {string} fileName - The name of the file that will be written
 * @param {string} item - JSON object that will be parsed
 */
function createCSV(fileName, item) {
  var filePath = "./data/" + fileName;
  var csv = jsonParse.parse(item);
  fs.writeFileSync(filePath, csv, (err) => {
    if (err) {
      logError("There's been an error, the file was not saved.");
    }
  });
}

/** Log any errors to file */

/** Builds string consisting of timestamp and error message
 * Writes the string to a file called scraper-error.log
 * If scraper-error.log already exists
  * Error message is appended to bottom of file
 * Else
  * New scraper-error.log file is created with the error message
 * @param {string} message - The error message that will be written to a file
 */
function logError(message) {
  var date = new Date();
  var fileText = "[" + date.toString() + "] " + message + '\r\n';
  var filePath = "scraper-error.log";
  if (fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, fileText, (err) => {
      if (err) throw err;
    });
  } else {
    fs.writeFile(filePath, fileText, (err) => {
      if (err) throw err;
    });
  }
}
