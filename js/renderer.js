/*
 TRPG Log Studio

 Renderer Module

 로그 데이터를 화면으로 출력
*/


// 캐릭터 색상 저장

const characterColors = {};



const colorPalette = [

    "#6C7AE0",
    "#E57373",
    "#81C784",
    "#FFB74D",
    "#BA68C8",
    "#4DB6AC",
    "#7986CB",
    "#F06292"

];



let colorIndex = 0;





/*
========================

캐릭터 색상

========================
*/


function getCharacterColor(name){


    if(
        !characterColors[name]
    ){

        characterColors[name] =
        colorPalette[
            colorIndex %
            colorPalette.length
        ];

        colorIndex++;

    }


    return characterColors[name];

}







/*
========================

전체 렌더링

========================
*/


function renderLog(data, target){


    if(!target)
        return;



    target.innerHTML="";



    data.forEach(item=>{


        const element =
        createMessageElement(item);



        target.appendChild(element);


    });


}








/*
========================

메시지 생성

========================
*/


function createMessageElement(item){


    const wrapper =
    document.createElement("div");



    wrapper.className =
    "message";





    /*
    대사

    */


    if(
        item.type === "dialog"
    ){



        const color =
        getCharacterColor(
            item.speaker
        );



        wrapper.innerHTML = `

        <div class="speaker"
        style="
        color:${color}
        ">

        ${escapeHTML(item.speaker)}

        </div>


        ${
            item.action
            ?
            `
            <div class="action">
            (${escapeHTML(item.action)})
            </div>
            `
            :
            ""
        }


        <div class="dialog-text">

        ${formatText(item.text)}

        </div>


        `;


    }






    /*
    서술

    */


    else if(
        item.type === "narration"
    ){


        wrapper.className =
        "message narration";


        wrapper.innerHTML =

        formatText(item.text);


    }








    /*
    핸드아웃

    */


    else if(
        item.type === "handout"
    ){


        wrapper.className =
        "handout";


        wrapper.innerHTML = `


        <div class="handout-title">

        ·· HANDOUT ··

        </div>


        <div>

        ${formatText(item.text)}

        </div>


        `;


    }







    /*
    주사위

    */


    else if(
        item.type === "dice"
    ){


        wrapper.className =
        "dice-card";


        wrapper.innerHTML = `


        <div>
        ✷ 판정 ✷
        </div>


        <div class="dice-result">

        ${formatText(item.text)}

        </div>


        `;


    }







    /*
    롤꾸 HTML

    */


    else if(
        item.type === "roll-design"
    ){


        wrapper.className =
        "roll-design";


        wrapper.innerHTML =
        item.html;


    }







    /*
    구분선

    */


    else if(
        item.type === "divider"
    ){


        wrapper.innerHTML = `

        <hr>

        `;


    }



    return wrapper;


}










/*
========================

검색용 강조

========================
*/


function highlightSearch(
    keyword
){


    if(!keyword)
        return;



    const container =
    document.querySelector(
    "#preview"
    );



    const textNodes =
    getTextNodes(container);



    textNodes.forEach(node=>{


        const text =
        node.nodeValue;



        if(
            text.includes(keyword)
        ){


            const span =
            document.createElement(
            "span"
            );


            span.className =
            "highlight";


            span.innerHTML =
            text.replace(
                new RegExp(
                keyword,
                "gi"
                ),
                `<mark>$&</mark>`
            );


            node.parentNode.replaceChild(
                span,
                node
            );

        }


    });


}









/*
========================

HTML 보호

========================
*/


function escapeHTML(text){


    if(!text)
        return "";



    return text
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








/*
========================

줄바꿈 처리

========================
*/


function formatText(text){


    if(!text)
        return "";



    return escapeHTML(text)
    .replace(
        /\n/g,
        "<br>"
    );


}








/*
========================

텍스트 노드 찾기

========================
*/


function getTextNodes(element){


    const nodes=[];



    const walker =
    document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT
    );



    let node;



    while(
        node = walker.nextNode()
    ){

        nodes.push(node);

    }



    return nodes;

}
