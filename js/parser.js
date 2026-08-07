/*
=================================

Roll20 Chat Parser

=================================
*/


function parseLog(raw){


    if(!raw)
        return [];



    /*
    HTML 로그 감지

    */

 let originalHTML=null;


if(
 /<[^>]+>/.test(raw)
){


 originalHTML =
 parseRoll20HTML(raw);


}





    raw =
    normalizeInput(raw);





    const lines =
    raw.split(/\r?\n/);




    const result=[];



    let current=null;





    lines.forEach(line=>{


        line =
        line.trim();



        if(
            line.length===0
        )
        {

            return;

        }





        /*
        캐릭터 대사 판별

        이름:
        형태

        */


        const match =
        line.match(
            /^(.+?)\s*:\s*(.*)$/
        );





        if(match){


            const speaker =
            cleanName(
                match[1]
            );



            const text =
            match[2];



            current={


                type:"dialog",


                speaker:speaker,


                text:text

html:
originalHTML

            };



            result.push(
                current
            );



        }

        else{


            /*
            이전 대사 이어쓰기

            */


            if(
                current
            ){


                current.text +=
                "\n"
                +
                line;


            }


            else{


                result.push({

                    type:"system",

                    speaker:"",

                    text:line

                });


            }



        }




    });





    return result;


}









/*
=================================

HTML → 텍스트 변환

=================================

*/


function convertHTMLToText(html){


    const temp =
    document.createElement(
        "div"
    );



    temp.innerHTML =
    html;



    return temp.innerText;



}









/*
=================================

입력 정리

=================================

*/


function normalizeInput(text){



    return text

    // 윈도우 개행 통일

    .replace(
        /\r/g,
        ""
    )


    // Roll20 숨김 메시지 제거

    .replace(

        /This message has been hidden\./gi,

        ""

    )


    // 빈 줄 정리

    .replace(

        /\n{3,}/g,

        "\n\n"

    );


}









/*
=================================

캐릭터명 정리

=================================

*/


function cleanName(name){



    return name

    .replace(
        /\s+/g,
        " "
    )

    .trim();



}
