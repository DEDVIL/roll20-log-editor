/*
=================================

Roll20 HTML Parser

롤꾸 보존용

=================================
*/



function parseRoll20HTML(raw){



    const container =
    document.createElement(
        "div"
    );



    container.innerHTML =
    raw;



    sanitizeHTML(
        container
    );



    return container.innerHTML;


}









/*
=================================

허용 태그 정리

=================================

*/


function sanitizeHTML(root){



    const allowed = [


        "DIV",

        "SPAN",

        "P",

        "BR",

        "IMG",

        "STRONG",

        "B",

        "I",

        "EM",

        "U"


    ];





    const all =
    root.querySelectorAll("*");





    all.forEach(el=>{


        if(
            !allowed.includes(
                el.tagName
            )
        ){


            el.replaceWith(
                ...el.childNodes
            );


        }


        else{


            cleanStyle(
                el
            );


        }


    });



}









/*
=================================

스타일 보존

=================================

*/


function cleanStyle(el){



    if(
        !el.style
    )
        return;



    const keep=[


        "color",

        "background",

        "background-color",

        "font-size",

        "font-weight",

        "text-align",

        "border",

        "border-radius",

        "padding",

        "margin"



    ];





    const style =
    el.getAttribute(
        "style"
    );



    if(!style)
        return;





    const result=[];



    style
    .split(";")
    .forEach(rule=>{


        const pair =
        rule.split(":");



        if(
            pair.length!==2
        )
        return;



        const key =
        pair[0]
        .trim();



        const value =
        pair[1]
        .trim();





        if(
            keep.includes(
                key
            )
        ){


            result.push(
                `${key}:${value}`
            );


        }


    });





    if(
        result.length
    ){


        el.setAttribute(

            "style",

            result.join(";")

        );


    }

    else{


        el.removeAttribute(
            "style"
        );


    }



}
