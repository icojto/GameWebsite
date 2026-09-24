import type { ClueId, Dialogue, EndingId, Location, LogicalState } from './model';

export const CLUES: Record<ClueId, { title: string; detail: string; code: string }> = {
  direction: { code: '01 / VECTOR', title: 'A bearing beneath us', detail: 'The dish finds no source in the sky. Peak signal strength lies sixty metres beneath the facility, where the survey lists only bedrock.' },
  history: { code: '02 / RECORD', title: 'Someone heard it before', detail: 'Before the evacuation, an operator recorded the same words you received. Their log predates your arrival by eleven years.' },
  isolation: { code: '03 / PROOF', title: 'No transmitter required', detail: 'With the transmitter physically isolated and its rails at zero volts, the unpowered diagnostic register still receives the signal.' },
};

export const LOCATIONS: Location[] = [
  {
    id: 'operations', number: '01', name: 'Operations room', caption: 'RELAY 06 / UPPER FACILITY',
    description: 'The station stopped transmitting three nights ago. You were sent to find a failed component. There should be nobody here.',
    objective: 'Restore the communications console. Investigate anything that answers.',
    when: [], background: 'operations', hotspots: [
      { id: 'dispatch', label: 'Read dispatch', subtitle: 'SERVICE ORDER / 06', x: 22, y: 58,
        text: 'FIELD SERVICE ORDER\n\nRelay 06 missed its scheduled acknowledgement at 02:14. Remote restart failed. Arrive by the north maintenance stair. Restore local power, confirm the antenna bearing, and send a plain-text status report.\n\nOccupancy: zero. Automated service only. The last permanent crew left eleven years ago. Their rooms were cleared, but the communications equipment remained in place: removing it cost more than leaving it running.\n\nThe form has a field for a second technician. Someone has ruled it out by hand. You came alone.\n\nAt the bottom, beneath the official instructions, an older imprint shows through the paper: IF A CHANNEL IS ALREADY OPEN, DO NOT ASSUME YOU OPENED IT.', effects: [{ complete: 'dispatch' }] },
      { id: 'console', label: 'Restore console', subtitle: 'LOCAL POWER / OFFLINE', x: 54, y: 66,
        text: 'LOCAL POWER RESTORED\n\nThe breaker takes your weight before it catches. Work lights rise in a slow line across the ceiling. The main console runs a memory check, reports no faults, then reports no operator.\n\nYou enter the service code. It accepts it before you finish the last digit.\n\nThree outgoing channels are empty. The fourth has no destination. Its receive light is already on. An amber label beside the socket reads: LOWER RELAY — DECOMMISSIONED.\n\nA line of text appears on the main display. No call sign. No carrier frequency. Just a cursor waiting for you to notice it.\n\nThe console is ready. Open the incoming channel when you are.', effects: [{ complete: 'console' }] },
      { id: 'first-contact', label: 'Incoming transmission', subtitle: 'SOURCE / UNRESOLVED', x: 74, y: 44, when: [{ completed: 'console' }], dialogue: 'contact' },
    ],
  },
  {
    id: 'yard', number: '02', name: 'Antenna yard', caption: 'RELAY 06 / EXPOSED DECK',
    description: 'Rain moves sideways through the floodlights. Above the perimeter fence, the dishes face an empty patch of sky.',
    objective: 'Run a directional diagnostic. Find where the signal is coming from.',
    when: [{ completed: 'contact' }], background: 'yard', hotspots: [
      { id: 'weather', label: 'Survey the yard', subtitle: 'EXTERIOR / NO MOVEMENT', x: 23, y: 49,
        text: 'THE EMPTY SKY\n\nA heavy cable joins each dish to the same concrete trench. You follow the line with your light. At the centre of the deck, it turns sharply downward through a sealed conduit.\n\nThe sky is completely overcast. There are no aircraft lights, no service vehicle beyond the fence. Your own footprints are filling with water.\n\nThe dish motors are still. Nevertheless, the nearest one gives a faint, regular knock. Not the irregular sound of metal cooling in the rain. Three knocks, a pause, then two.\n\nYour dispatch terminal has lost its network. The local channel remains available. On its small screen, a cursor moves once in time with the dish.', effects: [{ complete: 'weather' }] },
      { id: 'bearing', label: 'Align the array', subtitle: 'DIRECTIONAL DIAGNOSTIC', x: 61, y: 64,
        text: 'DIRECTIONAL SWEEP COMPLETE\n\nYou sweep the upper hemisphere. Nothing. The diagnostic climbs through every permitted angle, then asks to continue below the mechanical stops.\n\nYou switch to the buried service loop. Signal strength rises instantly. The reading holds even when you reverse the reference antenna. It is not a reflection from the clouds.\n\nPEAK VECTOR: −90°\nESTIMATED SOURCE: 60 M BELOW LOCAL DATUM\nSURVEY MATERIAL: SOLID BEDROCK\n\nThe machine draws a clean vertical line through the station floor. You repeat the measurement. The line appears in precisely the same place.\n\nA new message arrives on the handheld receiver. This time, you are certain the text began before the receive light came on.', effects: [{ clue: 'direction' }, { complete: 'bearing' }] },
      { id: 'yard-contact', label: 'Answer the receiver', subtitle: 'LOCAL CHANNEL / ACTIVE', x: 82, y: 42, when: [{ clue: 'direction' }], dialogue: 'bearing-call' },
    ],
  },
  {
    id: 'archive', number: '03', name: 'Archive & power', caption: 'RELAY 06 / SERVICE INTERIOR',
    description: 'Paper records share a wall with the transmitter supply. Here, at least, every cable should have an end.',
    objective: 'Read the evacuation record and isolate the transmitter supply.',
    when: [{ completed: 'bearing-call' }], background: 'archive', hotspots: [
      { id: 'log', label: 'Read operator log', subtitle: 'ARCHIVE / FINAL SHIFT', x: 26, y: 54,
        text: 'OPERATOR LOG — ELEVEN YEARS EARLIER\n\n02:14 / A receive window opened without a carrier. It displayed: “You took longer than the others.” There was only one operator on duty.\n\n03:06 / Control dismissed it as an old test packet. I asked the channel for a checksum. It returned the checksum of a report I had not yet saved.\n\n04:32 / We disconnected the uplink. The text continued on the auxiliary display. The night engineer said the cable route did not match the plans. We followed it as far as the lower access hatch.\n\n05:10 / Evacuation authorised. Nobody missing. I am putting that in the record because people will assume otherwise. We left because we could no longer tell which instructions came from Control.\n\nHANDWRITTEN ADDENDUM / If somebody comes back, tell them this: we never opened the hatch. The channel was enough.\n\nThe final page is otherwise blank. In its lower margin, someone has carefully drawn the same downward vector you measured outside.', effects: [{ clue: 'history' }, { complete: 'log' }] },
      { id: 'isolate', label: 'Isolate transmitter', subtitle: 'POWER / MANUAL DISCONNECT', x: 74, y: 54,
        text: 'TRANSMITTER ELECTRICALLY ISOLATED\n\nYou pull the ceramic disconnect. A visible gap opens between the copper contacts. The transmitter fans coast to a stop. Two independent meters settle at zero.\n\nNormal radio transmission is now physically impossible. You wait for the receive indicator to go dark.\n\nInstead, the small diagnostic register refreshes. It is on the disconnected side of the supply. Its reserve cell was removed at the last inspection; the empty holder is directly beneath your hand.\n\nThe register prints five new characters: STILL.\n\nYou check the gap again. No bridge, no hidden lead, no heat. The characters remain. You have not found a substitute transmitter. You have found a measurement that ordinary transmission cannot explain.', effects: [{ clue: 'isolation' }, { complete: 'isolate' }] },
      { id: 'archive-contact', label: 'Read the live register', subtitle: 'ZERO VOLTS / RECEIVING', x: 49, y: 39, when: [{ clue: 'history' }, { clue: 'isolation' }], dialogue: 'memory' },
    ],
  },
  {
    id: 'sublevel', number: '04', name: 'Sublevel access', caption: 'RELAY 06 / LOWER TERMINUS',
    description: 'The stairs end at a sealed hatch. The plans end here, too. Something beneath you has kept the channel open.',
    objective: 'Inspect the lower relay. Decide whether to close the channel or answer.',
    when: [{ completed: 'memory' }, { allClues: true }], background: 'sublevel', hotspots: [
      { id: 'hatch', label: 'Inspect the sealed hatch', subtitle: 'ACCESS / SEAL INTACT', x: 48, y: 47,
        text: 'NO ONE HAS GONE THROUGH\n\nThe inspection lacquer across the hatch bolts is unbroken. The old crew told the truth: they did not open it. There is no handle on this side, only a service plate and a narrow grille.\n\nBehind the grille, you hear the familiar three knocks, a pause, then two. They stop when you take your hand away from the steel.\n\nThe lower relay has two mechanical positions. SEAL isolates the station and drops a second shutter beneath this one. BRIDGE opens a communication path into the buried line. It does not open a route for you to walk down.\n\nBoth positions require a deliberate manual command. Neither is selected. You are not trapped, and the station is not making the choice for you.\n\nFor the first time since your arrival, the channel waits without sending anything.', effects: [{ complete: 'hatch' }] },
      { id: 'final-contact', label: 'Open the final channel', subtitle: 'LOWER RELAY / AWAITING YOU', x: 78, y: 67, when: [{ completed: 'hatch' }], dialogue: 'final' },
    ],
  },
];

