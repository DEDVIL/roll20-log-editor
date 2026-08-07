/*
TRPG Log Studio

Chat Parser

=================================
*/


function parseLog(raw){


    if(!raw)
        return [];




    /*
    HTML 로그
    */


    if(
        /<[^>]+>/.test(raw)
    ){


        const parsed =
        parseRoll20HTML(raw);



        if(
            parsed &&
            parsed.messages
        ){

            return parsed.messages;

        }


    }







    /*
    일반 텍스트 로그
    */


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
            !line
        )
            return;





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


                speaker,


                text,


                html:""


            };



            result.push(
                current
            );


        }

        else{


            if(current){


                current.text +=
                "\n"
                +
                line;


            }

            else{


                result.push({

                    type:"system",

                    speaker:"",

                    text:line,

                    html:""

                });


            }


        }


    });





    return result;



}








/*
HTML → 텍스트

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
입력 정리

HTML 보호 때문에
최소 처리

=================================
*/


function normalizeInput(text){


    return text

    .replace(
        /\r/g,
        ""
    )


    .replace(
        /\n{3,}/g,
        "\n\n"
    );


}








/*
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
