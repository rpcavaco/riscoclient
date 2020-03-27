
/*
 * Inspeccionar eleemnto
 * 			for(var prop in the_obj){
			   console.log(prop);
			   console.debug(the_obj[prop]);
			}
			* 
			* */
	
	
// **************************************************************************
// Licenca que cobre apenas Array.intersect e Array.unique
//
// Copyright 2007 - 2008 The JSLab Team, Tavs Dokkedahl and Allan Jacobs
// Contact: http://www.jslab.dk/contact.php
//
// JSL is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// any later version.
//
// JSL is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.
// ***************************************************************************

// Detecção de browser, Rob W, rob@robwu.nl
var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
var isFirefox = /Firefox/.test(navigator.userAgent);   // Firefox 1.0+
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // At least Safari 3+: "[object HTMLElementConstructor]"
var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
var isIE = false || !!document.documentMode; // At least I
var isEdge = /Edge/.test(navigator.userAgent);
var isWin = navigator.platform.indexOf('Win') === 0;

/**
 * This function returns a copy of its input object.
 * @param {Object} obj any object
 * @returns {Object} a fresh copy of that object.
 */ 
function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = new obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
}

function bodyCanvasDims()
{
	var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    
    return [x, y];
}

function getFullWidgetWidth(p_elem) {
	var sty = getComputedStyle(p_elem);
	return parseInt(sty.width) + parseInt(sty.paddingLeft) + parseInt(sty.paddingRight) + parseInt(sty.marginLeft) + parseInt(sty.marginRight);
}

function getPadding(p_elem) {
	var sty = getComputedStyle(p_elem);
	return [parseInt(sty.paddingTop) + parseInt(sty.paddingBottom), parseInt(sty.paddingLeft) + parseInt(sty.paddingRight)];
}

function changeSkin(skname) {
	var prevskin = globalskin;
	globalskin = skname;
	if (!applySkin()) {
		alert('Skin '+skname+' não encontrada, vamos repôr a situação anterior ...');
		globalskin = prevskin;
		applySkin();
	}
}

function isElement( o)
{
	if (!isIE)
	{ return o instanceof Element }
	else
	{ return o && o.nodeType == 1 && o.tagName != undefined }
}

function getClass(elem) {
	var classname = '';
	if (isElement(elem)) {
		if (typeof elem.getAttribute != 'undefined') {
			classname = elem.getAttribute('class');
		} else {
			classname = elem.className;
		}	
	}	
	
	return classname;
}

function getClasses(p_node) {
	var ret = null, v_classes_str = getClass(p_node);
	if (v_classes_str) {
		ret = v_classes_str.split(/[ ]+/);
	}
	return ret;
}

function hasClass(p_elem, p_classname) {
	var ret = false, cls = getClass(p_elem);
	if (cls.indexOf(p_classname) >= 0) {
		ret = true;
	}
	return ret;
}

function setClass(p_node, p_class_str) {
	
	var final_classes, v_classes_str = getClass(p_node);
	if (v_classes_str == null || v_classes_str.length < 1) {
		v_classes = [];
	} else {
		v_classes = v_classes_str.split(/[ ]+/);
	}
	
	if (v_classes.indexOf(p_class_str) >= 0) {
		return;
	}
	
	v_classes.push(p_class_str);
	
	final_classes = v_classes.join(' ');

	if (final_classes.length > 0) {	
		p_node.className = final_classes;
	} else {
		p_node.className = "";
	}
}

function unsetClass(p_node, p_class_str) {
	
	var v_classes_str = getClass(p_node);
	if (v_classes_str == null || v_classes_str.length < 1) {
		return;
	}
	var final_classes, v_classes = v_classes_str.split(/[ ]+/);
	
	if (v_classes.indexOf(p_class_str) >= 0) {
		v_classes.splice(v_classes.indexOf(p_class_str), 1);
	}
	
	final_classes = v_classes.join(' ');

	if (final_classes.length > 0) {	
		p_node.className = final_classes;
	} else {
		p_node.className = "";
	}
}

function toggleClass(p_node, p_class_str) {
	
	var v_classes_str = getClass(p_node);
	if (v_classes_str == null || v_classes_str.length < 1) {
		return;
	}
	var final_classes, v_classes = v_classes_str.split(/[ ]+/);
	
	if (v_classes.indexOf(p_class_str) >= 0) {
		v_classes.splice(v_classes.indexOf(p_class_str), 1);
	} else {
		v_classes.push(p_class_str);
	}

	final_classes = v_classes.join(' ');

	if (final_classes.length > 0) {	
		p_node.className = final_classes;
	} else {
		p_node.className = "";
	}

}

function applySkin() {
	
	var linkTag;
	var linksArray = document.getElementsByTagName("link");
	var foundskin = false;

	for(var linkNum=0; linkNum<linksArray.length; linkNum++) {
		linkTag = linksArray[linkNum];
		if(linkTag.getAttribute("rel").match(/^sty|^alt/i))
		{
			if (linkTag.getAttribute("title"))
			{
				if (linkTag.getAttribute("title") == globalskin) {
					linkTag.disabled = false;
					foundskin = true;
				} else  {
					linkTag.disabled = true;
				}
				//console.log(linkTag.getAttribute("href")+' disabled:'+linkTag.disabled+' '+linkTag.getAttribute("href").indexOf(globalskin));
			}
		}
	}
	
	return foundskin;
}

var MOUSEBTN_LEFT = 1;
var MOUSEBTN_MIDDLE = 2;
var MOUSEBTN_RIGHT = 4;

function filterMouseButton(evt, mouseButtonMask)
{
	var ret = false;
	var butprop = 'which';
	var val = -1;
	
	if (typeof evt.which != 'undefined')
	{
		val = evt.which;
		if (val == 1 && (mouseButtonMask & MOUSEBTN_LEFT) == MOUSEBTN_LEFT) // 0, 1
		{
			ret = true;
		}
		else if (val == 2 && (mouseButtonMask & MOUSEBTN_MIDDLE) == MOUSEBTN_MIDDLE) // 1, 2
		{
			ret = true;
		}
		else if (val == 3 && (mouseButtonMask & MOUSEBTN_RIGHT) == MOUSEBTN_RIGHT) // 3, 2
		{
			ret = true;
		}
	}
	else if (typeof evt.button != 'undefined')
	{
		butprop = 'button';
		val = evt.button;
		if (evt.button == 1 && (mouseButtonMask & MOUSEBTN_LEFT) == MOUSEBTN_LEFT)
		{
			ret = true;
		}
		else if (evt.button == 4 &&  (mouseButtonMask & MOUSEBTN_MIDDLE) == MOUSEBTN_MIDDLE)
		{
			ret = true;
		}
		else if (evt.button == 2 && (mouseButtonMask & MOUSEBTN_RIGHT) == MOUSEBTN_RIGHT)
		{
			ret = true;
		}
	}
	
	return [butprop, val, ret];
}

function updateURLParameter(url, param, paramVal)
{
    var TheAnchor = null;
    var newAdditionalURL = "";
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    var temp = "";

    if (additionalURL) 
    {
        var tmpAnchor = additionalURL.split("#");
        var TheParams = tmpAnchor[0];
            TheAnchor = tmpAnchor[1];
        if(TheAnchor)
            additionalURL = TheParams;

        tempArray = additionalURL.split("&");

        for (i=0; i<tempArray.length; i++)
        {
            if(tempArray[i].split('=')[0] != param)
            {
                newAdditionalURL += temp + tempArray[i];
                temp = "&";
            }
        }        
    }
    else
    {
        var tmpAnchor = baseURL.split("#");
        var TheParams = tmpAnchor[0];
            TheAnchor  = tmpAnchor[1];

        if(TheParams)
            baseURL = TheParams;
    }

    if(TheAnchor)
        paramVal += "#" + TheAnchor;

    var rows_txt = temp + "" + param + "=" + paramVal;
    return baseURL + "?" + newAdditionalURL + rows_txt;
}

