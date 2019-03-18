
// raio para fazer fit a circulo em volta de local seleccionado, quando não existe retângulo da área seleccionada.
var ZOOMLOC_RADIUS = 120;

// Marcador da selecção de local com rato no mapa
var PT_MARKER_SZ = 16;
var PT_MARKER_COLOR = 'red';
var PT_MARKER_SHADE = 'rgba(0,200,200,0.1)'
var PT_MARKER_RADMULTIPLIER = 2// raio de pesquisa, multiplicador do picker tolerance 
//var RADIUS_PICKER_METERS = 7;

var MAP_SRID = 27493; // Datum 73
 
var NPolHighlighter = {
	
	currentFoundFeature: {
		"layer": null,
		"oid": null,
		"np": null,
		"areaespecial": null,
		"freg": null,
		"cod_freg": null,
		"cod_postal3": null,
		"cod_postal4": null,
		"codtopo": null,
		"toponimo": null,
		"notas": null,
		"frac": null,
		"loc": [],
		"is_final": false
	},
	
	markedFeature: {
		"layer": null,
		"oid": null,
		"np": null
	},
	
	debugStr: function() {
		return "NPolHighlighter final:"+this.currentFoundFeature.is_final + " lyr:"+this.currentFoundFeature.layer + " oid:"+this.currentFoundFeature.oid + " MARKED -- lyr: "+this.markedFeature.layer + " oid:"+this.markedFeature.oid;
	},

	clearMarked: function() {
		//console.log("    NPolHighlighter clear");
		this.markedFeature.layer = null;
		this.markedFeature.oid = null;
		this.markedFeature.np = null;
	},
	
	setMarked: function() {
		if (this.currentFoundFeature.is_final) {
			this.markedFeature.layer = this.currentFoundFeature.layer;
			this.markedFeature.oid = this.currentFoundFeature.oid;
			this.markedFeature.np = this.currentFoundFeature.np;
		}
	},
	
	clear: function() {
		this.currentFoundFeature.layer = null;
		this.currentFoundFeature.oid = null;
		this.currentFoundFeature.np = null;
		this.currentFoundFeature.areaespecial = null;
		this.currentFoundFeature.freg = null;
		this.currentFoundFeature.cod_freg = null;
		this.currentFoundFeature.cod_postal3 = null;
		this.currentFoundFeature.cod_postal4 = null;
		this.currentFoundFeature.codtopo = null;
		this.currentFoundFeature.toponimo = null;
		this.currentFoundFeature.notas = null;
		this.currentFoundFeature.frac = null;
		this.currentFoundFeature.loc = [];
		this.currentFoundFeature.is_final = false;
	},
	
	transientLayerCleared: function() {
		if (!this.currentFoundFeature.is_final) {
			this.clear();
		}
	},
	
	transferData: function(transfer_obj) 
	{
		TRANSMIT_OBJECT.npol = this.currentFoundFeature.np;
		TRANSMIT_OBJECT.areaespecial = this.currentFoundFeature.areaespecial;
		TRANSMIT_OBJECT.freg = this.currentFoundFeature.freg;
		TRANSMIT_OBJECT.cod_freg = this.currentFoundFeature.cod_freg;
		TRANSMIT_OBJECT.cod_postal3 = this.currentFoundFeature.cod_postal3;
		TRANSMIT_OBJECT.cod_postal4 = this.currentFoundFeature.cod_postal4;
		TRANSMIT_OBJECT.codtopo = this.currentFoundFeature.codtopo;
		TRANSMIT_OBJECT.toponimo = this.currentFoundFeature.toponimo;
		
		TRANSMIT_OBJECT.notas = this.currentFoundFeature.notas;
		TRANSMIT_OBJECT.frac = this.currentFoundFeature.frac;
		TRANSMIT_OBJECT.loc = [this.currentFoundFeature.loc[0], this.currentFoundFeature.loc[1]];		
		
		var retstr;
		
		if (TRANSMIT_OBJECT.npol != null && TRANSMIT_OBJECT.npol.length > 0) {
			retstr = TRANSMIT_OBJECT.toponimo + " " + TRANSMIT_OBJECT.npol;
		} else {
			retstr = TRANSMIT_OBJECT.toponimo;
		}
		
		return retstr;
	},


	tempHighlightIsOn: function() {
		return (!this.currentFoundFeature.is_final && (this.currentFoundFeature.layer != null || this.currentFoundFeature.oid != null));
	},

	doHighlight: function(layername, oid, p_is_final, opt_dodebug) 
	{
		if (!MAPCTRL.checkLayerVisibility(layername)) {
			return;
		}

		var topovals, dlayer, angle_ret=[], anchor=[], npol, strk_guide, stroke_centerline, basecolor_rgbtriplet;
		var inscreenspace = true;
		
		if (p_is_final)
		{
			dlayer = 'temporary';
			basecolor_rgbtriplet = [255,0,0];
			this.currentFoundFeature.is_final = true;
			MAPCTRL.unregisterOnDrawFinish("highlighttopo");
		}
		else
		{
			dlayer = 'transient';
			basecolor_rgbtriplet = [255,200,35];
			this.currentFoundFeature.is_final = false;
		}
		
		if (p_is_final || (layername != this.currentFoundFeature.layer || oid != this.currentFoundFeature.oid))
		{
			MAPCTRL.clearTransient();

			this.currentFoundFeature.layer = layername;
			this.currentFoundFeature.oid = oid;
			
			if (basecolor_rgbtriplet && basecolor_rgbtriplet.length>0) {
				strk_guide = String.format(
						"rgba({0},{1},{2},1)", 
						basecolor_rgbtriplet[0], basecolor_rgbtriplet[1], 
						basecolor_rgbtriplet[2]
					);
				stroke_centerline = String.format(
						"rgba({0},{1},{2},0.5)", 
						basecolor_rgbtriplet[0], basecolor_rgbtriplet[1], 
						basecolor_rgbtriplet[2]
					);
				
			} else {
				strk_guide = "rgba(255,200,35,1)";
				stroke_centerline = "rgba(255,200,35,0.5)";				
			}
			
			var idx, npprojs_fromtopo, npproj, npprojfeat=null, topovals, npfeat = MAPCTRL.getFeature(layername, oid);
			var outpts = [];
			if (npfeat) 
			{
				this.currentFoundFeature.np = npfeat.attrs["n_policia"];
				this.currentFoundFeature.codtopo = npfeat.attrs["cod_topo"];		

				if (npfeat.attrs['ae'] && npfeat.attrs['ae'].length > 0) {
					this.currentFoundFeature.areaespecial = npfeat.attrs['ae'];
				}
				if (npfeat.attrs['cod_freg'] && npfeat.attrs['cod_freg'].length > 0) {
					this.currentFoundFeature.cod_freg = npfeat.attrs['cod_freg'];
				}
				if (npfeat.attrs['designacao'] && npfeat.attrs['designacao'].length > 0) {
					this.currentFoundFeature.freg = npfeat.attrs['designacao'];
				}
				
				if (npfeat.points.length > 1) {
					 MAPCTRL.getTerrainPt([npfeat.points[0],npfeat.points[1]], outpts)
					this.currentFoundFeature.loc = [outpts[0],outpts[1]];
				}
				
				idx = MAPCTRL.getGlobalIndex("NP_IX");
				npprojs_fromtopo = idx[this.currentFoundFeature.codtopo];
				if (npprojs_fromtopo) {
					npproj = npprojs_fromtopo[this.currentFoundFeature.np];
					if (npproj!==undefined && npproj['oid']!==undefined &&  npproj['oid'].length > 0) {
						npprojfeat = MAPCTRL.drawSingleFeature("NPOLPROJD", npproj['oid'], inscreenspace, [], dlayer,  
										{										
											"strokecolor": strk_guide,
											"linewidth": 3,
											"shadowcolor": "#444",
											"shadowoffsetx": 2,
											"shadowoffsety": 2,
											"shadowblur": 2
										});
					}
				}
							
				topovals = MAPCTRL.getValueFromGlobalIndex("TOPO_IX", this.currentFoundFeature.codtopo, "toponimo");
				if (topovals != null && topovals.length > 0) {
					this.currentFoundFeature.toponimo = topovals[0];
				}

				// marcar eixos de via do arruamento
				if (!this.currentFoundFeature.codtopo) {
					console.log(JSON.stringify(feat));
					console.log(JSON.stringify(this.currentFoundFeature));
					throw new Error("null codtopo lyr:"+layername+", oid;"+oid);
				}

				MAPCTRL.drawFromIndex('EV','TOPO_IX', this.currentFoundFeature.codtopo, inscreenspace, dlayer,
						opt_dodebug, {
							"strokecolor": stroke_centerline,
							"linewidth": 14
						});				
			}		
				
			if (npprojfeat != null) 
			{
				geom.twoPointAngle(
						[npprojfeat.points[0], npprojfeat.points[1]], 
						[npprojfeat.points[2], npprojfeat.points[3]],
						angle_ret
				);

				MAPCTRL.grController.saveCtx(dlayer);
				
				MAPCTRL.grController.setFillStyle(strk_guide, dlayer);
				MAPCTRL.grController.setFont('24px Arial', dlayer);
				
				if (angle_ret[1]==2 || angle_ret[1]==3) {
					MAPCTRL.grController.setTextAlign('left', dlayer);
					geom.applyPolarShiftTo([npprojfeat.points[0], npprojfeat.points[1]], angle_ret[0], 6, anchor);
				} else {
					MAPCTRL.grController.setTextAlign('right', dlayer);
					geom.applyPolarShiftTo([npprojfeat.points[0], npprojfeat.points[1]], angle_ret[0], -6, anchor);
				}
				MAPCTRL.grController.setBaseline('middle', dlayer);

				MAPCTRL.grController.setShadowColor('#444', dlayer);
				MAPCTRL.grController.setShadowOffsetX(2, dlayer);
				MAPCTRL.grController.setShadowOffsetY(2, dlayer);
				MAPCTRL.grController.setShadowBlur(2, dlayer);
				
				
				MAPCTRL.grController.rotatedText(this.currentFoundFeature.np, anchor, angle_ret[0], dlayer);

				MAPCTRL.grController.restoreCtx(dlayer);
			}
			
			if (p_is_final) {
				this.setMarked();
			}
		}
		
	},


	doHighlightMarked: function() 
	{
		if (this.markedFeature.layer != null && this.markedFeature.oid != null) {
			if (MAPCTRL.checkLayerVisibility(this.markedFeature.layer)) {
				this.doHighlight(this.markedFeature.layer, this.markedFeature.oid, true);
			}
		}
		
	}


};

