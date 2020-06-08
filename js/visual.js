// turn on/off console logging
var DEBUG_STATE = true;

// subject-level variables as globals
var assignment_id, worker_id, hit_id, submit_to;

var ts_consent_start,  ts_bdm_start, ts_boulder_start, ts_standard_start, ts_special_start, ts_superiority_start;

//treatment variables
var condition //1 - SD, 2 - SE, 3 - histogram, 4 - SE with rescaled y axis to match SD, 5 - SE, rescaled, with points, 6 - Vanilla Hops, 7 - Hops with SE, rescaled
var effect_size //1 - (100->104, d=.25), 2 - (100->116, d=1.0)
var elicitation; //slider - use a slider; bdm - use becker degroot marshack
var text_condition; //show_both_stats - show SE and SD statistics in text; show_viz_stats_only - show only the statistics that match the text
var show_bell_curve; //0 - don't show it, 1 show it

// mean, lower bound of 95% confidence interval of x, upper bound of 95% confidence interval of x, lower bound of 95% confidence interval of mu, upper bound of 95% confidence interval of mu

// standard boulder
var mu1, lsd1, usd1, lse1, use1
// special boulder
var mu2, lsd2, usd2, lse2, use2 

max_price = 250
wtp_increment = 25

// dependent variables
var wtp_final, superiority_standard, superiority_special, superiority_raw_standard, superiority_raw_special;
var coarse_turning_point, granular_turning_point;
coarse_turning_point = -100
granular_turning_point = -100

function main() {
    validate_forms();
    // create fake assignment id, hit id, and worker id if none provided
    if ($.url().attr('query') == "") {
	logger('creating fake assignment');
	var params = create_test_assignment();
	var query_str = window.location.pathname + '?' + $.param(params);
	window.history.pushState("", "", query_str);
    }

    // parse url parameters
    assignment_id = $.url().param('assignmentId');
    worker_id = $.url().param('workerId');
    hit_id = $.url().param('hitId');
    submit_to = $.url().param('turkSubmitTo');

    // grab viz condition from url param
    condition = $.url().param('condition');

    // grab set of viz conditions from url param
    condition_set = $.url().param('condition_set');

    // grab elicitation mechanism from url param
    // disabling this for now and manually setting to slider
    // elicitation = $.url().param('elicitation');
    elicitation = "slider";

    // grab whether to show bell curve or not from url param
    // disabling this for now and manually setting it to 0
    // show_bell_curve = $.url().param('show_bell_curve');
    show_bell_curve = 0;

    // grab which statistics text to show from url param
    text_condition = $.url().param('text_condition');

    // grab true effect size
    // disabling this for now and manually setting to d = 0.25
    // effect_size = $.url().param('effect_size');
    effect_size = 1;
    mu1 = 100
    lsd1 = 70
    usd1 = 130
    lse1 = 99
    use1 = 101

    mu2 = 104
    lsd2 = 74
    usd2 = 134
    lse2 = 103
    use2 = 105

    // hide everything on the page
    hide_all();

    if (assignment_id == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
		$('#preview').show();
		return;
    } else {
	//assign treatment variables
	if (typeof(condition) == "undefined") {
	    logger('randomizing se vs. sd condition');

	    // use 1 and 2 as default conditions
	    if (typeof(condition_set) === "undefined") {
		condition_set = '1,2';
	    }

	    // convert comma separated string to array
	    condition_set = condition_set.split(',');
	    logger(condition_set);
	    ndx = getRandomInt(0, condition_set.length-1);
	    condition = condition_set[ndx];
	}

	if (typeof(effect_size) == "undefined") {
	    logger('randomizing effect size');
	    var unif2 = Math.random();
	    if (unif2 < 1/2){
		effect_size = 1

		mu1 = 100
		lsd1 = 70
		usd1 = 130
		lse1 = 99
		use1 = 101

		mu2 = 104
		lsd2 = 74
		usd2 = 134
		lse2 = 103
		use2 = 105
	    }
	    else{
		effect_size = 2

		mu1 = 100
		lsd1 = 70
		usd1 = 130
		lse1 = 99
		use1 = 101

		mu2 = 116
		lsd2 = 86
		usd2 = 146
		lse2 = 115
		use2 = 117
	    }
	}

	if (typeof(elicitation) == "undefined") {
	    logger('randomizing elicitation mechanism');
	    var unif3 = Math.random();
	    if (unif3 < 1/2)
		elicitation = 'slider';
	    else
		elicitation = 'bdm';
	}

	if (typeof(text_condition) == "undefined") {
	    logger('randomizing text_condition mechanism');
	    var unif4 = Math.random();
	    if (unif4 < 1/2)
		text_condition = 'show_both_stats';
	    else
		text_condition = 'show_viz_stats_only';
	}

    }
    logger(condition)
    logger(effect_size)
    logger(elicitation);
    logger(text_condition);
    logger(show_bell_curve);

    // show consent form
    $('#consent').show();
    ts_consent_start = getDateTime();
}


