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
//= require turbolinks
//= require_tree .''

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
						$cell.click();
					} 
					if(current_alive && !active){
						$cell.click();
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

	//clicking a cell triggers a change in state between dead/alive
	$("#canvas-cells").on("click", ".cell", function(evt){
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
	});

	$(function () {
		  var isMouseDown = false;
		  $("#canvas-cells")
		  .mousedown(function (evt) {
		      isMouseDown = true;
		      var tag = $(evt.target).attr("id");
		      var query_string = "#" + tag;
		      $(query_string).click();
		      return false; // prevent text selection
		    })
		    .mouseover(function (evt) {
		      if (isMouseDown) {
		       	var tag = $(evt.target).attr("id");
		      	var query_string = "#" + tag;
		      	$(query_string).click();
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
		var speed_ms = 200;
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
			if(turn_alive) $(query_string).click();
		}
	});

})
