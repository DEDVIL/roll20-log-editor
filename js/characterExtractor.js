/*
Roll20 Character Extractor

캐릭터명 + 이미지 자동 추출

=================================
*/


function extractCharactersFromHTML(root){


const result={};





/*
=================================

1. 이미지 기반 추출

=================================
*/


const images =
root.querySelectorAll(
"img"
);



images.forEach(img=>{


const src =
img.src;



if(!src)
return;



/*
캐릭터 후보 영역 찾기

*/


let area =
img.closest(
".message, .chat-message, div"
);



if(!area)
return;



const text =
area.innerText
||
"";



const name =
findCharacterName(
text
);



if(!name)
return;



if(!result[name]){


result[name]={


name:name,


image:src



};


}

else if(
!result[name].image
){


result[name].image =
src;


}



});









/*
=================================

2. 이름: 대사 기반 추출

=================================

*/


const text =
root.innerText
||
"";



const lines =
text.split(
"\n"
);



lines.forEach(line=>{


const match =
line.match(
/^(.+?)\s*:\s*(.*)$/
);



if(!match)
return;



const name =
match[1]
.trim();



if(
!name
)
return;



if(!result[name]){


result[name]={


name:name,


image:""



};



}



});







return Object.values(
result
);



}









/*
=================================

캐릭터 이름 찾기

=================================
*/


function findCharacterName(text){


if(!text)
return null;



const lines =
text.split(
"\n"
);



for(
let line of lines
){


const match =
line.match(
/^(.+?)\s*:\s*/
);



if(match){


return match[1]
.trim();


}


}



return null;



}
