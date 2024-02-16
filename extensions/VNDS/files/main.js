
var bgdir;
var fgdir;
var musicdir;
var sounddir;
var scriptdir;


var script;        
var textlog='';
var clickable=false;
var skipenable = false;
var skiphold = false;
var clicked=false;
var musicoff=false;
var gametitle="VNDS";
var samplingrate='22050';
var ratiob = false;
var ratiox = 1;
var ratioy = 1;

var menuitems=['Skip Mode','Save','Load','Options','Music OFF','Quit']; 
var saveloadmode = '';


var localstate = {
    text:"",
    date: 0,
    bg : "",
    sprites : [],
    spriteslocx : [],
    spriteslocy : [],
    music : "",
    sound : "",
    soundloop : 0 ,
    line: -1,
    filename: "main.src",
    vars : {}
}
var globalstate = {
    
    saveloadpage : 0,
    vars : {},
    options : {
        volumem : 128,
        volumes : 128,
        rotation : 0
    }
}




function startgame( name) {
    
    
    bgdir="games/"+name+"/background/";
    fgdir="games/"+name+"/foreground/";
    musicdir="games/"+name+"/sound/";
    sounddir="games/"+name+"/sound/";
    scriptdir="games/"+name+"/script/";  
    decideratio("games/"+name+"/img.ini");
    decidesamplingrate("games/"+name+"/audio.ini")
    soundcommand("1~"+samplingrate);
    gametitle=$.trim($.ajax("games/"+name+"/info.txt").responseText).split('=')[1]; // title=Saya's song. >  Saya's song
    if (gametitle[gametitle.length-1]=== '.') {gametitle.slice(0, -1);}
    kindle.chrome.setTitleBar('', gametitle);    
    if (localStorage.getItem(game+'_global') === null) {
        saveglobal();
    }      
    globalstate=JSON.parse(localStorage.getItem(game+'_global'));
    setrotation();
    setvolume();
    
    newscript("main.scr",'#0'); 
}


function newscript(name,label) {

    var stringData = $.ajax({
        url: scriptdir+name,
        async: false
    }).responseText;
    script= stringData.split("\n");
    scripttrim();
    localstate.line=findlabel(label)-1;
    localstate.filename=name;
    nextline();
}

function scripttrim() {
    for (var i=0;i<script.length;i++) {
        script[i]=$.trim(script[i]);
        if (script[i].search('{')!=-1) {
           script[i] = script[i].split('{').join(''); 
           script[i] = script[i].split('}').join('');
        }
        
    }
    
}

function nextline() {
    
    nextline(0);    
    
}

function nextline(ms) {
    localstate.line++;
    console.log(localstate.line);    
    if (localstate.line>=script.length) {
        console.log('endofile');
        cleartextlog();
        newscript('main.scr','#0');
        }
    else {
        setTimeout(function() {
            vnparse(script[localstate.line]);
        },ms);
    }

}



