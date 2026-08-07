/*
TRPG Log Studio

Main Controller

모든 기능 연결
*/


let currentData = [];

let currentStats = {};






/*
========================
DOM 준비
========================
*/


document.addEventListener(
"DOMContentLoaded",
()=>{


const input =
document.querySelector(
"#logInput"
);



const fileInput =
document.querySelector(
"#fileInput"
);





/*
붙여넣기 감지

*/


if(input){


input.addEventListener(
"paste",
()=>{


setTimeout(
parseCurrent,
100
);


});


}






/*
파일 입력

*/


if(fileInput){


fileInput.addEventListener(
"change",
loadFile
);


}






bindButtons();


});








/*
========================
버튼 연결
========================
*/


function bindButtons(){



const buttons = {


parseBtn:
parseCurrent,


cleanBtn:
cleanCurrent,


copyBtn:
copyCurrentHTML,


backupBtn:
backupCurrent,


txtBtn:
exportCurrentText,


pdfBtn:
savePDF,


deleteBtn:
deleteSelectedCharacters,


applyTheme:
applyCurrentTheme



};





Object.keys(buttons)

.forEach(id=>{


const btn =
document.querySelector(
"#"+id
);



if(btn){


btn.addEventListener(
"click",
buttons[id]
);


}


});






/*
검색

*/


const search =
document.querySelector(
"#searchInput"
);



if(search){


search.addEventListener(

"input",

e=>{


highlightSearch(
e.target.value
);


}

);


}


}








/*
========================
로그 변환
========================
*/


function parseCurrent(){



const input =
document.querySelector(
"#logInput"
);



if(!input.value)
return;






let raw =
input.value;





/*
HTML 분석

*/


const parsed =
parseRoll20HTML(
raw
);


registerExtractedCharacters(
parsed.characters
);


currentData =
parsed.messages;


renderAll();


}








/*
========================
자동 정리
========================
*/


function cleanCurrent(){


if(typeof cleanLog==="function"){

currentData =
cleanLog(
currentData
);

}



if(typeof formatLog==="function"){

currentData =
formatLog(
currentData
);

}



if(typeof removeDuplicateLogs==="function"){

currentData =
removeDuplicateLogs(
currentData
);

}



renderAll();


}








/*
========================
전체 출력
========================
*/


function renderAll(){



const preview =
document.querySelector(
"#preview"
);





if(preview){


renderLog(

currentData,

preview

);


}







renderCharacters();






currentStats =
analyzeStats(
currentData
);





renderStatistics();



}










/*
========================
캐릭터 출력
========================
*/


function renderCharacters(){

renderCharacterUI();

}









/*
========================
통계
========================
*/


function renderStatistics(){



const box =
document.querySelector(
"#statistics"
);



if(!box)
return;





box.innerHTML =
renderStatsHTML(
currentStats
);



}









/*
========================
파일 읽기
========================
*/


function loadFile(event){



const file =
event.target.files[0];



if(!file)
return;





const reader =
new FileReader();





reader.onload =
e=>{



document.querySelector(
"#logInput"
)

.value =
e.target.result;





parseCurrent();




};





reader.readAsText(
file,
"UTF-8"
);


}









/*
========================
HTML 복사
========================
*/


function copyCurrentHTML(){



copyHTML(
currentData
);


}










/*
========================
JSON 백업
========================
*/


function backupCurrent(){



exportBackup(
currentData
);


}










/*
========================
TXT 저장
========================
*/


function exportCurrentText(){



exportText(
currentData
);


}









/*
========================
캐릭터 삭제
========================
*/


function deleteSelectedCharacters(){



const checked =
document.querySelectorAll(
".character-check:checked"
);





const remove =
Array.from(
checked
)

.map(
item=>item.value
);






currentData =

currentData.filter(
item=>{


if(
item.type==="dialog"
){


return !

remove.includes(
item.speaker
);


}


return true;



});






currentCharacters =

currentCharacters.filter(
character=>

!remove.includes(
character.name
)

);






renderAll();



}









/*
========================
테마 적용
========================
*/


function applyCurrentTheme(){



const theme = {


background:

document.querySelector(
"#bgColor"
).value,



text:

document.querySelector(
"#textColor"
).value,



chat:

document.querySelector(
"#chatColor"
).value


};





applyTheme(
theme
);



}
