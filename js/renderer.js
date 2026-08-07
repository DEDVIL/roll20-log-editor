/*
================================

Roll20 Archive Renderer

동적 캐릭터 지원

================================
*/


function renderLog(data, preview){


if(!preview)
return;



if(
!data ||
data.length===0
){

preview.innerHTML=
`
<div class="empty">
로그를 입력해주세요.
</div>
`;

return;

}



let html="";



data.forEach(item=>{


html += renderMessage(item);


});



preview.innerHTML =
html;


}





/*
================================

메시지 하나 출력

================================
*/


function renderMessage(item){



    /*
    일반 시스템 메시지

    예:
    주사위 결과
    장소 설명
    핸드아웃

    */


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





    return `


<article

class="message-card"

data-character="${item.speaker}"

>





<div class="character-header">





<img


class="character-image"


src="

${

character.image ||

"images/default-avatar.png"

}

"


onerror="

this.src='images/default-avatar.png'

"


>




<div class="character-meta">



<div

class="character-name"

style="

color:${character.color}

"

>

${item.speaker}

</div>



<div class="character-role">

${character.role}

</div>



</div>


</div>







<div class="message-body">


${

item.html

?

item.html

:

formatRoll20HTML(
item.text
)

}


</div>




</article>


`;



}









/*
================================

Roll20 꾸밈 보존 처리

================================

*/


function formatRoll20HTML(text){


    if(!text)
        return "";



    return text

    // 줄바꿈 유지

    .replace(
        /\n/g,
        "<br>"
    )



    // 점삼육 교정 전 임시 보존

    ;


}









/*
================================

검색

================================

*/


function searchMessages(keyword){


    const cards =
    document.querySelectorAll(
        ".message-card"
    );



    cards.forEach(card=>{


        if(
            card.innerText
            .includes(keyword)
        ){

            card.style.display=
            "";


        }

        else{


            card.style.display=
            "none";


        }


    });


}









/*
================================

캐릭터별 필터

================================

*/


function filterCharacter(name){



    const cards =
    document.querySelectorAll(
        ".message-card"
    );



    cards.forEach(card=>{


        if(
            card.dataset.character
            ===
            name
        ){


            card.style.display="";


        }

        else{


            card.style.display="none";


        }


    });


}