function getTarget(e) {
	var targ;
	if (!e) var e = window.event;
	if (e.target) targ = e.target;
	else if (e.srcElement) targ = e.srcElement;
	try {
		if (targ.nodeType == 3) // defeat Safari bug
			targ = targ.parentNode;
	} catch(e) {
		// do nothing
	};
	return targ;
}

function foundAncestor(elem, ctrlcnt, ancestor_or_id) {
	var tmpn, ret = false;
	var cnt = ctrlcnt;
	var ancestor;
	
	if (typeof ancestor_or_id == "string")
	{
		ancestor  = document.getElementById(ancestor_or_id);
	}
	else
	{
		ancestor  = ancestor_or_id;
	}
	
	if (ancestor == null || elem == null) {
		console.log('foundAncestor: no ancestor:'+ancestor_or_id);
		return ret;
	}
	
	tmpn = elem;
	
	if (ctrlcnt <= 0) {
		cnt = 9999;
	}
	
	while (cnt>0)
	{
		if (tmpn == null) {
			break;
		}
		if (tmpn == ancestor) {
			ret = true;
			break;
		}		
		tmpn = tmpn.parentNode;
		cnt--;
	}
	
	return ret;
}

function getAncestorByTagName(first, ctrlcnt, p_tagname) {
	// Sobe até ctrlcnt níveis na hierarquia DOM acima de "first", para encontrar o elemento antecessor com a tagname indicada.
	var ret = null, tmpn = first.parentNode;
	
	while (ctrlcnt>0 && tmpn.tagName.toUpperCase() != p_tagname.toUpperCase())
	{
		tmpn = tmpn.parentNode;
		ctrlcnt--;
	}
	if (tmpn == null || tmpn.tagName.toUpperCase() == p_tagname.toUpperCase()) {
		ret = tmpn;
	}	
	
	return ret;
}

function getAncestorByClassnamePart(first, ctrlcnt, p_clsname_part) 
{
	// Sobe até ctrlcnt níveis na hierarquia DOM acima de "first", para encontrar o elemento antecessor com a tagname indicada.
	var ret = null, tmpn = first.parentNode;
	var clsname = getClass(tmpn);
	
	//console.log('   clsname:'+clsname);
	
	
	while (ctrlcnt>0 && (clsname == null || clsname.indexOf(p_clsname_part) < 0))
	{
		tmpn = tmpn.parentNode;
		if (tmpn == null) {
			ret = null;
			break;
		}
		clsname = getClass(tmpn);
		//console.log('   clsname B:'+clsname);
		ctrlcnt--;
	}
	if (clsname != null && clsname.indexOf(p_clsname_part) >= 0) {
		ret = tmpn;
	}	

	return ret;
}

function ajaxSender(url, reqListener, postdata, opt_req, opt_cors_compatmode, opt_rec_blob)
{
	var oReq
	if (opt_req != null) {
		oReq = opt_req;
	} else {
		if (opt_cors_compatmode && typeof XDomainRequest != 'undefined') {
			oReq = new XDomainRequest();
		} else {
			oReq = new XMLHttpRequest();
		}
	}
	
	if (opt_cors_compatmode && typeof XDomainRequest != 'undefined') {	
		oReq.onload = reqListener;
	} else {
		oReq.onreadystatechange = reqListener;
	}
	
	var meth, finalurl;
	
	if (postdata != null)
	{
		meth = "POST";
		finalurl = url;
		//finalurl = url + ((/\?/).test(url) ? "&_ts=" : "?_ts=") + (new Date()).getTime();
	}
	else
	{
		meth = "GET";
		//finalurl = url;
		// para prevenir o caching dos pedidos 
		finalurl = url + ((/\?/).test(url) ? "&_ts=" : "?_ts=") + (new Date()).getTime();
	}

	if (opt_cors_compatmode && typeof XDomainRequest != 'undefined') {
		oReq.open(meth, finalurl);
	} else {
		oReq.open(meth, finalurl, true);
	}

	if (postdata && oReq.setRequestHeader !== undefined && oReq.setRequestHeader != null)
	{
		oReq.setRequestHeader('Content-type','application/json');  
	}
	if (oReq.setRequestHeader) {
		oReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest');  // Tells server that this call is made for ajax purposes.
	}
	
	if (opt_rec_blob) {
		oReq.responseType = 'blob';
	}
	
	oReq.send(postdata);
	
	return oReq;

}

function i18n_msg(msgkey, opt_lang)
{
	var msdict = MSGS_PT;
	var valid_langs = ['pt','en', 'es'];
	var lang, lng = null;
	var retmsgs = "";

	if (opt_lang != null) {
		lang = opt_lang.toLowerCase();
		if (valid_langs.indexOf(lang) >= 0) {
			lng = lang;
		}
	}
	
	if (lng == null && typeof GLOBALLANG != 'undefined') {
		if (valid_langs.indexOf(GLOBALLANG.toLowerCase()) >= 0) {
			lng = GLOBALLANG.toLowerCase();
		}
	}
	
	
	if (lng == 'en')
	{
		msdict = MSGS_EN;
	}
	else if (lng == 'es')
	{
		msdict = MSGS_ES;
	}
	
	if (msdict[msgkey] !== undefined && msdict[msgkey] != null) {
		retmsgs =  msdict[msgkey];
	} else {
		elimix = valid_langs.indexOf(lng);
		for (var ix=0; ix < valid_langs.length; ix++) {
			if (ix == elimix) {
				continue;
			}
			
			if (valid_langs[ix] == 'pt')
			{
				msdict = MSGS_PT;
			}
			else if (valid_langs[ix] == 'en')
			{
				msdict = MSGS_EN;
			}
			else if (valid_langs[ix] == 'es')
			{
				msdict = MSGS_ES;
			}
			
			if (msdict[msgkey] !== undefined && msdict[msgkey] != null) {
				retmsgs =  msdict[msgkey];
				break;
			}
	
		}
	}
	
	return retmsgs;
}

function replaceHTML(elem_or_id, docsource, do_display)
{
	var the_elem;
	
	if (typeof elem_or_id == "string")
	{
		the_elem  = document.getElementById(elem_or_id);
	}
	else
	{
		the_elem  = elem_or_id;
	}
	
	if (the_elem == null)
	{
		if (typeof elem_or_id == 'string')
		{
			alert('replaceHTML widget not found:'+elem_or_id);
		}
		else
		{
			alert('replaceHTML widget not found');
		}
	}
	
	while (the_elem.firstChild) {
	  the_elem.removeChild(the_elem.firstChild);
	}

	the_elem.innerHTML = docsource;
	
	//console.log(' id:'+the_elem.id + ' display:' + the_elem.style.display);

	if (do_display && the_elem.style.display == 'none') {
		the_elem.style.display = '';
	}
	
}

function replacer(elem_or_id, docsource)
{
	var the_elem, doc = new DOMParser().parseFromString(docsource, "application/xml");
	
	if (typeof elem_or_id == "string")
	{
		the_elem  = document.getElementById(elem_or_id);
	}
	else
	{
		the_elem  = elem_or_id;
	}
	
	while (the_elem.firstChild) {
	  the_elem.removeChild(the_elem.firstChild);
	}

	the_elem.appendChild(
	the_elem.ownerDocument.importNode(doc.documentElement, true)
	 //document.adoptNode(doc.documentElement)
	 ); 
}

