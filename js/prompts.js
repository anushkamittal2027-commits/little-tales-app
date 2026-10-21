// A little question for every day, for when you want to keep a moment but don't know what to say.
// It changes each day (the same one for everybody on the same date) and can be shuffled.
const PROMPTS = [
  'What made you smile today?', 'What is the smallest good thing that happened today?', 'What did you eat that was worth remembering?',
  'Who did you talk to today that you enjoyed?', 'What did the light look like today?', 'What sound will you remember from today?',
  'What is something you noticed that nobody else did?', 'What did you finish today, even if it was tiny?', 'What made you laugh out loud?',
  'What is on your table, desk or window right now?', 'What are you looking forward to this week?', 'Whose kindness did you feel today?',
  'What did you learn today?', 'What was the best bite of your day?', 'What smell took you somewhere today?',
  'Where did you feel most like yourself today?', 'What would you tell yourself this morning, knowing what you know now?', 'What is something you are grateful for right now?',
  'What did you see on the way today?', 'What song is stuck in your head?', 'What made today different from yesterday?',
  'What is a small thing you did for yourself today?', 'What did you wear that made you feel good?', 'Who do you wish had been here today?',
  'What is the weather doing, and how does it feel?', 'What did you do with your hands today?', 'What was the quietest moment of your day?',
  'What are you proud of this week?', 'What did you let go of today?', 'What made you pause today?',
  'What does home feel like right now?', 'What is something you want to remember about this age?', 'What is the colour of today?',
  'What did you cook, order or sip today?', 'What is a tiny adventure you had today?', 'What would make tomorrow a little better?',
  'What did someone say that stayed with you?', 'What did you see that was beautiful?', 'What made you feel calm today?',
  'What is a habit you are glad you kept today?', 'What did you walk past that deserves a photo?', 'Which moment today would you replay?',
  'What was the funniest thing you saw or heard?', 'What did you create or fix today?', 'Where did you rest today?',
  'What is something small that went right?', 'What did you celebrate today, quietly or loudly?', 'What is your favourite thing in this room?',
  'What did you notice about the sky?', 'Who made your day easier?', 'What new thing did you try?',
  'What are you carrying with you from today?', 'What was the best part of your commute or walk?', 'What did you share with someone today?',
  'What made you feel brave today?', 'What does your evening look like right now?', 'What is a small joy you almost missed?',
  'What did you do just because you wanted to?', 'What made your morning?', 'What is a place you passed that you love?',
  'What is something that is only true of this time in your life?', 'What did you hear that made you stop?', 'What gave you energy today?',
  'What did you forget to worry about?', 'Which little thing today felt like a gift?', 'What does a perfect ordinary day look like, and was today close?',
  'What made you feel at ease?', 'What did you look at for longer than usual?', 'Who would you send this moment to?',
  'What would you want to remember a year from now?', 'What was today’s best surprise?', 'What did you enjoy more than you expected?',
  'What did you do slowly today?', 'What are you reading, watching or listening to?', 'What flower, tree or plant did you notice?',
  'What did the day taste like?', 'What is one thing you did well today?', 'What tiny ritual did you keep today?',
  'What did you tidy, plan or begin?', 'Which part of today was truly yours?', 'What made someone else smile because of you?',
  'What did your feet take you past today?', 'What is the nicest thing in your bag or pocket?', 'What is the story behind what you are holding?',
  'What made you feel nostalgic today?', 'What made you feel hopeful today?', 'What did you dream about last night?',
  'What did you wish you had a photo of earlier?', 'What do you want to say to today before it ends?', 'What was the kindest thing you thought today?',
];
const hash = (s) => { let n = 7; for (const c of String(s)) n = (n * 31 + c.charCodeAt(0)) >>> 0; return n; };
// shuffle = 0 is today's prompt; higher numbers give other prompts for the same day
export const promptFor = (dateStr, shuffle = 0) => PROMPTS[(hash(dateStr) + shuffle * 17) % PROMPTS.length];
export const PROMPT_COUNT = PROMPTS.length;
