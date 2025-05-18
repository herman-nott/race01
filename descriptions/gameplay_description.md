Вот обновлённое описание с учётом всех твоих дополнений — я встроил новые детали в соответствующие разделы, чтобы текст оставался цельным и логичным:

---

# Gameplay Description

## Purpose of the game

Defeat an opponent, reducing their health (HP) to 0 by placing cards on the lines and causing damage to their avatar or their cards.

---

## Playing field

The battlefield consists of three battle lines, one cell for each side:

```
   [ P1: Left ]   [ P1: Center ]   [ P1: Right ]
   [ P2: Left ]   [ P2: Center ]   [ P2: Right ]
```

Each cell can only contain one active card. New cards can only be placed in empty cells.

---

## Preparing for the game

1. Both players register and log in.
2. A general match deck is created: 20 random unique cards from the entire available base.
3. Both players receive 4 random cards per hand.
4. A virtual coin is tossed to determine the first player.
5. Health (HP) of both avatars: **30 HP**.
6. Starting mana: **3 units**.

---

## Cards

Each card has:

* Character name and image
* Attack points
* Defense points
* Draw cost (mana cost)

The maximum in hand is **4 cards**. If the hand is full, a new card is not drawn.

---

## Round Structure (Simultaneous Turns)

The game proceeds in rounds. Each round has a **time limit of 30 seconds**. Players act **simultaneously** during each phase. A round consists of the following phases:

1. **Card Draw Phase**:

   * If the player has fewer than 4 cards in hand, they draw **1 card** from the common deck.
   * If the hand is full (4 cards), no card is drawn.

2. **Mana Increase Phase**:

   * Each player gains **+1 mana** (maximum: 10).
   * Mana is required to play cards. Players can choose to **save mana** and skip placing a card to accumulate resources.

3. **Card Placement Phase**:

   * Players select which cards to play and on which of the three lines.
   * A card can be placed only if:

     * There is space on the chosen line.
     * The player has enough mana (equal to the card’s cost).
   * Players are **not required** to place a card every round.

4. **Ready Phase**:

   * Each player can mark themselves as **"Ready"**.
   * If **both players are ready**, the round proceeds immediately without waiting for the full 30-second timer.

5. **Combat Phase**:

   * Battles occur on each of the three lines **simultaneously**.
   * If both sides have cards on a line:

     * Cards deal **damage to each other at the same time**.
     * Damage = Attacker's attack - Defender's defense.
     * If a card's defense falls to **0 or below**, it is **destroyed** and removed from the field.
     * If one card is destroyed and the other survives with **excess attack**, the **remaining damage** is dealt directly to the opponent's avatar.
   * If a card is on a line and the opposing cell is empty:

     * The card deals its full **attack as damage to the opponent's avatar**.

6. **End of Round**:

   * Destroyed cards are removed from the field.
   * The next round begins.

---

## Example round

* Player 1 (P1):

  * 2 mana and cards: Jon Snow (attack 5, defense 7, cost 2), Tyrion Lannister (attack 3, defense 4, cost 1)
  * Puts Jon Snow in the center lane.

* Player 2 (P2):

  * 3 mana and a card: Robb Stark (attack 4, defense 2, cost 2)
  * Also puts Robb Stark in the center lane.

* **Battle**:

  * Jon Snow (attack 5) vs Robb Stark (attack 4):
    Robb Stark takes 5 -> -3 HP -> destroyed.
    Jon Snow survives with 3 defense left.
    Remaining excess damage (5 - 2 = **3**) is dealt to **P2 avatar**.

* Next round:

  * P1 and P2 draw only **1 card** (if < 4 in hand).
  * Mana increases by 1.
  * Players decide whether to place new cards or wait.

---

## Restrictions and rules

* Max cards in hand: **4**
* Max active cards on the field: **3 per player** (1 per line)
* Cards cannot be moved between lines
* Destroyed cards are permanently removed
* Cards can attack the opponent’s avatar if the opposing line is empty
* Mana regenerates **+1 per round**, up to 10 max
* Players can **save mana** by not placing cards

---

## Ending the game

* The game ends when a player’s **HP reaches 0**
* If both players run out of cards and neither wins, the game ends in a **draw**