// get random integer in range (inclusive)
// stolen from https://stackoverflow.com/a/1527820
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// hides all divs
function hide_all() {
    $('#preview').hide();
    $('#consent').hide();
    $('#bdm').hide()
    $('#boulder').hide()
    $('#standard').hide()
    $('#special').hide()
    $('#superiority').hide()    
    $('#final_submit').hide()
    $('#wtp_error').hide()
    $('#standard_error').hide()
    $('#special_error').hide()
    $('#bdm_error').hide()
    $('#coarse_error').hide()
    $('#wtp_granular').hide()
    $('#granular_error').hide()    
    $('#final_confirm').hide()
    $('#coarse').hide()
    $('#granular').hide()    
}


function show_submit_page(){
    if (elicitation == "bdm")
	$('bdm_thanks').show();

    $('#final_submit').show()
    $('form#submit_to_turk').attr('action', submit_to + '/mturk/externalSubmit');
    
    logger('assignment is')
    logger(assignment_id)
    ts_submitted = getDateTime();
    
    params = {
	assignmentId: assignment_id,
	workerId: worker_id,
	hitId: hit_id, 
	mu1: mu1,
	lsd1: lsd1,
	usd1: usd1,
	lse1: lse1,
	use1: use1,
	mu2: mu2,
	lsd2: lsd2,
	usd2: usd2,
	lse2: lse2,
	use2: use2,
	condition: condition,
	effect_size: effect_size, 
	elicitation: elicitation,
	text_condition: text_condition,
	show_bell_curve: show_bell_curve,
	ts_consent_start: ts_consent_start,
	ts_bdm_start: ts_bdm_start,
	ts_boulder_start: ts_boulder_start,
	ts_standard_start: ts_standard_start,
	ts_special_start: ts_special_start,
	ts_superiority_start: ts_superiority_start,
	ts_submitted_: ts_submitted, // if you change it to ts_submitted instead of ts_submitted_ this will break
	wtp_final: wtp_final,
	coarse_turning_point:coarse_turning_point,
	granular_turning_point:granular_turning_point,	
	superiority_standard:superiority_standard,
	superiority_special:superiority_special,
	superiority_raw_standard:superiority_raw_standard,
	superiority_raw_special:superiority_raw_special	
    };
    logger(params)
    
    $.each(params, function (name, val) {
	$('form#submit_to_turk').append('<input type=hidden name="' + name + '" value="' + val + '" />');
    });
}


function validate_forms() {
    // set error message placement
    $.validator.setDefaults({
	errorPlacement: function(error, element) {
	    if (element.next().prop('tagName') == 'SELECT')
		error.insertAfter(element.next());
	    else if (element.attr('type') === 'radio')
		error.appendTo(element.parent());
	    //else if (element.attr("type") == "checkbox")
	    //	error.insertBefore(element);
	    else
		error.insertBefore(element);
		//error.insertAfter(element);
	}
    });

    $('#consent_form').validate({
	rules: {
	    consent_checkbox: {
		required: true
	    }
	}
    });
    
    $('#bdm_form').validate({
	rules: {
	    bdm_checkbox: {
		required: true
	    }
	}
    });
    
    $('#boulder_form').validate({
	rules: {
	    boulder_checkbox: {
		required: true
	    }
	}
    });
    
    $('#standard_form').validate({
	rules: {
	    standard_checkbox: {
		required: true
	    }
	}
    });
    
}