function drawPickMarker(p_mapctrl, p_jsontree, p_screencords, p_hide_tolgauge) {
	
	var scrrad = 1.0, screencoords = [];
	
	var picker_tool = MAPCTRL.mapctrlsmgr.getTool('picker')
	if (!p_hide_tolgauge && picker_tool!=null) {
		var pt_tol = picker_tool.getTolerance();
		var searchtolerance = (MAPCTRL.getScale() / 1000.0) * pt_tol;
		scrrad = PT_MARKER_RADMULTIPLIER * searchtolerance * MAPCTRL.getScreenScalingFactor();
	}

	if (p_jsontree) {
		p_mapctrl.getScreenPtFromTerrain(p_jsontree.loc[0], p_jsontree.loc[1], screencoords);	
	} else if (p_screencords) {
		screencoords = p_screencords;
	} else {
		throw new Error('drawPickMarker: invalid p_screencords parameter');
	}
	
	// console.log(" coords:"+JSON.stringify(screencoords)+" rad:"+scrrad);
	
	p_mapctrl.grController.saveCtx('temporary');
	p_mapctrl.grController.setStrokeStyle(PT_MARKER_COLOR, 'temporary');

	p_mapctrl.grController.setFillStyle(PT_MARKER_SHADE, 'temporary');
	
	p_mapctrl.grController.clearDisplayLayer('transient');
	p_mapctrl.grController.clearDisplayLayer('temporary');

	if (!p_hide_tolgauge) {
		p_mapctrl.drawCircle(
			screencoords[0], 
			screencoords[1], 
			scrrad, true, true, true, null, 'temporary'
		); 
	}

	p_mapctrl.setMarkerSize(PT_MARKER_SZ);
	p_mapctrl.grController.setLineWidth(3, 'temporary');
	p_mapctrl.drawCrossHairs(screencoords[0], screencoords[1], true, false, true, 'temporary');
	p_mapctrl.grController.restoreCtx('temporary');

}