function findSiblingByClass(parentname_or_elem, classname, godeeplevel)
{
	var i, ret, chld, wdg, splts;
	if (godeeplevel == null) {
		godeeplevel = -1;
	}
	if (godeeplevel == 0) {
		return;
	}
	if (typeof parentname_or_elem == "string") {
		wdg = document.getElementById(parentname_or_elem);
	} else {
		wdg = parentname_or_elem;
	}
	if (!wdg) {
		return null;
	}
	var chldCnt = wdg.childNodes.length * 1;
	for (i=0; i<chldCnt; i++)
	{
		if (ret) {
			break;
		}
		chld = wdg.childNodes[i];
		//if (isElement(chld) && (chld.hasAttribute("class") || typeof chld.className != 'undefined'))
		if (isElement(chld) && chld.hasAttribute("class"))
		{
			splts = getClass(chld).split(/\s/);
			intsects = splts.intersect([classname]);
			if (intsects.length > 0) {
				ret = chld;
				break;
			}
		}
		if (!ret) {
			ret = findSiblingByClass(chld, classname, godeeplevel-1);
		}
	}
	
	return ret;
}

function applyFunctionByClasses(parentname_or_elem, classnamelist, func, godeeplevel, databus_or_null)
{
	var fnd, wdg, tmpel,  elems, clsnames;
	if (godeeplevel == 0) {
		return;
	}
	if (typeof parentname_or_elem == "string")
	{
		wdg = document.getElementById(parentname_or_elem);
	} else {
		wdg = parentname_or_elem;
	}
	if (wdg == null) {
		console.log('applyFunctionByClasses: não encontrado ancestor:'+parentname_or_elem);
		return;
	}
	if (typeof classnamelist  == 'string') {
		clsnames = [classnamelist];
	} else {
		clsnames = classnamelist;
	}
	
	for (var i=0; i<clsnames.length; i++) 
	{
		elems = document.getElementsByClassName(clsnames[i]);
		for (var j=0; j<elems.length; j++) {
			if (foundAncestor(elems[j], godeeplevel, wdg)) {
				func(elems[j]);
			}
		}
	}	
}

function applyFunctionByTagName(parentname_or_elem, tagname, func, godeeplevel)
{
	var i, chld, wdg, splts;
	if (godeeplevel == 0) {
		return;
	}
	if (typeof parentname_or_elem == "string") {
		wdg = document.getElementById(parentname_or_elem);
	} else {
		wdg = parentname_or_elem;
	}
	if (!wdg) {
		return;
	}
	var chldCnt = wdg.childNodes.length * 1;
	for (i=0; i<chldCnt; i++) {
		chld = wdg.childNodes[i];
		if (typeof chld.tagName != 'undefined' && chld.tagName.toUpperCase() == tagname.toUpperCase()) {
			func(chld);
		}
		var deeplevel = godeeplevel-1;
		applyFunctionByTagName(chld, tagname, func, deeplevel);
	}
}

function findSiblingsByTagName(parentname_or_elem, tagname, getone)
{
	var i, ret, retcoll, wdg;
	if (typeof parentname_or_elem == "string") {
		wdg = document.getElementById(parentname_or_elem);
	} else {
		wdg = parentname_or_elem;
	}
	if (!wdg) {
		return null;
	}
	retcoll = wdg.getElementsByTagName(tagname);
	if (getone) {
		if (retcoll.length > 0) {
			ret = retcoll[0];
		}
	} else {
		ret = retcoll;
	}

	return ret;
}

function finishEvent(e){
	//console.log('finish event');
    if(e.stopPropagation) {
		e.stopPropagation();
	} else {
		e.cancelBubble=true;
	}
    if(e.preventDefault) {
		e.preventDefault();
	}
    return false;
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
          c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
      } 
  }
  return "";
}

function setCookie(p_name, p_value) {
	document.cookie = p_name + "=" + p_value;
}

function formatPaddingDigits(inValue,digit,numDigits) 
{
	var outstr = inValue.toString();
	
	for (var i=0; i<numDigits; i++)
	{
		if (outstr.length >= numDigits) {
			break;
		}
		
		outstr = digit.toString() + outstr;	
	}
	
	return outstr;
}

function formatFracDigits(inValue,numFracDigits) 
{
	if (typeof(myString) == "string") 
	{
		origNumber = parseFloat(inValue);
	}
	else 
	{
		origNumber = inValue;
	}
	
	power10 = Math.pow(10,numFracDigits);
	valNumerico=Math.round(origNumber*power10)/power10;
	
	strNumerica = valNumerico.toString();
	
	var sepChar = ",";
	var splitResults = strNumerica.split(sepChar);
	if (splitResults.length < 2)
	{
		sepChar = ".";
		splitResults = strNumerica.split(sepChar);
	}

	zeros = "00000000000000000";
	var result = "";
	if (splitResults.length == 2)
	{
		intPart = splitResults[0];
		fracPart = splitResults[1].substr(0,numFracDigits);
		padStr = "";
		if (fracPart.length < numFracDigits)
		{
			padStr = zeros.substr(0,(numFracDigits-fracPart.length));
		}
		if (numFracDigits==0)
			result = intPart;
		else
			result = intPart + sepChar + fracPart + padStr;
	}	
	else if (splitResults.length == 1)
	{
		intPart = splitResults[0];
		fracPart = zeros.substr(0,numFracDigits);
		if (numFracDigits==0)
			result = intPart;
		else
			result = intPart + sepChar + fracPart;
	}
	
	return result;
}

function selectedValue(selectobj_or_id, truenull)
{
	var selobj, val;
	
	if (typeof(selectobj_or_id)=='string')
		selobj = document.getElementById(selectobj_or_id);
	else
		selobj = selectobj_or_id;
		
	if (selobj==null && typeof(selectobj_or_id)=='string') {
		alert('selectedValue: '+selectobj_or_id+' não existe');
	}
		
	val = selobj.options[selobj.options.selectedIndex].value;
	retval = val;
	if (truenull)
	{
        	//if (val == 'null' && parseInt(selobj.options[selobj.options.length-1].value) > 0) {
            if (val == 'null') {
        	    retval = null;
        	}
	} 
	
	return retval;
}

function selectedValueAndLabel(selectobj_or_id)
{
	var selobj;
	
	if (typeof(selectobj_or_id)=='string')
		selobj = document.getElementById(selectobj_or_id);
	else
		selobj = selectobj_or_id;
	
	return [selobj.options[selobj.options.selectedIndex].value, selobj.options[selobj.options.selectedIndex].innerHTML];
}

function clearOptions(selectobj_or_id)
{
	var i, selobj;
	
	if (typeof(selectobj_or_id)=='string')
		selobj = document.getElementById(selectobj_id);
	else
		selobj = selectobj_or_id;
		
	selobj.options.length = 0;
}

function addOption(selid_or_selobj, the_text, the_val)
{
	// get reference to select element
	var sel;
	if (typeof selid_or_selobj == 'string')
	{
		sel = document.getElementById(selid_or_selobj);
	}
	else
	{
		sel = selid_or_selobj;
	}
	var opt = document.createElement('option'); // create new option element
	// create text node to add to option element (opt)
	opt.appendChild( document.createTextNode(the_text) );
	opt.value = the_val; // set value property of opt
	sel.appendChild(opt); // add opt to end of select box (sel)
}

