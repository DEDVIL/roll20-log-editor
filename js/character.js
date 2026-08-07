/*
TRPG Log Studio

Character Manager

동적 캐릭터 관리 시스템

기능:

- 로그 기반 자동 생성
- 캐릭터 이미지 관리
- PC/KPC/NPC 구분
- 캐릭터별 색상 관리
- 렌더링 데이터 제공

=================================
*/


let characters = {};







/*
=================================

추출된 캐릭터 등록

characterExtractor.js 연결용

=================================
*/


function registerExtractedCharacters(data){



if(!data)
return;





/*
객체 반환 대응

{
 이름:{
  name,
  image
 }
}

*/


if(!Array.isArray(data)){


data =
Object.values(data);


}






data.forEach(char=>{


if(
!char ||
!char.name
)
return;





const name =
char.name.trim();






if(
!characters[name]
){



characters[name]={


name:name,


image:
char.image || "",


role:
"NPC",


color:
createColor()



};



}

else{


if(char.image){


characters[name].image =
char.image;


}



}



});





renderCharacterUI();



}









/*
=================================

메시지 기반 캐릭터 등록

백업 데이터 호환

=================================
*/


function registerCharacters(data){



if(!Array.isArray(data))
return;





data.forEach(item=>{



if(
item.type==="dialog"
&&
item.speaker
){



const name =
item.speaker.trim();





if(
!characters[name]
){


characters[name]={


name:name,


image:"",


role:"NPC",


color:
createColor()



};



}



}



});





renderCharacterUI();



}









/*
=================================

새 로그 시작

=================================
*/


function resetCharacters(){



characters={};



renderCharacterUI();



}









/*
=================================

캐릭터 UI 출력

=================================
*/


function renderCharacterUI(){



const box =
document.querySelector(
"#characters"
);



if(!box)
return;





box.innerHTML="";





Object.values(characters)

.forEach(character=>{



const image =

character.image &&
character.image.startsWith("http")

?

character.image

:

"images/default-avatar.png";





box.innerHTML += `


<div class="character-card">



<img

src="${image}"

class="character-preview"

onerror="this.src='images/default-avatar.png'"

>



<div class="character-name">

${escapeHTML(character.name)}

</div>




<label>

선택

<input

type="checkbox"

class="character-check"

value="${escapeAttribute(character.name)}"

>

</label>





<label>

이미지 URL

<input

type="text"

value="${escapeAttribute(character.image)}"

placeholder="Roll20 이미지 링크"

onchange="

changeCharacterImage(

'${escapeQuote(character.name)}',

this.value

)

"

>

</label>





<label>

역할


<select

onchange="

changeCharacterRole(

'${escapeQuote(character.name)}',

this.value

)

"

>


<option value="PC"

${

character.role==="PC"

?

"selected"

:

""

}

>

PC

</option>



<option value="KPC"

${

character.role==="KPC"

?

"selected"

:

""

}

>

KPC

</option>




<option value="NPC"

${

character.role==="NPC"

?

"selected"

:

""

}

>

NPC

</option>



</select>

</label>







<label>

색상


<input

type="color"

value="${character.color}"

onchange="

changeCharacterColor(

'${escapeQuote(character.name)}',

this.value

)

"

>


</label>



</div>



`;



});



}









/*
=================================

이미지 변경

=================================
*/


function changeCharacterImage(
name,
url
){



if(!characters[name])
return;





characters[name].image =
url.trim();





renderCharacterUI();



}









/*
=================================

역할 변경

=================================
*/


function changeCharacterRole(
name,
role
){



if(!characters[name])
return;





characters[name].role =
role;



}









/*
=================================

색상 변경

=================================
*/


function changeCharacterColor(
name,
color
){



if(!characters[name])
return;





characters[name].color =
color;



}









/*
=================================

캐릭터 삭제

app.js 연결용

=================================
*/


function removeCharacters(names){



if(!Array.isArray(names))
return;





names.forEach(name=>{


delete characters[name];


});





renderCharacterUI();



}









/*
=================================

특정 캐릭터 반환

renderer.js / stats.js 사용

=================================
*/


function getCharacter(name){



return (

characters[name]

||

{


name:name,


image:"",


role:"NPC",


color:"#999999"


}

);



}









/*
=================================

전체 캐릭터 반환

=================================
*/


function getCharacters(){



return characters;



}









/*
=================================

색상 자동 생성

=================================
*/


function createColor(){



const colors=[


"#6C7AE0",

"#E57373",

"#81C784",

"#FFB74D",

"#BA68C8",

"#4DB6AC"


];





return colors[

Object.keys(characters).length

%

colors.length

];



}









/*
=================================

HTML 보호

=================================
*/


function escapeHTML(text){



return String(text || "")


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









/*
=================================

HTML 속성 보호

=================================
*/


function escapeAttribute(text){


return escapeHTML(
text || ""
);



}









/*
=================================

JS 문자열 보호

=================================
*/


function escapeQuote(text){



return String(text || "")

.replace(
/\\/g,
"\\\\"
)

.replace(
/'/g,
"\\'"
);



}
