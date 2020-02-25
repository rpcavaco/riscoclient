function MapLabelEngine(p_mapcontroller) {
	
	this.getClassStr = function() {
		return "MapLabelEngine";
	};
	this.i18nmsgs = {
		"pt": {
			"NONEW": "'MapLabelEngine' é classe, o seu construtor foi invocado sem 'new'",
			"NOMAPCTRL": "'MapLabelEngine' requer um objecto MapController, foi passada uma referencia nula",
			"MISSLABATTRS": "Atributo a etiquetar não existe para a layer {0}. Reveja a configuração. 'label'->'attrib' é case sensitive."
		}
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
		return this.i18nmsgs[lang][p_msgkey]
	};

	if ( !(this instanceof arguments.callee) )
		throw new Error(this.msg("NONEW"));
	
	if (p_mapcontroller === null) 
		throw new Error(this.msg("NOMAPCTRL"));
	
	this.mapcontroller = p_mapcontroller;
	this.lnames = [];
	this.lconfig = {};
	this.weighted_labels = null;
	this.currentIndexes = null;
	this.weighted_oids = null;
	
	this.labelgen_profiling = false;
	
	/*this.drawInit = function() 
	{
		this.currentIndexes = {};
	}*/
	
	this.addLabelsInit = function() 
	{
		this.weighted_labels = {};
		this.weighted_oids = {};
		this.currentIndexes = {};
	}

	this._sort = function() {
		for (var lname in this.weighted_labels) 
		{
			if (!this.weighted_labels.hasOwnProperty(lname)) {
				continue;
			}
			this.weighted_labels[lname].sort(
				function(a,b) {
					return a[1] - b[1];
				}
			);
		}
		this.weighted_labels[lname].reverse();
		for (var xi=0; xi<this.weighted_labels[lname].length; xi++) {
			this.weighted_oids[lname][xi] = this.weighted_labels[lname][xi][0]
		}
	};

	this.lbl_gen = function(p_text, p_coords, p_pathlevels, p_placementttype, 
				p_fillstroke, p_styleobj, p_inscreenspace, opt_displaylayer, opt_do_debug) {
		
		var txtLen, tmppt=[], featLen, steplen, stlen;	
		var grCtrller = this.mapcontroller.getGraphicController();
		var charsz = grCtrller.getFontSize(opt_displaylayer);
		var scale = this.mapcontroller.getScale();
		
		if (p_text!=null)  // text
		{
			switch(p_placementttype.toUpperCase()) 
			{
				case "CENTER":
					var anchpt = [];
					geom.pathCenter(p_coords, p_pathlevels, anchpt);				
					grCtrller.saveCtx(opt_displaylayer);
					
					//stdfillstyle = grCtrller.getFillStyle();
					
					grCtrller.setTextAlign('center');

					// shadow
					//grCtrller.setFillStyle('#000');
					//grCtrller.rotatedText(p_text, anchpt, 0, fillStroke);

					// HARDCODED
					//anchpt[0] = anchpt[0] - 2;
					//anchpt[1] = anchpt[1] - 2;
					//grCtrller.setFillStyle(stdfillstyle);
					//console.log([opt_displaylayer, p_styleobj.fillcolor]);

					/*
					if (p_styleobj != null && p_styleobj.fillcolor !== undefined) {
						grCtrller.setFillStyle(p_styleobj.fillcolor);
					}
					if (p_styleobj != null && p_styleobj.strokecolor !== undefined) {
						grCtrller.setStrokeStyle(p_styleobj.strokecolor);
					}*/

					grCtrller.rotatedText(p_text, anchpt, 0, p_fillstroke, opt_displaylayer);
					grCtrller.restoreCtx(opt_displaylayer);
					break;

				// along polylines
				case "ALONG":
					
					txtLen = grCtrller.measureTextWidth(p_text, opt_displaylayer);
					featLen = geom.pathLength(p_coords);
					
					if (featLen >= 9 * txtLen) {
						k = 4;
					} else if (featLen >= 7 * txtLen) {
						k = 3;
					} else if (featLen >= 5 * txtLen) {
						k = 2;
					// } else if (featLen >= txtLen) {
					} else {
						k = 1;
					}
					
					var maxk = 0;
					if (k>0) 
					{
						steplen = (featLen - k * txtLen) / (k + 1);
						stlen = steplen;	
						for (var i=0; i<=k; i++) {

							this.labelAlongPath(p_text, p_coords, 
									stlen, 
									charsz, p_fillstroke, opt_displaylayer);

							stlen += txtLen + stlen;
							
						}
					}
					break;

				// oriented according to a leader line
				case "LEADER":
					
					var maxscl, doarrow = false, anchpt = [], angle_ret=[], startpt;						
					var coords, offsetA = 10, offsetB = 8, offsetC = 2, arrowang = geom.deg2Rad(15);

					geom.twoPointAngle(
							[p_coords[0], p_coords[1]], 
							[p_coords[2], p_coords[3]],
							angle_ret
					);

					grCtrller.saveCtx(opt_displaylayer);
					
					if (p_styleobj != null && p_styleobj.leader_arrowfillcolor !== undefined) {
						grCtrller.setFillStyle(p_styleobj.leader_arrowfillcolor, opt_displaylayer);
					}
					if (p_styleobj != null && p_styleobj.leader_arrowmaxscale !== undefined) {
						maxscl = p_styleobj.leader_arrowmaxscale;
						if (scale <= maxscl) {
							doarrow = true;
						}
					}
					
					startpt = [p_coords[2], p_coords[3]];

					// First and third quadrants - text aligns left
					if (angle_ret[1] == 2 || angle_ret[1] == 3) 
					{
						// arrow
						if (doarrow)
						{
							coords = [startpt[0], startpt[1]];
														
							geom.applyPolarShiftTo(startpt, 
									angle_ret[0]-arrowang, offsetB, tmppt);
							coords.push(tmppt[0]);
							coords.push(tmppt[1]);
							geom.applyPolarShiftTo(startpt, 
									angle_ret[0]+arrowang, offsetB, tmppt);
							coords.push(tmppt[0]);
							coords.push(tmppt[1]);
							coords.push(startpt[0]);
							coords.push(startpt[1]);

							if (p_styleobj != null && p_styleobj.leader_arrowfillcolor !== undefined) {
								grCtrller.setFillStyle(p_styleobj.leader_arrowfillcolor, opt_displaylayer);
							}

							grCtrller.drawSimplePath(coords, false, true, null, 
									p_inscreenspace, opt_displaylayer, false); 

							geom.applyPolarShiftTo(startpt, 
									angle_ret[0], offsetA, anchpt);
							
						} else {
							geom.applyPolarShiftTo(startpt, 
								angle_ret[0], offsetC, anchpt);
						}
						
						grCtrller.setTextAlign('left', opt_displaylayer);
					} 
					else 
					{
						// First and third quadrants - text aligns right
						
						// arrow
						//console.log(doarrow+" 2");
						if (doarrow)
						{
							coords = [startpt[0], startpt[1]];
														
							geom.applyPolarShiftTo(startpt, 
									angle_ret[0]-arrowang, -offsetB, tmppt);

							coords.push(tmppt[0]);
							coords.push(tmppt[1]);

							geom.applyPolarShiftTo(startpt, 
									angle_ret[0]+arrowang, -offsetB, tmppt);

							coords.push(tmppt[0]);
							coords.push(tmppt[1]);
							coords.push(startpt[0]);
							coords.push(startpt[1]);

							if (p_styleobj != null && p_styleobj.leader_arrowfillcolor !== undefined) {
								grCtrller.setFillStyle(p_styleobj.leader_arrowfillcolor, opt_displaylayer);
							}

							grCtrller.drawSimplePath(coords, false, true, 
									null, p_inscreenspace, opt_displaylayer, false); 

							geom.applyPolarShiftTo(startpt, 
									angle_ret[0], -offsetA, anchpt);
							
						} else {
							geom.applyPolarShiftTo(startpt, 
									angle_ret[0], -offsetC, anchpt);
						}

						grCtrller.setTextAlign('right', opt_displaylayer);
					}
					
					
					if (p_styleobj != null && p_styleobj.leader_textfillcolor !== undefined) {
						grCtrller.setFillStyle(p_styleobj.leader_textfillcolor, opt_displaylayer);
					}
					if (p_styleobj != null && p_styleobj.leader_textstrokecolor !== undefined) {
						grCtrller.setStrokeStyle(p_styleobj.leader_textstrokecolor, opt_displaylayer);
					}
					if (p_styleobj != null && p_styleobj.leader_textlinewidth !== undefined) {
						grCtrller.setLineWidth(p_styleobj.leader_textlinewidth, opt_displaylayer);
					}

					/**
					 * Label SHADOWS
					 * Slows down display too much -- Firefox Quantum 65.0.2
					if (p_styleobj.leader_shadowcolor !== undefined) {
						grCtrller.setShadowColor(p_styleobj.leader_shadowcolor);
					}
					if (p_styleobj.leader_shadowoffsetx !== undefined) {
						grCtrller.setShadowOffsetX(p_styleobj.leader_shadowoffsetx);
					}
					if (p_styleobj.leader_shadowoffsety !== undefined) {
						grCtrller.setShadowOffsetY(p_styleobj.leader_shadowoffsety);
					}
					if (p_styleobj.leader_shadowblur !== undefined) {
						grCtrller.setShadowBlur(p_styleobj.leader_shadowblur);
					}
					* */
					
					grCtrller.rotatedText(p_text, anchpt, angle_ret[0], p_fillstroke);
					grCtrller.restoreCtx(opt_displaylayer);
					
					break;
					
			}
			
		}	
	};
	
	this.resetIndex = function(p_layername) {
		if (this.currentIndexes) {
			if (this.currentIndexes[layername] !== undefined && this.currentIndexes[layername] != null) {
				this.currentIndexes[layername] = -1;
			}
		}
	};

	this.doConfig = function(p_lnames, p_config) 
	{		
		var lname, i = 0;
		var local_lconfig =  p_config["lconfig"];
		this.lnames.length = 0;
		while(p_lnames[i] !== undefined && p_lnames[i] != null)
		{			
			lname = p_lnames[i];
			i++;
			if (local_lconfig[lname] === undefined) {
				throw new Error("Layer "+lname+" indicada na lista de layers 'lnames' mas ausente da configuração.");
			}
			if (local_lconfig[lname].label !== undefined) {
				this.lnames.push(lname);
				this.lconfig[lname] = local_lconfig[lname].label;
			}
		}
		
		if (p_config["labelweight"] !== undefined && p_config["labelweight"] != null) {
			this.labelweight = local_lconfig["labelweight"];		
		} else {
			this.labelweight = function(coords, attribs) {
				return geom.pathLength(coords);
			}
		}
	};

	this.activateLayerStyle = function(layername, out_return_obj, 
				opt_displaylayer, opt_style)
	{
		'use strict';
		var ret = true;
		var p_scale_val, tmpstyle, selstyle=null,  dep_rendering_scaleval = null;
		var this_has_bgdependent = false;
		
		if (this.lconfig[layername] === undefined || this.lconfig[layername] == null) {
			throw new Error("labelengine activateLayerStyle -- layer not configured:" + layername);
		}

		out_return_obj.fillStroke = {
				stroke: false,
				fill: false
		};
		out_return_obj.activestyle = null;
		out_return_obj.perattribute = null;
		out_return_obj.permode = null;
		out_return_obj.placementtype = null;
		
		if (opt_style)
		{
			selstyle = clone(opt_style);
		} else { 
			if (this.lconfig[layername].defaultdraw !== undefined) {
				ret = this.lconfig[layername].defaultdraw;
			}

			if (!ret) {
				return ret;
			}
			
			if (this.lconfig[layername].style !== undefined) {
				
				selstyle = clone(this.lconfig[layername].style);

			} else if (this.lconfig[layername]["condstyle"] !== undefined && this.lconfig[layername]["condstyle"] != null) {
				selstyle = clone(this.lconfig[layername]["condstyle"]["default"]);
				out_return_obj.perattribute = clone(this.lconfig[layername]["condstyle"]["perattribute"]);
				out_return_obj.permode = clone(this.lconfig[layername]["condstyle"]["permode"]);
			}			
		}
		
		if (selstyle != null) {
		
			// console.log(selstyle);
			
			// scale dependent rendering
			if (selstyle.scaledependent !== undefined) 
			{
				for (var cls_scl_val in selstyle.scaledependent) 
				{
					p_scale_val = this.mapcontroller.getScale();
					if (selstyle.scaledependent.hasOwnProperty(cls_scl_val) && 
						(p_scale_val >= cls_scl_val && (dep_rendering_scaleval == null || cls_scl_val > dep_rendering_scaleval))
						) {
							dep_rendering_scaleval = cls_scl_val;
					}
				}
				
				if (dep_rendering_scaleval != null)
				{
					if (selstyle.scaledependent[dep_rendering_scaleval] !== undefined) {
						tmpstyle = selstyle.scaledependent[dep_rendering_scaleval];
						for (var skey in tmpstyle) {
							if (!tmpstyle.hasOwnProperty(skey)) {
								continue;
							}
							selstyle[skey] = tmpstyle[skey];
						}
					}
				}
				
				delete selstyle.scaledependent;
			}

			if (selstyle.backgroundependent !== undefined) {
				var lwcr, lr = [];
				this.mapcontroller.rcvctrler.getRasterNames(lr, true);
				for (var bkraster in selstyle.backgroundependent) {
					if (selstyle.backgroundependent.hasOwnProperty(bkraster)) {
						lwcr = bkraster.toLowerCase();
						if (lr.indexOf(lwcr) >= 0) {
							if (selstyle.backgroundependent[bkraster] !== undefined) {
								this_has_bgdependent = true;
								tmpstyle = selstyle.backgroundependent[bkraster];
								for (var skey in tmpstyle) {
									if (!tmpstyle.hasOwnProperty(skey)) {
										continue;
									}
									selstyle[skey] = tmpstyle[skey];
								}
								break;
							}
						}
					}
				}
				delete selstyle.backgroundependent;
			}

			if (this.mapcontroller.drawnrasters.length > 0 && selstyle.overraster !== undefined && !this_has_bgdependent) {
				tmpstyle = selstyle.overraster;
				for (var skey in tmpstyle) {
					if (!tmpstyle.hasOwnProperty(skey)) {
						continue;
					}
					selstyle[skey] = tmpstyle[skey];
				}
			}

			if (selstyle.placementtype === undefined) {
				out_return_obj.placementtype = "CENTER";
				console.warn("Missing label placement type, defaulting to CENTER, layer:"+layername);
			} else {
				out_return_obj.placementtype = selstyle.placementtype;
			}
			out_return_obj.activestyle = selstyle;
			this.mapcontroller.pushStyle(selstyle, out_return_obj.fillStroke, opt_displaylayer);
			
		} else {
			console.trace("selstyle lbl activateLayerStyle NULO:"+layername);
		}	

		return ret;

	};
		
	//tendo em conta os limites de escala
	this.layerHasLabels = function(p_lname) {
		
		var scl, ret = false, top = MapCtrlConst.MAXSCALE_VALUE, bot = 0;
		if (this.lnames.indexOf(p_lname) >= 0) 
		{
			if (this.lconfig[p_lname].style.scalelimits !== undefined && 
					this.lconfig[p_lname].style.scalelimits.top != undefined) {
				top = this.lconfig[p_lname].style.scalelimits.top;
			}
			if (this.lconfig[p_lname].style.scalelimits !== undefined && 
					this.lconfig[p_lname].style.scalelimits.bottom != undefined) {
				bot = this.lconfig[p_lname].style.scalelimits.bottom;
			}
			
			scl = this.mapcontroller.getScale();
			if (scl>=bot && scl<=top) {
				ret = true;
			}
		}
		
		return ret;
	};
	
	this.getLayerScaleLimits = function(p_lname, out_retlist) {

		var top = MapCtrlConst.MAXSCALE_VALUE, bot = 0;
		out_retlist.length = 0;

		if (this.lconfig[p_lname] !== undefined && this.lconfig[p_lname] != null) 
		{
			/*
			console.log("... Labels for:"+p_lname);
			console.log(JSON.stringify(this.lconfig[p_lname]));
			if (this.lconfig[p_lname].style !== undefined && 
					this.lconfig[p_lname].style.scalelimits !== undefined) {
				console.log(JSON.stringify(this.lconfig[p_lname].style.scalelimits));
				console.log("  top:"+this.lconfig[p_lname].style.scalelimits.top);
			} else {
				console.log(" no lbl style for "+p_lname);
			}
			console.log("...................");
			*/
			
			if (this.lconfig[p_lname].style !== undefined && 
					this.lconfig[p_lname].style.scalelimits !== undefined && 
					this.lconfig[p_lname].style.scalelimits.top != undefined) {
				top = this.lconfig[p_lname].style.scalelimits.top;
			}
			if (this.lconfig[p_lname].style !== undefined && 
					this.lconfig[p_lname].style.scalelimits !== undefined && 
					this.lconfig[p_lname].style.scalelimits.bottom != undefined) {
				bot = this.lconfig[p_lname].style.scalelimits.bottom;
			}
			
			out_retlist.push(bot);
			out_retlist.push(top);
		}
	};
	
	this.getLayerLabelAttrib = function(p_lname) {
		return this.lconfig[p_lname].attrib;
	};
	
	this.addLabel = function(layername, p_feature, p_screencoords) 
	{
		var weight, labeltxt;
		
		/* TODO
		 * Passar outros atributos para, entre outras coisas,
		 * escalar e rodar as labels
		 */
		 
		 // p_screencoords
		 //console.log(p_screencoords);
		 /* [
  null,
  null,
  76,
  93
] */
		
		labeltxt = p_feature.attrs[this.getLayerLabelAttrib(layername)];		
		//labeltxt = p_feature.oid;		

		//console.log("addLabel lyr:"+layername+" txt:"+labeltxt+" LABEL ATTRIB:"+this.getLayerLabelAttrib(layername));
		if (labeltxt === undefined || labeltxt == null) {
			throw new Error(String.format(this.msg("MISSLABATTRS"),layername));
		}

		if (labeltxt == null) {
			return;
		}

		if (this.labelweight) {
			weight = this.labelweight(p_feature.points, p_feature.attrs);
		} else {
			weight = 1;
		}		

		if (this.weighted_labels[layername] === undefined) {
			this.weighted_labels[layername] = [];
			this.weighted_oids[layername] = [];
			this.currentIndexes[layername] = -1;
		}
		
		//console.log([layername,p_feature.oid,labeltxt,weight]);
		
		this.weighted_oids[layername].push(p_feature.oid);
		this.weighted_labels[layername].push(
				[
				 p_feature.oid, weight, labeltxt, 
				 clone(p_screencoords),
				 p_feature.path_levels
				]
			);

	};

	this.fetchLabel = function(p_lname, p_oid, out_ret) 
	{
		var ret = false, wl = null, idx;
		out_ret.length = 3;
		
		if (this.lnames.indexOf(p_lname) >= 0) 
		{
			if (this.weighted_oids[p_lname]) {
				idx = this.weighted_oids[p_lname].indexOf(p_oid);
				wl = this.weighted_labels[p_lname][idx];
				if (wl !== undefined) 
				{
					//console.log(JSON.stringify(wl));
					out_ret[0] = wl[2]; // text
					out_ret[1] = clone(wl[3]); // coords
					out_ret[2] = wl[4]; // path_levels
					ret = true;
				}
			}	
		}
		
		return ret;
	};
	
	this.nextLabel = function(p_lname, out_ret) 
	{
		var ret = false, wl = null;
		out_ret.length = 3;
		
		//console.log("weighted labels keys:"+Object.keys(this.weighted_labels));
		if (this.currentIndexes[p_lname] === undefined) {
			return false;
		}
		
		if (this.lnames.indexOf(p_lname) >= 0) 
		{
		
			if (this.currentIndexes[p_lname] < 0) {
				this._sort();
				this.currentIndexes[p_lname] = 0;
			}
			 
			wl = this.weighted_labels[p_lname][this.currentIndexes[p_lname]];
			if (wl !== undefined) 
			{
				//console.log(JSON.stringify(wl));
				out_ret[0] = wl[2]; // text
				out_ret[1] = clone(wl[3]); // coords
				out_ret[2] = wl[4]; // path_levels
				ret = true;
				this.currentIndexes[p_lname] = this.currentIndexes[p_lname] + 1;				
			}
		
		}
		
		return ret;
	};

	this.pathSegmAndArcLengths = function(p_lblpathcoords, p_seglens, p_char_size, 
			out_lengths, out_accum_lengths, out_arc_6params) 
	{
		'use strict';
		
		var angles = [], tap_params=[], arc_startpt = [], arc_endpt=[];
		var bend_radius, gamma, seg_pts = [], three_pts = [];
		var len = 0, acclen = 0, prev_final_offset = 0;
		var doinvert = false;
		
		out_lengths.length = 0;
		out_accum_lengths.length = 0;
		out_arc_6params.length = 0;
		
		for (var si=0; si<p_seglens.length; si++) 
		{
			if (si < p_seglens.length-1) 
			{
				geom.threePoints2DFromPath(p_lblpathcoords, si, three_pts)
				geom.threePointComplementAngles(three_pts[0], three_pts[1], three_pts[2], angles);
				
				if (three_pts[2][0] < three_pts[1][0] && three_pts[1][0] < three_pts[0][0]) 
				{
					if (three_pts[2][1] < three_pts[1][1] || three_pts[1][1] < three_pts[0][1]) {
						doinvert = true;
					}
				}

				gamma = Math.abs(angles[0]);
				if (gamma < Math.PI / 6) {
					bend_radius = p_char_size * 1.2;
				} else if (gamma < Math.PI / 3) {
					bend_radius = p_char_size * 2.0;
				} else if (gamma < 2 * Math.PI / 3) {
					bend_radius = p_char_size * 2.8;
				} else {
					bend_radius = p_char_size * 3.6;
				}
			}
			
			if (si == p_seglens.length-1) 
			{
				// fim
				len = p_seglens[si] - prev_final_offset;
				acclen += len;
				out_lengths.push(len);
				out_accum_lengths.push(acclen);
			} 
			else 
			{
				// resto
				geom.tangentArcParams(angles[1], angles[2], bend_radius, tap_params);

				geom.segmPoints2DFromPath(p_lblpathcoords, si, seg_pts);
				geom.applyPolarShiftTo(seg_pts[1], angles[1], - tap_params[1], arc_startpt);

				arc_endpt[0] = arc_startpt[0] + tap_params[1] * (Math.cos(angles[1]) + Math.cos(angles[2]));
				arc_endpt[1] = arc_startpt[1] + tap_params[1] * (Math.sin(angles[1]) + Math.sin(angles[2]));
				
				out_arc_6params.push([angles[1], angles[2], bend_radius, clone(arc_startpt), clone(arc_endpt), doinvert]);
				//out_prevarc_tanglens.push(tap_params[1]);
								
				len = p_seglens[si] - prev_final_offset - tap_params[1];

				acclen += len;
				out_lengths.push(len);
				out_accum_lengths.push(acclen);
				
				len = tap_params[0];
				acclen += len;
				out_lengths.push(len);
				out_accum_lengths.push(acclen);
				
				prev_final_offset = tap_params[1];
			}
			
		}
		
	}
	
	this.ensureLabeledLineLeftToRight = function(p_path, opt_smallestval) 
	{
		var smv, idx, tmp, ret = false; 
		
		if (!opt_smallestval) {
			smv = 0.0000001;
		} else {
			smv = opt_smallestval;
		}

		if (
			(
				p_path[0] > p_path[p_path.length-2]
			) || (
				(Math.abs(p_path[0] - p_path[p_path.length-2]) < smv) &&
				p_path[1] > p_path[p_path.length-1]
			)
		) 		
		{
			p_path.reverse();
			idx = 0;
			while (p_path[idx] !== undefined && p_path[idx] != null) 
			{
				tmp = p_path[idx+1];
				p_path[idx+1] = p_path[idx];
				p_path[idx] = tmp;
				idx += 2;
			}
			ret = true;
		}
		
		return ret;
	};
	
	this.labelAlongPath = function(p_lblstr, p_lblpathcoords, p_start_length, 
			p_char_size, p_fillstroke, opt_displaylayer) 
	{
		var lip_lst = [], poa_lst = [], anch_pt = [], segpoints=[], pts_for_interpol=[];
		var seglens = [], accum_seglens = null, segAndArcLengthsLst=[];
		var arc6ParamsLst=[], segAndArcAccumLengthsLst=[];
		var segidx=null, shift=0;
		var segarci = 0, segarci_found = -1, ci = 0, partlen = 0;
		var len = p_lblstr.length;
		var ctrlcnt = 1500, bend_radius;
		var new_lblpathcoords=[], filter_minlen = 3 * p_char_size;
		var grCtrller = this.mapcontroller.getGraphicController();
		var wrk_list = [];
		
		this.ensureLabeledLineLeftToRight(p_lblpathcoords);
		
		if (!geom.pathSegLengths(p_lblpathcoords, seglens, accum_seglens, filter_minlen, 
						new_lblpathcoords, p_lblstr))
		{
			return;
		}
		
		this.pathSegmAndArcLengths(new_lblpathcoords, seglens, p_char_size, 
				segAndArcLengthsLst, segAndArcAccumLengthsLst, arc6ParamsLst);
		
		anch_pt.length = 2;
		pts_for_interpol.length = 2;
		
		var arcidx = -1;
		var arcshift, segshift;

		while (ci < len && ctrlcnt > 0) 
		{
			ctrlcnt--;
			ch = p_lblstr.charAt(ci);
			partlen = grCtrller.measureTextWidth(ch) / 2.0;
			
			if (ci == 0) {
				shift = p_start_length + partlen;
			} else {
				shift += partlen;
			}
			
			segarci = 0;
			segarci_found = -1;
			while (segAndArcAccumLengthsLst[segarci] !== undefined && segAndArcAccumLengthsLst[segarci] != null) 
			{
				if (segAndArcAccumLengthsLst[segarci] >= shift) 
				{
					segarci_found = segarci;
					break;
				}
				segarci++;
			}

			if (segarci_found >= 0) 
			{
				segidx = Math.floor(segarci_found/2);
				arcidx = Math.floor(segidx-1);	
				
				if (segarci_found % 2 == 0) 
				{	
				// indice par é segmento
					geom.segmPoints2DFromPath(new_lblpathcoords, segidx, segpoints);

					if (segidx==0) {
						if (seglens.length == 1) {
							pts_for_interpol = clone(segpoints);
						} else {
							pts_for_interpol[0] = clone(segpoints[0]);
							pts_for_interpol[1] = clone(arc6ParamsLst[0][3]);
						}
					} 
					else if (segidx < (seglens.length-1)) 
					{
						pts_for_interpol[0] = clone(arc6ParamsLst[arcidx][4]);
						pts_for_interpol[1] = clone(arc6ParamsLst[arcidx+1][3]);							
					} 
					else 
					{
						pts_for_interpol[0] = clone(arc6ParamsLst[arcidx][4]);
						pts_for_interpol[1] = clone(segpoints[1]);
					}

					if (segarci_found == 0) {
						segshift = shift;
					} else {
						segshift = shift - segAndArcAccumLengthsLst[segarci-1];
					}
					
					geom.segmentInterpolatePoint(pts_for_interpol, segshift, lip_lst, true);

					anch_pt[0] = lip_lst[0];
					anch_pt[1] = lip_lst[1];
					
					wrk_list.push([ch, clone(anch_pt), 1.0 * lip_lst[2], p_char_size, partlen]);

				} else {
					// indice impar é arco
					arcidx = Math.floor(segidx);
					arcshift = shift - segAndArcAccumLengthsLst[segarci_found-1];
					
					geom.pointOnArcInvertedY(arc6ParamsLst[arcidx][0], arc6ParamsLst[arcidx][1], arc6ParamsLst[arcidx][2], arcshift, arc6ParamsLst[arcidx][3], poa_lst, arc6ParamsLst[arcidx][5]);
					anch_pt[0] = poa_lst[0];
					anch_pt[1] = poa_lst[1];
					
					ang = Math.PI/2.0 + poa_lst[2];

					wrk_list.push([ch, clone(anch_pt), ang, p_char_size, partlen]);
					
				}
			}
			 
			shift += grCtrller.measureTextWidth(ch) / 2.0;
			ci++;
		}

		if (wrk_list.length != p_lblstr.length) {
			return;
		}
		var widx = 0;

		while (wrk_list[widx] !== undefined && wrk_list[widx] != null) {
			// a aalterar rotated text -- p_fillstroke 
			grCtrller.rotatedText(wrk_list[widx][0], wrk_list[widx][1], wrk_list[widx][2], 
					p_fillstroke, opt_displaylayer, 
					wrk_list[widx][3], wrk_list[widx][4], widx==0, widx==wrk_list.length-1);
			widx++;
		}
	};
	
	this.checkLabelDrawingConditionByLayer = function(p_layername) 
	{
		var ret = "OK";
		if (this.lconfig[p_layername].style === undefined) {
			ret = "NOSTYLE";
		} else if (this.lconfig[p_layername].style.placementtype === undefined) {
			ret = "NOPLACEMENT";
		}
		
		return ret;
	}

	// Generates all labels for a layer
	this.genLabels = function(p_scale_val, p_layername, p_actstyle_retobj, p_inscreenspace, p_outobject, opt_displaylayer) 
	{
		'use strict';
		
		var k, tmppt=[], startpt=[], placementt = null, ctrlcnt = 10000, lbl_components=[];
		
		var t0=0, t1=0, t2=0;
		
		p_outobject['label_count'] = 0;
		p_outobject['sample'] = "";
		
		//console.log(p_actstyle_retobj);
		
		var placementtype = p_actstyle_retobj.placementtype;
		var fillstroke = p_actstyle_retobj.fillStroke;
		var active_style = p_actstyle_retobj.activestyle;
		
		if (this.labelgen_profiling) {
			t0 = Date.now();
		}
	
		var grCtrller = this.mapcontroller.getGraphicController();		
		if (opt_displaylayer != null) {
			grCtrller.setActiveDisplayLayer(opt_displaylayer);
		} else {
			grCtrller.setActiveDisplayLayer("base");
		}
		var charsz = grCtrller.getFontSize();		
		var nxtlbl_exists = this.nextLabel(p_layername, lbl_components);
		
		var txtLen, featLen, steplen, stlen;		
		var stdfillstyle, scale = this.mapcontroller.getScale();
		
		while (nxtlbl_exists && ctrlcnt > 0) 
		{
			ctrlcnt--;
			k = 0;
			p_outobject['label_count']++;
			
			// this.lbl_gen = function(p_text, p_coords, p_pathlevels, p_placementttype, p_fillstroke, p_styleobj, opt_displaylayer)
			
			if (p_outobject['sample'].length == 0)  {
				p_outobject['sample'] = lbl_components[0];
			}
	
			this.lbl_gen(lbl_components[0], lbl_components[1], lbl_components[2], placementtype, fillstroke, active_style, p_inscreenspace, opt_displaylayer);
			
			nxtlbl_exists = this.nextLabel(p_layername, lbl_components);
		}
		
		if (this.labelgen_profiling) {
			t1 = Date.now();
			console.log("Label profiling: "+p_layername+" t0:"+(t1-t0));
		}
		
		this.resetIndex(p_layername);

		if (this.labelgen_profiling) {
			t2 = Date.now();
			console.log("Label profiling: "+p_layername+" t1:"+(t2-t1));
		}

	};
	
	
}
