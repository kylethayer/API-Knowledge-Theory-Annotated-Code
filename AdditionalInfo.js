/*global $ currentTaskNum*/


function checkStatus(response) {  
    if (response.status >= 200 && response.status < 300) {  
        return response.text();
    } else {  
        return Promise.reject(new Error(response.status+": "+response.statusText)); 
    } 
}

function clearAnnotations(participantInfo, participantId) {
    let taskOrderNum = -1;
    if(participantInfo["First"] == currentTaskNum){
        taskOrderNum = 1;        
    } else  if(participantInfo["Second"] == currentTaskNum){
        taskOrderNum = 2;        
    } else if(participantInfo["Third"] == currentTaskNum){
        taskOrderNum = 3;        
    } else if(participantInfo["Fourth"] == currentTaskNum){
        taskOrderNum = 4;        
    }
    
    let taskHeader = document.createElement("span");
    taskHeader.innerHTML = "Task - " + taskOrderNum + "  &nbsp; id=" + participantId;
    taskHeader.classList.add("taskHeader");
    document.getElementsByTagName("header")[0].append(taskHeader);
    
    let numInfo = participantInfo["TaskInfo" + currentTaskNum];
    let infoToRemove = ["a", "b", "c"]; // a is Concepts, b is Templates, c is Facts
    for(let i = 1; i <= numInfo; i++){
        let info = participantInfo["Info" + i];
        infoToRemove.splice(infoToRemove.indexOf(info), 1);
    }
    
    for(let i = 0; i < infoToRemove.length; i++){
        let info = infoToRemove[i];
        let infoClassString = "";
        if(info == "a") {
            infoClassString = "concept";
        }
        if(info == "b") {
            infoClassString = "template";
        }
        
        if(info == "c") {
            infoClassString = "fact";
        }
        
        //remove annotations    
        let annotations = document.querySelectorAll(".annotation");
        for(let j = 0; j < annotations.length; j++){
            let annotation = annotations[j];
            if(annotation.className.indexOf(infoClassString) >= 0){
                annotation.remove();
            }
        }
        
        //if no annotations, leave note
        if(document.querySelectorAll(".annotation").length == 0){
            document.getElementById("annotations").innerHTML = "<h6>No annotations provided for this task</h6>";
        }
        
        //remove highlights
        let highlights = document.querySelectorAll(".highlight");
        for(let j = 0; j < highlights.length; j++){
            let highlight = highlights[j];
            let classList = highlight.classList;
            let newClassList = [];
            for(let k = 0; k < classList.length; k++){
                let className = classList[k];
                if(className.indexOf(infoClassString) < 0){
                    newClassList.push(className);
                }
            }
            
            if(newClassList.length == 1){
                newClassList = [];
            }
            
            highlight.className = newClassList.join(" ");
        }
    }
}

function orderAnnotations(participantInfo) {
    var annotationSets = {};
    annotationSets.concept = [];
    annotationSets.fact = [];
    annotationSets.template = [];
    let annotations = document.querySelectorAll(".annotation");
    for(let j = 0; j < annotations.length; j++){
        let annotation = annotations[j];
        
        if(annotation.className.indexOf("concept") >= 0){
            annotationSets.concept.push(annotation);
        }
        if(annotation.className.indexOf("fact") >= 0){
            annotationSets.fact.push(annotation);
        }
        if(annotation.className.indexOf("template") >= 0){
            annotationSets.template.push(annotation);
        }
    }
    
    var annotationOrder = [participantInfo["An_1"], participantInfo["An_2"], participantInfo["An_3"]];

    annotationOrder = annotationOrder.map(function(val) { 
        if(val == "a"){
            return "concept";
        }
        if(val == "b"){
            return "template";
        }
        if(val == "c") {
            return "fact";
        }
    });

    document.getElementById("annotations").innerHTML = "";
    for(var i = 0; i < annotationOrder.length; i++){
        var annotationSet = annotationSets[annotationOrder[i]];
       for(var j = 0; j < annotationSet.length; j++){
           document.getElementById("annotations").appendChild(annotationSet[j]);
       } 
    }


}

function setUpPageAll(){
	setUpPage(null, 0)
}

function setUpPage(participantInfos, participantId){
    if(participantId != 0){
        let participantInfo = participantInfos[participantId - 1];
        
        orderAnnotations(participantInfo);
        
        if(window.currentTaskNum){
            clearAnnotations(participantInfo, participantId);
        }
    }
    
     let show = true;
    //$(".annotation").hide();
    
    
    $(".highlight").mouseenter(function (event){
        highlightHover(this);
        return false;
    });
    
    
    
    $(".highlight").mouseleave(function (event){
        let elementNowOn = event.toElement || event.relatedTarget;
        highlightHover(elementNowOn);
        return false;
    });
    
    function highlightHover(domElement, force){
        if($(".selected").length == 0 || force){ 
            $(".annotation").hide();
            let nameList = getAnnotationClassNames(domElement);
            if(nameList.length > 0){
                for(let i = 0; i < nameList.length; i++){
                    if(show){
                        $(".annotation."+nameList[i]).show();
                    }
                }
            } else {
                if(show){
                    $(".annotation").show();
                }
            }
        }
    }
    
    $("#source-code").mouseup(function(event){
        let wasSelected = event.target.classList.contains("selected");

        $(".selected").each(function(i, tag){
           tag.classList.remove("selected"); 
        });
        
        if(event.target.classList[0] == "highlight" && !wasSelected){
            event.target.classList.add("selected");
            highlightHover(event.target, true);
        }
    });
    
    
    $("#searchclear").click(function(){
        $("#searchinput").val('');
    });
    
    $("#searchinput").keyup(search);
    $("#searchinput").mouseup(search);
    
    function search(){
        let val = $("#searchinput").val();
        
        if(show){
            $(":hidden").show();
        }
        if(val != ""){
            $(".annotation").each(function(i, item){
                if(item.innerHTML.toLowerCase().indexOf(val.toLowerCase()) >= 0){
                    
                } else{
                    $(item).hide()
                }
            });
        }
    }
    
    
    function getAnnotationClassNames(domElement){
        if(!domElement || !domElement.classList.contains("highlight")){
            return [];
        }
        
        let classList = domElement.classList;
        
        //recurse
        let annotationClasses = getAnnotationClassNames(domElement.parentNode);
        
        //get classes from this domElement
        for(let i = 0; i < classList.length; i++){
            let name = classList[i];
            if(name.match(/^(template|fact|concept)(\d+)$/)){
                annotationClasses.push(name);
            }
        }
        return annotationClasses;
    }
}

$(document).ready(function() {
    
    fetch("ParticipantOrders.csv", {credentials: 'include'}) // include credentials for cloud9
       .then(checkStatus)
       .then(function(responseText) {
           let csv = $.csv.toObjects(responseText);
           fetch("participantId", {credentials: 'include'})
                .then(checkStatus)
                .then(function(participantId) {
                    setUpPage(csv, participantId);
                })   
                .catch(function(error) {
                       console.log("could not load participant id!", error);
					   setUpPageAll();
                   });
           
        })
       .catch(function(error) {
		   console.log("could not load participantOrders.csv!", error);
           setUpPageAll();
       });
    
   
    
});