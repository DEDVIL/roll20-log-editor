/*
 TRPG Log Studio

 Main Controller

 모든 기능 연결
*/



let currentData = [];

let currentStats = {};





/*
========================

DOM 준비

========================
*/


document.addEventListener(
"DOMContentLoaded",
()=>{


    const input =
    document.querySelector(
    "#logInput"
    );


    const preview =
    document.querySelector(
    "#preview"
    );



    const fileInput =
    document.querySelector(
    "#fileInput"
    );





    /*
    붙여넣기 자동 처리

    */


    input.addEventListener(
    "paste",
    ()=>{


        setTimeout(
        parseCurrent,
        100
        );


    });






    /*
    파일 업로드

    */


    if(fileInput){


        fileInput.addEventListener(
        "change",
        loadFile
        );


    }





    /*
    버튼 연결

    */


    bindButtons();


});










/*
========================

버튼 연결

========================
*/


function bindButtons(){



    const buttons = {


        parseBtn:
        parseCurrent,


        cleanBtn:
        cleanCurrent,


        copyBtn:
        copyCurrentHTML,


        backupBtn:
        backupCurrent,


        txtBtn:
        exportCurrentText,


        pdfBtn:
        savePDF,


        deleteBtn:
        deleteSelectedCharacters



    };





    Object.keys(buttons)
    .forEach(id=>{


        const btn =
        document.querySelector(
        "#" + id
        );



        if(btn){

            btn.addEventListener(
            "click",
            buttons[id]
            );

        }


    });





    const search =
    document.querySelector(
    "#searchInput"
    );



    if(search){


        search.addEventListener(
        "input",
        e=>{


            highlightSearch(
            e.target.value
            );


        });


    }



}









/*
========================

로그 파싱

========================
*/


function parseCurrent(){



    const input =
    document.querySelector(
    "#logInput"
    );



    if(!input.value)
        return;



    currentData =
    parseLog(
        input.value
    );



    renderAll();


}










/*
========================

정리 적용

========================
*/


function cleanCurrent(){


    currentData =
    cleanLog(
        currentData
    );



    renderAll();


}










/*
========================

전체 렌더링

========================
*/


function renderAll(){



    const preview =
    document.querySelector(
    "#preview"
    );



    renderLog(
        currentData,
        preview
    );





    currentStats =
    analyzeStats(
        currentData
    );





    renderStatistics();


}









/*
========================

통계 출력

========================
*/


function renderStatistics(){



    const box =
    document.querySelector(
    "#statistics"
    );



    if(box){


        box.innerHTML =
        renderStatsHTML(
            currentStats
        );


    }


}










/*
========================

파일 읽기

========================
*/


function loadFile(event){



    const file =
    event.target.files[0];



    if(!file)
        return;



    const reader =
    new FileReader();



    reader.onload =
    e=>{


        document.querySelector(
        "#logInput"
        )
        .value =
        e.target.result;



        parseCurrent();


    };



    reader.readAsText(
        file,
        "UTF-8"
    );


}









/*
========================

HTML 복사

========================
*/


function copyCurrentHTML(){



    copyHTML(
        currentData
    );


}









/*
========================

백업

========================
*/


function backupCurrent(){



    exportBackup(
        currentData
    );


}









/*
========================

TXT

========================
*/


function exportCurrentText(){


    exportText(
        currentData
    );


}









/*
========================

캐릭터 삭제

========================
*/


function deleteSelectedCharacters(){



    const checked =
    document.querySelectorAll(
    ".character-check:checked"
    );



    const remove =
    Array.from(
        checked
    )
    .map(
        e=>e.value
    );





    currentData =
    currentData.filter(
    item=>{


        if(
            item.type==="dialog"
        ){


            return !
            remove.includes(
                item.speaker
            );


        }


        return true;


    });



    renderAll();


}