function toponimHighlightAnimator(p_mapctrl, p_cod_topo, p_marker_coords) {
	
	this.cod_topo = p_cod_topo;
	this.MAPCTRL = p_mapctrl;
	this.linewidth = 0;
	this.maxwidth = 40;
	this.dir = 'out';
	this.stepout = 3;
	this.stepin = 3;
	this.marker_coords = p_marker_coords;
	
	(function(p_obj) {
		p_obj.drawInCanvas = function(p_lw, p_final) {
			p_obj.MAPCTRL.clearTemporary();
			if (p_final) {
				p_obj.MAPCTRL.drawFromIndex('EV','TOPO_IX', p_obj.cod_topo, true, 'temporary',
						false, {
							"strokecolor": "rgba(255,0,0,1)",
							"linecap": "butt",
							"linewidth": parseInt(p_lw)
							});
			} else {
				p_obj.MAPCTRL.drawFromIndex('EV','TOPO_IX', p_obj.cod_topo, true, 'temporary',
						false, {
							"strokecolor": "rgba(255,0,0,0.4)",
							"linecap": "butt",
							"linewidth": parseInt(p_lw)
							});
			}
		};
	})(this);
	
	(function(p_obj) {
		p_obj.draw = function() {

			var realsrchtol, scrrad;
			
			//console.log(" dir:"+p_obj.dir + " lw:" + p_obj.linewidth);
			
			p_obj.drawInCanvas(p_obj.linewidth);
			if (p_obj.dir == 'out') 
			{
				p_obj.linewidth += p_obj.stepout;		
				if (p_obj.linewidth >= p_obj.maxwidth) {
					p_obj.dir = 'in';
				}
			} else {
				p_obj.linewidth -= p_obj.stepin;			
			}
			if (p_obj.dir == 'out' || p_obj.linewidth > 2) {
				window.requestAnimationFrame(p_obj.draw);
			} else {

				// final
				p_obj.drawInCanvas(4, true);

				// desenhar a cruz do ponto, se for caso disso
				if (p_obj.marker_coords) {
					drawPickMarker(MAPCTRL, PREVLOCJSONTREE, p_obj.marker_coords);
				}

			}
		
		}
	})(this);
	
	window.requestAnimationFrame(this.draw);
} 

var TRANSMIT_FIELDS = [
      "areaespecial",
      "cod_freg",
      "cod_postal3",
      "cod_postal4",
      "codtopo",
      "frac",
      "freg",
      "loc",
      "notas",
      "npol",
      "toponimo"
      ];


function emitParentEvent(transmit_obj, opstr, error_ocurred) {

    var eventObj = {'op': opstr};
    if (!error_ocurred) {
		fillRetObj(eventObj, transmit_obj);
    }
    parent.postMessage(JSON.stringify(eventObj), '*');

}

function fillRetObj(retObj, transmit_obj) {

	var to;
	if (transmit_obj == null) {
		to = TRANSMIT_OBJECT;
	} else {
		to = transmit_obj;
	}
	
    if (typeof to.codtopo != 'undefined') {
    	retObj.codtopo = to.codtopo;
    	retObj.toponimo = to.toponimo;
    } else if (typeof to.cod_topo != 'undefined') {
    	retObj.codtopo = to.cod_topo;
    	retObj.toponimo = to.toponimo;
    }

    if (typeof to.npol != 'undefined') {
    	retObj.npol = to.npol;
    } else if (typeof to.n_policia != 'undefined') {
    	retObj.npol = to.n_policia;
	}

    if (typeof to.frac != 'undefined') {
    	retObj.frac = to.frac;
    } else if (typeof to.fraccao != 'undefined') {
    	retObj.frac = to.fraccao;
    }
    
    if (typeof to.loc != 'undefined') {
	    retObj.x = to.loc[0];
	    retObj.y = to.loc[1];
    }

    if (typeof to.areaespecial != 'undefined') {
    	retObj.areaespecial = to.areaespecial;
    }

    if (typeof to.cod_postal4 != 'undefined') {
    	retObj.cod_postal4 = to.cod_postal4;
    }

    if (typeof to.cod_postal3 != 'undefined') {
    	retObj.cod_postal3 = to.cod_postal3;
    }

    if (typeof to.freg != 'undefined') {
    	retObj.freg = to.freg;
    	retObj.cod_freg = to.cod_freg;
    } else if (typeof to.freguesia != 'undefined' && to.freguesia != null) {
    	retObj.freg = to.freguesia;
    	retObj.cod_freg = to.cod_freg;
	}

    if (typeof to.notas != 'undefined') {
    	retObj.notas = to.notas;
    }
}


function bodyUnload() 
{
    var obj = window.dialogArguments;
    if (typeof obj != 'undefined') {
    	obj.returnvalue = {};

    	fillRetObj(obj.returnvalue);
    }

}

function terrainDelta(scaleval, delta) {
	return (scaleval * delta / 1000.0);
}

function validateRetValues(p_retobj) {

	var ret=false;
	
	//, retobj = {};
	//fillRetObj(retobj);
	
	/*
	console.log("---- retobj ----");
	console.log(retobj);
	* */

	if (p_retobj.npol != null && p_retobj.npol.length > 0) {
		ret = true;
	} else {
		if (p_retobj.x != null && p_retobj.y != null) {
			ret = true;
		}
	}

	return ret;
}

function hideRetValueArea() 
{
	var wdg0 = document.getElementById('showresultarea');
	if (wdg0) {
		wdg0.style.display = 'none';	
	}			
}

function checkInputBoxesDisplay() 
{
	var sra = document.getElementById('showresultarea');
	if (sra!=null) 
	{
		if (!checkInteropParams())
		{		
			applyFunctionByClasses(sra, ['hiddable_inputs'],
				function(obj) {
					obj.style.display = 'none';
				},
				5
			);
		} else {
			applyFunctionByClasses(sra, ['hiddable_inputs'],
				function(obj) {
					obj.style.display = '';
				},
				5
			);
		}
	}
}

