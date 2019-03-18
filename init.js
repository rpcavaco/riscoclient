

// localizar2 REV 18

var DO_LOG = false;

//var GLOBAL_MOUSE_CLICK_PT = [];
var GLOBAL_MOUSE_CLICK = {
	terrain: [],
	clear: function() {
		this.terrain.length = 0;
	},
	isSet: function() {
		ret = false;
		if (this.terrain.length > 0) {
			ret = true;
		}
		return ret;
	}
}

// Nova config
var ZOOMTONP_SCALE = 500;  // Escala para zoom ao NP
var HIGHLIGHT_INSIDE_QUOT = 0.8;  // Quociente de encolhimento do envelope do mapa para testar se o display de um ponto precisa de panning

var TIMEDMESSAGE_TIMEOUT = 6000;
var MSGBOX_WIDTHS = {'min': 300, 'max': 600};


var AJAX_ENDPOINTS = {
	//"SAVE": "c/savelocation",
	"GET": "c/getrec",
	"SAVE": "c/save",
	"DEL": "c/dellocation",
	"QRY": "c/lq"
}

// var GETREC_ENDPOINT = "c/lq"

var PICKLOCATION_SCALELIMITS = {
	"min": -1,
	"max": 2000
}


var TRANSMIT_OBJECT = {};

var DO_TEST = false;

var FADEOUT_HEARTBEAT_MS = 50;

var TOGGLE_RASTERSELECTOR = false;

/*
 * Layer mouse events */

function clearTransmitAndPrevloc() {
	
	TRANSMIT_OBJECT = {"backend": {}, "loc":[]};		
	PREVLOCJSONTREE = { "loc":[] }
} 
								
var MessagesController = {
	
	// Constantes
	elemid: "msgsdiv",
	minwidth: 300,
	maxwidth: 550,
	messageTimeout: 5500,
	charwidth: 10,
	minheight: 80,
	
	messageText: "",
	width: 0,
	height: 0,
	isvisible: false,
	timer: null,
	fadertimer: null,
		
	reshape: function(p_paragraph_height) {
		if (!this.isvisible) {
			return;
		}
		this.reshape_count++;

		var winsize = {
			width: window.innerWidth || document.body.clientWidth,
			height: window.innerHeight || document.body.clientHeight,
		};
		if (winsize.width < (2.8 * this.minwidth)) {
			this.width = this.minwidth;
		} else {
			this.width = this.maxwidth;
		}
		this.top = 100;
		var totlen = this.messageText.length * this.charwidth;
		this.left = (winsize.width - this.width) / 2.0;
		var msgsdiv = document.getElementById(this.elemid);
		
		this.height = p_paragraph_height + 32;
		
		if (this.height < this.minheight) {
			this.height = this.minheight;
		}
		
		msgsdiv.style.width = this.width + 'px';
		msgsdiv.style.height = this.height + 'px';
		msgsdiv.style.top = this.top + 'px';
		msgsdiv.style.left = this.left + 'px';
		
	},
	
	
	setMessage: function(p_msg_txt, p_is_timed, p_is_warning) {
		this.messageText = p_msg_txt;
		var iconimg=null, msgsdiv = document.getElementById(this.elemid);

		if (msgsdiv!=null) {

			if (this.timer != null) {
				clearTimeout(this.timer);
				this.timer = null;
			}
			if (this.fadertimer != null) {
				clearTimeout(this.fadertimer);
				this.fadertimer = null;
			}

			while (msgsdiv.firstChild) {
				msgsdiv.removeChild(msgsdiv.firstChild);
			}			
			iconimg = document.createElement("img");
			if (p_is_warning) {
				iconimg.src = "img/warning-5-32.png";
			} else {
				iconimg.src = "img/info-3-32.png";
			}

			msgsdiv.appendChild(iconimg);
			
			var p = document.createElement("p");
			p.insertAdjacentHTML('afterbegin',this.messageText);
			//var cont = document.createTextNode(this.messageText);
			//p.appendChild(cont);
			msgsdiv.appendChild(p);
			
			msgsdiv.style.display = '';
			msgsdiv.style.opacity = 1;
			this.isvisible = true;
		} else {
			if (this.timer != null) {
				clearTimeout(this.timer);
				this.timer = null;
			}
			if (this.fadertimer != null) {
				clearTimeout(this.fadertimer);
				this.fadertimer = null;
			}
		}
		this.reshape(p.clientHeight);

		if (p_is_timed) {
			this.timer = setTimeout(function() { MessagesController.hideMessage(true); }, this.messageTimeout);
		}
	},
	
	hideMessage: function(do_fadeout) {
		
		if (!this.isvisible) {
			return;
		}
		this.timer = null;
		var msgsdiv = document.getElementById(this.elemid);
		this.isvisible = false;
		if (do_fadeout) 
		{
			this.fadertimer = fadeout(msgsdiv, FADEOUT_HEARTBEAT_MS);
		} 
		else 
		{
			if (msgsdiv!=null) {
				msgsdiv.style.display = 'none';
			}
		}
	}  	
}

function checkInteropParams() {
	
	var ret = false;
	
	if ((window.location.search.indexOf("appid") >= 0 || window.location.search.indexOf("appId") >= 0) && window.location.search.indexOf("storeid") >= 0) {
		var urlstr = window.location.search.substring(1);
		the_query = {};
		parse_query_string(urlstr, the_query);
		if (the_query.appid != "#NOAPP#" && the_query.storeid != '-1') {
			ret = true;
		}
	}
	
	return ret;
}

function checkEditingViability() {
	
	var ret = false;
	
	if ((window.location.search.indexOf("appid") >= 0 || window.location.search.indexOf("appId") >= 0) 
			&& window.location.search.indexOf("storeid") >= 0
			&& window.location.search.indexOf("edit") >= 0) 
	{
		var urlstr = window.location.search.substring(1);
		the_query = {};
		parse_query_string(urlstr, the_query);
		if (the_query.appid != "#NOAPP#" && the_query.storeid != '-1' && the_query.edit=="true") {
			ret = true;
		}
	}
	
	return ret;
}

