/*
=================================

Roll20 Character Extractor

캐릭터명 + 이미지 자동 추출

=================================
*/


function extractCharactersFromHTML(html){


    const result={};



    const container =
    document.createElement("div");


    container.innerHTML =
    html;



    /*
    ================================

    1. 이미지 추출

    ================================
    */


    const images =
    container.querySelectorAll(
        "img"
    );



    images.forEach(img=>{


        const src =
        img.src;



        if(!src)
            return;



        const parentText =
        img.parentElement
        ?.innerText
        ||
        "";



        const name =
        findCharacterName(
            parentText
        );



        if(name){


            if(!result[name])
            {


                result[name]={

                    name:name,

                    image:src

                };


            }


        }



    });







    /*
    ================================

    2. 이름: 대사 분석

    이미지 없는 캐릭터

    ================================
    */


    const text =
    container.innerText;



    const lines =
    text.split("\n");



    lines.forEach(line=>{


        const match =
        line.match(
            /^(.+?)\s*:/
        );



        if(match){


            const name =
            match[1]
            .trim();



            if(
                !result[name]
            ){


                result[name]={

                    name:name,

                    image:""

                };


            }


        }



    });





    return result;


}









/*
=================================

캐릭터 이름 찾기

=================================
*/


function findCharacterName(text){


    if(!text)
        return null;



    const match =
    text.match(
        /(.+?)\s*:/
    );



    if(match)
    {

        return match[1]
        .trim();

    }



    return null;


}









/*
=================================

기존 character.js 연결

=================================
*/


function applyExtractedCharacters(data){



    Object.values(data)
    .forEach(char=>{


        if(
            !characters[char.name]
        ){


            characters[char.name]={

                name:
                char.name,


                image:
                char.image || "",


                role:
                "NPC",


                color:
                createColor()


            };


        }

        else{


            if(
                char.image
            ){

                characters[char.name]
                .image =
                char.image;


            }


        }



    });



    renderCharacterUI();


}
