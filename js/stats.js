/*
TRPG Log Studio

Statistics Module

로그 분석

=================================
*/





function analyzeStats(data){



const result={


totalCharacters:0,


totalMessages:0,


totalLetters:0,


dialogues:0,


narrations:0,


characters:{}


};





data.forEach(item=>{





result.totalMessages++;





const source =
extractText(item);



result.totalLetters +=
countLetters(source);







if(

item.type==="narration"

||

item.type==="system"

){


result.narrations++;


}







if(

item.type==="dialog"

&&

item.speaker

){



result.dialogues++;



const name =
item.speaker.trim();





if(
!result.characters[name]
){


const info =
getCharacter(name);



result.characters[name]={


name,


image:
info.image,


role:
info.role,


color:
info.color,


count:0,


letters:0,


average:0



};



}







const length =
countLetters(
source
);




result.characters[name].count++;


result.characters[name].letters +=
length;





}



});








Object.values(
result.characters
)
.forEach(char=>{



if(
char.count
){


char.average =
Math.floor(

char.letters /

char.count

);


}



});







result.totalCharacters =
Object.keys(
result.characters
).length;





return result;



}









/*
HTML / TEXT 변환

=================================
*/


function extractText(item){



if(item.text)

return item.text;





if(item.html){


return convertHTMLToText(
item.html
);


}



return "";



}









/*
글자수 계산

공백 제외

=================================
*/


function countLetters(text){



if(!text)
return 0;



return String(text)

.replace(
/\s/g,
""
)

.length;



}









/*
캐릭터 정렬

=================================
*/


function sortCharacters(stats){


return Object.values(
stats.characters
)

.sort(

(a,b)=>

b.letters -

a.letters

);



}









/*
통계 UI

=================================
*/


function renderStatsHTML(stats){



let html="";



html += `


<div class="stat-box">


<b>
전체
</b>


<br>


메시지:
${stats.totalMessages}


<br>


글자:
${stats.totalLetters.toLocaleString()}


<br>


캐릭터:
${stats.totalCharacters}


</div>


`;






const chars =
sortCharacters(stats);





chars.forEach(char=>{



html += `


<div class="character-item">


<img

src="${

char.image ||

"images/default-avatar.png"

}"

class="stat-character-image"

>



<div>


<b>

${escapeStatsHTML(char.name)}

</b>


<br>


${char.letters.toLocaleString()}
자


<br>


평균:
${char.average.toLocaleString()}
자


</div>



<div>


${char.count}
회


</div>



</div>


`;



});





return html;



}









/*
HTML 보호

=================================
*/


function escapeStatsHTML(text){


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
)


.replace(
/"/g,
"&quot;"
)


.replace(
/'/g,
"&#039;"
);



}