function sizeWidgets() 
{
	var winsize = {
		width: window.innerWidth || document.body.clientWidth,
		height: window.innerHeight || document.body.clientHeight,
	};
	var minified_boxes = false;
	
	MessagesController.reshape();

	var wdg1, wdg2, wdg3, wdg = document.getElementById("inputbox");
	if (wdg) {

		if (parseInt(winsize.width) > 1200) {
			wdg.style.width = '450px';
		} else if (parseInt(winsize.width) > 530) {
			wdg.style.width = '350px';
		} else if (parseInt(winsize.width) > 430) {
			wdg.style.width = '265px';
		} else {
			wdg.style.width = '180px';	
		}
	}

	wdg = document.getElementById("acselresult_geocode");
	if (wdg) {
		if (parseInt(winsize.width) > 1200) {
			console.log("A");
			wdg.style.fontSize = '14px';
			wdg.style.width = '450px';
		} else if (parseInt(winsize.width) > 600) {
			console.log("B");
			wdg.style.fontSize = '12px';
			wdg.style.width = '350px';
		} else if (parseInt(winsize.width) > 430) {
			console.log("C");
			wdg.style.fontSize = '11px';
			wdg.style.width = '265px';
		} else {
			console.log("D");
			wdg.style.fontSize = '10px';
			wdg.style.width = '180px';	
		}
	}
	
	wdg = document.getElementById("showresultarea");	
	if (wdg) 
	{
		var sra_editheight = '215px';
		var sra_height = '175px';
		minified_boxes = false;

		wdg1 = document.getElementById("frac_cell");
		wdg2 = document.getElementById("cod_postal4_cell");
		wdg3 = document.getElementById("cod_postal3_cell");

		if (parseInt(winsize.width) > 1200) {
			wdg.style.fontSize = '14px';
			wdg.style.width = '420px';
			if (checkInteropParams()) {
				wdg.style.height = sra_editheight;
			} else {
				wdg.style.height = sra_height;
			}
		} else if (parseInt(winsize.width) > 600) {
			
			wdg.style.fontSize = '12px';
			wdg.style.width = '333px';
			if (checkInteropParams()) {
				wdg.style.height = sra_editheight;
			} else {
				wdg.style.height = sra_height;
			}
			
			if (wdg1) {
				minified_boxes = true;
				wdg1.style.height = '18px';
				wdg1.style.fontSize = '10px';
			}
			if (wdg2) {
				minified_boxes = true;
				wdg2.style.height = '18px';
				wdg2.style.fontSize = '10px';
			}
			if (wdg3) {
				minified_boxes = true;
				wdg3.style.height = '18px';
				wdg3.style.fontSize = '10px';
			}

		} else {
			wdg.style.fontSize = '11px';
			wdg.style.width = '270px';	
			if (checkInteropParams()) {
				wdg.style.height = sra_editheight;
			} else {
				wdg.style.height = sra_height;
			}
			
			if (wdg1) {
				minified_boxes = true;
				wdg1.style.height = '18px';
				wdg1.style.fontSize = '10px';
			}
			if (wdg2) {
				minified_boxes = true;
				wdg2.style.height = '18px';
				wdg2.style.fontSize = '10px';
			}
			if (wdg3) {
				minified_boxes = true;
				wdg3.style.height = '18px';
				wdg3.style.fontSize = '10px';
			}

		}
		
		if (!minified_boxes) {
			
			if (wdg1) {
				wdg1.style.height = '20px';
				wdg1.style.fontSize = '12px';
			}
			if (wdg2) {
				wdg2.style.height = '20px';
				wdg2.style.fontSize = '12px';
			}
			if (wdg3) {
				wdg3.style.height = '20px';
				wdg3.style.fontSize = '12px';
			}			
		}
	}

	wdg = document.getElementById("indicators");
	if (wdg) 
	{
		wdg1 = document.getElementById("sclvaldiv");
		wdg2 = document.getElementById("mouseposdiv");
		minified_boxes = false;
		if (parseInt(winsize.width) > 700) 
		{
			if (wdg.style.display == 'none') {
				wdg.style.display = '';
			}
			wdg.style.top = '20px';	
			wdg.style.right = '40px';	
					
		} else if (parseInt(winsize.width) > 490) {

			if (wdg.style.display == 'none') {
				wdg.style.display = '';
			}
			wdg.style.top = '60px';	
			wdg.style.right = '4px';
			if (wdg1) {
				minified_boxes = true;
				wdg1.style.width = '108px';
				wdg1.style.fontSize = '10px';
			}
			if (wdg2) {
				minified_boxes = true;
				wdg2.style.width = '108px';
				wdg2.style.fontSize = '10px';
			}

		} else {
			
			wdg.style.display = 'none';	

		}
		
		if (!minified_boxes) {
			
			if (wdg1) {
				wdg1.style.width = '125px';
				wdg1.style.fontSize = '12px';
			}
			if (wdg2) {
				wdg2.style.width = '125px';
				wdg2.style.fontSize = '12px';
			}
			
		}
		
	}

	wdg = document.getElementById("cleansearchbtn");	
	if (wdg) 
	{

		if (parseInt(winsize.width) > 490) {
			wdg.style.fontSize = '16px';
			wdg.style.width = '90px';
		} else {
			wdg.style.fontSize = '14px';
			wdg.style.width = '40px';	
		}		
		
	}

	wdg = document.getElementById("mapctrl_minimalcontrols");	
	if (wdg) 
	{

		if (parseInt(winsize.width) > 490) {
			wdg.style.left = '20px';
		} else {
			wdg.style.left = '4px';
		}		
		
	}
	
	wdg = document.getElementById("content");	
	if (wdg) 
	{

		if (parseInt(winsize.width) > 490) {
			wdg.style.left = '65px';
		} else {
			wdg.style.left = '40px';
		}		
		
	}
	
	wdg = document.getElementById("showresultarea");	
	if (wdg) 
	{

		if (parseInt(winsize.width) > 490) {
			wdg.style.left = '65px';
		} else {
			wdg.style.left = '40px';
		}		
		
	}	
	
	wdg = document.getElementById("dosave");	
	if (wdg) 
	{

		if (parseInt(winsize.width) > 490) {
			wdg.style.left = '65px';
		} else {
			wdg.style.left = '40px';
		}		
		
	}	
}

