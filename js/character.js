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

추출 캐릭터 등록

characterExtractor.js 연결

=================================
*/


function registerExtractedCharacters(data){


    if(!data)
        return;



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




        if(!characters[name]){


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

로그 기반 캐릭터 등록

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




            if(!characters[name]){


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

초기화

=================================
*/


function resetCharacters(){


    characters={};


    renderCharacterUI();


}





/*
=================================

캐릭터 UI

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

        isValidImageURL(
            character.image
        )

        ?

        character.image

        :

        "images/default-avatar.png";





        const card =
        document.createElement(
            "div"
        );


        card.className =
        "character-card";



        card.innerHTML = `


        <img

        src="${image}"

        class="character-preview"

        onerror="
        this.src='images/default-avatar.png'
        "

        >



        <div class="character-info">


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

        class="character-image-input"

        value="${escapeAttribute(character.image)}"

        placeholder="Roll20 이미지 링크"

        >

        </label>





        <label>

        역할


        <select class="character-role">


        <option value="PC"
        ${character.role==="PC" ? "selected":""}
        >

        PC

        </option>


        <option value="KPC"
        ${character.role==="KPC" ? "selected":""}
        >

        KPC

        </option>


        <option value="NPC"
        ${character.role==="NPC" ? "selected":""}
        >

        NPC

        </option>


        </select>


        </label>





        <label>

        색상


        <input

        type="color"

        class="character-color"

        value="${character.color}"

        >


        </label>



        </div>


        `;




        const imageInput =
        card.querySelector(
            ".character-image-input"
        );


        imageInput.addEventListener(
            "change",
            ()=>{

                changeCharacterImage(
                    character.name,
                    imageInput.value
                );

            }
        );




        const roleInput =
        card.querySelector(
            ".character-role"
        );


        roleInput.addEventListener(
            "change",
            ()=>{

                changeCharacterRole(
                    character.name,
                    roleInput.value
                );

            }
        );





        const colorInput =
        card.querySelector(
            ".character-color"
        );


        colorInput.addEventListener(
            "change",
            ()=>{

                changeCharacterColor(
                    character.name,
                    colorInput.value
                );

            }
        );




        box.appendChild(card);


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

삭제

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

캐릭터 반환

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

전체 반환

=================================
*/


function getCharacters(){


    return characters;


}






/*
=================================

자동 색상

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

이미지 URL 검사

=================================
*/


function isValidImageURL(url){


    if(!url)
        return false;



    return /^https?:\/\//i.test(url);


}







/*
=================================

HTML Escape

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

Attribute Escape

=================================
*/


function escapeAttribute(text){


    return escapeHTML(
        text || ""
    );


}






/*
=================================

JS Escape

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
