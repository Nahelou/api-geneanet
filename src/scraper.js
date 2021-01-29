const fetch = require("node-fetch");
const cheerio = require("cheerio");
const {
  response,
  text
} = require("express");

const openDataWebsites = [{
  id: 7,
  name: "GeneaNet",
  url: "https://en.geneanet.org/fonds/individus/?size=50&sexe=&ignore_each_patronyme=&prenom=&prenom_operateur=or&ignore_each_prenom=&place__0__=&zonegeo__0__=&country__0__=&region__0__=&subregion__0__=&place__1__=&zonegeo__1__=&country__1__=&region__1__=&subregion__1__=&place__2__=&zonegeo__2__=&country__2__=&region__2__=&subregion__2__=&place__3__=&zonegeo__3__=&country__3__=&region__3__=&subregion__3__=&place__4__=&zonegeo__4__=&country__4__=&region__4__=&subregion__4__=&type_periode=between&from=&to=&exact_month=&exact_day=&exact_year=&go=1",
  classSearchParent: ".ligne-resultat",
  classSearchChild: ".xlarge-4",
  title: ".xlarge-5 span",
  year: ".xlarge-2",
  logo: "svg",
  lastPage: ".pagination",
}, ];

function searchForDataset(selected, keyWord) {
  console.log("searching for last name...")

  return fetch(`${selected.url}&nom=${keyWord}`)
    .then(response => response.text())
    .then(body => {
      const $ = cheerio.load(body);
      if (!$(selected.lastPage).children()["6"]) {
        console.error("IP address blocked by Geneanet...");
      }
      return Object.values($(selected.lastPage).children()["6"].children[1])[6][0].data;
    })
  .then(nbPages => {
      let id_scrap = 0;
      let oldest = {
        date: null,
        address: null,
      };

      if (nbPages > 30) {
        nbPages = 30;
      }

      const promesses = [];

      for(let pageIndex = 1; pageIndex <= nbPages; pageIndex++) {

        promesses.push(fetch(`${selected.url}&page=${pageIndex}&nom=${keyWord}`)
          .then(response => response.text())
          .then(body => {
            const datasets = [];
            const $ = cheerio.load(body);

            $(selected.classSearchParent).each((i, el) => {
              const $element = $(el);

              const nameAndYear = $element.find(selected.title);
              const yearSelected = $element.find(selected.year).text();
              const decription = $element.find(selected.classSearchChild).text();


              const isNumeric = /[0-9]* - [0-9]*/g;
              const notNumeric = /\b[A-zÀ-ú]+[^\d\W]+\b/g;
              const allButWhitespace = /[a-zA-Z\u00C0-\u024F]*[0-9]*/g;
              let nameText = nameAndYear.text();
              let dateScrapped = yearSelected.match(isNumeric);
              let address = decription.match(allButWhitespace).reduce((p, c) => {
                return c == '' ? p : p + ' ' + c;
              }, '');
              let date = '';
              let year = '';
              let name = '';
              nameText.match(notNumeric).forEach((e) => {
                if (e.split('').length > 1) {
                  name = name + e + " ";
                }
              });
              if (dateScrapped) {
                date = dateScrapped;
              }
              if (oldest.date == null) {
                if (date[0]) {
                  oldest.date = parseInt(date[0].split(' ')[0]);
                  oldest.address = address;
                }
              } else if (date[0]) {
                if (oldest.date > parseInt(date[0].split(' ')[0]) && parseInt(date[0].split(' ')[0]) > 1000) {
                  oldest.date = parseInt(date[0].split(' ')[0]);
                  oldest.address = address;
                }
              }
              if(date[0]){
                year = parseInt(date[0].split(' ')[0]);
              }
              const dataset = {
                id_scrap: id_scrap,
                name: name,
                date: year[0],
                address: address,
                year: year
              }
              datasets.push(dataset);
              id_scrap = id_scrap + 1;
            });
            return datasets;
          }));
      }
      return Promise.all(promesses).then(datasetArray => [...new Set(datasetArray.flat())]);
    });
}

function numberOfPageToScrap(selected, keyword) {
  fetch(`${selected.url}&nom=${keyWord}`)
    .then(response => response.text())
    .then(body => {
      const $ = cheerio.load(body);
      return Object.values($(selected.lastPage).children()["6"].children[1])[6][0].data;
    });
}

function getSelectedWebSite(id) {
  let selected;
  for (let i of openDataWebsites) {
    if (i.id == id) selected = i;
  }
  return selected;
}

module.exports = {
  searchForDataset,
  getSelectedWebSite,
};