function activateVisrasterWdg(p_datakey) {
	
	var wdg_name = "visraster_" + p_datakey;
	var wdg = document.getElementById(wdg_name);
	if (wdg) {
		switchCSSClasses(wdg, '', 'btn-0-pressed');
	}
}

function clickVisraster(p_datakey) {
	
	activateVisrasterWdg(p_datakey)
	
	for (var kval in rasterSourceChange.datasource_references) {
		if (p_datakey == kval) {
			continue;
		}
		if (rasterSourceChange.datasource_references.hasOwnProperty(kval)) {
			wdg_name = "visraster_" + kval;
			switchCSSClasses(wdg_name, 'btn-0-pressed', '');
		}
		switchCSSClasses('choosevector', 'btn-0-pressed', '');

	}
		
	MAPCTRL.setBackgroundRasterLyrName(p_datakey);
	
	rasterSourceChange.setSourceTag(p_datakey);
	// N˜ao deixar sobrepor vetores
	//MAPCTRL.muteVectors(true);

	MAPCTRL.refresh();

}

var rasterSourceChange = { 
	
	lastHigherScaleSrckey: "VECTOR",
	scaleLimit: 10000,

	datasource_references: {
		"CART18": "PT-TM06 CMP 2018",
		"CART98": "Datum73 CMP 1998",
		"IMG16": "Datum73 AGOL Portugal Imagery",
		"OSM": "Datum73 OpenStreetMap",
		"ORTO00": "Datum73 Porto 2001",
		"ORTO05": "Datum73 CMP 2005",
		"ORTO08": "Datum73 Aguas do Porto",
		"ORTOADP": "Datum73 Aguas Douro e Paiva",
		"VECTOR": "Datum73 Base Carto. CMP",
	},
	
	//smallScaleSources: ["OSM"],
	
	setSourceTag: function(srcKey) {
		
		var srcstr = this.datasource_references[srcKey];
		
		if (typeof srcstr == 'undefined') {
			srcstr = this.datasource_references["VECTOR"];
			//MAPCTRL.muteVectors(false);
		//} else {
			//MAPCTRL.muteVectors(srcKey!="VECTOR" && MAPCTRL.small_scale_source != srcKey);
		}
		
		if (typeof srcstr == 'undefined') {
			srcstr = "";
		}
		
		var stobj = document.getElementById("sourcetag");
		if (stobj) {
			stobj.style.visibility = "visible";
			stobj.innerHTML = "RISCO .. " + srcstr;
		}
		
		if (MAPCTRL.small_scale_source != srcKey) {
			this.lastHigherScaleSrckey = srcKey;
		}
	},

	checkZIndexes: function(the_map) {
		
		var stobj = document.getElementById("sourcetag");
		if (stobj) {
			stobj.style.zIndex = the_map.getMaxZIndex() + 1;
		}
		var robj = document.getElementById("visctrl");
		if (robj) {
			robj.style.zIndex = the_map.getMaxZIndex() + 1;
		}
		robj = document.getElementById("toolctrl");
		if (robj) {
			robj.style.zIndex = the_map.getMaxZIndex() + 1;
		}
	},

	checkRastersAreVisible: function(the_map) 
	{			
		rasterSourceChange.checkZIndexes(the_map);
		
		var lc = the_map.getLayerConfig(MAPCTRL.small_scale_source);
		if (lc && lc.scalelimits) {
			rasterSourceChange.scaleLimit = lc.scalelimits.bottom;
		}

		var rlayers = [];
		the_map.getBackgroundRasterLyrNames(rlayers);
		var robj = document.getElementById("visctrl");

		if (the_map.getScale() >= rasterSourceChange.scaleLimit) 
		{
			if (MAPCTRL.small_scale_source !== undefined && MAPCTRL.small_scale_source != null && rlayers.indexOf(MAPCTRL.small_scale_source) < 0) {
				the_map.setBackgroundRasterLyrName(MAPCTRL.small_scale_source);
				rasterSourceChange.setSourceTag(MAPCTRL.small_scale_source);
				if (robj)  {
					robj.style.visibility = 'hidden';
				}
			}
		}
		else 
		{
			if (rlayers.indexOf(MAPCTRL.small_scale_source) >= 0) 
			{
				if (robj) {
					robj.style.visibility = 'visible';
				}

				rasterSourceChange.setSourceTag(rasterSourceChange.lastHigherScaleSrckey);

				if (rasterSourceChange.lastHigherScaleSrckey != null && rasterSourceChange.lastHigherScaleSrckey != "VECTOR") {
					the_map.setBackgroundRasterLyrName(rasterSourceChange.lastHigherScaleSrckey);
					if (robj) 
					{
						if (the_map.checkLayerScaleDepVisibility(rasterSourceChange.lastHigherScaleSrckey)) {
							if (robj) {
								robj.style.visibility = 'visible';
							}
							rasterSourceChange.setSourceTag(rasterSourceChange.lastHigherScaleSrckey);
						} else {
							if (robj) {
								robj.style.visibility = 'hidden';
							}
							rasterSourceChange.setSourceTag("VECTOR");
							rasterSourceChange.lastHigherScaleSrckey = "VECTOR";
						}
					}
				}
			}
			else
			{
				if (rasterSourceChange.lastHigherScaleSrckey != null && rasterSourceChange.lastHigherScaleSrckey != "VECTOR") {

					if (the_map.checkLayerScaleDepVisibility(rasterSourceChange.lastHigherScaleSrckey)) {
						rasterSourceChange.setSourceTag(rasterSourceChange.lastHigherScaleSrckey);
					} else {
						rasterSourceChange.setSourceTag("VECTOR");
						this.lastHigherScaleSrckey = "VECTOR";
					}
				}
			}
		}
		
	}
};

