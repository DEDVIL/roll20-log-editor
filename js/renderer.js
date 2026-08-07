/*
TRPG Log Studio

Renderer Module

Roll20 Archive UI Renderer

=================================
*/


/*
로그 전체 출력
=================================
*/

function renderLog(data, preview){


    if(!preview)
        return;



    if(
        !Array.isArray(data)
        ||
        data.length===0
    ){

        preview.innerHTML = `
            <div class="empty-state">
                로그를 입력해주세요.
            </div>
        `;

        return;

    }



    let html = "";



    data.forEach(item=>{


        html +=
        renderMessage(item);


    });



    preview.innerHTML = html;



}





/*
메시지 하나 출력

=================================
*/


function renderMessage(item){



    /*
    시스템 메시지

    주사위
    설명문
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
                formatRoll20HTML(
                    item.text
                )
            }


        </div>

        `;


    }





    const character =
    getCharacter(
        item.speaker
    );




    const image =

    isRendererImage(
        character.image
    )

    ?

    character.image

    :

    "images/default-avatar.png";





    return `


<div

class="message-card"

data-character="${escapeRendererHTML(item.speaker)}"

style="border-left-color:${character.color}"

>



    <div class="message-avatar">


        <img

        class="character-image"

        src="${image}"

        onerror="
        this.src='images/default-avatar.png'
        "

        >


    </div>





    <div class="message-content">



        <div class="message-header">


            <span

            class="character-name"

            style="
            color:${character.color}
            "

            >

            ${escapeRendererHTML(
                item.speaker
            )}

            </span>





            <span

            class="character-role"

            >

            ${escapeRendererHTML(
                character.role
            )}

            </span>



        </div>





        <div class="message-body">


            ${
                item.html
                ?
                sanitizeRenderHTML(
                    item.html
                )
                :
                formatRoll20HTML(
                    item.text
                )
            }


        </div>



    </div>




</div>


`;



}





/*
일반 텍스트 출력

=================================
*/


function formatRoll20HTML(text){


    if(!text)
        return "";



    return escapeRendererHTML(
        text
    )
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
            card.innerText.includes(
                keyword
            )
        ){


            card.style.display =
            "";


        }

        else{


            card.style.display =
            "none";


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





/*
이미지 검사

=================================
*/


function isRendererImage(url){


    if(!url)
        return false;



    return /^https?:\/\//i.test(url);


}






/*
Roll20 HTML 최소 보호

htmlParser에서 이미 한번 처리하지만

렌더링 단계에서도 보호

=================================
*/


function sanitizeRenderHTML(html){


    if(!html)
        return "";



    const temp =
    document.createElement(
        "div"
    );


    temp.innerHTML =
    html;




    const banned = [

        "SCRIPT",

        "IFRAME",

        "OBJECT",

        "STYLE"

    ];




    temp.querySelectorAll("*")
    .forEach(el=>{


        if(
            banned.includes(
                el.tagName
            )
        ){

            el.remove();


        }


    });



    return temp.innerHTML;



}







/*
HTML Escape

=================================
*/


function escapeRendererHTML(text){



    return String(
        text || ""
    )

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
