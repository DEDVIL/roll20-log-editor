/*
TRPG Log Studio

Cleaner

로그 문장 정리 모듈

=================================
*/



/*
=================================

텍스트 정리

=================================
*/


function cleanText(text){


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
        /This message (has been hidden|is hidden)\.?/gi,
        ""
    );





    /*
    =====================
    점삼육 교정

    ...
    ......
    ........
    
    =====================
    */


    result =
    result.replace(
        /\.{3,}/g,
        "⋯"
    );



    result =
    result.replace(
        /⋯{2,}/g,
        "⋯⋯"
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
=================================

전체 로그 정리

=================================
*/


function cleanLog(data){



    const cleaned = [];



    const duplicateCheck =
    new Set();







    data.forEach(item=>{



        /*
        =====================
        숨김 메시지 제거

        =====================
        */


        if(
            item.text
            &&
            /This message (has been hidden|is hidden)/i
            .test(item.text)
        ){

            return;

        }



        if(
            item.html
            &&
            /This message (has been hidden|is hidden)/i
            .test(item.html)
        ){

            return;

        }







        /*
        =====================
        원본 보호

        =====================
        */


        const newItem =
        {
            ...item
        };







        /*
        =====================
        텍스트 정리

        =====================
        */


        if(newItem.text){


            newItem.text =
            cleanText(
                newItem.text
            );


        }





        if(newItem.action){


            newItem.action =
            cleanText(
                newItem.action
            );


        }







        /*
        =====================
        HTML 내부 텍스트 정리

        =====================
        */


        if(newItem.html){


            newItem.html =
            cleanText(
                newItem.html
            );


        }








        /*
        =====================
        로그 두배 오류 제거

        같은 캐릭터의 같은 대사 제거

        =====================
        */


        const key =

        (
            newItem.speaker
            ||
            ""
        )

        +

        "|"

        +

        (
            newItem.text
            ||
            ""
        );





        if(
            duplicateCheck.has(key)
        ){

            return;

        }





        duplicateCheck.add(key);






        cleaned.push(
            newItem
        );





    });






    return cleaned;



}
