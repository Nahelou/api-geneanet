const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const scraper = require('./scraper');
const geocoder = require('./geocoding');
const saver = require('./saver');

require('dotenv').config();

const middlewares = require('./middlewares');
const api = require('./api');

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json({
  limit: '25mb',
}));

app.get('/search/:id', (req, res) => {
  scraper
    .searchForDataset(scraper.getSelectedWebSite(req.params.id))
    .then(datasets => {
      res.json(datasets)
    });
});

app.get('/search/:id/:keyWord', async (req, res) => {
  await scraper
    .searchForDataset(scraper.getSelectedWebSite(req.params.id), req.params.keyWord)
    .then(datasets => {
      let minDate;
      let maxDate;
      console.log("Sucessfully scrapped");
      for(let data of datasets){
        if(data.year && data.year != ''){
          if(!minDate){
            minDate = maxDate = data.year;
          }
          else if(data.year < minDate){
            minDate = data.year;
          }
          else if(data.year > maxDate){
            maxDate = data.year
          }
        }
      }
      const dataSetToReturn = {};
      dataSetToReturn.data = datasets;
      dataSetToReturn.minYear = minDate;
      dataSetToReturn.maxYear = maxDate;

      res.json(dataSetToReturn);

    });
});

app.post('/', async (req, res, next) => {
  try {
    console.log("POST data to geocoding");
    geocoder.geocodeAddress(req.body)
      .then(d => {
        console.log("Success on geocoding data !");
        res.json(d);
      })
  } catch (error) {
    console.log("ERROR on geocoding : " + error);
  }
});

app.post('/save/', async (req, res, next) => {
  try {
    console.log("POST data to save");
    saver.writeGeojsonFile(req.body);
  } catch (error) {
    console.log("ERROR on saving geojson : " + error);
  }
});

app.use('/api/v1', api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
