
var MOUSEBTN_LEFT = 1;
var MOUSEBTN_MIDDLE = 2;
var MOUSEBTN_RIGHT = 4;

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
	
	this.mousedown = function(e, target, x, y) 
	{
		var terrain_pt=[];
		
		if (!this.started)
		{
			var retfmb = filterMouseButton(e, this.mouseButtonMask)
			if (!retfmb[2]) {
				return; 
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
			
			if (this.the_map.finishPan(x, y, this.start_terrain, this.start_screen)) {
				this.the_map.mapctrlsmgr.resetTransient();
			}			
			this.start_terrain = null;
		}
		
		// Allow actuation of permanent tool
		return true;
	};

	this.mousemove = function(e, target, x, y) 
	{
		var terrain_pt=[];

		if (this.started)
		{
			this.the_map.transientPan(x, y, this.start_terrain, this.start_screen);
		}

		// Allow actuation of permanent tool
		return true;
	};

}

extend(Pan, _Basetool);

function Picker(mouseButtonMask, p_mapctrl, p_searchtolerance) 
{
	this.getClassStr = function() {
		return "Picker tool (Picker)";
	};

	this.mouseButtonMask = mouseButtonMask;
	this.searchtolerance = p_searchtolerance;
	this.name = 'picker';
	this.the_map = p_mapctrl;
	
	this.setTolerance = function(p_tolvalue) {
		this.searchtolerance = p_tolvalue;
	}
	this.getTolerance = function() {
		return this.searchtolerance;
	}
	
	this.mousedown = function(e, target, x, y) 
	{
		if (!this.mousedown_ocurred)
		{
			var retfmb = filterMouseButton(e, this.mouseButtonMask)
			if (!retfmb[2]) {
				return; 
			}		
			this.start_screen = [x, y];
	
			this.mousedown_ocurred = true;
		}
		
		// Allow actuation of permanent tool
		return true;
	};
	
	this.mouseup = function(e, target, x, y) 
	{
		if (this.mousedown_ocurred) {
			
			var func;
			
			for (var lname in this.actions_per_evttype_per_layer['mouseup']) 
			{
				if (!this.actions_per_evttype_per_layer['mouseup'].hasOwnProperty(lname)) {
					continue;
				}
				
				func = this.actions_per_evttype_per_layer['mouseup'][lname];
				func(this.the_map, x, y, lname, this.searchtolerance);
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

				var func = this.actions_per_evttype_per_layer['mousemove'][lname];
				func(this.the_map, x, y, lname, this.searchtolerance);
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
	this.location = [];
	this.waitPeriodMsec = 400;
	
	this.clearReference = function() {
		if (this.timerId != null) {
			window.clearTimeout(this.timerId);
			this.timerId = null;
		}
		//this.location.length = 0;
	};
	
	this.mousewheel= function(e) 
	{
		let k;
		let newscale = this.controls_mgr.the_map.getScale();

		if (!e) var e = window.event;
		
		let delta = getWheelDelta(e);
		let adelta = Math.abs(delta);
		var op, target =  getTarget(e);

		if (adelta < 5) {
			return finishEvent(e);
		}
		
		if (target.parentNode) {
			op = target.parentNode;
		} else {
			op = target;
		}
		
		var xcoord = e.pageX - op.offsetLeft;
		var ycoord = e.pageY - op.offsetTop;
		
		e.cancelBubble=true;
		try {
			e.stopPropagation();
		} catch(e) {
			// fazer nada
			var zz = null;
		}
			
		k = 1 + adelta/200.0;
			
		if (delta > 0) {
			newscale /= k;
		}
		else {
			newscale *= k;
		}
		
		//console.log("delta:"+k+", newsacel:"+newscale);
		
		/*
		let t1, delta=0, doredraw;
		
			t1 = Date.now() * 1.0;
			if (this.time_start < 0) {
				this.time_start = t1;
				delta = 0;
			} else {
				delta = t1 - this.time_start;
				this.time_start = t1;
			}

		if (delta >= 0 && delta <= this.TIMEOUT) {
			doredraw = true;
		} else {
			doredraw = false;
		}

		
		this.controls_mgr.the_map.updateM_scrDiffFromLastSrvResponse();
		this.controls_mgr.the_map.scrDiffFromLastSrvResponse.scaleFromCenter(xcoord, ycoord);
		this.controls_mgr.the_map.changeScale(newscale, doredraw, pt[0], pt[1], this.TIMEOUT);
		
		if (doredraw) {
			if (this.timerinterval != null) {
				window.clearInterval(this.timerinterval);
			}
			this.timerinterval = window.setInterval(
				(function(p_self) {
					return function(e) {
						p_self.testintervalF(e);
					}
				})(this),
				this.TIMEOUT);
		} else {
			if (this.timerinterval != null) {
				this.resetTimer();
			}
		}
		* */
		
		this.controls_mgr.the_map.quickChangeScale(newscale, xcoord, ycoord);
		
		if (this.timerId != null) {
			window.clearTimeout(this.timerId);
		}

		(function(p_self) {
			p_self.timerId =  window.setTimeout(function(e) {
				p_self.controls_mgr.the_map.refresh(false);
				p_self.clearReference();
			}, p_self.waitPeriodMsec);
		})(this);
					
		return finishEvent(e);
	}	
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
		
	this.mousedown = function(e, target, x, y) 
	{
		if (!this.mousedown_ocurred)
		{
			var retfmb = filterMouseButton(e, this.mouseButtonMask)
			if (!retfmb[2]) {
				return; 
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
					func(this.the_map, x, y, lname, this.searchtolerance);
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
		var dx, dy, ang,  angvals = [], retpt=[], func = null, draw_dolog = false; forcemx = false, inscreenspace = false;
		
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
				func(this.the_map, x, y, lname, this.searchtolerance);
			}
			
			// default tool behaviour
			if (func == null && this.start_map.length > 0) {

				current_map = [];
				this.the_map.getTerrainPt([x,y], current_map);
				
				this.the_map.grController.clearDisplayLayer('transient');

				this.measvalterrain = formatFracDigits(geom.distance([this.start_map[0], this.start_map[1]], [current_map[0], current_map[1]]), 2);

				this.the_map.drawCircle(this.start_map[0], this.start_map[1], this.measvalterrain, 
					true, true, false, styleobj, 'transient');

				this.the_map.drawSimplePath([this.start_map[0], this.start_map[1], current_map[0], current_map[1]], 
					true, false, inscreenspace, styleobj, 'transient', draw_dolog, forcemx); 
					
				geom.twoPointAngle(this.start_screen, [x,y], angvals);
				
				ang = angvals[0];
				if (angvals[1] == 2 || angvals[1] == 3) {
					this.the_map.grController.setTextAlign("end",'transient');
					geom.applyPolarShiftTo([x,y], ang, -10, retpt);
				} else {
					this.the_map.grController.setTextAlign("start",'transient');
					geom.applyPolarShiftTo([x,y], ang, 10, retpt);
				}
				
				geom.applyPolarShiftTo(retpt, ang+(Math.PI/2.0), 6, retpt);
				
				this.the_map.grController.saveCtx('transient');
				this.the_map.grController.setFont('20px Arial', 'transient');
				this.the_map.grController.setFillStyle('rgba(255,0,0,1)', 'transient');

// TODO: FILLSTROKE
				this.the_map.grController.rotatedText(this.measvalterrain+" m", retpt, ang, 'transient');
				this.the_map.grController.restoreCtx('transient');
					
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
				"NONEW": "'MapControlsMgr' é classe, o seu construtor foi invocado sem 'new'",				
				"NULLMAP": "'MapControlsMgr'sem mapa associado",
				"INVTOOLNAME": "Identificador '{0}' de tool inválido na configuração do mapa",
				"TOOLNOTFOUND": "Tool '{0}' não encontrada, provavelmente não foi incluída na configuração de mapa em controlssetup->tools"	
						
			},			
			"en": {
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
		// TODO: resolver detecção automática lang
		//var langstr = navigator.language || navigator.userLanguage;
		//var lang = langstr.splice(1,2);
		var lang = "pt";
		return this.i18nmsgs[lang][p_msgkey];
	};
			
	if ( !(this instanceof arguments.callee) )
		throw new Error(this.msg("NONEW"));

	if (p_the_map == null)
		throw new Error(this.msg("NULLMAP"));
	
	this.the_map = p_the_map;
	this.tools_searchradius = 1.0;
	this.tools_controlwidgets = 'none';
	
	this.alltoolctrls = {};
	this.allbtnctrls = [];
	this.mousecoordswidgetids = [];
	this.activetoolctrl = null;
	this.permanenttool = new Pan(MOUSEBTN_MIDDLE | MOUSEBTN_LEFT, this.the_map);
	this.deftoolname = null;
	this.legend_widget_name = null;
	
	this.mouseWheelCtrler = new mouseWheelController(this);
	
	this.resetTransient = function() {
		// nada
	};
	
	this.readConfig = function(p_initconfig) 
	{		
		var cobj;
		
		if (p_initconfig["searchradius"] !== undefined && p_initconfig["searchradius"] != null) {
			this.tools_searchradius = parseFloat(p_initconfig["searchradius"]);
		} else {
			this.tools_searchradius = 2;
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
		if (p_initconfig["legend_widget_name"] !== undefined && p_initconfig["legend_widget_name"] != null) {
			this.legend_widget_name = p_initconfig["legend_widget_name"];
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
								p_self.addTool(new Picker(MOUSEBTN_LEFT, p_self.the_map, p_self.tools_searchradius));
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
			
			attEventHandler(topdiv, 
					'mouseup', 
					function (e) {
						mapctrl.changeScale(mapctrl.getScale() / 2.0)
					}			
			);
			attEventHandler(botdiv, 
					'mousedown', 
					function (e) {
						mapctrl.changeScale(mapctrl.getScale() * 2.0)
					}			
			);

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
		console.log("Activate tool:"+toolname);
		var the_tool, ret = false;
		if (this.activetoolctrl == null || this.activetoolctrl.getName() != toolname)
		{
			the_tool = this.getTool(toolname);
			if (the_tool==null) {
				throw new Error(this.msg(String.format("TOOLNOTFOUND",toolname)));
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
	
	this.mousedown = function(e) {
		
		if (!e) var e = window.event;
		e.cancelBubble=true;
		e.stopPropagation();
		var op, target =  getTarget(e);
		
		if (target.parentNode) {
			op = target.parentNode;
		} else {
			op = target;
		}
		
		var xcoord = e.pageX - op.offsetLeft;
		var ycoord = e.pageY - op.offsetTop;
		
		var ret, pt, at = this.getActiveTool();
		if (at && typeof at.mousedown == 'function')
		{
			ret = at.mousedown(e, target, xcoord, ycoord);
		}
		pt = this.permanenttool;
		if (ret && pt && typeof pt.mousedown == 'function')
		{
			pt.mousedown(e, target, xcoord, ycoord);
		}		
		
		return finishEvent(e);
	};

	this.mousemove = function(evt) {
		
		var e, evt, target, tmp;
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
		
		evt.cancelBubble=true;
		evt.stopPropagation();

		var tname, pn, sw, y, fname, val, strwid;
		var op;
		
		if (target.parentNode !== undefined && target.parentNode != null) {
			op = target.parentNode;
		} else {
			op = target;
		}
		
		var xcoord = e.pageX - op.offsetLeft;
		var ycoord = e.pageY - op.offsetTop;
		var terrain_pt = [];

		var ret, pt, at = this.getActiveTool();
		
		if (at && typeof at.mousemove == 'function')
		{
			ret = at.mousemove(e, target, xcoord, ycoord);
		}	
		pt = this.permanenttool;
		if (ret && pt && typeof pt.mousemove == 'function')
		{
			pt.mousemove(e, target, xcoord, ycoord);
		}	
		
		this.the_map.getTerrainPt([xcoord, ycoord], terrain_pt);
		this.mousecoordswidgetids.forEach(
			function (item, index) {
				var wid = document.getElementById(item);
				if (wid) {
					wid.innerHTML = formatFracDigits(terrain_pt[0],2)+','+formatFracDigits(terrain_pt[1],2);
				}
			}
		);

		return finishEvent(evt);
	};
	
	this.mouseup = function(e) {
		
		if (!e) var e = window.event;
		e.cancelBubble=true;
		e.stopPropagation();
		var op, target =  getTarget(e);
		
		if (target.parentNode) {
			op = target.parentNode;
		} else {
			op = target;
		}
		
		var xcoord = e.pageX - op.offsetLeft;
		var ycoord = e.pageY - op.offsetTop;
				
		var ret, pt, at = this.getActiveTool();
		if (at && typeof at.mouseup == 'function')
		{
			ret = at.mouseup(e, target, xcoord, ycoord);
		}
		pt = this.permanenttool;
		if (ret && pt && typeof pt.mouseup == 'function')
		{
			pt.mouseup(e, target, xcoord, ycoord);
		}
		
		return finishEvent(e);
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
