const fs = require("fs");
const xlsx = require('node-xlsx');
const path = require("path");
const {google} = require('googleapis');
const sheets = google.sheets('v4');

const rates = xlsx.parse(`${__dirname}/price.csv`);
const uahToEur = +rates[0].data[1][0].split(",")[2].replace(/\"/g, "");
const uahToUsd = +rates[0].data[2][0].split(",")[2].replace(/\"/g, "");

let manufacturers = [  {brand:"Audison", id:"3"}, 
                        {brand:"Hertz", id:"4"},
                        {brand:"Focal", id:"1"},
                        {brand:"Alpine", id:"22"},
                        {brand:"Pandora", id:"17"},
                        {brand:"Pandect", id:"36"},
                    ];
let manID = manufacturers.map((item)=>item.id);  
let manBr = manufacturers.map((item)=>item.brand);                 

let prods = [];             // products in base
let prices = [];            // products in lists

getData("products.csv", null,
        prods, 
        (d)=>(manID.includes(d[10])), 
        () => {return true}, 
        (d,prod) => {
            prod.brand = manufacturers.find((item)=>(item.id==d[10])).brand;       
            prod.model = d[1];             
        }, 
        5);

getData("1.xls", null,
        prices, 
        (d)=>(typeof d[5]=="number"), 
        (s) => (manBr.includes(s)), 
        (d,prod) => {
            let s = d[1].replace(/^\s*/, "").split(" ");
            prod.brand = s[0]; 
            prod.model = s.slice(1).join(" ");             
        }, 
        5);
    
getData("11.xlsx", null,
        prices, 
        (d)=>(typeof d[9]=="number"), 
        (s) => (manBr.includes(s)), 
        (d,prod) => {
            prod.brand = d[3].slice(0, 1) + d[3].slice(1).toLowerCase();
            prod.model = d[4];             
        }, 
        9);

getPanda().then(()=>finish());              // async parsing google sheet

function finish() {
let data = [];

for (let j=0; j<prices.length; j++) {      //every 'unchecked' item in list...

    for (let i=0; i<prods.length; i++) {      // ...compare to every 'unchecked' product...
        if (!prods[i].checked&&prods[i].brand==prices[j].brand) {       //...of same brand
                if (alike(prices[j].model, prods[i].model)) {
                prods[i].checked = true;
                prices[j].checked = true;    
                prods[i].price = calcPrice(prices[j]);   
                data.push([prods[i].brand, prods[i].model, prods[i].price]);                            
            }
        }  
        if (prices[j].checked) i = prods.length;    //if found, skip rest products         
    }     
}

var buffer = xlsx.build([{name: 'mySheetName', data: data}]);
fs.writeFileSync(`${__dirname}/2.xls`, buffer);

//----- products found in lists, not found in base
data = [];
for (let j=0; j<prices.length; j++) {
    if (!prices[j].checked) {
        data.push([prices[i].brand, prices[i].model, prices[i].price]);
    }
}
var buffer = xlsx.build([{name: 'mySheetName', data: data}]);
fs.writeFileSync(`${__dirname}/2notinbase.xls`, buffer);

//----- products found in base, not found in lists
data = [];
for (let j=0; j<prods.length; j++) {
    if (!prods[j].checked) {
        data.push([prods[i].brand, prods[i].model, prods[i].price]);
    }
}
var buffer = xlsx.build([{name: 'mySheetName', data: data}]);
fs.writeFileSync(`${__dirname}/2notinlists.xls`, buffer);

}

function alike(s1, s2) {
    let a1 = [];
    let a2 = [];
   
    if (s2.length > s1.length) return alike(s2, s1);    // longer first
    
    a1 = s1.replace(".", " ").split(" ").filter((s)=>s!="Prima");
    a2 = s2.replace(".", " ").split(" ").filter((s)=>s!="Prima");

    for (let a of a2) {
        if (!a1.includes(a)) return false;
    }
    return (!a1.includes("D")||a2.includes("D"));

        //   func resolves cases like:
       //  APK 130 Kit 2-Way System <-> Prima APK 130    true
        //  ECX 100.5 2-Way coaxial <-> ECX 100         true
        // HCP 1D <-> HCP 1Dk                           false
      //  Bit Ten D Signal interface processor <-> Bit Ten     false
      // Bit Ten D Signal interface processor <-> Bit Ten D    true
}

function calcPrice(prod) {          // will add more rules
    switch (prod.brand) {
        case 'Focal':        
        case 'Alpine':  
        return Math.round(prod.price/uahToUsd);

        case 'Audison':        
        case 'Hertz':  
        return Math.round(prod.price*uahToEur/10)*10;

        case 'Pandora':        
        case 'Pandect':  
        return prod.price;
    }    
}

function getData(fromFile, fromArray,           // source - file or array
                toArray,               // output array of objects {brand, model, price, checked}
                condition1, condition2,   //  rows selectors
                getBrandModel,          // parsing brand & model
                 iPrice) {              // index of cell w/price

    if (fromFile) fromArray = xlsx.parse(`${__dirname}/${fromFile}`)[0].data;
    for (let d of fromArray) {
        if(condition1(d)) {
            let prod = {};
            getBrandModel(d,prod);
            if(condition2(prod.brand)) {
                prod.price = +d[iPrice];
                toArray.push(prod);
            }
        }
    }
}

async function getPanda () {
    const request = {
             // The ID of the spreadsheet to retrieve data from.
             spreadsheetId: '------',  
             // The A1 notation of the values to retrieve.
             range: 'B10:D50',  
             key: '+++++++++++',
           };
    
    try {       
        const response = (await sheets.spreadsheets.values.get(request)).data;
        
        getData(null, response.values,
            prices, 
            (d)=>(typeof +d[2]=="number"), 
            (s) => (manBr.includes(s)), 
            (d,prod) => {
                let s = d[0].split(" ");
                prod.brand = s[0]; 
                prod.model = s.slice(1).join(" ");             
            }, 
            2);
     
    } catch (err) {
        console.error(err);
        }
    }
