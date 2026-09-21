// app: Εφαρμογή του event
// direction: Κατεύθυνση μηνύματος (in/out)
// event: Όνομα που χρησιμοποιείται στο WebSocket
// description: Περιγραφή του event (για τον προγραμματιστή)

const COMM_EVENT_CATALOG = Object.freeze([
  { app: 'socket', direction: 'in', event: 'socket:connect', description: 'WebSocket transport connected to server.' },
  { app: 'socket', direction: 'in', event: 'socket:disconnect', description: 'WebSocket transport disconnected from server.' },

  { app: 'geometry', direction: 'in', event: 'user-position', description: 'Client sends position update to server.' },
  { app: 'geometry', direction: 'in', event: 'camera-frame', description: 'Client sends camera frame to server for detection.' },
  { app: 'geometry', direction: 'in', event: 'camera-speed-frame', description: 'Client sends benchmark frame for camera speed test.' },
  { app: 'geometry', direction: 'in', event: 'activity-update', description: 'Teacher updates geometry activity on server.' },
  { app: 'geometry', direction: 'out', event: 'users-update', description: 'Server broadcasts active geometry points/users.' },
  { app: 'geometry', direction: 'out', event: 'camera-points', description: 'Server replies with detected camera points.' },
  { app: 'geometry', direction: 'out', event: 'camera-speed-result', description: 'Server replies with benchmark tracking frame and latency metrics.' },
  { app: 'geometry', direction: 'out', event: 'activity-loaded', description: 'Server pushes geometry activity snapshot.' },

  { app: 'fourier', direction: 'in', event: 'fourier:join', description: 'Teacher/student join classroom room.' },
  { app: 'fourier', direction: 'in', event: 'fourier:request-state', description: 'Client requests full classroom snapshot.' },
  { app: 'fourier', direction: 'in', event: 'fourier:set-slide', description: 'Teacher sets active slide for classroom.' },
  { app: 'fourier', direction: 'in', event: 'fourier:interaction', description: 'Student interaction telemetry from activity controls.' },
  { app: 'fourier', direction: 'in', event: 'fourier:sound-control', description: 'Student sound sliders (frequency/amplitude) to server.' },
  { app: 'fourier', direction: 'in', event: 'fourier:heat-control', description: 'Student/teacher heat sliders (position/temperature) to server.' },
  { app: 'fourier', direction: 'in', event: 'fourier:heat-time-control', description: 'Teacher heat time slider updates for section 3.5.' },
  { app: 'fourier', direction: 'in', event: 'fourier:fft-duel-start', description: 'Teacher starts competitive FFT duel round.' },
  { app: 'fourier', direction: 'in', event: 'fourier:fft-duel-reveal', description: 'Teacher reveals submitted FFT duel guesses and errors.' },
  { app: 'fourier', direction: 'in', event: 'fourier:fft-duel-probe', description: 'Student updates current probe frequency for FFT duel.' },
  { app: 'fourier', direction: 'in', event: 'fourier:fft-duel-submit', description: 'Student submits and locks FFT duel guess.' },
  { app: 'fourier', direction: 'in', event: 'fourier:ocean-random-pack', description: 'Student submits a random frequency pack for section 6.3.' },
  { app: 'fourier', direction: 'in', event: 'fourier:ocean-random-clear', description: 'Teacher clears classroom random frequency packs.' },
  { app: 'fourier', direction: 'in', event: 'fourier:wave-sum-update', description: 'Student updates their frequency slider for section 2.3.' },
  { app: 'fourier', direction: 'out', event: 'fourier:state', description: 'Server sends full initial/rehydration state.' },
  { app: 'fourier', direction: 'out', event: 'fourier:slide', description: 'Server broadcasts active slide state.' },
  { app: 'fourier', direction: 'out', event: 'fourier:participants', description: 'Server broadcasts participant roster counts/details.' },
  { app: 'fourier', direction: 'out', event: 'fourier:summary', description: 'Server broadcasts aggregate summary metrics.' },
  { app: 'fourier', direction: 'out', event: 'fourier:activity-event', description: 'Server broadcasts single interaction feed event.' },
  { app: 'fourier', direction: 'out', event: 'fourier:sound-state', description: 'Server broadcasts all current student sound states.' },
  { app: 'fourier', direction: 'out', event: 'fourier:heat-state', description: 'Server broadcasts all current student heat selections.' },
  { app: 'fourier', direction: 'out', event: 'fourier:heat-time-state', description: 'Server broadcasts teacher-controlled heat time value.' },
  { app: 'fourier', direction: 'out', event: 'fourier:fft-duel-state', description: 'Server sends competitive FFT duel state (viewer-aware).' },
  { app: 'fourier', direction: 'out', event: 'fourier:ocean-random-state', description: 'Server broadcasts classroom random frequency packs for section 6.3.' },
  { app: 'fourier', direction: 'out', event: 'fourier:wave-sum-state', description: 'Server broadcasts student frequency sliders for section 2.3.' },

  { app: 'buffon', direction: 'in', event: 'buffon:ws-connect', description: 'Buffon websocket connection established.' },
  { app: 'buffon', direction: 'in', event: 'buffon:ws-close', description: 'Buffon websocket connection closed.' },
  { app: 'buffon', direction: 'in', event: 'buffon:register_teacher', description: 'Teacher registers in Buffon channel.' },
  { app: 'buffon', direction: 'in', event: 'buffon:register_student', description: 'Student registers in Buffon channel.' },
  { app: 'buffon', direction: 'in', event: 'buffon:update', description: 'Student update message (drops/hits/piEst).' },
  { app: 'buffon', direction: 'in', event: 'buffon:start_round', description: 'Teacher starts a Buffon round.' },
  { app: 'buffon', direction: 'in', event: 'buffon:end_round', description: 'Teacher ends Buffon round and sends ranking.' },
  { app: 'buffon', direction: 'in', event: 'buffon:reset_tournament', description: 'Teacher resets Buffon tournament state.' },
  { app: 'buffon', direction: 'out', event: 'buffon:roster', description: 'Server sends current roster to teachers.' },
  { app: 'buffon', direction: 'out', event: 'buffon:round_start', description: 'Server pushes round start payload to students.' },
  { app: 'buffon', direction: 'out', event: 'buffon:round_end', description: 'Server pushes round end payload to students.' },
  { app: 'buffon', direction: 'out', event: 'buffon:reset_tournament', description: 'Server pushes tournament reset payload to students.' },

  { app: 'neural-lab', direction: 'in', event: 'neural-lab:ws-connect', description: 'Neural-lab websocket connection established.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:ws-close', description: 'Neural-lab websocket connection closed.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:register_teacher', description: 'Teacher registers in neural-lab channel.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:register_student', description: 'Student registers in neural-lab channel.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:student_weight', description: 'Legacy student single-weight update.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:student_weights', description: 'Student updates personal w1/w2 sliders.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:teacher_config', description: 'Teacher updates input/output configuration.' },
  { app: 'neural-lab', direction: 'out', event: 'neural-lab:canvas_state', description: 'Server pushes synchronized state to teachers/students.' }
]);

module.exports = { COMM_EVENT_CATALOG };