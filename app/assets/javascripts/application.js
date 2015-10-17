// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs

//= require_tree .''
//= require init

$(document).ready(function () {

	//holds information for new grid dimensions
	var updateGrid = {

		height: function(){
			return 30;
		},

		width: function(){
			return 60;
		},

		updateFromModel: function(new_array){
			var unique_id = 0;

			for(var i=0; i<this.height(); i++) {
				for (var j = 0; j<this.width(); j++) {
					var active = new_array[i][j];
					query_string = "#cell-" + unique_id;
					$cell = $(query_string)
					var current_alive = ($cell.attr("data-alive") == "true");

					if(!current_alive && active){
						$cell.mousedown();
					} 
					if(current_alive && !active){
						$cell.mousedown();
					} 
					unique_id++;
				}
			}

		}
	};

	//wrapper to handle new grid constructions
	var constructGrid = function(){
		var canvas="";
		var unique_id=0;

		for (var i=0; i<updateGrid.height(); i++) {
			canvas += "<tr>"; 

			for (var j = 0; j<updateGrid.width(); j++) { 
				canvas += "    <td id='cell-"+ unique_id +"' class='cell' data-x='" + j;
				canvas += "' data-y='" + i + "' data-alive='false'></td>\n";
				unique_id++;
			}
			canvas += "</tr>\n";
		}
		$('#canvas-cells').html(canvas);
	};

	
	//construct initial grid
	constructGrid();

	//click events with the capacity to drag
	$(function () {
		  var isMouseDown = false;
		  $("#canvas-cells")
		  .mousedown(function (evt) {
	        isMouseDown = true;
			$(evt.target).toggleClass("alive");
			var control_click = evt.metaKey
			var shift_click = evt.shiftKey
			//console.log($(evt.target));
			var state = $(evt.target).attr("data-alive");

			if(!shift_click && (control_click || state==="true")){
				$(evt.target).attr("data-alive","false");
				$(evt.target).addClass("was-alive");
				$(evt.target).removeClass("alive");
				} else {
				$(evt.target).addClass("alive");
				$(evt.target).attr("data-alive","true");
				$(evt.target).removeClass("was-alive");
				}	
		      return false; // prevent text selection
		    })
		    .mouseover(function (evt) {
		      if (isMouseDown) {
		       	var tag = $(evt.target).attr("id");
		      	var query_string = "#" + tag;
		      	$(evt.target).toggleClass("alive");
				var control_click = evt.metaKey
				var shift_click = evt.shiftKey
				//console.log($(evt.target));
				var state = $(evt.target).attr("data-alive");

				if(!shift_click && (control_click || state==="true")){
					$(evt.target).attr("data-alive","false");
					$(evt.target).addClass("was-alive");
					$(evt.target).removeClass("alive");
				} else {
					$(evt.target).addClass("alive");
					$(evt.target).attr("data-alive","true");
					$(evt.target).removeClass("was-alive");
				}	
		      }
		    });
		  $(document)
		    .mouseup(function () {
		      isMouseDown = false;
		    });
		});

	//wrapper objects to handle invokation of one step of the automata
	var automata = {

		construct_model: function(){
			this.grid = [];
			for(i=0;i<updateGrid.height();i++){
				this.grid[i]=[];
				for(j=0;j<updateGrid.width();j++){
					this.grid[i][j] = false;
				}
			}
		},

		step: function(){
			var $living = $('td[data-alive="true"]');

			$living.each(function( index ) {
  				x = parseInt($(this).data('x'));
  				y = parseInt($(this).data('y'));
  				automata.grid[y][x] = true;
			});

			var next_gen_grid = [];
			for(var i=0;i<updateGrid.height();i++) { //grid_size not 1
				next_gen_grid[i] = []
				for(var j=0;j<updateGrid.width();j++) {
					var current_status = automata.grid[i][j]
					var living = automata.next_round_on_wraps(j, i, current_status);
					next_gen_grid[i][j] = living;
				}
			}

			return next_gen_grid;
		},

		next_round_on_wraps: function(cellx, celly, currently_alive){
			var living_neighbors = 0;
			//coordinate representing top left of radial area
			var x = cellx - this.radius();
			var y = celly - this.radius();

			for(var i=0;i<(this.radius()*2)+1;i++){
				for(var j=0;j<(this.radius()*2)+1;j++){
					var checking_x = x+i;
					var checking_y = y+j;
					//we do not count a neighbor as itself
					if(checking_x == cellx && checking_y == celly) continue;
					//under the wrapping mechanism neighbors will continue to other side of grid
					if(checking_x<0) checking_x = updateGrid.width() + (checking_x % updateGrid.width());
					if(checking_y<0) checking_y = updateGrid.height() + (checking_y % updateGrid.height());
					if(checking_x>(updateGrid.width()-1)) checking_x = checking_x % updateGrid.width();
					if(checking_y>(updateGrid.height()-1)) checking_y = checking_y % updateGrid.height();

					//if neighbor is alive we raise the count of live neighbors by one
					if(this.grid[checking_y][checking_x]==true) living_neighbors++;
				}
			}

			//cell may die of overpopulation or lonliness
			if (living_neighbors>this.overpop_death() || living_neighbors<this.lonely_death()) {
				return false;
			}

			//equilibrium laws may allow a cell to continue life
			if(currently_alive && (living_neighbors<=this.overpop_death() || living_neighbors>=this.lonely_death())){
				return true;
			}

			//cell will become alive if it is between generational thresholds
			cell_should_become_alive = (this.gmin() <= living_neighbors && living_neighbors<=this.gmax());
			return cell_should_become_alive;
		},

		radius: function(){
			return 1;
		},

		gmin: function(){
			return 3;
		},

		gmax: function(){
			return 3;
		},

		lonely_death: function(){
			return 2;
		},

		overpop_death: function(){
			return 3;
		},

		outside_cells: function(){
			return "wrap";
		},

		grid: null
	};


	//listeners for the main control panel
	$("#reset-button").click(function(evt){
		$("#stop-button").click()
		$('.cell').removeClass("alive");
		$('.cell').removeClass("was-alive");
		$('.cell').attr("data-alive","false")

	});

	$("#next-button").click(function(evt){
		if ($('td[data-alive="true"]').length==0) $("#stop-button").click()
		//construct the model for the automata
		automata.construct_model();
		next_grid = automata.step();
		grid_size = updateGrid.height()
		if(next_grid){
			updateGrid.updateFromModel(next_grid);
		}
		
	});

	//interval timers that repeat automata
	var time_keeper;

	$("#start-button").click(function(evt){
		var speed_ms = 400;
		var funct = function() {$('#next-button').click();}
		time_keeper = window.setInterval(funct, speed_ms);
	});

	$("#stop-button").click(function(evt){
		window.clearInterval(time_keeper);
	});

	$("#scatter-button").click(function(evt){
		$('#reset-button').click();
		for(var i=0;i<(updateGrid.height()*updateGrid.width());i++){
			var number_pick = Math.random();
			var turn_alive = (number_pick<0.5);
			var query_string = '#cell-'+i;
			if(turn_alive) $(query_string).mousedown();
		}
	});


	//PRELOADED DRAWINGS

	var preloaded_drawing = " \
		cell-130  \
		cell-175  \
		cell-176 \
		cell-177 \
		cell-183 \
		cell-190 \
		cell-200 \
		cell-201 \
		cell-235 \
		cell-236 \
		cell-237 \
		cell-243 \
		cell-250 \
		cell-260 \
		cell-261 \
		cell-295 \
		cell-296 \
		cell-297 \
		cell-303 \
		cell-310 \
		cell-320 \
		cell-321 \
		cell-348 \
		cell-349 \
		cell-350 \
		cell-351 \
		cell-355 \
		cell-356 \
		cell-357 \
		cell-363 \
		cell-370 \
		cell-373 \
		cell-374 \
		cell-375 \
		cell-376 \
		cell-380 \
		cell-381 \
		cell-384 \
		cell-385 \
		cell-386 \
		cell-408 \
		cell-411 \
		cell-412 \
		cell-415 \
		cell-416 \
		cell-417 \
		cell-423 \
		cell-427 \
		cell-430 \
		cell-433 \
		cell-436 \
		cell-440 \
		cell-441 \
		cell-444 \
		cell-446 \
		cell-447 \
		cell-448 \
		cell-450 \
		cell-451 \
		cell-452 \
		cell-453 \
		cell-454 \
		cell-455 \
		cell-459 \
		cell-460 \
		cell-461 \
		cell-462 \
		cell-463 \
		cell-464 \
		cell-465 \
		cell-468 \
		cell-472 \
		cell-475 \
		cell-476 \
		cell-477 \
		cell-483 \
		cell-487 \
		cell-490 \
		cell-493 \
		cell-496 \
		cell-497 \
		cell-500 \
		cell-501 \
		cell-504 \
		cell-510 \
		cell-515 \
		cell-516 \
		cell-519 \
		cell-520 \
		cell-522 \
		cell-525 \
		cell-528 \
		cell-529 \
		cell-530 \
		cell-531 \
		cell-532 \
		cell-535 \
		cell-536 \
		cell-537 \
		cell-543 \
		cell-547 \
		cell-550 \
		cell-552 \
		cell-553 \
		cell-554 \
		cell-555 \
		cell-556 \
		cell-557 \
		cell-560 \
		cell-561 \
		cell-564 \
		cell-570 \
		cell-576 \
		cell-579 \
		cell-582 \
		cell-585 \
		cell-588 \
		cell-595 \
		cell-596 \
		cell-597 \
		cell-603 \
		cell-607 \
		cell-610 \
		cell-612 \
		cell-613 \
		cell-620 \
		cell-621 \
		cell-624 \
		cell-625 \
		cell-628 \
		cell-630 \
		cell-631 \
		cell-635 \
		cell-639 \
		cell-642 \
		cell-644 \
		cell-645 \
		cell-648 \
		cell-655 \
		cell-656 \
		cell-657 \
		cell-663 \
		cell-664 \
		cell-665 \
		cell-666 \
		cell-667 \
		cell-668 \
		cell-669 \
		cell-670 \
		cell-673 \
		cell-680 \
		cell-681 \
		cell-685 \
		cell-686 \
		cell-687 \
		cell-688 \
		cell-691 \
		cell-692 \
		cell-693 \
		cell-694 \
		cell-695 \
		cell-699 \
		cell-702 \
		cell-704 \
		cell-705 \
		cell-708 \
		cell-709 \
		cell-710 \
		cell-711 \
		cell-712 \
		cell-733 \
		cell-734 \
		cell-735 \
		cell-736 \
		cell-737 \
		cell-775 \
		cell-776 \
		cell-777 \
		cell-910 \
		cell-915 \
		cell-949 \
		cell-970 \
		cell-975 \
		cell-996 \
		cell-1001 \
		cell-1004 \
		cell-1009 \
		cell-1030 \
		cell-1035 \
		cell-1056 \
		cell-1057 \
		cell-1060 \
		cell-1061 \
		cell-1064 \
		cell-1069 \
		cell-1090 \
		cell-1095 \
		cell-1115 \
		cell-1116 \
		cell-1117 \
		cell-1120 \
		cell-1121 \
		cell-1124 \
		cell-1129 \
		cell-1150 \
		cell-1155 \
		cell-1175 \
		cell-1177 \
		cell-1179 \
		cell-1181 \
		cell-1184 \
		cell-1189 \
		cell-1208 \
		cell-1229 \
		cell-1230 \
		cell-1231 \
		cell-1232 \
		cell-1235 \
		cell-1237 \
		cell-1238 \
		cell-1239 \
		cell-1241 \
		cell-1244 \
		cell-1245 \
		cell-1246 \
		cell-1247 \
		cell-1248 \
		cell-1249 \
		cell-1268 \
		cell-1277 \
		cell-1278 \
		cell-1294 \
		cell-1298 \
		cell-1301 \
		cell-1304 \
		cell-1309 \
		cell-1329 \
		cell-1337 \
		cell-1353 \
		cell-1354 \
		cell-1361 \
		cell-1362 \
		cell-1364 \
		cell-1369 \
		cell-1389 \
		cell-1390 \
		cell-1396 \
		cell-1397 \
		cell-1413 \
		cell-1422 \
		cell-1424 \
		cell-1429 \
		cell-1451 \
		cell-1452 \
		cell-1453 \
		cell-1454 \
		cell-1455 \
		cell-1456 \
		cell-1473 \
		cell-1482 \
		cell-1484 \
		cell-1489";

	$('#canvas-cells').ready(function () {
		var draw_cells = preloaded_drawing.trim().split(/\s+/g);
		for(var i=0;i<draw_cells.length;i++){
			var query_string = "#"+draw_cells[i];
			$(query_string).mousedown();
			$(query_string).mouseup();
		}
		var wait = 3000;
		var funct = function() {$('#start-button').click();}
		time_keeper = window.setTimeout(funct, wait);
	});
});