function selectOptionByValue(p_combo, p_value, dodebug)
{
	var val, found=false, combo;
	
	if (getObjectType(p_combo) == 'String') {
		combo = document.getElementById(p_combo);
	} else {
		combo = p_combo;
	}	

	if (!combo) {
		if (typeof console != 'undefined' && dodebug) {
			if (getObjectType(p_combo) == 'String') {
				console.log('selectOptionByValue - combo '+p_combo+' em falta');
			} else {
				console.log('selectOptionByValue - combo nulo');
			}			
		}
		return false;
	}
	
	if (combo.tagName.toLowerCase() != 'select') {
		if (typeof console != 'undefined' && dodebug) {
			console.log('selectOptionByValue - widget indicado não é SELECT');
		}		
		return false;
	}		

	if (p_value == null) {
		val = null;
	} else if (getObjectType(p_value) == 'Array') {
		val = p_value[0];
	} else {
		val = p_value;
	}
	
	var optvals = [];
	for (var i=0; i<combo.options.length; i++)
	{
	    optvals.push(combo.options[i].value);
	}
	
	var tmpidx = optvals.indexOf(val);

	for (var i=0; i<optvals.length; i++)
	{
		if (optvals[i] === val.toString() || 
			(optvals[i] === '' && val === null) || 
			(optvals[i] === '' && val === 'null') || 
			//(optvals[i] === null && val === '') ||
			(optvals[i] === 'null' && val === '')
		)
		{
			if (typeof console != 'undefined' && dodebug) {
				console.log('selectOptionByValue FOUND, val:' + val + ', i:' + i + ', optval:' +  combo.options[i].value);
			}

			combo.selectedIndex = i;
			found = true;
			break;
		}
	}

	if (typeof console != 'undefined' && dodebug && !found) {
		if (getObjectType(p_combo) == 'String') {
			console.log('selectOptionByValue - valor pretendido ('+p_value+') em '+p_combo+' class:'+combo.className+' não foi encontrado');
		} else {
			console.log('selectOptionByValue - valor pretendido ('+p_value+') class:'+combo.className+' não foi encontrado');
		}
		
	}

	return true;
}

function selectOptionByOrder(p_combo, p_order, dodebug)
{
	var val, order, found=false, combo;
	
	if (getObjectType(p_combo) == 'String') {
		combo = document.getElementById(p_combo);
	} else {
		combo = p_combo;
	}	

	if (!combo) {
		if (typeof console != 'undefined' && dodebug) {
			if (getObjectType(p_combo) == 'String') {
				console.log('selectOptionByOrder - combo '+p_combo+' em falta');
			} else {
				console.log('selectOptionByOrder - combo nulo');
			}			
		}
		return false;
	}
			
	if (combo.tagName.toLowerCase() != 'select') {
		if (typeof console != 'undefined' && dodebug) {
			console.log('selectOptionByOrder - widget indicado não é SELECT');
		}		
		return false;
	}		
	
	if (p_order >= 0) 
	{
		if (combo.options.length > p_order)
		{
			combo.selectedIndex = p_order;
			found = true;
		}
	} else {
		order = combo.options.length + p_order; 
		if (order > 0)
		{
			combo.selectedIndex = order;
			found = true;
		}
	}
	
	if (typeof console != 'undefined' && dodebug && !found) {
		if (getObjectType(p_combo) == 'String') {
			console.log('selectOptionByOrder - valor com ordem pretendida ('+p_order+') em '+p_combo+' não foi encontrado');
		} else {
			console.log('selectOptionByOrder - valor com ordem pretendida ('+p_order+') não foi encontrado');
		}		
	}

	return true;
}

function resetCombos(parentname_or_elem, exclist) 
{
	applyFunctionByTagName(parentname_or_elem, 'SELECT', 
		function(elem) {
			if (exclist && typeof elem.id != 'undefined' && exclist.indexOf(elem.id)>=0) {
				return;
			}
			if (!selectOptionByValue(elem, '', false)) {
				selectOptionByOrder(elem, 0, false);
			}
		}		
	, -1);
}


function attEventHandler(elem_or_id, type, eventHandler)
{
	var elem, clsname;
	
	if (typeof elem_or_id == "string")
	{
		elem  = document.getElementById(elem_or_id);
	}
	else
	{
		elem  = elem_or_id;
	}

    if (elem == null || typeof elem == 'undefined') return null;
    
    if (typeof elem.className.indexOf != 'function') {
	clsname = elem.getAttribute('class');
    } else {
	clsname = elem.className;
    }
    
    // Classes CSS que indicam elemento desabilitado
    if (clsname.indexOf('btndisab') >= 0) return null;
    
    if (elem.disabled) return null;
    
    if ( elem.addEventListener ) {
        elem.addEventListener( type, eventHandler, false );
    } else if ( elem.attachEvent ) {
        elem.attachEvent( "on" + type, eventHandler );
    } else {
        elem["on"+type]=eventHandler;
    }
    
    return elem;
}


// https://developer.mozilla.org/en-US/docs/Web/Events/resize
// Since resize events can fire at a high rate, the event handler 
// shouldn't execute computationally expensive operations such as 
// DOM modifications. Instead, it is recommended to throttle the event 
// using requestAnimationFrame, setTimeout or customEvent, as follows 
// [throttleEvent function]

function throttleEvent(type, name, obj) {
	obj = obj || window;
	var running = false;
	var func = function() {
		if (running) { return; }
		running = true;
		 window.requestAnimationFrame(function() {
			try {
				obj.dispatchEvent(new CustomEvent(name));
			} catch(e) {
				// for IE
				var evt = document.createEvent("CustomEvent");
				evt.initCustomEvent(name, true, false, {});
				document.documentElement.dispatchEvent(evt);
			}
			
			running = false;
		});
	};
	obj.addEventListener(type, func);
};

function throttleMouseEvent(type, name, obj) {
	obj = obj || window;
	var running = false;
	var func = function(origevt) {
		if (running) { return; }
		running = true;
		 window.requestAnimationFrame(function() {
			try {
				var evt = new CustomEvent(name, { "detail": {
					"target": origevt.target,
					"buttons": origevt.buttons,
					"pageX": origevt.pageX,
					"pageY": origevt.pageY,
					"layerX": origevt.layerX,
					"layerY": origevt.layerY,
					"clientX": origevt.clientX,
					"clientY": origevt.clientY
				}});
				obj.dispatchEvent(evt);
			} catch(err) {
				// for IE
				var evt = document.createEvent("CustomEvent");
				evt.initCustomEvent(name, true, false, { "detail": {
					"target": origevt.target,
					"buttons": origevt.buttons,
					"pageX": origevt.pageX,
					"pageY": origevt.pageY,
					"layerX": origevt.layerX,
					"layerY": origevt.layerY,
					"clientX": origevt.clientX,
					"clientY": origevt.clientY
				}});
				document.documentElement.dispatchEvent(evt);
			}
			
			running = false;
		});
	};
	obj.addEventListener(type, func);
};

function switchCSSClasses(elem_or_id, remove_class, add_class)
{
	var the_elem;
	
	if (typeof elem_or_id == "string") {
		the_elem  = document.getElementById(elem_or_id);
	} else {
		the_elem  = elem_or_id;
	}
	
	if (the_elem == null) {
		return;
	}
	
	if (the_elem.className.baseVal)
	{	
		if (the_elem.className.baseVal.indexOf(add_class) < 0 || add_class.length == 0)
		{
			the_elem.className.baseVal = the_elem.className.baseVal.replace(remove_class, '');
			the_elem.className.baseVal = the_elem.className.baseVal.trim();
			if (add_class != null && add_class.length > 0)
			{
				if (the_elem.className.baseVal.length > 0)
				{
					the_elem.className.baseVal += ' ' + add_class;
				}
				else
				{
					the_elem.className.baseVal = add_class;
				}
			}
		}
	}
	else
	{	
		if (the_elem.className.indexOf(add_class) < 0 || add_class.length == 0)
		{
			the_elem.className = the_elem.className.replace(remove_class, '');
			the_elem.className = the_elem.className.trim();
			if (add_class != null && add_class.length > 0)
			{
				if (the_elem.className.length > 0)
				{
					the_elem.className += ' ' + add_class;
				}
				else
				{
					the_elem.className = add_class;
				}
			}
		}
	}
	
}