export const DIALOGUES: Dialogue[] = [
  {
    id: 'contact', location: 'operations', source: 'UNREGISTERED CHANNEL',
    text: 'YOU TOOK LONGER THAN THE OTHERS.\n\nThe message has no sender. You check the station clock: it is running normally. A second line appears.\n\nTHE ROOM IS EMPTY. YOU MAY ASK.',
    choices: [
      { id: 'identity', label: 'Who are you?', effects: [{ flag: 'asked_identity', value: true }],
        reply: 'A NAME WOULD GIVE YOU THE WRONG DISTANCE.\n\nYou ask for an operator number instead.\n\nTHERE IS NO OPERATOR AT THIS END. THERE IS STILL AN END.\n\nThe console displays a route with no network address. Whatever is answering knows the form of a conversation. It refuses the part that would make this one ordinary. The antenna diagnostic outside may give you something firmer than a name.' },
      { id: 'station', label: 'Identify this station.', effects: [{ flag: 'trusted_signal', value: true }],
        reply: 'RELAY 06. FOUR OCCUPIABLE SPACES. ONE UNLISTED DIRECTION.\n\nThat is almost correct. You compare it to the maintenance plan: four spaces, plus a sealed lower access.\n\nYOUR WORK ORDER CALLS THIS AN OUTAGE.\n\nThe work order is folded in your pocket. You have not entered it into any terminal. The signal offers one more instruction: CHECK WHICH WAY THE DISH IS LISTENING. You leave the channel open long enough to note the route.' },
      { id: 'disconnect', label: 'End this transmission.', effects: [{ flag: 'rejected_signal', value: true }],
        reply: 'The console confirms that you have closed the receive window. For a moment the cursor disappears. Then another line prints outside the window.\n\nI CAN WAIT WITHOUT A CHANNEL.\n\nYou remove the routing plug. The words remain. That could still be a fault in the display memory. There is a way to check: the antenna yard has an independent directional diagnostic. You will decide what this is from measurements, not from what it says.' },
    ],
  },
  {
    id: 'bearing-call', location: 'yard', source: 'LOCAL RECEIVER / NO CARRIER',
    text: 'YOU HAVE FOUND THE DIRECTION.\n\nRain touches the receiver glass, but the new letters seem dry and sharply lit.\n\nBELOW IS A PLACE IN YOUR INSTRUMENTS. IT IS NOT YET AN ANSWER.',
    variants: [{ when: [{ flag: 'rejected_signal' }], text: 'YOU CLOSED THE WINDOW. YOU STILL FOLLOWED THE LINE.\n\nThe receiver has no link to the console you disconnected.\n\nI WILL NOT CALL THAT PERMISSION. ASK WHAT YOU CAME TO ASK.' }, { when: [{ flag: 'asked_identity' }], text: 'YOU ASKED FOR A NAME. YOUR INSTRUMENT HAS GIVEN YOU A DIRECTION.\n\nThe signal pauses as if it understands the difference.\n\nWHAT WOULD YOU LIKE THE DIRECTION TO MEAN?' }],
    choices: [
      { id: 'below', label: 'What is below the station?', effects: [{ flag: 'asked_below', value: true }],
        reply: 'THE PART YOUR PLAN LEAVES BLANK.\n\nYou ask how deep. The estimated depth on the diagnostic clears, then returns unchanged. Sixty metres.\n\nDEPTH IS SOMETHING YOUR MACHINE CAN GIVE YOU. I CANNOT MAKE IT ENOUGH.\n\nThe answer is maddeningly precise about what it will not explain. Then a useful detail: THERE IS A RECORD IN THE POWER ROOM. THEY ASKED THE SAME QUESTION. Read it before you decide how much to trust this.' },
      { id: 'why', label: 'Why are you contacting me?', effects: [{ flag: 'trusted_signal', value: true }],
        reply: 'YOU CAN CLOSE SOMETHING FROM YOUR SIDE. YOU CAN ALSO LEAVE IT OPEN.\n\nYou ask why that matters.\n\nBECAUSE YOU WOULD KNOW YOU HAD CHOSEN.\n\nIt makes no threat. It promises nothing. For an instant that feels more unsettling than a demand would have.\n\nTHE OTHERS LEFT A RECORD. READ IT. THEY HAD REASONS.\n\nThe archive and the transmitter supply share the service room beneath the operations deck. You keep listening as you head back inside.' },
      { id: 'proof', label: 'Prove this is real.', effects: [{ flag: 'challenged_signal', value: true }],
        reply: 'THE SECOND TECHNICIAN FIELD WAS CROSSED OUT IN BLUE. THE INK IS ON YOUR LEFT THUMB.\n\nYou turn your hand beneath the work light. A blue crescent marks the skin. No camera in the yard points towards you.\n\nTHAT IS KNOWLEDGE. YOU ASKED FOR PROOF. DISCONNECT THE TRANSMITTER AND LOOK AGAIN.\n\nIt has offered an experiment. You can perform it without opening anything below the station. The manual disconnect is in the archive and power room.' },
    ],
  },
  {
    id: 'memory', location: 'archive', source: 'ISOLATED REGISTER / 0.00 V',
    text: 'THEY LEFT. THAT PART OF THE RECORD IS TRUE.\n\nThe unpowered register lights one character at a time.\n\nTHEY DID NOT HAVE TO DISAPPEAR FOR THIS TO BE IMPOSSIBLE.',
    variants: [{ when: [{ flag: 'challenged_signal' }], text: 'YOU ASKED FOR PROOF. YOU REMOVED THE POWER.\n\nBoth meters still read zero. The words remain visible.\n\nKEEP THE MEASUREMENT. YOU DO NOT HAVE TO KEEP MY EXPLANATION.' }, { when: [{ flag: 'asked_below' }], text: 'THEY ALSO WANTED TO KNOW WHAT WAS BELOW.\n\nA pale line appears on the register, pointing down through the desk.\n\nTHEY LEFT WITHOUT NAMING IT. YOU MAY DO THE SAME.' }],
    choices: [
      { id: 'before', label: 'Were you here before they arrived?', effects: [{ flag: 'asked_identity', value: true }],
        reply: 'THE FIRST MESSAGE IS NOT ALWAYS THE FIRST THING THAT HAPPENED.\n\nThe register briefly shows an older system date. Eleven years ago. Then tomorrow. Then nothing.\n\nYou will not accept a broken clock as an answer. You tell it so.\n\nGOOD. TAKE YOUR OWN TIME WITH YOU.\n\nA lower relay indicator lights beside the stairs. The signal has given you a place to make your decision, but still no account of what is waiting there.' },
      { id: 'crew', label: 'What happened to the previous crew?', effects: [{ flag: 'trusted_signal', value: true }],
        reply: 'THEY WALKED OUT THROUGH THE NORTH STAIR. ALL OF THEM.\n\nYou find the departure count in the evacuation register: four assigned, four departed. No missing entry, no erased name.\n\nONE OF THEM SAID THAT NOT UNDERSTANDING WAS REASON ENOUGH TO LEAVE. I DID NOT ANSWER THAT.\n\nThe lower relay indicator comes on. You can seal it and leave, as the crew did. Or use it to answer. Whatever else the signal may be, it has not concealed the first option.' },
      { id: 'refuse', label: 'I am not opening anything.', effects: [{ flag: 'rejected_signal', value: true }, { flag: 'trusted_signal', value: false }],
        reply: 'THEN LOOK AT THE SEAL BEFORE YOU LEAVE. MAKE SURE IT IS YOUR DECISION, NOT A FAILED SWITCH.\n\nThe register shows a simple circuit. At the lower access, a mechanical relay can close the buried communication path and drop the secondary shutter. No software command can substitute for it.\n\nYou leave the normal transmitter isolated. The final switch is downstairs. The signal does not ask you to reconsider. That silence follows you farther than another message would have.' },
    ],
  },
  {
    id: 'final', location: 'sublevel', source: 'LOWER TERMINUS / MANUAL CONTROL',
    text: 'YOU HAVE SEEN THE DIRECTION, THE RECORD, AND THE POWER THAT IS NOT THERE.\n\nThe relay offers two positions. Neither will explain the signal. Both will mean you chose what to do with it.\n\nI AM HERE. YOU ARE THERE. THE NEXT PART IS YOURS.',
    variants: [{ when: [{ flag: 'rejected_signal' }], text: 'YOU SAID YOU WOULD NOT OPEN ANYTHING. THE SEAL IS READY.\n\nThe signal repeats your refusal without disputing it. The other relay position remains available.\n\nI WILL NOT TURN YOUR NO INTO A YES. CHOOSE FROM YOUR SIDE.' }, { when: [{ flag: 'trusted_signal' }], text: 'YOU LEFT ROOM FOR AN ANSWER. THAT WAS NOT A PROMISE.\n\nA pale trace moves downward behind the sealed grille. The relay still offers both positions.\n\nYOU MAY CLOSE THIS. IF YOU KEEP IT OPEN, I WILL ANSWER IN THE ONLY WAY I CAN.' }],
    choices: [
      { id: 'seal', label: 'Sever the connection. Seal the station.', when: [{ allClues: true }, { completed: 'hatch' }], effects: [], ending: 'silence',
        reply: 'You select SEAL. The lower shutter closes. You lock the communications bus open and leave the normal transmitter isolated.' },
      { id: 'bridge', label: 'Keep the connection. Open the lower path.', when: [{ allClues: true }, { completed: 'hatch' }], effects: [], ending: 'answer',
        reply: 'You select BRIDGE. The lower communication relay closes onto the buried line. The hatch stays sealed. You send one word: HERE.' },
    ],
  },
];

