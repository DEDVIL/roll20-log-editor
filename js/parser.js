/*
 TRPG Log Studio
 Parser

 입력:
 Roll20 복사 로그

 출력:
 구조화된 로그 배열
*/


function parseLog(text) {


    const lines =
        text.split(/\r?\n/);



    const result = [];



    let i = 0;
let htmlBuffer = [];
let inHTML = false;


    while(i < lines.length) {

if(
    lines[i].includes("<div")
    ||
    lines[i].includes("<table")
    ||
    lines[i].includes("<span")
){

    inHTML = true;

}



if(inHTML){


    htmlBuffer.push(
        lines[i]
    );


    if(
        lines[i].includes("</div>")
        ||
        lines[i].includes("</table>")
    ){


        result.push({

            type:
            "roll-design",

            html:
            htmlBuffer.join("\n")

        });



        htmlBuffer=[];

        inHTML=false;


    }


    i++;

    continue;

}
     
        let line =
            lines[i].trim();



        i++;



        if(!line)
            continue;



        /*
        ======================
        숨김 메시지 제거
        ======================
        */


        if(
            line.includes(
            "This message has been hidden"
            )
        ){

            continue;

        }





        /*
        ======================
        롤꾸 HTML 감지 준비
        ======================

        추후 Roll20 HTML 업로드 때 사용

        */


        if(
            line.startsWith("<")
            &&
            line.includes(">")
        ){


            result.push({

                type:
                "roll-design",

                html:
                line

            });


            continue;

        }






        /*
        ======================
        구분선
        ======================
        */


        if(
            /^[-─━✷☆★]+$/.test(line)
            ||
            line.includes("────")
        ){


            result.push({

                type:
                "divider"

            });


            continue;


        }





        /*
        ======================
        HANDOUT
        ======================
        */


        if(
            line.includes("HANDOUT")
        ){


            let content = [];



            while(
                i < lines.length
                &&
                !lines[i].includes(
                "HANDOUT END")
            ){

                content.push(
                    lines[i]
                );


                i++;

            }



            result.push({

                type:
                "handout",

                text:
                content.join("\n")


            });


            continue;

        }







        /*
        ======================
        주사위 판정
        ======================
        */


        if(
            line.includes("기준치:")
            ||
            line.includes("판정결과:")
        ){


            result.push({

                type:
                "dice",

                text:
                line


            });


            continue;

        }





        /*
        ======================
        화자 감지
        ======================

        예:

        이셴:안녕

        */


        const speakerMatch =
            line.match(
            /^([^:]{1,20}):(.*)$/
            );



        if(
            speakerMatch
        ){


            const speaker =
                speakerMatch[1]
                .trim();



            let text =
                speakerMatch[2]
                .trim();




            /*
            RP 괄호 분리

            위려운:
            (웃음) 안녕

            */

            let action = "";



            const actionMatch =
                text.match(
                /^\((.*?)\)(.*)$/
                );



            if(actionMatch){


                action =
                actionMatch[1]
                .trim();



                text =
                actionMatch[2]
                .trim();


            }



            result.push({

                type:
                "dialog",


                speaker,


                action,


                text


            });



            continue;

        }





        /*
        ======================
        일반 서술
        ======================
        */


        result.push({

            type:
            "narration",

            text:
            line


        });


    }



    return result;


                  }
