// 天空之城，天空の城
const city_of_sky = {
  tempo: 90,
  tone: 'D',
  isNumber: false,
  notes: [
    // '- q', '- q', '- q', 
    '- q', 'A4 e', 'B4 e',
    'C5 qe', 'B4 e', 'C5 q', 'E5, q',
    'B4 hq', 'E4 e', 'E4 e',
    'A4 qe', 'G4 e', 'A4 q', 'C5 q',
    'G4 hq', 'E4 q',
    'F4 qe', 'E4 e', 'F4 q', 'C5 q',
    'E4 h', '- e', 'C5 e', 'C5 e', 'C5 e',
    'B4 qe', '#F4 e', 'F4 q', 'B4 q',
    'B4 h', '- q', 'A4 e', 'B4 e',
    'C5 qe', 'B4 e', 'C5 q', 'E5 q',
    'B4 hq', 'E4 e', 'E4 e',
    'A4 qe', 'G4 e', 'A4 q', 'C5 q',
    'G4 hq', 'D4 e', 'E4 e',
    'F4 q', 'C5 e', 'B4 e', 'B4 e', 'C5 e', 'C5 q',
    'D5 e', 'D5 e', 'E5 e', 'C5 e', 'C5 h',
    'C5 e', 'B4 e', 'A4 e', 'A4 e', 'B4 q', '#G4 q',
    'A4 hq', 'C5 e', 'D5 e',
    'E5 qe', 'D5 e', 'E5 q', 'G5 q',
    'D5 hq', 'G4 e', 'G4 e',
    'C5 qe', 'B4 e', 'C5 q', 'E5 q',
    'E5 w',
    'A4 e', 'B4 e', 'C5 eq', 'B4 q', 'D5 e', 'D5 e',
    'C5 qe', 'G4 e', 'G4 h',
    'F5 q', 'E5 q', 'D5 q', 'C5 q',
    'E5 hq', 'E5 q',
    'A5 h', 'G5 q', 'G5 q',
    'E5 e', 'D5 e', 'C5 h', '- e', 'C5 e',
    'D5 q', 'C5 e', 'D5 e', 'D5 q', 'G5 q',
    'E5 hq', 'E5 q',
    'A5 h', 'G5 h',
    'E5 e', 'D5 e', 'C5 h', '- e', 'C5 e',
    'D5 q', 'C5 e', 'D5 e', 'D5 q', 'B4 q',
    'A4 hq', // 'A4 e', 'B4 e'
  ]
}

// 奏之曲，つないだ手にキスを
const the_white_arks_return = {
  tempo: 60,
  tone: 'C',
  isNumber: true,
  notes: [
    // part 1
    '6+ e', '5+ e', '6+ e', '2++ e', '6+ e', '5+ e', '6+ e', '2++ e',
    '6+ e', '5+ e', '6+ e', '2++ e', '6+ e', '5+ e', '3+ e', '1+ e',
    '6+ e', '5+ e', '6+ e', '2++ e', '6+ e', '5+ e', '6+ e', '2++ e',
    '3++ q', '1++ q', '0 q', '2 e', '3 e',
    '4 q', '6 q', '5 q', '4 e', '3 e',
    '2 e', '3 e', '4 e', '3 e', '2 e', '1 e', '2 e', '0 e',
    '0 e', '6 e', '6 e', '6 e', '6 e', '0 e', '4 e', '5 e',
    '6 e', '5 e', '6 e', '1+ e', '7 e', '6 e', '6 q',
    '4 e', '6 e', '5 q', '4+ e', '3+ e', '4 e', '6 e',
    '5 q', '3 q', '3+ e', '1+ e', '2 e', '3 e',
    '4 q', '6 q', '5 q', '4 e', '3 e',
    '2 e', '3 e', '4 e', '3 e', '2 e', '1 e', '2 e', '4 e',
    '6 e', '6 e', '6 e', '6 e', '6 e', '0 e', '4 e', '5 e',
    '6 e', '5 e', '6 e', '1+ e', '7 e', '6 e', '5 e', '6 e',

    // part 2
    '4 e', '6 e', '5 q', '4+ e', '3+ e', '4 e', '6 e',
    '5 q', '1+ q', '1/5/1+ e', '4 e', '5 e', '6 e',
    { tone: 'bB' }, // 变调
    '0 e', '1+ e', '1+ e', '1+ e', '6 e', '7 e', '1+ e', '1+ e',
    '7 e', '1+ e', '7 e', '6 e', '5 e', '2 e', '5 e', '7 e',
    '6 e', '1+ e', '1+ e', '1+ e', '6 e', '7 e', '1+ e', '4+ e',
    '7 e', '1+ e', '7 e', '6 e', '5 e', '6 e', '7 e', '6 e',
    { tone: 'bA' },
    '1+ e', '1+ e', '1+ e', '1+ e', '6 e', '7 e', '1+ e', '4+ e',
    '7 e', '1+ e', '7 e', '6 e', '5 q', '5 e', '7 e',
    '6 e', '7 e', '6 hq', 
    '6 e', '7 e', '6 e', '6 qe', '2+ e', '1+ e',
    '6 e', '7 e', '1+ e', '1+ e', '7 e', '7 e', '6 q',
    { tone: 'C' },
    '3 h', 'b7- t', '1 t', '2 t', '3 t', '4 t', '5 t', '6 t', 'b7 t', '2/2+ e', '3/3+ e',
    '4/4+ q', '6/6+ q', '5/5+ e', '5/5+ e', '1+/1++ q',
    'b7/b7+ e', '6/6+ e', '5/5+ q', '6/6+ e', '3/3+ e', '2/2+ e', '3/3+ e',
    '4/4+ q', '6/6+ q', '5/5+ q', '4/4+ e', '3/3+ e',
    '4/4+ e', '3/3+ e', '2/2+ e', '5 e', '6 e', '5 e', '2/2+ e', '3/3+ e'

    // part 3
  ],
  accompany: [] // 伴奏
}

