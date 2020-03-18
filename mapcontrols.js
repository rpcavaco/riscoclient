
var MOUSEBTN_LEFT = 1;
var MOUSEBTN_MIDDLE = 2;
var MOUSEBTN_RIGHT = 4;

function getOffset(p_element, out_list) {
	
	out_list.length = 2;
	
	let bodyRect = document.body.getBoundingClientRect(),
    elemRect = p_element.getBoundingClientRect();
    // elemRect = p_element.parentElement.getBoundingClientRect();
    
    //console.log(String.format("offset e:{0}, b:{1}", elemRect.left, bodyRect.left));
    
    out_list[0] = elemRect.left - bodyRect.left;
    out_list[1] = elemRect.top - bodyRect.top;
}

function getEvtCoords(p_evt, p_target, out_coords) {

	let xcoord = p_evt.clientX,
	ycoord = p_evt.clientY,
	offsets = [];
		
	getOffset(p_target, offsets);
	
	out_coords.length = 2;
	out_coords[0] = xcoord - offsets[0];
	out_coords[1] = ycoord - offsets[1];
	
    //console.log(String.format("offset xy:{0},{1} off:{2},{3} out:{4},{5}", xcoord, ycoord, offsets[0], offsets[1], out_coords[0], out_coords[1]));

}

// baseclass intended for extension
function _Basetool() {

	this.name = '#basetool#';
	this.actions_per_evttype_per_layer = {};
	this.mousedown_ocurred = false;
	this.start_screen = null;
	this.start_terrain = null;
	this.started = false;
	this.mouseleave_eq_mouseup = true;

	this.getName = function() {
		return this.name;
	};
	
	this.checkName = function(p_name) {
		return (p_name.toLowerCase() == this.name);
	};

	this.checkOtherName = function(p_other) {
		return p_other.checkName(this.name);
	};
	
	this.registerActionPerEvtTypePerLayer = function(p_evttype, p_layername, p_callback) 
	{		
		if (this.actions_per_evttype_per_layer[p_evttype] === undefined) {
			this.actions_per_evttype_per_layer[p_evttype] = {};					
		}
		this.actions_per_evttype_per_layer[p_evttype][p_layername] = p_callback;		
	};


}

function Pan(mouseButtonMask, p_mapctrl) 
{
	this.getClassStr = function() {
		return "Pan tool (Pan)";
	};

	this.mouseButtonMask = mouseButtonMask;
	this.name = 'pan';
	this.the_map = p_mapctrl;
	this.last_pt = [];
	
	this.mousedown = function(e, target, x, y, opt_nobuttons) 
	{
		var terrain_pt=[];
		
		if (!this.started)
		{
			var retfmb;
			if (!opt_nobuttons) {
				retfmb = filterMouseButton(e, this.mouseButtonMask)
				if (!retfmb[2]) {
					// Allow actuation of permanent tool
					return true;
				}	
			}	
	
			this.the_map.getTerrainPt([x, y], terrain_pt);
			this.start_screen = [x, y];
			this.start_terrain = [terrain_pt[0], terrain_pt[1]];
			
			this.started = true;
		}
		
		// Allow actuation of permanent tool
		return true;
	};

	this.mouseup = function(e, target, x, y) 
	{
		if (this.started) 
		{ 	
			this.started = false;
			
			this.the_map.finishPan((x==0 ? this.last_pt[0] : x), (y==0 ? this.last_pt[1] : y), this.start_screen);		
			this.start_terrain = null;
		}
		
		// Allow actuation of permanent tool
		return true;
	};

	this.mousemove = function(e, target, x, y) 
	{
		// console.log(String.format("pan mousemove started:{0} x:{1} y:{2}",this.started, x, y));
		if (this.started) {
			this.last_pt = [x, y];
			this.the_map.transientPan(x, y, this.start_terrain, this.start_screen);
		}

		// Allow actuation of permanent tool
		return true;
	};

}

extend(Pan, _Basetool);

