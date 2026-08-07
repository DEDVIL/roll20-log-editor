/*
 TRPG Log Studio

 Exporter Module

 HTML / PDF / Backup 출력
*/





/*
========================

티스토리용 HTML 생성

========================
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
========================

개별 데이터 변환

========================
*/


function convertItemToHTML(item){


    let html = "";





    switch(item.type){



        case "dialog":


            html += `

<div class="trpg-message">


<div class="trpg-speaker">

${escapeExport(item.speaker)}

</div>


${

item.action

?

`

<div class="trpg-action">

(${escapeExport(item.action)})

</div>

`

:

""

}



<div class="trpg-text">

${escapeExport(item.text)}

</div>


</div>


`;

            break;







        case "narration":


            html += `


<div class="trpg-narration">

${escapeExport(item.text)}

</div>


`;

            break;









        case "handout":


            html += `


<div class="trpg-handout">


<h3>

·· HANDOUT ··

</h3>


<div>

${escapeExport(item.text)}

</div>


</div>


`;

            break;








        case "dice":


            html += `


<div class="trpg-dice">


<b>

✷ 판정 ✷

</b>


<p>

${escapeExport(item.text)}

</p>


</div>


`;

            break;








        case "roll-design":


            /*
            롤꾸 HTML은
            그대로 유지

            */

            html += `


<div class="trpg-roll-design">

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
========================

클립보드 복사

========================
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
========================

백업 저장

========================
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
========================

TXT 저장

========================
*/


function exportText(data){


    let text = "";



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
========================

다운로드 함수

========================
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
    document.createElement("a");



    a.href=url;

    a.download=filename;



    a.click();



    URL.revokeObjectURL(url);


}









/*
========================

PDF

브라우저 인쇄 사용

========================
*/


function savePDF(){


    window.print();


}








/*
========================

HTML 특수문자 보호

========================
*/


function escapeExport(text){


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


 const tistoryCSS = `

.trpg-message{

padding:20px;

margin:15px 0;

background:#fff;

border-radius:15px;

border-left:5px solid #7b8cff;

}


.trpg-speaker{

font-weight:bold;

}


.trpg-handout{

padding:30px;

background:#fffaf0;

border-radius:20px;

}


`;