function checkEmptyRetField(retobj, p_fieldname) {
	var ret = true;
	if (retobj[p_fieldname] !== undefined && retobj[p_fieldname] != null && 
		  retobj[p_fieldname] != 'undefined' && retobj[p_fieldname] != 'null') {
			  ret = false;
	}
	return ret;
}

function checkAnyRetRecord(retobj) {
	var fi, fields = [
		"codtopo",
		"toponimo",
		"npol",
		"frac",
		"x",
		"y",
		"cod_postal4",
		"cod_postal3",
		"notas",
		"freg",
		"areaespecial"
	]; 
	var fi = 0, ret = false, field;
	while (fields[fi] !== undefined && fields[fi] != null) 
	{
		field = fields[fi];
		if (!checkEmptyRetField(retobj, field)) {
			ret = true;
			break;
		}
		fi++;
	}
	
	return ret;
}

function showRetValues(trans_obj_or_null, p_allow_saving) 
{
	var tmpn, wdg, wdg0 = document.getElementById('showresultarea');

	var enable_editable_wdgs = checkEditingViability();

	if (wdg0) {
		
		tmpn = document.getElementById('showresultarea_alt');
		if (tmpn) {
			tmpn.style.display = 'none';
		}

		var retobj = {};
		fillRetObj(retobj, trans_obj_or_null);
		
		if (!checkAnyRetRecord(retobj)) {
			wdg0.style.display = 'none';
			return;
		}

		wdg = document.getElementById('cod_topo_cell');
		if (wdg) {
			if (retobj.codtopo !== undefined && retobj.codtopo != null && retobj.codtopo != 'undefined' && retobj.codtopo != 'null') {
				wdg.innerHTML = retobj.codtopo;
			} else {
				wdg.innerHTML = '';
			}
		}

		wdg = document.getElementById('topo_cell');
		if (wdg) {
			if (retobj.toponimo !== undefined && retobj.toponimo != null && retobj.toponimo != 'undefined' && retobj.toponimo != 'null') {
				wdg.innerHTML = retobj.toponimo;
			} else {
				wdg.innerHTML = '';
			}
		}

		wdg = document.getElementById('cod_npol_cell');
		if (wdg) {
			if (retobj.npol !== undefined && retobj.npol != null && retobj.npol != 'undefined' && retobj.npol != 'null') {
				wdg.innerHTML = retobj.npol;
			} else {
				wdg.innerHTML = '';
			}
		}

		wdg = document.getElementById('frac_cell');
		if (wdg) {
			if (enable_editable_wdgs) {
				wdg.removeAttribute('disabled');
			} else {
				wdg.disabled = 'disabled';
			}
		    if (retobj.frac !== undefined && retobj.frac != null && retobj.frac != 'undefined' && retobj.frac != 'null') 
		    {	
				wdg.value = retobj.frac;
			} else {
				wdg.value = '';
			}
		}

		wdg = document.getElementById('val_xy_cell');
		if (wdg) 
		{
			if (retobj.x !== undefined && retobj.x != null && retobj.x != 'undefined' && retobj.x != 'null') {
				wdg.innerHTML = formatFracDigits(retobj.x,2) + ", " + formatFracDigits(retobj.y,2);
			} else {
				wdg.innerHTML = '';
			}
		}

		wdg = document.getElementById('cod_postal4_cell');
		if (wdg) 
		{
			if (enable_editable_wdgs) {
				wdg.removeAttribute('disabled');
			} else {
				wdg.disabled = 'disabled';
			}
			if (retobj.cod_postal4 !== undefined && retobj.cod_postal4 != null && retobj.cod_postal4 != 'undefined' && retobj.cod_postal4 != 'null') {
				wdg.value = retobj.cod_postal4;
			} else {
				wdg.value = '';
			}
		}

		wdg = document.getElementById('cod_postal3_cell');
		if (wdg) 
		{
			if (enable_editable_wdgs) {
				wdg.removeAttribute('disabled');
			} else {
				wdg.disabled = 'disabled';
			}
			if (retobj.cod_postal3 !== undefined && retobj.cod_postal3 != null && retobj.cod_postal3 != 'undefined' && retobj.cod_postal3 != 'null') {
				wdg.value = retobj.cod_postal3;
			} else {
				wdg.value = '';
			}
		}

		wdg = document.getElementById('notas_cell');
		if (wdg) 
		{
			if (enable_editable_wdgs) {
				wdg.removeAttribute('disabled');
			} else {
				wdg.disabled = 'disabled';
			}
			if (retobj.notas !== undefined && retobj.notas != null && retobj.notas != 'undefined' && retobj.notas != 'null') {
				wdg.innerHTML = retobj.notas;
			} else {
				wdg.innerHTML = '';
			}
		}

		wdg = document.getElementById('freg_cell');
		if (wdg) 
		{
			if (retobj.freg !== undefined && retobj.freg != null && retobj.freg != 'undefined' && retobj.freg != 'null') {
				wdg.innerHTML = retobj.freg;
			} else {
				wdg.innerHTML = '';
			}
		}

		wdg = document.getElementById('area_especial_cell');
		if (wdg) {
			if (retobj.areaespecial !== undefined && retobj.areaespecial != null && retobj.areaespecial != 'undefined' && retobj.areaespecial != 'null') {
				wdg.innerHTML = retobj.areaespecial;
			} else {
				wdg.innerHTML = '';
			}
		}

		wdg0.style.display = '';

		checkInputBoxesDisplay();

		AutocompleteObjMgr.enableCleanWidget('geocode', true);

		if (p_allow_saving && validateRetValues(retobj)) {
			activateSaveBtn();
		}

	}
}

