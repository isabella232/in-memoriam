$(document).ready(function() {
	/* VARS */
	var active_slide = 0;
	// NOTE: We have more cuepoints than the length of the placeholder audio file we have
	var audio_length = 660; // TODO: Pass in dynamically somehow?
	var num_slides = 0;
	var slideshow_data = [];
	var pop; // Popcorn element
    var play_audio = !($.browser.msie === true && $.browser.version < 9);

	/* ELEMENTS */
    var $main_content = $('#main-content');
	var $s = $('#slideshow');
	var $slide_nav = $('#slide-nav');
	var $next = $('#next-btn');
	var $back = $('#back-btn');
    var $audio = $('#audio');
	var $player = $('#pop-audio');
    var $browse_modal = $('#browse-modal');
	var $progress = $audio.find('.jp-progress-container');

    if (!play_audio) {
        $audio.hide(); 
    }

    if (play_audio) {
        /* LOAD AUDIO PLAYER */
        $player.jPlayer({
            ready: function () {
                $(this).jPlayer('setMedia', {
                    mp3: "http://stage-apps.npr.org/in-memoriam/audio/FalconHood.mp3",
                    oga: "http://stage-apps.npr.org/in-memoriam/audio/FalconHood.ogg"
                }).jPlayer("pause");
            },
            play: function() { // To avoid both jPlayers playing together.
                $(this).jPlayer("pauseOthers");
            },
            ended: function (event) {
                $(this).jPlayer("pause");
            },
            swfPath: "js",
            supplied: "oga, mp3"
    //		,errorAlerts:true
        });
        // Associate jPlayer with Popcorn
        pop = Popcorn('#jp_audio_0');
    }

    function scroll_to_slide(id) {
        /*
         * Scroll horizontally to the correct slide position.
         */
        $.smoothScroll({
            direction: 'left',
            scrollElement: $s,
            scrollTarget: '#panel' + id,
            afterScroll: function() {
                $('#s' + id).addClass('active').siblings('li').removeClass('active');
            }
        });
        active_slide = id;

        return false;
    }

    function play_slide(id) {
        /*
         * Play a slide at the correct audio cue.
         */
        if (play_audio) {
            $player.jPlayer('play', slideshow_data[id]['cue_start']);
        } else {
            scroll_to_slide(id);
        }
    }

	/* LOAD SLIDESHOW DATA FROM EXTERNAL JSON */
	function load_slideshow_data() {
		var slide_output = '';
		var audio_output = '';
        var browse_output = '';

		$.getJSON('deaths.json', function(data) {
			slideshow_data = data;
			$.each(slideshow_data, function(k, v) {
			
				var slide_position = (v["cue_start"] / audio_length) * 100;

				// Markup for this slide and its entry in the slide nav
				// via Underscore template / JST
                var context = v;
                context['id'] = k;

                if ($main_content.width() <= 480) {
                    context['image_width'] = 480;
                } else if ($main_content.width() <= 979) {
                    context['image_width'] = 979;
                } else {
                    context['image_width'] = 1200;
                }

                context['position'] = slide_position;
				slide_output += JST.slide(context);
				audio_output += JST.slidenav(context);
				browse_output += JST.browse(context);
				
				num_slides++;
				
                if (play_audio) {
                    // Popcorn cuepoint for this slide
                    pop.code({
                        start: v["cue_start"],
                        end: v["cue_start"] + .5,
                        onStart: function( options ) {         
                            scroll_to_slide(k); 

                            return false;
                        },
                        onEnd: function( options ) {}
                    });
                }
			});
			
			$s.append('<div id="slideshow-wrap">' + slide_output + '</div>');
			$slide_nav.append(audio_output);
			
			$slide_nav.find('.slide-nav-item').click( function() {
				var id = $(this).attr('data-id');

                play_slide(id);
			});

			$browse_modal.find('.modal-body').append(browse_output);

            $browse_modal.find('a').click(function() {
                play_slide($(this).attr('data-id'));
                $browse_modal.modal('hide');
            });
		});
	}
	

	/* CLICK ACTIONS */
	$('#title-button').click(function() {
		$.smoothScroll({
			speed: 800,
			scrollTarget: $('#audio-navbar'),
			afterScroll: function() {
                play_slide(0);
			}
		});

		return false;
	});

    $('#browse-btn').click(function() {
        $browse_modal.modal(); 
    });

	$next.click(function() {
		if (active_slide < num_slides) {
            play_slide(active_slide + 1);
		}

		return false;
	});

	$back.click(function() {
		if (active_slide > 0) {
            play_slide(active_slide - 1);
		}

		return false;
	});

	
	/* INIT */
	load_slideshow_data();

});
