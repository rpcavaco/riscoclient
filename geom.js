
var geom = {
		
	rad2Deg: function(p_val) {
		return p_val * 180.0 / Math.PI;
	},
		
	deg2Rad: function(p_val) {
		return p_val * Math.PI / 180.0;
	},
		
	segmPoints2DFromPath: function(p_path_coords, p_segm_index, out_pts) {
		var baseidx;
		out_pts.length = 2;
		baseidx = p_segm_index * 2;
		out_pts[0] = [p_path_coords[baseidx], p_path_coords[baseidx+1]];
		out_pts[1] = [p_path_coords[baseidx+2], p_path_coords[baseidx+3]];
	},
	
	segmentInterpolatePoint: function(p_pointlst, p_length, out_lst, opt_calcnormal, opt_esv) 
	{
		var esv, dy, dx, dely = parseFloat(p_pointlst[1][1]) - parseFloat(p_pointlst[0][1]);
		var delx = parseFloat(p_pointlst[1][0]) - parseFloat(p_pointlst[0][0]);

		var len = Math.sqrt(Math.pow(delx, 2) + Math.pow(dely, 2));

		var k = p_length / len;
		
		if (opt_esv) {
			esv = opt_esv;
		} else {
			esv = 0.00001;
		}

		out_lst.length = 3;
		
		out_lst[0] = k * delx + p_pointlst[0][0];
		out_lst[1] = k * dely + p_pointlst[0][1];	
		
		if (opt_calcnormal) 
		{
			if (Math.abs(dely) <= esv) {
				out_lst[2] = 0.0;
			}
			else
			{		
				if (Math.abs(delx) <= esv) 
				{
					if (dely > 0) {
						out_lst[2] = Math.PI / 2.0;
					} else {
						out_lst[2] = - Math.PI / 2.0;
					}
				}
				else if (delx < 0) 
				{
					if (dely < 0) {
						out_lst[2] = Math.atan(dely / delx) - Math.PI;
					} else {
						out_lst[2] = Math.atan(dely / delx) + Math.PI;
					}
				}
				else {
					out_lst[2] = Math.atan(dely / delx);
				}
			
			}
		} 
		else 
		{
			out_lst[2] = null;
		}
	},

	distance2: function(p_pt1, p_pt2) {
		var dely = 1.0 * (parseFloat(p_pt2[1]) - parseFloat(p_pt1[1]));
		var delx = 1.0 * (parseFloat(p_pt2[0]) - parseFloat(p_pt1[0]));
		
		return Math.pow(delx, 2) + Math.pow(dely, 2);
	},
	
	distance: function(p_pt1, p_pt2) {
		
		if (typeof p_pt1 != 'object' || p_pt1.length != 2) {
			throw new Error("geom.distance - error in first point: "+p_pt1);
		}
		if (typeof p_pt2 != 'object' || p_pt2.length != 2) {
			throw new Error("geom.distance - error in second point: "+p_pt2);
		}
		
		var dely = 1.0 * (parseFloat(p_pt2[1]) - parseFloat(p_pt1[1]));
		var delx = 1.0 * (parseFloat(p_pt2[0]) - parseFloat(p_pt1[0]));
		
		return Math.sqrt(Math.pow(delx, 2) + Math.pow(dely, 2));
	},

	area2_3p: function(p_pt1, p_pt2, p_pt3) {
		return (p_pt1[0] - p_pt3[0]) * (p_pt2[1] - p_pt3[1]) - (p_pt1[1] - p_pt3[1]) * (p_pt2[0] - p_pt3[0]);
	},
	
	area2: function(p_pointlst) 
	{
		var ret = 0.0;
		
		var n = p_pointlst.length;
		var j = n - 1;
		
		for (var i=0; i<n; i++) {
			ret += p_pointlst[j][0] * p_pointlst[i][1] - p_pointlst[j][1] * p_pointlst[i][0];
			j = i;
		}
		
		return ret;
		
	},
	isPointOnSegment: function(p_ptseg1, p_ptseg2, p_ptin) {
		let minval = 0.0001;		
		return (
			p_ptseg1[0] != p_ptseg2[0] &&
				(p_ptseg1[0] <= p_ptin[0] && p_ptin[0] <= p_ptseg2[0] || p_ptseg2[0] <= p_ptin[0] && p_ptin[0] <= p_ptseg1[0]) ||
			p_ptseg1[0] == p_ptseg2[0] && 
				(p_ptseg1[1] <= p_ptin[1] && p_ptin[1] <= p_ptseg2[1] || p_ptseg2[1] <= p_ptin[1] && p_ptin[1] <= p_ptseg1[1])
		) && Math.abs(this.area2_3p(p_ptseg1, p_ptseg2, p_ptin)) < minval;		
	},
	projectPointOnSegment: function(p_ptseg1, p_ptseg2, p_ptin, out_projpt) 
	{
		out_projpt.length = 2;

		//console.log(" pos >"+p_ptseg1+" "+p_ptseg2+" "+JSON.stringify(p_ptin));
		
		let d1, d2,dx = p_ptseg2[0] * 1.0 - p_ptseg1[0] * 1.0;
		let dy = p_ptseg2[1] * 1.0 - p_ptseg1[1] * 1.0;
		let len2 = (dx * dx) + (dy * dy);
		let inprod = dx * (p_ptin[0] - p_ptseg1[0]) + dy * (p_ptin[1] - p_ptseg1[1]);
		
		//console.log("dx:"+dx+", dy:"+dy+", inprod:"+inprod+", len2:"+len2);
		
		out_projpt[0] = p_ptseg1[0] + (inprod * (dx/len2));
		out_projpt[1] = p_ptseg1[1] + (inprod * (dy/len2));
		
		if (!this.isPointOnSegment(p_ptseg1, p_ptseg2, p_ptin)) {
			d1 = this.distance2(p_ptseg1, p_ptin);
			d2 = this.distance2(p_ptseg2, p_ptin);
			if (d1 <= d2) {
				out_projpt[0] = p_ptseg1[0];
				out_projpt[1] = p_ptseg1[1];
			} else {
				out_projpt[0] = p_ptseg2[0];
				out_projpt[1] = p_ptseg2[1];
			}
		}
		
		/*console.log(p_ptseg1[1]);
		console.log(inprod);
		console.log(inprod * (dy/len2));

		console.log(" pos >"+p_ptseg1+" "+p_ptseg2+" "+JSON.stringify(p_ptin)+" out:"+JSON.stringify(out_projpt));
		* */
		
	},
	
	projectPointOnLine: function(p_pointlst, p_ptin, out_projpt, opt_debug) 
	{
		var p1, p2, dist2, mindist=9999999, tmppt=[];
		out_projpt.length = 2;
		if (opt_debug) {
			console.log("----------------------------------------");
		}
		for (var i=0; i<(p_pointlst.length-2); i+=2 ) {
			p1 = [p_pointlst[i], p_pointlst[i+1]];
			p2 = [p_pointlst[i+2], p_pointlst[i+3]];
			this.projectPointOnSegment(p1, p2, p_ptin, tmppt);
			dist2 = this.distance2(p_ptin, tmppt);
			if (opt_debug) {
				console.log("mindist:"+mindist+", dist2:"+dist2+" ptin:"+JSON.stringify(p_ptin)+" tmppt:"+JSON.stringify(tmppt)+" p1:"+JSON.stringify(p1)+" p2:"+JSON.stringify(p2));
			}
			if (dist2 < mindist) {
				mindist = dist2;
				out_projpt[0] = tmppt[0];
				out_projpt[1] = tmppt[1];
			}
		}
		
		return mindist;
	},
	
	insidePolygon: function(p_pointlist, p_path_levels, p_ptin) 
	{
		var ret = false;
		
		function insideTest(p_namespace, pp_pointlist, pp_ptin) {
			
			var inner_ret = false;
			var n = pp_pointlist.length / 2;
			var j = n - 1;
			var p1, p2, iI, iJ;
			
			for (var i=0; i<n; i++) 
			{
				iI = 2*i;
				iJ = 2*j;
				p1 = [pp_pointlist[iI], pp_pointlist[iI+1]];
				p2 = [pp_pointlist[iJ], pp_pointlist[iJ+1]];
				if (
					pp_pointlist[iJ+1] <= pp_ptin[1] && pp_ptin[1] < pp_pointlist[iI+1] &&
					p_namespace.area2_3p(p1, p2, pp_ptin) > 0 ||
					pp_pointlist[iI+1] <= pp_ptin[1] && pp_ptin[1] < pp_pointlist[iJ+1] &&
					p_namespace.area2_3p(p2, p1, pp_ptin) > 0
				) 
				{
					inner_ret = !inner_ret;
				}
				j = i;
			}
			return inner_ret;
		}

		switch (p_path_levels) {
			
			case 1:
				ret = insideTest(this, p_pointlist, p_ptin);
				break;
			
			case 2:
				for (var i=0; i<p_pointlist.length; i++) 
				{
					if (insideTest(this, p_pointlist[i], p_ptin)) {
						ret = true;
						break;
					}
				}
				break;
			
			case 3:
				for (var i=0; i<p_pointlist.length; i++) 
				{
					for (var j=0; j<p_pointlist[i].length; j++) 
					{
						if (insideTest(this, p_pointlist[i][j], p_ptin)) {
							ret = true;
							break;
						}
					}
					if (ret) {
						break;
					}
				}
		}

		return ret;
	},
	
	distanceToLine: function(p_pointlist, p_path_levels, p_ptin, opt_debug) 
	{
		var d, ret = 0, prj=[], prjd=0;
			
		switch (p_path_levels) {
			case 1:
				this.projectPointOnLine(p_pointlist, p_ptin, prj);
				ret = this.distance(p_ptin, prj);
				break;
			
			case 2:
				for (var i=0; i<p_pointlist.length; i++) {
					prjd = this.projectPointOnLine(p_pointlist[i], p_ptin, prj, opt_debug);
					d = this.distance(p_ptin, prj);
					if (opt_debug) {
						console.log("i:"+i+", pt:"+JSON.stringify(p_ptin)+", prj:"+JSON.stringify(prj)+" pd:"+prjd+" d2:"+Math.pow(d,2));
					}
					if (i==0) {
						ret = d;
					} else {
						if (d < ret) {
							ret = d;
						}
					}
				}
				break;
			
			case 3:
				for (var j=0; j<p_pointlist.length; j++) 
				{
					for (var i=0; i<p_pointlist[j].length; i++) 
					{
						this.projectPointOnLine(p_pointlist[i], p_ptin, prj);
						d = this.distance(p_ptin, prj);
						if (i==0) {
							ret = d;
						} else {
							if (d < ret) {
								ret = d;
							}
						}
					}
				}
		}
		
		return ret;
	},
	
	distanceToPoly: function(p_pointlist, p_path_levels, p_ptin, opt_debug) 
	{
		let ret = 0.0;
		
		if (false && opt_debug) {
			console.log(JSON.stringify(p_pointlist));
		}
		
		if (!this.insidePolygon(p_pointlist, p_path_levels, p_ptin) ) {
			ret = this.distanceToLine(p_pointlist, p_path_levels, p_ptin, opt_debug);
		}
		
		return ret;
	},
		
	threePoints2DFromPath: function(p_path_coords, p_frst_segm_index, out_pts, opt_dontthrowexc) {
		var baseidx;
		out_pts.length = 3;
		baseidx = p_frst_segm_index * 2;
		if (p_path_coords[baseidx+5] === undefined) 
		{
			if (!opt_dontthrowexc) {
				throw new Error("threePoints2DFromPath: invalid segment index "+p_frst_segm_index+", coords:"+JSON.stringify(p_path_coords));
			}
			return false;
		}
		out_pts[0] = [p_path_coords[baseidx], p_path_coords[baseidx+1]];
		out_pts[1] = [p_path_coords[baseidx+2], p_path_coords[baseidx+3]];
		out_pts[2] = [p_path_coords[baseidx+4], p_path_coords[baseidx+5]];
		
		return true;
	},
		
	pathLength: function(p_coordslist) 
	{		
		var len = 0, idx=-1;
		var crdbuf = [];
		var lim = p_coordslist.length-1;
		
		while (idx < lim) 
		{
			idx++;
			
			crdbuf.push(p_coordslist[idx]);
			if (crdbuf.length == 4) 
			{
				len += this.distance([crdbuf[0], crdbuf[1]], [crdbuf[2], crdbuf[3]]);
				crdbuf.splice(0,2);
			}			
		}
		
		return len;
	},

	pathCenter: function(p_coordslist, p_path_levels, out_coords) 
	{		
		var idx0=-1;
		var idx=-1;
		var lim = p_coordslist.length-1;
		out_coords.length = 2;
		var sumX=0.0, sumY=0.0;
		var cnt=0;
		
		function cyclePath(pp_coordlist, pp_sumlist) { 			
			var idx = -1;	
			var lim = pp_coordlist.length-1;		
			while (idx < lim) 
			{
				idx++;
				
				if (idx % 2 == 0) {
					pp_sumlist[0] += pp_coordlist[idx];
				} else {
					pp_sumlist[1] += pp_coordlist[idx];
					cnt++;
				}
			}
		}
		
		var somas = [sumX, sumY];
		switch (p_path_levels) {			
			case 1:
				cyclePath(p_coordlist, somas);
				break;
				
			case 2:
				for (var j=0; j<p_coordslist.length; j++) {
					cyclePath(p_coordslist[j], somas);
				}
				break;
				
			case 3:
				for (var i=0; i<p_coordslist.length; i++) 
				{
					for (var j=0; j<p_coordslist[i].length; j++) {
						cyclePath(p_coordslist[i][j], somas);
					}
				}
				break;
		}

		out_coords[0] = somas[0] / cnt;
		out_coords[1] = somas[1] / cnt;
	},
	
	// opt_filterminlength -- comprimento minimo de segmento
	// opt_out_coordslist -- nova lista de coordenadas a preencher se opt_filterminlength for dado
	pathSegLengths: function(p_coordslist, out_seglens, opt_out_accum_seglens, 
			opt_filterminlength, opt_out_coordslist, the_txt) 
	{		
		var len=0, seglen=0, idx=-1, used=false;
		var crdbuf = [];
		var lim = p_coordslist.length-1;
		var out_coords_started = false;
		var ret = true;
		
		out_seglens.length = 0;
		if (opt_out_accum_seglens) {
			opt_out_accum_seglens.length = 0;
		}
		opt_out_coordslist.length = 0;
		
		while (idx < lim) 
		{
			idx++;

			crdbuf.push(p_coordslist[idx]);
			if (crdbuf.length == 4) 
			{
				seglen = this.distance([crdbuf[0], crdbuf[1]], [crdbuf[2], crdbuf[3]]);
								
				if (opt_filterminlength == null || seglen >= opt_filterminlength) {
					out_seglens.push(seglen);
					if (opt_out_accum_seglens) {
						len += seglen;	
						opt_out_accum_seglens.push(len);
					}
					used = true;
				} else {
					used = false;
				}
				
				if (opt_filterminlength != null && seglen >= opt_filterminlength) {
					opt_out_coordslist.push(crdbuf[0]);
					opt_out_coordslist.push(crdbuf[1]);
					out_coords_started = true;
				}
				
				if (used) {
					crdbuf.splice(0,2);
				} else {
					crdbuf.splice(2,3);
				}
			}			
		}
		
		if (out_coords_started) {
			opt_out_coordslist.push(crdbuf[0]);
			opt_out_coordslist.push(crdbuf[1]);	
			
			// a figura original está muito deformada, melhor não usar
			if (opt_out_coordslist.length < p_coordslist.length/1.9) {
				ret = false;
			}
		}
		
		return ret;
	},
	
	lineInterpolatePoint: function(p_coordslist, p_seglens, p_accum_seglens, 
									p_length, out_lst, opt_start_segidx, opt_calcnormal) 
	{
		var crdbaseidx, start_segidx, segidx=-1, prevlen = 0, found = false, dx, dy;
		
		out_lst.length = 4;
		
		if (opt_start_segidx) {
			start_segidx = opt_start_segidx;
		} else {
			start_segidx = 0;			
		}
		
		for (segidx=start_segidx; segidx<p_accum_seglens.length; segidx++) 
		{			
			if (p_accum_seglens[segidx] >= p_length) {
				if (segidx >= 1) {
					prevlen = p_accum_seglens[segidx-1];
				} else {
					prevlen = 0;
				}
				found = true;
				break;
			}			
			prevlen = p_accum_seglens[segidx];
		}
		
		if (found) {
			k = (p_length - prevlen) / p_seglens[segidx];
			crdbaseidx = 2 * segidx;
			
			dx = p_coordslist[crdbaseidx+2] - p_coordslist[crdbaseidx];
			dy = p_coordslist[crdbaseidx+3] - p_coordslist[crdbaseidx+1];
			
			out_lst[0] = segidx;
			
			out_lst[1] = k * dx + p_coordslist[crdbaseidx];
			out_lst[2] = k * dy + p_coordslist[crdbaseidx+1];	
			
			if (opt_calcnormal) {
				out_lst[3] = Math.atan(dy / dx);
			} else {
				out_lst[3] = null;
			}
		}
		
		return found;
		
	},
	
	threePointComplementAngles: function(p1, p2, p3, out_angles, opt_esv) 
	{
		var esv, lefttoright = true;
		
		out_angles.length = 3;
		
		if (opt_esv) {
			esv = opt_esv;
		} else {
			esv = 0.00001;
		}
		
		var dy0 = p2[1] - p1[1];
		var dy1 = p3[1] - p2[1];
		var dx0 = p2[0] - p1[0];
		var dx1 = p3[0] - p2[0];		

		if (dx0 < 0 && dx1 < 0) {
			lefttoright = false;
		}
		
		if (Math.abs(dy0) <= esv) {
			out_angles[1] = 0.0;
		}
		else
		{		
			if (Math.abs(dx0) <= esv) 
			{
				if (dy0 > 0) {
					out_angles[1] = Math.PI / 2.0;
				} else {
					out_angles[1] = - Math.PI / 2.0;
				}
			}
			else if (dx0 < 0) 
			{
				if (dy0 < 0) {
					out_angles[1] = Math.atan(dy0 / dx0) - Math.PI;
				} else {
					out_angles[1] = Math.atan(dy0 / dx0) + Math.PI;
				}
			}
			else {
				out_angles[1] = Math.atan(dy0 / dx0);
			}
		
		}

		if (Math.abs(dy1) <= esv) {
			out_angles[2] = 0.0;
		}
		else
		{		
			if (Math.abs(dx1) <= esv) 
			{
				if (dy1 > 0) {
					out_angles[2] = Math.PI / 2.0;
				} else {
					out_angles[2] = - Math.PI / 2.0;
				}
			}
			else if (dx1 < 0) 
			{
				if (dy1 < 1) {
					out_angles[2] = Math.atan(dy1 / dx1) - Math.PI;
				} else {
					out_angles[2] = Math.atan(dy1 / dx1) + Math.PI;
				}
			}
			else {
				out_angles[2] = Math.atan(dy1 / dx1);
			}
		
		}
		
		if (out_angles[1] <= out_angles[2]) {
			//console.log('a');
			out_angles[0] = Math.PI + out_angles[1] - out_angles[2];
		} else {
			//console.log('b');
			out_angles[0] = Math.PI - out_angles[1] + out_angles[2];			
		}

		/*
		console.log("p1:"+JSON.stringify(p1));
		console.log("p2:"+JSON.stringify(p2));
		console.log("p3:"+JSON.stringify(p3));
		console.log("angle 0:"+this.rad2Deg(out_angles[0]));
		console.log("angle 1:"+this.rad2Deg(out_angles[1]));
		console.log("angle 2:"+this.rad2Deg(out_angles[2]));
		*/
		
		// retorna, em out_angles, theta, alfa (prim.segmento), beta (segundo segm.)
	},

	twoPointAngle: function(p1, p2, out_ret) 
	{
		out_ret.length = 2;
		var dx = p2[0] - p1[0];
		var dy = p2[1] - p1[1];
		// angle
		out_ret[0] = Math.atan(dy / dx);
		
		// quadrant
		if (dx < 0) 
		{
			// 2 or 3
			if (dy < 0) {
				out_ret[1] = 3;
			} else {
				out_ret[1] = 2;
			}			
		} 
		else 
		{
			// 1 or 4
			if (dy < 0) {
				out_ret[1] = 4;
			} else {
				out_ret[1] = 1;
			}	
		}
	},

	applyPolarShiftTo: function(p_pt, p_angle, p_length, out_pt) 
	{
		out_pt.length = 2;
		out_pt[1] = p_pt[1] + p_length * Math.sin(p_angle);
		out_pt[0] = p_pt[0] + p_length * Math.cos(p_angle);
	},
	
	tangentArcParams: function(p_frstseg_angle, p_secseg_angle, p_radius, out_lst) 
	{
		var alpha = p_frstseg_angle + Math.PI/2.0;
		var beta = p_secseg_angle + Math.PI/2.0;

		//console.log("a0:"+this.rad2Deg(alpha)+" b0:"+this.rad2Deg(beta));
		
		if (alpha > Math.PI) {
			alpha =  alpha - 2*Math.PI;
		}
		if (beta > Math.PI) {
			beta =  beta - 2*Math.PI;
		}

		var perim = 2 * Math.PI *  p_radius;
		var deltaang = Math.abs(alpha - beta)
		
		out_lst.length = 2;
		
		// comprimento do arco
		//console.log("a:"+this.rad2Deg(alpha)+" b:"+this.rad2Deg(beta)+" da:"+this.rad2Deg(deltaang));
		if (deltaang > Math.PI) {
			out_lst[0] = (Math.PI * 2 - deltaang) * perim / (2 * Math.PI);
		} else {
			out_lst[0] = deltaang * perim / (2 * Math.PI);
		}
		// distância de start_pt ao vértice de junção das tangentes 
		out_lst[1] = Math.abs(p_radius * Math.tan(deltaang / 2.0));	
		
		//console.log(JSON.stringify(out_lst));
	},
	
	pointOnArcInvertedY: function(p_frstseg_angle, p_secseg_angle, p_radius, 
											p_length, start_pt, out_lst, opt_inverted) 
	{  
		var alpha, beta, norm, inverted;
		//if (p_frstseg_angle < p_secseg_angle) {
			alpha = p_frstseg_angle - Math.PI/2.0;
			beta = p_secseg_angle - Math.PI/2.0;
		/*} else {
			alpha = p_frstseg_angle + Math.PI/2.0;
			beta = p_secseg_angle + Math.PI/2.0;			
		} */

		var diffang = Math.abs(alpha - beta);
		
		var perim = 2 * Math.PI *  p_radius
		var arclen = diffang * perim / (2 * Math.PI);
		
		out_lst.length = 3;
		
		// normal
		
		if (opt_inverted && (alpha>0 || beta>0)) {
			inverted = true;
		} else {
			inverted = false;			
		}
		
		if (inverted) {
			if (alpha > beta) {
				norm = alpha + (p_length / arclen) * diffang;
			} else {
				norm = alpha - (p_length / arclen) * diffang;
			}
		} else {
			if (alpha > beta) {
				norm = alpha - (p_length / arclen) * diffang;
			} else {
				norm = alpha + (p_length / arclen) * diffang;
			}
		}
		out_lst[2] = norm;
		
		//console.log("p_frstseg_angle:"+this.rad2Deg(p_frstseg_angle));
		//console.log("p_secseg_angle:"+this.rad2Deg(p_secseg_angle));
		//console.log("radius:"+p_radius);
		//console.log("perim:"+perim);

		//console.log("alpha:"+this.rad2Deg(alpha)+" beta:"+this.rad2Deg(beta)+" inv:"+inverted);
		
		/*
		console.log("alpha:"+this.rad2Deg(alpha)+" beta:"+this.rad2Deg(beta));
		console.log("beta:"+this.rad2Deg(beta));
		console.log("arclen:"+arclen);
		console.log("p_length:"+p_length);
		console.log("normal:"+this.rad2Deg(norm)+', '+this.rad2Deg(out_lst[2]));
		*/
		
		var dy = Math.sin(norm) - Math.sin(alpha);
		var dx = Math.cos(norm) - Math.cos(alpha);

		if (inverted) 
		{
			if (alpha > beta) {
				out_lst[0] = start_pt[0] + p_radius * dx;
				out_lst[1] = start_pt[1] + p_radius * dy;
			} else {
				out_lst[0] = start_pt[0] - p_radius * dx;
				out_lst[1] = start_pt[1] - p_radius * dy;
			}
		}
		else 
		{
			if (alpha > beta) {
				out_lst[0] = start_pt[0] - p_radius * dx;
				out_lst[1] = start_pt[1] - p_radius * dy;
			} else {
				out_lst[0] = start_pt[0] + p_radius * dx;
				out_lst[1] = start_pt[1] + p_radius * dy;
			}
		}
		
		
	},
	
	manhattan: function(p1, p2) {
		return p2[0] - p1[0] + p2[1] - p1[1];	
	}
	

	
	
	
	
	
	
}
