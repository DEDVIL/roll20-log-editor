/*
 TRPG Log Studio
 Cleaner

 로그 문장 정리 모듈
*/


function cleanText(text) {


    if(!text)
        return "";



    let result = text;



    /*
    =====================
    숨김 메시지 제거
    =====================
    */


    result =
    result.replace(
        /This message has been hidden\./gi,
        ""
    );





    /*
    =====================
    말줄임표 교정
    =====================
    */


    // 긴 점 먼저 처리
    result =
    result.replace(
        /\.{6,}/g,
        "⋯⋯"
    );


    result =
    result.replace(
        /\.{3}/g,
        "⋯"
    );



    /*
    =====================
    중복 점삼육 처리

    ......
    .....

    =====================
    */


    result =
    result.replace(
        /⋯+/g,
        function(match){

            if(match.length >= 3)
                return "⋯⋯";

            return "⋯";

        }
    );





    /*
    =====================
    대시 정리

    --
    ---
    ----

    =====================
    */


    result =
    result.replace(
        /-{2,}/g,
        "─"
    );



    result =
    result.replace(
        /─+/g,
        "────"
    );





    /*
    =====================
    괄호 정리

    ( 웃음 )
    ↓
    (웃음)

    =====================
    */


    result =
    result.replace(
        /\(\s+(.*?)\s+\)/g,
        "($1)"
    );





    /*
    =====================
    공백 정리

    =====================
    */


    result =
    result.replace(
        / {2,}/g,
        " "
    );



    result =
    result.replace(
        /\t/g,
        " "
    );



    return result.trim();

}






/*
================================

전체 로그 정리

================================
*/


function cleanLog(data){


    const cleaned = [];



    const duplicateCheck =
    new Set();




    data.forEach(item=>{


        /*
        숨김 제거
        */


        if(
            item.text
            &&
            item.text.includes(
            "This message has been hidden"
            )
        ){

            return;

        }





        /*
        텍스트 교정
        */


        if(item.text){

            item.text =
            cleanText(item.text);

        }



        if(item.action){

            item.action =
            cleanText(item.action);

        }





        /*
        완전 동일 문장 반복 제거

        로그 두배 오류 방지

        */


        const key =
        JSON.stringify(item);



        if(
            duplicateCheck.has(key)
        ){

            return;

        }


        duplicateCheck.add(key);



        cleaned.push(item);



    });



    return cleaned;


}
