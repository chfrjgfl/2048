
var calc = function (expression) {

//simple calculator. string input not checked, may contain ()+-*/    

    function calculate(m, a, b) {
    switch (m) {                        
      case "*": return (+a)*(+b);
      case "/": return (+a)/(+b);
      case "+": return (+a)+(+b);
      case "-": return (+a)-(+b);
      }
    }

    let regPar = /\(([-+*/\d\.\s]+)\)/;
    let regMulDiv = /(-?\d+(\.\d+)?)\s*([*/])\s*(-?\d+(\.\d+)?)/g;
    let regSubAdd = /(-?\d+(\.\d+)?)\s*([-+])\s*(-?\d+(\.\d+)?)/g; 
    let exp = expression;
  
    while (/\(/.test(exp)) {
      exp = exp.replace(regPar, (match,p1)=>calc(p1));  //resolve (nested) parentheses
      exp = exp.replace(/([-+*/])\s*\-{2}/g, '$1');     //remove '--'
     }
  
    while (/[*/]/.test(exp)) {              //calc * /
      exp = exp.replace(regMulDiv, (match,p1,p2,p3,p4)=>calculate(p3, p1, p4));
    }
  
    while (/.[-+]/.test(exp)) {             // calc + -
      exp = exp.replace(regSubAdd, (match,p1,p2,p3,p4)=>calculate(p3, p1, p4));
    }

  return +exp;
  
  };
  