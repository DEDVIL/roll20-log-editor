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


    let html = "";



    switch(item.type){



        /*
        =========================

        캐릭터 대사

        =========================
        */


        case "dialog":



            const character =
            getCharacter(
                item.speaker
            );



            html += `

<div class="trpg-message"

style="
border-left-color:${character.color};
">


<div class="trpg-speaker"

style="
color:${character.color};
">

${escapeExport(
    item.speaker
)}


${

character.role

?

`
<span class="trpg-role">
${escapeExport(character.role)}
</span>
`

:

""

}


</div>



<div class="trpg-body">


${

item.html

?

item.html

:

escapeExport(
    item.text
)
.replace(
    /\n/g,
    "<br>"
)

}


</div>



</div>

`;



        break;







        /*
        =========================

        서술

        =========================
        */


        case "narration":



            html += `

<div class="trpg-narration">


${

item.html

?

item.html

:

escapeExport(
    item.text
)
.replace(
    /\n/g,
    "<br>"
)

}


</div>

`;



        break;







        /*
        =========================

        핸드아웃

        =========================
        */


        case "handout":



            html += `

<div class="trpg-handout">


${escapeExport(
    item.text
)}


</div>

`;



        break;







        /*
        =========================

        주사위

        =========================
        */


        case "dice":



            html += `

<div class="trpg-roll">


✷ 판정 ✷


<br>


${escapeExport(
    item.text
)}


</div>

`;



        break;







        /*
        =========================

        롤꾸 원본

        =========================
        */


        case "roll-design":



            html += `

<div class="trpg-roll-design">


${

item.html || ""

}


</div>

`;



        break;







        /*
        =========================

        구분선

        =========================
        */


        case "divider":



            html += `

<hr class="trpg-divider">


`;



        break;



        default:



            if(item.html){


                html += item.html;


            }

            else if(item.text){


                html += `

<div>

${escapeExport(
    item.text
)}

</div>

`;


            }



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


    let text = "";



    data.forEach(item=>{


        if(
            item.type==="dialog"
        ){


            text +=

`${item.speaker}:${item.text || ""}

`;


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

파일 다운로드

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
    URL.createObjectURL(
        blob
    );



    const a =
    document.createElement(
        "a"
    );



    a.href =
    url;



    a.download =
    filename;



    document.body.appendChild(a);



    a.click();



    document.body.removeChild(a);



    URL.revokeObjectURL(
        url
    );


}








/*
=================================

PDF 출력

브라우저 인쇄 사용

=================================
*/


function savePDF(){


    window.print();


}








/*
=================================

HTML 보호

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

티스토리용 CSS

=================================
*/


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



.trpg-role{

font-size:12px;

opacity:0.7;

}



.trpg-body{

line-height:1.7;

}



.trpg-narration{

margin:15px 0;

line-height:1.8;

}



.trpg-handout{

padding:30px;

background:#fffaf0;

border-radius:20px;

}



.trpg-roll{

padding:15px;

border-radius:12px;

background:#f5f5f5;

}



.trpg-divider{

margin:20px 0;

}


`;
