
function successHandler(data, url){
	var start = url.indexOf("courseNumber");
	var sub = url.substring(start).split('&');
	var courseNumber = sub[0].substring(sub[0].indexOf("=")+1);
	var sectionNumber = sub[1].substring(sub[1].indexOf("=")+1);
	
	var department = data[0]['subject'];
	
	var course;
	for(var i =0; i < data.length; i++){
		course = data[i];
		if(course['courseNumber'] == courseNumber){
			break;	
		}
	}
	var sections = course['sections'];
	for(var j = 0; j< sections.length; j++){
		section = sections[j];
		if(section['number'] == sectionNumber){
			break;
		}
	}
	var isOpen = section['openStatus'];
	var tag = "." + department + "_" + courseNumber + "_" + sectionNumber;

	if(isOpen){
		$("#" + department + "_" + courseNumber + "_" + sectionNumber).attr('class','open-box');
		$("#register_" + department + "_" + courseNumber + "_" + sectionNumber).attr('style', 'font-weight: bold');
		$("#number_" + department + "_" + courseNumber + "_" + sectionNumber).attr('style', 'display: none');
	}
	$('#loadingGif' + department + "_" + courseNumber + "_" + sectionNumber).hide();
	$('#sectionNumber' + department + "_" + courseNumber + "_" + sectionNumber).attr('style','');
	
	$('.register_'+ department + "_" + courseNumber + "_" + sectionNumber).on('click',function(){
		var index = $('.register_'+ department + "_" + courseNumber + "_" + sectionNumber).attr('id');
		var theUrl = "https://sims.rutgers.edu/webreg/editSchedule.htm?login=cas&semesterSelection=92014&indexList=" + index;
		chrome.tabs.create({url: theUrl});
	});
}

function deleteFromLocalStorage(data){
	var goodCourses = {
		"keys": [
						
		] 
	}
	var badCourses = {		
		"keys": [
							
		] 
	}			
	
	chrome.extension.sendMessage({method: "getPreviousLocalStorage"}, function(responseA){
	
		if(responseA.previouskeys != null){
			badCourses = JSON.parse(responseA.previouskeys);
		}
		chrome.extension.sendMessage({method: "getLocalStorage", name: "keys"}, function(response){ 
			var badIds = data['delete-ids'];
			var courses = response.keys;
			courses = JSON.parse(courses);
			
			courses2 = courses['keys'];
			for(var i = 0; i < courses2.length; i++){
				if(badIds.indexOf(String(courses2[i]['watch_id'])) == -1) {
					goodCourses['keys'].push({'watch_id': courses2[i]['watch_id'], 'department': courses2[i]['department'], 'course': courses2[i]['course'], 'section': courses2[i]['section'], 'index': courses2[i]['index'], 'title':courses2[i]['title']});
					//goodCourses['keys'].push(courses2[i]);
				}    
				else{
					badCourses['keys'].push({'watch_id': courses2[i]['watch_id'], 'department': courses2[i]['department'], 'course': courses2[i]['course'], 'section': courses2[i]['section'], 'index': courses2[i]['index'], 'title':courses2[i]['title']});
					//badCourses['keys'].push(coruses2[i]);
					//$('.').html('You have been emailed about this class. To undo, press here.');
					
				}
			}	
			chrome.extension.sendMessage({method: "setLocalStorage", data: JSON.stringify(goodCourses)}, function(response){});
			chrome.extension.sendMessage({method: "setPreviousLocalStorage", data: JSON.stringify(badCourses)}, function(response){});
		});
	
	});
}

displayCourses();


function displayCourses(){
	
	var localKeys;
	
	chrome.extension.sendMessage({method: "getLocalStorage"}, function(response){ 
		
		var listOfIds = [];
		
		localKeys = response.keys;
			
		localKeys = JSON.parse(localKeys);
		
		var subKeys = localKeys['keys'];
		for(var i = 0; i< subKeys.length; i++){
			var course = subKeys[i];
			var department = course['department'];
			var courseNumber = course['course'];
			var section = course['section'];
			var index = course['index'];
			 
			listOfIds.push(course['watch_id']);
			 
			var courseTitle=course['title'];
			 
			var semester = '92014';
			var campus = 'NB';
			var level = 'U'	;
			 
			var appendRow =  "<tr><td id = '" + department + "_" + courseNumber + "_" + section + "' class='load-box'>" + "<div id='loadingGif"+department + 
			"_" + courseNumber + "_" + section+"'> <img src='http://www.mytreedb.com/uploads/mytreedb/loader/ajax_loader_gray_512.gif' height='30px'> </div><div id='sectionNumber" +department + 
			"_" + courseNumber + "_" + section+ "' style='display:none;'>" + section + "</div>" + "</td><td id='className'><div>" + 
			courseTitle + "</div></td><td> <div id='number_"+ department + "_" + courseNumber + "_" + section +"'>"
			+ department + ":" + courseNumber + "</div> <div id='register_" + department + "_" + courseNumber + "_" + section + "'style='display:none'><a class='register_"+ department + "_" + courseNumber + "_" + section +"' href='#' id='"+index+"'>REGISTER!</a></div>"
			 +"</td><td class='garbage'><img src='http://png.findicons.com/files/icons/1580/devine_icons_part_2/128/trash_recyclebin_empty_closed.png' height='20px'></td></tr>";
			
			$('.course-table').append(appendRow);
			
			
			//pass additional info in post so that on asynchronous susccess I can access data
			var requestData = {'subject': department, 'semester': semester, 'campus': campus, 'level': level, 'courseNumber':courseNumber, 'section':section};
			
			//checks if coruses are open or not
			$.ajax({
				type:"GET",
				url:'http://sis.rutgers.edu/soc/courses.json',
				data: requestData,
				success: function(data){ 
					successHandler(data, this.url);
				},
				error: function(data){
					console.log('failed');
					console.log(data);
				}
			});
		 
		}
		
		$('.course-table').append('<tr><td><img src="https://cdn1.iconfinder.com/data/icons/windows-8-metro-style/512/refresh.png" height="20px" style="padding:5px"></td><td><a href="previousWatches.html">View Old Watches</a></td><td colspan="2" style="text-align:left"><img src="oldscarflabs.png" height="20px" style="padding:5px;"></td></tr>');
		
		
		//checks to see if the courses have been marked as watched in database
		var ids = {'watch-ids': JSON.stringify(listOfIds)};		
		$.ajax({
				type:"GET",
				//url:'http://69.114.127.1/syncStatus.php',
				url: 'http://aaronrosenheck.com/coursewatcher/syncStatus.php',
				data: ids,
				success: function(data){ 
					deleteFromLocalStorage(data);
				},
				error: function(data){
					console.log('GET from Old Scarf Labs API has failed with response:');
					console.log(data);
			}
		});
		
	});
	
	
}