//generates a table for becker-degroot-marshack ranging from lower to higher going by increment
function wtp_table(lower, higher, increment, type='not granular', currency='Ice Dollars'){
    html = ''    
    for (i = lower; i <= higher; i+=increment) {     
	html += '<div class="form-group row">'
	html += 'At a price of '
	if (currency=='cashmoney'){
	    html += '$'
	}
	html += i.toString()
	if (currency=='Ice Dollars'){
	    html += ' Ice Dollars'
	}
	html += ' I will '
	html += '<input type="radio" id="'
	html += i.toString()
	if (type == 'granular'){
	    html += '_granular'
	}
	html += '_buy" name="'
	html += i.toString()
	html += '" value="buy" > '
	if (currency=='cashmoney'){
	    html += 'buy '
	}
	else{
	    html += 'rent '
	}
	html += '<input type="radio" id="'
	html += i.toString()
	if (type == 'granular'){
	    html += '_granular'
	}	
	html += '_notbuy" name="'
	html += i.toString()
	html += '" value="not buy"> not '
	if (currency=='cashmoney'){
	    html += 'buy the widget.'
	}
	else{
	    html += 'rent the special boulder.'
	}
	html += '</div>'
    }
    return html
}

function submit_consent() {
    $('#consent').slideUp(function() {
	ts_bdm_start = getDateTime();
	//show_next_survey_question()
	table = wtp_table(1, 5, 1, type='not granular', currency='cashmoney')
	$('#wtptable').html(table)
	if (elicitation == 'bdm')
	    $('#bdm').show();
	else if (elicitation == 'slider')
	    $('#boulder').show();
	else
	    hide_all();
    });
}

function validate_bdm(){
    for (i = 1; i <= 4; i+=1) {
	selector = '#'+i.toString()+'_buy'
	if (!$(selector).prop('checked')){
	    logger(i)
	    $('#bdm_error').html('Make sure you understand how the mechanism works, and then check the forms as if you were willing to pay at most $4 for the widget.')
	    $('#bdm_error').show()	    
	    return false;
	}
    }
    for (i = 5; i <= 5; i+=1) {
	selector = '#'+i.toString()+'_notbuy'
	if (!$(selector).prop('checked')){
	    logger(i)	    
	    $('#bdm_error').html('Make sure you understand how the mechanism works, and then check the forms as if you were willing to pay at most $4 for the widget.')
	    $('#bdm_error').show()	    
	    return false;
	}
    }
    $('#bdm_error').hide()	        
    return true;
}

function submit_bdm(){
    $('#bdm').slideUp(function(){
	ts_boulder_start = getDateTime();
	$('#boulder').show();
    });
}

