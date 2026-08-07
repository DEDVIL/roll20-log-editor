/*
Roll20 Character Extractor

캐릭터명 + 이미지 자동 추출
=================================
*/


function extractCharactersFromHTML(html){


const result={};



const container =
document.createElement(
"div"
);


container.innerHTML =
html;




/*
이미지 기반 추출

*/


const images =
container.querySelectorAll(
"img"
);



images.forEach(img=>{


const src =
img.src;



if(!src)
return;




const parentText =
img.parentElement
?.innerText
||
"";



const name =
findCharacterName(
parentText
);



if(name){


result[name]={

name,

image:src

};


}



});







/*
텍스트 기반 추출

*/


const lines =
container.innerText
.split("\n");



lines.forEach(line=>{


const match =
line.match(
/^(.+?)\s*:/
);



if(match){


const name =
match[1]
.trim();



if(!result[name]){


result[name]={

name,

image:""

};


}



}



});





return Object.values(
result
);


}







function findCharacterName(text){



if(!text)
return null;



const match =
text.match(
/^(.+?)\s*:/
);



if(match)

return match[1]
.trim();




return null;


}
