/*
Roll20 HTML Parser

롤꾸 보존 + 데이터 추출

=================================
*/


function parseRoll20HTML(raw){


const container =
document.createElement(
"div"
);


container.innerHTML =
raw;



/*
캐릭터 먼저 추출

*/


const characters =
extractCharactersFromHTML(
container
);




/*
보안 정리

*/


sanitizeHTML(
container
);




const messages =
extractMessages(
container
);



return {


characters,

messages,


html:
container.innerHTML



};


}








/*
메시지 추출

=================================
*/


function extractMessages(root){


const result=[];


const used=new Set();



const blocks =
root.querySelectorAll(
".message, .chat-message"
);



blocks.forEach(block=>{


const key =
block.innerHTML;



if(
used.has(key)
)
return;



used.add(key);




const speaker =
findSpeaker(block);



let text =
block.innerText?.trim();



if(!text)
return;



if(speaker){


text =
text
.replace(
speaker,
""
)
.trim();


}




result.push({


type:

speaker
?
"dialog"
:
"system",


speaker,


text,


html:
block.innerHTML



});



});



return result;



}








/*
작성자 찾기

=================================
*/


function findSpeaker(block){


const name =
block.querySelector(
".name, .sender, .player"
);



if(name){

return name.innerText.trim();

}



return "";

}








/*
허용 태그 정리

=================================
*/


function sanitizeHTML(root){


const allowed=[


"DIV",
"SPAN",
"P",
"BR",
"IMG",

"STRONG",
"B",
"I",
"EM",
"U",

"TABLE",
"TBODY",
"THEAD",
"TR",
"TD",

"HR",

"BLOCKQUOTE"


];



const all =
root.querySelectorAll("*");



all.forEach(el=>{


if(
!allowed.includes(
el.tagName
)

){


el.replaceWith(
...el.childNodes
);



}

else{


cleanStyle(
el
);



}



if(
el.tagName==="IMG"
){


const src =
el.getAttribute(
"src"
);



if(
!src
||
src.startsWith(
"javascript:"
)

){


el.remove();


}


}



});



}








/*
스타일 보존

=================================
*/


function cleanStyle(el){


const keep=[


"color",

"background",

"background-color",

"font-size",

"font-weight",

"text-align",

"border",

"border-radius",

"padding",

"margin"



];



const style =
el.getAttribute(
"style"
);



if(!style)
return;



const result=[];



style
.split(";")
.forEach(rule=>{


const pair =
rule.split(":");



if(
pair.length!==2
)
return;



const key =
pair[0]
.trim();



const value =
pair[1]
.trim();



if(
keep.includes(key)
){


result.push(
`${key}:${value}`
);


}



});



if(result.length){


el.setAttribute(

"style",

result.join(";")

);


}
else{


el.removeAttribute(
"style"
);


}



}