function vnparse(s) {
    
    var cmd= s.split(" ");
   
    switch (cmd[0])
    {
        case "bgload":
            setbg(cmd[1]);
      
            break; 
        case "music":
            if (cmd[1]=="~") {localstate.music = "";
                              soundcommand("3");}
                   else      {localstate.music = cmd[1];
                              soundcommand("2~"+sounddir+cmd[1]);}
            nextline();       
            break;
        case "sound":
            if (cmd[1]=="~") {if (localstate.sound!='') {soundcommand("5"); localstate.sound='';}}
                   else      {var loops =  parseInt(cmd[2]);                    
                              if (loops>0) {loops--;}   
                              if (!skiphold) {soundcommand("4~"+sounddir+cmd[1]+"~"+loops);}
                              localstate.sound=cmd[1]; localstate.soundloop=loops;
                          
                      }
            nextline();                   
            break;     

        case "text":

            var s2 = $.trim(s);
            s2=s2.slice(5);
            settext(s2);
        
     
            break;
        case "setimg":
        
            setimg(cmd[1],cmd[2],cmd[3]);

            break;
        case "delay":
            console.log('delay '+cmd[1]);
            if (skiphold && skipenable) {nextline()}
                            else        {nextline(cmd[1]*16);}
        break;
        case "jump":
            var label = cmd[2];
            if (label==undefined) {label='#0';}
            console.log(s);
            console.log('jump '+_(cmd[1])+' '+_(label));
            newscript(_(cmd[1]),_(label));
            break;
        case "cleartext":
            $('#textp').html('');
            localstate.text='';
            if (cmd[1]=='!') cleartextlog();
            nextline();
            break;
        case "setvar":
            if (cmd[1]=='~') {
                localstate.vars = {};
            
        }
        else {
            if (cmd[3][0]=='"') {cmd[3]=s.slice(s.search('"'));}
            setvar('l',cmd[1],cmd[2],cmd[3]);
        }
        nextline();
        break;
    case "gsetvar":
        if (cmd[3][0]=='"') {cmd[3]=s.slice(s.search('"'),0);}
        setvar('g',cmd[1],cmd[2],cmd[3]);
        nextline();
        break;
    case "random":
        
        setvar('l',cmd[1],'=',Math.floor((Math.random()*((cmd[3])-cmd[2]+1))+cmd[2]));
        nextline();
        break;
    case "loaddone":
        loaddone = true;
        break;
    case "goto":
        localstate.line = findlabel(cmd[1]);
        nextline();
        break;
    case "if":
        var b=false;
        var left = getvar(cmd[1]);
        
        switch (cmd[2]){
            case "==":
                if (left == cmd[3]) {
                    b = true;
                    }
                break;
            case "<=":
                if (left <= cmd[3]) {
                    b = true;
                    }
                break;
            case ">=":
                if (left >= cmd[3]) {
                    b = true;
                    }
                break;
            case "<":
                if (left < cmd[3]) {
                    b = true;
                    }
                break;
            case ">":
                if (left > cmd[3]) {
                    b = true;
                    }
                break;           
        }
        console.log(b);  
        if (b==false) {
            var lastline=localstate.line+1;
            var c=1;
            while (c>0) {
                var str = $.trim(script[lastline]);
                if (str[0] == 'i') {
                    c++;
                }
                if (str[0] == 'f') {
                    c--;
                }
                lastline++;
            }
            lastline--;
            localstate.line=lastline;
            //console.log("if goto "+localstate.line);
            //for (var i=localstate.line;i<=lastline;i++) {
            //    script[i] = '';
            //}
            //console.log(script);
        }
        nextline();
        
        
        break;
    case "choice":
        showchoice(s.slice(6)); 
        break;
        
    default:
        //include #
        nextline();
        break;
    
}    
    
}
function soundcommand(str) {
    if (!musicoff) {
    var key = Math.floor((Math.random()*100000000)+1);
    //
    // __='_' _s=' ' _l='/' _b='\' _d='.' _e=separator
    //
    str = 'vnds~'+key+'~'+str;
    var strcmd = '';
    for (var i=0;i<str.length;i++)
    {    
        switch (str[i]) {
            case '_': strcmd += '__'; break;
            case ' ': strcmd += '_s'; break;    
            case '/': strcmd += '_l'; break;    
            case '\\':strcmd += '_b'; break;
            case '.': strcmd += '_d'; break;
            case '~': strcmd += '_e'; break;
            default : strcmd += str[i]; break;
                
        }
    }
    
    kindle.messaging.sendMessage('com.lab126.system', 'sendEvent', strcmd);
    }
}


function setimg (name,x,y) {
    localstate.sprites.push(name);
    localstate.spriteslocx.push(x);
    localstate.spriteslocy.push(y);  
    var b=islastdraw();
    var imageObj = new Image();  
    imageObj.onload = function() {
        if (ratiob) {frmbfr.drawImage(this, fromds(x), fromds(y), Math.floor(this.width*ratiox), Math.floor(this.height*ratioy));}
            else    {frmbfr.drawImage(this, fromds(x), fromds(y));}
  
        if (b) {
            context.drawImage(frmbfrcanvas,0,0);
        }
        delete imageObj;
        nextline();
        
    };
    imageObj.onerror = function() { nextline();};

    imageObj.src = fgdir+name;    
}

    
    
function setbg(name)
{
    localstate.bg = name;
    localstate.sprites=[];
    localstate.spriteslocx=[];
    localstate.spriteslocy=[];
    
    var b=islastdraw();  
    var imageObj = new Image();  
    imageObj.onload = function() {
        if (ratiob) {frmbfr.drawImage(this, 0, 0, 800, 600);}
            else    {frmbfr.drawImage(this, 0, 0);}
        if (b) {
            context.drawImage(frmbfrcanvas,0,0);
        }
        delete imageObj;        
        nextline();
        

    };
    imageObj.onerror = function() { nextline();};
 
    imageObj.src = bgdir+name;
}



