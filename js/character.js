/*
 TRPG Log Studio

 Character Manager

 동적 캐릭터 관리 시스템

 - 캐릭터 고정 없음
 - 로그마다 자동 생성
 - 이미지 URL 지원
 - PC/KPC/NPC 구분
 - 색상 지정
*/


let characters = {};





/*
=================================

캐릭터 초기화

새 로그 입력 시 호출

=================================
*/


function registerCharacters(data){


    const names =
    new Set();



    data.forEach(item=>{


        if(
            item.type === "dialog"
            &&
            item.speaker
        ){


            names.add(
                item.speaker.trim()
            );


        }


    });





    names.forEach(name=>{


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


    });



    renderCharacterUI();


}









/*
=================================

캐릭터 목록 초기화

새 세션 시작용

=================================
*/


function resetCharacters(){


    characters={};


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


        box.innerHTML += `


<div class="character-card">


<div class="character-preview-box">


<img

src="
${

character.image ||

"images/default-avatar.png"

}

"

class="character-preview"

onerror="
this.src='images/default-avatar.png'
"

>


</div>





<div class="character-info">


<h4>

${character.name}

</h4>




<label>

이미지 URL

</label>



<input

type="text"

placeholder="Roll20 이미지 링크"

value="

${character.image}

"

onchange="

changeCharacterImage(

'${escapeQuote(character.name)}',

this.value

)

"

>





<label>

역할

</label>



<select

onchange="

changeCharacterRole(

'${escapeQuote(character.name)}',

this.value

)

"

>


<option

${character.role==="PC"?"selected":""}

>

PC

</option>


<option

${character.role==="KPC"?"selected":""}

>

KPC

</option>


<option

${character.role==="NPC"?"selected":""}

>

NPC

</option>


</select>






<label>

색상

</label>



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




</div>


</div>



`;



    });


}









/*
=================================

이미지 URL 변경

=================================
*/


function changeCharacterImage(
name,
url
){


    if(
        characters[name]
    ){


        characters[name].image =
        url.trim();



    }


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


    if(
        characters[name]
    ){


        characters[name].role =
        role;


    }


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


    if(
        characters[name]
    ){


        characters[name].color =
        color;


    }


}









/*
=================================

renderer.js용 데이터 반환

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

현재 캐릭터 목록

통계/삭제용

=================================
*/


function getCharacters(){


    return characters;


}









/*
=================================

색상 생성

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

HTML 속성 보호

=================================
*/


function escapeQuote(text){


    return text
    .replace(
        /'/g,
        "\\'"
    );


}
