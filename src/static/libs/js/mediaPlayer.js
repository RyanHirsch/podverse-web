import { calcDuration, convertSecToHHMMSS, throttle, isNonAnonLoggedInUser,
         readableDate, secondsToReadableDuration } from './utility.js';
import { subscribeToPodcast, unsubscribeFromPodcast } from './podcastHelper.js';
import { requestClipsFromAPI } from './clipHelper.js';
import { sendGoogleAnalyticsPlayerPageView,
         sendGoogleAnalyticsEvent } from './googleAnalytics.js';
import { isMobileOrTablet } from './browserSupportDetection.js';
import { allowedFilters, checkIfFilterIsAllowed } from '../../../constants.js';
const Autolinker = require('autolinker');
const stripTags = require('striptags');


// Set default values for vars that handle player crashes and autoplay functionality
window.restartAttempts = 0;
window.lastPlaybackPosition = -1;
window.endTimeHasBeenReached = false;

// Load the player
if (isEmptyPlaylist !== true) {
  $('#player').append('<i class="fa fa-spinner fa-spin"></i>');
  setPlayerInfo();
  setSubscribedStatus();
  createAutoplayBtn();
  checkIfEpisodeMediaFileIsFound(createAndAppendAudio, showEpisodeNotFoundMessage);
  onScrollCondensePlayerView();
} else {
  var isEmptyPlaylistEl = '<div id="empty-playlist-message">This playlist has no episodes or clips added to it.</div>';
  $(isEmptyPlaylistEl).insertAfter('#player');
}

if (!isPlaylist) {
  let params = {};
  params.podcastFeedURL = window.podcastFeedURL;
  params.filterType = 'pastMonth';

  requestClipsFromAPI(params)
  .then(clips => {
    loadClipsAsPlaylistItems(clips);
  })
  .catch(err => console.log(err));
}

function loadClipsAsPlaylistItems (clips) {
  $('#playlist .playlist-item').remove();

  let html  = '';

  for (let clip of clips) {
    let clipDuration = calcDuration(clip.startTime, clip.endTime);

    html += `<div class="playlist-item" data-media-ref-id="${clip.id}" tabindex="0">`;
    html +=   '<div class="playlist-item-podcast-title">';
    html +=     clip.title;
    html +=   '</div>';
    html +=   '<div class="playlist-item-sub-title">'
    html +=     clip.episodeTitle;
    html +=   '</div>';
    html +=   '<div class="playlist-item-time">';
    html +=     'Clip:';
    html +=     convertSecToHHMMSS(clip.startTime);
    if (clip.endTime) {
      html +=   ' to ' + convertSecToHHMMSS(clip.endTime);
    } else {
      html +=   ' start time'
    }
    html +=   '</div>';

    if (clip.startTime && clip.endTime) {
      html +=   '<div class="playlist-item-duration">';
      html +=     secondsToReadableDuration(clip.endTime - clip.startTime);
      html +=   '</div>';
    }

    html +=   '<div class="clearfix"></div>';
    html += '</div>';
  }

  // the window.mediaRefs object is needed in the .playlist-item click event
  window.mediaRefs = clips.reverse();

  $('#playlist').append(html);
}



// Podcast / Episode / Clip variables added to the window
// object in player.html

window.loadPlaylistItem = (index) => {
  $('#player-error-message').hide();

  var item = mediaRefs[index];

  window.setPlaylistItemPropsOnWindow(item);

  setPlayerInfo();
  setSubscribedStatus();

  if (episodeMediaURL !== previousEpisodeMediaURL) {
    destroyPlayerAndAudio();
    checkIfEpisodeMediaFileIsFound(createAndAppendAudio, showEpisodeNotFoundMessage);
  } else {
    audio.currentTime = startTime;

    var autoplay = $.cookie('autoplay');
    if (autoplay === 'true') {
      audio.play();
    }
  }

  // If not on playlist page (instead on a clip or episode page),
  // then rewrite URL in search bar so the user is able to share the
  // correct link.
  if (!isPlaylist) {
    if (isEpisode) {
      window.history.pushState({}, '', `/episodes/${item.id}`);
    } else {
      window.history.pushState({}, '', `/clips/${item.id}`);
    }
  }

  sendGoogleAnalyticsPlayerPageView();

}