function clearRetValues() {
	var wdg, wdg0 = document.getElementById('showresultarea');
	if (wdg0) {

		wdg = document.getElementById('cod_topo_cell');
		if (wdg) {
				wdg.innerHTML = '';
		}

		wdg = document.getElementById('topo_cell');
		if (wdg) {
				wdg.innerHTML = '';
		}

		wdg = document.getElementById('cod_npol_cell');
		if (wdg) {
				wdg.innerHTML = '';
		}

		wdg = document.getElementById('frac_cell');
		if (wdg) {
				wdg.value = '';
		}

		wdg = document.getElementById('val_x_cell');
		if (wdg) {
				wdg.innerHTML = '';
		}

		wdg = document.getElementById('val_y_cell');
		if (wdg) {
				wdg.innerHTML = '';
		}

		wdg = document.getElementById('cod_postal4_cell');
		if (wdg) {
				wdg.innerHTML = '';
		}

		wdg = document.getElementById('cod_postal3_cell');
		if (wdg) {
				wdg.innerHTML = '';
		}

		wdg = document.getElementById('notas_cell');
		if (wdg) {
				wdg.innerHTML = '';
		}

		wdg0.style.display = 'none';
	}
}

function zoomTo(minx, miny, maxx, maxy, hl_codtopo, marker_coords)
{
	//console.trace();

	if (MAPCTRL)
	{
		if (hl_codtopo)
		{
			MAPCTRL.registerOnDrawFinish("highlighttopo",
				function (the_mctrl, p_item)
				{
					if (p_item != 'normal') {
						return;
					}

					toponimHighlightAnimator(MAPCTRL, hl_codtopo, marker_coords);
				}
			);
		}

		MAPCTRL.refreshFromMinMax(minx, miny, maxx, maxy, new LayerFilter("EV","cod_topo",hl_codtopo, true));
	}
}

function highlighting(hl_codtopo, hl_npol, p_point, is_final)
{
	var topovals, dlayer, basecolor_rgbtriplet, force, highlighted=false, is_cleansed=false;
	
	if (is_final) {
		dlayer = 'temporary';
		basecolor_rgbtriplet = [255,0,0];
		force = true;
	} else {
		dlayer = 'transient';
		basecolor_rgbtriplet = [255,200,35];
		force = false;
	}
	
	if (MAPCTRL)
	{
		MAPCTRL.unregisterOnDrawFinish("highlighttopo");
		if (hl_codtopo!=null && hl_codtopo!=undefined)
		{
			if (hl_npol!=null && hl_npol!=undefined)
			{
				if (MAPCTRL.checkPointInsideMap(p_point, HIGHLIGHT_INSIDE_QUOT) && 
					Math.abs(MAPCTRL.getScale() - ZOOMTONP_SCALE) < 2) 
				{
					var idx = MAPCTRL.getGlobalIndex("NP_IX");
					if (idx) 
					{
						var npvals_fromtopo = idx[hl_codtopo];
						if (npvals_fromtopo) {
							var npvals = npvals_fromtopo[hl_npol];
							//console.log("   > npvals:"+JSON.stringify(npvals));
							if (npvals!==undefined && npvals['oid']!==undefined &&  npvals['oid'].length > 0) {
								if (is_final) {
									MAPCTRL.clearTemporary();
									is_cleansed = true;
								}
								NPolHighlighter.doHighlight("NPOLPROJD", npvals['oid'][0], is_final);	
								highlighted = true;	
							}					
						}	
						else
						{
							console.warn(hl_codtopo+" not found in NP_IX");
						}		
					}		
				} 
				
				if (!highlighted) 
				{
					MAPCTRL.registerOneTimeOnDrawFinish(
						function (the_mctrl, p_item)
						{
							if (p_item != 'normal') {
								return;
							}
							var idx = MAPCTRL.getGlobalIndex("NP_IX");
							if (idx) {
								var npvals_fromtopo = idx[hl_codtopo];
								//console.log("   > OnDrawFinish npvals_fromtopo:"+JSON.stringify(npvals_fromtopo));
								if (npvals_fromtopo) {
									var npvals = npvals_fromtopo[hl_npol];
									if (npvals!==undefined && npvals['oid']!==undefined &&  npvals['oid'].length > 0) {
										if (is_final && !is_cleansed) {
											MAPCTRL.clearTemporary();
											is_cleansed = true;
										}
										NPolHighlighter.doHighlight("NPOLPROJD", npvals['oid'][0], is_final);		
									}					
								}
								
							}
						}
					);				

					MAPCTRL.refreshFromScaleAndCenter(ZOOMTONP_SCALE, p_point[0], p_point[1]);
				}
			} 
		}

	}
	
}


function sel_toponimo(p_toponimo, p_codtopo, p_wdgstr, p_ext, p_loc, p_showreturnedvalues) {

	var alllow_saving = true, f_name = false, f_code = false;
	//AutocompleteObjMgr.showListArea('geocode',false);
	
	if (p_wdgstr && p_wdgstr.length > 0) {
		TRANSMIT_OBJECT.toponimo = p_wdgstr;
		AutocompleteObjMgr.setText('geocode', p_wdgstr);
	}
	else
	{
		return;
	}

	if (p_codtopo && p_codtopo.length > 0) {
		f_code = true;
		TRANSMIT_OBJECT.codtopo = p_codtopo;
	}

	if (p_showreturnedvalues) {
		showRetValues(null, alllow_saving);
	}
	
	var ret = false;

	if (p_toponimo && p_toponimo.length > 0) {
		f_name = true;
		AutocompleteObjMgr.enableCleanWidget('geocode', true);
	} else {
		AutocompleteObjMgr.enableCleanWidget('geocode', false);
	}
	
	console.log(p_ext);
	console.log(p_loc);

	if (p_ext)
	{
        zoomTo(p_ext[0], p_ext[1], p_ext[2], p_ext[3], p_codtopo);
		ret = true;
	} else //if (p_loc)
	{
       //zoomTo(p_loc[0]-ZOOMLOC_RADIUS, p_loc[1]-ZOOMLOC_RADIUS, p_loc[0]+ZOOMLOC_RADIUS, p_loc[1]+ZOOMLOC_RADIUS, p_codtopo, p_loc);
       zoomTo(p_loc[0]-ZOOMLOC_RADIUS, p_loc[1]-ZOOMLOC_RADIUS, p_loc[0]+ZOOMLOC_RADIUS, p_loc[1]+ZOOMLOC_RADIUS, p_codtopo);
		ret = true;
	}

	if (f_name && f_code)
	{
		// Chamar de novo o servidor
		if (AutocompleteObjMgr.checkInputTimerID == null) {
			AutocompleteObjMgr.checkInputTimerID = setInterval(AutocompleteObjMgr.checkInputTimer, 400);
		}
	}
	
	return ret;
}

