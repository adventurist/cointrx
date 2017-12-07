let div = document.createElement('div');
/* Using typeof in an EXPRESSION: */
let x = 5;
let y = typeof x; /* y will have the string "number" as value */
div.innerHTML = `y = typeof x = ${y}<br>`;
class moogoo {
    constructor(moo, goo) {
        this.moo = moo;
        this.goo = goo;
    }
}
class boogoo {
    constructor(boo, goo) {
        this.boo = boo;
        this.goo = goo;
    }
}
/* Using typeof in an TYPE QUERY (or... as I like to say, variable declaration): */
let a = new moogoo(9, "nine"); /* a is a moogoo */
let b = typeof a;
let c = a;
/* Note that a is moogoo, but not a boogoo,
 * even though `typeof a` reports "object"
 * c is also a moogoo
 */
div.innerHTML += `typeof 'a' = ${typeof a}<br>
b is ${b}<br>
is 'a' a moogoo?  ${a instanceof moogoo}<br>
is 'a' a boogoo?  ${a instanceof boogoo}<br>
is 'c' a moogoo?  ${c instanceof moogoo}<br>
`;
document.body.appendChild(div);