/*
 * Jhey Tompmins, 2015
https://codeburst.io/throttling-and-debouncing-in-javascript-b01cad5c8edf
*/
// Generic throttling
/**
 * This function returns a throttled copy of input function.
 * @param {function} function to throttle
 * @param {limit} time limit
 * @returns {function } new throttled function.
 */ 
 
function makeThrottled(p_func, p_limit) {
  var lastFunc;
  var lastRan;
  return function() {
	var context = this;
	var args = arguments;
	if (!lastRan) {
		p_func.apply(context, args);
		lastRan = Date.now();
	} else {
		clearTimeout(lastFunc);
		lastFunc = setTimeout(function() {
			if ((Date.now() - lastRan) >= p_limit) {
				func.apply(context, args);
				lastRan = Date.now();
			}
		}, p_limit - (Date.now() - lastRan));
	}
  }
}

function showLoaderImg()
{
	var el = document.getElementById('loaderimg');	
	if (el)
	{
		el.style.display = '';
	}
}

function hideLoaderImg()
{
	var el = document.getElementById('loaderimg');	
	if (el)
	{
		el.style.display = 'none';
	}
}

function wopen(url, titulo) 
{
  window.open(
    url,
    titulo
  );
}

function hideshow_children_on_selected_classname(sel_elem_idlist, parent_elem_or_id, doshow)
{
	var invact, act, i, j, k, l, sel_classes=[], par_elem, selval, chld, splts, intsects, tmpel;
	
	if (doshow) {
		act = 'block';
		invact = 'none';
	} else {
		act = 'none';
		invact = 'block';
	}
		
	if (typeof parent_elem_or_id == "string") {
		par_elem  = document.getElementById(parent_elem_or_id);
	} else {
		par_elem  = parent_elem_or_id;
	}

	for (j=(sel_elem_idlist.length-1); j>=0; j--)
	{
		selval = selectedValue(sel_elem_idlist[j]); 
		if (selval.length > 0) {
			if (sel_classes.length < 1) {
				sel_classes.push('');
			}
			for (l=0; l<sel_classes.length; l++)
			{
				if (sel_classes[l].length > 0) {
					//sel_classes[l] = sel_classes[l] + '_' + selval;
					sel_classes[l] = selval + '_' + sel_classes[l];
					// console.log('a>'+sel_classes[l] + ',' + selval);
				} else {
					sel_classes[l] = selval;
					// console.log('b>'+selval);
				}	
			}
		} else if (j<(sel_elem_idlist.length-1)) { // não funciona para o último combo do conjunto
			var tmpel = document.getElementById(sel_elem_idlist[j]);
			if (tmpel)
			{
				if (sel_classes.length < 1) {
					for (k=0; k<tmpel.options.length; k++) 
					{				
						if (tmpel.options[k].value.length<1 || tmpel.options[k].style.display == 'none') {
							continue;
						}						
						sel_classes.push(tmpel.options[k].value);
						// console.log('c>'+tmpel.options[k].value+' disp:'+tmpel.options[k].display);
					}
				} else {
					for (l=0; l<sel_classes.length; l++)
					{
						for (k=0; k<tmpel.options.length; k++) 
						{				
							if (tmpel.options[k].value.length<1 || tmpel.options[k].style.display == 'none') {
								continue;
							}						
							if (sel_classes[l].length > 0) {
								sel_classes[l] = sel_classes[l] + '_' + tmpel.options[k].value;
								// console.log('d>'+sel_classes[l] + ',' + tmpel.options[k].value);
							} else {
								sel_classes[l] = tmpel.options[k].value;
								// console.log('e>'+tmpel.options[k].value);
							}			
						}
					}
				}
			}
		}
	}	
	//console.log(sel_classes);
	if (sel_classes.length > 0)
	{
		for (j=0; j<sel_classes.length; j++)
		{
			sel_classes[j] = "^"+sel_classes[j];
		}	
	}
		
	for (i=0; i<par_elem.childNodes.length; i++)
	{
		chld = par_elem.childNodes[i];
		if (isElement(chld) && chld.hasAttribute("class"))
		{
			if (chld.hasAttribute("class"))
			{
				splts = chld.getAttribute("class").split(/\s/);
				intsects = splts.intersect(sel_classes, (sel_classes.length > 0));
				if (intsects.length > 0) {
					chld.style.display = act;
				} else {
					chld.style.display = invact;
				}
			}
		}
	}
}


// obt�m o primeiro atributo valor encontrado em objectos "filhos"
function getAllChildValuesByClass(ascelem_or_id, classname, levels, outlist)
{
	var tmpnode, chld, i, ascendant;
	
	if (outlist == null) {
		if (typeof console != 'undefined') {
			console.log('getAllChildValuesByClass: outlist null, chamado de ' + arguments.callee.caller.toString());
		}		
		return;
	}	

	if (typeof ascelem_or_id == "string") {
		ascendant  = document.getElementById(ascelem_or_id);
	} else {
		ascendant  = ascelem_or_id;
	}

	if (!ascendant) return;

	if (typeof ascendant.childNodes == 'undefined') {
		return;
	}	
	
	var elems = document.getElementsByClassName(classname);
	//console.log('class:'+classname+', elems.length:'+elems.length+', levels:'+levels);
	
	for (i=0; i<elems.length; i++)
	{
		chld = elems[i];
		tmpnode = elems[i];
		count = 0;
		while (tmpnode != ascendant && count < levels) {
			tmpnode = tmpnode.parentNode;
			count++;
		}
		
		if (tmpnode != null && tmpnode == ascendant) {
			if (typeof chld.type != 'undefined' && chld.type == 'checkbox') {
				outlist.push(chld.checked);	
			}			
			else if (typeof chld.value != 'undefined') {
				outlist.push(chld.value);
			}
			else if (typeof chld.value != 'undefined') {
				outlist.push(chld.value);
			}
			else {
				outlist.push(chld.innerHTML.trim());
			}
			

		}
	}
}

function getValue(elem_or_id)
{
	var ret = null, elem;
    	if (typeof elem_or_id == "string") {
	    elem  = document.getElementById(elem_or_id);
	} else {
	    elem  = elem_or_id;
	}
	
	if (elem) {
	    if (typeof elem.type != 'undefined' && elem.type == 'checkbox') {
		ret = elem.checked;		
	    } else {
		ret = elem.value;
	    }
	}
	return ret;
}

function getValueById(theId)
{
	var ret = null, elem = document.getElementById(theId);
	if (elem) {
	    if (typeof elem.type != 'undefined' && elem.type == 'checkbox') {
		ret = elem.checked;		
	    } else {
		ret = elem.value;
	    }
	}
	return ret;
}


function toStringNullSafe(the_stringifiable_obj)
{
		if (the_stringifiable_obj == null) {
			return '';
		} else {
			return the_stringifiable_obj.toString();
		}
};

function currTimeStr(currentTime, with_secs)
{
  var ret;
  
  if (currentTime == null) {
	  if (with_secs) {
		  ret = '00:00:00';  
	  } else {
		  ret = '00:00';  
	  } 
  }
  else
  {
	  var currentHours = currentTime.getHours ( );
	  var currentMinutes = currentTime.getMinutes ( );
	  var currentSeconds = currentTime.getSeconds ( );
	
	  // Pad the minutes and seconds with leading zeros, if required
	  currentMinutes = ( currentMinutes < 10 ? "0" : "" ) + currentMinutes;
	  currentSeconds = ( currentSeconds < 10 ? "0" : "" ) + currentSeconds;
	
	  // Compose the string for display
	  var ret;
	  if (with_secs) {
		  ret = currentHours + ":" + currentMinutes + ":" + currentSeconds;
	  } else {
		  ret = currentHours + ":" + currentMinutes;
	  }
  }
  
  return ret;
}

