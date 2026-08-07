/*
Roll20 Character Extractor

캐릭터명 + 이미지 자동 추출

=================================
*/


function extractCharactersFromHTML(root){


const result = {};





/*
=================================

이미지 기반 추출

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



if(
!result[name]
){


result[name]={


name:name,


image:src


};


}

else{


result[name].image =
src;


}



}



});









/*
=================================

텍스트 기반 추출

이름:

형태

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




if(match){


const name =
match[1]
.trim();





if(
!result[name]
){


result[name]={


name:name,


image:""


};



}



}



});







return result;



}









/*
=================================

캐릭터명 찾기

=================================
*/


function findCharacterName(text){


if(!text)
return null;





const match =
text.match(
/^(.+?)\s*:/
);





if(match){


return match[1]
.trim();


}





return null;



}