// 穿越时空的思念，時空を越えた想い
const missing_through_time_and_space = {
  tempo: 60,
  tone: 'bB',
  isNumber: true,
  notes: [
    '6+ w',
    '2+ h', '7 q', '5 q',
    '2+ h', '7 q', '5 q',
    '1+ q', '7 q', '5 q', '3 q',
    '1 q', '7- q', '5- q', '2- q',
    '2- q', '3- h', '3 e', '5 e',
    '6 q', '6 e', '1+ e', '2+ q', '3+ e', '5+ e',
    '3+ q', '2+ e', '1+ e', '6 q', '3+ e', '2+ e',
    '6 q', '3+ e', '2+ e', '6 q', '5 q',
    '3 e', '3- e', '6- e', '7- e', '1 q', '3 e', '5 e',
    '6 q', '6 e', '1+ e', '2+ q', '3+ e', '5+ e',
    '3+ q', '2+ e', '1+ e', '6 q', '3+ e', '2+ e',
    '6 q', '3+ e', '2+ e', '6 q', '5 q',
    '6 e', '3 e', '6 e', '7 e', '1+ q', '3 e', '5 e',
    '6 qe', '5 e', '6 q', '7 e', '5 e',
    '6 q', '5 e', '2 e', '3 q', '3 e', '5 e',
    '6 qe', '5 e', '6 e', '1+ e', '7 e', '5 e',
    '3 q', '1+ q', '7 q', '3 e', '5 e',
    '6 qe', '5 e', '6 q', '7 e', '5 e',
    '6 q', '5 e', '2 e', '3 q', '3 e', '2 e',
    '6- q', '3 e', '2 e', '6- q', '5- q',
    '6- e', '3- e', '6- e', '7- e', '1 q', '3+ e', '5+ e',
    '6+ qe', '5+ e', '6+ 1', '7+ e', '5+ e',
    '6+ q', '5+ e', '2+ e', '3+ q', '3+ q', '3+ e', '5+ e',
    '6+ qe', '5+ e', '6+ e', '1++ e', '7+ e', '5+ e',
    '3+ hq', '3+ e', '5+ e',
    '6+ q', '6+ e', '5+ e', '6+ q', '7+ e', '5+ e',
    '6+ q', '5+ e', '2+ e', '3+ q', '3+ e', '2+ e',
    '6 q', '3+ e', '2+ e', '6 q', '5 q',
    '6 hq', '3+ e', '2+ e', '6 q', '3+ e', '2+ e', '6 q', '5 q',
    '6 e', '3 e', '6 e', '7 e', '#1+ h',
    '3+ w',
    '3+ hq', '6 q',
    '3+ h', '2+ h',
    '2+ h', '0 h'
  ]
}

const test = {
  tempo: 60,
  tone: 'bB',
  isNumber: true,
  notes: [
    '1---/5---/1-- q', '1---/5---/1-- q', '1---/5---/1-- q',
    '1--/5--/1- q', '1--/5--/1- q', '1--/5--/1- q',
    '1-/5-/1 q', '1-/5-/1 q', '1-/5-/1 q',
    '1/5/1+ q', '1/5/1+ q', '1/5/1+ q',
    '1+/5+/1++ q', '1+/5+/1++ q', '1+/5+/1++ q',
    '1++/5++/1+++ q', '1++/5++/1+++ q', '1++/5++/1+++ q'
  ]
} 

export default {
  default: city_of_sky,
  city_of_sky,
  the_white_arks_return,
  missing_through_time_and_space,
  test
}