function sel_num(p_codtopo, p_toponimo, p_npol, p_areaespecial, p_freg, p_codfreg, p_onhover, p_loc, p_showreturnedvalues) {

	if (!p_onhover)
	{
		AutocompleteObjMgr.showListArea('geocode',false);

		TRANSMIT_OBJECT.npol = p_npol;

		if (p_areaespecial) {
			TRANSMIT_OBJECT.areaespecial = p_areaespecial;
		} else {
			TRANSMIT_OBJECT.areaespecial = '';
		}
		
		if (p_freg) {
			TRANSMIT_OBJECT.freg = p_freg;
			TRANSMIT_OBJECT.cod_freg = p_codfreg;
		} else {
			TRANSMIT_OBJECT.freg = '';
			TRANSMIT_OBJECT.cod_freg = '';
		}

		if (p_codtopo && p_codtopo.length>0) {
			TRANSMIT_OBJECT.codtopo = p_codtopo;
			TRANSMIT_OBJECT.toponimo = p_toponimo;
		}

		var fractxt = '';
		if (TRANSMIT_OBJECT.frac !== undefined && TRANSMIT_OBJECT.frac != null) {
			fractxt = TRANSMIT_OBJECT.frac;
		}

		var newtext;
		if (fractxt!=null && fractxt.length > 0) {
			newtext = TRANSMIT_OBJECT.toponimo + ', '+ TRANSMIT_OBJECT.npol + ' ' + TRANSMIT_OBJECT.frac;
		} else {
			newtext = TRANSMIT_OBJECT.toponimo + ', '+ TRANSMIT_OBJECT.npol;
		}

		var sn_dontdeleteall = true;
		AutocompleteObjMgr.setText('geocode', newtext, sn_dontdeleteall);
		
		if (p_loc) {
			TRANSMIT_OBJECT.loc = p_loc;
		} else if (p_loc !== undefined && p_loc != null) {
			TRANSMIT_OBJECT.loc = p_loc;
		}

	}
	  
	MAPCTRL.clearTransient();
	MAPCTRL.clearTemporary();

	var alllow_saving = true;
	if (!p_onhover) {
		showRetValues(null, alllow_saving);
	}
	
	var highlightIsFinal = true;
	if (p_onhover) {
		highlightIsFinal = false;
	}
	
	highlighting(
				p_codtopo,
				p_npol,
				p_loc,
				highlightIsFinal
			);	
}

function sel_full(json_rec) {
	
	var geotxt, topo, npol, frac;
	
	if (TRANSMIT_OBJECT['complloc'] === undefined) 
	{
		if (TRANSMIT_OBJECT.npol !== undefined && TRANSMIT_OBJECT.npol != null) {
			return;
			//sel_num(json_rec, false);
		} 
		else if (TRANSMIT_OBJECT.toponimo !== undefined && TRANSMIT_OBJECT.toponimo != null) {
			return;
			//sel_toponimo(json_rec, null);
		}
		return;
	}
	
		console.log('antes de sel_full');
	AutocompleteObjMgr.showListArea('geocode',false);

	if (typeof TRANSMIT_OBJECT.toponimo == 'undefined') {
		topo = '';
	} else {
		topo = TRANSMIT_OBJECT.toponimo;
	}

	if (typeof TRANSMIT_OBJECT.npol == 'undefined') {
		npol = '';
	} else {
		npol = TRANSMIT_OBJECT.npol;
	}

	if (typeof TRANSMIT_OBJECT.frac == 'undefined') {
		frac = '';
	} else {
		frac = TRANSMIT_OBJECT.frac;
	}

	if (typeof json_rec['areaespecial'] != 'undefined') {
		TRANSMIT_OBJECT.areaespecial = json_rec['areaespecial'];
	} else {
		TRANSMIT_OBJECT.areaespecial = '';
	}
	if (typeof json_rec['freg'] != 'undefined') {
		TRANSMIT_OBJECT.freg = json_rec['freg'];
		TRANSMIT_OBJECT.cod_freg = json_rec['cod_freg'];
	} else {
		TRANSMIT_OBJECT.freg = '';
		TRANSMIT_OBJECT.cod_freg = '';
	}

	var newtext = topo + ', '+ npol + ' ' + frac;
	newtext = newtext.trim();
	AutocompleteObjMgr.setText('geocode', newtext, true);

	deActivateUsePosBtn();
	deActivateSaveBtn();

	xval = TRANSMIT_OBJECT['complloc'][0];
	yval = TRANSMIT_OBJECT['complloc'][1];
	TRANSMIT_OBJECT.loc = [xval, yval];

	var alllow_saving = true;
	showRetValues(null, alllow_saving);

	var highlightIsFinal = true;
	if (npol!=null && npol !== undefined && npol.length>0)
	{
		highlighting(
			TRANSMIT_OBJECT.codtopo,
			npol,
			[xval, yval],
			highlightIsFinal
		);
	}
	else
	{
	    console.log('-----------     809 Condição ausência npol em sel_full   ---------------');
	    console.log('       TRANSMIT_OBJECT:');
	    console.log(TRANSMIT_OBJECT);
	    console.log('       json_rec:');
	    console.log(json_rec);
	    console.log('------------------------------------------------------------------------');
	}
}


