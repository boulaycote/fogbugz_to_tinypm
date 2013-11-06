$(function () {

	var api = "http://69.70.14.194/Fogbugz/api.asp?"
	var logon_endpoint = api + "cmd=logon&email={0}&password={1}";
	var search_endpoint = api + "cmd=search&cols=sTitle&q={0}&token={1}";

	var _token = null;	
	var xhr;
	var case_id;
	var case_title;

	var timeout;

	chrome.storage.local.get(["token"], function(items) {
		var token = items["token"];

		if (!token || token == "") {
			ShowLoginForm();
		} else {
			_token = token;
			ShowImportForm();
		}
	});

	function ShowLoginForm() {
		var login_form = $(".login-form").show(),
			import_form = $(".import-form").hide()
		ShowMessage("Please log in", "info");
		chrome.storage.local.set({
  			"token" : null
  		}, function() {});
	}

	function ShowImportForm() {
		var login_form = $(".login-form").hide(),
			import_form = $(".import-form").show(),
			loader = $("#loader").text("Start typing to find user story");
	}

	function ShowMessage(message, type) {
		type = type || "danger";
		var alert = '<div class="alert alert-block alert-{0} fade in"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><p>{1}</p>'
		.format(type, message);

		$(".alerts").html(alert);
		clearTimeout(timeout);
		timeout = setTimeout(function () {
			$(".alerts .close").trigger("click");
		}, 3000);
	}

	function Login (username, password) {
		var endpoint = logon_endpoint.format(username, password);
		
		NProgress.start();
		xhr && xhr.abort();
		xhr = $.post(endpoint, function (xml) {

  			var $doc = $(xml);
  			var token = $doc.find("token").text();

  			if (!token || token == "") {
  				ShowMessage("Login failed!");
  			} else {
  				_token = token.trim();
				chrome.storage.local.set({
					"token": _token
				}, function () {
					ShowImportForm();
				});
  			}
  			NProgress.done();
		});
	}

	function FindTicket (ticket_id) {
		var endpoint = search_endpoint.format(ticket_id, _token);

		xhr && xhr.abort();
		xhr = $.post(endpoint, function (xml) {
			var $doc = $(xml);
			var error = $doc.find("error");
			if (error.attr("code") == 3) {
				ShowLoginForm();
				return;
			}
			case_id = $doc.find("case")[0];
			case_title = $doc.find("sTitle")[0];

			if (case_id) {
				case_id = $(case_id).attr("ixBug");
			} else {
				case_id = null;
			}
			if (case_title) {
				case_title = $(case_title).text();
				if (case_title.length > 140) {
					case_title = "{0}...".format(case_title[0].substring(0, 137));
				}
			} else {
				case_title = null;
			}
			if (case_id && case_title) {
				$("#loader").html(case_id + " : " + case_title);
			} else {
				$("#loader").html(ticket_id + " not found.");			
			}
		});
	}

	function ImportTicket() {
		var case_points = $("#points").val();

		if (!case_id || case_id == "") {
			ShowMessage("No user story to import.");
			NProgress.done();
			return;
		}
		
		NProgress.start();
		chrome.storage.local.set({
  			'case_title': "{0}: {1}".format(case_id, case_title),
  			'case_points' : case_points
  		}, function() {});

		// Inject code into page to create user story.
		chrome.tabs.executeScript(null, {
			file: "assets/js/tinypm.js"
		}, function () {
			NProgress.done();
		});
	}

	$("a[href=#logout]").click(function () {
		ShowLoginForm();
		return false;
	});

	$(".login-form").submit(function (e) {
		var username = $("#username").val(),
			password = $("#password").val();

		Login(username, password);
		return false;
	});

	$("#ticket_number").keyup(function (e) {
		var data = $(this).val();
		
		if (!data) {
			xhr && xhr.abort();
			$("#loader").text("Start typing to find user story");
			return;
		}

		FindTicket(data);
	});

	$("#import").submit(function (e) {
		ImportTicket();

		return false;
	});
});

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}