function Picker(mouseButtonMask, p_mapctrl) 
{
	this.getClassStr = function() {
		return "Picker tool (Picker)";
	};

	this.mouseButtonMask = mouseButtonMask;
	this.name = 'picker';
	this.the_map = p_mapctrl;
	
	this.mousedown = function(e, target, x, y, opt_nobuttons) 
	{
		if (!this.mousedown_ocurred)
		{
			var retfmb;
			if (!opt_nobuttons) {
				retfmb = filterMouseButton(e, this.mouseButtonMask);
				if (!retfmb[2]) {
			// Allow actuation of permanent tool
					return true; 
				}	
			}	
			this.start_screen = [x, y];	
			this.mousedown_ocurred = true;
		}
		
		// Allow actuation of permanent tool
		return true;
	};
	
	this.mouseup = function(e, target, x, y, null_nobuttons) 
	{
		if (this.mousedown_ocurred) {
			
			var lname, funcname, lnames = [], lnames_per_func = {}; //, mu_prevcall_state = {};
			
			for (lname in this.actions_per_evttype_per_layer['mouseup']) 
			{
				if (!this.actions_per_evttype_per_layer['mouseup'].hasOwnProperty(lname)) {
					continue;
				}
				lnames.push(lname);
			}
			for (var li=0; li < lnames.length; li++) {
				lname = lnames[li];
				funcname = this.actions_per_evttype_per_layer['mouseup'][lname];
				if (funcname!=null) {
					if (lnames_per_func[funcname] === undefined) {
						lnames_per_func[funcname] = [];
					}
				}
				lnames_per_func[funcname].push(lname);
			}

			for (funcname in lnames_per_func) {
				if (!lnames_per_func.hasOwnProperty(funcname)) {
					continue;
				}
					try {
					window[funcname](this.the_map, x, y, lnames_per_func[funcname]);
					} catch(e) {
						console.warn(e);
					}
				}
		}
		this.mousedown_ocurred = false;
		// Allow actuation of permanent tool
		return true;
	};

	this.mousemove = function(e, target, x, y) 
	{
		var dx, dy;
		if (this.mousedown_ocurred) {
			dx = Math.abs(this.start_screen[0] - x);
			dy = Math.abs(this.start_screen[1] - y);
			if (dx > 1 || dy > 1) {
				this.mousedown_ocurred = false;
			}
		}
		
		if (!this.mousedown_ocurred) 
		{
			for (var lname in this.actions_per_evttype_per_layer['mousemove']) 
			{
				if (!this.actions_per_evttype_per_layer['mousemove'].hasOwnProperty(lname)) {
					continue;
				}
				var funcname = this.actions_per_evttype_per_layer['mousemove'][lname];
				if (funcname && window[funcname]!== undefined) {
						window[funcname](this.the_map, x, y, lname);
				}
			}
		}		
		// Allow actuation of permanent tool
		return true;
	};
}

extend(Picker, _Basetool);

function mouseWheelController(p_controls_mgr) {
	
	this.getClassStr = function() {
		return "mouseWheelController";
	};
	
	this.controls_mgr = p_controls_mgr;
	this.timerId = null;
	this.starttime = null
	this.shortWaitPeriodMsec = 5;
	this.refreshPeriodMsec = 700;
	
	this.limitcount = 1000;
	this.count = 0;
	
	this.clearReference = function() {
		if (this.timerId != null) {
			window.clearTimeout(this.timerId);
			this.timerId = null;
			this.starttime = null;
			this.count = 0;
		}
	};
	
	this.mousewheel = function(e) 
	{
		let k;
		let coords=[], newscale = this.controls_mgr.the_map.getScale();

		if (!e) var e = window.event;
		
		let delta = getWheelDelta(e);
		let adelta = Math.abs(delta);
		var op, target =  getTarget(e);
		
		finishEvent(e);

		if (adelta < 5) {
			return false;
		}
		
		this.starttime = Date.now();
		this.count = 0;
		
		if (target.parentNode) {
			op = target.parentNode;
		} else {
			op = target;
		}
		
		finishEvent(e);
		getEvtCoords(e, target, coords);
		
		k = 1 + adelta/200.0;
			
		if (delta > 0) {
			newscale /= k;
		}
		else {
			newscale *= k;
		}
			
		var pt = [];
		this.controls_mgr.the_map.getTerrainPt(coords, pt)		
		this.controls_mgr.the_map.quickChangeScale(newscale, coords[0], coords[1]);
		
		if (this.timerId == null) {
			(function(p_self) {
				p_self.timerId = window.setInterval(function(e) {
					p_self.count = p_self.count + 1;
					if (p_self.starttime == null) {
						return;
		}
					let tdelta = Date.now() - p_self.starttime;
					if (tdelta > p_self.refreshPeriodMsec) {
						p_self.clearReference();	
				p_self.controls_mgr.the_map.refresh(false);
					} else {
						if (p_self.count > p_self.limitcount) {
				p_self.clearReference();
						}
					}
			}, p_self.waitPeriodMsec);
		})(this);
		}

		return false;
	}	
}