function dateString2Date(dateString, p_doreverse) {
// format dd-MM-yyyy hh:mm:ss: p_reverse deverá ser truev
	var dtval;
	if (p_doreverse) {
		var dt  = dateString.split(/\-|\s/);
		dtval = new Date(dt.slice(0,3).reverse().join('-') + ' ' + dt[3]);
	} else {
		dtval = new Date(dateString);
	}
	
	if (isNaN(dtval.getTime())) {
		throw new Error("Invalid datestring:"+dateString+", to reverse:"+p_doreverse);
	}
		
	return dtval;
}

var KEYCODE_BKSPC = 8;
var KEYCODE_DEL = 46;

function getKeyCode(evt) {
	return (typeof evt.which == "number") ? evt.which : evt.keyCode;
}

function hasGenericDeleteKeyCode(evt) {
	var kc = getKeyCode(evt);
	return (kc == KEYCODE_BKSPC || kc == KEYCODE_DEL);
}


function fadeout(element, heartbeat, finalcallback) {
    var op = 1;  // initial opacity
    var timer = setInterval(function () {
        if (op <= 0.1){
            clearInterval(timer);
            element.style.display = 'none';
            if (finalcallback) {
				finalcallback();
			}
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, heartbeat);
    return timer;
}

function fadein(element) {
    var op = 0.1;  // initial opacity
    element.style.display = 'block';
    var timer = setInterval(function () {
        if (op >= 1){
            clearInterval(timer);
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * 0.1;
    }, 10);
}

// Polyfills / Shims
//======================================================================

if (!document.getElementsByClassName) {
    document.getElementsByClassName = function(classname) {
        var elArray = [];
        var tmp = document.getElementsByTagName("*");
        var regex = new RegExp("(^|\\s)" + classname + "(\\s|$)");
        for (var i = 0; i < tmp.length; i++)
        {
            if (regex.test(tmp[i].className)) {
                elArray.push(tmp[i]);
            }
        }
        return elArray;
    };
}


// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
if (!String.prototype.endsWith) {
	  String.prototype.endsWith = function(searchString, position) {
	      var subjectString = this.toString();
	      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
	        position = subjectString.length;
	      }
	      position -= searchString.length;
	      var lastIndex = subjectString.lastIndexOf(searchString, position);
	      return lastIndex !== -1 && lastIndex === position;
	  };
}

// https://developer.mozilla.org/pt-PT/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}

if (!String.prototype.trim) {
  (function() {
    // Make sure we trim BOM and NBSP
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    String.prototype.trim = function() {
      return this.replace(rtrim, '');
    };
  })();
}

String.prototype.objectType =
function() {
	return 'String';	  	  
 };

// http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format#4673436
// Code by "fearphage"
 if (!String.format) {
	  String.format = function(format) {
	    var args = Array.prototype.slice.call(arguments, 1);
	    return format.replace(/{(\d+)}/g, function(match, number) { 
	      return typeof args[number] != 'undefined'
	        ? args[number] 
	        : match
	      ;
	    });
	  };
}
 
if (!Object.create) {
    Object.create = function(o, properties) {
        if (typeof o !== 'object' && typeof o !== 'function') throw new TypeError('Object prototype may only be an Object: ' + o);
        else if (o === null) throw new Error("This browser's implementation of Object.create is a shim and doesn't support 'null' as the first argument.");

        if (typeof properties != 'undefined') throw new Error("This browser's implementation of Object.create is a shim and doesn't support a second argument.");

        function F() {}

        F.prototype = o;

        return new F();
    };
}

function extend(ChildClass, ParentClass) {
	ChildClass.prototype = new ParentClass();
	ChildClass.prototype.constructor = ChildClass;
}

if ( Object.id === undefined ) {
    var id = 0;

    Object.id = function(o) {
        if ( o.__uniqueid === undefined ) {
            Object.defineProperty(o, "__uniqueid", {
                value: ++id,
                enumerable: false,
                // This could go either way, depending on your 
                // interpretation of what an "id" is
                writable: false
            });
        }

        return o.__uniqueid;
    };
}

if (!Array.prototype.indexOf) {
   Array.prototype.indexOf = function(item) {
	  if (null == this) throw new TypeError('"this" is null or not defined');
      var i = this.length;
      while (i--) {
         if (this[i] === item) return i;
      }
      return -1;
   };
}

// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) 
{
	if (Object.defineProperty !== undefined) {
	  Object.defineProperty(Array.prototype, 'find', {
		value: function(predicate) {
		 // 1. Let O be ? ToObject(this value).
		  if (this == null) {
			throw new TypeError('"this" is null or not defined');
		  }

		  var o = Object(this);

		  // 2. Let len be ? ToLength(? Get(O, "length")).
		  var len = o.length >>> 0;

		  // 3. If IsCallable(predicate) is false, throw a TypeError exception.
		  if (typeof predicate !== 'function') {
			throw new TypeError('predicate must be a function');
		  }

		  // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
		  var thisArg = arguments[1];

		  // 5. Let k be 0.
		  var k = 0;

		  // 6. Repeat, while k < len
		  while (k < len) {
			// a. Let Pk be ! ToString(k).
			// b. Let kValue be ? Get(O, Pk).
			// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
			// d. If testResult is true, return kValue.
			var kValue = o[k];
			if (predicate.call(thisArg, kValue, k, o)) {
			  return kValue;
			}
			// e. Increase k by 1.
			k++;
		  }

		  // 7. Return undefined.
		  return undefined;
		}
	  });
	} else {
		Array.prototype.find = function (predicate, thisValue) {
			var arr = Object(this);
			if (typeof predicate !== 'function') {
				throw new TypeError();
			}
			for(var i=0; i < arr.length; i++) {
				if (i in arr) {  // skip holes
					var elem = arr[i];
					if (predicate.call(thisValue, elem, i, arr)) {
						return elem;  // (1)
					}
				}
			}
			return undefined;  // (2)
		}		
	}
}

if (!Array.prototype.filter) {
  Array.prototype.filter = function(fun/*, thisArg*/) {
    'use strict';

    if (this === void 0 || this === null) {
      throw new TypeError();
    }

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== 'function') {
      throw new TypeError();
    }

    var res = [];
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++) {
      if (i in t) {
        var val = t[i];

        // NOTE: Technically this should Object.defineProperty at
        //       the next index, as push can be affected by
        //       properties on Object.prototype and Array.prototype.
        //       But that method's new, and collisions should be
        //       rare, so use the more-compatible alternative.
        if (fun.call(thisArg, val, i, t)) {
          res.push(val);
        }
      }
    }

    return res;
  };
}

// Return new array with duplicate values removed
Array.prototype.unique =
  function() {
    var a = [];
    var l = this.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (this[i] === this[j])
          j = ++i;
      }
      a.push(this[i]);
    }
    return a;
  };

// useRE - other contém RE's'
Array.prototype.intersect =
  function(other, useRE) {
    var the_re, a1 = this;
    var a = [];
    var a2 = other;
    var l = a1.length;
    var l2 = a2.length;
    for(var i=0; i<l; i++) 
    {
	    for(var j=0; j<l2; j++) 
	    {
	    	if (useRE) {
	    		the_re = new RegExp(a2[j]);
				if (the_re.test(a1[i])) {
					a.push(a1[i]);
				}
    		} else {
		      if (a1[i] === a2[j]) {
			    	a.push(a1[i]);
			  }
    		}
	    }
    }
    a1 = a;
    return a.unique();
};

 
Array.prototype.differenceFrom =
function(other) {
	//var a=[], 
	var diff=[];
    //var a1 = this;
    for(var i=0;i<other.length;i++) {
		if (this.indexOf(other[i]) < 0 && diff.indexOf(other[i]) < 0) {
			diff.push(other[i]);
		}		
	}	
	return diff;	  	  
 };

