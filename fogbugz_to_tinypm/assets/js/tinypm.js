
// Get the iteration id needed to post.
var url = $("body").data("url");
var match = url.match(/=([^&]+)/);
var iteration_id = match.length > 1 ? match[1] : null;
match = url.match(/projectCode=(.+)$/);
var project_code = match.length > 1 ? match[1] : null;

if (iteration_id && project_code) {

	chrome.storage.local.get(['case_title', 'case_points'], function(items) {

		var case_title = items["case_title"];
		var case_points = items["case_points"];

		if (!case_title || case_title == "") return;

		chrome.storage.local.set({
  			'case_title': null,
  			'case_points': null
  		}, function() {});

		$.get("/userStory/create", {
			iterationHash: iteration_id,
			projectCode: project_code,
			ref: "taskboard"
		}, function (data) {
			var project_id = $("#project", data).val();
			$.post("/userStory/save", {
				project: project_id,
				ref: "taskboard",
				color: "480e18d41c4b2bb3e19ebc9012c9a192",
				name: case_title,
				description: "",
				owner: null,
				"priority.id": 1,
				estimatedEffort: case_points,
				iteration: iteration_id,
				"_addDefaultTasks": "",
				addDefaultTasks: "on"
			}, function (data, e) {
				if (e == "success")
					location.reload();
			});
		});
	});
}

$(function () {
	// Add links to stories
	var stories = $(".story");

	$.each(stories, function (index, story) {
		var title = $(".title", story).text();
		var match = /\w+/.exec(title);
		var itemId = $(".item_id", story);

		if (!match) return;

		var link = $("<a href='http://69.70.14.194/fogbugz/default.asp?" + match[0] + "' target='_blank'>[Link to fogbugz]</a>");
		link.insertAfter(itemId);
	});
});