function copyTouch(touch, target) {
	return { 
		target: target,
		identifier: touch.identifier, 
		pageX: touch.pageX, 
		pageY: touch.pageY,
		clientX: touch.clientX, 
		clientY: touch.clientY,
		screenX: touch.screenX, 
		screenY: touch.screenY
	};
}	

function touchController(p_controls_mgr) {
	
	this.getClassStr = function() {
		return "touchController";
	};
	
	this.controls_mgr = p_controls_mgr;
	this.zoomcenter = [];
	this.waitPeriodMsec = 400;
	this.initPinchDiagonal = null;
	this.started = false;
	
	this.ongoingTouches = [];
	
	this.ongoingTouchIndexById = function(idToFind) {
		for (var i = 0; i < this.ongoingTouches.length; i++) {
			var id = this.ongoingTouches[i].identifier;
			if (id == idToFind) {
				return i;
			}
		}
		return -1;    // not found
	};
 
	this.touchstart = function(e) {
		
		e.preventDefault();
		let ret = null;
		let touches = e.changedTouches;
		let trg = getTarget(e);
		this.zoomcenter.length = 0;
		
		for (let i = 0; i < touches.length; i++) {
			this.ongoingTouches.push(copyTouch(touches[i], trg));
		}
		if (this.ongoingTouches.length == 1) {
			ret = this.ongoingTouches[0];
		}
		if (this.ongoingTouches.length == 2) {
			this.initPinchDiagonal = null;
		}

		if (ret) {
			this.started = true;
		}

		return ret;
	};

	this.touchmove = function(e) {
		e.preventDefault();
		let ret = null;
		let idx, touches = e.changedTouches;
		let trg = getTarget(e);

		for (let i = 0; i < touches.length; i++) {
			idx = this.ongoingTouchIndexById(touches[i].identifier);
			if (idx >= 0) {
				this.ongoingTouches.splice(idx, 1, copyTouch(touches[i], trg));
			}
		}

		if (this.ongoingTouches.length == 1) {
			ret = this.ongoingTouches[0];
		} else if (this.ongoingTouches.length == 2) {
			this.dozoom();
		}
		return ret;
	};

	this.touchend = function(e) {
		
		e.preventDefault();
		let ret = null, found = null;
		let idx, touches = e.changedTouches;
		let trg = getTarget(e);

		for (let i = 0; i < touches.length; i++) {
			idx = this.ongoingTouchIndexById(touches[i].identifier);
			if (idx >= 0) {
				if (found == null) {
					found = copyTouch(touches[i], trg);
				}
				this.ongoingTouches.splice(idx, 1);
			}
		}
		
		// When second touchend fires after two-finger pinching movement
		// this.started == false already, so that ret value returns null 
		// signaling the caller to do nothing
		if (touches.length == 1 && this.started) {
			ret = found;
		} else {
			this.initPinchDiagonal = null;
		}

		this.started = false;
		return ret;
		
	};

	this.dozoom = function() {
		
		let xcoord, ycoord, dx=null, dy=null, t;
		let coords=[], minx=999999, miny=999999;
		let maxx=-999999, maxy=-999999, d, k, diff, maxdim;
		
		if (this.ongoingTouches.length < 2) {
			return;
		};
		
		let newscale = this.controls_mgr.the_map.getScale();		
		let cdims = this.controls_mgr.the_map.getGraphicController().getCanvasDims();
		maxdim = Math.max(cdims[0], cdims[1]);
		
		for (let i=0; i < 2; i++) {
			t = this.ongoingTouches[i];
			getEvtCoords(t, t.target, coords);
			minx = Math.min(minx, coords[0]);
			miny = Math.min(miny, coords[1]);
			maxx = Math.max(maxx, coords[0]);
			maxy = Math.max(maxy, coords[1]);
			}
		dx = parseInt(maxx - minx);
		dy = parseInt(maxy - miny);
		d = parseInt(Math.sqrt(dx * dx + dy * dy));
		
		if (this.initPinchDiagonal === null) {
			this.initPinchDiagonal = d;
			return;
			}
				
		xcoord = minx + (dx/2.0);
		ycoord = miny + (dy/2.0);
		diff = d - this.initPinchDiagonal;
		k = 1 + Math.abs(diff/(2.0 * maxdim));
			
		if (diff > 0) {
			newscale /= k;
		}
		else {
			newscale *= k;
		}
			
		this.zoomcenter = [xcoord, ycoord];
			this.controls_mgr.the_map.quickChangeScale(newscale, xcoord, ycoord);
	};
}		