function execSearch(transmit_object) {

	var insrchstr;

	if (typeof transmit_object == 'undefined' || transmit_object == null) {
		if (console) {
			console.log('execSearch: TRANSMIT_OBJECT Nulo!');
		}

		return;
	}

	showLoaderImg();

	var srchstr = AutocompleteObjMgr.getText('geocode');
	
	if (srchstr.trim().length == 0) {
		return;
	}

	/*if (typeof transmit_object.toponimo != 'undefined') {
		insrchstr = srchstr.replace(transmit_object.toponimo, '');
	} else { */
		insrchstr = srchstr;
	//}

	if (typeof transmit_object.backend == 'undefined') {
		transmit_object.backend = {};
	}


	if (typeof transmit_object.backend.curstr != 'undefined' && transmit_object.backend.curstr.length > 0)
	{
		if (typeof transmit_object.prevstrs == 'undefined')
		{
			transmit_object['prevstrs'] = [];
		}

		transmit_object['prevstrs'].push(transmit_object.backend.curstr);
	}

	transmit_object.backend.curstr = insrchstr;
	
	var keystoclean = ['firstparse','numbers','toponyms','out','typeparse'];
	for (var i=0; i<keystoclean.length; i++) {
		if (transmit_object.backend[keystoclean[i]] !== undefined && transmit_object.backend[keystoclean[i]] != null) {
			delete transmit_object.backend[keystoclean[i]];
		}
	}
	
	//console.log("curstr:>"+transmit_object.backend.curstr+'<');

	AutocompleteObjMgr.execSearch(
		'geocode',
		JSON.stringify(transmit_object.backend)
	);
}

function doClose() {
    var obj = window.dialogArguments;
    if (!obj) {
    	return;
    }

    obj.returnvalue = {};

	window.close();
}

function activateUsePosBtn()
{
	var el = document.getElementById('useposimg');
	if (el!=null && checkEditingViability())
	{
		el.style.display = '';
	}
}

function deActivateUsePosBtn()
{
	var el = document.getElementById('useposimg');
	if (el)
	{
		el.style.display = 'none';
	}
}

function activateSaveBtn()
{
	var el = document.getElementById('dosave');
	var cev = checkEditingViability();

	if (el && cev)
	{
		el.style.display = '';
	}
}

function deActivateSaveBtn()
{
	var el = document.getElementById('dosave');
	if (el)
	{
		el.style.display = 'none';
	}
}

function clickActivateUsePosBtn()
{

	delete TRANSMIT_OBJECT.npol;

	AutocompleteObjMgr.setText('geocode', '', true);

    mapAPISetLocationMarker(TRANSMIT_OBJECT.loc);

	deActivateUsePosBtn();
	
	var alllow_saving = true;
    showRetValues(null, alllow_saving);
}

function doSave()
{
	var obj;
	//, appId = getValueById("appidval");
	//var storeId = getValueById("storeidval");
	var fldname, saveIdDefined = false;
	var appId, storeId;

	//deActivateUsePosBtn();
	deActivateSaveBtn();
	
	var query = window.location.search.substring(1);
	var qry_obj = {};
	parse_query_string(query, qry_obj);
	
	if (qry_obj["appid"] !== undefined && qry_obj["appid"] != null) {
		appId = qry_obj["appid"];
	} else {
		MessagesController("Id da aplicação em falta", true, true);
		return;
	}
	
	if (qry_obj["storeid"] !== undefined && qry_obj["storeid"] != null) {
		storeId = qry_obj["storeid"];
	} else {
		MessagesController("Id do pedido em falta", true, true);
		return;
	}

	if (qry_obj["edit"] === undefined || qry_obj["edit"] == "false") {
		MessagesController("Impossível gravar fora de modo de edição", true, true);
		return;
	}
		
	if (appId && appId.length > 0 && storeId && storeId.length > 0) {
		if (appId != "#NOAPP#" && storeId != "-1") {
			saveIdDefined = true;
		}
	}

	if (PREVLOCJSONTREE)
	{
       	for (var vi=0; vi<TRANSMIT_FIELDS.length; vi++ )
        	{
        	    fldname = TRANSMIT_FIELDS[vi];
        	    if (typeof PREVLOCJSONTREE[fldname] != 'undefined' && typeof TRANSMIT_OBJECT[fldname] == 'undefined')
        	    {
        	    	TRANSMIT_OBJECT[fldname] = PREVLOCJSONTREE[fldname];
        	    }
        	}
	}

	// adicionar os campos editavis a transmit object
	var el = document.getElementById('cod_postal4_cell');
	if (el)
	{
		TRANSMIT_OBJECT.cod_postal4 = el.value;
	}
	el = document.getElementById('cod_postal3_cell');
	if (el)
	{
		TRANSMIT_OBJECT.cod_postal3 = el.value;
	}
	el = document.getElementById('notas_cell');
	if (el)
	{
		TRANSMIT_OBJECT.notas = el.value;
	}
	/*el = document.getElementById('freg_cell');
	if (el)
	{
		TRANSMIT_OBJECT.freg = el.value;
	} */
	el = document.getElementById('area_especial_cell');
	if (el)
	{
		TRANSMIT_OBJECT.areaespecial = el.innerHTML;
	}
	el = document.getElementById('frac_cell');
	if (el)
	{
		TRANSMIT_OBJECT.frac = el.value;
	}
	
	if (saveIdDefined)
	{
		var urlstr = AJAX_ENDPOINTS["SAVE"];

		ajaxSender(urlstr,
			function () {
				if (this.readyState === this.DONE)
				{
					var opstr, respcomps, error_ocurred = false;
					var verbose = true, verbstr = getValueById("verbose");
					if (typeof verbstr == 'string') {
					    verbose = (verbstr.toLowerCase()=='true' ? true : false);
					}
				    
				    hideLoaderImg();

					//AutocompleteObjMgr.querySemaphore = false;
					if (this.status == 200 && this.responseText.substr(0, 2) == 'OK')
					{
					    if (verbose) { MessagesController.setMessage("Localização gravada", true, false); }
					    respcomps = this.responseText.replace(/\s+/g, ' ').split(' ');
					    opstr = respcomps[1];
					} else {
					    if (verbose) { MessagesController.setMessage("Gravação em erro", true, true); }
					    error_ocurred = true;
					    opstr = "ERROR";
					}

					emitParentEvent(null, opstr, error_ocurred);
					obj = window.dialogArguments;
					if (obj) {

					    obj.returnvalue = { 'op': opstr };

					    if (!error_ocurred) {
						fillRetObj(obj.returnvalue);
					    }

					    window.close();
					    return;
					}
				}
			},
			JSON.stringify({
				'storageparams': {
					'appid': appId,
					'storeid': storeId
				},
				'transobj': TRANSMIT_OBJECT
			})
		)
	}

}