function submit_boulder(){
    $('#boulder').slideUp(function(){
	ts_standard_start = getDateTime();
	$('.mu').html(mu1);
	$('.lsd').html(lsd1);
	$('.usd').html(usd1);
	$('.lse').html(lse1);	
	$('.use').html(use1);

	if (text_condition == "show_viz_stats_only") {
	    $('#bell,#bell_text_standard,#bell_text_special,#hops_description_sd,#hops_description_se,#points_description').hide();

	    if (condition == 1)
		$('#se_standard').hide();
	    else if (condition == 2)
		$('#sd_standard').hide();
	    else if (condition == 4)
		$('#sd_standard').hide();
		else if(condition == 5) {
			$('#points_description').show();
			$('#sd_standard').hide();
		}
		else if(condition == 6) {
			$('#hops_description_sd').show();
			$('#se_standard').hide();
			$('#sd_description').hide();
		}
		else if(condition == 7) {
			$('#hops_description_se').show();
			$('#sd_standard').hide();
		}
	}

	if (show_bell_curve == 0)
	    $('#bell,#bell_text_standard,#bell_text_special').hide();

	$('#standard').show();
    });
}
function submit_standard(){
    $('#standard').slideUp(function(){
	ts_special_start = getDateTime();
	$('.mu').html(mu2);
	$('.lsd').html(lsd2);	
	$('.usd').html(usd2);
	$('.lse').html(lse2);	
	$('.use').html(use2);
	$('.histogram_description').hide()
	$('.sd_description').hide()
	$('.se_description').hide()
	$('.points_description').hide()
	$('.hops_description_se').hide()
	$('.hops_description_sd').hide()

	if (condition == 1){
	    $('.sd_description').show()
	}
	else if (condition == 2){
	    $('.se_description').show()
	}
	else if (condition == 3){
	    $('.histogram_description').show()
	}
	else if (condition == 4){

	    $('.se_description').show()
	}
	// se with dots
	else if (condition == 5) {
		$('.se_description').show()
		$('.points_description').show()
	}
	// vanilla hops
	else if (condition == 6) {
		$('.hops_description_sd').show()
	}
	// hops with se
	else if (condition == 7) {
		$('.se_description').show()
		$('.hops_description_se').show()
	}
	html = ''
	file_suffix = '.png'
	if (effect_size == 1){
	    // note: this uses revised tick marks
	    // so that se and sd have the same number of ticks
	    // it also adjusts for a small offset in the mean
	    // so that the empirical means hit 100 and 104
	    html += '<img src="static/N-1000_mu1-100.18_mu2-'
	    html += '104.25'
	}
	else if (effect_size == 2){
	    html += '<img src="static/N-1000_mu1-100_mu2-'
	    html += '116'
	}
	html += '_sigma-15.3061_'
	if (condition == 1){
	    html += 'sd_plot'
	}
	else if (condition == 2){
	    html += 'se_plot'
	}
	else if (condition == 3){
	    html += 'histogram'
	}
	else if (condition == 4){
	    html += 'se_plot_rescaled'
	} 
	else if (condition == 5) {
		html += 'se_plot_with_points'
	}
	else if (condition == 6) {
		html += 'hops_bar_plot'
		file_suffix = ".gif"
	}
	else if (condition == 7) {
		html += 'hops_bar_plot_with_se'
		file_suffix = ".gif"
	}

	html += file_suffix + '" height="400" width="400">'
	
	$('#graph').html(html)

	$('#payment_bdm,#payment_slider').hide();

	if (elicitation == 'bdm')
	    $('#payment_bdm').show();
	else if (elicitation == 'slider') {
	    $('#wtp_slider').slider()
		.change(function() {
		    $('#wtp_val').html($('#wtp_slider').val());
		});
	    $('#payment_slider').show();
	} else
	    hide_all();

	if (text_condition == "show_viz_stats_only") {
	    if (condition == 1)
		$('#se_special').hide();
	    if (condition == 2)
		$('#sd_special').hide();
	    if (condition == 4)
		$('#sd_special').hide();
		if (condition == 5)
		$('#sd_special').hide();
		if (condition == 6)
		$('#se_special').hide();
		if (condition == 7)
		$('#sd_special').hide();

	}

	html = ''
	$('#special').show();
	table = wtp_table(0, max_price, wtp_increment)
	submit = '<input type=submit id=submit_special value=Submit class="btn btn-default" />'
	error = '<div id="coarse_error" class="error-message"></div><br/>'
	table = table + error + submit
	$('#coarse_wtp').html(table)
	$('#granular').hide()
	$('#coarse_error').hide()
	$('#coarse').show()
    });
}

