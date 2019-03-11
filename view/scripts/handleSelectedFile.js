function readCSV(data) {
    let obj = $.csv.toObjects(data);
    // TODO: Convert to object using jquery
    // console.log(obj);
    let table_text = '<tr> <thead> <th>Sequence</th> <th>Path</th> <th>Confidence</th> <th>Line numbers</th> </tr> </thead>';
    obj.sort((a, b) => parseFloat(b.Prediction) - parseFloat(a.Prediction));
    for (let item of obj) {

        let new_script_path = "benchmark/" + item.ScriptPath.split("/home/jibesh/jsdataset/")[1];
        // console.log(new_script_path);
        let sequence = item.Sequence;
        let confidence = item.Prediction;
        let lineNumber = item.LineNumbers;
        // let param = [new_script_path, JSON.parse(lineNumber)];
        // readJS(new_script_path);
        let row = '<tr> <td >' + sequence + '</td> <td > \
        <button onclick=setCodeLocation("'+ new_script_path + '")>View file</button> \
        </td> \
        <td >' + confidence + '</td>  <td >' + lineNumber + '</td> </tr>';
        table_text += row;
    }
    var tab = document.getElementById('tab');
    tab.innerHTML = table_text;

}

function setCodeLocation(js_file_path) {

    let pre = document.querySelector('pre');
    var code = document.createElement('code');
    code.className = 'language-js';

    pre.textContent = '';

    code.textContent = 'Loading…';

    pre.appendChild(code);
    // pre.setAttribute("data-line", lineNumber[0] + '-' + lineNumber[len(lineNumber)]);
    fetch(js_file_path)
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            code.textContent = data;
            Prism.highlightElement(code);
            pre.setAttribute('data-src-loaded', '');
        });
}

function triggerOnSelectingCSV(selection) {
    let list_of_files = selection.target.files;
    for (let i = 0, f; f = list_of_files[i]; i++) {

        // document.getElementById('selectedFile').innerHTML = '<h3>' + 'Selected File : ' + f.name + '</h3>';
        let reader = new FileReader();
        reader.onload = event => readCSV(event.target.result);
        reader.readAsText(f);
    }
}



document.getElementById('inputCSV').addEventListener('change', triggerOnSelectingCSV, false);
