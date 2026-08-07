/*
TRPG Log Studio

Chat Parser

=================================
*/


function parseLog(raw){


if(!raw)
return {

characters:[],
messages:[]
};






/*
HTML 로그 감지

*/


if(
/<[^>]+>/.test(raw)
){


const parsed =
parseRoll20HTML(raw);



if(parsed){


return {

characters:
parsed.characters || [],


messages:
parsed.messages || [],


html:
parsed.html || ""


};


}



}








/*
일반 텍스트 로그

*/


raw =
normalizeInput(raw);




const lines =
raw.split(/\r?\n/);




const result=[];


let current=null;





lines.forEach(line=>{


line =
line.trim();



if(!line)
return;






/*
이름: 대사

*/


const match =
line.match(
/^(.+?)\s*:\s*(.*)$/
);






if(match){



const speaker =
cleanName(
match[1]
);



const text =
match[2];




current={


type:"dialog",


speaker,


text,


html:""


};




result.push(
current
);



}



else{



/*
이전 대사 이어쓰기

*/


if(current){


current.text +=
"\n"
+
line;


}

else{


result.push({

type:"system",

speaker:"",

text:line,

html:""

});


}


}



});







return {


characters:extractCharactersFromMessages(result),


messages:result,


html:""


};



}









/*
HTML → 텍스트

=================================
*/


function convertHTMLToText(html){


const temp =
document.createElement(
"div"
);



temp.innerHTML =
html;



return temp.innerText;



}









/*
입력 정리

=================================
*/


function normalizeInput(text){


return text

.replace(
/\r/g,
""
)


.replace(
/\n{3,}/g,
"\n\n"
);



}









/*
캐릭터명 정리

=================================
*/


function cleanName(name){


return name

.replace(
/\s+/g,
" "
)

.trim();



}









/*
텍스트 로그 캐릭터 추출

=================================
*/


function extractCharactersFromMessages(data){



const chars={};



data.forEach(item=>{


if(

item.type==="dialog"

&&

item.speaker

){



if(!chars[item.speaker]){


chars[item.speaker]={


name:item.speaker,


image:""



};



}



}



});




return Object.values(chars);



}
