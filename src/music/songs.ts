/**
 * 背景音乐的曲谱（都是公共领域的传统圣诞歌）。
 * melody：「音名:拍数」，R 是休止；chords：每小节一个和弦，用来弹低音伴奏。
 * pickup：开头的弱起拍数（不占小节）。
 */
export interface Song {
  title: string;
  bpm: number;
  beatsPerBar: number;
  pickup?: number;
  melody: string;
  chords: string;
}

const twice = (s: string) => `${s} ${s}`;

// ---------- Jingle Bells（G 大调）----------
const jbVerse = `
  D4:1 B4:1 A4:1 G4:1 | D4:3 D4:.5 D4:.5 | D4:1 B4:1 A4:1 G4:1 | E4:4 |
  E4:1 C5:1 B4:1 A4:1 | F#4:4 | D5:1 D5:1 C5:1 A4:1 | B4:4 |
  D4:1 B4:1 A4:1 G4:1 | D4:4 | D4:1 B4:1 A4:1 G4:1 | E4:3 E4:1 |
  E4:1 C5:1 B4:1 A4:1 | D5:1 D5:1 D5:1 D5:1 | E5:1 D5:1 C5:1 A4:1 | G4:2 D5:2 |`;
const jbLine = `B4:1 B4:1 B4:2 | B4:1 B4:1 B4:2 | B4:1 D5:1 G4:1.5 A4:.5 | B4:4 |
  C5:1 C5:1 C5:1.5 C5:.5 | C5:1 B4:1 B4:1 B4:.5 B4:.5 |`;
const jbChorus = `${jbLine} B4:1 A4:1 A4:1 B4:1 | A4:2 D5:2 |
  ${jbLine} D5:1 D5:1 C5:1 A4:1 | G4:4 |`;

// ---------- We Wish You a Merry Christmas（G 大调，3/4）----------
const wwLine = `G4:1 G4:.5 A4:.5 G4:.5 F#4:.5 | E4:1 E4:1 E4:1 | A4:1 A4:.5 B4:.5 A4:.5 G4:.5 | F#4:1 D4:1 D4:1 |
  B4:1 B4:.5 C5:.5 B4:.5 A4:.5 | G4:1 E4:1 D4:.5 D4:.5 | E4:1 A4:1 F#4:1 |`;

export const SONGS: Song[] = [
  {
    title: 'Jingle Bells',
    bpm: 168,
    beatsPerBar: 4,
    melody: `${jbVerse} ${jbChorus}`,
    chords: 'G G G C Am D D G G G G C Am D D G  G G G G C G A D G G G G C G D G',
  },
  {
    title: 'We Wish You a Merry Christmas',
    bpm: 138,
    beatsPerBar: 3,
    pickup: 1,
    melody: `D4:1 | ${wwLine} G4:2 D4:1 | ${wwLine} G4:3 |`,
    chords: twice('G C A D Em C D G'),
  },
  {
    title: 'Silent Night',
    bpm: 96,
    beatsPerBar: 3,
    melody: `
      G4:1.5 A4:.5 G4:1 | E4:3 | G4:1.5 A4:.5 G4:1 | E4:3 | D5:2 D5:1 | B4:3 | C5:2 C5:1 | G4:3 |
      A4:2 A4:1 | C5:1.5 B4:.5 A4:1 | G4:1.5 A4:.5 G4:1 | E4:3 | A4:2 A4:1 | C5:1.5 B4:.5 A4:1 | G4:1.5 A4:.5 G4:1 | E4:3 |
      D5:2 D5:1 | F5:1.5 D5:.5 B4:1 | C5:3 | E5:3 | C5:1 G4:1 E4:1 | G4:1.5 F4:.5 D4:1 | C4:3 | R:3 |`,
    chords: 'C C C C G G C C F F C C F F C C G G C C C G C C',
  },
  {
    title: 'Deck the Halls',
    bpm: 132,
    beatsPerBar: 4,
    melody: `${twice(`C5:1.5 Bb4:.5 A4:1 G4:1 | F4:1 G4:1 A4:1 F4:1 | G4:.5 A4:.5 Bb4:.5 G4:.5 A4:1.5 G4:.5 | F4:1 E4:1 F4:2 |`)}
      G4:1.5 A4:.5 Bb4:1 G4:1 | A4:1.5 Bb4:.5 C5:1 G4:1 | A4:.5 B4:.5 C5:1 D5:.5 E5:.5 F5:1 | E5:1 D5:1 C5:2 |
      C5:1.5 Bb4:.5 A4:1 G4:1 | F4:1 G4:1 A4:1 F4:1 | G4:.5 A4:.5 Bb4:.5 G4:.5 A4:1.5 G4:.5 | F4:1 E4:1 F4:2 |`,
    chords: 'F F C F F F C F C F G C F F C F',
  },
];
