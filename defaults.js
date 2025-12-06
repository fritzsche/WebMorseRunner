export const exchangeId = {
  nr: 'nr',
  rst: 'rst',
  exchange1: 'exchange1'
}


export const AudioMessage = {
  request_dx: 'request_dx',
  request_qrm: 'request_qrm',
  send_msg: 'send_msg',
  send_his: 'send_his',
  send_text: 'send_text',
  abort_sending: 'step_sending',
  send_exchange: 'send_exchange',
  qso_to_check_log: 'check_log',
  update_nr: 'update_nr',
  create_dx: 'create_dx',
  create_qrm: 'create_qrm',
  check_log: 'check_log',
  advance: 'advance',
  start_contest: 'start_contest',
  stop_contest: 'stop_contest',
  config: 'config',
  update_pileup: 'update_pileup',
  update_call: 'update_call',
  start_tx: 'start_tx',
  stop_tx: 'stop_tx',
}

export const StationMessage = {
  None: 'None',
  Exchange1: 'Exchange1',
  CQ: 'CQ',
  NR: 'NR',
  TU: 'TU',
  MyCall: 'MyCall',
  HisCall: 'HisCall',
  B4: 'B4',
  Qm: 'Qm',
  Nil: 'Nil',
  Garbage: 'Garbage',
  R_NR: 'R_NR',
  R_NR2: 'R_NR2',
  DeMyCall1: 'DeMyCall1',
  DeMyCall2: 'DeMyCall2',
  DeMyCallNr1: 'DeMyCallNr1',
  DeMyCallNr2: 'DeMyCallNr2',
  NrQm: 'NrQm',
  LongCQ: 'LongCQ',
  MyCallNr2: 'MyCallNr2',
  Qrl: 'Qrl',
  Qrl2: 'Qrl2',
  Qsy: 'Qsy',
  Agn: 'Agn',
  MyExchange: 'MyExchange',
}

export const OperatorState = {
  NeedPrevEnd: 0,
  NeedQso: 1,
  NeedNr: 2,
  NeedCall: 3,
  NeedCallNr: 4,
  NeedEnd: 5,
  Done: 6,
  Failed: 7
}

export const RunMode = {
  Stop: 0,
  Pileup: 1,
  Single: 2,
  Wpx: 3,
  Hst: 4
}

export class DEFAULT {
  static RATE = 11025
  static BUFSIZE = 512
  static PASSES = 3
  static BANDWIDTH = 300
  static PITCH = 500
  static RUNMODE = RunMode.Single
  static CALL = 'DJ1TF'
  static WPM = 20
  static RIT = 0
  static ACTIVITY = 2
  static QRN = false
  static QSB = false
  static FLUTTER = false
  static QRM = false
  static LIDS = false
}