function fetchRecordFromServer(ret_flags, ret_obj) {

	var query = window.location.search.substring(1);
	var qry_obj = {};
	var appId, storeId;
	ret_flags.length = 0;
	
	// flags: primeira - query string items presentes,
	//		segunda: registo obtido do servidor
	
	var regex1 = RegExp('PREVLOCJSONTREE = (\\[.*\\])[\\s]?$');

	
	parse_query_string(query, qry_obj);
	
	if (qry_obj["appid"] !== undefined && qry_obj["appid"] != null) {
		appId = qry_obj["appid"];
	} else {
		ret_flags.push(false);
		ret_flags.push(false);
		return;
	}
	
	if (qry_obj["storeid"] !== undefined && qry_obj["storeid"] != null) {
		storeId = qry_obj["storeid"];
	} else {
		ret_flags.push(false);
		ret_flags.push(false);
		return;
	}

	if (appId && appId.length > 0 && storeId && storeId.length > 0) {
		if (appId == "#NOAPP#" || storeId == "-1") {
			ret_flags.push(true);
			ret_flags.push(false);
			return;
		}
	}

	ret_flags.push(true);
	ret_flags.push(true);
	
	var urlstr = String.format("{0}?appid={1}&storeid={2}", AJAX_ENDPOINTS["GET"], appId, storeId);
	
	ajaxSender(urlstr,
		function () {
			var show_returned_values, parr, has_refreshed=false, read_recs, resp;
			if (this.readyState === this.DONE)
			{
				if (this.status == 200)
				{
					resp = this.responseText;
					parr = regex1.exec(resp);
					if (parr != null && parr.length > 0)
					{	
						read_recs = JSON.parse(parr[1]);
						
						if (read_recs.length > 0) 
						{	
							PREVLOCJSONTREE = read_recs[0];
							if (typeof PREVLOCJSONTREE != 'undefined' && PREVLOCJSONTREE != null && PREVLOCJSONTREE.loc.length > 0) 
							{
								show_returned_values = false;
								if (PREVLOCJSONTREE.npol !== undefined && PREVLOCJSONTREE.npol != null && PREVLOCJSONTREE.npol.length > 0) {
									sel_num(PREVLOCJSONTREE.cod_topo, PREVLOCJSONTREE.toponimo, PREVLOCJSONTREE.npol, PREVLOCJSONTREE.areaespecial, PREVLOCJSONTREE.freg, PREVLOCJSONTREE.cod_freg, false, PREVLOCJSONTREE.loc, true);
									has_refreshed = true;
								} else if (PREVLOCJSONTREE.codtopo !== undefined && PREVLOCJSONTREE.codtopo != null && PREVLOCJSONTREE.codtopo.length > 0) {
									has_refreshed = sel_toponimo(PREVLOCJSONTREE.toponimo, PREVLOCJSONTREE.cod_topo, PREVLOCJSONTREE.toponimo, null, PREVLOCJSONTREE.loc, show_returned_values);
								}		
							}

							var alllow_saving = false;
							showRetValues(PREVLOCJSONTREE, alllow_saving);						
							if (!has_refreshed) {
								MAPCTRL.refresh();
							}
							
						}
					}
				}
				else {
					MessagesController.setMessage("Impossível aceder ao serviço Localizador, erro "+this.status, true, true);
				}
			}
		}
	);
	
}