function submit_wtp(){
    //if coarse_turning_point = max_price + 1, they are willing to buy at any price.
    //if coarse_turning_point = -1, they aren't willing to buy at any price.
    $('#coarse').hide()            
    if (coarse_turning_point == max_price + 1){
	//display the final confirmation
	html = 'Your response indicates that you would be willing to pay up to '
	html += max_price.toString()
	html += ' Ice Dollars (but no more) for the special boulder. Click “Next” below if this is correct, or “Back” if it is incorrect.'
	//html += '<form class="form-inline" id="confirm_positive" action="javascript:submit_wtp_final_confirm()"><input type=submit id=submit_positive value=Next class="btn btn-default" /></form>'
	//html += '<form class="form-inline" id="confirm_negative" action="javascript:submit_go_back()"><input type=submit id=submit_negative value=Back class="btn btn-default" /></form>'
	html += '<center>';
	html += '<button id=submit_negative value=Back class="btn btn-default" onclick="submit_go_back()">Back</button>'
	html += '<button id=submit_positive value=Next class="btn btn-default" onclick="submit_wtp_final_confirm()">Next</button>'
	html += '</center>';
	$('#final_confirm').html(html)
	$('#final_confirm').show()
    }
    else if (coarse_turning_point == -1){
	//display the final confirmation
	html = 'Your response indicates that you would not be willing to to use the special boulder at any price.'
	html += ' Click “Next” below if this is correct, or “Back” if it is incorrect.'
	//html += '<form class="form-inline" id="confirm_positive" action="javascript:submit_wtp_final_confirm()"><input type=submit id=submit_positive value=Next class="btn btn-default" /></form>'
	//html += '<form class="form-inline" id="confirm_negative" action="javascript:submit_go_back()"><input type=submit id=submit_negative value=Back class="btn btn-default" /></form>'
	html += '<center>';
	html += '<button id=submit_negative value=Back class="btn btn-default" onclick="submit_go_back()">Back</button>'
	html += '<button id=submit_positive value=Next class="btn btn-default" onclick="submit_wtp_final_confirm()">Next</button>'
	html += '<center>';
	$('#final_confirm').html(html)
	$('#final_confirm').show()
    }
    else{
	table = wtp_table(coarse_turning_point - wtp_increment+1, coarse_turning_point-1, 1, type='granular')
	submit = '<input type=submit id=submit_granular value=Submit class="btn btn-default" />'
	error = '<div id="granular_error" class="error-message"></div><br/>'
	table = table + error + submit

	$('#granular').show()
	$('#wtp_granular').html(table)
	$('#wtp_granular').show()
	$('#granular_error').hide()
    }
}

function submit_wtp_granular(){
    //hide the granular table
    $('#granular').hide()
    //display the final confirmation
    html = 'Your response indicates that you would be willing to pay up to '
    html += (granular_turning_point - 1).toString()
    html += ' Ice Dollars (but no more) for the special boulder. Click “Next” below if this is correct, or “Back” if it is incorrect.'
    //html += '<form class="form-inline" id="confirm_positive" action="javascript:submit_wtp_final_confirm()"><input type=submit id=submit_positive value=Next class="btn btn-default" /></form>'
    //html += '<form class="form-inline" id="confirm_negative" action="javascript:submit_go_back()"><input type=submit id=submit_negative value=Back class="btn btn-default" /></form>'
    html += '<center>';
    html += '<button id=submit_negative value=Back class="btn btn-default" onclick="submit_go_back()">Back</button>'
    html += '<button id=submit_positive value=Next class="btn btn-default" onclick="submit_wtp_final_confirm()" >Next</button>'
    html += '</center>';
    $('#final_confirm').html(html)
    $('#final_confirm').show()
}

