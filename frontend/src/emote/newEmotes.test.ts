import { newEmotesByPlayer } from "./newEmotes";

test("only emotes sent after the last one seen are shown, newest per player", () => {
  const emotes = [
    { id: 4, player: "alice", emote: "wave" },
    { id: 5, player: "bob", emote: "thumbsup" },
    { id: 6, player: "alice", emote: "salute" },
    { id: 7, player: "carol", emote: "thumbsdown" },
  ];

  expect(newEmotesByPlayer(emotes, 4)).toEqual({
    bob: { id: 5, player: "bob", emote: "thumbsup" },
    alice: { id: 6, player: "alice", emote: "salute" },
    carol: { id: 7, player: "carol", emote: "thumbsdown" },
  });
});

test("nothing is shown when no emotes are new", () => {
  expect(newEmotesByPlayer([{ id: 3, player: "bob", emote: "wave" }], 3)).toEqual({});
  expect(newEmotesByPlayer(undefined, 0)).toEqual({});
});