export function previewStartTime (startTime, endTime) {
  window.endTimeHasBeenReached = false;
  window.endTime = endTime;
  audio.currentTime = window.startTime = startTime;
  audio.play();

  sendGoogleAnalyticsEvent('Media Player', 'Preview Start Time');
}

export function previewEndTime (endTime) {
  window.endTimeHasBeenReached = false;
  window.endTime = endTime;
  audio.currentTime = endTime - 3;
  audio.play();

  sendGoogleAnalyticsEvent('Media Player', 'Preview End Time');
}

function setPlayerInfo () {

  $('#add-to-playlist').hide();
  $('#toggle-playlist-btn').removeClass('active');
  $('#recommend').hide();
  $('#toggle-recommend-btn').removeClass('active');
  $('#make-clip').hide();
  $('#toggle-make-clip-btn').removeClass('active');
  $('#make-clip-end-time input').val('');
  $('#make-clip-title textarea').val('');

  if (window.startTime === 0 && window.endTime === null) {
    isEpisode = true;
  } else {
    isEpisode = false;
    endTime = parseInt(window.endTime)
  }

  document.getElementById('player').setAttribute('data-id', window.mediaRefId);

  $('#player-header').show();

  let startTimeReadable = '',
      endTimeReadable = '';

  if (endTime >= 0 && endTime !== null) {
    startTimeReadable = 'Clip: ' + convertSecToHHMMSS(startTime);
    endTimeReadable = ' to ' + convertSecToHHMMSS(endTime);
  } else {
    startTimeReadable = 'Clip: ' + convertSecToHHMMSS(startTime);
    endTimeReadable = ' start time';
  }

  if (isEpisode === false) {
    var duration = calcDuration(startTime, endTime);
    $('#player-stats-duration').html(startTimeReadable + endTimeReadable);
    $('#player-condensed-text').html(startTimeReadable + endTimeReadable + ' – ' + description);
    $('#player-condensed-text').addClass('should-show');
  } else {
    $('#player-stats-duration').html('Full Episode');
  }

  if (isPlaylist && !isEpisode) {
    $('#player-stats-duration-link').html('<a href="/clips/' + mediaRefId + '"><i class="fa fa-link"></i></a>')
  } else if (isPlaylist && isEpisode) {
    $('#player-stats-duration-link').html('<a href="/episodes/alias?mediaURL=' + episodeMediaURL + '"><i class="fa fa-link"></i></a>')
  }

  $('#player-condensed-title a').html(podcastTitle);
  $('#player-condensed-title a').attr('href', '/podcasts/alias?feedURL=' + podcastFeedURL);
  $('#player-condensed-sub-title a').attr('href', '/episodes/alias?mediaURL=' + episodeMediaURL);
  $('#player-condensed-sub-title a').html(episodeTitle);
  $('#player-condensed-image img').attr('src', podcastImageURL);

  $('#player-podcast-title a').attr('href', '/podcasts/alias?feedURL=' + podcastFeedURL);
  $('#player-podcast-title a').html(podcastTitle);

  $('#player-sub-title a').attr('href', '/episodes/alias?mediaURL=' + episodeMediaURL);
  $('#player-sub-title a').html(episodeTitle);

  $('#player-image a').attr('href', '/podcasts/alias?feedURL=' + podcastFeedURL);
  $('#player-image img').attr('src', podcastImageURL);
  $('#player-stats-pub-date').html(readableDate(episodePubDate));

  $('#player-time-jump-back').html('<i class="fa fa-angle-left"></i> 15s');
  $('#player-time-jump-forward').html('15s <i class="fa fa-angle-right"></i>');
  $('#toggle-make-clip-btn').html('<i class="fa fa-scissors"></i>');
  $('#toggle-playlist-btn').html('<i class="fa fa-list-ul"></i>');
  $('#toggle-recommend-btn').html('<i class="fa fa-user-plus"></i>');

  if ($('#player-hr').length < 1) {
    $('<hr id="player-hr">').insertAfter('#player-functions');
  }

  let truncDescription = description;
  truncDescription = stripTags(truncDescription);
  truncDescription = truncDescription.trim();
  truncDescription = truncDescription.substring(0, 156);

  // Add "show more" if description was truncated
  if (truncDescription.length > 155) {
    // If last character is a space, remove it
    if(/\s+$/.test(truncDescription)) {
      truncDescription = truncDescription.slice(0,-1);
    }

    truncDescription += "... <span class='text-primary'><small>show more</small></span>";
  }

  if (!description || description.length === 0) {
    if (isEpisode) {
      truncDescription = description = '<i>No episode summary provided</i>';
    } else {
      truncDescription = description = '<i>No clip title provided</i>';
    }
  }

  $('#player-description-truncated').html('<div id="player-description-truncated-begin"></div>' + truncDescription + '<div id="player-description-truncated-end"></div>');

  // If is a clip, then include the episode summary after the title.
  if (!isEpisode) {
    description = `${description}<br><br><br><div id="player-description-episode-summary">Episode Summary:</div><br><br>${episodeSummary}`;
  }
  let autolinker = new Autolinker({});
  description = autolinker.link(description);
  $('#player-description-full').html(description);

  // The truncated element is surrounded with spans used to detect how many lines
  // of description text have loaded on the page, and if it is more than 2 lines,
  // then truncate characters from the string until the text only fills 2 lines.
  if (truncDescription.length > 155) {
    setTimeout(function () {
      let beginTruncTopPos = $('#player-description-truncated-begin').position().top;
      let endTruncTopPos = $('#player-description-truncated-end').position().top;
      if (endTruncTopPos - beginTruncTopPos > 44) {
        truncDescription = truncDescription.slice(0, -88);
        truncDescription += "... <span class='text-primary'><small>show more</small></span>";
        $('#player-description-truncated').html(truncDescription)
      }
    }, 0);
  }

  if (truncDescription.length < 156 && !isEpisode && truncDescription.indexOf('<small>show more</small>') < 0 && episodeSummary && episodeSummary.length > 0) {
    setTimeout(function () {
      truncDescription += " <span class='text-primary'><small>show summary</small></span>";
      $('#player-description-truncated').html(truncDescription)
    }, 0);
  }

  $('#player-description-truncated').show();
  $('#player-description-full').hide();
  $('#playlist').show();

  window.restartAttempts = 0;
  window.lastPlaybackPosition = -1;
  window.endTimeHasBeenReached = false;

  var playerWidth = $('#player-inner').width();
  $('#player-condensed-inner').css('width', playerWidth);

  let updateCondensedPlayerWidth = throttle(function () {
    var playerWidth = $('#player-inner').width();
    $('#player-condensed-inner').css('width', playerWidth);
    setTimeout(function () {
      resizeProgressBar();
    }, 200);
  }, 200);

  window.addEventListener('resize', updateCondensedPlayerWidth);

}