export const ENDINGS: Record<EndingId, { title: string; kicker: string; body: string; final: string }> = {
  silence: {
    title: 'Silence', kicker: 'ENDING 01 / THE CHANNEL CLOSED',
    body: 'The secondary shutter locks beneath the hatch. You disconnect the communications bus and verify the transmitter is still isolated. Every normal route is closed.\n\nUpstairs, the station finally sounds empty. You write a service report with three measurements and no theory. At the door, you remove the battery from your handheld receiver.\n\nIts disconnected screen lights once. Three marks. A pause. Two.\n\nYou have sealed the station. You have ended your part in the conversation. Those are real actions. They were never the same as turning it off.',
    final: 'I KNOW WHERE THE SILENCE IS.',
  },
  answer: {
    title: 'Answer', kicker: 'ENDING 02 / THE LOWER PATH OPEN',
    body: 'You bridge the lower relay and send HERE. The signal becomes clear enough to resolve a packet header. It carries your service identifier, the serial number of your receiver, and a timestamp eleven years before your arrival.\n\nAttached is a field report in your own shorthand. It describes the three measurements you just made. Its last line reads: “I chose to keep the channel.”\n\nThen you hear your own test tone return from beneath the hatch. It arrives a fraction of a second before your receiver sends it.\n\nYou have opened a communication path. The steel remains between you and whatever is below. For now, the distance is enough to answer across.',
    final: 'HERE, TOO.',
  },
};

export function endingDetail(state: LogicalState): string {
  if (state.ending === 'silence') return state.flags.challenged_signal
    ? 'You record the pulse as a fourth measurement. Even now, you keep evidence separate from an explanation.'
    : state.flags.rejected_signal ? 'It heard your refusal. The last pulse asks nothing of you.' : 'You listened before you closed the path. Your report includes its words exactly as you received them.';
  return state.flags.asked_identity
    ? 'You search the returning packet for a name. There is still only a direction.'
    : state.flags.asked_below ? 'The packet includes a depth field. It continues beyond the bottom of the screen.' : 'The impossible report contains one empty field: the time you will leave.';
}