Array.prototype.remove =
function(p_elem) {
	var index = this.indexOf(p_elem);
	if (index > -1) {
	  this.splice(index, 1);
	}  	  
 };
 
//https://tc39.github.io/ecma262/#sec-array.prototype.includes
 if (!Array.prototype.includes) {
	if (Object.defineProperty !== undefined) {
	   Object.defineProperty(Array.prototype, 'includes', {
		 value: function(searchElement, fromIndex) {

		   // 1. Let O be ? ToObject(this value).
		   if (this == null) {
			 throw new TypeError('"this" is null or not defined');
		   }

		   var o = Object(this);

		   // 2. Let len be ? ToLength(? Get(O, "length")).
		   var len = o.length >>> 0;

		   // 3. If len is 0, return false.
		   if (len === 0) {
			 return false;
		   }

		   // 4. Let n be ? ToInteger(fromIndex).
		   //    (If fromIndex is undefined, this step produces the value 0.)
		   var n = fromIndex | 0;

		   // 5. If n ≥ 0, then
		   //  a. Let k be n.
		   // 6. Else n < 0,
		   //  a. Let k be len + n.
		   //  b. If k < 0, let k be 0.
		   var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

		   // 7. Repeat, while k < len
		   while (k < len) {
			 // a. Let elementK be the result of ? Get(O, ! ToString(k)).
			 // b. If SameValueZero(searchElement, elementK) is true, return true.
			 // c. Increase k by 1.
			 // NOTE: === provides the correct "SameValueZero" comparison needed here.
			 if (o[k] === searchElement) {
			   return true;
			 }
			 k++;
		   }

		   // 8. Return false
		   return false;
		 }
	   });
	}
 }

 Array.prototype.includedIn = 
   function(other) {
	if (other == null) {
		return false;
	}
 	var ret = false;
 	var i = 0;
 	while (typeof this[i] != 'undefined') {
 		if (other.indexOf(this[i]) < 0) {
 			ret = false;
 			break;
 		} else {
 			ret = true;
 		}
 		i++;
 	}
 	return ret;
}
 
Array.prototype.objectType =
function() {
	return 'Array';	  	  
 };


// -- Estraga os ciclos for (var xx in dictobj) ...
//if (typeof NO_OBJECT_TYPE == 'undefined' || !NO_OBJECT_TYPE) {
//	Object.prototype.objectType =
//	function() {
//		return 'Object';	  	  
//	 };
// }
 
Number.prototype.objectType = function() {
	return 'Number';	  	  
 };

 //devolve 'object' para um dicionário
function getObjectType(inst) {
	var ret;
	
	if (inst==null) {
		ret = 'None';
	} else if (typeof inst.objectType != 'undefined') {
		ret = inst.objectType();
	} else {
		ret = typeof inst;
	}
		
	return ret;
}

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return JSON.stringify(obj) === JSON.stringify({});
}

/**
 * Fast UUID generator, RFC4122 version 4 compliant.
 * @author Jeff Ward (jcward.com).
 * @license MIT license
 * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
 **/
var UUID = (function() {
  var self = {};
  var lut = []; for (var i=0; i<256; i++) { lut[i] = (i<16?'0':'')+(i).toString(16); }
  self.generate = function() {
    var d0 = Math.random()*0xffffffff|0;
    var d1 = Math.random()*0xffffffff|0;
    var d2 = Math.random()*0xffffffff|0;
    var d3 = Math.random()*0xffffffff|0;
    return lut[d0&0xff]+lut[d0>>8&0xff]+lut[d0>>16&0xff]+lut[d0>>24&0xff]+'-'+
      lut[d1&0xff]+lut[d1>>8&0xff]+'-'+lut[d1>>16&0x0f|0x40]+lut[d1>>24&0xff]+'-'+
      lut[d2&0x3f|0x80]+lut[d2>>8&0xff]+'-'+lut[d2>>16&0xff]+lut[d2>>24&0xff]+
      lut[d3&0xff]+lut[d3>>8&0xff]+lut[d3>>16&0xff]+lut[d3>>24&0xff];
  }
  return self;
})();


/* de Quentin@stackoverflow 
 */
function parse_query_string(query, out_query_obj) {
  var vars = query.toLowerCase().split("&");

  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    var key = pair[0].toLowerCase();
    // If first entry with this name
    if (typeof out_query_obj[key] === "undefined") {
      out_query_obj[key] = decodeURIComponent(pair[1]);
      // If second entry with this name
    } else if (typeof out_query_obj[key] === "string") {
      var arr = [out_query_obj[key], decodeURIComponent(pair[1])];
      out_query_obj[key] = arr;
      // If third or later entry with this name
    } else {
      out_query_obj[key].push(decodeURIComponent(pair[1]));
    }
  }
}

// Widget manipulation
function activateTab(evt, tabctrlId, tabName, opt_targetelem) {
	
	// Controle das tabs (cabeçalho) -- div con classe CSS 'tabctrl'
	// Botões dentro do cabeçalho -- button ou outros com class CSS ''tablinks', onclick a chamar esta função
	// Tabs propriament ditos -- divs com classe CSS 'tabctrl-content' e id = 'tab' + identificador do tab

    var i, tabcontent, tablinks;
    
    el = document.getElementById(tabctrlId);
    if (el) {

		// Get all elements with class="tabcontent" and hide them
		tabcontent = el.getElementsByClassName("tabctrl-content");

		for (i = 0; i < tabcontent.length; i++) {
			tabcontent[i].style.display = "none";
		}

		// Get all elements with class="tablinks" and remove the class "active"
		tablinks = el.getElementsByClassName("tablinks");
		for (i = 0; i < tablinks.length; i++) {
			unsetClass(tablinks[i]," active");
		}

		// Show the current tab, and add an "active" class to the button that opened the tab
		document.getElementById('tab'+tabName).style.display = "block";
		if (evt != null) {
			setClass(evt.currentTarget, "active");
		} else {
			setClass(opt_targetelem, "active");
		}
	}
} 

function offsetRect(el) {
	    var rect = el.getBoundingClientRect(),
	    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
	    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
	    return { top: rect.top + scrollTop, left: rect.left + scrollLeft, 
				width: rect.width, height: rect.height, 
				bottom: rect.top + scrollTop + rect.height, 
				right: rect.left + scrollLeft + rect.width }
}
	
function copyToClipboard(data) {
		data += '';
		var IE=window.external&&(navigator.platform=="Win32"||(window.ScriptEngine&&ScriptEngine().indexOf("InScript")+1));
		var FF=navigator.userAgent.toLowerCase();
		var GC=(FF.indexOf("chrome")+1)?true:false;
		var FF=(FF.indexOf("firefox")+1)?true:false;
		var OP=window.opera&&window.print;
		var NS=window.netscape&&!OP;
		
		if(window.clipboardData||NS){
			if(IE&&!FF){
				if(!window.clipboardData.setData("Text",data)){
					alert("Text was not copied to clipboard!");
					return false
				}
			}else{
				try{
					netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect")
				}catch(e){
					console.error("Text was not copied to clipboard!");
				}
				
				try{
					e=Components.classes["@mozilla.org/widget/clipboard;1"].createInstance(Components.interfaces.nsIClipboard)
				}catch(e){
					return false
				}
				try{
					b=Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable)
				}catch(e){
					return false
				}
				b.addDataFlavor("text/unicode");
				o=Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
				o.data=data;
				b.setTransferData("text/unicode",o,data.length*2);
				try{
					t=Components.interfaces.nsIClipboard
				} catch(e){
					return false
				}
				e.setData(b,null,t.kGlobalClipboard)
			}
		} else {
			console.error("Your browser doesn't support copy to clipboard feature.");
			return false
		}
		return false;
}

/*
function diffDays(d1, d2) {
	let diffTime = Math.abs(d2.getTime() - d1.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
} */