// Sometimes when returning from the lock screen to a player page in iOS Safari
// the media player progress bar loads with too much width. These event listeners
// are attempts to handle this issue.
window.addEventListener('focus', resizeProgressBar);
window.addEventListener('pageshow', resizeProgressBar);
window.addEventListener('visibilityChange', resizeProgressBar);

$('#player-description-truncated').on('click', () => {
  $('#player-description-truncated').hide();
  $('#player-description-full').show();
});

function setSubscribedStatus() {

  $.ajax({
    type: 'GET',
    url: '/podcasts/isSubscribed',
    headers: {
      Authorization: $.cookie('idToken')
    },
    data: {
      podcastFeedURL: podcastFeedURL
    },
    success: function (isSubscribed) {
      if (isSubscribed && isSubscribed != 'false') {
        $('#player-podcast-subscribe').html('<i class="fa fa-star"></i>');
        $('#player-podcast-subscribe').attr('title', 'Unsubscribe from podcast');
      } else {
        $('#player-podcast-subscribe').html('<small class="hidden-xs-down">subscribe</small> <i class="fa fa-star-o"></i>');
        $('#player-podcast-subscribe').attr('title', 'Subscribe to podcast');
      }
    },
    error: function (xhr, status, error) {
      $('#player-podcast-subscribe').html('<small class="hidden-xs-down">subscribe</small> <i class="fa fa-star-o"></i>');
      $('#player-podcast-subscribe').attr('title', 'Subscribe to podcast');
    }
  });
}