function init() {
	
	sizeWidgets();
	clearRetValues();

	// encontrar registo previamente gravado
	record = {};
	fetchRecReturn = [];
	fetchRecordFromServer(fetchRecReturn, record);
	
	AutocompleteObjMgr.registerWidgets('geocode', 'inputbox', 'resultlistarea', 'cleansearchbtn', 'acwarnmsg');
	AutocompleteObjMgr.addWidgetToDisableWithClean('showresultarea');
	AutocompleteObjMgr.setUrlStr('geocode', "c/lq");
	AutocompleteObjMgr.deleteHandler = function (name)
	{
		AutocompleteObjMgr.cleanSearch(name);

		TRANSMIT_OBJECT.backend = {};

		if (!this.checkStringInText(name, TRANSMIT_OBJECT.toponimo)) {
			delete TRANSMIT_OBJECT.codtopo;
			delete TRANSMIT_OBJECT.toponimo;
		}

		if (!this.checkStringInText(name, TRANSMIT_OBJECT.npol)) {
			delete TRANSMIT_OBJECT.npol;
		}
		
		if (TRANSMIT_OBJECT.areaespecial !== undefined) {
			delete TRANSMIT_OBJECT.areaespecial;
		}
		if (TRANSMIT_OBJECT.freg !== undefined) {
			delete TRANSMIT_OBJECT.freg;
		}		
		if (TRANSMIT_OBJECT.frac !== undefined) {
			delete TRANSMIT_OBJECT.frac;
		}	
		if (TRANSMIT_OBJECT.notas !== undefined) {
			delete TRANSMIT_OBJECT.notas;
		}			
		
		deActivateUsePosBtn();
		deActivateSaveBtn();
		clearRetValues();
		
		NPolHighlighter.clear();
		NPolHighlighter.clearMarked();
		
		if (MAPCTRL) {
			MAPCTRL.unregisterOnDrawFinish("highlighttopo");
			MAPCTRL.clearTransient();
			MAPCTRL.clearTemporary();
			
			MAPCTRL.setMessenger(
				function(p_msg) {
					MessagesController.setMessage(p_msg, true);
				}
			);
			MAPCTRL.setWarner(
				function(p_msg) {
					MessagesController.setMessage(p_msg, true, true);
				}
			);			
		}
		
	};
	
	AutocompleteObjMgr.afterSearchExec = function(thisobj, name)
	{
		var show_returned_values, ot, recs, json_resp, json_rec, rec, ht = null;

		var transmit_object = TRANSMIT_OBJECT;

		if (thisobj.readyState === thisobj.DONE)
		{
			hideLoaderImg();
			AutocompleteObjMgr.xhr = null;
			if (thisobj.status == 200)
			{

				try {
					json_resp = JSON.parse(thisobj.responseText);
				} catch(e) {
					console.log(thisobj.responseText);
					console.log(e);
				}
				
				transmit_object.backend = json_resp;
				ot = json_resp.out;

				if (DO_TEST && console!=null) {
					console.log('response:'+thisobj.responseText);
					console.log('tiporesp:'+transmit_object['tiporesp']);
					console.log('curstr:'+transmit_object.backend.curstr);
				}

			   if (ot && typeof ot.cod_topo != 'undefined') {
					transmit_object.codtopo = ot.cod_topo;
					transmit_object.toponimo = ot.toponym;
				}

				if (ot && typeof ot.npol != 'undefined') {
					transmit_object.npol = ot.npol;
				}

				if (ot && typeof ot.frac != 'undefined') {
					transmit_object.frac = ot.frac;
				}

				if (ot && typeof ot.tiporesp != 'undefined') {
					transmit_object.tiporesp = ot.tiporesp;
				}

				this.emptyCurrentRecords(name);
									
				if (transmit_object['tiporesp'] == 'partial')
				{
					var currstr;
					var recs = [];

					if (typeof json_resp.typeparse != 'undefined' && typeof json_resp.typeparse.suggestions != 'undefined' && json_resp.typeparse.suggestions.length > 0) {
						recs.length = 0;
						for (var i=0; i<json_resp.typeparse.suggestions.length; i++) {
							recs.push({
									'istipo': true,
									'cont': json_resp.typeparse.suggestions[i],
									'lbl': '<i>tipo</i> <b>' + json_resp.typeparse.suggestions[i] +  '</b>'});
						}
					};
					
					if (typeof json_resp.toponyms != 'undefined' && typeof json_resp.toponyms.list != 'undefined' && json_resp.toponyms.list.length > 0) {
						
						for (var i=0; i<json_resp.toponyms.list.length; i++) {
							recs.push({'cod_topo': json_resp.toponyms.list[i][0],
									'lbl': json_resp.toponyms.list[i][1],
									'cont': json_resp.toponyms.list[i][1]
									});
						}
						if (json_resp.toponyms.rowcount > json_resp.toponyms.list.length) {
							recs.push({
									'lbl': '... mais ...'
									});
						}
						
					} else if (typeof ot.str != 'undefined') {
						
						currstr = AutocompleteObjMgr.getText(name).toLowerCase();
						if (currstr.indexOf(ot.str.toLowerCase()) < 0) {				
							recs = [{
									'lbl': ot.str, 
									'cont': ot.str 
									}];
						}
					}
					
					this.setCurrentRecords(name, 'acselresult_'+name, recs, null);
				}
				else if (transmit_object['tiporesp'] == 'pick')
				{
					var alllow_saving = true;	
					var recs = [];
										
					clearRetValues();
					
					if (json_resp.numbers) {
						for (var i=0; i<json_resp.numbers.length; i++) {
							rec = json_resp.numbers[i];
							recs.push({
									'cod_topo': rec.cod_topo,
									'toponimo': rec.toponym,
									'npol': rec.npol,
									'npoldata': rec.npoldata,
									'pt': rec.pt,
									'lbl': rec.toponym + ' ' +rec.npol,
									'cont': rec.toponym + ' ' +rec.npol
									});
						}
					}
					
					this.setCurrentRecords(name, 'acselresult_'+name, recs, ot);						

					AutocompleteObjMgr.getTextEntryWidget('geocode').style.color = 'black';
					AutocompleteObjMgr.setText('geocode', '', true);
				}
				else if (transmit_object['tiporesp'] == 'topo' || transmit_object['tiporesp'] == 'npol' || transmit_object['tiporesp'] == 'full')
				{
					recs = [];
					var nprec;
					
					if (transmit_object['tiporesp'] == 'topo') {
						
						if (ot.errornp !== undefined) {
							recs.push({
									'lbl': '<i>não encontrado:</i> ' + ot.toponym + ' <b><s>' +ot.errornp + '</s></b>'
								});
						}
						
						if (json_resp.numbers) {
							for (var i=0; i<json_resp.numbers.length; i++) {
								nprec = json_resp.numbers[i];
								recs.push({
										'cod_topo': ot.cod_topo,
										'toponimo': ot.toponym,
										'npol': nprec.npol,
										'npoldata': nprec.npoldata,
										'pt': nprec.pt,
										'lbl': ot.toponym + ' <b>' +nprec.npol + '</b>',
										'cont': ot.toponym + ' ' +nprec.npol
										});
							}
						}

						this.setCurrentRecords(name, 'acselresult_'+name, recs, null);						
						sel_toponimo(ot.toponym, ot.cod_topo, ot.str, ot.ext, ot.loc, show_returned_values);
						
					} else {
						sel_num(ot.cod_topo, ot.toponym, ot.npol, ot.npoldata.areaespecial, ot.npoldata.freguesia, ot.npoldata.cod_freg, false, ot.loc, true);
					}
				}
			}
		}
	};

	AutocompleteObjMgr.runExecSearch = function() {

		var inptxt = document.getElementById('inputbox');

		if (inptxt!=null && inptxt.value.length>0) {
			execSearch (TRANSMIT_OBJECT);
		}
	};
	
	AutocompleteObjMgr.setCurrentRecords = function(name, p_tableid, in_recs, opt_ot) {
		var in_recs, table, the_elem, root, tr, td, tn;
		
		function markLocation(p_acmgr, p_ot) {
			
			if (!GLOBAL_MOUSE_CLICK.isSet()) {
				console.error("missing global mouse click.");
				return;
			}

			clearTransmitAndPrevloc();						
			var loc = [
				GLOBAL_MOUSE_CLICK.terrain[0], 
				GLOBAL_MOUSE_CLICK.terrain[1]
				];
			
			var markr_coords = [];
			MAPCTRL.getScreenPtFromTerrain(loc[0], loc[1], markr_coords, false);
			
			TRANSMIT_OBJECT.loc = loc;
			
			var alllow_saving = true;
			
			if (p_ot.cod_topo !== undefined) {
				TRANSMIT_OBJECT.codtopo = p_ot.cod_topo;
			}
			if (p_ot.toponym !== undefined) {
				TRANSMIT_OBJECT.toponimo = p_ot.toponym;
			}
			if (p_ot.pointdata !== undefined) {
				
				/*if (p_ot.pointdata.cod_freg !== undefined) {
					TRANSMIT_OBJECT.cod_freg = p_ot.pointdata.cod_freg;
				}*/
				if (p_ot.pointdata.freguesia !== undefined) {
					TRANSMIT_OBJECT.freg = p_ot.pointdata.freguesia;
				}
				if (p_ot.pointdata.areaespecial !== undefined) {
					TRANSMIT_OBJECT.areaespecial = p_ot.pointdata.areaespecial;
				}
				
			}

			showRetValues(null, alllow_saving);
			GLOBAL_MOUSE_CLICK.clear();

			p_acmgr.showListArea('geocode',false);

			NPolHighlighter.clear();
			NPolHighlighter.clearMarked();
			MAPCTRL.clearTransient();
			MAPCTRL.clearTemporary();
			
			p_acmgr.enableCleanWidget('geocode', true);
			
			drawPickMarker(MAPCTRL, null, markr_coords, true);	
		}
		
		var transmit_object = TRANSMIT_OBJECT;
		if (typeof this.listareawidgets[name] != 'undefined') { // && in_htmltable != null) {
			
			//replaceHTML(this.listareawidgets[name], in_htmltable);
			table = document.createElement('table');
			table.setAttribute('id', p_tableid);
			
			root = this.listareawidgets[name];	
			the_elem = root;	
			while (the_elem.firstChild) {
				the_elem.removeChild(the_elem.firstChild);
			}
			root.appendChild(table);
			
		// quando deve aparecer "usar a posição do rato" no topo da lista
			if (opt_ot) {
				
				tr = document.createElement('tr');
				setClass(tr, 'hovering');
				table.appendChild(tr);
				
				td = document.createElement('td');
				tr.appendChild(td);	
				
				td.insertAdjacentHTML('afterbegin','<i>(usar apenas a <b>posição indicada</b> com o rato)</i>');

				(function(p_acmgr, p_func, p_tr, p_ot) {
					attEventHandler(p_tr, 'click', function(e) {
						p_func(p_acmgr, p_ot);
					});
				})(this, markLocation, tr, opt_ot);
			}

			for (var i=0; i<in_recs.length; i++) {
				
				tr = document.createElement('tr');
				setClass(tr, 'hovering');
				table.appendChild(tr);
				
				(function(p_acmgr, p_tr, p_name, p_rec) {
					attEventHandler(p_tr, 'click', function(e) {
						
						if (p_rec.lbl.substring(0,3) === '...') {
							return;
						}	
						
						p_acmgr.showListArea(p_name, false);
						
						if 	(p_rec.cont !== undefined) {
							if 	(p_rec.npol === undefined) {
								if (p_rec.istipo) {
									p_acmgr.setText(p_name, p_rec.cont+' ', false);
								} else {
									p_acmgr.setText(p_name, p_rec.cont+', ', false);
								}
							} else {
								p_acmgr.setText(p_name, p_rec.cont, false);
							}
						}
														
						p_acmgr.getTextEntryWidget(p_name).focus();
						
						if (p_rec.cod_topo !== undefined) {
							transmit_object.backend.cod_topo = p_rec.cod_topo;
						};
					
						if 	(p_rec.npol === undefined) {		
							p_acmgr.send(p_name);
						} else {
							sel_num(p_rec.cod_topo, p_rec.toponimo, p_rec.npol, p_rec.npoldata.areaespecial, p_rec.npoldata.freguesia, p_rec.npoldata.cod_freg, false, p_rec.pt, true);
						}
					});
				 })(this, tr, name, in_recs[i]);
				
				 // hovering
				 if (in_recs[i].npol !== undefined && in_recs[i].npol != null && in_recs[i].lbl.substring(0,3) !== '...') {
					(function(p_acmgr, p_tr, p_name, p_rec) {
						attEventHandler(p_tr, 'mouseover', function(e) {					 						
							sel_num(p_rec.cod_topo, p_rec.toponimo, p_rec.npol, p_rec.npoldata.areaespecial, 
								p_rec.npoldata.freguesia, p_rec.npoldata.cod_freg, true, p_rec.pt, false);
							
						});
					})(this, tr, name, in_recs[i]);
				}
				
				td = document.createElement('td');
				tr.appendChild(td);	
				
				td.insertAdjacentHTML('afterbegin',in_recs[i].lbl);
			}

			if (in_recs.length < 1 && opt_ot != null) {
				// apreceria apenas a indicação se 'usar a posição do rato', pelo que podemos avançar para a marcação final e exposição dos dados recolhidoss
				markLocation(this, opt_ot);
			} else {
				this.current_records[name] = in_recs;
				this.showListArea(name, true);
			}
		}
	};

	deActivateSaveBtn();

	var tmpn = document.getElementById('closebtn');
	if (tmpn) {
		if (typeof window.dialogArguments == "undefined") {
			tmpn.style.display = 'none';
		}
	}

	attEventHandler('showresultarea_min', 'click',
				function (evt) {

					var tmpn = document.getElementById('showresultarea');
					if (tmpn) {
						tmpn.style.display = 'none';
					}
					//this.style.display = 'none';
					tmpn = document.getElementById('showresultarea_alt');
					if (tmpn) {
						tmpn.style.display = '';
					}

				}
			);

	attEventHandler('showresultarea_alt_max', 'click',
				function (evt) {
					var tmpn = document.getElementById('showresultarea_alt');
					if (tmpn) {
						tmpn.style.display = 'none';
					}
					//this.style.display = 'none';
					tmpn = document.getElementById('showresultarea');
					if (tmpn) {
						tmpn.style.display = '';
					}

				}
			);

	attEventHandler('closebtn', 'click', doClose);

	attEventHandler('startsearchbtn', 'click', AutocompleteObjMgr.runExecSearch);

	//attEventHandler('cleansearchbtn', 'click', btnCleanSearchClick);

	attEventHandler('useposimg', 'click', clickActivateUsePosBtn);

	attEventHandler('dosave', 'click', doSave);

	attEventHandler('cod_postal4_cell', 'keyup',
		function(evt) {
				var cpre = /^([0-9]{4})$/;
				if(! this.value.match(cpre)) {
					this.style.color = 'red';
					deActivateSaveBtn();
				} else {
					this.style.color = 'black';
					activateSaveBtn();
				}
		}
	);

	attEventHandler('cod_postal3_cell', 'keyup',
		function(evt) {
				var cp3re = /^([0-9]{3})$/;
				if(! this.value.match(cp3re)) {
					this.style.color = 'red';
					deActivateSaveBtn();
				} else {
					this.style.color = 'black';
					activateSaveBtn();
				}
		}
	);

	attEventHandler('notas_cell', 'keyup',
		function(evt) {
			if(this.value.length > 0) {
				activateSaveBtn();
			}
		}
	);

	attEventHandler('frac_cell', 'keyup',
		function(evt) {
			if(this.value.length > 0) {
				activateSaveBtn();
			}
		}
	);

	attEventHandler('sclvaldiv', 'click',
		function(evt) {
			var inpscale = prompt("Entre o valor da escala de visualização", MAPCTRL.getScale());
			if(inpscale) {
				try  {
					MAPCTRL.setScale(inpscale);
					MAPCTRL.refresh(false);
				} catch(e) {
					MessagesController.setMessage(e, true, true);
					console.log(e);
				}
			}
		}
	);

	attEventHandler('visctrl', 'click',
		function(evt) { finishEvent(evt); }
	);

	attEventHandler('visctrl', 'mousemove',
		function(evt) { finishEvent(evt); }
	);

	attEventHandler('visraster_IMG16', 'click',
		function(evt) { clickVisraster('IMG16'); }
	);
	attEventHandler('visraster_ORTO08', 'click',
		function(evt) { clickVisraster('ORTO08'); }
	);
	attEventHandler('visraster_ORTO05', 'click',
		function(evt) { clickVisraster('ORTO05'); }
	);
	attEventHandler('visraster_ORTO00', 'click',
		function(evt) { clickVisraster('ORTO00'); }
	);
	attEventHandler('visraster_ORTOADP', 'click',
		function(evt) { clickVisraster('ORTOADP'); }
	);
	attEventHandler('visraster_CART98', 'click',
		function(evt) { clickVisraster('CART98'); }
	);
	attEventHandler('info_ORTO08', 'click',
		function(evt) { window.open("http://guia.cm-porto.net/dataset/ortofotos-2008"); }
	);
	attEventHandler('info_ORTOADP', 'click',
		function(evt) { window.open("http://guia.cm-porto.net/dataset/ortofoto-cartografia-1-5000-2002"); }
	);
	attEventHandler('info_IMG16', 'click',
		function(evt) { window.open("http://www.arcgis.com/home/item.html?id=64f2ff721fe744f3ad47497cf149b863"); }
	);	
	
	// Controle de layers - controlo activo é ...
	rasterSourceChange.setSourceTag('IMG16');
	activateVisrasterWdg('IMG16');
	
	attEventHandler('chooseraster', 'click',
		function(evt) {
			var chrc = document.getElementById('chooseraster_container');
			if (chrc) {
				chrc.style.display = 'none';
			}
			var vrc = document.getElementById('visrastersel_container');
			if (vrc) {
				vrc.style.display = 'block';
			}
		}
	);
	
	/*
	attEventHandler('choosevector', 'click',
		function(evt) {
			
			if (TOGGLE_RASTERSELECTOR) {
				var chrc = document.getElementById('chooseraster_container');
				if (chrc) {
					chrc.style.display = 'block';
				}
				var vrc = document.getElementById('visrastersel_container');
				if (vrc) {
					vrc.style.display = 'none';
				}
			}
			for (var kval in rasterSourceChange.datasource_references) {
				if (rasterSourceChange.datasource_references.hasOwnProperty(kval)) {
					wdg_name = "visraster_" + kval;
					switchCSSClasses(wdg_name, 'btn-0-pressed', '');
				}
			}
			
			switchCSSClasses('choosevector', '', 'btn-0-pressed');
			
			MAPCTRL.clearBackgroundRasterLyrNames();
			
			rasterSourceChange.setSourceTag('VECTOR');
			MAPCTRL.muteVectors(false);

			MAPCTRL.refresh();
				
		}
	);
	*/

	attEventHandler('toolctrl', 'click',
		function(evt) { finishEvent(evt); }
	);


	attEventHandler('tool_tolerance', 'click',
		function(evt) { 
			var ret = MAPCTRL.mapctrlsmgr.activateTool('pickertolerance');
			if (!ret) {
				MessagesController.setMessage("Impossível ativar ferramenta definição tolerância.", true, true);
			} else {
				MessagesController.setMessage("Ativada ferramenta definição tolerância.", true, false);
			}
		}
	);
			
	//window.addEventListener("resize", sizeWidgets);
	
	AutocompleteObjMgr.deleteHandler('geocode');

	var sra = document.getElementById('showresultarea');

	// esconder controles de formulário entrada caso esteja em modo de mera consulta desligada de aplicações terceiras 
	if (sra!=null && !fetchRecReturn[0])	{
		applyFunctionByClasses(sra, ['hiddable_inputs'],
			function(obj) {
				obj.style.display = 'none';
			}
		);
	}
	
	// Saída em caso de erro: mostrar string de aviso na caixa do autocomplete
	if (typeof ERROR_OCURRED != 'undefined' && ERROR_OCURRED) {
		
	    AutocompleteObjMgr.getTextEntryWidget('geocode').style.color = 'red';

	    AutocompleteObjMgr.setText('geocode', 'Erro no servidor. Refresque a página por favor');
	    AutocompleteObjMgr.getTextEntryWidget('geocode').disabled = true;
	    AutocompleteObjMgr.showListArea('geocode', false);
	    
	    return;
	}
	
	// Detectar se há resultados de query activos e agir em conformidade
	var show_returned_values, has_refreshed = false;	
	if (typeof PREVLOCJSONTREE != 'undefined' && PREVLOCJSONTREE != null && PREVLOCJSONTREE.loc.length > 0) 
	{
		if (PREVLOCJSONTREE.npol !== undefined && PREVLOCJSONTREE.npol != null && PREVLOCJSONTREE.npol.length > 0) {
			sel_num(PREVLOCJSONTREE, false);
			has_refreshed = true;
		} else if (PREVLOCJSONTREE.codtopo !== undefined && PREVLOCJSONTREE.codtopo != null && PREVLOCJSONTREE.codtopo.length > 0) {
			show_returned_values = true;
//			has_refreshed = sel_toponimo(PREVLOCJSONTREE, show_returned_values);		
			has_refreshed = sel_toponimo(PREVLOCJSONTREE.toponimo, PREVLOCJSONTREE.codtopo, PREVLOCJSONTREE.toponimo, null, PREVLOCJSONTREE.loc, p_showreturnedvalues)

		}		
	}
		
	// mostrar resultados de query no respectivo formulário
	if (typeof PREVLOCJSONTREE != 'undefined'  && PREVLOCJSONTREE != null) {
		var alllow_saving = true;
		showRetValues(PREVLOCJSONTREE, alllow_saving);
	}
	
	attEventHandler('rastervisctrl', 'change',
		function(evt) 
		{
			var this_rad, radbuttons = document.getElementsByName("visraster");
			if (radbuttons) 
			{
				for (var radi=0; radi<10; radi++) 
				{
					this_rad = radbuttons[radi];
					//console.log(this_rad);
					if (typeof this_rad != 'undefined' && this_rad.checked) {
						MAPCTRL.setBackgroundRasterLyrName(this_rad.value);
						MAPCTRL.refresh();
						rasterSourceChange.setSourceTag(this_rad.value);
					}
				}
			}
		}
	);
	
	// mouse click sobre a mensagem flutuante fecha-a
	attEventHandler('msgsdiv', 'click',
			function(evt) {
				MessagesController.hideMessage(true);
			}
		);

		
	// antes do refresh do mapa verificar se há rasters visíveis
	MAPCTRL.registerOnBeforeRefresh(
		rasterSourceChange.checkRastersAreVisible
	);


	// comportamento associado ao início de operação de pan ou zoom
	MAPCTRL.registerOnPanZoom(
		function () {
			// esconder form de dados e esconder a mensagem flutuante
			AutocompleteObjMgr.showListArea('geocode', false);
			MessagesController.hideMessage();
		}
	);
	
	// transformações alterações geométricas customizadas a aplicar às features carregadas
	/*
	MAPCTRL.registerOnDrawing_FeatureTransform(	
		function(p_layername, storedfeatdata) {
			
			var HC_pt=[];
			var HC_ret=[];
			
			if (p_layername == "NPOLPROJD") 
			{
				if (storedfeatdata.path_levels > 1) {
					throw new Error("valor de path_levels inesperado ("+storedfeatdata.path_levels+") para NPOLPROJD no evento onDrwaing_FeatureTransform");
				}
				geom.twoPointAngle([storedfeatdata.points[0], storedfeatdata.points[1]], 
								[storedfeatdata.points[2], storedfeatdata.points[3]], 
								HC_ret);
				if (HC_ret[1] == 2 || HC_ret[1] == 3) {
					geom.applyPolarShiftTo([storedfeatdata.points[0], storedfeatdata.points[1]], HC_ret[0], 6, HC_pt);
					storedfeatdata.points.unshift(parseInt(Math.round(HC_pt[1])));
					storedfeatdata.points.unshift(parseInt(Math.round(HC_pt[0])));
				} else {
					geom.applyPolarShiftTo([storedfeatdata.points[0], storedfeatdata.points[1]], HC_ret[0]+Math.PI, 6, HC_pt);
					storedfeatdata.points.unshift(parseInt(Math.round(HC_pt[1])));
					storedfeatdata.points.unshift(parseInt(Math.round(HC_pt[0])));
				}
			}	
		}
	);
	* */
	
	// verificar o zIndex do widget de manipulação das ortomimagens
	rasterSourceChange.checkZIndexes(MAPCTRL);
	
	if (!has_refreshed) {

		MAPCTRL.refresh();
		
		if (!fetchRecReturn[1]) {
			
			if (MAPCTRL.getScale() <= PICKLOCATION_SCALELIMITS.max) {
				MessagesController.setMessage("Introduza um topónimo ou morada ou escolha um número de polícia com o rato", true);
			} else {
				MessagesController.setMessage("Introduza um topónimo ou morada ou aumente o zoom (com a roda do mouse ou com o botão '+') para poder escolher um número de polícia com o rato.", true);
			}
			
		}
	}
	
	// afinar os tamanhos dos objectos flutuantes sobre o mapa
	sizeWidgets();
	
	MAPCTRL.mapctrlsmgr.addTool(new PickerTolerance(MOUSEBTN_LEFT, MAPCTRL));
	
	// detecção de atalhos de teclado
	document.addEventListener('keyup', function (event) { 
		if (event.target.tagName && event.target.tagName.toLowerCase() == "body") {
			switch(event.key) {
				// Menu ferramentas / tools - t
				case "t":
				case "T":
					// toggle
					var toolctrl = document.getElementById("toolctrl");
					if (toolctrl) {
						if (toolctrl.style.visibility == "visible") {
							toolctrl.style.visibility = "hidden";
						} else {
							toolctrl.style.visibility = "visible";
						}
					}
					break;
			}
		}
	});	


}

var COOUNT = 0;
