/*
Roll20 Archive Renderer

동적 캐릭터 지원

=================================
*/


function renderLog(data, preview){


if(!preview)
return;



if(
!data ||
data.length===0
){


preview.innerHTML =
`
<div class="empty">
로그를 입력해주세요.
</div>
`;

return;


}



let html="";



data.forEach(item=>{


html +=
renderMessage(item);



});



preview.innerHTML =
html;



}









/*
메시지 하나 출력

=================================
*/


function renderMessage(item){



if(

item.type==="system"

||

!item.speaker

){


return `

<div class="system-message">

${
item.html
?
item.html
:
formatRoll20HTML(item.text)
}

</div>

`;



}






const character =
getCharacter(
item.speaker
);






const image =

character.image
&&
character.image.startsWith("http")

?

character.image

:

"images/default-avatar.png";






return `


<div

class="message-card"

data-character="${item.speaker}"

>





<img

class="character-image"

src="${image}"

onerror="
this.src='images/default-avatar.png'
"

>





<div

class="message-header"

>





<span

class="character-name"

style="color:${character.color}"

>

${escapeRendererHTML(item.speaker)}

</span>





<span

class="character-role"

>

${character.role}

</span>





</div>






<div

class="message-body"

>

${

item.html

?

item.html

:

formatRoll20HTML(item.text)

}



</div>





</div>


`;



}









/*
텍스트 출력

일반 텍스트용

=================================
*/


function formatRoll20HTML(text){


if(!text)
return "";



return escapeRendererHTML(text)

.replace(
/\n/g,
"<br>"
);



}









/*
검색

=================================
*/


function searchMessages(keyword){


keyword =
keyword.trim();



const cards =
document.querySelectorAll(
".message-card"
);



cards.forEach(card=>{


if(
!keyword
||
card.innerText.includes(keyword)
){


card.style.display="";

}

else{


card.style.display="none";


}



});


}









/*
캐릭터 필터

=================================
*/


function filterCharacter(name){


const cards =
document.querySelectorAll(
".message-card"
);



cards.forEach(card=>{


if(
card.dataset.character === name

){


card.style.display="";


}

else{


card.style.display="none";


}



});


}









/*
HTML 보호

=================================
*/


function escapeRendererHTML(text){


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
