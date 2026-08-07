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




sanitizeHTML(
container
);




const characters =
extractCharactersFromHTML(
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



const blocks =
root.querySelectorAll(
".message, .chat-message"
);





blocks.forEach(block=>{


const text =
block.innerText?.trim();



if(!text)
return;




const speaker =
findSpeaker(block);




result.push({


type:
speaker
?
"dialog"
:
"system",



speaker:
speaker,



text:



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

"U"



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