function islastdraw() {
    var s= $.trim(script[localstate.line+1]).split(" ");
   
    return (s[0]!='bgload' && s[0]!='setimg');    
}
function textlogadd() {
    if (localstate.sound=="") {textlog += '<p class="grey">'+localstate.text+'</p>\n';}
    else {textlog += '<p onclick="soundcommand(\'4~'+sounddir+localstate.sound+'~0\')">'+localstate.text+'</p>\n';}
    
}

function settext(s)
{
    if (clicked) {clicked=false; textlogadd(); localstate.sound=''; localstate.text='';}
    if (localstate.text=='<br>') {localstate.text='';}
    switch (s[0]) {
        case '@' :
            s=s.slice(1);  
            localstate.text=localstate.text + s +'<br>';
         //   $('#textp').html(localstate.text);  
            nextline();

            break;
        case '!' :
            $('#textp').html(localstate.text);
            waittoclick();
            break;   
        case '~' :
            s=s.slice(1);  
            localstate.text=localstate.text + s +'<br>';
        //    $('#textp').html(localstate.text);  
            nextline();
            break;  
        default:
            localstate.text=localstate.text + s +'<br>';
            $('#textp').html(localstate.text);
            waittoclick();        
            break;   
      
      
    }
       
}

function waittoclick()
{
    clickable=true;
    clicked=true;
    if (skipenable && skiphold) {
        clickdiv();
    }

}
function clickdiv()
{
    
    console.log("click", clickable)
    if (clickable)
    {
        if (skipenable) {skiphold=true;}
        clickable=false;
        nextline();     
    }     
    
}
function mouseupdiv()
{    
if (skiphold){
skiphold=false;
//if (skipenable && localstate.sound!='') 
//{soundcommand("4~"+sounddir+localstate.sound+"~"+localstate.soundloop);}
}
}
function fromds(number) {
    return Math.floor((number/256)*800);
    
}
function _ (str) {
    if (str[0]=='$') return getvar(str);
    else             return str;
}

function getvar(name) {
    var r=0;
    if (name[0] == '$') {
        name=name.slice(1);
    }
    if (globalstate.vars[name]!= undefined) {
        r = globalstate.vars[name];
    }
    if (localstate.vars[name] != undefined) {
        r = localstate.vars[name];
    }
    return r;
    
}


function setvar(stor,c1,c2,c3) {
    var start = getvar(c1);
    var value = c3;
    if (value[0] == '"') {
        value=value.slice(1,-1);
    }
    else {
        if (parseInt(value) == value) {
            value=parseInt(value);
        }
        else {
            value=getvar(c3);
        }
    }
    var end = 0;
    switch (c2) 
    {
        case '=' :
            end = value;
            break;
        case '+' :
            end = start + value;
            break;    
        case '-' :
            end = start - value;
            break;    
    }
    if (stor=='g') { 
        globalstate.vars[c1]=end;
        saveglobal();
    }
    else
    {
        localstate.vars[c1]=end;
    }    
}

function saveglobal() {
    localStorage.setItem(game+'_global',JSON.stringify(globalstate));   
}

function findlabel(label) {
    var r = 0;
    var s = '';
    if (label[0]=='#') {
        r = parseInt(label.slice(1));
    }
    else {
        for (var i=0;i<script.length;i++)
        {
            s = $.trim(script[i]);
               
            if (s == 'label '+label) {
                r=i;
            }
                
        }
    }
    return r;
}



























function showchoice(text) {
    choices = $.trim(text).split("|");
    console.log(choices);
    $('#choice').html('');
    for (var i=0;i<choices.length;i++) {
        $('#choice').html( $('#choice').html() + '<tr onclick=\'selectchoice('+i+')\'><td>'+_(choices[i])+'</td></tr>');
    }

    $('#choicehelper').css('display','table-cell');
}
function selectchoice(choice) {
    localstate.vars['selected']=choice+1;    
    $('#choicehelper').css('display','none');
    nextline();
}


