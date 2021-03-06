'use strict'

/* global alertsData */

import $ from 'jquery'
import _ from 'lodash'
import io from 'socket.io-client'
import Alerts from './components/alerts.js'
import 'jquery-smooth-scroll'
import 'jquery-sticky'

$(() => {
  // ====================================
  // Scroll
  // ====================================

  $('a').smoothScroll({
    speed: 500,
    offset: -50
  })

  $('.stickyscroll').sticky({ topSpacing: 15, bottomSpacing: 75 })

  // ====================================
  // Notifications
  // ====================================

  $(window).bind('beforeunload', () => {
    $('#notifload').addClass('active')
  })
  $(document).ajaxSend(() => {
    $('#notifload').addClass('active')
  }).ajaxComplete(() => {
    $('#notifload').removeClass('active')
  })

  var alerts = new Alerts()
  if (alertsData) {
    _.forEach(alertsData, (alertRow) => {
      alerts.push(alertRow)
    })
  }

  // ====================================
  // Establish WebSocket connection
  // ====================================

  var socket = io(window.location.origin)

  require('./components/search.js')(socket)

  // ====================================
  // Pages logic
  // ====================================

  require('./pages/view.js')(alerts)
  require('./pages/all.js')(alerts, socket)
  require('./pages/create.js')(alerts, socket)
  require('./pages/edit.js')(alerts, socket)
  require('./pages/source.js')(alerts)
  require('./pages/history.js')(alerts)
  require('./pages/admin.js')(alerts)
})