function submit_go_back(){
    //hide the final confirm
    $('#final_confirm').hide()    
    //hide the granular table
    $('#granular').hide()
    //show the coarse table
    table = wtp_table(0, max_price, wtp_increment)
    submit = '<input type=submit id=submit_special value=Submit class="btn btn-default" />'
    error = '<div id="coarse_error" class="error-message"></div><br/>'
    table = table + error + submit
    $('#coarse_wtp').html(table)
    $('#wtp_granular').hide()
    $('#coarse_error').hide()
    $('#coarse').show()
}
function submit_wtp_final_confirm(){
    $('#special').slideUp(function(){
	if (granular_turning_point == -100){ //edge case
	    if (coarse_turning_point == -1){ //no price they are willing to buy 
		wtp_final = -1 //which is different than it being 0.  
	    }
	    else if (coarse_turning_point == max_price + 1){
		wtp_final = 250
	    }
	    else{
		logger("you aren't supposed to get to here....")
	    }
	}
	else{
	    wtp_final = granular_turning_point - 1;
	}
	ts_superiority_start = getDateTime();
	$('#superiority').show();
    });
}

function submit_wtp_slider() {
    $('#special').slideUp(function(){
	wtp_final = parseInt($('#wtp_slider').val());
	ts_superiority_start = getDateTime();
	$('#superiority').show();
    });
}

function submit_superiority(){
    $('#superiority').slideUp(function(){
	ts_final_start = getDateTime();
	show_submit_page()
	//$('#final_submit').show();
    });
}

function validate_superiority(){
    var standard_correct = true
    var special_correct = true
    superiority_raw_standard = $("#superiority1_estimate").val();
    var superiority1_str = $("#superiority1_estimate").val();
    logger(superiority1_str.match(/[0-9]+/))
    
    if (superiority1_str.match(/[0-9]+/) == null){ //isn't filled out
	standard_correct = false
    }
    else if (superiority1_str.match(/[0-9]+/)[0] != superiority1_str){ //contains stuff that isn't numbers
	standard_correct = false
    }
    else{
	superiority_standard = parseFloat(superiority1_str)
	if (superiority_standard > 100){
	    standard_correct = false
	}
    }
    
    superiority_raw_special = $("#superiority2_estimate").val();
    var superiority2_str = $("#superiority2_estimate").val();
    logger(superiority2_str.match(/[0-9]+/))
    
    if (superiority2_str.match(/[0-9]+/) == null){
	special_correct = false
    }
    else if (superiority2_str.match(/[0-9]+/)[0] != superiority2_str){    
	special_correct = false
    }
    else{
	superiority_special = parseFloat(superiority2_str)
	if (superiority_special > 100){
	    special_correct = false
	}
    }
    
    if (standard_correct == false){
	document.getElementById("standard_error").innerHTML="<b>Please enter a valid whole number between 0 and 100.</b>";
	$('#standard_error').show()	
    }
    else{
	$('#standard_error').hide()	
    }
    
    if (special_correct == false){
	document.getElementById("special_error").innerHTML="<b>Please enter a valid whole number between 0 and 100.</b>";
	$('#special_error').show()	
    }
    else{
	$('#special_error').hide()	
    }
    
    return (standard_correct && special_correct);
}

function check_table_checked(type='not granular'){
    //check that every price has a check mark
    if (type == 'not granular'){
	i_init = 0 
	i_max = max_price
	inc = wtp_increment
    }
    else{
	i_init = coarse_turning_point - wtp_increment + 1
	i_max = coarse_turning_point - 1
	inc = 1
    }
    logger(i_init)
    logger(i_max)
    logger(inc)    
    for (i = i_init; i <= i_max; i+=inc) {    
	if (type == 'granular'){
	    selector1 = '#'+i.toString()+'_granular_buy'
	    selector2 = '#'+i.toString()+'_granular_notbuy'
	}
	else{
	    selector1 = '#'+i.toString()+'_buy'
	    selector2 = '#'+i.toString()+'_notbuy'
	}
	if (!$(selector1).prop('checked') && !$(selector2).prop('checked')){
	    logger(i)
	    if (type == 'granular'){
		$('#granular_error').html('You must declare whether you would purchase the special boulder at every price on the list.')
		$('#granular_error').show()
	    }
	    else{
		$('#coarse_error').html('You must declare whether you would purchase the special boulder at every price on the list.')
		$('#coarse_error').show()
	    }
		return false;	    
	}
    }
    return true;
}

