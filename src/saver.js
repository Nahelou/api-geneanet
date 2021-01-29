const fs = require('fs');


function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }


function writeGeojsonFile(dataToSave){
    let date = getRandomInt(1000000);
    const name = date + "-geneanetScrapped.json";
    let dataToSaveStringify = JSON.stringify(dataToSave, null, 2);
    // fs.writeFile(name, dataToSaveStringify, (err) => {
    //     if (err) throw err;
    //     console.log('Data written to file');
    // });
    console.log('Geojson Saved');

}

module.exports = {
    writeGeojsonFile,
  };