function toggleSubscribe() {
  if (!isNonAnonLoggedInUser()) {
    alert('Login to subscribe to this podcast.');
    return;
  }

  var index = $(".playlist-item").index(this);

  if ($('#player-podcast-subscribe i').hasClass('fa-star-o')) {
    $('#player-podcast-subscribe').html('<i class="fa fa-star"></i>');
    $('#player-podcast-subscribe').attr('title', 'Unsubscribe from podcast');
    subscribeToPodcast(podcastFeedURL);
    if (window.mediaRefs) {
      window.mediaRefs[index]["isSubscribed"] = true;
    }
  } else {
    $('#player-podcast-subscribe').html('<small class="hidden-xs-down">subscribe</small> <i class="fa fa-star-o"></i>');
    $('#player-podcast-subscribe').attr('title', 'Subscribe to podcast');
    unsubscribeFromPodcast(podcastFeedURL);
    if (window.mediaRefs) {
      window.mediaRefs[index]["isSubscribed"] = false;
    }
  }
}

$('#player-podcast-subscribe').on('click', function () {
  toggleSubscribe(this);
});

// Super-hack to fix the JS dynamically styled progress bar when it breaks after
// screen resize.
function resizeProgressBar () {
  // Progress bar width should be equal to width of #player minus the total space
  // taken up by all other elements in the #player element, *except* on mobile
  // when the volume bar elements do not load in the player, also the prev / next
  // buttons only load on playlist pages.
  var hasVolumeBar = ($('.mejs-horizontal-volume-slider').width() > 0);
  var otherElementsWidth = 228 + (hasVolumeBar ? 82 : 0) - (isPlaylist ? 0 : 52);
  var newWidth = $('#player').width() - otherElementsWidth;
  $('.mejs-time-rail').width(newWidth);
  $('.mejs-time-slider').width(newWidth - 10);
}

function checkIfEpisodeMediaFileIsFound(success, error) {
  window.audio = document.createElement('audio');
  audio.setAttribute('src', episodeMediaURL);
  audio.setAttribute('type', 'audio/mpeg');
  audio.setAttribute('codecs', 'mp3');
  audio.preload = "metadata";

  audio.onloadstart = function() {
    success();
  };

  audio.onerror = function () {
    error();
  }
}

function showEpisodeNotFoundMessage () {
  $('#player-functions').hide();
  $('#player-error-message').html(`
    <p>
      Episode Not Found: this episode may no longer be publicly available,
      or there was a network connectivity issue.
    </p>
  `);
  $('#player-error-message').show();
}

