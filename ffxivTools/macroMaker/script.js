let waits = {};
waits["真価"] = " <wait.3>";
waits["倹約"] = " <wait.2>";
waits["長期倹約"] = " <wait.2>";
waits["マスターズメンド"] = " <wait.3>";
waits["マニピュレーション"] = "<wait.2>";
waits["ヴェネレーション"] = " <wait.2>";
waits["イノベーション"] = " <wait.2>";
waits["グレートストライド"] = " <wait.2>";
waits["作業"] = " <wait.3>";
waits["模範作業"] = " <wait.3>";
waits["下地作業"] = " <wait.3>";
waits["倹約作業"] = " <wait.3>";
waits["精密作業"] = "<wait.3>";
waits["ヘイスティタッチ"] = " <wait.3>";
waits["加工"] = " <wait.3>";
waits["中級加工"] = " <wait.3>";
waits["上級加工"] = " <wait.3>";
waits["下地加工"] = " <wait.3>";
waits["匠の早業"] = "<wait.3>";
waits["匠の神業"] = "<wait.3>";
waits["ビエルゴの祝福"] = " <wait.3>";
waits["突貫作業"] = " <wait.3>";
waits["経過観察"] = " <wait.2>";
waits["アート・オブ・エレメンタル"] = " <wait.2>";
waits["ブランド・オブ・エレメンタル"] = " <wait.3>";
waits["最終確認"] = " <wait.2>";
waits["確信"] = " <wait.3>";
waits["注視加工"] = " <wait.3>";
waits["注視作業"] = " <wait.3>";
waits["洗練加工"] = " <wait.3>";
waits["パーフェクトメンド"] = " <wait.3>";
waits["匠の絶技"] = " <wait.3>";
// waits[""] = " <wait.>";

function make(){
    let log = document.getElementById("logs").value;
    let charaName = document.getElementById("name").value;
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
        skills[i] = skills[i].slice(charaName.length + 2, -7);
    }

    let output = [];
    for(let i in skills){
        if(waits[skills[i]] == undefined){
            // document.getElementById("macro").value = "待ち時間が設定されてないスキルが見つかりました！\nwaits配列に追加してください！\n\"" + skills[i] + "\"";
            document.getElementById("macro").value = "名前の入力が間違っているか、対応していないスキルが使用されている可能性があります。\n入力している名前がチャットに表示されている名前と同じかどうかお確かめください。"
            return;
        }
        else{
            output.push("/ac " + skills[i] + waits[skills[i]] + "\n");
        }

        if(skills.length > 15 && i == 13){
            output.push("/e 次！！！！！！！<se.7>");
        }
    }

    output.push("/e 完成！！！！！！<se.8>");


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
        document.getElementById("macroWrapper").innerHTML = 
        '<textarea id="macro" cols="60" rows="42"></textarea>';
        document.getElementById("macro").value = output.join("");
    }
}

function autoNameComplete(){
    let log = document.getElementById("logs").value;
    log = log.split("\n")[0];
    let charaName = log.split("]")[1].slice(1).split("の")[0];
    document.getElementById("name").value = charaName;
}

const textarea = $("#logs");
const placeholderDiv = $("#placeholderDiv");
textarea.on('keyup change', function () {
    // textareaの文字を数える
    let letterLength = textarea.val().length;
    if (letterLength !== 0) {
        placeholderDiv.addClass('none');

        autoNameComplete();
        make();
    } else {
        placeholderDiv.removeClass('none');
    }
});
