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



let result=text;





/*
숨김 메시지 제거

*/


result =
result.replace(
/This message (has been hidden|is hidden)\.?/gi,
""
);






/*
점삼육 교정

*/


result =
result.replace(
/\.{3,}/g,
match=>{


if(
match.length>=6
)

return "⋯⋯";



return "⋯";


}

);






/*
이미 변환된 말줄임 정리

*/


result =
result.replace(
/⋯{3,}/g,
"⋯⋯"
);







/*
대시 정리

*/


result =
result.replace(
/-{2,}/g,
"─"
);



result =
result.replace(
/─{5,}/g,
"────"
);









/*
괄호 공백 제거

*/


result =
result.replace(
/\(\s+(.*?)\s+\)/g,
"($1)"
);








/*
공백 정리

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



const cleaned=[];



let previousKey="";





data.forEach(item=>{





/*
숨김 메시지 제거

*/


if(

(item.text &&
/This message (has been hidden|is hidden)/i.test(item.text))

||

(item.html &&
/This message (has been hidden|is hidden)/i.test(item.html))

){

return;

}







const newItem={

...item

};








/*
텍스트 정리

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
연속 중복 제거

*/


const key =


(newItem.speaker || "")

+

"|"

+

(newItem.text || "");





if(
key === previousKey
){

return;

}





previousKey=key;





cleaned.push(
newItem
);




});





return cleaned;



}
