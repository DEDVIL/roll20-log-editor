/*
TRPG Log Studio

Exporter Module

HTML / PDF / Backup 출력

=================================
*/



/*
=================================

티스토리용 HTML 생성

=================================
*/


function createTistoryHTML(data){


let html = `

<style>

${tistoryCSS}

</style>

<div class="trpg-log">

`;





data.forEach(item=>{


html +=
convertItemToHTML(item);



});




html += `

</div>

`;





return html;



}









/*
=================================

개별 데이터 변환

=================================
*/


function convertItemToHTML(item){



let html="";





switch(item.type){



case "dialog":



const character =
getCharacter(
item.speaker
);





html += `

<div class="trpg-message"

style="border-left-color:${character.color}"

>



<div class="trpg-speaker"

style="color:${character.color}"

>

${escapeExport(item.speaker)}

</div>



<div class="trpg-text">

${

item.html

?

item.html

:

escapeExport(item.text)

}

</div>



</div>

`;



break;







case "narration":


html += `

<div class="trpg-narration">

${

item.html

?

item.html

:

escapeExport(item.text)

}

</div>

`;

break;







case "handout":


html += `

<div class="trpg-handout">

${escapeExport(item.text)}

</div>

`;

break;







case "dice":


html += `

<div class="trpg-dice">

✷ 판정 ✷

<br>

${escapeExport(item.text)}

</div>

`;

break;







case "roll-design":



html += `

<div class="trpg-roll">

${item.html}

</div>

`;

break;







case "divider":


html += `

<hr>

`;

break;



}



return html;



}









/*
=================================

HTML 복사

=================================
*/


function copyHTML(data){


const html =
createTistoryHTML(data);



navigator.clipboard
.writeText(html)
.then(()=>{


alert(
"티스토리 HTML 복사 완료"
);


});



}









/*
=================================

JSON 백업

=================================
*/


function exportBackup(data){



const json =
JSON.stringify(

data,

null,

2

);




downloadFile(

json,

"trpg-log-backup.json",

"application/json"

);



}









/*
=================================

TXT 저장

=================================
*/


function exportText(data){



let text="";





data.forEach(item=>{



if(
item.type==="dialog"
){



text +=

`${item.speaker}:${item.text}\n\n`;



}


else if(
item.text
){



text +=

item.text

+

"\n\n";



}



});





downloadFile(

text,

"trpg-log.txt",

"text/plain"

);



}









/*
=================================

다운로드

=================================
*/


function downloadFile(
content,
filename,
type
){



const blob =
new Blob(

[content],

{
type
}

);




const url =
URL.createObjectURL(blob);




const a =
document.createElement(
"a"
);



a.href=url;

a.download=filename;



a.click();



URL.revokeObjectURL(url);



}









/*
=================================

PDF

=================================

*/


function savePDF(){


window.print();


}









/*
=================================

HTML 문자 보호

=================================
*/


function escapeExport(text){


if(!text)
return "";



return String(text)

.replace(
/&/g,
"&amp;"
)

.replace(
/</g,
"&lt;"
)

.replace(
/>/g,
"&gt;"
);

}









const tistoryCSS = `


.trpg-message{


padding:20px;

margin:15px 0;

background:#fff;

border-radius:15px;

border-left:5px solid;


}



.trpg-speaker{


font-weight:bold;

margin-bottom:8px;


}



.trpg-text{


line-height:1.7;


}



.trpg-handout{


padding:30px;

background:#fffaf0;

border-radius:20px;


}



.trpg-roll{


margin:20px 0;


}


`;