function showmenu (){

    $('#menu').html('<tbody>');
    for (var i=0;i<6;i++) {
        $('#menu').html( $('#menu').html() + '<tr onclick=\'menuclick('+i+')\'><td>'+menuitems[i]+'</td></tr>'); 

    }
    $('#menu').html( $('#menu').html() + '</tbody>');
    $('#menuholder').css('display', 'block');
}
function menuclick(choice) {
    $('#menuholder').css('display', 'none'); 
    console.log(choice);
    switch (choice)
    {
        case 0:     //skipmode
            if (menuitems[0]=='Skip Mode') {
                skipenable=true;
                menuitems[0]='Normal Mode'
                }
            else                {
                skipenable=false;
                menuitems[0]='Skip Mode'
                }
            break;             
        case 1:       //save
            saveloadmode = 'save';
            showsaveload();
            break;
        case 2:
            saveloadmode = 'load';
            showsaveload();          
            break;
        case 3:
            showoptions();
            break;
        case 4:       // music
            if (menuitems[4]=='Music OFF') {
                menuitems[4]='Music ON';
                soundcommand("6");
                musicoff=true;
                }
            else                {
                menuitems[4]='Music OFF';
                musicoff=false;
                soundcommand("7");
                setvolume();
                if (localstate.music != "") {soundcommand("2~"+sounddir+localstate.music);}
                if (localstate.sound != "") {soundcommand("4~"+sounddir+localstate.sound+"~"+localstate.soundloop);}
                }
            break;
          
        case 5:       // quit
            soundcommand("0");
                    setTimeout(function() {
            window.location.href='index.html';
        },100);
            break;
          
          
    }
      
} 
///////////////////////////////////////////////////////////////////OPTIONS
function showoptions () {
     kindle.chrome.setTitleBar('', gametitle+" · Options");
     $('#optionsholder').css('display','block');
     showrotation(globalstate.options.rotation);
     showvolume(globalstate.options.volumem / 8,'music');
     showvolume(globalstate.options.volumes / 8,'sound');
}

            function showrotation(rot) {
                $('#rotation0').css('background-color',(rot==0) ? 'black' : 'white');
                $('#rotation0').css(           'color',(rot==0) ? 'white' : 'black');
                $('#rotation1').css('background-color',(rot==1) ? 'black' : 'white');
                $('#rotation1').css(           'color',(rot==1) ? 'white' : 'black');
            }
            function rotationclick(rot) {
                globalstate.options.rotation=rot;
                showrotation(rot);
            }
            function volumeclick(vol,type) {
                if (type=='music') { globalstate.options.volumem=vol*8; }    
                if (type=='sound') { globalstate.options.volumes=vol*8; }
                setvolume();
                showvolume(vol,type);
                            
            }
            
            function showvolume (vol,type) {
             
        $('.volume'+type).css('background-color','white');
             if (vol==0) {$('#volume'+type+'0').css('background','black url("mute.png")');}
             else {
              for (var i=1;i<=vol;i++){
                $('#volume'+type+i).css('background-color','grey');  
              }  
             } 
               
            }
            function hideoptions() {
                setrotation();
                saveglobal();
                $('#optionsholder').css('display','none');
                kindle.chrome.setTitleBar('', gametitle);
            }
function setvolume() {
   soundcommand('8~'+globalstate.options.volumem+'~'+globalstate.options.volumes); 
}
function setrotation() {
   $('#holder').css('-webkit-transform', (globalstate.options.rotation==0) ? 'rotate(90deg)' : 'rotate(270deg)');
   $('#holder').css('top'              , (globalstate.options.rotation==0) ? '70px' : '100px');   
}


///////////////////////////////////////////////////////////////////SAVELOAD  
function showsaveload() {
    $('#saveloadholder').css('display','block');
    if (saveloadmode==='save') {kindle.chrome.setTitleBar('', gametitle+" · Save game");}
    else                       {kindle.chrome.setTitleBar('', gametitle+" · Load game");}
    
    saveloadpage(globalstate.saveloadpage);
             
}
function saveloadpage(n) {
    globalstate.saveloadpage=n;
    $('.saveloadpage').css('background-color','white');
    $('#saveloadpage'+n).css('background-color','black');
    var f=5*n;
      
              
    for (var i=0;i<5;i++) {
                 
        if (localStorage.getItem(game+'_'+(f+i)) === null) {

            $('#saveloadimg'+i).attr('src','empty.png');  
            $('#saveloadtext'+i).html('');
            $('#saveloadtime'+i).html('');                   
        }
        else {

            var sejvs = $.parseJSON(localStorage.getItem(game+'_'+(f+i)));   
            $('#saveloadimg'+i).attr('src',bgdir+sejvs.bg);  
            $('#saveloadtext'+i).html(sejvs.text);
            $('#saveloadtime'+i).html(new Date(sejvs.date).toLocaleString());
        }
        $('#saveloadnumber'+i).html("save #"+(f+i)+"/99");

    }
}  
function saveloadclick (n) {

    switch (saveloadmode) {
        case 'save' :
            localstate.text = $('#textp').html();
            localstate.date = new Date().getTime();
                 
            localStorage.setItem(game+'_'+n,JSON.stringify(localstate));
            break;    
        case 'load' :
            loadgame (n);
            break;    
              
    }
         
    hidesaveload();
}
         