/* Diferença em períodos móveis de 24 horas. 
 * Para o caso da diferença ser inferior a 24 horas, é testado se a data
 * é efetivamente a mesma, em caso negativo o valor retornado é um em
 * vez de zero.
 **/
function diffDays(d1, d2) {
	let diffTime = Math.abs(d2.getTime() - d1.getTime());
	let diffa, diffb = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
	diffa = diffb;
	if (diffb < 1) {
		if (d2.getDate() != d1.getDate()) {
			diffa = 1;
		}
	}

	return diffa;
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
  Object.keys = (function() {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}

// polyfill bind() (MDN)
// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
	  Function.prototype.bind = function(oThis) {
	    if (typeof this !== 'function') {
	      // closest thing possible to the ECMAScript 5
	      // internal IsCallable function
	      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
	    }

	    var aArgs   = Array.prototype.slice.call(arguments, 1),
	        fToBind = this,
	        fNOP    = function() {},
	        fBound  = function() {
	          return fToBind.apply(this instanceof fNOP
	                 ? this
	                 : oThis,
	                 aArgs.concat(Array.prototype.slice.call(arguments)));
	        };

	    if (this.prototype) {
	      // Function.prototype doesn't have a prototype property
	      fNOP.prototype = this.prototype; 
	    }
	    fBound.prototype = new fNOP();

	    return fBound;
	  };
}

// @function getWheelDelta(ev: DOMEvent): Number
// Gets normalized wheel delta from a mousewheel DOM event, in vertical
// pixels scrolled (negative if scrolling down).
// Events from pointing devices without precise scrolling are mapped to
// a best guess of 60 pixels -- Leaflet.JS

var wheelPxFactor = (isWin && isChrome) ? 2 * window.devicePixelRatio :
	isFirefox ? window.devicePixelRatio : 1;
 
function getWheelDelta(e) {
	return (isEdge) ? e.wheelDeltaY / 2 : // Don't trust window-geometry-based delta
	       (e.deltaY && e.deltaMode === 0) ? -e.deltaY / wheelPxFactor : // Pixels
	       (e.deltaY && e.deltaMode === 1) ? -e.deltaY * 20 : // Lines
	       (e.deltaY && e.deltaMode === 2) ? -e.deltaY * 60 : // Pages
	       (e.deltaX || e.deltaZ) ? 0 :	// Skip horizontal/depth wheel events
	       e.wheelDelta ? (e.wheelDeltaY || e.wheelDelta) / 2 : // Legacy IE pixels
	       (e.detail && Math.abs(e.detail) < 32765) ? -e.detail * 20 : // Legacy Moz lines
	       e.detail ? e.detail / -32765 * 60 : // Legacy Moz pages
	       0;
}

MOUSE_WHEEL_SENSITIVITY = 1.0;
// creates a global "addWheelListener" method
// example: addWheelListener( elem, function( e ) { console.log( e.deltaY ); e.preventDefault(); } );
(function(window,document) {

    var prefix = "", _addEventListener, onwheel, support;

    // detect event model
    if ( window.addEventListener ) {
        _addEventListener = "addEventListener";
    } else {
        _addEventListener = "attachEvent";
        prefix = "on";
    }

    // detect available wheel event
    support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
              document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
              "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox
    
    window.addWheelListener = function( elem, callback, useCapture ) {
        _addWheelListener( elem, support, callback, useCapture );

        // handle MozMousePixelScroll in older Firefox
        if( support == "DOMMouseScroll" ) {
            _addWheelListener( elem, "MozMousePixelScroll", callback, useCapture );
        }
    };

    function _addWheelListener( elem, eventName, callback, useCapture ) {
        elem[ _addEventListener ]( prefix + eventName, support == "wheel" ? callback : function( originalEvent ) {
        	
            !originalEvent && ( originalEvent = window.event );

            // create a normalized event object
            var event = {
                // keep a ref to the original event object
                originalEvent: originalEvent,
                target: originalEvent.target || originalEvent.srcElement,
                type: "wheel",
                deltaMode: originalEvent.type == "MozMousePixelScroll" ? 0 : 1,
                deltaX: 0,
                deltaZ: 0,
                pageX: originalEvent.pageX,
                pageY: originalEvent.pageY,
                preventDefault: function() {
                    originalEvent.preventDefault ?
                        originalEvent.preventDefault() :
                        originalEvent.returnValue = false;
                }
            };
            
            // calculate deltaY (and deltaX) according to the event
            if ( support == "mousewheel" ) {
                event.deltaY = - MOUSE_WHEEL_SENSITIVITY * originalEvent.wheelDelta;
                // Webkit also support wheelDeltaX
                originalEvent.wheelDeltaX && ( event.deltaX = - MOUSE_WHEEL_SENSITIVITY * originalEvent.wheelDeltaX );
            } else {
                event.deltaY = originalEvent.detail;
            }
            
            // it's time to fire the callback
            return callback( event );

        }, useCapture || false );
    }

})(window,document);


// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

function CallSequence(p_activate) {
	this.active = false;
	this.method = "";
	this.function_invocations = {};
	this.function_messages = {};
	this.sequence = [];
	this.activate = function() {
		this.active = true;
	}
	if (p_activate) {
		this.activate();
	}
	this.clear = function() {
		if (!this.active) {
			return;
		}
		this.method = "";
		this.function_invocations = {};
		this.sequence.length = 0;
	};
	this.init = function(p_method) {
		if (!this.active) {
			return;
		}
		this.clear();
		this.method = p_method;
	};
	this.rollout = function(opt_doclear) {
		if (!this.active) {
			return;
		}
		if (this.sequence.length < 1) {
			return;
		}
		console.log("");
		console.log("*****************************************");
		console.log("** Calling Sequence                    **");
		console.log("*****************************************");
		console.log(String.format("*  method: {0}", this.method));
		console.log("*");
		var fname, tstr, seq;
		for (var i=0; i<this.sequence.length; i++) {
			fname = this.sequence[i][0];
			tstr = this.sequence[i][2].toISOString().slice(11,23);
			seq = formatPaddingDigits(i,'0',2);
			console.log(String.format("{0}, {1}: >> calling {2}{3}",seq,tstr,fname,JSON.stringify(this.sequence[i][1], null, 2)));
			for (var j=0; j<this.function_messages[fname].length; j++) {
				tstr = this.function_messages[fname][j][1].toISOString().slice(11,23);
				console.log(String.format("    {0} {1}",tstr,this.function_messages[fname][j][0]));
			}
		}
		console.log("*****************************************");
		if (opt_doclear) {
			this.clear();
		}
	};
	this.calling = function(p_fname, p_args, p_caller) {
		var full_fname, invocation_count = 0;
		if (!this.active) {
			return;
		}
		if (this.method.length < 1) {
			throw new Error("CallSequence.calling error, object not inited.");
		}
		if (this.function_invocations[p_fname] !== undefined && this.function_invocations[p_fname] != null) {
			invocation_count = this.function_invocations[p_fname];
		}
		invocation_count++;
		this.function_invocations[p_fname] = invocation_count;
		full_fname = String.format("{0}_{1}", p_fname, formatPaddingDigits(invocation_count,'0',2))
		this.sequence.push([full_fname, p_args, new Date()]);
		this.function_messages[full_fname] = [];
		return invocation_count;
	};
	this.addMsg = function(p_fname, p_invocation, p_msg) {
		var full_fname;
		if (!this.active) {
			return;
		}
		full_fname = String.format("{0}_{1}", p_fname, formatPaddingDigits(p_invocation,'0',2))
		if (this.function_messages[full_fname] === undefined) {
			throw new Error(String.format("CallSequence.addMsg: function '{0}', invocation {1}, not found", p_fname, p_invocation));
		}
		this.function_messages[full_fname].push([p_msg, new Date()]);
	}
};
