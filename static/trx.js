function listenVideos() {
  let videos = document.getElementsByTagName('video');
  for (let i = videos.length - 1; i >= 0; i--) {
    let video = videos[i];
    video.addEventListener('loadedmetadata', function() {
      video.loop = video.duration < 5;
      video.muted = true;

      video.addEventListener('click', function() {
        if (video.paused) {
          video.muted = false;
          video.play();
        } else {
          video.muted = true;
          video.pause();
        }
      });
    });
  }
}

function listenGraph() {
  let content = document.getElementById('content');
  let graphWrap = document.getElementById('graph');
  let graph = document.querySelector('#trx-graph .svg-container');
  let d3Block = document.getElementById('block-d3block');
  if (graph !== null) {
    console.log(graph.style.width.toString().length);
    let diff = drupalSettings.contentWidth / content.clientWidth;
    console.log(diff);
    console.dir(graph);
    console.dir(content);
    graph.style.width = 600 / diff + 'px';
    d3Block.style.height = 240 / diff + 'px';
    graphWrap.style.height = 300 / diff + 'px';
  }
}

(function($, Drupal, drupalSettings) {

  function addFriendListeners() {
    drupalSettings.friendTarget = 0;
    // let friendActionBlock = $('#heartbeat-friendship-action');
    // let users = Array.from(document.querySelectorAll('.heartbeat-owner a img'));
    // users.forEach(function (user) {
    //   user.addEventListener('mouseover', function(e) {
    //     uid = e.srcElement.parentNode.href.substring(e.srcElement.parentNode.href.lastIndexOf('/') + 1);
    //     if (drupalSettings.friendTarget !== uid) {
    //       drupalSettings.friendTarget = uid;
    //       $.ajax({
    //         type: 'GET',
    //         url: '/heartbeat/friend_interact/' + uid,
    //         success: function (response) {
    //           let friendActionHandlerElem = document.createElement('div');
    //           friendActionHandlerElem.innerHTML = response;
    //           let friendActionContent = friendActionHandlerElem.querySelector('#heartbeat-friend-interact-wrap');
    //           friendActionBlock.html(friendActionContent.innerHTML);
    //           friendActionBlock.css({top: e.clientY});
    //           friendActionBlock.show('225');
    //           Drupal.attachBehaviors();
    //         }
    //       });
    //     } else {
    //       if (!friendActionBlock.is(':visible')) {
    //         console.log('make visible');
    //         // friendActionBlock.css({top: e.clientY - 40});
    //         friendActionBlock.show('225');
    //         friendActionBlock.focus();
    //       }
    //     }
    //   });
    //   // user.addEventListener('mouseout', function() {
    //   //   friendActionBlock.hide('225');
    //   // })
    // });
    // friendActionBlock.on('mouseenter', function() {
    //
    //     friendActionBlock.off('mouseout', friendActionMouseLeave);
    //     friendActionBlock.on('mouseout', friendActionMouseLeave);
    // });
  }

  const friendActionMouseLeave = function(event) {
    // let e = event.toElement || event.relatedTarget;
    // if (e.parentNode == this || e == this) {
    //   return;
    // }
    $('#heartbeat-friendship-action').hide('1500');
  };


  function listenReplyButtons() { //reply grey button to reply
    let replyButtons = document.querySelectorAll('.heartbeat-comment-form .form-submit, .heartbeat-sub-comment-form .form-submit');
    for (let m = 0; m < replyButtons.length; m++) {
      replyButtons[m].addEventListener('click', function(event) {
        let replyText = replyButtons[m].parentNode.querySelector('textarea');
        console.dir(replyText);
        console.dir(event);
        replyText.value = '';
        replyText.innerText = '';
      })
    }
  }

  /**
   * to open a form by clicking reply hyperlink to sub-comment.
   */
  function listenReplyLinks() {
    let replyLinks = document.querySelectorAll('.sub-comment a.button');
    for (let i = 0; i < replyLinks.length; i++) {
      replyLinks[i].addEventListener('click', function(e) {
        if (findSubCommentForm(e.srcElement.parentElement.parentElement)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      });
    }
  }

  function findSubCommentForm(e) {
    let search = false;
    for (let p = 0; p < e.children.length; p++) {
      if (e.children[p].classList.contains('heartbeat-sub-comment-form')) {
        search = true;
      } else if (e.children[p].children !== null && e.children[p].children.length > 0) {
        for (let c = 0; c < e.children[p].children.length; c++) {
          if (e.children[p].children[c].classList.contains('heartbeat-sub-comment-form')) {
            search = true;
          }
        }
      }
    }
    return search;
  }

  function hideCommentForms() {
    let forms = document.querySelectorAll('.heartbeat-comment-form .js-form-type-textarea, .heartbeat-comment-form .form-submit');

    for (let f = 0; f < forms.length; f++) {
      forms[f].className += ' comment-form-hidden';
    }
  }

  function flagToolListen() {

    let likeFlags = document.querySelectorAll('.flag-heartbeat_like');
    let heartbeatUnlikeFlags = document.querySelectorAll('.flag-heatbeat_unlike');

    for (let i = 0; i < likeFlags.length; i++) {
      likeFlags[i].addEventListener('mouseover', function() {
        likeFlags[i].className += ' selected';
      });
      likeFlags[i].addEventListener('mouseout', function() {
        likeFlags[i].classList.remove('selected');
      });
    }

    for (let i = 0; i < heartbeatUnlikeFlags.length; i++) {

      heartbeatUnlikeFlags[i].addEventListener('mouseover', function() {
        heartbeatUnlikeFlags[i].className += ' selected';

      });
      heartbeatUnlikeFlags[i].addEventListener('mouseout', function() {
        heartbeatUnlikeFlags[i].classList.remove('selected');
      });
    }
  }

//TODO add username if viewing user profile
  function userPagePrintName() {
    if (window.location.pathname.indexOf('/user/') === 0) {
      if (document.getElementById('trx-userprofile-username')) {
        document.getElementById('trx-userprofile-username').remove();
      }
      let userImgData = document.getElementById('block-trx-content').querySelector('article div a img');
      let userDom = document.createElement('h3');
      console.dir(userImgData);
      if (userImgData !== null) {
        userDom.innerText = userImgData.alt.substring(25);
        userDom.id = 'trx-userprofile-username';
        userImgData.parentNode.appendChild(userDom);
      }
    }
  }

  let listenNavLeft = function() {
    drupalSettings.filterPageEnd = false;
    if (drupalSettings.filterPage !== 0) {
      let currentIndexStart = (drupalSettings.filterPage + 1) * 10 - 10;
      let currentIndexEnd = (drupalSettings.filterPage + 1) * 10;

      let replacementTerms = drupalSettings.hashtags.slice(currentIndexStart - 10, currentIndexEnd - 10);

      console.log('Moving range to ' + (currentIndexStart - 10) + ' to ' + (currentIndexEnd - 10));
      let displayedTags = document.querySelectorAll('.trxfilter-tag');
      for (let i = 0; i < 10 ; i++) {
        let replaceWrap = document.createElement('div');
        replaceWrap.className = 'trxfilter-tag';
        if (replacementTerms[i] !== undefined) {
          replaceWrap.innerHTML = '#' + replacementTerms[i].name;
          let replaceTid = document.createElement('span');
          replaceTid.className = 'trxfilter-tid';
          replaceTid.textContent = replacementTerms[i].tid;
          let replaceCount = document.createElement('span');
          replaceCount.className = 'trxfilter-count';
          replaceCount.textContent = replacementTerms[i].count;
          replaceWrap.appendChild(replaceTid);
          replaceWrap.appendChild(replaceCount);
        }
        displayedTags[i].parentNode.appendChild(replaceWrap);
        displayedTags[i].parentNode.removeChild(displayedTags[i]);
      }
      drupalSettings.filterPage--;
      trxfilterListeners();
    }
  };
  let listenNavRight = function() {
    if (!drupalSettings.filterPageEnd) {
      let currentIndexStart = (drupalSettings.filterPage + 1) * 10 - 10;
      let currentIndexEnd = (drupalSettings.filterPage + 1) * 10;

      let replacementTerms = drupalSettings.hashtags.slice(currentIndexStart + 10, currentIndexEnd + 10);
      // console.dir(replacementTerms);

      let end = (currentIndexEnd + 10) > drupalSettings.hashtags.length;
      let modifier = end ? replacementTerms.length : 10;

      console.log('Moving range to ' + (currentIndexStart + 10) + ' to ' + (currentIndexEnd + 10));
      let displayedTags = document.querySelectorAll('.trxfilter-tag');
      let i = 0;
      for (let f = ((drupalSettings.filterPage + 1 ) * 10) - 10; f < ((drupalSettings.filterPage + 1) * 10) - 10 + modifier; f++) {
        let replaceWrap = document.createElement('div');
        replaceWrap.className = 'trxfilter-tag';
        if (replacementTerms[i] !== undefined) {
          replaceWrap.innerHTML = '#' + replacementTerms[i].name;
          let replaceTid = document.createElement('span');
          replaceTid.className = 'trxfilter-tid';
          replaceTid.textContent = replacementTerms[i].tid;
          let replaceCount = document.createElement('span');
          replaceCount.className = 'trxfilter-count';
          replaceCount.textContent = replacementTerms[i].count;
          replaceWrap.appendChild(replaceTid);
          replaceWrap.appendChild(replaceCount);
          // replaceWrap.addEventListener('mouseover', function() {
          //   replaceCount.style.display = 'inline-block';
          // })
          // replaceWrap.addEventListener('mouseout', function() {
          //   replaceCount.style.display = 'none';
          // })
        }
        displayedTags[i].parentNode.appendChild(replaceWrap);
        displayedTags[i].parentNode.removeChild(displayedTags[i]);
        i++;
      }
      drupalSettings.filterPage++;
      drupalSettings.filterPageEnd = end;
      trxfilterListeners();
    }
  };

  function listenNav() {
    let navLeft = document.querySelector('.trx-filter-left');
    let navRight = document.querySelector('.trx-filter-right');
    navLeft.removeEventListener('click', listenNavLeft);
    navRight.removeEventListener('click', listenNavRight);
    navLeft.addEventListener('click', listenNavLeft);
    navRight.addEventListener('click', listenNavRight);
  }

  const termListener = function(event) {

    if (drupalSettings.user.uid > 0) {
      $('#heartbeat-loader').show(225);
      let tid = event.srcElement.querySelector('.trxfilter-tid').textContent;
      drupalSettings.filterMode = true;
      event.preventDefault();
      event.stopPropagation();

      $.ajax({
        type: 'GET',
        url: '/heartbeat/filter-feed/' + tid,
        success: function (response) {
          // let feedBlock = document.getElementById('block-heartbeatblock');
          // console.dir(feedBlock);
          // let feedElements = document.querySelectorAll('.heartbeat-stream');
          // if (feedElements != null) {
          //   for (let f = 0; f < feedElements.length; f++) {
          //     if (feedElements[f] !== null && feedElements[f].parentNode !== null) {
          //       feedElements[f].parentNode.removeChild(feedElements[f]);
          //     }
          //   }
          //   if (feedBlock === null) {
          //     feedBlock = document.getElementById('block-heartbeatmoreblock');
          //     if (feedBlock === null) {
          //       feedBlock = document.getElementById('block-heartbeat')
          //     }
          //   }
          // }
          //
          // let insertNode = document.createElement('div');
          // insertNode.className = 'heartbeat-stream';
          // insertNode.innerHTML = response;
          // if (feedBlock === null) {
          //   feedBlock = document.createElement('div');
          //   feedBlock.id = 'block-heartbeatblock';
          //   let body = document.getElementsByTagName('body');
          //   body.querySelector('#main #content').appendChild(feedBlock);
          // }
          // feedBlock.appendChild(insertNode);
          let feedBlock = document.getElementById('block-heartbeatblock');
          let feedElement = document.querySelector('.heartbeat-stream');

          if (feedElement != null) {
            feedBlock.removeChild(feedElement);
          }

          let insertData = document.createElement('div');
          insertData.innerHTML = response;
          let insertNode = insertData.querySelector('.heartbeat-stream');
          feedBlock.appendChild(insertNode);
        },
        complete: function () {
          $('body').animate({scrollTop: '0px'}, 500);
          $('#heartbeat-loader').hide(225);
          Drupal.attachBehaviors()
        }
      });
      return false;
    } else {
      loginModal();
    }
  }

  function trxfilterListeners() {
    let feedFilterBlock = document.getElementById('trxfilter-block');
    if (feedFilterBlock !== null) {
      let terms = feedFilterBlock.querySelectorAll('.trxfilter-tag');

      //TODO Convert the following two event listeners to a more elegant syntax
      terms.forEach(function (term) {
        let tid = term.querySelector('.trxfilter-tid').textContent;
        //add listeners to all taxonomy (mobile)
        term.addEventListener("touchstart", function (event) {
          console.dir(event.srcElement);
          possibleTid = event.srcElement.querySelector('.trxfilter-tid').textContent;
          console.dir(possibleTid);
          if (drupalSettings.user.uid > 0) {
            let tid = term.querySelector('.trxfilter-tid').textContent;
            $('#heartbeat-loader').show(225);
            drupalSettings.filterMode = true;
            event.preventDefault();
            event.stopPropagation();

            $.ajax({
              type: 'GET',
              url: '/heartbeat/filter-feed/' + tid,
              success: function (response) {
                let feedBlock = document.getElementById('block-heartbeatblock');
                let feedElement = document.querySelector('.heartbeat-stream');

                if (feedElement != null) {
                  feedBlock.removeChild(feedElement);
                }

                let insertData = document.createElement('div');
                insertData.innerHTML = response;
                let insertNode = insertData.querySelector('.heartbeat-stream');
                feedBlock.appendChild(insertNode);
              },
              complete: function () {
                $('body').animate({scrollTop: '0px'}, 500);
                $('#heartbeat-loader').hide(225);
                Drupal.attachBehaviors()
              }
            });
            return false;
          } else {
            loginModal();
          }
        });

        //add listeners to all taxonomy (desktop)
        term.removeEventListener('click', termListener);
        term.addEventListener('click', termListener);
        // term.addEventListener("click", function (event) {
        //   if (drupalSettings.user.uid > 0) {
        //     $('#heartbeat-loader').show(225);
        //
        //     drupalSettings.filterMode = true;
        //     event.preventDefault();
        //     event.stopPropagation();
        //
        //     $.ajax({
        //       type: 'GET',
        //       url: '/heartbeat/filter-feed/' + tid,
        //       success: function (response) {
        //         let feedBlock = document.getElementById('block-heartbeatblock');
        //         console.dir(feedBlock);
        //         let feedElement = document.querySelector('.heartbeat-stream');
        //         if (feedElement != null) {
        //           if (feedBlock === null) {
        //             feedBlock = document.getElementById('block-heartbeatmoreblock');
        //             if (feedBlock === null) {
        //               feedBlock = document.getElementById('block-heartbeat')
        //             }
        //           }
        //           if (feedElement !== null && feedElement.parentNode !== null) {
        //             feedElement.parentNode.removeChild(feedElement);
        //           }
        //         }
        //
        //         let insertNode = document.createElement('div');
        //         insertNode.className = 'heartbeat-stream';
        //         insertNode.innerHTML = response;
        //         if (feedBlock === null) {
        //           feedBlock = document.createElement('div');
        //           feedBlock.id = 'block-heartbeatblock';
        //           let body = document.getElementsByTagName('body');
        //           body.querySelector('#main #content').appendChild(feedBlock);
        //         }
        //         feedBlock.appendChild(insertNode);
        //       },
        //       complete: function () {
        //         $('body').animate({scrollTop: '0px'}, 500);
        //         $('#heartbeat-loader').hide(225);
        //         Drupal.attachBehaviors()
        //       }
        //     });
        //     return false;
        //   } else {
        //     loginModal();
        //   }
        // });
      });
    }
  }
  // add listeners to all hashtags in heartbeat stream
  //TODO streamHashTagListeners and streamUsernameLIsteners need to be merged into one reusable method
  function streamHashtagListeners() {
    let hashtags = document.querySelectorAll('.heartbeat-message .heartbeat-hashtag a');
    for (let h = 0; h < hashtags.length; h++) {
      let hashTagID = hashtags[h].href.substring(hashtags[h].href.lastIndexOf('/') + 1);
      //add listeners to all taxonomy (mobile)
      hashtags[h].addEventListener("touchstart", function (event) {
        console.dir(event.srcElement);

        if (drupalSettings.user.uid > 0) {
          $('#heartbeat-loader').show(225);
          drupalSettings.filterMode = true;
          event.preventDefault();
          event.stopPropagation();

          $.ajax({
            type: 'GET',
            url: '/heartbeat/filter-feed/' + hashTagID,
            success: function (response) {
              // let feedBlock = document.getElementById('block-heartbeatblock');
              // let feedElements = document.querySelectorAll('.heartbeat-stream');
              // //Unfortunately, since Drupal sends containers around blocks we request, we need to iterate over the parent
              // //and remove any duplicate heartbeatstreams
              // for (let e = 0; e < feedElements.length; e++) {
              //   if (feedElements[e].parentNode !== null) {
              //     feedElements[e].parentNode.removeChild(feedElements[e]);
              //   }
              // }
              // for (let b = 0; b < feedBlock.children.length; b++) {
              //   if (!feedBlock.children[b].classList.contains('contextual') && !feedBlock.children[b].classList.contains('heartbeat-stream')) {
              //     console.dir(feedBlock.children[b]);
              //     feedBlock.removeChild(feedBlock.children[b]);
              //   }
              // }
              // let feedElement = document.querySelector('.heartbeat-stream');
              //
              // if (feedElement != null && feedElement.parentNode.contains(feedElement)) {
              //   feedElement.parentNode.removeChild(feedElement);
              // }
              //
              // let insertNode = document.createElement('div');
              // insertNode.className = 'heartbeat-stream';
              // insertNode.innerHTML = response;
              // feedBlock.appendChild(insertNode);
              let feedBlock = document.getElementById('block-heartbeatblock');
              let feedElement = document.querySelector('.heartbeat-stream');

              if (feedElement != null) {
                feedBlock.removeChild(feedElement);
              }

              let insertData = document.createElement('div');
              insertData.innerHTML = response;
              let insertNode = insertData.querySelector('.heartbeat-stream');
              feedBlock.appendChild(insertNode);
            },
            complete: function () {
              $('body').animate({scrollTop: '0px'}, 500);
              $('#heartbeat-loader').hide(225);
              Drupal.attachBehaviors()
            }
          });
          return false;
        } else {
          loginModal();
        }
      });

      //add listeners to all taxonomy (desktop)
      hashtags[h].addEventListener("click", function (event) {
        console.dir(event.srcElement);

        if (drupalSettings.user.uid > 0) {
          $('#heartbeat-loader').show(225);

          drupalSettings.filterMode = true;
          event.preventDefault();
          event.stopPropagation();

          $.ajax({
            type: 'GET',
            url: '/heartbeat/filter-feed/' + hashTagID,
            success: function (response) {
              // let feedBlock = document.getElementById('block-heartbeatblock');
              // let feedElements = document.querySelectorAll('.heartbeat-stream');
              // //Unfortunately, since Drupal sends containers around blocks we request, we need to iterate over the parent
              // //and remove any duplicate heartbeatstreams
              // for (let e = 0; e < feedElements.length; e++) {
              //   if (feedElements[e].parentNode !== null) {
              //     feedElements[e].parentNode.removeChild(feedElements[e]);
              //   }
              // }
              // for (let b = 0; b < feedBlock.children.length; b++) {
              //   if (!feedBlock.children[b].classList.contains('contextual') && !feedBlock.children[b].classList.contains('heartbeat-stream')) {
              //     feedBlock.removeChild(feedBlock.children[b]);
              //   }
              // }
              // let feedElement = document.querySelector('.heartbeat-stream');
              //
              // if (feedElement != null && feedElement.parentNode.contains(feedElement)) {
              //   feedElement.parentNode.removeChild(feedElement);
              // }
              //
              // let insertNode = document.createElement('div');
              // insertNode.className = 'heartbeat-stream';
              // insertNode.innerHTML = response;
              // feedBlock.appendChild(insertNode);
              let feedBlock = document.getElementById('block-heartbeatblock');
              let feedElement = document.querySelector('.heartbeat-stream');

              if (feedElement != null) {
                feedBlock.removeChild(feedElement);
              }

              let insertData = document.createElement('div');
              insertData.innerHTML = response;
              let insertNode = insertData.querySelector('.heartbeat-stream');
              feedBlock.appendChild(insertNode);
            },
            complete: function () {
              $('body').animate({scrollTop: '0px'}, 500);
              $('#heartbeat-loader').hide(225);
              Drupal.attachBehaviors()
            }
          });
          return false;
        } else {
          loginModal();
        }
      });
    }
  }

  function streamUsernameListeners() {
    let usernames = document.querySelectorAll('.heartbeat-message .heartbeat-username a');
    for (let h = 0; h < usernames.length; h++) {
      let userNameID = usernames[h].href.substring(usernames[h].href.lastIndexOf('/') + 1);
      //add listeners to all taxonomy (mobile)
      usernames[h].addEventListener("touchstart", function (event) {
        console.dir(event.srcElement);

        if (drupalSettings.user.uid > 0) {
          $('#heartbeat-loader').show(225);
          drupalSettings.filterMode = true;
          event.preventDefault();
          event.stopPropagation();

          $.ajax({
            type: 'GET',
            url: '/heartbeat/filter-feed/username/' + userNameID,
            success: function (response) {
              // let feedBlock = document.getElementById('block-heartbeatblock');
              // let feedElements = document.querySelectorAll('.heartbeat-stream');
              // //Unfortunately, since Drupal sends containers around blocks we request, we need to iterate over the parent
              // //and remove any duplicate heartbeatstreams
              // for (let e = 0; e < feedElements.length; e++) {
              //   if (feedElements[e].parentNode !== null) {
              //     feedElements[e].parentNode.removeChild(feedElements[e]);
              //   }
              // }
              // for (let b = 0; b < feedBlock.children.length; b++) {
              //   if (!feedBlock.children[b].classList.contains('contextual') && !feedBlock.children[b].classList.contains('heartbeat-stream')) {
              //     feedBlock.removeChild(feedBlock.children[b]);
              //   }
              // }
              // let feedElement = document.querySelector('.heartbeat-stream');
              //
              // if (feedElement != null && feedElement.parentNode.contains(feedElement)) {
              //   feedElement.parentNode.removeChild(feedElement);
              // }
              //
              // let insertNode = document.createElement('div');
              // insertNode.className = 'heartbeat-stream';
              // insertNode.innerHTML = response;
              // feedBlock.appendChild(insertNode);
              let feedBlock = document.getElementById('block-heartbeatblock');
              let feedElement = document.querySelector('.heartbeat-stream');

              if (feedElement != null) {
                feedBlock.removeChild(feedElement);
              }

              let insertData = document.createElement('div');
              insertData.innerHTML = response;
              let insertNode = insertData.querySelector('.heartbeat-stream');
              feedBlock.appendChild(insertNode);
            },
            complete: function () {
              $('body').animate({scrollTop: '0px'}, 500);
              $('#heartbeat-loader').hide(225);
              Drupal.attachBehaviors()
            }
          });
          return false;
        } else {
          loginModal();
        }
      });

      //add listeners to all taxonomy (desktop)
      usernames[h].addEventListener("click", function (event) {
        console.dir(event.srcElement);

        if (drupalSettings.user.uid > 0) {
          $('#heartbeat-loader').show(225);

          drupalSettings.filterMode = true;
          event.preventDefault();
          event.stopPropagation();

          $.ajax({
            type: 'GET',
            url: '/heartbeat/filter-feed/username/' + userNameID,
            success: function (response) {
              // let feedBlock = document.getElementById('block-heartbeatblock');
              // let feedElements = document.querySelectorAll('.heartbeat-stream');
              // //Unfortunately, since Drupal sends containers around blocks we request, we need to iterate over the parent
              // //and remove any duplicate heartbeatstreams
              // for (let e = 0; e < feedElements.length; e++) {
              //   if (feedElements[e].parentNode !== null) {
              //     feedElements[e].parentNode.removeChild(feedElements[e]);
              //   }
              // }
              // for (let b = 0; b < feedBlock.children.length; b++) {
              //   if (!feedBlock.children[b].classList.contains('contextual') && !feedBlock.children[b].classList.contains('heartbeat-stream')) {
              //     feedBlock.removeChild(feedBlock.children[b]);
              //   }
              // }
              // let feedElement = document.querySelector('.heartbeat-stream');
              //
              // if (feedElement != null && feedElement.parentNode.contains(feedElement)) {
              //   feedElement.parentNode.removeChild(feedElement);
              // }
              //
              // let insertNode = document.createElement('div');
              // insertNode.className = 'heartbeat-stream';
              // insertNode.innerHTML = response;
              // feedBlock.appendChild(insertNode);
              let feedBlock = document.getElementById('block-heartbeatblock');
              let feedElement = document.querySelector('.heartbeat-stream');

              if (feedElement != null) {
                feedBlock.removeChild(feedElement);
              }

              let insertData = document.createElement('div');
              insertData.innerHTML = response;
              let insertNode = insertData.querySelector('.heartbeat-stream');
              feedBlock.appendChild(insertNode);
            },
            complete: function () {
              $('body').animate({scrollTop: '0px'}, 500);
              $('#heartbeat-loader').hide(225);
              Drupal.attachBehaviors()
            }
          });
          return false;
        } else {
          loginModal();
        }
      });
    }
  }

  function checkScroll() {

    listenGraph();
    let videos = document.getElementsByTagName('video');
    let fraction = 0.45;

    for (let i = 0; i < videos.length; i++) {

      let video = videos[i];

      let x = video.offsetLeft, y = video.offsetTop, w = video.offsetWidth, h = video.offsetHeight, r = x + w, //right
        b = y + h, //bottom
        visibleX, visibleY, visible;

      visibleX = Math.max(0, Math.min(w, window.pageXOffset + window.innerWidth - x, r - window.pageXOffset));
      visibleY = Math.max(0, Math.min(h, window.pageYOffset + window.innerHeight - y, b - window.pageYOffset));

      visible = visibleX * visibleY / (w * h);
      let state = visible > fraction;
      let paused = video.paused;

      if (video.paused) {
        if (visible > fraction && visible < (fraction * 1.1)) {
          video.play();
          console.log('play dat shit');
        } else {
          video.pause();
        }
      } else {
        if (visible < fraction) {
          video.pause();
        }
      }
    }
  }

  function textareaAutoHeight() {
    let textAreas = document.querySelectorAll('.heartbeat-comment-form textarea,.heartbeat-sub-comment-form .form-textarea');

    for (let m = textAreas.length - 1; m > 0; m--) {
      let textArea = textAreas[m];
      textArea.addEventListener('keydown', function(e) {
        if (e.keyCode == 13) {
          console.dir(e);
          console.dir(textArea);
          textArea.style.height = textArea.scrollHeight + "px";
        }
      });
    }
  }

  function userMenuBehaviour() {
    let userMenu = document.getElementById('block-trx-account-menu');
    let menuItems = userMenu.querySelectorAll('.menu-item');

    for (let i = 0; i < menuItems.length; i++) {
      let   menuItem = menuItems[i].querySelector('a');
      ['mouseover', 'focus'].map(function(event) {
        menuItem.addEventListener(event, function() {
          menuItem.classList.add('menu-item-visible');
        })
      });
      ['mouseout', 'focusout'].map(function(event) {
        menuItem.addEventListener(event, function() {
          menuItem.classList.remove('menu-item-visible');
        })
      })
    }
  }

  /******** Load Login Block **********
   ******** append to document ********
   ******** Hover in middle of screen */
  function loginModal() {

    $.ajax({
      type: 'GET',
      url: '/user/modal/login',
      success: function (response) {
        console.dir(response);
        let mainContainer = document.getElementById('main');
        let loginBlock = document.getElementById('trx-login-block');
        if (loginBlock === null) {
          loginBlock = document.createElement('div');
          loginBlock.innerHTML = response;
          loginBlock.className = 'trx-login-block';
          loginBlock.id = 'trx-login-block';
          let closeBtn = document.createElement('div');
          closeBtn.className = 'trx-login-block-close';
          closeBtn.innerHTML = '✖';
          loginBlock.appendChild(closeBtn);
        }

        closeBtn = loginBlock.querySelector('.trx-login-block-close');
        mainContainer.appendChild(loginBlock);
        closeBtn.addEventListener('click', function() {
          // loginBlock.innerHTML = '';
          if (loginBlock !== null && loginBlock.parentNode !== null) {
            loginBlock.parentNode.removeChild(loginBlock);
            loginBlock = null;
          }
        });
        Drupal.attachBehaviors()
      }
    });
  }

  drupalSettings.filterMode = false;
  Drupal.behaviors.custom= {
    attach: function (context, settings) {

      if (context === document) {
        streamHashtagListeners();

        drupalSettings.contentWidth = document.getElementById('content').clientWidth;
        // streamUsernameListeners();

        if (drupalSettings.path.isFront) {
          // trxfilterListeners();
          // listenNav();
        }
      }

      if (drupalSettings.admin) {
        //Header offset behaviour to account for top menu
        if (window.innerWidth < 415) {
          let header = document.getElementById('header');
          $(window).scroll(function () {
            if ($(window).scrollTop() >= 39) {
              header.style.top = 0;
              console.log('greater');
            } else {
              console.log('less');
              header.style.top = 0.75 * (39 - $(window).scrollTop()) + 'px';
            }
          });
        }
      }
      //Laundry list of listeners
      flagToolListen();
      userPagePrintName();
      listenReplyButtons();
      listenReplyLinks();
      listenVideos();
      textareaAutoHeight();
      userMenuBehaviour();
      hideCommentForms();
      streamUsernameListeners();
      addFriendListeners();
      listenGraph();
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      window.addEventListener('scroll', checkScroll, false);
      window.addEventListener('resize', checkScroll, false);
    }
  };

  $(document).ready(function() {
    //Filter is always on page "1" (0) on page load
    drupalSettings.filterPage = 0;
    drupalSettings.filterPageEnd = false;
  });
})(jQuery, Drupal, drupalSettings);