// baseclass intended for extension
function _MeasureSegment(mouseButtonMask, p_mapctrl) {
	
	this.getClassStr = function() {
		return "Measure segment tool (MeasureSegment)";
	};

	this.mouseButtonMask = mouseButtonMask;
	this.name = 'measuresegment';
	this.the_map = p_mapctrl;
	this.start_map = [];
	this.start_screen = [];
	this.measvalterrain = 0;
	this.mousedown_ocurred = false;
	this.mouseleave_eq_mouseup = false;
	
	this.reset = function() {
		this.mousedown_ocurred = false;
		this.start_screen.length = 0;
		this.start_map.length = 0;
	};
		
	this.mousedown = function(e, target, x, y, opt_nobuttons) 
	{
		if (!this.mousedown_ocurred)
		{
			var retfmb;
			if (!opt_nobuttons) {
				retfmb = filterMouseButton(e, this.mouseButtonMask)
				if (!retfmb[2]) {
					// Cancel actuation of permanent tool
					return false;
				}		
			}
			this.start_screen = [x, y];

			this.the_map.getTerrainPt(this.start_screen, this.start_map);
	
			this.mousedown_ocurred = true;
		}
		
		// Cancel actuation of permanent tool
		return false;
	};
	
	this.mouseup = function(e, target, x, y) 
	{
		if (this.mousedown_ocurred) {
			
			var func=null, drawable_layer_lst = [];
			// get visible layers list
			this.the_map.getDrawableLayerList(drawable_layer_lst, false);
			
			for (var lname in this.actions_per_evttype_per_layer['mouseup']) 
			{
				if (!this.actions_per_evttype_per_layer['mouseup'].hasOwnProperty(lname)) {
					continue;
				}
				
				// only visible layers are processed
				if (drawable_layer_lst.indexOf(lname) >= 0) {
					func = this.actions_per_evttype_per_layer['mouseup'][lname];
					func(this.the_map, x, y, lname);
				}
			}
			
			// No default tool behaviour
			// if (func == null) {
				
			// }
		}
		this.reset();
		
		this.the_map.grController.clearDisplayLayer('transient');
		
		// Cancel actuation of permanent tool
		return false;
	};

	this.mousemove = function(e, target, x, y) 
	{
		var dx, dy, ang,  angvals = [], retpt=[], func = null, draw_dolog = false; inscreenspace = false;
		
		var styleobj = { 
				"stroke": { "linewidth": 3 }
		};
					
		if (this.mousedown_ocurred) {
			dx = Math.abs(this.start_screen[0] - x);
			dy = Math.abs(this.start_screen[1] - y);
			if (dx > 1 || dy > 1) {
				this.mousedown_ocurred = false;
			}
		}
		
		if (!this.mousedown_ocurred) 
		{
			var current_map, func = null;
			for (var lname in this.actions_per_evttype_per_layer['mousemove']) 
			{

				if (!this.actions_per_evttype_per_layer['mousemove'].hasOwnProperty(lname)) {
					continue;
				}

				func = this.actions_per_evttype_per_layer['mousemove'][lname];
				func(this.the_map, x, y, lname);
			}
			
			// default tool behaviour
			if (func == null && this.start_map.length > 0) {

				current_map = [];
				this.the_map.getTerrainPt([x,y], current_map);
				
				let styleflags = {}, gc = this.the_map.getGraphicController(), dl = 'transient';
				if (gc == null) {
					throw new Error("MeasureSegment tool, mousemove: no graphic context controller");
				}
				
				gc.clearDisplayLayer('transient');

				this.measvalterrain = formatFracDigits(geom.distance([this.start_map[0], this.start_map[1]], [current_map[0], current_map[1]]), 2);

				gc.saveCtx(dl);
				this.the_map.applyStyle(styleobj, styleflags, dl);

				//gc.drawCircle(this.start_map[0], this.start_map[1], this.measvalterrain, 
					//true, true, false, styleobj, 'transient');

				gc.drawCircle(this.start_map[0], this.start_map[1], this.measvalterrain, true, true, 
					true, 'transient');

				gc.drawSimplePath([this.start_map[0], this.start_map[1], current_map[0], current_map[1]], true, true,  
					null, true, draw_dolog, null, null, 'transient') 

				geom.twoPointAngle(this.start_screen, [x,y], angvals);
				
				ang = angvals[0];
				if (angvals[1] == 2 || angvals[1] == 3) {
					gc.setTextAlign("end",'transient');
					geom.applyPolarShiftTo([x,y], ang, -10, retpt);
				} else {
					gc.setTextAlign("start",'transient');
					geom.applyPolarShiftTo([x,y], ang, 10, retpt);
				}
				
				geom.applyPolarShiftTo(retpt, ang+(Math.PI/2.0), 6, retpt);
				
				gc.saveCtx('transient');
				gc.setFont('20px Arial', 'transient');
				gc.setFillStyle('rgba(255,0,0,1)', 'transient');

// TODO: FILLSTROKE
				gc.rotatedText(this.measvalterrain+" m", retpt, ang, 'transient');
				gc.restoreCtx('transient');
					
			}
		}
		
		// Allow actuation of permanent tool
		return true;
	};	
}