function npolproj_mousemove(p_map, x, y, layername, p_searchtolerance) {	
									
	
	if (!AutocompleteObjMgr.getListAreaIsVisible('geocode')) {	
		
		var searchtolerance = (p_map.getScale() / 1000.0) * p_searchtolerance;
		
		var npoid = p_map.findNearestObject(x, y, searchtolerance, layername);
		if (npoid) {
			NPolHighlighter.doHighlight(layername, npoid, false);
		} else {
			if (NPolHighlighter.tempHighlightIsOn()) {
				p_map.clearTransient();
			}
		}
	}
}

function npolproj_mouseup(p_map, x, y, layername, p_searchtolerance) 
{									
	var sclv = p_map.getScale();
	
	if (sclv < PICKLOCATION_SCALELIMITS.min || sclv > PICKLOCATION_SCALELIMITS.max)
	{
		if (sclv < PICKLOCATION_SCALELIMITS.min) {
			MessagesController.setMessage('Faça zoom (afastar) até o indicador de escala marcar, pelo menos, Escala 1:'+PICKLOCATION_SCALELIMITS.min, true);
		}

		if (sclv > PICKLOCATION_SCALELIMITS.max) {
			MessagesController.setMessage('Faça zoom (aproximar) até o indicador de escala marcar, pelo menos, Escala 1:'+PICKLOCATION_SCALELIMITS.max, true);
		}

		return;
	}
	
	AutocompleteObjMgr.showListArea('geocode',false);

	// console.log("temp is on:"+NPolHighlighter.tempHighlightIsOn());
	
	if (NPolHighlighter.tempHighlightIsOn()) 
	{
		var oid = NPolHighlighter.currentFoundFeature.oid;

		NPolHighlighter.clear();
		NPolHighlighter.clearMarked();
		p_map.clearTransient();
		p_map.clearTemporary();

		NPolHighlighter.doHighlight(layername, oid, true);

		var retstr = NPolHighlighter.transferData(TRANSMIT_OBJECT);
		AutocompleteObjMgr.setText('geocode', retstr, true);
		
		var alllow_saving = true;
		showRetValues(null, alllow_saving);		
	} 
	else  
	{
		NPolHighlighter.clear();
		NPolHighlighter.clearMarked();
		p_map.clearTransient();
		p_map.clearTemporary();
		
		AutocompleteObjMgr.enableCleanWidget('geocode', true);

		var urlstr = AJAX_ENDPOINTS["QRY"]										
		var terrain_pt = [];
		p_map.getTerrainPt([x, y], terrain_pt);
		
		var scrpt = [x, y];
		//var realsrchtol = PT_MARKER_RADMULTIPLIER * p_searchtolerance;		
		//var scrrad = realsrchtol * p_map.getScreenScalingFactor();

		var searchtolerance = (MAPCTRL.getScale() / 1000.0) * p_searchtolerance;
		realsrchtol = PT_MARKER_RADMULTIPLIER * searchtolerance;
		
		clearTransmitAndPrevloc();

		TRANSMIT_OBJECT.loc = [terrain_pt[0], terrain_pt[1]];
		GLOBAL_MOUSE_CLICK.terrain = [terrain_pt[0], terrain_pt[1]];
		
		//console.log("realsrchtol:"+realsrchtol+" "+JSON.stringify({"x": terrain_pt[0], "y": terrain_pt[1]}));
		//console.log("--- send urlstr:"+urlstr);
		delete TRANSMIT_OBJECT.tiporesp;
		
		var payload = JSON.stringify({
				'radius': realsrchtol,
				'clickdata': {"loc": [terrain_pt[0], terrain_pt[1]], "srid": MAP_SRID }
		});
		
		AutocompleteObjMgr.xhr = ajaxSender(urlstr,
			function () {
				if (this.readyState === this.DONE)
				{
					if (this.status == 200 ) 
					{
						drawPickMarker(p_map, null, scrpt);
						AutocompleteObjMgr.afterSearchExec(this, 'geocode');
					}
					else
					{			
						MessagesController.setMessage("Erro "+this.status+" no acesso ao servidor", true, true);						
						console.log("Erro "+this.status+" "+this.responseText);						
					}
				}
			},
			payload,
			AutocompleteObjMgr.xhr
		);
	}							
}

// ferramenta de medição da tolerância do Picker -- 

function PickerTolerance(mouseButtonMask, p_mapctrl) {
	
	this.ms = new _MeasureSegment(mouseButtonMask, p_mapctrl);
	this.mouseleave_eq_mouseup = this.ms.mouseleave_eq_mouseup;

	this.name = 'pickertolerance';
	
	this.mousedown = function(e, target, x, y) {
		this.ms.mousedown(e, target, x, y);
	};

	this.mousemove = function(e, target, x, y) {
		this.ms.mousemove(e, target, x, y);
		//MAPCTRL.progressMessage(String.format("Tolerância rato: {0} pixeis", this.ms.measvalscreen));
	};
		 
	this.mouseup = function(e) {
		
		this.ms.mouseup(e);
		MAPCTRL.mapctrlsmgr.resumeDefaultTool();
		
		// obter em px e não em mapunits
		//console.log("pickertol mouseup, values terr, scr:"+this.ms.measvalterrain+","+this.ms.measvalscreen);
		
		var tol = formatFracDigits((this.ms.measvalterrain * 1000.0 / MAPCTRL.getScale()), 2);
		
		MessagesController.setMessage(String.format("Tolerância medida: {0} m<br>Valor normalizado à escala 1:1000: <b>{1} m</b>", this.ms.measvalterrain, tol), true, false);
		
		var ptool = MAPCTRL.mapctrlsmgr.getTool("picker");
		if (ptool) {
			ptool.setTolerance(tol);
		}
	};
	
	this.reset = function() {
		this.ms.reset();
	};

}

extend(PickerTolerance, _Basetool);


function pit() {
	console.log('activation:'+MAPCTRL.mapctrlsmgr.activateTool('pickertolerance'));
}


function rdt() {
	MAPCTRL.mapctrlsmgr.resumeDefaultTool();
}