function check_turning_point(type='not granular'){
    //check that there is only one turning point
    buy_or_not = 'buy'
    if (type == 'not granular'){
	i_init = 0 
	i_max = max_price
	inc = wtp_increment
    }
    else{
	i_init = coarse_turning_point - wtp_increment + 1
	i_max = coarse_turning_point - 1
	inc = 1
    }
    logger(i_init)
    logger(i_max)
    logger(inc)    
    for (i = i_init; i <= i_max; i+=inc) {
	if (type == 'granular'){
	    selector1 = '#'+i.toString()+'_granular_buy'
	    selector2 = '#'+i.toString()+'_granular_notbuy'
	}
	else{
	    selector1 = '#'+i.toString()+'_buy'
	    selector2 = '#'+i.toString()+'_notbuy'
	}
	if (buy_or_not == 'buy'){
	    if ($(selector2).prop('checked')){ //this is the first price they won't buy at
		buy_or_not = 'not'
		if (type == 'granular'){		
		    granular_turning_point = i
		}
		else{
		    coarse_turning_point = i
		    if (i == i_init){ //they won't buy at 0
			coarse_turning_point = -1
		    }
		}
	    }
	}
	else{ //they already said they wouldn't buy at a lower price
	    if ($(selector1).prop('checked')){ //another turning point
		logger(i)
		if (type == 'granular'){
		    $('#granular_error').html('If you are willing to buy at a certain price, you should be willing to buy at all lower prices.')
		    $('#granular_error').show()
		}
		else{
		    $('#coarse_error').html('If you are willing to buy at a certain price, you should be willing to buy at all lower prices.')
		    $('#coarse_error').show()
		}
		return false;
	    }
	}
    }
    if ($(selector1).prop('checked')){ //they're willing to buy at the max price
	if (type == 'granular'){
	    granular_turning_point = i_max + 1
	}
	else{
	    coarse_turning_point = max_price + 1
	}
    }


    return true;
}

function validate_wtp_slider(){
    var slider_wtp = $('#wtp_slider').val();

    if (slider_wtp == max_price) {
	$('#wtp_slider_error').show().html('Please choose a value between $0 and ' + max_price);
	return false;
    } else {
	return true;
    }
}


function validate_wtp(){
    if (!check_table_checked()){
	return false;
    }
    if (!check_turning_point()){
	return false;
    }
    $('#coarse_error').hide()
    return true;
}

function validate_granular(){
    //check that every price has a check mark
    if (!check_table_checked(type='granular')){
	return false;
    }
    if (!check_turning_point(type='granular')){
	return false;
    }
    $('#granular_error').hide()
    return true;
}


// generate fake assignment_id, worker_id, and hit_id
function create_test_assignment() {
    var characters = 'ABCDEFGHIJoKLMNOPQRSTUVWXYZ0123456789';
    characters = characters.split('');

    suffix = shuffle(characters).slice(0, 12).join('');

    return {assignmentId: 'ASSIGNMENT_' + suffix,
	    hitId: 'HIT_' + suffix,
	    turkSubmitTo: 'https://workersandbox.mturk.com',
	    workerId: 'WORKER_' + suffix};
}


/* HELPER FUNCTIONS BELOW */

function logger(msg) {
    if (DEBUG_STATE)
	console.log(msg);
}

// http://stackoverflow.com/a/19176102/76259
function getDateTime() {
    var now     = new Date(); 
    var year    = now.getFullYear();
    var month   = now.getMonth()+1; 
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds(); 
    if(month.toString().length == 1) {
        var month = '0'+month;
    }
    if(day.toString().length == 1) {
        var day = '0'+day;
    }   
    if(hour.toString().length == 1) {
        var hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        var minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        var second = '0'+second;
    }   
    var dateTime = year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;   
     return dateTime;
}

function shuffle(n){for(var t,e,r=n.length;r;)e=0|Math.random()*r--,t=n[r],n[r]=n[e],n[e]=t;return n}