function hidesaveload() {
    $('#saveloadholder').css('display','none');
    kindle.chrome.setTitleBar('', gametitle);
    saveglobal();
}
         
function loadgame(n) {
    if (localStorage.getItem(game+'_'+n) === null) {
        console.log('save '+n+' has no data')
        }    
    else {
        var localsave = JSON.parse(localStorage.getItem(game+'_'+n));    
        var imageObj = new Image();  
        imageObj.onload = function() {
            if (ratiob) {frmbfr.drawImage(this, 0, 0, 800, 600);}
            else    {frmbfr.drawImage(this, 0, 0);}
            if (localsave.sprites.length == 0) {
                context.drawImage(frmbfrcanvas,0,0);
            }
            else {
                for (var i=0;i<localsave.sprites.length;i++) {
                    var imageSprite = new Image();
                    imageSprite.indexinfor = i;
                    var b=(i==localsave.sprites.length-1);
                    imageSprite.onload = function() {
                         if (ratiob) {
                         frmbfr.drawImage(this, fromds(localsave.spriteslocx[this.indexinfor]), 
                                               fromds(localsave.spriteslocy[this.indexinfor]),
                                               Math.floor(this.width*ratiox), Math.floor(this.height*ratioy)
                                           );                             
                         }
                            
                         else{
                         frmbfr.drawImage(this, fromds(localsave.spriteslocx[this.indexinfor]), 
                                               fromds(localsave.spriteslocy[this.indexinfor]));
                         }
                    
                        if (b) {
                            
                            context.drawImage(frmbfrcanvas,0,0);
                        }
                    }
                    imageSprite.src= fgdir+localsave.sprites[i];
                }
            }     
            };
 
            imageObj.src = bgdir+localsave.bg;
            $('#textp').html(localsave.text);
            $('#choicehelper').css('display','none');
            soundcommand("5");
            if (localstate.music != localsave.music) { soundcommand("2~"+sounddir+localsave.music);}
            if (localsave.sound!="") {soundcommand("4~"+sounddir+localsave.sound+"~"+localsave.soundloop);}
            localstate = localsave;
            var stringData = $.ajax({
                 url: scriptdir+localstate.filename,
                 async: false
            }).responseText;
            script= stringData.split("\n");
            scripttrim();
            localstate.line--;
            cleartextlog();
            nextline();

   


  
 
  
}
    
}         
         

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function einkrefreshclick() {
                                    $('#einkrefresh').css('display','block');
    setTimeout(function () {   $('#einkrefresh').css('background-color','white');}             ,500);
    setTimeout(function () {   $('#einkrefresh').css('display','none');}                       ,1000);
    setTimeout(function () {   $('#einkrefresh').css('background-color','black');}             ,1020);
}

 function decideratio(file) {
     var lines=$.ajax(file).responseText.split("\n");
     var l1=lines[0].split('=');
     var l2=lines[1].split('=');
     var width=800; var height=600;
     if (l1[0] == 'width') {width=parseInt(l1[1]);}
     if (l2[0] == 'width') {width=parseInt(l2[1]);}
     if (l1[0] == 'height') {height=parseInt(l1[1]);}
     if (l2[0] == 'height') {height=parseInt(l2[1]);}
     if (width != 800 || height != 600 )
        {
            ratiob=true;
            ratiox=800/width;
            ratioy=600/height;
        }
     
     
 }
 
 function decidesamplingrate(file) {
     var str=$.trim($.ajax(file).responseText);
     var lines = str.split('=');
     if (lines[1]!=undefined) {samplingrate = lines[1];}     
 }
 
 

function textlogshow() {

    $('#textlogholder').css('display','block');
    $('#textlogarea').html(textlog);
    $('#textlogarea').scrollTop(10000000);    
       
}

function textlogscroll(by) {
    
    $('#textlogarea').scrollTop($('#textlogarea').scrollTop()-by);
    
}

function textloghide() {
   $('#textlogholder').css('display','none'); 
   $('#textlogarea').html(''); 
}

function cleartextlog() {
   textlog='';    
}


function hidetext() {
    $('#textdiv').css('display','none');
    $('#hidetext').css('display','block');
}

function unhidetext() {
    $('#textdiv').css('display','block');
    $('#hidetext').css('display','none');   
}