extend(_MeasureSegment, _Basetool);

function MapControlsMgr(p_the_map) {

	this.i18nmsgs = {
			"pt": {
				"ACTTOOL": "Ferramenta ativa:",				
				"NONEW": "'MapControlsMgr' é classe, o seu construtor foi invocado sem 'new'",				
				"NULLMAP": "'MapControlsMgr'sem mapa associado",
				"INVTOOLNAME": "Identificador '{0}' de tool inválido na configuração do mapa",
				"TOOLNOTFOUND": "Tool '{0}' não encontrada, provavelmente não foi incluída na configuração de mapa em controlssetup->tools"	
						
			},			
			"en": {
				"ACTTOOL": "Activate tool:",				
				"NONEW": "'MapControlsMgr' is a class, its constructor was invoked without 'new'",				
				"NULLMAP": "'MapControlsMgr' without map",				
				"INVTOOLNAME": "Invalid toolname '{0}' found in map config",
				"TOOLNOTFOUND": "Tool '{0}' not found, probably missing in map configuration at item controlssetup->tools"	
			}
		};
	this.getClassStr = function() {
		return "MapControlsMgr";
	};

	this.msg = function(p_msgkey) {
		let langstr = navigator.language || navigator.userLanguage;
		let lang = langstr.substring(0,2);		
		if (this.i18nmsgs[lang] === undefined) {
			for (let k in this.i18nmsgs) {
				if (this.i18nmsgs.hasOwnProperty(k)) {
					lang = k;
					break;
				}
			}
		}
		return this.i18nmsgs[lang][p_msgkey];
	};
			
	if ( !(this instanceof arguments.callee) )
		throw new Error(this.msg("NONEW"));

	if (p_the_map == null)
		throw new Error(this.msg("NULLMAP"));
	
	this.the_map = p_the_map;
	this.tools_searchradius_func = 1.0;
	this.tools_controlwidgets = 'none';
	
	this.alltoolctrls = {};
	this.allbtnctrls = [];
	this.mousecoordswidgetids = [];
	this.activetoolctrl = null;
	this.permanenttool = new Pan(MOUSEBTN_MIDDLE | MOUSEBTN_LEFT, this.the_map);
	this.deftoolname = null;

	this.visibility_widget_name = null;
	this.widgetnames_hide_during_refresh = [];
	this.widgetnames_hide_small_scale = [];
	
	this.mouseWheelCtrler = new mouseWheelController(this);
	//this.gestureCtrler = new gestureController(this);
	this.touchController = new touchController(this);

	this.searchtolerance_func = null;
	this.searchtolerance = null;
	
	this.setTolerance = function(p_tolvalue) {
		this.searchtolerance = p_tolvalue;
	};
	this.clearTolerance = function() {
		this.searchtolerance = null;
	};
	this.getTolerance = function(opt_scaleval) {
		let ret = null;
		if (this.searchtolerance) {
			ret = this.searchtolerance;
		} else {
			if (opt_scaleval) {
				ret = this.searchtolerance_func(opt_scaleval);
			} else {
				ret = this.searchtolerance_func(this.the_map.getScale());
			}
		}
		return ret;
	};

	this.readConfig = function(p_initconfig) 
	{		
		var cobj;
		
		if (p_initconfig["searchtolerance"] !== undefined && p_initconfig["searchtolerance"] != null) {
			this.searchtolerance = p_initconfig["searchtolerance"]; // function of mapscale value
		} else {
			this.searchtolerance = 2;
		}
		if (p_initconfig["searchtolerance_func"] !== undefined && p_initconfig["searchtolerance_func"] != null) {
			this.searchtolerance_func = p_initconfig["searchtolerance_func"]; // function of mapscale value
			this.searchtolerance = null;
		} else {
			this.searchtolerance_func = null;
		}
		
		if (p_initconfig["controlwidgets"] !== undefined && p_initconfig["controlwidgets"] != null) {
			this.tools_controlwidgets = p_initconfig["controlwidgets"];
		}
		
		if (p_initconfig["coordswidgets"] !== undefined && p_initconfig["coordswidgets"] != null) {
			p_initconfig["coordswidgets"].forEach(
				(function(p_self) {
					return function(item, index) {
						p_self.registerMouseCoordsWidget(item);
					};
				})(this)
			);
		}
		if (p_initconfig["visibility_widget_name"] !== undefined && p_initconfig["visibility_widget_name"] != null) {
			this.visibility_widget_name = p_initconfig["visibility_widget_name"];
		}
		if (p_initconfig["widgetnames_hide_during_refresh"] !== undefined && p_initconfig["widgetnames_hide_during_refresh"] != null) {
			this.widgetnames_hide_during_refresh = p_initconfig["widgetnames_hide_during_refresh"];
		}
		if (p_initconfig["widgetnames_hide_small_scale"] !== undefined && p_initconfig["widgetnames_hide_small_scale"] != null) {
			this.widgetnames_hide_small_scale = p_initconfig["widgetnames_hide_small_scale"];
		}
		
		if (p_initconfig["tools"] !== undefined && p_initconfig["tools"] != null) {
			cobj = p_initconfig["tools"];
			cobj.forEach(
				(function(p_self) {
					return function(item, index) {
						switch (item.toLowerCase()) {
							case "pan":
								p_self.addTool(new Pan(MOUSEBTN_LEFT, p_self.the_map));
								break;
							case "picker":
								p_self.addTool(new Picker(MOUSEBTN_LEFT, p_self.the_map));
								break;
							case "measuresegment":
								p_self.addTool(new _MeasureSegment(MOUSEBTN_LEFT, p_self.the_map));
								break;
							default:
								throw new Error(this.msg(String.format("INVTOOLNAME",item)));
								
						}
					};
				})(this)
			);
		}

		if (p_initconfig["toollayeractions"] !== undefined && p_initconfig["toollayeractions"] != null) {
			for (var tla_tool_name in p_initconfig["toollayeractions"]) 
			{
				if (!p_initconfig["toollayeractions"].hasOwnProperty(tla_tool_name)) {
					continue;
				}
				for (var tla_evt_name in  p_initconfig["toollayeractions"][tla_tool_name]) 
				{
					if (!p_initconfig["toollayeractions"][tla_tool_name].hasOwnProperty(tla_evt_name)) {
						continue;
					}
					for (var tla_layer_name in  p_initconfig["toollayeractions"][tla_tool_name][tla_evt_name]) 
					{
						if (!p_initconfig["toollayeractions"][tla_tool_name][tla_evt_name].hasOwnProperty(tla_layer_name)) {
							continue;
						}
						this.alltoolctrls[tla_tool_name].registerActionPerEvtTypePerLayer(
								tla_evt_name, tla_layer_name, p_initconfig["toollayeractions"][tla_tool_name][tla_evt_name][tla_layer_name]
						);
						
						// layers to be spatialindexed
						this.the_map.setLayernameAsIndexable(tla_layer_name);							
					}
				}			
			}
		}
	};
	
	this.getControlWidgetsModeStr = function() {
		return this.tools_controlwidgets;
	};
		
	this.registerMouseCoordsWidget = function (p_widgetid) {
		if (this.mousecoordswidgetids.indexOf(p_widgetid) < 0) {
			this.mousecoordswidgetids.push(p_widgetid);
		}
	};
		// criar controles visiveis
	this.createVisibleControls = function() 
	{
		var contdivstyle = '';
		
		switch (this.getControlWidgetsModeStr()) {

			case "minimalRT":
				contdivstyle = 'minimalCtrlsVertical minimalCtrlsVerticalRT';
				break;
		
			case "minimalLT":
				contdivstyle = 'minimalCtrlsVertical minimalCtrlsVerticalLT';
				break;
				
			default:
				contdivstyle = 'minimalCtrlsVertical minimalCtrlsVerticalLT';
		}
		
		if (contdivstyle.length > 0) 
		{
			var mapDiv = this.the_map.getMapDiv();
			var contdiv = document.createElement('div');
			contdiv.setAttribute('id', "mapctrl_minimalcontrols");
			contdiv.setAttribute('class', contdivstyle);
			
			var topdiv = document.createElement('div');
			topdiv.setAttribute('class', 'minimalCtrlsVerticalTop');
			contdiv.appendChild(topdiv);
			var spanplus = document.createElement('span');
			var spplustxt = document.createTextNode('+');
			
			var botdiv = document.createElement('div');
			botdiv.setAttribute('class', 'minimalCtrlsVerticalBottom');
			contdiv.appendChild(botdiv);
			var spanminus = document.createElement('span');
			var spminustxt = document.createTextNode('-');
			
			var mapctrl = this.the_map;
			
			(function(p_mapctrl) {
				attEventHandler(topdiv, 
						'mouseup', 
						function (e) {
							p_mapctrl.changeScale(p_mapctrl.getScale() / 2.0)
						}			
				);
				attEventHandler(botdiv, 
						'mousedown', 
						function (e) {
							p_mapctrl.changeScale(p_mapctrl.getScale() * 2.0)
						}			
				);
			})(mapctrl);
			
			spanplus.appendChild(spplustxt);
			topdiv.appendChild(spanplus);

			spanminus.appendChild(spminustxt);
			botdiv.appendChild(spanminus);	
			
			mapDiv.appendChild(contdiv);			
		}

		
	};
	
	this.addTool = function (the_tool) 
	{
		if (this.alltoolctrls[the_tool.getName()] === undefined) {
			this.alltoolctrls[the_tool.getName()] = the_tool;
			if (!this.deftoolname) {
				this.deftoolname = the_tool.getName();
			}
		}
		if (this.activetoolctrl == null) {
			this.activateTool(the_tool.getName());
		}
	};

	this.addBtn = function (the_btn) {
		var found = false;
		for (var i=0; i<this.allbtnctrls.length; i++)
		{	
			if (this.allbtnctrls[i].checkOtherName(the_tool)) {
				found = true;
				break;
			}
		}
		if (!found) {
			this.allbtnctrls.push(the_tool);
		}
	};

	this.getTool = function(toolname) {
		var ret = null;
		if (this.alltoolctrls[toolname] !== undefined && this.alltoolctrls[toolname] != null) {
			ret = this.alltoolctrls[toolname];
		}
		return ret;
	};
	
	this.activateTool = function(toolname) {
		console.log(this.msg("ACTTOOL")+toolname);
		var the_tool, ret = false;
		if (this.activetoolctrl == null || this.activetoolctrl.getName() != toolname)
		{
			the_tool = this.getTool(toolname);
			if (the_tool==null) {
				throw new Error(this.msg(String.format(this.msg("TOOLNOTFOUND"),toolname)));
			}
			this.activetoolctrl = the_tool;
			ret = true;
		}
		return ret;
	};

	this.setDefaultToolCtrl = function (toolname) {
		this.deftoolname = toolname;
		this.activateTool(this.deftoolname);
	};

	this.resumeDefaultTool = function () {
		this.activateTool(this.deftoolname);
	};
				
	this.getActiveTool = function() {
		if (this.activetoolctrl)
		{
			return this.activetoolctrl;
		}
		else
		{
			return null;
		}
	};
		
	this.getActiveToolName = function() {
		if (this.activetoolctrl)
		{
			return this.activetoolctrl.getName();
		}
		else
		{
			return '';
		}
	};
	
	this.mousedown = function(e, opt_nobuttons) {
		
		if (!e) var e = window.event;
		
		var op, target =  getTarget(e);
		let coords=[];
		
		finishEvent(e);
		
		/*
		if (target.parentNode) {
			op = target.parentNode;
		} else {
			op = target;
		}
		
		var xcoord = e.pageX - op.offsetLeft;
		var ycoord = e.pageY - op.offsetTop;
		*/

/*
		if (e.layerX !== undefined && e.layerX != 0) {
			xcoord = e.layerX;
			ycoord = e.layerY;
		} else if (e.offsetX !== undefined && e.offsetX != 0) {
			xcoord = e.offsetX;
			ycoord = e.offsetY;
		} else if (e.clientX !== undefined && e.clientX != 0) {
			xcoord = e.clientX;
			ycoord = e.clientY;
		}
*/		
		/*console.log(e);
		console.log(String.format("x,y: {0} {1}", xcoord, ycoord));*/
		getEvtCoords(e, target, coords);
		
		var ret, pt, at = this.getActiveTool();
		if (at && typeof at.mousedown == 'function') {
			ret = at.mousedown(e, target, coords[0], coords[1], opt_nobuttons);
		}
		pt = this.permanenttool;
		if (ret && pt && typeof pt.mousedown == 'function') {
			pt.mousedown(e, target, coords[0], coords[1], opt_nobuttons);
		}		
		
		return false;
	};

	this.mousemove = function(evt, opt_nobuttons) {
		
		var e, evt, target, tmp, coords=[];
		if (!evt) evt = window.event;
		
		if (evt.detail !== undefined && evt.detail != null && typeof evt.detail == 'object') 
		{
			tmp = evt.detail;
			if (tmp.detail !== undefined) {
				e = tmp.detail;
			} else {
				e = tmp;
			}
			target = e.target;
		} else {
			e = evt;
			target =  getTarget(e);
		}
		
		finishEvent(e);
		getEvtCoords(e, target, coords);

		var tname, pn, sw, y, fname, val, strwid;

		var terrain_pt = [];

		var ret, pt, at = this.getActiveTool();
		
		if (at && typeof at.mousemove == 'function') {
			ret = at.mousemove(e, target, coords[0], coords[1]);
		}	
		pt = this.permanenttool;
		if (ret && pt && typeof pt.mousemove == 'function') {
			pt.mousemove(e, target, coords[0], coords[1]);
		}	
		
		this.the_map.getTerrainPt([coords[0], coords[1]], terrain_pt);
		this.mousecoordswidgetids.forEach(
			function (item, index) {
				var wid = document.getElementById(item);
				if (wid) {
					wid.innerHTML = formatFracDigits(terrain_pt[0],2)+','+formatFracDigits(terrain_pt[1],2);
				}
			}
		);

		return false;
	};
	
	this.mouseup = function(e, p_forcedcoords) {
		
		if (!e) var e = window.event;
		let coords=[], target =  getTarget(e);
		
		finishEvent(e);
		
		if (p_forcedcoords!=null && p_forcedcoords.length > 1) {
			coords[0] = p_forcedcoords[0];
			coords[1] = p_forcedcoords[1];
		} else {
		getEvtCoords(e, target, coords);
		}
				
		var ret, pt, at = this.getActiveTool();
		if (at && typeof at.mouseup == 'function') {
			ret = at.mouseup(e, target, coords[0], coords[1]);
		}
		pt = this.permanenttool;
		if (ret && pt && typeof pt.mouseup == 'function')
		{
			pt.mouseup(e, target, coords[0], coords[1]);
		}
		
		return false;
	};
	
	this.mouseleave = function(e) {
		var at = this.getActiveTool();
		if (at != null) {
			if (at.mouseleave_eq_mouseup) {
				this.mouseup(e);
			} else {
				at.reset();
			}
		}
		return finishEvent(e);
	};
	


	
}