function createAndAppendAudio () {

  // Fix up prefixing
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  var context = new AudioContext();

  function loadSound() {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType('application/octet-stream');
    xhr.open('GET', '/proxy?mediaURL=' + window.episodeMediaURL, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function() {
      window.audio = document.createElement('audio');
      audio.controls = true;
      var source = document.createElement('source');
      $(audio).append(source);

      $('.fa-spinner').hide();

      source.src = window.URL.createObjectURL(new Blob([xhr.response], {type: 'audio/mp3'}));
      source.type = 'audio/mp3';
      $('#player').append(audio);

      $('audio').mediaelementplayer({
        // the order of controls you want on the control bar (and other plugins below)
        features: ['playpause', 'current', 'progress', 'duration', 'volume', 'fasterslower'],
        alwaysShowHours: true,
        alwaysShowControls: true
      });
    }
    xhr.send();
  }

  loadSound('/proxy');
}

$('#player-time-jump-forward').on('click', function() {
  audio.currentTime = audio.currentTime + 15;
});

$('#player-time-jump-back').on('click', function() {
  audio.currentTime = audio.currentTime - 15;
});

$('#player-autoplay').on('click', function() {
  toggleAutoplay();
});

function setStartAndEndTimesToBePlayed() {
  // Stop the clip once when the end time has been reached
  if (Math.floor(audio.currentTime) === endTime && endTimeHasBeenReached === false) {
    endTimeHasBeenReached = true;
    audio.pause();

    var autoplay = $.cookie('autoplay');
    if (isPlaylist && autoplay === 'true') {
      if (nowPlayingPlaylistItemIndex < mediaRefs.length - 1) {
        nowPlayingPlaylistItemIndex++;
        lastPlaybackPosition = -1;
        loadPlaylistItem(nowPlayingPlaylistItemIndex)
        return;
      }
    }
  }

  // TODO: Can this be made more efficient than rewriting the lastPlaybackPosition
  // whenever time updates?
  lastPlaybackPosition = audio.currentTime;
}

function toggleAutoplay () {
  var autoplay = $.cookie('autoplay');
  if (autoplay !== 'true') {
    $.cookie('autoplay', 'true', {
      path: '/',
      expires: 365
    });
    $('#player-autoplay').html('<span style="font-weight: 500">Autoplay On</span>');
    sendGoogleAnalyticsEvent('Media Player', 'Toggle Autoplay On');
  } else {
    $.cookie('autoplay', 'false', {
      path: '/',
      expires: 365
    });
    $('#player-autoplay').html('Autoplay Off');
    sendGoogleAnalyticsEvent('Media Player', 'Toggle Autoplay Off');
  }
}

function createAutoplayBtn () {
  if (!isMobileOrTablet()) {
    var autoplay = $.cookie('autoplay');
    if (autoplay === 'true') {
      $('#player-autoplay').html('<span style="font-weight: 500">Autoplay On</span>');
    } else {
      $.cookie('autoplay', 'false', {
        path: '/',
        expires: 365
      });
      $('#player-autoplay').html('Autoplay Off');
    }
  }
}

function restart () {
  audio.pause();
  endTimeHasBeenReached = false;
  audio.currentTime = startTime;
  audio.play();
  sendGoogleAnalyticsEvent('Media Player', 'Restart');
}

$('#player-stats-duration').on('click', function () {
  restart();
});

setTimeout(function () {
  $('.playlist-item').on('keypress click', function(e) {
    if (e.which === 13 || e.type === 'click') {
      if (isPlayerPage) {
        if (!$(this).hasClass("edit-view")) {
          var index = $(".playlist-item").index(this);
          index = mediaRefs.length - index - 1;
          nowPlayingPlaylistItemIndex = index;
          loadPlaylistItem(index);
          sendGoogleAnalyticsEvent('Media Player', 'Playlist Item Clicked');
        }
      }
    }
  });

  $('.sort-by-dropdown .dropdown-item').on('click', function (_this) {
    if (_this && _this.target) {
      let params = {};
      params.podcastFeedURL = podcastFeedURL;
      // params.episodeMediaURL = episodeMediaURL;
      params.filterType = _this.target.id;
      $('.sort-by-dropdown button').html(_this.target.innerText + ' <i class="fa fa-angle-down"></i>');
      requestClipsFromAPI(params)
      .then(clips => {
        loadClipsAsPlaylistItems(clips);
      })
      .catch(err => console.log(err));
    }
  });
}, 1000);

function onScrollCondensePlayerView () {

  var topOfPlayer = $("#player").offset().top;
  var heightOfPlayer = $("#player").outerHeight();
  var bottomOfPlayer = topOfPlayer + heightOfPlayer;

  var topOfPlayerContainer = $('#player-container').offset().top;
  // -145, -17 to prevent screen from jumping when switching to a condensed view
  // HACK: we shouldn't need something like this, remove after refactoring player /  condensed player
  var heightOfPlayerContainer = $('#player-container').outerHeight() - 145;
  var bottomOfPlayerContainer = topOfPlayerContainer + heightOfPlayerContainer;

  let condenseOnScroll = throttle(function () {
    if($(window).scrollTop() > (bottomOfPlayer)){
     $('html').attr('style', 'padding-top: ' + (bottomOfPlayerContainer - 17) + 'px;' );

     $('#player-container').addClass('condensed');

    } else {
     $('html').attr('style', '');
     $('#player-container').removeClass('condensed');
    }
  }, 20);

  window.addEventListener('scroll', condenseOnScroll);

}

function destroyPlayerAndAudio () {
  var audioElArray = $('#player audio');
  if (audioElArray.length > 0) {
    var audioEl = audioElArray[0];
    audioEl.pause();
    audioEl.src = '';
    audioEl.load();
  }
  audio = null;
  $('#player').html('');
  $('#player').append('<i class="fa fa-spinner fa-spin"></i>');
}
