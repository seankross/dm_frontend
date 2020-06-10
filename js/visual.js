// turn on/off console logging
var DEBUG_STATE = true;

// subject-level variables as globals
var assignment_id, worker_id, hit_id, submit_to;
var ts_consent_start, ts_explain_start, ts_is_same_dataset_start;

//treatment variables
var condition; // 1: show counts; 2: now show counts
var condition_set;

// dependent variables
var is_same_dataset_choice;
var explanation_text;

function main() {

    validate_forms();
    hide_all();

    // create fake assignment id, hit id, and worker id if none provided
    if ($.url().attr('query') == "") {
      logger('creating fake assignment');
      // generate fake assignment_id, worker_id, and hit_id
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


    if (assignment_id == 'ASSIGNMENT_ID_NOT_AVAILABLE') {
      $('#preview').show();
      return; // quit?
    } else {
      //assign treatment variables
      if (typeof(condition) == "undefined") {
        logger('randomizing show/not show counts condition');

        // use 1 and 2 as default conditions
        if (typeof(condition_set) === "undefined") {
          condition_set = '1,2';
        }
        condition_set = condition_set.split(',');
        ndx = getRandomInt(0, condition_set.length-1);
        condition = condition_set[ndx];

        // apply condition
        if (condition == 2)
          $('span.number-cond').hide();
      }
    }

    logger("condition: " + condition + " out of " + condition_set);

    $('#consent').show();
    ts_consent_start = getDateTime();
    logger("ts_consent_start: " + ts_consent_start);
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

    // neue pages
    // $('#is_same_dataset').hide();
    // $('#explain').hide();
    // $('#bye').hide();
}

function show_submit_page(){
    // if (elicitation == "bdm")
	  //  $('bdm_thanks').show();

    // $('#final_submit').show()
    $('#bye').show();
    $('form#to_turk').attr('action', submit_to + '/mturk/externalSubmit');

    logger('assignment is ' + assignment_id);
    ts_submitted = getDateTime();

    params = {
      assignmentId: assignment_id,
      workerId: worker_id,
      hitId: hit_id,
      condition: condition,
      is_same_dataset_choice: is_same_dataset_choice,
      explanation_text: explanation_text,
      ts_consent_start: ts_consent_start,
      ts_is_same_dataset_start: ts_is_same_dataset_start,
      ts_explain_start: ts_explain_start,
      ts_submitted_: ts_submitted, // if you change it to ts_submitted instead of ts_submitted_ this will break
    };
    logger(params);

    $.each(params, function (name, val) {
      $('form#submit_to_turk').append('<input type=hidden name="' + name + '" value="' + val + '" />');
    });
}


function validate_forms() {
    // set error message placement
    if (jQuery.validator) {
      jQuery.validator.setDefaults({
        errorPlacement: function(error, element) {
          if (element.next().prop('tagName') == 'SELECT'){
            error.insertAfter(element.next());
          } else if (element.attr('type') === 'radio'){
            // error.appendTo(element.parent());
            	error.insertBefore(element);
          } else {
            error.insertBefore(element);
          }
        }
      });
    }

    function getWordCount(wordString) {
      var words = wordString.split(" ");
      words = words.filter(function(words) {
        return words.length > 0
      }).length;
      return words;
    }

    //add the custom validation method
    jQuery.validator.addMethod("wordCount",
    function(value, element, params) {
      var count = getWordCount(value);
      if(count >= params[0]) {
        return true;
      }
    },
    jQuery.validator.format("Please enter more than {0} words.")
  );


    $('#consent_form').validate({
      rules: {
        consent_checkbox: {
          required: true
        }
      }
    });

    // ======= NEU =======
    $('#is_same_dataset_form').validate({
      rules: {
        optradio1: {
          required: true
        }
      }
    });

    $('#explanation_form').validate({
      rules: {
        explanation:{
          required: true,
          wordCount: ['10']
        }
      }
    });


    // ======= END NEU =======

}

function submit_consent() {
  $('#consent').slideUp(function() {
    // ts_bdm_start = getDateTime();
    // //show_next_survey_question()
    // table = wtp_table(1, 5, 1, type='not granular', currency='cashmoney')
    // $('#wtptable').html(table)
    // if (elicitation == 'bdm')
    // $('#bdm').show();
    // else if (elicitation == 'slider')
    // $('#boulder').show();
    // else
    // hide_all();
    $('#is_same_dataset').show();
    ts_is_same_dataset_start = getDateTime();
    logger("ts_is_same_dataset_start: " + ts_is_same_dataset_start );
  });
}






function submit_is_same_dataset(){
  $('#is_same_dataset_wrapper').slideUp(function(){
    ts_explain_start = getDateTime();
    logger("ts_explain_start: " + ts_explain_start);
    $("#explain").show();
    // show_submit_page();
  });
}


function submit_explain(){
  $('#explain').slideUp(function(){
    $('#is_same_dataset').hide();
    show_submit_page();
  });
}

function log_is_same_dataset(){
    is_same_dataset_choice = $("input[name='optradio1']:checked").val();
    logger("choice: " + is_same_dataset_choice);
    return true;
}

function log_explanation(){
  explanation_text = $("textarea#explanation").val();
  logger("explanation: " + explanation_text);
  ts_submitted = getDateTime();
  logger("ts_submitted: " + ts_submitted);
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
  if (DEBUG_STATE){
    console.log(msg);
  }
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
