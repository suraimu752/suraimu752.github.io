let waits = {};
waits["真価"] = " <wait.3>";
waits["倹約"] = " <wait.2>";
waits["長期倹約"] = " <wait.2>";
waits["マスターズメンド"] = " <wait.3>";
waits["ヴェネレーション"] = " <wait.2>";
waits["イノベーション"] = " <wait.2>";
waits["作業"] = " <wait.3>";
waits["模範作業"] = " <wait.3>";
waits["下地作業"] = " <wait.3>";
waits["倹約作業"] = " <wait.3>";
waits["ヘイスティタッチ"] = " <wait.3>";
waits["加工"] = " <wait.3>";
waits["中級加工"] = " <wait.3>";
waits["上級加工"] = " <wait.3>";
waits["下地加工"] = " <wait.3>";
waits["ビエルゴの祝福"] = " <wait.3>";
waits["グレートストライド"] = " <wait.2>";
// waits[""] = " <wait.>";

let charaName = "Natsu Slime";

function make(){
    let log = document.getElementById("logs").value;
    let logs = log.split("\n");

    for(let i in logs){
        logs[i] = logs[i].split("]")[1].substr(1);
    }

    skills = [];
    for(let i in logs){
        if(logs[i].startsWith(charaName)){
            skills.push(logs[i]);
        }
    }

    for(let i in skills){
        console.log(skills[i]);
        skills[i] = skills[i].slice(charaName.length + 2, -7);
    }

    let output = [];
    for(let i in skills){
        if(waits[skills[i]] == undefined){
            output = "待ち時間が設定されてないスキルが見つかりました\nwaits配列に追加してください\n" + skills[i];
            break;
        }
        else{
            output.push("/ac " + skills[i] + waits[skills[i]] + "\n");
        }

        if(skills.length > 15 && i == 13){
            output.push("/e 次！！！！！！！<se.7>");
        }
    }

    output.push("/e 完成！！！！！！<se.8>");

    console.log(output);

    if(skills.length > 15){
        document.getElementById("macroWrapper").innerHTML = 
        '<textarea id="macro1" cols="60" rows="' + 15 + '">' +
        '</textarea>' +
        '<textarea id="macro2" cols="60" rows="' + (output.length - 15).toString() + '">' +
        '</textarea>';
        document.getElementById("macro1").innerHTML = output.slice(0, 15).join("");
        document.getElementById("macro2").innerHTML = output.slice(15).join("");
    }
    else{
        document.getElementById("macro").value = output.join("");
    }
}

const textarea = $("#logs");
const placeholderDiv = $("#placeholderDiv");
textarea.on('keyup change', function () {
    // textareaの文字を数える
    let letterLength = textarea.val().length;
    if (letterLength !== 0) {
        placeholderDiv.addClass('none');
    } else {
        placeholderDiv.removeClass('none');
    }
});
