// simple code
/*let   Name =  "qadir";
let   Experience = 2;
console.log(Name);
console.log(Experience);

*/

// 1.Scope- Accessible area - (functiomnal scope- var),(block scope let and const)
//Var and let Reassignment is allowed 
//const - Reassignment is not allowed (only constant is allowed can not change the value)

// ex-1 var ,can reaasign value
/*var age =25
    age=30
console.log(age);

*/
// ex-2 let can re assign value

/*let studentname="qadir"
    studentname='hasan'
console.log(studentname);

*/
//hoisting-- console the value without defining the element- not allowed will give undefined in case of var
/*
console.log(a)
var a = 10
console.log(a);
*/


//same in case of let it will give error can not access a before initialization
/*
console.log(a)
let a = 10
console.log(a);
*/

// functional scope - var keyword
function VarScope(){
    if(true){
         var msg = "hello world"
         
    }
   
console.log(msg);
}
VarScope();
   // console.log(msg);

//block scope
/*
if (condition){

}
*/

