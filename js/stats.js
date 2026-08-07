/*
 TRPG Log Studio

 Statistics Module

 로그 분석
*/


/*
================================

전체 통계

================================
*/


function analyzeStats(data){


    const result = {


        totalCharacters: 0,


        totalMessages: 0,


        totalLetters: 0,


        dialogues: 0,


        narrations: 0,


        characters: {}

    };





    data.forEach(item=>{


        /*
        전체 메시지
        */


        result.totalMessages++;





        /*
        글자수 계산

        공백 제외

        */


       const source =
item.text ||
item.html ||
"";


result.totalLetters +=
countLetters(source);






        /*
        서술문

        */


        if(
            item.type === "narration"
        ){

            result.narrations++;

        }





        /*
        대사

        */


        if(
            item.type === "dialog"
        ){


            result.dialogues++;



            const name =
            item.speaker;





           if(
!result.characters[name]
){


const info =
getCharacter(name);



const info =
getCharacter(name);


result.characters[name]={

    name,

    image:
    info.image,

    role:
    info.role,

    color:
    info.color,

    count:0,

    letters:0,

    average:0

};







            const length =
countLetters(
item.text ||
item.html ||
""
);



            result.characters[name]
            .count++;




            result.characters[name]
            .letters += length;



        }



    });






    /*
    평균 계산

    */


    Object.values(
        result.characters
    )
    .forEach(char=>{


        if(char.count){

            char.average =
            Math.floor(
                char.letters /
                char.count
            );

        }


    });





    result.totalCharacters =
    Object.keys(
        result.characters
    ).length;



    return result;


}








/*
================================

글자수 계산

한글/영문/숫자 포함

공백 제외

================================
*/


function countLetters(text){


    if(!text)
        return 0;



    return text
    .replace(
        /\s/g,
        ""
    )
    .length;


}









/*
================================

캐릭터 정렬

많이 말한 순서

================================
*/


function sortCharacters(stats){


    return Object
    .values(
        stats.characters
    )
    .sort(
        (a,b)=>
        b.letters -
        a.letters
    );

}









/*
================================

사이드바 출력용

================================
*/


function renderStatsHTML(stats){


    let html = "";



    html += `

    <div class="stat-box">

    <b>
    전체
    </b>

    <br>

    메시지:
    ${stats.totalMessages}

    <br>

    글자:
    ${stats.totalLetters.toLocaleString()}

    <br>

    캐릭터:
    ${stats.totalCharacters}

    </div>

    `;





    const chars =
    sortCharacters(stats);



    chars.forEach(char=>{


        html += `

        <div class="character-item">


        <div>

        <b>
${escapeHTML(char.name)}
        </b>

        <br>

        ${char.letters.toLocaleString()}
        자

        </div>


        <div>

        ${char.count}
        회

        </div>


        </div>


        `;


    });




    return html;


}


function escapeStatsHTML(text){


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
